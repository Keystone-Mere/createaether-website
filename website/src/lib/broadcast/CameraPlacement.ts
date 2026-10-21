import { type CameraFrame, type CameraLayouts } from './CameraGeometry';
import { broadcastFraming, type BroadcastSettings, type Layout, type BroadcastBackground } from './BroadcastSettings';
export interface CameraPlacement {label:string;x:number;y:number;width:number;height:number;}
/** Coordinates for a 1920 × 1080 canvas; matches BroadcastStage's percentage layout. */
export function cameraPlacement(layout:Layout, background?:BroadcastBackground, custom?:CameraLayouts):CameraPlacement[] {
 if(layout==='background')return [];
 if(custom?.[layout]) return custom[layout]!.map((frame,index)=>({label:index?'Guest':'Host',x:frame.x+16,y:frame.y+9,width:frame.width-32,height:(frame.width-32)*9/16}));
 const canvasWidth=1920,canvasHeight=1080;
 const left=canvasWidth*(layout==='duo'?.05:.21);
 const top=canvasHeight*(broadcastFraming(background)==='presenter-safe'?.32:layout==='duo'?.30:.23);
 const groupWidth=canvasWidth*(layout==='duo'?.90:.58);
 const gap=layout==='duo'?groupWidth*.03:0;
 const outerWidth=layout==='duo'?(groupWidth-gap)/2:groupWidth;
 // Preserve 16:9 and leave a small inset so cameras do not cover the frame border.
 const width=Math.floor((outerWidth-32)/16)*16;
 const height=width*9/16;
 const y=Math.round(top+(outerWidth*9/16-height)/2);
 return (layout==='duo'?['Host','Guest']:['Host']).map((label,index)=>({label,x:Math.round(left+index*(outerWidth+gap)+(outerWidth-width)/2),y,width,height}));
}

/** Outer frames, including the border and camera inset. Legacy defaults stay unchanged. */
export function cameraFrames(settings: BroadcastSettings): CameraFrame[] {
    if (settings.layout === 'background') return [];
    const custom = settings.cameraLayouts?.[settings.layout];
    if (custom) return custom.map(frame => ({ ...frame }));
    const duo = settings.layout === 'duo';
    const width = 1920 * (duo ? .90 : .58);
    const gap = duo ? width * .03 : 0;
    const outer = duo ? (width - gap) / 2 : width;
    return (duo ? [0, 1] : [0]).map(index => ({ x: 1920 * (duo ? .05 : .21) + index * (outer + gap), y: 1080 * (broadcastFraming(settings.background) === 'presenter-safe' ? .32 : duo ? .30 : .23), width: outer }));
}
