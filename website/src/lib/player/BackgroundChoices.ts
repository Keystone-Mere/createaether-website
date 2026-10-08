/** Bundled choices use known local assets, never arbitrary imported URLs. */
export const backgroundChoices = [
    { id: 'temple-mountain', sceneId: 'temple', name: 'Mountain temple', src: '/images/experience-covers/temple-mountain.jpg' },
    { id: 'temple-angkor', sceneId: 'temple', name: 'Angkor-inspired sanctuary (AI)', src: '/images/experience-covers/temple-angkor.jpg' },
    { id: 'forest-stream', sceneId: 'forest', name: 'Fern grotto (AI)', src: '/images/experience-covers/forest-fern-grotto.png' },
    { id: 'forest-dusk', sceneId: 'forest', name: 'Redwood sanctuary (AI)', src: '/images/experience-covers/forest-redwood-sanctuary.png' },
    { id: 'ocean-cove', sceneId: 'ocean', name: 'Turquoise cove (AI)', src: '/images/experience-covers/ocean-cove.png' },
    { id: 'ocean-atlantic', sceneId: 'ocean', name: 'Atlantic coast (AI)', src: '/images/experience-covers/ocean-atlantic.png' },
    { id: 'christmas-fireside', sceneId: 'christmas', name: 'Snowy forest retreat (AI)', src: '/images/experience-covers/christmas-forest-retreat.png' },
    { id: 'christmas-village', sceneId: 'christmas', name: 'Christmas conservatory (AI)', src: '/images/experience-covers/christmas-conservatory.png' },
    { id: 'festival-woodland', sceneId: 'festival', name: 'Woodland festival (AI)', src: '/images/experience-covers/festival-woodland.png' },
    { id: 'festival-waterfront', sceneId: 'festival', name: 'Waterfront festival (AI)', src: '/images/experience-covers/festival-waterfront.png' },
    { id: 'storm-city', sceneId: 'storm', name: 'Rainy city terrace (AI)', src: '/images/experience-covers/storm-city.png' },
    { id: 'storm-coast', sceneId: 'storm', name: 'Coastal storm shelter (AI)', src: '/images/experience-covers/storm-coast.png' },
] as const;

export function isBackgroundId(value: unknown): value is string {
    return typeof value === 'string' && backgroundChoices.some(choice => choice.id === value);
}

export function backgroundSource(experience: { id: string; sceneId?: string; background?: string; backgroundId?: string }): string {
    if (experience.background) return experience.background;
    const choice = backgroundChoices.find(choice => choice.id === experience.backgroundId);
    if (choice) return choice.src;
    const scene = experience.sceneId ?? experience.id.split('-')[0];
    const covers: Record<string, string> = { temple:'temple', forest:'forest', ocean:'ocean', christmas:'christmas', storm:'storm-balcony', festival:'festival-evening' };
    return `/images/experience-covers/${covers[scene] ?? 'temple'}.jpg`;
}
