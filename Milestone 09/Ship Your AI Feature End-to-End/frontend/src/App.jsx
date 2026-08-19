import { useMemo, useState } from 'react'
import { analyzeCode } from './api/client.js'

const EXAMPLE = `- const timeout = setTimeout(runSearch, 0)
+ const timeout = setTimeout(runSearch, 400)
+ clearTimeout(timeout)
`

function ResultCard({ result }) {
  if (!result) return null

  return (
    <section className="result-card" aria-live="polite">
      <div className="result-heading">
        <div>
          <p className="eyebrow">Analysis ready</p>
          <h2>Your explanation, without the guesswork.</h2>
        </div>
        <span className={`risk risk-${result.risk || 'medium'}`}>{result.risk || 'medium'} risk</span>
      </div>

      <div className="summary-block">
        <span className="label">The change</span>
        <p>{result.summary}</p>
      </div>

      <div className="result-grid">
        <div className="result-block"><span className="label">Why it matters</span><p>{result.whyItMatters}</p></div>
        <div className="result-block"><span className="label">Say it out loud</span><p>{result.explanation}</p></div>
      </div>

      <div className="checklist"><span className="label">Review checklist</span><ol>{(result.reviewChecklist || []).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></div>
    </section>
  )
}

export default function App() {
  const [code, setCode] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const characterCount = useMemo(() => code.length.toLocaleString(), [code.length])

  function loadExample() {
    setCode(EXAMPLE)
    setContext('I changed the search input behavior because the API was firing on every keystroke.')
    setResult(null)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setStatus('loading')
    try {
      const data = await analyzeCode(code, context)
      setResult(data.result)
      setStatus('success')
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar"><a className="brand" href="/" aria-label="Code Context Companion home"><span className="brand-mark">&lt;/&gt;</span><span>Code Context <strong>Companion</strong></span></a><span className="nav-note">For thoughtful code reviews</span></nav>

      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">A clearer way to explain your work</p><h1>Make the <em>why</em> behind your code easy to share.</h1><p className="hero-lede">Paste a diff or a code snippet. Get a concise explanation, engineering rationale, and review checklist you can actually use.</p><div className="trust-row"><span><i className="dot green" /> Backend-only AI</span><span><i className="dot blue" /> No account needed</span><span><i className="dot purple" /> Built for learning</span></div></div>
        <div className="workflow-card"><div className="workflow-step"><span>01</span><div><strong>Paste your change</strong><small>Diff, function, or component</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>02</span><div><strong>Add the context</strong><small>What were you trying to solve?</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>03</span><div><strong>Explain it with confidence</strong><small>Rationale, risks, and talking points</small></div></div></div>
      </section>

      <section className="workspace">
        <form className="input-card" onSubmit={handleSubmit}>
          <div className="card-topline"><div><p className="eyebrow">Your input</p><h2>What changed?</h2></div><button className="text-button" type="button" onClick={loadExample}>Load an example</button></div>
          <label htmlFor="code">Code change or snippet <span>required</span></label><textarea id="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste a git diff, function, or component here..." rows="11" /><div className="field-meta"><span>Keep secrets and credentials out of your input.</span><span>{characterCount} / 12,000</span></div>
          <label htmlFor="context">Why did you make this change? <span>optional, but useful</span></label><textarea id="context" value={context} onChange={(event) => setContext(event.target.value)} placeholder="For example: I wanted to stop the search API from firing on every keystroke." rows="3" /><div className="field-meta"><span>One sentence is enough.</span><span>{context.length} / 800</span></div>
          <button className="primary-button" type="submit" disabled={status === 'loading' || !code.trim()}>{status === 'loading' ? <><span className="spinner" /> Thinking through the change...</> : <>Analyze this change <span>→</span></>}</button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>

        <div className="result-column">
          {!result && status !== 'loading' && <div className="empty-state"><div className="empty-icon">✦</div><p className="eyebrow">Your result will appear here</p><h2>Good explanations start with good context.</h2><p>Code Context Companion helps you move from “this works” to “this works because…”</p></div>}
          {status === 'loading' && <div className="empty-state loading-state"><div className="pulse-icon">✦</div><p className="eyebrow">Reading your change</p><h2>Looking for the engineering story...</h2><p>We are turning implementation details into language you can use.</p></div>}
          <ResultCard result={result} />
        </div>
      </section>

      <footer><span>Code Context Companion</span><span>Understand it. Explain it. Own it.</span></footer>
    </main>
  )
}
