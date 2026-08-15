const has = (text, terms) => terms.some((term) => text.includes(term))

export function analyzeContext(transcript = []) {
  const customerText = transcript.filter((item) => item.speaker === 'Customer').map((item) => item.text).join(' ').toLowerCase()
  const fault = customerText.match(/(?:t\s*\d+\s*[: -]\s*c\s*\d+|\d{4}[- ]l\d{2}e)/i)?.[0]?.replace(/\s/g, '').toUpperCase() || null
  const productionStopped = has(customerText, ['line stopped', 'production stopped', 'completely down', 'line is down', 'not running'])
  const powerEvent = has(customerText, ['power dip', 'power event', 'power outage', 'lost power', 'brownout'])
  const firmwareChange = has(customerText, ['firmware update', 'updated firmware', 'flash update'])
  const projectDownload = has(customerText, ['project download', 'downloaded the project', 'logic download'])
  const safeYes = has(customerText, ['machine is safe', 'safe state', 'personnel are clear', 'everyone is clear'])
  const unsafe = has(customerText, ['not safe', 'personnel nearby', 'someone is inside', 'moving equipment'])
  const indicatorRed = has(customerText, ['solid red', 'flashing red', 'blinking red'])
  const indicatorGreen = has(customerText, ['solid green', 'green light'])

  const trigger = powerEvent ? 'Power event' : firmwareChange ? 'Firmware update' : projectDownload ? 'Project download' : null
  const safety = unsafe ? 'Unsafe or unconfirmed' : safeYes ? 'Confirmed safe by caller' : 'Not yet confirmed'
  const confidence = [productionStopped, fault, trigger, safety !== 'Not yet confirmed'].filter(Boolean).length / 4

  let hypothesis = 'Controller fault requires additional context'
  let rationale = 'The reported symptoms are not yet specific enough for a grounded recommendation.'
  if (powerEvent && fault) {
    hypothesis = 'Startup fault associated with a power event'
    rationale = 'The fault code and reported power interruption make controller state and fault-log timing the highest-value checks.'
  } else if (firmwareChange) {
    hypothesis = 'Firmware compatibility or update-state issue'
    rationale = 'The issue followed a firmware change, so controller revision and project compatibility should be verified.'
  } else if (projectDownload) {
    hypothesis = 'Post-download configuration or mode issue'
    rationale = 'The issue followed a project download, so change history and controller state should be reviewed.'
  }

  return { productionStopped, fault, trigger, safety, indicatorRed, indicatorGreen, confidence, hypothesis, rationale }
}

export function selectNextQuestion(context) {
  if (!context.productionStopped) return { id: 'impact', prompt: 'Is production stopped, degraded, or still running normally?', reason: 'Establish operational impact and routing priority.' }
  if (!context.fault) return { id: 'fault', prompt: 'What exact fault code or message appears on the controller display?', reason: 'A precise fault identifier narrows the evidence search.' }
  if (!context.trigger) return { id: 'trigger', prompt: 'Did this begin after a power event, firmware update, or project download?', reason: 'The initiating event changes the diagnostic path.' }
  if (context.safety === 'Not yet confirmed') return { id: 'safety', prompt: 'Before we continue, is the machine in a safe state and are personnel clear of moving equipment?', reason: 'Safety must be confirmed before troubleshooting guidance.' }
  if (context.safety === 'Unsafe or unconfirmed') return { id: 'complete', prompt: 'I will pause troubleshooting and prepare an immediate engineer handoff because the machine is not confirmed safe.', reason: 'Unsafe conditions stop automated troubleshooting.' }
  if (!context.indicatorRed && !context.indicatorGreen) return { id: 'indicator', prompt: 'What pattern is shown by the controller OK indicator: solid green, solid red, or flashing red?', reason: 'Indicator state helps distinguish fault severity and the safe next check.' }
  return { id: 'complete', prompt: 'I have enough context to prepare the engineer handoff. Is there any other change immediately before the issue?', reason: 'Capture final change context before routing.' }
}

export function buildSummary(session) {
  const context = analyzeContext(session.transcript)
  const customerAnswers = session.transcript.filter((item) => item.speaker === 'Customer').map((item) => item.text)
  return {
    priority: context.productionStopped ? 'P1 — Production stopped' : 'Priority pending impact confirmation',
    product: 'ControlLogix 5580 · Packaging Line 4',
    customerStatement: customerAnswers[0] || 'Not captured',
    fault: context.fault || 'Not captured',
    trigger: context.trigger || 'Not determined',
    safetyConfirmation: context.safety,
    hypothesis: context.hypothesis,
    confidence: Math.round(context.confidence * 100),
    nextAction: context.safety === 'Confirmed safe by caller'
      ? 'Route to Control Systems support with transcript, fault context and cited evidence.'
      : 'Hold troubleshooting guidance until an engineer reconfirms machine safety.',
  }
}
