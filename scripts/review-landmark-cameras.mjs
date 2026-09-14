import {createServer} from 'vite';

const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-landmark-camera',
  optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
  const {reviewLandmarkCameras}=await server.ssrLoadModule('/scripts/review-landmark-cameras.ts');
  await reviewLandmarkCameras();
}finally{await server.close();}
