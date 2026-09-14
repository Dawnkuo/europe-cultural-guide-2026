import { accademiaVisitorInformation } from './accademia-visitor-information';

export type VisitorTopic = {
  id: string;
  title: string;
  icon:
    | 'entrance'
    | 'transfer'
    | 'bags'
    | 'accessibility'
    | 'camera'
    | 'rest'
    | 'post'
    | 'stairs';
  paragraphs: string[];
  places?: Array<{ id: string; label: string }>;
  guides?: Array<{ slug: string; label: string }>;
  evidenceIds: string[];
};

export type VisitorInformation = {
  verifiedAt: string;
  topics: VisitorTopic[];
  questions: Array<{
    id: string;
    question: string;
    paragraphs: string[];
    evidenceIds: string[];
  }>;
};

// Operational context only. Booked dates, products and visit order remain in trip data.
export const vaticanPostHours = {
  square: '圣彼得广场 San Pietro：周一至周六 08:30–18:30；周日是否营业待确认。',
  bells: '钟门 Arco delle Campane：周一至周六 08:30–19:15。',
  museums: '博物馆内 Musei Vaticani：周一至周六 08:30–18:30。',
};

export const visitorInformation: Record<string, VisitorInformation> = {
  'accademia-florence': accademiaVisitorInformation,
  'vatican-museums': {
    verifiedAt: '2026-09-09',
    topics: [
      {
        id: 'arrival',
        title: '从 Viale Vaticano 入馆',
        icon: 'entrance',
        paragraphs: [
          '博物馆入口在 Viale Vaticano，和圣彼得广场上的教堂入口分开。乘地铁可在 A 线 Ottaviano 或 Cipro 下车，之后仍需步行到博物馆一侧。',
          '清晨开门团按预约确认里的集合地点与时间报到，不套用普通开放时间。安检、凭证兑换和团体集合不是同一个环节；需要协助时先找入口信息台。',
        ],
        places: [
          { id: 'first-入口-1', label: '博物馆入口' },
          { id: 'first-信息-1', label: '信息台' },
        ],
        evidenceIds: ['mv-arrival', 'mv-map', 'existing-bookings'],
      },
      {
        id: 'baggage',
        title: '寄存后，离馆前取回',
        icon: 'bags',
        paragraphs: [
          '衣帽间位于入口安检后，免费寄存。尺寸或性质不适合带入展厅的行李由工作人员要求寄存；大伞、自拍杆等也有携带限制。',
          '领取寄存物的柜台可从莫莫螺旋楼梯下方的出口大厅到达。若接着去圣彼得大教堂，先处理寄存物，不能假定能在教堂一侧取回。',
        ],
        places: [
          { id: 'first-衣帽间-1', label: '衣帽间' },
          { id: 'first-出口-1', label: '博物馆出口' },
        ],
        evidenceIds: ['mv-cloakroom', 'mv-advice', 'mv-map'],
      },
      {
        id: 'sistine',
        title: '西斯廷：先读，再静看',
        icon: 'camera',
        paragraphs: [
          '普通展区可作私人摄影，不开闪光灯；西斯廷礼拜堂禁止拍照、录像和使用手机，并要求安静。先在进入前看完天顶与祭坛墙的解说。',
          '参观时遮住肩部和膝部，进入室内摘帽。不要触摸作品；衣着要求也适用于之后的教堂参观。',
        ],
        places: [{ id: 'first-西斯廷室内-1', label: '西斯廷礼拜堂' }],
        evidenceIds: ['mv-advice', 'mv-map'],
      },
      {
        id: 'rest',
        title: '用庭院和餐饮区休息',
        icon: 'rest',
        paragraphs: [
          '松果庭院、绘画馆庭院等设有休息区域。餐饮服务分布在馆内，不必把所有休息都留到离馆以后；展厅内不饮食。',
          '洗手间、婴儿护理和餐饮点分布在不同楼层。博物馆内没有供游客使用的 Wi-Fi，入馆前准备好二维码和离线资料。',
        ],
        places: [
          { id: 'first-松果庭院-1', label: '松果庭院' },
          { id: 'first-餐饮-1', label: '一层餐饮区' },
        ],
        evidenceIds: ['mv-advice', 'mv-food', 'mv-map'],
      },
      {
        id: 'accessibility',
        title: '电梯路线与楼梯路线分开',
        icon: 'accessibility',
        paragraphs: [
          '推婴儿车或需要无障碍通行时，先让工作人员指引电梯路线；不要把常规楼梯动线直接当作无障碍动线。馆内设有婴儿护理设施和哺乳空间。',
          '衣帽间可提供轮椅借用，数量有限，需有效证件和押金。需要帮助时在入馆处办理，不必等走到楼梯前才寻找替代通道。',
        ],
        places: [
          { id: 'first-信息-1', label: '入口信息台' },
          { id: 'basement-无障碍洗手间-1', label: '地下层无障碍洗手间' },
        ],
        evidenceIds: ['mv-advice', 'mv-cloakroom', 'mv-map'],
      },
      {
        id: 'transfer',
        title: '离馆与去大教堂是两段路',
        icon: 'transfer',
        paragraphs: [
          '博物馆的出口在馆区北侧，大教堂从圣彼得广场一侧安检进入。没有得到当天领队或工作人员确认时，不把西斯廷通往教堂的内部通道当作可用捷径。',
          '继续自由参观前，先确认团体结束点和出口方向；“全馆绝对单向”或“任何位置都能原路返回”都不能代替当日动线。离馆后前往教堂，还要经过另一处安检。',
        ],
        places: [{ id: 'first-出口-1', label: '博物馆出口' }],
        guides: [
          { slug: 'st-peters-basilica', label: '圣彼得大教堂' },
          { slug: 'st-peters-square', label: '圣彼得广场' },
        ],
        evidenceIds: [
          'mv-map',
          'sp-access',
          'access-uncertainty',
          'existing-bookings',
        ],
      },
      {
        id: 'post',
        title: '馆内也有邮局',
        icon: 'post',
        paragraphs: [
          vaticanPostHours.museums,
          '这与广场外的邮政网点不是同一处。馆内网点受入馆条件限制；临时调整和实际受理以柜台为准。',
        ],
        places: [{ id: 'first-邮局-1', label: '博物馆内邮局' }],
        guides: [{ slug: 'vatican-post', label: '梵蒂冈邮局' }],
        evidenceIds: ['post-offices', 'mv-map'],
      },
    ],
    questions: [
      {
        id: 'breakfast',
        question: '普通入场票也包含开门团和早餐吗？',
        paragraphs: [
          '不能从普通门票推断包含这些服务。你已有的开门团和后续参观仍按本次预约；集合、早餐及散团后的安排，以该产品的确认内容和领队交接为准。',
        ],
        evidenceIds: ['existing-bookings'],
      },
      {
        id: 'basilica-ticket',
        question: '博物馆票可以直接用于圣彼得大教堂吗？',
        paragraphs: [
          '两处入口和参观安排分开。大教堂普通参观可免费排队进入，预约时段、语音服务及穹顶另有安排；不能把博物馆票当成教堂预约或安检通行证。',
        ],
        evidenceIds: ['sp-access', 'mv-arrival'],
      },
      {
        id: 'sistine-phone',
        question: '西斯廷里可以边看手机解说边参观吗？',
        paragraphs: [
          '不可以在礼拜堂内使用手机。把解说放在进门前阅读，进入后安静观看，也不要拍照或录像。',
        ],
        evidenceIds: ['mv-advice'],
      },
      {
        id: 'missing-work',
        question: '地图和目录里有的展厅、作品当天一定能看到吗？',
        paragraphs: [
          '不一定。临时封闭、借展或更换陈列会影响当天可看内容。遇到围挡时询问工作人员，不因地图有连通空间就穿过受限区域。',
        ],
        evidenceIds: ['mv-advice', 'access-uncertainty'],
      },
      {
        id: 'lost-property',
        question: '走散或遗失东西怎么办？',
        paragraphs: [
          '先向最近的值守人员或安保点求助。已经离馆后，失物协助邮箱是 accoglienza.musei@scv.va；在馆内不必为了联络而逆着人流自行寻找。',
        ],
        evidenceIds: ['mv-advice'],
      },
    ],
  },
  'st-peters-basilica': {
    verifiedAt: '2026-09-09',
    topics: [
      {
        id: 'arrival',
        title: '先到广场右侧安检',
        icon: 'entrance',
        paragraphs: [
          '面向大教堂时，安检点位于圣彼得广场右侧半圆。已预约也要经过安检；遇到礼仪或人流管制，按现场分流进入。',
          '地铁 A 线 Ottaviano 可到达这一带，但下车后仍需步行。这里不是 Viale Vaticano 的博物馆入口。',
        ],
        guides: [{ slug: 'st-peters-square', label: '圣彼得广场' }],
        evidenceIds: ['sp-access', 'mv-arrival'],
      },
      {
        id: 'booking-order',
        title: '穹顶与圣殿按各自二维码',
        icon: 'transfer',
        paragraphs: [
          '穹顶有 Sobieski 与 Lambertini 两种分配路线，教堂与登顶的先后可以不同。看清二维码邮件指定的路线、日期和时段，不用通用攻略替换个人预约。',
          '付款或预订确认凭证与入场二维码不是同一件东西。入场时备好每位参观者的二维码。建议提前留出安检余量，是否有指定报到时间以个人凭证为准。',
        ],
        evidenceIds: ['sp-dome', 'sp-access', 'existing-bookings'],
      },
      {
        id: 'climb',
        title: '电梯只到露台，之后还要爬',
        icon: 'stairs',
        paragraphs: [
          '全程步行约 551 级；乘电梯到露台后，登上穹顶顶部仍有约 320 级台阶。上部通道狭窄、坡度大，登顶并非全程无障碍。',
          '穿稳固的鞋，只带小包。若爬升变得吃力，可在完成登顶前向工作人员说明并返回，不必勉强继续。',
        ],
        evidenceIds: ['sp-dome'],
      },
      {
        id: 'bags-dress',
        title: '轻装入内，肩膝遮盖',
        icon: 'bags',
        paragraphs: [
          '大教堂没有行李寄存设施。行李箱和大包不要带到安检后再找地方存；提前安排在住宿处等合适地点。',
          '穿长裤，或过膝裙装，并遮盖肩部。圣殿可不使用闪光灯拍照，但礼仪、祈祷区域和其他参观者应受到尊重。',
        ],
        evidenceIds: ['sp-access', 'sp-visits'],
      },
      {
        id: 'services',
        title: '接待区与露台服务',
        icon: 'rest',
        paragraphs: [
          '接待区设有洗手间。穹顶下行途中，露台层有洗手间、休息餐饮及商店；这些服务不是穹顶顶端的设施。',
          '大教堂可通过坡道和电梯协助无障碍进入。需要通行帮助或感到不适时联系工作人员，不把穹顶电梯理解为可以直达最高观景处。',
        ],
        evidenceIds: ['sp-welcome', 'sp-dome', 'sp-access'],
      },
      {
        id: 'underground',
        title: '地下墓穴不等于考古墓区',
        icon: 'entrance',
        paragraphs: [
          'Grotte Vaticane 是教堂下方的梵蒂冈地下墓穴，可免费参观，内部禁止摄影。更深处的 Necropoli Vaticana 是单独预约的考古参观，不因进入墓穴就自动包含。',
          '地下空间并非全部对外开放。不要把登顶票或圣殿预约当成考古墓区的入场资格。',
        ],
        places: [{ id: 'grottoes-5-1', label: '地下墓穴 · 圣彼得小堂区域' }],
        evidenceIds: ['sp-grottoes', 'sp-necropolis', 'sp-map'],
      },
    ],
    questions: [
      {
        id: 'free-entry',
        question: '大教堂免费，为什么还有预约费用？',
        paragraphs: [
          '普通进入圣殿免费；指定时段的线上预约包含额外服务，例如数字语音导览。穹顶、珍宝馆及考古墓区有各自的产品与条件，不与免费进入圣殿混为一谈。',
        ],
        evidenceIds: ['sp-access', 'sp-visits'],
      },
      {
        id: 'qr',
        question: '只有确认凭证，没有入场二维码怎么办？',
        paragraphs: [
          '查找预订后第二封含二维码的邮件，也检查垃圾邮件。仍没有时联系 booking@basilicasanpietro.va；到访当日也可通过 myqr.basilicasanpietro.va，使用预订邮箱和确认资料找回。',
        ],
        evidenceIds: ['sp-access'],
      },
      {
        id: 'accessible-dome',
        question: '轮椅可以乘电梯直接登顶吗？',
        paragraphs: [
          '不可以。电梯只代替下面一段爬升，顶部仍须经过台阶。需要无障碍参观时，可向接待人员确认圣殿和允许到达区域，不把顶端观景作为可达承诺。',
        ],
        evidenceIds: ['sp-dome', 'sp-access'],
      },
      {
        id: 're-entry',
        question: '穹顶下来后，可以凭同一张票再上一次吗？',
        paragraphs: [
          '穹顶票为单次参观，不可退出后重复登顶。教堂参观和登顶按你收到的路线安排完成。',
        ],
        evidenceIds: ['sp-dome'],
      },
      {
        id: 'grotto-photo',
        question: '地下墓穴也能像圣殿一样拍照吗？',
        paragraphs: [
          '不可以。圣殿普通参观允许不使用闪光灯摄影，但梵蒂冈地下墓穴禁止摄影；考古墓区同样禁止拍照和录像。',
        ],
        evidenceIds: ['sp-grottoes', 'sp-necropolis-photo', 'sp-access'],
      },
      {
        id: 'rain',
        question: '下雨会取消登顶吗？',
        paragraphs: [
          '普通下雨不必然关闭穹顶，极端天气则可能临时停止进入。重大礼仪或组织安排也会影响通行；以收到的通知和现场执行为准，不自行改变预约。',
        ],
        evidenceIds: ['sp-dome'],
      },
    ],
  },
  'st-peters-square': {
    verifiedAt: '2026-09-09',
    topics: [
      {
        id: 'orientation',
        title: '先分清广场两侧',
        icon: 'entrance',
        paragraphs: [
          '面向大教堂时，右侧半圆是教堂安检方向；左侧半圆附近有圣彼得广场邮政办事点。广场、教堂和博物馆入口不是同一处。',
          '广场的开放空间不代表柱廊内每条通道都可通行。围栏、安检和活动座椅会改变可走路线，按现场指示绕行。',
        ],
        guides: [
          { slug: 'st-peters-basilica', label: '圣彼得大教堂' },
          { slug: 'vatican-post', label: '梵蒂冈邮局' },
        ],
        evidenceIds: ['sp-access', 'post-building', 'access-uncertainty'],
      },
      {
        id: 'post',
        title: '寄明信片前认准网点',
        icon: 'post',
        paragraphs: [
          vaticanPostHours.square,
          vaticanPostHours.bells,
          '两处是不同柜台，不把钟门的较晚闭门时间套到广场网点。服务时间可能临时调整。',
        ],
        guides: [{ slug: 'vatican-post', label: '邮局与寄件说明' }],
        evidenceIds: ['post-offices', 'existing-bookings'],
      },
      {
        id: 'rest',
        title: '露天广场与休息安排',
        icon: 'rest',
        paragraphs: [
          '广场大部分区域露天，建议做好防晒、备水；下雨时留意石面。拍照停留不要堵住安检口或柱廊通道。',
          '教堂接待区设有洗手间，但须按现场开放和进入条件使用；穹顶露台的餐饮与洗手间属于登顶过程中的服务，不是广场上的公共设施。',
        ],
        evidenceIds: ['sp-welcome', 'sp-dome', 'editorial-advice'],
      },
      {
        id: 'events',
        title: '礼仪活动可能改变通行',
        icon: 'transfer',
        paragraphs: [
          '教宗接见、公开礼仪或其他活动可能增加安检与分流。广场平日可停留，不代表活动当天所有位置都无需凭证。',
          '进教堂前建议留出安检余量。个人预约如有明确报到要求，按所收到的确认执行，不把普通游览建议误作票面规定。',
        ],
        evidenceIds: ['sp-access', 'existing-bookings', 'editorial-advice'],
      },
    ],
    questions: [
      {
        id: 'museum-entrance',
        question: '从广场可以直接进入梵蒂冈博物馆吗？',
        paragraphs: [
          '不能把这里当博物馆门口。博物馆游客入口在 Viale Vaticano；如果前往博物馆，应先确认所订产品的集合地点。',
        ],
        evidenceIds: ['mv-arrival', 'mv-map'],
      },
      {
        id: 'clothing',
        question: '只逛广场，之后临时决定进教堂怎么办？',
        paragraphs: [
          '进入教堂前仍要通过安检并符合衣着要求。准备遮肩、过膝的衣物和小包；大教堂没有行李寄存服务。',
        ],
        evidenceIds: ['sp-access'],
      },
      {
        id: 'post-closing',
        question: '广场邮局关门后，可以去馆内邮局补寄吗？',
        paragraphs: [
          '馆内邮局受博物馆入场条件限制，不能把它当成广场外可随时进入的替代柜台。钟门网点营业较晚，也应先确认当天是否正常受理。',
        ],
        evidenceIds: ['post-offices', 'mv-map'],
      },
    ],
  },
  'vatican-post': {
    verifiedAt: '2026-09-09',
    topics: [
      {
        id: 'offices',
        title: '三个网点，分别看时间',
        icon: 'post',
        paragraphs: [
          vaticanPostHours.square,
          vaticanPostHours.bells,
          vaticanPostHours.museums,
          '以上为通常服务时间，节假日或临时安排可能调整。博物馆内网点需满足入馆条件。',
        ],
        evidenceIds: ['post-offices', 'mv-map'],
      },
      {
        id: 'address',
        title: '先写地址，再确认邮资',
        icon: 'post',
        paragraphs: [
          '建议先备好收件人、完整地址、邮编及目的地国家。向柜台说明寄往哪里、是明信片还是信件，再确认邮资和可用邮票；不按纪念图案或面值猜是否足额。',
          '需要纪念邮戳时，先询问柜台当天能提供的服务。盖戳、交寄与仅购买收藏品是不同需求，应说明是否真的寄出。',
        ],
        evidenceIds: ['editorial-advice', 'post-services'],
      },
      {
        id: 'location',
        title: '广场网点与馆内网点分开',
        icon: 'entrance',
        paragraphs: [
          '圣彼得广场的新办事点位于左半圆柱廊附近。离开教堂后寄件，先确认自己来到的是邮政柜台，而不是附近的纪念品店。',
          '在博物馆参观期间也可以使用馆内网点，但不为寄件而改动已有参观顺序。',
        ],
        guides: [
          { slug: 'st-peters-square', label: '圣彼得广场' },
          { slug: 'vatican-museums', label: '梵蒂冈博物馆' },
        ],
        evidenceIds: ['post-building', 'mv-map', 'editorial-advice'],
      },
    ],
    questions: [
      {
        id: 'sunday',
        question: '圣彼得广场网点周日开门吗？',
        paragraphs: [
          '周日暂不作为已确认营业日：现有营业说明对周日有分歧。周一至周六 08:30–18:30 的信息一致；若周日前往，先向柜台确认。钟门和博物馆网点列的是周一至周六。',
        ],
        evidenceIds: ['post-offices', 'post-services'],
      },
      {
        id: 'stamp',
        question: '只买邮票，就算把明信片寄出了吗？',
        paragraphs: [
          '不是。还需完整填写、确认邮资并交给柜台或投入相应投递设施。想要寄出和想要保留未使用邮票，应向柜台分开说明。',
        ],
        evidenceIds: ['editorial-advice', 'post-services'],
      },
      {
        id: 'arrival',
        question: '能保证在回国前收到明信片吗？',
        paragraphs: [
          '不能保证。国际邮件还涉及目的地邮政的运输与投递；把它当旅行纪念，不把收到日期当成确定行程事项。重要或有时限的文件应另选适合的服务。',
        ],
        evidenceIds: ['editorial-advice'],
      },
    ],
  },
};
