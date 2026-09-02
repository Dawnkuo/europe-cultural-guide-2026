import { ExternalLink } from 'lucide-react';
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

  if (guide.embeddedGuide) {
    const embeddedHref = withBasePath(guide.embeddedGuide.path);
    return (
      <main className="subpage embedded-guide-page">
        <SiteNav active="guides" />
        <header className="embedded-guide-intro">
          <p>{guide.city} · 本地完整离线素材</p>
          <h1>{guide.title}</h1>
          <span>
            下面直接载入当前项目内的完整导览，包含三维空间、重点作品、路线、实用攻略和独立离线缓存。
          </span>
          <a href={embeddedHref}>
            {guide.embeddedGuide.label}
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        </header>
        <iframe
          className="embedded-guide-frame"
          loading="eager"
          src={embeddedHref}
          title={`${guide.title}完整离线导览`}
        />
      </main>
    );
  }

  return (
    <main className="subpage guide-page">
      <SiteNav active="guides" />
      <GuideHero guide={guide} />
      <OnsiteGuide guide={guide} />
      <nav className="guide-local-nav" aria-label="本章目录">
        <a href="#guide-overview">理解</a>
        <a href="#guide-spatial">空间</a>
        <a href="#guide-highlights">看点</a>
        <a href="#guide-sequence">顺序</a>
        <a href="#guide-practical">攻略</a>
      </nav>
      <section className="guide-overview" id="guide-overview">
        <p className="eyebrow">Before entering</p>
        <h2>先建立判断框架</h2>
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
