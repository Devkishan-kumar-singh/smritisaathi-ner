if(process.loadEnvFile){try{process.loadEnvFile()}catch(_){}}
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public'),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
let demoEmergency={contactName:'Priya Sharma (Daughter)',phone:'+91 98765 43210',address:'House 12, Zoo Road, Near Ganesh Mandir, Guwahati, Assam'};
const emergencyBackupFile=path.join(__dirname,'.demo_emergency.json');
try{if(fs.existsSync(emergencyBackupFile)){const saved=JSON.parse(fs.readFileSync(emergencyBackupFile,'utf8'));if(saved&&typeof saved==='object')demoEmergency=Object.assign({},demoEmergency,saved);}}catch(_){}
http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(req.url==='/api/config'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({supabaseUrl:process.env.SUPABASE_URL||'',supabaseAnonKey:process.env.SUPABASE_ANON_KEY||'',demoMode:!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)}))}
  if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,service:'SmritiSaathi NER'}))}
  if(req.url==='/api/demo-emergency'){
    res.setHeader('Content-Type','application/json');
    if(req.method==='POST'){
      let body='';
      req.on('data',chunk=>{body+=chunk});
      req.on('end',()=>{
        try{
          const parsed=JSON.parse(body);
          if(parsed&&typeof parsed==='object'){
            demoEmergency=Object.assign({},demoEmergency,parsed);
            try{fs.writeFileSync(emergencyBackupFile,JSON.stringify(demoEmergency));}catch(_){}
          }
          res.end(JSON.stringify({ok:true,emergency:demoEmergency}));
        }catch(e){
          res.statusCode=400;res.end(JSON.stringify({error:'Invalid JSON'}));
        }
      });
      return;
    }
    return res.end(JSON.stringify({ok:true,emergency:demoEmergency}));
  }
  const pathname=(req.url||'/').split('?')[0],safe=path.normalize(pathname).replace(/^(\.\.[/\\])+/,''),requested=path.join(root,safe==='/'?'index.html':safe);
  const file=requested.startsWith(root)&&fs.existsSync(requested)&&fs.statSync(requested).isFile()?requested:path.join(root,'index.html');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  const stream=fs.createReadStream(file);
  stream.on('error',()=>{if(!res.headersSent)res.statusCode=500;res.end()});
  stream.pipe(res);
}).listen(process.env.PORT||3000,()=>console.log('SmritiSaathi NER running'));

