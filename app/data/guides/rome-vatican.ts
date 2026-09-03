import { defineGuideContent } from './types';

export const romeVaticanGuideContent = defineGuideContent({
  'vatican-museums': {
    originalTitle: 'Musei Vaticani',
    hero: {
      src: '/vatican-guide/assets/images/9e2540b0f966111eca.webp',
      alt: '梵蒂冈城、圣彼得大教堂与博物馆建筑群鸟瞰',
    },
    overview:
      '梵蒂冈博物馆不是一座单体建筑，而是沿历代教宗宫殿、庭院和长廊不断扩展的复合体。现场最重要的空间判断是：入口在Viale Vaticano，古典馆围绕观景楼庭院展开，三大长廊位于二层，拉斐尔画室之后下行进入波吉亚寓所和西斯廷礼拜堂。分层地图按官方游客图重绘，保留庭院挑空与跨层楼梯关系。',
    orientation: [
      {
        title: '先分清三个标高',
        body: '官方游客图把车马馆和民族学馆列为地下层，入口、古典馆、绘画馆与西斯廷礼拜堂列为一层，伊特鲁里亚馆、三大长廊与拉斐尔画室列为二层。',
      },
      {
        title: '主线不是直线',
        body: '常规主线先在观景楼区上楼，经过烛台廊、挂毯廊和地图廊，再从拉斐尔画室一侧下行到西斯廷礼拜堂；地图上的跨层连接比建筑外观更重要。',
      },
      {
        title: '两次到访分开理解',
        body: '现有行程包含清晨Key Master Tour与另一次博物馆参观；本章只展示既定票务和空间，不合并、不改动任何日期或顺序。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '官方游客图重绘的三层博物馆拓扑',
      note: '所有楼层同时错位堆叠；松果庭院、方形花园和楼板挑空保持透空，节点切换会显示跨层楼梯。',
      stops: [
        '入口大厅与四门厅',
        '梵蒂冈绘画馆',
        '庇奥-克莱门蒂诺博物馆',
        '松果庭院',
        '格里高利伊特鲁里亚博物馆',
        '烛台廊',
        '挂毯廊',
        '地图廊',
        '拉斐尔画室',
        '波吉亚寓所',
        '西斯廷礼拜堂',
        '出口与莫莫双螺旋坡道',
      ],
    },
    highlights: [
      {
        title: '基督变容',
        originalTitle: 'La Trasfigurazione',
        creator: '拉斐尔及其工作室',
        period: '1516-1520',
        location: '绘画馆第8室',
        image: '/vatican-guide/assets/images/87a903cd3ef4e8f849.webp',
        imageAlt: '拉斐尔《基督变容》',
        summary:
          '拉斐尔晚年的巨幅祭坛画，把上方神圣显现与下方人群的混乱压缩在同一画面。',
        lookFor:
          '从上下两组人物之间的明暗断裂入手，再看斜向手势如何把视线引向基督。',
      },
      {
        title: '拉奥孔与他的儿子们',
        originalTitle: 'Laocoonte e i suoi figli',
        creator:
          '罗得岛雕塑家群，传统署名阿格桑德罗斯、波利多罗斯与阿塔诺多罗斯',
        period: '约公元前40-前30年',
        location: '庇奥-克莱门蒂诺博物馆八角庭院',
        image: '/vatican-guide/assets/images/d17104dfc05130fee8.webp',
        imageAlt: '《拉奥孔与他的儿子们》大理石群雕',
        summary:
          '群雕以蛇身、扭转躯干和递进表情把三个人物锁进同一场无法逃脱的悲剧。',
        lookFor:
          '比较父亲后弯的右臂、两个儿子的不同处境，以及蛇身形成的连续构图。',
      },
      {
        title: '观景楼躯干像',
        originalTitle: 'Torso del Belvedere',
        creator: '署名雅典的阿波罗尼奥斯',
        period: '公元前1世纪',
        location: '缪斯厅',
        image: '/vatican-guide/assets/images/2a88c00fb056997178.webp',
        imageAlt: '观景楼躯干像',
        summary: '残缺的男性躯干以极强的旋转张力影响了米开朗基罗的人体塑造。',
        lookFor:
          '不要补想缺失四肢，直接观察腹部、背部和骨盆如何形成相反方向的扭转。',
      },
      {
        title: '地图廊拱顶',
        originalTitle: 'Galleria delle Carte Geografiche',
        creator: '伊格纳齐奥·丹蒂与画师团队',
        period: '1580-1583',
        location: '地图廊',
        image: '/vatican-guide/assets/images/942ae98cc350e8c5ec.webp',
        imageAlt: '梵蒂冈博物馆地图廊',
        summary:
          '长约120米的走廊以40幅地域地图把16世纪意大利半岛转化成一条可行走的地理图册。',
        lookFor:
          '墙面两侧分别对应亚平宁山脉两边，行走时同时观察地图与金色拱顶。',
      },
      {
        title: '雅典学院',
        originalTitle: 'La Scuola di Atene',
        creator: '拉斐尔',
        period: '1509-1511',
        location: '拉斐尔画室签字厅',
        image: '/vatican-guide/assets/images/414f85f266b23488b8.webp',
        imageAlt: '拉斐尔《雅典学院》',
        summary:
          '古代哲学家被安置在理想化古典建筑中，中央柏拉图与亚里士多德构成思想和透视的双重轴心。',
        lookFor: '先找到中央两人，再沿台阶、拱券和地面透视线辨认周围人物群。',
      },
      {
        title: '创造亚当',
        originalTitle: 'Creazione di Adamo',
        creator: '米开朗基罗',
        period: '约1511年',
        location: '西斯廷礼拜堂天顶',
        image: '/vatican-guide/assets/images/e74b56fe93a51192d6.webp',
        imageAlt: '米开朗基罗《创造亚当》',
        summary: '两只几乎相触的手把宏大的创世叙事压缩成一个带电般的间隙。',
        lookFor:
          '先定位天顶中段，再比较亚当松弛的身体与上帝一侧高速前冲的群像。',
      },
      {
        title: '最后的审判',
        originalTitle: 'Giudizio Universale',
        creator: '米开朗基罗',
        period: '1536-1541',
        location: '西斯廷礼拜堂祭坛墙',
        image: '/vatican-guide/assets/images/60870758ced9f2717c.webp',
        imageAlt: '米开朗基罗《最后的审判》',
        summary:
          '数百个人体围绕中央基督形成旋转洪流，与较早完成的天顶画呈现截然不同的情绪。',
        lookFor:
          '从中央基督向外追踪上升与坠落的两股运动，再找圣巴多罗买手持人皮。',
      },
    ],
    sequence: [
      {
        title: '从Viale Vaticano入口进入',
        body: '安检和验票后确认四门厅位置；入口与圣彼得广场不是同一个门。',
      },
      {
        title: '按票务活动完成清晨段',
        body: 'Key Master Tour的集合、开门和早餐内容以票面及领队指示为准，不用普通参观顺序覆盖团体流程。',
      },
      {
        title: '自由参观先补绘画馆与古典馆',
        body: '绘画馆与庇奥-克莱门蒂诺位于一层不同翼，需留意回到主线的楼梯位置。',
      },
      {
        title: '上二层穿过三大长廊',
        body: '烛台廊、挂毯廊、地图廊依次展开，之后进入拉斐尔画室。',
      },
      {
        title: '下行进入西斯廷礼拜堂',
        body: '经波吉亚寓所抵达西斯廷礼拜堂；内部保持安静并遵守现场摄影规定。',
      },
      {
        title: '按出口线离场',
        body: '出口区留意莫莫双螺旋坡道；若现场封闭或改线，以工作人员指示为准。',
      },
    ],
    practical: [
      '两次到访的日期、集合时间与票种保持现有行程原样；本导览不重新安排时段。',
      '馆内跨层多、路径长，任何临时封闭都会改变可走路线；节点图用于认路，现场指示优先。',
      '西斯廷礼拜堂禁止喧哗，摄影和手机使用遵守当日现场规则。',
      '官方地图标出的无障碍电梯路线与常规楼梯路线不同，需要时直接向工作人员说明。',
    ],
    sources: [
      {
        institution: 'Musei Vaticani',
        title: 'Vatican Museums Map - Collections and Services',
        url: 'https://www.museivaticani.va/content/dam/museivaticani/pdf/visita_musei/servizi_visitatori/mappa_musei_vaticani.pdf',
        verifiedAt: '2026-09-03',
        note: '用于楼层、展区、庭院、入口出口和跨层连接的内部核验。',
      },
    ],
  },
  'st-peters-basilica': {
    originalTitle: 'Basilica Papale di San Pietro in Vaticano',
    hero: {
      src: '/vatican-guide/assets/images/7c8ef6daf2c79cae8b.webp',
      alt: '圣彼得大教堂穹顶内部',
    },
    overview:
      '圣彼得大教堂的现场体验实际跨越多个标高：地面的门廊、中殿、耳堂和后殿，地下的梵蒂冈墓穴，以及经电梯、屋顶平台、穹顶内环和窄梯到达的顶部观景台。分层地图依据圣彼得大教堂官方数字体验的正交平面重绘，默认拆开所有楼层，因此不会再被实心建筑外壳遮住。',
    orientation: [
      {
        title: '圣殿与穹顶是两段动线',
        body: '圣殿主层沿拉丁十字平面展开；穹顶入口、电梯和后续窄梯属于另一套垂直路线。',
      },
      {
        title: '地下墓穴位于主祭坛下方',
        body: '梵蒂冈墓穴不是与中殿并列的房间，而是位于圣殿地坪下；地图将其单独下沉显示。',
      },
      {
        title: '票面时间不等于随意到场',
        body: '既有预订含圣殿与电梯穹顶，具体集合、二维码和安检要求仍以最终票面为准。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '圣殿、地下墓穴与穹顶五层剖开图',
      note: '屋顶被省略，所有楼层始终同时可见；切换节点时会明确显示楼梯或电梯连接。',
      stops: [
        '正立面门廊与青铜门',
        '米开朗基罗《圣殇》礼拜堂',
        '中央中殿',
        '青铜华盖与穹顶交叉部',
        '圣彼得宝座与后殿',
        '梵蒂冈墓穴与圣彼得墓核心',
        '右耳堂及穹顶入口方向',
        '电梯终点与屋顶平台',
        '穹顶内环与马赛克近观',
        '灯笼顶部观景台',
      ],
    },
    highlights: [
      {
        title: '圣殇',
        originalTitle: 'Pieta',
        creator: '米开朗基罗',
        period: '1498-1499',
        location: '入门右侧第一礼拜堂',
        image: '/vatican-guide/assets/images/0adf582fd3b337d9b7.webp',
        imageAlt: '米开朗基罗《圣殇》',
        summary:
          '米开朗基罗以高度抛光的大理石把死亡、哀悼和理想人体压缩成稳定的三角构图。',
        lookFor: '从圣母宽大的衣褶看三角形底座，再看基督身体如何横向穿过构图。',
      },
      {
        title: '青铜华盖',
        originalTitle: 'Baldacchino di San Pietro',
        creator: '吉安·洛伦佐·贝尼尼',
        period: '1624-1633',
        location: '主祭坛与穹顶交叉部',
        image: '/vatican-guide/assets/images/8468f3720f411fd64b.webp',
        imageAlt: '贝尼尼青铜华盖',
        summary: '四根扭柱把巨大的穹顶尺度重新收拢到主祭坛和圣彼得墓上方。',
        lookFor: '比较柱身的螺旋运动与上方流苏、蜜蜂和枝叶细节。',
      },
      {
        title: '圣彼得宝座',
        originalTitle: 'Cathedra Petri',
        creator: '吉安·洛伦佐·贝尼尼',
        period: '1657-1666',
        location: '后殿',
        image: '/vatican-guide/assets/images/87b056610ddec2ee19.webp',
        imageAlt: '圣彼得宝座祭坛与金色光窗',
        summary:
          '青铜教父、云团和金色圣灵窗共同把后殿变成一场戏剧化的光学终点。',
        lookFor: '站在中轴看椅座、四位教父和椭圆光窗的垂直叠合。',
      },
      {
        title: '梵蒂冈墓穴与圣彼得墓',
        creator: '16-17世纪形成的地下礼拜与墓葬空间',
        period: '多时期',
        location: '主祭坛下方',
        image: '/vatican-guide/assets/images/a11b9555b83ba6826b.webp',
        imageAlt: '梵蒂冈地下墓穴空间',
        summary:
          '地下层围绕被传统认定为圣彼得墓的位置组织，并容纳多位教宗墓葬。',
        lookFor:
          '注意地下平面与上方主祭坛、青铜华盖的垂直对应，而不是只看单座墓碑。',
      },
      {
        title: '米开朗基罗穹顶',
        creator: '米开朗基罗设计，贾科莫·德拉·波尔塔与多梅尼科·丰塔纳完成',
        period: '1546年后设计，1590年完成主体',
        location: '交叉部上方',
        image: '/vatican-guide/assets/images/7c8ef6daf2c79cae8b.webp',
        imageAlt: '圣彼得大教堂穹顶',
        summary:
          '双层穹顶从巨型支柱升起，内环让人近距离看到从地面几乎无法辨认的马赛克尺度。',
        lookFor:
          '在内环比较人物马赛克与真实人体尺寸，再从顶部观察肋骨和灯笼的结构。',
      },
      {
        title: '灯笼观景台',
        creator: '圣彼得大教堂穹顶建造团队',
        period: '16世纪末',
        location: '穹顶顶部',
        image: '/vatican-guide/assets/images/2dc38eee47aef515d3.webp',
        imageAlt: '圣彼得大教堂穹顶顶部视野',
        summary:
          '顶部观景台提供圣彼得广场轴线、梵蒂冈城与罗马城市肌理的完整视角。',
        lookFor:
          '先对准广场方尖碑与协和大道中轴，再转向博物馆建筑群辨认两地入口距离。',
      },
    ],
    sequence: [
      {
        title: '按14:30票面时间集合并安检',
        body: '集合点、二维码和安检要求以最终凭证为准；不要把穹顶时间误当作普通圣殿自由入场。',
      },
      {
        title: '从门廊进入主层',
        body: '先看右侧《圣殇》，再沿中央中殿走向交叉部。',
      },
      {
        title: '在交叉部建立上下关系',
        body: '同一轴线上依次对应地下圣彼得墓、主祭坛、青铜华盖和上方穹顶。',
      },
      {
        title: '完成后殿与可开放区域',
        body: '礼仪或安保可能封闭耳堂与地下墓穴；只走当日允许路线。',
      },
      {
        title: '转入穹顶垂直动线',
        body: '电梯到屋顶平台后仍需步行与爬窄梯，内环、夹层和顶部不是同一个平台。',
      },
      {
        title: '顶部看完整城市轴线',
        body: '在观景台辨认广场、协和大道与梵蒂冈博物馆方向，再按单向楼梯下行。',
      },
    ],
    practical: [
      '穹顶电梯只替代前一段楼梯，电梯终点之后仍有数百级台阶，通道狭窄且局部倾斜。',
      '圣殿是宗教场所，礼仪和安保可能临时改变开放区域；不对未说明的关闭原因作推测。',
      '地下墓穴能否进入取决于当日开放；地图保留其结构，但不表示票种必然包含。',
      '本章不记录金额；人数、日期和时间完全沿用现有票务资料。',
    ],
    sources: [
      {
        institution: "St. Peter's Basilica",
        title: "Explore St. Peter's Basilica - official digital experience",
        url: 'https://virtual.basilicasanpietro.va/en/explore-the-basilica',
        verifiedAt: '2026-09-03',
        note: '用于圣殿、地下墓穴、穹顶与官方兴趣点的内部核验。',
      },
    ],
  },
  pantheon: {
    originalTitle: 'Pantheon',
    overview:
      '万神殿把古罗马神庙、帝国工程与仍在使用的天主教堂叠在同一座建筑里。阿格里帕约于公元前27至25年建立初代神庙，今天所见主体由哈德良时期约118至125年重建，609年又被祝圣为教堂。参观重点不是快速拍摄天窗，而是理解门廊、圆厅、穹顶和墓龛如何构成一条从城市进入宇宙秩序的轴线。',
    orientation: [
      {
        title: '先辨认两段年代',
        body: '门楣保留阿格里帕铭文，但门廊后的圆厅和穹顶主要属于哈德良时期重建，不应把铭文年代等同于整座现存建筑。',
      },
      {
        title: '用直径理解穹顶',
        body: '圆厅内部高度与直径都约43.3米；把视线从地面圆心抬向天窗，便能感受建筑师以完整球体组织空间的构想。',
      },
      {
        title: '记住它仍是教堂',
        body: '609年后的宗教功能延续至今，礼仪可能影响参观区域；若官网或现场未说明临时调整原因，应保持未知而不推测。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '门廊到圆厅的同轴空间',
      note: '以下为观察顺序，不替代实名票时段、礼仪管制或现场单向指示。',
      stops: [
        '广场正面与阿格里帕铭文',
        '花岗岩柱门廊与青铜门',
        '圆厅中心与穹顶天窗',
        '拉斐尔墓及侧龛',
        '主祭坛与离场方向',
      ],
    },
    highlights: [
      {
        title: '哈德良时期门廊',
        creator: '罗马帝国工程团队，具体作者未知',
        period: '约118-125年',
        location: '建筑正面',
        summary:
          '古典山墙、三列整根花岗岩柱与圆厅相接，门楣却沿用阿格里帕的建造铭文。',
        lookFor:
          '比较铭文所述的早期建造者与现存结构年代，并观察柱身颜色和材质差异。',
      },
      {
        title: '穹顶与天窗',
        creator: '罗马帝国工程团队，具体作者未知',
        period: '约118-125年',
        location: '圆厅上方',
        summary:
          '无钢筋混凝土穹顶以逐层减轻材料和五圈方格控制重量，中央约9米天窗是唯一直接自然光源。',
        lookFor: '观察方格向顶部缩小，以及光斑如何随时间越过墙面和地面。',
      },
      {
        title: '拉斐尔墓与岩石圣母',
        creator: '墓志由彼得罗·本博撰写；圣母像由洛伦采托创作',
        period: '1520年代',
        location: '圆厅侧龛',
        summary:
          '拉斐尔依遗愿安葬于万神殿，古典石棺上方设置由其委托的《岩石圣母》。',
        lookFor:
          '先读石棺与墓志，再看圣母像如何把文艺复兴纪念空间嵌入古代墙体。',
      },
    ],
    sequence: [
      {
        title: '按09:00实名票报到',
        body: '准备与票面一致的身份证件；单次入场，不改变既定09:00-10:00时段。',
      },
      {
        title: '在门廊建立年代线',
        body: '先看阿格里帕铭文和柱列，再穿过青铜门进入哈德良时期圆厅。',
      },
      {
        title: '从圆心读穹顶',
        body: '短暂停在中央，依次看地面、方格穹顶、天窗和排水孔，而非只拍摄顶部。',
      },
      {
        title: '沿侧龛收束',
        body: '顺现场方向看拉斐尔墓和王室墓葬，最后经过主祭坛离开。',
      },
    ],
    practical: [
      '行程中的实名、单次入场约束必须保留；官方不提供所谓跳过安检或跳过排队的特殊入口。',
      '自2026年7月1日起普通全票为7欧元；既有预订以实际票面为准，不据此改动09:00行程。',
      '这里仍是宗教场所，遮盖肩膝；馆内没有行李寄存处，临时礼仪限制的原因仅以官方或现场公告为准。',
    ],
    sources: [
      {
        institution: 'Direzione Musei Nazionali della Citta di Roma',
        title: 'Pantheon: visit information and monument overview',
        url: 'https://direzionemuseiroma.cultura.gov.it/en/pantheon/',
        verifiedAt: '2026-09-02',
        note: '支持开放、票务、无障碍、教堂规则及建筑概况；未来日期仍需出发前复核。',
      },
      {
        institution: 'Direzione Musei Nazionali della Citta di Roma',
        title: 'Pantheon historical background',
        url: 'https://direzionemuseiroma.cultura.gov.it/en/pantheon/historical-background/',
        verifiedAt: '2026-09-02',
        note: '支持阿格里帕初建、哈德良重建、609年祝圣和穹顶尺度等历史事实。',
      },
    ],
  },

  borghese: {
    originalTitle: 'Galleria Borghese',
    overview:
      '博尔盖塞美术馆不是按现代白盒展厅排列的百科全书，而是西皮奥内·博尔盖塞为收藏、权力展示和别墅生活共同营造的整体空间。底层雕塑与古物常借墙面、天花和彩色石材形成戏剧关系，上层则集中绘画。本次11:00至13:00的两小时窗口含11:10意大利语讲解，重点应放在作品与原房间的对应，而不是追求逐件看完。',
    orientation: [
      {
        title: '先分楼层',
        body: '底层重点是贝尼尼雕塑和古物，上层以拉斐尔、提香、卡拉瓦乔等绘画为主；两小时内应先守住底层核心。',
      },
      {
        title: '按房号定位',
        body: '《阿波罗与达芙妮》在3室、《劫夺普洛塞庇娜》在4室，卡拉瓦乔群在8室；房号比临时展陈印象更可靠。',
      },
      {
        title: '把别墅当作作品',
        body: '展厅壁画、门洞视线和雕塑摆位共同制造叙事，观看时应回退几步，确认作品如何控制整间房的动线。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '两层别墅的编号展室',
      note: '馆方可能因维护调整房间通行；未公布的调整原因保持未知。',
      stops: [
        '票务与寄存区',
        '3室阿波罗与达芙妮',
        '4室劫夺普洛塞庇娜',
        '8室卡拉瓦乔群',
        '上层绘画室',
        '出口',
      ],
    },
    highlights: [
      {
        title: '阿波罗与达芙妮',
        originalTitle: 'Apollo e Dafne',
        creator: '吉安·洛伦佐·贝尼尼',
        period: '1622-1625',
        location: '3室',
        summary:
          '贝尼尼把追逐故事冻结在达芙妮开始化为月桂树的瞬间，让坚硬大理石同时表现皮肤、树皮和叶片。',
        lookFor:
          '绕到侧面看手指变叶、脚趾扎根和树皮沿躯干上升，再回到正面看两人的视线错位。',
      },
      {
        title: '劫夺普洛塞庇娜',
        originalTitle: 'Ratto di Proserpina',
        creator: '吉安·洛伦佐·贝尼尼',
        period: '1621-1622',
        location: '4室',
        summary:
          '群像以旋转构图表现冥王掳走普洛塞庇娜的暴力和抵抗，雕塑要求观众移动观看。',
        lookFor:
          '重点看手指压入大腿的凹陷、泪痕和塞伯鲁斯三头如何稳定背面构图。',
      },
      {
        title: '卡拉瓦乔作品群',
        creator: '米开朗基罗·梅里西·达·卡拉瓦乔',
        period: '约1593-1610',
        location: '8室',
        summary:
          '六件作品把青年时期的感官观察与晚期幽暗自省并置，包括《捧果篮的男孩》《病中的酒神》和《大卫与歌利亚》。',
        lookFor:
          '比较水果腐败、强烈侧光与歌利亚头部的自画像意味，体会画家如何由明亮走向压抑。',
      },
    ],
    sequence: [
      {
        title: '提前完成票务和寄存',
        body: '按11:00入场安排提前到达，不把寄存时间挤进11:10意大利语讲解。',
      },
      {
        title: '守住底层三组核心',
        body: '跟随讲解依次确认3室、4室和8室；团队顺序变化时不逆行追赶。',
      },
      {
        title: '上层择要看绘画',
        body: '剩余时间按现场开放选择拉斐尔、提香等，不以看全为目标。',
      },
      {
        title: '13:00按时离馆',
        body: '两小时票制结束后直接衔接斗兽场交通，不修改后续14:15场次。',
      },
    ],
    practical: [
      '预约为强制要求，常规参观窗口为两小时；本次票面11:00、讲解11:10，两者都应原样保留。',
      '大包、雨伞等按现场要求寄存；临时关闭展室时只记录馆方给出的原因，未说明则标记未知。',
      '讲解为意大利语，导览内容与本地中文作品卡可并行，但不要脱队后逆向穿越拥挤展室。',
    ],
    sources: [
      {
        institution: 'Galleria Borghese',
        title: 'Official museum information',
        url: 'https://galleriaborghese.beniculturali.it/',
        verifiedAt: '2026-09-02',
        note: '支持强制预约、两小时参观制度和馆方运营信息。',
      },
      {
        institution: 'Galleria Borghese',
        title: 'Room 3: Apollo and Daphne',
        url: 'https://galleriaborghese.beniculturali.it/il-museo/la-villa/sala-3-sala-di-%E2%80%8Bapollo-e-dafne/',
        verifiedAt: '2026-09-02',
        note: '支持作品年代、作者和3室位置。',
      },
    ],
  },

  colosseum: {
    originalTitle: 'Colosseo',
    overview:
      '斗兽场是弗拉维王朝把公共娱乐、帝国秩序和大规模人流工程结合起来的圆形竞技建筑。本次 Full Experience 明确包含地下层与竞技场面，因此导览应从观众看不见的后勤系统切入，再回到表演空间和分等级看台。票面14:15开始、要求提前30分钟抵达；这项要求会压缩午间转场余量，却不能擅自移动既定预约。',
    orientation: [
      {
        title: '认清三位皇帝',
        body: '维斯帕先约70年代开工，提图斯于80年举行启用庆典，多米提安随后把地下设施扩建为砖石系统。',
      },
      {
        title: '区分地下层与竞技场',
        body: '地下层是人员、动物、布景和升降装置的后台；竞技场面是覆盖其上的表演平面，两者功能不可混为一谈。',
      },
      {
        title: '从座席读社会',
        body: '观众席按身份和性别分区，离竞技场的距离不仅是视野差异，也是罗马社会等级的建筑表达。',
      },
    ],
    spatial: {
      type: 'site',
      title: '同心椭圆与垂直后台',
      note: '地下层只能随指定产品和现场路线进入；下列停靠点服从导览员实际顺序。',
      stops: [
        '外立面与编号拱门',
        '实名票安检入口',
        '地下层走廊',
        '升降井与活门位置',
        '竞技场面',
        '观众席视角',
      ],
    },
    highlights: [
      {
        title: '弗拉维外立面',
        creator: '维斯帕先、提图斯时期帝国工程团队',
        period: '约70-80年',
        location: '建筑外围',
        summary:
          '连续拱券、叠层柱式和环形交通把庞大观众流分散到不同入口与座区。',
        lookFor:
          '观察由下向上的柱式变化、石块连接孔，以及外墙缺失处显露的内部环廊。',
      },
      {
        title: '地下层系统',
        creator: '多米提安时期帝国工程团队',
        period: '1世纪末起',
        location: '竞技场面下方',
        summary:
          '约半公顷地下区域由14条主要走廊、笼室、升降井和活门组成，把后台调度隐藏在观众脚下。',
        lookFor:
          '寻找井道、绞盘支点与通向竞技场面的开口，想象动物和布景如何垂直升起。',
      },
      {
        title: '观众席与视线',
        creator: '弗拉维王朝及后续修建团队',
        period: '1-3世纪',
        location: '竞技场四周',
        summary:
          'cavea以同心层级容纳不同身份观众，并通过放射状楼梯和环廊快速分流。',
        lookFor:
          '从竞技场回望座席坡度，辨认皇帝席、元老席与上层普通观众区的大致关系。',
      },
    ],
    sequence: [
      {
        title: '13:45前抵达指定入口',
        body: '执行票面提前30分钟要求，准备实名票和证件；不因前一站延误擅改14:15预约。',
      },
      {
        title: '随团下到地下层',
        body: '先理解走廊、笼室和升降井，再观察它们与上方竞技场开口的对应。',
      },
      {
        title: '登上竞技场面',
        body: '从表演者视角回看观众席和皇帝席，完成后台到前台的空间转换。',
      },
      {
        title: '15:45转古罗马广场',
        body: '按 Full Experience 允许的出口和入园规则衔接广场、帕拉蒂尼共用时段。',
      },
    ],
    practical: [
      'Full Experience为实名票，入场须出示与姓名一致的有效证件，并保留票面提前30分钟到达要求。',
      '该票通常含一次斗兽场定时入场及一次古罗马广场-帕拉蒂尼入场，连续两日有效；本行程仍按同日下午使用，不重排日期。',
      '地下层路线、升降设备展示和局部关闭可能临时变化；官方未解释原因时保持未知。',
    ],
    sources: [
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'Full Experience Underground and Arena',
        url: 'https://colosseo.it/en/tickets/full-experience-underground-arena/',
        verifiedAt: '2026-09-02',
        note: '支持实名票、地下层和竞技场内容、有效期与入场次数。',
      },
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'The underground levels of the Colosseum',
        url: 'https://colosseo.it/en/marvels/the-underground-levels-of-the-colosseum/',
        verifiedAt: '2026-09-02',
        note: '支持地下层形成、走廊、活门和升降系统事实。',
      },
    ],
  },

  'roman-forum': {
    originalTitle: 'Foro Romano',
    overview:
      '古罗马广场把沼泽低地转化为共和国和帝国的政治、宗教、司法与纪念中心，遗迹并非同一年代的完整城市模型。参观时应沿圣道读取建筑层次：从帝国凯旋纪念，经维斯塔宗教区，到元老院和西端拱门。本项与帕拉蒂尼在15:45至18:15共享同一段时间，内容必须主动取舍，不能假装两处都能从容看全。',
    orientation: [
      {
        title: '先把它看成低地',
        body: '这里原为两山之间的湿地，约公元前7世纪末经排水后成为公共中心，地形解释了道路和建筑反复抬高。',
      },
      {
        title: '沿圣道建立方向',
        body: '圣道从斗兽场侧向西北穿越核心区；以提图斯拱门、维斯塔区、元老院和塞维鲁拱门作为方向锚点。',
      },
      {
        title: '分清建筑年代',
        body: '共和国机构、奥古斯都时期整修和晚期帝国纪念物彼此叠压，断墙相邻不代表同时建成。',
      },
    ],
    spatial: {
      type: 'site',
      title: '圣道串联的谷地遗址',
      note: '路线按斗兽场侧进入、西北端收束设计；实际入口、出口和单向安排以当天标识为准。',
      stops: [
        '提图斯拱门与圣道',
        '维斯塔神庙',
        '维斯塔贞女之家',
        '元老院',
        '塞普蒂米乌斯·塞维鲁拱门',
      ],
    },
    highlights: [
      {
        title: '元老院',
        originalTitle: 'Curia Iulia',
        creator: '凯撒奠基、奥古斯都完成；戴克里先时期修复',
        period: '前52年至4世纪',
        location: '广场西北部',
        summary:
          '凯撒在旧元老院焚毁后重新定位议政建筑，奥古斯都于前29年完成，现貌包含晚期修复。',
        lookFor:
          '看朴素高墙、门窗比例和大理石地面，理解政治仪式需要的封闭声学空间。',
      },
      {
        title: '维斯塔神庙与贞女之家',
        creator: '历代重建；现存神庙形态多与朱莉娅·多姆娜时期相关',
        period: '现貌主要为2世纪末至3世纪初',
        location: '圣道东南侧',
        summary:
          '圆形神庙保存罗马圣火，邻接的庭院住宅供维斯塔贞女生活，宗教制度与日常空间紧密相连。',
        lookFor: '比较圆形神庙基座、长方庭院、雕像基座和居住单元残迹。',
      },
      {
        title: '塞普蒂米乌斯·塞维鲁凯旋门',
        creator: '塞普蒂米乌斯·塞维鲁时期官方工程',
        period: '203年',
        location: '广场西端',
        summary:
          '三拱门纪念皇帝及两子在帕提亚战争中的胜利，后来盖塔遭记忆抹除，铭文也随之修改。',
        lookFor: '观察战争浮雕、中央拱顶和铭文中被改刻的区域。',
      },
    ],
    sequence: [
      {
        title: '从提图斯拱门进入历史轴',
        body: '先在高处看清谷地和圣道方向，再下行，避免在碎片遗迹间失去整体感。',
      },
      {
        title: '集中看维斯塔宗教区',
        body: '用圆形神庙、庭院和雕像基座理解制度空间，不在每块残墙前平均分配时间。',
      },
      {
        title: '以元老院和西端拱门收束',
        body: '完成政治建筑与帝国纪念物的对照，再决定从园内坡道转帕拉蒂尼。',
      },
      {
        title: '与帕拉蒂尼共享截止时间',
        body: '15:45-18:15为两项共同窗口；若现场分流造成延误，不虚构关闭原因，也不擅改后续18:30行程。',
      },
    ],
    practical: [
      '包含在斗兽场 Full Experience 联票内；保留15:45-18:15与帕拉蒂尼重叠的原始安排，并明确这是紧凑取舍。',
      '2026年9月30日官方季节表列园区19:15关闭、18:15末入场；未来运营仍须当天复核。',
      '遗址大多露天、遮阴有限且路面不平；局部建筑是否开放以现场牌示为准，原因未说明即未知。',
    ],
    sources: [
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'The Roman Forum',
        url: 'https://colosseo.it/en/area/the-roman-forum/',
        verifiedAt: '2026-09-02',
        note: '支持广场形成、公共功能和主要遗迹概况。',
      },
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'Temple of Vesta and House of the Vestals',
        url: 'https://colosseo.it/en/marvels/temple-of-vesta-and-vestal-house-atrium-vestae/',
        verifiedAt: '2026-09-02',
        note: '支持维斯塔区年代、功能与空间事实。',
      },
    ],
  },

  palatine: {
    originalTitle: 'Palatino',
    overview:
      '帕拉蒂尼山把罗马建城记忆、共和国晚期贵族住宅与帝国宫殿压缩在同一片坡地上，也是英语 palace 等词的历史来源。这里不适合逐间追求室内开放，而应从山丘地形、住宅壁画、弗拉维宫殿和长形体育场理解权力如何占据城市高点。本项与古罗马广场共享15:45至18:15，且部分室内分点可能早于园区关闭。',
    orientation: [
      {
        title: '从建城到皇宫',
        body: '铁器时代聚落、前2至前1世纪贵族住宅和奥古斯都后的皇宫区在山上连续叠加。',
      },
      {
        title: '分清山顶与坡面',
        body: '奥古斯都和莉维娅住宅靠西南坡，弗拉维宫殿与体育场展开在较平坦的山顶东侧。',
      },
      {
        title: '室内开放不等于园区开放',
        body: '彩绘住宅等分点有独立末入和轮休，不能用大园区闭园时间推断室内一定可进。',
      },
    ],
    spatial: {
      type: 'site',
      title: '坡地住宅与山顶宫殿',
      note: '以可见外部遗迹为基础；室内停靠仅在当天开放并来得及入场时成立。',
      stops: [
        '古罗马广场上山坡道',
        '奥古斯都之家外部',
        '弗拉维宫殿',
        '多米提安体育场',
        '法尔内塞花园观景点',
      ],
    },
    highlights: [
      {
        title: '奥古斯都之家',
        originalTitle: 'Casa di Augusto',
        creator: '奥古斯都时期罗马工匠',
        period: '前1世纪',
        location: '帕拉蒂尼西南坡',
        summary:
          '规模克制的住宅与阿波罗神庙相邻，室内壁画以建筑幻景、面具和松枝等主题构成精细私人空间。',
        lookFor:
          '开放时重点看面具室和松枝装饰；若错过末入，只从外部理解住宅与坡面的关系。',
      },
      {
        title: '莉维娅之家',
        originalTitle: 'Casa di Livia',
        creator: '奥古斯都时期罗马工匠',
        period: '约前30年',
        location: '帕拉蒂尼西部',
        summary:
          '住宅保留第二风格壁画，以虚构柱廊、门洞和景深扩展真实房间尺度。',
        lookFor:
          '开放时观察绘画建筑与实际墙角的接合，辨认平面墙如何被制造成立体空间。',
      },
      {
        title: '帕拉蒂尼体育场',
        originalTitle: 'Stadio Palatino',
        creator: '多米提安时期帝国工程团队',
        period: '1世纪末',
        location: '皇宫东南部',
        summary:
          '约161乘48米的长形空间可能主要是宫廷花园和展示场，而非普通公共竞赛场。',
        lookFor:
          '看弧形端部、中央分隔遗迹和宫殿包围关系，不要仅凭名称想象现代体育场。',
      },
    ],
    sequence: [
      {
        title: '先查分点开放牌',
        body: '从广场上山后立即确认奥古斯都之家、莉维娅之家末入；不把未开放原因自行归为修复或活动。',
      },
      {
        title: '以外部宫殿为主线',
        body: '若室内已停止入场，就直接穿过弗拉维宫殿，保住山顶空间和体育场。',
      },
      {
        title: '在体育场完成尺度观察',
        body: '沿长边行走后从弧形端回看，理解其与宫廷生活而非公共竞技的联系。',
      },
      {
        title: '按18:15窗口离园',
        body: '与古罗马广场共同控制时间，衔接18:30威尼斯广场，不改动既定日程。',
      },
    ],
    practical: [
      '当前官方分点信息显示奥古斯都之家末次入场约15:00，因此本行程15:45后不应承诺室内参观。',
      '古罗马广场与帕拉蒂尼共用15:45-18:15，两处都完整细看不可行；导览以外部遗址和三个核心点为最低完成线。',
      '坡道、碎石和台阶较多，遮阴有限；分点临时关闭若无官方解释，原因标记未知。',
    ],
    sources: [
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'The Palatine',
        url: 'https://colosseo.it/en/area/the-palatine/?from=lts',
        verifiedAt: '2026-09-02',
        note: '支持山丘聚落、贵族住宅与帝国宫殿的发展脉络。',
      },
      {
        institution: 'Parco archeologico del Colosseo',
        title: 'The House of Augustus',
        url: 'https://colosseo.it/en/marvels/the-house-of-augustus/',
        verifiedAt: '2026-09-02',
        note: '支持住宅年代、壁画和独立参观时段；未来日期须复核。',
      },
    ],
  },

  'piazza-venezia': {
    originalTitle: 'Piazza Venezia',
    overview:
      '威尼斯广场是古罗马遗址、卡比托利欧山、科尔索大道与现代国家纪念建筑相撞的城市节点，而不是一个安静、边界清楚的传统广场。今天的尺度主要来自19至20世纪围绕维托里亚诺进行的拆建。本次只有18:30至18:50二十分钟，应以纪念碑轴线、骑马像和两座宫殿立面建立方向，不加入任何室内项目。',
    orientation: [
      {
        title: '先找维托里亚诺',
        body: '东南侧巨大的白色纪念建筑是最稳定的方向锚点；它面向广场，同时背靠卡比托利欧。',
      },
      {
        title: '名字来自威尼斯宫',
        body: '广场并非因威尼斯共和国城市景观得名，而是来自广场西侧的威尼斯宫。',
      },
      {
        title: '理解现代改造',
        body: '现有开阔空间和协和式道路视轴多由19至20世纪改造形成，不能当作自古不变的城市格局。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '高流量广场的四个立面锚点',
      note: '仅在合法人行区和安全过街点观察；施工围栏可能改变站位。',
      stops: [
        '威尼斯宫侧安全观察点',
        '维托里亚诺正面',
        '维托里奥·埃马努埃莱二世骑马像',
        '波拿巴宫绿色阳台',
      ],
    },
    highlights: [
      {
        title: '维托里亚诺',
        originalTitle: 'Vittoriano',
        creator: '朱塞佩·萨科尼',
        period: '1885年起建，1911年揭幕',
        location: '广场东南侧',
        summary:
          '统一意大利的国家纪念建筑以Botticino石材、宽阔台阶和柱廊塑造现代国家仪式背景。',
        lookFor:
          '比较白色石材与周边旧城色调，并看台阶、骑马像和柱廊如何构成纵深中轴。',
      },
      {
        title: '维托里奥·埃马努埃莱二世骑马像',
        creator: '恩里科·基亚拉迪亚设计，埃米利奥·加洛里完成',
        period: '约1889-1910',
        location: '维托里亚诺中央平台',
        summary: '巨型青铜像以首位统一意大利国王为国家纪念建筑的视觉中心。',
        lookFor:
          '从广场中心看骑马像如何压在长台阶与高柱廊之间，形成明确比例层级。',
      },
      {
        title: '波拿巴宫绿色阳台',
        originalTitle: 'Palazzo Bonaparte',
        creator: '乔瓦尼·安东尼奥·德·罗西',
        period: '1657-1677',
        location: '广场西侧',
        summary: '莱蒂齐亚·波拿巴晚年居住于此，并从封闭绿色阳台观察广场生活。',
        lookFor:
          '在宏大的维托里亚诺之外寻找尺度很小的绿色阳台，比较私人观看与国家展示。',
      },
    ],
    sequence: [
      {
        title: '在安全人行点停下',
        body: '不要边过街边拍摄，先确认围栏、车流和可站立区域。',
      },
      {
        title: '用维托里亚诺建立主轴',
        body: '由下至上看台阶、骑马像和柱廊，再回看广场道路汇合。',
      },
      {
        title: '转向两座宫殿',
        body: '辨认威尼斯宫立面和波拿巴宫绿色阳台，补足广场改造前的尺度。',
      },
      {
        title: '18:50按原计划离开',
        body: '不加入纪念馆、露台或电梯，按既定路线前往19:10特雷维喷泉。',
      },
    ],
    practical: [
      '本项仅20分钟且状态为无需门票，只规划外观；维托里亚诺内部或露台开放不纳入此时段。',
      '广场车流和步行围栏可能因工程改变；当天按标识通行，官网未说明的施工或封闭原因保持未知。',
      '从古罗马广场出口到此约1.2公里，原行程预留15分钟步行，不在内容层擅自调整。',
    ],
    sources: [
      {
        institution: 'VIVE - Vittoriano e Palazzo Venezia',
        title: 'Giuseppe Sacconi and the construction of the Vittoriano',
        url: 'https://vive.cultura.gov.it/en/vittoriano/history/giuseppe-sacconi-and-construction-vittoriano-1885-1905',
        verifiedAt: '2026-09-02',
        note: '支持萨科尼方案、建造年代、材料与国家纪念功能。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Palazzo Bonaparte',
        url: 'https://www.turismoroma.it/en/places/palazzo-bonaparte',
        verifiedAt: '2026-09-02',
        note: '支持宫殿建筑年代、作者和莱蒂齐亚·波拿巴阳台事实。',
      },
    ],
  },

  trevi: {
    originalTitle: 'Fontana di Trevi',
    overview:
      '特雷维喷泉是古代处女水道的城市终点，也是尼古拉·萨尔维把宫殿立面、岩石、神话雕塑和真实水流结合成的18世纪公共剧场。观看重点应从整面凯旋门式构图进入，再辨认海神、两匹性格相反的马、输水道浮雕和寓意像。行程仍为19:10至19:40，但“无需门票”只适用于外围，2026年内圈票制必须明确提示。',
    orientation: [
      {
        title: '这是输水道终点',
        body: '喷泉承接公元前19年建成的处女水道，水的来源和城市基础设施比投币传说更重要。',
      },
      {
        title: '立面属于波利宫',
        body: '喷泉并非独立雕塑，建筑幕墙紧贴波利宫，以中央凯旋门式大龛统合神话和水景。',
      },
      {
        title: '区分外围与内圈',
        body: '外围广场可免费观看；靠近水池的管理内圈自2026年2月2日起对非居民收费，两者运营规则不同。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '下沉水池前的单向观赏区',
      note: '内圈入口为Via della Stamperia、出口为Via dei Crociferi；外围可不进入收费区。',
      stops: [
        'Via della Stamperia入口',
        '上层整体视角',
        '中央海神与双马',
        '两侧浮雕和寓意像',
        'Via dei Crociferi出口',
      ],
    },
    highlights: [
      {
        title: '喷泉建筑与岩景',
        creator: '尼古拉·萨尔维设计，朱塞佩·潘尼尼完成',
        period: '1732-1762',
        location: '波利宫立面与水池',
        summary:
          '凯旋门式建筑从规则柱列过渡到不规则岩石，再由多层水流落入下沉水池。',
        lookFor:
          '从较远处看中央大龛、侧翼柱列和岩石如何形成由建筑到自然的连续变化。',
      },
      {
        title: '俄刻阿诺斯与双马',
        creator: '彼得罗·布拉奇等',
        period: '18世纪中叶',
        location: '中央大龛前',
        summary:
          '海神驾贝壳战车，由一匹躁动和一匹温顺的马牵引，表现水既狂暴又滋养的双重性。',
        lookFor: '比较两匹马的头颈、步态和两位海 Triton 的控制动作。',
      },
      {
        title: '处女水道叙事浮雕',
        creator: '多位18世纪雕塑家',
        period: '约1762年完成',
        location: '中央龛上方两侧及侧龛',
        summary:
          '浮雕分别表现阿格里帕批准水道和少女指示泉源，侧龛寓意像象征丰饶与健康。',
        lookFor: '按左侧阿格里帕、右侧少女的顺序阅读，再向下对应真实流动的水。',
      },
    ],
    sequence: [
      {
        title: '先决定是否进入内圈',
        body: '若只从外围观看无需购票；若进入靠近水池区域，按2026票制购买2欧元票。',
      },
      {
        title: '从远到近看构图',
        body: '先保留完整立面，再接近中央海神和双马，避免一进场只拍局部。',
      },
      {
        title: '横向阅读水道故事',
        body: '利用两侧浮雕和寓意像补足处女水道背景。',
      },
      {
        title: '按指定出口离开',
        body: '19:40结束后维持原计划前往20:00西班牙台阶，不更改时间。',
      },
    ],
    practical: [
      '`trip.ts`所写“无需门票”仅对外围成立：自2026年2月2日起，游客和非居民进入水池内圈须付2欧元。',
      '2026年9月30日为周三；现行周三内圈09:00-22:00、最后进入21:00，19:10时段可行但仍须临行复核。',
      '入口Via della Stamperia、出口Via dei Crociferi；内圈无厕所和寄存处，禁止坐下、饮食、吸烟或进入水中。',
      '官网称时间可能因维护或公共秩序调整；若具体公告未说明原因，不进一步推断。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Fontana di Trevi',
        title: 'Official Trevi Fountain visitor information',
        url: 'https://fontanaditrevi.roma.it/en',
        verifiedAt: '2026-09-02',
        note: '支持2026票制、开放时间、入口出口、豁免和现场规则。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'The Trevi Fountain',
        url: 'https://www.turismoroma.it/en/places/trevi-fountain',
        verifiedAt: '2026-09-02',
        note: '支持处女水道、萨尔维方案、潘尼尼完成和雕塑叙事。',
      },
    ],
  },

  'spanish-steps': {
    originalTitle: 'Scalinata di Trinita dei Monti',
    overview:
      '西班牙台阶不是一段笔直楼梯，而是弗朗切斯科·德·桑克蒂斯以分叉、汇合和平台反复调节坡度的18世纪城市舞台。它把下方西班牙广场与上方品奇奥、法国宗教机构和天主圣三堂连接起来。20:00至20:30的夜间停留应从破船喷泉开始，边上行边回望城市轴线，同时把台阶视为持续使用的公共通道。',
    orientation: [
      {
        title: '由下向上读三层',
        body: '下端是破船喷泉，中段是11段反复分合的台阶，上端由天主圣三堂双塔和方尖碑封住视线。',
      },
      {
        title: '连接两种城市势力',
        body: '台阶把下方西班牙使馆相关区域与上方法国教堂连接，空间本身带有外交与宗教背景。',
      },
      {
        title: '它首先是通道',
        body: '虽然具有舞台感，台阶仍承担高差通行；活动、养护或安保限制应服从现场指示，未说明原因则未知。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '喷泉、分叉台阶与山顶轴线',
      note: '建议沿一侧上行、在平台回望，避免停在主通行线中央。',
      stops: [
        '破船喷泉',
        '下段中轴',
        '中央汇合平台',
        '上段栏杆',
        '天主圣三堂与方尖碑',
      ],
    },
    highlights: [
      {
        title: '西班牙台阶',
        creator: '弗朗切斯科·德·桑克蒂斯',
        period: '1723-1726',
        location: '西班牙广场至Trinita dei Monti',
        summary:
          '11段、每段12级的石灰华阶梯以曲线分开又汇合，把陡坡变成连续的城市平台。',
        lookFor: '在中央平台回看扶栏曲线和路线分合，感受行走方向如何不断改变。',
      },
      {
        title: '破船喷泉',
        originalTitle: 'Fontana della Barcaccia',
        creator: '彼得罗·贝尼尼；吉安·洛伦佐参与可能性未排除',
        period: '1626-1629',
        location: '台阶下端',
        summary:
          '处女水道压力不足，设计者把船形水盆降到街面以下，以低矮溢流替代高喷泉。',
        lookFor:
          '观察下沉船体、船首船尾太阳与巴贝里尼蜜蜂，理解技术限制如何产生造型。',
      },
      {
        title: '天主圣三堂立面',
        originalTitle: 'Trinita dei Monti',
        creator: '贾科莫·德拉·波尔塔与卡洛·马德尔诺',
        period: '1570年完成',
        location: '台阶顶端',
        summary:
          '双塔立面在山顶终止阶梯轴线，前方18世纪末竖立的方尖碑进一步加强垂直感。',
        lookFor: '从中段同时框住双塔与方尖碑，再到顶端回看罗马街道的下降轴线。',
      },
    ],
    sequence: [
      {
        title: '从破船喷泉建立低点',
        body: '先绕喷泉半周看下沉船体，再退到台阶中轴确认完整高差。',
      },
      {
        title: '沿侧边缓慢上行',
        body: '经过分叉和平台时回望一次，不在主通道长时间停留。',
      },
      {
        title: '在顶端对齐教堂',
        body: '观察双塔、方尖碑和台阶中线，再看夜间城市视野。',
      },
      {
        title: '20:30按原安排离开',
        body: '维持前往21:00纳沃纳广场的既定步行窗口。',
      },
    ],
    practical: [
      '公共空间无需门票，但不应把台阶当作固定休息席；按现场警察、围栏和通行规则使用。',
      '20:00夜间上下台阶需留意石面高差和拥挤；活动或维护造成的限制只有官方说明后才记录原因。',
      '从特雷维喷泉约0.7公里、原计划步行约10分钟，此内容不改变既定转场。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'The Spanish Steps',
        url: 'https://www.turismoroma.it/en/places/spanish-steps',
        verifiedAt: '2026-09-02',
        note: '支持台阶作者、年代、11段结构和城市连接功能。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'The Barcaccia Fountain',
        url: 'https://www.turismoroma.it/en/places/barcaccia-fountain',
        verifiedAt: '2026-09-02',
        note: '支持喷泉作者、年代、低水压与船形设计。',
      },
    ],
  },

  'piazza-navona': {
    originalTitle: 'Piazza Navona',
    overview:
      '纳沃纳广场的长椭圆并非巴洛克设计师凭空创造，而是沿用公元86年前后多米提安竞技场的跑道轮廓，古代看台遗迹仍埋在今天地面下约五至六米。17世纪教宗城市工程又在长轴上配置三座喷泉和圣依搦斯堂。21:00至21:45应以夜间外观为边界，从北向南读取竞技场形状、四河喷泉和教堂立面。',
    orientation: [
      {
        title: '先看竞技场轮廓',
        body: '广场长边和弧形北端基本继承多米提安竞技场，今天建筑围边大致压在古看台之上。',
      },
      {
        title: '以中央组团定位',
        body: '四河喷泉、方尖碑和圣依搦斯堂构成最强横向轴，站在喷泉东侧可同时比较雕塑与凹面教堂立面。',
      },
      {
        title: '三座喷泉排成长轴',
        body: '北端海神、中央四河、南端摩尔三座喷泉帮助辨认方向，也显示广场由通行空间转为仪式舞台。',
      },
    ],
    spatial: {
      type: 'district',
      title: '古竞技场轮廓上的巴洛克长轴',
      note: '21:00后只保证公共广场和外观；地下遗址、教堂或宫殿室内须另查开放。',
      stops: [
        '北端海神喷泉',
        '四河喷泉与方尖碑',
        '圣依搦斯堂正面',
        '南端摩尔喷泉',
        '南端回望长轴',
      ],
    },
    highlights: [
      {
        title: '多米提安竞技场轮廓',
        originalTitle: 'Stadio di Domiziano',
        creator: '多米提安时期帝国工程团队',
        period: '约86年',
        location: '现广场地下及周边建筑基底',
        summary:
          '古代田径竞技场的狭长跑道和弧形端部决定了今天广场平面，遗迹位于现地面下约五至六米。',
        lookFor: '从长轴一端回望另一端，利用弧形北端想象古看台包围的比赛空间。',
      },
      {
        title: '四河喷泉',
        originalTitle: 'Fontana dei Quattro Fiumi',
        creator: '吉安·洛伦佐·贝尼尼及工作室',
        period: '1648-1651',
        location: '广场中央',
        summary:
          '多瑙河、恒河、尼罗河与拉普拉塔河化为四名巨人，围绕洞穿的岩座托起古方尖碑。',
        lookFor:
          '绕行一周辨认动物、植物和河流属性，并观察岩座开洞如何制造方尖碑仿佛悬起的效果。',
      },
      {
        title: '圣依搦斯堂立面',
        originalTitle: "Sant'Agnese in Agone",
        creator: '吉罗拉莫与卡洛·赖纳尔迪、弗朗切斯科·博罗米尼等',
        period: '1652年起',
        location: '广场西侧中央',
        summary: '凹面立面、中央穹顶和双塔与四河喷泉形成巴洛克城市对景。',
        lookFor:
          '站在喷泉东侧，看凹面立面如何拥抱方尖碑，并比较喷泉雕塑和建筑曲线。',
      },
    ],
    sequence: [
      {
        title: '从北端确认弧线',
        body: '由海神喷泉附近进入，先利用建筑围边读取古竞技场轮廓。',
      },
      {
        title: '绕四河喷泉一周',
        body: '依次辨认四条河流、动物和植物，再退后把方尖碑与教堂纳入同一画面。',
      },
      {
        title: '在圣依搦斯堂前横向观察',
        body: '比较凹面立面和喷泉岩座，不假定21:00后能够进入教堂。',
      },
      {
        title: '到南端回看',
        body: '在摩尔喷泉附近回看完整长轴，21:45按原日程结束。',
      },
    ],
    practical: [
      '广场公共空间免费；21:00时段仅规划外观，不承诺多米提安竞技场地下遗址或教堂室内开放。',
      '四河喷泉官方修复工程已在行程前完成；若未来又出现围挡，原因以新公告为准，未知时不推测。',
      '从西班牙台阶约1.5公里、原计划步行约20分钟；夜间人流可能影响速度，但不自动改写时间表。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Piazza Navona',
        url: 'https://turismoroma.it/en/places/navona-square',
        verifiedAt: '2026-09-02',
        note: '支持多米提安竞技场年代、地下深度、广场形状和主要建筑。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Fountain of the Four Rivers',
        url: 'https://www.turismoroma.it/en/places/fountain-four-rivers',
        verifiedAt: '2026-09-02',
        note: '支持贝尼尼、建造年代、四河人物与图像内容。',
      },
    ],
  },

  'st-peters-square': {
    originalTitle: 'Piazza San Pietro',
    overview:
      '圣彼得广场是贝尼尼为亚历山大七世设计的宗教集会空间：横向椭圆柱廊像双臂包围人群，靠近大教堂的一段梯形前庭又校正立面透视。中央方尖碑早于广场与现圣殿，双喷泉则平衡两侧空间。本次13:30至14:20无需门票，但终点必须自然衔接右侧安检区，为14:30本地嵌入的大教堂导览服务。',
    orientation: [
      {
        title: '椭圆加梯形',
        body: '广场不是单一椭圆：远端柱廊包围椭圆，靠近立面的梯形前庭通过轻微收束修正观看距离。',
      },
      {
        title: '方尖碑是年代锚点',
        body: '方尖碑于公元37年运到罗马、1586年移至现址，比1656年开建的柱廊更早。',
      },
      {
        title: '右侧通向安检',
        body: '面对大教堂时，常规访客安检位于右侧柱廊方向；活动围栏可能改变实际入口，须以当天指示为准。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '方尖碑、焦点石与双臂柱廊',
      note: '广场路线以14:30大教堂预约为终点约束，但本文件不重复内嵌的大教堂内容。',
      stops: [
        '协和大道中轴',
        '中央方尖碑',
        '柱廊焦点石',
        '马德尔诺与贝尼尼喷泉',
        '右侧安检方向',
      ],
    },
    highlights: [
      {
        title: '贝尼尼柱廊',
        originalTitle: 'Colonnato di Piazza San Pietro',
        creator: '吉安·洛伦佐·贝尼尼',
        period: '1656-1667',
        location: '广场两翼',
        summary:
          '四排284根托斯卡纳柱形成横向椭圆，顶部140尊圣人像把建筑轮廓变成连续仪式边界。',
        lookFor:
          '站到地面焦点标记上，让四排柱视觉重合为一排，再侧移一步观察柱列重新展开。',
      },
      {
        title: '梵蒂冈方尖碑',
        originalTitle: 'Obelisco Vaticano',
        creator: '古埃及采石者；多梅尼科·丰塔纳主持移位',
        period: '古代采石，37年运抵罗马，1586年移位',
        location: '广场中央',
        summary:
          '素面红色花岗岩方尖碑曾立于尼禄竞技场，后来成为广场几何和仪式中心。',
        lookFor: '观察素面碑身、基座铭文和顶部十字，并用它对齐大教堂中轴。',
      },
      {
        title: '双喷泉',
        creator: '卡洛·马德尔诺与吉安·洛伦佐·贝尼尼',
        period: '1614年与1677年',
        location: '方尖碑南北两侧',
        summary:
          '马德尔诺喷泉先存在，贝尼尼后来以相似体量补建另一座，使椭圆广场获得平衡。',
        lookFor: '比较两座喷泉的水幕、石盆和它们与方尖碑构成的三点关系。',
      },
    ],
    sequence: [
      {
        title: '从协和大道读完整正面',
        body: '在进入椭圆前确认柱廊、方尖碑和大教堂立面的总关系。',
      },
      {
        title: '绕方尖碑到焦点石',
        body: '先读方尖碑年代，再体验四排柱视觉重合。',
      },
      {
        title: '比较双喷泉',
        body: '横向移动观察两座喷泉如何平衡广场，而非只停在中轴。',
      },
      {
        title: '提前转向右侧安检',
        body: '保留14:30大教堂最终二维码时间，不因广场免费开放而低估安检。',
      },
    ],
    practical: [
      '广场本身无需门票，但大教堂和穹顶使用本地嵌入导览及最终二维码；本内容不复制那两份完整指南。',
      '教宗接见、礼仪或安保可能改变围栏和通路；只有官方说明时才记录具体原因，否则标记未知。',
      '从梵蒂冈博物馆出口约1.3公里、原计划步行约18分钟；13:30-14:20时段保持不变。',
    ],
    sources: [
      {
        institution: 'Fabbrica di San Pietro',
        title: "St Peter's Square",
        url: 'https://www.basilicasanpietro.va/en/san-pietro/the-square',
        verifiedAt: '2026-09-02',
        note: '支持贝尼尼设计、广场尺度、柱数、雕像和方尖碑事实。',
      },
      {
        institution: 'Fabbrica di San Pietro',
        title: 'What does the colonnade represent?',
        url: 'https://www.basilicasanpietro.va/en/faq/what-does-the-colonnade-in-st-peters-square-represent',
        verifiedAt: '2026-09-02',
        note: '支持柱廊象征含义和空间构想。',
      },
    ],
  },

  'vatican-post': {
    originalTitle: 'Poste Vaticane',
    overview:
      '梵蒂冈邮局把国家尺度压缩到一张邮票、一枚地名邮戳和一封真正进入国际邮路的明信片。本次17:00至17:30最适合使用圣彼得广场左半圆柱廊附近的新邮政办事点：先确认网点，再购买正确邮资、填写地址并盖戳寄出。它是服务设施而非传统博物馆，因此亮点应集中在2024年模块化建筑、当期邮票和邮戳流程。',
    orientation: [
      {
        title: '分清两个网点',
        body: '圣彼得广场办事点常规周一至周六08:30-18:30；钟门Arco delle Campane办事点常规至19:15。',
      },
      {
        title: '认准左半圆新建筑',
        body: '2024年12月启用的新办事点位于广场左侧半圆柱廊附近，为圆形、木质、可拆装的模块化结构。',
      },
      {
        title: '邮资属于梵蒂冈系统',
        body: '寄件应购买适用于目的地和当前资费的梵蒂冈邮票，并使用梵蒂冈邮政柜台或投递设施。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '小型邮政服务点的四步动线',
      note: '具体排队线和柜台功能可能调整；现场未说明原因时不推断。',
      stops: [
        '左半圆柱廊外部识别点',
        '邮票与集邮柜台',
        '地址填写位置',
        '盖戳柜台或投递口',
      ],
    },
    highlights: [
      {
        title: '模块化木构邮局',
        creator: '梵蒂冈城国与意大利邮政合作项目',
        period: '2024年启用',
        location: '圣彼得广场左半圆柱廊',
        summary:
          '圆形木构办事点以可拆装模块回应受保护广场环境，并改善无障碍服务。',
        lookFor: '从外部辨认圆形平面、木质构件和建筑如何避让历史柱廊。',
      },
      {
        title: '梵蒂冈当期邮票',
        creator: '设计者依具体发行批次而定',
        period: '当期发行',
        location: '邮票与集邮柜台',
        summary:
          '邮票既承担邮资，也以教宗、艺术、纪念日和国际事件构成微型国家图像档案。',
        lookFor:
          '核对目的地资费、发行主题和面值，不以纪念张外观代替有效邮资确认。',
      },
      {
        title: 'Citta del Vaticano邮戳',
        creator: '梵蒂冈邮政与集邮服务',
        period: '寄件当日',
        location: '服务柜台或邮件处理点',
        summary: '日期和国家地名把普通明信片转化为可验证的旅行时间记录。',
        lookFor:
          '请求或检查戳记日期、地名和清晰度，同时服从柜台实际可提供的服务。',
      },
    ],
    sequence: [
      {
        title: '17:00确认广场网点',
        body: '从大教堂出口按左半圆柱廊寻找新办事点，不把其他纪念品柜台误认成邮局。',
      },
      {
        title: '购买正确邮资',
        body: '说明寄往国家和邮件类型，由柜台确认当前邮资；设计者或发行信息不明时不猜测。',
      },
      {
        title: '完整填写并盖戳',
        body: '提前写好收件人、城市、邮编和国家，按柜台可用服务盖戳。',
      },
      {
        title: '17:30前完成投递',
        body: '按原行程结束，不把钟门网点较晚闭门时间当作延长计划的理由。',
      },
    ],
    practical: [
      '2026年10月1日为周四；圣彼得广场网点常规08:30-18:30，17:00安排在正常时段内，但未来仍须当天复核。',
      '大教堂穹顶票面约17:00结束，邮局衔接几乎没有缓冲；保留这一风险，不修改预约和邮局时段。',
      '提前写好地址并确认国际邮资；临时停业或柜台变化若未公布原因，一律标记未知。',
    ],
    sources: [
      {
        institution: 'Poste Vaticane',
        title: 'Postal services useful information',
        url: 'https://postevaticane.va/en/the-service/postal-services/useful-information',
        verifiedAt: '2026-09-02',
        note: '支持圣彼得广场和钟门网点的服务及常规营业时间。',
      },
      {
        institution: 'Governatorato dello Stato della Citta del Vaticano',
        title: "A new post office for St Peter's Square",
        url: 'https://www.vaticanstate.va/it/novita/1212-un-nuovo-ufficio-postale-per-piazza-san-pietro.html',
        verifiedAt: '2026-09-02',
        note: '支持新网点位置、2024年启用、模块化木构和无障碍设计。',
      },
    ],
  },

  'vatican-surroundings': {
    originalTitle: 'Rione Borgo',
    overview:
      '行程中模糊的“梵蒂冈周边”在文化导览里应落到罗马 Borgo 历史区：它夹在圣彼得广场与台伯河之间，既是朝圣者进入梵蒂冈的前厅，也是教宗城防、20世纪拆建和日常街巷重叠的地方。19:00至21:30与台伯河沿线共享时段，因此这里只安排 Borgo Pio、Passetto、协和大道和圣天使堡外观，不承诺夜间室内。',
    orientation: [
      {
        title: '西边梵蒂冈、东边河堡',
        body: 'Borgo位于圣彼得广场和圣天使堡之间，协和大道提供显眼中轴，小街则保留更早的密集尺度。',
      },
      {
        title: '名字来自Burg',
        body: '区名与中世纪撒克逊朝圣者聚居形成的burg有关；1586年它被正式列为罗马第十四区。',
      },
      {
        title: '现代轴线来自拆建',
        body: '旧Spina街区在1935-1937年拆除，协和大道随后形成；今天的开阔视线并非古老原貌。',
      },
    ],
    spatial: {
      type: 'district',
      title: '广场到城堡之间的双重街网',
      note: '协和大道负责大轴线，Borgo Pio和Passetto体现旧街区；与台伯河项目共享19:00-21:30。',
      stops: [
        'Borgo Santo Spirito',
        'Borgo Pio',
        'Passetto外观',
        '协和大道',
        '圣天使堡外观',
      ],
    },
    highlights: [
      {
        title: 'Passetto di Borgo',
        creator: '历代教宗城防工程，具体单一作者不适用',
        period: '中世纪形成，文艺复兴时期强化',
        location: '梵蒂冈北侧至圣天使堡',
        summary:
          '高架有垛通道连接宗座宫与圣天使堡，为教宗在危机时提供受保护路线。',
        lookFor:
          '沿墙辨认连续拱洞、顶部封闭通道和垛口，观察它怎样跨越普通街道。',
      },
      {
        title: '协和大道',
        originalTitle: 'Via della Conciliazione',
        creator: '马尔切洛·皮亚琴蒂尼与阿蒂利奥·斯帕卡雷利',
        period: '1936-1950',
        location: '圣彼得广场至台伯河中轴',
        summary:
          '拆除Spina后形成的纪念性大道，把圣彼得立面长距离暴露在城市视线中。',
        lookFor: '从河一端回望大教堂，比较宽阔轴线与两侧残存小街尺度。',
      },
      {
        title: '圣天使堡',
        originalTitle: "Castel Sant'Angelo",
        creator: '哈德良时期帝国工程团队，后经教宗持续改造',
        period: '123-139年始建，此后多期',
        location: 'Borgo东端台伯河岸',
        summary:
          '哈德良陵墓先转为军事堡垒，再成为教宗避难和居住空间，圆筒核心保存多层用途。',
        lookFor: '从外部区分方形基座、圆筒墓体、城墙和顶部天使像。',
      },
    ],
    sequence: [
      {
        title: '从广场侧进入旧街',
        body: '先走Borgo Santo Spirito或Borgo Pio，感受离开纪念性广场后的尺度变化。',
      },
      {
        title: '沿Passetto向东',
        body: '以外观方式追踪高架城防通道，不把未购票的内部通行纳入计划。',
      },
      {
        title: '回到协和大道比较轴线',
        body: '从侧巷转入大道，理解1930年代拆建如何改变看见大教堂的方式。',
      },
      {
        title: '在圣天使堡接台伯河',
        body: '只看外部层次，并与同一19:00-21:30窗口的河岸路线自然衔接。',
      },
    ],
    practical: [
      '`vatican-surroundings`按Borgo区处理；19:00-21:30与`tiber`是共享窗口，不应被解释成两段各2.5小时。',
      '晚间只保证公共街区和外观，Passetto内部、圣天使堡展厅均需独立核对票务和开放。',
      '街巷、车流和石板路并存；临时封闭或活动若未由官方解释，原因保持未知。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Rione XIV Borgo',
        url: 'https://turismoroma.it/en/page/rione-xiv-borgo',
        verifiedAt: '2026-09-02',
        note: '支持区名来源、1586年建区、Spina拆除和主要空间。',
      },
      {
        institution: 'Direzione Musei Nazionali della Citta di Roma',
        title: "Museo Nazionale di Castel Sant'Angelo",
        url: 'https://direzionemuseiroma.cultura.gov.it/en/museo-nazionale-di-castel-santangelo/',
        verifiedAt: '2026-09-02',
        note: '支持哈德良陵墓至堡垒和教宗建筑的历史层次。',
      },
    ],
  },

  tiber: {
    originalTitle: 'Tevere',
    overview:
      '台伯河沿线应被理解为罗马城市历史的线性剖面，而不只是夜景散步：古代桥梁连接居民区，圣天使桥把皇帝陵墓转化为仪式入口，教宗时期的西斯托桥重新缝合两岸，台伯岛则保存天然地形与医疗传统。本项与Borgo共同使用19:00至21:30，实际距离须按体力截短，不能默认一路走到所有南段节点。',
    orientation: [
      {
        title: '以圣天使堡为北端',
        body: '从Borgo抵达河岸后，圣天使桥和城堡形成最清楚的起点；向南才依次接近西斯托桥和台伯岛。',
      },
      {
        title: '分清上层与下层河岸',
        body: '上层Lungotevere连续且较接近街道；下层步道更贴近水面，但入口、照明和临时封闭更不稳定。',
      },
      {
        title: '桥梁代表不同年代',
        body: '哈德良时期圣天使桥、15世纪西斯托桥和更早的岛桥共同显示城市跨河方式的变化。',
      },
    ],
    spatial: {
      type: 'district',
      title: '沿河向南的可截短线性路线',
      note: '以下为最大范围；19:00-21:30同时包含Borgo，应根据现场时间在西斯托桥或更早处折返。',
      stops: [
        '圣天使堡河岸',
        '圣天使桥',
        'Lungotevere上层步道',
        '西斯托桥',
        '台伯岛',
      ],
    },
    highlights: [
      {
        title: '圣天使桥',
        originalTitle: "Ponte Sant'Angelo",
        creator: '哈德良时期工程团队；贝尼尼设计天使序列',
        period: '136年；天使序列1668年起',
        location: '圣天使堡正前方',
        summary:
          '古桥原为哈德良陵墓入口，17世纪天使雕像把它改造成通向圣彼得方向的宗教仪式通道。',
        lookFor: '沿桥中线对准城堡，再逐一看天使所持受难器物与雕像姿态。',
      },
      {
        title: '西斯托桥',
        originalTitle: 'Ponte Sisto',
        creator: '西斯都四世委建，传统归于巴乔·蓬泰利',
        period: '1473-1479',
        location: 'Regola与Trastevere之间',
        summary:
          '为1475禧年重建的四拱桥恢复重要跨河联系，中央圆孔兼具泄洪和视觉识别作用。',
        lookFor: '从河岸看四个桥拱与中央oculus，理解圆孔如何减轻洪水压力。',
      },
      {
        title: '台伯岛与古桥',
        originalTitle: 'Isola Tiberina',
        creator: '天然凝灰岩岛；桥梁由共和国时期工程团队建造',
        period: 'Fabricius桥前62年，Cestius桥前46年',
        location: '河道南段',
        summary:
          '约300乘90米的天然岛屿以两座古桥连接两岸，古代以来与医治和宗教设施相联。',
        lookFor:
          '从桥上看岛屿船形轮廓、石砌岸壁和两条河汊，不把它误认成人工填筑岛。',
      },
    ],
    sequence: [
      {
        title: '从城堡河岸建立起点',
        body: '先在岸上观察圣天使桥与圆形堡体，不急于下到低层步道。',
      },
      {
        title: '选择上层或下层路线',
        body: '只有入口开放、照明和水位适合时才走下层；否则沿Lungotevere上层向南。',
      },
      {
        title: '以西斯托桥作为最低完成线',
        body: '观察桥拱和圆孔后评估时间；Borgo已占用同一窗口时可在此结束。',
      },
      {
        title: '有余量再到台伯岛',
        body: '仅在不赶路的情况下继续南行；特拉斯提弗列仍是备选，不强行加入。',
      },
    ],
    practical: [
      '本项与Borgo共同标注19:00-21:30，不是独立的完整2.5小时；路线必须允许在圣天使桥或西斯托桥截短。',
      '下层河岸可能因水位、工程或活动关闭；使用上层替代，具体原因只有官方公布后才写入。',
      '夜间注意楼梯、石面和自行车；公共河岸免费，但沿线建筑和岛上设施各有独立开放规则。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'The river Tiber',
        url: 'https://turismoroma.it/en/page/river-tiber',
        verifiedAt: '2026-09-02',
        note: '支持台伯河与罗马城市发展、主要河岸节点概况。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: "Over the Tiber: Rome's iconic bridges",
        url: 'https://www.turismoroma.it/en/itineraries/passage-over-tiber-rome%E2%80%99s-seven-most-iconic-bridges',
        verifiedAt: '2026-09-02',
        note: '支持圣天使桥、西斯托桥等桥梁年代与城市关系。',
      },
    ],
  },

  trastevere: {
    originalTitle: 'Rione XIII Trastevere',
    overview:
      '特拉斯提弗列意为“台伯河彼岸”，本项保留为街区备选而不是餐饮指南。它以中世纪以来的窄巷、社区广场、古老教堂和跨河桥梁形成与纪念性罗马不同的步行尺度。若台伯河路线后仍有体力，可从西斯托桥经Piazza Trilussa和Lungaretta抵达Santa Maria in Trastevere；若时间不足，保持备选状态，不挤压原定行程。',
    orientation: [
      {
        title: '从河对岸理解名字',
        body: '拉丁语trans Tiberim即“台伯河彼岸”，它长期位于古城中心相对的一侧，后来成为罗马第十三区。',
      },
      {
        title: '用两座广场定位',
        body: 'Piazza Trilussa是西斯托桥后的入口节点，Santa Maria in Trastevere广场是街区历史与宗教核心。',
      },
      {
        title: '主轴不是笔直大道',
        body: 'Via della Lungaretta串起多条小巷，但街区体验来自不规则转折和广场开合，不宜当作景点打卡直线。',
      },
    ],
    spatial: {
      type: 'district',
      title: '桥头、巷道与社区广场',
      note: '这是备选短线；不含餐厅、酒吧或交通建议，也不保证晚间教堂室内开放。',
      stops: [
        '西斯托桥',
        'Piazza Trilussa与Acqua Paola喷泉',
        'Via della Lungaretta',
        'Santa Maria in Trastevere',
        'Piazza San Cosimato',
      ],
    },
    highlights: [
      {
        title: '西斯托桥',
        originalTitle: 'Ponte Sisto',
        creator: '西斯都四世委建，传统归于巴乔·蓬泰利',
        period: '1473-1479',
        location: '街区东北入口',
        summary: '禧年工程重建古桥位置，使朝圣者和居民重新获得稳定跨河通道。',
        lookFor: '过桥前看四个拱与中央圆孔，过桥后回望历史中心天际线。',
      },
      {
        title: 'Piazza Trilussa的Acqua Paola喷泉',
        creator: '乔瓦尼·丰塔纳与乔瓦尼·瓦桑齐奥',
        period: '1613年建，1898年迁建',
        location: 'Piazza Trilussa',
        summary:
          '原为台伯河对岸的公共水源展示，19世纪末移到现广场，形成高墙式桥头背景。',
        lookFor: '观察高位壁龛、水盆和石阶如何把小广场转成公共会聚空间。',
      },
      {
        title: '河西圣母大殿',
        originalTitle: 'Santa Maria in Trastevere',
        creator: '12世纪重建团队；彼得罗·卡瓦利尼创作后殿马赛克',
        period: '约1140年重建；马赛克约1291年',
        location: '街区中心广场',
        summary:
          '罗马最古老的圣母敬礼教堂之一，以中世纪立面和金色马赛克建立街区宗教中心。',
        lookFor:
          '室内开放时看后殿卡瓦利尼马赛克；关闭时从广场观察立面马赛克、钟楼和喷泉。',
      },
    ],
    sequence: [
      {
        title: '先确认仍有时间和体力',
        body: '特拉斯提弗列在`trip.ts`中是备选；不因导览内容存在就把它升级为必到。',
      },
      {
        title: '从西斯托桥进入',
        body: '过桥后先在Piazza Trilussa看喷泉，再选择Lungaretta主线。',
      },
      {
        title: '抵达Santa Maria广场',
        body: '以外观为最低完成线；若有礼仪或已闭门，保持安静且不猜测原因。',
      },
      {
        title: '按体力决定是否续行',
        body: '可在主广场结束，只有余量充足才前往Piazza San Cosimato。',
      },
    ],
    practical: [
      '此项状态保持“备选”，且原备注中的美食不纳入文化导览；不得为加入街区而修改前面Borgo和台伯河时间。',
      '晚间只保证公共街巷和外观，教堂可能因礼仪或常规闭门无法进入；具体原因以现场公告为准。',
      '石板路、拥挤和夜间噪声会影响步速；从台伯河沿线是否步行到达由当晚实际位置决定。',
    ],
    sources: [
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Rione XIII Trastevere',
        url: 'https://www.turismoroma.it/en/page/rione-xiii-trastevere',
        verifiedAt: '2026-09-02',
        note: '支持区名、历史、街区范围和主要公共空间。',
      },
      {
        institution: 'Roma Capitale - Turismo Roma',
        title: 'Basilica of Santa Maria in Trastevere',
        url: 'https://www.turismoroma.it/en/places/basilica-santa-maria-trastevere',
        verifiedAt: '2026-09-02',
        note: '支持教堂重建年代、卡瓦利尼马赛克和位置。',
      },
    ],
  },
});
