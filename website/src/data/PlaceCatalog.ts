import type { Experience } from '../lib/models/Experience';
import { experiences } from './experiences';
import { backgroundSource } from '../lib/player/BackgroundChoices';
import { applyWeatherBackground } from '../lib/player/WeatherBackgrounds';

export const placeCollections = [
  { id:'coast-ocean', name:'Coast & ocean', description:'Sheltered coastal views and places beside the sea.' },
  { id:'forest-woodland', name:'Forest & woodland', description:'Quiet places among the trees.' },
  { id:'gardens-courtyards', name:'Gardens & courtyards', description:'Inviting garden spaces and lantern-lit corners.' },
  { id:'mountains-landscapes', name:'Mountains & landscapes', description:'Places to settle with an open view.' },
  { id:'rooms-sanctuaries', name:'Rooms & sanctuaries', description:'Warm interiors and quiet spaces to return to.' },
  { id:'underwater', name:'Underwater', description:'A quiet place beneath the surface.' },
] as const;
export type CollectionId = typeof placeCollections[number]['id'];
export interface Place {
  id:string; name:string; description:string; collection:CollectionId;
  engineId:string; backgroundId?:string; setting:'Sheltered'|'Indoors'|'Open air'|'Underwater';
  atmosphere:'Mist'|'Rain'|'Snow'|'Firelight'|'Still'|'Gentle motion';
  featured?:boolean; session?:boolean;
}
export const places: readonly Place[] = [
  { id:'lighthouse-retreat',name:'Lighthouse Retreat',description:'Settle onto the bench or woven rug and watch soft sea mist beyond the stone arch.',collection:'coast-ocean',engineId:'ocean',backgroundId:'lighthouse-retreat',setting:'Sheltered',atmosphere:'Mist',featured:true },
  { id:'coastal-rain-pod',name:'Coastal Rain Pod',description:'A clear wooden platform, rain beyond the entrance and optional incense smoke indoors.',collection:'coast-ocean',engineId:'ocean',backgroundId:'ocean-pod',setting:'Sheltered',atmosphere:'Rain' },
  { id:'beach-bonfire',name:'Beach Bonfire',description:'An empty sitting blanket beside the sea, with warm firelight and embers rising from the logs.',collection:'coast-ocean',engineId:'ocean',backgroundId:'beach-bonfire',setting:'Open air',atmosphere:'Firelight' },
  { id:'bamboo-rain-pavilion',name:'Bamboo Rain Pavilion',description:'A woven mat beneath a timber roof, looking out into a rain-soaked bamboo grove.',collection:'forest-woodland',engineId:'forest',backgroundId:'bamboo-rain-pavilion',setting:'Sheltered',atmosphere:'Rain' },
  { id:'lantern-garden',name:'Lantern Garden',description:'A quiet garden retreat, warm lanterns and a place to pause after dusk.',collection:'gardens-courtyards',engineId:'forest',backgroundId:'lantern-garden',setting:'Open air',atmosphere:'Still' },
  { id:'snow-cabin',name:'Snow Cabin',description:'A warm cabin and soft rug, with snow falling beyond the five window panes.',collection:'mountains-landscapes',engineId:'retreat',backgroundId:'indoor-snow-cabin',setting:'Indoors',atmosphere:'Snow' },
  { id:'mountain-temple',name:'Mountain Temple',description:'An open stone sanctuary and a clear foreground overlooking distant mountains.',collection:'mountains-landscapes',engineId:'temple',backgroundId:'temple-mountain',setting:'Sheltered',atmosphere:'Still' },
  { id:'lakeside-cabin',name:'Lakeside Cabin',description:'A warm, sheltered room with an inviting rug and a wide view across the lake.',collection:'rooms-sanctuaries',engineId:'retreat',setting:'Indoors',atmosphere:'Still' },
  { id:'lakeside-pavilion',name:'Lakeside Pavilion',description:'A clear wooden platform beside still water, with gentle rain outside the shelter.',collection:'rooms-sanctuaries',engineId:'retreat',backgroundId:'outside-lake-day',setting:'Sheltered',atmosphere:'Rain' },
  { id:'incense-hall',name:'Incense Hall',description:'A spacious stone hall, warm lamps and optional incense smoke.',collection:'rooms-sanctuaries',engineId:'temple',setting:'Indoors',atmosphere:'Still' },
  { id:'underwater-sanctuary',name:'Underwater Sanctuary',description:'An immersive reef view with optional gently swimming creatures.',collection:'underwater',engineId:'ocean',setting:'Underwater',atmosphere:'Gentle motion',session:true },
];
export function placeById(id:string | null | undefined) { return places.find(place=>place.id===id); }
export function placeImage(place:Place):string {
  if (place.session) return '/images/relaxation/deep-ocean-sanctuary.webp';
  return backgroundSource({id:place.engineId, backgroundId:place.backgroundId});
}
export function placeEditUrl(place:Place) {
  return place.session ? '/studio/guided-relaxation/' : `/studio/experiences/${place.engineId}/?place=${place.id}`;
}
export function placePlayUrl(place:Place) {
  return place.session ? '/studio/relaxation-player/?scene=underwater&duration=Untimed&guidance=Silent%20relaxation' : `/studio/listen/?place=${place.id}`;
}
/** Named places use the existing engine IDs so saved copies and legacy URLs remain compatible. */
export function createPlaceExperience(place:Place):Experience {
  if(place.session) throw new Error('Use the relaxation player for this place.');
  const base = experiences.find(item=>item.id===place.engineId);
  if (!base) throw new Error('Unknown scene engine.');
  let scene:Experience = structuredClone(base);
  scene.sceneId = place.engineId;
  delete scene.background;
  delete scene.backgroundId;
  scene.atmosphere = {particles:false,lighting:true,fog:false};
  scene.smoke = {enabled:false,amount:35};
  scene.lighting = {...scene.lighting,intensity:.18,pulse:false};
  if(place.backgroundId) scene.backgroundId=place.backgroundId;
  if(place.backgroundId) scene=applyWeatherBackground(scene,place.backgroundId);
  if(place.id==='lighthouse-retreat') {
    scene.environment={colour:'#25211f'};
    scene.lighting={...scene.lighting,colour:'#e8c99b',intensity:.18,pulse:false};
    scene.atmosphere.fog=true;
    scene.fog={preset:'coastal-sea-mist',colour:'#d8e1e3',density:.30,speed:.18};
  }
  if(place.id==='beach-bonfire') {
    scene.atmosphere.particles=true;
    scene.particles={...scene.particles,preset:'beach-embers',motion:'rise',count:32,colour:'#ffba66',glow:5,minRadius:.5,maxRadius:1.4,minSpeed:16,maxSpeed:28,drift:3,minOpacity:.25,maxOpacity:.65,minLifetime:2,maxLifetime:5};
  }
  if(place.id==='bamboo-rain-pavilion') {scene.audio.track='retreat-rain';scene.audio.layerVolume=0;}
  if(place.id==='lakeside-pavilion') {
    scene.atmosphere.particles=true;
    const rain=experiences.find(item=>item.id==='storm')!.particles;
    scene.particles={...rain,count:130,minOpacity:.18,maxOpacity:.45,drift:2};
    scene.audio.track='retreat-rain';scene.audio.layerVolume=0;
  }
  scene.name=place.name;scene.description=place.description;
  return scene;
}
