# MathSphere Platform - Performance Optimization Guide

## Executive Summary

After analyzing your MathSphere Platform, I've identified **8 critical areas** that are likely causing slowness. This document provides a prioritized roadmap for optimization.

---

## 🔴 Critical Issues (Immediate Impact)

### 1. **Missing Database Indexes**

**Problem**: Many frequently queried fields lack indexes, causing slow database queries.

**Impact**: HIGH - Every page load queries the database without proper indexing.

**Missing Indexes**:
- `Lesson.slug` - Used in every lesson page load
- `Lesson.status` - Filtered in admin pages
- `Series.lessonId` - Used to fetch related series
- `Series.public` - Filtered in public queries
- `ForumPost.createdAt` - Used for sorting
- `ForumReply.postId` - Used to fetch replies
- `Chapter.slug` - Used in chapter pages
- `Exercise.seriesId` - Used to fetch series exercises
- `Report.isResolved` - Filtered in admin dashboard
- `PlatformImage.entityType` and `entityId` - Used to fetch images
- `PlatformVideo.entityType` and `entityId` - Used to fetch videos

**Solution**: Add these indexes to `schema.prisma`:

```prisma
model Lesson {
  // ... existing fields
  
  @@index([level])
  @@index([moduleId])
  @@index([slug])        // NEW
  @@index([status])      // NEW
  @@index([stream])      // NEW
  @@index([semester])    // NEW
}

model Series {
  // ... existing fields
  
  @@index([lessonId])    // NEW
  @@index([public])      // NEW
  @@index([level])       // NEW
  @@index([stream])      // NEW
}

model ForumPost {
  // ... existing fields
  
  @@index([userId])
  @@index([createdAt])   // NEW
  @@index([isAiAnswered]) // NEW
}

model ForumReply {
  // ... existing fields
  
  @@index([postId])      // NEW
  @@index([userId])      // NEW
  @@index([createdAt])   // NEW
}

model Chapter {
  // ... existing fields
  
  @@index([lessonId])
  @@index([createdById])
  @@index([slug])        // NEW
  @@index([status])      // NEW
}

model Exercise {
  // ... existing fields
  
  @@index([lessonId])
  @@index([seriesId])    // NEW
}

model Report {
  // ... existing fields
  
  @@index([isResolved])  // NEW
  @@index([type])        // NEW
  @@index([userId])      // NEW
}

model PlatformImage {
  // ... existing fields
  
  @@index([entityType, entityId]) // NEW - Composite index
  @@index([uploaderId])           // NEW
}

model PlatformVideo {
  // ... existing fields
  
  @@index([entityType, entityId]) // NEW - Composite index
  @@index([uploaderId])           // NEW
  @@index([isPublic])             // NEW
}
```

**Deployment Steps**:
1. Update `schema.prisma` with the indexes above
2. Run `npx prisma migrate dev --name add_performance_indexes`
3. Run `npx prisma generate`
4. Deploy to production

---

### 2. **No Query Result Caching**

**Problem**: Every request fetches fresh data from the database, even for static content.

**Impact**: HIGH - Unnecessary database load and slow response times.

**Solution**: Implement Next.js caching strategies:

**A. Enable Static Generation for Static Pages**:

```typescript
// src/app/(public)/lessons/page.tsx
export const revalidate = 300; // Revalidate every 5 minutes

export default async function LessonsPage() {
  const lessons = await prisma.lesson.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      titleFr: true,
      slug: true,
      level: true,
      stream: true,
      semester: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return (/* ... */);
}
```

**B. Add React Cache for Repeated Queries**:

