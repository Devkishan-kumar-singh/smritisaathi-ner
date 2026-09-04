const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public'),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(req.url==='/api/config'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({supabaseUrl:process.env.SUPABASE_URL||'',supabaseAnonKey:process.env.SUPABASE_ANON_KEY||'',demoMode:!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)}))}
  if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,service:'SmritiSaathi NER'}))}
  const pathname=(req.url||'/').split('?')[0],safe=path.normalize(pathname).replace(/^(\.\.[/\\])+/,''),requested=path.join(root,safe==='/'?'index.html':safe);
  const file=requested.startsWith(root)&&fs.existsSync(requested)&&fs.statSync(requested).isFile()?requested:path.join(root,'index.html');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT||3000,()=>console.log('SmritiSaathi NER running'));
