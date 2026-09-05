import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GuideHighlights } from './GuideHighlights';
import { guideCatalog } from '../data/guides';

describe('uncropped guide illustrations', () => {
  it('renders local images with intrinsic dimensions, alt text and deferred decoding', () => {
    for (const guide of guideCatalog) {
      const dom = new DOMParser().parseFromString(
        renderToStaticMarkup(<GuideHighlights guide={guide} />),
        'text/html',
      );
      const images = [...dom.querySelectorAll('img')];
      expect(images).toHaveLength(
        guide.highlights.filter((item) => item.image).length,
      );
      expect([...dom.querySelectorAll('h3')].map((heading) => heading.textContent)).toEqual(
        guide.highlights.map((highlight) => highlight.title),
      );
      expect(dom.querySelector('[aria-label="藏品分页"]')).toBeNull();
      for (const img of images) {
        expect(img.getAttribute('alt')).toBeTruthy();
        expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
        expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
        expect(img.getAttribute('loading')).toBe('lazy');
        expect(img.getAttribute('decoding')).toBe('async');
        expect(img.getAttribute('src')).toMatch(/^\//);
      }
    }
  });

  it('does not stretch or crop artwork to fill the text column', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    const block = css.match(/\.guide-highlight__media img\s*\{([^}]+)\}/)![1];
    expect(block).toContain('height: auto');
    expect(block).toContain('width: auto');
    expect(block).toContain('max-width: 100%');
    expect(block).toContain('object-fit: contain');
    expect(block).not.toContain('cover');
    const article = css.match(
      /\.guide-highlight-list article\s*\{([^}]+)\}/,
    )![1];
    expect(article).toContain('align-items: start');
  });
});
