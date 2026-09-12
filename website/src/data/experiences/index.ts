import type { Experience } from '../../lib/models/Experience';

import temple from './temple.json';
import forest from './forest.json';
import ocean from './ocean.json';
import christmas from './christmas.json';
import storm from './storm.json';

export interface ExperienceLibraryItem extends Experience {
  href: string;
}

export const experiences: ExperienceLibraryItem[] = [
  {
    ...temple,
    href: '/studio/experiences/temple/',
  },
  {
    ...forest,
    href: '/studio/experiences/forest/',
  },
  {
    ...ocean,
    href: '/studio/experiences/ocean/',
  },
  {
    ...christmas,
    href: '/studio/experiences/christmas/',
  },
  {
    ...storm,
    href: '/studio/experiences/storm/',
  },
];