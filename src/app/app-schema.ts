import { defineToolcraft, timelineModule, type ToolcraftProductBase } from "@/toolcraft/runtime";

import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";
import { studioSections } from "./studio-schema";
import { referenceTransportSeconds } from "./beam-reference";

function studioBase(fluidOnly:boolean):ToolcraftProductBase{return {
    canvas: {
      enabled: true,
      upload: false,
      draggable: true,
      renderScale: true,
      size: { width: 800, height: 600, unit: "px" },
      sizing: { mode: "editable-output" },
    },
    identity: fluidOnly?{id:"fluid-tooltip-studio",title:"Fluid tooltip"}:appIdentity,
    settingsTransfer: { enabled: true, fileName: "effect-preset.json" },
    panels: {
      controls: {
        sections: fluidOnly?studioSections.map(section=>section.id==="studio-tool"?{...section,controls:Object.fromEntries(Object.entries(section.controls).map(([key,control])=>[key,{...control,defaultValue:"fluid",options:[{value:"fluid",label:"Fluid tooltip"}]}]))}:section):studioSections,
        title: fluidOnly?"Fluid tooltip":"Node Beam Studio",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
  };}
export function createStudioSchema(fluidOnly=false){return defineToolcraft({defaults:appDefaults,base:studioBase(fluidOnly),modules:[timelineModule({mode:"playback",defaultDurationSeconds:referenceTransportSeconds})]});}
export const appSchema=defineToolcraft({defaults:appDefaults,base:studioBase(typeof window!=="undefined" && new URLSearchParams(window.location.search).get("embedded")==="fluid"),modules:[timelineModule({mode:"playback",defaultDurationSeconds:referenceTransportSeconds})]});
