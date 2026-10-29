import {test,expect,vi} from 'vitest';
import {appSchema} from './app-schema';
import {fluidSettings} from './fluid-schema';
import {fluidHandoff} from './fluid-handoff';
import {createToolcraftState} from '@/toolcraft/runtime';
import {createToolcraftSettingsPayload,parseToolcraftSettingsPayload} from '@/toolcraft/runtime/react';
vi.mock('./fluid.module.css?raw',async()=>{const {readFileSync}=await import('node:fs');return {default:readFileSync(new URL('./fluid.module.css',import.meta.url),'utf8')};});
test('fluid settings preserve canonical parameters and exact source handoff',()=>{const state=createToolcraftState(appSchema);Object.assign(state.values,{'studio.tool':'fluid','fluid.k':520,'fluid.c':40,'fluid.shared':'per-icon','fluid.blur':6});const payload=createToolcraftSettingsPayload(state);expect(parseToolcraftSettingsPayload(appSchema,JSON.parse(JSON.stringify(payload)))).not.toBeNull();expect(fluidSettings(payload.values)).toMatchObject({k:520,c:40,shared:false,blur:6});expect(fluidHandoff(payload.values).implementation.exampleHtml).toContain('mountFluid');expect(fluidHandoff(payload.values).motion.maxStepSeconds).toBe(1/240);});
test('toolcraft owns both tabs and all tooltip controls',()=>{const controls=appSchema.panels.controls!.sections.flatMap(s=>Object.values(s.controls));expect(controls.find(c=>c.target==='studio.tool')?.type).toBe('tabs');for(const key of ['k','c','roll','blur','delay','skip','shared','slow'])expect(controls.some(c=>c.target==='fluid.'+key)).toBe(true);});
