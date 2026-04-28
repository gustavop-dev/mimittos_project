import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('../../components/ui/motion', () => ({
  FadeUp: ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
  FadeIn: ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
  SlideIn: ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
  StaggerContainer: ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
  StaggerItem: ({ children, ...p }: { children: React.ReactNode; [k: string]: unknown }) => <div {...p}>{children}</div>,
}))

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn().mockResolvedValue({ data: [] }) },
}))

import HomePage from '../page';

jest.mock('../../components/blog/BlogCarousel', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/product/ProductCarousel', () => ({
  __esModule: true,
  default: () => null,
}));

describe('HomePage', () => {
  it('renders main heading', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: /Cada abrazo guarda un recuerdo único/i })
    ).toBeInTheDocument();
  });
});
