export interface CanvasRenderFrame {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    pixelRatio: number;
    elapsedTime: number;
    deltaTime: number;
}

export type CanvasRenderCallback = (
    frame: CanvasRenderFrame
) => void;

export interface CanvasRenderable {
    readonly id: string;

    render(
        frame: CanvasRenderFrame
    ): void;
}

export class CanvasRenderer {
    public readonly version = '0.18.0';

    private readonly context:
        CanvasRenderingContext2D;

    private readonly resizeObserver:
        ResizeObserver | null;

    private animationFrameId:
        number | null = null;

    private renderCallback:
        CanvasRenderCallback | null = null;

    private readonly renderables =
        new Map<string, CanvasRenderable>();

    private running = false;
    private destroyed = false;

    private startTime = 0;

    private previousTime = 0;

    private width = 0;

    private height = 0;

    private pixelRatio = 1;

    constructor(
        private readonly canvas: HTMLCanvasElement
    ) {
        const context =
            canvas.getContext('2d');

        if (!context) {
            throw new Error(
                'CanvasRenderer requires a two-dimensional canvas context.'
            );
        }

        this.context = context;

        this.resizeObserver =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(
                    () => this.resize()
                )
                : null;

        this.resizeObserver?.observe(
            this.canvas
        );

        this.resize();
    }

    public setRenderCallback(
        callback: CanvasRenderCallback | null
    ): void {
        this.renderCallback = callback;
    }

    public register(
        renderable: CanvasRenderable
    ): () => void {
        if (
            !renderable ||
            typeof renderable.id !== 'string' ||
            renderable.id.trim() === '' ||
            typeof renderable.render !== 'function'
        ) {
            throw new TypeError(
                'Canvas renderables must provide an id and render method.'
            );
        }

        if (this.renderables.has(renderable.id)) {
            throw new Error(
                `Canvas renderable "${renderable.id}" is already registered.`
            );
        }

        this.renderables.set(
            renderable.id,
            renderable
        );

        return () => {
            this.unregister(renderable.id);
        };
    }

    public unregister(
        renderableId: string
    ): boolean {
        return this.renderables.delete(
            renderableId
        );
    }

    public has(
        renderableId: string
    ): boolean {
        return this.renderables.has(
            renderableId
        );
    }

    public count(): number {
        return this.renderables.size;
    }

    public start(): void {
        if (this.destroyed || this.running) {
            return;
        }

        this.running = true;

        const now = performance.now();

        this.startTime = now;
        this.previousTime = now;

        this.animationFrameId =
            requestAnimationFrame(
                this.renderFrame
            );
    }

    public stop(): void {
        if (!this.running) {
            return;
        }

        this.running = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(
                this.animationFrameId
            );

            this.animationFrameId = null;
        }
    }

    public resize(): void {
        const bounds =
            this.canvas.getBoundingClientRect();

        const width =
            Math.max(1, Math.round(bounds.width));

        const height =
            Math.max(1, Math.round(bounds.height));

        const pixelRatio =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        const bufferWidth =
            Math.round(width * pixelRatio);

        const bufferHeight =
            Math.round(height * pixelRatio);

        if (
            this.canvas.width !== bufferWidth ||
            this.canvas.height !== bufferHeight
        ) {
            this.canvas.width = bufferWidth;
            this.canvas.height = bufferHeight;
        }

        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;

        this.context.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );
    }

    public clear(): void {
        this.context.clearRect(
            0,
            0,
            this.width,
            this.height
        );
    }

    public isRunning(): boolean {
        return this.running;
    }

    public getCanvas():
        HTMLCanvasElement {
        return this.canvas;
    }

    public getContext():
        CanvasRenderingContext2D {
        return this.context;
    }

    public destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.stop();

        this.resizeObserver?.disconnect();

        this.renderCallback = null;

        this.renderables.clear();

        this.clear();
    }

    private readonly renderFrame = (
        currentTime: number
    ): void => {
        if (!this.running) {
            return;
        }

        const elapsedTime =
            currentTime - this.startTime;

        const deltaTime =
            Math.min(
                currentTime - this.previousTime,
                100
            );

        this.previousTime = currentTime;

        this.clear();

        const frame: CanvasRenderFrame = {
            context: this.context,
            width: this.width,
            height: this.height,
            pixelRatio: this.pixelRatio,
            elapsedTime,
            deltaTime
        };

        this.renderCallback?.(frame);

        this.renderables.forEach(
            (renderable) => {
                renderable.render(frame);
            }
        );

        if (this.running && !this.destroyed) {
            this.animationFrameId = requestAnimationFrame(this.renderFrame);
        }
    };
}
