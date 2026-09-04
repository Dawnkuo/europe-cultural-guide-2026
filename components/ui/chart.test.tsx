import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from './chart';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('Chart payload keys', () => {
  it('uses a named series for function data keys without coercing or calling the function', () => {
    const dataKey = vi.fn(() => 42);
    render(
      <ChartContainer config={{ visitors: { label: 'Visitors' } }}>
        <ChartTooltipContent
          active
          payload={[
            {
              graphicalItemId: 'visitors',
              dataKey,
              name: 'visitors',
              value: 42,
            },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getAllByText('Visitors')).toHaveLength(2);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(dataKey).not.toHaveBeenCalled();
  });

  it('resolves numeric zero and explicit name and label overrides', () => {
    const { rerender } = render(
      <ChartContainer config={{ 0: { label: 'Zero' } }}>
        <ChartTooltipContent
          active
          payload={[{ graphicalItemId: 'series', dataKey: 0, value: 12 }]}
        />
      </ChartContainer>,
    );
    expect(screen.getAllByText('Zero')).toHaveLength(2);
    rerender(
      <ChartContainer
        config={{
          heading: { label: 'Daily visits' },
          series: { label: 'Visitors' },
        }}
      >
        <ChartTooltipContent
          active
          labelKey="heading"
          nameKey="series"
          payload={[{ graphicalItemId: 'series', dataKey: 0, value: 12 }]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Daily visits')).toBeInTheDocument();
    expect(screen.getByText('Visitors')).toBeInTheDocument();
  });

  it('falls back predictably for anonymous function keys in tooltips and legends', () => {
    const dataKey = vi.fn(() => 7);
    render(
      <ChartContainer config={{ value: { label: 'Value' } }}>
        <div>
          <ChartTooltipContent
            active
            hideLabel
            payload={[{ graphicalItemId: 'series', dataKey, value: 7 }]}
          />
          <ChartLegendContent
            payload={[{ dataKey, value: 'Series', color: '#cba95c' }]}
          />
        </div>
      </ChartContainer>,
    );
    expect(screen.getAllByText('Value')).toHaveLength(2);
    expect(dataKey).not.toHaveBeenCalled();
  });

  it('preserves numeric legend keys', () => {
    render(
      <ChartContainer config={{ 0: { label: 'Zero' } }}>
        <ChartLegendContent
          payload={[{ dataKey: 0, value: 'Series', color: '#cba95c' }]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Zero')).toBeInTheDocument();
  });
});
