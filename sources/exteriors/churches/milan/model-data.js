// Plan coordinates refer to the 1800px rendering of terraces-guide.pdf, page 1.
// Scale uses the documented 9.6m structural module, not the conflicting printed bar.
export const evidence = {
  plan: { url: 'https://www.tickitaly.com/downloads/milan-cathedral-plan.pdf', page: 1, authority: 'third-party-hosted, issuer/version unspecified', inspection: 'visually inspected', unit: 'rendered-plan-pixel', scale: 9.6 / 67, origin: [447, 630] },
  structure: { url: 'https://re.public.polimi.it/retrieve/e0c31c0e-510a-4599-e053-1705fe0aef77/Cathedral%20of%20Milan-Structural%20History%20of%20the%20Load-Bearing%20System_11311-739413_Coronelli.pdf', locator: '2.1 Plan and Elevation; 2.3 Vaults and Arches; figures 1, 5, 6', inspection: 'text verified; figure geometry not extracted', module: 9.6, centralSpan: 19.2 },
  heights: { url: 'https://www.duomomilano.it/en/art-and-culture/the-terraces/', lowerTerrace: 31, upperTerrace: 45 },
  spire: { url: 'https://www.duomomilano.it/en/spire/madonnina-main-spire/', overallWithStatue: 108.5, statue: 4.16 },
  facade: { url: 'https://www.politesi.polimi.it/retrieve/a81cb059-8406-616b-e053-1605fe0a889a/2010_12_Prina.pdf', locator: 'p.5, 1.1.1', height: 56.5 },
  tiburio: { url: 'https://blog.urbanfile.org/2020/01/21/milano-duomo-il-cantiere-divino-del-tiburio-della-cattedrale/', locator: 'first-hand construction-site visit, 2020-01-21', top: 68 },
};

export const toWorld = ([u, v]) => [(u - 447) * evidence.plan.scale, (v - 630) * evidence.plan.scale];
export const crossing = toWorld([447, 488]);
export const outline = [
  [239,1157],[239,620],[180,620],[180,555],[136,513],[136,463],[180,419],[180,350],
  [239,350],[239,210],[303,210],[303,188],[388,110],[504,110],[591,188],[591,210],
  [654,210],[654,350],[714,350],[714,419],[756,463],[756,513],[714,555],[714,620],
  [654,620],[654,1157],
];
export const upperCross = [
  [379,1157],[515,1157],[515,555],[714,555],[714,419],[515,419],
  [515,225],[473,185],[420,185],[379,225],[379,419],[180,419],[180,555],[379,555],
];

export const naveBays = [1157,1083,1017,950,884,818,752,685,620];
export const choirBays = [350,282];
export const naveColumns = [239,315,379,515,581,654];
export const transeptBays = [180,246,314,379,515,579,646,714];

export const components = [
  { id: 'body', name: '主体与横翼', color: '#c7d3d6', claims: ['plan', 'structure'] },
  { id: 'roofs', name: '屋顶与后殿', color: '#8db6c6', claims: ['plan', 'structure', 'heights'] },
  { id: 'buttresses', name: '扶壁与飞扶壁', color: '#d0be9b', claims: ['plan', 'structure'] },
  { id: 'spires', name: '塔体与尖塔', color: '#dbb965', claims: ['plan', 'spire', 'tiburio'] },
];

export const limitations = {
  precision: 'Evidence-backed exterior massing study, not a surveyed reconstruction.',
  plan: 'Major boundaries and roof support positions manually traced from the inspected roof plan. Uniform module-based scaling; roof edges are not ground-wall survey lines.',
  conflicts: ['The roof plan printed 10m bar and the research structural grid do not give an identical scale. The grid controls this study; no survey-level dimensions are exposed.', 'Research prose contains inconsistent braccia/metre conversions. Its contradictory 56m nave-height value is not used.'],
  approximations: ['Wall setbacks, shallow roof pitches, facade intermediate profile and buttress sections are massing approximations.', 'Individual pinnacle heights/profiles and minor perimeter pinnacles are not surveyed; the drawing-derived groups are not represented as a complete 135-spire inventory.', 'The upper spire is simplified to tapering structural members, not a replica of its sculptural stonework.'],
  omittedByRequest: ['Window tracery', 'Sculpture including the 4.16m Madonnina'],
  visualMaterial: 'User-requested pale marble texture, generated for visualization; not a surveyed photograph of the cathedral stone. Uniform 8-model-unit texture scale; no displacement or geometry changes.',
  notModeled: ['Interior rooms and vaults', 'Underground spaces', 'Surrounding buildings', 'Temporary scaffolding'],
};
