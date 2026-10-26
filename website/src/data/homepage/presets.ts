import temple from './homepage-temple-01.aether.json';
import snow from './homepage-snowcabin-01.aether.json';
import beach from './homepage-beach01.aether.json';
import bamboo from './homepage-bamboo-rain01.aether.json';
import type { Experience } from '../../lib/models/Experience';
const presets: Record<string, unknown> = { 'incense-hall': temple, 'snow-cabin': snow, 'beach-bonfire': beach, 'bamboo-rain-pavilion': bamboo };
export function homepagePreset(id: string | null): Experience | undefined {
  return id && presets[id] ? structuredClone(presets[id]) as Experience : undefined;
}