Create `src/lib/cache.ts`:
```typescript
import { cache } from 'react';
import { prisma } from './prisma';

// Cache lesson queries within a single request
export const getCachedLesson = cache(async (slug: string) => {
  return prisma.lesson.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { status: 'PUBLISHED' },
        orderBy: { order: 'asc' },
      },
    },
  });
});

// Cache series queries
export const getCachedSeries = cache(async (lessonId: string) => {
  return prisma.series.findMany({
    where: {
      lessonId,
      public: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      exercises: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
});

// Cache forum posts
export const getCachedForumPosts = cache(async (limit: number = 20) => {
  return prisma.forumPost.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          replies: true,
          reactions: true,
        },
      },
    },
  });
});
```

Then use in your pages:
```typescript
import { getCachedLesson, getCachedSeries } from '@/lib/cache';

export default async function LessonPage({ params }) {
  const { slug } = await params;
  const lesson = await getCachedLesson(slug);
  const relatedSeries = await getCachedSeries(lesson.id);
  // ...
}
```

---

### 3. **Inefficient Database Queries**

**Problem**: Over-fetching data and N+1 query problems.

**Impact**: MEDIUM-HIGH - Slow page loads, especially on list pages.

**Examples of Issues**:

**Current (Inefficient)**:
```typescript
// Fetches ALL fields, including large text content
const lessons = await prisma.lesson.findMany({
  orderBy: { createdAt: "desc" },
});
```

**Optimized**:
```typescript
// Only fetch what you need
const lessons = await prisma.lesson.findMany({
  select: {
    id: true,
    titleFr: true,
    slug: true,
    level: true,
    stream: true,
    semester: true,
    status: true,
    createdAt: true,
    // Don't fetch contentFr/contentEn for list views
  },
  where: {
    status: 'PUBLISHED', // Filter at DB level
  },
  orderBy: { createdAt: 'desc' },
  take: 50, // Limit results
});
```

**Solution**: Create optimized query helpers in `src/lib/queries.ts`:

```typescript
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// Optimized lesson list query
export async function getLessonsList(options?: {
  level?: string;
  stream?: string;
  semester?: number;
  status?: string;
  limit?: number;
}) {
  const where: Prisma.LessonWhereInput = {};
  
  if (options?.level) where.level = options.level as any;
  if (options?.stream) where.stream = options.stream as any;
  if (options?.semester) where.semester = options.semester;
  if (options?.status) where.status = options.status as any;

  return prisma.lesson.findMany({
    where,
    select: {
      id: true,
      titleFr: true,
      titleEn: true,
      slug: true,
      level: true,
      stream: true,
      semester: true,
      category: true,
      status: true,
      createdAt: true,
      module: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  });
}

// Optimized forum posts with pagination
export async function getForumPostsPaginated(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  
  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        isAiAnswered: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
            reactions: true,
          },
        },
      },
    }),
    prisma.forumPost.count(),
  ]);
  
  return {
    posts,
    total,
    pages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}
```

---

### 4. **Large CSS File (16KB)**

**Problem**: `globals.css` is 16KB with extensive Google Translate hiding rules and repetitive styles.

**Impact**: MEDIUM - Slower initial page load.

**Solution**: 

**A. Extract Google Translate CSS to separate file**:

Create `src/app/google-translate.css`:
```css
/* Google Translate Stealth Mode */
.goog-te-banner-frame.skiptranslate,
.goog-te-banner-frame,
iframe.goog-te-banner-frame,
#goog-gt-tt,
.goog-te-balloon-frame,
.goog-tooltip,
.goog-tooltip:hover {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* ... rest of Google Translate styles ... */
```

Then import conditionally only where needed.

**B. Minify and optimize CSS**:

Update `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
    'cssnano': process.env.NODE_ENV === 'production' ? {} : false,
  },
};
```

---

## 🟡 Important Optimizations (High Impact)

### 5. **Enable Next.js Production Optimizations**

**Update `next.config.ts`**:

```typescript
import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Enable React compiler (Next.js 15+)
  reactStrictMode: true,
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Enable optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reduce client bundle size
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  
  turbopack: {
    root: path.resolve(__dirname),
  },
  
  serverExternalPackages: ['puppeteer', 'puppeteer-core'],
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' blob: data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;",
          },
          // Cache static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
```

