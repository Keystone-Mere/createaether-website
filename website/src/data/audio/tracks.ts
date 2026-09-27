import type { AudioTrack } from '../../lib/models/AudioTrack';

export const audioTracks: AudioTrack[] = [
  {
    id: 'om-so-hum',
    title: 'OM SO HUM',
    description: 'A continuous meditative soundscape.',
    src: '/audio/om-so-hum.mp3',
    loop: true,
  },
  {
    id: 'temple-echoes',
    title: 'Temple Echoes',
    description: 'A meditative temple soundscape.',
    src: '/audio/temple-echoes.mp3',
    layerSrc: '/audio/wind.mp3',
    layerTitle: 'Wind',
    loop: true,
  },
  {
    id: 'forest-ambience',
    title: 'Forest Wind',
    description: 'Woodland wind with optional gentle rain.',
    src: '/audio/forest_wind.mp3',
    layerSrc: '/audio/forest_rain.mp3',
    layerTitle: 'Rain',
    loop: true,
  },
  {
    id: 'ocean-waves',
    title: 'Ocean Ambient',
    description: 'A spacious coastal soundscape.',
    src: '/audio/ocean-ambient.mp3',
    layerSrc: '/audio/seagulls.mp3',
    layerTitle: 'Seagulls',
    loop: true,
  },
  {
    id: 'christmas-ambient',
    title: 'Ambient Christmas',
    description: 'A warm seasonal soundscape.',
    src: '/audio/ambient-christmas.mp3',
    layerSrc: '/audio/fireplace.mp3',
    layerTitle: 'Fireplace',
    loop: true,
  },
  {
  id: 'festival',
  title: 'Carnival',
  description: 'An energetic celebratory soundscape for the Festival experience.',
  src: '/audio/carnival.mp3',
  layerSrc: '/audio/crowd.mp3',
  layerTitle: 'Crowd',
  loop: true,
  },
  {
    id: 'storm',
    title: 'Rain and Thunder',
    description: 'Rainfall and distant thunder for the Storm experience.',
    src: '/audio/rain-thunder.mp3',
    layerSrc: '/audio/thunder.mp3',
    layerTitle: 'Thunder',
    loop: true,
  },
];

export const defaultAudioTrack = audioTracks[0];
