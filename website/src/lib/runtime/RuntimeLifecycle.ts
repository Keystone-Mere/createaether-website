/** One owner for browser lifecycle hooks; returned cleanup is safe to repeat. */
export function registerRuntimeCleanup(
    cleanup: () => void,
    page: EventTarget = window,
    navigation: EventTarget = document
): () => void {
    let destroyed = false;
    const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        page.removeEventListener('pagehide', destroy);
        navigation.removeEventListener('astro:before-swap', destroy);
        cleanup();
    };
    page.addEventListener('pagehide', destroy, { once: true });
    navigation.addEventListener('astro:before-swap', destroy, { once: true });
    return destroy;
}
