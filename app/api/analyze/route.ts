import { generateText, generateObject } from 'ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

type Verdict = 'verified' | 'mixed' | 'unsupported' | 'insufficient'

const analysisSchema = z.object({
  verdict: z
    .enum(['verified', 'mixed', 'unsupported', 'insufficient'])
    .describe(
      'verified = multiple independent reputable outlets corroborate the claim; ' +
        'mixed = outlets report conflicting or partial details; ' +
        'unsupported = reputable outlets contradict or debunk the claim; ' +
        'insufficient = not enough independent reporting was found to judge.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How confident the verdict is, based ONLY on gathered evidence.'),
  confidenceReason: z
    .string()
    .describe('One sentence explaining what drove the confidence level.'),
  summary: z
    .string()
    .describe('A neutral 2-3 sentence summary of what the reporting shows.'),
  uncertainty: z
    .string()
    .describe('What remains unknown, contested, or unverifiable.'),
  evidence: z
    .array(
      z.object({
        source: z.string().describe('Name of the outlet, e.g. "Reuters".'),
        text: z
          .string()
          .describe('What this outlet actually reports about the claim.'),
        supports: z.boolean().describe('True if this source supports the claim.'),
        contradicts: z
          .boolean()
          .describe('True if this source contradicts the claim.'),
      }),
    )
    .describe('One entry per distinct source that was consulted.'),
})

// Best-effort extraction of a claim/headline from a URL.
async function extractClaimFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; CredibilityAnalyzer/1.0; +https://vercel.com)',
      },
      redirect: 'follow',
    })
    if (!res.ok) return url
    const html = await res.text()
    const ogTitle = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    )?.[1]
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const desc = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1]
    const headline = (ogTitle || title || '').trim()
    const description = (desc || '').trim()
    const combined = [headline, description].filter(Boolean).join(' — ')
    return combined || url
  } catch {
    return url
  }
}

export async function POST(request: Request) {
  let payload: { input?: string; isUrl?: boolean }
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const input = (payload.input || '').trim()
  const isUrl = Boolean(payload.isUrl) || /^https?:\/\//i.test(input)

  if (!input) {
    return Response.json({ error: 'No input provided.' }, { status: 400 })
  }

  const timestamp = () => new Date().toISOString()

  try {
    const claim = isUrl ? await extractClaimFromUrl(input) : input

    // Step 1: Live cross-checking across news sources with a search-grounded model.
    const research = await generateText({
      model: 'perplexity/sonar-pro',
      system:
        'You are a rigorous fact-checking researcher. Cross-check the claim ' +
        'against MULTIPLE independent, reputable news organizations (e.g. Reuters, ' +
        'AP, BBC, AFP, and other established outlets). For each relevant outlet, ' +
        'state clearly what it reports and whether it supports or contradicts the ' +
        'claim. If reporting is thin, conflicting, or absent, say so explicitly. ' +
        'Never invent sources or coverage. Prefer primary reporting over aggregation.',
      prompt: isUrl
        ? `Verify the accuracy of the news at this URL by cross-checking other outlets.\n\nURL: ${input}\nExtracted headline/claim: ${claim}\n\nReport what independent outlets say about this story.`
        : `Verify the accuracy of this claim by cross-checking independent news outlets.\n\nClaim: "${claim}"\n\nReport what independent outlets say about this claim.`,
    })

    const sources = research.sources ?? []
    const sourceList = sources
      .map((s) => {
        const url = 'url' in s ? s.url : ''
        const title = 'title' in s && s.title ? s.title : url
        return `- ${title} (${url})`
      })
      .join('\n')

    const uniqueSourceCount = new Set(
      sources.map((s) => ('url' in s ? s.url : '')).filter(Boolean),
    ).size

    // Step 2: Convert the grounded research into a strict, structured verdict.
    const { object } = await generateObject({
      model: 'openai/gpt-4o-mini',
      schema: analysisSchema,
      system:
        'You convert fact-checking research into a strict structured verdict. ' +
        'Base every field ONLY on the provided research and sources. Do not add ' +
        'outside knowledge. If the research shows fewer than two independent ' +
        'corroborating outlets, do not return "verified". If the research found ' +
        'little or no relevant coverage, return "insufficient" with low confidence. ' +
        'Confidence must reflect the strength and agreement of the evidence.',
      prompt:
        `Original ${isUrl ? 'URL/headline' : 'claim'}: ${claim}\n\n` +
        `Research findings:\n${research.text}\n\n` +
        `Sources consulted (${uniqueSourceCount}):\n${sourceList || '(none returned)'}\n\n` +
        'Produce the structured analysis.',
    })

    // Merge real source URLs into the evidence entries where possible.
    const evidence = object.evidence.map((item, i) => {
      const matched = sources.find((s) => {
        const title = 'title' in s && s.title ? s.title : ''
        return (
          title &&
          item.source &&
          title.toLowerCase().includes(item.source.toLowerCase().split(' ')[0])
        )
      })
      const url =
        matched && 'url' in matched ? matched.url : sources[i] && 'url' in sources[i] ? (sources[i] as { url: string }).url : undefined
      return {
        source: item.source,
        text: url ? `${item.text} (${url})` : item.text,
        supports: item.supports,
        contradicts: item.contradicts,
        timestamp: timestamp(),
      }
    })

    // Guardrail: never claim "verified" without enough independent sources.
    let verdict: Verdict = object.verdict
    let confidence = object.confidence
    if (uniqueSourceCount < 2 && verdict === 'verified') {
      verdict = 'mixed'
      confidence = Math.min(confidence, 0.5)
    }
    if (uniqueSourceCount === 0) {
      verdict = 'insufficient'
      confidence = 0
    }

    return Response.json({
      verdict,
      confidence,
      confidenceReason: object.confidenceReason,
      summary: object.summary,
      uncertainty: object.uncertainty,
      evidence,
      sourceCount: uniqueSourceCount,
      verificationTimestamp: timestamp(),
    })
  } catch (error) {
    const message = (error as Error).message || 'Unknown error'
    console.log('[v0] analyze route error:', message)

    // Surface a real service error instead of faking an "insufficient" verdict.
    // Faking a verdict here would violate the app's core promise of no
    // fabricated scores. The client renders this as a service banner.
    const isBilling = /credit card|billing|quota|payment|insufficient funds/i.test(
      message,
    )
    return Response.json(
      {
        error: true,
        code: isBilling ? 'ai_gateway_billing' : 'service_unavailable',
        message: isBilling
          ? 'Live verification is unavailable because the AI Gateway has no billing set up. Add a credit card to your Vercel AI Gateway to unlock free credits, then try again.'
          : 'The verification service is temporarily unavailable. This is not a judgment about the claim — please try again.',
        verificationTimestamp: timestamp(),
      },
      { status: 503 },
    )
  }
}
