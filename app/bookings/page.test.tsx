import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BookingsPage from './page';
import { bookingRecords } from '../data/bookings';

describe('BookingsPage', () => {
  it('provides native tables with column headers, row headers and complete records', () => {
    render(<BookingsPage />);
    for (const category of ['门票', '交通', '住宿']) {
      const table = screen.getByRole('table', { name: `${category}状态` });
      const records = bookingRecords.filter(
        (record) => record.category === category,
      );
      expect(table.tagName).toBe('TABLE');
      expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
      expect(within(table).getAllByRole('rowheader')).toHaveLength(
        records.length,
      );
      expect(within(table).getAllByRole('cell')).toHaveLength(
        records.length * 3,
      );
      for (const record of records) {
        expect(
          within(table).getByRole('rowheader', {
            name: `${record.date} ${record.title}`,
          }),
        ).toBeInTheDocument();
      }
    }
  });
  it('groups ticket, transport and hotel records without prices', () => {
    const { container } = render(<BookingsPage />);

    expect(screen.getByRole('heading', { name: '门票' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '交通' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '住宿' })).toBeInTheDocument();
    expect(screen.getByText('圣殿14:30；穹顶15:30')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/€|EUR|总价|金额/);
  });
});
