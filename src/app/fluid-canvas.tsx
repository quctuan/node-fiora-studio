import { useEffect, useRef } from 'react';
import { useToolcraftEvaluatedValues } from '@/toolcraft/runtime/react';
import { mountFluid } from './fluid-runtime';
import { fluidMarkup } from './fluid-markup';
import { fluidSettings } from './fluid-schema';
import styles from './fluid.module.css';
let replay: (()=>void)|undefined;
export function replayFluid(){replay?.();}
export function FluidCanvas(){
 const root=useRef<HTMLDivElement>(null); const values=useToolcraftEvaluatedValues(); const settings=fluidSettings(values);const latest=useRef(settings);latest.current=settings;
 useEffect(()=>{if(!root.current)return;const engine=mountFluid(root.current,()=>latest.current,styles);replay=engine.replay;return()=>{replay=undefined;engine.destroy();};},[]);
 useEffect(()=>{replay?.();},[JSON.stringify(settings)]);
 const html=fluidMarkup.replace(/class="([^"]+)"/g,(_,names:string)=>'class="'+names.split(' ').map(name=>styles[name]??name).join(' ')+'"');
 return <div ref={root} className={styles.scene} aria-label="Fluid tooltip preview" tabIndex={0} dangerouslySetInnerHTML={{__html:html}}/>;
}
