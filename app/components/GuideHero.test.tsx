import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideHero } from './GuideHero';

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

  it('preserves the complete David photograph outside the hero', () => {
    const guide = guideCatalog.find((item) => item.slug === 'accademia-florence')!;
    expect(guide.highlights[0].image).toBe('/images/guides/accademia-florence-01.jpg');
    const css = readFileSync('app/globals.css', 'utf8');
    const crop = css.match(/\.guide-hero\[data-guide='accademia-florence'\] > img\s*\{([^}]+)\}/)![1];
    expect(crop).toContain('height: 250%');
    expect(crop).toContain('object-position: 44% 8%');
    expect(css.match(/\.guide-hero > img\s*\{([^}]+)\}/)![1]).toContain('height: 100%');
  });
});
