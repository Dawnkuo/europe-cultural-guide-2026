import { createServer } from 'vite';

// Transform the same TS recipes used by the viewer, without opening an HTTP server.
const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-exterior-composition',
  optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
  const {composeExteriorContext}=await server.ssrLoadModule('/scripts/compose-exterior-context.ts');
  await composeExteriorContext(process.argv.slice(2));
}finally{await server.close();}
