'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  Scale,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Upload,
  X,
  XCircle,
} from 'lucide-react'

type Verdict = 'verified' | 'mixed' | 'unsupported' | 'insufficient'

type Evidence = {
  source: string
  text: string
  url?: string
  coverage: number
  supports: boolean
  contradicts: boolean
  timestamp?: string
}

type Result = {
  verdict: Verdict
  confidence: number
  confidenceReason: string
  summary: string
  uncertainty?: string
  claim: string
  keywords: string[]
  evidence: Evidence[]
  sourceCount: number
  articlesFound: number
  verificationTimestamp: string
}

type Sections = {
  problem: boolean
  methodology: boolean
  language: boolean
  consensus: boolean
  vision: boolean
}

type Config = {
  appName: string
  tagline: string
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  demoTitle: string
  demoDescription: string
  placeholder: string
  accent: string
  sections: Sections
}

const defaultConfig: Config = {
  appName: 'Credibility Analyzer',
  tagline: 'Evidence-based claim verification',
  heroTitle: 'Verify Claims with Evidence',
  heroSubtitle: 'Transparent, source-backed analysis',
  heroDescription:
    'Analyze claims and articles with a clear methodology that shows evidence, citations, and confidence levels. No guessing. No fabricated scores.',
  demoTitle: 'Try the Analyzer',
  demoDescription:
    'Paste a URL or enter a claim to see how evidence shapes credibility',
  placeholder: 'Enter a URL or claim...',
  accent: '#2563eb',
  sections: {
    problem: true,
    methodology: true,
    language: true,
    consensus: true,
    vision: true,
  },
}

const SAMPLES: Record<string, string> = {
  'Sample Article 1':
    'NASA confirms water molecules detected on the sunlit surface of the Moon',
  'Sample Article 2':
    'World Health Organization declares end of the COVID-19 global health emergency',
  'Sample Claim':
    'The Great Wall of China is visible from space with the naked eye',
}

const STORAGE_KEY = 'credibility-config-v2'

export default function Page() {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customizing, setCustomizing] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setConfig({ ...defaultConfig, ...JSON.parse(saved) })
      } catch {
        // ignore invalid saved config
      }
    }
  }, [])

  function saveConfig(next: Config) {
    setConfig(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function analyze(value?: string) {
    const query = (value ?? input).trim()
    if (!query) return
    setInput(query)
    setLoading(true)
    setResult(null)
    setServiceError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query, isUrl: /^https?:\/\//i.test(query) }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setServiceError(
          data.message ||
            'The verification service is temporarily unavailable. Please try again.',
        )
        return
      }
      setResult(data as Result)
      requestAnimationFrame(() =>
        document
          .getElementById('result')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      )
    } catch {
      setServiceError(
        'The verification service could not be reached. This is not a judgment about the claim — please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <main
      className="min-h-screen bg-white text-slate-900 font-sans"
      style={{ ['--accent' as string]: config.accent }}
    >
      <Nav config={config} onNav={scrollTo} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-slate-50 px-[5%] py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight md:text-6xl">
          {config.heroTitle}
        </h1>
        <p className="mt-5 text-lg font-medium text-slate-600">
          {config.heroSubtitle}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-slate-500">
          {config.heroDescription}
        </p>
        <button
          onClick={() => scrollTo('demo')}
          className="mt-8 rounded-lg px-6 py-3.5 font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          Analyze Now
        </button>
      </section>

      {config.sections.problem && <ProblemSection />}
      {config.sections.methodology && <MethodologySection />}
      {config.sections.language && <LanguageSection />}
      {config.sections.consensus && <ConsensusSection />}
      {config.sections.vision && <VisionSection />}

      <DemoSection
        config={config}
        input={input}
        setInput={setInput}
        analyze={analyze}
        loading={loading}
        result={result}
        serviceError={serviceError}
        onCustomize={() => setCustomizing(true)}
      />

      <footer className="bg-slate-900 px-[5%] py-10 text-center text-slate-300">
        <p className="font-medium text-slate-200">
          {config.appName} • {config.tagline}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Built for transparent, evidence-based claim verification
        </p>
      </footer>

      {customizing && (
        <Customizer
          config={config}
          onSave={saveConfig}
          onClose={() => setCustomizing(false)}
        />
      )}
    </main>
  )
}

