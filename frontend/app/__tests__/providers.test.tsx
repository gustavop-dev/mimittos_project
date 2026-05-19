import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import Providers from '../providers';

describe('Providers', () => {
  it('renders children', () => {
    render(
      <Providers>
        <span data-testid="child">content</span>
      </Providers>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
