export const LANDMARK_EXTERIOR_SLUGS = [
  'la-pedrera', 'galleria-vittorio', 'ponte-vecchio', 'st-mark-campanile',
  'st-mark-square', 'rialto', 'fenice', 'gondola', 'piazzale-michelangelo',
  'mercato-centrale', 'signoria', 'giunti-odeon', 'colosseum', 'roman-forum',
  'palatine', 'piazza-venezia', 'trevi', 'spanish-steps', 'piazza-navona',
  'vatican-post', 'park-guell', 'turo-rovira', 'palau-musica', 'hohenzollern',
  'koln-triangle',
] as const;

const landmarkSlugs = new Set<string>(LANDMARK_EXTERIOR_SLUGS);
export function hasLandmarkExterior(slug: string) {
  return landmarkSlugs.has(slug);
}
