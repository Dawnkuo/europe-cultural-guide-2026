'use client';

import { ArrowLeft, ArrowRight, MapPin, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { GuideRecord } from '../data/types';

function localProgressStore() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function OnsiteGuide({ guide }: { guide: GuideRecord }) {
  const storageKey = `guide-progress:${guide.slug}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const current = guide.sequence[step];
  const highlight = useMemo(
    () => guide.highlights[step % guide.highlights.length],
    [guide.highlights, step],
  );

  useEffect(() => {
    const stored = Number(localProgressStore()?.getItem(storageKey));
    if (Number.isInteger(stored) && stored >= 0 && stored < guide.sequence.length) {
      setStep(stored);
    }
    setMounted(true);
  }, [guide.sequence.length, storageKey]);

  useEffect(() => {
    if (!mounted) return;
    localProgressStore()?.setItem(storageKey, String(step));
  }, [mounted, step, storageKey]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button className="onsite-launch" onClick={() => setOpen(true)} type="button">
        <MapPin aria-hidden="true" size={18} />
        开始现场导览
      </button>

      {open && (
        <div
          aria-label={`${guide.title}现场导览`}
          aria-modal="true"
          className="onsite-guide"
          role="dialog"
        >
          <header className="onsite-guide__header">
            <div>
              <p>{guide.city} · 现场模式</p>
              <h2>{guide.title}</h2>
            </div>
            <button aria-label="关闭现场导览" onClick={() => setOpen(false)} type="button">
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="onsite-guide__progress">
            <span>{step + 1} / {guide.sequence.length}</span>
            <div aria-hidden="true">
              <i style={{ width: `${((step + 1) / guide.sequence.length) * 100}%` }} />
            </div>
          </div>

          <main className="onsite-guide__stage">
            <p className="eyebrow">Current stop</p>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
            {highlight && (
              <aside>
                <span>此处重点</span>
                <h4>{highlight.title}</h4>
                <p>{highlight.lookFor}</p>
              </aside>
            )}
          </main>

          <footer className="onsite-guide__controls">
            <button
              aria-label="上一站"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              type="button"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button className="onsite-guide__return" onClick={() => setOpen(false)} type="button">
              返回完整章节
            </button>
            <button
              aria-label="下一站"
              disabled={step === guide.sequence.length - 1}
              onClick={() => setStep((value) => Math.min(guide.sequence.length - 1, value + 1))}
              type="button"
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </footer>
        </div>
      )}
    </>
  );
}
