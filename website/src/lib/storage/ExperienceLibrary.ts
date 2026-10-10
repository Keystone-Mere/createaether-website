import { isExperience, normalizeExperience, cloneExperience } from '../models/ExperienceFormat';
// Compatibility export for existing editor integrations.
export { isExperience } from '../models/ExperienceFormat';
import type {
    Experience
} from '../models/Experience';

const STORAGE_KEY =
    'aether.studio.experiences.v1';

const EDITING_STORAGE_KEY =
    'aether.studio.editing-experience.v1';


function readLibrary(): Experience[] {
    try {
        const stored =
            localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return [];
        }

        const parsed: unknown =
            JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter(isExperience)
            .map(normalizeExperience);
    } catch {
        return [];
    }
}

/** Reading a newer-format save must not cause an older app to erase it. */
function preserveUnreadableEntries(experiences: Experience[]): unknown[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return experiences;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new TypeError('Unrecognised saved library format.');
    const unreadable = parsed.filter(value => !isExperience(value));
    const ids = new Set(experiences.map(value => value.id));
    if (unreadable.some(value => value && typeof value === 'object' && ids.has(value.id))) {
        throw new TypeError('Cannot overwrite an unsupported saved experience.');
    }
    return [...experiences, ...unreadable];
}

function writeLibrary(
    experiences: Experience[]
): boolean {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(preserveUnreadableEntries(experiences))
        );

        return true;
    } catch {
        return false;
    }
}

export class ExperienceLibrary {
    public list(): Experience[] {
        return readLibrary();
    }

    public get(
        id: string
    ): Experience | null {
        const experience =
            readLibrary().find(
                (item) => item.id === id
            );

        return experience
            ? cloneExperience(experience)
            : null;
    }

    public save(
        experience: Experience
    ): boolean {
        if (!isExperience(experience)) {
            return false;
        }

        const library =
            readLibrary();

        const savedExperience =
            normalizeExperience(experience);

        const existingIndex =
            library.findIndex(
                (item) =>
                    item.id === savedExperience.id
            );

        if (existingIndex >= 0) {
            library[existingIndex] =
                savedExperience;
        } else {
            library.push(savedExperience);
        }

        return writeLibrary(library);
    }

    public remove(
        id: string
    ): boolean {
        const library =
            readLibrary();

        const nextLibrary =
            library.filter(
                (item) => item.id !== id
            );

        if (
            nextLibrary.length ===
            library.length
        ) {
            return false;
        }

        return writeLibrary(nextLibrary);
    }

    public rename(
        id: string,
        name: string
    ): boolean {
        const nextName =
            name.trim();

        if (!nextName) {
            return false;
        }

        const library =
            readLibrary();

        const experience =
            library.find(
                (item) => item.id === id
            );

        if (!experience) {
            return false;
        }

        experience.name = nextName;

        return writeLibrary(library);
    }

    public duplicate(
        id: string
    ): Experience | null {
        const library =
            readLibrary();

        const source =
            library.find(
                (item) => item.id === id
            );

        if (!source) {
            return null;
        }

        const copy =
            cloneExperience(source);

        copy.id =
            `${source.id}-${Date.now()}`;

        const baseName =
            source.name
                .replace(/ Copy(?: \d+)?$/, '');

        const existingNames =
            new Set(
                library.map(
                    (item) => item.name
                )
            );

        let copyNumber = 1;
        let copyName =
            `${baseName} Copy`;

        while (
            existingNames.has(copyName)
        ) {
            copyNumber += 1;
            copyName =
                `${baseName} Copy ${copyNumber}`;
        }

        copy.name = copyName;

        library.push(copy);

        if (!writeLibrary(library)) {
            return null;
        }

        return cloneExperience(copy);
    }

    public stageForEditing(
        experience: Experience
    ): boolean {
        if (!isExperience(experience)) {
            return false;
        }

        try {
            sessionStorage.setItem(
                EDITING_STORAGE_KEY,
                JSON.stringify(
                    normalizeExperience(experience)
                )
            );

            return true;
        } catch {
            return false;
        }
    }

    public consumeStaged(): Experience | null {
        try {
            const stored =
                sessionStorage.getItem(
                    EDITING_STORAGE_KEY
                );

            if (!stored) {
                return null;
            }

            sessionStorage.removeItem(
                EDITING_STORAGE_KEY
            );

            const parsed: unknown =
                JSON.parse(stored);

            return isExperience(parsed)
                ? normalizeExperience(parsed)
                : null;
        } catch {
            sessionStorage.removeItem(
                EDITING_STORAGE_KEY
            );

            return null;
        }
    }
}
