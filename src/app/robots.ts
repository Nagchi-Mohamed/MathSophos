import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-sophos.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/lessons',
        '/exercises',
        '/exams-controls',
        '/admin/',
        '/teacher/',
        '/api/',
        '/forum/',
        '/fiches/',
        '/calculators',
        '/tutorials'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
