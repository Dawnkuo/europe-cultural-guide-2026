import { describe, expect, it } from 'vitest';
import { tripDays } from '../data/trip';
import type { TripDay } from '../data/types';
import { cityVisitOrder, journeyCityOrder } from './journey-route';

describe('city visit order', () => {
  it('uses scheduled item order, including the return to Florence and Paris', () => {
    expect(journeyCityOrder).toEqual(['巴黎', '米兰', '威尼斯', '佛罗伦萨', '比萨', '佛罗伦萨', '罗马', '巴塞罗那', '科隆', '巴黎']);
  });
  it('does not turn alternatives or consecutive Rome/Vatican visits into extra legs', () => {
    const days: TripDay[] = [{
      ...tripDays[0],
      items: ['罗马', '梵蒂冈', '罗马', '威尼斯', '巴黎', '巴黎'].map((city, index) => ({
        ...tripDays[0].items[0], id: String(index), city, routePoint: index !== 3,
      })),
    }];
    expect(cityVisitOrder(days)).toEqual(['罗马', '巴黎']);
    expect(cityVisitOrder([])).toEqual([]);
  });
});
