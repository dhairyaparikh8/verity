// app/api/analyze/route.ts
export const runtime = 'nodejs'
export const maxDuration = 60

import { getSourceRating, calculateEvidenceWeight, type SourceRating } from '@/lib/source-ratings'

type Verdict = 'verified' | 'mixed' | 'unsupported' | 'insufficient'
type Stance = 'supports' | 'contradicts' | 'neutral'

type Article = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
}

type ClassifiedArticle = Article & {
  relevance: number
  stance: Stance
  reasoning: string
  rating: SourceRating
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const NEWS_API_KEY = process.env.NEWS_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash'
const RELEVANCE_THRESHOLD = 0.4

// ---------- helpers ----------

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return text
}

async function extractClaimFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VerityToday/1.0)' },
      redirect: 'follow',
    })
    if (!res.ok) return url
    const html = await res.text()
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const headline = stripTags(ogTitle || title || '').trim()
    const desc = stripTags(ogDesc || '').trim()
    return desc ? `${headline}. ${desc}` : headline || url
  } catch {
    return url
  }
}

/** Ask Gemini for a real search query + the core factual assertion. */
async function buildSearchQuery(claim: string): Promise<{ query: string; assertion: string }> {
  const prompt = `You are helping a fact-checking tool search the news for a claim.
Claim: "${claim}"

Return ONLY valid JSON, no markdown fences, in this exact shape:
{"query": "a short effective news search query (3-8 words) that will surface articles actually about this specific claim", "assertion": "one sentence restating the core factual assertion being made, neutrally"}`
  const raw = await callGemini(prompt)
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  return { query: parsed.query || claim, assertion: parsed.assertion || claim }
}

