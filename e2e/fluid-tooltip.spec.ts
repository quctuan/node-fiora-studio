import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('fluid tab rolls real labels and exports the active tooltip preset',async({page})=>{
 await page.route('**/api/shared-default**',r=>r.fulfill({json:{library:{version:2,revision:'test',defaultPresetId:null,presets:{}}}}));
 await page.goto('/');await page.getByRole('tab',{name:'Fluid tooltip',exact:true}).click();
 const preview=page.getByLabel('Fluid tooltip preview',{exact:true});await expect(preview).toBeVisible();await expect(page.getByRole('heading',{name:'Fluid tooltip',exact:true})).toHaveCount(0);
 await preview.getByRole('button',{name:'John Doe',exact:true}).hover();await expect.poll(()=>preview.locator('#tip').textContent()).toBe('John Doe');
 await page.getByRole('button',{name:'Snappy',exact:true}).click();await expect(page.getByRole('slider',{name:'Stiffness',exact:true})).toHaveAttribute('aria-valuenow','520');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export Settings',exact:true}).click();const path=await(await download).path();const json=JSON.parse(await readFile(path!,'utf8'));expect(json.values['studio.tool']).toBe('fluid');expect(json.values['fluid.k']).toBe(520);expect(json.values['beam.developerHandoff'].schema).toBe('fluid-tooltip-developer-handoff');
 const standalone=await page.context().newPage();await standalone.setContent(json.values['beam.developerHandoff'].implementation.exampleHtml);await standalone.getByRole('button',{name:'John Doe',exact:true}).hover();await expect.poll(()=>standalone.locator('#tip').textContent()).toBe('John Doe');await standalone.close();
 await page.getByRole('tab',{name:'Node Beam',exact:true}).click();await expect(page.getByTestId('beam-preview')).toBeVisible();await expect(preview).toHaveCount(0);
});
test('fluid presets save all settings and have a separate shared default',async({page})=>{
 const libs:Record<string,any>={beam:{version:2,revision:'test',defaultPresetId:null,presets:{}},fluid:{version:2,revision:'test',defaultPresetId:null,presets:{}}};
 await page.route('**/api/shared-default**',async r=>{const tool=new URL(r.request().url()).searchParams.get('tool')??'beam';const library=libs[tool];let selectedId; if(r.request().method()==='POST'){const b=r.request().postDataJSON();selectedId=b.id;library.presets[b.id]={id:b.id,name:b.name,createdAt:'2026-10-29',updatedAt:'2026-10-29',playing:b.playing,settingsJson:b.settingsJson};if(b.operation==='set-default')library.defaultPresetId=b.id;}await r.fulfill({json:{library,...(selectedId?{selectedId}:{})}});});
 await page.goto('/');await page.getByRole('tab',{name:'Fluid tooltip',exact:true}).click();await page.getByRole('button',{name:'Snappy',exact:true}).click();
 const name=page.getByRole('textbox',{name:'Preset name',exact:true});await name.fill('Fluid test');await page.getByRole('button',{name:'Save preset',exact:true}).click();await expect(page.getByRole('button',{name:'Fluid test',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Set as default',exact:true}).click();await expect.poll(()=>libs.fluid.defaultPresetId).not.toBeNull();expect(libs.beam.defaultPresetId).toBeNull();
 await page.reload();await expect(page.getByRole('tab',{name:'Fluid tooltip',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('slider',{name:'Stiffness',exact:true})).toHaveAttribute('aria-valuenow','520');
 expect(JSON.parse((Object.values(libs.fluid.presets)[0] as {settingsJson:string}).settingsJson).values["fluid.k"]).toBe(520);
});
test('all fluid tuning values and both interaction modes reach JSON',async({page})=>{
 await page.route('**/api/shared-default**',r=>r.fulfill({json:{library:{version:2,revision:'test',defaultPresetId:null,presets:{}}}}));await page.goto('/');await page.getByRole('tab',{name:'Fluid tooltip',exact:true}).click();
 for(const label of ['Stiffness','Damping','Roll distance','Blur in motion','Open delay','Skip-delay window'])await page.getByRole('slider',{name:label,exact:true}).press('End');
 await page.getByRole('button',{name:'Per icon',exact:true}).click();await page.getByRole('switch',{name:'Slow motion ×0.2',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export Settings',exact:true}).click();const path=await(await pending).path();const payload=JSON.parse(await readFile(path!,'utf8'));expect(payload.values['beam.developerHandoff'].settings).toMatchObject({k:800,c:60,roll:24,blur:10,delay:900,skip:1500,shared:false,slow:true});
});
