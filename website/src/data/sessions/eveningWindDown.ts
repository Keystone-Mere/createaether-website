/** Guidance is content; the scene engine does not need to know these timings. */
export const eveningWindDown = {
  durationSeconds: 300,
  cues: [
    { at: 0, title: 'Arrive', text: 'Find a comfortable position. Let your breathing settle into its own rhythm.' },
    { at: 30, title: 'Settle', text: 'Notice where your body is supported. Allow your shoulders and jaw to soften.' },
    { at: 75, title: 'Notice', text: 'Rest your attention on the garden. Notice the warm lanterns and the space around them.' },
    { at: 120, title: 'Make space', text: 'There is nothing to solve here. If your thoughts wander, gently return to the scene.' },
    { at: 180, title: 'Rest', text: 'Spend a little time simply watching and listening. Breathe comfortably, without forcing it.' },
    { at: 255, title: 'Return', text: 'Notice the room around you again. Move your hands gently, and take your time returning.' },
  ],
} as const;

export function cueAt(seconds: number) {
  return [...eveningWindDown.cues].reverse().find(cue => seconds >= cue.at) ?? eveningWindDown.cues[0];
}
