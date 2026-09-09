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
    loop: true,
  },
  {
    id: 'forest-ambience',
    title: 'Deep Forest',
    description: 'A layered woodland soundscape.',
    src: '/audio/deep-forest.mp3',
    loop: true,
  },
  {
    id: 'ocean-waves',
    title: 'Ocean Ambient',
    description: 'A spacious coastal soundscape.',
    src: '/audio/ocean-ambient.mp3',
    loop: true,
  },
  {
    id: 'christmas-ambient',
    title: 'Ambient Christmas',
    description: 'A warm seasonal soundscape.',
    src: '/audio/ambient-christmas.mp3',
    loop: true,
  },
  {
    id: 'storm',
    title: 'Rain and Thunder',
    description: 'Rainfall and distant thunder for the Storm experience.',
    src: '/audio/rain-thunder.mp3',
    loop: true,
  },
];

export const defaultAudioTrack = audioTracks[0];
