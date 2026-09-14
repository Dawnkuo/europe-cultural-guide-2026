import Clipper from 'clipper-lib';
import { area } from '../museums/footprints.mjs';

export function metres(value) {
  if (value == null) return null;
  const text = String(value).trim();
  const metric = text.match(/^(\d+(?:\.\d+)?)\s*(?:m|metres|meters)?$/i);
  if (metric) return Number(metric[1]);
  const imperial = text.match(/^(\d+(?:\.\d+)?)\s*(?:ft|')\s*(?:(\d+(?:\.\d+)?)\s*(?:in|"))?$/i);
  return imperial ? Number(imperial[1]) * .3048 + Number(imperial[2] ?? 0) * .0254 : null;
}

export function buildingHeight(tags) {
  const tagged = metres(tags.height ?? tags['building:height']);
  const levels = Number(tags['building:levels']);
  const roof = metres(tags['roof:height']) ?? 0;
  const heightSource = tagged > 0 ? 'tagged' : levels > 0 && levels < 200 ? 'levels' : 'estimated';
  const height = heightSource === 'tagged' ? tagged : heightSource === 'levels' ? levels * 3 + roof
    : ['garage', 'garages', 'shed', 'kiosk', 'roof'].includes(tags.building) ? 3 : 9;
  const minHeight = metres(tags.min_height) ?? (Number(tags['building:min_level']) || 0) * 3;
  return { height, minHeight, heightSource };
}

export function containsPoint(geometry, point) {
  function inside(ring) {
    let result = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
    }
    return result;
  }
  return geometry.some(poly => inside(poly[0]) && !poly.slice(1).some(inside));
}

export function lineBuffer(points, width) {
  const polygons = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < .01) continue;
    const x = -(b[1] - a[1]) / length * width / 2, y = (b[0] - a[0]) / length * width / 2;
    const ring = [[a[0]+x,a[1]+y],[b[0]+x,b[1]+y],[b[0]-x,b[1]-y],[a[0]-x,a[1]-y],[a[0]+x,a[1]+y]];
    polygons.push([ring]);
  }
  return polygons.length ? union(polygons.map(p=>[p])) : [];
}

// A reviewed architectural axis takes precedence over the minimum-area box.
export function orientedFrame(geometry, axisAngle) {
  const points = geometry.flatMap(p => p[0]);
  if (axisAngle !== undefined) {
    if (!Number.isFinite(axisAngle) || !points.length) throw Error('Invalid reviewed footprint axis');
    const c = Math.cos(axisAngle), s = Math.sin(axisAngle);
    const u = points.map(p => p[0]*c+p[1]*s), v = points.map(p => -p[0]*s+p[1]*c);
    const minU=Math.min(...u),maxU=Math.max(...u),minV=Math.min(...v),maxV=Math.max(...v);
    return {area:(maxU-minU)*(maxV-minV),angle:axisAngle,length:maxU-minU,width:maxV-minV,
      center:[(minU+maxU)/2*c-(minV+maxV)/2*s,(minU+maxU)/2*s+(minV+maxV)/2*c]};
  }
  let best;
  for (const polygon of geometry) for (let i = 1; i < polygon[0].length; i++) {
    const a = polygon[0][i - 1], b = polygon[0][i];
    if (Math.hypot(b[0]-a[0],b[1]-a[1]) < 2) continue;
    const angle = Math.atan2(b[1]-a[1],b[0]-a[0]);
    const c = Math.cos(angle), s = Math.sin(angle);
    const u = points.map(p => p[0]*c+p[1]*s), v = points.map(p => -p[0]*s+p[1]*c);
    const minU=Math.min(...u),maxU=Math.max(...u),minV=Math.min(...v),maxV=Math.max(...v);
    const w=maxU-minU,h=maxV-minV;
    if (!best || w*h<best.area) best={area:w*h,angle:angle+(h>w?Math.PI/2:0),length:Math.max(w,h),width:Math.min(w,h),center:[(minU+maxU)/2*c-(minV+maxV)/2*s,(minU+maxU)/2*s+(minV+maxV)/2*c]};
  }
  return best ?? { area: area(geometry), angle: 0, length: 20, width: 20, center: [0,0] };
}

function operation(name, items) {
  // Integer millimetres avoid unstable near-coincident street intersections.
  const engine=new Clipper.Clipper(),tree=new Clipper.PolyTree();
  items.forEach((geometry,index)=>{
    const paths=geometry.flatMap(poly=>poly.map((ring,i)=>{
      const path=ring.slice(0,-1).map(([x,y])=>({X:Math.round(x*1000),Y:Math.round(y*1000)}));
      if(Clipper.Clipper.Orientation(path)!==(i===0))path.reverse();
      return path;
    }));
    engine.AddPaths(paths,name==='union'||index===0?Clipper.PolyType.ptSubject:Clipper.PolyType.ptClip,true);
  });
  const type={union:Clipper.ClipType.ctUnion,difference:Clipper.ClipType.ctDifference,intersection:Clipper.ClipType.ctIntersection}[name];
  if(!engine.Execute(type,tree,Clipper.PolyFillType.pftNonZero,Clipper.PolyFillType.pftNonZero))throw Error(`Polygon ${name} failed`);
  const result=[];
  const ring=node=>{const points=node.Contour().map(p=>[p.X/1000,p.Y/1000]);return [...points,points[0]];};
  function visit(node){
    if(node.Contour().length&&!node.IsHole())result.push([ring(node),...node.Childs().filter(n=>n.IsHole()).map(ring)]);
    node.Childs().forEach(visit);
  }
  visit(tree);
  return result;
}
export function union(items) { const valid=items.filter(g=>g.length);return valid.length ? operation('union',valid) : []; }
export function subtract(a, b) { return a.length && b.length ? operation('difference',[a,b]) : a; }
export function intersect(a, b) { return a.length && b.length ? operation('intersection',[a,b]) : []; }
export function rounded(geometry) { return geometry.map(p=>p.map(r=>r.map(point=>point.map(n=>Math.round(n*1000)/1000)))); }

export function offset(geometry, distance) {
  const engine=new Clipper.ClipperOffset(2,.25),tree=new Clipper.PolyTree();
  for(const polygon of geometry)polygon.forEach((ring,i)=>{
    const path=ring.slice(0,-1).map(([x,y])=>({X:Math.round(x*1000),Y:Math.round(y*1000)}));
    if(Clipper.Clipper.Orientation(path)!==(i===0))path.reverse();
    engine.AddPath(path,Clipper.JoinType.jtSquare,Clipper.EndType.etClosedPolygon);
  });
  engine.Execute(tree,distance*1000);
  const result=[];
  const ring=node=>{const points=node.Contour().map(p=>[p.X/1000,p.Y/1000]);return [...points,points[0]];};
  function visit(node){
    if(node.Contour().length&&!node.IsHole())result.push([ring(node),...node.Childs().filter(n=>n.IsHole()).map(ring)]);
    node.Childs().forEach(visit);
  }
  visit(tree);
  return result;
}
