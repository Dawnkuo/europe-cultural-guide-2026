import { defineGuideContent } from './types';

export const barcelonaGuideContent = defineGuideContent({
  'sagrada-familia': {
    overviewTitle: '树状立柱、彩光与三座立面',
    originalTitle: 'Basílica de la Sagrada Família',
    overview:
      '圣家堂是一座仍在建造中的宗座圣殿，也是一套由结构、光线、雕塑和礼仪共同完成的空间叙事。高迪把承重柱发展成向上分叉的树状体系，让中殿像一片被彩色阳光穿透的森林；三座立面则分别围绕诞生、受难与荣耀展开。此次参观把圣殿本体与受难立面塔合并理解：先在地面建立建筑全貌，再从塔楼观察石构细节与巴塞罗那城市网格。',
    orientation: [
      {
        title: '从诞生立面进入',
        body: '个人访客入口位于 Carrer de la Marina 一侧的诞生立面；先确认入口与安检队列，不要误走到受难立面。',
      },
      {
        title: '用三立面定位',
        body: '诞生立面朝东北、受难立面朝西南，尚在推进的荣耀立面朝向 Carrer de Mallorca；三者承担不同的叙事主题。',
      },
      {
        title: '塔楼是单向垂直路线',
        body: '受难立面塔面向市中心，通常乘电梯上升、沿楼梯步行下降，并在回到地面后继续圣殿参观。',
      },
    ],
    spatial: {
      type: 'site',
      title: '圣殿建筑群与受难立面塔',
      note: '按地面圣殿、垂直塔楼、地面展陈三个层次理解；塔楼开放及实际动线受天气和现场管理影响。',
      stops: [
        '诞生立面与 Marina 街个人入口',
        '中殿树状柱林与彩色玻璃',
        '后殿及交叉部的结构汇聚处',
        '受难立面塔的电梯、步行下塔段与城市视野',
        '受难立面雕塑群',
        '博物馆与高迪学校建筑',
      ],
    },
    highlights: [
      {
        title: '树状双扭柱与彩窗',
        summary:
          '柱子像树干般向上分叉，将荷载导向基础，并与东西两侧不同色温的玻璃共同塑造中殿。',
        lookFor:
          '从中殿中央向上看柱身截面和分叉方向，再转身比较暖色与冷色光落在石材上的变化。',
      },
      {
        title: 'Subirachs 的受难立面',
        creator: 'Josep Maria Subirachs',
        summary:
          '受难故事被处理成棱角鲜明、近乎削切的雕塑群，与诞生立面的繁复自然主义形成强烈对照。',
        lookFor:
          '辨认人物被压缩的面部、倾斜构图与十字架周围的留白，观察紧张感如何由体块而非装饰产生。',
      },
      {
        title: '受难塔的石构取景框',
        summary:
          '塔楼开口把 Eixample 网格和市中心景观切分成连续画面，也让访客近距离看到塔身的几何与施工尺度。',
        lookFor:
          '不要只看远景；同时观察开口边缘、塔身倾角以及相邻构件如何在近距离交叠。',
      },
    ],
    sequence: [
      {
        title: '13:00 到达并安检',
        body: '在 Marina 街确认个人入口，提前打开电子票和官方 App，为 13:15 入场留出安检时间。',
      },
      {
        title: '先建立地面全貌',
        body: '从中殿中央观察柱林和彩窗，再走向后殿与交叉部，不在入口雕塑处耗尽塔前时间。',
      },
      {
        title: '14:00 衔接受难塔',
        body: '按票面要求到塔口报到，将背包放入指定储物柜，乘电梯上塔后沿楼梯下降。',
      },
      {
        title: '回到地面看受难立面',
        body: '下塔后从室内和外部各看一次受难立面，把近距离石构与完整雕塑叙事对应起来。',
      },
      {
        title: '用博物馆收束',
        body: '若时间允许，最后查看模型、施工方法与历史材料，再从已开放出口离开建筑群。',
      },
    ],
    practical: [
      '行程保留原定 13:15 入场和 14:00 塔楼时段；当天航班 10:10 落地、约 12:30 交接钥匙，衔接仍然偏紧，应直接前往入口。',
      '提前下载官方 App、离线讲解内容并自备耳机；现场网络和下载时间不应占用预约时段。',
      '背包等物品须按要求存入塔楼储物柜；塔楼可能因大风、降雨或其他安全原因关闭。',
      '塔楼不适合行动不便者、孕妇、易眩晕者及部分心肺疾病访客；6 岁以下儿童不得进入，未成年人须遵守陪同规定。',
    ],
    sources: [
      {
        institution: 'Basílica de la Sagrada Família',
        title: 'Sagrada Família and Tower',
        url: 'https://sagradafamilia.org/en/sagrada-familia-and-tower',
        verifiedAt: '2026-09-02',
        note: '核验塔楼票包含内容、受难塔视野方向、预计时长及电梯上行和步行下行方式。',
      },
      {
        institution: 'Basílica de la Sagrada Família',
        title: 'Schedules and how to get here',
        url: 'https://sagradafamilia.org/en/schedules-how-to-get',
        verifiedAt: '2026-09-02',
        note: '核验个人访客从 Carrer de la Marina 一侧诞生立面进入。',
      },
      {
        institution: 'Basílica de la Sagrada Família',
        title: 'Rules and conditions of sale',
        url: 'https://sagradafamilia.org/en/rules-and-conditions-of-sale?inheritRedirect=true',
        verifiedAt: '2026-09-02',
        note: '核验塔楼储物柜、天气关闭、年龄与健康限制。',
      },
      {
        institution: 'Basílica de la Sagrada Família',
        title: 'The columns of the Sagrada Família',
        url: 'https://blog.sagradafamilia.org/en/columns-sagrada-familia-geometry-mechanics-materials-stone-forest/',
        verifiedAt: '2026-09-02',
        note: '核验双扭柱、树状分叉及承重逻辑。',
      },
    ],
  },
  'gaudi-house': {
    overviewTitle: '高迪居所里的日常与家具设计',
    originalTitle: 'Casa Museu Gaudí',
    overview:
      '高迪故居博物馆位于桂尔公园内部，它的价值不在于展示一座由高迪亲自设计的住宅，而在于呈现建筑师长期居住的日常环境、宗教生活与设计实践。房屋原本是花园城市项目的示范住宅，由 Francesc Berenguer 设计；高迪从 1906 年住到 1925 年。家具、铁艺、模型和私人用品把公园中的宏大实验缩回到人的尺度。',
    orientation: [
      {
        title: '它在公园内部',
        body: '故居位于桂尔公园范围内，此次使用与公园组合的预约；参观结束后直接接续公园路线。',
      },
      {
        title: '房屋不是高迪设计',
        body: '现存住宅由 Francesc Berenguer 设计，最初作为住宅开发计划的示范屋，判断建筑语言时不要把每个构件都归于高迪。',
      },
      {
        title: '居住年代是 1906 至 1925 年',
        body: '高迪在此居住近二十年，直至迁往圣家堂工地附近，因此馆藏重点是私人生活与跨项目设计。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '历史住宅与花园',
      note: '只按官方披露的住宅、花园和馆藏主题定位；具体开放房间及单向路线以修复后现场标识为准。',
      stops: [
        '花园、凉廊与住宅外观',
        '门厅及住宅尺度的过渡空间',
        '生活空间与祈祷相关陈设',
        '家具、模型和私人用品陈列',
        '铁艺构件与花园细部',
      ],
    },
    highlights: [
      {
        title: '示范住宅本体',
        creator: 'Francesc Berenguer',
        summary:
          '这座住宅原为桂尔公园开发计划的示范屋，后来才成为高迪住所，是理解项目从地产实验转向公共遗产的关键。',
        lookFor:
          '观察相对常规的住宅体量、窗洞和花园关系，并把它与公园中高迪设计的高架路和纪念区区分开。',
      },
      {
        title: '跨项目家具',
        creator: 'Antoni Gaudí',
        summary:
          '馆藏家具来自 Casa Calvet、Casa Batlló 和 Colònia Güell 等项目，显示高迪如何把建筑曲线缩放到身体接触的尺度。',
        lookFor:
          '留意椅背、扶手和座面的连续曲面，判断装饰是否同时承担握持、倚靠或节省材料的功能。',
      },
      {
        title: '私人用品与铁艺',
        summary:
          '祈祷相关物件、个人用品及来自其他项目的金属构件，使高迪的信仰、生活方式和材料实验出现在同一语境中。',
        lookFor:
          '比较手工锻造的重复纹样与私人陈设的克制程度，不要只寻找最夸张的曲线。',
      },
    ],
    sequence: [
      {
        title: '按 16:00 时段报到',
        body: '先确认故居入口而不是公园主入口，准备好组合票，并按工作人员指示进入修复后的参观线。',
      },
      {
        title: '先看房屋与花园关系',
        body: '从外观和花园建立住宅尺度，再进入室内，避免把故居与公园纪念区混成同一件作品。',
      },
      {
        title: '集中看生活与设计',
        body: '用有限时间比较私人陈设、家具、模型和铁艺，优先辨认来源项目和实际用途。',
      },
      {
        title: '直接接入公园路线',
        body: '离开故居后不退出公园，按照现场开放路径前往奥地利花园和自然广场方向。',
      },
    ],
    practical: [
      '官网已确认故居修复后重新开放并提供与桂尔公园组合的票种；仍应以票面入口和时段说明为准。',
      '预约仅安排 30 分钟，适合抓住宅背景、家具与私人生活三个主题，不适合逐件阅读全部标签。',
      '内部开放房间和行进方向以现场标识为准，本指南不推定修复后的完整楼层平面。',
      '参观后继续游览桂尔公园，不要误从公园出口离场，因为公园票不允许重新入园。',
    ],
    sources: [
      {
        institution: 'Park Güell Barcelona',
        title: 'Gaudí House Museum',
        url: 'https://parkguell.barcelona/en/park-guell/emblematic-features/gaudi-museum-house',
        verifiedAt: '2026-09-02',
        note: '核验设计者、示范住宅背景及高迪 1906 至 1925 年的居住经历。',
      },
      {
        institution: 'Park Güell Barcelona',
        title: 'Buy tickets',
        url: 'https://parkguell.barcelona/en/buy-tickets',
        verifiedAt: '2026-09-02',
        note: '核验故居与公园组合票及现行预约规则。',
      },
      {
        institution: 'Basílica de la Sagrada Família',
        title: 'Gaudí House Museum',
        url: 'https://sagradafamilia.org/en/gaudi-house-museum',
        verifiedAt: '2026-09-02',
        note: '核验花园、祈祷空间、家具、铁艺和私人用品等馆藏主题。',
      },
    ],
  },
  'park-guell': {
    overviewTitle: '坡地上的花园城市实验',
    originalTitle: 'Park Güell',
    overview:
      '桂尔公园最初并不是为观光而造，而是 1900 年启动的花园城市式住宅开发。项目未能按地产计划完成，却留下了一套把地形、交通、雨水管理和公共空间编织在一起的系统。参观时不应只把注意力放在碎瓷蜥蜴上：自然广场、百柱厅、门房和高架步道共同说明高迪如何用结构解决坡地、集会、市场和排水问题。',
    orientation: [
      {
        title: '全园约十二公顷',
        body: '纪念区只是整体的一部分，住宅、林地、高架步道和坡地路径共同组成公园，移动距离比单看照片时更长。',
      },
      {
        title: '起点是住宅开发',
        body: 'Eusebi Güell 与高迪在 1900 年启动项目，借鉴花园城市理念规划住宅地块、道路和公共设施。',
      },
      {
        title: '主入口在 Olot 街',
        body: '门房、双阶梯、龙形喷泉、百柱厅与自然广场沿主入口轴线层层上升，是理解纪念区最清楚的方向基准。',
      },
    ],
    spatial: {
      type: 'site',
      title: '坡地公园与纪念区',
      note: '从园内高迪故居出发，路线按高处公共空间向主入口逐级下降；施工可能改变局部连通方式。',
      stops: [
        '高迪故居周边与奥地利花园',
        '自然广场和蛇形碎瓷长椅',
        '百柱厅',
        '龙形喷泉与双阶梯',
        'Olot 街门房建筑',
        '可开放的高架步道或洗衣妇柱廊',
      ],
    },
    highlights: [
      {
        title: '自然广场蛇形长椅',
        creator: 'Antoni Gaudí 与 Josep Maria Jujol',
        summary:
          '连续起伏的座椅围合广场边缘，碎瓷表面同时形成色彩拼贴、靠背和俯瞰城市的停留界面。',
        lookFor:
          '沿长椅移动，比较内凹座位、凸出分隔和排水细节，并观察城市视野如何随曲线逐段出现。',
      },
      {
        title: '百柱厅的结构与蓄水',
        summary:
          '大厅以 86 根多立克式柱支撑上方广场，柱体和顶板又参与收集雨水并把水导入地下蓄水空间。',
        lookFor:
          '寻找柱列轻微变化、顶棚圆盘与排水路径，把这里同时看作市场、支撑结构和水利设施。',
      },
      {
        title: '龙形阶梯与门房',
        summary:
          '主阶梯上的喷泉、碎瓷龙和两座门房把基础设施包装成强烈的入口仪式。',
        lookFor:
          '观察阶梯中轴的水流节点、龙形构件表面拼贴，以及门房屋顶如何从近景转成公园标志。',
      },
    ],
    sequence: [
      {
        title: '从故居接入园路',
        body: '16:30 离开故居后先确认当天开放方向，向奥地利花园和自然广场移动。',
      },
      {
        title: '在自然广场读城市与结构',
        body: '先看长椅和城市全景，再走到广场边缘理解下方百柱厅如何承担平台。',
      },
      {
        title: '逐级下到百柱厅',
        body: '进入柱列后观察顶棚和排水构造，再从大厅走向龙形阶梯。',
      },
      {
        title: '以主入口建筑收尾',
        body: '在龙形喷泉和门房之间比较整体轴线，按原行程从开放出口离园前往焦糖山。',
      },
    ],
    practical: [
      '公园实行预约入场，官方给出预约后 30 分钟的入场宽限；一旦离园不得凭原票重新进入。',
      '园区面积大且坡度明显，80 分钟应优先自然广场、百柱厅、阶梯和门房，支线只在时间允许时加入。',
      '官方施工页在 2026 年仍列有排水及管线工程和局部路线调整；不要按旧地图强行穿越封闭段，应在当天重查通告。',
      '携带饮水并注意日晒；台阶和不规则地面会影响推车及行动不便访客的速度。',
    ],
    sources: [
      {
        institution: 'Park Güell Barcelona',
        title: 'Buy tickets',
        url: 'https://parkguell.barcelona/en/buy-tickets',
        verifiedAt: '2026-09-02',
        note: '核验约十二公顷的园区规模、预约宽限和不可重新入园规则。',
      },
      {
        institution: 'Park Güell Barcelona',
        title: 'Origin and creation',
        url: 'https://parkguell.barcelona/en/park-guell/origin-and-creation',
        verifiedAt: '2026-09-02',
        note: '核验 1900 年住宅开发和花园城市背景。',
      },
      {
        institution: 'Park Güell Barcelona',
        title: 'The Hypostyle Room',
        url: 'https://parkguell.barcelona/en/park-guell/emblematic-features/hypostyle-room',
        verifiedAt: '2026-09-02',
        note: '核验 86 根柱、市场用途与雨水收集系统。',
      },
      {
        institution: 'Park Güell Barcelona',
        title: 'Disruptions',
        url: 'https://parkguell.barcelona/en/disruptions',
        verifiedAt: '2026-09-02',
        note: '核验 2026 年施工及局部路径受影响信息，具体状态须在到访日复查。',
      },
    ],
  },
  'turo-rovira': {
    overviewTitle: '炮台与聚落遗迹上的城市全景',
    originalTitle: 'Turó de la Rovira',
    overview:
      'Turó de la Rovira 不是单纯的日落观景台，而是一处把战争、住房危机与城市扩张叠放在同一山顶的露天遗址。西班牙内战时期的防空炮台利用这里的广阔视野保护城市；战后，军事构筑物又被 Canons 棚户聚落重新占用，居民一直生活到 1990 年前后。今天保留的炮座、指挥设施和住宅痕迹，使 360 度城市全景带有明确的社会历史背景。',
    orientation: [
      {
        title: '先把它看作防空阵地',
        body: '山顶曾布置共和军防空炮台，开阔视界原本服务于发现和应对空袭，而非旅游观景。',
      },
      {
        title: '再辨认 Canons 聚落',
        body: '战后住房短缺使军事遗址被改造成棚户社区，住宅痕迹记录了基础设施与日常生活的重新组合。',
      },
      {
        title: '全景是第三层证据',
        body: '从山顶可以同时辨认海岸、Eixample 网格、旧城、Montjuïc 和周边山脊，用城市形态连接前两段历史。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '山顶露天遗址与观景边缘',
      note: '不假定室内展室在行程时段开放，也不为露天山丘编造统一闭园时间；只按可见遗址节点组织观察。',
      stops: [
        '上山入口附近的五块户外说明牌',
        '防空炮位平台与炮座',
        '指挥所、军官区和营房外部',
        'Canons 住宅及生活设施痕迹',
        '面向城市网格、海岸与山脊的安全观景边缘',
      ],
    },
    highlights: [
      {
        title: '防空炮座',
        period: '西班牙内战时期',
        summary:
          '炮台利用山顶方位监视城市上空，残存基座和平台仍能说明武器、人员与视线的组织方式。',
        lookFor:
          '观察圆形或弧形基座与城市方向的对应关系，想象这里为何需要无遮挡的视野。',
      },
      {
        title: 'Canons 棚户住宅痕迹',
        period: '战后至 1990 年',
        summary:
          '居民把军用空间改成住房，使遗址同时保存国家战争设施和非正式城市生活两种尺度。',
        lookFor:
          '寻找门洞、墙脚、分隔和生活设施留下的痕迹，区分它们与原军事构筑物的材料和尺度。',
      },
      {
        title: '三百六十度城市地貌',
        summary:
          '山顶视野让规则的 Eixample 网格、密集旧城、海岸线和外围山体同时进入视线。',
        lookFor:
          '先找圣家堂与海岸，再沿道路网格向旧城移动，避免只把镜头对准落日方向。',
      },
    ],
    sequence: [
      {
        title: '到场先确认可进入边界',
        body: '在入口查看当日告示和围栏状态；若管理方已关闭考古围区，不跨越围栏进入。',
      },
      {
        title: '阅读户外说明',
        body: '先利用说明牌建立防空炮台和 Canons 聚落的时间线，再进入遗址观察，避免把所有墙体视作同一时期。',
      },
      {
        title: '从炮位走向生活痕迹',
        body: '依次辨认炮座、指挥设施外部和住宅分隔，把军事功能与居民改造对应起来。',
      },
      {
        title: '最后看城市全景',
        body: '在安全边缘完成地标定位，并在光线明显下降前沿原路下山。',
      },
    ],
    practical: [
      '10 月 2 日为周五；MUHBA 公布的室内解释空间在该日不开放，原行程只能按露天遗址和观景体验准备。',
      '官方信息存在冲突：MUHBA 页面称山体可自由进入，巴塞罗那市政府指南却把管理考古围区列为 10 月至 4 月 09:00–17:30；18:20 是否可进入须在当天向 MUHBA 或现场确认，行程时间不作改动。',
      '山路、台阶和遗址边缘不平，日落后照明有限；穿防滑鞋并准备独立照明，不依赖手机剩余电量。',
      '本指南不提供露天山丘的推定关闭时间；任何临时围栏、管理人员指示和安全封闭均优先于历史经验。',
    ],
    sources: [
      {
        institution: "MUHBA Museu d'Història de Barcelona",
        title: 'Turó de la Rovira',
        url: 'https://www.barcelona.cat/museuhistoria/es/patrimonios/los-espacios-del-museo/turo-de-la-rovira',
        verifiedAt: '2026-09-02',
        note: '核验防空炮台、Canons 聚落、360 度视野、说明牌、室内空间时段及山体自由进入表述。',
      },
      {
        institution: 'Barcelona City Council',
        title: "Museu d'Història de Barcelona - Turó de la Rovira",
        url: 'https://guia.barcelona.cat/en/detall/museu-d-historia-de-barcelona-turo-de-la-rovira_99400267435.html',
        verifiedAt: '2026-09-02',
        note: '核验与 MUHBA 页面冲突的管理围区开放时段，因此晚间进入性保留为待确认。',
      },
    ],
  },
  'la-pedrera': {
    overviewTitle: '庭院、悬链拱与屋顶雕塑',
    originalTitle: 'Casa Milà - La Pedrera',
    overview:
      '米拉之家把一座大型城市住宅处理成可变的结构系统：两组住宅体围绕采光庭院展开，柱网让内部隔墙不必承担传统承重任务，起伏石立面则像独立幕布包裹街角。清晨参观的重点并非抢拍空旷屋顶，而是沿庭院、公寓、阁楼与屋顶逐步理解服务空间如何被塑造成建筑体验，尤其是阁楼的 270 道砖砌悬链拱和屋顶上兼具功能与雕塑性的构件。',
    orientation: [
      {
        title: '两个住宅体、两个庭院',
        body: '建筑由相互关联的两部分和两个大型采光庭院组织，庭院是理解复杂平面与垂直交通的主要方向标。',
      },
      {
        title: 'Sunrise 从 08:00 开始',
        body: '官方清晨产品约 90 分钟，提供英语和中文讲解，并在普通公众进入前开放主要参观空间。',
      },
      {
        title: '路线从住宅升到服务空间',
        body: '庭院和历史公寓说明居住方式，阁楼与屋顶则揭示结构、通风、烟道和楼梯间如何协同。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '双庭院住宅的垂直参观线',
      note: '官方 Sunrise 路线包含庭院、历史公寓、阁楼和屋顶；实际先后可由导览人员按运营情况调整。',
      stops: [
        'Passeig de Gràcia 转角石质外立面',
        '花卉庭院与蝴蝶庭院',
        '1911 年住宅公寓陈设',
        '鲸腹阁楼与高迪展览',
        '武士屋顶的楼梯间、通风塔和烟囱',
      ],
    },
    highlights: [
      {
        title: '自承重石立面与柱网',
        summary:
          '连续起伏的石材外表面与内部柱网共同释放传统承重墙限制，使住宅分隔具有更高自由度。',
        lookFor:
          '从街角看立面与阳台铁艺的连续变化，进入后再寻找柱子与隔墙没有严格重合的证据。',
      },
      {
        title: '二百七十道悬链拱',
        summary:
          '阁楼由 270 道高度变化的砖砌悬链拱组成，原本服务于洗衣、储藏和屋顶支撑，如今形成连续的鲸腹般空间。',
        lookFor:
          '沿拱列观察高度和间距如何变化，并看拱顶如何适应上方起伏屋面，而不是把它当成纯装饰隧道。',
      },
      {
        title: '屋顶功能雕塑',
        summary:
          '楼梯间出口、通风塔和烟囱被包裹成具有头盔、旋涡和群像感的构筑物，同时继续承担实际服务功能。',
        lookFor:
          '先辨认每组构件的通风、排烟或楼梯用途，再观察它们如何框取圣家堂与城市天际线。',
      },
    ],
    sequence: [
      {
        title: '08:00 准时集合',
        body: '按清晨导览要求提前到入口报到，确认当日讲解语言和屋顶是否开放。',
      },
      {
        title: '从庭院理解建筑组织',
        body: '比较两个庭院的色彩、坡道与采光，建立住宅围绕空腔展开的空间关系。',
      },
      {
        title: '进入历史公寓',
        body: '通过房间、走廊和家具理解 20 世纪初租户生活，并观察非承重分隔带来的平面自由。',
      },
      {
        title: '由阁楼升到屋顶',
        body: '先阅读悬链拱的结构逻辑，再到屋顶辨认楼梯间、烟囱和通风塔。',
      },
      {
        title: '出馆后补看立面',
        body: '在街对面回看转角和屋顶轮廓，把室内结构与石质外壳重新对应。',
      },
    ],
    practical: [
      '清晨导览约 90 分钟并提供中英双语；应准时到场，迟到可能无法完整加入既定导览。',
      'Sunrise 是产品名称，不保证参观当天恰好看见天文意义上的日出。',
      '屋顶开放会受天气与维护影响；若关闭，应把时间转移到阁楼结构和庭院，而不是自行寻找未开放通道。',
      '建筑提供部分无障碍支持，但历史空间和屋顶并非所有区域都能以相同方式到达。',
    ],
    sources: [
      {
        institution: 'Fundació Catalunya La Pedrera',
        title: 'La Pedrera Sunrise',
        url: 'https://www.lapedrera.com/en/tickets/la-pedrera-sunrise/',
        verifiedAt: '2026-09-02',
        note: '核验 08:00 开始、约 90 分钟、中英讲解及庭院、公寓、阁楼、屋顶路线。',
      },
      {
        institution: 'Fundació Catalunya La Pedrera',
        title: 'Architecture of Casa Milà',
        url: 'https://www.lapedrera.com/en/casa-mila/architecture/',
        verifiedAt: '2026-09-02',
        note: '核验双住宅体、双庭院、柱网、270 道悬链拱及屋顶构件功能。',
      },
      {
        institution: 'Fundació Catalunya La Pedrera',
        title: 'Practical information',
        url: 'https://www.lapedrera.com/en/practical-information/',
        verifiedAt: '2026-09-02',
        note: '核验入场、临时关闭与无障碍相关实用信息。',
      },
    ],
  },
  'casa-batllo': {
    overviewTitle: '采光井、海洋意象与龙脊屋顶',
    originalTitle: 'Casa Batlló',
    overview:
      '巴特罗之家是高迪在 1904 至 1906 年对一座 1877 年既有住宅所做的整体改造。外立面的骨状柱、面具般阳台和龙脊屋顶固然醒目，但更值得追踪的是建筑如何把狭长城市地块中的采光、通风、服务交通和家庭仪式重新组织起来。由主层、后院、采光井、阁楼到屋顶的上升过程，会把海洋般的表面想象逐步转化为可验证的建筑功能。',
    orientation: [
      {
        title: '它是改造项目',
        body: '原建筑建于 1877 年，Josep Batlló 购入后委托高迪在 1904 至 1906 年重组内部、扩展采光井并重做立面。',
      },
      {
        title: '采光井是内部坐标',
        body: '住宅空间围绕纵深较大的采光井展开，沿途不断与井壁、窗洞和空气交换发生关系。',
      },
      {
        title: 'Platinum 权益以凭证为准',
        body: '官网现行 Platinum 产品列有屋顶、AR 平板、Gaudí Dôme、礼宾服务和 Batlló 私人住宅等内容，但产品可能更新。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: 'Eixample 联排住宅的垂直路线',
      note: '九个建筑平面层级：地下、底层、主层、上部一至四层、阁楼、屋顶。建筑结构依据 2021 年改造图；2026 年私人住宅、临展和沉浸展项的房间对应尚未核定，先后以现场分流为准。',
      stops: [
        'Passeig de Gràcia 外立面与入口',
        '主层住宅及临街大厅',
        '后立面、庭院与采光井',
        '服务楼梯和悬链拱阁楼',
        '龙脊屋顶与烟囱群',
        'Batlló 私人住宅、Gaudí Cube 或当期展览',
      ],
    },
    highlights: [
      {
        title: '骨状立面与龙脊屋顶',
        summary:
          '石柱常被联想到骨骼，阳台像面具，彩色屋面则常被解释为龙背，但高迪没有留下唯一图解。',
        lookFor:
          '把象征解释当作观察入口而非定论；重点比较石材、玻璃、陶瓷和金属如何形成不同深度。',
      },
      {
        title: '中央采光井',
        summary:
          '改造后的采光井把自然光和空气带入狭长住宅深处，是室内色彩、窗洞尺度和通风组织的核心。',
        lookFor:
          '从不同高度比较蓝色表面、窗洞和进入室内的亮度变化，理解视觉处理如何补偿垂直光差。',
      },
      {
        title: '六十道阁楼拱与烟囱群',
        summary:
          '阁楼以 60 道悬链拱形成连续服务空间，屋顶则把烟道、通风和楼梯出口转化为强烈轮廓。',
        lookFor:
          '先在白色拱列中观察结构重复，再到屋顶辨认四组烟囱和龙脊构件的实际功能。',
      },
    ],
    sequence: [
      {
        title: '先在街面对齐整座立面',
        body: '从对街观察主层、阳台和屋顶三段关系，再按 10:30 票面入口进入。',
      },
      {
        title: '主层看家庭仪式空间',
        body: '关注临街大厅、门窗和有机木作如何组织接待、视线与自然光。',
      },
      {
        title: '沿采光井向上',
        body: '在后院和垂直交通中持续观察井壁、窗洞与亮度，不把采光井只当作拍照背景。',
      },
      {
        title: '从阁楼进入屋顶',
        body: '以 60 道拱建立服务空间逻辑，再到屋顶辨认烟囱、通风和龙脊。',
      },
      {
        title: '完成 Platinum 附加空间',
        body: '按现场分流进入私人住宅、AR 或沉浸体验，并为当期 Casa Batlló Contemporary 展览留出余量。',
      },
    ],
    practical: [
      '原行程预留 10:30 至 12:15，较官网常规建议时长宽裕，但仍应先完成主层、采光井、阁楼和屋顶。',
      'Platinum 产品内容可能随销售周期调整，务必以已购票凭证确认私人住宅、AR、礼宾及改签权益。',
      '2026 年 10 月 3 日处于“Gaudí–Miró–Gomis: Deconstructed”展期内；是否与当前票种同线进入以现场安排为准。',
      '屋顶会受天气和维护影响；遇到关闭不改变后续行程时间，应把余量用于主层和采光井。',
    ],
    sources: [
      {
        institution: 'Casa Batlló',
        title: 'History of Casa Batlló',
        url: 'https://www.casabatllo.es/en/antoni-gaudi/casa-batllo/history/',
        verifiedAt: '2026-09-02',
        note: '核验 1877 年原建筑及 1904 至 1906 年高迪改造。',
      },
      {
        institution: 'Casa Batlló',
        title: 'Inside Casa Batlló',
        url: 'https://www.casabatllo.es/en/antoni-gaudi/casa-batllo/inside/',
        verifiedAt: '2026-09-02',
        note: '核验采光井、60 道悬链拱、屋顶龙脊与四组烟囱。',
      },
      {
        institution: 'Casa Batlló',
        title: 'The Casa Batlló experience',
        url: 'https://www.casabatllo.es/en/experience/',
        verifiedAt: '2026-09-02',
        note: '核验主层、后院、阁楼、屋顶、私人住宅、AR 与沉浸空间等现行票档内容。',
      },
      {
        institution: 'Casa Batlló Contemporary',
        title: 'Gaudí–Miró–Gomis: Deconstructed',
        url: 'https://contemporary.casabatllo.es/en/',
        verifiedAt: '2026-09-02',
        note: '核验展览自 2026-07-08 至 2027-01-10 举行。',
      },
    ],
  },
  'palau-musica': {
    overviewTitle: '彩色玻璃与马赛克中的音乐厅',
    originalTitle: 'Palau de la Música Catalana',
    overview:
      '加泰罗尼亚音乐宫是 Domènech i Montaner 为 Orfeó Català 合唱协会建造的现代主义音乐厅，于 1905 至 1908 年完成，并在 1997 年列入世界遗产。它不是静态博物馆，而是一座持续排练和演出的工作场所。砖、陶瓷、马赛克、雕塑、铁件和彩色玻璃在这里并不只是表面装饰，而是共同引导人流、自然光与舞台注意力。',
    orientation: [
      {
        title: '建成于 1905 至 1908 年',
        body: '建筑由 Lluís Domènech i Montaner 设计，为 Orfeó Català 和城市公共音乐生活服务。',
      },
      {
        title: '1997 年列入世界遗产',
        body: '音乐宫与同一建筑师设计的圣十字圣保罗医院共同体现加泰罗尼亚现代主义的重要成就。',
      },
      {
        title: '它仍是工作中的音乐厅',
        body: '舞台、排练和活动会改变导览可进入的区域，官方明确保留临时调整路线的权利。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '门厅、公共厅室与音乐厅',
      note: '采用官方导览公布的典型节点；演出或排练期间可能省略、调换或限制部分空间。',
      stops: [
        '门厅与主楼梯',
        'Lluís Millet 厅',
        '音乐厅下层座席',
        '舞台、雕塑群与管风琴',
        '上层座席和倒悬彩玻璃穹顶',
      ],
    },
    highlights: [
      {
        title: '倒悬彩玻璃穹顶',
        summary:
          '音乐厅中央的彩玻璃构件像向下滴落的太阳，把自然光直接引入观众席中心。',
        lookFor:
          '从下层和上层各看一次，比较中央暖色、外围冷色以及穹顶与座席轴线的关系。',
      },
      {
        title: '舞台雕塑与缪斯',
        summary:
          '舞台后部把雕塑、马赛克、女性音乐形象和管风琴并置，使演出背景成为多种艺术的共同界面。',
        lookFor:
          '辨认立体雕塑如何从墙面伸入舞台，并观察不同乐器与服饰暗示的音乐传统。',
      },
      {
        title: 'Lluís Millet 厅',
        summary:
          '彩色玻璃、阳台柱和较为亲密的尺度构成音乐厅前的过渡，也展示建筑对自然光的持续依赖。',
        lookFor:
          '站在室内向阳台方向看，比较玻璃、马赛克柱和街道光线如何叠在一起。',
      },
    ],
    sequence: [
      {
        title: '提前抵达并确认导览',
        body: '原行程尚未订票，应先锁定 13:00 场次，并在开始前到指定集合点。',
      },
      {
        title: '由门厅和楼梯进入',
        body: '观察砖、陶瓷和铁件如何在狭窄旧城地块中组织上升，而不是直接冲向音乐厅。',
      },
      {
        title: '在 Lluís Millet 厅停留',
        body: '把这里作为街道与主音乐厅之间的光线缓冲，再随导览进入观众席。',
      },
      {
        title: '从下层读舞台',
        body: '先看舞台雕塑、缪斯与管风琴的整体构图，再抬头定位彩玻璃穹顶。',
      },
      {
        title: '上层完成空间全景',
        body: '若当日路线允许，从较高位置观察穹顶、座席和舞台轴线后按导览出口离开。',
      },
    ],
    practical: [
      '官方导览约 50 分钟，13:00 至 14:00 的原行程可以容纳，但门票仍为未订状态。',
      '迟到者不能保证中途加入导览，应至少提前十分钟到集合点并准备电子票。',
      '音乐宫没有供普通访客使用的完整衣帽间，避免携带大件行李。',
      '演出、排练和技术工作可能改变舞台可见度或参观路线，不应把典型路线当作当天保证。',
    ],
    sources: [
      {
        institution: 'Palau de la Música Catalana',
        title: 'Guided tour',
        url: 'https://www.palaumusica.cat/en/visites/guided-tour_1174259',
        verifiedAt: '2026-09-02',
        note: '核验约 50 分钟导览、可选语言、开放材料与参观时段。',
      },
      {
        institution: 'Palau de la Música Catalana',
        title: 'Discover the Palau',
        url: 'https://www.palaumusica.cat/en/visites/discover-the-palau_1159134',
        verifiedAt: '2026-09-02',
        note: '核验 1905 至 1908 年建造、Orfeó Català 背景和 1997 年世界遗产身份。',
      },
      {
        institution: 'Palau de la Música Catalana',
        title: 'Practical information',
        url: 'https://www.palaumusica.cat/en/visites/practical-information_1159207',
        verifiedAt: '2026-09-02',
        note: '核验迟到、衣帽间、无障碍与工作音乐厅可能调整路线的规则。',
      },
    ],
  },
  'barcelona-cathedral': {
    overviewTitle: '哥特中殿、地下墓室与回廊',
    originalTitle: 'Catedral de Barcelona',
    overview:
      '巴塞罗那主教座堂位于古罗马 Barcino 的核心地带，现存建筑把早期基督教、罗曼式和哥特时期叠合在一起。哥特主体自 1298 年开工，到 15 世纪中叶基本完成，而今天最醒目的西立面和中央穹顶主要完成于 19 世纪末至 1913 年。中殿、唱诗席、圣欧拉利娅地下墓室、回廊和屋顶分别展示礼仪、城市权力、圣徒崇敬与历史复兴的不同层次。',
    orientation: [
      {
        title: '地下有更早的宗教层',
        body: '现存哥特建筑建立在早期基督教堂和罗曼式主教座堂传统之上，不能只用一个建筑年代概括。',
      },
      {
        title: '哥特主体始于 1298 年',
        body: '工程延续到 15 世纪中叶，形成中殿、侧廊、小堂、唱诗席和回廊等主要空间。',
      },
      {
        title: '正立面比主体更晚',
        body: '西立面与中央穹顶主要是 19 世纪末至 1913 年的完成工程，观看时要区分中世纪结构与后来的历史主义外观。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '主教座堂、回廊与屋顶',
      note: '文化参观包含多个礼仪和附属空间；50 分钟行程应以中殿、地下墓室、唱诗席和回廊为核心，屋顶视排队情况。',
      stops: [
        '中殿与侧廊小堂',
        '唱诗席与金羊毛骑士团徽章',
        '圣欧拉利娅地下墓室',
        '勒班陀圣基督小堂',
        '回廊、古门与十三只鹅',
        '屋顶及哥特区天际线',
      ],
    },
    highlights: [
      {
        title: '圣欧拉利娅彩饰石棺',
        period: '1339 年',
        summary:
          '地下墓室中的石棺以浮雕表现圣徒殉道叙事，是主教座堂奉献对象与城市守护传统的视觉中心。',
        lookFor:
          '绕可见侧面辨认连续浮雕场景、人物动作和彩饰痕迹，并把宗教传统与可见文物本身分开理解。',
      },
      {
        title: '唱诗席与金羊毛徽章',
        period: '1517 至 1518 年',
        summary:
          '唱诗席保留与金羊毛骑士团会议有关的彩绘徽章，使礼仪家具同时成为欧洲王朝政治的记录。',
        lookFor:
          '观察座席上方每枚盾徽的图案差异，以及徽章如何覆盖在较早的哥特木作体系上。',
      },
      {
        title: '回廊与十三只鹅',
        summary:
          '回廊把小堂、墓葬、花园、水池和鹅群围合在一起，是圣欧拉利娅传统最具日常感的空间。',
        lookFor:
          '留意回廊拱间的墓碑、通往旧罗曼式建筑的门，以及鹅群传说如何被嵌入真实建筑环境。',
      },
    ],
    sequence: [
      {
        title: '从中殿建立年代层次',
        body: '14:10 入场后先看柱列、拱顶和小堂，再回想外立面较晚完成这一时间差。',
      },
      {
        title: '下到圣欧拉利娅墓室',
        body: '围绕彩饰石棺阅读浮雕，再回到中殿，不在狭窄入口阻挡礼拜动线。',
      },
      {
        title: '查看唱诗席与勒班陀小堂',
        body: '先看徽章和木作，再到侧部小堂观察圣像及其历史与传说的区别。',
      },
      {
        title: '从回廊完成平面环路',
        body: '观察古门、墓葬、花园和鹅群，确认出口与屋顶入口的位置。',
      },
      {
        title: '屋顶作为可删项',
        body: '只有在排队和开放状态允许时才上屋顶；最迟按原定 15:00 离开前往毕加索博物馆。',
      },
    ],
    practical: [
      '2026 年 10 月 3 日为周六；官网文化参观时段为 09:30 至 17:15，末次入场 16:30，原定 14:10 符合。',
      '原行程仅 50 分钟，优先中殿、墓室、唱诗席和回廊；屋顶排队过长时直接放弃，不改变下一站时间。',
      '这里仍是活动中的宗教场所；礼拜、仪式和临时封闭优先于文化参观路线。',
      '屋顶虽设电梯连接部分高度，仍可能有台阶、不平表面和天气限制。',
    ],
    sources: [
      {
        institution: 'Catedral de Barcelona',
        title: 'History of the Cathedral',
        url: 'https://catedralbcn.org/en/the-cathedral/history/',
        verifiedAt: '2026-09-02',
        note: '核验早期教堂层次、1298 年开工、15 世纪主体及 19 至 20 世纪立面和穹顶。',
      },
      {
        institution: 'Catedral de Barcelona',
        title: 'Visitable spaces',
        url: 'https://catedralbcn.org/en/tourist-visit/visitable-spaces/',
        verifiedAt: '2026-09-02',
        note: '核验中殿、回廊、屋顶、唱诗席、地下墓室和十三只鹅等参观空间。',
      },
      {
        institution: 'Catedral de Barcelona',
        title: 'Visiting hours',
        url: 'https://catedralbcn.org/en/tourist-visit/visiting-hours/',
        verifiedAt: '2026-09-02',
        note: '核验周六文化参观与末次入场时间。',
      },
      {
        institution: 'Catedral de Barcelona',
        title: 'Saint Eulalia',
        url: 'https://catedralbcn.org/en/worship-and-prayer/saints/saint-eulalia/',
        verifiedAt: '2026-09-02',
        note: '核验 1339 年石棺与圣欧拉利娅传统。',
      },
    ],
  },
  'picasso-barcelona': {
    overviewTitle: '从少年习作到《宫娥》系列',
    originalTitle: 'Museu Picasso Barcelona',
    overview:
      '巴塞罗那毕加索博物馆的优势不是用少量名作概括艺术家一生，而是保存了极密集的早期训练、蓝色时期、1917 年巴塞罗那作品以及完整的《宫娥》研究系列。馆舍本身由五座 13 至 15 世纪的中世纪宫殿组成，庭院和外楼梯先建立城市贵族建筑的尺度。沿官方当日地图推进时，可以看到一位学院训练扎实的少年如何不断拆解人物、空间与绘画传统。',
    orientation: [
      {
        title: '馆舍是五座宫殿',
        body: 'Montcada 街上的五座中世纪宫殿组成博物馆，庭院、石阶和连通处本身就是参观内容。',
      },
      {
        title: '重点在早年与巴塞罗那',
        body: '馆藏尤其完整地呈现少年训练、蓝色时期、1917 年作品和艺术家与城市的长期关系。',
      },
      {
        title: '《宫娥》是独立高潮',
        body: '1957 年系列不是单件临摹，而是对 Velázquez 构图、人物、色彩和空间进行持续变奏的完整研究。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '中世纪宫殿群中的年代与主题路线',
      note: '馆藏会因借展、保护和更新而轮换；以下按官方馆藏重点组织，具体房间和在展状态服从 2026 年当日地图。',
      stops: [
        'Montcada 街立面、宫殿庭院与外楼梯',
        '少年学院训练与家庭时期',
        '蓝色时期及巴黎转折',
        '1917 年巴塞罗那作品',
        '1957 年《宫娥》系列',
        '晚期陶瓷与捐赠脉络',
      ],
    },
    highlights: [
      {
        title: '《初领圣体》',
        originalTitle: 'La primera comunió',
        creator: 'Pablo Picasso',
        period: '1896 年',
        summary:
          '这是毕加索少年时期第一批大型学院式作品之一，显示他在人物组织、室内透视和正式展览语汇上的训练。',
        lookFor:
          '观察白色礼服、祭坛和深色人物如何构成明暗层次，再寻找尚未出现后来碎裂造型的扎实写实基础。',
      },
      {
        title: '《科学与慈善》',
        originalTitle: 'Ciència i Caritat',
        creator: 'Pablo Picasso',
        period: '1897 年',
        summary:
          '十五岁的毕加索以父亲为医生模特，把医疗观察与修女照护安排成符合官方沙龙趣味的大型社会题材画。',
        lookFor:
          '比较医生的手表、病人的手和修女怀中孩子形成的三处动作，观察叙事如何跨越画面连接。',
      },
      {
        title: '《宫娥》系列',
        originalTitle: 'Las Meninas',
        creator: 'Pablo Picasso',
        period: '1957 年',
        summary:
          '毕加索以一整组画反复拆解 Velázquez 原作，其中首幅大型构图把竖幅转为横幅并显著放大画家形象。',
        lookFor:
          '对照人物位置保持与形体变形，留意光源、色块和画家尺度如何重写原作的权力关系。',
      },
    ],
    sequence: [
      {
        title: '先看宫殿建筑',
        body: '15:30 入场后用几分钟观察庭院和外楼梯，理解馆舍由多个历史建筑连接而成。',
      },
      {
        title: '从学院训练起步',
        body: '优先找到《初领圣体》和《科学与慈善》，建立毕加索早期写实能力的基准。',
      },
      {
        title: '跟随年代进入蓝色时期',
        body: '观察色调、人物姿态和社会题材如何变化，再继续到 1917 年巴塞罗那阶段。',
      },
      {
        title: '把主要时间留给《宫娥》',
        body: '不要只看第一幅；在系列内部比较构图、人物和色彩的连续变奏。',
      },
      {
        title: '用陶瓷与馆藏史收尾',
        body: '余时查看晚期媒介和艺术家捐赠关系，并按 17:00 原定时间离馆。',
      },
    ],
    practical: [
      '10 月正常时段为周二至周日 10:00 至 19:00，原定 15:30 符合；馆内容量有限，未订状态下应提前预约。',
      '馆藏会因外借和保护轮换，先以当天官方地图确认三件重点作品是否展出及所在区域。',
      '超过 30×30 厘米的包须寄存，避免携带行李影响宫殿间移动。',
      '允许个人拍照但禁止闪光灯和三脚架；在狭窄展室不要为拍摄阻挡动线。',
    ],
    sources: [
      {
        institution: 'Museu Picasso Barcelona',
        title: 'Museum presentation',
        url: 'https://museupicassobcn.cat/en/museum/presentation',
        verifiedAt: '2026-09-02',
        note: '核验早年、蓝色时期、1917 年巴塞罗那、《宫娥》与陶瓷等馆藏重点。',
      },
      {
        institution: 'Museu Picasso Barcelona',
        title: 'The museum buildings',
        url: 'https://museupicassobcn.cat/en/museum/buildings',
        verifiedAt: '2026-09-02',
        note: '核验五座 13 至 15 世纪宫殿及其庭院和外楼梯。',
      },
      {
        institution: 'Museu Picasso Barcelona',
        title: 'Tickets and opening hours',
        url: 'https://museupicassobcn.cat/index.php/en/plan-your-visit/buy-tickets-and-opening-hours',
        verifiedAt: '2026-09-02',
        note: '核验 10 月开放时段、容量限制和线上购票建议。',
      },
      {
        institution: 'Museu Picasso Barcelona',
        title: 'Las Meninas',
        url: 'https://museupicassobcn.cat/en/collection/artwork/las-meninas-9',
        verifiedAt: '2026-09-02',
        note: '核验 1957 年系列首幅大型构图的横向格式、画家尺度及光色空间变化。',
      },
    ],
  },
  'santa-maria-mar': {
    overviewTitle: '港口行会建造的哥特大厅',
    originalTitle: 'Basílica de Santa Maria del Mar',
    overview:
      '圣玛利亚海洋教堂与中世纪里贝拉的港口、商人和行会社会紧密相连。建筑于 1329 年奠基，用约 54 年完成，因而形成罕见统一的加泰罗尼亚哥特空间：三条中殿高度接近，细长八角柱以宽阔间距支撑拱顶，视线几乎不被切碎。1936 年火灾破坏了大量内部陈设，今天看到的克制感既来自原有结构，也来自历史损失。',
    orientation: [
      {
        title: '建造期相对集中',
        body: '教堂自 1329 年起约 54 年完成，相比许多跨越数世纪的大教堂，主体语言因此更为统一。',
      },
      {
        title: '它属于里贝拉社会',
        body: '港口劳动者、商人和行会参与支持建造，Bastaixos 搬运工形象提醒访客石材运输与社区关系。',
      },
      {
        title: '三中殿高度接近',
        body: '三条中殿与 33 座小堂被细长八角柱组织，侧廊不会像传统高侧窗式教堂那样明显降低。',
      },
    ],
    spatial: {
      type: 'floorplan',
      title: '统一式哥特教堂与可选垂直路线',
      note: '原行程只有 30 分钟，以下以主层短访为核心；地下室、展廊、塔楼和屋顶属于更完整的收费文化路线。',
      stops: [
        '西立面与主入口',
        '中殿中央的整体柱列视野',
        '八角柱、侧廊与小堂边界',
        '主祭坛和后殿',
        '玫瑰窗及幸存彩色玻璃',
        'Born 一侧入口与 Bastaixos 相关细部',
      ],
    },
    highlights: [
      {
        title: '近乎统一高度的三中殿',
        summary:
          '细长八角柱和宽阔柱距让中殿与侧廊形成连续大厅般的体量，是加泰罗尼亚哥特空间的代表特征。',
        lookFor:
          '站在中轴向后殿看，观察柱子遮挡面积很小、侧廊拱顶高度接近以及视线如何横向展开。',
      },
      {
        title: '玫瑰窗与幸存古窗',
        summary:
          '西立面玫瑰窗在 1428 年地震后重建，教堂还保存部分未在 1936 年火灾中毁损的早期玻璃。',
        lookFor:
          '比较玫瑰窗的几何秩序与侧部彩窗的叙事图像，并观察傍晚光线进入石灰色空间的方式。',
      },
      {
        title: 'Bastaixos 与 Montjuïc 石材',
        summary:
          '码头搬运工参与把 Montjuïc 石材运到工地，他们的形象成为教堂与港口劳动群体关系的象征。',
        lookFor:
          '在入口和相关构件上寻找负重搬运者形象，再观察石材尺度，理解建造叙事为何强调运输劳动。',
      },
    ],
    sequence: [
      {
        title: '先看西立面',
        body: '从广场确认双塔、玫瑰窗与主入口的简洁构图，再处理 17:10 的文化参观入场。',
      },
      {
        title: '直入中殿抓整体比例',
        body: '站在中轴看柱列和三中殿高度，不在每座侧堂逐一停留。',
      },
      {
        title: '走到后殿再回望',
        body: '沿一侧前进，观察八角柱和小堂边界，到后殿附近后回看玫瑰窗与空间连续性。',
      },
      {
        title: '从 Born 侧结束',
        body: '寻找与搬运工、石材和港口社区有关的细部，按 17:40 原定时间接入博恩区步行。',
      },
    ],
    practical: [
      '行程记录的“无需门票”与官网冲突：周一至周六 10:00 至 18:00 为收费文化参观，末次入场 17:30；17:10 仍在收费时段，但不改变原行程时间。',
      '30 分钟不足以完成包含中殿、展廊、地下室、塔楼和屋顶的完整收费路线，建议按主层短访执行。',
      '免费进入仅适用于文化参观时段之外并受礼拜安排约束，不能据此假定 17:10 免费。',
      '屋顶与塔楼包含较多楼梯，主层无障碍范围也不能代表完整文化路线均可通行。',
    ],
    sources: [
      {
        institution: 'Basílica de Santa Maria del Mar',
        title: 'History',
        url: 'https://www.santamariadelmar.barcelona/en/history/',
        verifiedAt: '2026-09-02',
        note: '核验 1329 年开工、约 54 年建成、里贝拉社会背景及 1936 年火灾。',
      },
      {
        institution: 'Basílica de Santa Maria del Mar',
        title: 'The building',
        url: 'https://www.santamariadelmar.barcelona/en/building/',
        verifiedAt: '2026-09-02',
        note: '核验三中殿、33 座小堂、八角柱、Montjuïc 石材、地下室和屋顶结构。',
      },
      {
        institution: 'Basílica de Santa Maria del Mar',
        title: 'Opening hours and admission fees',
        url: 'https://www.santamariadelmar.barcelona/en/opening-hours-and-admission-fees/',
        verifiedAt: '2026-09-02',
        note: '核验 17:10 仍属收费文化参观时段、末次入场及完整路线包含空间。',
      },
      {
        institution: 'Basílica de Santa Maria del Mar',
        title: 'Artistic heritage',
        url: 'https://www.santamariadelmar.barcelona/en/artistic-heritage/',
        verifiedAt: '2026-09-02',
        note: '核验玫瑰窗重建、幸存彩窗及其他艺术遗产。',
      },
    ],
  },
  'el-born': {
    overviewTitle: '旧市场下的街道与城市记忆',
    originalTitle: 'El Born / La Ribera',
    overview:
      '博恩区是里贝拉历史街区中一条由圣玛利亚海洋教堂、Passeig del Born 与旧市场建筑串起的城市剖面。中世纪的比武、游行和商业活动曾占据这条轴线，1714 年战争记忆则留在 Fossar de les Moreres 与旧城区遗址中。El Born Centre de Cultura i Memòria 的铁构市场外壳覆盖着约 1700 年的街道、住宅和商铺遗存，使今日餐饮街区下方仍能读出被拆除城市的尺度。',
    orientation: [
      {
        title: '教堂与旧市场构成两端',
        body: 'Passeig del Born 位于圣玛利亚海洋教堂和原 Born 市场之间，是最清晰的街区方向轴。',
      },
      {
        title: '这里曾是公共活动场',
        body: '中世纪和近世的比武、游行、节庆及商业活动在步行轴附近展开，街道并非单纯住宅巷道。',
      },
      {
        title: '地面下保存 1700 年城市',
        body: '旧市场建筑覆盖考古遗址，可见西班牙王位继承战争前后被拆除街区的道路、房屋和商业空间。',
      },
    ],
    spatial: {
      type: 'district',
      title: '教堂、纪念地、步行轴与旧市场',
      note: '30 分钟按户外街区导向设计；El Born CCM 室内和考古遗址仅在当日开放且无需排队时作为附加观察。',
      stops: [
        'Fossar de les Moreres 纪念空间',
        'Passeig del Born 步行轴',
        'El Born CCM 的原市场铁构外壳',
        '可开放的遗址俯瞰区或市场外部开口',
        '通往 Barceloneta 方向的街区边缘',
      ],
    },
    highlights: [
      {
        title: 'Fossar de les Moreres',
        summary:
          '旧墓地被重塑为纪念 1714 年巴塞罗那围城死者的公共空间，以红色铺地、文字和长明火形成鲜明地景。',
        lookFor:
          '观察铺地倾角、火焰与教堂侧墙之间的关系，理解纪念空间如何嵌入日常通行路线。',
      },
      {
        title: 'Passeig del Born',
        summary:
          '这条长形公共轴连接教堂与市场，历史上容纳比武、游行、庆典和商业，是街区公共生活的骨架。',
        lookFor:
          '站在轴线中段向两端看，辨认教堂体量、市场屋顶和两侧狭窄街巷形成的尺度对比。',
      },
      {
        title: '旧市场下的 1700 年遗址',
        summary:
          '19 世纪铁构市场保护着早期街道和房屋遗迹，让两个相隔数百年的城市系统在同一建筑中可见。',
        lookFor:
          '若俯瞰区开放，寻找街道边界、住宅分隔和排水线；若未开放，则从外部观察市场跨越遗址的巨大屋盖。',
      },
    ],
    sequence: [
      {
        title: '从教堂侧面进入 Fossar',
        body: '17:40 离开教堂后先看纪念地的铺地、文字和长明火，再转入 Passeig del Born。',
      },
      {
        title: '沿公共轴走向市场',
        body: '保持教堂和市场两个端点在视线中，观察行会街巷如何从主轴两侧分出。',
      },
      {
        title: '判断 CCM 是否可快速进入',
        body: '先看市场外壳；只有在当日开放且无需明显排队时，才进入俯瞰遗址，不启动长时展览路线。',
      },
      {
        title: '继续向海边方向离开',
        body: '18:10 按原计划结束街区段，沿开放街道接续前往 Barceloneta。',
      },
    ],
    practical: [
      '街区和 Passeig del Born 为开放公共空间，无需门票；CCM 室内、展览和考古遗址有独立开放与票务规则。',
      '原行程只有 30 分钟，应以 Fossar、步行轴和市场外观为主，不把室内考古参观视为保证项目。',
      '这里仍是居住、餐饮和夜间活动密集的街区，停下观察时不要堵住住宅入口、自行车道或服务通道。',
    ],
    sources: [
      {
        institution: 'Turisme de Barcelona',
        title: 'Passeig del Born',
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/1240/passeig-del-born.html',
        verifiedAt: '2026-09-02',
        note: '核验教堂至旧市场的轴线、中世纪比武游行及 1714 年相关历史。',
      },
      {
        institution: 'Turisme de Barcelona',
        title: 'Fossar de les Moreres',
        url: 'https://www.barcelonaturisme.com/wv3/de/page/1216/the-fossar-de-les-moreres.html',
        verifiedAt: '2026-09-02',
        note: '核验旧墓地、1714 年纪念、1989 年公共空间改造及长明火。',
      },
      {
        institution: 'El Born Centre de Cultura i Memòria',
        title: 'El Born CCM space and archaeological site',
        url: 'https://elbornculturaimemoria.barcelona.cat/wp-content/uploads/2020/03/SPACE-RENTAL-ElBornCCM-2018-1.pdf',
        verifiedAt: '2026-09-02',
        note: '核验旧市场建筑、1700 年考古遗址及从上层俯瞰遗址的空间关系；开放状态须另行核验。',
      },
    ],
  },
  barceloneta: {
    overviewTitle: '渔业街区与地中海岸线',
    originalTitle: 'Platja de la Barceloneta',
    overview:
      '巴塞罗内塔海滩是城市旧渔业街区与地中海直接接触的开放边界。这里的文化价值不仅是沙滩本身，还在于密集住宅网格、海滨步道、季节性海滩服务和公共艺术如何共享一条狭长岸线。Rebecca Horn 于 1992 年创作的《受伤的星》以四个错位方盒纪念已经消失的海滩餐棚，也被解读为对街区狭小住宅的回应，是傍晚短访最明确的观察锚点。',
    orientation: [
      {
        title: '它连接渔业街区与海岸',
        body: '巴塞罗内塔紧邻历史上的渔民和海员社区，从窄街到开阔海面的尺度突变是此处最重要的空间经验。',
      },
      {
        title: '海滩与步道并行',
        body: '沙滩、水线、海滨步道和街区立面形成几条平行带，可根据风浪和人流选择较安全的移动层。',
      },
      {
        title: '海滩实行无烟规定',
        body: '官方把 Barceloneta 列入无烟海滩，季节性救生、辅助入水和其他服务则依日期及海况运行。',
      },
    ],
    spatial: {
      type: 'viewpoints',
      title: '城市海滩与海滨步道',
      note: '这是开放岸线而非封闭景区，不设置虚构闭园时间；观察点按步道、公共艺术、水线和街区界面组织。',
      stops: [
        'Espai de Mar 附近的海滨入口',
        'Rebecca Horn《受伤的星》',
        '安全开放的沙滩与水线',
        '海滨步道的城市天际线视角',
        '巴塞罗内塔住宅街区与海滩交界',
      ],
    },
    highlights: [
      {
        title: '《受伤的星》',
        originalTitle: "L'Estel Ferit",
        creator: 'Rebecca Horn',
        period: '1992 年',
        summary:
          '四个约十米高的错位钢铁与玻璃方盒纪念旧海滩餐棚，也让街区拥挤住宅的形象出现在海滩开阔背景中。',
        lookFor:
          '绕作品半圈，比较方盒在街区立面、天空和海面三个背景下如何从稳定堆叠变成倾斜失衡。',
      },
      {
        title: '窄街与海面的尺度突变',
        summary:
          '巴塞罗内塔规则而密集的住宅街道在海岸突然打开，呈现城市居住空间与公共自然边界的直接碰撞。',
        lookFor:
          '从步道回望街区，观察街道轴线、阳台密度和海滩开阔面之间的比例差异。',
      },
      {
        title: '水线、步道与天际线',
        summary:
          '平行的海浪、沙滩和步道提供三个移动速度不同的空间层，并把港口设施、旧城和现代海滨纳入同一视野。',
        lookFor:
          '选择一个不影响通行的位置，沿岸线辨认防波设施、公共艺术和远处城市轮廓的连续关系。',
      },
    ],
    sequence: [
      {
        title: '由街区进入海滨',
        body: '从 Born 方向到达后先在步道确认风浪、海况旗和返程方向，再决定是否走到沙滩。',
      },
      {
        title: '以《受伤的星》定位',
        body: '围绕雕塑观察街区、作品和海面的三种背景，并阅读其与旧海滩餐棚的关系。',
      },
      {
        title: '短走水线',
        body: '仅在海况安全时接近水线，沿岸移动一小段后回到照明和通行更稳定的步道。',
      },
      {
        title: '回望街区后离开',
        body: '从步道观察住宅网格与海滩边界，按 19:20 原定时间前往哥特区。',
      },
    ],
    practical: [
      '海滩是开放公共岸线，本指南不推定闭园时间；下水和接近水线必须服从现场海况旗、救生员及临时封闭。',
      '十月傍晚的救生、辅助入水、淋浴等季节性服务可能少于夏季，不应把官网列出的设施视为全时段运行。',
      '海滩为无烟区域；在人多处看管手机、相机和证件，不要把物品单独留在沙滩上。',
      '日落后优先使用有照明的步道返回，避免在防波堤、湿滑石面或无人值守水边停留。',
    ],
    sources: [
      {
        institution: 'Turisme de Barcelona',
        title: 'Barceloneta Beach',
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/3495/barceloneta-beach.html',
        verifiedAt: '2026-09-02',
        note: '核验海滩与渔业街区关系、无烟规定、服务及无障碍设施。',
      },
      {
        institution: 'Turisme de Barcelona',
        title: "L'Estel Ferit by Rebecca Horn",
        url: 'https://bid.barcelonaturisme.com/wv3/es/page/1228/l-estel-ferit-la-estrella-herida-rebecca-horn.html',
        verifiedAt: '2026-09-02',
        note: '核验 1992 年创作、四个错位方盒、尺度及对旧海滩餐棚的象征。',
      },
    ],
  },
  'gothic-quarter': {
    overviewTitle: '罗马城墙与中世纪街巷的叠影',
    originalTitle: 'Barri Gòtic',
    overview:
      '哥特区并不是一片年代单一的“中世纪布景”，而是罗马 Barcino 的道路和城墙、主教座堂与王宫建筑、近现代政府机构及居民街巷的重叠。古代 Cardo 与 Decumanus 在今天 Plaça Sant Jaume 一带交会，市政府和加泰罗尼亚政府仍占据政治中心；Plaça del Rei 则把王宫建筑群与地下罗马遗址叠在一起。夜访适合阅读公共空间层次，不应假定室内遗址或教堂开放。',
    orientation: [
      {
        title: 'Sant Jaume 是古今政治中心',
        body: '罗马主街交会和论坛位于这一带，今天广场两侧仍分别是巴塞罗那市政府与加泰罗尼亚政府。',
      },
      {
        title: 'Bisbe 与 Llibreteria 延续古道路',
        body: '今日 Carrer del Bisbe 和 Carrer de la Llibreteria 大致延续 Cardo、Decumanus 的城市方向，可用于夜间定位。',
      },
      {
        title: 'Plaça del Rei 叠着两座城市',
        body: '地面是中世纪王宫、Santa Àgata 小堂等建筑群，地下则保存罗马 Barcino 考古遗址。',
      },
    ],
    spatial: {
      type: 'district',
      title: '罗马道路、广场与中世纪街巷网络',
      note: '按从 Barceloneta 一侧进入、向兰布拉方向离开的夜间户外路线组织；不把任何室内空间列为当晚保证开放。',
      stops: [
        'Plaça del Rei 王宫建筑群外部',
        'Plaça Sant Jaume',
        'Carrer del Bisbe',
        '主教座堂外部与 Plaça Nova 罗马墙塔',
        'Plaça Sant Felip Neri',
        '通往 Portaferrissa 与兰布拉的街巷出口',
      ],
    },
    highlights: [
      {
        title: 'Plaça Nova 的罗马城墙',
        period: '罗马 Barcino',
        summary:
          '主教座堂附近仍能看到罗马城墙和塔体，它们使古城边界直接出现在中世纪与现代建筑旁。',
        lookFor:
          '观察巨大的规则石块、塔体转角和后来建筑附着的位置，区分罗马结构与后世填建。',
      },
      {
        title: 'Plaça Sant Jaume',
        summary:
          '古罗马主街和论坛传统与今日市政、自治区政治机构在同一广场重合，使这里持续承担公共权力中心角色。',
        lookFor:
          '站在广场中央比较两座政府建筑的正立面，再沿 Bisbe 和 Llibreteria 两个方向理解古道路轴线。',
      },
      {
        title: 'Plaça del Rei 建筑群',
        summary:
          '王宫、Santa Àgata 小堂与其他中世纪建筑围合石铺广场，其地下又连接罗马城市遗存。',
        lookFor:
          '比较王宫大体量、礼拜堂尖塔和广场不规则边界，想象地面权力空间与地下考古层的叠置。',
      },
    ],
    sequence: [
      {
        title: '从 Plaça del Rei 进入',
        body: '由海边方向抵达后先看王宫建筑群外部，用广场建立中世纪政治层。',
      },
      {
        title: '转到 Sant Jaume',
        body: '比较市政府和加泰罗尼亚政府，再沿古代道路方向走 Carrer del Bisbe。',
      },
      {
        title: '到主教座堂与罗马墙',
        body: '经过 Bisbe 街后在 Plaça Nova 辨认城墙和塔体，仅从外部观察已结束文化参观的主教座堂。',
      },
      {
        title: '经 Sant Felip Neri 离开',
        body: '进入较安静的广场后，沿开放街巷向 Portaferrissa 与兰布拉方向移动。',
      },
    ],
    practical: [
      '19:40 至 20:40 按公共街巷夜游处理，不假定 MUHBA 地下遗址、宗教建筑或政府建筑仍可入内。',
      '街巷方向多变，使用 Plaça del Rei、Sant Jaume、主教座堂和 Sant Felip Neri 作为连续导航节点。',
      '石铺路面和台阶在夜间较难辨认，穿防滑鞋并避免边走边仰头拍摄。',
      '街区仍有居民、礼拜场所和政府机构；控制音量，不进入有门禁的住宅院落。',
    ],
    sources: [
      {
        institution: 'Turisme de Barcelona',
        title: 'Gothic Quarter',
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/1071/gothic-quarter.html',
        verifiedAt: '2026-09-02',
        note: '核验 Cardo、Decumanus、罗马神庙、主教座堂、犹太区与 Plaça del Rei 等街区层次。',
      },
      {
        institution: 'Turisme de Barcelona',
        title: 'Plaça Sant Jaume',
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/1245/placa-sant-jaume.html',
        verifiedAt: '2026-09-02',
        note: '核验古罗马主街交会及现今市政府、加泰罗尼亚政府的空间关系。',
      },
      {
        institution: 'Turisme de Barcelona',
        title: 'Plaça Sant Felip Neri',
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/1247/placa-sant-felip-neri.html',
        verifiedAt: '2026-09-02',
        note: '核验 Sant Felip Neri 广场及巴洛克教堂的街区位置。',
      },
    ],
  },
  'la-rambla': {
    overviewTitle: '从加泰罗尼亚广场走向海港',
    originalTitle: 'La Rambla',
    overview:
      '兰布拉大道是一条约 1.2 公里的线性城市舞台，从 Plaça Catalunya 延伸到 Portal de la Pau 与海港。它在 1766 年沿中世纪城墙外缘铺设，后来串联 Canaletes 喷泉、Virreina 宫、博盖利亚市场、Miró 路面作品、Liceu 歌剧院和哥伦布纪念碑。2026 年大道正处于持续至 2027 年的改造施工中，因此此次夜行应把围挡、临时绕行和仍在运作的步行轴一起视作当代城市层。',
    orientation: [
      {
        title: '全长约一点二公里',
        body: '大道从 Plaça Catalunya 一直通向海边，50 分钟完整步行需要保持连续移动并压缩停留。',
      },
      {
        title: '路线沿旧城墙形成',
        body: '1766 年铺设的大道沿中世纪城墙外缘发展，至今仍构成 Raval 与哥特区之间的明显边界。',
      },
      {
        title: '海港是南端终点',
        body: 'Portal de la Pau 与 1888 年哥伦布纪念碑形成向海端的视觉收束，可用来确认全线方向。',
      },
    ],
    spatial: {
      type: 'district',
      title: '从 Plaça Catalunya 到海港的线性大道',
      note: '按北向南的完整步行轴组织；2026 年施工可能迫使局部横移或绕行，现场行人通道优先。',
      stops: [
        'Canaletes 喷泉与 Plaça Catalunya 南端',
        'Virreina 宫及博盖利亚市场外部',
        "Joan Miró 的 Pla de l'Os 路面马赛克",
        'Liceu 歌剧院外部',
        'Rambla de Santa Mònica 街段',
        'Portal de la Pau 与哥伦布纪念碑',
      ],
    },
    highlights: [
      {
        title: 'Canaletes 喷泉',
        summary:
          '铸铁喷泉位于大道北端，是城市饮水设施、地方传说和巴塞罗那足球俱乐部球迷庆祝传统的交汇点。',
        lookFor:
          '观察喷泉的灯柱、徽章和饮水构件如何组合，并把它作为向海步行的起始方向标。',
      },
      {
        title: "Pla de l'Os 路面马赛克",
        creator: 'Joan Miró 与 Joan Gardy Artigas',
        period: '1976 年',
        summary:
          '红、黄、蓝色的圆形作品直接嵌在大道铺地中，每天承受巨大人流，是公共艺术与城市使用最直接的重叠。',
        lookFor:
          '先退到不妨碍通行的位置辨认完整圆形，再近看磨损、接缝和行人如何无意间进入构图。',
      },
      {
        title: '哥伦布纪念碑',
        period: '1888 年',
        summary:
          '纪念碑在 Portal de la Pau 标记大道与旧港的接点，以高耸柱体成为北南轴线的海侧终点。',
        lookFor:
          '从 Rambla de Santa Mònica 接近时观察纪念碑如何逐渐越过树冠出现，并辨认基座与港口交通的尺度差。',
      },
    ],
    sequence: [
      {
        title: '从 Canaletes 向南',
        body: '若哥特区路线按计划在北段接入，先以喷泉校准方向，再沿开放的中央或侧向行人通道前进。',
      },
      {
        title: '经过 Virreina 与博盖利亚',
        body: '只看建筑和入口外部；原定 20:40 开始时市场已过周六营业时间。',
      },
      {
        title: '寻找 Miró 马赛克',
        body: "在 Pla de l'Os 留意脚下，避开密集人流后观察完整图案，再继续到 Liceu 外部。",
      },
      {
        title: '沿 Santa Mònica 到海边',
        body: '遵循施工导向牌绕过围挡，保持南行，最后以哥伦布纪念碑和 Portal de la Pau 收束。',
      },
    ],
    practical: [
      '巴塞罗那市政府确认兰布拉大道 2026 年仍在改造，整体工程延续至 2027 年；行程时间不变，但应预期围挡、噪声和临时绕行。',
      '官方 2026 年公众步行活动仍使用 Plaça Catalunya 至 Portal de la Pau 轴线，说明大道保持行人通行，但不保证每一段都按旧线直行。',
      '博盖利亚市场周一至周六营业至 20:30，原定 20:40 抵达时只能看外部，不应为了入市改变前序行程。',
      '全线约 1.2 公里，50 分钟只能在 Canaletes、Miró 马赛克和海港终点做短停；施工或人流过密时以安全通行为先。',
    ],
    sources: [
      {
        institution: 'Turisme de Barcelona',
        title: 'La Rambla',
        url: 'https://www.barcelonaturisme.com/wv3/en/page/3265/la-rambla.html',
        verifiedAt: '2026-09-02',
        note: '核验约 1.2 公里长度、1766 年形成、主要建筑及 Plaça Catalunya 至海港的轴线。',
      },
      {
        institution: 'Turisme de Barcelona',
        title: "Pla de l'Os",
        url: 'https://bid.barcelonaturisme.com/wv3/en/page/369/pla-de-l-os.html',
        verifiedAt: '2026-09-02',
        note: '核验 Joan Miró 与 Joan Gardy Artigas、1976 年及红黄蓝圆形路面作品。',
      },
      {
        institution: 'Barcelona City Council',
        title: 'La Rambla will gain more pedestrian space',
        url: 'https://ajuntament.barcelona.cat/obres/ca/noticias/la-rambla-guanyara-mes-espai-per-als-vianants-amb-la-reordenacio-de-les-terrasses-1587167',
        verifiedAt: '2026-09-02',
        note: '核验 2026 年中央区段施工及整体改造延续至 2027 年。',
      },
      {
        institution: 'Mercat de la Boqueria',
        title: 'Contact and opening hours',
        url: 'https://www.boqueria.barcelona/contact',
        verifiedAt: '2026-09-02',
        note: '核验周一至周六 08:00 至 20:30 营业，因此行程到达时市场已关闭。',
      },
    ],
  },
});
