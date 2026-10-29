import {defineToolcraftCustomControlType} from '@/toolcraft/runtime';
export const fluidSpringControl=defineToolcraftCustomControlType('fluidSpringPlot');
import type { ToolcraftControlSectionSchema } from '@/toolcraft/runtime';
export const fluidDefaults = { k:260,c:24,roll:10,blur:4,delay:300,skip:400,shared:true,slow:false };
export type FluidSettings = {k:number;c:number;roll:number;blur:number;delay:number;skip:number;shared:boolean;slow:boolean};
export function fluidSettings(values: Readonly<Record<string,unknown>>):FluidSettings {
  const number=(key:keyof typeof fluidDefaults) => typeof values['fluid.'+key]==='number' ? Number(values['fluid.'+key]) : Number(fluidDefaults[key]);
  return {k:number('k'),c:number('c'),roll:number('roll'),blur:number('blur'),delay:number('delay'),skip:number('skip'),shared:values['fluid.shared']!=='per-icon',slow:Boolean(values['fluid.slow'])};
}
const active={mode:'conditional' as const,all:[{target:'studio.tool',equals:'fluid'}]};
const responsive={performanceRole:'responsiveness' as const,performanceReason:'Updates the existing reference spring without adding scene resources.'};
const slider=(key:'k'|'c'|'roll'|'blur'|'delay'|'skip',label:string,min:number,max:number,step:number,unit?:string)=>({type:'slider' as const,target:'fluid.'+key,label,defaultValue:fluidDefaults[key],min,max,step,...(unit?{unit}:{}),sliderValueKind:'continuous' as const,applicability:active,...responsive});
export const fluidSections: readonly ToolcraftControlSectionSchema[] = [
 {id:'fluid-tooltip',title:'Tooltip',controls:{shared:{type:'segmented',target:'fluid.shared',label:'Tooltip mode',description:'Hover the icons, or focus the preview and press 1–5. Replay follows the original demo path.',defaultValue:'shared',options:[{value:'shared',label:'Shared'},{value:'per-icon',label:'Per icon'}],applicability:active,...responsive},slow:{type:'switch',target:'fluid.slow',label:'Slow motion ×0.2',defaultValue:false,applicability:active,...responsive},replay:{type:'actions',target:'fluid.actions',label:'Preview',actions:[{value:'fluid.replay',label:'Replay'}],applicability:active}}},
 {id:'fluid-spring',title:'Spring',controls:{presets:{type:'select',target:'fluid.springPreset',label:'Spring preset',defaultValue:'fluid',options:[{value:'fluid',label:'Fluid'},{value:'snappy',label:'Snappy'},{value:'bouncy',label:'Bouncy'},{value:'lazy',label:'Lazy'},{value:'custom',label:'Custom'}],applicability:active,...responsive},k:slider('k','Stiffness',60,800,10),c:slider('c','Damping',6,60,1),response:{type:fluidSpringControl,target:'fluid.response',label:false,defaultValue:{},applicability:active,keyframeable:false}}},
 {id:'fluid-label',title:'Label',controls:{roll:slider('roll','Roll distance',0,24,1,'px'),blur:slider('blur','Blur in motion',0,10,.5,'px')}},
 {id:'fluid-timing',title:'Timing',controls:{delay:slider('delay','Open delay',0,900,50,'ms'),skip:slider('skip','Skip-delay window',0,1500,50,'ms')}},
];
