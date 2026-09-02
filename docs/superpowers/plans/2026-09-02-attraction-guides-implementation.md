# Full Attraction Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, offline-capable cultural guide chapter for every scheduled attraction while merging repeated entries for the same attraction.

**Architecture:** A canonical guide catalog maps itinerary item IDs to stable guide slugs. A static guide index and statically generated guide detail routes render one museum-editorial template with type-specific spatial, highlight, sequence, practical, and source modules. Client-only controls provide filters and onsite mode; the existing Service Worker precaches the exported routes and assets.

**Tech Stack:** React 19, TypeScript, Vinext static export, Vitest and Testing Library, existing CSS/PWA stack, GitHub Pages workflow.

---

### Task 1: Canonical guide data and itinerary mapping

**Files:**
- Create: `app/data/guides.ts`
- Create: `app/data/guides.test.ts`
- Modify: `app/data/types.ts`
- Modify: `app/data/trip.ts`

- [ ] **Step 1: Write the failing mapping tests**

```ts
import { describe, expect, it } from "vitest";
import { guideCatalog, guideForTripItem } from "./guides";
import { tripDays } from "./trip";

describe("guide catalog", () => {
  it("maps every scheduled cultural stop to a guide", () => {
    const items = tripDays.flatMap((day) => day.items).filter((item) =>
      ["landmark", "museum", "district"].includes(item.kind),
    );
    expect(items.filter((item) => !guideForTripItem(item))).toEqual([]);
  });

  it("merges repeated entries for the same attraction", () => {
    expect(guideForTripItem({ id: "st-peters-basilica", kind: "landmark" } as never)?.slug)
      .toBe(guideForTripItem({ id: "st-peters-dome", kind: "landmark" } as never)?.slug);
    expect(guideForTripItem({ id: "sagrada-basilica", kind: "landmark" } as never)?.slug)
      .toBe(guideForTripItem({ id: "sagrada-passion-tower", kind: "landmark" } as never)?.slug);
  });

  it("uses unique slugs", () => {
    expect(new Set(guideCatalog.map((guide) => guide.slug)).size).toBe(guideCatalog.length);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run app/data/guides.test.ts`

Expected: FAIL because `./guides` does not exist.

- [ ] **Step 3: Add focused guide types**

Add to `app/data/types.ts`:

```ts
export type GuideSpatialType = "floorplan" | "site" | "viewpoints" | "district";

export type GuideHighlight = {
  title: string;
  originalTitle?: string;
  creator?: string;
  period?: string;
  location?: string;
  summary: string;
  lookFor: string;
  image?: string;
  imageAlt?: string;
  imageCredit?: string;
};

export type GuideSource = {
  institution: string;
  title: string;
  url?: string;
  verifiedAt: string;
  note: string;
};

export type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  city: string;
  country: string;
  kind: Exclude<TripItemKind, "transport" | "hotel" | "food">;
  aliases: string[];
  itemIds: string[];
  hero: { src: string; alt: string; credit: string };
  overview: string;
  orientation: Array<{ title: string; body: string }>;
  spatial: { type: GuideSpatialType; title: string; note: string; stops: string[] };
  highlights: GuideHighlight[];
  sequence: Array<{ title: string; body: string }>;
  practical: string[];
  sources: GuideSource[];
  externalGuide?: { url: string; label: string };
};
```

Add `guideId?: string` to `TripItem`.

- [ ] **Step 4: Implement canonical mapping and complete catalog**

Create `app/data/guides.ts` with a `guideSeeds` array, explicit merge groups, and a fallback builder that uses the existing city image and itinerary notes without inventing operational facts:

```ts
const mergedItemIds: Record<string, string[]> = {
  "st-peters-basilica": ["st-peters-basilica", "st-peters-dome"],
  "sagrada-familia": ["sagrada-basilica", "sagrada-passion-tower"],
  "vatican-museums": ["key-master", "vatican-followup"],
  "cologne-cathedral": ["cologne-interior", "cologne-tower-treasury"],
  "ponte-vecchio": ["ponte-vecchio-night-27", "ponte-vecchio-night-28"],
  "florence-duomo": ["florence-duomo-exterior", "brunelleschi-dome"],
};
```

Use every cultural `TripItem` not consumed by a merge group as its own guide. The fallback guide must include the item note and arrival text, use `待确认` for missing facts, and expose at least three observation prompts derived from known fields rather than fabricated history.

- [ ] **Step 5: Run mapping tests and verify GREEN**

Run: `npm test -- --run app/data/guides.test.ts app/data/trip.test.ts`

Expected: PASS with every cultural itinerary item mapped and unique slugs.

