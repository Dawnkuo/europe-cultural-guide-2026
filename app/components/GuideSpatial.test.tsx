import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideSpatial } from './GuideSpatial';

describe('GuideSpatial', () => {
  it('renders a real 3D canvas with accessible attraction-specific controls', () => {
    const guide = guideCatalog.find((item) => item.slug === 'pantheon')!;
    render(<GuideSpatial guide={guide} />);

    expect(
      screen.getByRole('region', { name: '万神殿三维空间示意' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '3D 导览地图' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('万神殿三维空间画布')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '重置三维视角' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '暂停自动旋转' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /聚焦/ })).toHaveLength(
      guide.spatial.stops.length,
    );
    expect(screen.getByText('起点')).toBeInTheDocument();
    expect(screen.getByText('终点')).toBeInTheDocument();
  });
});
