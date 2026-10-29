import fs from 'node:fs/promises';
import os from 'node:os';
import {build} from 'esbuild';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));process.chdir(root);
const fluidBuild=await fs.mkdtemp(path.join(os.tmpdir(),'fluid-tooltip-build-'));
execFileSync('npm',['run','build','--','--outDir',fluidBuild,'--emptyOutDir'],{cwd:path.join(root,'..'),stdio:'inherit'});
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist',{recursive:true});
await fs.cp('beam-original','dist',{recursive:true});
await fs.rename('dist/index.html','dist/beam.html');
const beamEntry=await fs.readFile('dist/beam.html','utf8');
await fs.writeFile('dist/beam.html',beamEntry.replace('</head>','<script type="module" src="/beam-playback-placement.js"></script></head>'));
for(const name of ['index.html','hub.css','hub.js','brand-mark.svg','beam-playback-placement.js'])await fs.copyFile(name,'dist/'+name);
await fs.cp(path.join(fluidBuild,'assets'),'dist/assets',{recursive:true});
const fluidHtml=await fs.readFile(path.join(fluidBuild,'index.html'),'utf8');await fs.writeFile('dist/fluid.html',fluidHtml.replace('</head>','<link rel="stylesheet" href="/fluid-controls.css"></head>'));await fs.writeFile('dist/fluid-controls.css',(await fs.readFile('fluid-controls.css','utf8'))+(await fs.readFile('../src/app/fluid-artifact-chrome.css.txt','utf8')));
await fs.rm(fluidBuild,{recursive:true,force:true});
// Assemble a same-origin motion app, including rebased Markdown and runnable source downloads.
execFileSync('node',['build.mjs'],{cwd:path.join(root,'../motion'),stdio:'inherit'});
const source=JSON.parse(await fs.readFile('../motion/SOURCE-MANIFEST.json','utf8'));
await fs.rm('motion-source',{recursive:true,force:true});await fs.mkdir('motion-source',{recursive:true});
for(const name of Object.keys(source.files)){const dest=path.join('motion-source',name);await fs.mkdir(path.dirname(dest),{recursive:true});let data=await fs.readFile(path.join('../motion',name));if(/\.(?:md|js|mjs|json|html|py|css)$/.test(name))data=Buffer.from(data.toString().replaceAll('https://fiora-node-motion.vercel.app','https://nodeanimation.vercel.app/motion'));await fs.writeFile(dest,data);}
execFileSync('python3',['refresh-motion-ui.py',path.join(root,'motion-source')],{stdio:'inherit'});
execFileSync('node',['build.mjs'],{cwd:path.join(root,'motion-source'),stdio:'inherit'});
await fs.cp('motion-source/dist','dist/motion',{recursive:true});
await fs.writeFile('dist/hub-release.json',JSON.stringify({version:JSON.parse(await fs.readFile('package.json','utf8')).version,beamSource:'production dpl_8JdTFGJarguRcX9XYHzFmoeSX6GB',motionVersion:JSON.parse(await fs.readFile('../motion/package.json','utf8')).version,fluidVersion:JSON.parse(await fs.readFile('../package.json','utf8')).version,tabs:['Node beam','Node motion','Fluid tooltip']},null,2));
console.log('Built unified hub with same-origin beam, motion, Markdown and source ZIP.');

// Standard Vercel Build Output API: preserve the menu, both apps and the preset function.
const projectRoot=path.join(root,'..'),output=path.join(projectRoot,'.vercel/output');
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
await fs.cp(path.join(root,'dist'),path.join(output,'static'),{recursive:true});
await fs.cp(path.join(root,'beam-api-original'),path.join(output,'functions/api/shared-default.func'),{recursive:true});
const fluidFunction=path.join(output,'functions/api/fluid-default.func');await fs.mkdir(fluidFunction,{recursive:true});
await build({entryPoints:[path.join(projectRoot,'server/fluid-default.ts')],outfile:path.join(fluidFunction,'index.cjs'),bundle:true,platform:'node',format:'cjs',target:'node22',minify:true,alias:{'@':path.join(projectRoot,'src')},logOverride:{'empty-import-meta':'silent'}});
await fs.copyFile(path.join(root,'beam-api-original/.vc-config.json'),path.join(fluidFunction,'.vc-config.json'));
const config={version:3,routes:[{src:'^/$',has:[{type:'query',key:'embedded',value:'fluid'}],dest:'/fluid.html'},{src:'^/$',has:[{type:'query',key:'embedded',value:'beam'}],dest:'/beam.html'},{src:'^/motion/?$',dest:'/motion/index.html'},{handle:'filesystem'},{src:'/(.*)',dest:'/index.html'}]};
await fs.writeFile(path.join(output,'config.json'),JSON.stringify(config));
await fs.rm(path.join(projectRoot,'dist'),{recursive:true,force:true});await fs.cp(path.join(root,'dist'),path.join(projectRoot,'dist'),{recursive:true});
