'use client'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader,
  Menu,
  Settings,
  ThumbsDown,
  ThumbsUp,
  X,
  XCircle,
} from 'lucide-react'

type Verdict = 'verified' | 'mixed' | 'unsupported' | 'insufficient'
type Evidence = {
  source: string
  text: string
  supports?: boolean
  contradicts?: boolean
  timestamp?: string
}
type Result = {
  verdict: Verdict
  confidence: number
  confidenceReason: string
  summary: string
  uncertainty?: string
  evidence: Evidence[]
  sourceCount: number
  verificationTimestamp: string
}
type Config = {
  appName: string
  tagline: string
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  primary: string
  accent: string
  demoTitle: string
  demoDescription: string
  placeholder: string
}
const defaultConfig: Config = {
  appName: 'Credibility Analyzer',
  tagline: 'Evidence-based claim verification',
  heroTitle: 'Verify News Against Multiple Sources',
  heroSubtitle: 'Transparent, source-backed analysis',
  heroDescription:
    'Paste a news URL or a claim. We cross-check it live against multiple independent news outlets and show you exactly what each source reports — with citations, confidence, and honest uncertainty.',
  primary: '#0f172a',
  accent: '#3b82f6',
  demoTitle: 'Try the Analyzer',
  demoDescription:
    'Paste a news article URL or a claim to cross-check it against the news',
  placeholder: 'Paste a news URL or type a claim...',
}

