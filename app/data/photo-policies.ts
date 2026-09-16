export type PhotoPolicy = {
  status: 'personal' | 'conditional' | 'unconfirmed';
  text: string;
  sources: { label: string; url: string }[];
  checkedAt: string;
};

const policy = (
  status: PhotoPolicy['status'],
  text: string,
  label: string,
  url: string,
): PhotoPolicy => ({
  status,
  text,
  sources: [{ label, url }],
  checkedAt: '2026-09-16',
});

export const photoPolicies: Record<string, PhotoPolicy> = {
  milan: policy(
    'personal',
    '仅限严格私人用途；教堂举行礼仪时不拍摄。出版、商业或专业拍摄须另行获准。',
    '米兰大教堂拍摄规则',
    'https://www.duomomilano.it/en/regulations/press-and-permits/',
  ),
  scala: policy(
    'conditional',
    '博物馆可作私人无闪光灯摄影；剧院包厢须服从现场标识，排练与演出期间不拍。开放视角不保证。',
    '斯卡拉博物馆 FAQ',
    'https://www.museoscala.org/en/visit/museum-and-theater/faq.html',
  ),
  brera: policy(
    'personal',
    '不得使用闪光灯，不触碰绘画；临展或个别作品的禁拍标识优先。',
    '布雷拉官方参观规则（第28页）',
    'https://pinacotecabrera.org/wp-content/uploads/2025/01/Pinacoteca-Brera-Guida-Museo-per-tutti.pdf',
  ),
  muve: policy(
    'personal',
    '官方允许非营利用途的低分辨率照片；不用闪光灯、三脚架、自拍杆，不接触作品。专门摄影服务须另行申请。',
    '威尼斯市立博物馆参观规则',
    'https://correr.visitmuve.it/wp-content/uploads/sites/3/2026/01/Regolamento-di-Visita-MUVE_Inglese_2024.pdf',
  ),
  mark: policy(
    'personal',
    '官网现行入场规则第13条允许严格私人用途照片；专业设备、其他复制用途及直播不获默认许可。现场礼仪与管理要求优先。',
    '圣马可入场规则（2025版）',
    'https://www.basilicasanmarco.it/wp-content/uploads/2025/05/04-Regolamento-di-accesso.pdf',
  ),
  florence: policy(
    'personal',
    '室内可拍照，不使用闪光灯、三脚架或自拍杆；不在楼梯通道停留阻挡登顶队伍。',
    '圣母百花官方参观规则',
    'https://duomo.firenze.it/en/visit/plan-your-visit',
  ),
  uffizi: policy(
    'personal',
    '个人及学习用途可无闪光灯手持拍摄；禁三脚架、自拍杆、灯架及专业设备。临展借展作品除外，馆员与禁拍标识优先。',
    '乌菲齐与皮蒂宫官方规则',
    'https://www.uffizi.it/en/notices/rules',
  ),
  medici: policy(
    'personal',
    '个人非营利拍摄不得接触作品、使用额外光源或在馆内架设三脚架；专业拍摄另需许可。',
    '巴杰罗博物馆体系影像规则',
    'https://bargellomusei.it/servizi/',
  ),
  vatican: policy(
    'personal',
    '普通博物馆展区可作私人摄影，禁闪光灯、三脚架与自拍杆。西斯廷礼拜堂禁止拍照和录像，不列为拍摄机位。',
    '梵蒂冈博物馆参观须知',
    'https://www.museivaticani.va/content/museivaticani/en/organizza-visita/consigli-utili.html',
  ),
  peter: {
    ...policy(
      'conditional',
      '官方 FAQ 允许无闪光灯摄影，但礼仪规则同时要求避免拍摄打扰；以现场人员指示为准。禁三脚架、自拍杆与录像；宝库、考古墓区不可拍摄。',
      '圣彼得摄影 FAQ',
      'https://www.basilicasanpietro.va/en/faq/is-it-possible-to-take-photographs',
    ),
    sources: [
      {
        label: '摄影 FAQ',
        url: 'https://www.basilicasanpietro.va/en/faq/is-it-possible-to-take-photographs',
      },
      {
        label: '礼仪与行为规则',
        url: 'https://www.basilicasanpietro.va/en/rules-for-the-common-good',
      },
      {
        label: '宝库禁拍规则',
        url: 'https://www.basilicasanpietro.va/en/help/the-treasury-museum',
      },
    ],
  },
  sagrada: policy(
    'conditional',
    '官网对摄影器材进入及传播用途设有授权限制，不能由网上实拍推定相机可带入。此处为构图参考；携带器材和实际拍摄前先向馆方确认，禁擅自架设三脚架。',
    '圣家堂摄影条款',
    'https://sagradafamilia.org/en/rules-and-conditions-of-sale',
  ),
  pedrera: policy(
    'conditional',
    '不得使用闪光灯或携带专业摄影器材；官网对拍摄、三脚架及图片发布设有授权条款，入馆先确认私人手持摄影范围。屋顶雨天可能关闭。',
    '米拉之家现行规则',
    'https://www.lapedrera.com/en/regulations/',
  ),
  palau: policy(
    'personal',
    '参观期间允许拍照，不用闪光灯或三脚架。此规则不等同于音乐演出期间许可；按当次参观开放区域取景。',
    '加泰罗尼亚音乐宫 FAQ',
    'https://www.palaumusica.cat/en/practical-information_1642451',
  ),
  picasso: policy(
    'personal',
    '可作私人无闪光灯摄影；三脚架、自拍杆及专业器材需授权。不得未经同意拍摄其他观众和工作人员。',
    '毕加索博物馆入场规则',
    'https://museupicassobcn.cat/en/planifica-la-visita/normativa-de-acces-i-visita',
  ),
  cologne: policy(
    'personal',
    '礼仪之外允许私人无闪光灯拍摄，不使用附加器材；祈祷区域和工作人员要求优先。',
    '科隆大教堂规则 §2',
    'https://www.koelner-dom.de/en',
  ),
  ludwig: policy(
    'personal',
    '馆藏只可作私人非商业拍摄；个别禁拍标识和临展规则优先，不用闪光灯、三脚架或自拍杆。',
    '路德维希博物馆规则',
    'https://www.museum-ludwig.de/en/home/visit/information/rules-at-the-museum-ludwig',
  ),
};

export function photoPolicyFor(key?: string): PhotoPolicy | undefined {
  return key ? photoPolicies[key] : undefined;
}
