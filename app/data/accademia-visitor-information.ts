import type { VisitorInformation } from './visitor-information';

export const accademiaVisitorInformation: VisitorInformation = {
  verifiedAt: '2026-09-09',
  topics: [
    {
      id: 'arrival', title: '从 Via Ricasoli 入馆', icon: 'entrance',
      paragraphs: ['入口地址为 Via Ricasoli 58/60，不是领主广场《大卫》复制像所在处。你已订08:15入场，凭证和换票要求以预约确认为准。', '入场需要经过金属探测安检，预约不等于免安检。到门口后按现场预约队列和工作人员指引进入。'],
      places: [{ id: 'L0-1-1', label: '博物馆入口' }], evidenceIds: ['accademia-visit', 'accademia-map', 'existing-bookings'],
    },
    {
      id: 'bags', title: '大件行李先处理', icon: 'bags',
      paragraphs: ['馆内没有衣帽寄存处，大型包袋、背包及头盔不能带入；危险金属或玻璃物品也受限制。可携带不超过0.5升的水，但馆内禁止饮食。', 'MyAccademia 销售点设有行李寄存服务，不能理解为进入展厅后再寄存。本次核对没有确认其接收尺寸、收费及当天营业安排，带大件行李前应另行确认。'],
      evidenceIds: ['accademia-visit'],
    },
    {
      id: 'floors', title: '《大卫》之外还有上下两层', icon: 'stairs',
      paragraphs: ['底层包括巨像厅、囚徒长廊、《大卫》展厅、石膏模型馆、早期绘画与乐器区；上层继续陈列金地绘画。不同收藏并不全在通往《大卫》的直线上。', '本次参观时段为08:15至09:25，离馆前留意去下一站的衔接。馆藏目录中的作品可能外借或调展，目录身份不等于到访日一定在展。'],
      places: [{ id: 'L0-4-1', label: '大卫展厅' }, { id: 'L0-楼梯-1', label: '通往上层的楼梯' }],
      evidenceIds: ['accademia-map', 'accademia-collections', 'existing-bookings'],
    },
    {
      id: 'accessibility', title: '电梯与无障碍通行', icon: 'accessibility',
      paragraphs: ['Via Ricasoli 60 的入口和票务处可无障碍到达，馆方说明整个参观路线可通行，电梯连接上层。需要帮助时可先询问入口信息台。', '巨像厅及上层设有触觉地图；触觉参观材料不表示允许直接触摸原作，具体可用项目听从工作人员说明。'],
      places: [{ id: 'L0-电梯-1', label: '通往上层的电梯' }], evidenceIds: ['accademia-visit', 'accademia-map'],
    },
    {
      id: 'facilities', title: '洗手间与现场服务', icon: 'rest',
      paragraphs: ['馆方页面对无障碍洗手间的楼层写法并不一致，一处写底层，另一处写半地下层；两处都提到电梯附近。需要使用时先向信息台确认，不把冲突文字画成两个确定位置。', '馆内有书店及语音导览服务，乐器区提供声音展示。语音设备租借与现场可用语言另外确认，不推定已含在你的门票中。'],
      evidenceIds: ['accademia-visit', 'accademia-collections'],
    },
  ],
  questions: [
    { id: 'david-original', question: '这里的《大卫》是原作吗？', paragraphs: ['是。这里保存米开朗琪罗1501至1504年雕成的大理石原作；领主广场和米开朗琪罗广场上的像不是这件原作。看完正面后，在允许区域比较两侧和背面，更容易辨认投石带与承重姿态。'], evidenceIds: ['accademia-david', 'accademia-collections'] },
    { id: 'prisoners', question: '《圣马太》也属于四尊《囚徒》吗？', paragraphs: ['不属于。《圣马太》原为佛罗伦萨大教堂的使徒委托，四尊《囚徒》属于朱利奥二世陵墓计划。今天同在长廊，不代表原先属于同一项目；佛罗伦萨这四尊也不同于卢浮宫的两尊《奴隶》。'], evidenceIds: ['accademia-matthew', 'accademia-prisoners'] },
    { id: 'sabines', question: '巨像厅的群像是石膏复制品吗？', paragraphs: ['不是。詹博洛尼亚《劫掠萨宾妇女》在这里是十六世纪原大未烧制泥塑模型；佣兵凉廊中是大理石成品。它与石膏模型馆中的十九世纪石膏收藏要分开识别。'], evidenceIds: ['accademia-sabines', 'accademia-collections'] },
    { id: 'bags-check', question: '能把行李带到《大卫》展厅后再寄存吗？', paragraphs: ['不能按这个方式安排。馆内无衣帽寄存处，大件在入馆前处理。MyAccademia 的寄存服务独立于展厅，接收条件需另核；不要因为网站列有寄存服务就默认任何箱包都能随身入馆。'], evidenceIds: ['accademia-visit'] },
    { id: 'music', question: '展出的历史乐器还能演奏吗？', paragraphs: ['声音展示、现代复制品演奏与原作使用是不同情况。椭圆形斯皮内琴另有2001年制作的复制品，以免为演奏而改造历史原作；不要把听到的声音一概标为原作现场发声。'], evidenceIds: ['accademia-spinet', 'accademia-collections'] },
  ],
};
