import { beamSections } from './beam-schema';
import { fluidSections } from './fluid-schema';
const mode='studio.tool';
export const studioSections=[
 {id:'studio-tool',title:'Tools',controls:{tool:{type:'tabs' as const,target:mode,label:'Tools',defaultValue:'beam',options:[{value:'beam',label:'Node Beam'},{value:'fluid',label:'Fluid tooltip'}],keyframeable:false,applicability:{mode:'always' as const},performanceRole:'responsiveness' as const,performanceReason:'Selects the active product scene and its native controls.'}}},
 ...beamSections.filter(section=>!['beam-shared-default','beam-handoff'].includes(section.id)).map(section=>({...section,controls:Object.fromEntries(Object.entries(section.controls).map(([key,control])=>[key,['beam-background','beam-shared-default','beam-handoff'].includes(section.id)?control:{...control,applicability:{mode:'conditional' as const,all:[{target:mode,equals:'beam'},...('applicability' in control&&control.applicability?.mode==='conditional'?control.applicability.all:[])]}}]))})),
 ...fluidSections,
 ...beamSections.filter(section=>["beam-shared-default","beam-handoff"].includes(section.id)),
];
