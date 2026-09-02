export type CityProfile = {
  name: string;
  country: string;
  image: string;
  imageAlt: string;
  period: string;
  introduction: string;
  lens: string[];
};

export const cityProfiles: CityProfile[] = [
  {
    name: "巴黎",
    country: "法国",
    image: "/images/paris.jpg",
    imageAlt: "巴黎圣母院与塞纳河",
    period: "9月25日 / 10月5–6日",
    introduction: "这次巴黎是旅程的门廊与尾声：第一次只完成机场衔接，最后一日才把视线落回塞纳河与巴黎圣母院。",
    lens: ["巴黎圣母院的哥特立面", "塞纳河与城市岛屿", "跨国铁路的终点巴黎北站"],
  },
  {
    name: "米兰",
    country: "意大利",
    image: "/images/milan.jpg",
    imageAlt: "米兰大教堂立面",
    period: "9月25–26日",
    introduction: "米兰章节把宗教建筑、文艺复兴壁画与表演艺术放在同一城市尺度中：从大教堂露台走向达·芬奇，再回到斯卡拉。",
    lens: ["大教堂的哥特结构与露台", "《最后的晚餐》的空间叙事", "城堡、美术馆与歌剧院"],
  },
  {
    name: "威尼斯",
    country: "意大利",
    image: "/images/venice.jpg",
    imageAlt: "威尼斯大运河与历史建筑",
    period: "9月26–27日",
    introduction: "威尼斯的一天集中在圣马可建筑群，再沿里亚托桥和大运河理解一座以水路组织公共生活的城市。",
    lens: ["总督宫的政治空间", "圣马可建筑群的拜占庭传统", "桥、河道与步行网络"],
  },
  {
    name: "佛罗伦萨",
    country: "意大利",
    image: "/images/florence.jpg",
    imageAlt: "佛罗伦萨穹顶与城市天际线",
    period: "9月27–29日",
    introduction: "佛罗伦萨的核心不是单点打卡，而是一条从穹顶、广场和宫殿进入文艺复兴收藏体系的连续路径。",
    lens: ["布鲁内莱斯基穹顶", "米开朗琪罗与梅第奇", "乌菲兹、瓦萨里走廊和皮蒂宫"],
  },
  {
    name: "比萨",
    country: "意大利",
    image: "/images/pisa.jpg",
    imageAlt: "比萨奇迹广场建筑群",
    period: "9月28日",
    introduction: "比萨以奇迹广场为完整建筑群来阅读：钟楼只是入口，主教座堂、洗礼堂、墓园和两座博物馆共同补足它的宗教图景。",
    lens: ["斜塔的结构偏移", "主教座堂与洗礼堂", "墓园壁画与草图"],
  },
  {
    name: "罗马与梵蒂冈",
    country: "意大利 / 梵蒂冈",
    image: "/images/st-peters-hero.jpg",
    imageAlt: "圣彼得广场与圣彼得大教堂",
    period: "9月29日–10月2日",
    introduction: "两天把古罗马遗址、巴洛克公共空间、近代收藏与梵蒂冈宗教艺术并置；票面时间与单向参观规则决定了这里的节奏。",
    lens: ["古罗马的层叠遗址", "博尔盖塞与城市广场", "梵蒂冈博物馆到圣彼得穹顶"],
  },
  {
    name: "巴塞罗那",
    country: "西班牙",
    image: "/images/barcelona.jpg",
    imageAlt: "圣家堂立面",
    period: "10月2–4日",
    introduction: "巴塞罗那从高迪建筑进入老城，再把视线推向山丘和海边；自然形态、彩色表皮与城市街区形成鲜明对照。",
    lens: ["圣家堂与高迪住宅", "桂尔公园的地形", "老城、博恩区与地中海岸"],
  },
  {
    name: "科隆",
    country: "德国",
    image: "/images/cologne.jpg",
    imageAlt: "科隆大教堂与莱茵河",
    period: "10月4–5日",
    introduction: "科隆以大教堂为城市坐标，向东跨过莱茵河、向南进入港区；目前只有票面窗口确定，逐时安排仍待补。",
    lens: ["大教堂内部、南塔与珍宝馆", "现代艺术收藏", "莱茵河、桥梁与港区"],
  },
];
