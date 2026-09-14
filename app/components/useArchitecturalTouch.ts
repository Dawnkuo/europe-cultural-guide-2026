import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type RefObject,
} from 'react';
import { worldPoint, type PlanDrawing } from '../lib/architectural-viewport';
import type { MapPoint } from '../lib/architectural-plan';

export function useArchitecturalTouch(
  host: RefObject<HTMLElement | null>,
  drawing: PlanDrawing,
  zoom: number,
  scope: string,
  onZoom: (zoom: number, centre: MapPoint) => void,
  maxZoom = 4,
) {
  const points = useRef(new Map<number, MapPoint>());
  const moved = useRef(false);
  const pan = useRef<{ at: MapPoint; scroll: MapPoint } | null>(null);
  const pinch = useRef<{
    distance: number;
    zoom: number;
    focal: MapPoint;
  } | null>(null);
  const frame = useRef(0);
  const latest = useRef(onZoom);
  useEffect(() => {
    latest.current = onZoom;
  }, [onZoom]);
  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    for (const id of points.current.keys())
      if (host.current?.hasPointerCapture(id))
        host.current.releasePointerCapture(id);
    points.current.clear();
    pan.current = null;
    pinch.current = null;
  }, [host]);
  useEffect(() => {
    const cancel = () => reset();
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', cancel);
    return () => {
      reset();
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', cancel);
    };
  }, [scope, reset]); // Geometry changes during a pinch must not discard its original focal point.

  function rebase() {
    const element = host.current;
    if (!element) return;
    const values = [...points.current.values()];
    if (values.length === 1)
      pan.current = {
        at: values[0],
        scroll: [element.scrollLeft, element.scrollTop],
      };
    if (values.length === 2) {
      const [a, b] = values,
        rect = element.getBoundingClientRect();
      pinch.current = {
        distance: Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])),
        zoom,
        focal: worldPoint(drawing, [
          (a[0] + b[0]) / 2 - rect.left + element.scrollLeft,
          (a[1] + b[1]) / 2 - rect.top + element.scrollTop,
        ]),
      };
    }
  }
  return {
    moved,
    down(event: PointerEvent<HTMLElement>) {
      if (event.pointerType !== 'touch') {
        moved.current = false;
        return false;
      }
      if (!points.current.size) moved.current = false;
      points.current.set(event.pointerId, [event.clientX, event.clientY]);
      rebase();
      if (
        points.current.size > 1 ||
        !(event.target as Element).closest('button')
      )
        event.currentTarget.setPointerCapture(event.pointerId);
      return true;
    },
    move(event: PointerEvent<HTMLElement>) {
      if (!points.current.has(event.pointerId)) return false;
      points.current.set(event.pointerId, [event.clientX, event.clientY]);
      const element = event.currentTarget,
        values = [...points.current.values()];
      if (values.length >= 2 && pinch.current) {
        moved.current = true;
        const [a, b] = values,
          rect = element.getBoundingClientRect(),
          start = pinch.current;
        const next = Math.max(
          1,
          Math.min(
            maxZoom,
            (start.zoom * Math.hypot(a[0] - b[0], a[1] - b[1])) /
              start.distance,
          ),
        );
        const scale = (drawing.scale / zoom) * next;
        const centre: MapPoint = [
          start.focal[0] -
            ((a[0] + b[0]) / 2 - rect.left - element.clientWidth / 2) / scale,
          start.focal[1] -
            ((a[1] + b[1]) / 2 - rect.top - element.clientHeight / 2) / scale,
        ];
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() =>
          latest.current(next, centre),
        );
      } else if (pan.current) {
        const dx = event.clientX - pan.current.at[0],
          dy = event.clientY - pan.current.at[1];
        moved.current ||= Math.hypot(dx, dy) > 5;
        if (moved.current) {
          if (!element.hasPointerCapture(event.pointerId))
            element.setPointerCapture(event.pointerId);
          element.scrollTo({
            left: pan.current.scroll[0] - dx,
            top: pan.current.scroll[1] - dy,
            behavior: 'instant',
          });
        }
      }
      return true;
    },
    up(event: PointerEvent<HTMLElement>) {
      if (!points.current.delete(event.pointerId)) return false;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      pinch.current = null;
      rebase();
      return true;
    },
    cancel: reset,
  };
}
