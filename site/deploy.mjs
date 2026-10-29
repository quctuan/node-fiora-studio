import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const version=JSON.parse(await fs.readFile('site/package.json','utf8')).version;
const cli=process.env.VERCEL_CLI;if(!cli)throw new Error('Set VERCEL_CLI to the installed official executable.');
const output=path.join(root,'.vercel/output');const files={};
async function hashes(dir,prefix=''){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const key=prefix+entry.name;if(entry.isDirectory())await hashes(path.join(dir,entry.name),key+'/');else if(key!=='deployment.json')files[key]=createHash('sha256').update(await fs.readFile(path.join(dir,entry.name))).digest('hex');}}
await hashes(path.join(output,'static'));
const metadata={version,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),files,apiSha256:createHash('sha256').update(await fs.readFile(path.join(output,'functions/api/shared-default.func/index.cjs'))).digest('hex'),fluidApiSha256:createHash('sha256').update(await fs.readFile(path.join(output,'functions/api/fluid-default.func/index.cjs'))).digest('hex')};
for(const dest of ['.vercel/output/static/deployment.json','site/dist/deployment.json','dist/deployment.json'])await fs.writeFile(dest,JSON.stringify(metadata,null,2));
const snapshot=path.resolve('..','node-beam-versions','site-'+version);await fs.mkdir(snapshot);
execFileSync('git',['archive','--format=tar','--output',path.join(snapshot,'source.tar'),'HEAD']);await fs.cp(output,path.join(snapshot,'vercel-output'),{recursive:true});
const release={version,url:'https://nodeanimation.vercel.app/',sourceCommit:metadata.sourceCommit,state:'ready-to-deploy'};
await fs.writeFile(path.join(snapshot,'release.json'),JSON.stringify(release,null,2));
const stage=await fs.mkdtemp(path.join(os.tmpdir(),'nodeanimation-site-'));await fs.mkdir(path.join(stage,'.vercel'));await fs.copyFile('.vercel/project.json',path.join(stage,'.vercel/project.json'));await fs.cp(output,path.join(stage,'.vercel/output'),{recursive:true});
console.log('Snapshot and prebuilt staging ready:',version,stage);
let success=false;for(let attempt=0;attempt<3;attempt++){const code=await new Promise((resolve,reject)=>{const child=spawn(cli,['deploy','--prebuilt','--prod','--yes'],{cwd:stage,stdio:'inherit'});child.on('error',reject);child.on('exit',resolve);});if(code===0){success=true;break;}}
if(!success)throw new Error('Deployment did not complete. Retry the same staging folder.');
const expected=await fs.readFile(path.join(output,'static/fluid.html'),'utf8');const entry=expected.match(/src="([^"]+\.js)"/)?.[1];
for(let attempt=0;attempt<12;attempt++){const live=await fetch('https://nodeanimation.vercel.app/?embedded=fluid&release='+version+'&check='+Date.now()).then(r=>r.text());const published=await fetch('https://nodeanimation.vercel.app/deployment.json?check='+Date.now()).then(r=>r.json());if(live.includes(entry)&&published.sourceCommit===metadata.sourceCommit){release.state='deployed';release.verifiedEntry=entry;await fs.writeFile(path.join(snapshot,'release.json'),JSON.stringify(release,null,2));console.log('Verified production',version,entry);process.exit(0);}await new Promise(resolve=>setTimeout(resolve,3000));}
throw new Error('Production alias has not served the expected deployment yet.');
