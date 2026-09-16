import { SiteNav } from '../components/SiteNav';
import { PhotoSpots } from '../components/PhotoSpots';
import { guideCatalog } from '../data/guides';
import { photoCities, photoSpots } from '../data/photo-spots';
import { tripDays } from '../data/trip';
import { buildPhotoSchedule } from '../lib/photo-schedule';

export const dynamic = 'force-static';

export default function PhotoSpotsPage() {
  const guides = guideCatalog.map(({ slug, title, city }) => ({
    slug,
    title,
    city: ['罗马', '梵蒂冈'].includes(city) ? '罗马与梵蒂冈' : city,
  }));
  const covered = new Set(photoSpots.flatMap((spot) => spot.guideSlugs)).size;
  return (
    <main className="subpage photo-page">
      <SiteNav active="photo-spots" />
      <header className="photo-intro">
        <h1>机位</h1>
        <p>
          {photoCities.length} 座城市 · {photoSpots.length} 个参考机位 ·{' '}
          {covered} 个关联景点
        </p>
      </header>
      <PhotoSpots
        guides={guides}
        schedule={buildPhotoSchedule(photoSpots, guideCatalog, tripDays)}
      />
    </main>
  );
}
