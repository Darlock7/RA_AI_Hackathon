import 'dotenv/config'
import express from 'express'
import twilio from 'twilio'
import { demoScript } from './demo-script.mjs'

const app = express()
const port = Number(process.env.VOICE_SERVER_PORT || 8787)
const sessions = new Map()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const xml = (res, twiml) => res.type('text/xml').send(twiml.toString())
const publicUrl = (path) => `${process.env.PUBLIC_BASE_URL?.replace(/\/$/, '')}${path}`

function requireConfig() {
  const keys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'DEMO_PHONE_NUMBER', 'PUBLIC_BASE_URL']
  return keys.filter((key) => !process.env[key])
}

function sayAndListen(response, prompt, step) {
  const gather = response.gather({
    input: 'speech',
    action: publicUrl(`/api/voice/respond?step=${step}`),
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 5,
    actionOnEmptyResult: true,
  })
  gather.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, prompt)
}

app.get('/api/voice/health', (_req, res) => {
  const missing = requireConfig()
  res.json({ ready: missing.length === 0, missing })
})

app.post('/api/voice/call', async (_req, res) => {
  const missing = requireConfig()
  if (missing.length) return res.status(400).json({ error: `Missing configuration: ${missing.join(', ')}` })

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const call = await client.calls.create({
      to: process.env.DEMO_PHONE_NUMBER,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: publicUrl('/api/voice/answer'),
      statusCallback: publicUrl('/api/voice/status'),
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })
    sessions.set(call.sid, { callSid: call.sid, status: call.status, transcript: [], summary: null })
    res.json({ callSid: call.sid, status: call.status })
  } catch (error) {
    res.status(502).json({ error: error.message })
  }
})

app.post('/api/voice/answer', (req, res) => {
  const response = new twilio.twiml.VoiceResponse()
  const callSid = req.body.CallSid
  if (!sessions.has(callSid)) sessions.set(callSid, { callSid, status: 'in-progress', transcript: [], summary: null })
  sessions.get(callSid).transcript.push({ speaker: 'Copilot', text: demoScript.opening })
  sayAndListen(response, demoScript.opening, 0)
  xml(res, response)
})

app.post('/api/voice/respond', (req, res) => {
  const response = new twilio.twiml.VoiceResponse()
  const callSid = req.body.CallSid
  const session = sessions.get(callSid) || { callSid, status: 'in-progress', transcript: [], summary: null }
  sessions.set(callSid, session)

  const step = Number(req.query.step || 0)
  const speech = String(req.body.SpeechResult || '').trim()
  const confidence = Number(req.body.Confidence || 0)

  if (!speech) {
    const retryPrompt = step === 0 ? 'I did not hear a response. Please briefly describe the problem on the line.' : demoScript.questions[step - 1]?.fallback
    sayAndListen(response, retryPrompt || 'Please repeat your response.', step)
    return xml(res, response)
  }

  session.transcript.push({ speaker: 'Customer', text: speech, confidence })

  if (step < demoScript.questions.length) {
    const prompt = demoScript.questions[step].prompt
    session.transcript.push({ speaker: 'Copilot', text: prompt })
    sayAndListen(response, prompt, step + 1)
    return xml(res, response)
  }

  const answers = session.transcript.filter((item) => item.speaker === 'Customer').map((item) => item.text)
  session.summary = {
    priority: 'P1 — Production stopped',
    product: 'ControlLogix 5580 · Packaging Line 4',
    customerStatement: answers[0] || 'Not captured',
    fault: answers[1] || 'Not captured',
    trigger: answers[2] || 'Not captured',
    safetyConfirmation: answers[3] || 'Not captured',
    nextAction: 'Route to Control Systems support with transcript and grounded evidence.',
  }
  session.transcript.push({ speaker: 'Copilot', text: demoScript.completion })
  response.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, demoScript.completion)
  response.hangup()
  xml(res, response)
})

app.post('/api/voice/status', (req, res) => {
  const session = sessions.get(req.body.CallSid)
  if (session) session.status = req.body.CallStatus
  res.sendStatus(204)
})

app.get('/api/voice/session/:callSid', (req, res) => {
  const session = sessions.get(req.params.callSid)
  if (!session) return res.status(404).json({ error: 'Call session not found' })
  res.json(session)
})

app.listen(port, () => {
  const missing = requireConfig()
  console.log(`Voice demo server listening on http://localhost:${port}`)
  if (missing.length) console.log(`Configuration needed: ${missing.join(', ')}`)
})

