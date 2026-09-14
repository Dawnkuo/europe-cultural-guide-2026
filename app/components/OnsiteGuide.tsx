'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GuideRecord } from '../data/types';
import { locationForSequence, workId } from '../lib/guide-experience';
import { withBasePath } from '../lib/paths';
import { useGuideExperience } from './GuideExperience';
import { GuideLocationPreview } from './GuideLocationPreview';
import './guide-experience.css';

function localProgressStore() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function OnsiteGuide({ guide }: { guide: GuideRecord }) {
  const experience = useGuideExperience();
  const dialog = useRef<HTMLDialogElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const [placeIndex, setPlaceIndex] = useState(0);
  const storageKey = `guide-progress:${guide.slug}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(true);
  const selectStep = (value: number) => {
    setStep(value);
    setPlaceIndex(0);
    try {
      const storage = localProgressStore();
      storage?.setItem(storageKey, String(value));
      setSaved(Boolean(storage));
    } catch {
      setSaved(false);
    }
    dialog.current?.querySelector('main')?.scrollTo(0, 0);
  };
  const openGuide = () => {
    let next = step;
    try {
      const raw = localProgressStore()?.getItem(storageKey);
      const stored = Number(raw);
      if (raw != null && Number.isInteger(stored) && stored >= 0 && stored < guide.sequence.length) next = stored;
    } catch {
      setSaved(false);
    }
    selectStep(next);
    setOpen(true);
  };
  const current = guide.sequence[step];
  const location = useMemo(() => locationForSequence(guide, step, experience?.plan), [guide, step, experience?.plan]);
  const highlights = location.works;
  const place = location.places[placeIndex] ?? location.places[0];
  const locatePlace = experience?.locatePlace;

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [open]);
  useEffect(() => {
    if (open && place) locatePlace?.(place.id, false);
  }, [open, place, locatePlace]);
  useEffect(() => {
    if (experience?.mapTarget?.scroll && dialog.current?.open) dialog.current.close();
  }, [experience?.mapTarget]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className="onsite-launch"
        aria-label="开始现场导览"
        title="开始现场导览"
        onClick={openGuide}
        type="button"
        ref={launch}
      >
        <MapPin aria-hidden="true" size={18} />
        <span>开始现场导览</span>
      </button>

      {open &&
        createPortal(
          <dialog
            ref={dialog}
            aria-label={`${guide.title}现场导览`}
            className="onsite-guide"
            onCancel={() => setOpen(false)}
            onClose={() => { setOpen(false); launch.current?.focus({ preventScroll: true }); }}
          >
            <header className="onsite-guide__header">
              <div>
                <p>{guide.city} · 现场模式</p>
                <h2>{guide.title}</h2>
              </div>
              <button
                aria-label="关闭现场导览"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="onsite-guide__progress">
              <span>
                {step + 1} / {guide.sequence.length}
              </span>
              <div aria-hidden="true">
                <i
                  style={{
                    width: `${((step + 1) / guide.sequence.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <main className="onsite-guide__stage">
              {!saved && <output className="onsite-guide__storage-note">浏览器未能保存进度；本次导览仍可继续。</output>}
              <p className="eyebrow">Current stop</p>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
              {place && experience?.plan && <div className="onsite-guide__location">
                <GuideLocationPreview plan={experience.plan} place={place} />
                {location.places.length > 1 && <label>本段地点<select aria-label="现场地点" value={place.id} onChange={event => setPlaceIndex(location.places.findIndex(p => p.id === event.target.value))}>{location.places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
                <button type="button" onClick={() => { setOpen(false); experience.locatePlace(place.id); }}><MapPin size={17} aria-hidden="true" />查看完整地图</button>
              </div>}
              {highlights.map((highlight) => (
                <aside key={workId(guide.slug, highlight, guide.highlights.indexOf(highlight))} className="onsite-guide__work">
                  {/* oxlint-disable-next-line next/no-img-element -- Local offline artwork for this exact stop. */}
                  {highlight.image && <img src={withBasePath(highlight.image)} alt={highlight.imageAlt ?? highlight.title} loading="lazy" />}
                  <div>
                  <span>此处重点</span>
                  <h4>{highlight.title}</h4>
                  <p>{highlight.lookFor}</p>
                  {experience && <button type="button" onClick={event => experience.openWork(workId(guide.slug, highlight, guide.highlights.indexOf(highlight)), event.currentTarget)}>作品详情<ArrowUpRight size={17} aria-hidden="true" /></button>}
                  </div>
                </aside>
              ))}
              {guide.sequence[step + 1] && <p className="onsite-guide__next">下一站 · {guide.sequence[step + 1].title}</p>}
            </main>

            <footer className="onsite-guide__controls">
              <button
                aria-label="上一站"
                disabled={step === 0}
                onClick={() => selectStep(Math.max(0, step - 1))}
                type="button"
              >
                <ArrowLeft aria-hidden="true" />
              </button>
              <button
                className="onsite-guide__return"
                onClick={() => setOpen(false)}
                type="button"
              >
                返回完整章节
              </button>
              <button
                aria-label="下一站"
                disabled={step === guide.sequence.length - 1}
                onClick={() => selectStep(Math.min(guide.sequence.length - 1, step + 1))}
                type="button"
              >
                <ArrowRight aria-hidden="true" />
              </button>
            </footer>
          </dialog>,
          document.body,
        )}
    </>
  );
}
