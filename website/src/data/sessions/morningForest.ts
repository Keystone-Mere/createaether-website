/** A five-minute morning practice; timings are independent of scene effects. */
export const morningForest = {
  durationSeconds: 300,
  cues: [
    { at: 0, title: 'Arrive', text: 'Find a comfortable position. Let the woodland be somewhere to pause before your day begins.' },
    { at: 35, title: 'Settle', text: 'Notice the support beneath you. Let your shoulders soften and breathe in your own comfortable rhythm.' },
    { at: 80, title: 'Notice', text: 'Rest your gaze on the moss and the light between the trees. There is no need to look for anything in particular.' },
    { at: 135, title: 'Make space', text: 'If plans or worries appear, let them wait for a moment. Gently return your attention to the woodland.' },
    { at: 195, title: 'Choose an intention', text: 'What would you like to bring to today? Perhaps patience, curiosity or a little kindness towards yourself.' },
    { at: 260, title: 'Begin gently', text: 'Notice the room around you. Move your hands gently and carry your intention with you when you are ready.' },
  ],
} as const;

export function cueAt(seconds: number) {
  return [...morningForest.cues].reverse().find(cue => seconds >= cue.at) ?? morningForest.cues[0];
}
