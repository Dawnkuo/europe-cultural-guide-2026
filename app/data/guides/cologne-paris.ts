import { defineGuideContent } from './types';

export const cologneParisGuideContent = defineGuideContent({
  'museum-ludwig': {
    overview:
      '路德维希博物馆位于科隆大教堂、中央车站与莱茵河之间，是理解德国战后收藏史和二十世纪视觉文化的核心场馆。1976年，彼得与伊蕾娜·路德维希向科隆市捐赠重要的美国波普艺术收藏，推动博物馆独立建制；今天的馆藏同时覆盖德国表现主义、俄罗斯先锋派、摄影、当代艺术以及规模居世界第三的毕加索收藏。参观重点不是追求作品数量，而是比较大众传媒图像、现代主义形式实验和战后城市公共收藏之间的联系。',
    orientation: [
      {
        title: '先读收藏形成史',
        body: '1946年的Haubrich收藏奠定表现主义与新客观主义基础，1976年的路德维希夫妇捐赠则带来波普艺术并促成独立建馆。',
      },
      {
        title: '再辨楼层主题',
        body: '地下层以当代艺术为主，第一层集中波普艺术、Fluxus、抽象表现主义、极简与观念艺术，第二层连接表现主义、俄罗斯先锋派、摄影和毕加索。',
      },
      {
        title: '把作品放回媒介史',
        body: '馆藏从绘画、雕塑和版画延伸至摄影与技术媒介，适合观察二十世纪艺术如何不断改变图像的生产、复制和观看方式。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '由现代主义向当代艺术展开的多层场馆',
      note: '楼层主题依据官方常设展导览整理；具体展厅和在展作品会因轮换、借展或保护需要调整。',
      stops: [
        '入口与中庭：领取当日楼层图并确认临时关闭展厅',
        '第二层Haubrich收藏与德国表现主义',
        '第二层俄罗斯先锋派、摄影与毕加索收藏',
        '第一层美国波普艺术、Fluxus与观念艺术',
        '地下层当代艺术陈列',
      ],
    },
    highlights: [
      {
        title: '美国波普艺术收藏',
        summary:
          '馆藏包括Roy Lichtenstein、Claes Oldenburg、Tom Wesselmann、Andy Warhol、Robert Rauschenberg等人的代表性作品，是美国境外规模最大的美国波普艺术收藏。',
        lookFor:
          '观察漫画网点、广告色彩、商品和身体图像如何被放大、裁切或软化，并比较作品对消费文化既迷恋又疏离的态度。',
      },
      {
        title: '毕加索的跨媒介实验',
        summary:
          '约九百件毕加索作品横跨绘画、雕塑、陶瓷、纸上作品及三套大型版画系列，覆盖艺术家多个创作阶段。',
        lookFor:
          '不要只辨认人物主题，重点比较同一身体或面孔如何在平面、体积、线条和颜色之间持续变形。',
      },
      {
        title: 'Haubrich收藏',
        summary:
          'Josef Haubrich在二战后将曾遭纳粹贬斥的现代主义作品捐给科隆市，其中包括Otto Dix、Ernst Ludwig Kirchner及Max Beckmann等人的作品。',
        lookFor:
          '留意尖锐轮廓、不稳定色彩和人物心理，同时把作品的形式语言与战后重新建立公共文化记忆的背景联系起来。',
      },
    ],
    sequence: [
      {
        title: '确认当日展陈',
        body: '在入口查看楼层图和临时关闭信息，先确认常设展实际开放范围，不把馆藏名录等同于当日在展清单。',
      },
      {
        title: '从第二层建立现代主义脉络',
        body: '先看Haubrich收藏、表现主义和俄罗斯先锋派，再进入毕加索及摄影区域，建立形式实验的历史背景。',
      },
      {
        title: '在第一层比较大众图像',
        body: '转向波普艺术、Fluxus和观念艺术，比较艺术家如何挪用广告、漫画、商品和日常动作。',
      },
      {
        title: '以下降至当代收束',
        body: '最后到地下层观察当代艺术如何继承或质疑前述媒介传统，再从中庭回看整套收藏结构。',
      },
    ],
    practical: [
      '行程记录仍为“下午，详细时间待补”，状态为未订并注明可现场购票；本内容不替行程指定入场时间。',
      '官网当前页面存在周日开放时间冲突：票务页称周五至周日开放至20:00但常设展18:00关闭，FAQ仍称全馆10:00–18:00。2026-10-04参观常设展应保守按18:00截止并在当天复核。',
      '门票涵盖常设展及当日特展；大于A4尺寸的背包、手袋和雨伞须存入有人值守的衣帽间或储物柜。',
      '所有展区可由电梯到达；私人拍摄不得使用闪光灯、三脚架或自拍杆。',
    ],
    sources: [
      {
        institution: 'Museum Ludwig',
        title: 'The Permanent Collection at the Museum Ludwig',
        url: 'https://www.museum-ludwig.de/en/home/museum/collection/the-permanent-collection-at-the-museum-ludwig',
        verifiedAt: '2026-09-02',
        note: '支持建馆捐赠、波普艺术、毕加索、Haubrich收藏及主要馆藏事实。',
      },
      {
        institution: 'Museum Ludwig',
        title: 'Tickets + Opening Hours',
        url: 'https://www.museum-ludwig.de/en/home/visit/information/tickets-opening-hours',
        verifiedAt: '2026-09-02',
        note: '支持票务页当前开放时间、常设展周末18:00关闭及现场付款信息。',
      },
      {
        institution: 'Museum Ludwig',
        title: 'FAQ - Plan your visit',
        url: 'https://www.museum-ludwig.de/en/home/visit/information/faq-plan-your-visit',
        verifiedAt: '2026-09-02',
        note: '支持官网时间冲突、寄存、摄影、现场购票及语音导览信息。',
      },
    ],
  },
  hohenzollern: {
    overview:
      '霍亨索伦桥不仅是跨越莱茵河的交通设施，也是科隆最清晰的城市剖面之一：六条铁路轨道持续连接中央车站与欧洲铁路网，两侧步行和自行车通道则把大教堂、博物馆区与Deutz右岸连为一体。桥梁建于1907至1911年，1945年并非被空袭炸毁，而是由德军为阻止盟军渡河自行爆破，随后分期重建和扩宽。今天应同时观察钢桁架的工程节奏、密集爱情锁形成的民间纪念层，以及中跨处大教堂与河流的轴线。',
    orientation: [
      {
        title: '认出三组并列拱桥',
        body: '现桥由三座并列的桁架拱铁路桥组成，总长409.19米、总宽26.20米，铁路共有六条轨道。',
      },
      {
        title: '区分桥梁与步道管理',
        body: '桥体归Deutsche Bahn InfraGO所有，两侧步行和自行车道由科隆市维护，现场须留意不同速度的通行流线。',
      },
      {
        title: '从城市历史理解重建',
        body: '桥梁于1945年3月6日被德军炸毁，1948、1959及1987年前后分阶段恢复扩建，并于1997年列入文物保护。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '铁路拱桥上的线性城市观察面',
      note: '以下节点沿行程已明确的“路德维希博物馆—霍亨索伦桥—科隆三角”顺序组织，不增加游览时长。',
      stops: [
        '大教堂侧入口：经Museum Ludwig与Heinrich-Böll-Platz进入步道',
        '爱情锁栏网：观察锁体铭文与累积密度',
        '河道中跨：同时辨认大教堂、老城和莱茵河上下游',
        'Deutz桥头：观察桥拱收束并转向科隆三角',
      ],
    },
    highlights: [
      {
        title: '桁架拱与铁路节奏',
        summary:
          '三座并列钢桁架拱桥以连续三跨越过莱茵河，密集列车让结构始终处于可感知的运行状态。',
        lookFor:
          '在不阻塞步道的位置观察拱肋、横向连接和列车尺度，体会桥梁如何同时承担工程与城市门廊功能。',
      },
      {
        title: '爱情锁的民间档案',
        summary:
          '自2008年起，大量锁具被固定在桥侧栏网上，纪念对象不只包括情侣，也包括友谊、亲情和个人时刻。',
        lookFor:
          '读取日期、语言、照片和磨损痕迹，比较私人记忆如何在公共基础设施上形成不断增长的表面。',
      },
      {
        title: '大教堂与河流轴线',
        summary:
          '桥梁把科隆中央车站和大教堂所在左岸与Deutz右岸直接连接，是观看城市天际线层次的关键位置。',
        lookFor:
          '在中跨回望双塔、Museum Ludwig低矮屋顶、老城与河岸，观察宗教建筑、文化设施和交通基础设施的尺度对比。',
      },
    ],
    sequence: [
      {
        title: '从博物馆后方上桥',
        body: '由Heinrich-Böll-Platz进入大教堂侧步道，先确认自行车流向和适合短暂停留的位置。',
      },
      {
        title: '沿锁墙缓慢通过',
        body: '选择少量有日期或图像的锁具细看，不尝试统计总数，也不把未经证实的重量估算写成现场结论。',
      },
      {
        title: '在中跨建立方位',
        body: '分别看上游、下游和大教堂方向，辨认河道、铁路与两岸城市空间的关系。',
      },
      {
        title: '由Deutz侧离桥',
        body: '到桥头后回看三组钢拱的重叠轮廓，再按既定行程转向科隆三角大厦。',
      },
    ],
    practical: [
      '行程时间仍为“下午，详细时间待补”，状态为无需门票；桥梁内容不补写开始时间或停留时长。',
      '步道与自行车流线相邻，拍照和阅读锁具时须靠边且不得占用通道；列车通过时噪声和振动明显。',
      '桥面完全露天，风雨或高温会直接影响体验；本项目不把天气建议转换为行程调整。',
    ],
    sources: [
      {
        institution: 'Stadt Köln',
        title: 'Hohenzollernbrücke',
        url: 'https://www.stadt-koeln.de/leben-in-koeln/verkehr/bruecken/hohenzollernbruecke',
        verifiedAt: '2026-09-02',
        note: '支持建造、爆破重建、结构尺寸、轨道、步道、所有权及文物保护事实。',
      },
      {
        institution: 'KölnTourismus',
        title: 'Love locks on the Hohenzollern Bridge',
        url: 'https://willkommen.koelntourismus.de/terminal/singlepage/en/poi/love-locks',
        verifiedAt: '2026-09-02',
        note: '支持爱情锁自2008年形成、纪念类型及大教堂侧步行入口信息。',
      },
    ],
  },
  'koln-triangle': {
    overview:
      '科隆三角大厦观景台位于莱茵河右岸Deutz区，与大教堂隔河相望，是把刚走过的霍亨索伦桥、老城和河港重新组合成整体城市图景的垂直观察点。建筑高103.20米，共29层，透明玻璃与铝制立面包围一个勒洛三角形平面；屋顶约400平方米的平台提供环绕视野。参观价值不在于单纯“登高”，而在于从同一高度比较哥特式双塔、铁路桥、罗曼式教堂、现代博物馆和莱茵河弯曲方向。',
    orientation: [
      {
        title: '先认建筑几何',
        body: '大厦采用三条外凸曲边围绕圆形核心的勒洛三角形平面，立面由玻璃与铝构成，高103.20米。',
      },
      {
        title: '再认垂直交通',
        body: '建筑设五部电梯，官方资料列电梯速度为每秒4米；访客乘梯至高层后再经短楼梯抵达屋顶平台。',
      },
      {
        title: '以大教堂确定西方',
        body: '大教堂、霍亨索伦桥与老城位于平台西侧，莱茵河由此展开南北方向，适合作为全城方位基准。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '电梯连接的环形屋顶观景台',
      note: '远距离可见范围取决于天气和能见度；方向说明用于观察，不替代精确导航。',
      stops: [
        'Ottoplatz 1入口与大堂售票处',
        '电梯上行及通往屋顶的末段楼梯',
        '西向面：大教堂、霍亨索伦桥、Museum Ludwig与老城',
        '南向面：莱茵河、Rheinauhafen与Siebengebirge方向',
        '北向和东向面：Deutz、Bergisches Land及天气许可时的远景',
      ],
    },
    highlights: [
      {
        title: '与大教堂近乎齐平的视角',
        summary:
          '平台把大教堂双塔置于接近视平线的位置，使立面、屋顶和城市背景之间的关系比地面观察更清楚。',
        lookFor:
          '辨认双塔的垂直主导性，以及中央车站、Museum Ludwig和老城低层建筑如何在其周围形成基座。',
      },
      {
        title: '霍亨索伦桥的完整结构',
        summary:
          '从屋顶可把刚步行经过的桥梁看成三组并列拱架，并同时理解其与铁路车站、河道和两岸步道的连接。',
        lookFor:
          '观察列车如何穿过连续拱跨，以及桥轴线如何把大教堂正面与Deutz城市空间连接起来。',
      },
      {
        title: '科隆的多中心天际线',
        summary:
          '平台视野覆盖老城、Groß St. Martin、Rheinauhafen、Deutz和更远区域，天气清晰时可望向Düsseldorf、Siebengebirge及Bergisches Land。',
        lookFor:
          '比较中世纪教堂尖塔、港区Kranhäuser、现代办公楼和河流绿带的不同高度、材质与方向。',
      },
    ],
    sequence: [
      {
        title: '由桥头抵达Ottoplatz',
        body: '从霍亨索伦桥Deutz侧前往大厦入口，先从地面观察三条凸曲边和玻璃立面。',
      },
      {
        title: '购票并垂直上行',
        body: '按现场指示购票、乘电梯，再经末段楼梯进入屋顶平台；不在导览中虚构预约时段。',
      },
      {
        title: '以大教堂为起点环看',
        body: '先在西向面定位大教堂和桥，再顺平台辨认南、东、北各方向，避免一上来只拍单一地标。',
      },
      {
        title: '回到西向面收束',
        body: '离开前再次把大教堂、桥和老城放进同一画面，随后按原垂直流线下楼。',
      },
    ],
    practical: [
      '行程仍记录为“下午，详细时间待补”，状态未订并注明可现场购票；不据开放时间反推行程安排。',
      '2026-10-04适用10月至次年4月时段，官网列每日11:00–20:00；到访当天仍应检查临时公告。',
      '暴风或雷暴时平台因安全原因关闭；犬只和行李箱不得带上观景台。',
      '平台有玻璃围护，逆光和室内反射会影响拍摄；远方地标仅在能见度许可时可见。',
    ],
    sources: [
      {
        institution: 'KölnTriangle Cologne View',
        title: 'View, Explore and Visitor Information',
        url: 'https://koelntrianglepanorama.de/en/homepage',
        verifiedAt: '2026-09-02',
        note: '支持开放时间、天气关闭、行李规则、高度、层数、平台面积、电梯和建筑几何。',
      },
      {
        institution: 'KölnTourismus',
        title: 'KölnTriangle',
        url: 'https://willkommen.koelntourismus.de/en/poi/koelntriangle',
        verifiedAt: '2026-09-02',
        note: '支持平台视野、勒洛三角形、入口方式及各方向可辨认地标。',
      },
    ],
  },
  'cologne-cathedral': {
    overview:
      '科隆大教堂在本内容包中合并“教堂内部”与“南塔及珍宝馆”为一个完整建筑群，但保留两张票各自不同的有效窗口。这里既是持续举行礼拜的天主教主教座堂，也是由中殿、唱诗席、礼拜堂、地下珍宝馆和约100米高南塔构成的垂直文化空间。参观应把三王圣龛、约976年的Gero十字架、中世纪与当代彩窗、地下金工珍藏及533级台阶后的城市视野联系起来，理解朝圣、艺术、工程和城市身份如何叠合。',
    orientation: [
      {
        title: '区分礼拜与旅游参观',
        body: '大教堂首先是祈祷和礼拜场所；自2026年7月1日起，旅游参观内部需要门票，而参加礼拜或个人祈祷仍依官方规则进入。',
      },
      {
        title: '认出地下与高塔入口',
        body: '珍宝馆入口位于教堂北侧车站方向，南塔入口位于南侧教堂商店附近，各自与教堂旅游入口分离。',
      },
      {
        title: '保留两组票面窗口',
        body: '内部票面为10:00–17:45有效，南塔与珍宝馆组合票为10:00–16:00有效；两者都是有效窗口，不代表固定10:00入场。',
      },
    ],
    spatial: {
      type: 'site',
      title: '由地下珍宝馆、水平礼仪空间与南塔组成的垂直建筑群',
      note: '节点用于理解空间层次；教堂可能因礼拜、活动、施工或安保临时限制区域，现场围栏优先。',
      stops: [
        '中央票务处与西立面主要入口',
        '中殿、唱诗席及三王圣龛',
        '十字架小堂的Gero十字架',
        '南耳堂Gerhard Richter彩窗',
        '圣器室下方中世纪拱顶珍宝馆',
        '南塔螺旋梯、钟室层及约100米高观景平台',
      ],
    },
    highlights: [
      {
        title: '三王圣龛',
        originalTitle: 'Dreikönigenschrein',
        period: '约1190–1220年',
        location: '唱诗席后方',
        summary:
          '大型金工圣龛为安置1164年带到科隆的三王圣髑而制，图像从先知和使徒展开至基督教救赎史。',
        lookFor:
          '先看正面的三王朝拜，再沿侧面辨认上下两层拱廊人物，注意“圣髑容器”如何被设计成微缩建筑。',
      },
      {
        title: 'Gero十字架与南耳堂彩光',
        originalTitle: 'Gerokreuz und Richter-Fenster',
        period: '约976年；彩窗2007年启用',
        summary:
          'Gero十字架以闭眼、下垂头部和具有重量感的身体表现死亡的基督；Richter彩窗则以抽象色块把当代艺术带入哥特空间。',
        lookFor:
          '比较木雕身体的自然主义痛感与彩窗投射在石柱、地面和访客身上的非叙事色光。',
      },
      {
        title: '从珍宝馆地窖到南塔平台',
        summary:
          '珍宝馆位于中世纪拱顶地窖，南塔则需经过533级螺旋梯和金属梯抵达约100米高平台，两者构成建筑群最强的上下对照。',
        lookFor:
          '在地下观察金工、纺织品和礼仪器物的精细尺度；登塔后转向莱茵河、老城和周边地区，重新理解大教堂在城市中的高度。',
      },
    ],
    sequence: [
      {
        title: '核验两类门票与入口',
        body: '在中央票务区域确认内部票和南塔/珍宝馆组合票各自有效窗口，不把其中任何一个窗口改写成固定开始时间。',
      },
      {
        title: '先读内部主轴',
        body: '由中殿进入唱诗席方向，观察柱列、彩窗与三王圣龛如何共同引导视线和朝圣动线。',
      },
      {
        title: '转向两件跨时代作品',
        body: '在十字架小堂看Gero十字架，再到南耳堂看Richter彩窗，比较具象身体与抽象光线。',
      },
      {
        title: '进入地下珍宝馆',
        body: '由北侧独立入口下到拱顶地窖，按现场开放展柜观察礼仪金工、纺织品及主教座堂历史。',
      },
      {
        title: '完成南塔攀登',
        body: '由南侧独立入口开始533级无电梯攀登，在平台辨认莱茵河、老城和先前参观过的城市节点。',
      },
    ],
    practical: [
      '必须原样保留票务差异：教堂内部“10:00–17:45有效”，南塔与珍宝馆“10:00–16:00有效”；均为有效时间窗口，具体参观顺序和入场时刻仍未解决。',
      '南塔共有533级台阶且无电梯，前段为狭窄螺旋梯，后段为金属楼梯；身体条件不适合者不应据本导览强行登塔。',
      '内部、珍宝馆和塔楼仅允许不超过40×35×15厘米的小包或日用背包；大型行李不得进入且现场不能寄存。',
      '旅游参观会受礼拜、特别活动、施工和安保临时影响；私人摄影仅可在规则允许区域使用非闪光、无附加设备方式。',
    ],
    sources: [
      {
        institution: 'Hohe Domkirche Köln',
        title: 'Your visit to Cologne Cathedral',
        url: 'https://www.koelner-dom.de/en',
        verifiedAt: '2026-09-02',
        note: '支持2026门票规则、礼拜限制、珍宝馆位置、塔楼533级台阶、入口、开放和行李规定。',
      },
      {
        institution: 'Hohe Domkirche Köln',
        title: 'The Shrine of the Magi',
        url: 'https://www.koelner-dom.de/en/tour/cologne-cathedral-and-the-jews/the-shrine-of-the-magi',
        verifiedAt: '2026-09-02',
        note: '支持圣髑1164年抵达、圣龛制作年代及图像主题。',
      },
      {
        institution: 'Hohe Domkirche Köln',
        title: 'Gerokreuz',
        url: 'https://www.koelner-dom.de/kunstwerke/gerokreuz',
        verifiedAt: '2026-09-02',
        note: '支持Gero十字架年代、位置、材质状态和死亡基督的表现特征。',
      },
      {
        institution: 'Hohe Domkirche Köln',
        title: 'Richter-Fenster',
        url: 'https://www.koelner-dom.de/fileadmin/images/04rundgang/fenster/rz_heft_richterfenster_deutsch.pdf',
        verifiedAt: '2026-09-02',
        note: '支持南耳堂Gerhard Richter彩窗及其色光构成。',
      },
    ],
  },
  'cologne-old-town': {
    overview:
      '科隆老城不是一座封闭古迹，而是由历史市场、仍在使用的市政设施、罗曼式教堂、河岸街巷和战后重建层共同构成的城市地区。核心观察点集中在Alter Markt、历史市政厅、Groß St. Martin与Fischmarkt之间：这里既保留罗马港区和中世纪修院的地下痕迹，也展示市民自治、战争破坏与现代恢复如何改变城市外观。行程不应把它简化成“彩色房屋拍照点”，而要从广场功能、宗教建筑和莱茵河贸易关系理解街区。',
    orientation: [
      {
        title: '以Alter Markt为公共中心',
        body: 'Alter Markt长期承担市场和公共生活功能，今天仍由历史市政厅、纪念物和持续发生的城市活动共同定义。',
      },
      {
        title: '以Groß St. Martin辨认河港历史',
        body: '教堂所在地曾是莱茵河岛屿和罗马河港区，下方保存二世纪仓库基础，现存罗曼式建筑始建于十二世纪。',
      },
      {
        title: '把重建视为历史层',
        body: 'Groß St. Martin在二战中严重受损并经历四十余年修复，市政厅及街区也并非未经改变的中世纪原貌。',
      },
    ],
    spatial: {
      type: 'district',
      title: '市场、教堂与河岸组成的步行街区',
      note: '节点按大教堂区向莱茵河和Rheinauhafen延伸的已定行程关系组织，不添加精确步行时间。',
      stops: [
        'Alter Markt历史市场与Jan von Werth纪念柱',
        '历史市政厅塔楼和立面',
        'Groß St. Martin外观及开放时的内部/罗马基础',
        'Fischmarkt河岸街巷与教堂天际线',
        'Rheingarten河岸界面',
      ],
    },
    highlights: [
      {
        title: 'Groß St. Martin的罗曼式体量',
        summary:
          '方形交叉塔、四座角塔、圆拱和厚重石墙使教堂成为老城河岸最明确的罗曼式标志，其下方又叠压罗马仓库遗址。',
        lookFor:
          '从Fischmarkt先看塔楼整体，再靠近辨认圆拱、墙体层次和考古入口，理解地面建筑与地下港区的连续性。',
      },
      {
        title: 'Alter Markt与历史市政厅',
        summary:
          '广场把市场、节庆、婚礼和市政活动聚在同一空间；市政厅塔则源自行会在1393年取得城市权力后的政治表达。',
        lookFor:
          '比较市政厅中世纪塔楼、后来的建筑层和战后部分，并寻找Jan von Werth、Platzjabbeck等地方人物意象。',
      },
      {
        title: 'Fischmarkt的河港尺度',
        summary:
          '低层房屋、狭窄街巷、Groß St. Martin高塔与开放河面形成老城最鲜明的高低对照，提示该区与贸易和码头历史的联系。',
        lookFor:
          '不要只看正面色彩，也观察房屋开间、街巷朝向、教堂塔楼和莱茵河之间如何形成连续视线。',
      },
    ],
    sequence: [
      {
        title: '进入Alter Markt',
        body: '从大教堂方向进入历史市场，先辨认广场边界、纪念柱和市政厅在公共空间中的位置。',
      },
      {
        title: '阅读市政厅立面',
        body: '观察塔楼、人物雕塑与不同时代建筑层，不把整座建筑误读为单一时期保存下来的原貌。',
      },
      {
        title: '转向Groß St. Martin',
        body: '由广场进入教堂周边，先看塔楼整体；仅在开放和礼拜规则允许时进入内部或考古区。',
      },
      {
        title: '由Fischmarkt抵达河岸',
        body: '在低层房屋前回看教堂天际线，再到Rheingarten观察老城与莱茵河的接触面。',
      },
    ],
    practical: [
      '行程记录为“详细时间待补”，状态无需门票；街区导览不添加开始时间、持续时间或替代路线。',
      'Alter Markt、Fischmarkt和公共街巷可免费进入，但活动、施工或市政管理可能临时改变通行空间。',
      'Groß St. Martin是活动教堂，官方页面当前列周一为休息日；2026-10-05为周一，因此内部参观保持“待确认/可能关闭”，外观观察不受此结论替代。',
    ],
    sources: [
      {
        institution: 'KölnTourismus',
        title: 'Alter Markt',
        url: 'https://www.koelntourismus.de/kunst-kultur/sehenswuerdigkeiten/detail/alter-markt',
        verifiedAt: '2026-09-02',
        note: '支持历史市场、公共功能、市政厅建筑层次及地方人物信息。',
      },
      {
        institution: 'KölnTourismus',
        title: 'Groß St. Martin',
        url: 'https://www.koelntourismus.de/sehen-erleben/poi/gross-st-martin',
        verifiedAt: '2026-09-02',
        note: '支持罗马遗址、修院与教堂年代、罗曼式建筑、战争损毁、修复及周一开放不确定性。',
      },
      {
        institution: 'Stadt Köln',
        title: 'Heiraten im Historischen Rathaus',
        url: 'https://www.stadt-koeln.de/artikel/06215/index.html',
        verifiedAt: '2026-09-02',
        note: '支持市政厅塔1393年行会城市权力背景及当前市政用途。',
      },
    ],
  },
  rheinauhafen: {
    overview:
      'Rheinauhafen是科隆老城以南沿莱茵河展开的旧港更新区。这里曾位于名为Werthchen的天然河岛，十九世纪末被改造成正式港区；1998年后的城市更新没有完全抹去港口，而是让仓库、港务局、动力房、历史起重机与新的住宅办公建筑共存。三座倒L形Kranhäuser重塑了科隆天际线，1909年的Siebengebirge仓库和1889年的砖砌港务建筑则保存货运时代的结构。观察重点是历史材料如何被改造，而不是把开放滨水区误认为所有建筑均可入内。',
    orientation: [
      {
        title: '先建立港区时间线',
        body: 'Rheinauhafen名称自1892年使用，港区于1898年开放；1998年形成新用途方案，之后历经约十二年建设成为混合城区。',
      },
      {
        title: '区分公共空间与私人建筑',
        body: '滨河步道和广场属于可游览的开放空间，Kranhäuser及多数改造仓库则主要是住宅、办公室或商业设施。',
      },
      {
        title: '寻找新旧结构并置',
        body: '港区刻意保留砖砌仓库、港机和防御塔，同时以玻璃、钢和混凝土新建筑回应旧吊车及仓储尺度。',
      },
    ],
    spatial: {
      type: 'district',
      title: '沿莱茵河展开的线性适应性再利用街区',
      note: '以下由南向北的观察序列以巧克力博物馆入口收束，便于衔接下一项，但不替行程补写时段或交通安排。',
      stops: [
        'Bayenturm与Elisabeth-Treskow-Platz',
        '三座Kranhäuser及中部滨河步道',
        'Siebengebirge原Danziger仓库',
        'Hafenamt、Krafthaus与保存的港口机械',
        '北端旋转桥、Malakoffturm与巧克力博物馆外观',
      ],
    },
    highlights: [
      {
        title: '三座Kranhäuser',
        summary:
          'Hadi Teherani团队设计的建筑群以倒置L形悬挑模拟历史港口吊车，钢桁架、高层横向体量和玻璃立面使其成为新港区标志。',
        lookFor:
          '从步道斜向仰看悬挑与支撑，再从远处比较三座建筑的间距、朝向和住宅/办公用途差异。',
      },
      {
        title: 'Siebengebirge仓库',
        summary:
          '原Danziger Lagerhaus长约170米，1909年由Hans Verbeek建造，是德国较早的钢筋混凝土框架建筑之一，连续山墙形成名称来源。',
        lookFor:
          '辨认黄色立面、重复山墙、放大的窗洞和后加凉廊，判断新住宅用途如何嵌入保存下来的结构网格。',
      },
      {
        title: '港务建筑与机械遗存',
        summary:
          '1889年的Hafenamt和Krafthaus以双色砖、圆拱及钟塔记录港口管理和动力系统，河岸仍保存起重机及装卸设施遗迹。',
        lookFor:
          '比较砖墙、石基、铁件和现代玻璃连接体，并寻找Krafthaus原有入口、铺地及“dicke Herkules”起重机留下的工业尺度。',
      },
    ],
    sequence: [
      {
        title: '从南端读旧城边界',
        body: '在Bayenturm附近先观察旧防御构筑与新办公住宅之间的距离，建立港区南端方位。',
      },
      {
        title: '沿Kranhäuser比较悬挑',
        body: '由远及近观察三座建筑，不进入住宅或办公室，以滨河公共空间为主要观察面。',
      },
      {
        title: '在Siebengebirge寻找旧框架',
        body: '沿连续山墙和窗洞阅读仓库原始尺度，再辨认改造后住宅、商业入口与凉廊。',
      },
      {
        title: '经过港务与动力遗存',
        body: '查看Hafenamt、Krafthaus、港机和说明牌，把装卸、动力与管理功能放回同一工业系统。',
      },
      {
        title: '在北端衔接博物馆',
        body: '到旋转桥和Malakoffturm后观察巧克力博物馆如船首般伸入港区的外观，再结束街区段。',
      },
    ],
    practical: [
      '行程记录为“详细时间待补”，状态无需门票；由南向北仅是场内内容组织，不代表新增预约、交通或时长建议。',
      '滨河步道免费开放并由步行者、骑行者和跑者共同使用，观察和拍摄时须保持主要通道畅通。',
      'Kranhäuser、Siebengebirge和多数港务改造建筑主要为住宅或办公用途，除公开商业空间外不要假定可进入内部。',
      '港区可能出现活动、维护或泊位工程，现场围挡和管理告示优先于本静态节点列表。',
    ],
    sources: [
      {
        institution: 'RVG Rheinauhafen Verwaltungsgesellschaft',
        title: 'Rheinauhafen: Über uns und Historie',
        url: 'https://www.rheinauhafen-koeln.de/rheinauhafen',
        verifiedAt: '2026-09-02',
        note: '支持旧岛、港区年代、更新过程、用地规模、Kranhäuser及滨河步道事实。',
      },
      {
        institution: 'RVG Rheinauhafen Verwaltungsgesellschaft',
        title: 'Architektur und Gesamtkonzept',
        url: 'https://www.rheinauhafen-koeln.de/architektur',
        verifiedAt: '2026-09-02',
        note: '支持历史仓储与现代建筑并置、保护性修复和建筑节点总览。',
      },
      {
        institution: 'RVG Rheinauhafen Verwaltungsgesellschaft',
        title: 'Das Siebengebirge',
        url: 'https://www.rheinauhafen-koeln.de/architektur/das-siebengebirge',
        verifiedAt: '2026-09-02',
        note: '支持仓库长度、建造年代、结构和改造事实。',
      },
      {
        institution: 'RVG Rheinauhafen Verwaltungsgesellschaft',
        title: 'Kranhaus 1',
        url: 'https://www.rheinauhafen-koeln.de/architektur/kranhaus-1',
        verifiedAt: '2026-09-02',
        note: '支持建筑设计来源、倒L形吊车意象、钢桁架和办公用途。',
      },
    ],
  },
  'chocolate-museum': {
    overview:
      '科隆巧克力博物馆位于Rheinauhafen北端，以约四千平方米、四个楼层和九个展区把可可植物、全球贸易、五千年文化史与现代生产连接起来。参观从加纳独木舟和“可可世界之旅”进入种植、运输、消费与可持续议题，再经过热带温室、前哥伦布时期和欧洲宫廷文化，最终抵达玻璃巧克力工厂与喷泉。它不只是食品体验馆：新常设展也讨论殖民历史、供应链与小农生产，因此观察重点应兼顾气味、机械过程和经济文化背景。',
    orientation: [
      {
        title: '沿可可供应链前进',
        body: '展览从种植环境、收获和运输进入贸易与消费，再以玻璃工厂展示从烘焙可可豆到成品巧克力的现代流程。',
      },
      {
        title: '区分文化史与现场生产',
        body: '五千年可可历史展讨论仪式、货币、宫廷饮品、工业化与殖民背景；玻璃工厂则是会按营业时间停止的动态生产区。',
      },
      {
        title: '把热带温室视为植物证据',
        body: '十米高热带温室种植真实可可植物，帮助辨认果实生长位置和可可树所需环境，而不是仅作装饰布景。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '四层线性展览与生产体验空间',
      note: '展区顺序依据官方展览叙事压缩，具体互动装置、试吃和生产状态以当天现场为准。',
      stops: [
        '“Intowada”加纳独木舟与可可世界之旅入口',
        '种植、运输、贸易、消费与可持续展区',
        '十米高热带温室与可可植物',
        '五千年可可文化史和殖民/工业化章节',
        '玻璃巧克力工厂生产线',
        '三米高巧克力喷泉及出口区域',
      ],
    },
    highlights: [
      {
        title: '热带温室中的可可树',
        summary:
          '步入式温室以真实热带植物展示Theobroma cacao的生长环境，部分植株会结出可可果。',
        lookFor:
          '观察花和果实直接从树干或粗枝长出的方式、果荚颜色与温室湿热条件，并把植物形态与供应链开端联系起来。',
      },
      {
        title: '五千年可可时间线',
        summary:
          '常设展从厄瓜多尔起源及中美洲仪式讲到欧洲贵族饮品、工业化大众商品，并明确触及殖民时代。',
        lookFor:
          '比较器皿、包装、银器、机器和多媒体叙事，追踪可可如何在神圣物、货币、奢侈品与日常食品之间改变身份。',
      },
      {
        title: '玻璃工厂与巧克力喷泉',
        summary:
          '玻璃生产线通过机器和信息图展示从烘焙、研磨到成型的过程；三米高喷泉装有约二百公斤巧克力。',
        lookFor:
          '沿机器顺序观察原料粒度、液态黏度和成品形态变化，并注意现场生产与展示性喷泉是两种不同的观看机制。',
      },
    ],
    sequence: [
      {
        title: '由独木舟进入供应链',
        body: '从“Intowada”独木舟开始，先理解可可种植、运输、贸易和消费的全球关系。',
      },
      {
        title: '进入热带温室',
        body: '观察真实可可植物与果实，再回到展板确认主要产区和小农生产背景。',
      },
      {
        title: '沿文化史时间线前进',
        body: '从古代美洲、欧洲宫廷、殖民关系走到工业化，不跳过批判性章节只看甜食品展示。',
      },
      {
        title: '按工序观看玻璃工厂',
        body: '从原料储存、烘焙和加工一路追到成型，利用透明机器和步入式信息图核对每一步。',
      },
      {
        title: '在喷泉处收束',
        body: '观察喷泉结构和现场试吃规则，再从出口回看植物、贸易、文化与工业如何串成一条完整链条。',
      },
    ],
    practical: [
      '行程仍为“详细时间待补”，状态未订；本内容不因开放时间而替行程填入参观时段。',
      '2026-10-05为周一，官网列10:00–18:00开放；最后入场17:00，生产约17:30结束。官网注明11月部分周一闭馆，但不适用于该日期。',
      '官方称常规展览参观约需1–2小时。固定列车要求18:24前抵达车站，因此末段入场、生产观看与到站要求存在明确排程约束，仍须由行程层解决。',
      '可现场购票但官方建议在线选择时段以减少排队；当前“未订”状态不得在内容层改写为已预约。',
    ],
    sources: [
      {
        institution: 'Schokoladenmuseum Köln',
        title: 'Plan your visit',
        url: 'https://www.schokoladenmuseum.de/en/plan-a-visit/',
        verifiedAt: '2026-09-02',
        note: '支持2026年开放、最后入场、生产结束、参观时长、现场与在线票务信息。',
      },
      {
        institution: 'Schokoladenmuseum Köln',
        title: 'Our exhibition',
        url: 'https://www.schokoladenmuseum.de/en/the-museum/exhibition/',
        verifiedAt: '2026-09-02',
        note: '支持独木舟、可可世界之旅、温室、可持续性及五千年文化史叙事。',
      },
      {
        institution: 'Schokoladenmuseum Köln',
        title: 'The chocolate factory',
        url: 'https://www.schokoladenmuseum.de/en/the-museum/chocolate-factory/',
        verifiedAt: '2026-09-02',
        note: '支持玻璃工厂、原料仓储、步入式信息图及从可可豆到成品的生产流程。',
      },
      {
        institution: 'Schokoladenmuseum Köln',
        title: 'The museum',
        url: 'https://www.schokoladenmuseum.de/en/the-museum/',
        verifiedAt: '2026-09-02',
        note: '支持四层九展区、四千平方米、热带温室及三米高二百公斤巧克力喷泉。',
      },
    ],
  },
  'notre-dame-towers': {
    overview:
      '巴黎圣母院双塔在2019年火灾后完成修复，并于2025年9月20日以全新单向路线重新开放。参观不再只是登上旧有平台，而是从南塔进入，在建筑模型、原奇美拉、四叶厅和新建双向橡木楼梯之间逐步上升，穿过修复后的钟楼木构抵达69米高眺望台，再经过大钟、蓄水池庭院和北塔钟架下降。全程424级台阶把哥特塔楼、十九世纪Viollet-le-Duc修复、火灾后的新木构与巴黎全景集中在一次高强度垂直体验中。',
    orientation: [
      {
        title: '认清单向路线',
        body: '入口位于面对教堂时的右侧，访客由南塔上行至眺望台，之后经过钟区和屋顶空间，由北塔下降离场。',
      },
      {
        title: '区分两塔年代与尺度',
        body: '北塔约1240年完成，南塔约1250年完成，两者宽度并不完全相同；现参观最高点为69米。',
      },
      {
        title: '区分奇美拉与滴水兽',
        body: '塔楼栏杆上的54件奇美拉主要是十九世纪修复创造的幻想雕塑；滴水兽则具有把雨水排离墙体的实际功能。',
      },
    ],
    spatial: {
      type: 'site',
      title: '南塔上行、北塔下降的垂直单向回路',
      note: '节点依据2025年重新设计后的官方路线；现场可因安全、天气或维护临时缩短或关闭部分空间。',
      stops: [
        '面对教堂右侧入口与下层接待厅',
        '四叶厅的模型、声景和两件原奇美拉',
        '双向橡木楼梯与南塔钟楼木构',
        '奇美拉长廊及南塔69米眺望台',
        'Emmanuel与Marie大钟、蓄水池庭院和屋顶“森林”视角',
        '北塔钟架、声景楼梯及出口',
      ],
    },
    highlights: [
      {
        title: '火灾后移入室内的原奇美拉',
        period: '十九世纪；2023–2024年以复制品替换外部原件',
        location: '下层展示空间',
        summary:
          '两件受2019年火灾影响、无法继续留在栏杆上的原奇美拉与建筑模型共同展示塔楼的修复和雕塑结构。',
        lookFor:
          '观察单块石灰岩雕成的身体、与栏杆构件结合的位置及火焰和风化留下的表面差异。',
      },
      {
        title: '双向橡木楼梯与钟楼屋架',
        summary:
          '重新开放后的路线以贯穿钟楼高度的新橡木楼梯组织上升，让访客进入过去难以体验的木构体量。',
        lookFor:
          '比较新橡木构件、旧石砌塔壁和钟架之间的接缝，注意楼梯如何把上行与下行流线分开。',
      },
      {
        title: '南塔眺望台与大钟',
        summary:
          '69米高平台提供巴黎及重建尖塔的360度视野；南塔内部保存1686年以来参与重大宗教和国家事件的Emmanuel大钟。',
        lookFor:
          '在限定停留中先看近处尖塔、屋顶与使徒雕像，再转向塞纳河和城市；到钟区时比较钟体、木架和塔壁尺度。',
      },
    ],
    sequence: [
      {
        title: '凭电子时段票入场',
        body: '从面对教堂右侧进入，先完成安检并在下层空间了解单向路线和身体条件要求。',
      },
      {
        title: '阅读模型与原奇美拉',
        body: '在四叶厅利用模型建立塔楼、尖塔和屋顶关系，再近看火灾后保存于室内的原雕塑。',
      },
      {
        title: '沿橡木楼梯穿越钟楼',
        body: '按单向标识上行，观察木构与石塔接合；狭窄和低矮处保持连续移动。',
      },
      {
        title: '登临奇美拉长廊与眺望台',
        body: '先辨认奇美拉，再在南塔平台按近景尖塔、塞纳河、城市远景的顺序观察。',
      },
      {
        title: '经大钟和北塔下降',
        body: '通过大钟、蓄水池庭院和北塔钟架，沿带有声景的末段楼梯完成单向离场。',
      },
    ],
    practical: [
      '行程仍为“详细时间待补”，状态未订；2026-10-06适用10月至次年3月开放时段9:00–17:30，最后入场为闭馆前一小时，但不得据此自行填入行程时间。',
      '现场不售票，所有访客必须提前在线预约电子时段票；免费资格、Paris Museum Pass及未成年人同样需要时段票，未满18岁须由成人陪同。',
      '全程424级台阶且无电梯，部分通道仅45厘米宽并需弯腰；有心脏问题、眩晕倾向、孕期或幼龄访客须依据官方健康提示谨慎判断。',
      '路线无寄存柜、饮水点或厕所；背包最大40×40×20厘米，大件行李禁止。顶层停留限5分钟，恶劣天气可临时关闭并按官方规则处理电子票。',
    ],
    sources: [
      {
        institution: 'Centre des monuments nationaux',
        title: 'Practical information: Towers of Notre-Dame de Paris',
        url: 'https://www.tours-notre-dame-de-paris.fr/en/visit/practical-information',
        verifiedAt: '2026-09-02',
        note: '支持开放时段、强制电子票、424级台阶、通道尺度、行李、设施、天气关闭和顶层停留限制。',
      },
      {
        institution: 'Centre des monuments nationaux',
        title: 'The new Notre Dame de Paris Towers tour',
        url: 'https://www.tours-notre-dame-de-paris.fr/en/actualites/the-new-notre-dame-de-paris-towers-tour',
        verifiedAt: '2026-09-02',
        note: '支持模型、原奇美拉、双向橡木楼梯、南塔平台、大钟、庭院及北塔下降路线。',
      },
      {
        institution: 'Centre des monuments nationaux',
        title: 'The distinctive features of the Towers of Notre-Dame de Paris',
        url: 'https://www.tours-notre-dame-de-paris.fr/en/discover/the-distinctive-features-of-the-towers-of-notre-dame-de-paris',
        verifiedAt: '2026-09-02',
        note: '支持两塔年代、宽度差异、平台视野、尖塔及钟架事实。',
      },
      {
        institution: 'Centre des monuments nationaux',
        title: 'The bells of Notre-Dame de Paris',
        url: 'https://www.tours-notre-dame-de-paris.fr/en/decouvrir/the-bells-of-notre-dame-de-paris',
        verifiedAt: '2026-09-02',
        note: '支持Emmanuel大钟年代、位置和历史角色。',
      },
    ],
  },
  seine: {
    overview:
      '“塞纳河周边”在原行程中没有给出精确范围，因此本记录保持时间和边界不确定，只将现场内容保守限定在巴黎圣母院及西岱岛附近的中央河岸，不扩写成从Pont de Sully到Pont d’Iéna的完整世界遗产路线。这个局部仍能呈现塞纳河塑造巴黎的关键方式：岛屿把水流分成两支，高低两级石砌码头连接桥梁、书摊与城市立面，圣母院的扶壁和尖塔则从河面方向显现整体结构。2026年东端施工会改变可通行边界，导览必须服从现场绕行。',
    orientation: [
      {
        title: '区分世界遗产范围与本次局部',
        body: '“巴黎塞纳河岸”世界遗产从Pont de Sully延伸至Pont d’Iéna，并包括西岱岛和圣路易岛；本次只处理圣母院周边可确认节点。',
      },
      {
        title: '以岛屿理解城市结构',
        body: '西岱岛与圣路易岛、两岸码头和桥梁共同组织巴黎中央河段，河流既是历史交通线，也是观看建筑与城市规划的连续前景。',
      },
      {
        title: '先确认2026施工边界',
        body: '圣母院东端Square de l’Île-de-France自2026年8月24日起关闭，考古和改造工程自8月31日持续至2027年5至6月。',
      },
    ],
    spatial: {
      type: 'district',
      title: '岛屿、桥梁与高低码头构成的线性河流景观',
      note: '节点是圣母院周边的现场观察序列；关闭区域不作为可进入站点，也不补充跨城路线、时长或交通估算。',
      stops: [
        'Pont Saint-Louis与两岛之间的分流水面',
        '圣母院东侧施工边界外的后殿、扶壁与尖塔视角',
        'Pont de l’Archevêché桥面及上下游视线',
        'Quai de Montebello的高码头、树列与bouquinistes书摊',
        'Petit-Pont及左岸回望圣母院的城市界面',
      ],
    },
    highlights: [
      {
        title: '圣母院的河岸立面',
        summary:
          '从东侧和左岸观察时，后殿、飞扶壁、彩窗、屋顶与重建尖塔能在同一城市轮廓中被理解。',
        lookFor:
          '沿河移动时比较扶壁张开的角度、尖塔与双塔的前后关系，以及石构如何从岛岸上升。',
      },
      {
        title: '高低两级码头与桥孔',
        summary:
          '塞纳河中央段由水道、下层码头平台、垂直挡墙和上层城市街道共同构成，桥梁把这些不同高度连续连接。',
        lookFor:
          '辨认水线、石阶、挡墙、树列和桥拱的相对高度，观察城市如何同时处理航运、防洪、通行和观看。',
      },
      {
        title: 'Quai de Montebello书摊',
        summary:
          '巴黎市政府统计塞纳河岸约有一千个绿色书箱、三十余万册旧书或当代书籍，分布在约三公里的文化步行带上。',
        lookFor:
          '在开放书箱中比较旧书、版画、地图和明信片如何反复塑造巴黎形象，同时尊重摊主的独立营业空间。',
      },
    ],
    sequence: [
      {
        title: '在Pont Saint-Louis建立水系方位',
        body: '先观察两岛、两支水流和相邻河岸，不进入已关闭的东端广场。',
      },
      {
        title: '沿施工边界看圣母院后殿',
        body: '在官方允许的公共空间内辨认扶壁、屋顶和尖塔，现场围挡改变视线时不自行穿越。',
      },
      {
        title: '由Pont de l’Archevêché转向左岸',
        body: '在桥面比较上下游、岛岸和高低码头，再按现场绕行进入Quai de Montebello。',
      },
      {
        title: '沿书摊阅读城市图像',
        body: '选择开放摊位查看旧书、版画和地图，不把书摊视为固定开放的博物馆展柜。',
      },
      {
        title: '在Petit-Pont回望',
        body: '以左岸城市界面收束，回看圣母院、桥梁、岛屿和河面如何组成同一历史景观。',
      },
    ],
    practical: [
      '行程记录仍为“详细时间待补”，状态无需门票；“塞纳河周边”的完整范围、开始时间和持续时间均未解决，本记录不据官方世界遗产边界自动扩充行程。',
      'Square de l’Île-de-France自2026-08-24关闭，东端工程自8月31日持续至2027年5至6月；2026-10-06必须服从围挡和现场绕行。官方称Square Jean-XXIII相关工程计划自2028年开始。',
      '河岸公共空间免费，但书摊由独立经营者管理，不存在可保证的统一营业时间；关闭的书箱仍可作为河岸设施观察，不应被描述为正在营业。',
      '本内容只提供现场观察顺序，不添加连接线、步行时间、游船、跨城路线或离境前的排程调整。',
    ],
    sources: [
      {
        institution: 'UNESCO World Heritage Centre',
        title: 'Paris, Banks of the Seine',
        url: 'https://whc.unesco.org/en/list/600/',
        verifiedAt: '2026-09-02',
        note: '支持世界遗产范围、列入年份、岛屿、河岸城市结构及近八世纪建筑与规划价值。',
      },
      {
        institution: 'Ville de Paris',
        title: 'Promenez-vous parmi les arbres au cœur de Paris',
        url: 'https://www.paris.fr/pages/promenez-vous-parmi-les-arbres-au-coeur-de-paris-20627',
        verifiedAt: '2026-09-02',
        note: '支持Pont Saint-Louis、圣母院后方、Pont de l’Archevêché、Quai de Montebello及书摊之间的官方步行观察关系。',
      },
      {
        institution: 'Ville de Paris',
        title: 'Ventes sur l’espace public: bouquinistes',
        url: 'https://www.paris.fr/pages/ventes-sur-l-espace-public-3513',
        verifiedAt: '2026-09-02',
        note: '支持书箱、书籍、长度和独立经营许可信息。',
      },
      {
        institution: 'Ville de Paris',
        title: 'Notre-Dame de Paris: réaménagement des abords',
        url: 'https://www.paris.fr/pages/les-abords-de-notre-dame-vont-faire-peau-neuve-17332',
        verifiedAt: '2026-09-02',
        note: '支持2026东端广场关闭、考古工程日期、影响范围及后续Square Jean-XXIII工程计划。',
      },
    ],
  },
});
