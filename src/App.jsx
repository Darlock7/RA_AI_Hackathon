import { useState } from 'react'

const stages = ['Intake', 'Diagnose', 'Resolve', 'Document']

const transcript = [
  { speaker: 'Customer', time: '00:08', text: 'Our packaging line stopped about twelve minutes ago. The controller is showing a major fault and production is completely down.' },
  { speaker: 'Copilot', time: '00:18', text: 'I found a ControlLogix 5580 at Line 4 in your installed base. Is this the controller showing the fault?' },
  { speaker: 'Customer', time: '00:25', text: 'Yes, catalog 1756-L83E. The display says T01:C61.' },
  { speaker: 'Engineer', time: '00:34', text: 'Thank you. Did this begin after a firmware update, power event, or project download?' },
  { speaker: 'Customer', time: '00:43', text: 'There was a brief power dip. No software changes today.' },
]

const evidence = [
  { id: 'QA-1066255', title: 'ControlLogix 5580 major non-recoverable fault guidance', match: '96%', meta: 'Knowledgebase · Updated 3 months ago' },
  { id: '1756-UM543', title: 'ControlLogix 5580 Controllers User Manual', match: '92%', meta: 'Chapter 3 · Status display diagnostics' },
  { id: 'CASE-78421', title: 'Resolved power-event case on matching catalog family', match: '84%', meta: 'Anonymized resolution record · North America' },
]

const metrics = [
  { label: 'Calls analyzed', value: '12,480', delta: '+8.4%', tone: 'blue' },
  { label: 'Correct first routing', value: '91.6%', delta: '+12.1 pts', tone: 'green' },
  { label: 'After-call work', value: '2m 14s', delta: '-43%', tone: 'orange' },
  { label: 'Knowledge coverage', value: '78.3%', delta: '+6.2 pts', tone: 'violet' },
]

const issueRows = [
  { issue: 'ControlLogix major fault after power event', volume: 286, change: '+31%', coverage: 94 },
  { issue: 'FactoryTalk activation unavailable', volume: 241, change: '+8%', coverage: 88 },
  { issue: 'PowerFlex 525 network timeout', volume: 198, change: '+17%', coverage: 73 },
  { issue: 'Studio 5000 version compatibility', volume: 164, change: '-4%', coverage: 81 },
]

