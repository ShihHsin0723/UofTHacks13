import './App.css'

function App() {
  const highlights = [
    'Clean slate—no starter clutter',
    'Lightweight, responsive layout',
    'Friendly typography and spacing',
  ]

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Frontend starter</p>
        <h1>Build your next idea here.</h1>
        <p className="lede">
          A simple, uncluttered canvas with just enough structure to begin
          designing. Drop in your components and make it your own.
        </p>
        <div className="actions">
          <a className="button primary" href="#">
            Start a flow
          </a>
          <a className="button ghost" href="#">
            Browse components
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow muted">Ready to customize</p>
            <h2>What&apos;s included</h2>
          </div>
          <span className="tag">No boilerplate logos</span>
        </div>
        <div className="pill-list">
          {highlights.map((item) => (
            <span className="pill" key={item}>
              {item}
            </span>
          ))}
        </div>
        <p className="hint">
          Edit <code>src/App.jsx</code> and <code>src/App.css</code> to keep
          refining the look and feel.
        </p>
      </section>
    </main>
  )
}

export default App
