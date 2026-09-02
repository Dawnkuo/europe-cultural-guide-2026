import { GuideIndex } from '../components/GuideIndex';
import { SiteNav } from '../components/SiteNav';
import { guideCatalog } from '../data/guides';

export const dynamic = 'force-static';

export default function GuidesPage() {
  return (
    <main className="subpage guide-directory-page">
      <SiteNav active="guides" />
      <header className="page-intro page-intro--guides">
        <p className="eyebrow">Field guides / 2026</p>
        <h1>景点导览</h1>
        <p>
          依照现有行程逐项整理。重复日期和不同票种归入同一景点章节，联票中的不同建筑仍各自保留；这里不调整行程顺序，也不记录金额。
        </p>
      </header>
      <GuideIndex guides={guideCatalog} />
    </main>
  );
}
