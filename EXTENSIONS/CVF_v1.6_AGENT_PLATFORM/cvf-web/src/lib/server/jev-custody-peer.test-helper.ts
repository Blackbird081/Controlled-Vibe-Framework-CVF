// Peers in one test read the same source files. Share compiled code, never custody state.
export const peerTypeScriptCache = String.raw`
const crypto=require('node:crypto');
const compileCache=path.join(path.dirname(release),'peer-js');
fs.mkdirSync(compileCache,{recursive:true});
require.extensions['.ts']=(mod,file)=>{
  const cached=path.join(compileCache,crypto.createHash('sha256').update(file).digest('hex')+'.cjs');
  let code;
  try{code=fs.readFileSync(cached,'utf8');}
  catch(error){
    if(error.code!=='ENOENT')throw error;
    const ts=require(path.join(path.dirname(production),'../../../node_modules/typescript'));
    code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const temporary=cached+'.'+process.pid;
    fs.writeFileSync(temporary,code);
    fs.renameSync(temporary,cached);
  }
  mod._compile(code,file);
};
`;
