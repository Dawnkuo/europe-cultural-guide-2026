import { defineGuideContent } from './types';

export const milanVeniceGuideContent = defineGuideContent({
  'galleria-vittorio': {
    overviewTitle: '玻璃穹顶下的米兰拱廊',
    originalTitle: 'Galleria Vittorio Emanuele II',
    overview:
      '由朱塞佩·门戈尼设计的十九世纪拱廊，以十字形玻璃铁顶连接主教座堂广场与斯卡拉广场。这里既是城市交通轴，也是统一店招、地面马赛克与工业时代结构共同构成的公共建筑，宜在移动中辨认其中轴、八角厅和四翼之间的对称关系。',
    orientation: [
      {
        title: '连接两座核心广场',
        body: '长廊西南端面向主教座堂广场，东北端通向斯卡拉广场；它首先是一条城市公共通道，而不是封闭商场。',
      },
      {
        title: '以中央八角厅定位',
        body: '两条拱廊在玻璃穹顶下交汇成八角形空间，四翼、四组城市纹章和穹顶铁肋都以这里为共同中心。',
      },
      {
        title: '建筑观察优先于购物',
        body: '有限时间应集中在铁玻璃结构、统一黑金店招和地面马赛克；各店铺营业时间彼此独立。',
      },
    ],
    spatial: {
      type: 'site',
      title: '十字形有顶公共拱廊',
      note: '按主教座堂端、中轴、中央八角厅和斯卡拉端理解空间；这是建筑节点说明，不替代商户分布图。',
      stops: [
        '主教座堂广场入口与凯旋门式立面',
        '西南翼玻璃拱顶和铁肋',
        '中央八角厅与玻璃穹顶',
        '意大利城市纹章地面马赛克',
        '统一黑金店招与历史店面',
        '斯卡拉广场出口',
      ],
    },
    highlights: [
      {
        title: '中央穹顶与八角厅',
        creator: 'Giuseppe Mengoni',
        period: '1865—1877年',
        location: '两条拱廊的中央交汇处',
        summary:
          '门戈尼以铁和玻璃覆盖十字形街道，并在交点抬高为八角穹顶，把工业时代材料转化为纪念性城市室内空间。',
        lookFor:
          '站在八角厅中心抬头，观察四条拱顶铁肋如何汇入穹顶，再比较四翼开口的尺度与对称关系。',
      },
      {
        title: '城市与王室纹章马赛克',
        period: '十九世纪后期',
        location: '中央八角厅地面',
        summary:
          '地面以马赛克呈现萨伏依王室和意大利重要城市纹章，使新统一国家的政治地理进入日常步行空间。',
        lookFor:
          '逐一辨认米兰、都灵、佛罗伦萨和罗马等纹章，留意图案如何对准四翼而不是孤立铺陈。',
      },
      {
        title: '统一的黑金商业立面',
        period: '十九世纪设计传统延续至今',
        location: '长廊两翼店铺',
        summary:
          '店铺招牌以受控的黑底金字和一致比例融入建筑，让不同品牌服从于拱廊的整体视觉秩序。',
        lookFor:
          '比较不同店铺的字体、门楣高度和橱窗边框，观察商业识别如何在统一规则中保留差异。',
      },
    ],
    sequence: [
      {
        title: '由主教座堂端进入',
        body: '先在广场边缘看入口立面和中轴深度，再进入西南翼，不要一开始就停在店铺前。',
      },
      {
        title: '沿中轴同时看顶与地面',
        body: '在行进中交替观察铁玻璃拱顶、统一店招和地面铺装，建立三层视觉秩序。',
      },
      {
        title: '在八角厅完成环看',
        body: '站到交点依次看四翼、穹顶和城市纹章；拥挤时移到边缘，不阻挡主要人流。',
      },
      {
        title: '从斯卡拉端离开',
        body: '沿东北翼走向斯卡拉广场，回头看长廊轴线如何为歌剧院前场构成框景。',
      },
    ],
    practical: [
      '长廊建筑本体是公共步行空间，不设统一景点检票；各商户有自己的营业时间。',
      '中央八角厅和公牛纹章周围常聚集人群，拍摄及观察时保持主要通道畅通。',
      '石材与马赛克地面较光滑，雨天从广场带入水分后应放慢脚步。',
    ],
    sources: [
      {
        institution: 'Milano & Partners / YesMilano',
        title: 'Galleria Vittorio Emanuele II',
        url: 'https://www.yesmilano.it/en/see-and-do/venues/galleria-vittorio-emanuele-ii',
        verifiedAt: '2026-09-02',
        note: '支持门戈尼设计、十九世纪铁玻璃结构、长廊连接主教座堂与斯卡拉广场、地面纹章及统一店招等事实。',
      },
    ],
  },
  'milan-duomo': {
    overviewTitle: '从彩窗长堂到大理石尖塔',
    originalTitle: 'Duomo di Milano',
    overview:
      '这座始建于1386年的主教座堂以坎多利亚大理石、密集尖塔和跨越数世纪的雕塑工程塑造米兰天际线。露台并非单一观景台，而是由低层步道、飞扶壁与中央高台组成的垂直建筑体验；室内则集中观察宏大尺度、彩窗光线与后唱诗席的雕塑。',
    orientation: [
      {
        title: '西立面是地面基准',
        body: '主立面朝向主教座堂广场，中殿由此向东延伸至后殿；进入不同票种入口前先核对现场指示。',
      },
      {
        title: '室内沿中轴通向后殿',
        body: '中殿、交叉部、后唱诗席和后殿彩窗构成水平参观主线，《剥皮的圣巴多罗买》位于后唱诗席区域。',
      },
      {
        title: '露台分成两个高度',
        body: '官方资料列首层露台约31米、中央露台约45米；电梯减少上行但最后高处和离场仍可能涉及台阶。',
      },
    ],
    spatial: {
      type: 'site',
      title: '教堂室内与双层屋顶露台',
      note: '按水平礼仪空间和垂直露台两部分理解；实际入口、升降设备和下行路线服从票面与当天管理。',
      stops: [
        '西立面与主教座堂广场',
        '中殿柱列及侧廊',
        '后唱诗席与圣巴多罗买雕像',
        '后殿彩窗',
        '约31米高的首层露台',
        '约45米高的中央露台与大尖塔',
      ],
    },
    highlights: [
      {
        title: '《剥皮的圣巴多罗买》',
        creator: "Marco d'Agrate",
        period: '1562年',
        location: '后唱诗席',
        summary:
          '雕像把殉道圣人的皮肤像披肩般覆在肌肉外露的身体上，以精确解剖和反常表面处理制造强烈近观效果。',
        lookFor:
          '先看双肩垂下的皮肤轮廓，再绕到侧面分辨肌肉、骨点与披皮之间并非普通衣褶的关系。',
      },
      {
        title: '大尖塔与金色圣母',
        creator: 'Francesco Croce 等；圣母像由 Giuseppe Perego 塑模',
        period: '十八世纪，大尖塔完成于1760年代、圣母像立于1774年',
        location: '教堂屋顶中央',
        summary:
          '大尖塔从密集小尖塔中升起，顶部金色圣母成为米兰最重要的城市标志之一，也为露台提供垂直方向基准。',
        lookFor:
          '从首层露台逐步接近中央高台，观察尖塔数量和高度如何递进，并比较金色像与浅色大理石的材质反差。',
      },
      {
        title: '坎多利亚大理石飞扶壁与雕像',
        period: '十四世纪末至近现代持续营建',
        location: '屋顶露台步道',
        summary:
          '露台把地面难以辨认的飞扶壁、滴水构件、尖塔和大量人物雕像带到近距离，显出长期维护中的建筑表皮。',
        lookFor:
          '不要只看城市远景；同时看石材接缝、修复色差、扶壁传力方向以及雕像背面这些地面不可见细节。',
      },
    ],
    sequence: [
      {
        title: '先确认当日入口与票种',
        body: '到达广场后检查主教堂和露台入口公告，决定是否在14:30露台时段前先看室内。',
      },
      {
        title: '按票面优先衔接露台电梯',
        body: '约14:20前往票面指定的露台入口，完成安检后按14:30时段乘电梯上行。',
      },
      {
        title: '先走首层外围',
        body: '沿开放步道观察飞扶壁、雕像和城市方向，再前往通向中央高台的步行段。',
      },
      {
        title: '登中央露台再下行',
        body: '在高台观察大尖塔和金色圣母，按单向指示离开；不要逆行寻找电梯。',
      },
      {
        title: '以教堂内部收束',
        body: '若此前未参观室内，回到地面后依次看中殿、后唱诗席雕像和后殿彩窗。',
      },
    ],
    practical: [
      '行程中的14:30是露台电梯入口时段；主教堂等区域可按票面规则安排在此前或此后。',
      '官网日历在2026-09-02显示常规参观约09:00—19:00，但礼仪、天气和维护可临时调整开放范围。',
      '露台中央高处仍有台阶和狭窄段；行动不便访客应核对电梯可达范围。',
      '宗教场所要求遮盖肩膝，并服从安检和礼拜期间的区域限制。',
    ],
    sources: [
      {
        institution: 'Veneranda Fabbrica del Duomo di Milano',
        title: 'The Cathedral',
        url: 'https://www.duomomilano.it/en/art-and-culture/the-cathedral/',
        verifiedAt: '2026-09-02',
        note: '支持1386年始建、坎多利亚大理石、建筑历史和主教座堂性质。',
      },
      {
        institution: 'Veneranda Fabbrica del Duomo di Milano',
        title: 'The Terraces',
        url: 'https://www.duomomilano.it/en/art-and-culture/the-terraces/',
        verifiedAt: '2026-09-02',
        note: '支持露台约31米和45米高度、135座尖塔、大尖塔及金色圣母等事实。',
      },
      {
        institution: 'Veneranda Fabbrica del Duomo di Milano',
        title: "Flayed St Bartholomew by Marco d'Agrate",
        url: 'https://www.duomomilano.it/en/flayed-st-bartholomew-by-marco-dagrate-the-statue-under-restoration-until-spring-2025/',
        verifiedAt: '2026-09-02',
        note: '支持雕像作者、1562年年代、题材和修复背景；作品已在2025年回到后唱诗席。',
      },
      {
        institution: 'Veneranda Fabbrica del Duomo di Milano',
        title: 'Visits calendar',
        url: 'https://www.duomomilano.it/en/calendar-guided-tours-celebrations/?type=100',
        verifiedAt: '2026-09-02',
        note: '核验2026-09-02可见的常规开放时段；到访日仍须重查礼仪和临时调整。',
      },
    ],
  },
  'la-scala-evening': {
    overviewTitle: '马蹄形剧场里的交响之夜',
    originalTitle:
      'Daniele Rustioni — Stagione Sinfonica del Teatro alla Scala',
    overview:
      '2026年9月25日的斯卡拉交响季由达尼埃莱·鲁斯蒂奥尼指挥乐团与合唱团，曲目从勃拉姆斯的庆典与命运主题转入舒曼第二交响曲。体验核心不只是曲目，也包括皮耶马里尼式马蹄形观众厅、层叠包厢和不同楼层形成的舞台声场。',
    orientation: [
      {
        title: '正门面向斯卡拉广场',
        body: '普通观众由Piazza della Scala一侧进入；顶层楼座或特定票种可能按票面从博物馆一侧入口进入。',
      },
      {
        title: '20:00准时开演',
        body: '官方节目页确认2026年9月25日20:00演出；迟到观众只能等待工作人员指定的合适时机入场。',
      },
      {
        title: '票务状态仍待确认',
        body: "行程计划18:00争取Last Seats，但尚无出票资料；普通余票和L'Accordo顶层票是两种不同机制。",
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '历史剧院的门厅、包厢层与舞台',
      note: '可见范围取决于最终票位；节点只描述观众公共动线，不推定具体座位或后台开放。',
      stops: [
        '斯卡拉广场与剧院立面',
        '票面指定入口和安检处',
        '门厅及楼层交通',
        '马蹄形观众厅与层叠包厢',
        '舞台、镜框和乐团位置',
        '顶层楼座视线区',
      ],
    },
    highlights: [
      {
        title: '马蹄形观众厅',
        creator: 'Giuseppe Piermarini',
        period: '1778年开幕，后经重建与修复',
        location: '剧院观众厅',
        summary:
          '皮耶马里尼建立的马蹄形空间以包厢垂直围合舞台，既体现贵族社交秩序，也塑造不同楼层的声音和视线差异。',
        lookFor:
          '入座前从横向观察包厢重复节奏、皇家包厢中轴和舞台镜框，不要把注意力只留在天花装饰。',
      },
      {
        title: '勃拉姆斯《大学庆典序曲》与《命运之歌》',
        creator: 'Johannes Brahms',
        period: '十九世纪后期',
        location: '当晚舞台，由斯卡拉乐团与合唱团演出',
        summary:
          '前者把学生歌曲材料组织成明亮的管弦庆典，后者以合唱和乐队处理赫尔德林诗中的理想世界与人类命运。',
        lookFor:
          '比较序曲中铜管和打击乐的外向色彩，与《命运之歌》合唱声部、速度和调性色彩的转折。',
      },
      {
        title: '舒曼第二交响曲',
        creator: 'Robert Schumann',
        period: '1845—1846年',
        location: '当晚下半场舞台',
        summary:
          '作品以持续动机、对位和由紧张转向明朗的结构推进，是观察指挥如何维持长线张力的核心曲目。',
        lookFor:
          '记住开头铜管信号，听它如何在后续乐章回返；慢乐章之后尤其留意终乐章的主题整合。',
      },
    ],
    sequence: [
      {
        title: '先核验当日票务机制',
        body: "演出日下午检查官方线上余票、票房公告及L'Accordo程序，不把行程备注中的站票视为已经保证。",
      },
      {
        title: '至少提前20分钟到场',
        body: '确认票面入口、完成安检和必要寄存，再前往对应楼层，避免在开演铃后寻找座位。',
      },
      {
        title: '入座后先读空间',
        body: '观察包厢层、皇家包厢和舞台镜框，再安静等待乐团及合唱团入场。',
      },
      {
        title: '按曲目结构集中聆听',
        body: '上半场比较两部勃拉姆斯作品，下半场追踪舒曼开头动机如何贯穿全曲。',
      },
      {
        title: '散场按楼层出口离开',
        body: '顶层和包厢人流汇合较慢，服从工作人员分流，不在狭窄通道停留拍照。',
      },
    ],
    practical: [
      '官方节目确认2026年9月25日20:00演出；建议至少提前20分钟到达。',
      '迟到者须等待工作人员许可；演出进行中不得摄影或录像。',
      "行程所写“18:00抢站票”只与普通余票提前两小时上线部分吻合；140张顶层票另循L'Accordo程序，座位或站位属性待出票确认。",
      '服装须符合剧院礼仪，避免短裤、无袖上衣等可能导致拒绝入场的穿着。',
    ],
    sources: [
      {
        institution: 'Teatro alla Scala',
        title: 'Daniele Rustioni — Stagione Sinfonica 2025/2026',
        url: 'https://www.teatroallascala.org/it/stagione/2025-2026/concerti/stagione-sinfonica/daniele-rustioni.html',
        verifiedAt: '2026-09-02',
        note: '支持2026年9月25日20:00、指挥、乐团与合唱团，以及勃拉姆斯和舒曼完整曲目。',
      },
      {
        institution: 'Teatro alla Scala',
        title: 'Information for the audience',
        url: 'https://www.teatroallascala.org/en/visit/information/information.html',
        verifiedAt: '2026-09-02',
        note: '支持入口区分、提前20分钟到场、迟到管理、着装和场内禁拍规则。',
      },
      {
        institution: 'Teatro alla Scala',
        title: 'Concessions and discounts',
        url: 'https://www.teatroallascala.org/en/season/box-office/young-people-and-promotions/concessions-and-discounts.html',
        verifiedAt: '2026-09-02',
        note: "支持普通Last Minute线上提前两小时、票房提前一小时等现行机制；L'Accordo顶层票需另循其程序。",
      },
    ],
  },
  'last-supper': {
    overviewTitle: '食堂墙上的透视与人物戏剧',
    originalTitle: 'Il Cenacolo di Leonardo da Vinci',
    overview:
      '达·芬奇于1495至1498年在修道院食堂北墙完成此作，采用干壁实验技法而非传统湿壁画。有限的十五分钟应集中观察透视消失点、十二门徒的分组动作，以及画面与真实食堂空间的延续；南墙蒙托法诺的《受难》则提供材料和构图上的重要对照。',
    orientation: [
      {
        title: '入口与教堂分离',
        body: '博物馆入口及票务核验位于修道院侧翼，不通过圣玛利亚感恩教堂内部进入。',
      },
      {
        title: '两幅壁画相对而立',
        body: '达·芬奇《最后的晚餐》占据旧食堂北墙，蒙托法诺《受难》位于南墙，访客可在同一房间转身比较。',
      },
      {
        title: '十五分钟严格限时',
        body: '每批最多40人、停留15分钟；官方要求提前30分钟到场，迟到可能直接失去入场资格。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '经恒温闸室进入的单一历史食堂',
      note: '空间说明依据官方公开的入口、空气闸和食堂两壁关系，不推定后台或修道院其他房间开放。',
      stops: [
        '票务与身份核验处',
        '强制寄存柜',
        '分段空气调节闸室',
        '北墙《最后的晚餐》',
        '南墙《受难》',
        '出口及庭院过渡区',
      ],
    },
    highlights: [
      {
        title: '《最后的晚餐》整体透视',
        creator: 'Leonardo da Vinci',
        period: '1495—1498年',
        location: '旧修道院食堂北墙',
        summary:
          '画面建筑线汇向基督头部，使虚构房间延续真实食堂；水平长桌则把人物推到观众可读的狭长舞台上。',
        lookFor:
          '先退到房间中线寻找消失点，再看壁面上方真实拱顶与画中格顶、侧墙线条如何建立连续空间。',
      },
      {
        title: '十二门徒的四组反应',
        creator: 'Leonardo da Vinci',
        period: '1495—1498年',
        location: '北墙长桌两侧',
        summary:
          '达·芬奇把门徒分成四组三人，以手势、视线和身体倾斜表现听到背叛预告后的连锁反应。',
        lookFor:
          '从基督向左右逐组看手、脸和桌面物件，辨认犹大的后缩位置及彼得、约翰之间的动作关系。',
      },
      {
        title: '《受难》及达·芬奇补绘痕迹',
        creator: 'Donato Montorfano；部分人物归于Leonardo da Vinci',
        period: '1495年后',
        location: '食堂南墙',
        summary:
          '蒙托法诺以传统湿壁画完成大型受难场面，两侧后加入斯福尔扎家族供养人形象，为北墙脆弱干壁技法提供保存对照。',
        lookFor:
          '比较南墙色层的整体稳定度与北墙细腻但残损的表面，再寻找供养人轮廓和后期损失痕迹。',
      },
    ],
    sequence: [
      {
        title: '提前30分钟核验',
        body: '携带预约凭证和所需身份证明到票务处；行程虽记09:30已订，但缺少PDF，必须事先找回有效票据。',
      },
      {
        title: '完成强制寄存',
        body: '将背包、食物和饮料按规定放入寄存柜，只携带允许物品进入分批等候区。',
      },
      {
        title: '通过空气调节闸室',
        body: '跟随本批访客依次通过闸室，不逆行、不催促前组，进入食堂后立即找到中轴位置。',
      },
      {
        title: '先整体再分组',
        body: '先用数分钟看北墙透视全貌，再从中央向两侧追踪四组三人的手势与表情。',
      },
      {
        title: '转身比较南墙',
        body: '最后观察蒙托法诺《受难》和两种技法的保存差异，按工作人员提示准时离场。',
      },
    ],
    practical: [
      '所有访客必须预约；每批最多40人，食堂停留15分钟。',
      '官方要求提前30分钟到达，迟到可能失去参观资格且无法补入下一批。',
      '行李须寄存，食物和饮料不得带入；现场流程包括多道空气调节门。',
      '行程记录09:30但票据文件夹缺少PDF，当前仍属待确认，不应只凭行程文字前往。',
    ],
    sources: [
      {
        institution: 'Museo del Cenacolo Vinciano',
        title: 'Visitor information',
        url: 'https://cenacolovinciano.org/en/info/',
        verifiedAt: '2026-09-02',
        note: '支持强制预约、周二至周日时段、提前到场、15分钟、每批40人、寄存及禁带物品规则。',
      },
      {
        institution: 'Museo del Cenacolo Vinciano',
        title: 'The Last Supper — Leonardo da Vinci',
        url: 'https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/',
        verifiedAt: '2026-09-02',
        note: '支持作者、1495至1498年年代、干壁实验技法、北墙位置和作品尺寸。',
      },
      {
        institution: 'Museo del Cenacolo Vinciano',
        title: 'The Crucifixion — Donato Montorfano',
        url: 'https://cenacolovinciano.org/en/museum/the-works/the-crucifixion-donato-montorfano-1460-ca-1502-ca/',
        verifiedAt: '2026-09-02',
        note: '支持南墙《受难》、1495年后、湿壁画技法及达·芬奇供养人痕迹。',
      },
    ],
  },
  'santa-maria-grazie': {
    overviewTitle: '哥特长堂与文艺复兴圆顶',
    originalTitle: 'Basilica di Santa Maria delle Grazie',
    overview:
      '教堂由吉尼福尔特·索拉里在十五世纪后期建造，后由布拉曼特改造东部礼仪空间，形成伦巴第哥特式长堂与文艺复兴圆顶、后殿相遇的复合建筑。它与《最后的晚餐》同属一组遗产，但教堂参观与食堂博物馆是两个独立入口和两套管理流程。',
    orientation: [
      {
        title: '正立面面向同名广场',
        body: '从Piazza Santa Maria delle Grazie进入教堂；博物馆票务入口位于建筑群另一侧，不能由教堂内部通往食堂。',
      },
      {
        title: '长堂通向东部圆顶',
        body: '索拉里的三廊长堂是水平基准，向东到交叉部后转入通常归于布拉曼特体系的圆顶、唱诗席和后殿。',
      },
      {
        title: '首先是礼拜场所',
        body: '游客时段服从弥撒、祈祷和宗教活动；庆典进行时停止文化参观，侧礼拜堂也可能局部限制。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '哥特式三廊长堂与文艺复兴东部空间',
      note: '只描述教堂公开区域和可由室内辨认的建筑关系；回廊、圣器室是否开放以当天公告为准。',
      stops: [
        '西立面与广场入口',
        '索拉里三廊中殿',
        '两侧礼拜堂',
        '交叉部与布拉曼特圆顶',
        '唱诗席及后殿',
        '开放时可见的回廊视角',
      ],
    },
    highlights: [
      {
        title: '索拉里三廊长堂',
        creator: 'Guiniforte Solari',
        period: '1463—1482年',
        location: '教堂西部中殿与侧廊',
        summary:
          '砖砌肋拱、成组柱墩和两侧礼拜堂延续伦巴第晚期哥特传统，为东部文艺复兴改造提供清晰对照。',
        lookFor:
          '从中央中殿回望入口，观察拱跨重复、红砖与浅色石材的交替，再比较侧廊较低的尺度。',
      },
      {
        title: '布拉曼特东部空间',
        creator: 'Donato Bramante 设计体系',
        period: '十五世纪末',
        location: '交叉部、圆顶、唱诗席和后殿',
        summary:
          '东部改造以集中式几何、叠加圆拱和大型圆顶重塑斯福尔扎宫廷礼仪空间，与原长堂形成强烈体量转折。',
        lookFor:
          '站在长堂接近交叉口处，比较前方圆顶的集中几何与身后连续拱跨，观察光线如何强调转换。',
      },
      {
        title: '圣冠礼拜堂《受难》',
        creator: 'Gaudenzio Ferrari',
        period: '1539年',
        location: 'Cappella di Santa Corona',
        summary:
          '大型受难画以密集人物、鲜明色彩和北意大利叙事细节占据礼拜堂视觉中心，显示教堂后续艺术赞助。',
        lookFor:
          '先找十字架形成的垂直轴，再看下方人物群、兵器和衣饰如何把视线推向画面中心。',
      },
    ],
    sequence: [
      {
        title: '从广场先看建筑体量',
        body: '在入内前比较西部砖砌长堂与东部圆顶轮廓，建立两次建造阶段的外部关系。',
      },
      {
        title: '沿中殿读取索拉里结构',
        body: '从西向东观察柱墩、肋拱和侧廊比例，保持安静并避开正在进行的私人祈祷。',
      },
      {
        title: '选择性查看侧礼拜堂',
        body: '优先寻找圣冠礼拜堂及高登齐奥·费拉里作品，不在每个小堂平均分配时间。',
      },
      {
        title: '在交叉部比较两种语言',
        body: '仰看圆顶并回望长堂，观察哥特式连续轴线如何转入文艺复兴集中空间。',
      },
      {
        title: '由后殿或开放回廊收束',
        body: '按现场围栏到达允许范围的最东端；回廊或圣器室未开放时不要寻找非公众入口。',
      },
    ],
    practical: [
      '2026年9月26日为周六，官网现行游客时段是09:00—12:20和15:00—17:50。',
      '弥撒及其他庆典进行时不允许文化参观；服装和行为应符合宗教场所要求。',
      '教堂无需《最后的晚餐》门票，但不能由教堂内部进入食堂博物馆。',
      '圣器室和部分回廊只在特定周末或活动时开放，不把它们视为保证可见节点。',
    ],
    sources: [
      {
        institution: 'Basilica di Santa Maria delle Grazie',
        title: 'Orari',
        url: 'https://legraziemilano.it/orari/',
        verifiedAt: '2026-09-02',
        note: '支持2026年现行教堂开放、游客参观时段、庆典期间停止参观及圣器室限制。',
      },
      {
        institution: 'Museo del Cenacolo Vinciano',
        title: 'Santa Maria delle Grazie',
        url: 'https://cenacolovinciano.org/en/story/saint-maria-delle-grazie/',
        verifiedAt: '2026-09-02',
        note: '支持索拉里1463至1482年建造、三廊与礼拜堂布局、布拉曼特东部改造及高登齐奥·费拉里作品。',
      },
    ],
  },
  sforza: {
    overviewTitle: '斯福尔扎要塞与米开朗琪罗晚作',
    originalTitle: 'Castello Sforzesco',
    overview:
      '城堡从斯福尔扎王朝要塞演变为多馆合一的城市博物馆群，开放庭院、塔楼、宫廷空间与雕塑、装饰艺术收藏彼此交织。复杂动线应以官方地图为准，重点留给米开朗基罗未完成的《隆达尼尼哀悼基督》及其可从多个角度观看的展厅。',
    orientation: [
      {
        title: '菲拉雷特塔是城市入口',
        body: '由市中心抵达时通常穿过现今的菲拉雷特塔进入武器庭院；这座塔是贝尔特拉米依据历史资料完成的现代重建。',
      },
      {
        title: '庭院与博物馆分开管理',
        body: '主要庭院每日免费开放，室内博物馆共用一张门票并有更早的停止入场时间。',
      },
      {
        title: '《隆达尼尼》位于独立终点',
        body: '作品陈列在旧西班牙医院内，可从多角度观看；它不是古代艺术馆普通展墙上的一件作品。',
      },
    ],
    spatial: {
      type: 'site',
      title: '多庭院城堡与连续博物馆群',
      note: '节点依据城堡官方地图和博物馆顺序整理；各馆入口及局部关闭以现场导向为准。',
      stops: [
        '菲拉雷特塔与主入口',
        '武器庭院',
        '公爵庭院与Rocchetta',
        '古代艺术博物馆',
        '舞厅及《月份挂毯》',
        '旧西班牙医院与《隆达尼尼》',
      ],
    },
    highlights: [
      {
        title: '菲拉雷特塔的历史复原',
        creator: 'Filarete 原设计；Luca Beltrami 重建',
        period: '原塔始于1452年；现塔完成于二十世纪初',
        location: '城堡东南主入口',
        summary:
          '原斯福尔扎时代塔楼早已消失，贝尔特拉米在城堡现代修复中根据文献重建，使它重新成为城市轴线的纪念性入口。',
        lookFor:
          '从广场看塔楼对称构图、钟面和城墙接口，同时记住眼前并非未经中断保存的十五世纪原物。',
      },
      {
        title: '《月份挂毯》',
        creator: 'Bramantino 设计；Vigevano 工坊织造',
        period: '1509年前完成',
        location: '装饰艺术博物馆舞厅',
        summary:
          '十二幅大型挂毯以月份、黄道、劳动和宫廷活动组织时间，是斯福尔扎时期图像、纺织技术与权力展示的综合体。',
        lookFor:
          '逐幅寻找月份标志、季节劳动和人物尺度，再观察边框如何把连续时间分成独立场景。',
      },
      {
        title: '《隆达尼尼哀悼基督》',
        creator: 'Michelangelo Buonarroti',
        period: '约1552—1564年',
        location: '旧西班牙医院专馆',
        summary:
          '这是米开朗基罗晚年反复修改、直至去世前仍未完成的雕塑，母子身体从狭长石块中相互依附地浮现。',
        lookFor:
          '绕作品一周，比较完成度较高的腿部、被放弃的手臂和重新内收的躯干，理解修改痕迹本身就是主题。',
      },
    ],
    sequence: [
      {
        title: '穿过菲拉雷特塔',
        body: '先在入口外看重建塔楼，再进入武器庭院领取或打开官方地图。',
      },
      {
        title: '由庭院进入古代艺术馆',
        body: '按当天入口导向进入室内馆线，留意公爵庭院和Rocchetta之间的空间转换。',
      },
      {
        title: '顺馆线到装饰艺术',
        body: '在古代艺术馆之后优先前往舞厅，集中观察十二幅《月份挂毯》。',
      },
      {
        title: '以《隆达尼尼》收束',
        body: '预留独立时间进入旧西班牙医院，从正面、侧面和背面逐步观看雕塑。',
      },
      {
        title: '经庭院离开',
        body: '按出口回到免费庭院；若后续去布雷拉，直接由城堡东北方向接续步行。',
      },
    ],
    practical: [
      '室内博物馆周二至周日10:00—17:30，16:30停止入场；行程日9月26日为周六。',
      '主要庭院每日07:00—19:30免费开放，室内博物馆则需单票。',
      '达·芬奇木板厅当前因修复关闭，不应按旧攻略把它列为保证可见项目。',
      '城堡馆舍分散且后续还安排布雷拉和斯卡拉博物馆，应把《隆达尼尼》和《月份挂毯》设为优先。',
    ],
    sources: [
      {
        institution: 'Castello Sforzesco, Comune di Milano',
        title: 'Castello Sforzesco official site',
        url: 'https://www.milanocastello.it/',
        verifiedAt: '2026-09-02',
        note: '支持博物馆与庭院开放时间、停止入场、单票范围和木板厅关闭信息。',
      },
      {
        institution: 'Castello Sforzesco, Comune di Milano',
        title: 'Museo della Pietà Rondanini — Michelangelo',
        url: 'https://www.milanocastello.it/it/i-musei/museo-pieta-rondanini-michelangelo',
        verifiedAt: '2026-09-02',
        note: '支持《隆达尼尼》为米开朗基罗最后阶段作品、旧西班牙医院位置及多角度陈列。',
      },
      {
        institution: 'Castello Sforzesco, Comune di Milano',
        title: 'Museo delle Arti Decorative — Le collezioni',
        url: 'https://www.milanocastello.it/it/i-musei/museo-delle-arti-decorative/le-collezioni',
        verifiedAt: '2026-09-02',
        note: '支持布拉曼蒂诺设计的十二幅《月份挂毯》、1509年前年代及舞厅位置。',
      },
      {
        institution: 'Castello Sforzesco, Comune di Milano',
        title: 'Mappa del Castello e itinerario',
        url: 'https://www.milanocastello.it/documents/461595483/477971915/mappa-castello%2Be%2B%2Bitinerario_def%2BLL%2B14.01.25.pdf/b3319db7-1c76-758b-f6a8-8e2453136a9e?t=1754403241406',
        verifiedAt: '2026-09-02',
        note: '支持庭院、馆舍和旧西班牙医院之间的真实位置及官方参观顺序；本指南未另造平面图。',
      },
    ],
  },
  brera: {
    overviewTitle: '透视、人体与光线的意大利绘画',
    originalTitle: 'Pinacoteca di Brera',
    overview:
      '布雷拉以意大利绘画的地域和年代序列组织收藏，全部主要展厅位于建筑首层。有限时间可围绕透视、人体缩短法和光线叙事建立三点式路线：曼特尼亚的极端视角、拉斐尔的文艺复兴秩序、卡拉瓦乔晚期的暗色戏剧性。',
    orientation: [
      {
        title: '入口经布雷拉宫庭院',
        body: '由街道进入拿破仑雕像所在庭院，再按博物馆指示上首层；庭院与美术馆检票区不是同一空间。',
      },
      {
        title: '主要展厅都在首层',
        body: '官方教育资料说明各展室位于一层并按地域和年代组织，适合用房间编号寻找重点。',
      },
      {
        title: '预约是现行要求',
        body: '官网要求通过Brera Booking预约；行程虽列“未订”，但不应依赖现场临时放行。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '首层连续画廊',
      note: '节点采用官方作品页当前房间编号；轮换、借展或维护时以现场地图和标签为准。',
      stops: [
        '布雷拉宫拿破仑庭院',
        '首层检票与开端展室',
        '第VI室曼特尼亚',
        '中段伦巴第及威尼斯绘画展室',
        '第XXIV室拉斐尔',
        '第XXVIII室卡拉瓦乔',
      ],
    },
    highlights: [
      {
        title: '《哀悼死去的基督》',
        creator: 'Andrea Mantegna',
        period: '约1483年',
        location: '第VI室',
        summary:
          '基督身体从脚部向头部急剧缩短，画家又有意调整脚的尺度，使创伤、面部和哀悼者仍能同时进入狭窄画面。',
        lookFor:
          '站到画面中轴，观察床沿透视、脚部比例和躯干缩短，再看左侧三位哀悼者被压缩在极小空间中。',
      },
      {
        title: '《圣母婚礼》',
        creator: 'Raffaello Sanzio',
        period: '1504年',
        location: '第XXIV室',
        summary:
          '人物弧线、铺地透视和中央多边形神庙形成高度清晰的文艺复兴秩序，也标志拉斐尔对佩鲁吉诺模式的成熟推进。',
        lookFor:
          '沿前景中央戒指、祭司和神庙门洞寻找同一轴线，再看两侧人物如何以弧线保持平衡。',
      },
      {
        title: '《以马忤斯的晚餐》',
        creator: 'Michelangelo Merisi da Caravaggio',
        period: '1606年',
        location: '第XXVIII室',
        summary:
          '卡拉瓦乔晚期版本压低动作和色彩，以贫瘠桌面、深暗背景和短促光线表现辨认复活基督的瞬间。',
        lookFor:
          '比较基督平静面部与门徒克制手势，留意桌布、面包和阴影如何取代早期版本的炫技静物。',
      },
    ],
    sequence: [
      {
        title: '按预约时段进入庭院',
        body: '提前打开预约凭证，经拿破仑庭院找到美术馆入口并上首层。',
      },
      {
        title: '先看第VI室曼特尼亚',
        body: '从早期意大利绘画展室进入第VI室，用正中位置观察缩短法，不在前段平均停留。',
      },
      {
        title: '沿年代线穿过中段',
        body: '选择性浏览伦巴第和威尼斯绘画，保持房间编号方向，前往第XXIV室。',
      },
      {
        title: '比较拉斐尔与卡拉瓦乔',
        body: '先看拉斐尔的清晰透视秩序，再到第XXVIII室观察卡拉瓦乔如何以暗色和近景改变叙事。',
      },
      {
        title: '从末段展室离场',
        body: '按当日出口返回庭院；若房间调整，优先用作者和作品名而不是旧编号寻找。',
      },
    ],
    practical: [
      '周二至周日08:30—19:15开放，18:00停止入场；周一闭馆。',
      '现行规则要求通过Brera Booking预约，行程日不可只依赖现场余位。',
      '常设展会因借展、保护或布展调整房间，三件重点应以现场作品标签确认。',
      '同日还安排城堡和斯卡拉博物馆，布雷拉宜优先三件核心作品及其间的年代过渡。',
    ],
    sources: [
      {
        institution: 'Pinacoteca di Brera',
        title: 'Orari',
        url: 'https://pinacotecabrera.org/visita/orari/',
        verifiedAt: '2026-09-02',
        note: '支持周二至周日开放、18:00停止入场、周一闭馆及预约要求。',
      },
      {
        institution: 'Pinacoteca di Brera',
        title: 'Lamentation over the Dead Christ',
        url: 'https://pinacotecabrera.org/en/collezioni/collezione-on-line/lamentation-over-the-dead-christ/',
        verifiedAt: '2026-09-02',
        note: '支持曼特尼亚作品、约1483年年代、房间位置和缩短法解读。',
      },
      {
        institution: 'Pinacoteca di Brera',
        title: 'The Marriage of the Virgin',
        url: 'https://pinacotecabrera.org/en/collezioni/collezione-on-line/the-marriage-of-the-virgin/',
        verifiedAt: '2026-09-02',
        note: '支持拉斐尔、1504年、房间位置及中央神庙透视结构。',
      },
      {
        institution: 'Pinacoteca di Brera',
        title: 'Supper at Emmaus',
        url: 'https://pinacotecabrera.org/en/collezioni/collezione-on-line/supper-at-emmaus/',
        verifiedAt: '2026-09-02',
        note: '支持卡拉瓦乔、1606年、房间位置及晚期版本特征。',
      },
    ],
  },
  'la-scala-museum': {
    overviewTitle: '乐器、肖像与斯卡拉舞台传统',
    originalTitle: 'Museo Teatrale alla Scala',
    overview:
      '博物馆通过乐器、歌唱家肖像、威尔第资料与历史海报呈现斯卡拉舞台传统，并可能从历史包厢观看观众厅。它与晚间演出是独立参观项目，包厢视线会因排练或技术工作关闭，因此路线应以馆藏为主体，把观众厅视为条件性加项。',
    orientation: [
      {
        title: '入口在Largo Ghiringhelli',
        body: '博物馆入口位于剧院侧面而非晚间普通观众正门；进入后按展室编号推进。',
      },
      {
        title: '馆藏路线独立于演出',
        body: '购买或持有演出票不会自动等于博物馆参观，两个行程的开放、检票和摄影规则应分别确认。',
      },
      {
        title: '观众厅视线不保证',
        body: '历史包厢仅在排练、演出和技术安排允许时开放，因此不能把看到空舞台作为参观成功的必要条件。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '主题展室与条件开放的历史包厢',
      note: '展室编号和主题依据博物馆官方导览；临时展、轮换和包厢关闭以现场为准。',
      stops: [
        'Largo Ghiringhelli入口',
        '第一室早期乐器',
        '第三室美声时代',
        '第四室斯卡拉与威尔第',
        '第九室档案及图书馆材料',
        '开放时的历史包厢观众厅视角',
      ],
    },
    highlights: [
      {
        title: '瓜拉奇诺工坊斯皮内琴',
        creator: 'Honofrio Guaracino workshop',
        period: '十七世纪',
        location: '第一室',
        summary:
          '那不勒斯工坊的小型键盘乐器与同时期音乐题材绘画共同呈现歌剧院出现前后的室内音乐物质文化。',
        lookFor:
          '观察琴身尺度、装饰表面和键盘布局，再与房间中的乐器静物画比较真实器物和绘画再现。',
      },
      {
        title: '塔基纳尔迪胸像与美声肖像',
        creator: 'Antonio Canova',
        period: '十九世纪初',
        location: '第三室',
        summary:
          '新古典主义胸像把男高音尼古拉·塔基纳尔迪塑造成古典英雄，与周围歌唱家肖像共同建立美声时代的明星文化。',
        lookFor:
          '比较大理石理想化面容与其他舞台肖像的服装、姿态，观察声音名望如何被转换为视觉形象。',
      },
      {
        title: '《纳布科》演出海报',
        period: '十九世纪（作品于1842年首演）',
        location: '第九室档案与图书馆材料',
        summary:
          '《纳布科》于1842年在斯卡拉首演，是威尔第事业的重要转折。图中的馆藏海报公告秋季复演，并非3月9日的首演单；它把作品此后的传播保存为具体演出文献。',
        lookFor:
          '阅读作曲家、剧名、演出人员和字体层级，比较十九世纪海报如何在有限版面组织信息。',
      },
    ],
    sequence: [
      {
        title: '由侧面入口检票',
        body: '从Largo Ghiringhelli进入，先查看当日包厢开放和临时展提示，再决定完整或短线参观。',
      },
      {
        title: '第一室从乐器开始',
        body: '观察斯皮内琴和相关绘画，建立舞台制度出现前的音乐物质背景。',
      },
      {
        title: '第三、第四室看人物史',
        body: '由美声歌唱家肖像进入威尔第主题，比较表演者、作曲家和剧院之间的关系。',
      },
      {
        title: '第九室看演出档案',
        body: '以《纳布科》海报等文献收束，理解舞台事件如何被保存和研究。',
      },
      {
        title: '开放时进入历史包厢',
        body: '若当天允许，从包厢观察观众厅、皇家包厢和舞台；关闭时不等待排练结束。',
      },
    ],
    practical: [
      '博物馆每日09:30—17:30开放，17:00停止入场；特定节日闭馆。',
      '观众厅包厢会因排练、演出或技术工作关闭，门票不保证这一视角。',
      '官方免费App提供约20、30、60和90分钟路线，可按当天剩余时间选择。',
      '该项目与9月25日晚间音乐会独立，不能用同一票务状态相互推定。',
    ],
    sources: [
      {
        institution: 'Teatro alla Scala',
        title: 'Official ticket office and museum hours',
        url: 'https://www.teatroallascala.org/en/teatro-alla-scala-official-ticket-office-how-to-purchase-tickets.html',
        verifiedAt: '2026-09-02',
        note: '支持博物馆每日09:30至17:30、17:00停止入场及节日闭馆信息。',
      },
      {
        institution: 'Museo Teatrale alla Scala',
        title: 'Plan your visit',
        url: 'https://www.museoscala.org/en/visit/museum-and-theater/plan-your-visit.html',
        verifiedAt: '2026-09-02',
        note: '支持入口、参观组织、观众厅视角受排练影响及现场安排。',
      },
      {
        institution: 'Museo Teatrale alla Scala',
        title: 'Notes from the past',
        url: 'https://www.museoscala.org/en/history/museum/notes-from-the-past.html',
        verifiedAt: '2026-09-02',
        note: '支持第一室瓜拉奇诺斯皮内琴及与音乐题材绘画的陈列关系。',
      },
      {
        institution: 'Museo Teatrale alla Scala',
        title: 'The archives and the library',
        url: 'https://www.museoscala.org/en/history/museum/the-archives-and-the-library.html',
        verifiedAt: '2026-09-02',
        note: '支持第九室档案主题及1842年《纳布科》首演海报。',
      },
    ],
  },
  'doges-palace': {
    overviewTitle: '议政大厅、巨画与监狱通道',
    originalTitle: 'Palazzo Ducale',
    overview:
      '总督宫把威尼斯政治仪式、司法机构、军械库与监狱串入一条并非线性的官方路线。参观由庭院和巨人阶梯进入上层议政厅，再穿越叹息桥抵达新监狱；重点应放在国家权力如何借建筑尺度、廷托列托巨画与隐蔽通道塑造观看和行动秩序。',
    orientation: [
      {
        title: '入口位于滨水柱廊一侧',
        body: '访客入口从圣马可小广场和潟湖一侧进入，先到歌剧博物馆与庭院，再向上进入宫殿主体。',
      },
      {
        title: '大议会厅是空间高点',
        body: '总督寓所与各级制度厅最终导向巨大的大议会厅；之后路线转入军械库、叹息桥和监狱。',
      },
      {
        title: '内部路线已包含叹息桥',
        body: '标准参观会通过封闭桥廊进入新监狱；行程中的“叹息桥外观”是随后从城市桥梁观察其外部的独立项目。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '由庭院、制度厅、桥廊和监狱组成的非线性宫殿路线',
      note: '节点遵循总督宫官方布局与收藏说明；这不是自绘平面图，局部关闭或分流以现场指示为准。',
      stops: [
        '歌剧博物馆与历史建筑构件',
        '中央庭院及巨人阶梯',
        '总督寓所与制度厅',
        '大议会厅',
        '军械库',
        '叹息桥内部与新监狱',
      ],
    },
    highlights: [
      {
        title: '巨人阶梯与战神、海神',
        creator: 'Antonio Rizzo；雕像由Jacopo Sansovino',
        period: '十五世纪末；雕像立于1565年',
        location: '中央庭院东侧',
        summary:
          '宽阔阶梯曾服务于总督就职等国家仪式，顶部战神与海神把威尼斯在陆地和海洋的权力转化为成对古典神像。',
        lookFor:
          '由庭院底部沿中轴向上看，比较阶梯尺度、拱廊框景和两尊雕像如何共同塑造仪式终点。',
      },
      {
        title: '《天堂》',
        creator: 'Jacopo Tintoretto 及其工坊',
        period: '1588—1592年',
        location: '大议会厅东墙',
        summary:
          '巨幅油画以密集圣徒、天使和光线旋涡覆盖会议厅端墙，既是宗教图景，也是共和国政治空间的视觉背景。',
        lookFor:
          '先从大厅远端看整体明暗漩涡，再靠近辨认中心基督与圣母；不要试图逐个人物读完。',
      },
      {
        title: '叹息桥双通道与新监狱',
        creator: 'Antonio Contino；监狱工程始于Antonio da Ponte体系',
        period: '约1600—1614年',
        location: '宫殿东侧跨越Rio di Palazzo',
        summary:
          '两条狭窄封闭通道把司法厅和新监狱连接起来，使囚犯、官员及不同方向人流可以被建筑严密分离。',
        lookFor:
          '在石格小窗处短暂停留，观察有限外景、厚重墙体和通道分叉，再比较监狱牢房的材料与宫廷厅堂。',
      },
    ],
    sequence: [
      {
        title: '从歌剧博物馆进入',
        body: '检票后先看历史柱头和建筑构件，再进入庭院，以此建立宫殿立面的雕刻语汇。',
      },
      {
        title: '由庭院登上巨人阶梯',
        body: '从阶梯底部观察战神与海神的仪式轴线，按官方单向路线前往总督寓所。',
      },
      {
        title: '依次通过制度厅',
        body: '选择性阅读权力机构功能，把重点留给厅堂之间由小到大的尺度变化。',
      },
      {
        title: '在大议会厅看整体',
        body: '先远观廷托列托《天堂》及完整厅堂，再近看局部，避免一入场就贴近画面。',
      },
      {
        title: '由军械库过桥入狱',
        body: '按路线进入军械库，再穿叹息桥到新监狱，留意宫廷装饰如何突然转为裸露石墙。',
      },
      {
        title: '返回宫殿出口',
        body: '监狱路线会经另一桥廊返回，随后按出口离开，为11:00外观观察预留时间。',
      },
    ],
    practical: [
      '4月1日至10月31日09:00—19:00开放，18:00停止入场；行程9月27日适用夏季时段。',
      '大件和笨重行李不得带入，安检与寄存应计入09:00预约前的到场时间。',
      '提香《劫掠欧罗巴》原作截至核验日正在修复，通常位置展示复制品，修复工作在Liagò房间可见。',
      '标准路线跨度大且含台阶、窄桥廊和监狱，两个小时应优先制度厅、大议会厅和桥狱段。',
    ],
    sources: [
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Visitor information',
        url: 'https://palazzoducale.visitmuve.it/en/visitor-information/',
        verifiedAt: '2026-09-02',
        note: '支持夏季开放时段、停止入场、行李规则及《劫掠欧罗巴》修复公告。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Layout and collections',
        url: 'https://palazzoducale.visitmuve.it/en/layout-and-collections/',
        verifiedAt: '2026-09-02',
        note: '支持歌剧博物馆、庭院、总督寓所、制度厅、军械库、叹息桥和监狱的官方路线关系。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Courtyard and loggias',
        url: 'https://palazzoducale.visitmuve.it/en/layout-and-collections/courtyard-and-loggias/',
        verifiedAt: '2026-09-02',
        note: '支持里佐巨人阶梯、桑索维诺战神与海神、1565年位置和仪式功能。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Prisons',
        url: 'https://palazzoducale.visitmuve.it/fr/parcours-de-visite/prisons/',
        verifiedAt: '2026-09-02',
        note: '支持叹息桥约1614年、两条封闭通道及连接司法空间和新监狱的功能。',
      },
    ],
  },
  'bridge-of-sighs': {
    overviewTitle: '连接宫殿与监狱的封闭石桥',
    originalTitle: 'Ponte dei Sospiri',
    overview:
      '此项与总督宫内部过桥体验并不相同，重点是从里奥宫河两端理解桥梁如何把哥特式宫殿和严肃的新监狱跨河连接。桥体几乎完全封闭，外部仅有两扇石格小窗；浪漫名称晚于它原本的司法交通功能，不宜只作传说式观看。',
    orientation: [
      {
        title: '桥跨Rio di Palazzo',
        body: '它位于总督宫东侧，西端接宫殿司法空间，东端接新监狱，并非跨越大运河。',
      },
      {
        title: '西面主视角在稻草桥',
        body: 'Ponte della Paglia靠近潟湖，人流最多但能同时看到总督宫、叹息桥和新监狱的连接关系。',
      },
      {
        title: '东面可由卡诺尼卡桥反看',
        body: '绕到Ponte de la Canonica可从相反方向观察桥体、运河纵深和总督宫接口，视线通常更接近桥面高度。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '里奥宫河两端的外部观察点',
      note: '节点是公共步行视点，不等同于总督宫内部路线；水面船只和人流会间歇遮挡。',
      stops: [
        'Ponte della Paglia西侧全景',
        '总督宫哥特翼与桥西端接口',
        '叹息桥中央石格窗',
        '新监狱河岸立面',
        'Ponte de la Canonica东侧反向视角',
      ],
    },
    highlights: [
      {
        title: '封闭双通道桥体',
        creator: 'Antonio Contino',
        period: '约1600—1614年',
        location: 'Rio di Palazzo上方',
        summary:
          '伊斯特拉石桥体内部被分成两条通道，外部以涡卷轮廓、小窗和浅浮雕包裹，使实用司法交通呈现纪念性外观。',
        lookFor:
          '从稻草桥寻找两扇小型石格窗、顶部曲线和桥腹开口，再想象内部并不是一条宽阔走廊。',
      },
      {
        title: '总督宫哥特翼',
        period: '十四至十五世纪',
        location: '桥西端',
        summary:
          '宫殿以低层柱廊和上部菱格墙面形成看似轻盈的外观，与十七世纪封闭桥体构成时间和结构对照。',
        lookFor:
          '观察桥体如何从宫殿实墙段伸出，而不是接在最著名的开放柱廊正面。',
      },
      {
        title: '新监狱立面',
        creator: 'Antonio da Ponte 设计体系；Antonio Contino 续建',
        period: '十六世纪末至十七世纪初',
        location: '桥东端',
        summary:
          '新监狱采用厚重规则的石砌和密集小窗，与宫殿礼仪立面截然不同，清楚表达司法建筑的控制功能。',
        lookFor:
          '从两座公共桥比较新监狱窗洞、墙体厚度和水门，辨认桥如何精确接入其上层。',
      },
    ],
    sequence: [
      {
        title: '先在稻草桥看全景',
        body: '离开总督宫后到Ponte della Paglia中部，先把宫殿、桥和监狱放入同一画面。',
      },
      {
        title: '辨认桥体细部',
        body: '放大观察石格窗、涡卷边缘和桥腹，同时回忆刚才走过的内部双通道。',
      },
      {
        title: '沿宫殿外缘绕行',
        body: '从圣马可一侧沿公共巷道绕到里奥宫河东端，不尝试进入非公众的监狱岸线。',
      },
      {
        title: '由卡诺尼卡桥反看',
        body: '从东向西观察桥体和总督宫接口，再按11:30钟楼票面时间返回广场。',
      },
    ],
    practical: [
      '两个公共外观视点都无需门票；总督宫标准票已包含桥内通道。',
      '稻草桥是高密度步行节点，拍照时不要占据整段栏杆或阻塞行李通道。',
      '卡诺尼卡桥需短距离绕行，20分钟行程应控制停留并预留返回钟楼的时间。',
    ],
    sources: [
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Prisons',
        url: 'https://palazzoducale.visitmuve.it/fr/parcours-de-visite/prisons/',
        verifiedAt: '2026-09-02',
        note: '支持桥约1614年建成、双通道、石格窗、司法交通功能及浪漫名称的后起背景。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Palazzo Ducale',
        title: 'Palazzo Ducale official guide',
        url: 'https://palazzoducale.visitmuve.it/wp-content/uploads/sites/2/2025/10/Guida-Ducale-ENG.pdf',
        verifiedAt: '2026-09-02',
        note: '支持Antonio da Ponte负责新监狱工程、Antonio Contino约1600年续建及桥连接宫殿与监狱。',
      },
    ],
  },
  'st-mark-campanile': {
    overviewTitle: '钟室上的广场与潟湖全景',
    originalTitle: 'Campanile di San Marco',
    overview:
      '钟楼高98.6米，游客由电梯抵达约60米高的钟室层，在同一环形平台辨认圣马可广场、总督宫、潟湖与城市屋顶。现存塔身是1902年倒塌后按“原处原样”原则重建的1912年版本，基座桑索维诺小凉廊则应在登塔前细看。',
    orientation: [
      {
        title: '独立矗立在广场南侧',
        body: '钟楼并不与大教堂主体相连，入口和票务也独立；应从大教堂前场辨认塔基排队区。',
      },
      {
        title: '游客只乘电梯上下',
        body: '官方票务明确访客由电梯到钟室，没有开放的徒步登塔线；行程11:30时段只允许前后约5分钟。',
      },
      {
        title: '钟室约在60米高处',
        body: '观景集中于有拱券开口的钟室层，四个方向分别对应广场、潟湖、总督宫和威尼斯屋顶。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '电梯连接的四向钟室观景层',
      note: '按官方高度和开放方式理解垂直路线；方向节点用于观察，不是额外楼层或自绘平面。',
      stops: [
        '桑索维诺小凉廊与塔基',
        '票务入口及电梯',
        '钟室南向潟湖视角',
        '钟室西向主广场视角',
        '钟室北向城市屋顶视角',
        '塔顶加百列天使风向标',
      ],
    },
    highlights: [
      {
        title: '桑索维诺小凉廊',
        creator: 'Jacopo Sansovino',
        period: '1537—1549年',
        location: '钟楼东侧塔基',
        summary:
          '小型古典建筑曾作为贵族卫队空间，立面以柱式、浮雕和密涅瓦、阿波罗、墨丘利、和平四尊青铜像组织。',
        lookFor:
          '在排队前观察四尊寓意像、中央门和石材层次，比较精细塔基与上方大面积砖塔身。',
      },
      {
        title: '五口历史功能不同的钟',
        period: '现存钟组经历多次重铸与重建',
        location: '约60米高的钟室',
        summary:
          '五口钟过去分别提示议会、处决、工作日和宗教时刻，使钟楼既是城市地标也是共和国时间管理工具。',
        lookFor:
          '比较钟的尺寸、悬挂位置和开口方向；若接近鸣钟时刻，避免长时间站在钟体正下方。',
      },
      {
        title: '1912年重建塔身与金色天使',
        period: '1902年倒塌，1912年重建开放',
        location: '塔身及金字塔形塔顶',
        summary:
          '现塔在原址恢复倒塌前外观，顶部加百列天使兼作风向标，让历史复制、城市记忆和气象功能叠合。',
        lookFor:
          '在观景开口和回到地面后各看一次塔顶，观察天使朝向及砖塔、白色钟室和绿色塔顶的分段。',
      },
    ],
    sequence: [
      {
        title: '提前到塔基核验',
        body: '从叹息桥返回广场后先找票面入口，控制在11:30前后5分钟的允许范围内。',
      },
      {
        title: '排队时看小凉廊',
        body: '利用等待时间观察桑索维诺立面和四尊青铜像，不把地面细部留到匆忙离场时。',
      },
      {
        title: '乘电梯直达钟室',
        body: '进入平台后先避开电梯出口，找到不阻塞人流的位置再开始环看。',
      },
      {
        title: '按四向建立方位',
        body: '先以圣马可广场为西向基准，再顺时针辨认潟湖、总督宫和城市屋顶。',
      },
      {
        title: '观察钟与塔顶后下行',
        body: '预留电梯排队时间，按原垂直路线离开，为12:00广场步行留出完整时段。',
      },
    ],
    practical: [
      '4月至10月通常09:30—21:15开放，20:45停止入场；礼仪、天气或维护可改变时段。',
      '11:30票面时段仅允许提前或延后约5分钟，应先完成从叹息桥返回塔基的移动。',
      '游客仅乘电梯上下，单次参观约30—40分钟；平台空间有限。',
      '包不得超过40×30×20厘米，拉杆箱不得进入；高处风力和钟声可能较强。',
    ],
    sources: [
      {
        institution: 'Procuratoria di San Marco',
        title: 'Bell Tower tickets',
        url: 'https://tickets.basilicasanmarco.it/en/product/tickets/bell-tower/2524/9691',
        verifiedAt: '2026-09-02',
        note: '支持98.6米总高、约60米钟室、电梯上下、30至40分钟、前后5分钟及行李尺寸规则。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'Bell Tower',
        url: 'https://www.basilicasanmarco.it/en/bell-tower/',
        verifiedAt: '2026-09-02',
        note: '支持1902年倒塌、1912年重建、塔体历史及加百列天使。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'The Loggia',
        url: 'https://www.basilicasanmarco.it/en/bell-tower/the-loggia/',
        verifiedAt: '2026-09-02',
        note: '支持桑索维诺小凉廊的1537至1549年年代、用途和四尊青铜寓意像。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'Ticketing FAQ',
        url: 'https://tickets.basilicasanmarco.it/en/support/faq',
        verifiedAt: '2026-09-02',
        note: '支持4月至10月钟楼常规开放和停止入场时段。',
      },
    ],
  },
  'st-mark-square': {
    overviewTitle: '从大教堂到潟湖的城市广场',
    originalTitle: 'Piazza San Marco',
    overview:
      '广场并非孤立空地，而是由圣马可大教堂、钟楼、老新行政官邸、拿破仑翼和通往潟湖的小广场共同构成的城市仪式区。步行时应追踪主广场横轴、钟塔纵向标记，以及小广场如何把政治建筑、两根石柱与水上入口连成一体。',
    orientation: [
      {
        title: '主广场东端是大教堂',
        body: '大教堂不在长轴正中，而与钟塔、总督宫共同形成复杂东端；以其立面作为回望西端的基准。',
      },
      {
        title: '西端由拿破仑翼封闭',
        body: '现今连续围合的西侧在十九世纪初才形成，内部正是科雷尔博物馆路线的起点。',
      },
      {
        title: '南侧小广场通向潟湖',
        body: 'Piazzetta位于新行政官邸、图书馆和总督宫之间，两根石柱标记共和国传统水上入口。',
      },
    ],
    spatial: {
      type: 'district',
      title: '主广场、建筑边界与潟湖入口组成的公共区域',
      note: '节点是可步行观察的城市空间；潮位、活动围栏和排队设施可能改变穿行方向。',
      stops: [
        '大教堂前场与东端复合立面',
        '圣马可钟塔和Mercerie入口',
        '钟楼及桑索维诺小凉廊',
        '老、新行政官邸长立面',
        '拿破仑翼与科雷尔入口',
        'Piazzetta双柱及潟湖水岸',
      ],
    },
    highlights: [
      {
        title: '圣马可钟塔与天文钟',
        creator: '通常归于Mauro Codussi',
        period: '1496—1499年，1499年启用',
        location: '广场东北角、Mercerie入口上方',
        summary:
          '钟塔把通往商业街的门洞、蓝金天文钟盘、圣母像和顶部敲钟铜人叠成共和国时间与城市入口标志。',
        lookFor:
          '从广场中部看钟盘、翼狮和顶部双人层级，再靠近辨认钟盘上的黄道和月相信息。',
      },
      {
        title: '拿破仑翼',
        creator: 'Giuseppe Maria Soli、Lorenzo Santi 等',
        period: '1806—1814年及其后',
        location: '主广场西端',
        summary:
          '拿破仑时期拆除原教堂并兴建新翼，使广场西端首次成为统一宫殿立面，今日内部构成科雷尔博物馆的新古典宫室。',
        lookFor:
          '站在大教堂前朝西看，比较西端中心轴和两侧行政官邸的长水平线，理解后加建筑如何完成围合。',
      },
      {
        title: '圣马可与圣特奥多罗石柱',
        period: '中世纪形成现有仪式位置',
        location: 'Piazzetta潟湖端',
        summary:
          '两柱分别承载翼狮与圣特奥多罗，构成由水面进入共和国政治中心的门框，也限定小广场向潟湖敞开的边界。',
        lookFor:
          '站在两柱靠城一侧向水面看，再转身把总督宫、图书馆和钟楼纳入同一视野。',
      },
    ],
    sequence: [
      {
        title: '从大教堂前场建立东端',
        body: '先环看大教堂、钟塔和钟楼的相对位置，再沿北侧行政官邸向西移动。',
      },
      {
        title: '在钟塔下辨认城市入口',
        body: '观察Mercerie门洞、天文钟盘和顶部铜人，然后退回广场看整座塔的垂直层级。',
      },
      {
        title: '横穿广场看西端',
        body: '沿老行政官邸到拿破仑翼，回望大教堂，比较长轴两端的非对称构图。',
      },
      {
        title: '由南侧行政官邸进入Piazzetta',
        body: '沿新行政官邸向东南移动，在图书馆和总督宫之间走向双柱。',
      },
      {
        title: '以潟湖水上入口收束',
        body: '从双柱处看水面并回望广场，随后前往西端科雷尔博物馆13:00入口。',
      },
    ],
    practical: [
      '广场和Piazzetta本身无需门票，各馆舍及钟楼、大教堂分别检票。',
      '潟湖高潮时可能铺设高架步道，现场单向安排会改变最短穿行路径。',
      '2026年威尼斯入城费试行期已于7月27日结束，9月27日无需支付或办理豁免。',
      '12:00至12:50只有50分钟，应按广场环线观察，不加入额外室内排队。',
    ],
    sources: [
      {
        institution: 'Venezia Unica, Città di Venezia',
        title: 'San Marco',
        url: 'https://www.veneziaunica.it/en/things-to-do-in-venice/venice-areas/sestieri/san-marco',
        verifiedAt: '2026-09-02',
        note: '支持圣马可广场作为城市核心及大教堂、钟楼、总督宫、行政官邸等建筑关系。',
      },
      {
        institution: "Fondazione Musei Civici di Venezia — Torre dell'Orologio",
        title: 'Building and history',
        url: 'https://torreorologio.visitmuve.it/en/il-museo/building-and-history/first-floor-2/',
        verifiedAt: '2026-09-02',
        note: '支持钟塔1499年启用、Codussi归属、天文钟和Mercerie入口功能。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Museo Correr',
        title: 'Building and history',
        url: 'https://correr.visitmuve.it/en/il-museo/museum/building-and-history/',
        verifiedAt: '2026-09-02',
        note: '支持拿破仑翼1806至1814年形成及其与行政官邸、科雷尔博物馆的关系。',
      },
      {
        institution: 'Comune di Venezia',
        title: 'Venice Access Fee 2026',
        url: 'https://cda.veneziaunica.it/en/access-fee',
        verifiedAt: '2026-09-02',
        note: '支持2026年入城费执行日期已于7月27日结束，因此9月27日不在收费日。',
      },
    ],
  },
  correr: {
    overviewTitle: '宫廷房间里的威尼斯城市史',
    originalTitle: 'Museo Correr',
    overview:
      '科雷尔博物馆从拿破仑翼的新古典宫室进入，继而转入新行政官邸中的威尼斯城市史与画廊。它不是单纯绘画馆：宫廷空间、德巴尔巴里木刻城市图和安托内罗祭坛画共同说明威尼斯如何展示自身。当前卡诺瓦收藏第三室关闭，应避开旧攻略的固定路线。',
    orientation: [
      {
        title: '入口位于拿破仑翼',
        body: '从圣马可广场西端进入，先到大阶梯、新古典宫室和舞厅，再与新行政官邸的馆线衔接。',
      },
      {
        title: '展览跨越两类建筑',
        body: '宫廷室内强调十九世纪权力与装饰，后续城市文化展区和画廊则回到威尼斯共和国的社会、地图和艺术。',
      },
      {
        title: '卡诺瓦第三室当前关闭',
        body: '官方自2025年10月29日起关闭第三室维护，因此《代达罗斯与伊卡洛斯》等旧攻略重点不作为保证可见项目。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '拿破仑翼宫室与新行政官邸馆线',
      note: '节点依据官方布局，不推定皇家宫室专线包含在普通票中；临时关闭以当天公告为准。',
      stops: [
        '拿破仑翼入口与大阶梯',
        '舞厅及新古典宫室',
        '威尼斯生活与制度展区',
        '德巴尔巴里城市图及木版',
        '绘画馆',
        '与行政官邸相连的出口段',
      ],
    },
    highlights: [
      {
        title: '拿破仑翼舞厅',
        creator: 'Lorenzo Santi；装饰由Giuseppe Borsato、Odorico Politi等',
        period: '1822—1838年',
        location: '新古典宫室序列',
        summary:
          '舞厅以成对柱列、帝国式装饰和天顶绘画组织宫廷庆典，是理解拿破仑及哈布斯堡时期广场西端改造的关键室内。',
        lookFor:
          '站到房间中心看柱列、门洞和天顶画如何对齐，再比较金色装饰与窗外古老广场的时间反差。',
      },
      {
        title: '《威尼斯鸟瞰图》及原木版',
        creator: "Jacopo de' Barbari",
        period: '1500年',
        location: '威尼斯城市文化展区',
        summary:
          '巨幅木刻以惊人的俯视精度呈现潟湖、运河和建筑密度，幸存梨木版则揭示六块版如何共同生产城市图像。',
        lookFor:
          '先找反S形大运河、圣马可和军械库，再靠近看屋顶、船只与版块接缝，并与木版反向刻纹比较。',
      },
      {
        title: '《圣母哀痛基督》',
        creator: 'Antonello da Messina',
        period: '十五世纪后期',
        location: '绘画馆',
        summary:
          '作品以油画细腻光泽、近距离半身人物和远景城市将私人哀悼与宏大受难背景结合，也是安托内罗留在威尼斯的重要作品。',
        lookFor:
          '观察基督身体与圣母面部的冷暖差异、泪光和远景空间，不要只停在戏剧性伤口。',
      },
    ],
    sequence: [
      {
        title: '按13:00时段进入拿破仑翼',
        body: '从广场西端检票并上大阶梯，先确认第三室及其他临时关闭，不寻找皇家宫室另线入口。',
      },
      {
        title: '以舞厅建立宫廷空间',
        body: '先看房间整体轴线和装饰，再顺新古典宫室前行，避免在每件家具前平均停留。',
      },
      {
        title: '转入威尼斯城市文化',
        body: '进入新行政官邸后优先寻找德巴尔巴里鸟瞰图和梨木版，联系当天真实城市路线。',
      },
      {
        title: '用画廊收束',
        body: '在绘画馆集中看安托内罗作品，再依现场导向前往出口。',
      },
      {
        title: '准时返回大教堂一侧',
        body: '14:15前完成离场，沿广场直接前往14:30圣马可大教堂套票入口。',
      },
    ],
    practical: [
      '4月1日至10月31日10:00—18:00开放，17:00停止入场；行程13:00已订。',
      '卡诺瓦收藏第三室当前维护关闭，不把该室作品纳入必看清单。',
      '皇家宫室秘密路线需提前预约并由专人带领，不属于普通75分钟路线的默认内容。',
      '大件和笨重行李不得带入；后续大教堂时段紧，应控制画廊停留。',
    ],
    sources: [
      {
        institution: 'Fondazione Musei Civici di Venezia — Museo Correr',
        title: 'Visitor information',
        url: 'https://correr.visitmuve.it/en/visitor-information/',
        verifiedAt: '2026-09-02',
        note: '支持夏季开放、停止入场、行李规则、卡诺瓦第三室关闭和皇家宫室需另约信息。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Museo Correr',
        title: 'Layout and collections',
        url: 'https://correr.visitmuve.it/en/layout-and-collections/',
        verifiedAt: '2026-09-02',
        note: '支持拿破仑翼新古典宫室、行政官邸城市文化区及绘画馆之间的官方路线关系。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Museo Correr',
        title: 'Canova Collection guide',
        url: 'https://correr.visitmuve.it/wp-content/uploads/2020/12/DOWNLOADS-Collezione-Canoviana-del-Museo-Correr-ENG-2020.pdf',
        verifiedAt: '2026-09-02',
        note: '支持舞厅由Lorenzo Santi设计、1822年空间及Borsato与Politi后续装饰。',
      },
      {
        institution: 'Fondazione Musei Civici di Venezia — Museo Correr',
        title: 'The Picture Gallery',
        url: 'https://correr.visitmuve.it/percorsi-e-collezioni/la-quadreria/',
        verifiedAt: '2026-09-02',
        note: '支持安托内罗《圣母哀痛基督》在绘画馆及其为画家留在威尼斯的重要作品。',
      },
    ],
  },
  'st-mark-basilica': {
    overviewTitle: '金色马赛克、祭坛与青铜驷马',
    originalTitle:
      "Basilica di San Marco — Pala d'Oro, Museo e Loggia dei Cavalli",
    overview:
      '全套票将主教堂、黄金祭坛、博物馆和圣马可马廊连成明确路线：由前厅《创世纪》穹顶进入金色马赛克空间，在主祭坛后看拜占庭珐琅祭屏，再登楼近看古代青铜驷马并从外廊俯视广场。它不包含钟楼，两个项目须独立检票。',
    orientation: [
      {
        title: '由圣彼得门进入',
        body: '官方套票路线从Porta San Pietro进入前厅，依次通过《创世纪》穹顶和主堂，不应走普通免费祈祷入口。',
      },
      {
        title: '黄金祭坛在主祭坛后',
        body: "Pala d'Oro不是独立建筑，而是主祭坛后方的珍贵祭屏，需要在主堂路线中再次核验套票权限。",
      },
      {
        title: '博物馆和马廊在上层',
        body: '参观黄金祭坛后由Foresti楼梯登上前厅上层，进入博物馆并到外部马廊；钟楼不在这条路线内。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '由前厅、主堂、祭坛和上层博物馆组成的官方套票路线',
      note: '节点直接采用官方套票说明，不另造教堂平面；礼拜、维护和人流可改变局部停留方式。',
      stops: [
        '圣彼得门与前厅',
        '《创世纪》穹顶',
        '主堂中轴与金色马赛克穹顶',
        '主祭坛及黄金祭坛',
        'Foresti楼梯与上层博物馆',
        '原青铜驷马与圣马可马廊',
      ],
    },
    highlights: [
      {
        title: '《创世纪》穹顶马赛克',
        period: '十三世纪为主',
        location: '前厅北侧路线起段',
        summary:
          '金地马赛克以同心环带叙述创造世界、亚当夏娃及其后续故事，把访客从外部城市空间带入圣经历史。',
        lookFor:
          '从穹顶中心向外按环带阅读，辨认造物主重复形象、时间分段和金地如何反射入口自然光。',
      },
      {
        title: '黄金祭坛',
        creator: '拜占庭及威尼斯多代金匠',
        period: '1102—1345年多阶段形成',
        location: '主祭坛后方',
        summary:
          '大型金银祭屏集合约250块珐琅和1927颗宝石，以基督、天使、圣人和圣马可故事构成密集神圣等级。',
        lookFor:
          '先看中央基督与上下层级，再近看掐丝珐琅人物和宝石镶嵌，不要只把整体当成金色表面。',
      },
      {
        title: '原镀金青铜驷马',
        creator: '作者与希腊或罗马确切来源未定',
        period: '古代作品，十三世纪后进入圣马可体系',
        location: '上层圣马可博物馆；立面所见为复制品',
        summary:
          '四匹大型古代青铜马是极少见的古代驷马遗存，原件移入博物馆保护，外立面马廊则陈列复制品。',
        lookFor:
          '近看原件颈部接合、镀金残留和人为刻痕，再到马廊比较复制品与广场、钟楼的原始展示关系。',
      },
    ],
    sequence: [
      {
        title: '按14:30套票窗口到圣彼得门',
        body: '从科雷尔离场后直接到票面指定入口，准备电子票并遵守前后15分钟的入场宽限。',
      },
      {
        title: '由前厅读取《创世纪》',
        body: '先在穹顶下按环带看叙事，再进入主堂，避免在入口拥堵处停留过久。',
      },
      {
        title: '沿主堂到主祭坛',
        body: '观察金色马赛克、柱材和中央穹顶，按单向围栏走向高祭坛区域。',
      },
      {
        title: '核验并观看黄金祭坛',
        body: '在主祭坛后出示套票权限，先整体看图像等级，再选择几组珐琅近看。',
      },
      {
        title: '登楼进入博物馆',
        body: '由Foresti楼梯上行，重点看原青铜驷马及建筑马赛克近景。',
      },
      {
        title: '以马廊俯瞰广场收束',
        body: '从外廊比较复制马群、广场和钟楼，随后按上层出口路线离开。',
      },
    ],
    practical: [
      '9月27日为周日，主教堂及黄金祭坛现行开放为14:00—17:15，16:45停止入场；14:30预约适用。',
      '全套票入场允许票面时间前后15分钟；它包含主堂、黄金祭坛、博物馆和马廊，但不含钟楼。',
      '肩膝须遮盖；包不得超过40×30×20厘米，拉杆箱不得进入。',
      '宗教仪式和安全管理可能限制拍摄、停留或局部通行，现场礼仪要求优先。',
    ],
    sources: [
      {
        institution: 'Procuratoria di San Marco',
        title: "Basilica, Pala d'Oro, Museum and Loggia dei Cavalli tickets",
        url: 'https://tickets.basilicasanmarco.it/en/product/tickets/basilica-s-marco-pala-d-oro-museum-loggia-cavalli/2524/9690',
        verifiedAt: '2026-09-02',
        note: '支持套票范围、圣彼得门至《创世纪》穹顶、黄金祭坛、Foresti楼梯、博物馆和马廊的官方路线，以及宽限和行李着装规则。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'Ticketing FAQ',
        url: 'https://tickets.basilicasanmarco.it/en/support/faq',
        verifiedAt: '2026-09-02',
        note: '支持周日主教堂与黄金祭坛14:00至17:15、16:45停止入场，以及博物馆周日上午可独立开放。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'The Golden Pala',
        url: 'https://www.basilicasanmarco.it/en/the-golden-pala/',
        verifiedAt: '2026-09-02',
        note: '支持黄金祭坛1102至1345年多阶段、约250块珐琅、1927颗宝石及主祭坛后方位置。',
      },
      {
        institution: 'Procuratoria di San Marco',
        title: 'The decoration of the façades',
        url: 'https://www.basilicasanmarco.it/en/sculpture/the-decoration-of-the-facades/',
        verifiedAt: '2026-09-02',
        note: '支持古代青铜驷马原件与立面复制品的区分及其历史展示背景。',
      },
    ],
  },
  rialto: {
    overviewTitle: '横跨大运河的石拱商街',
    originalTitle: 'Ponte di Rialto',
    overview:
      '现存石桥由安东尼奥·达·庞特在十六世纪末建成，以单一大拱跨越大运河，两排店铺夹出中央阶梯街，两侧外阶则提供不同方向的运河视野。观看重点是桥作为商业街、工程结构和城市观景点三种角色如何在同一狭窄构筑物上叠合。',
    orientation: [
      {
        title: '桥连接两个城区',
        body: '东侧通向圣马可区和Campo San Bartolomeo，西侧进入圣保罗区及里亚托市场。',
      },
      {
        title: '中央通道穿过商店',
        body: '两排店铺之间是一条中央阶梯街，桥外缘另有两条阶梯，因此桥面实际形成三条平行路径。',
      },
      {
        title: '两侧栏杆看不同河段',
        body: '北侧面向德国商馆和市场，南侧看向Palazzo Barzizza、Riva del Vin及下游宫殿。',
      },
    ],
    spatial: {
      type: 'site',
      title: '单拱石桥、三条阶梯路与两侧观景栏',
      note: '桥体可自由步行但没有无台阶横越线；节点描述桥面真实组成，不替代周边街巷导航。',
      stops: [
        '圣马可侧桥头',
        '中央阶梯店街',
        '南侧外阶与栏杆',
        '桥顶最高点',
        '北侧外阶与市场视野',
        '圣保罗侧市场桥头',
      ],
    },
    highlights: [
      {
        title: '单一伊斯特拉石大拱',
        creator: 'Antonio da Ponte',
        period: '十六世纪末，约1590年建成',
        location: '大运河里亚托河段',
        summary:
          '桥以单拱替代早期木桥，在繁忙水道上同时承载商铺和人流，是工程结构与城市商业基础设施的结合。',
        lookFor:
          '从两岸而非桥面观察完整拱腹、桥台和船只尺度，理解看似厚重店街如何由一个拱跨托起。',
      },
      {
        title: '两排店铺与三条步行线',
        creator: 'Antonio da Ponte',
        period: '十六世纪末',
        location: '桥面',
        summary:
          '商铺沿桥中部排成两列，夹出中央街并留下两条靠栏杆的外侧阶梯，使商业经营与过桥交通并行。',
        lookFor:
          '在桥顶横向观察中央路、店铺屋顶和两侧外路的高度关系，留意开口如何连接三条路径。',
      },
      {
        title: '北向里亚托商业景观',
        period: '十三至十六世纪长期形成',
        location: '桥北侧栏杆',
        summary:
          '德国商馆、卡梅伦吉宫和里亚托市场集中在北侧两岸，显示桥并非孤立地标而是城市金融与贸易区的核心。',
        lookFor:
          '辨认东岸德国商馆的大体量和西岸卡梅伦吉宫多面立面，再观察市场岸线与船运关系。',
      },
    ],
    sequence: [
      {
        title: '由圣马可侧登桥',
        body: '从Campo San Bartolomeo方向靠近，先在桥脚看商铺和阶梯如何同时上升。',
      },
      {
        title: '穿过中央店街',
        body: '沿中央路径上行，观察两列商铺和横向开口，不在最窄处停留。',
      },
      {
        title: '桥顶分别看南北',
        body: '先到一侧外栏看下游，再横向移到北侧辨认德国商馆、卡梅伦吉宫和市场。',
      },
      {
        title: '从圣保罗侧下桥',
        body: '沿外阶进入市场岸，从低处回看桥拱，为下一项大运河步行观察建立对照。',
      },
    ],
    practical: [
      '桥面和两岸视点免费开放，但桥体全程是阶梯，没有无台阶横越通道。',
      '下午与日落前后人流密集，中央店街和桥顶开口不可长时间占用。',
      '行程只安排15分钟，应完成一次过桥和两向观察，不加入店铺购物。',
    ],
    sources: [
      {
        institution: 'Comune di Venezia',
        title: 'Rialto',
        url: 'https://www.comune.venezia.it/it/content/rialto',
        verifiedAt: '2026-09-02',
        note: '支持安东尼奥·达·庞特、十六世纪末石桥、两排店铺、中央和外侧阶梯结构。',
      },
      {
        institution: 'Comune di Venezia',
        title: 'Rialto Market',
        url: 'https://www.comune.venezia.it/it/content/rialto-mercato',
        verifiedAt: '2026-09-02',
        note: '支持单石拱桥与里亚托市场历史商业区域的关系。',
      },
    ],
  },
  'grand-canal': {
    overviewTitle: '里亚托两岸的运河商业史',
    originalTitle: 'Canal Grande',
    overview:
      '大运河约3.8公里，以反S形贯穿威尼斯主岛。此行程仅给45分钟且紧邻里亚托，最可靠的体验是步行比较桥上高视点与市场两岸的水面视点，不应虚构完整船线。里亚托一带的德国商馆、卡梅伦吉宫和旧市场建筑足以浓缩运河的商业史。',
    orientation: [
      {
        title: '反S形连接城市两端',
        body: '大运河北端接近圣卢西亚车站和罗马广场水域，南端汇入圣马可湾，宽度随河段变化。',
      },
      {
        title: '本次只观察里亚托河段',
        body: '行程从里亚托桥直接开始，45分钟没有预订船程，因此内容集中在桥上和市场两岸的公共视点。',
      },
      {
        title: '桥北侧最能读商业史',
        body: '德国商馆位于东岸，卡梅伦吉宫与市场建筑位于西岸，三者围绕桥和船运节点展开。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '里亚托桥与两岸构成的步行观察段',
      note: '不预设贡多拉或水上巴士路线；水面、登船点和建筑可见度受交通及潮位影响。',
      stops: [
        '里亚托桥北侧高视点',
        '德国商馆河岸立面',
        '卡梅伦吉宫桥脚立面',
        '里亚托市场与Erbaria岸线',
        'Riva del Vin近水视点',
        '桥南侧下游河景',
      ],
    },
    highlights: [
      {
        title: '德国商馆',
        period: '1506—1508年火灾后重建',
        location: '大运河东岸、里亚托桥北侧',
        summary:
          '这座五层大型商馆曾容纳约两百个房间和内院，是德语商人在威尼斯受集中管理、居住和贸易的关键设施。',
        lookFor:
          '从桥北侧看其宽阔河岸面和规则窗列，再从地面寻找入口与中央庭院体量的外部线索。',
      },
      {
        title: '卡梅伦吉宫',
        creator: 'Guglielmo dei Grigi',
        period: '1525—1528年',
        location: '大运河西岸、里亚托桥北侧桥脚',
        summary:
          '共和国财政官署适应三角形地块形成多面立面，位置紧贴桥和市场，使税收、司法与商业空间彼此可见。',
        lookFor:
          '从桥上和市场岸各看一次，观察建筑尖锐转角、规则窗列及首层如何贴合繁忙水岸。',
      },
      {
        title: '旧市场建筑',
        creator: 'Antonio Abbondi, called Scarpagnino',
        period: '1520—1522年',
        location: '里亚托市场西岸',
        summary:
          '火灾后重建的市场建筑以连续拱廊和可重复铺位重整贸易岸线，把日常销售纳入统一公共建筑框架。',
        lookFor:
          '沿岸观察拱廊节奏、摊位尺度和装卸水面，理解市场建筑如何同时服务步行与船运。',
      },
    ],
    sequence: [
      {
        title: '从桥北栏建立全景',
        body: '先在高处辨认德国商馆、卡梅伦吉宫和市场岸线，再选择西岸下桥。',
      },
      {
        title: '在桥脚看卡梅伦吉宫',
        body: '从较低位置观察其转角、窗列和桥台关系，比较高低视点造成的体量变化。',
      },
      {
        title: '沿市场岸走到Erbaria',
        body: '经过旧市场拱廊，留意货运水面和公共登船点，不阻塞装卸及候船区域。',
      },
      {
        title: '转到Riva del Vin或桥南',
        body: '时间允许时回到桥南侧近水位置，观察下游宫殿立面和船流。',
      },
      {
        title: '按17:00前往车站',
        body: '16:55左右结束观察，依原行程前往车站，不把临时乘船加入这段45分钟。',
      },
    ],
    practical: [
      '本项目本身不包含水上交通；水上巴士、贡多拉或其他船程都需另行安排和付费。',
      '公共桥面和河岸免费，登船站、装卸口及紧急通道必须保持畅通。',
      '潮位、船流和停泊船只会改变近水视线，建筑识别应结合桥上和岸边两个高度。',
      '17:00需前往车站，45分钟内不尝试覆盖3.8公里完整运河。',
    ],
    sources: [
      {
        institution: 'Comune di Venezia',
        title: 'Piano Comunale delle Acque — Analisi generale',
        url: 'https://www.comune.venezia.it/sites/default/files/flex/files/9/3/9/D.a9c951212cadf722c78e/PCE_Parte_Prima_Analisi_generale.pdf',
        verifiedAt: '2026-09-02',
        note: '支持大运河约3.8公里、约30至70米宽、反S形及连接车站一带与圣马可湾。',
      },
      {
        institution: 'Comune di Venezia',
        title: "Il Mercato di Rialto: la ricostruzione dopo l'incendio",
        url: 'https://live.comune.venezia.it/it/2025/04/il-mercato-di-rialto-la-ricostruzione-dopo-lincendio',
        verifiedAt: '2026-09-02',
        note: '支持卡梅伦吉宫1525至1528年、建筑师Guglielmo dei Grigi，以及Scarpagnino市场建筑1520至1522年。',
      },
      {
        institution: 'Comune di Venezia',
        title: 'Fondaco dei Tedeschi',
        url: 'https://live.comune.venezia.it/it/node/125074',
        verifiedAt: '2026-09-02',
        note: '支持德国商馆1506至1508年重建、五层、约两百个房间及里亚托贸易功能。',
      },
    ],
  },
  fenice: {
    overviewTitle: '两次火灾后的凤凰剧院',
    originalTitle: 'Teatro La Fenice',
    overview:
      '凤凰歌剧院1792年开幕，经历1836与1996年两次大火后重建，今日内部以恢复历史观感为原则呈现。参观重点在塞尔瓦的入口体系、马蹄形观众厅、皇家包厢与阿波罗厅，而非把现存装饰误认成未经中断保存的十八世纪原物。',
    orientation: [
      {
        title: '陆路入口在Campo San Fantin',
        body: '普通访客从圣凡丁广场进入新古典立面；剧院另有面向运河的传统水门，开放可见范围依当天路线。',
      },
      {
        title: '观众厅经过多次重建',
        body: '1792年原作、1837年火后重建和2003年再开放共同塑造现貌，判断年代时要区分设计传统与现存材料。',
      },
      {
        title: '参观服从舞台工作',
        body: '自助参观通常开放，但演出、排练、布景和技术工作可缩短时段或关闭观众厅部分视线。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '陆门、马蹄形观众厅与附属沙龙',
      note: '节点依据剧院公开参观空间；后台、舞台和水门是否进入路线不作保证。',
      stops: [
        'Campo San Fantin陆路立面',
        '入口门厅与主楼梯',
        '马蹄形观众厅',
        '皇家包厢视线轴',
        'Sale Apollinee沙龙组',
        '开放时可见的运河水门',
      ],
    },
    highlights: [
      {
        title: '塞尔瓦的新古典剧院构想',
        creator: 'Giannantonio Selva',
        period: '1790—1792年',
        location: '圣凡丁广场立面、入口体系与原观众厅设计',
        summary:
          '塞尔瓦以克制的新古典陆门连接复杂城市地块和华丽观众厅，并保留从运河抵达的威尼斯剧院传统。',
        lookFor:
          '先从广场看低调立面和入口尺度，再入内比较外部克制与观众厅装饰的强烈反差。',
      },
      {
        title: '马蹄形五层包厢观众厅',
        creator: 'Meduna家族重建传统；2003年按历史形象复原',
        period: '1837年重建、1854年改装，1996年后再复原',
        location: '剧院核心观众厅',
        summary:
          '层叠包厢围绕舞台形成紧密马蹄形空间，现貌重新呈现十九世纪洛可可式视觉效果，同时服务现代舞台技术。',
        lookFor:
          '从历史包厢看皇家包厢中轴、舞台镜框和层间曲线，辨认重复装饰如何扩大并统一空间。',
      },
      {
        title: '皇家包厢',
        creator: 'Giuseppe Borsato 等',
        period: '1837年后形成的十九世纪装饰体系',
        location: '观众厅正中轴',
        summary:
          '皇家包厢把原有多个包厢合并为权力中心，以镀金、镜面和开阔视线强化舞台与观众厅的等级轴线。',
        lookFor:
          '从侧面包厢先定位皇家包厢，再观察它的宽度、顶部装饰和与舞台正中的精确对齐。',
      },
    ],
    sequence: [
      {
        title: '当天先检查参观日历',
        body: '此项为未预约备选，出发前确认歌剧院当天自助参观时段和观众厅是否受排练影响。',
      },
      {
        title: '从圣凡丁广场看立面',
        body: '入场前观察塞尔瓦陆门和狭小广场比例，再进入门厅。',
      },
      {
        title: '由历史包厢看观众厅',
        body: '按开放路线进入包厢，先看整体马蹄形、皇家包厢和舞台轴线，再观察装饰。',
      },
      {
        title: '继续至阿波罗厅',
        body: '比较公共沙龙和观众厅的功能、尺度及火灾后复原方式。',
      },
      {
        title: '开放时以水门收束',
        body: '若路线允许，最后观察运河入口；不进入后台或受限舞台区域。',
      },
    ],
    practical: [
      '自助参观通常每日09:30—18:00，但演出、排练和技术安排会实时改变开放。',
      '该项目是未订备选，不能用常规时段保证9月27日一定有完整观众厅路线。',
      '观众厅内禁止摄影；其他区域也应服从当天工作人员指示。',
      '官方语音导览可用于短线参观，行程若启用此备选仍须保留前往车站的时间。',
    ],
    sources: [
      {
        institution: 'Fondazione Teatro La Fenice',
        title: 'Prepare your visit',
        url: 'https://www.teatrolafenice.it/en/prepare-your-visit/',
        verifiedAt: '2026-09-02',
        note: '支持通常09:30至18:00自助参观、语音导览及开放受艺术和技术安排影响。',
      },
      {
        institution: 'Fondazione Teatro La Fenice',
        title: 'La Fenice and Malibran history',
        url: 'https://www.teatrolafenice.it/en/la-fenice-foundation/la-fenice-malibran-history/',
        verifiedAt: '2026-09-02',
        note: '支持塞尔瓦设计、1792年开幕、1836和1996年火灾、1837及2003年重建开放历史。',
      },
      {
        institution: 'Fondazione Teatro La Fenice',
        title: 'Tickets and information',
        url: 'https://www.teatrolafenice.it/en/ticket-and-info/',
        verifiedAt: '2026-09-02',
        note: '支持参观票务、当天时段需复核及观众厅摄影限制。',
      },
    ],
  },
  'accademia-venice': {
    overviewTitle: '从金地圣像到威尼斯色彩',
    originalTitle: "Gallerie dell'Accademia di Venezia",
    overview:
      '学院美术馆系统收藏十四至十八世纪威尼斯绘画，官方空间横跨首层与底层共37室。短时备选路线可围绕乔尔乔内的谜样景观、委罗内塞面对宗教审查后的宴席画，以及提香为原建筑空间创作的大幅圣母题材展开，并始终服从当天房间调整。',
    orientation: [
      {
        title: '入口临学院桥南端',
        body: '博物馆位于大运河南岸Campo della Carità建筑群，不能与桥北侧街巷中的佩姬·古根海姆收藏馆混淆。',
      },
      {
        title: '馆线横跨两个楼层',
        body: '官方地图列底层13室、首层24室；实际参观顺序依入口楼梯和当日箭头，不按简单数字升序。',
      },
      {
        title: '作品和房间会调整',
        body: '大型画作可能因保护、借展或工程临时移动，指南只使用官方现行地图定位，并要求现场复核。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '首层历史大厅与底层展室组成的37室馆线',
      note: '节点来自官方地图，不重绘楼层；第二十三室等维护状态及作品位置以现场公告为准。',
      stops: [
        'Campo della Carità入口与票务',
        '首层第二十四室提香',
        '首层第八室乔尔乔内',
        '首层第十室委罗内塞',
        '后续威尼斯绘画展室',
        '底层展室及出口',
      ],
    },
    highlights: [
      {
        title: '《圣母进殿》',
        creator: 'Tiziano Vecellio',
        period: '1534—1538年',
        location: '第二十四室，原慈善会大厅',
        summary:
          '提香为房间原有位置创作横向巨画，以宏大阶梯、城市建筑和微小的圣母形象把宗教叙事嵌入真实会议空间。',
        lookFor:
          '退到房间远端看画面阶梯如何延续建筑尺度，再寻找阶梯上的小圣母、左侧群众和右侧老妇。',
      },
      {
        title: '《暴风雨》',
        creator: 'Giorgione',
        period: '约1506—1508年',
        location: '第八室',
        summary:
          '闪电、废墟、溪流、站立男子和哺乳女子构成无法被唯一解释的景观，是威尼斯绘画把天气与情绪置于叙事中心的代表。',
        lookFor:
          '先看天空闪电和水面冷光，再比较两个人物互不相交的视线，注意远景城市并非纯粹背景。',
      },
      {
        title: '《利未家中的宴会》',
        creator: 'Paolo Veronese',
        period: '1573年',
        location: '第十室',
        summary:
          '巨幅宴席画原题《最后的晚餐》，画家在宗教审查后通过改题保留小丑、异国服饰者、士兵和华丽建筑。',
        lookFor:
          '先用建筑三拱定位基督，再寻找审查记录所关注的边缘人物，理解改题如何改变文本而非画面。',
      },
    ],
    sequence: [
      {
        title: '先核验备选可行性',
        body: '确认当天仍有至少75分钟参观和前往车站时间，再通过唯一授权渠道或现场票务取得入场资格。',
      },
      {
        title: '按官方箭头上首层',
        body: '领取当日地图并检查关闭房间，先到第二十四室看提香与原建筑空间关系。',
      },
      {
        title: '转入第八室看乔尔乔内',
        body: '沿开放路线前往《暴风雨》，集中观察景观、光线和人物关系。',
      },
      {
        title: '在第十室看委罗内塞',
        body: '预留较远观看距离，先看整幅建筑构图，再寻找宴席边缘人物。',
      },
      {
        title: '依时间选择后段或离场',
        body: '有余裕才进入后续展室和底层；接近出发时间时按最短官方出口离开。',
      },
    ],
    practical: [
      '周二至周日09:00—19:00开放，18:00停止售票；9月27日周日适用。',
      'TicketOne是官方列出的唯一授权线上售票渠道，其他转售来源不应作为保证。',
      '背包等物品不得带入展厅，馆方提供免费寄存柜。',
      '第二十三室截至核验日因保护工程关闭；房间和作品位置必须以当日地图复核。',
    ],
    sources: [
      {
        institution: "Gallerie dell'Accademia di Venezia",
        title: 'Opening hours and tickets',
        url: 'https://www.gallerieaccademia.it/en/visit/opening-hours-and-tickets/',
        verifiedAt: '2026-09-02',
        note: '支持周二至周日09:00至19:00、18:00停止售票、TicketOne唯一授权及免费寄存规则。',
      },
      {
        institution: "Gallerie dell'Accademia di Venezia",
        title: 'Official museum map',
        url: 'https://www.gallerieaccademia.it/themes/custom/accademia/images/Map_gallerie.pdf',
        verifiedAt: '2026-09-02',
        note: '支持底层13室、首层24室及提香、乔尔乔内、委罗内塞的官方房间位置；本指南未另造平面图。',
      },
      {
        institution: "Gallerie dell'Accademia di Venezia",
        title: 'Room XXIV',
        url: 'https://www.gallerieaccademia.it/en/esps-opera-sala/room-xxiv/',
        verifiedAt: '2026-09-02',
        note: '支持提香《圣母进殿》在原慈善会大厅的空间关系。',
      },
      {
        institution: "Gallerie dell'Accademia di Venezia",
        title: 'Room XXIII',
        url: 'https://www.gallerieaccademia.it/en/esps-opera-sala/room-xxiii/',
        verifiedAt: '2026-09-02',
        note: '支持第二十三室因保护工程关闭的当前状态。',
      },
    ],
  },
  gondola: {
    overviewTitle: '水面低视角里的威尼斯',
    originalTitle: 'Servizio pubblico di gondola',
    overview:
      '贡多拉体验的价值在接近水面的低视角、单桨操船及小运河转向，而非一条固定景点线路。官方价格只规定基础时长，实际路线会受登船站、潮汐、交通与天气影响；因此应在上船前明确是否经过大运河、计划桥段以及返回原站或异地结束。',
    orientation: [
      {
        title: '只在官方贡多拉站登船',
        body: '圣马可、Danieli、San Beneto、Rialto及Carbon等区域均有市政府列出的stazi，先看现场标识和排队秩序。',
      },
      {
        title: '路线不是统一产品',
        body: '基础费规定时间而非固定景点，航线由登船站、交通、潮位和现场协商共同决定。',
      },
      {
        title: '通常围绕起点形成短环线',
        body: '是否进入大运河、经过哪座桥及是否异地结束都应在登船前确认，不能根据宣传照片推定。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '随船移动的低水位观察序列',
      note: '节点描述任何合规短程都可辨认的阶段，不承诺特定宫殿或运河；实际路线以登船前约定为准。',
      stops: [
        '官方登船站与计价标识',
        '起航后的狭窄支渠',
        '桥洞下方的低角度视野',
        '宫殿水门与墙基',
        '条件允许时的较宽水面或大运河片段',
        '原站或约定终点',
      ],
    },
    highlights: [
      {
        title: '非对称黑色船体',
        period: '数百年工艺演化形成现制式',
        location: '整艘贡多拉',
        summary:
          '约11米长的船体并非左右对称，其弯曲和配重帮助抵消船夫只在一侧以单桨推进造成的转向。',
        lookFor:
          '登船前从岸上看船首、船尾和船身中线，再在航行中观察船夫如何用不同桨法保持直行和转弯。',
      },
      {
        title: '船首铁饰与叉桨架',
        creator: '由传统squerari和专门工匠制作',
        period: '传统构件延续至今',
        location: '船首ferro与船尾forcola',
        summary:
          '金属船首饰兼有配重与识别作用，木制叉桨架则以多个接触位置支持前进、减速、转向和倒船。',
        lookFor:
          '比较铁饰的垂直齿形和叉桨架的不规则曲面，观察桨在不同凹口间移动时船速与方向如何变化。',
      },
      {
        title: '桥下与宫殿水门的水面视角',
        location: '实际航线沿途',
        summary:
          '低座位让桥拱、潮痕、石墙基和直接面水的历史入口进入同一视线，这是步行岸线最难获得的观看高度。',
        lookFor:
          '经过桥洞时抬头看拱腹和净高，离开后回看水门台阶、潮位线及墙体材料，而非只拍远处天际线。',
      },
    ],
    sequence: [
      {
        title: '选择官方站点',
        body: '在圣马可或里亚托附近寻找市政府列出的stazio及统一价格牌，不接受无明确站点和计价的招揽。',
      },
      {
        title: '登船前确认四件事',
        body: '明确日间或夜间价格、基础时长、是否经过大运河以及返回地点；加时或指定路线另行谈妥。',
      },
      {
        title: '按船夫指示稳定登船',
        body: '逐人低姿态进入并保持座位分配，不在船体摇摆时站立换位。',
      },
      {
        title: '先观察小运河操船',
        body: '留意单桨、叉桨架和船体如何通过窄弯及桥洞，再在较宽水面观察宫殿立面。',
      },
      {
        title: '按约定返站并结算',
        body: '接近基础时长时确认返航方向，到岸后依船夫指示逐一下船并按事先确认的费用付款。',
      },
    ],
    practical: [
      '09:00—19:00统一基础价为90欧元、30分钟；19:00—04:00为110欧元、35分钟。',
      '每艘最多5名乘客；基础时长会因潮汐、天气和水上交通有所变化。',
      '指定路线、延长时间或演唱等附加服务应在登船前确认价格，不能从基础费推定包含。',
      '该项目是现场决定的备选；若需17:00前往车站，不应在16:25之后临时加入完整船程。',
    ],
    sources: [
      {
        institution: 'Comune di Venezia',
        title: 'Il servizio pubblico di gondola',
        url: 'https://www.comune.venezia.it/it/node/16768',
        verifiedAt: '2026-09-02',
        note: '支持日间90欧元30分钟、夜间110欧元35分钟、最多5人、时长受潮汐天气交通影响及官方站点列表。',
      },
      {
        institution: 'Venezia Unica, Città di Venezia',
        title: 'Useful information — Gondola fares',
        url: 'https://www.veneziaunica.it/en/plan-your-trip/useful-information?language=en',
        verifiedAt: '2026-09-02',
        note: '交叉核验基础价格、日夜时段、基础时长和最多5名乘客。',
      },
      {
        institution: 'Comune di Venezia',
        title: 'Nuovo regolamento del servizio pubblico di gondola',
        url: 'https://live.comune.venezia.it/it/2025/04/libera-dal-consiglio-comunale-al-nuovo-regolamento-il-servizio-pubblico-di-gondola',
        verifiedAt: '2026-09-02',
        note: '支持公共贡多拉服务的现行市政监管、最多5人及船夫职业要求。',
      },
    ],
  },
});
