import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/backoffice',
          '/admin-login',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/cart',
          '/checkout',
          '/payment',
          '/order-confirmed',
          '/orders',
          '/tracking',
        ],
      },
    ],
    sitemap: 'https://mimittos.com/sitemap.xml',
    host: 'https://mimittos.com',
  }
}
