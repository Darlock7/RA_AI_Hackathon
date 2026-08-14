export const demoScript = {
  opening: 'Hello Juan. This is the Rockwell Automation TechConnect Context Copilot demo. I understand your packaging line may be down. In one sentence, please tell me what is happening.',
  questions: [
    {
      id: 'issue',
      prompt: 'Thank you. I found a ControlLogix 5580 associated with Packaging Line 4. What fault code do you see on the controller display?',
      fallback: 'I did not catch the fault code. Please say it one more time, slowly.',
    },
    {
      id: 'trigger',
      prompt: 'Got it. Did the issue begin after a power event, firmware update, or project download?',
      fallback: 'Please tell me whether this followed a power event, firmware update, or project download.',
    },
    {
      id: 'safety',
      prompt: 'Before we continue, is the machine in a safe state and are personnel clear of moving equipment?',
      fallback: 'For safety, please answer yes or no. Is the machine in a safe state?',
    },
  ],
  completion: 'Thank you. I created a priority one case with the asset, fault, and event context. A Control Systems support engineer will receive the full transcript and evidence before joining. For this demo, no controller reset or mode change will be recommended automatically. Goodbye.',
}

