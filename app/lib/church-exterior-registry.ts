export const churchExteriorSlugs = [
  'milan-duomo', 'santa-maria-grazie', 'st-mark-basilica', 'florence-duomo',
  'pisa-cathedral', 'pisa-baptistery', 'pantheon', 'sagrada-familia',
  'barcelona-cathedral', 'santa-maria-mar', 'cologne-cathedral', 'notre-dame-towers',
] as const;

export function hasChurchExterior(slug: string) {
  return (churchExteriorSlugs as readonly string[]).includes(slug);
}
