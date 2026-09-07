import type { TripItem } from './types';

export type CityMapId =
  | 'milan'
  | 'venice'
  | 'florence'
  | 'pisa'
  | 'rome-vatican'
  | 'barcelona'
  | 'cologne'
  | 'paris';

export type TripMapLocation = {
  cityMapId: CityMapId;
  coordinates: readonly [longitude: number, latitude: number];
  osm: {
    id: number;
    type: 'node' | 'way' | 'relation';
  };
  precision: 'venue' | 'area-representative';
};

export const cityMapLabels: Record<CityMapId, string> = {
  milan: '米兰',
  venice: '威尼斯',
  florence: '佛罗伦萨',
  pisa: '比萨',
  'rome-vatican': '罗马与梵蒂冈',
  barcelona: '巴塞罗那',
  cologne: '科隆',
  paris: '巴黎',
};

const place = (
  cityMapId: CityMapId,
  longitude: number,
  latitude: number,
  type: TripMapLocation['osm']['type'],
  id: number,
  precision: TripMapLocation['precision'] = 'venue',
): TripMapLocation => ({
  cityMapId,
  coordinates: [longitude, latitude],
  osm: { id, type },
  precision,
});

const canonicalLocations: Record<string, TripMapLocation> = {
  'galleria-vittorio': place('milan', 9.1900059, 45.4656422, 'way', 166623705),
  'milan-duomo': place('milan', 9.1916121, 45.4641669, 'relation', 18017026),
  'la-scala-evening': place(
    'milan',
    9.1891136,
    45.4676041,
    'relation',
    6552704,
  ),
  'last-supper': place('milan', 9.170655, 45.4662047, 'node', 1761156826),
  'santa-maria-grazie': place(
    'milan',
    9.1696197,
    45.4667149,
    'node',
    316535179,
  ),
  sforza: place('milan', 9.1780912, 45.4703009, 'relation', 1918),
  brera: place('milan', 9.1884071, 45.4722421, 'node', 1029667846),
  'la-scala-museum': place('milan', 9.1892579, 45.4673111, 'node', 1828890767),
  'starbucks-milan': place('milan', 9.1858081, 45.4652058, 'node', 13070979699),

  'doges-palace': place('venice', 12.340592, 45.4342108, 'way', 138803915),
  'bridge-of-sighs': place('venice', 12.3408609, 45.4340597, 'way', 138803225),
  'st-mark-campanile': place(
    'venice',
    12.3390443,
    45.4340361,
    'way',
    252637693,
  ),
  'st-mark-square': place('venice', 12.3386717, 45.4342571, 'way', 172349507),
  correr: place('venice', 12.3371838, 45.4335995, 'node', 4121738102),
  'st-mark-basilica': place('venice', 12.3398218, 45.4345479, 'way', 138800932),
  rialto: place('venice', 12.3356548, 45.4380688, 'way', 527586724),
  'grand-canal': place(
    'venice',
    12.3355904,
    45.437773,
    'way',
    398987317,
    'area-representative',
  ),
  fenice: place('venice', 12.3338572, 45.4337096, 'node', 251501878),
  'accademia-venice': place(
    'venice',
    12.3280919,
    45.4313662,
    'node',
    895805118,
  ),

  'ponte-vecchio': place(
    'florence',
    11.253158,
    43.7680254,
    'relation',
    5342094,
  ),
  passera: place('florence', 11.2506436, 43.7671815, 'node', 4241590389),
  gelatiera: place('florence', 11.2552877, 43.775601, 'node', 2361726801),
  granieri: place('florence', 11.2545403, 43.7701574, 'node', 6419098005),
  zaza: place('florence', 11.2545143, 43.7765273, 'node', 3909378477),
  'florence-duomo': place('florence', 11.2565742, 43.7731015, 'way', 43768260),
  'piazzale-michelangelo': place(
    'florence',
    11.2649932,
    43.7628279,
    'way',
    233265215,
  ),
  'accademia-florence': place(
    'florence',
    11.2587579,
    43.7769174,
    'node',
    560308250,
  ),
  'mercato-centrale': place(
    'florence',
    11.2532087,
    43.7765847,
    'way',
    480015428,
  ),
  'medici-chapels': place(
    'florence',
    11.2533742,
    43.7750224,
    'node',
    5705862422,
  ),
  signoria: place('florence', 11.2558641, 43.7695737, 'way', 23298643),
  'giunti-odeon': place('florence', 11.2525624, 43.7709968, 'node', 2953868598),
  uffizi: place('florence', 11.2558009, 43.7683129, 'way', 477279033),
  'vasari-corridor': place(
    'florence',
    11.2528856,
    43.7674617,
    'way',
    1344547176,
  ),
  pitti: place('florence', 11.2502566, 43.7652813, 'relation', 1637338),

  'leaning-tower': place('pisa', 10.3966322, 43.7230159, 'relation', 12982355),
  'pisa-cathedral': place('pisa', 10.395728, 43.7232833, 'way', 22945163),
  'pisa-baptistery': place('pisa', 10.394198, 43.7232537, 'way', 22945162),
  camposanto: place('pisa', 10.3956864, 43.7240165, 'relation', 154289),
  sinopie: place('pisa', 10.3951548, 43.7223999, 'way', 701045438),
  'opera-pisa': place('pisa', 10.3973621, 43.7227197, 'way', 546333990),

  pantheon: place('rome-vatican', 12.4768334, 41.898616, 'relation', 3374342),
  borghese: place('rome-vatican', 12.4921053, 41.9141133, 'node', 1440405490),
  colosseum: place('rome-vatican', 12.491903, 41.8909421, 'way', 215801333),
  'roman-forum': place(
    'rome-vatican',
    12.4867296,
    41.8916414,
    'relation',
    1841080,
  ),
  palatine: place('rome-vatican', 12.4871093, 41.8893064, 'node', 365475871),
  'piazza-venezia': place(
    'rome-vatican',
    12.4823704,
    41.8962446,
    'way',
    713360712,
  ),
  trevi: place('rome-vatican', 12.4832848, 41.9009778, 'relation', 13448560),
  'spanish-steps': place(
    'rome-vatican',
    12.4830824,
    41.906391,
    'way',
    1236110426,
  ),
  'piazza-navona': place(
    'rome-vatican',
    12.4731178,
    41.8989282,
    'way',
    4247138,
  ),
  'tazza-doro': place(
    'rome-vatican',
    12.4774865,
    41.8995925,
    'node',
    261859476,
  ),
  'vatican-museums': place(
    'rome-vatican',
    12.4546617,
    41.904961,
    'way',
    255959482,
  ),
  'st-peters-square': place(
    'rome-vatican',
    12.4573573,
    41.9022351,
    'relation',
    10044166,
  ),
  'st-peters-basilica': place(
    'rome-vatican',
    12.4537105,
    41.9021569,
    'way',
    244159210,
  ),
  'vatican-post': place(
    'rome-vatican',
    12.4576689,
    41.9015775,
    'way',
    535197902,
  ),
  'vatican-surroundings': place(
    'rome-vatican',
    12.4608791,
    41.9037535,
    'way',
    33290566,
    'area-representative',
  ),
  tiber: place(
    'rome-vatican',
    12.4664612,
    41.9019247,
    'way',
    134399943,
    'area-representative',
  ),
  trastevere: place(
    'rome-vatican',
    12.470508,
    41.8895638,
    'relation',
    2736270,
    'area-representative',
  ),

  'sagrada-familia': place(
    'barcelona',
    2.1744283,
    41.4035046,
    'relation',
    9194723,
  ),
  'gaudi-house': place('barcelona', 2.1535724, 41.4144244, 'way', 126856515),
  'park-guell': place('barcelona', 2.1524576, 41.4142348, 'way', 66713401),
  'turo-rovira': place('barcelona', 2.1615417, 41.4192618, 'node', 1249952258),
  'la-pedrera': place('barcelona', 2.1617621, 41.3953996, 'relation', 8974896),
  'casa-batllo': place('barcelona', 2.1646961, 41.3915446, 'relation', 9427554),
  'palau-musica': place('barcelona', 2.1752316, 41.3875837, 'way', 377216661),
  'barcelona-cathedral': place(
    'barcelona',
    2.1765539,
    41.3839296,
    'relation',
    3298476,
  ),
  'picasso-barcelona': place(
    'barcelona',
    2.1812015,
    41.3851039,
    'way',
    188938001,
  ),
  'santa-maria-mar': place('barcelona', 2.1820062, 41.3837802, 'way', 51260215),
  'el-born': place(
    'barcelona',
    2.1828059,
    41.3847576,
    'way',
    22430203,
    'area-representative',
  ),
  barceloneta: place(
    'barcelona',
    2.192971,
    41.3793285,
    'relation',
    7333373,
    'area-representative',
  ),
  'gothic-quarter': place(
    'barcelona',
    2.1750157,
    41.3800909,
    'relation',
    7842902,
    'area-representative',
  ),
  'la-rambla': place(
    'barcelona',
    2.1743452,
    41.3799222,
    'way',
    1117840326,
    'area-representative',
  ),

  'museum-ludwig': place('cologne', 6.9600217, 50.9408347, 'node', 633480736),
  'gaffel-am-dom': place('cologne', 6.9568213, 50.9419049, 'node', 303222530),
  hohenzollern: place('cologne', 6.9657041, 50.9414376, 'way', 268130024),
  'koln-triangle': place('cologne', 6.9718364, 50.9403829, 'node', 13396033603),
  'cologne-cathedral': place('cologne', 6.958138, 50.9413035, 'way', 4532022),
  'cologne-old-town': place(
    'cologne',
    6.9598226,
    50.9379033,
    'way',
    42402089,
    'area-representative',
  ),
  rheinauhafen: place(
    'cologne',
    6.9657455,
    50.9263092,
    'way',
    37766848,
    'area-representative',
  ),
  'chocolate-museum': place('cologne', 6.9644356, 50.9319828, 'way', 334606061),

  'notre-dame-towers': place('paris', 2.3500501, 48.8529371, 'way', 201611261),
  seine: place(
    'paris',
    2.3403279,
    48.8574066,
    'way',
    53570787,
    'area-representative',
  ),
};

