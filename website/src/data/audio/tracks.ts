import { audioSource } from '../assets/SceneRegistry';
import type { AudioTrack } from '../../lib/models/AudioTrack';

export const audioTracks: AudioTrack[] = [
  { id: 'retreat-wind', title: 'Gentle woodland wind', description: 'A quiet natural soundscape for the cabin.', src: audioSource('forest_wind'), loop: true },
  { id: 'retreat-rain', title: 'Gentle rain', description: 'Steady woodland rain without thunder.', src: audioSource('forest_rain'), loop: true },
  {
    id: 'om-so-hum',
    title: 'OM SO HUM',
    description: 'A continuous meditative soundscape.',
    src: audioSource('om-so-hum'),
    loop: true,
  },
  {
    id: 'temple-echoes',
    title: 'Temple Echoes',
    description: 'A meditative temple soundscape.',
    src: audioSource('temple-echoes'),
    layerSrc: audioSource('wind'),
    layerTitle: 'Wind',
    loop: true,
  },
  {
    id: 'forest-ambience',
    title: 'Forest Wind',
    description: 'Woodland wind with optional gentle rain.',
    src: audioSource('forest_wind'),
    layerSrc: audioSource('forest_rain'),
    layerTitle: 'Rain',
    loop: true,
  },
  {
    id: 'ocean-waves',
    title: 'Ocean Ambient',
    description: 'A spacious coastal soundscape.',
    src: audioSource('ocean-ambient'),
    layerSrc: audioSource('seagulls'),
    layerTitle: 'Seagulls',
    loop: true,
  },
  {
    id: 'christmas-ambient',
    title: 'Ambient Christmas',
    description: 'A warm seasonal soundscape.',
    src: audioSource('ambient-christmas'),
    layerSrc: audioSource('fireplace'),
    layerTitle: 'Fireplace',
    loop: true,
  },
  {
  id: 'festival',
  title: 'Carnival',
  description: 'An energetic celebratory soundscape for the Festival experience.',
  src: audioSource('carnival'),
  layerSrc: audioSource('crowd'),
  layerTitle: 'Crowd',
  loop: true,
  },
  {
    id: 'storm',
    title: 'Rain and Thunder',
    description: 'Rainfall and distant thunder for the Storm experience.',
    src: audioSource('rain-thunder'),
    layerSrc: audioSource('thunder'),
    layerTitle: 'Thunder',
    loop: true,
  },
];

export const defaultAudioTrack = audioTracks.find(track => track.id === 'om-so-hum')!;
