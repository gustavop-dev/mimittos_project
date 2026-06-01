import React from 'react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';

jest.mock('next/image', () => ({
  __esModule: true,
  default: function NextImage(props: any) {
    const { fill, ...rest } = props;
    return React.createElement('img', { ...rest, alt: props.alt });
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

// Config Wompi determinística para tests (valores de sandbox, irrelevantes porque
// fetch está mockeado). Garantiza que el guard de paymentService no falle por
// config ausente, sin depender del .env de la máquina/CI.
process.env.NEXT_PUBLIC_WOMPI_API_URL ||= 'https://sandbox.wompi.co/v1';
process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||= 'pub_test_jest';
