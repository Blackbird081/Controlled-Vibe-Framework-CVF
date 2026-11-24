import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, open, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { ProviderExecutionError, sanitizeGatewayProviderUsage, type NativeInferenceProcessState } from '../../unified-gateway-interface-contract';
import type { ProviderExecutionAdapter } from '../../provider-execution-bridge';

export interface ClaudeCliProbeOptions { executablePath: string; executableSha256: string; env: Readonly<Record<string,string|undefined>>; timeoutMs?: number; signal?: AbortSignal; deadlineMonotonicMs?: number }
export interface ClaudeCliAdapterOptions extends ClaudeCliProbeOptions { maxDurationMs?: number }
export type ClaudeCliSubscriptionStatus = { state:'available'|'unavailable'|'unknown'; checkedAt:string; executionSurface:'claude_cli_subscription' };
const surface = 'claude_cli_subscription' as const;
const envNames = ['PATH','SystemRoot','WINDIR','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','COMSPEC','PATHEXT'];
function cleanEnv(env: Readonly<Record<string,string|undefined>>): Record<string,string> {
  const out:Record<string,string>={}; for(const name of envNames){const key=Object.keys(env).find(k=>k.toLowerCase()===name.toLowerCase());if(key && typeof env[key]==='string')out[name]=env[key]!;}
  out.CLAUDE_CODE_SAFE_MODE='1'; return out;
}
function remaining(deadline:number, signal?:AbortSignal): number { if(signal?.aborted) return 0; return Math.max(0,deadline-performance.now()); }
function effectiveDeadline(options:ClaudeCliProbeOptions,max:number):number { return options.deadlineMonotonicMs !== undefined && !Number.isFinite(options.deadlineMonotonicMs) ? 0 : Math.min(options.deadlineMonotonicMs ?? Infinity,performance.now()+max); }
// The caller is bounded even when an operating-system filesystem request stalls.
// The abandoned operation retains ownership and continues its cleanup when it resolves.
async function bounded<T>(deadline:number, signal:AbortSignal|undefined, fallback:()=>T, work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
 if(remaining(deadline,signal)<=0)return fallback();
 const controller=new AbortController(); const cancel=()=>controller.abort(); signal?.addEventListener('abort',cancel,{once:true});
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([work(controller.signal),new Promise<T>((resolve,reject)=>{const finish=()=>{try{resolve(fallback());}catch(e){reject(e);}};controller.signal.addEventListener('abort',finish,{once:true});timer=setTimeout(cancel,remaining(deadline));if(signal?.aborted)cancel();})]);}
 finally{if(timer)clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
async function verifiedExecutable(options:ClaudeCliProbeOptions,deadline:number):Promise<boolean> {
  if (!path.isAbsolute(options.executablePath) || !/\.exe$/i.test(options.executablePath) || !/^[a-f0-9]{64}$/i.test(options.executableSha256) || remaining(deadline,options.signal)<=0) return false;
  try { const hash=createHash('sha256'); const stream=createReadStream(options.executablePath); options.signal?.addEventListener('abort',()=>stream.destroy(),{once:true}); for await(const chunk of stream){if(remaining(deadline,options.signal)<=0){stream.destroy();return false;}hash.update(chunk as Buffer);} return hash.digest('hex')===options.executableSha256.toLowerCase() && remaining(deadline,options.signal)>0; } catch { return false; }
}
type ChildResult={ok:boolean; stdout:Buffer; processState:NativeInferenceProcessState; closed:Promise<void>};
async function run(executable:string,args:string[],cwd:string,env:Record<string,string>,input:Buffer,deadline:number,signal?:AbortSignal):Promise<ChildResult>{
  if(remaining(deadline,signal)<=0)return {ok:false,stdout:Buffer.alloc(0),processState:'not_started',closed:Promise.resolve()};
  return new Promise(resolve=>{
    let child:ReturnType<typeof spawn>;let state:NativeInferenceProcessState='not_started';let done=false;let out=0,err=0;const chunks:Buffer[]=[];
    try {child=spawn(executable,args,{cwd,env:env as NodeJS.ProcessEnv,shell:false,windowsHide:true,stdio:[input.length ? 'pipe' : 'ignore','pipe','pipe']});} catch {resolve({ok:false,stdout:Buffer.alloc(0),processState:'not_started',closed:Promise.resolve()});return;}
    let closedResolve!:()=>void;const closed=new Promise<void>(r=>{closedResolve=r;});let stopping=false;let teardown:ReturnType<typeof setTimeout>|undefined;
    const finish=(ok:boolean, forced:boolean)=>{ if(done)return; done=true;clearTimeout(timer);if(teardown)clearTimeout(teardown);signal?.removeEventListener('abort',abort);resolve({ok,stdout:forced?Buffer.alloc(0):Buffer.concat(chunks),processState:forced?'unknown':state,closed}); };
    const stop=()=>{if(!done&&!stopping){stopping=true;try{child.kill();}catch{}child.stdin?.destroy();child.stdout?.removeAllListeners('data');child.stderr?.removeAllListeners('data');child.stdout?.destroy();child.stderr?.destroy();teardown=setTimeout(()=>finish(false,true),Math.min(200,remaining(deadline)));}};
    const abort=()=>stop();signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(stop,Math.max(0,remaining(deadline,signal)-200)); if(signal?.aborted)stop();
    child.on('spawn',()=>{state='started';}); child.on('error',()=>{if(state!=='started')state='unknown';});
    child.stdout?.on('data',(c:Buffer)=>{out+=c.length;if(out>65536)stop();else chunks.push(c);});
    child.stderr?.on('data',(c:Buffer)=>{err+=c.length;if(err>8192)stop();});
    if(child.stdin){child.stdin.on('error',()=>stop());child.stdin.end(input);}
    child.on('close',(code)=>{closedResolve();finish(code===0&&!stopping&&out<=65536&&err<=8192&&remaining(deadline,signal)>0,stopping);});
  });
}
function parsed(value:Buffer):Record<string,unknown>|null{try{const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(value));return v && typeof v==='object' && !Array.isArray(v)?v:null;}catch{return null;}}
export async function probeClaudeCliSubscription(options:ClaudeCliProbeOptions):Promise<ClaudeCliSubscriptionStatus>{
 const result=(state:ClaudeCliSubscriptionStatus['state']):ClaudeCliSubscriptionStatus=>({state,checkedAt:new Date().toISOString(),executionSurface:surface});
 const ms=options.timeoutMs === undefined ? 5000 : Math.min(5000,options.timeoutMs); if(!Number.isFinite(ms)||ms<=0)return result('unknown');
 const deadline=effectiveDeadline(options,ms);return bounded(deadline,options.signal,()=>result('unknown'),async signal=>{
 options={...options,signal};if(!(await verifiedExecutable(options,deadline)))return result('unknown');let dir:string|undefined;let state:ClaudeCliSubscriptionStatus['state']='unknown';
 try{dir=await mkdtemp(path.join(tmpdir(),'cvf-claude-auth-'));if(remaining(deadline,options.signal)<=0)throw new Error('deadline');const child=await run(options.executablePath,['--safe-mode','--restricted','auth','status'],dir,cleanEnv(options.env),Buffer.alloc(0),deadline,options.signal);await child.closed;const v=child.ok?parsed(child.stdout):null;if(v?.loggedIn===true && v.authMethod==='claude.ai' && v.apiProvider==='firstParty' && typeof v.subscriptionType==='string' && ['pro','max','team','enterprise'].includes(v.subscriptionType))state='available';else if(v?.loggedIn===false)state='unavailable';}catch{state='unknown';}finally{if(dir)try{await rmdir(dir);}catch{state='unknown';}}
 return result(state);
 });
}
export function createClaudeCliExecutionAdapter(options:ClaudeCliAdapterOptions):ProviderExecutionAdapter {
 return {providerId:'claude',async execute(input){
  let state:NativeInferenceProcessState='not_started';let code:ConstructorParameters<typeof ProviderExecutionError>[0]='unknown_error';let dir:string|undefined,file:string|undefined;let processPending=false;let answer:import('../../provider-execution-bridge').ProviderExecutionAdapterResult|undefined;
  const fail:(c:typeof code)=>never=(c)=>{code=c;throw new Error('controlled');};
  const limit=options.maxDurationMs===undefined?60000:options.maxDurationMs;
  const deadline=effectiveDeadline(options,Math.min(60000,Number.isFinite(limit)&&limit>0?limit:0));
  const signal = input.signal && options.signal ? AbortSignal.any([input.signal,options.signal]) : input.signal ?? options.signal;
  const failed=()=>{throw new ProviderExecutionError(input.signal?.aborted||options.signal?.aborted?'request_cancelled':'provider_timeout',{executionSurface:surface,nativeProcessState:processPending?'unknown':state});};
  return bounded(deadline,signal,failed,async boundedSignal=>{
  try {
   if(input.providerId!=='claude'||input.modelId!=='sonnet')fail('invalid_identity');
   if(Buffer.byteLength(input.prompt)>65536||Buffer.byteLength(input.systemPrompt??'')>65536)fail('output_incomplete');
   if(remaining(deadline,signal)<=0 || remaining(deadline,options.signal)<=0)fail(signal?.aborted?'request_cancelled':'provider_timeout');
   const auth=await probeClaudeCliSubscription({...options,timeoutMs:Math.min(5000,remaining(deadline,signal)),signal:boundedSignal,deadlineMonotonicMs:deadline});
   if(auth.state!=='available')fail(remaining(deadline,signal)<=0?'provider_timeout':'credential_unavailable');
   if(remaining(deadline,boundedSignal)<=0||remaining(deadline,options.signal)<=0)fail('provider_timeout');
   dir=await mkdtemp(path.join(tmpdir(),'cvf-claude-run-'));if(remaining(deadline,boundedSignal)<=0)fail('provider_timeout');file=path.join(dir,'system.txt');const handle=await open(file,'wx',0o600);try{if(remaining(deadline,boundedSignal)<=0)fail('provider_timeout');await handle.writeFile(input.systemPrompt??'','utf8');}finally{await handle.close();}
   if(remaining(deadline,boundedSignal)<=0||remaining(deadline,options.signal)<=0)fail('provider_timeout');
   const args=['--print','--output-format','json','--no-session-persistence','--model','sonnet','--system-prompt-file',file,'--safe-mode','--restricted','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--tools','','--no-chrome','--disable-slash-commands','--permission-prompts','none','--setting-sources',''];
   processPending=true;const child=await run(options.executablePath,args,dir,cleanEnv(options.env),Buffer.from(input.prompt,'utf8'),deadline,boundedSignal);state=child.processState;await child.closed;
   if(!child.ok)fail(signal?.aborted?'request_cancelled':remaining(deadline,signal)<=0?'provider_timeout':'unknown_error');
   const data=parsed(child.stdout);if(data?.type==='result' && data.is_error===true)fail('unknown_error');if(!data||data.type!=='result'||data.subtype!=='success'||data.is_error!==false||typeof data.result!=='string'||!data.result.trim())fail('output_incomplete');
   const usage=data.usage && typeof data.usage==='object'? data.usage as Record<string,unknown>:{};const safeUsage=sanitizeGatewayProviderUsage({inputTokens:usage.input_tokens,outputTokens:usage.output_tokens});
   const model=typeof data.model==='string'&&/^[A-Za-z0-9._:-]{1,120}$/.test(data.model)?data.model:undefined;
   answer={text:data.result as string,executionSurface:surface,nativeProcessState:state,...(model?{observedModelId:model}:{}),...(safeUsage?{providerUsage:safeUsage}:{}),...(safeUsage?.inputTokens!==undefined&&safeUsage.outputTokens!==undefined?{usage:{inputTokens:safeUsage.inputTokens,outputTokens:safeUsage.outputTokens}}:{})};
  }catch{answer=undefined;}finally{if(file)try{await unlink(file);}catch{answer=undefined;code='unknown_error';}if(dir)try{await rmdir(dir);}catch{answer=undefined;code='unknown_error';}}
  if(remaining(deadline,signal)<=0){answer=undefined;code=signal?.aborted?'request_cancelled':'provider_timeout';}
  if(!answer)throw new ProviderExecutionError(code,{executionSurface:surface,nativeProcessState:state});return answer;
  });
 }};
}