const locationAliases: Record<string, string> = {
  'ponte-vecchio-night-27': 'ponte-vecchio',
  'ponte-vecchio-night-28': 'ponte-vecchio',
  'passera-27': 'passera',
  'passera-28': 'passera',
  'passera-29': 'passera',
  'gelatiera-27': 'gelatiera',
  'gelatiera-28': 'gelatiera',
  'gelatiera-29': 'gelatiera',
  'florence-duomo-exterior': 'florence-duomo',
  'brunelleschi-dome': 'florence-duomo',
  'key-master': 'vatican-museums',
  'vatican-followup': 'vatican-museums',
  'st-peters-dome': 'st-peters-basilica',
  'sagrada-basilica': 'sagrada-familia',
  'sagrada-passion-tower': 'sagrada-familia',
  'cologne-interior': 'cologne-cathedral',
  'cologne-tower-treasury': 'cologne-cathedral',
  'cologne-treasury': 'cologne-cathedral',
};

export const unlocatedMapItems: Record<string, string> = {
  gondola: '贡多拉没有指定上船点，保留为流动备选，不伪造固定位置。',
};

export function mapLocationForTripItem(
  item: Pick<TripItem, 'id'>,
): TripMapLocation | undefined {
  return canonicalLocations[locationAliases[item.id] ?? item.id];
}

export function isMapEligibleTripItem(item: Pick<TripItem, 'kind'>): boolean {
  return item.kind !== 'transport' && item.kind !== 'hotel';
}
