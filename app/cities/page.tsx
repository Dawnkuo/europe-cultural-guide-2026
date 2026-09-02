import { ArrowUpRight } from 'lucide-react';
import { SiteNav } from '../components/SiteNav';
import { cityProfiles } from '../data/cities';
import { tripDays } from '../data/trip';
import { withBasePath } from '../lib/paths';

export const dynamic = 'force-static';

export default function CitiesPage() {
  return (
    <main className="subpage city-page">
      <SiteNav active="cities" />
      <header className="page-intro page-intro--cities">
        <p className="eyebrow">Cultural chapters</p>
        <h1>城市文化章节</h1>
        <p>
          以真实行程中的观看对象为中心，帮助现场理解建筑、馆藏和街区。没有安排的城市，不会生成虚构路线。
        </p>
      </header>
      <div className="city-chapters">
        {cityProfiles.map((profile, index) => {
          const cityNames =
            profile.name === '罗马与梵蒂冈'
              ? ['罗马', '梵蒂冈']
              : [profile.name];
          const scheduled = tripDays
            .flatMap((day) => day.items)
            .filter(
              (item) =>
                cityNames.includes(item.city) && item.routePoint !== false,
            );
          return (
            <article
              className="city-chapter"
              id={profile.name}
              key={profile.name}
            >
              <div className="city-chapter__media">
                <img alt={profile.imageAlt} src={withBasePath(profile.image)} />
                <span>{profile.imageCredit}</span>
              </div>
              <div className="city-chapter__copy">
                <p className="city-chapter__index">
                  {String(index + 1).padStart(2, '0')} / {profile.country}
                </p>
                <h2>{profile.name}</h2>
                <p className="city-chapter__period">{profile.period}</p>
                <p className="city-chapter__intro">{profile.introduction}</p>
                <ul>
                  {profile.lens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="city-chapter__stops">
                  <p>本次已排</p>
                  <div>
                    {scheduled.slice(0, 8).map((item) => (
                      <span key={item.id}>{item.title}</span>
                    ))}
                  </div>
                </div>
                <a
                  href={withBasePath(
                    `/itinerary/?city=${encodeURIComponent(cityNames[0])}`,
                  )}
                >
                  查看相关日期 <ArrowUpRight aria-hidden="true" size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
