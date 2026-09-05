import { validateArchitecturalPlan, type ArchitecturalPlan } from './architectural-plan';

const modules = import.meta.glob<{ default: ArchitecturalPlan }>('../data/architectural-plans/*.json');

export function hasArchitecturalPlan(slug: string) {
  return `../data/architectural-plans/${slug}.json` in modules;
}

export async function loadArchitecturalPlan(slug: string) {
  const load = modules[`../data/architectural-plans/${slug}.json`];
  if (!load) throw new Error(`No reviewed architectural plan: ${slug}`);
  const plan = (await load()).default;
  const errors = validateArchitecturalPlan(plan);
  if (errors.length) throw new Error(`Invalid architectural plan: ${errors.join('; ')}`);
  return plan;
}