async function searchNews(query: string): Promise<Article[]> {
  if (!NEWS_API_KEY) throw new Error('NEWS_API_KEY is not configured')
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url =
    'https://newsapi.org/v2/everything?' +
    new URLSearchParams({
      q: query,
      from,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: '20',
      apiKey: NEWS_API_KEY,
    })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI request failed (${res.status})`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error')
  return (data.articles || []).map((a: any) => ({
    title: a.title || '',
    description: a.description || '',
    url: a.url || '',
    source: a.source?.name || 'Unknown outlet',
    publishedAt: a.publishedAt || '',
  }))
}

/** Batched stance classification — the step that fixes the "any article
 * about the topic counts as verification" bug. */
async function classifyStance(claim: string, assertion: string, articles: Article[]): Promise<ClassifiedArticle[]> {
  if (articles.length === 0) return []

  const list = articles
    .map((a, i) => `${i}. [${a.source}] "${a.title}" — ${a.description}`)
    .join('\n')

  const prompt = `You are a neutral fact-checking assistant. A user submitted this claim:
"${claim}"
Core assertion: "${assertion}"

Below is a numbered list of news articles found while searching for this claim.
For EACH article, decide:
- "relevance": 0 to 1, how directly this article addresses the SPECIFIC assertion above (merely mentioning the same people/topic without addressing the assertion should score low, e.g. below 0.3).
- "stance": "supports" if the article's reporting confirms the assertion is true, "contradicts" if it confirms the assertion is false or reports the opposite, "neutral" if it's on-topic but doesn't confirm or deny it, or if it's off-topic.
- "reasoning": one short sentence.

Articles:
${list}

Return ONLY valid JSON, no markdown fences: an array of exactly ${articles.length} objects in the same order, each shaped {"relevance": number, "stance": "supports"|"contradicts"|"neutral", "reasoning": string}.`

  const raw = await callGemini(prompt)
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

  return articles.map((a, i) => {
    const c = parsed[i] || { relevance: 0, stance: 'neutral', reasoning: 'Not classified.' }
    return {
      ...a,
      relevance: typeof c.relevance === 'number' ? c.relevance : 0,
      stance: (['supports', 'contradicts', 'neutral'].includes(c.stance) ? c.stance : 'neutral') as Stance,
      reasoning: c.reasoning || '',
      rating: getSourceRating(a.source),
    }
  })
}

function calculateClaimConfidence(supporting: SourceRating[], contradicting: SourceRating[]) {
  const support = supporting.reduce((sum, s) => sum + calculateEvidenceWeight(s), 0)
  const contradiction = contradicting.reduce((sum, s) => sum + calculateEvidenceWeight(s), 0)
  const total = support + contradiction
  if (total === 0) return { confidence: 0, support, contradiction }
  return { confidence: Math.round((support / total) * 100), support, contradiction }
}

// ---------- route ----------

export async function POST(request: Request) {
  let payload: { input?: string; isUrl?: boolean }
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const input = (payload.input || '').trim()
  const isUrl = Boolean(payload.isUrl) || /^https?:\/\//i.test(input)
  const now = () => new Date().toISOString()

  if (!input) {
    return Response.json({ error: 'No input provided.' }, { status: 400 })
  }
  if (!GEMINI_API_KEY || !NEWS_API_KEY) {
    return Response.json(
      {
        error: true,
        message: 'Verification service is not fully configured (missing GEMINI_API_KEY or NEWS_API_KEY).',
        verificationTimestamp: now(),
      },
      { status: 503 },
    )
  }

  try {
    const claim = isUrl ? await extractClaimFromUrl(input) : input

    if (claim.split(/\s+/).filter(Boolean).length < 3) {
      return Response.json({
        verdict: 'insufficient' as Verdict,
        confidence: 0,
        confidenceReason: 'The claim is too short or vague to search for reliably.',
        summary: 'We need a more complete claim or headline to verify this.',
        uncertainty: 'Try pasting a fuller sentence or a direct article URL.',
        claim,
        evidence: [],
        sourceCount: 0,
        articlesFound: 0,
        verificationTimestamp: now(),
      })
    }

    const { query, assertion } = await buildSearchQuery(claim)
    const articles = await searchNews(query)
    const classified = await classifyStance(claim, assertion, articles)

    const relevant = classified.filter((a) => a.relevance >= RELEVANCE_THRESHOLD)
    const supporting = relevant.filter((a) => a.stance === 'supports')
    const contradicting = relevant.filter((a) => a.stance === 'contradicts')

    const supportingSourceCount = new Set(supporting.map((a) => a.source.toLowerCase())).size
    const contradictingSourceCount = new Set(contradicting.map((a) => a.source.toLowerCase())).size
    const sourceCount = new Set(relevant.map((a) => a.source.toLowerCase())).size

    const { confidence, support, contradiction } = calculateClaimConfidence(
      supporting.map((a) => a.rating),
      contradicting.map((a) => a.rating),
    )

    let verdict: Verdict
    let confidenceReason: string
    let summary: string
    let uncertainty: string

    if (relevant.length === 0) {
      verdict = 'insufficient'
      confidenceReason = 'No relevant news coverage directly addressing this specific claim was found.'
      summary = articles.length > 0
        ? `We found ${articles.length} articles on the general topic, but none directly confirmed or denied this specific claim.`
        : 'No independent news reporting could be found for this claim right now.'
      uncertainty = 'Absence of coverage is not proof the claim is false — it may be too new, too niche, or worded differently in the press.'
    } else if (confidence >= 80) {
      verdict = 'verified'
      confidenceReason = `${supportingSourceCount} source(s), weighted by credibility, confirm this claim with little or no contradiction (weighted support ${support.toFixed(2)} vs contradiction ${contradiction.toFixed(2)}).`
      summary = `Reporting from ${supportingSourceCount} outlet(s) — weighted for credibility — supports this claim.`
      uncertainty = 'This reflects source agreement on the specific assertion, not proof beyond doubt.'
    } else if (confidence >= 50) {
      verdict = 'mixed'
      confidenceReason = `Evidence is split: weighted support ${support.toFixed(2)} vs weighted contradiction ${contradiction.toFixed(2)} across ${sourceCount} source(s).`
      summary = 'Coverage exists on both sides, or corroboration is thin. Treat this claim with caution.'
      uncertainty = 'Check the individual evidence items below — the sources disagree or only partially confirm the claim.'
    } else if (confidence >= 20) {
      verdict = 'unsupported'
      confidenceReason = `Weighted evidence leans against this claim (support ${support.toFixed(2)} vs contradiction ${contradiction.toFixed(2)}).`
      summary = `${contradictingSourceCount || sourceCount} source(s) reporting on this specific assertion lean toward it being false or unconfirmed.`
      uncertainty = 'This is a weighted lean based on available coverage, not a certainty.'
    } else {
      verdict = 'insufficient'
      confidenceReason = `Very little credible evidence either way (support ${support.toFixed(2)} vs contradiction ${contradiction.toFixed(2)}).`
      summary = 'The available coverage does not provide enough credible signal to judge this claim.'
      uncertainty = 'Try a more specific claim or check back later as coverage develops.'
    }

    const evidence = relevant
      .sort((a, b) => calculateEvidenceWeight(b.rating) - calculateEvidenceWeight(a.rating))
      .slice(0, 10)
      .map((a) => ({
        source: a.source,
        tier: a.rating.overall_tier,
        text: a.title,
        url: a.url,
        stance: a.stance,
        reasoning: a.reasoning,
        relevance: Math.round(a.relevance * 100) / 100,
        timestamp: a.publishedAt || now(),
      }))

    return Response.json({
      verdict,
      confidence,
      confidenceReason,
      summary,
      uncertainty,
      claim,
      searchQuery: query,
      evidence,
      supportingCount: supportingSourceCount,
      contradictingCount: contradictingSourceCount,
      sourceCount,
      articlesFound: articles.length,
      verificationTimestamp: now(),
    })
  } catch (error) {
    const message = (error as Error).message || 'Unknown error'
    console.log('[v0] analyze route error:', message)
    return Response.json(
      {
        error: true,
        message: 'The verification service could not be reached. This is not a judgment about the claim — please try again.',
        verificationTimestamp: now(),
      },
      { status: 503 },
    )
  }
}
