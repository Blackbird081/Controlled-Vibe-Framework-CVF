import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, realpathSync, mkdirSync, existsSync, readdirSync, readFileSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { SQLiteAtomicRecordAdapter, SQLiteKeyedAtomicRecordStore, AtomicSQLiteError, sqliteSecurityTuplesEqual, normalizeSQLiteSecurityTuple, type SQLiteSecurityTuple, type AtomicSQLiteKeyedEntry, type AtomicSQLiteKeyedWrite } from '../src/mao/atomic.sqlite.record.store';

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
function child(directory:string,mode:string,release:string,script:string=bootstrap,extra:string[]=[]){
  const production=path.resolve('src/mao/atomic.sqlite.record.store.ts');
  const processPeer=spawn(process.execPath,['-e',script,production,directory,mode,release,...extra],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});
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
  it.skipIf(process.platform !== 'win32')('compares real complete Windows security before/after rollback and rejects every complete tuple adversary',()=>{
    const directory=root();try{
      const store=new SQLiteAtomicRecordAdapter(directory,'security');store.readAll();const before=security(store.databasePath);
      expect(()=>store.transaction(()=>({writes:[{id:'s',expectedRevision:null,value:1}],result:0}),{afterAcquire(){throw Error('FAIL');}})).toThrow(AtomicSQLiteError);
      const after=security(store.databasePath);expect(sqliteSecurityTuplesEqual(before,after)).toBe(true);expect(before.aces.length).toBeGreaterThan(0);
      const altered=[{...before,aces:[...before.aces,{...before.aces[0],rights:'999'}]}, {...before,aces:[{...before.aces[0],accessType:'Deny'},...before.aces.slice(1)]}, {...before,aces:[{...before.aces[0],isInherited:!before.aces[0].isInherited},...before.aces.slice(1)]}, {...before,ownerSid:'S-1-5-999'}];
      for(const tuple of altered)expect(sqliteSecurityTuplesEqual(before,tuple)).toBe(false);
      process.stdout.write('JEV_WINDOWS_SECURITY '+JSON.stringify({comparison:'SEMANTIC_PRESTATE_EQUALS_POST_ROLLBACK',tuple:JSON.parse(normalizeSQLiteSecurityTuple(before)),adversaries:['EXTRA_ALLOW','DENY','INHERITED','WRONG_OWNER']})+'\n');
    }finally{rmSync(directory,{recursive:true,force:true});}
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Opt-in keyed profile (SQLiteKeyedAtomicRecordStore): real better-sqlite3 files under os.tmpdir(), real peer processes.
// ---------------------------------------------------------------------------------------------------------------------
const nodeRequire = createRequire(import.meta.url);
type RawStatement = { run(...params: unknown[]): unknown; all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown };
type RawDatabase = { exec(sql: string): unknown; pragma(sql: string, options?: { simple?: boolean }): unknown; prepare(sql: string): RawStatement; close(): void };
const DB_FILE = 'cvf-keyvalue-store.sqlite';
const ROW_LIMIT = 16384;

// Independent peer: loads the production TypeScript module, so the lock is held by a different OS process.
const keyedBootstrap = String.raw`
const fs=require('node:fs'),path=require('node:path');
const production=process.argv[1],directory=process.argv[2],mode=process.argv[3],ctl=process.argv[4],key=process.argv[5]||'race';
const ts=require(path.join(process.cwd(),'node_modules/typescript'));
require.extensions['.ts']=(mod,file)=>{const text=fs.readFileSync(file,'utf8');mod._compile(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);};
const {SQLiteKeyedAtomicRecordStore}=require(production);
const store=new SQLiteKeyedAtomicRecordStore(directory,'peer',{maxRowBytes:16384});
const event=(name,extra={})=>process.stdout.write(JSON.stringify({event:name,pid:process.pid,...extra})+'\n');
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const waitFor=name=>{const end=Date.now()+15000;while(!fs.existsSync(path.join(ctl,name))){if(Date.now()>end)throw Error('DEADLOCK_SAFETY');sleep(1);}};
const cas=hooks=>store.transactionKeys([key],()=>({writes:[{id:key,expectedRevision:0,value:{by:mode}}],result:'WON'}),hooks);
event('READY');
process.stdin.once('data',()=>{
 try{
  if(mode==='holder'){const result=cas({afterAcquire(){event('HOLDING');waitFor('release');}});event('COMPLETE',{result});}
  else if(mode==='lock-on-signal'){
   const Database=require(path.join(process.cwd(),'node_modules/better-sqlite3'));
   event('WAITING');waitFor('lockreq');
   const db=new Database(path.join(directory,'cvf-keyvalue-store.sqlite'));db.pragma('busy_timeout = 0');db.exec('BEGIN IMMEDIATE');
   fs.writeFileSync(path.join(ctl,'locked'),'1');event('LOCKED');waitFor('release');db.exec('ROLLBACK');db.close();event('COMPLETE',{result:'RELEASED'});
  }
  else{event('ARMED');waitFor('go');const result=cas({});event('COMPLETE',{result});}
 }catch(error){event('COMPLETE',{code:error.code||error.message});}
 process.exit(0);
});`;

function rawOpen(directory: string): RawDatabase {
  const Database = nodeRequire('better-sqlite3') as new (filename: string) => RawDatabase;
  return new Database(path.join(directory, DB_FILE));
}
function rawRun(directory: string, sql: string, ...params: unknown[]): void {
  const db = rawOpen(directory);
  try { db.prepare(sql).run(...params); } finally { db.close(); }
}
function rawGet<T>(directory: string, sql: string, ...params: unknown[]): T {
  const db = rawOpen(directory);
  try { return db.prepare(sql).get(...params) as T; } finally { db.close(); }
}
function plant(directory: string, namespace: string, id: string, revision: unknown, item: string | Buffer): void {
  rawRun(directory, 'INSERT INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at) VALUES(?,?,?,?,?)', namespace, id, revision, item, 'planted');
}
function keyedDirectory(): string {
  const directory = root();
  SQLiteKeyedAtomicRecordStore.initialize(directory);
  return directory;
}
function keyedStore(directory: string, namespace = 'keyed', maxRowBytes = ROW_LIMIT): SQLiteKeyedAtomicRecordStore {
  return new SQLiteKeyedAtomicRecordStore(directory, namespace, { maxRowBytes });
}
function insertKeyed(store: SQLiteKeyedAtomicRecordStore, id: string, value: unknown): void {
  store.transactionKeys([id], () => ({ writes: [{ id, expectedRevision: null, value }], result: 0 }));
}
function thrown(operation: () => unknown): AtomicSQLiteError {
  try { operation(); } catch (error) { return error as AtomicSQLiteError; }
  throw new Error('EXPECTED_THROW');
}
function pause(milliseconds: number): void { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds); }
function waitForFileSync(file: string): void {
  const end = Date.now() + 15000;
  while (!existsSync(file)) { if (Date.now() > end) throw new Error('DEADLOCK_SAFETY'); pause(1); }
}
function spyOnJsonParse(): { seen: { length: number; marked: boolean; oversize: boolean }[]; restore: () => void } {
  const seen: { length: number; marked: boolean; oversize: boolean }[] = [];
  const original = JSON.parse;
  const spy = vi.spyOn(JSON, 'parse').mockImplementation((text: string, reviver?: (key: string, value: unknown) => unknown) => {
    seen.push({ length: String(text).length, marked: String(text).includes('MARKER'), oversize: String(text).includes('OVERSIZE_MARKER') });
    return original.call(JSON, text, reviver);
  });
  return { seen, restore: () => spy.mockRestore() };
}

describe('Keyed opt-in SQLite profile: explicit initialization and operational readiness', () => {
  it('initializes only inside an existing absolute non-symlink directory and never creates a directory', ctx => {
    const base = root();
    try {
      const missing = path.join(base, 'missing', 'nested');
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize(missing))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_MISSING' });
      expect(existsSync(path.join(base, 'missing'))).toBe(false);
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize('relative-dir'))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_INVALID' });
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize('\\\\server\\share\\journal'))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_INVALID' });
      const asFile = path.join(base, 'plain-file'); writeFileSync(asFile, 'x');
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize(asFile))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_INVALID' });
      expect(() => new SQLiteKeyedAtomicRecordStore('relative-dir', 'ns', { maxRowBytes: 100 })).toThrow('NOT_READY');
      const real = path.join(base, 'real'); mkdirSync(real);
      const link = path.join(base, 'link');
      try { symlinkSync(real, link, 'dir'); } catch { ctx.skip(); return; }
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize(link))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_INVALID' });
      expect(thrown(() => keyedStore(link).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_INVALID' });
      expect(readdirSync(real)).toEqual([]);
    } finally { rmSync(base, { recursive: true, force: true }); }
  });

  it('rejects a symlinked database file', ctx => {
    const base = root();
    try {
      const directory = path.join(base, 'journal'); mkdirSync(directory);
      const elsewhere = path.join(base, 'elsewhere.sqlite'); writeFileSync(elsewhere, '');
      try { symlinkSync(elsewhere, path.join(directory, DB_FILE), 'file'); } catch { ctx.skip(); return; }
      expect(thrown(() => SQLiteKeyedAtomicRecordStore.initialize(directory))).toMatchObject({ code: 'NOT_READY', detail: 'DATABASE_INVALID' });
      expect(thrown(() => keyedStore(directory).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'DATABASE_INVALID' });
      expect(statSync(elsewhere).size).toBe(0);
    } finally { rmSync(base, { recursive: true, force: true }); }
  });

  it('creates the schema and WAL only through initialize, idempotently, and shares the table with the legacy adapter', () => {
    const directory = root();
    try {
      expect(readdirSync(directory)).toEqual([]);
      const first = SQLiteKeyedAtomicRecordStore.initialize(directory);
      expect(first).toEqual({ databasePath: path.join(directory, DB_FILE), created: true });
      const db = rawOpen(directory);
      try {
        expect(String(db.pragma('journal_mode', { simple: true })).toLowerCase()).toBe('wal');
        expect(db.prepare('SELECT version FROM atomic_record_schema').all()).toEqual([{ version: 1 }]);
        const columns = (db.prepare('PRAGMA table_info(atomic_key_value_store)').all() as { name: string; type: string; notnull: number; pk: number }[]).map(c => [c.name, c.type, c.notnull, c.pk].join(':')).join(',');
        expect(columns).toBe('namespace:TEXT:1:1,id:TEXT:1:2,revision:INTEGER:1:0,item_json:TEXT:1:0,updated_at:TEXT:1:0');
      } finally { db.close(); }
      const store = keyedStore(directory, 'shared');
      insertKeyed(store, 'k1', { from: 'keyed' });
      expect(SQLiteKeyedAtomicRecordStore.initialize(directory).created).toBe(false);
      expect(store.readKeys(['k1'])).toEqual([{ id: 'k1', state: 'PRESENT', revision: 0, value: { from: 'keyed' } }]);
      // Same table, same canonical encoding: the legacy adapter reads the keyed row and the keyed store reads legacy rows.
      const legacy = new SQLiteAtomicRecordAdapter(directory, 'shared');
      expect(legacy.readAll()).toEqual([{ id: 'k1', revision: 0, value: { from: 'keyed' } }]);
      legacy.transaction(() => ({ writes: [{ id: 'k2', expectedRevision: null, value: { from: 'legacy' } }], result: 0 }));
      expect(store.readKeys(['k2', 'k1']).map(e => e.state)).toEqual(['PRESENT', 'PRESENT']);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('returns NOT_READY for a missing directory, a missing or deleted database and never creates anything', () => {
    const base = root();
    try {
      const missingDirectory = path.join(base, 'absent');
      const orphan = keyedStore(missingDirectory);
      expect(thrown(() => orphan.readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_MISSING' });
      expect(thrown(() => orphan.transactionKeys(['a'], () => ({ writes: [], result: 0 })))).toMatchObject({ code: 'NOT_READY', detail: 'DIRECTORY_MISSING' });
      expect(existsSync(missingDirectory)).toBe(false);

      const bare = path.join(base, 'bare'); mkdirSync(bare);
      const transition = vi.fn(() => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: 0 }));
      expect(thrown(() => keyedStore(bare).transactionKeys(['a'], transition))).toMatchObject({ code: 'NOT_READY', detail: 'DATABASE_MISSING' });
      expect(transition).not.toHaveBeenCalled();
      expect(readdirSync(bare)).toEqual([]);

      const initialized = path.join(base, 'initialized'); mkdirSync(initialized);
      SQLiteKeyedAtomicRecordStore.initialize(initialized);
      const live = keyedStore(initialized);
      insertKeyed(live, 'a', 1);
      for (const name of readdirSync(initialized)) unlinkSync(path.join(initialized, name));
      expect(thrown(() => live.readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'DATABASE_MISSING' });
      expect(thrown(() => live.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: null, value: 2 }], result: 0 })))).toMatchObject({ code: 'NOT_READY' });
      expect(readdirSync(initialized)).toEqual([]);
    } finally { rmSync(base, { recursive: true, force: true }); }
  });

  it('detects an un-initialized database and schema, version, shape, journal-mode drift without repairing it', () => {
    const base = root();
    const fresh = (name: string): string => { const directory = path.join(base, name); mkdirSync(directory); return directory; };
    try {
      const empty = fresh('empty'); writeFileSync(path.join(empty, DB_FILE), '');
      expect(thrown(() => keyedStore(empty).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'SCHEMA_MISSING' });
      expect(statSync(path.join(empty, DB_FILE)).size).toBe(0);

      const garbage = fresh('garbage'); writeFileSync(path.join(garbage, DB_FILE), 'this is not a sqlite database at all, just text');
      expect(thrown(() => keyedStore(garbage).readKeys(['a'])).code).toBe('CORRUPT');

      const wrongVersion = keyedDirectory(); rawRun(wrongVersion, 'UPDATE atomic_record_schema SET version = 2');
      expect(thrown(() => keyedStore(wrongVersion).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'SCHEMA_VERSION' });
      expect(rawGet<{ version: number }>(wrongVersion, 'SELECT version FROM atomic_record_schema').version).toBe(2);
      rawRun(wrongVersion, 'UPDATE atomic_record_schema SET version = 1'); rawRun(wrongVersion, 'INSERT INTO atomic_record_schema(version) VALUES(1)');
      expect(thrown(() => keyedStore(wrongVersion).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'SCHEMA_VERSION' });

      const missingVersionRow = keyedDirectory(); rawRun(missingVersionRow, 'DELETE FROM atomic_record_schema');
      expect(thrown(() => keyedStore(missingVersionRow).transactionKeys(['a'], () => ({ writes: [], result: 0 })))).toMatchObject({ code: 'NOT_READY', detail: 'SCHEMA_VERSION' });
      expect(rawGet<{ n: number }>(missingVersionRow, 'SELECT count(*) AS n FROM atomic_record_schema').n).toBe(0);

      const shape = fresh('shape');
      const shapeDb = rawOpen(shape);
      shapeDb.pragma('journal_mode = WAL');
      shapeDb.exec(`CREATE TABLE atomic_key_value_store (namespace TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL, item_json BLOB NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(namespace,id));
        CREATE TABLE atomic_record_schema (version INTEGER NOT NULL); INSERT INTO atomic_record_schema(version) VALUES(1);`);
      shapeDb.close();
      expect(thrown(() => keyedStore(shape).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'SCHEMA_SHAPE' });

      const notWal = fresh('not-wal');
      const notWalDb = rawOpen(notWal);
      notWalDb.exec(`CREATE TABLE atomic_key_value_store (namespace TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision >= 0), item_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(namespace,id));
        CREATE TABLE atomic_record_schema (version INTEGER NOT NULL); INSERT INTO atomic_record_schema(version) VALUES(1);`);
      notWalDb.close();
      expect(String(rawGet<{ journal_mode: string }>(notWal, 'PRAGMA journal_mode').journal_mode)).toBe('delete');
      expect(thrown(() => keyedStore(notWal).readKeys(['a']))).toMatchObject({ code: 'NOT_READY', detail: 'JOURNAL_MODE' });
      expect(String(rawGet<{ journal_mode: string }>(notWal, 'PRAGMA journal_mode').journal_mode)).toBe('delete');
    } finally { rmSync(base, { recursive: true, force: true }); }
  });

  it('rejects invalid key sets, profile options and keeps the legacy adapter semantics unchanged', () => {
    const directory = keyedDirectory();
    try {
      expect(() => new SQLiteKeyedAtomicRecordStore(directory, 'bad namespace!', { maxRowBytes: 10 })).toThrow('SCHEMA');
      expect(() => new SQLiteKeyedAtomicRecordStore(directory, 'ns', { maxRowBytes: 0 })).toThrow('SCHEMA');
      expect(() => new SQLiteKeyedAtomicRecordStore(directory, 'ns', { maxRowBytes: 100001 })).toThrow('SCHEMA');
      expect(() => new SQLiteKeyedAtomicRecordStore(directory, 'ns', { maxRowBytes: 100000 })).not.toThrow();
      const store = keyedStore(directory);
      const transition = vi.fn(() => ({ writes: [] as AtomicSQLiteKeyedWrite[], result: 0 }));
      for (const ids of [[], ['a', 'b', 'c', 'd', 'e'], ['a', 'a'], ['bad id'], ['x'.repeat(201)]]) {
        expect(thrown(() => store.readKeys(ids)).code).toBe('SCHEMA');
        expect(thrown(() => store.transactionKeys(ids, transition)).code).toBe('SCHEMA');
      }
      expect(transition).not.toHaveBeenCalled();
      expect(store.readKeys(['a', 'b', 'c', 'd']).map(e => e.state)).toEqual(['ABSENT', 'ABSENT', 'ABSENT', 'ABSENT']);
      // Legacy constructor still validates and throws SCHEMA (not NOT_READY) for a relative directory.
      expect(() => new SQLiteAtomicRecordAdapter('relative-path', 'bad')).toThrow('SCHEMA');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});

describe('Keyed opt-in SQLite profile: selected-key access, CAS, bounds and commit verification', () => {
  it('does not decode unrelated corrupt or oversize rows, and legacy readAll stays unusable on the same namespace', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      insertKeyed(store, 'good-a', { n: 1 }); insertKeyed(store, 'good-b', { n: 2 });
      plant(directory, 'keyed', 'bad-json', 0, 'CORRUPT_MARKER{ not json');
      plant(directory, 'keyed', 'bad-canonical', 0, '{ "spaced" : 1 } MARKER');
      plant(directory, 'keyed', 'bad-blob', 0, Buffer.from('{"blob":true} MARKER'));
      plant(directory, 'keyed', 'bad-revision', 'abc', '{"x":1}');
      plant(directory, 'keyed', 'huge', 0, JSON.stringify('OVERSIZE_MARKER' + 'x'.repeat(5_000_000)));
      const before = rawGet<{ item_json: string }>(directory, "SELECT item_json FROM atomic_key_value_store WHERE id='huge'").item_json;
      expect(before.length).toBeGreaterThan(5_000_000);

      const parse = spyOnJsonParse();
      try {
        const read = store.readKeys(['good-b', 'good-a', 'absent-one']);
        expect(read).toEqual([
          { id: 'good-b', state: 'PRESENT', revision: 0, value: { n: 2 } },
          { id: 'good-a', state: 'PRESENT', revision: 0, value: { n: 1 } },
          { id: 'absent-one', state: 'ABSENT' },
        ]);
        const result = store.transactionKeys(['good-a', 'good-b'], entries => ({
          writes: [{ id: 'good-a', expectedRevision: 0, value: { n: 10 } }],
          result: entries.map(e => e.state),
        }));
        expect(result).toEqual(['PRESENT', 'PRESENT']);
        expect(parse.seen.length).toBeGreaterThan(0);
        expect(parse.seen.some(call => call.marked)).toBe(false);
        expect(parse.seen.every(call => call.length < 100)).toBe(true);
      } finally { parse.restore(); }
      expect(store.readKeys(['good-a'])).toEqual([{ id: 'good-a', state: 'PRESENT', revision: 1, value: { n: 10 } }]);
      // Unrelated rows are byte-for-byte untouched.
      expect(rawGet<{ item_json: string }>(directory, "SELECT item_json FROM atomic_key_value_store WHERE id='huge'").item_json).toBe(before);
      // The legacy whole-namespace reader is blocked by the very same rows: this is the hazard the keyed path avoids.
      expect(thrown(() => new SQLiteAtomicRecordAdapter(directory, 'keyed').readAll()).code).toBe('CORRUPT');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('reports corrupt and oversize targets per key without parsing oversize bytes, distinct from present and absent keys', () => {
    const directory = keyedDirectory();
    try {
      const store = new SQLiteKeyedAtomicRecordStore(directory, 'keyed', { maxRowBytes: ROW_LIMIT, maxRowBytesFor: id => (id.startsWith('small-') ? 1000 : ROW_LIMIT) });
      insertKeyed(store, 'present', { ok: true });
      plant(directory, 'keyed', 'corrupt', 3, 'CORRUPT_MARKER{');
      plant(directory, 'keyed', 'noncanonical', 0, '{"a" : 1}');
      plant(directory, 'keyed', 'blobbed', 0, Buffer.from('{}'));
      plant(directory, 'keyed', 'bad-rev', 'abc', '{}');
      plant(directory, 'keyed', 'big', 1, JSON.stringify('OVERSIZE_MARKER' + 'y'.repeat(5_000_000)));
      plant(directory, 'keyed', 'small-over', 0, JSON.stringify('OVERSIZE_MARKER' + 'z'.repeat(1500)));
      plant(directory, 'keyed', 'small-ok', 0, JSON.stringify('z'.repeat(900)));
      plant(directory, 'keyed', 'ceiling-edge', 0, JSON.stringify('e'.repeat(ROW_LIMIT - 2)));
      plant(directory, 'keyed', 'ceiling-over', 0, JSON.stringify('e'.repeat(ROW_LIMIT - 1)));
      const parse = spyOnJsonParse();
      let mixed: AtomicSQLiteKeyedEntry[]; let second: AtomicSQLiteKeyedEntry[]; let third: AtomicSQLiteKeyedEntry[]; let fourth: AtomicSQLiteKeyedEntry[];
      try {
        mixed = store.readKeys(['present', 'corrupt', 'big', 'missing']);
        second = store.readKeys(['noncanonical', 'blobbed', 'bad-rev', 'small-over']);
        third = store.readKeys(['small-ok', 'ceiling-edge', 'ceiling-over']);
        fourth = store.transactionKeys(['big', 'present'], entries => ({ writes: [{ id: 'present', expectedRevision: 0, value: { ok: 2 } }], result: entries }));
        // Oversize bytes are never parsed (nor even delivered to JavaScript); a small corrupt target is parsed, proving the spy sees parses.
        expect(parse.seen.some(call => call.oversize)).toBe(false);
        expect(parse.seen.some(call => call.marked && !call.oversize)).toBe(true);
        expect(parse.seen.every(call => call.length <= ROW_LIMIT)).toBe(true);
      } finally { parse.restore(); }
      expect(mixed).toEqual([
        { id: 'present', state: 'PRESENT', revision: 0, value: { ok: true } },
        { id: 'corrupt', state: 'UNAVAILABLE', code: 'CORRUPT' },
        { id: 'big', state: 'UNAVAILABLE', code: 'OVERSIZE' },
        { id: 'missing', state: 'ABSENT' },
      ]);
      expect(second).toEqual([
        { id: 'noncanonical', state: 'UNAVAILABLE', code: 'CORRUPT' },
        { id: 'blobbed', state: 'UNAVAILABLE', code: 'CORRUPT' },
        { id: 'bad-rev', state: 'UNAVAILABLE', code: 'CORRUPT' },
        { id: 'small-over', state: 'UNAVAILABLE', code: 'OVERSIZE' },
      ]);
      expect(third.map(e => e.state)).toEqual(['PRESENT', 'PRESENT', 'UNAVAILABLE']);
      expect(third[2]).toEqual({ id: 'ceiling-over', state: 'UNAVAILABLE', code: 'OVERSIZE' });
      // The transition sees the same distinguishable entries; the healthy key still commits next to an oversize one.
      expect(fourth).toEqual([{ id: 'big', state: 'UNAVAILABLE', code: 'OVERSIZE' }, { id: 'present', state: 'PRESENT', revision: 0, value: { ok: true } }]);
      expect(store.readKeys(['present'])[0]).toMatchObject({ revision: 1, value: { ok: 2 } });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('refuses to write or delete an unavailable target and preserves its bytes', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      plant(directory, 'keyed', 'corrupt', 0, 'CORRUPT_MARKER{');
      plant(directory, 'keyed', 'big', 0, JSON.stringify('x'.repeat(ROW_LIMIT + 10)));
      for (const id of ['corrupt', 'big']) {
        expect(thrown(() => store.transactionKeys([id], () => ({ writes: [{ id, expectedRevision: 0, value: 1 }], result: 0 }))).code).toBe('CORRUPT');
        expect(thrown(() => store.transactionKeys([id], () => ({ writes: [{ id, expectedRevision: 0, delete: true }], result: 0 }))).code).toBe('CORRUPT');
        expect(thrown(() => store.transactionKeys([id], () => ({ writes: [{ id, expectedRevision: null, value: 1 }], result: 0 }))).code).toBe('CORRUPT');
      }
      expect(rawGet<{ item_json: string }>(directory, "SELECT item_json FROM atomic_key_value_store WHERE id='corrupt'").item_json).toBe('CORRUPT_MARKER{');
      expect(rawGet<{ n: number }>(directory, 'SELECT count(*) AS n FROM atomic_key_value_store').n).toBe(2);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('enforces insert, update and delete revision predicates and rolls back all writes on one conflict', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      expect(store.transactionKeys(['a', 'b'], entries => ({ writes: [{ id: 'a', expectedRevision: null, value: { v: 1 } }, { id: 'b', expectedRevision: null, value: { v: 1 } }], result: entries.map(e => e.state) }))).toEqual(['ABSENT', 'ABSENT']);
      expect(store.readKeys(['a', 'b']).map(e => (e.state === 'PRESENT' ? e.revision : -1))).toEqual([0, 0]);
      // Insert over an existing key, stale update, stale delete, delete of an absent key: all CONFLICT, nothing changes.
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: null, value: { v: 9 } }], result: 0 }))).code).toBe('CONFLICT');
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 5, value: { v: 9 } }], result: 0 }))).code).toBe('CONFLICT');
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 5, delete: true }], result: 0 }))).code).toBe('CONFLICT');
      expect(thrown(() => store.transactionKeys(['zzz'], () => ({ writes: [{ id: 'zzz', expectedRevision: 0, delete: true }], result: 0 }))).code).toBe('CONFLICT');
      expect(thrown(() => store.transactionKeys(['zzz'], () => ({ writes: [{ id: 'zzz', expectedRevision: 0, value: 1 }], result: 0 }))).code).toBe('CONFLICT');
      expect(thrown(() => store.transactionKeys(['a', 'b'], () => ({ writes: [{ id: 'a', expectedRevision: 0, value: { v: 2 } }, { id: 'b', expectedRevision: 7, value: { v: 2 } }], result: 0 }))).code).toBe('CONFLICT');
      expect(store.readKeys(['a', 'b'])).toEqual([{ id: 'a', state: 'PRESENT', revision: 0, value: { v: 1 } }, { id: 'b', state: 'PRESENT', revision: 0, value: { v: 1 } }]);
      // Update bumps the revision by exactly one; CAS delete removes the row; the key can then be inserted again at revision 0.
      store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 0, value: { v: 2 } }], result: 0 }));
      store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 1, value: { v: 3 } }], result: 0 }));
      expect(store.readKeys(['a'])[0]).toEqual({ id: 'a', state: 'PRESENT', revision: 2, value: { v: 3 } });
      store.transactionKeys(['a', 'b'], () => ({ writes: [{ id: 'a', expectedRevision: 2, delete: true }, { id: 'b', expectedRevision: 0, value: { v: 4 } }], result: 0 }));
      expect(store.readKeys(['a', 'b'])).toEqual([{ id: 'a', state: 'ABSENT' }, { id: 'b', state: 'PRESENT', revision: 1, value: { v: 4 } }]);
      insertKeyed(store, 'a', { again: true });
      expect(store.readKeys(['a'])[0]).toMatchObject({ state: 'PRESENT', revision: 0 });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('keeps namespaces isolated for the same id', () => {
    const directory = keyedDirectory();
    try {
      const one = keyedStore(directory, 'tenant-one'); const two = keyedStore(directory, 'tenant-two');
      insertKeyed(one, 'same', { tenant: 1 });
      expect(two.readKeys(['same'])).toEqual([{ id: 'same', state: 'ABSENT' }]);
      insertKeyed(two, 'same', { tenant: 2 });
      two.transactionKeys(['same'], () => ({ writes: [{ id: 'same', expectedRevision: 0, delete: true }], result: 0 }));
      expect(two.readKeys(['same'])).toEqual([{ id: 'same', state: 'ABSENT' }]);
      expect(one.readKeys(['same'])[0]).toEqual({ id: 'same', state: 'PRESENT', revision: 0, value: { tenant: 1 } });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('rejects writes outside the selected keys, malformed write shapes and over-limit rows without writing anything', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      insertKeyed(store, 'in', { v: 1 }); insertKeyed(store, 'outside', { v: 1 });
      const attempt = (ids: string[], writes: unknown[]): string => thrown(() => store.transactionKeys(ids, () => ({ writes: writes as AtomicSQLiteKeyedWrite[], result: 0 }))).code;
      expect(attempt(['in'], [{ id: 'outside', expectedRevision: 0, value: { v: 2 } }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'outside', expectedRevision: 0, delete: true }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0, value: 2 }, { id: 'new', expectedRevision: null, value: 2 }])).toBe('SCHEMA');
      expect(attempt(['in', 'x'], [{ id: 'in', expectedRevision: 0, value: 2 }, { id: 'in', expectedRevision: 0, value: 3 }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0, value: 2 }, { id: 'in', expectedRevision: 0, value: 3 }, { id: 'in', expectedRevision: 0, value: 4 }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: null, delete: true }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0, delete: false }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0, delete: true, value: 1 }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: -1, value: 1 }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0.5, value: 1 }])).toBe('SCHEMA');
      expect(attempt(['in'], [{ id: 'in', expectedRevision: 0, value: undefined }])).toBe('SCHEMA');
      expect(attempt(['in'], [null])).toBe('SCHEMA');
      const nonArray = thrown(() => store.transactionKeys(['in'], () => ({ writes: 'nope' as unknown as AtomicSQLiteKeyedWrite[], result: 0 })));
      expect(nonArray.code).toBe('SCHEMA');
      // Row byte bound is on UTF-8 bytes of the canonical JSON, applied on write.
      const tight = keyedStore(directory, 'tight', 1000);
      insertKeyed(tight, 'edge', 'x'.repeat(998)); // canonical JSON is exactly 1000 bytes
      expect(thrown(() => tight.transactionKeys(['over'], () => ({ writes: [{ id: 'over', expectedRevision: null, value: 'x'.repeat(999) }], result: 0 }))).code).toBe('SCHEMA');
      expect(thrown(() => tight.transactionKeys(['multi'], () => ({ writes: [{ id: 'multi', expectedRevision: null, value: '\u00e9'.repeat(500) }], result: 0 }))).code).toBe('SCHEMA');
      const stricter = new SQLiteKeyedAtomicRecordStore(directory, 'tight', { maxRowBytes: 1000, maxRowBytesFor: id => (id.startsWith('edge') ? 500 : 1000) });
      expect(thrown(() => stricter.transactionKeys(['edge-new'], () => ({ writes: [{ id: 'edge-new', expectedRevision: null, value: 'x'.repeat(600) }], result: 0 }))).code).toBe('SCHEMA');
      expect(stricter.readKeys(['edge'])).toEqual([{ id: 'edge', state: 'UNAVAILABLE', code: 'OVERSIZE' }]);
      const badLimit = new SQLiteKeyedAtomicRecordStore(directory, 'tight', { maxRowBytes: 1000, maxRowBytesFor: () => 5000 });
      expect(thrown(() => badLimit.readKeys(['edge'])).code).toBe('SCHEMA');
      expect(store.readKeys(['in', 'outside', 'new']).map(e => e.state)).toEqual(['PRESENT', 'PRESENT', 'ABSENT']);
      expect(tight.readKeys(['edge', 'over', 'multi']).map(e => e.state)).toEqual(['PRESENT', 'ABSENT', 'ABSENT']);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('propagates application errors, maps hook failures before commit to IO and leaves no partial rows', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      insertKeyed(store, 'a', 1);
      const marker = new Error('APPLICATION_REFUSAL');
      expect(thrown(() => store.transactionKeys(['a'], () => { throw marker; }))).toBe(marker);
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 0, value: 2 }], result: 0 }), { beforeCommit() { throw new Error('FAIL'); } })).code).toBe('IO');
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 0, value: 2 }], result: 0 }), { afterAcquire() { throw new Error('FAIL'); } })).code).toBe('IO');
      expect(store.readKeys(['a'])[0]).toEqual({ id: 'a', state: 'PRESENT', revision: 0, value: 1 });
      // A failure after acquire released the write lock: the next transaction proceeds.
      store.transactionKeys(['a'], () => ({ writes: [{ id: 'a', expectedRevision: 0, value: 3 }], result: 0 }));
      expect(store.readKeys(['a'])[0]).toMatchObject({ revision: 1, value: 3 });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('returns COMMIT_UNKNOWN when the written keys cannot be verified after COMMIT and verifies only those keys', () => {
    const directory = keyedDirectory();
    try {
      const store = keyedStore(directory);
      for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) insertKeyed(store, id, { v: 1 });
      const put = (id: string, expectedRevision: number, value: unknown): AtomicSQLiteKeyedWrite => ({ id, expectedRevision, value });
      // Lost acknowledgement.
      expect(thrown(() => store.transactionKeys(['a'], () => ({ writes: [put('a', 0, { v: 2 })], result: 0 }), { afterCommit() { throw new Error('LOST_ACK'); } })).code).toBe('COMMIT_UNKNOWN');
      expect(store.readKeys(['a'])[0]).toMatchObject({ revision: 1, value: { v: 2 } });
      // Another handle tampers with the committed JSON, the revision, or re-creates a deleted row.
      expect(thrown(() => store.transactionKeys(['c'], () => ({ writes: [put('c', 0, { v: 3 })], result: 0 }), { afterCommit() { rawRun(directory, "UPDATE atomic_key_value_store SET item_json='{\"v\":99}' WHERE id='c'"); } })).code).toBe('COMMIT_UNKNOWN');
      expect(thrown(() => store.transactionKeys(['d'], () => ({ writes: [put('d', 0, { v: 4 })], result: 0 }), { afterCommit() { rawRun(directory, "UPDATE atomic_key_value_store SET revision=revision+5 WHERE id='d'"); } })).code).toBe('COMMIT_UNKNOWN');
      expect(thrown(() => store.transactionKeys(['b'], () => ({ writes: [{ id: 'b', expectedRevision: 0, delete: true }], result: 0 }), { afterCommit() { plant(directory, 'keyed', 'b', 0, '{"v":1}'); } })).code).toBe('COMMIT_UNKNOWN');
      expect(thrown(() => store.transactionKeys(['e'], () => ({ writes: [put('e', 0, { v: 5 })], result: 0 }), { afterCommit() { rawRun(directory, "UPDATE atomic_key_value_store SET item_json=CAST('{\"v\":5}' AS BLOB) WHERE id='e'"); } })).code).toBe('COMMIT_UNKNOWN');
      // Verification is limited to the written keys: corrupting an unrelated row after COMMIT does not matter.
      plant(directory, 'keyed', 'unrelated', 0, '{"u":1}');
      expect(store.transactionKeys(['f'], () => ({ writes: [put('f', 0, { v: 6 })], result: 'ok' }), { afterCommit() { rawRun(directory, "UPDATE atomic_key_value_store SET item_json='CORRUPT_MARKER{' WHERE id='unrelated'"); } })).toBe('ok');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('contains no namespace scan or readAll in the keyed code path', () => {
    const source = readFileSync(path.resolve('src/mao/atomic.sqlite.record.store.ts'), 'utf8');
    const keyed = source.slice(source.indexOf('export const ATOMIC_SQLITE_MAX_ROW_BYTES'), source.indexOf('export type SQLiteSecurityTuple'));
    expect(keyed.length).toBeGreaterThan(1000);
    expect(keyed).not.toMatch(/readAll|this\.rows\(|ORDER BY|structuredClone\(after|SELECT id,revision,item_json/);
    expect((keyed.match(/FROM atomic_key_value_store WHERE namespace = \? AND id IN/g) ?? []).length).toBe(1);
    expect(keyed).not.toMatch(/mkdirSync|mkdir\(/);
    const operational = keyed.slice(keyed.indexOf('  private validateIds'));
    expect(operational).not.toMatch(/journal_mode = WAL|CREATE TABLE|INSERT INTO atomic_record_schema|ALTER TABLE|DROP TABLE/);
  });
});

describe('Keyed opt-in SQLite profile: independent-process contention', () => {
  it('returns BUSY immediately, without waiting, when a peer holds the write lock before open or acquires it after open', async () => {
    const directory = keyedDirectory(); const ctl = root();
    let holder: ReturnType<typeof child> | undefined; let contender: ReturnType<typeof child> | undefined; let locker: ReturnType<typeof child> | undefined;
    try {
      const store = keyedStore(directory, 'peer');
      insertKeyed(store, 'race', { seeded: true });
      store.readKeys(['race']); // warm the module and caches; the budget below measures only the keyed operation
      const cas = (): AtomicSQLiteKeyedWrite[] => [{ id: 'race', expectedRevision: 0, value: { by: 'parent' } }];

      // Peer 1: holds BEGIN IMMEDIATE BEFORE the parent opens.
      holder = child(directory, 'holder', ctl, keyedBootstrap);
      await holder.wait('READY'); holder.process.stdin!.write('START'); await holder.wait('HOLDING');
      const startedAt = performance.now();
      const busy = thrown(() => store.transactionKeys(['race'], () => ({ writes: cas(), result: 0 })));
      const elapsed = performance.now() - startedAt;
      expect(busy.code).toBe('BUSY');
      expect(elapsed).toBeLessThan(100);
      // WAL readers are not blocked by the peer's write lock, and still do not wait.
      const readStart = performance.now();
      expect(store.readKeys(['race'])[0]).toMatchObject({ state: 'PRESENT', revision: 0, value: { seeded: true } });
      expect(performance.now() - readStart).toBeLessThan(100);

      // A second independent process also gets BUSY while the holder still holds the lock.
      contender = child(directory, 'contender', ctl, keyedBootstrap);
      await contender.wait('READY'); contender.process.stdin!.write('START'); await contender.wait('ARMED');
      writeFileSync(path.join(ctl, 'go'), 'go');
      expect((await contender.wait('COMPLETE')).code).toBe('BUSY');
      await exited(contender.process);

      writeFileSync(path.join(ctl, 'release'), 'release');
      expect((await holder.wait('COMPLETE')).result).toBe('WON');
      await exited(holder.process);
      expect(store.readKeys(['race'])[0]).toEqual({ id: 'race', state: 'PRESENT', revision: 1, value: { by: 'holder' } });
      // The parent's stale CAS now fails with a conflict rather than overwriting the peer's commit.
      expect(thrown(() => store.transactionKeys(['race'], () => ({ writes: cas(), result: 0 }))).code).toBe('CONFLICT');

      // Peer 2: acquires the lock AFTER the parent's open validation but BEFORE its BEGIN IMMEDIATE.
      const ctl2 = root(); writeFileSync(path.join(ctl2, 'unused'), '');
      locker = child(directory, 'lock-on-signal', ctl2, keyedBootstrap);
      await locker.wait('READY'); locker.process.stdin!.write('START'); await locker.wait('WAITING');
      let hookReturnedAt = 0;
      const lateBusy = thrown(() => store.transactionKeys(['race'], () => ({ writes: [{ id: 'race', expectedRevision: 1, value: { by: 'parent' } }], result: 0 }), {
        afterOpen() { writeFileSync(path.join(ctl2, 'lockreq'), '1'); waitForFileSync(path.join(ctl2, 'locked')); hookReturnedAt = performance.now(); },
      }));
      expect(lateBusy.code).toBe('BUSY');
      expect(performance.now() - hookReturnedAt).toBeLessThan(100);
      writeFileSync(path.join(ctl2, 'release'), 'release');
      expect((await locker.wait('COMPLETE')).result).toBe('RELEASED');
      await exited(locker.process);
      // The lock was released cleanly and the stale write never landed.
      store.transactionKeys(['race'], () => ({ writes: [{ id: 'race', expectedRevision: 1, value: { by: 'parent' } }], result: 0 }));
      expect(store.readKeys(['race'])[0]).toMatchObject({ revision: 2, value: { by: 'parent' } });
      rmSync(ctl2, { recursive: true, force: true });
    } finally {
      holder?.process.kill(); contender?.process.kill(); locker?.process.kill();
      rmSync(directory, { recursive: true, force: true }); rmSync(ctl, { recursive: true, force: true });
    }
  }, 60000);

  it('lets exactly one of two independent processes win a CAS race on the same key, repeated three times', async () => {
    const directory = keyedDirectory();
    const peers: ReturnType<typeof child>[] = []; const controls: string[] = [];
    try {
      const store = keyedStore(directory, 'peer');
      const outcomes: string[] = [];
      for (let round = 0; round < 3; round += 1) {
        const key = `race${round}`; const ctl = root(); controls.push(ctl);
        insertKeyed(store, key, { seeded: round });
        const first = child(directory, `racer-a${round}`, ctl, keyedBootstrap, [key]);
        const second = child(directory, `racer-b${round}`, ctl, keyedBootstrap, [key]);
        peers.push(first, second);
        await first.wait('READY'); await second.wait('READY');
        first.process.stdin!.write('START'); second.process.stdin!.write('START');
        await first.wait('ARMED'); await second.wait('ARMED');
        writeFileSync(path.join(ctl, 'go'), 'go');
        const results = [await first.wait('COMPLETE'), await second.wait('COMPLETE')];
        await exited(first.process); await exited(second.process);
        const winners = results.filter(r => r.result === 'WON');
        const losers = results.filter(r => r.result !== 'WON');
        expect(winners).toHaveLength(1);
        expect(losers).toHaveLength(1);
        expect(['CONFLICT', 'BUSY']).toContain(losers[0].code);
        const final = store.readKeys([key])[0];
        expect(final).toMatchObject({ state: 'PRESENT', revision: 1 });
        expect((final as { value: { by: string } }).value.by).toBe(winners[0] === results[0] ? `racer-a${round}` : `racer-b${round}`);
        outcomes.push(String(losers[0].code));
      }
      process.stdout.write('KEYED_CAS_RACE ' + JSON.stringify({ rounds: 3, loserCodes: outcomes }) + '\n');
    } finally {
      for (const peer of peers) peer.process.kill();
      rmSync(directory, { recursive: true, force: true }); for (const ctl of controls) rmSync(ctl, { recursive: true, force: true });
    }
  }, 90000);
});
