export type WorkLocationBinding = {
  placeIds: string[];
  precision: 'room' | 'area' | 'feature';
  note?: string;
};

export type SequenceBinding = {
  stopIndices: number[];
  workIds?: string[];
};

const area = (...placeIds: string[]): WorkLocationBinding => ({
  placeIds,
  precision: 'area',
});
const room = (...placeIds: string[]): WorkLocationBinding => ({
  placeIds,
  precision: 'room',
});
const feature = (...placeIds: string[]): WorkLocationBinding => ({
  placeIds,
  precision: 'feature',
});

// Explicitly reviewed joins, not runtime title matching or inferred coordinates.
// Department anchors do not claim the position of an individual object.
export const guideWorkLocations: Record<
  string,
  Record<string, WorkLocationBinding>
> = {
  // The plan covers rooms, but current object-to-room assignments are not verified.
  'picasso-barcelona': {},
  // The evidence covers lower floors, not the rooftop viewpoints in the highlights.
  'koln-triangle': {},
  pantheon: {
    'pantheon-highlight-1': area('L0-1-1'),
    'pantheon-highlight-2': {
      ...room('L0-3-1'),
      note: '定位圆厅地面，穹顶与天窗在上方。',
    },
    'pantheon-highlight-3': feature('L0-9-1'),
    'pantheon-dome': {
      ...room('L0-3-1'),
      note: '定位圆厅观赏区域，凹格位于穹顶内表面。',
    },
    'pantheon-door': feature('L0-2-1'),
  },
  colosseum: {
    'colosseum-highlight-2': area(
      'hypogeum-level-2-H-中央-1',
      'hypogeum-level-2-H-西-1',
      'hypogeum-level-2-H-东-1',
      'hypogeum-level-2-H-北-1',
      'hypogeum-level-2-H-南-1',
    ),
    'colosseum-highlight-3': {
      ...area('podium-level-3-竞技场-1'),
      note: '定位竞技场面回望观众席的区域，不是上层看台或具体座位。',
    },
  },
  'barcelona-cathedral': {
    'barcelona-cathedral-highlight-2': room('main-level-唱诗班席-1'),
    'barcelona-cathedral-highlight-3': area('main-level-哥特式回廊-1'),
  },
  'santa-maria-mar': {
    'santa-maria-mar-highlight-1': area(
      'main-level-中央中殿-1',
      'main-level-侧廊与礼拜堂-1',
    ),
  },
  'el-born': {
    'el-born-highlight-3': {
      ...area('street-level-5-2'),
      note: '定位街道层的遗址俯瞰区域，不是地下遗址内的行走位置。',
    },
  },
  'museum-ludwig': {
    'museum-ludwig-highlight-3': {
      ...area('second-二层藏品主题区-1'),
      note: '定位收藏主题楼层；不表示收藏中的每件作品均在当前展出。',
    },
  },
  'notre-dame-towers': {
    'notre-dame-towers-highlight-2': {
      ...area('south-belfry-lower-南塔钟架下层木构-1'),
      note: '仅定位南塔钟架木构，现代橡木楼梯不在现有平面中。',
    },
    'notre-dame-towers-highlight-3': {
      ...area('south-belfry-upper-大钟悬挂区-1'),
      note: '仅定位大钟悬挂区，不是南塔眺望台。',
    },
  },
  'st-mark-campanile': {
    'st-mark-campanile-highlight-1': area('ground-loggetta-1'),
    'st-mark-campanile-highlight-2': room('bell-cell-bell-cell-1'),
  },
  'florence-duomo': {
    'florence-duomo-highlight-2': {
      ...area('main-中央八角交叉部-1'),
      note: '定位教堂地面交叉部，只能表达穹顶在此上方，不是双壳内部。',
    },
    'florence-duomo-highlight-3': {
      ...area('main-中央八角交叉部-1'),
      note: '定位地面仰望区域；登顶内缘走道尚未标定。',
    },
  },
  'leaning-tower': {
    'leaning-tower-highlight-2': {
      ...area(
        'galleries-1-3-第一层回廊平台-1',
        'galleries-1-3-第二层回廊平台-1',
        'galleries-1-3-第三层回廊平台-1',
      ),
      note: '定位图中分列的柱廊；不表示所有回廊均可进入。',
    },
    'leaning-tower-highlight-3': area('upper-钟层柱廊-1'),
  },
  'pisa-cathedral': {
    'pisa-cathedral-highlight-3': {
      ...area('ground-后殿-1'),
      note: '定位后殿区域，马赛克在上方半穹顶。',
    },
  },
  'pisa-baptistery': {
    'pisa-baptistery-highlight-1': feature('ground-八角洗礼池-1'),
    'pisa-baptistery-highlight-2': feature('ground-尼古拉·皮萨诺讲坛-1'),
  },
  camposanto: {
    'camposanto-highlight-1': area('ground-生命与死亡壁画（南墙）-1'),
    'camposanto-highlight-2': area('ground-生命与死亡壁画（南墙）-1'),
    'camposanto-noah-drunkenness': area('ground-旧约故事壁画（北墙）-1'),
    'camposanto-buffalmacco-thebaid': area('ground-南廊-1'),
  },
  'opera-pisa': {
    'opera-pisa-highlight-3': {
      ...area('ground-回廊庭院-1'),
      note: '定位回廊庭院，不表示某件雕像的具体基座。',
    },
  },
  'mercato-centrale': {
    'mercato-centrale-highlight-1': {
      ...area('upper-中央结构视线-1'),
      note: '定位上层结构观赏区域，整座大厅跨越楼层。',
    },
    'mercato-centrale-highlight-2': {
      ...area('ground-historic-历史摊位网格-1'),
      note: '图示历史摊位布局，不代表今日商户位置。',
    },
    'mercato-centrale-highlight-3': room('upper-上层大厅-1'),
  },
  'giunti-odeon': {
    'giunti-odeon-highlight-1': room('ground-观众厅装饰区-1'),
    'giunti-odeon-highlight-2': room(
      'ground-中央书架区-1',
      'ground-舞台银幕轴线-1',
    ),
  },
  'la-scala': {
    'la-scala-highlight-1': room('museum-1-1'),
    'la-scala-highlight-2': room('museum-3-1'),
    'la-scala-highlight-4': area('theatre-观众厅-1'),
  },
  'galleria-vittorio': {
    'galleria-vittorio-highlight-1': {
      ...area('arcade-中央八角厅-1'),
      note: '定位八角厅地面区域，穹顶在上方。',
    },
    'galleria-vittorio-highlight-2': area('arcade-中央八角厅-1'),
    'galleria-vittorio-highlight-3': area('arcade-沿廊店面-1'),
  },
  sforza: {
    'sforza-highlight-1': area('ground-菲拉雷特塔入口轴线-1'),
  },
  correr: {
    'correr-highlight-1': {
      ...area('L1-卡诺瓦-1'),
      note: '定位新古典主义展区；舞厅尚未单独标定。',
    },
    'correr-highlight-2': area('L1-威尼斯史-1'),
    'correr-highlight-3': area('L2-绘画馆-1'),
    'correr-orpheus': area('L1-卡诺瓦-1'),
    'correr-eurydice': area('L1-卡诺瓦-1'),
    'correr-daedalus': area('L1-卡诺瓦-1'),
    'correr-transfiguration': area('L2-绘画馆-1'),
    'correr-two-ladies': area('L2-绘画馆-1'),
  },
  'st-mark-basilica': {
    'st-mark-basilica-highlight-1': {
      ...feature('main-D-1'),
      note: '定位地面投影，马赛克在门廊上方穹顶。',
    },
    'st-mark-basilica-highlight-2': feature('main-14-1'),
    'venice-ascension': {
      ...feature('main-B-1'),
      note: '定位地面投影，马赛克在中央穹顶上方。',
    },
    'venice-tetrarchs': feature('main-24-1'),
    'venice-rock-crystal': {
      ...area('main-27-1'),
      note: '定位珍宝馆，不表示具体展柜的位置。',
    },
  },
  fenice: {
    'fenice-highlight-2': {
      ...area('auditorium-platea-1'),
      note: '定位池座观赏区域；不代表某个包厢或座位。',
    },
  },
  'accademia-venice': {
    'accademia-venice-highlight-1': room('first-XXIV-1'),
    'accademia-venice-highlight-2': room('first-VIII-1'),
    'accademia-venice-highlight-3': room('first-X-1'),
    'venice-san-giobbe': room('first-II-1'),
    'venice-saint-george': room('first-IV-1'),
    'venice-carpaccio-presentation': room('first-II-1'),
    'venice-titian-pieta': room('first-XI-1'),
    'venice-miracle-slave': room('first-XI-1'),
    'venice-la-vecchia': room('first-VIII-1'),
  },
  'sagrada-familia': {
    'sagrada-familia-highlight-1': area('main-11-1'),
    'sagrada-familia-highlight-2': area('main-3-1'),
    'sagrada-nativity': area('main-2-1'),
    'sagrada-altar': {
      ...area('main-14-1'),
      note: '定位主祭坛区域；华盖悬于上方。',
    },
    'sagrada-apse': area('main-5-1'),
    'sagrada-glory-doors': {
      ...area('main-1-1'),
      note: '定位荣耀立面区域，不表示此门当前可供入场。',
    },
  },
  'la-pedrera': {
    'la-pedrera-highlight-2': area(
      'historic-visitor-attic-鲸腹阁楼与高迪展览-1',
    ),
    'la-pedrera-highlight-3': area(
      'historic-visitor-roof-楼梯塔、通风塔与烟囱-1',
    ),
    'pedrera-courtyard': {
      ...area(
        'historic-visitor-ground-花卉庭院-1',
        'historic-visitor-ground-蝴蝶庭院-1',
      ),
      note: '定位庭院区域，入口壁画未逐面测绘。',
    },
    'pedrera-apartment': {
      ...area('historic-visitor-apartment-米拉之家历史公寓-1'),
      note: '定位历史公寓；当前图未单独标定餐厅。',
    },
    'pedrera-roof-exits': area('historic-visitor-roof-楼梯塔、通风塔与烟囱-1'),
  },
  'palau-musica': {
    'palau-musica-highlight-1': {
      ...area('plan-II-历史音乐厅-1'),
      note: '定位音乐厅观赏区域，玻璃穹顶在头顶上方。',
    },
    'palau-musica-highlight-2': area('plan-II-历史舞台端-1'),
  },
  'medici-chapels': {
    'medici-chapels-highlight-1': room('princes-chapel-historic-王公礼拜堂-1'),
    'medici-chapels-highlight-2': room('new-sacristy-新圣器室-1'),
    'medici-chapels-highlight-3': room('new-sacristy-新圣器室-1'),
    'medici-lorenzo-dawn-dusk': room('new-sacristy-新圣器室-1'),
    'medici-princes-chapel-dome': {
      ...room('princes-chapel-historic-王公礼拜堂-1'),
      note: '定位礼拜堂地面观赏位置；绘画位于上方穹顶。',
    },
  },
  pitti: {
    'pitti-highlight-1': area('L1-帕拉蒂纳画廊-1'),
    'pitti-highlight-2': room('L1-25-1'),
    'pitti-highlight-3': area('L2-现代艺术馆-1'),
    'pitti-granduca': room('L1-25-1'),
    'pitti-velata': room('L1-26-1'),
    'pitti-la-bella': room('L1-29-1'),
    'pitti-three-ages': room('L1-26-1'),
  },
  'last-supper': {
    'last-supper-highlight-1': feature('L0-晚餐-1'),
    'last-supper-highlight-2': feature('L0-晚餐-1'),
    'last-supper-highlight-3': feature('L0-受难-1'),
  },
  'santa-maria-grazie': {
    'santa-maria-grazie-highlight-1': area('church-2-1'),
    'santa-maria-grazie-highlight-2': area(
      'church-3-1',
      'church-Tribune后殿-1',
    ),
  },
  borghese: {
    'borghese-highlight-1': room('P0-3-1'),
    'borghese-highlight-2': room('P0-4-1'),
    'borghese-sick-bacchus': room('P0-8-1'),
    'borghese-boy-basket-fruit': room('P0-8-1'),
    'borghese-david-head-goliath': room('P0-8-1'),
    'borghese-madonna-palafrenieri': room('P0-8-1'),
    'borghese-saint-jerome-writing': room('P0-8-1'),
    'borghese-saint-john-baptist': room('P0-8-1'),
    'borghese-lady-unicorn': room('P1-9-1'),
    'borghese-spinario': room('P1-9-1'),
    'borghese-david': room('P0-2-1'),
    'borghese-pauline': room('P0-1-1'),
    'borghese-aeneas': room('P0-6-1'),
    'borghese-deposition': room('P1-9-1'),
    'borghese-sacred-love': room('P1-20-1'),
    'borghese-danae': room('P1-10-1'),
    'borghese-truth': room('P0-6-1'),
  },
  'accademia-florence': {
    'accademia-florence-highlight-1': room('L0-4-1'),
    'accademia-florence-highlight-2': room('L0-3-1'),
    'accademia-florence-highlight-3': room('L0-5-1'),
    'accademia-matthew': room('L0-3-1'),
    'accademia-sabines': room('L0-2-1'),
    'accademia-perugino': room('L0-2-1'),
    'accademia-viola': area('L0-7-1'),
    'accademia-botticelli': room('L0-2-1'),
    'accademia-spinet': area('L0-7-1'),
  },
  'doges-palace': {
    'doges-palace-highlight-1': feature('L0-giants-stair-1'),
    'doges-palace-highlight-2': room('L1-27-1'),
    'doges-palace-highlight-3': area('loggia-33-1', 'loggia-34-1'),
    'doges-golden-stair': area('loggia-4-1', 'L1-14-1'),
    'doges-collegio': room('L2-18-1'),
    'doges-senate': room('L2-19-1'),
    'doges-apotheosis': room('L1-27-1'),
    'doges-lion-mouth': {
      ...area('loggia-3-1'),
      note: '定位回廊层；投书孔自身的精确墙面位置未在平面中标定。',
    },
  },
  brera: {
    'brera-highlight-1': room('gallery-6-1'),
    'brera-highlight-2': room('gallery-24-1'),
    'brera-highlight-3': room('gallery-28-1'),
    'brera-altarpiece': room('gallery-24-1'),
    'brera-bellini-pieta': room('gallery-6-1'),
    'brera-kiss': room('gallery-38-1'),
    'brera-finding-mark': room('gallery-9-1'),
    'brera-simon-feast': room('gallery-9-1'),
  },
  'milan-duomo': {
    'milan-duomo-highlight-1': area('cathedral-唱诗席-1'),
    'milan-apse': area('cathedral-东侧后殿-1'),
    'milan-door': {
      ...area('cathedral-西侧入口-1'),
      note: '定位西侧门廊区域，非青铜门扇的精确测绘位置。',
    },
  },
  'cologne-cathedral': {
    'cologne-cathedral-highlight-1': {
      ...area('nave-唱诗班席-1'),
      note: '定位唱诗席区域，圣龛位于其后方；当前平面未单独描绘圣龛。',
    },
    'cologne-richter': area('nave-南耳堂-1'),
    'cologne-choir-stalls': room('nave-唱诗班席-1'),
  },
  'vatican-museums': {
    'vatican-angelico-madonna': area('first-19-1'),
    'vatican-borgia': area('first-11-1', 'first-11-2', 'first-11-3'),
    'vatican-momo': { ...area('first-螺旋坡道-1'), note: '定位出口双螺旋楼梯区域，不标示某一级踏步或另一座布拉曼特楼梯。' },
    'vatican-djedmut': { ...area('first-1-1'), note: '定位埃及博物馆区域。历史特展与收藏目录的展室记录不同，不据此虚设当前展柜坐标。' },
    'vatican-lady-shroud': area('first-1-1'),
    'vatican-hercules': area('first-4-1'),
    'vatican-candelabra': room('second-6-1'),
    'vatican-sphere': area('first-松果庭院-1'),
    'vatican-dogmatic': area('first-18-1'),
    'vatican-expulsion': room('first-西斯廷室内-1'),
    'vatican-deluge': room('first-西斯廷室内-1'),
    'vatican-libyan-sibyl': room('first-西斯廷室内-1'),
    'vatican-hermes': area('first-4-1'),
    'vatican-nile': room('first-3-1'),
    'vatican-perseus': area('first-4-1'),
    'vatican-stefaneschi': area('first-19-1'),
    'vatican-heliodorus': area('second-10-1'),
    'vatican-museums-highlight-1': area('first-19-1'),
    'vatican-museums-highlight-2': area('first-4-1'),
    'vatican-museums-highlight-3': area('first-4-1'),
    'vatican-museums-highlight-4': room('second-8-1'),
    'vatican-museums-highlight-5': area('second-10-1'),
    'vatican-museums-highlight-6': room('first-西斯廷室内-1'),
    'vatican-museums-highlight-7': room('first-西斯廷室内-1'),
    'vatican-apollo': area('first-4-1'),
    'vatican-apoxyomenos': area('first-4-1'),
    'vatican-augustus': room('first-3-1'),
    'vatican-round-basin': area('first-4-1'),
    'vatican-braccio': room('first-3-1'),
    'vatican-caravaggio': area('first-19-1'),
    'vatican-foligno': area('first-19-1'),
    'vatican-jerome': area('first-19-1'),
    'vatican-melozzo': area('first-19-1'),
    'vatican-disputation': area('second-10-1'),
    'vatican-fire-borgo': area('second-10-1'),
    'vatican-keys': room('first-西斯廷室内-1'),
    'vatican-temptations': room('first-西斯廷室内-1'),
    'vatican-last-supper': room('first-西斯廷室内-1'),
    'vatican-tapestry': room('second-7-1'),
    'vatican-pigna': feature('first-松果庭院-1'),
    'vatican-anubis': area('first-1-1'),
    'vatican-todi': area('second-5-1'),
    'vatican-fibula': area('second-5-1'),
  },
  uffizi: {
    'uffizi-highlight-1': room('L2-A9-1'),
    'uffizi-highlight-2': room('L2-A35-1'),
    'uffizi-highlight-3': room('L2-A38-1'),
    'uffizi-birth-venus': room('L2-A9-1'),
    'uffizi-ognissanti': room('L2-A4-1'),
    'uffizi-santa-trinita': room('L2-A4-1'),
    'uffizi-rucellai': room('L2-A4-1'),
    'uffizi-martini-annunciation': room('L2-A5-1'),
    'uffizi-gentile-magi': room('L2-A7-1'),
    'uffizi-saint-anne': room('L2-A8-1'),
    'uffizi-urbino-diptych': room('L2-A25-1'),
    'uffizi-lippi-madonna': room('L1-C6-1'),
    'uffizi-leonardo-magi': room('L2-A35-1'),
    'uffizi-baptism': room('L2-A35-1'),
    'uffizi-goldfinch': room('L2-A38-1'),
    'uffizi-venus-urbino': room('L1-D23-1'),
    'uffizi-medusa': room('L1-E4-1'),
    'uffizi-bacchus': room('L1-E5-1'),
    'uffizi-artemisia-judith': room('L1-E4-1'),
    'uffizi-long-neck': room('L1-D4-1'),
    'uffizi-san-romano': room('L2-A8-1'),
    'uffizi-portinari': room('L2-A13-1'),
    'uffizi-durer-magi': room('L2-A20-1'),
    'uffizi-eleonora': room('L1-D15-1'),
    'uffizi-musical-angel': room('L1-D12-1'),
    'uffizi-niobe': room('L2-A39-1'),
    'uffizi-wrestlers': room('L2-A16-1'),
    'uffizi-medici-venus': room('L2-A16-1'),
    'uffizi-raphael-self': room('L1-C1-1'),
  },
  'casa-batllo': {
    'casa-batllo-highlight-1': {
      ...feature('rooftop-龙脊屋面-1'),
      note: '定位龙脊屋顶；街道外立面不在这一层。',
    },
    'casa-batllo-highlight-2': feature('noble-采光井-1'),
    'casa-batllo-highlight-3': room('attic-悬链拱廊-1'),
    'batllo-noble-hall': room('noble-临街主厅-1'),
    'batllo-fireplace': room('noble-书房-1'),
    'batllo-rear-courtyard': room('noble-后院-1'),
    'batllo-main-stair': {
      ...area('ground-私人门厅-1'),
      note: '定位主楼梯起点所在门厅。',
    },
    'batllo-roof-chimneys': area('rooftop-屋顶露台-1'),
  },
  'st-peters-basilica': {
    'st-peters-basilica-highlight-1': room('basilica-6-1'),
    'st-peters-basilica-highlight-2': feature('basilica-52-1'),
    'st-peters-basilica-highlight-3': feature('basilica-35-1'),
    'st-peters-basilica-highlight-4': {
      ...area('grottoes-5-1', 'grottoes-12-1'),
      note: '只定位梵蒂冈墓穴层（Grotte Vaticane），不是更深处的罗马考古墓地（Necropoli Vaticana）。',
    },
    'st-peters-basilica-highlight-5': {
      ...area('basilica-52-1'),
      note: '定位大殿层仰望穹顶的位置，不是穹顶内环或登顶平台。',
    },
    'peter-bronze': feature('basilica-51-1'),
    'peter-alexander': {
      ...feature('basilica-42-1'),
      note: '亚历山大七世纪念墓，对应大殿平面42号。',
    },
    'peter-longinus': feature('basilica-50-1'),
    'peter-clement': feature('basilica-28-1'),
    'peter-gregory': feature('basilica-15-1'),
    'peter-filarete': feature('basilica-3-1'),
    'peter-holy-door': feature('basilica-4-1'),
    'peter-narthex': room('basilica-1-1'),
  },
};

