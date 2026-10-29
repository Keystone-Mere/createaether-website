import { defaultClearSpace, type ClearSpace } from './ClearSpace';
import { registerRuntimeCleanup } from '../runtime/RuntimeLifecycle';
export function attachClearSpaceControls(panel: HTMLElement, stage: HTMLElement, get: () => ClearSpace | undefined, set: (value: ClearSpace) => void, suggest: () => ClearSpace) {
    const guide = document.createElement('div'); guide.className = 'clear-space-guide';
    guide.setAttribute('aria-hidden','true'); guide.innerHTML = '<span>Clear space</span>'; (stage.querySelector('.preview-scene') ?? stage).append(guide);
    const advancedPanel = panel.closest<HTMLDetailsElement>('.advanced-scene-tools');
    const outline = panel.querySelector<HTMLInputElement>('[data-clear-outline]')!;
    const options = panel.querySelector<HTMLFieldSetElement>('[data-clear-options]')!;
    function sync() {
        const value = get() ?? suggest();
        panel.querySelectorAll<HTMLInputElement>('[data-clear]').forEach(input => {
            const key = input.dataset.clear as keyof ClearSpace;
            if (key === 'enabled') input.checked = value.enabled;
            else { input.value = String(value[key]); panel.querySelector<HTMLOutputElement>(`[data-clear-value="${key}"]`)!.value = `${value[key]}%`; }
        });
        options.disabled = !value.enabled;
        guide.hidden = !value.enabled || !outline.checked || !panel.hasAttribute('open') || !!(advancedPanel && !advancedPanel.open) || !!document.fullscreenElement;
        Object.assign(guide.style, {left:`${value.x-value.width/2}%`,top:`${value.y-value.height/2}%`,width:`${value.width}%`,height:`${value.height}%`});
    }
    function input(event: Event) {
        if (!(event.target instanceof HTMLInputElement)) return;
        const target = event.target, key = target.dataset.clear as keyof ClearSpace | undefined;
        if (key) {
            const value = { ...(get() ?? suggest() ?? defaultClearSpace) };
            if (key === 'enabled') { value.enabled = target.checked; if (value.enabled) outline.checked = true; }
            else value[key] = Number(target.value);
            set(value);
        }
        sync();
    }
    function reset() { set({ ...suggest(), enabled:get()?.enabled ?? false }); sync(); }
    const resetButton = panel.querySelector<HTMLButtonElement>('[data-clear-reset]')!;
    panel.addEventListener('input',input); resetButton.addEventListener('click',reset);
    panel.addEventListener('toggle',sync);
    advancedPanel?.addEventListener('toggle',sync);
    document.addEventListener('fullscreenchange',sync);
    registerRuntimeCleanup(() => { panel.removeEventListener('input',input); panel.removeEventListener('toggle',sync); advancedPanel?.removeEventListener('toggle',sync); resetButton.removeEventListener('click',reset); document.removeEventListener('fullscreenchange',sync); guide.remove(); });
    sync(); return { sync };
}
