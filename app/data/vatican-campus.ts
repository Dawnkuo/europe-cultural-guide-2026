export type VaticanCampusRegion = {
  id: string;
  name: string;
  at: [number, number];
  description: string;
  places: string[];
  guideSlug?: string;
};

// Area anchors in the reviewed state plan's native pixel coordinates.
// They are not room/artwork anchors; those retain their separate visitor-plan IDs.
export const vaticanCampusRegions: VaticanCampusRegion[] = [
  { id: 'entrance', name: '博物馆入口', at: [1766, 1666], places: ['first-入口-1'], description: '博物馆入口位于馆区北端、Viale Vaticano 一侧，与圣彼得广场的教堂入口分开。' },
  { id: 'pinacoteca', name: '绘画馆', at: [1514, 1496], places: ['first-19-1'], description: '独立的绘画馆位于方形花园北侧，与长庭院两侧的馆翼不是同一栋建筑。' },
  { id: 'modern-wing', name: '现代馆翼', at: [1618, 1496], places: ['first-17-1', 'first-18-1', 'basement-21-1'], description: '这一侧的新馆翼容纳格里高利世俗博物馆、庇护-基督教博物馆等不同楼层的馆藏。馆翼名称不代表其中的作品全是现代艺术。' },
  { id: 'pio-clementino', name: '庇护-克莱孟馆区', at: [1694, 1770], places: ['first-4-1', 'second-5-1'], description: '长庭院北端的旧望景楼与相接展厅构成这一片馆区。庇护-克莱孟馆与楼上的伊特鲁里亚馆必须在室内图中分别选层。' },
  { id: 'pigna', name: '松果庭院', at: [1497, 1818], places: ['first-松果庭院-1'], description: '长轴北侧的露天庭院。新翼陈列馆将它与中间的图书馆庭院分隔开。' },
  { id: 'west-galleries', name: '西侧长廊', at: [1315, 1737], places: ['second-6-1', 'second-7-1', 'second-8-1'], description: '西侧馆翼贯穿长庭院一侧，烛台廊、挂毯廊与地图廊依次分布于上层，是各自独立的展廊。' },
  { id: 'chiaramonti', name: '基亚拉蒙蒂馆', at: [1498, 1908], places: ['first-2-1'], description: '位于松果庭院东侧的长廊，与横向的新翼陈列馆相接。' },
  { id: 'new-wing', name: '新翼陈列馆', at: [1376, 1821], places: ['first-3-1'], description: '横跨两侧长廊的建筑。向北面向松果庭院，向南的中央半圆部分突出到图书馆庭院一侧。' },
  { id: 'library', name: '图书馆横翼', at: [1264, 1832], places: ['first-15-1'], description: '横向的图书馆建筑把贝尔韦代雷大庭院与北面的图书馆庭院分开。两侧的长馆翼延续了整个院落组的建筑长轴。' },
  { id: 'belvedere', name: '贝尔韦代雷庭院', at: [1101, 1834], places: [], description: '长轴南侧的大庭院，位于教宗宫与图书馆横翼之间。两侧连续的馆翼将它与北部馆区连成一组建筑。' },
  { id: 'palace', name: '教宗宫', at: [907, 2001], places: ['second-10-1', 'first-11-1'], description: '由多个庭院和不同时期的馆翼组成。拉斐尔画室与波吉亚寓所分布在不同楼层，不能从外部轮廓把它们视为同一间展厅。' },
  { id: 'sistine', name: '西斯廷礼拜堂', at: [797, 1784], places: ['first-12-1'], description: '礼拜堂紧邻大教堂与教宗宫建筑群，是博物馆参观中的独立空间，不是圣彼得大教堂的主殿。' },
  { id: 'basilica', name: '圣彼得大教堂', at: [638, 1592], places: [], guideSlug: 'st-peters-basilica', description: '教堂主体位于广场西侧。大教堂、穹顶与博物馆的参观安排不同，不以建筑相邻推断门票或通道互通。' },
  { id: 'square', name: '圣彼得广场', at: [648, 2288], places: [], guideSlug: 'st-peters-square', description: '椭圆柱廊环抱方尖碑，广场通过大教堂前的梯形空间接到立面。' },
];

export const hasVaticanCampus = (slug: string) => ['vatican-museums', 'st-peters-basilica', 'st-peters-square'].includes(slug);

// Display-only callout offsets. The underlying area anchors never move.
export const vaticanCampusLabels: Record<string, [number, number]> = {
  entrance: [1700, 1570], pinacoteca: [1400, 1400], 'modern-wing': [1665, 1340],
  'pio-clementino': [1695, 2020], pigna: [1500, 1815], 'west-galleries': [1190, 1615],
  chiaramonti: [1545, 2105], 'new-wing': [1375, 1995], library: [1240, 2095],
  belvedere: [1090, 1840], palace: [947, 2115], sistine: [870, 1600],
  basilica: [640, 1530], square: [648, 2288],
};
