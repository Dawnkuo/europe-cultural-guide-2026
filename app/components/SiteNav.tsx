import { OfflineStatus } from './OfflineStatus';
import { withBasePath } from '../lib/paths';

type SiteNavProps = {
  active?: 'itinerary' | 'cities' | 'guides' | 'bookings' | 'sources';
};

const links = [
  { href: '/itinerary/', label: '逐日行程', id: 'itinerary' },
  { href: '/cities/', label: '城市文化', id: 'cities' },
  { href: '/guides/', label: '景点导览', id: 'guides' },
  { href: '/bookings/', label: '凭证状态', id: 'bookings' },
  { href: '/sources/', label: '资料来源', id: 'sources' },
] as const;

export function SiteNav({ active }: SiteNavProps) {
  return (
    <header className="subnav">
      <a className="subnav__brand" href={withBasePath('/')}>
        <span>EU</span>
        <strong>欧洲纪行 2026</strong>
      </a>
      <nav aria-label="主导航">
        {links.map((link) => (
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