- [ ] **Step 6: Commit**

```bash
git add app/data/types.ts app/data/trip.ts app/data/guides.ts app/data/guides.test.ts
git commit -m "Add canonical attraction guide catalog"
```

### Task 2: Curated city guide content packs

**Files:**
- Create: `app/data/guides/milan.ts`
- Create: `app/data/guides/venice.ts`
- Create: `app/data/guides/tuscany.ts`
- Create: `app/data/guides/rome-vatican.ts`
- Create: `app/data/guides/barcelona.ts`
- Create: `app/data/guides/cologne-paris.ts`
- Create: `app/data/guides/content.ts`
- Create: `app/data/guides/content.test.ts`
- Modify: `app/data/guides.ts`

- [ ] **Step 1: Write the failing content completeness test**

```ts
import { describe, expect, it } from "vitest";
import { guideCatalog } from "../guides";

describe("guide content packs", () => {
  it("provides full field-guide content for every attraction", () => {
    for (const guide of guideCatalog) {
      expect(guide.overview.length, guide.slug).toBeGreaterThan(80);
      expect(guide.orientation.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.spatial.stops.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.highlights.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.sequence.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.practical.length, guide.slug).toBeGreaterThanOrEqual(2);
      expect(guide.sources.length, guide.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("does not publish placeholder copy", () => {
    const serialized = JSON.stringify(guideCatalog);
    expect(serialized).not.toMatch(/TODO|TBD|稍后补充|示例文字/);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run app/data/guides/content.test.ts`

Expected: FAIL because the city content packs do not exist and fallback records do not meet the content contract.

- [ ] **Step 3: Build independent city content packs from primary sources**

Each city file exports `Partial<Record<GuideRecord["slug"], GuideContent>>`. Research official museum, monument, church, UNESCO or municipal pages first. Each record supplies a Chinese overview, three orientation facts, a type-appropriate spatial explanation with at least three stops, at least three specific works or observation points, at least three onsite sequence steps, practical notes, and direct source records with verification date `2026-09-02`.

For example, the Saint Peter record must include the integrated basilica and dome experience in one chapter:

```ts
export const romeVaticanGuideContent = {
  "st-peters-basilica": {
    overview: "圣彼得大教堂的空间不是一次完成的……",
    orientation: [
      { title: "先看轴线", body: "从中殿、华盖到穹顶，视线被逐层抬高。" },
      { title: "建筑跨越百年", body: "布拉曼特、米开朗基罗、马德尔诺与贝尼尼共同塑造今天的空间。" },
      { title: "穹顶属于同一次阅读", body: "登顶不是附加景点，而是从近距离马赛克走向城市全景的收束。" },
    ],
    spatial: {
      type: "floorplan",
      title: "从柱廊到穹顶的空间轴线",
      note: "简化示意，不作为精确导航；入口和开放区域以现场标识为准。",
      stops: ["圣彼得广场与安检", "入口右侧《圣殇》", "中殿与青铜华盖", "穹顶环廊及登顶步道"],
    },
  },
} satisfies GuideContentPack;
```

Do not copy prose from official pages. Paraphrase facts, keep direct links, and keep quotes below source limits. For an attraction without reliable interior plans, set `spatial.type` to `viewpoints` or `district` and describe visible relationships rather than inventing a floor plan.

- [ ] **Step 4: Merge content packs into canonical records**

`app/data/guides/content.ts` combines the six disjoint exports. `app/data/guides.ts` must fail fast in development when a guide slug has no curated content rather than silently publishing the fallback as complete.

The `vatican-museums` and `st-peters-basilica` records are exempt from local content generation. Set both `externalGuide.url` values to `https://dawnkuo.github.io/vatican-offline-guide/`; the index and itinerary link directly to that independent offline guide.

- [ ] **Step 5: Run completeness and mapping tests**

Run: `npm test -- --run app/data/guides/content.test.ts app/data/guides.test.ts`

Expected: PASS for every canonical guide.

- [ ] **Step 6: Commit**

```bash
git add app/data/guides app/data/guides.ts
git commit -m "Add cultural content for every attraction"
```

### Task 3: Guide index and global navigation

**Files:**
- Create: `app/guides/page.tsx`
- Create: `app/guides/page.test.tsx`
- Create: `app/components/GuideIndex.tsx`
- Modify: `app/components/SiteNav.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing index and navigation tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuidesPage from "./page";

it("lists guides and filters by city", async () => {
  render(<GuidesPage />);
  expect(screen.getByRole("heading", { name: "景点导览" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "罗马" }));
  expect(screen.getByRole("link", { name: /万神殿/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /米兰大教堂/ })).not.toBeInTheDocument();
});
```

