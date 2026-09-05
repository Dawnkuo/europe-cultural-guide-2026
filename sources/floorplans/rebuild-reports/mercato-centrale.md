# 佛罗伦萨中央市场双层增量

- 状态：可安装的两幅独立图，包括1869年历史底层摊位平面与改造项目上层大厅；不是现行商户或实时开放地图。
- 历史底层原件：佛罗伦萨市政府出版物 `Dal mercato vecchio ai nuovi mercati` PDF第56页，图注说明为底层各类商贩分配位置、1869年施工项目、比例1:100、ASCFi Fondo disegni car. 003/003。原文件 `mercato-centrale-comune-historic.pdf`，SHA-256 `b248daf2d9e2acfc5293dc167b9db806d52fa5f6aa12a65d06bd385c0b05b680`；原生 xref 140 为638×598像素。
- 可复现清理源：`scripts/rebuild-mercato-centrale.py` 从原生像素生成 `mercato-centrale-comune-historic-reviewed.pdf`，SHA-256 `c98a07d95223c54fa1a885b19ea919e7a56240ff2c06e9204e3e08f0f3f330cd`。未做透视变换，也未移动几何；派生 PDF 不写随机 trailer ID，producer 连续完整执行两次时 source/config/model 均字节一致。
- 分类：红色铸铁支撑和外圈粗结构线进入 wall；摊位边界先做局部对比提取，再只保留达到水平或垂直长度门槛的线段为 flat detail。1227个独立数字、文字或残余字形连通块、共8301像素被剔除，避免把摊位号码当几何。
- 底层房面：矩形大厅面沿原图连续内周界建立；它位于历史摊位线下方，不表示当前可通行区域。底层输出233 wall、1 surface、267 detail。
- 上层来源：Archea Associati 发布的改造项目资料第2页，原有十块平面拼图保持不变。原文件 `mercato-centrale-archea.pdf`，SHA-256 `b71738cd8a1b56ca0c0799dc0df8f53d120e314fedeaad87d74cd7e77f7fb00b`。
- 图幅关系：两图比例独立，只作 display-only 分层；没有证据支持跨层井道配准，因此垂直连接为空。
- 覆盖：2层、3个地点、2个语义空间、1933个几何要素。停点1绑定历史摊位网格；停点2和3保留上层绑定；停点0外立面没有室内平面锚点。
- 可复现与运行时：producer 连续两次调用 2026-09-05 从主线同步的共享 builder SHA-256 `e1d0284bbbabada4dd190153c9fa57f80c75501a5eae18c6a161626c49e1c4cf`，model/evidence 字节稳定，不在 build 后修改 model。主仓库 `validateArchitecturalPlan` SHA-256 `8f919b6890d3f7e7e264a6d798a28f55dfd751b2ea000fffb8afb9c37caa5a70` 返回 `[]`。
- 视觉核验：`mercato-historic-ground-reviewed-mask.png`、`mercato-historic-ground-source-overlay.png` 与 `generated-mercato-historic-ground.png` 已按原尺寸检查；模型保留四组摊位矩阵、中央十字通道、周界支撑与门侧细节，没有原始摊位数字层。

## 限制

- 历史图不能替代当前底层商户图；不把1869年摊位编号、类别或通路声明为现状。
- 改造项目上层图不能证明当前商户布置、临时关闭或参观路线。
- 外立面停点0继续保持未解决，不借室内图推测位置。
