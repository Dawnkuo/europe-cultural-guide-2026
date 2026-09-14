'use client';

import { useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { exteriorReferences } from '../data/exterior-references';
import { withBasePath } from '../lib/paths';
import { ReferenceExterior } from './ReferenceExterior';

function subscribeHash(notify: () => void) {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
}

export function ExteriorModelPreview() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => null);
  const interactive = hash !== null;
  const selected = exteriorReferences.findIndex(model => `#${model.id}` === hash);
  const index = selected < 0 ? 2 : selected;
  const model = exteriorReferences[index];
  function select(next: number) {
    const value = (next + exteriorReferences.length) % exteriorReferences.length;
    window.history.replaceState(null, '', `#${exteriorReferences[value].id}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  return <div className="model-preview">
    <header className="model-preview__heading"><h1>建筑模型试用</h1><span>08 个候选 · 联网预览</span></header>
    <div className="model-preview__toolbar">
      <label htmlFor="exterior-model-selection">景点</label>
      <select id="exterior-model-selection" disabled={!interactive} value={index} onChange={event => select(Number(event.target.value))}>
        {exteriorReferences.map((item, i) => <option key={item.id} value={i}>{String(i + 1).padStart(2, '0')} · {item.title}</option>)}
      </select>
      <button type="button" disabled={!interactive} aria-label="上一个模型" title="上一个模型" onClick={() => select(index - 1)}><ChevronLeft size={20} /></button>
      <button type="button" disabled={!interactive} aria-label="下一个模型" title="下一个模型" onClick={() => select(index + 1)}><ChevronRight size={20} /></button>
      {model.guideSlug && <a href={withBasePath(`/guides/${model.guideSlug}/#guide-spatial`)}><ExternalLink size={17} />景点导览</a>}
    </div>
    <ReferenceExterior key={model.id} model={model} />
    <section className="model-preview__sources" aria-labelledby="heritage-sources">
      <h2 id="heritage-sources">Open Heritage 3D</h2>
      <ul>
        <li><strong>万神殿</strong><span>点云 0.1 GB · CC BY-NC-SA · 在线实测已打开</span><a href="https://pointcloud.ucsd.edu/archive_temp/oh3d_store/oh3d-vis/base_potree_template/?vtype=oh3d&doi=t9sj-mf53" target="_blank" rel="noreferrer">打开点云<ExternalLink size={16} /></a><a href="https://openheritage3d.org/project.php?id=t9sj-mf53" target="_blank" rel="noreferrer">项目资料</a></li>
        <li><strong>比萨奇迹广场</strong><span>点云 2.37 GB · CC BY-NC-SA · 主教堂、斜塔与洗礼堂外部</span><a href="https://pointcloud.ucsd.edu/archive_temp/oh3d_store/oh3d-vis/base_potree_template/?doi=dbg6-x966&vtype=oh3d" target="_blank" rel="noreferrer">打开点云<ExternalLink size={16} /></a><a href="https://openheritage3d.org/project.php?id=dbg6-x966" target="_blank" rel="noreferrer">项目资料</a></li>
        <li><strong>佛罗伦萨洗礼堂 · 2014</strong><span>激光数据 19.2 GB、摄影测量资料 37.3 GB · CC BY-NC · 来源注明需重新配准</span><a href="https://openheritage3d.org/project.php?id=0x6p-vk89" target="_blank" rel="noreferrer">项目资料<ExternalLink size={16} /></a></li>
      </ul>
    </section>
  </div>;
}
