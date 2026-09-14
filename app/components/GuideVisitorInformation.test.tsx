import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { visitorInformation } from '../data/visitor-information';
import { GuideVisitorInformation } from './GuideVisitorInformation';
import { useGuideExperience } from './GuideExperience';

vi.mock('./GuideExperience', () => ({ useGuideExperience: vi.fn() }));
const mockExperience = vi.mocked(useGuideExperience);

describe('venue visitor information', () => {
  beforeEach(() => mockExperience.mockReturnValue(null));
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each(Object.entries(visitorInformation))(
    'renders every topic and question for %s without remote content',
    (slug, info) => {
      const { container } = render(<GuideVisitorInformation slug={slug} />);
      for (const topic of info.topics)
        expect(
          screen.getByRole('heading', { name: topic.title }),
        ).toBeInTheDocument();
      const questions = container.querySelectorAll('details');
      expect(questions).toHaveLength(info.questions.length);
      for (const [index, item] of info.questions.entries()) {
        expect(questions[index]).not.toHaveAttribute('open');
        expect(
          within(questions[index]).getByText(item.question),
        ).toBeInTheDocument();
        for (const paragraph of item.paragraphs)
          expect(
            within(questions[index]).getByText(paragraph),
          ).toBeInTheDocument();
      }
      expect(
        container.querySelectorAll('iframe, img, a[href^="http"]'),
      ).toHaveLength(0);
      expect(container.textContent).not.toMatch(
        /primary-web|evidenceIds|版权|来源声明/,
      );
    },
  );
  it('does not attach a generic visitor template to an unreviewed venue', () => {
    const { container } = render(<GuideVisitorInformation slug="uffizi" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('expands questions independently, retaining earlier answers', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GuideVisitorInformation slug="vatican-post" />,
    );
    const questions = container.querySelectorAll('details');
    await user.click(questions[0].querySelector('summary')!);
    await user.click(questions[1].querySelector('summary')!);
    expect(questions[0]).toHaveAttribute('open');
    expect(questions[1]).toHaveAttribute('open');
    await user.click(questions[0].querySelector('summary')!);
    expect(questions[0]).not.toHaveAttribute('open');
    expect(questions[1]).toHaveAttribute('open');
  });
  it('disables map targets until their reviewed plan is ready, then uses exact place IDs', async () => {
    const user = userEvent.setup();
    const locatePlace = vi.fn();
    const state = {
      plan: undefined,
      planFailed: false,
      locatePlace,
    } as unknown as NonNullable<ReturnType<typeof useGuideExperience>>;
    mockExperience.mockReturnValue(state);
    const { rerender } = render(
      <GuideVisitorInformation slug="vatican-museums" />,
    );
    expect(screen.getByRole('button', { name: '博物馆入口' })).toBeDisabled();
    mockExperience.mockReturnValue({ ...state, planFailed: true });
    rerender(<GuideVisitorInformation slug="vatican-museums" />);
    expect(screen.getByRole('button', { name: '博物馆入口' })).toHaveAttribute(
      'title',
      '地图暂不可用',
    );
    mockExperience.mockReturnValue({
      ...state,
      plan: { places: [{ id: 'first-入口-1' }] } as NonNullable<
        typeof state.plan
      >,
    });
    rerender(<GuideVisitorInformation slug="vatican-museums" />);
    await user.click(screen.getByRole('button', { name: '博物馆入口' }));
    expect(locatePlace).toHaveBeenCalledWith('first-入口-1');
    expect(screen.getByRole('button', { name: '衣帽间' })).toBeDisabled();
  });
});