function Nav({
  config,
  onNav,
}: {
  config: Config
  onNav: (id: string) => void
}) {
  const links: [string, string][] = [
    ['Problem', 'problem'],
    ['How It Works', 'methodology'],
    ['Insights', 'insights'],
    ['Vision', 'vision'],
  ]
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-[5%] py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-8 w-8 place-items-center rounded-md text-sm font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          C
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold">{config.appName}</div>
          <div className="text-xs text-slate-500">{config.tagline}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-4">
        <div className="hidden items-center gap-4 text-sm text-slate-600 sm:flex">
          {links.map(([label, id]) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className="transition hover:text-slate-900"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onNav('demo')}
          className="rounded-md px-3.5 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          Try It
        </button>
      </div>
    </nav>
  )
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-balance text-3xl font-bold md:text-4xl">{title}</h2>
      <p className="mt-3 text-pretty leading-relaxed text-slate-500">
        {subtitle}
      </p>
    </div>
  )
}

function ProblemSection() {
  const items = [
    {
      title: 'Misinformation Crisis',
      body: 'Rapid spread of unverified claims across platforms',
      year: '2020',
    },
    {
      title: 'Trust Erosion',
      body: 'Public confidence in media reaches historic lows',
      year: '2021',
    },
    {
      title: 'Verification Gap',
      body: 'Manual fact-checking cannot keep pace with content volume',
      year: '2022',
    },
    {
      title: 'AI-Generated Content',
      body: 'Synthetic media compounds the verification challenge',
      year: '2024',
    },
  ]
  return (
    <section id="problem" className="px-[5%] py-20">
      <SectionHeading
        title="The Problem with Trust"
        subtitle="Claims flood the internet every second. How do we know what to believe?"
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-md"
          >
            <h3 className="font-bold">{item.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{item.body}</p>
            <p
              className="mt-4 text-2xl font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {item.year}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function MethodologySection() {
  const steps = [
    {
      title: 'Extract Claims',
      body: 'Identify specific, verifiable assertions from the content',
    },
    {
      title: 'Gather Evidence',
      body: 'Search independent news outlets for supporting or contradicting coverage',
    },
    {
      title: 'Assess Coverage',
      body: 'Evaluate how thoroughly sources address each claim',
    },
    {
      title: 'Determine Verdict',
      body: 'Show evidence support, conflicts, and confidence levels',
    },
  ]
  return (
    <section id="methodology" className="bg-slate-50 px-[5%] py-20">
      <SectionHeading
        title="Our Methodology"
        subtitle="Transparent, step-by-step claim analysis"
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white p-6 text-center"
          >
            <span
              className="mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {index + 1}
            </span>
            <h3 className="mt-4 font-bold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {step.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function LanguageSection() {
  const patterns = [
    'Appeals to emotion',
    'Loaded language',
    'Vague quantifiers',
    'Ad hominem',
    'Circular reasoning',
    'False dichotomy',
  ]
  return (
    <section id="insights" className="px-[5%] py-20">
      <SectionHeading
        title="Language Pattern Analysis"
        subtitle="Identify rhetorical techniques that can mask or obscure claims"
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
        {patterns.map((pattern) => (
          <div
            key={pattern}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800"
          >
            {pattern}
          </div>
        ))}
      </div>
    </section>
  )
}

function ConsensusSection() {
  const cards = [
    {
      icon: <CheckCircle2 className="text-emerald-500" />,
      title: 'Consensus',
      body: 'Sources agree on the key facts',
    },
    {
      icon: <Scale className="text-amber-500" />,
      title: 'Mixed',
      body: 'Evidence presents conflicting views',
    },
    {
      icon: <HelpCircle className="text-fuchsia-500" />,
      title: 'Unclear',
      body: 'Insufficient sources available',
    },
  ]
  return (
    <section className="bg-slate-50 px-[5%] py-20">
      <SectionHeading
        title="Consensus vs. Friction"
        subtitle="When sources disagree, we show the conflict rather than hide it"
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 text-center"
          >
            <div className="flex justify-center">{card.icon}</div>
            <h3 className="mt-3 font-bold">{card.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function VisionSection() {
  const points = [
    'All scores tied to verifiable sources',
    'Confidence intervals, not false certainty',
    'Visible methodology and assumptions',
    'Open feedback and continuous improvement',
  ]
  return (
    <section id="vision" className="px-[5%] py-20">
      <SectionHeading
        title="Our Vision"
        subtitle="A world where claims are transparent and evidence is accessible"
      />
      <div className="mx-auto mt-10 grid max-w-2xl gap-3">
        {points.map((point) => (
          <div
            key={point}
            className="rounded-lg border-l-4 bg-blue-50/60 px-5 py-4 text-sm font-medium text-slate-700"
            style={{ borderColor: 'var(--accent)' }}
          >
            {point}
          </div>
        ))}
      </div>
    </section>
  )
}

function DemoSection({
  config,
  input,
  setInput,
  analyze,
  loading,
  result,
  serviceError,
  onCustomize,
}: {
  config: Config
  input: string
  setInput: (value: string) => void
  analyze: (value?: string) => void
  loading: boolean
  result: Result | null
  serviceError: string | null
  onCustomize: () => void
}) {
  return (
    <section id="demo" className="bg-slate-50 px-[5%] py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{config.demoTitle}</h2>
            <p className="mt-2 text-slate-500">{config.demoDescription}</p>
          </div>
          <button
            onClick={onCustomize}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Settings size={16} /> Customize UI
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  analyze()
                }
              }}
              placeholder={config.placeholder}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => analyze()}
              disabled={!input.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Analyzing
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Or try a sample:</span>
            {Object.keys(SAMPLES).map((label) => (
              <button
                key={label}
                onClick={() => analyze(SAMPLES[label])}
                disabled={loading}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <p className="mt-4 text-sm text-slate-500">
              Cross-checking against live news coverage from independent
              outlets…
            </p>
          )}

          {serviceError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <strong>Verification unavailable</strong>
                <p className="mt-1 text-sm">{serviceError}</p>
              </div>
            </div>
          )}

          {result && <ResultCard result={result} />}
        </div>
      </div>
    </section>
  )
}

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; bg: string; border: string }
> = {
  verified: {
    label: 'Verified by Multiple Sources',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  mixed: {
    label: 'Mixed / Weak Corroboration',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  unsupported: {
    label: 'Not Supported by Coverage',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
  insufficient: {
    label: 'Insufficient Evidence',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === 'verified') return <CheckCircle2 />
  if (verdict === 'unsupported') return <XCircle />
  if (verdict === 'insufficient') return <HelpCircle />
  return <AlertCircle />
}

function ResultCard({ result }: { result: Result }) {
  const meta = VERDICT_META[result.verdict]
  return (
    <div
      id="result"
      className="mt-6 overflow-hidden rounded-xl border-2"
      style={{ borderColor: meta.border }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: meta.bg, color: meta.color }}
      >
        <VerdictIcon verdict={result.verdict} />
        <h3 className="text-lg font-bold">{meta.label}</h3>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-slate-700">{result.summary}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-semibold">
            Confidence: {Math.round(result.confidence * 100)}%
          </span>
          <span className="text-slate-500">
            {result.sourceCount} independent source
            {result.sourceCount === 1 ? '' : 's'} matched
          </span>
          <span className="text-slate-500">
            {result.articlesFound} articles scanned
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(result.confidence * 100)}%`,
              background: meta.color,
            }}
          />
        </div>

        <p className="text-sm text-slate-500">{result.confidenceReason}</p>

        {result.keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">
              Keywords matched:
            </span>
            {result.keywords.slice(0, 12).map((keyword) => (
              <span
                key={keyword}
                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

        {result.uncertainty && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <strong>Uncertainty: </strong>
            {result.uncertainty}
          </p>
        )}

        {result.evidence.length > 0 && (
          <div>
            <h4 className="font-semibold">
              {result.sourceCount > 0
                ? 'Matching coverage'
                : 'Closest related coverage'}
            </h4>
            <div className="mt-2 space-y-2.5">
              {result.evidence.map((item, index) => (
                <article
                  key={`${item.source}-${index}`}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{item.source}</strong>
                    {item.supports ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <ThumbsUp size={13} /> matches (
                        {Math.round(item.coverage * 100)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <ThumbsDown size={13} /> partial (
                        {Math.round(item.coverage * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.text}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: 'var(--accent)' }}
                    >
                      Read source <ExternalLink size={12} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          Verified at{' '}
          {new Date(result.verificationTimestamp).toLocaleString()} • Coverage
          from Google News aggregation
        </p>
      </div>
    </div>
  )
}

type Tab = 'Branding' | 'Copy' | 'Theme' | 'Sections'

function Customizer({
  config,
  onSave,
  onClose,
}: {
  config: Config
  onSave: (config: Config) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Config>(config)
  const [tab, setTab] = useState<Tab>('Branding')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof Config, value: string) =>
    setDraft({ ...draft, [key]: value })

  const Field = ({
    label,
    keyName,
    textarea,
  }: {
    label: string
    keyName: keyof Config
    textarea?: boolean
  }) => (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {textarea ? (
        <textarea
          value={draft[keyName] as string}
          onChange={(event) => set(keyName, event.target.value)}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
        />
      ) : (
        <input
          value={draft[keyName] as string}
          onChange={(event) => set(keyName, event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
        />
      )}
    </label>
  )

  function exportConfig() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'credibility-ui-config.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function importConfig(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        setDraft({ ...defaultConfig, ...parsed })
      } catch {
        // ignore malformed files
      }
    }
    reader.readAsText(file)
  }

  const presets = ['#2563eb', '#0f766e', '#dc2626', '#7c3aed', '#ea580c', '#0891b2']

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize UI"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">Customize UI</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 px-3">
          {(['Branding', 'Copy', 'Theme', 'Sections'] as Tab[]).map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className="relative px-3 py-2.5 text-sm font-medium transition"
              style={{
                color: tab === name ? 'var(--accent)' : '#64748b',
              }}
            >
              {name}
              {tab === name && (
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-4 overflow-y-auto p-5">
          {tab === 'Branding' && (
            <>
              <Field label="App Name" keyName="appName" />
              <Field label="Tagline" keyName="tagline" />
              <Field label="Hero Title" keyName="heroTitle" />
              <Field label="Hero Subtitle" keyName="heroSubtitle" />
            </>
          )}
          {tab === 'Copy' && (
            <>
              <Field label="Hero Description" keyName="heroDescription" textarea />
              <Field label="Analyzer Title" keyName="demoTitle" />
              <Field
                label="Analyzer Description"
                keyName="demoDescription"
                textarea
              />
              <Field label="Input Placeholder" keyName="placeholder" />
            </>
          )}
          {tab === 'Theme' && (
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-600">Accent color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draft.accent}
                    onChange={(event) => set('accent', event.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                  />
                  <input
                    value={draft.accent}
                    onChange={(event) => set('accent', event.target.value)}
                    className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((color) => (
                  <button
                    key={color}
                    onClick={() => set('accent', color)}
                    aria-label={`Use ${color}`}
                    className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          )}
          {tab === 'Sections' && (
            <div className="grid gap-2">
              {(
                [
                  ['problem', 'The Problem with Trust'],
                  ['methodology', 'Our Methodology'],
                  ['language', 'Language Pattern Analysis'],
                  ['consensus', 'Consensus vs. Friction'],
                  ['vision', 'Our Vision'],
                ] as [keyof Sections, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={draft.sections[key]}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          [key]: event.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={() => setDraft(defaultConfig)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Reset
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Upload size={15} /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={importConfig}
            className="hidden"
          />
          <button
            onClick={exportConfig}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => {
              onSave(draft)
              onClose()
            }}
            className="rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}
