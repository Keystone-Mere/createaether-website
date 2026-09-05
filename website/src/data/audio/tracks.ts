import type { AudioTrack } from '../../lib/models/AudioTrack';

export const audioTracks: AudioTrack[] = [
    {
        id: 'om-so-hum',
        title: 'OM SO HUM',
        description: 'A continuous meditative soundscape for the runtime preview.',
        src: '/audio/om-so-hum.mp3',
        loop: true,
    },
    {
        id: 'forest-ambience',
        title: 'Deep Forest',
        description: 'A natural woodland soundscape for the Forest experience.',
        src: '/audio/deep-forest.mp3',
        loop: true,
    },
    {
        id: 'ocean-waves',
        title: 'Ocean Ambient',
        description: 'A calming coastal soundscape for the Ocean experience.',
        src: '/audio/ocean-ambient.mp3',
        loop: true,
    },
    {
        id: 'christmas-ambience',
        title: 'Ambient Christmas',
        description: 'A festive atmospheric soundscape for the Christmas experience.',
        src: '/audio/ambient-christmas.mp3',
        loop: true,
    },
];

export const defaultAudioTrack = audioTracks[0];