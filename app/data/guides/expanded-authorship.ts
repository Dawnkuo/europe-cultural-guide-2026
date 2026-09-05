export type AuthoredHighlight = {
  id: string;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  lookFor: string;
  displayNote?: string;
};

export const work = (
  id: string,
  title: string,
  category: string,
  summary: string,
  whyItMatters: string,
  lookFor: string,
  displayNote?: string,
): AuthoredHighlight => ({
  id,
  title,
  category,
  summary,
  whyItMatters,
  lookFor,
  ...(displayNote ? { displayNote } : {}),
});
