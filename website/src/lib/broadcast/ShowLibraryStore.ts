const KEY = 'aether:podcast-library:v1';
export interface SavedShow<T> { id: string; name: string; settings: T; logo: string; }
export function createShowStore<T>(storage: Pick<Storage, 'getItem' | 'setItem'>, validate: (value: unknown) => T, validLogo: (value: unknown) => boolean) {
    function project(value: unknown): { settings: T; logo: string } {
        if (!value || typeof value !== 'object') throw new Error('Invalid show backup.');
        const v = value as Record<string, unknown>;
        if (typeof v.logo !== 'string' || (v.logo !== '' && !validLogo(v.logo))) throw new Error('Invalid show logo.');
        return { settings: validate(v.settings), logo: v.logo };
    }
    function name(value: unknown): string {
        if (typeof value !== 'string') throw new Error('Enter a show name.');
        const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
        if (!clean) throw new Error('Enter a show name.');
        return clean;
    }
    function read(): SavedShow<T>[] {
        const raw = storage.getItem(KEY);
        if (raw === null) return [];
        const data = JSON.parse(raw);
        if (data?.v !== 1 || !Array.isArray(data.shows) || data.shows.length > 30) throw new Error('Saved shows could not be read. Your current show is still available.');
        const ids = new Set<string>();
        return data.shows.map((s: SavedShow<T>) => {
            if (!s || typeof s.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(s.id) || ids.has(s.id)) throw new Error('Invalid saved shows.');
            ids.add(s.id);
            return { id: s.id, name: name(s.name), ...project(s) };
        });
    }
    function write(shows: SavedShow<T>[]) {
        // Commit storage before the UI reports success; quota failures leave old data intact.
        storage.setItem(KEY, JSON.stringify({ v: 1, shows }));
    }
    function save(title: string, value: unknown, id?: string): SavedShow<T> {
        const shows = read();
        const index = id ? shows.findIndex(s => s.id === id) : -1;
        if (id && index < 0) throw new Error('This show was removed in another tab. Save a new copy.');
        if (!id && shows.length >= 30) throw new Error('You can save up to 30 shows. Back up and remove an older show first.');
        const result = { id: id ?? crypto.randomUUID(), name: name(title), ...project(value) };
        if (index >= 0) shows[index] = result; else shows.unshift(result);
        write(shows); return result;
    }
    return {
        read, save,
        remove(id: string) { write(read().filter(s => s.id !== id)); },
        rename(id: string, title: string) {
            const s = read().find(s => s.id === id);
            if (!s) throw new Error('This show is no longer available.');
            return save(title, s, id);
        },
        backup(title: string, value: unknown) { return JSON.stringify({ type: 'aether-show-backup', v: 1, name: name(title), ...project(value) }, null, 2); },
        importBackup(raw: string) {
            if (raw.length > 250000) throw new Error('Choose an Aether show backup smaller than 250 KB.');
            const data = JSON.parse(raw);
            if (data?.type !== 'aether-show-backup' || data.v !== 1) throw new Error('Choose an Aether show backup, rather than an OBS collection.');
            return save(name(data.name), data);
        },
    };
}
