import storm from '../experiences/storm.json';
import type { Experience } from '../../lib/models/Experience';
import type { StoryScene } from '../../lib/story/StorySequence';
function atmosphere(id: string, rain = 0): Experience {
  const base = structuredClone(storm) as Experience;
  return { ...base, id: `bardsey-${id}`, name: 'Bardsey: Before the Storm',
    description: 'A coastal learning journey using a real photograph of Bardsey.', status: 'Prototype',
    smoke: { enabled: false, amount: 0 },
    audio: { enabled: false, volume: rain ? 24 : 20, layerVolume: 0, track: rain ? 'storm' : 'ocean-waves' },
    atmosphere: { particles: rain > 0, lighting: false, fog: false },
    particles: { ...base.particles, count: rain, preset: 'storm-rain', motion: 'rain' },
    transition: { duration: 1800, easing: 'ease-in-out' }
  };
}
const chapter = (id: string, title: string, caption: string, _image: string, rain = 0, nextLabel = 'Continue →'): StoryScene => ({
  assetId: ['shelter','storm','clearing','notebook'].includes(id) ? 'bardsey-shelter' : 'bardsey-coast',
  id, title, caption, label: id === 'trail' ? 'EXPLORE & NOTICE' : 'WEATHER WATCH', nextLabel,
  image: '/images/bardsey/bardsey-eirian-evans.jpg', imageAlt: 'Photograph taken on Bardsey showing a grassy hillside, island buildings, fields and the sea.',
  imageCredit: 'Bardsey Island — Eirian Evans, 19 May 2019, CC BY-SA 2.0. Weather and shelter are simulated overlays.',
  aspectRatio: '4 / 3', experience: atmosphere(id, rain)
});
export const bardseyScenes: StoryScene[] = [
  chapter('trail', 'A sunny day on Ynys Enlli', 'Welcome to Bardsey, also called Ynys Enlli. This is a real view photographed on the island. Below the view are three separate wildlife photographs. Look for pink flower clusters, a straight orange-red bill and a curved red bill. Select each field-guide discovery to learn its name. These examples were photographed elsewhere, not in this island scene.', 'sunny', 0, 'Watch the weather change →'),
  chapter('clouds', 'A change in the air', 'Clouds spread across the sky and the light fades. Imagine the wind strengthening and the sea becoming rougher. What has changed since the first scene? Our fictional guide calls the group to shelter before the storm arrives.', 'clouds', 0, 'Follow the guide into shelter →'),
  chapter('shelter', 'Watching from shelter', 'Imagine watching this same coast from a shelter. The frame is a fictional shelter overlay, not a building photographed at this viewpoint. Rain begins outside. Notice how the shelter changes what you can see. Stay here with the guide as the weather builds.', 'storm', 70, 'Watch the storm build →'),
  chapter('storm', 'The storm at its strongest', 'Rain sweeps across the opening and the coast looks darker. Listen, if you wish, to the rain and thunder. Which clues suggest the weather has become more intense? You can choose a gentler storm at any time.', 'storm', 190, 'Watch the storm ease →'),
  chapter('clearing', 'The weather begins to clear', 'The rain eases and the sky brightens. We remain in shelter while our guide checks conditions. Brighter skies alone do not tell us it is time to leave. Think back: which changes did you see, and which discoveries did you make?', 'clearing', 0, 'Open your field notebook →'),
  chapter('notebook', 'Your island field notebook', 'You explored three examples of coastal wildlife and watched a fictional storm approach, build and pass. Tell someone one feature that helps you recognise each species, and two things that changed in the weather.', 'clearing')
];
export const bardseyDetails = [
  { name: 'Thrift', x: 24, y: 77, text: 'Look for clusters of pink flowers on thin stems. Thrift grows on Ynys Enlli and is described by the island trust. This reference photograph was taken in France. A real identification also needs a close look at the leaves.' },
  { name: 'Oystercatcher', x: 74, y: 67, text: 'Look for black-and-white plumage and a long orange-red bill. Oystercatchers occur on Ynys Enlli. This reference photograph was taken in Germany. Compare this bird’s straight bill with the curved bill of the chough.' },
  { name: 'Chough', x: 48, y: 48, text: 'Look for dark plumage, red legs and a curved red bill. Choughs occur on Ynys Enlli. This close-up reference photograph shows a captive chough in Devon. It helps you study the bill; red legs are another feature to look for in a full view.' }
];
