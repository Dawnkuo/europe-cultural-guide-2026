'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import { withBasePath } from '../lib/paths';

export function PageFallback({
  title,
  detail,
  reset,
}: {
  title: string;
  detail: string;
  reset?: () => void;
}) {
  return (
    <main className="page-fallback">
      <p className="eyebrow">欧洲纪行 2026</p>
      <h1>{title}</h1>
      <p>{detail}</p>
      <div className="page-fallback__actions">
        {reset && (
          <button type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" size={18} />
            重新加载
          </button>
        )}
        <a href={withBasePath('/guides/')}>
          <ArrowLeft aria-hidden="true" size={18} />
          返回景点导览
        </a>
      </div>
    </main>
  );
}
