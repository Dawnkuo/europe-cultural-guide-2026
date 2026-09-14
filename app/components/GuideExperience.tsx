'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GuideRecord } from '../data/types';
import type { ArchitecturalPlan } from '../lib/architectural-plan';
import { hasArchitecturalPlan, loadArchitecturalPlan } from '../lib/architectural-plan-loader';

type MapTarget = { placeId: string; serial: number; scroll: boolean };
type Experience = {
  guide: GuideRecord;
  plan?: ArchitecturalPlan;
  planFailed: boolean;
  work: string | null;
  mapTarget?: MapTarget;
  openWork: (id: string, opener?: HTMLElement) => void;
  closeWork: (restoreFocus?: boolean) => void;
  locatePlace: (placeId: string, scroll?: boolean) => void;
};
const Context = createContext<Experience | null>(null);
export const useGuideExperience = () => useContext(Context);

export function GuideExperience({ guide, children }: { guide: GuideRecord; children: ReactNode }) {
  const [plan, setPlan] = useState<ArchitecturalPlan>();
  const [planFailed, setPlanFailed] = useState(false);
  const [work, setWork] = useState<string | null>(null);
  const [mapTarget, setMapTarget] = useState<MapTarget>();
  const opener = useRef<HTMLElement | null>(null);
  const closeWork = useCallback((restoreFocus = true) => {
    setWork(null);
    if (window.location.hash.startsWith('#work-')) window.history.replaceState(null, '', '#guide-highlights');
    if (restoreFocus) opener.current?.focus({ preventScroll: true });
  }, []);
  const openWork = useCallback((id: string, button?: HTMLElement) => {
    opener.current = button ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setWork(id);
    window.history.replaceState(null, '', `#work-${id}`);
  }, []);
  const locatePlace = useCallback((placeId: string, scroll = true) => {
    setMapTarget(old => ({ placeId, serial: (old?.serial ?? 0) + 1, scroll }));
    if (scroll) {
      window.history.replaceState(null, '', '#guide-spatial');
      requestAnimationFrame(() => document.getElementById('guide-spatial')?.scrollIntoView({ block: 'start' }));
    }
  }, []);
  useEffect(() => {
    let live = true;
    if (hasArchitecturalPlan(guide.slug)) void loadArchitecturalPlan(guide.slug).then(value => { if (live) setPlan(value); }).catch(() => { if (live) setPlanFailed(true); });
    return () => { live = false; };
  }, [guide.slug]);
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash;
      const id = hash.startsWith('#work-') ? hash.slice(6) : null;
      setWork(guide.highlights.some((w, i) => (w.id ?? `${guide.slug}-highlight-${i + 1}`) === id) ? id : null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [guide.slug, guide.highlights]);
  const value = useMemo(() => ({ guide, plan, planFailed, work, mapTarget, openWork, closeWork, locatePlace }), [guide, plan, planFailed, work, mapTarget, openWork, closeWork, locatePlace]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
