import { Compass } from 'lucide-react';
import type { GuideRecord } from '../data/types';

const spatialLabels: Record<GuideRecord['spatial']['type'], string> = {
  floorplan: '场馆空间',
  site: '遗址关系',
  viewpoints: '观察方位',
  district: '街区节点',
};

export function GuideSpatial({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-spatial" id="guide-spatial">
      <div className="guide-section__heading">
        <p>01 / {spatialLabels[guide.spatial.type]}</p>
        <h2>空间关系</h2>
        <span>{guide.spatial.title}</span>
      </div>
      <div className="spatial-diagram" data-type={guide.spatial.type}>
        {guide.spatial.stops.map((stop, index) => (
          <div className="spatial-stop" key={stop}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <Compass aria-hidden="true" size={18} />
            <strong>{stop}</strong>
          </div>
        ))}
      </div>
      <p className="guide-disclaimer">{guide.spatial.note}</p>
    </section>
  );
}
