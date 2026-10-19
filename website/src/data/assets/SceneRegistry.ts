import type { EffectBoundary } from '../scenes/EffectBoundaryTypes';
export interface AssetCredit {
  status: 'documented' | 'review-needed';
  creator?: string; sourceUrl?: string; licence?: string; licenceUrl?: string; note?: string;
}
export interface SceneAsset {
  id: string; name: string; src: string; sceneId?: SceneId;
  /** Existing CSS treatment; independent of the owning Studio scene. */
  visualScene: string; aspectRatio: string;
  role: 'original' | 'alternative' | 'story' | 'broadcast';
  provenance: 'photograph' | 'illustration' | 'unverified';
  credit: AssetCredit;
  geometry: { status: 'existing' | 'measured' | 'outdoor' | 'none'; particles: EffectBoundary | null };
}
export const sceneDefinitions = [
  { id:'desert', defaultAssetId:'desert', defaultAudioTrackId:'desert-wind' },
  { id:'temple', defaultAssetId:'temple', defaultAudioTrackId:'temple-echoes' },
  { id:'forest', defaultAssetId:'forest', defaultAudioTrackId:'forest-ambience' },
  { id:'ocean', defaultAssetId:'ocean', defaultAudioTrackId:'ocean-waves' },
  { id:'christmas', defaultAssetId:'christmas', defaultAudioTrackId:'christmas-ambient' },
  { id:'storm', defaultAssetId:'storm', defaultAudioTrackId:'storm' },
  { id:'festival', defaultAssetId:'festival', defaultAudioTrackId:'festival' },
  { id:'retreat', defaultAssetId:'retreat', defaultAudioTrackId:'retreat-wind' },
] as const;
export type SceneId = typeof sceneDefinitions[number]['id'];
const unverified: AssetCredit = { status:'review-needed', note:'Existing bundled asset. Creator, source and usage terms have not been supplied in this source archive.' };
export const legacyEffectBoundaries = {
  retreat: { kind: 'rectangle', x: .133, y: .079, width: .744, height: .611 },
  // Coastal image: exclude the left stone wall, overhead beam, bench and shelter floor.
  'storm-coast': {
    kind: 'polygons',
    polygons: [[[.10, .065], [.43, 0], [1, 0], [1, .965],
      [.75, .935], [.48, .895], [.28, .855], [.16, .83], [.16, .80], [.10, .78]]],
  },
  storm: {
    kind: 'polygons',
    polygons: [[[0, .08], [.23, 0], [1, 0], [1, 1], [.69, 1], [0, .86]]],
  },
  christmas: {
    kind: 'polygons',
    polygons: [
      [[.233, .015], [.438, .015], [.438, .465], [.270, .465], [.233, .320]],
      [[.460, .027], [.562, .027], [.562, .218], [.460, .218]],
      [[.460, .239], [.562, .239], [.562, .405], [.530, .415], [.520, .465], [.460, .465]],
    ],
  },
} as const satisfies Record<string, EffectBoundary>;

const cityBoundary: EffectBoundary = { kind:'polygons', polygons:[[[.118,.089],[.40,0],[1,0],[1,.89],[.29,.70],[.29,.63],[.20,.56],[.118,.56]]] };
// Conservative glass-only panes, clear of the indoor furniture, door frame and pots.
const conservatoryBoundary: EffectBoundary = { kind:'polygons', polygons:[
  [[.420,.150],[.487,.145],[.487,.731],[.460,.718],[.460,.680],[.420,.640]],
  [[.501,.145],[.655,.140],[.655,.733],[.501,.733]],
  [[.675,.150],[.736,.150],[.736,.590],[.712,.650],[.675,.697]],
] };
const bardseyCredit: AssetCredit = { status:'documented', creator:'Eirian Evans', sourceUrl:'https://commons.wikimedia.org/wiki/File:Bardsey_Island_-_geograph.org.uk_-_6234522.jpg', licence:'CC BY-SA 2.0', licenceUrl:'https://creativecommons.org/licenses/by-sa/2.0/', note:'Photograph, 19 May 2019. Weather/shelter overlays are simulated. Scene presentation is offered under the same licence.' };
const asset = (id:string, name:string, src:string, sceneId:SceneId | undefined, role:SceneAsset['role'], visualScene:string,
  particles:EffectBoundary | null = null, status:SceneAsset['geometry']['status']='none',
  credit:AssetCredit=unverified, provenance:SceneAsset['provenance']='unverified', aspectRatio='16 / 9'): SceneAsset =>
  ({ id,name,src,sceneId,role,visualScene,aspectRatio,credit,provenance,geometry:{status,particles} });
