import { ExteriorModelPreview } from '../../app/components/ExteriorModelPreview';
import { SiteNav } from '../../app/components/SiteNav';

export const dynamic = 'force-static';

export default function ModelsPage() {
  return <main className="subpage model-preview-page">
    <SiteNav />
    <ExteriorModelPreview />
  </main>;
}
