'use client';

import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { withBasePath } from '../lib/paths';
import './artwork-image-viewer.css';

type Photo = { src: string; alt: string; caption?: string };
type ZoomModule = typeof import('react-zoom-pan-pinch');

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The image viewport is a focusable two-axis pan/zoom application. */
function ZoomImage({ photo, engine }: { photo: Photo; engine: ZoomModule }) {
  const { TransformWrapper, TransformComponent } = engine;
  const transform = useRef<ReactZoomPanPinchRef>(null);
  const [scale, setScale] = useState(100);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <TransformWrapper
      ref={transform}
      minScale={1}
      maxScale={5}
      disablePadding
      smooth={false}
      wheel={{ step: 0.15 }}
      velocityAnimation={{ disabled: true }}
      zoomAnimation={{ disabled: true }}
      autoAlignment={{ animationTime: 0 }}
      panning={{ velocityDisabled: true }}
      doubleClick={{ mode: 'toggle', step: 1, animationTime: 0 }}
      onTransform={(_, state) => setScale(Math.round(state.scale * 100))}
    >
      <div className="artwork-viewer__tools" aria-label="图片缩放">
        <button
          type="button"
          aria-label="缩小图片"
          title="缩小图片"
          disabled={scale <= 100 || failed}
          onClick={() => transform.current?.zoomOut(0.3, 0)}
        >
          <ZoomOut />
        </button>
        <output aria-label="图片缩放比例">{scale}%</output>
        <button
          type="button"
          aria-label="放大图片"
          title="放大图片"
          disabled={scale >= 500 || failed}
          onClick={() => transform.current?.zoomIn(0.3, 0)}
        >
          <ZoomIn />
        </button>
        <button
          type="button"
          aria-label="重置图片"
          title="重置图片"
          disabled={failed}
          onClick={() => transform.current?.resetTransform(0)}
        >
          <RotateCcw />
        </button>
      </div>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- Focused image viewport supports two-axis keyboard pan and zoom. */}
      <section
        className="artwork-viewer__stage"
        role="application"
        aria-label="作品大图"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || failed) return;
          const api = transform.current;
          if (!api) return;
          const { scale: currentScale, positionX, positionY } = api.state;
          if (event.key === '+' || event.key === '=') void api.zoomIn(0.3, 0);
          else if (event.key === '-') void api.zoomOut(0.3, 0);
          else if (event.key === '0' || event.key === 'Home')
            void api.resetTransform(0);
          else if (event.key === 'ArrowLeft')
            void api.setTransform(positionX + 60, positionY, currentScale, 0);
          else if (event.key === 'ArrowRight')
            void api.setTransform(positionX - 60, positionY, currentScale, 0);
          else if (event.key === 'ArrowUp')
            void api.setTransform(positionX, positionY + 60, currentScale, 0);
          else if (event.key === 'ArrowDown')
            void api.setTransform(positionX, positionY - 60, currentScale, 0);
          else return;
          event.preventDefault();
        }}
      >
        <TransformComponent
          wrapperClass="artwork-viewer__viewport"
          contentClass="artwork-viewer__canvas"
        >
          {/* oxlint-disable-next-line next/no-img-element -- Uncropped local image; no remote viewer service. */}
          <img
            key={attempt}
            src={withBasePath(photo.src)}
            alt={photo.alt}
            draggable={false}
            onError={() => setFailed(true)}
          />
        </TransformComponent>
        {failed && (
          <div className="artwork-viewer__error">
            <p>图片未能加载。</p>
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setAttempt((value) => value + 1);
              }}
            >
              重新加载
            </button>
          </div>
        )}
      </section>
    </TransformWrapper>
  );
}

/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */

export function ArtworkImageViewer({
  title,
  photos,
  index,
  onSelect,
  onClose,
}: {
  title: string;
  photos: Photo[];
  index: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [engine, setEngine] = useState<ZoomModule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const photo = photos[index] ?? photos[0];

  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;
    import('react-zoom-pan-pinch')
      .then((module) => {
        if (active) {
          setEngine(module);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <dialog
      ref={dialog}
      className="artwork-viewer"
      aria-label={`${title} · 图片查看`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header>
        <h3>{title}</h3>
        <button
          type="button"
          aria-label="关闭图片查看"
          title="关闭图片查看"
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      {engine ? (
        <ZoomImage key={photo.src} engine={engine} photo={photo} />
      ) : (
        <>
          <div className="artwork-viewer__tools">
            <output>{loadError ? '缩放暂不可用' : '正在加载图片查看器'}</output>
            {loadError && (
              <button
                type="button"
                title="重试图片缩放"
                aria-label="重试图片缩放"
                onClick={() => setAttempt((value) => value + 1)}
              >
                <RotateCcw />
              </button>
            )}
          </div>
          <div className="artwork-viewer__stage artwork-viewer__fallback">
            {/* oxlint-disable-next-line next/no-img-element -- Preserve the image if the zoom module cannot load. */}
            <img src={withBasePath(photo.src)} alt={photo.alt} />
          </div>
        </>
      )}
      <footer>
        <div className="artwork-viewer__navigation">
          <button
            type="button"
            aria-label="上一张图片"
            title="上一张图片"
            disabled={index === 0}
            onClick={() => onSelect(index - 1)}
          >
            <ArrowLeft />
          </button>
          <output aria-label="图片序号">
            {index + 1} / {photos.length}
          </output>
          <button
            type="button"
            aria-label="下一张图片"
            title="下一张图片"
            disabled={index >= photos.length - 1}
            onClick={() => onSelect(index + 1)}
          >
            <ArrowRight />
          </button>
        </div>
        <p>{photo.caption ?? photo.alt}</p>
      </footer>
    </dialog>
  );
}