export default function Page() {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('credibility-export-config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch {
        // Keep defaults when saved configuration is invalid.
      }
    }
  }, [])

  function updateConfig(next: Config) {
    setConfig(next)
    window.localStorage.setItem(
      'credibility-export-config',
      JSON.stringify(next),
    )
  }

  async function analyze() {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    setServiceError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          isUrl: input.startsWith('http'),
        }),
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
    } catch {
      setServiceError(
        'The verification service could not be reached. This is not a judgment about the claim — please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const color =
    result?.verdict === 'verified'
      ? '#10b981'
      : result?.verdict === 'mixed'
        ? '#f59e0b'
        : result?.verdict === 'unsupported'
          ? '#ef4444'
          : '#8b5cf6'

  return (
    <main
      style={{
        minHeight: '100vh',
        color: config.primary,
        background: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 5%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 2,
        }}
      >
        <strong>{config.appName}</strong>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {menuOpen && (
        <div style={{ padding: 20, borderBottom: '1px solid #e2e8f0' }}>
          Evidence · Methodology · Try It
        </div>
      )}
      <section
        style={{
          padding: '100px 5%',
          textAlign: 'center',
          background: 'linear-gradient(135deg,#eff6ff,#f8fafc)',
        }}
      >
        <p style={{ color: config.accent, fontWeight: 700 }}>{config.tagline}</p>
        <h1
          style={{
            fontSize: 'clamp(40px,7vw,72px)',
            lineHeight: 1.05,
            margin: '16px auto',
            maxWidth: 850,
          }}
        >
          {config.heroTitle}
        </h1>
        <h2 style={{ fontWeight: 500, color: '#64748b' }}>
          {config.heroSubtitle}
        </h2>
        <p
          style={{
            maxWidth: 650,
            margin: '20px auto 32px',
            color: '#64748b',
            fontSize: 18,
          }}
        >
          {config.heroDescription}
        </p>
        <button
          onClick={() =>
            document
              .getElementById('demo')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          style={{
            background: config.accent,
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '14px 24px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Analyze Now
        </button>
      </section>
      <section style={{ padding: '80px 5%', maxWidth: 1050, margin: 'auto' }}>
        <h2>Transparent by design</h2>
        <p style={{ color: '#64748b' }}>
          Every result separates verdict, confidence, evidence coverage, and
          uncertainty.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
            gap: 16,
            marginTop: 28,
          }}
        >
          {[
            'Extract the claim',
            'Search news outlets',
            'Compare what each reports',
            'Show conflicts & gaps',
          ].map((item, index) => (
            <article
              key={item}
              style={{
                padding: 22,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
              }}
            >
              <b>{index + 1}</b>
              <h3>{item}</h3>
              <p style={{ color: '#64748b' }}>
                Clear steps with no hidden certainty.
              </p>
            </article>
          ))}
        </div>
      </section>
      <section id="demo" style={{ padding: '80px 5%', background: '#f8fafc' }}>
        <div style={{ maxWidth: 850, margin: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div>
              <h2>{config.demoTitle}</h2>
              <p style={{ color: '#64748b' }}>{config.demoDescription}</p>
            </div>
            <button
              onClick={() => setCustomizing(true)}
              aria-label="Customize UI"
              style={{
                border: '1px solid #cbd5e1',
                background: '#fff',
                borderRadius: 8,
                padding: 10,
                cursor: 'pointer',
              }}
            >
              <Settings size={18} />
            </button>
          </div>
          <div
            style={{
              marginTop: 20,
              padding: 22,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
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
                style={{
                  flex: 1,
                  padding: 13,
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                }}
              />
              <button
                onClick={analyze}
                disabled={!input.trim() || loading}
                style={{
                  background: config.accent,
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '0 18px',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: !input.trim() || loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
            {loading && (
              <p style={{ marginTop: 16, color: '#64748b', fontSize: 14 }}>
                Cross-checking against live news sources…
              </p>
            )}
            {serviceError && (
              <div
                role="alert"
                style={{
                  marginTop: 18,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#991b1b',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Verification unavailable</strong>
                  <p style={{ margin: '4px 0 0' }}>{serviceError}</p>
                </div>
              </div>
            )}
            {result && (
              <div
                style={{
                  marginTop: 22,
                  border: `2px solid ${color}`,
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    color,
                  }}
                >
                  <VerdictIcon verdict={result.verdict} />
                  <h3 style={{ margin: 0 }}>
                    {result.verdict === 'verified'
                      ? 'Verified'
                      : result.verdict === 'mixed'
                        ? 'Mixed Evidence'
                        : result.verdict === 'unsupported'
                          ? 'Unsupported'
                          : 'Insufficient Evidence'}
                  </h3>
                </div>
                <p>{result.summary}</p>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <strong>
                    Confidence: {Math.round(result.confidence * 100)}%
                  </strong>
                  <span style={{ color: '#64748b', fontSize: 14 }}>
                    {result.sourceCount} independent source
                    {result.sourceCount === 1 ? '' : 's'} checked
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  {result.confidenceReason}
                </p>
                {result.uncertainty && (
                  <p
                    style={{
                      background: '#fffbeb',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    {result.uncertainty}
                  </p>
                )}
                {result.evidence.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <h4>Evidence from news sources</h4>
                    {result.evidence.map((item) => (
                      <article
                        key={`${item.source}-${item.text}`}
                        style={{
                          marginTop: 10,
                          padding: 12,
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <strong>{item.source}</strong>
                          {item.supports && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: '#10b981',
                                fontSize: 13,
                              }}
                            >
                              <ThumbsUp size={14} /> supports
                            </span>
                          )}
                          {item.contradicts && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: '#ef4444',
                                fontSize: 13,
                              }}
                            >
                              <ThumbsDown size={14} /> contradicts
                            </span>
                          )}
                        </div>
                        <p style={{ marginBottom: 0 }}>{item.text}</p>
                      </article>
                    ))}
                  </div>
                )}
                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 16 }}>
                  Verified at{' '}
                  {new Date(result.verificationTimestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      {customizing && (
        <Customizer
          config={config}
          onSave={updateConfig}
          onClose={() => setCustomizing(false)}
        />
      )}
    </main>
  )
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === 'verified') {
    return <CheckCircle />
  }
  if (verdict === 'unsupported') {
    return <XCircle />
  }
  if (verdict === 'insufficient') {
    return <HelpCircle />
  }
  return <AlertCircle />
}

function Customizer({
  config,
  onSave,
  onClose,
}: {
  config: Config
  onSave: (config: Config) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(config)
  const field = (key: keyof Config, label: string) => (
    <label style={{ display: 'grid', gap: 6 }}>
      <span>{label}</span>
      <input
        value={draft[key] as string}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
        style={{ padding: 9, border: '1px solid #cbd5e1', borderRadius: 6 }}
      />
    </label>
  )
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize UI"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0008',
        display: 'grid',
        placeItems: 'center',
        zIndex: 3,
      }}
    >
      <div
        style={{
          background: '#fff',
          maxWidth: 560,
          width: '92%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Customize UI</h2>
          <button
            onClick={onClose}
            aria-label="Close customization panel"
            style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
          >
            <X />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {field('appName', 'App name')}
          {field('tagline', 'Tagline')}
          {field('heroTitle', 'Hero title')}
          {field('heroSubtitle', 'Hero subtitle')}
          {field('heroDescription', 'Hero description')}
          {field('demoTitle', 'Demo title')}
          {field('demoDescription', 'Demo description')}
          {field('placeholder', 'Input placeholder')}
          <label>
            Accent color
            <input
              type="color"
              value={draft.accent}
              onChange={(event) =>
                setDraft({ ...draft, accent: event.target.value })
              }
            />
          </label>
        </div>
        <button
          onClick={() => {
            onSave(draft)
            onClose()
          }}
          style={{
            marginTop: 20,
            background: draft.accent,
            color: '#fff',
            border: 0,
            padding: 12,
            borderRadius: 8,
            width: '100%',
            cursor: 'pointer',
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
