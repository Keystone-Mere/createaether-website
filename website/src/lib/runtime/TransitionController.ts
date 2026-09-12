export interface TransitionOptions {
    from: number;
    to: number;
    duration: number;

    onUpdate(
        value: number
    ): void;

    onComplete?(): void;
}

export class TransitionController {
    private frameId: number | null = null;

    public animate(
        options: TransitionOptions
    ): void {
        this.cancel();

        const duration =
            Math.max(0, options.duration);

        if (duration === 0) {
            options.onUpdate(
                options.to
            );

            options.onComplete?.();

            return;
        }

        const startTime =
            performance.now();

        const distance =
            options.to - options.from;

        const tick = (
            currentTime: number
        ) => {
            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(
                    1,
                    elapsed / duration
                );

            // Ease-out cubic
            const eased =
                1 - Math.pow(
                    1 - progress,
                    3
                );

            options.onUpdate(
                options.from +
                distance * eased
            );

            if (progress < 1) {
                this.frameId =
                    requestAnimationFrame(
                        tick
                    );

                return;
            }

            this.frameId = null;

            options.onComplete?.();
        };

        this.frameId =
            requestAnimationFrame(
                tick
            );
    }

    public cancel(): void {
        if (this.frameId !== null) {
            cancelAnimationFrame(
                this.frameId
            );

            this.frameId = null;
        }
    }
}
