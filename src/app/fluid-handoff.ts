import { fluidSettings } from './fluid-schema';
import physics from './fluid-runtime.js?raw';
import adapter from './fluid-adapter.txt?raw';
const runtime=physics+'\n'+adapter;
import baseCss from './fluid.module.css?raw';
import chrome from './fluid-artifact-chrome.css.txt?raw';
const css=baseCss+'\n'+chrome;
import { fluidMarkup } from './fluid-markup';
export function fluidHandoff(values:Readonly<Record<string,unknown>>){
 const settings=fluidSettings(values);
 const html=`<!doctype html><html><meta charset="utf-8"><title>Fluid tooltip</title><style>${css}body{margin:0;min-height:100vh;background:#10141d}</style><div class="scene" id="root">${fluidMarkup}</div><script>${runtime.replace('export function createFluidController','function createFluidController')}\nconst settings=${JSON.stringify(settings)};const names=${JSON.stringify(Object.fromEntries(['scene','stage','pane','rail','hl','item','av','tip','tip-bg','tip-label','cursor','on'].map(k=>[k,k])))};const demo=mountFluid(document.getElementById('root'),()=>settings,names);demo.replay();<\/script></html>`;
 return {schema:'fluid-tooltip-developer-handoff',version:1,settings,motion:{integrator:'semi-implicit Euler',mass:1,maxFrameSeconds:.05,maxStepSeconds:1/240,visibilitySpring:{stiffness:420,damping:38},hideDelayMouseMs:80,hideDelayTouchMs:900},source:'https://ppoinot.github.io/fluid-tooltip-playground/',integration:'Save implementation.exampleHtml as fluid-tooltip.html and open it in a browser. Settings and spring physics are included; no Toolcraft installation is required.',implementation:{exampleHtml:html,javascript:runtime}};
}
