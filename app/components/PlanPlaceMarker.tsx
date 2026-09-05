import { Accessibility, ArrowUpDown, Baby, BookOpen, Coffee, Footprints, Headphones, HeartPulse, Info, LogIn, LogOut, Luggage, Mail, MapPin, ShieldCheck, ShoppingBag, Ticket, Toilet, Users, Utensils } from 'lucide-react';
import { guideNumberWidth, serviceMarkerKind, type PlanPlace } from '../lib/architectural-plan';

const icons = {
  accessible: Accessibility, toilet: Toilet, lift: ArrowUpDown, stairs: Footprints,
  baby: Baby, 'first-aid': HeartPulse, luggage: Luggage, coffee: Coffee,
  food: Utensils, audio: Headphones, ticket: Ticket, book: BookOpen,
  shop: ShoppingBag, mail: Mail, exit: LogOut, entrance: LogIn,
  group: Users, permission: ShieldCheck, info: Info, place: MapPin,
};

export function PlanPlaceMarker({ place, zoom = 1, descriptionId }: { place: PlanPlace; zoom?: number; descriptionId?: string }) {
  const kind = serviceMarkerKind(place);
  const Icon = kind ? icons[kind] : null;
  return <>
    {place.guideNumbers?.length ? <span className="architectural-map__route-number" data-guide-numbers={place.guideNumbers.join(',')} aria-hidden="true"
      style={{ width: guideNumberWidth(place.guideNumbers) * zoom, height: 20 * zoom, fontSize: 11 * zoom, marginRight: 4 * zoom }}>{place.guideNumbers.join('·')}</span> : null}
    {Icon && <Icon size="1.15em" aria-hidden="true" />}
    <span data-place-label className={Icon ? 'sr-only' : undefined}>{place.label}</span>
    {descriptionId && <span id={descriptionId} className="sr-only">导览步骤 {place.guideNumbers?.join('、')}</span>}
  </>;
}