function Icon({ name, size = 18 }) {
  const paths = {
    spark: <><path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/><path d="m5 13-.8 2.2L2 16l2.2.8L5 19l.8-2.2L8 16l-2.2-.8L5 13Z"/></>,
    phone: <path d="M6.6 10.8a15.4 15.4 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.36 2.27.55 3.46.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.55 21 3 13.45 3 4.14a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.36.56 3.46a1 1 0 0 1-.25 1.02L6.6 10.8Z"/>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    building: <><path d="M3 21h18M6 21V5l6-3 6 3v16"/><path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    pulse: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [view, setView] = useState('assist')
  const [stage, setStage] = useState(1)
  const [approved, setApproved] = useState(false)
  const [notice, setNotice] = useState('')

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Icon name="spark" size={21} /></div>
          <div><strong>Context Copilot</strong><span>TechConnect experience concept</span></div>
        </div>
        <nav aria-label="Primary navigation">
          <button className={view === 'assist' ? 'active' : ''} onClick={() => setView('assist')}><Icon name="phone" />Live Assist</button>
          <button className={view === 'insights' ? 'active' : ''} onClick={() => setView('insights')}><Icon name="grid" />Organization Insights</button>
        </nav>
        <div className="operator"><div className="avatar">JM</div><div><strong>Jordan Martinez</strong><span>Control Systems Support</span></div></div>
      </header>

      {view === 'assist' ? (
        <main className="assist-view">
          <section className="call-banner">
            <div className="live-pill"><span /> LIVE CALL · 04:18</div>
            <div className="caller"><strong>Meridian Packaging · Line 4 down</strong><span>TechConnect System Support · Priority 1</span></div>
            <div className="stage-track">
              {stages.map((item, index) => <button key={item} className={index <= stage ? 'complete' : ''} onClick={() => setStage(index)}><span>{index < stage ? <Icon name="check" size={13}/> : index + 1}</span>{item}</button>)}
            </div>
            <button className="end-call" onClick={() => showNotice('Simulation call ended and draft case saved')}>End call</button>
          </section>

          <section className="workspace-grid">
            <aside className="context-column">
              <div className="panel identity-card">
                <div className="panel-title"><span>Customer context</span><span className="verified"><Icon name="shield" size={13}/> Verified</span></div>
                <div className="customer-head"><div className="company-logo">MP</div><div><h2>Meridian Packaging</h2><p>Columbus, Ohio · Site 02</p></div></div>
                <dl className="context-list">
                  <div><dt>TechConnect</dt><dd>System Support · 24×7</dd></div>
                  <div><dt>Authorization</dt><dd>TC-••••-4821</dd></div>
                  <div><dt>Caller</dt><dd>Alex Rivera · Controls Lead</dd></div>
                  <div><dt>Recent cases</dt><dd>2 in the last 90 days</dd></div>
                </dl>
              </div>

              <div className="panel asset-card">
                <div className="panel-title"><span>Matched installed asset</span><span className="confidence">98% match</span></div>
                <div className="asset-icon"><Icon name="building" size={22}/></div>
                <h3>ControlLogix 5580</h3>
                <p>Packaging Line 4 · Main controller</p>
                <div className="asset-tags"><span>1756-L83E</span><span>FW 35.011</span><span>In warranty</span></div>
                <button className="text-button">View installed-base record <Icon name="arrow" size={14}/></button>
              </div>

              <div className="panel extracted-card">
                <div className="panel-title"><span>Call understanding</span><span className="ai-label"><Icon name="spark" size={13}/> AI extracted</span></div>
                <div className="signal"><span>Intent</span><strong>Controller fault</strong></div>
                <div className="signal"><span>Impact</span><strong className="critical">Production stopped</strong></div>
                <div className="signal"><span>Fault</span><strong>T01:C61</strong></div>
                <div className="signal"><span>Trigger</span><strong>Power event</strong></div>
              </div>
            </aside>

            <section className="conversation-column panel">
              <div className="panel-title conversation-title"><div><span>Live conversation</span><small>English (US) · Consent captured</small></div><div className="listening"><span/> Listening</div></div>
              <div className="transcript" aria-live="polite">
                {transcript.map((line, index) => (
                  <article className={`utterance ${line.speaker.toLowerCase()}`} key={index}>
                    <div className="speaker-dot">{line.speaker === 'Customer' ? 'AR' : line.speaker === 'Engineer' ? 'JM' : <Icon name="spark" size={14}/>}</div>
                    <div><div className="utterance-meta"><strong>{line.speaker}</strong><span>{line.time}</span></div><p>{line.text}</p></div>
                  </article>
                ))}
                <div className="typing"><span/><span/><span/> Copilot is analyzing the power-event context</div>
              </div>
              <div className="next-question">
                <div className="question-label"><Icon name="spark" size={15}/> Suggested next question <span>High information gain</span></div>
                <p>“Before the power event, was the controller’s OK indicator solid green, and is it now solid red or flashing red?”</p>
                <div><button className="primary" onClick={() => showNotice('Question inserted into engineer notes')}><Icon name="check" size={15}/> Use question</button><button className="secondary" onClick={() => showNotice('Alternative question generated')}>Generate alternative</button></div>
              </div>
            </section>

            <aside className="copilot-column">
              <div className="panel diagnosis-card">
                <div className="panel-title"><span>Diagnostic hypothesis</span><span className="confidence high">High confidence</span></div>
                <h3>Power-cycle recovery fault</h3>
                <p>The reported major fault and recent power dip are consistent with a recoverable startup condition, but controller state must be verified before any reset guidance.</p>
                <div className="guardrail"><Icon name="shield" size={17}/><div><strong>Safety gate active</strong><span>No reset or mode change will be suggested until indicator state and process safety are confirmed.</span></div></div>
              </div>

              <div className="panel evidence-card">
                <div className="panel-title"><span>Grounding evidence</span><span>{evidence.length} sources</span></div>
                {evidence.map((item) => <button className="evidence-item" key={item.id} onClick={() => showNotice(`${item.id} opened in evidence preview`)}><div className="source-icon"><Icon name="book" size={17}/></div><div><strong>{item.title}</strong><span>{item.id} · {item.meta}</span></div><b>{item.match}</b></button>)}
              </div>

              <div className={`panel recommendation-card ${approved ? 'approved' : ''}`}>
                <div className="panel-title"><span>Recommended action</span><span className="review-required">Engineer review required</span></div>
                <ol><li>Confirm machine is in a safe state and process interlocks are satisfied.</li><li>Verify the controller OK indicator pattern and capture the full fault log.</li><li>Compare fault timestamp with the recorded facility power event.</li></ol>
                <div className="recommend-actions"><button className="primary" onClick={() => {setApproved(true); showNotice('Recommendation approved for customer guidance')}}>{approved ? <><Icon name="check" size={15}/> Approved</> : 'Approve guidance'}</button><button className="secondary" onClick={() => showNotice('Recommendation opened for editing')}>Edit</button></div>
              </div>
            </aside>
          </section>
        </main>
      ) : (
        <main className="insights-view">
          <section className="insights-heading"><div><span className="eyebrow">Support intelligence</span><h1>Turn every resolved call into organizational learning.</h1><p>An anonymized view of demand, routing performance, knowledge coverage, and emerging product issues.</p></div><div className="range-control"><button>30 days</button><button className="selected">90 days</button><button>12 months</button></div></section>
          <section className="metric-grid">{metrics.map(item => <div className="metric-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small className={item.tone}>{item.delta} vs prior period</small></div>)}</section>
          <section className="insight-grid">
            <div className="panel trend-panel"><div className="panel-title"><div><span>Technical support demand</span><small>Cases by week and resolution channel</small></div><span className="healthy"><Icon name="pulse" size={14}/> Within capacity</span></div><div className="chart" aria-label="Support case trend chart"><div className="y-labels"><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><div className="bars">{[54,62,58,72,67,76,71,84,78,91,86,82].map((height,index)=><div className="bar-stack" key={index}><span style={{height:`${height}%`}}/><i style={{height:`${height*.32}%`}}/><b>W{index+1}</b></div>)}</div></div><div className="legend"><span><i className="phone-legend"/>Phone assisted</span><span><i className="digital-legend"/>Digital/self-service</span></div></div>
            <div className="panel opportunity-panel"><div className="panel-title"><div><span>AI-identified opportunity</span><small>Highest potential impact this period</small></div><Icon name="spark"/></div><div className="opportunity-icon"><Icon name="book" size={25}/></div><h2>Close the PowerFlex network troubleshooting gap</h2><p>27% of repeat PowerFlex 525 network-timeout calls reference three Knowledgebase articles with low successful-resolution signals.</p><div className="impact-row"><div><span>Repeat contacts</span><strong>53</strong></div><div><span>Estimated engineer time</span><strong>41 hrs</strong></div></div><button className="primary" onClick={() => showNotice('Knowledge improvement brief generated')}>Generate improvement brief</button></div>
          </section>
          <section className="panel issue-table"><div className="panel-title"><div><span>Emerging support patterns</span><small>Prioritized by operational impact, not just volume</small></div><button className="secondary">Export brief</button></div><div className="table-head"><span>Issue cluster</span><span>90-day volume</span><span>Change</span><span>Knowledge coverage</span></div>{issueRows.map(row=><div className="table-row" key={row.issue}><strong>{row.issue}</strong><span>{row.volume}</span><span className={row.change.startsWith('+')?'up':'down'}>{row.change}</span><div className="coverage"><i><b style={{width:`${row.coverage}%`}}/></i><span>{row.coverage}%</span></div></div>)}</section>
        </main>
      )}
      {notice && <div className="toast"><Icon name="check" size={16}/>{notice}</div>}
    </div>
  )
}

export default App
