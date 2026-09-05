import { Accessibility, ArrowUpDown, Baby, BookOpen, Coffee, Footprints, Headphones, HeartPulse, Info, LogIn, LogOut, Luggage, Mail, MapPin, ShieldCheck, ShoppingBag, Ticket, Toilet, Users, Utensils } from 'lucide-react';
import { serviceMarkerKind, type PlanPlace } from '../lib/architectural-plan';

const icons = {
  accessible: Accessibility, toilet: Toilet, lift: ArrowUpDown, stairs: Footprints,
  baby: Baby, 'first-aid': HeartPulse, luggage: Luggage, coffee: Coffee,
  food: Utensils, audio: Headphones, ticket: Ticket, book: BookOpen,
  shop: ShoppingBag, mail: Mail, exit: LogOut, entrance: LogIn,
  group: Users, permission: ShieldCheck, info: Info, place: MapPin,
};

export function PlanPlaceMarker({ place }: { place: PlanPlace }) {
  const kind = serviceMarkerKind(place);
  if (!kind) return place.label;
  const Icon = icons[kind];
  return <><Icon size="1.15em" aria-hidden="true" /><span className="sr-only">{place.label}</span></>;
}