export const guideSequenceBindings: Record<string, SequenceBinding[]> = {
  pantheon: [
    { stopIndices: [] },
    { stopIndices: [0, 1] },
    { stopIndices: [2] },
    { stopIndices: [3, 4] },
  ],
  colosseum: [
    {
      stopIndices: [0, 1],
      workIds: ['colosseum-highlight-1', 'colosseum-numbered-entrance-lii'],
    },
    { stopIndices: [2, 3] },
    { stopIndices: [4, 5] },
    { stopIndices: [] },
  ],
  'barcelona-cathedral': [
    { stopIndices: [0] },
    { stopIndices: [2], workIds: ['barcelona-cathedral-highlight-1'] },
    { stopIndices: [1, 3] },
    { stopIndices: [4] },
    { stopIndices: [5] },
  ],
  'santa-maria-mar': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2, 3, 4], workIds: ['santa-maria-mar-highlight-2'] },
    { stopIndices: [5], workIds: ['santa-maria-mar-highlight-3'] },
  ],
  'el-born': [
    { stopIndices: [0], workIds: ['el-born-highlight-1'] },
    { stopIndices: [1], workIds: ['el-born-highlight-2'] },
    { stopIndices: [2, 3] },
    { stopIndices: [4] },
  ],
  'museum-ludwig': [
    { stopIndices: [0] },
    {
      stopIndices: [1, 2],
      workIds: [
        'museum-ludwig-highlight-2',
        'ludwig-dix-hans-koch',
        'ludwig-kirchner-half-nude-hat',
        'ludwig-ernst-virgin-chastising',
      ],
    },
    {
      stopIndices: [3],
      workIds: ['museum-ludwig-highlight-1', 'ludwig-warhol-two-elvis'],
    },
    { stopIndices: [4] },
  ],
  'koln-triangle': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    {
      stopIndices: [2, 3, 4],
      workIds: [
        'koln-triangle-highlight-1',
        'koln-triangle-highlight-2',
        'koln-triangle-highlight-3',
      ],
    },
    { stopIndices: [2] },
  ],
  'notre-dame-towers': [
    { stopIndices: [0] },
    { stopIndices: [1], workIds: ['notre-dame-towers-highlight-1'] },
    { stopIndices: [2] },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
  ],
  'st-mark-campanile': [
    { stopIndices: [0, 1] },
    { stopIndices: [0] },
    { stopIndices: [2, 3, 4], workIds: ['st-mark-campanile-highlight-2'] },
    { stopIndices: [2, 3, 4] },
    { stopIndices: [5], workIds: ['st-mark-campanile-highlight-3'] },
  ],
  'florence-duomo': [
    { stopIndices: [0], workIds: ['florence-duomo-highlight-1'] },
    { stopIndices: [1], workIds: ['florence-duomo-highlight-2'] },
    { stopIndices: [2] },
    { stopIndices: [3], workIds: ['florence-duomo-highlight-3'] },
    { stopIndices: [4] },
  ],
  'leaning-tower': [
    { stopIndices: [] },
    { stopIndices: [0], workIds: ['leaning-tower-highlight-1'] },
    { stopIndices: [2] },
    { stopIndices: [3, 4] },
    { stopIndices: [] },
  ],
  'pisa-cathedral': [
    { stopIndices: [0], workIds: ['pisa-cathedral-highlight-1'] },
    { stopIndices: [] },
    { stopIndices: [1] },
    { stopIndices: [2, 3], workIds: ['pisa-cathedral-highlight-2'] },
    { stopIndices: [4] },
  ],
  'pisa-baptistery': [
    { stopIndices: [0] },
    { stopIndices: [1, 2] },
    { stopIndices: [], workIds: ['pisa-baptistery-highlight-3'] },
    { stopIndices: [3] },
  ],
  camposanto: [
    { stopIndices: [0] },
    {
      stopIndices: [1],
      workIds: [
        'camposanto-noah-drunkenness',
        'camposanto-buffalmacco-thebaid',
      ],
    },
    { stopIndices: [2], workIds: ['camposanto-highlight-3'] },
    { stopIndices: [3] },
  ],
  'opera-pisa': [
    { stopIndices: [0] },
    { stopIndices: [1], workIds: ['opera-pisa-highlight-1'] },
    { stopIndices: [2] },
    { stopIndices: [3], workIds: ['opera-pisa-highlight-2'] },
    { stopIndices: [4] },
  ],
  'mercato-centrale': [0, 1, 2, 3].map((index) => ({ stopIndices: [index] })),
  'giunti-odeon': [0, 1, 2, 3].map((index) => ({ stopIndices: [index] })),
  'la-scala': [
    { stopIndices: [0] },
    { stopIndices: [1], workIds: ['la-scala-highlight-1'] },
    { stopIndices: [1], workIds: ['la-scala-highlight-2'] },
    { stopIndices: [2], workIds: ['la-scala-highlight-3'] },
    { stopIndices: [3] },
    { stopIndices: [] },
    { stopIndices: [4, 5] },
    { stopIndices: [6, 7], workIds: ['la-scala-highlight-4'] },
    {
      stopIndices: [],
      workIds: ['la-scala-highlight-5', 'la-scala-highlight-6'],
    },
    { stopIndices: [7] },
  ],
  'galleria-vittorio': [
    { stopIndices: [0] },
    { stopIndices: [1, 4] },
    { stopIndices: [2, 3] },
    { stopIndices: [5] },
  ],
  sforza: [
    { stopIndices: [0] },
    { stopIndices: [1, 2, 3] },
    { stopIndices: [4], workIds: ['sforza-highlight-2'] },
    { stopIndices: [5], workIds: ['sforza-highlight-3'] },
    { stopIndices: [] },
  ],
  correr: [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2, 3] },
    { stopIndices: [4] },
    { stopIndices: [5] },
  ],
  'st-mark-basilica': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2] },
    { stopIndices: [3] },
    { stopIndices: [4] },
    { stopIndices: [5], workIds: ['st-mark-basilica-highlight-3'] },
  ],
  fenice: [
    { stopIndices: [] },
    { stopIndices: [0, 1] },
    { stopIndices: [2, 3] },
    { stopIndices: [4] },
    { stopIndices: [5] },
  ],
  'accademia-venice': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2] },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
  ],
  'sagrada-familia': [
    { stopIndices: [0] },
    { stopIndices: [1, 2] },
    { stopIndices: [3], workIds: ['sagrada-familia-highlight-3'] },
    { stopIndices: [4] },
    { stopIndices: [5], workIds: ['sagrada-model'] },
  ],
  'la-pedrera': [
    { stopIndices: [], workIds: ['pedrera-gate'] },
    { stopIndices: [1] },
    { stopIndices: [2] },
    { stopIndices: [3, 4] },
    { stopIndices: [0], workIds: ['la-pedrera-highlight-1'] },
  ],
  'palau-musica': [
    { stopIndices: [] },
    { stopIndices: [0] },
    { stopIndices: [1], workIds: ['palau-musica-highlight-3'] },
    { stopIndices: [2, 3] },
    { stopIndices: [4], workIds: ['palau-musica-highlight-1'] },
  ],
  'picasso-barcelona': [
    { stopIndices: [0] },
    {
      stopIndices: [1],
      workIds: [
        'picasso-barcelona-highlight-1',
        'picasso-barcelona-highlight-2',
        'picasso-father',
      ],
    },
    {
      stopIndices: [2, 3],
      workIds: ['picasso-margot', 'picasso-rooftops', 'picasso-sabartes'],
    },
    {
      stopIndices: [4],
      workIds: [
        'picasso-barcelona-highlight-3',
        'picasso-infanta',
        'picasso-doves',
      ],
    },
    { stopIndices: [5] },
  ],
  'medici-chapels': [
    { stopIndices: [0, 1] },
    { stopIndices: [2] },
    { stopIndices: [3] },
    { stopIndices: [4] },
  ],
  pitti: [
    { stopIndices: [0] },
    {
      stopIndices: [1],
      workIds: [
        'pitti-highlight-2',
        'pitti-granduca',
        'pitti-velata',
        'pitti-la-bella',
        'pitti-war',
        'pitti-sleeping-cupid',
        'pitti-three-ages',
      ],
    },
    { stopIndices: [2] },
    { stopIndices: [3, 4] },
    { stopIndices: [] },
  ],
  'last-supper': [0, 1, 2, 3, 4].map((index) => ({ stopIndices: [index] })),
  'santa-maria-grazie': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2], workIds: ['santa-maria-grazie-highlight-3'] },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
  ],
  borghese: [
    { stopIndices: [0] },
    {
      stopIndices: [1, 2, 3],
      workIds: [
        'borghese-david',
        'borghese-pauline',
        'borghese-aeneas',
        'borghese-truth',
      ],
    },
    {
      stopIndices: [4],
      workIds: [
        'borghese-lady-unicorn',
        'borghese-spinario',
        'borghese-deposition',
        'borghese-sacred-love',
        'borghese-danae',
      ],
    },
    { stopIndices: [5] },
  ],
  'accademia-florence': [0, 1, 2, 3, 4].map((index) => ({
    stopIndices: [index],
  })),
  'doges-palace': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    {
      stopIndices: [2],
      workIds: ['doges-golden-stair', 'doges-collegio', 'doges-senate'],
    },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
    { stopIndices: [5] },
  ],
  brera: [
    { stopIndices: [0, 1] },
    { stopIndices: [2] },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
    { stopIndices: [], workIds: ['brera-kiss'] },
  ],
  'milan-duomo': [
    { stopIndices: [0] },
    { stopIndices: [] },
    { stopIndices: [4], workIds: ['milan-duomo-highlight-3'] },
    { stopIndices: [5], workIds: ['milan-duomo-highlight-2'] },
    { stopIndices: [1, 2, 3] },
  ],
  'cologne-cathedral': [
    { stopIndices: [0] },
    { stopIndices: [1] },
    { stopIndices: [2, 3], workIds: ['cologne-gero'] },
    { stopIndices: [4] },
    { stopIndices: [5], workIds: ['cologne-peter-bell'] },
  ],
  'vatican-museums': [
    { stopIndices: [0] },
    { stopIndices: [] },
    { stopIndices: [1, 2] },
    { stopIndices: [5, 6, 7, 8] },
    { stopIndices: [9, 10] },
    { stopIndices: [11] },
  ],
  uffizi: [0, 1, 2, 3, 4].map((index) => ({ stopIndices: [index] })),
  'casa-batllo': [
    {
      stopIndices: [0],
      workIds: ['casa-batllo-highlight-1', 'batllo-main-stair'],
    },
    { stopIndices: [1] },
    { stopIndices: [2] },
    { stopIndices: [3, 4] },
    { stopIndices: [5] },
  ],
  'st-peters-basilica': [
    { stopIndices: [6] },
    { stopIndices: [7, 8], workIds: ['st-peters-basilica-highlight-5'] },
    { stopIndices: [9], workIds: ['st-peters-basilica-highlight-6'] },
    { stopIndices: [1, 2] },
    { stopIndices: [3] },
    { stopIndices: [4, 5] },
  ],
};

// Multiple source anchors for a single named department/room share its works.
export const guidePlaceGroups: Record<string, string[][]> = {
  'vatican-museums': [
    ['first-19-1', 'first-19-2', 'first-19-3'],
    ['first-12-1', 'first-西斯廷室内-1'],
    ['second-5-1', 'second-5-2'],
  ],
  uffizi: [['L1-D22-1', 'L1-D22-2']],
};
