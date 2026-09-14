// Horizontal geometry uses individually selected OSM buildings, not nearby-place buffers.
// Heights without source tags are explicitly massing estimates, never measured claims.
export const museums = [
  {slug:'last-supper',title:'最后的晚餐 · 修道院',city:'米兰',keys:['r37730'],height:12,material:'brick',roof:'tile',sources:['https://cenacolovinciano.org/'],features:['修道院院落','独立长形食堂','砖墙与瓦屋顶']},
  {slug:'sforza',title:'斯福尔扎城堡',city:'米兰',keys:['r1918'],height:17,material:'brick',roof:'tile',sources:['https://www.milanocastello.it/scopri-il-castello/torri-merlate-e-sotterranei','https://www.italia.it/en/lombardy/milan/castello-sforzesco'],features:['三个庭院','菲拉雷特入口塔','圆形角塔与方塔','城墙轮廓']},
  {slug:'brera',title:'布雷拉美术馆',city:'米兰',keys:['r178303'],height:21,material:'sandstone',roof:'tile',sources:['https://pinacotecabrera.org/en/about-us/palazzo-brera/'],features:['中央双层柱廊庭院','多院落宫殿','天文台穹顶']},
  {slug:'la-scala',title:'斯卡拉歌剧院博物馆',city:'米兰',keys:['r6552704'],height:21,material:'limestone',roof:'lead',sources:['https://censimentoarchitetturecontemporanee.cultura.gov.it/scheda-opera?id=2590'],features:['新古典主义前楼','舞台高台塔','椭圆形现代增建体','里科尔迪馆翼']},
  {slug:'doges-palace',title:'总督宫',city:'威尼斯',keys:['w138803915'],height:24,material:'sandstone',roof:'tile',sources:['https://palazzoducale.visitmuve.it/en/building-and-history/','https://palazzoducale.visitmuve.it/en/layout-and-collections/courtyard-and-loggias/'],features:['中央庭院','临水双层开放柱廊','上部宫殿主体','四翼屋顶']},
  {slug:'correr',title:'科雷尔博物馆',city:'威尼斯',keys:['w410344936','w138803888'],height:22,material:'limestone',roof:'tile',sources:['https://correr.visitmuve.it/la-sede-e-la-storia/'],features:['拿破仑翼','新行政官邸相接长翼','广场侧连续柱廊'],scope:'Museum occupies the Napoleonic Wing and part of the Procuratie Nuove; the connected palace exteriors provide context, not museum-room boundaries.'},
  {slug:'accademia-venice',title:'威尼斯学院美术馆',city:'威尼斯',keys:['r2080489','w138842956'],height:15,material:'brick',roof:'tile',sources:['https://www.gallerieaccademia.it/vivi-museo/sedi-e-storia/'],features:['慈善圣母教堂旧址','修道院庭院','会馆前楼']},
  {slug:'camposanto',title:'比萨墓园',city:'比萨',keys:['r154289','w163739528'],height:12,material:'marble',roof:'tile',sources:['https://www.opapisa.it/visita/camposanto/'],features:['长矩形庭院','四边回廊','北侧礼拜堂','大理石外墙']},
  {slug:'sinopie',title:'壁画底稿博物馆',city:'比萨',keys:['w701045438'],height:12,material:'sandstone',roof:'tile',sources:['https://www.opapisa.it/visita/museo-delle-sinopie/'],features:['旧医院长形展厅','连续坡屋顶','广场侧石墙']},
  {slug:'opera-pisa',title:'比萨主教座堂博物馆',city:'比萨',keys:['w546333990'],height:13,material:'sandstone',roof:'tile',sources:['https://www.opapisa.it/visita/museo-dellopera/'],features:['旧教士住宅','回廊庭院','双层馆翼']},
  {slug:'accademia-florence',title:'佛罗伦萨学院美术馆',city:'佛罗伦萨',keys:['r1583912'],height:14,material:'limestone',roof:'tile',sources:['https://www.galleriaaccademiafirenze.it/la-galleria/','https://www.galleriaaccademiafirenze.it/wp-content/uploads/2024/07/GAF_mappa_2024.pdf'],features:['街道馆舍','院落建筑群','大卫圆顶展厅'],scope:'Connected former institutional complex, including the adjoining art academy; museum boundaries remain in the separate indoor plan.'},
  {slug:'medici-chapels',title:'美第奇礼拜堂',city:'佛罗伦萨',keys:['w24883267','w599900772','w599900778','w599900777'],height:19,material:'sandstone',roof:'tile',sources:['https://bargellomusei.it/musei/cappelle-medicee/'],features:['八角形王公礼拜堂','高耸八棱穹顶','新圣器室','相接的圣洛伦佐教堂']},
  {slug:'uffizi',title:'乌菲兹美术馆',city:'佛罗伦萨',keys:['w477279033'],height:24,material:'limestone',roof:'tile',sources:['https://www.uffizi.it/en/artworks/ll-palazzo-degli-uffizi','https://www.uffizi.it/opere/la-tribuna'],features:['U形长廊','阿尔诺河端连廊','双侧柱廊','八角形珍宝厅']},
  {slug:'vasari-corridor',title:'瓦萨里走廊',city:'佛罗伦萨',keys:['w1344547176'],height:12,material:'sandstone',roof:'tile',sources:['https://www.uffizi.it/corridoio-vasariano'],features:['沿阿尔诺河转折','老桥上方通道','绕行曼内利塔','通向皮蒂宫的架空段'],scope:'The mapped exterior corridor envelope; height is schematic and does not encode walkable indoor elevation or ticket access.'},
  {slug:'pitti',title:'皮蒂宫',city:'佛罗伦萨',keys:['r1637338'],height:30,material:'sandstone',roof:'tile',sources:['https://www.uffizi.it/palazzo-pitti/storia'],features:['宽阔的石砌正立面','后部庭院','两侧宫殿翼','层间横向分带']},
  {slug:'borghese',title:'博尔盖塞美术馆',city:'罗马',keys:['w50842218'],height:20,material:'limestone',roof:'tile',sources:['https://galleriaborghese.cultura.gov.it/il-museo/la-villa/'],features:['中央别墅主体','两侧突出馆翼','高低相间屋顶','入口阶梯']},
  {slug:'vatican-museums',title:'梵蒂冈博物馆',city:'梵蒂冈',keys:['r49690','r2885516','w35027800','w112137587','w255959482','w30002751','w111731149','w215289671','w308214026'],height:23,material:'limestone',roof:'tile',sources:['https://www.museivaticani.va/content/museivaticani/en/collezioni/musei.html'],features:['松果与贝尔韦代雷庭院组','东西长馆翼','绘画馆与现代馆翼','教宗宫院落','西斯廷礼拜堂'],scope:'Museum and adjoining Apostolic Palace campus; does not imply all palace spaces are publicly accessible. Saint Peter’s Basilica retains its separate model.'},
  {slug:'gaudi-house',title:'高迪故居博物馆',city:'巴塞罗那',keys:['w126856515'],height:10,material:'sandstone',roof:'tile',sources:['https://sagradafamilia.org/es/casa-museo-gaudi'],features:['粉色住宅主体','角部高塔','尖顶与坡屋顶','花园侧门廊']},
  {slug:'picasso-barcelona',title:'巴塞罗那毕加索博物馆',city:'巴塞罗那',keys:['r11224200','r11224206','r11224207','r11224210','w214585960'],height:16,material:'sandstone',roof:'tile',sources:['https://museupicassobcn.cat/en/museum/buildings'],features:['五座相连宫邸','独立的内部院落','沿蒙卡达街的前楼','多段屋顶']},
  {slug:'museum-ludwig',title:'路德维希博物馆',city:'科隆',keys:['w10154135','w27567143'],height:21,material:'brick',roof:'lead',sources:['https://www.museum-ludwig.de/en/home/museum/the-museum/architecture'],features:['层叠馆舍','锌板锯齿屋顶','低层入口','红砖墙面']},
  {slug:'chocolate-museum',title:'科隆巧克力博物馆',city:'科隆',keys:['w334606061'],height:12,material:'brick',roof:'lead',sources:['https://www.schokoladenmuseum.de/das-museum/','https://www.schokoladenmuseum.de/wp-content/uploads/2021/06/Architektur-Schokoladenmuseum.pdf'],features:['船首形玻璃新馆','旧海关楼','高低错落展厅','玻璃温室']},
];

// Retain the entire campus ground plane. Courts are surface zones, never excavated holes.
Object.assign(museums.find(m=>m.slug==='vatican-museums'),{groundCourts:['w37703144','w37733071','w176719108','w42083338']});
Object.assign(museums.find(m=>m.slug==='chocolate-museum'),{keys:['w334606061','w369375842','w364903918','w364903926','w369460251','w369330865']});
Object.assign(museums.find(m=>m.slug==='brera'),{
 keys:['r178303','w725694902'],
 features:['中央双层柱廊庭院','多院落宫殿','植物园小天文亭'],
 sources:['https://pinacotecabrera.org/en/about-us/palazzo-brera/','https://museoastronomico.brera.inaf.it/il-restauro-del-cupolino-astronomico/'],
});
museums.find(m=>m.slug==='accademia-florence').sources.push('https://altralineaedizioni.it/wordpress/wp-content/uploads/2018/02/ACCADEMIA-anteprima.pdf');
