import type {
    Experience
} from '../models/Experience';

const STORAGE_KEY =
    'aether.studio.experiences.v1';

const EDITING_STORAGE_KEY =
    'aether.studio.editing-experience.v1';

function cloneExperience(
    experience: Experience
): Experience {
    return {
        ...experience,

        audio: {
            ...experience.audio
        },

        atmosphere: {
            ...experience.atmosphere
        },

        lighting: {
            ...experience.lighting
        },

        fog: {
            ...experience.fog
        },

        particles: {
            ...experience.particles
        },

        transition: {
            ...experience.transition
        }
    };
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isExperience(
    value: unknown
): value is Experience {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.id === 'string' &&
        value.id.trim() !== '' &&
        typeof value.name === 'string' &&
        value.name.trim() !== '' &&
        typeof value.description === 'string' &&
        typeof value.status === 'string' &&
        isRecord(value.audio) &&
        isRecord(value.atmosphere) &&
        isRecord(value.lighting) &&
        isRecord(value.fog) &&
        isRecord(value.particles) &&
        isRecord(value.transition)
    );
}

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
            .map(cloneExperience);
    } catch {
        return [];
    }
}

function writeLibrary(
    experiences: Experience[]
): boolean {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(experiences)
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
            cloneExperience(experience);

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
                    cloneExperience(experience)
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
                ? cloneExperience(parsed)
                : null;
        } catch {
            sessionStorage.removeItem(
                EDITING_STORAGE_KEY
            );

            return null;
        }
    }
}
