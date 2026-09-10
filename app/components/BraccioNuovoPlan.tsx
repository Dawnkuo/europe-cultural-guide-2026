import { braccioPlanPixelsPerMetre, buildBraccioFeatures } from '../data/braccio-nuovo';

// The no-WebGL plan consumes precisely the same semantic features as the 3D cutaway.
export function BraccioNuovoPlan() {
  const features = buildBraccioFeatures();
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- This is a semantic vector drawing, not a raster img.
  return <svg viewBox="1390 2020 2730 1220" role="img" aria-label="新翼陈列馆平面：长廊、二十八个壁龛、半圆厅和八柱门廊" style={{ display: 'block', width: '100%', height: 'auto' }}>
    <rect x="1390" y="2020" width="2730" height="1220" fill="#061019" />
    {features.filter(feature => feature.kind !== 'column' && feature.kind !== 'entablature').map(feature => <polygon key={feature.id} data-feature-id={feature.id} points={feature.polygon!.map(point => point.join(',')).join(' ')} fill={feature.kind === 'wall' ? '#d4cfbf' : feature.kind === 'stair' ? '#ded3b5' : '#29414b'} stroke="#cfb36a" strokeWidth="1.5" />)}
    {features.filter(feature => feature.kind === 'column').map(feature => <circle key={feature.id} data-feature-id={feature.id} cx={feature.at![0]} cy={feature.at![1]} r={feature.radius! * braccioPlanPixelsPerMetre} fill="#e6ddc5" stroke="#061019" strokeWidth="2" />)}
  </svg>;
}
