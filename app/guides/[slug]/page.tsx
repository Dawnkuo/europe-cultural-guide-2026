import { GuideHero } from '../../components/GuideHero';
import { GuideHighlights } from '../../components/GuideHighlights';
import { GuidePractical } from '../../components/GuidePractical';
import { GuideSequence } from '../../components/GuideSequence';
import { GuideSpatial } from '../../components/GuideSpatial';
import { OnsiteGuide } from '../../components/OnsiteGuide';
import { SiteNav } from '../../components/SiteNav';
import { guideBySlug, guideCatalog } from '../../data/guides';
import { withBasePath } from '../../lib/paths';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return guideCatalog.map((guide) => ({ slug: guide.slug }));
}

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) {
    return (
      <main className="subpage guide-missing">
        <SiteNav active="guides" />
        <section>
          <p>Guide not found</p>
          <h1>没有找到这个景点章节</h1>
          <a href={withBasePath('/guides/')}>返回景点导览</a>
        </section>
      </main>
    );
  }

  return (
    <main className="subpage guide-page">
      <SiteNav active="guides" />
      <GuideHero guide={guide} />
      <nav className="guide-local-nav" aria-label="本章目录">
        <a href="#guide-overview">理解</a>
        <a href="#guide-spatial">空间</a>
        <a href="#guide-highlights">看点</a>
        <a href="#guide-sequence">顺序</a>
        <a href="#guide-practical">攻略</a>
        <OnsiteGuide guide={guide} />
      </nav>
      <section
        className="guide-overview"
        id="guide-overview"
        aria-labelledby="guide-overview-title"
      >
        <p className="eyebrow">{guide.title} · 概览</p>
        <h2 id="guide-overview-title">{guide.overviewTitle}</h2>
        <p>{guide.overview}</p>
        <div>
          {guide.orientation.map((fact, index) => (
            <article key={`${fact.title}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{fact.title}</h3>
              <p>{fact.body}</p>
            </article>
          ))}
        </div>
      </section>
      <GuideSpatial guide={guide} />
      <GuideHighlights guide={guide} />
      <GuideSequence guide={guide} />
      <GuidePractical guide={guide} />
    </main>
  );
}
