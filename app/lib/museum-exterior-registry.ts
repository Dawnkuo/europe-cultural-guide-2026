export const museumExteriorSlugs = [
  'last-supper', 'sforza', 'brera', 'la-scala', 'doges-palace', 'correr',
  'accademia-venice', 'camposanto', 'sinopie', 'opera-pisa', 'accademia-florence',
  'medici-chapels', 'uffizi', 'vasari-corridor', 'pitti', 'borghese',
  'vatican-museums', 'gaudi-house', 'picasso-barcelona', 'museum-ludwig', 'chocolate-museum',
] as const;
export function hasMuseumExterior(slug: string) {
  return (museumExteriorSlugs as readonly string[]).includes(slug);
}
