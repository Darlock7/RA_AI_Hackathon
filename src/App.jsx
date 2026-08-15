import { useEffect, useState } from 'react'
import { analyzeContext, buildSummary, selectNextQuestion } from '../server/context-engine.mjs'

const stages = ['Intake', 'Diagnose', 'Resolve', 'Document']

const demoScenarios = {
  power: {
    label: 'Power event',
    answers: ['Our packaging line is completely down after a brief power dip.', 'The controller display says T01:C61.', 'The machine is safe and personnel are clear.', 'The OK indicator is flashing red.'],
  },
  firmware: {
    label: 'Firmware update',
    answers: ['The line is down after we updated the controller firmware.', 'The display shows T02:C14.', 'The machine is safe and personnel are clear.', 'The OK indicator is solid red.'],
  },
  download: {
    label: 'Project download',
    answers: ['Production stopped immediately after a project download.', 'The display shows T03:C22.', 'The machine is safe and everyone is clear.', 'The OK indicator is flashing red.'],
  },
  unsafe: {
    label: 'Safety not confirmed',
    answers: ['The line is down after a power outage.', 'The display says T01:C61.', 'The machine is not safe and personnel are nearby.'],
  },
}

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
  const [demoCall, setDemoCall] = useState({ status: 'idle', callSid: '', error: '' })
  const [phoneTranscript, setPhoneTranscript] = useState([])
  const [caseSummary, setCaseSummary] = useState(null)
  const [callContext, setCallContext] = useState(null)
  const [nextQuestion, setNextQuestion] = useState(null)
  const [demoPanel, setDemoPanel] = useState(false)
  const [scenarioKey, setScenarioKey] = useState('power')
  const [typedResponse, setTypedResponse] = useState('')
  const [welcomeOpen, setWelcomeOpen] = useState(true)

  useEffect(() => {
    if (!demoCall.callSid) return undefined
    const refresh = async () => {
      const response = await fetch(`/api/voice/session/${demoCall.callSid}`)
      if (!response.ok) return
      const session = await response.json()
      setPhoneTranscript(session.transcript || [])
      setCaseSummary(session.summary || null)
      setCallContext(session.context || null)
      setNextQuestion(session.nextQuestion || null)
      setDemoCall((current) => ({ ...current, status: session.status || current.status }))
    }
    refresh()
    const timer = window.setInterval(refresh, 1500)
    return () => window.clearInterval(timer)
  }, [demoCall.callSid])

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const startDemoCall = async () => {
    setPhoneTranscript([])
    setDemoCall({ status: 'starting', callSid: '', error: '' })
    try {
      const response = await fetch('/api/voice/call', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to start the call')
      setDemoCall({ status: data.status || 'queued', callSid: data.callSid, error: '' })
      showNotice('Demo call started — your verified phone should ring shortly')
    } catch (error) {
      setDemoCall({ status: 'error', callSid: '', error: error.message })
    }
  }

  const updateDemoContext = (lines) => {
    const context = analyzeContext(lines)
    setPhoneTranscript(lines)
    setCallContext(context)
    setNextQuestion(selectNextQuestion(context))
    setCaseSummary(buildSummary({ transcript: lines }))
    setStage(context.safety === 'Not yet confirmed' ? 1 : 2)
  }

  const runGuidedDemo = () => {
    const scenario = demoScenarios[scenarioKey]
    const lines = []
    scenario.answers.forEach((answer, index) => {
      lines.push({ speaker: 'Customer', text: answer })
      const context = analyzeContext(lines)
      const question = selectNextQuestion(context)
      if (index < scenario.answers.length - 1) lines.push({ speaker: 'Copilot', text: question.prompt })
    })
    updateDemoContext(lines)
    showNotice(`${scenario.label} scenario loaded — no credentials required`)
  }

  const submitTypedResponse = (event) => {
    event.preventDefault()
    const answer = typedResponse.trim()
    if (!answer) return
    const existing = phoneTranscript.length ? phoneTranscript : []
    const withAnswer = [...existing, { speaker: 'Customer', text: answer }]
    const question = selectNextQuestion(analyzeContext(withAnswer))
    const lines = question.id === 'complete' ? withAnswer : [...withAnswer, { speaker: 'Copilot', text: question.prompt }]
    updateDemoContext(lines)
    setTypedResponse('')
  }

  const visibleTranscript = phoneTranscript.length
    ? phoneTranscript.map((line, index) => ({ ...line, time: `LIVE ${String(index + 1).padStart(2, '0')}` }))
    : transcript

  const handoff = caseSummary || {
    priority: 'P1 — Production stopped',
    product: 'ControlLogix 5580 · Packaging Line 4',
    customerStatement: 'Packaging line stopped after a brief power dip. Controller reports a major fault.',
    fault: 'T01:C61',
    trigger: 'Facility power event; no firmware update or project download reported.',
    safetyConfirmation: 'Machine safe state must be reconfirmed before guidance.',
    nextAction: 'Route to Control Systems support with transcript and grounded evidence.',
  }

  const openHandoff = () => {
    setStage(3)
    setView('handoff')
    showNotice('Prepared case is ready for engineer handoff')
  }

  return (
    <div className="app-shell">
      {welcomeOpen && <div className="welcome-overlay"><section className="welcome-card"><div className="brand-mark"><Icon name="spark" size={24}/></div><span className="eyebrow">Rockwell Automation TechConnect concept</span><h1>See how one support call becomes an engineer-ready case.</h1><p>Run a credential-free scenario to watch the copilot extract context, choose the next question, enforce safety gates and prepare the handoff.</p><div className="welcome-flow"><span>Listen</span><i/><span>Understand</span><i/><span>Ground</span><i/><span>Handoff</span></div><div className="welcome-actions"><button className="primary" onClick={() => {setWelcomeOpen(false);setDemoPanel(true);window.setTimeout(runGuidedDemo,0)}}><Icon name="spark" size={16}/>Start guided demo</button><button className="secondary" onClick={() => setWelcomeOpen(false)}>Explore interface</button></div><small>Synthetic data only · No credentials or phone configuration required</small></section></div>}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Icon name="spark" size={21} /></div>
          <div><strong>Context Copilot</strong><span>TechConnect experience concept</span></div>
        </div>
        <nav aria-label="Primary navigation">
          <button className={view === 'assist' ? 'active' : ''} onClick={() => setView('assist')}><Icon name="phone" />Live Assist</button>
          <button className={view === 'handoff' ? 'active' : ''} onClick={() => setView('handoff')}><Icon name="check" />Case Handoff</button>
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
            <div className="demo-call-actions">
              <button className="demo-lab-button" onClick={() => setDemoPanel((open) => !open)}><Icon name="spark" size={15}/>Demo lab</button>
              <button className="start-call" onClick={startDemoCall} disabled={demoCall.status === 'starting'}><Icon name="phone" size={15}/>{demoCall.status === 'starting' ? 'Calling…' : 'Call my phone'}</button>
              <button className="end-call" onClick={openHandoff}>End call</button>
            </div>
          </section>

          {demoPanel && <section className="demo-lab panel">
            <div className="demo-lab-copy"><span className="eyebrow">Credential-free evaluation</span><strong>Test the context engine without Twilio.</strong><small>Choose a repeatable scenario or type the next customer response.</small></div>
            <label>Scenario<select value={scenarioKey} onChange={(event) => setScenarioKey(event.target.value)}>{Object.entries(demoScenarios).map(([key,item]) => <option value={key} key={key}>{item.label}</option>)}</select></label>
            <button className="guided-demo" onClick={runGuidedDemo}><Icon name="spark" size={15}/>Run guided demo</button>
            <form onSubmit={submitTypedResponse}><input value={typedResponse} onChange={(event) => setTypedResponse(event.target.value)} placeholder="Type a customer response…"/><button type="submit">Send</button></form>
            <button className="reset-demo" onClick={() => {setPhoneTranscript([]);setCallContext(null);setNextQuestion(null);setCaseSummary(null)}}>Reset</button>
          </section>}

          {demoCall.error && <div className="call-error"><Icon name="shield" size={16}/><span><strong>Phone demo needs configuration.</strong> {demoCall.error}</span></div>}

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
                <div className="signal"><span>Impact</span><strong className="critical">{callContext?.productionStopped === false ? 'Confirming' : 'Production stopped'}</strong></div>
                <div className="signal"><span>Fault</span><strong>{callContext?.fault || 'T01:C61'}</strong></div>
                <div className="signal"><span>Trigger</span><strong>{callContext?.trigger || 'Power event'}</strong></div>
              </div>
            </aside>

            <section className="conversation-column panel">
              <div className="panel-title conversation-title"><div><span>Live conversation</span><small>English (US) · Consent captured</small></div><div className="listening"><span/> Listening</div></div>
              <div className="transcript" aria-live="polite">
                {visibleTranscript.map((line, index) => (
                  <article className={`utterance ${line.speaker.toLowerCase()}`} key={index}>
                    <div className="speaker-dot">{line.speaker === 'Customer' ? 'AR' : line.speaker === 'Engineer' ? 'JM' : <Icon name="spark" size={14}/>}</div>
                    <div><div className="utterance-meta"><strong>{line.speaker}</strong><span>{line.time}</span></div><p>{line.text}</p></div>
                  </article>
                ))}
                <div className="typing"><span/><span/><span/> Copilot is analyzing the power-event context</div>
              </div>
              <div className="next-question">
                <div className="question-label"><Icon name="spark" size={15}/> Suggested next question <span>High information gain</span></div>
                <p>“{nextQuestion?.prompt || 'Before the power event, was the controller’s OK indicator solid green, and is it now solid red or flashing red?'}”</p>
                {nextQuestion?.reason && <small className="question-reason">Why now: {nextQuestion.reason}</small>}
                <div><button className="primary" onClick={() => showNotice('Question inserted into engineer notes')}><Icon name="check" size={15}/> Use question</button><button className="secondary" onClick={() => showNotice('Alternative question generated')}>Generate alternative</button></div>
              </div>
            </section>

            <aside className="copilot-column">
              <div className="panel diagnosis-card">
                <div className="panel-title"><span>Diagnostic hypothesis</span><span className="confidence high">{callContext ? `${Math.round(callContext.confidence * 100)}% context` : 'High confidence'}</span></div>
                <h3>{callContext?.hypothesis || 'Power-cycle recovery fault'}</h3>
                <p>{callContext?.rationale || 'The reported major fault and recent power dip make controller state and fault-log timing the highest-value checks.'}</p>
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
                <button className="handoff-cta" onClick={openHandoff}>Prepare engineer handoff <Icon name="arrow" size={14}/></button>
              </div>
            </aside>
          </section>
        </main>
      ) : view === 'handoff' ? (
        <main className="handoff-view">
          <section className="handoff-heading">
            <div><span className="eyebrow">Prepared case · TC-2026-08421</span><h1>The engineer starts with context, not questions.</h1><p>Customer, asset, evidence and safety information are assembled for review before transfer.</p></div>
            <div className="handoff-actions"><button className="secondary" onClick={() => setView('assist')}>Back to call</button><button className="primary" onClick={() => showNotice('Case routed to Control Systems Support')}>Route to engineer <Icon name="arrow" size={14}/></button></div>
          </section>
          <section className="handoff-status">
            <div><span>Priority</span><strong className="priority-value">{handoff.priority}</strong></div>
            <div><span>Recommended queue</span><strong>Control Systems Support</strong></div>
            <div><span>Entitlement</span><strong>System Support · 24×7</strong></div>
            <div><span>Handoff readiness</span><strong className="ready-value"><Icon name="check" size={14}/> Ready for review</strong></div>
          </section>
          <section className="handoff-grid">
            <div className="handoff-main">
              <article className="panel case-brief">
                <div className="panel-title"><span>Engineer brief</span><span className="ai-label"><Icon name="spark" size={13}/> AI prepared</span></div>
                <div className="brief-hero"><div className="asset-monogram">CL</div><div><h2>{handoff.product}</h2><p>Meridian Packaging · Columbus, Ohio · Site 02</p></div></div>
                <dl className="brief-grid">
                  <div className="wide"><dt>Customer statement</dt><dd>{handoff.customerStatement}</dd></div>
                  <div><dt>Fault captured</dt><dd>{handoff.fault}</dd></div>
                  <div><dt>Likely trigger</dt><dd>{handoff.trigger}</dd></div>
                  <div className="wide"><dt>Recommended next action</dt><dd>{handoff.nextAction}</dd></div>
                  {handoff.hypothesis && <div className="wide"><dt>Working hypothesis</dt><dd>{handoff.hypothesis} · {handoff.confidence}% context completeness</dd></div>}
                </dl>
              </article>
              <article className="panel handoff-transcript">
                <div className="panel-title"><span>Call transcript</span><span>{visibleTranscript.length} captured turns</span></div>
                <div className="compact-transcript">{visibleTranscript.map((line,index)=><div key={index}><strong>{line.speaker}</strong><p>{line.text}</p></div>)}</div>
              </article>
            </div>
            <aside className="handoff-side">
              <article className="panel safety-review">
                <div className="panel-title"><span>Safety review</span><span className="review-required">Confirmation required</span></div>
                <div className="safety-content"><Icon name="shield" size={24}/><div><strong>Human approval remains mandatory</strong><p>{handoff.safetyConfirmation}</p></div></div>
                <label><input type="checkbox"/> Engineer reconfirmed safe state</label>
                <label><input type="checkbox"/> Evidence reviewed before guidance</label>
              </article>
              <article className="panel handoff-evidence">
                <div className="panel-title"><span>Grounding package</span><span>{evidence.length} sources</span></div>
                {evidence.map(item=><div className="handoff-source" key={item.id}><Icon name="book" size={17}/><div><strong>{item.id}</strong><span>{item.title}</span></div><b>{item.match}</b></div>)}
              </article>
              <article className="panel unresolved-card">
                <div className="panel-title"><span>Open item</span><span className="confidence">1 question</span></div>
                <p>Confirm the controller OK-indicator pattern before any recovery guidance.</p>
              </article>
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
