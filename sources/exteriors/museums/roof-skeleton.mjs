// The bundled CGAL/Wasm build expects browser globals even though it needs no DOM.
const previousSelf=globalThis.self,previousWindow=globalThis.window;
globalThis.self??=globalThis;globalThis.window??={};
const {default:module}=await import('straight-skeleton');
await module.SkeletonBuilder.init();
if(previousSelf===undefined)delete globalThis.self;
if(previousWindow===undefined)delete globalThis.window;
const cache=new Map();
export function skeleton(poly){
 // Overlapping OSM outlines can leave tiny slivers at shared walls.
 // Remove only these roof-only numerical holes; keep the source footprint intact.
 const ringArea=r=>Math.abs(r.slice(1).reduce((s,b,j)=>s+r[j][0]*b[1]-b[0]*r[j][1],0)/2);
 const cleaned=poly.filter((r,i)=>i===0||ringArea(r)>=.25).map((r,i)=>{
  const p=r.slice(0,-1).map(p=>p.map(x=>+x.toFixed(3))).filter((p,j,a)=>!j||p[0]!==a[j-1][0]||p[1]!==a[j-1][1]);
  if(p[0][0]===p.at(-1)[0]&&p[0][1]===p.at(-1)[1])p.pop();
  for(let changed=true;changed&&p.length>3;){changed=false;for(let j=0;j<p.length;j++){const a=p[(j+p.length-1)%p.length],b=p[j],c=p[(j+1)%p.length];if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-5){p.splice(j,1);changed=true;break;}}}
  const signed=p.reduce((s,a,j)=>{const b=p[(j+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
  if((signed>0)!==(i===0))p.reverse();return p.concat([p[0]]);
 });
 const key=JSON.stringify(cleaned);if(cache.has(key))return cache.get(key);
 const result=module.SkeletonBuilder.buildFromPolygon(cleaned);
 if(!result)throw Error('Roof skeleton failed: '+JSON.stringify(cleaned));
 cache.set(key,result);return result;
}
