'use client'

import { useState, useEffect } from 'react'
import { CredibilityConfig, neutralStarterConfig } from '@/lib/credibility-config'
import { CustomizationPanel } from '@/components/customization-panel'
import { CredibilityDemo } from '@/components/credibility-demo'
import { Menu, X } from 'lucide-react'

export default function Page() {
  const [config, setConfig] = useState<CredibilityConfig>(neutralStarterConfig)
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('credibilityConfig')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const applyCSSTheme = () => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', config.theme.primary)
    root.style.setProperty('--color-accent', config.theme.accent)
    root.style.setProperty('--color-verified', config.theme.verdictColors.verified)
    root.style.setProperty('--color-mixed', config.theme.verdictColors.mixed)
    root.style.setProperty('--color-unsupported', config.theme.verdictColors.unsupported)
    root.style.setProperty('--color-insufficient', config.theme.verdictColors.insufficient)
  }

  useEffect(() => {
    applyCSSTheme()
  }, [config])

  return (
    <main className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {config.branding.appName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-lg">{config.branding.appName}</div>
                <div className="text-xs text-slate-500">{config.branding.tagline}</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {config.sections.problem.enabled && (
                <button
                  onClick={() => scrollToSection('problem')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition text-sm font-medium"
                >
                  {config.nav.problem}
                </button>
              )}
              {config.sections.workflow.enabled && (
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition text-sm font-medium"
                >
                  {config.nav.workflow}
                </button>
              )}
              {config.sections.heatmap.enabled && (
                <button
                  onClick={() => scrollToSection('heatmap')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition text-sm font-medium"
                >
                  {config.nav.insights}
                </button>
              )}
              {config.sections.vision.enabled && (
                <button
                  onClick={() => scrollToSection('vision')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition text-sm font-medium"
                >
                  {config.nav.vision}
                </button>
              )}
              <button
                onClick={() => scrollToSection('demo')}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition text-sm font-medium"
              >
                {config.nav.demo}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {config.sections.problem.enabled && (
                <button
                  onClick={() => scrollToSection('problem')}
                  className="block w-full text-left px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                >
                  {config.nav.problem}
                </button>
              )}
              {config.sections.workflow.enabled && (
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="block w-full text-left px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                >
                  {config.nav.workflow}
                </button>
              )}
              {config.sections.heatmap.enabled && (
                <button
                  onClick={() => scrollToSection('heatmap')}
                  className="block w-full text-left px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                >
                  {config.nav.insights}
                </button>
              )}
              {config.sections.vision.enabled && (
                <button
                  onClick={() => scrollToSection('vision')}
                  className="block w-full text-left px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                >
                  {config.nav.vision}
                </button>
              )}
              <button
                onClick={() => scrollToSection('demo')}
                className="block w-full px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition text-sm font-medium"
              >
                {config.nav.demo}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">{config.hero.title}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">{config.hero.subtitle}</p>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            {config.hero.description}
          </p>
          <button
            onClick={() => scrollToSection('demo')}
            className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-semibold text-lg"
          >
            {config.hero.ctaText}
          </button>
        </div>
      </section>

      {/* Problem Section */}
      {config.sections.problem.enabled && (
        <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{config.sections.problem.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {config.sections.problem.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {config.sections.problem.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-4">
                    {item.year}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Workflow Section */}
      {config.sections.workflow.enabled && (
        <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{config.sections.workflow.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {config.sections.workflow.description}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {config.sections.workflow.steps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                  </div>
                  {idx < config.sections.workflow.steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 -right-6 w-6 h-px bg-blue-300 dark:bg-blue-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Heatmap Section */}
      {config.sections.heatmap.enabled && (
        <section id="heatmap" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{config.sections.heatmap.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {config.sections.heatmap.description}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.sections.heatmap.patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center"
                >
                  <p className="font-medium text-amber-900 dark:text-amber-100">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Consensus Section */}
      {config.sections.consensus.enabled && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{config.sections.consensus.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {config.sections.consensus.description}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">✓</div>
                <h3 className="font-semibold mb-2">Consensus</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sources agree on the key facts
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">⚖</div>
                <h3 className="font-semibold mb-2">Mixed</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Evidence presents conflicting views
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">?</div>
                <h3 className="font-semibold mb-2">Unclear</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Insufficient sources available
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Vision Section */}
      {config.sections.vision.enabled && (
        <section id="vision" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{config.sections.vision.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {config.sections.vision.description}
              </p>
            </div>

            <div className="space-y-4">
              {config.sections.vision.points.map((point, idx) => (
                <div
                  key={idx}
                  className="p-4 border-l-4 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10 pl-6"
                >
                  <p className="text-slate-900 dark:text-slate-50 font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo Section */}
      <CredibilityDemo config={config} onCustomizeClick={() => setCustomizationOpen(true)} />

      {/* Customization Panel */}
      <CustomizationPanel
        config={config}
        onConfigChange={setConfig}
        isOpen={customizationOpen}
        onClose={() => setCustomizationOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <p>
            {config.branding.appName} • {config.branding.tagline}
          </p>
          <p className="mt-2 text-slate-500">
            Built for transparent, evidence-based claim verification
          </p>
        </div>
      </footer>
    </main>
  )
}
