import { OfflineStatus } from './OfflineStatus';
import { withBasePath } from '../lib/paths';
import { sitePageLinks } from '../lib/site-navigation';

type SiteNavProps = {
  active?: (typeof sitePageLinks)[number]['id'];
};

export function SiteNav({ active }: SiteNavProps) {
  return (
    <header className="subnav">
      <a className="subnav__brand" href={withBasePath('/')}>
        <span>EU</span>
        <strong>欧洲纪行 2026</strong>
      </a>
      <nav aria-label="主导航">
        {sitePageLinks.map((link) => (
          <a
            aria-current={active === link.id ? 'page' : undefined}
            href={withBasePath(link.href)}
            key={link.id}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <OfflineStatus />
    </header>
  );
}
