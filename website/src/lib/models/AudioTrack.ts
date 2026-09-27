export interface AudioTrack {
    id: string;
    title: string;
    description: string;
    src: string;
    loop: boolean;
    layerSrc?: string;
    layerTitle?: string;
}