Extend `app/components/SiteNav.test.tsx` to expect a `景点导览` link pointing to `withBasePath("/guides/")`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run app/guides/page.test.tsx app/components/SiteNav.test.tsx`

Expected: FAIL because the page and nav item do not exist.

- [ ] **Step 3: Implement the guide index**

`GuideIndex` is a client component with city and type buttons. `app/guides/page.tsx` renders the static introduction and passes `guideCatalog` to it. Each guide link uses `withBasePath(`/guides/${guide.slug}/`)` and shows city, kind, scheduled date/time, and status without prices.

- [ ] **Step 4: Add navigation and restrained index styles**

Add `景点导览` between `城市章节` and `逐日行程`. Style the page as full-width editorial rows with image, index, title and metadata; do not introduce nested cards.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test -- --run app/guides/page.test.tsx app/components/SiteNav.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/guides app/components/GuideIndex.tsx app/components/SiteNav.tsx app/components/SiteNav.test.tsx app/globals.css
git commit -m "Add attraction guide index"
```

### Task 4: Static single-attraction chapter pages

**Files:**
- Create: `app/guides/[slug]/page.tsx`
- Create: `app/guides/[slug]/page.test.tsx`
- Create: `app/components/GuideHero.tsx`
- Create: `app/components/GuideSpatial.tsx`
- Create: `app/components/GuideHighlights.tsx`
- Create: `app/components/GuideSequence.tsx`
- Create: `app/components/GuidePractical.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing page tests**

```tsx
import { render, screen } from "@testing-library/react";
import GuidePage, { generateStaticParams } from "./page";

it("generates one static route per guide", () => {
  expect(generateStaticParams()).toContainEqual({ slug: "st-peters-basilica" });
});

