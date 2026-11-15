/** Lightweight weather state machine. No timers or rendering dependencies. */
export type WeatherValues={rain:number;ripples:number;vapour:number};
type WeatherStage={label:string;values:WeatherValues};
const STAGES:readonly WeatherStage[]=[
 {label:'Clear lake',values:{rain:0,ripples:10,vapour:0}},
 {label:'Light rain',values:{rain:35,ripples:40,vapour:0}},
 {label:'Heavy rain',values:{rain:100,ripples:100,vapour:10}},
 {label:'Rain clearing',values:{rain:20,ripples:55,vapour:80}},
 {label:'After the rain',values:{rain:0,ripples:20,vapour:100}},
 {label:'Clear again',values:{rain:0,ripples:10,vapour:0}}
];
const STAGE_SECONDS=20;
const TRANSITION_SECONDS=10;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(t:number)=>t*t*(3-2*t);
export class UllswaterWeatherController{
 active=false;
 label='Manual settings';
 private elapsed=0;
 private startValues:WeatherValues={rain:0,ripples:10,vapour:0};
 start(from:WeatherValues){this.active=true;this.elapsed=0;this.startValues={...from};this.label=STAGES[0].label;}
 stop(){this.active=false;this.label='Manual settings';}
 tick(dt:number):WeatherValues|null{
  if(!this.active)return null;
  this.elapsed+=Math.max(0,Math.min(dt,.05));
  const index=Math.floor(this.elapsed/STAGE_SECONDS)%STAGES.length;
  const inStage=this.elapsed%STAGE_SECONDS;
  const current=STAGES[index];
  const previous=index===0?(this.elapsed<STAGE_SECONDS?this.startValues:STAGES[STAGES.length-1].values):STAGES[index-1].values;
  const t=smooth(Math.min(1,inStage/TRANSITION_SECONDS));
  this.label=current.label;
  return {rain:mix(previous.rain,current.values.rain,t),ripples:mix(previous.ripples,current.values.ripples,t),vapour:mix(previous.vapour,current.values.vapour,t)};
 }
}
