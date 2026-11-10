import { describe, it, expect } from 'vitest';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { SQLiteAtomicRecordAdapter } from '../src/mao/atomic.sqlite.record.store';
import { NonWebCanonicalController,type NonWebBinding } from '../src/mao/nonweb.canonical.custody';
const binding: NonWebBinding={parentId:'parent',outcomeId:'out',criteriaRevision:'c',criteriaHash:'ch',authorityRevision:'a',authorityHash:'ah',principalId:'p',role:'worker',reviewerRef:'r',verdictRef:'v',expiresAt:'2099-01-01T00:00:00Z',currency:'USD',maxAttempts:2,moneyCap:160};
const authority={authorizeProvision:()=>true,current:(b:NonWebBinding)=>({...b,revoked:false,veto:false})};
describe('durable custody',()=>{
 it('keeps unknown amount held across restart, blocks replay and enforces parent cap',()=>{const dir=mkdtempSync(path.join(tmpdir(),'cvf-t3b-'));try{let c=new NonWebCanonicalController(new SQLiteAtomicRecordAdapter(dir,'recover'),authority);c.provision(binding);const id=c.request('parent','first',80);c.claim('first','p');c.start('first','p','provider','model','guard','context');c=new NonWebCanonicalController(new SQLiteAtomicRecordAdapter(dir,'recover'),authority);expect(c.read('first').canonicalExecutionId).toBe(id);c.recover('first');expect(c.read('first')).toMatchObject({state:'UNKNOWN',quota:{stages:{attempt0:{state:'UNKNOWN',cost:null}}}});expect(()=>c.start('first','p','provider','model','guard','context')).toThrow();c.request('parent','second',80);expect(()=>c.request('parent','third',80)).toThrow('PARENT_CAP');expect(()=>c.provision(binding)).toThrow('PARENT_EXISTS');}finally{rmSync(dir,{recursive:true,force:true})}});
 it('releases only reserved amounts and retains consumed attempt',()=>{const dir=mkdtempSync(path.join(tmpdir(),'cvf-t3b-'));try{const c=new NonWebCanonicalController(new SQLiteAtomicRecordAdapter(dir,'recover'),authority);c.provision(binding);c.request('parent','first',80);c.stop('first','DENIED');expect(c.read('first').state).toBe('RELEASED');c.request('parent','second',80);expect(()=>c.request('parent','third',80)).toThrow('PARENT_CAP');}finally{rmSync(dir,{recursive:true,force:true})}});
 it('accepts identical settlement only once and rejects changed settlement',()=>{const dir=mkdtempSync(path.join(tmpdir(),'cvf-t3b-'));try{const c=new NonWebCanonicalController(new SQLiteAtomicRecordAdapter(dir,'recover'),authority);c.provision(binding);c.request('parent','first',80);c.claim('first','p');c.start('first','p','provider','model','guard','context');const evidence={cost:30,validationRef:'valid',receiptRef:'receipt',manifestRef:'manifest',auditRef:'audit',terminal:'SUCCEEDED'};c.finish('first',evidence);expect(()=>c.finish('first',evidence)).not.toThrow();expect(()=>c.finish('first',{...evidence,cost:31})).toThrow('SETTLEMENT_CONFLICT');expect(()=>c.stop('first','DENIED')).toThrow('STOP_DENIED');}finally{rmSync(dir,{recursive:true,force:true})}});

 it('two real processes contest the last parent slot and one durable denial remains',async()=>{
   const dir=mkdtempSync(path.join(tmpdir(),'cvf-t3b-race-'));
   const script=String.raw`
const fs=require('node:fs'),path=require('node:path'),ts=require(path.join(process.cwd(),'node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {SQLiteAtomicRecordAdapter}=require(path.resolve('src/mao/atomic.sqlite.record.store.ts'));
const {NonWebCanonicalController}=require(path.resolve('src/mao/nonweb.canonical.custody.ts'));
const dir=process.argv[1],request=process.argv[2];
const auth={authorizeProvision:()=>true,current:b=>({...b,revoked:false,veto:false})};
const c=new NonWebCanonicalController(new SQLiteAtomicRecordAdapter(dir,'race',5000),auth);
process.stdout.write('READY\n');process.stdin.once('data',()=>{try{c.request('parent',request,80);process.stdout.write('ADMITTED\n')}catch(e){process.stdout.write(e.message+'\n')}process.exit(0)});`;
   const children:any[]=[];
   try{const store=new SQLiteAtomicRecordAdapter(dir,'race');const c=new NonWebCanonicalController(store,authority);c.provision({...binding,maxAttempts:1,moneyCap:80});
     const run=(name:string)=>{const p=spawn(process.execPath,['-e',script,dir,name],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',(x:Buffer)=>{out+=x.toString()});p.stderr.on('data',(x:Buffer)=>{err+=x.toString()});children.push(p);return {p,get out(){return out},get err(){return err}}};
     const a=run('first'),b=run('second');const until=async(predicate:()=>boolean)=>{const end=Date.now()+10000;while(!predicate()){if(Date.now()>end)throw Error(`PEER_TIMEOUT ${a.err} ${b.err}`);await new Promise(r=>setTimeout(r,5))}};
     await until(()=>a.out.includes('READY')&&b.out.includes('READY'));a.p.stdin.write('go');b.p.stdin.write('go');await until(()=>a.p.exitCode!==null&&b.p.exitCode!==null);
     expect([a.out,b.out].filter(x=>x.includes('ADMITTED'))).toHaveLength(1);expect([a.out,b.out].filter(x=>x.includes('PARENT_CAP'))).toHaveLength(1);
     const rows=store.readAll();expect(rows.filter(x=>x.id.startsWith('request:'))).toHaveLength(1);expect(rows.filter(x=>x.id.startsWith('denial:'))).toHaveLength(1);expect(rows.find(x=>x.id==='parent:parent')!.value).toMatchObject({attempts:1,denied:1,held:80});
   }finally{for(const p of children)if(p.exitCode===null)p.kill();rmSync(dir,{recursive:true,force:true})}
 },30000);

 it('refuses untrusted provisioning and parent overwrite',()=>{const dir=mkdtempSync(path.join(tmpdir(),'cvf-t3b-'));try{const store=new SQLiteAtomicRecordAdapter(dir,'auth');const denied=new NonWebCanonicalController(store,{...authority,authorizeProvision:()=>false});expect(()=>denied.provision(binding)).toThrow('PROVISION_DENIED');expect(store.readAll()).toEqual([]);const allowed=new NonWebCanonicalController(store,authority);allowed.provision(binding);expect(()=>allowed.provision({...binding,moneyCap:9999})).toThrow('PARENT_EXISTS');expect(store.readAll().find(r=>r.id==='parent:parent')!.value).toMatchObject({binding:{moneyCap:160,outcomeId:'out'}});}finally{rmSync(dir,{recursive:true,force:true})}});

});
