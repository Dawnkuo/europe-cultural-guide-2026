import GuidePage from '../guides/[slug]/page';

export const dynamic = 'force-static';

export default function VaticanGuidePage() {
  return GuidePage({
    params: Promise.resolve({ slug: 'vatican-museums' }),
  });
}
