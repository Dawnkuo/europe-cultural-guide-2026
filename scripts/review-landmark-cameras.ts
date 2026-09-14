import fs from 'node:fs';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {guideCatalog} from '../app/data/guides';
import {LANDMARK_EXTERIOR_SLUGS} from '../app/lib/landmark-exterior-registry';
import {buildExteriorContext,landmarkAnchorBounds} from '../app/lib/exterior-context';
import {perspectiveFitDistance} from '../app/lib/exterior-geometry';
import {disposeStPetersModel} from '../app/lib/st-peters-model';
import {exteriorAuditModel,mergedLandmarkGeometry} from './lib/exterior-model-audit';

export async function reviewLandmarkCameras(){
  const cameras:Record<string,number[]>={},report=[];
  for(const slug of LANDMARK_EXTERIOR_SLUGS){
    const model=await exteriorAuditModel(guideCatalog.find(g=>g.slug===slug)!);
    const box=landmarkAnchorBounds(model),sphere=box.getBoundingSphere(new T.Sphere());
    const geometry=mergedLandmarkGeometry(model),target=new MeshBVH(geometry);
    let context:T.Group|undefined,contextGeometry:T.BufferGeometry|undefined,neighbours:MeshBVH|undefined;
    if(slug!=='gondola'){
      context=buildExteriorContext(JSON.parse(fs.readFileSync(`public/maps/exterior-context/${slug}.json`,'utf8')),box).root;
      contextGeometry=mergedLandmarkGeometry(context);neighbours=new MeshBVH(contextGeometry);
    }
    const candidates=[];
    // Select a view, never remove a real neighbouring building to reveal the model.
    for(const elevation of [35,45,55,65,75])for(const offset of [0,45,-45,90,-90,135,-135,180]){
      const preferredYaw=slug==='spanish-steps'?Math.atan2(-107,48):Math.atan2(1.38,1.78);
      const yaw=preferredYaw+offset*Math.PI/180,tilt=elevation*Math.PI/180;
      const direction=new T.Vector3(Math.sin(yaw)*Math.cos(tilt),Math.sin(tilt),Math.cos(yaw)*Math.cos(tilt));
      const visibility=[];
      for(const aspect of [1280/720,352/480]){
        const camera=new T.PerspectiveCamera(35,aspect,.1,10000);
        camera.position.copy(sphere.center).addScaledVector(direction,perspectiveFitDistance(sphere.radius,aspect,35,1.22));
        camera.lookAt(sphere.center);camera.updateMatrixWorld(true);
        const ray=new T.Raycaster();let hits=0,visible=0;
        for(let y=-.9;y<=.9;y+=.075)for(let x=-.9;x<=.9;x+=.075){
          ray.setFromCamera(new T.Vector2(x,y),camera);
          const hit=target.raycastFirst(ray.ray,T.DoubleSide);
          if(!hit)continue;
          hits++;
          const blocked=neighbours?.raycastFirst(ray.ray,T.DoubleSide,0,hit.distance-.02);
          if(!blocked)visible++;
        }
        visibility.push(hits?visible/hits:0);
      }
      candidates.push({direction:direction.toArray(),elevation,offset,visibility,min:Math.min(...visibility)});
    }
    candidates.sort((a,b)=>{
      const aClear=a.min>=.94,bClear=b.min>=.94;
      if(aClear!==bClear)return aClear?-1:1;
      if(!aClear)return b.min-a.min;
      return (Math.abs(a.elevation-45)+Math.abs(a.offset)*.15)-(Math.abs(b.elevation-45)+Math.abs(b.offset)*.15);
    });
    const selected=candidates[0];cameras[slug]=selected.direction;
    report.push({slug,...selected});console.log(`${slug}: ${selected.elevation}deg / ${selected.offset}deg, ${(selected.min*100).toFixed(1)}% visible`);
    geometry.dispose();contextGeometry?.dispose();disposeStPetersModel(model);if(context)disposeStPetersModel(context);
  }
  fs.writeFileSync('app/data/landmark-exterior-cameras.json',JSON.stringify(cameras,null,2)+'\n');
  fs.mkdirSync('work/landmark-exterior-qa',{recursive:true});
  fs.writeFileSync('work/landmark-exterior-qa/camera-visibility.json',JSON.stringify(report,null,2)+'\n');
}
