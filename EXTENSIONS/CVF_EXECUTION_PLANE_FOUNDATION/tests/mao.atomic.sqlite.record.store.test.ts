import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, realpathSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { SQLiteAtomicRecordAdapter, AtomicSQLiteError, sqliteSecurityTuplesEqual, normalizeSQLiteSecurityTuple, type SQLiteSecurityTuple } from '../src/mao/atomic.sqlite.record.store';

// The bootstrap is embedded here: no generated helper file or copied SQL.
const bootstrap = String.raw`
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const production=process.argv[1],directory=process.argv[2],mode=process.argv[3],release=process.argv[4];
const ts=require(path.join(process.cwd(),'node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>{const text=fs.readFileSync(file,'utf8');mod._compile(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);};
const {SQLiteAtomicRecordAdapter}=require(production);
const adapter=new SQLiteAtomicRecordAdapter(directory,'peer',5000);
const event=(name,extra={})=>process.stdout.write(JSON.stringify({event:name,pid:process.pid,production:fs.realpathSync(production),...extra})+'\n');
event('READY');
process.stdin.once('data',()=>{
 event('START_ATTEMPT');event('ATTEMPTING');
 try{const result=adapter.transaction(rows=>{const existing=rows.find(r=>r.id==='shared-nonce');return existing?{writes:[],result:{duplicate:true,winner:existing.value.mode}}:{writes:['shared-nonce','shared-run','shared-quota'].map(id=>({id,expectedRevision:null,value:{mode}})),result:{duplicate:false,winner:mode}};},{afterAcquire(){event('ENTERED',{released:fs.existsSync(release)});if(mode==='holder'){const end=Date.now()+10000;while(!fs.existsSync(release)){if(Date.now()>end)throw Error('DEADLOCK_SAFETY');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}}if(mode==='fail')throw Error('POST_ACQUIRE');}});event('COMPLETE',result);}
 catch(error){event('COMPLETE',{code:error.code||error.message});}
 process.exit(0);
});`;
function root(){return mkdtempSync(path.join(tmpdir(),'cvf-jev-atomic-owned-'));}
function child(directory:string,mode:string,release:string){
  const production=path.resolve('src/mao/atomic.sqlite.record.store.ts');
  const processPeer=spawn(process.execPath,['-e',bootstrap,production,directory,mode,release],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});
  const events:Record<string,unknown>[]=[];let buffer='';let stderr='';
  processPeer.stdout!.on('data',data=>{buffer+=String(data);const lines=buffer.split('\n');buffer=lines.pop()!;for(const line of lines){if(line)events.push(JSON.parse(line));}});
  processPeer.stderr!.on('data',data=>{stderr+=String(data);});
  async function wait(event:string){const end=Date.now()+12000;while(!events.some(e=>e.event===event)){if(Date.now()>end||processPeer.exitCode!==null)throw Error(`PEER_${event}: ${stderr}`);await new Promise(resolve=>setImmediate(resolve));}return events.find(e=>e.event===event)!;}
  return {process:processPeer,events,wait,production:realpathSync(production)};
}
async function exited(peer:ChildProcess){if(peer.exitCode!==null)return;await new Promise<void>(resolve=>peer.once('exit',()=>resolve()));}
function security(filename:string):SQLiteSecurityTuple{
  const script=String.raw`$ErrorActionPreference='Stop'; $acl=Get-Acl -LiteralPath $env:CVF_TEST_SQLITE_SECURITY_PATH; $owner=([System.Security.Principal.NTAccount]$acl.Owner).Translate([System.Security.Principal.SecurityIdentifier]).Value; $aces=@($acl.Access | ForEach-Object { [ordered]@{sid=$_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value;rights=[string]$_.FileSystemRights.value__;accessType=[string]$_.AccessControlType;isInherited=[bool]$_.IsInherited;inheritanceFlags=[string]$_.InheritanceFlags;propagationFlags=[string]$_.PropagationFlags} }); [ordered]@{ownerSid=$owner;protectionState=[bool]$acl.AreAccessRulesProtected;inheritanceState=[bool](@($acl.Access | Where-Object IsInherited).Count -gt 0);aces=$aces} | ConvertTo-Json -Depth 5 -Compress`;
  return JSON.parse(execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',env:{...process.env,CVF_TEST_SQLITE_SECURITY_PATH:filename}}));
}
describe('Jev opted-in real SQLite production transactions',()=>{
  it('rejects malformed database/schema, noncanonical records and unapproved directory fallback',()=>{
    const directory=root();try{
      expect(()=>new SQLiteAtomicRecordAdapter('relative-path','bad')).toThrow('SCHEMA');
      const file=path.join(directory,'not-a-directory');writeFileSync(file,'x');expect(()=>new SQLiteAtomicRecordAdapter(file,'bad')).toThrow('SCHEMA');
      const corrupt=path.join(directory,'corrupt');mkdirSync(corrupt);writeFileSync(path.join(corrupt,'cvf-keyvalue-store.sqlite'),'not-sqlite');expect(()=>new SQLiteAtomicRecordAdapter(corrupt,'bad').readAll()).toThrow('CORRUPT');
    }finally{rmSync(directory,{recursive:true,force:true});}
  });
  it('inserts one nonce/run/quota batch; CAS/reopen/partial rollback fail closed',()=>{
    const directory=root();try{
      const store=new SQLiteAtomicRecordAdapter(directory,'atomic');
      expect(store.transaction(()=>({writes:['nonce','run','quota'].map(id=>({id,expectedRevision:null,value:{id}})),result:'inserted'}))).toBe('inserted');
      const pre=store.readAll();expect(pre).toHaveLength(3);
      expect(()=>store.transaction(()=>({writes:[{id:'run',expectedRevision:1,value:{changed:true}}],result:0}))).toThrowError('CONFLICT');
      expect(()=>store.transaction(()=>({writes:[{id:'run',expectedRevision:0,value:{changed:true}},{id:'extra',expectedRevision:null,value:1}],result:0}),{beforeCommit(){throw Error('FAIL');}})).toThrowError('IO');
      expect(new SQLiteAtomicRecordAdapter(directory,'atomic').readAll()).toEqual(pre);
      expect(()=>store.transaction(()=>({writes:[{id:'run',expectedRevision:0,value:{done:true}}],result:0}),{afterCommit(){throw Error('LOST_ACK');}})).toThrowError('COMMIT_UNKNOWN');
      expect(store.readAll().find(r=>r.id==='run')?.revision).toBe(1);
    }finally{rmSync(directory,{recursive:true,force:true});}
  });
  it('rejects transaction write and serialized-size bounds without partial rows',()=>{
    const directory=root();try {const store=new SQLiteAtomicRecordAdapter(directory,'limits');
      expect(()=>store.transaction(()=>({writes:Array.from({length:11},(_,i)=>({id:`r${i}`,expectedRevision:null,value:i})),result:0}))).toThrow('SCHEMA');
      expect(()=>store.transaction(()=>({writes:[{id:'large',expectedRevision:null,value:'x'.repeat(100001)}],result:0}))).toThrow('SCHEMA');
      expect(store.readAll()).toEqual([]);
    }finally{rmSync(directory,{recursive:true,force:true})}
  });
  it('real second production processes enter only after deterministic parent release and release after post-acquire failure',async()=>{
    const directory=root();const release=path.join(directory,'parent-release');let holder:ReturnType<typeof child>|undefined;let contender:ReturnType<typeof child>|undefined;
    try{
      const initialized=new SQLiteAtomicRecordAdapter(directory,'peer');initialized.readAll();
      holder=child(directory,'holder',release);await holder.wait('READY');holder.process.stdin!.write('START');await holder.wait('ENTERED');
      expect(()=>new SQLiteAtomicRecordAdapter(directory,'peer',0).transaction(()=>({writes:[],result:0}))).toThrow('BUSY');
      contender=child(directory,'contender',release);await contender.wait('READY');contender.process.stdin!.write('START');await contender.wait('ATTEMPTING');
      expect(contender.events.some(e=>e.event==='ENTERED')).toBe(false);
      const parentRelease={event:'PARENT_RELEASE',production:contender.production};writeFileSync(release,'release');
      expect((await holder.wait('COMPLETE')).duplicate).toBe(false);const entered=await contender.wait('ENTERED');const completed=await contender.wait('COMPLETE');expect(completed.duplicate).toBe(true);expect(completed.winner).toBe('holder');expect(initialized.readAll()).toHaveLength(3);
      expect(parentRelease.event).toBe('PARENT_RELEASE');expect(entered.released).toBe(true);expect(entered.production).toBe(contender.production);expect(entered.pid).not.toBe(process.pid);
      await exited(holder.process);await exited(contender.process);
      const failing=child(directory,'fail',release);await failing.wait('READY');failing.process.stdin!.write('START');expect((await failing.wait('COMPLETE')).code).toBe('IO');await exited(failing.process);
      const following=child(directory,'following',release);await following.wait('READY');following.process.stdin!.write('START');expect((await following.wait('COMPLETE')).code).toBeUndefined();await exited(following.process);
      process.stdout.write('JEV_REAL_PEER '+JSON.stringify({production:entered.production,peerPid:entered.pid,barriers:['READY','START_ATTEMPT','ATTEMPTING','PARENT_RELEASE','ENTERED','COMPLETE'],postAcquireFailure:'SUBSEQUENT_PEER_ACQUIRES'})+'\n');
    }finally{holder?.process.kill();contender?.process.kill();rmSync(directory,{recursive:true,force:true});}
  },30000);
  it('compares real complete Windows security before/after rollback and rejects every complete tuple adversary',()=>{
    expect(process.platform).toBe('win32');const directory=root();try{
      const store=new SQLiteAtomicRecordAdapter(directory,'security');store.readAll();const before=security(store.databasePath);
      expect(()=>store.transaction(()=>({writes:[{id:'s',expectedRevision:null,value:1}],result:0}),{afterAcquire(){throw Error('FAIL');}})).toThrow(AtomicSQLiteError);
      const after=security(store.databasePath);expect(sqliteSecurityTuplesEqual(before,after)).toBe(true);expect(before.aces.length).toBeGreaterThan(0);
      const altered=[{...before,aces:[...before.aces,{...before.aces[0],rights:'999'}]}, {...before,aces:[{...before.aces[0],accessType:'Deny'},...before.aces.slice(1)]}, {...before,aces:[{...before.aces[0],isInherited:!before.aces[0].isInherited},...before.aces.slice(1)]}, {...before,ownerSid:'S-1-5-999'}];
      for(const tuple of altered)expect(sqliteSecurityTuplesEqual(before,tuple)).toBe(false);
      process.stdout.write('JEV_WINDOWS_SECURITY '+JSON.stringify({comparison:'SEMANTIC_PRESTATE_EQUALS_POST_ROLLBACK',tuple:JSON.parse(normalizeSQLiteSecurityTuple(before)),adversaries:['EXTRA_ALLOW','DENY','INHERITED','WRONG_OWNER']})+'\n');
    }finally{rmSync(directory,{recursive:true,force:true});}
  });
});
