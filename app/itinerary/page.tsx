'use client';

import { useEffect, useState } from 'react';
import { DayTimeline } from '../components/DayTimeline';
import { SiteNav } from '../components/SiteNav';
import { tripDays, tripCities } from '../data/trip';

export const dynamic = 'force-static';

export default function ItineraryPage() {
  const [cityFilter, setCityFilter] = useState('全部');

  useEffect(() => {
    const city = new URLSearchParams(window.location.search).get('city');
    if (city) setCityFilter(city);
  }, []);

  const filteredDays =
    cityFilter === '全部'
      ? tripDays
      : tripDays.filter((day) =>
          day.items.some((item) => item.city === cityFilter),
        );

  return (
    <main className="subpage itinerary-page">
      <SiteNav active="itinerary" />
      <header className="page-intro page-intro--timeline">
        <p className="eyebrow">13 days / source order</p>
        <h1>逐日行程</h1>
        <p>
          完全按现有行程顺序呈现。步行与交通耗时合并在下一个景点的到达说明中，备选项目放在每天末尾。
        </p>
        <div className="ticket-correction">
          <span>票面优先</span>
          <strong>圣殿14:30；穹顶15:30</strong>
          <p>原文档时间相反，页面保留冲突标记。</p>
        </div>
      </header>

      <div className="filter-bar" aria-label="按城市筛选">
        {['全部', ...tripCities].map((city) => (
          <button
            data-active={cityFilter === city}
            key={city}
            onClick={() => setCityFilter(city)}
            type="button"
          >
            {city}
          </button>
        ))}
      </div>

      <div className="itinerary-content">
        {filteredDays.map((day) => (
          <DayTimeline day={day} key={day.date} />
        ))}
      </div>
    </main>
  );
}
