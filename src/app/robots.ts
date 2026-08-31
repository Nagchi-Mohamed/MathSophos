import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-sophos.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/teacher/', '/api/', '/seed-trigger/', '/test-math-rendering/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