it("renders the reference structure in one chapter", async () => {
  render(await GuidePage({ params: Promise.resolve({ slug: "st-peters-basilica" }) }));
  expect(screen.getByRole("heading", { name: "圣彼得大教堂" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "空间关系" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "不可错过" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "现场顺序" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "实用攻略" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run 'app/guides/[slug]/page.test.tsx'`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement static params and the page shell**

Export `dynamic = "force-static"`, `dynamicParams = false`, and `generateStaticParams()` from the page. Look up the guide by slug and call `notFound()` for unknown values. Render `GuideHero`, local section navigation, spatial guide, highlights, sequence, practical information, sources and a non-official-project disclaimer.

- [ ] **Step 4: Implement type-specific modules**

`GuideSpatial` labels floorplan/site/viewpoint/district diagrams as simplified. `GuideHighlights` renders real images only when the source record contains attribution; otherwise it uses text-led editorial rows. `GuideSequence` numbers steps inside the attraction and never changes cross-attraction itinerary order.

- [ ] **Step 5: Add responsive chapter styles**

Use a full-bleed real-image hero, sticky local section navigation, stable spatial-diagram dimensions, large editorial headings and an unframed article flow. Add mobile rules for 390×844 and desktop rules for 1440×900 without viewport-scaled font sizes.

- [ ] **Step 6: Run tests and both builds**

Run:

```bash
npm test -- --run 'app/guides/[slug]/page.test.tsx'
npm run build
GITHUB_PAGES=true GITHUB_REPOSITORY=Dawnkuo/europe-cultural-guide-2026 NEXT_PUBLIC_BASE_PATH=/europe-cultural-guide-2026 npm run build:github
```

Expected: PASS; the exported artifact contains `guides/st-peters-basilica/index.html` and every `generateStaticParams` slug.

- [ ] **Step 7: Commit**

```bash
git add 'app/guides/[slug]' app/components/GuideHero.tsx app/components/GuideSpatial.tsx app/components/GuideHighlights.tsx app/components/GuideSequence.tsx app/components/GuidePractical.tsx app/globals.css
git commit -m "Add immersive attraction guide pages"
```

### Task 5: Itinerary links and onsite mode

**Files:**
- Create: `app/components/OnsiteGuide.tsx`
- Create: `app/components/OnsiteGuide.test.tsx`
- Modify: `app/components/DayTimeline.tsx`
- Modify: `app/itinerary/page.test.tsx`
- Modify: `app/guides/[slug]/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing interaction tests**

```tsx
it("opens and advances onsite mode", async () => {
  render(<OnsiteGuide guide={guideCatalog[0]} />);
  await userEvent.click(screen.getByRole("button", { name: "开始现场导览" }));
  expect(screen.getByRole("dialog", { name: /现场导览/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "下一站" }));
  expect(screen.getByText(/2 \/ /)).toBeInTheDocument();
});
```

Extend the itinerary test to assert that cultural-stop titles link to their guide and transport titles remain plain headings.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run app/components/OnsiteGuide.test.tsx app/itinerary/page.test.tsx`

Expected: FAIL because onsite mode and itinerary guide links do not exist.

- [ ] **Step 3: Implement onsite mode**

Use a native dialog-like overlay with `role="dialog"`, close, previous and next icon buttons, stable progress text, current stop, associated highlight details and a return-to-full-guide command. Store the last viewed step under `guide-progress:<slug>` in local storage only after mount.

- [ ] **Step 4: Link itinerary items**

Use `guideForTripItem(item)` inside `DayTimeline`. Render cultural titles as links to the canonical guide; repeated item IDs must resolve to the same link. Keep transportation, food and hotel rows unchanged.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test -- --run app/components/OnsiteGuide.test.tsx app/itinerary/page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/components/OnsiteGuide.tsx app/components/OnsiteGuide.test.tsx app/components/DayTimeline.tsx app/itinerary/page.test.tsx 'app/guides/[slug]/page.tsx' app/globals.css
git commit -m "Connect itinerary and onsite guides"
```

### Task 6: Offline route manifest and accessibility verification

**Files:**
- Create: `scripts/generate-guide-precache.mjs`
- Create: `scripts/generate-guide-precache.test.ts`
- Modify: `package.json`
- Modify: `public/sw.js`
- Modify: `scripts/prepare-github-pages.mjs`

- [ ] **Step 1: Write the failing precache test**

```ts
it("includes every guide route in the exported service worker core", async () => {
  await generateGuidePrecache({ output: tempDir, slugs: ["pantheon", "st-peters-basilica"] });
  const worker = readFileSync(join(tempDir, "sw.js"), "utf8");
  expect(worker).toContain("/guides/pantheon/");
  expect(worker).toContain("/guides/st-peters-basilica/");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run scripts/generate-guide-precache.test.ts`

Expected: FAIL because the generator does not exist.

- [ ] **Step 3: Implement route injection**

The generator imports canonical slugs from a JSON-safe export, inserts `/guides/` and every `/guides/<slug>/` route into a marked `GUIDE_ROUTES` section in the built Service Worker, and fails when an exported HTML file is missing. Run it from `build:github` after `prepare-github-pages.mjs`.

- [ ] **Step 4: Run tests and static build**

Run:

```bash
npm test -- --run scripts/generate-guide-precache.test.ts app/service-worker.test.ts
GITHUB_PAGES=true GITHUB_REPOSITORY=Dawnkuo/europe-cultural-guide-2026 NEXT_PUBLIC_BASE_PATH=/europe-cultural-guide-2026 npm run build:github
```

Expected: PASS, with guide routes present in `dist/client/sw.js`.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-guide-precache.mjs scripts/generate-guide-precache.test.ts scripts/prepare-github-pages.mjs package.json public/sw.js
git commit -m "Precache offline attraction guides"
```

### Task 7: Full verification, visual QA and GitHub Pages deployment

**Files:**
- Modify only files required to fix issues found during verification.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test -- --run
npm run lint
npm run build
GITHUB_PAGES=true GITHUB_REPOSITORY=Dawnkuo/europe-cultural-guide-2026 NEXT_PUBLIC_BASE_PATH=/europe-cultural-guide-2026 npm run build:github
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Serve the pure static artifact under the repository subpath**

Run a local static server that maps `/europe-cultural-guide-2026/` to `dist/client`. Verify the home page, `/guides/`, one museum guide, one church guide, one district guide and an itinerary-to-guide link.

- [ ] **Step 3: Perform desktop and mobile browser QA**

At 1440×900 and 390×844 verify:

- the hero contains a visible real image;
- navigation and long Chinese/foreign titles do not overlap;
- spatial modules have stable dimensions;
- onsite mode opens, advances and closes;
- no console errors occur;
- guide links preserve the GitHub Pages base path.

- [ ] **Step 4: Verify offline behavior**

Load the site online until the offline-ready state appears, disable network, and reload the guide index plus at least one detail route. Confirm text, essential images and internal navigation remain available.

- [ ] **Step 5: Commit verification fixes**

```bash
git add app public scripts package.json
git commit -m "Polish attraction guide experience"
```

- [ ] **Step 6: Merge to main and deploy**

Integrate the feature branch into `main`, push `main` to the `github` remote, wait for the `Deploy GitHub Pages` workflow to complete, and verify HTTP 200 for `/guides/` and representative detail routes on the live site.
