import { describe, expect, it } from 'vitest';
import {
  bookingNeedsAction,
  bookingRecords,
  bookingReviewDate,
} from './bookings';
import { guideForTripItem } from './guides';
import { tripDays } from './trip';

describe('September 7 booking reconciliation', () => {
  const items = tripDays.flatMap((day) => day.items);

  it('covers every booked, unbooked or unverified main admission and transport item', () => {
    const covered = new Set(
      bookingRecords.flatMap((record) => record.itemIds ?? []),
    );
    const required = items.filter((item) =>
      ['已订', '未订', '待确认'].includes(item.status),
    );
    expect(
      required.filter((item) => !covered.has(item.id)).map((item) => item.id),
    ).toEqual([]);
    for (const record of bookingRecords) {
      expect(record.validity, record.id).toBeTruthy();
      expect(record.note, record.id).toBeTruthy();
      for (const id of record.itemIds ?? [])
        expect(
          items.some((item) => item.id === id),
          id,
        ).toBe(true);
    }
    expect(new Set(bookingRecords.map((record) => record.id)).size).toBe(
      bookingRecords.length,
    );
    expect(bookingReviewDate).toBe('2026-09-07');
  });

  it('keeps seven confirmed hotel reservations separate from arrival actions', () => {
    const hotels = bookingRecords.filter(
      (record) => record.category === '住宿',
    );
    expect(hotels).toHaveLength(7);
    expect(hotels.every((record) => record.status === '已订')).toBe(true);
    for (const id of ['florence-hotel', 'rome-hotel']) {
      expect(
        bookingNeedsAction(hotels.find((record) => record.id === id)!),
      ).toBe(true);
    }
    expect(hotels.find((record) => record.id === 'rome-hotel')?.note).toContain(
      '05:20',
    );
    expect(
      hotels.find((record) => record.id === 'barcelona-hotel')?.note,
    ).toContain('领取钥匙');
  });

  it('does not equate a paid receipt with a ready-to-use travel document', () => {
    for (const id of ['pisa-outbound', 'pisa-return', 'fr3181', 'fr2507']) {
      const record = bookingRecords.find((record) => record.id === id)!;
      expect(record.status).toBe('已订');
      expect(bookingNeedsAction(record)).toBe(true);
    }
    expect(
      bookingRecords.find((record) => record.id === 'pisa-return')?.note,
    ).toContain('NOT VALID FOR TRAVEL');
  });

  it('uses the approved Florence arrival window without claiming the fee is paid', () => {
    const hotel = bookingRecords.find((record) => record.id === 'florence-hotel')!;
    const train = items.find((item) => item.id === 'italo-8927')!;
    expect(hotel.status).toBe('已订');
    expect(hotel.validity).toBe('已批准20:00–21:00入住；10:00前退房');
    expect(hotel.note).toContain('晚到入住请求已通过');
    expect(hotel.note).toContain('已同意额外费用，未见付款凭证');
    expect(hotel.note).toContain('29日仍需安排退房及寄存');
    expect(bookingNeedsAction(hotel)).toBe(true);
    expect(train.time).toBe('18:05–20:20');
    expect(train.note).toContain('已批准20:00–21:00晚到入住');
    expect(train.conflict).not.toMatch(/19:00|晚到方式待确认/);
    expect(train.conflict).toContain('17:10重叠');
  });

  it('clears the Venice late-arrival action while keeping the original overnight booking', () => {
    const hotel = bookingRecords.find((record) => record.id === 'venice-hotel')!;
    const train = items.find((item) => item.id === 'italo-8997')!;
    const transport = bookingRecords.find((record) => record.id === 'italo-8997')!;
    expect(hotel.status).toBe('已订');
    expect(hotel.date).toBe('9月26–27日 · 1晚');
    expect(hotel.validity).toContain('已批准9月27日凌晨00:00–01:00入住');
    expect(hotel.validity).toContain('07:30–11:00退房');
    expect(hotel.note).toContain('请求已通过');
    expect(hotel.note).not.toMatch(/50|晚到方式待确认|不是酒店已批准/);
    expect(bookingNeedsAction(hotel)).toBe(false);
    expect(train.time).toBe('20:00–23:42');
    expect(train.note).toContain('已批准9月27日凌晨00:00–01:00入住');
    expect(train.conflict).toBeUndefined();
    expect(transport.note).toContain('已批准9月27日凌晨00:00–01:00入住');
  });

  it('records approved Rome late arrival separately from registration and access instructions', () => {
    const hotel = bookingRecords.find((record) => record.id === 'rome-hotel')!;
    const train = items.find((item) => item.id === 'italo-8967')!;
    const transport = bookingRecords.find((record) => record.id === 'italo-8967')!;
    const departure = items.find((item) => item.id === 'fr3181')!;
    expect(hotel.date).toBe('9月29日–10月2日 · 3晚');
    expect(hotel.validity).toBe('已批准22:00–23:00入住；06:00–10:00退房');
    expect(hotel.note).toContain('你已确认完成Vikey在线登记');
    expect(hotel.note).toContain('已批准9月29日22:00–23:00入住');
    expect(hotel.note).toContain('具体开门或取钥匙指引待补');
    expect(hotel.note).toContain('10月2日05:20');
    expect(hotel.note).not.toMatch(/未见完成证明|仍需房东确认晚到入住/);
    expect(bookingNeedsAction(hotel)).toBe(true);
    expect(train.time).toBe('20:03–21:43');
    expect(train.note).toContain('已批准当日22:00–23:00入住');
    expect(train.note).toContain('你已确认完成Vikey在线登记');
    expect(train.conflict).toContain('具体开门或取钥匙指引待补');
    expect(train.conflict).not.toMatch(/需完成在线登记|20:00的常规入住截止|仍需房东确认晚到入住/);
    expect(transport.note).toContain('已批准当日22:00–23:00入住');
    expect(departure.conflict).toContain('需确认提前退房和钥匙归还方式');
  });

  it('keeps the three Cologne visits in one guide and two admission orders', () => {
    const ids = [
      'cologne-interior',
      'cologne-tower-treasury',
      'cologne-treasury',
    ];
    for (const id of ids)
      expect(guideForTripItem({ id })?.slug).toBe('cologne-cathedral');
    expect(
      bookingRecords.filter((record) =>
        record.itemIds?.some((id) => ids.includes(id)),
      ),
    ).toHaveLength(2);
  });

  it('contains no private ticket identifiers or credentials', () => {
    expect(JSON.stringify(bookingRecords)).not.toMatch(
      /€|EUR|CNY|TIE-\d+|DOM-\d+|PIN.?CODE|\b\d{8,}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|guest\.vikey\.it\/checkin\//,
    );
  });
});
