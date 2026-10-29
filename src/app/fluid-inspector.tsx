import { fluidSettings } from './fluid-schema';
import type { ToolcraftCustomControlRendererProps } from '@/toolcraft/runtime/react';
import styles from './beam-handoff.module.css';
export function FluidInspector({state,compact=false}:ToolcraftCustomControlRendererProps & {compact?:boolean}){
 const p=fluidSettings(state.values);let x=0,v=0,peak=0,settle=0;const points:number[][]=[];
 for(let i=0;i<=1500;i++){const dt=1/600;v+=(-p.k*(x-1)-p.c*v)*dt;x+=v*dt;peak=Math.max(peak,x);if(Math.abs(x-1)>.01)settle=i/600;if(i%4===0)points.push([i/600,x]);}
 return <div className={styles.inspector}><svg viewBox="0 0 260 98" role="img" aria-label="Spring response"><polyline className={styles.curve} points={points.map(([t,y])=>`${12+t/2.5*236},${82-y/Math.max(1.08,peak+.04)*64}`).join(' ')}/></svg><p className={styles.note}>Settles in {Math.round(settle*1000)} ms · Overshoot {Math.max(0,(peak-1)*100).toFixed(1)}% · ζ {(p.c/(2*Math.sqrt(p.k))).toFixed(2)}</p>{!compact?<pre className={styles.code}>{JSON.stringify(p,null,2)}</pre>:null}</div>;
}

export function FluidSpringPlot(props:ToolcraftCustomControlRendererProps){return <FluidInspector {...props} compact/>;}
