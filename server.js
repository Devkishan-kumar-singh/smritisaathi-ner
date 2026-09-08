if(process.loadEnvFile){try{process.loadEnvFile()}catch(_){}}
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public'),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
const defaultEmergency={contactName:'Priya Sharma (Daughter)',phone:'+91 98765 43210',address:'House 12, Zoo Road, Near Ganesh Mandir, Guwahati, Assam'};
let emergencyStore={'default':structuredClone(defaultEmergency)};
const emergencyBackupFile=path.join(__dirname,'.emergency_store.json');
try{if(fs.existsSync(emergencyBackupFile)){const saved=JSON.parse(fs.readFileSync(emergencyBackupFile,'utf8'));if(saved&&typeof saved==='object')emergencyStore=Object.assign({},emergencyStore,saved);}}catch(_){}
http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  const parsedUrl=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  const pathname=parsedUrl.pathname;
  const familyId=parsedUrl.searchParams.get('familyId')||'default';
  if(pathname==='/api/config'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');return res.end(JSON.stringify({supabaseUrl:process.env.SUPABASE_URL||'',supabaseAnonKey:process.env.SUPABASE_ANON_KEY||'',demoMode:!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)}))}
  if(pathname==='/api/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,service:'SmritiSaathi NER'}))}
  if(pathname==='/api/emergency'||pathname==='/api/demo-emergency'){
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
    if(req.method==='POST'){
      let body='';
      req.on('data',chunk=>{body+=chunk});
      req.on('end',()=>{
        try{
          const parsed=JSON.parse(body);
          const fid=parsed.familyId||familyId||'default';
          const em=parsed.emergency||parsed;
          if(em&&typeof em==='object'){
            emergencyStore[fid]=Object.assign({},emergencyStore[fid]||defaultEmergency,em);
            try{fs.writeFileSync(emergencyBackupFile,JSON.stringify(emergencyStore));}catch(_){}
          }
          res.end(JSON.stringify({ok:true,emergency:emergencyStore[fid],familyId:fid}));
        }catch(e){
          res.statusCode=400;res.end(JSON.stringify({error:'Invalid JSON'}));
        }
      });
      return;
    }
    const current=familyId==='default'?(emergencyStore['default']||defaultEmergency):(emergencyStore[familyId]||null);
    return res.end(JSON.stringify({ok:true,emergency:current,familyId}));
  }
  const safe=path.normalize(pathname).replace(/^(\.\.[/\\])+/,''),requested=path.join(root,safe==='/'?'index.html':safe);
  const file=requested.startsWith(root)&&fs.existsSync(requested)&&fs.statSync(requested).isFile()?requested:path.join(root,'index.html');
  const ext=path.extname(file);
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');
  if(ext==='.html'||ext==='.js'||ext==='.json'){
    res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');
  }
  const stream=fs.createReadStream(file);
  stream.on('error',()=>{if(!res.headersSent)res.statusCode=500;res.end()});
  stream.pipe(res);
}).listen(process.env.PORT||3000,()=>console.log('SmritiSaathi NER running'));

