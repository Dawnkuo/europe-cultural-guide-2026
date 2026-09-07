import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideHero } from './GuideHero';
import { GuideIndex } from './GuideIndex';

describe('guide hero framing', () => {
  it('scopes the David portrait crop to Florence Accademia', () => {
    for (const slug of ['accademia-florence', 'accademia-venice', 'uffizi']) {
      const guide = guideCatalog.find((item) => item.slug === slug)!;
      const dom = new DOMParser().parseFromString(
        renderToStaticMarkup(<GuideHero guide={guide} />),
        'text/html',
      );
      expect(dom.querySelector('.guide-hero')?.getAttribute('data-guide')).toBe(slug);
      expect(dom.querySelector('img')?.getAttribute('src')).toBe(guide.hero.src);
    }
  });

  it('shares David portrait framing with the guide index while keeping the complete artwork photograph', () => {
    const guide = guideCatalog.find((item) => item.slug === 'accademia-florence')!;
    expect(guide.highlights[0].image).toBe('/images/guides/accademia-florence-01.jpg');
    const css = readFileSync('app/globals.css', 'utf8');
    const crop = css.match(/\.guide-hero\[data-guide='accademia-florence'\] > img,\s*\.guide-index__media\[data-guide='accademia-florence'\] > img\s*\{([^}]+)\}/)![1];
    expect(crop).toContain('height: var(--portrait-height, 250%)');
    expect(crop).toContain('object-position: 44% 8%');
    expect(css.match(/\.guide-hero > img\s*\{([^}]+)\}/)![1]).toContain('height: 100%');
    expect(css.match(/\.guide-index__media\[data-guide='accademia-florence'\]\s*\{([^}]+)\}/)![1]).toContain('--portrait-height: 400%');
    const dom = new DOMParser().parseFromString(renderToStaticMarkup(<GuideIndex guides={guideCatalog} />), 'text/html');
    for (const item of guideCatalog) {
      const image = dom.querySelector(`.guide-index__media[data-guide="${item.slug}"] img`);
      expect(image?.getAttribute('src'), item.slug).toBe(item.hero.src);
    }
  });
});
