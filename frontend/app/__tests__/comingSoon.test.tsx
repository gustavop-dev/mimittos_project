import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

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
