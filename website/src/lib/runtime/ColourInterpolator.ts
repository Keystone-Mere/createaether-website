export interface RgbColour {
    r: number;
    g: number;
    b: number;
}

export class ColourInterpolator {
    private static clamp(
        value: number
    ): number {
        return Math.min(
            255,
            Math.max(
                0,
                Math.round(value)
            )
        );
    }

    public static hexToRgb(
        colour: string
    ): RgbColour {
        const hex =
            colour.replace('#', '');

        const normalised =
            hex.length === 3
                ? hex
                    .split('')
                    .map(
                        (character) =>
                            character + character
                    )
                    .join('')
                : hex;

        return {
            r: parseInt(
                normalised.slice(0, 2),
                16
            ),
            g: parseInt(
                normalised.slice(2, 4),
                16
            ),
            b: parseInt(
                normalised.slice(4, 6),
                16
            )
        };
    }

    public static rgbToHex(
        colour: RgbColour
    ): string {
        const toHex = (
            value: number
        ) =>
            this.clamp(value)
                .toString(16)
                .padStart(2, '0');

        return (
            '#' +
            toHex(colour.r) +
            toHex(colour.g) +
            toHex(colour.b)
        );
    }

    public static lerp(
        from: number,
        to: number,
        progress: number
    ): number {
        return (
            from +
            (to - from) * progress
        );
    }

    public static interpolate(
        from: string,
        to: string,
        progress: number
    ): string {
        const start =
            this.hexToRgb(from);

        const end =
            this.hexToRgb(to);

        return this.rgbToHex({
            r: this.lerp(
                start.r,
                end.r,
                progress
            ),
            g: this.lerp(
                start.g,
                end.g,
                progress
            ),
            b: this.lerp(
                start.b,
                end.b,
                progress
            )
        });
    }
}
