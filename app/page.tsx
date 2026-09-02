'use client';

import {
  ArrowDown,
  CalendarDays,
  Hotel,
  MapPin,
  TicketCheck,
  TrainFront,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EuropeMap } from './components/EuropeMap';
import { OfflineStatus } from './components/OfflineStatus';
import { tripDays } from './data/trip';
import { withBasePath } from './lib/paths';

export const dynamic = 'force-static';

const cityCopy: Record<string, { country: string; chapter: string }> = {
  巴黎: { country: '法国', chapter: '抵达与离境的两端，连接整段大陆旅程。' },
  米兰: { country: '意大利', chapter: '哥特大教堂、达·芬奇与斯卡拉的第一章。' },
  威尼斯: {
    country: '意大利',
    chapter: '从圣马可建筑群走向大运河的水城一日。',
  },
  佛罗伦萨: {
    country: '意大利',
    chapter: '文艺复兴美术馆、穹顶与瓦萨里走廊。',
  },
  比萨: { country: '意大利', chapter: '在奇迹广场阅读中世纪宗教建筑群。' },
  罗马: {
    country: '意大利 / 梵蒂冈',
    chapter: '古罗马、巴洛克城市与梵蒂冈馆藏交叠。',
  },
  巴塞罗那: { country: '西班牙', chapter: '高迪建筑、老城肌理与地中海边缘。' },
  科隆: { country: '德国', chapter: '大教堂、莱茵河与北行巴黎的收束。' },
};

const notices = [
  {
    icon: TicketCheck,
    label: '票面纠正',
    title: '圣殿14:30，穹顶15:30',
    body: '最终二维码时间与原行程记录相反；导览采用票面时间并保留冲突说明。',
  },
  {
    icon: TrainFront,
    label: '交通待确认',
    title: '比萨往返车票尚不可乘车',
    body: '现有六份文件均标有非有效乘车票，需要补充实际电子票。',
  },
  {
    icon: Hotel,
    label: '住宿待确认',
    title: '三处晚到入住需要确认',
    body: '威尼斯、佛罗伦萨和罗马的抵达时间均晚于住宿资料所列接待截止时间。',
  },
] as const;

export default function Home() {
  const [selectedCity, setSelectedCity] = useState('罗马');
  const selectedItems = useMemo(
    () =>
      tripDays
        .flatMap((day) => day.items)
        .filter((item) => {
          if (selectedCity === '罗马')
            return item.city === '罗马' || item.city === '梵蒂冈';
          return item.city === selectedCity;
        }),
    [selectedCity],
  );
  const city = cityCopy[selectedCity];

  return (
    <main>
      <a className="skip-link" href="#journey-map">
        跳到旅程地图
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="返回总览顶部">
          <span>EU</span>
          <strong>欧洲纪行</strong>
        </a>
        <nav aria-label="主导航">
          <a href="#journey-map">地图</a>
          <a href="#notices">提醒</a>
          <a href={withBasePath('/itinerary/')}>逐日行程</a>
          <a href={withBasePath('/cities/')}>城市文化</a>
        </nav>
        <div className="header-actions">
          <OfflineStatus />
          <a className="header-action" href={withBasePath('/bookings/')}>
            凭证状态
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <img
          alt="从圣彼得广场望向圣彼得大教堂"
          className="hero__image"
          src={withBasePath('/images/st-peters-hero.jpg')}
        />
        <div className="hero__shade" />
        <div className="hero__content">
          <p className="eyebrow">2026.09.24 — 10.06</p>
          <h1>欧洲纪行 2026</h1>
          <p className="hero__dek">
            从巴黎进入意大利，穿过梵蒂冈与巴塞罗那，沿莱茵河回到巴黎。
            一份依照真实票据与既定顺序编排的离线文化档案。
          </p>
          <div className="hero__meta" aria-label="旅程概览">
            <span>
              <strong>13</strong> 日
            </span>
            <span>
              <strong>5</strong> 个国家
            </span>
            <span>
              <strong>8</strong> 座城市
            </span>
          </div>
        </div>
        <a className="hero__down" href="#journey-map" aria-label="查看旅程地图">
          <ArrowDown aria-hidden="true" size={20} />
        </a>
        <p className="hero__credit">
          圣彼得大教堂与广场 · Mstyslav Chernov / CC BY-SA 3.0
        </p>
      </section>

      <section className="map-section" id="journey-map">
        <div className="section-heading section-heading--dark">
          <p className="eyebrow">Grand Tour / Europe</p>
          <h2>一张地图，看完整段旅程</h2>
          <p>路线只连接已经排期的城市；备选项目不会被加入主线。</p>
        </div>

        <div className="map-layout">
          <EuropeMap
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
          />
          <aside className="map-caption" aria-live="polite">
            <p className="map-caption__index">{city.country}</p>
            <h3>{selectedCity}</h3>
            <p>{city.chapter}</p>
            <dl>
              <div>
                <dt>已排项目</dt>
                <dd>
                  {selectedItems.filter((item) => item.routePoint).length}
                </dd>
              </div>
              <div>
                <dt>已订</dt>
                <dd>
                  {
                    selectedItems.filter((item) => item.status === '已订')
                      .length
                  }
                </dd>
              </div>
              <div>
                <dt>待确认</dt>
                <dd>
                  {
                    selectedItems.filter((item) => item.status === '待确认')
                      .length
                  }
                </dd>
              </div>
            </dl>
            <a
              href={withBasePath(
                `/itinerary/?city=${encodeURIComponent(selectedCity)}`,
              )}
            >
              <CalendarDays aria-hidden="true" size={18} />
              查看逐日安排
            </a>
          </aside>
        </div>
      </section>

      <section className="notices" id="notices">
        <div className="section-heading">
          <p className="eyebrow">Before departure</p>
          <h2>出发前，先看清楚这些资料</h2>
          <p>提醒只指出票面冲突、文件缺失和衔接风险，不调整既定行程。</p>
        </div>
        <div className="notice-list">
          {notices.map(({ icon: Icon, label, title, body }, index) => (
            <article className="notice-row" key={title}>
              <span className="notice-row__number">0{index + 1}</span>
              <Icon aria-hidden="true" className="notice-row__icon" size={26} />
              <div>
                <p>{label}</p>
                <h3>{title}</h3>
              </div>
              <p className="notice-row__body">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-strip" aria-label="旅程城市顺序">
        {Object.entries(cityCopy).map(([name, value], index) => (
          <div key={name}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{name}</strong>
            <small>{value.country}</small>
          </div>
        ))}
      </section>

      <footer className="site-footer">
        <div>
          <MapPin aria-hidden="true" size={20} />
          <p>个人文化导览，不代表任何博物馆、教堂、城市或交通机构。</p>
        </div>
        <p>资料核验：2026年9月2日 · 核心内容可离线访问</p>
      </footer>
    </main>
  );
}
