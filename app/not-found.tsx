import { PageFallback } from './components/PageFallback';

export default function NotFound() {
  return (
    <PageFallback
      title="没有找到这个页面"
      detail="这个地址可能已经变更，请从景点列表重新进入。"
    />
  );
}
