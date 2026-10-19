import { validateBroadcast, isLogo, broadcastBackgrounds, type BroadcastSettings } from './BroadcastSettings';
import { createShowStore } from './ShowLibraryStore';
export function attachShowLibrary(getCurrent: () => { settings: BroadcastSettings; logo: string }, open: (project: { settings: BroadcastSettings; logo: string }) => void, download: (content: string, name: string, type: string) => void) {
    // Delay localStorage access so unavailable storage cannot prevent the editor loading.
    const store = createShowStore({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }, validateBroadcast, isLogo);
    const list = document.querySelector<HTMLElement>('#saved-shows')!;
    const status = document.querySelector<HTMLElement>('#shows-status')!;
    const title = document.querySelector<HTMLInputElement>('#saved-show-name')!;
    const update = document.querySelector<HTMLButtonElement>('#show-update')!;
    let selected = '';
    let baseline = JSON.stringify(getCurrent());
    function attempt(action: () => void) {
        try { action(); }
        catch (e) { status.textContent = e instanceof Error && e.name !== 'QuotaExceededError' ? e.message : 'Shows could not be saved. Browser storage may be unavailable or full. Download a backup to keep your work.'; }
    }
    function render() {
        const shows = store.read();
        list.replaceChildren();
        if (!shows.length) { const p = document.createElement('p'); p.textContent = 'No named shows yet. Save your current design to begin.'; list.append(p); }
        for (const show of shows) {
            const card = document.createElement('article'); card.className = 'saved-show-card';
            const asset = broadcastBackgrounds.find(a => a.id === show.settings.background);
            const image = document.createElement('img'); image.src = asset!.src; image.alt = ''; image.loading = 'lazy';
            const heading = document.createElement('h3'); heading.textContent = show.name;
            const details = document.createElement('p'); details.textContent = `${asset!.name} · ${show.settings.layout === 'solo' ? 'One host' : show.settings.layout === 'duo' ? 'Two people' : 'No frames'}`;
            const actions = document.createElement('div'); actions.className = 'saved-show-actions';
            function button(label: string, action: () => void) {
                const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-label', `${label} ${show.name}`); b.addEventListener('click', () => attempt(action)); actions.append(b);
            }
            button('Open', () => {
                if (JSON.stringify(getCurrent()) !== baseline && !window.confirm('Open this saved show? Unsaved changes to the current draft will be replaced. Choose Cancel to save or download a backup first.')) return;
                open(show); selected = show.id; title.value = show.name; baseline = JSON.stringify(getCurrent()); update.disabled = false;
                status.textContent = `Opened “${show.name}”. Changes stay in your draft until you choose Update saved show.`;
            });
            button('Duplicate', () => { const copy = store.save(`${show.name.slice(0, 72)} (copy)`, show); render(); status.textContent = `Saved “${copy.name}”. Your current draft is unchanged.`; });
            button('Rename', () => { const next = window.prompt('New saved show name', show.name); if (next === null) return; const saved = store.rename(show.id, next); if (selected === show.id) title.value = saved.name; render(); status.textContent = 'Show renamed.'; });
            button('Delete', () => { if (!window.confirm(`Delete saved show “${show.name}”? Your current draft stays in the editor. Download a backup first if needed.`)) return; store.remove(show.id); if (selected === show.id) { selected = ''; update.disabled = true; } render(); status.textContent = 'Saved show deleted. Your current draft is unchanged.'; });
            card.append(image, heading, details, actions); list.append(card);
        }
    }
    document.querySelector('#show-save-new')!.addEventListener('click', () => attempt(() => {
        const saved = store.save(title.value, getCurrent()); selected = saved.id; title.value = saved.name; baseline = JSON.stringify(getCurrent()); update.disabled = false; render(); status.textContent = `Saved “${saved.name}”.`;
    }));
    update.addEventListener('click', () => attempt(() => {
        if (!selected) return;
        store.save(title.value, getCurrent(), selected); baseline = JSON.stringify(getCurrent()); render(); status.textContent = 'Saved show updated.';
    }));
    document.querySelector('#show-backup')!.addEventListener('click', () => attempt(() => {
        download(store.backup(title.value || getCurrent().settings.show || 'My show', getCurrent()), 'aether-show-backup.json', 'application/json'); status.textContent = 'Current draft backup downloaded, including its logo. Keep this file to restore your show.';
    }));
    const input = document.querySelector<HTMLInputElement>('#show-import')!;
    input.addEventListener('change', async () => {
        const file = input.files?.[0]; if (!file) return;
        try {
            if (file.size > 250000) throw new Error('Choose an Aether show backup smaller than 250 KB.');
            const raw = await file.text();
            attempt(() => { const saved = store.importBackup(raw); render(); status.textContent = `Imported “${saved.name}” as a new saved show. Select Open to use it.`; });
        } catch (e) { status.textContent = e instanceof Error ? e.message : 'Backup could not be opened.'; }
        finally { input.value = ''; }
    });
    window.addEventListener('storage', e => { if (e.key === 'aether:podcast-library:v1' || e.key === null) attempt(render); });
    attempt(render);
}
