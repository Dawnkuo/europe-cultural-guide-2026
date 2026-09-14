import { ExteriorModelPreview } from '../components/ExteriorModelPreview';
import { SiteNav } from '../components/SiteNav';

export const dynamic = 'force-static';

export default function ModelsPage() {
  return <main className="subpage model-preview-page">
    <SiteNav />
    <ExteriorModelPreview />
  </main>;
}
