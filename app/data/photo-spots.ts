import media from './photo-spot-media.generated.json';
import { expandedPhotoSpots } from './photo-spots-expanded';

export type PhotoSpot = {
  id: keyof typeof media;
  city: string;
  guideSlugs: string[];
  title: string;
  position: string;
  direction: string;
  composition: string;
  advice: string;
  access: string;
  mapQuery: string;
  shotDate: string;
  referenceNote: string;
  alt: string;
  kind?: 'indoor' | 'outdoor' | 'terrace';
  room?: string;
  policyKey?: string;
};

const orderedPhotoCities = [
  '巴黎',
  '米兰',
  '威尼斯',
  '佛罗伦萨',
  '比萨',
  '罗马与梵蒂冈',
  '巴塞罗那',
  '科隆',
];
export const photoSpots: PhotoSpot[] = (
  [
    ...expandedPhotoSpots,
    {
      id: 'paris-facade',
      city: '巴黎',
      guideSlugs: ['notre-dame-towers'],
      title: '前广场 · 双塔正立面',
      position:
        '圣母院西侧前广场（Parvis Notre-Dame），在正门中轴线附近向后退开。原图未提供精确站位。',
      direction: '向东，正对西立面。',
      composition:
        '竖幅保留双塔顶部和三道门，人物留在画面底部作尺度参照，中央玫瑰窗居中。',
      advice: '先用手机主摄；拍不全时退后或切超广角，保持两侧塔楼尽量竖直。',
      access: '在广场开放步行区域拍摄，不占用入口队列。',
      mapQuery: 'Parvis Notre-Dame Place Jean-Paul II Paris',
      shotDate: '2025-09-02',
      referenceNote: '修复后立面实拍；现场围栏、队列可能不同。',
      alt: '巴黎圣母院双塔西立面的竖幅正面实拍，前景为广场游客',
    },
    {
      id: 'paris-seine',
      city: '巴黎',
      guideSlugs: ['notre-dame-towers', 'seine'],
      title: '主教桥 · 河岸与教堂侧后方',
      position: 'Pont de l’Archevêché 主教桥一带，靠面向圣母院的步道边缘。',
      direction: '向西北，跨过河面望向圣母院后殿。',
      composition:
        '将河水留在底部，后殿与尖塔作为主体，西侧双塔在左后方形成层次。',
      advice: '横竖构图都可尝试；避免把尖塔压在画面边缘，先保护天空高光。',
      access: '在桥面人行区域停留，让出通行宽度。',
      mapQuery: 'Pont de l’Archevêché Paris',
      shotDate: '2009-10-10',
      referenceNote:
        '火灾前的历史实拍，仅参考机位和构图，不代表目前细部与河岸状态。',
      alt: '从塞纳河桥上拍摄的巴黎圣母院侧后方，河水、树木、后殿和尖塔同框',
    },
    {
      id: 'milan-duomo',
      city: '米兰',
      guideSlugs: ['milan-duomo'],
      title: '大教堂广场 · 尖塔群正面',
      position:
        'Piazza del Duomo 广场中部，面对大教堂西立面。原图坐标为作者事后估计。',
      direction: '向东，略偏离正门中轴线。',
      composition: '横幅容纳整面立面，尖塔上方保留天空，下方带少量广场和行人。',
      advice:
        '人多时不必等清场，可以利用行人的大小衬托建筑；拍摄时留意随身物品。',
      access: '使用广场现有开放区域，入口安检和活动围挡优先。',
      mapQuery: 'Piazza del Duomo Milano',
      shotDate: '2016-06-22',
      referenceNote: '夏季日间实拍；机位为约略记录，不保证原处随时可站。',
      alt: '从米兰大教堂广场拍摄的完整正立面与尖塔群，前景有游客',
    },
    {
      id: 'milan-galleria',
      city: '米兰',
      guideSlugs: ['galleria-vittorio'],
      title: '拱廊中轴 · 玻璃穹顶纵深',
      position:
        '埃马努埃莱二世拱廊内部通道中轴附近，面向中央穹顶。原图未注明具体哪一翼。',
      direction: '沿通道朝中央穹顶取景；原图无可靠罗盘方位。',
      composition:
        '左右店铺对称，地面拼花与拱顶共同收向远处；保留顶部玻璃穹顶。',
      advice: '手机保持水平，优先主摄减少边缘变形；在人流间隙短暂停留。',
      access: '不挡住商铺出入口和通行路线。',
      mapQuery: 'Galleria Vittorio Emanuele II Milano',
      shotDate: '2025-10-30',
      referenceNote: '室内实拍；此处定位到拱廊区域，不是精确相机点。',
      alt: '米兰埃马努埃莱二世拱廊内部对称构图，玻璃穹顶与两侧店铺同框',
    },
    {
      id: 'venice-accademia',
      city: '威尼斯',
      guideSlugs: ['grand-canal'],
      title: '学院桥 · 大运河与安康圣母教堂',
      position: 'Ponte dell’Accademia 学院桥桥顶，面向安康圣母教堂的一侧。',
      direction: '沿大运河向东南望向教堂穹顶。',
      composition: '横幅以运河为引导线，穹顶位于右上方，船只作为前景。',
      advice: '等一艘船进入近景再按快门；相机放在护栏内侧，不探身到栏杆外。',
      access: '桥面较窄，拍摄后及时让位；不架设阻碍行人的设备。',
      mapQuery: 'Ponte dell’Accademia Venezia',
      shotDate: '2012-12-12',
      referenceNote: '冬季实拍；船只、码头及水位会变化。',
      alt: '从威尼斯学院桥看大运河，右侧为安康圣母教堂穹顶，前景有贡多拉',
    },
    {
      id: 'venice-rialto',
      city: '威尼斯',
      guideSlugs: ['rialto', 'grand-canal'],
      title: '里亚托桥 · 河岸夜景',
      position: '里亚托桥朝大运河南段的一侧，俯看 Riva del Vin 河岸。',
      direction: '向南，Riva del Vin 建筑落在画面右侧。',
      composition: '横幅沿河岸斜线展开，保留餐厅灯光和水面倒影，而非拍桥本身。',
      advice:
        '手机可尝试夜景模式并握稳；照片中的星芒和灯光效果不一定能由手机直接复现。',
      access: '留出桥面通道；外部地图仅定位到桥面区域。',
      mapQuery: 'Ponte di Rialto Venezia',
      shotDate: '2017-09-27',
      referenceNote: '夜间实拍；店铺照明及船只位置不同，不承诺相同光效。',
      alt: '从里亚托桥俯拍大运河河岸夜景，餐厅暖光在水中形成倒影',
    },
    {
      id: 'florence-panorama',
      city: '佛罗伦萨',
      guideSlugs: ['piazzale-michelangelo', 'florence-duomo'],
      title: '米开朗基罗广场 · 老城天际线',
      position:
        'Piazzale Michelangelo 面向老城的观景边缘，寻找前方无遮挡的开放位置。',
      direction: '向西北，圣母百花大教堂穹顶与旧宫塔楼同框。',
      composition: '宽幅保留老城屋顶、穹顶和远山，少量树冠与观景台作前景。',
      advice: '主摄拍不全时可尝试全景模式，转动缓慢并保持地平线平直。',
      access: '不要跨越护栏；避让观景台人群与道路。',
      mapQuery: 'Piazzale Michelangelo Firenze',
      shotDate: '2016-04-13',
      referenceNote:
        '原作者由两张照片拼接成全景，不是单张直出。无精确相机坐标。',
      alt: '从米开朗基罗广场望向佛罗伦萨老城的宽幅全景，穹顶和旧宫塔楼同框',
    },
    {
      id: 'florence-bridge',
      city: '佛罗伦萨',
      guideSlugs: ['ponte-vecchio'],
      title: '圣三一桥 · 老桥与倒影',
      position: 'Ponte Santa Trinita 圣三一桥，面向老桥的一侧人行区域。',
      direction: '向东，沿阿诺河望向 Ponte Vecchio。',
      composition: '老桥放在中部偏上，左右河岸形成引导线，下方留出倒影。',
      advice: '先检查水平线；水面平静时多留倒影，水流杂乱时可收紧下缘。',
      access: '桥上有车辆，只在人行区域拍摄，不到车道取景。',
      mapQuery: 'Ponte Santa Trinita Firenze',
      shotDate: '2009-08-25',
      referenceNote:
        '原图经过 HDR 处理，明暗与色彩不是手机自动模式的保证效果。',
      alt: '从圣三一桥拍摄的佛罗伦萨老桥及阿诺河倒影，左右为沿河建筑',
    },
    {
      id: 'pisa-west',
      city: '比萨',
      guideSlugs: ['pisa-cathedral', 'leaning-tower'],
      title: '奇迹广场南侧 · 主教堂与斜塔',
      position:
        '奇迹广场南侧一带，沿开放步道寻找主教堂与斜塔能同时入镜的角度。',
      direction: '向北偏东，主教堂在左、斜塔在右。',
      composition:
        '横幅把教堂侧面与塔的倾斜同时呈现，草地作近景，塔身不要紧贴右边缘。',
      advice: '不要为了将斜塔拍直而旋转画面；以教堂竖线或水平地面作参照。',
      access: '原图相机记录仅供约略定位，现场优先使用开放步道，不跨草坪护栏。',
      mapQuery: 'Piazza dei Miracoli Pisa',
      shotDate: '2006-05-12',
      referenceNote: '历史实拍；草坪开放范围、护栏和施工状态以现场为准。',
      alt: '比萨主教堂侧面和斜塔同框，绿色草地作为前景',
    },
    {
      id: 'pisa-east',
      city: '比萨',
      guideSlugs: ['leaning-tower', 'pisa-cathedral'],
      title: '斜塔东侧 · 塔与教堂叠景',
      position: '斜塔东侧开放步行区域，在塔后方能看到主教堂的角度停留。',
      direction: '向西，斜塔在前、主教堂在后。',
      composition:
        '以塔为主角保留完整塔顶，后方教堂提供纵深；保留少量人群作为尺度。',
      advice: '用主摄先拍，避开近距离超广角造成的额外倾斜。',
      access: '不占用登塔入口队列，原相机坐标附近若被围挡则在开放区域调整。',
      mapQuery: 'Leaning Tower of Pisa',
      shotDate: '2019-10-07',
      referenceNote: '原图含教堂脚手架，作为当时状态与构图参考。',
      alt: '从东侧看比萨斜塔，后方是主教堂及局部脚手架',
    },
    {
      id: 'rome-colosseum',
      city: '罗马与梵蒂冈',
      guideSlugs: ['colosseum'],
      title: '北侧高处 · 斗兽场弧形外墙',
      position:
        '斗兽场北侧 Via Nicola Salvi 一带较高的人行区域，原图相机记录在建筑北侧。',
      direction: '向南，朝外墙连续拱券拍摄。',
      composition:
        '竖幅带入前景绿植与下方道路，天空保留一些空间，突出外墙的弧度。',
      advice: '逆光时点按建筑测光后略降曝光，避免太阳周围完全过曝。',
      access: '站在有护栏的人行区域，不坐护栏或跨到道路边缘。',
      mapQuery: 'Via Nicola Salvi Roma',
      shotDate: '2024-10-31',
      referenceNote: '逆光实拍；围挡、植被和交通情况可能不同。',
      alt: '从北侧高处竖拍罗马斗兽场弧形外墙，前景有树木，道路位于下方',
    },
    {
      id: 'rome-vatican',
      city: '罗马与梵蒂冈',
      guideSlugs: ['st-peters-basilica', 'st-peters-square'],
      title: '圣彼得广场 · 圣殿斜向全立面',
      position:
        '圣彼得广场内、面向圣殿时偏左的开放步行区，参考原图约略相机位置。',
      direction: '向西北，斜看圣殿正立面。',
      composition:
        '横幅保留立面宽度，广场栏杆形成引导线；这张参考以立面为主，不追求完整穹顶。',
      advice:
        '活动座椅或安检改变站位时，在允许区域内调整，不为构图进入封闭区。',
      access: '须遵守广场当日安检、活动和围挡安排。',
      mapQuery: 'Piazza San Pietro Vatican City',
      shotDate: '2014-08-02',
      referenceNote: '原图包含活动座椅和施工设备，不表示现在仍如此布置。',
      alt: '圣彼得广场内斜向拍摄的大教堂正立面，前景有栏杆和成排座椅',
    },
    {
      id: 'barcelona-sagrada',
      city: '巴塞罗那',
      guideSlugs: ['sagrada-familia'],
      title: '高迪广场 · 树框与诞生立面',
      position: 'Plaça de Gaudí 高迪广场内，位于圣家堂东北侧的开放步道。',
      direction: '向西南，面向诞生立面。',
      composition:
        '用两侧树木形成画框，让诞生立面与尖塔从中间露出；此图不是倒影机位。',
      advice: '移动少量距离避开树枝遮挡塔顶，先看构图再决定横竖幅。',
      access: '留在广场步道，避免踩踏绿地。',
      mapQuery: 'Plaça de Gaudí Barcelona',
      shotDate: '2009-10-07',
      referenceNote:
        '2009 年施工期实拍；新塔与建筑高度已变化，仅参考站位和树框构图。',
      alt: '从高迪广场透过树木拍摄圣家堂诞生立面，照片含2009年的塔身与起重机',
    },
    {
      id: 'barcelona-guell',
      city: '巴塞罗那',
      guideSlugs: ['park-guell'],
      title: '自然广场 · 马赛克与城市远景',
      position:
        '古埃尔公园主露台（自然广场）面向城市的一侧，靠蛇形马赛克座椅的开放区域。',
      direction: '向南，望向入口建筑与城市。',
      composition:
        '马赛克弧线作为近景，中间保留入口建筑尖塔，城市和天空铺在后方。',
      advice:
        '近景与远景同时入画可先用主摄；不要为了去掉游客而站上马赛克座椅。',
      access: '位于公园内部，按现有预约及当日开放安排进入。',
      mapQuery: 'Plaça de la Natura Park Güell Barcelona',
      shotDate: '2019-06-17',
      referenceNote: '露台实拍；植物、游客和座椅可用区域会变化。',
      alt: '古埃尔公园露台的马赛克栏沿、入口尖塔与巴塞罗那城市远景',
    },
    {
      id: 'cologne-river',
      city: '科隆',
      guideSlugs: ['cologne-cathedral', 'hohenzollern'],
      title: '道依茨桥北河岸 · 大桥与双塔夜景',
      position:
        '莱茵河东岸、霍亨索伦桥北侧河岸步道，靠近桥头但不进入铁路设施。',
      direction: '向西，桥从左侧伸入，科隆大教堂双塔在中间。',
      composition: '把桥拱与教堂双塔一同收入横幅，下方保留灯光倒影。',
      advice:
        '夜景模式先以不糊为目标；长曝光效果受船只、水面和相机稳定程度影响。',
      access: '只在开放河岸步道拍摄，留意滨水边缘和通行者。',
      mapQuery: 'Hohenzollernbrücke Deutz Köln',
      shotDate: '2012-11-03',
      referenceNote: '历史夜景；右侧场馆照明和城市灯光不代表当前配置。',
      alt: '科隆霍亨索伦桥与大教堂双塔夜景，金色桥灯和紫色场馆灯倒映在莱茵河中',
    },
    {
      id: 'cologne-triangle',
      city: '科隆',
      guideSlugs: ['koln-triangle', 'hohenzollern', 'cologne-cathedral'],
      title: 'KölnTriangle · 莱茵河城市全景',
      position:
        'KölnTriangle 观景平台面向市中心的一侧；地图坐标只定位建筑，机位在楼上。',
      direction: '向西，越过莱茵河看霍亨索伦桥和大教堂。',
      composition:
        '让桥从画面右下方斜指向教堂，地平线放在上部，保留河流的宽度。',
      advice: '靠近允许接近的玻璃位置减少反光，关闭闪光灯，勿将器材伸出围护。',
      access: '需进入观景平台，按场馆当日开放安排；不是地面街边机位。',
      mapQuery: 'KölnTriangle Panorama Köln',
      shotDate: '2019-04-20',
      referenceNote: '楼上平台实拍；相机坐标不含高度，不可当成街面导航点。',
      alt: '从KölnTriangle俯瞰莱茵河、霍亨索伦桥和科隆大教堂的日间全景',
    },
  ] satisfies PhotoSpot[]
).sort(
  (a, b) =>
    orderedPhotoCities.indexOf(a.city) - orderedPhotoCities.indexOf(b.city),
);

export const photoSpotMedia = media;
export const photoCities = [...new Set(photoSpots.map((spot) => spot.city))];
export function photoSpotsForGuide(slug: string) {
  return photoSpots.filter((spot) => spot.guideSlugs.includes(slug));
}
export function photoSpotMapUrl(spot: PhotoSpot) {
  const photo = media[spot.id];
  const query =
    spot.kind !== 'indoor' &&
    spot.id !== 'milan-galleria' &&
    photo.latitude !== null &&
    photo.longitude !== null
      ? `${photo.latitude},${photo.longitude}`
      : spot.mapQuery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
