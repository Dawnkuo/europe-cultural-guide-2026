export interface ExteriorReference {
  id: string;
  title: string;
  guideSlug?: string;
  modelId: string;
  modelName: string;
  author: string;
  authorUrl: string;
  sourceUrl: string;
  license: 'CC BY 4.0' | 'CC BY-NC-SA 4.0';
  triangles: number;
  published: string;
  scope: string;
  note: string;
}

// Public Data API metadata checked 2026-09-14. These are remote viewers,
// not downloaded assets, offline resources, or surveyed replacements.
export const exteriorReferences: ExteriorReference[] = [
  { id: 'notre-dame', title: '巴黎圣母院', guideSlug: 'notre-dame-towers', modelId: 'b5808186c49a451bbf815fbccdb727a3', modelName: 'Notre-Dame de Paris', author: 'francois.bouille', authorUrl: 'https://sketchfab.com/francois.bouille', sourceUrl: 'https://sketchfab.com/3d-models/notre-dame-de-paris-b5808186c49a451bbf815fbccdb727a3', license: 'CC BY 4.0', triangles: 303751, published: '2021-04-15', scope: '教堂扫描 · 默认视角为室内', note: '实测默认视角显示室内局部，整栋外观覆盖尚未核实，不能当作已验收的外观替换品。2021 年发布，不代表修复后的现状。作者已将原模型减至约 30 万面，纹理为 8K。' },
  { id: 'pantheon', title: '万神殿', guideSlug: 'pantheon', modelId: '8ce20ac5fc3a4af7ab223cdc0caa7d27', modelName: 'Pantheon, Rome, Italy', author: 'Brian Trepanier', authorUrl: 'https://sketchfab.com/CMBC', sourceUrl: 'https://sketchfab.com/3d-models/pantheon-rome-italy-8ce20ac5fc3a4af7ab223cdc0caa7d27', license: 'CC BY 4.0', triangles: 1488152, published: '2021-12-22', scope: '建筑外观 · 第三方模型', note: '作者未说明测量方式与完整覆盖范围；不作为室内布局或导航依据。' },
  { id: 'colosseum', title: '罗马斗兽场', guideSlug: 'colosseum', modelId: '4577eb4b21ac48ecba43e7944b4e1baf', modelName: "Rome's Colosseum", author: 'eyesCloud3D', authorUrl: 'https://sketchfab.com/eyesCloud3D', sourceUrl: 'https://sketchfab.com/3d-models/romes-colosseum-4577eb4b21ac48ecba43e7944b4e1baf', license: 'CC BY 4.0', triangles: 208520, published: '2025-04-21', scope: '无人机摄影测量', note: '作者说明由无人机视频重建。扫描可见范围不等于完整的内部通道或楼层。' },
  { id: 'florence-duomo', title: '圣母百花大教堂', guideSlug: 'florence-duomo', modelId: '382fa42bca4346979e673c12e93a2df8', modelName: 'Santa Maria del Fiore Cathedral, Florence', author: 'eyesCloud3D', authorUrl: 'https://sketchfab.com/eyesCloud3D', sourceUrl: 'https://sketchfab.com/3d-models/santa-maria-del-fiore-cathedral-florence-382fa42bca4346979e673c12e93a2df8', license: 'CC BY 4.0', triangles: 229425, published: '2025-03-07', scope: '视频摄影测量', note: '作者说明使用单段视频重建，未保证屋顶与背面的扫描完整度。' },
  { id: 'sagrada-familia', title: '圣家堂', guideSlug: 'sagrada-familia', modelId: 'db71e447f03a47a29832c823da75fd7f', modelName: 'Templo Epiatório Da Sagrada Família', author: 'danirocha02', authorUrl: 'https://sketchfab.com/danirocha02', sourceUrl: 'https://sketchfab.com/3d-models/templo-epiatorio-da-sagrada-familia-db71e447f03a47a29832c823da75fd7f', license: 'CC BY 4.0', triangles: 966675, published: '2024-04-22', scope: '建筑模型 · 非已核实的实景扫描', note: '作者未标明测量来源，模型发布于 2024 年，不能视为当前施工状态。' },
  { id: 'trevi', title: '特雷维喷泉', guideSlug: 'trevi', modelId: '60b0cdcb08e04d779dbe9c98da17185f', modelName: 'Fontana di Trevi photogrammetry scan', author: 'Miguel Bandera', authorUrl: 'https://sketchfab.com/miguelbandera', sourceUrl: 'https://sketchfab.com/3d-models/fontana-di-trevi-photogrammetry-scan-60b0cdcb08e04d779dbe9c98da17185f', license: 'CC BY 4.0', triangles: 1334155, published: '2020-04-11', scope: '喷泉摄影测量', note: '作者使用公开视频等影像重建；素材权利尚未逐一核实，当前仅使用公开查看器，不重新分发文件。' },
  { id: 'louvre-sully', title: '卢浮宫 · 苏利馆局部', modelId: '88e6f35a64794513bab497537021ca08', modelName: 'Pavillon Sully (Louvre Museum) - Photogrammetry', author: 'Nicolas Diolez', authorUrl: 'https://sketchfab.com/nicolasdiolez', sourceUrl: 'https://sketchfab.com/3d-models/pavillon-sully-louvre-museum-photogrammetry-88e6f35a64794513bab497537021ca08', license: 'CC BY-NC-SA 4.0', triangles: 4892649, published: '2024-02-05', scope: '苏利馆钟楼局部 · 非整个卢浮宫', note: '1610 张地面照片重建，8K 纹理。许可限非商业用途，修改版本须以相同许可共享；未加入既定行程。' },
  { id: 'cologne-cathedral', title: '科隆大教堂', guideSlug: 'cologne-cathedral', modelId: '200bac005a2e42458e64060d9719cd06', modelName: 'Cologne Cathedral', author: 'Shahriar Shahrabi', authorUrl: 'https://sketchfab.com/shahriyarshahrabi', sourceUrl: 'https://sketchfab.com/3d-models/cologne-cathedral-200bac005a2e42458e64060d9719cd06', license: 'CC BY 4.0', triangles: 367835, published: '2023-02-08', scope: '微缩模型扫描 · 非实地建筑扫描', note: '作者明确说明对象是微缩模型，不能据此推断真实建筑尺寸与细节。' },
];

export function referenceLicenseUrl(model: ExteriorReference) {
  return model.license === 'CC BY-NC-SA 4.0'
    ? 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    : 'https://creativecommons.org/licenses/by/4.0/';
}
