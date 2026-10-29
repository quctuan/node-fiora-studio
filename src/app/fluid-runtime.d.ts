import type {FluidSettings} from './fluid-schema';
export type FluidSnapshot={opacity:number;x:number;y:number;scale:number;width:number;activeY:number;active:number;cursorVisible:boolean;cursorIndex:number;labels:{id:number;index:number;opacity:number;y:number;blur:number}[]};
export type FluidController={replay():void;enter(index:number,immediate?:boolean):void;leave(ms:number):void;activate(index:number):void;destroy():void};
export function createFluidController(getSettings:()=>FluidSettings,emit:(snapshot:FluidSnapshot)=>void,widths:number[]):FluidController;
