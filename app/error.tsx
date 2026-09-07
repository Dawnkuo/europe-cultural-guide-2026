'use client';

import { PageFallback } from './components/PageFallback';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageFallback
      title="页面暂时无法加载"
      detail="请重试，或返回景点列表。若当前离线，请确认该章节已下载。"
      reset={reset}
    />
  );
}
