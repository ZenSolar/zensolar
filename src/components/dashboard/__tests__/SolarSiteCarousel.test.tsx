// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SolarSiteCarousel } from '../SolarSiteCarousel';

describe('SolarSiteCarousel', () => {
  const slides = [
    { key: 'all', caption: 'All Sites · 3', node: <div>All Sites Tile</div> },
    { key: 'site-a', caption: 'PROJ-8098', provider: 'tesla' as const, node: <div>Site A Tile</div> },
    { key: 'site-b', caption: 'PROJ-8099', provider: 'enphase' as const, node: <div>Site B Tile</div> },
    { key: 'site-c', caption: 'PROJ-8100', provider: 'solaredge' as const, node: <div>Site C Tile</div> },
  ];

  it('renders one slide per device plus the aggregate', () => {
    render(<SolarSiteCarousel slides={slides} />);
    expect(screen.getByText('All Sites Tile')).toBeInTheDocument();
    expect(screen.getByText('Site A Tile')).toBeInTheDocument();
    expect(screen.getByText('Site B Tile')).toBeInTheDocument();
    expect(screen.getByText('Site C Tile')).toBeInTheDocument();
  });

  it('exposes carousel semantics and one pagination dot per slide', () => {
    render(<SolarSiteCarousel slides={slides} />);
    expect(screen.getByTestId('solar-site-carousel')).toHaveAttribute('aria-label', 'Solar sites');
    const dots = screen.getAllByRole('button', { name: /^Go to / });
    expect(dots).toHaveLength(slides.length);
  });

  it('renders nothing when given an empty slide list', () => {
    const { container } = render(<SolarSiteCarousel slides={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
