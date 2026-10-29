import { useEffect, useRef, useState } from 'react';
import {useToolcraftDispatch,useToolcraftValue} from '@/toolcraft/runtime/react';

import { useToolcraftEvaluatedValues } from '@/toolcraft/runtime/react';
import {createFluidController,type FluidSnapshot,type FluidController} from './fluid-runtime';
import {FluidStage} from './fluid-stage';
import { fluidSettings } from './fluid-schema';
import styles from './fluid.module.css';
let replay: (()=>void)|undefined;
export function replayFluid(){replay?.();}
export function FluidCanvas(){
 const dispatch=useToolcraftDispatch();const profile=useToolcraftValue("fluid.springPreset");const previousProfile=useRef(profile);
 const controller=useRef<FluidController|undefined>(undefined);const [snapshot,setSnapshot]=useState<FluidSnapshot>({opacity:0,x:0,y:7,scale:1,width:0,activeY:6,active:0,cursorVisible:false,cursorIndex:5,labels:[]});
 const root=useRef<HTMLDivElement>(null); const values=useToolcraftEvaluatedValues(); const settings=fluidSettings(values);const latest=useRef(settings);latest.current=settings;
 useEffect(()=>{const pairs:Record<string,number[]>={fluid:[260,24],snappy:[520,40],bouncy:[320,13],lazy:[120,18]};const pair=pairs[String(profile)];if(previousProfile.current!==profile){previousProfile.current=profile;if(pair){dispatch({type:"controls.setValue",target:"fluid.k",value:pair[0]});dispatch({type:"controls.setValue",target:"fluid.c",value:pair[1]});}return;}if(pair&&(settings.k!==pair[0]||settings.c!==pair[1])){previousProfile.current="custom";dispatch({type:"controls.setValue",target:"fluid.springPreset",value:"custom"});}},[profile,settings.k,settings.c,dispatch]);
 useEffect(()=>{if(!root.current)return;const widths=[...root.current.querySelectorAll<HTMLElement>("[data-fluid-measure]")].map(el=>el.offsetWidth);const engine=createFluidController(()=>latest.current,setSnapshot,widths);controller.current=engine;replay=engine.replay;return()=>{controller.current=undefined;replay=undefined;engine.destroy();};},[]);
 useEffect(()=>{replay?.();},[JSON.stringify(settings)]);
 return <div ref={root} className={styles.scene} aria-label="Fluid tooltip preview"><FluidStage snapshot={snapshot} controller={()=>controller.current}/></div>;
}
