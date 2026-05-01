import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { FadeUp, FadeIn, SlideIn, StaggerContainer, StaggerItem } from '../motion';

jest.mock('framer-motion', () => ({
  __esModule: true,
  motion: {
    div: ({ children, variants: _v, initial: _i, whileInView: _w, viewport: _vp, transition: _t, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

describe('motion wrappers', () => {
  it('FadeUp renders its children', () => {
    render(<FadeUp>FadeUp content</FadeUp>);
    expect(screen.getByText('FadeUp content')).toBeInTheDocument();
  });

  it('FadeUp forwards data attributes', () => {
    render(<FadeUp data-testid="fade-up-root">x</FadeUp>);
    expect(screen.getByTestId('fade-up-root')).toBeInTheDocument();
  });

  it('FadeIn renders its children', () => {
    render(<FadeIn delay={0.2}>Welcome</FadeIn>);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('SlideIn renders with default left direction', () => {
    render(<SlideIn>Sliding</SlideIn>);
    expect(screen.getByText('Sliding')).toBeInTheDocument();
  });

  it('SlideIn accepts right direction', () => {
    render(<SlideIn direction="right">From right</SlideIn>);
    expect(screen.getByText('From right')).toBeInTheDocument();
  });

  it('StaggerContainer renders its children', () => {
    render(
      <StaggerContainer>
        <span>item-1</span>
        <span>item-2</span>
      </StaggerContainer>
    );
    expect(screen.getByText('item-1')).toBeInTheDocument();
    expect(screen.getByText('item-2')).toBeInTheDocument();
  });

  it('StaggerItem renders its children', () => {
    render(<StaggerItem delay={0.1}>stagger child</StaggerItem>);
    expect(screen.getByText('stagger child')).toBeInTheDocument();
  });
});