export const sceneAssets: readonly SceneAsset[] = [
  asset('desert','Desert','/images/experience-covers/desert-valley-dusk.webp','desert','original','custom',null,'none'),
  asset('lighthouse-retreat','Lighthouse retreat','/images/experience-covers/lighthouse-retreat.webp','ocean','alternative','custom',{kind:'rectangle',x:0.37,y:0.43,width:0.26,height:0.17},'measured'),
  asset('misty-marshes','Misty marshes','/images/experience-covers/misty-marshes.webp','forest','alternative','custom',null,'none'),
  asset('mountain-sanctuary','Mountain sanctuary','/images/experience-covers/mountain-sanctuary.webp','temple','alternative','custom',null,'none'),
  asset('ocean-pod','Ocean pod','/images/experience-covers/ocean-pod.webp','ocean','alternative','custom',{kind:'rectangle',x:0.42,y:0.5,width:0.27,height:0.13},'measured'),
  asset('outback-veranda','Outback veranda','/images/experience-covers/outback-veranda.webp','desert','alternative','custom',null,'none'),
  asset('outside-lake-day','Lakeside daylight','/images/experience-covers/outside-lake-day.webp','retreat','alternative','custom',null,'none'),
  asset('waterfall-tropical-day','Tropical waterfall','/images/experience-covers/waterfall-tropical-day.webp','forest','alternative','custom',null,'none'),
  asset('japanese-garden-day','Japanese garden','/images/experience-covers/japanese-garden-day.webp','forest','alternative','custom',null,'none'),
  asset('kerala-houseboat','Kerala houseboat','/images/experience-covers/kerala-houseboat.webp','retreat','alternative','custom',null,'none'),

  asset('temple','Incense Hall','/images/experience-covers/incense-hall.webp','temple','original','temple',null,'measured',{status:'documented',creator:'AI-generated for Aether',note:'Generated with OpenAI image generation, October 2026. Imagined interior inspired by South Indian temple halls; not a documentary reconstruction.'},'illustration'),
  asset('temple-original','Original candlelit temple','/images/experience-covers/temple.jpg','temple','alternative','temple',null,'existing'),
  asset('forest','Forest','/images/experience-covers/forest.jpg','forest','original','forest',null,'none'),
  asset('ocean','Ocean','/images/experience-covers/ocean.jpg','ocean','original','ocean',null,'none'),
  asset('christmas','Christmas','/images/experience-covers/christmas.jpg','christmas','original','christmas',legacyEffectBoundaries.christmas,'existing'),
  asset('storm','Storm','/images/experience-covers/storm-balcony.jpg','storm','original','storm',legacyEffectBoundaries.storm,'existing'),
  asset('festival','Festival','/images/experience-covers/festival-evening.jpg','festival','original','festival',null,'none'),
  asset('retreat','Cosy Retreat','/images/experience-covers/retreat.jpg','retreat','original','retreat',legacyEffectBoundaries.retreat,'existing'),
  asset('retreat-winter','Winter landscape','/images/experience-covers/retreat-winter.jpg','retreat','alternative','retreat',legacyEffectBoundaries.retreat,'existing'),
  asset('temple-mountain','Mountain temple','/images/experience-covers/temple-mountain.jpg','temple','alternative','custom',null,'outdoor'),
  asset('temple-angkor','Angkor-inspired sanctuary','/images/experience-covers/temple-angkor.jpg','temple','alternative','custom',null,'outdoor'),
  asset('forest-stream','Fern grotto','/images/experience-covers/forest-fern-grotto.png','forest','alternative','custom',null,'outdoor'),
  asset('forest-dusk','Redwood sanctuary','/images/experience-covers/forest-redwood-sanctuary.png','forest','alternative','custom',null,'outdoor'),
  asset('ocean-cove','Turquoise cove','/images/experience-covers/ocean-cove.png','ocean','alternative','custom',null,'outdoor'),
  asset('ocean-atlantic','Atlantic coast','/images/experience-covers/ocean-atlantic.png','ocean','alternative','custom',null,'outdoor'),
  asset('christmas-fireside','Snowy forest retreat','/images/experience-covers/christmas-forest-retreat.png','christmas','alternative','custom',null,'outdoor'),
  asset('christmas-village','Christmas conservatory','/images/experience-covers/christmas-conservatory.png','christmas','alternative','custom',conservatoryBoundary,'measured'),
  asset('festival-woodland','Woodland festival','/images/experience-covers/festival-woodland.png','festival','alternative','custom',null,'outdoor'),
  asset('festival-waterfront','Waterfront festival','/images/experience-covers/festival-waterfront.png','festival','alternative','custom',null,'outdoor'),
  asset('storm-city','Rainy city terrace','/images/experience-covers/storm-city.png','storm','alternative','custom',cityBoundary,'measured'),
  asset('storm-coast','Coastal storm shelter','/images/experience-covers/storm-coast.png','storm','alternative','custom',legacyEffectBoundaries['storm-coast'],'existing'),
  asset('bardsey-coast','Bardsey Island','/images/bardsey/bardsey-eirian-evans.jpg',undefined,'story','story',null,'outdoor',bardseyCredit,'photograph','4 / 3'),
  asset('bardsey-shelter','Bardsey with fictional shelter','/images/bardsey/bardsey-eirian-evans.jpg',undefined,'story','story',{kind:'rectangle',x:.08,y:.14,width:.84,height:.73},'measured',bardseyCredit,'photograph','4 / 3'),
  asset('night-garden','Night garden','/images/experience-covers/night-garden.jpg',undefined,'story','custom',null,'outdoor'),
  asset('djedhor-display','Djedhor museum display','/images/museum-lab/djedhor-display.jpeg',undefined,'story','story'),
  asset('djedhor-interpretation','Heart weighing interpretation','/images/museum-lab/djedhor-interpretation.png',undefined,'story','story'),
  asset('warm-studio','Warm Studio','/images/podcast/warm-studio.webp',undefined,'broadcast','custom',null,'none',{status:'documented',creator:'AI-generated for Aether',note:'Generated with OpenAI image generation, October 2026. Empty contemporary studio.'},'illustration'),
  asset('liverpool-waterfront','Liverpool Waterfront','/images/podcast/liverpool-waterfront.webp',undefined,'broadcast','custom',null,'none',{status:'documented',creator:'AI-generated for Aether',note:'Generated with OpenAI image generation, October 2026. Artistic Liverpool skyline interpretation; not a documentary photograph.'},'illustration'),
  asset('botanical-observatory','Botanical Observatory','/images/podcast/botanical-observatory.webp',undefined,'broadcast','custom',null,'none',{status:'documented',creator:'AI-generated for Aether',note:'Generated with OpenAI image generation, October 2026. Imagined conservatory and waterfront setting.'},'illustration'),
  asset('wirral-liverpool','Liverpool from the Wirral','/images/podcast/wirral-liverpool.jpg',undefined,'broadcast','custom',{kind:'rectangle',x:.08,y:.14,width:.84,height:.58},'existing'),
];
export function isSceneId(value: unknown): value is SceneId { return typeof value === 'string' && sceneDefinitions.some(scene=>scene.id===value); }
export function sceneAsset(id: string | undefined): SceneAsset | undefined { return sceneAssets.find(asset=>asset.id===id); }
export function sceneAssetForSource(src: string | null | undefined): SceneAsset | undefined {
  // Registered paths only. Do not equate an external URL or uploaded data with a bundled asset.
  return src?.startsWith('/') && !src.startsWith('//') ? sceneAssets.find(asset=>asset.src===src) : undefined;
}
export interface AudioAsset { id:string; src:string; credit:AssetCredit }
export const audioAssets = [
  { id:'forest_wind', src:'/audio/forest_wind.mp3', credit:unverified },
  { id:'forest_rain', src:'/audio/forest_rain.mp3', credit:unverified },
  { id:'om-so-hum', src:'/audio/om-so-hum.mp3', credit:unverified },
  { id:'temple-echoes', src:'/audio/temple-echoes.mp3', credit:unverified },
  { id:'wind', src:'/audio/wind.mp3', credit:unverified },
  { id:'ocean-ambient', src:'/audio/ocean-ambient.mp3', credit:unverified },
  { id:'seagulls', src:'/audio/seagulls.mp3', credit:unverified },
  { id:'ambient-christmas', src:'/audio/ambient-christmas.mp3', credit:unverified },
  { id:'fireplace', src:'/audio/fireplace.mp3', credit:unverified },
  { id:'carnival', src:'/audio/carnival.mp3', credit:unverified },
  { id:'crowd', src:'/audio/crowd.mp3', credit:unverified },
  { id:'rain-thunder', src:'/audio/rain-thunder.mp3', credit:unverified },
  { id:'thunder', src:'/audio/thunder.mp3', credit:unverified },
 ] as const satisfies readonly AudioAsset[];
export type AudioAssetId = typeof audioAssets[number]['id'];
export function audioSource(id: AudioAssetId): string {
  const asset = audioAssets.find(asset=>asset.id===id);
  if (!asset) throw new Error(`Unknown audio asset: ${id}`);
  return asset.src;
}
