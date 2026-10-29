import {fluidSpringControl} from "./fluid-schema";
import {FluidSpringPlot} from "./fluid-inspector";
import { FluidCanvas, replayFluid } from "./fluid-canvas";
import { useToolcraftValue } from "@/toolcraft/runtime/react";
import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { beamPipelineRegistration } from "./app-performance";
import { BeamCanvas, beamSceneBoundsProvider } from "./beam-renderer";
import { withSettingsFooter } from "./beam-panel-presentation";
import { BeamWorkspaceContrast } from "./beam-workspace";
import { BeamHandoffSync, BeamHandoffInspector, beamHandoffActionHandler } from "./beam-handoff-inspector";
import { beamHandoffControl } from "./beam-handoff-schema";
import { BeamPresetLibrary, BeamSharedDefaultBootstrap, sharedDefaultActionHandler } from "./beam-shared-default-ui";
import { sharedDefaultControl } from "./beam-shared-default-schema";

function StudioScene(){const tool=useToolcraftValue("studio.tool");return <><BeamSharedDefaultBootstrap key={String(tool)}/><BeamHandoffSync/>{tool==="fluid"?<FluidCanvas/>:<BeamCanvas/>}</>;}

export const appComposition = composeToolcraftApp(withSettingsFooter(appSchema), {
  scene: {
    canvasContent: <StudioScene/>,
    infiniteCanvasContent: <BeamWorkspaceContrast />,
    sceneBoundsProvider: context => context.state.values["studio.tool"] === "fluid" ? [{x:-370,y:-230,width:740,height:460}] : beamSceneBoundsProvider(context),
    renderDefaultCanvasMedia: false,
  },
  renderer: { pipelineRegistration: beamPipelineRegistration },
  controls: { renderers: { [fluidSpringControl]: FluidSpringPlot, [beamHandoffControl]: BeamHandoffInspector, [sharedDefaultControl]: BeamPresetLibrary } },
  actions: { onPanelAction: async context => {
    if(context.action.value === "fluid.replay") replayFluid();
    const spring: Record<string,number[]>={"fluid.fluid":[260,24],"fluid.snappy":[520,40],"fluid.lazy":[120,18],"fluid.bouncy":[320,13]};
    if(spring[context.action.value]) {const [k,c]=spring[context.action.value];context.dispatch({type:"controls.setValue",target:"fluid.k",value:k});context.dispatch({type:"controls.setValue",target:"fluid.c",value:c});}
    await sharedDefaultActionHandler(context);
    await beamHandoffActionHandler(context);
  } },
});
