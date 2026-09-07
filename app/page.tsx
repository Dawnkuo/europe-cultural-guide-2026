'use client';

import { ArrowDown, CalendarDays, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EuropeMap } from './components/EuropeMap';
import { OfflineStatus } from './components/OfflineStatus';
import { tripDays } from './data/trip';
import { withBasePath } from './lib/paths';
import { sitePageLinks } from './lib/site-navigation';

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
          {sitePageLinks
            .filter((link) => link.id !== 'bookings')
            .map((link) => (
              <a href={withBasePath(link.href)} key={link.id}>
                {link.label}
              </a>
            ))}
        </nav>
        <div className="header-actions">
          <OfflineStatus />
          <a className="header-action" href={withBasePath('/bookings/')}>
            凭证状态
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        {/* oxlint-disable-next-line next/no-img-element -- Static export uses a local hero image. */}
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
        <p>行程与凭证核对：2026年9月7日 · 核心内容可离线访问</p>
      </footer>
    </main>
  );
}