---

### 6. **Optimize Font Loading**

**Current Issue**: Roboto font loads synchronously, blocking render.

**Solution** - Update `src/app/layout.tsx`:

```typescript
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: 'swap', // ADD THIS - prevents FOIT (Flash of Invisible Text)
  preload: true,
  fallback: ['system-ui', 'arial'],
});
```

---

### 7. **Implement Pagination for Large Lists**

**Problem**: Loading all forum posts, lessons, or exercises at once is slow.

**Solution**: Add pagination to list pages.

**Example - Forum Posts**:

Create `src/components/forum/forum-posts-list.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ForumPostsList({ initialPosts, totalPages }) {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/forum/posts?page=${page + 1}`);
    const data = await res.json();
    setPosts([...posts, ...data.posts]);
    setPage(page + 1);
    setLoading(false);
  }

  return (
    <div>
      {posts.map(post => (
        <ForumPostCard key={post.id} post={post} />
      ))}
      
      {page < totalPages && (
        <Button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

---

### 8. **Optimize Prisma Connection Pool**

**Current Settings** (in `src/lib/prisma.ts`):
```typescript
const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 20, // Good
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  statement_timeout: 60000,
  query_timeout: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
```

**Recommended Production Settings**:
```typescript
const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: process.env.NODE_ENV === 'production' ? 10 : 5, // Reduce for serverless
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 60000, // 1 minute
  connectionTimeoutMillis: 10000, // 10 seconds (reduced)
  statement_timeout: 30000, // 30 seconds (reduced)
  query_timeout: 30000, // 30 seconds (reduced)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
```

---

## 🟢 Additional Optimizations (Nice to Have)

### 9. **Add Loading States**

Improve perceived performance with loading skeletons.

### 10. **Lazy Load Heavy Components**

```typescript
import dynamic from 'next/dynamic';

const FloatingAssistant = dynamic(
  () => import('@/components/ui/floating-assistant').then(mod => mod.FloatingAssistant),
  { ssr: false, loading: () => null }
);
```

### 11. **Optimize Images**

Use Next.js Image component everywhere:
```typescript
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  quality={85}
/>
```

### 12. **Enable Compression**

Already enabled in updated `next.config.ts` above.

---

## 📊 Monitoring & Measurement

### Before Optimization
Run these commands to establish baseline:

```bash
# Measure build size
npm run build

# Analyze bundle
npm install -D @next/bundle-analyzer
```

### After Optimization
Compare metrics:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Bundle Size

---

## 🚀 Implementation Priority

### Week 1: Critical (Immediate Impact)
1. ✅ Add database indexes
2. ✅ Implement React cache for queries
3. ✅ Optimize database queries (use select, where, take)

### Week 2: Important
4. ✅ Update Next.js config for production optimizations
5. ✅ Optimize font loading
6. ✅ Add pagination to forum and lessons

### Week 3: Polish
7. ✅ Extract and minify CSS
8. ✅ Lazy load heavy components
9. ✅ Optimize Prisma pool settings

---

## 📝 Deployment Checklist

Before deploying optimizations:

- [ ] Backup database
- [ ] Test migrations in development
- [ ] Run `npm run build` to verify no errors
- [ ] Test critical user flows
- [ ] Monitor error logs after deployment
- [ ] Compare performance metrics

---

## Expected Performance Gains

| Optimization | Expected Improvement |
|-------------|---------------------|
| Database Indexes | 40-60% faster queries |
| Query Caching | 30-50% faster page loads |
| Optimized Queries | 20-40% less data transfer |
| Next.js Config | 15-25% smaller bundles |
| Font Optimization | 10-20% faster FCP |
| Pagination | 50-70% faster list pages |

**Overall Expected Improvement**: 2-4x faster page loads

---

## Need Help?

If you encounter issues during implementation, check:
1. Database migration logs
2. Next.js build output
3. Browser console for errors
4. Network tab for slow requests
