/** Bundled choices use known local assets, never arbitrary imported URLs. */
export const backgroundChoices = [
    { id: 'temple-mountain', sceneId: 'temple', name: 'Mountain temple', src: '/images/experience-covers/temple-mountain.jpg' },
    { id: 'temple-angkor', sceneId: 'temple', name: 'Angkor-inspired sanctuary (AI)', src: '/images/experience-covers/temple-angkor.jpg' },
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
