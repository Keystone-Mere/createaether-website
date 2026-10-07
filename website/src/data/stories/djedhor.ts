import temple from '../experiences/temple.json';
import type { Experience } from '../../lib/models/Experience';
import type { StoryScene } from '../../lib/story/StorySequence';
const atmosphere = (id: string, illustrated = false): Experience => ({
  ...structuredClone(temple) as Experience, id, name: "Djedhor’s Journey", status: 'Prototype',
  audio: { enabled: false, volume: 20, layerVolume: 0, track: 'temple-echoes' },
  atmosphere: { particles: false, lighting: illustrated, fog: false },
  environment: { colour: '#17202c' },
  lighting: { preset: 'story-gold', colour: '#dfb86d', intensity: .3, pulse: false, speed: .2 },
  transition: { duration: 700, easing: 'ease-in-out' }
});
export const djedhorScenes: StoryScene[] = [
  {
    id: 'meet', title: 'Meet Djedhor’s scroll',
    caption: 'This Book of the Dead belonged to Djed-hor. Buried rolled up around 2,300 years ago, it was excavated at Hissaya in 1905. A Book of the Dead is a collection of spells intended to help its owner in the afterlife. Let’s explore one of its ideas, then return to the real object.',
    image: '/images/museum-lab/djedhor-display.jpeg', imageAlt: 'Museum display containing the real Book of the Dead papyrus and interpretation panels.',
    imageCredit: 'Photograph of the museum display. Independent educational prototype.', aspectRatio: '4 / 3', experience: atmosphere('djedhor-meet')
  },
  {
    id: 'judgement', title: 'A heart in the balance',
    caption: 'Ancient Egyptians believed the heart could be weighed against the feather of Maat, representing truth and order. This judgement scene is associated with spell 125. Reveal the illustration and explore three details. This is a belief about the afterlife, rather than an event we can observe.',
    image: '/images/museum-lab/djedhor-interpretation.png', imageAlt: 'AI interpretation of a heart-weighing scene, with Anubis beside scales holding a heart and a feather.',
    imageCredit: 'AI-generated interpretation, not an exact reproduction or translation of Djed-hor’s papyrus.', aspectRatio: '2048 / 754', experience: atmosphere('djedhor-judgement', true)
  },
  {
    id: 'return', title: 'Return to the real object',
    caption: 'Now look at the real papyrus in the display. What can you recognise, and what differs from the illustration? The museum object is the evidence; our illustration is a way to explore an idea. If you are in the gallery, look closely at the scroll and its labels. Which detail would you like to investigate next?',
    image: '/images/museum-lab/djedhor-display.jpeg', imageAlt: 'The real papyrus displayed in a glass museum case below interpretation panels.',
    imageCredit: 'Photograph of the museum display. Compare the illustration with the actual object.', aspectRatio: '4 / 3', experience: atmosphere('djedhor-return')
  }
];
export const djedhorDetails = [
  { name: 'Anubis', x: 46, y: 45, text: 'Anubis, shown with a jackal head, takes part in the weighing of the heart. In the museum’s account of spell 125, Anubis and Horus weigh the heart against Maat.' },
  { name: 'The heart', x: 64, y: 61, text: 'The heart is placed on one side of the balance. In this ancient Egyptian belief, the weighing judges whether the deceased can enter the afterlife.' },
  { name: 'The feather', x: 91, y: 60, text: 'The feather represents Maat: truth and order. The heart is weighed against it. Look for the scales and feather in the real object or the museum’s interpretation panels.' }
];
