# Quick Performance Optimization Reference

## 🚀 Common Query Patterns - Before & After

### Pattern 1: Fetching Lessons List

**❌ SLOW (Before)**:
```typescript
const lessons = await prisma.lesson.findMany({
  orderBy: { createdAt: "desc" },
});
```
**Problems**: Fetches ALL fields including large `contentFr`/`contentEn`, no limit, no caching

**✅ FAST (After)**:
```typescript
import { getCachedLessonsList } from '@/lib/cache';

const lessons = await getCachedLessonsList({
  status: 'PUBLISHED',
  level: 'LYCEE_2BAC',
  limit: 50,
});
```
**Benefits**: Only needed fields, filtered, limited, cached

---

### Pattern 2: Lesson Detail Page

**❌ SLOW (Before)**:
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { slug },
  include: {
    chapters: true,
    series: true,
  },
});
```

**✅ FAST (After)**:
```typescript
import { getCachedLessonBySlug, getCachedSeriesByLesson } from '@/lib/cache';

const lesson = await getCachedLessonBySlug(slug);
const relatedSeries = await getCachedSeriesByLesson(lesson.id);
```

---

### Pattern 3: Forum Posts

**❌ SLOW (Before)**:
```typescript
const posts = await prisma.forumPost.findMany({
  include: {
    user: true,
    replies: true,
    reactions: true,
  },
  orderBy: { createdAt: 'desc' },
});
```
**Problems**: No pagination, over-fetching, N+1 queries

**✅ FAST (After)**:
```typescript
import { getCachedForumPosts } from '@/lib/cache';

const { posts, total, pages } = await getCachedForumPosts({
  page: 1,
  pageSize: 20,
});
```

---

### Pattern 4: Series with Exercises

**❌ SLOW (Before)**:
```typescript
const series = await prisma.series.findUnique({
  where: { id },
  include: {
    exercises: true,
    lesson: true,
  },
});
```

**✅ FAST (After)**:
```typescript
import { getCachedSeriesWithExercises } from '@/lib/cache';

const series = await getCachedSeriesWithExercises(id);
```

---

### Pattern 5: Admin Reports

**❌ SLOW (Before)**:
```typescript
const reports = await prisma.report.findMany({
  where: { isResolved: false },
  include: {
    user: true,
    replies: true,
  },
});
```

**✅ FAST (After)**:
```typescript
import { getCachedReportsList, getCachedUnresolvedReportsCount } from '@/lib/cache';

const reports = await getCachedReportsList({
  isResolved: false,
  limit: 50,
});

const count = await getCachedUnresolvedReportsCount();
```

---

## 📝 Migration Commands

### Development
```bash
# Generate Prisma client with new indexes
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_performance_indexes

# View database in Prisma Studio
npx prisma studio
```

### Production
```bash
# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## 🎯 ISR (Incremental Static Regeneration)

Add to pages that don't change often:

```typescript
// Revalidate every 5 minutes
export const revalidate = 300;

// Or revalidate every hour
export const revalidate = 3600;

export default async function Page() {
  // Your page code
}
```

**Good for**:
- Lesson pages
- Chapter pages
- Static content
- Documentation

**NOT good for**:
- User dashboards
- Admin pages
- Real-time data

---

## 🔄 Dynamic Imports (Lazy Loading)

For heavy components that aren't critical:

```typescript
import dynamic from 'next/dynamic';

// Lazy load with no SSR
const HeavyComponent = dynamic(
  () => import('@/components/heavy-component'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

// Use in your component
export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <HeavyComponent />
    </div>
  );
}
```

**Good candidates**:
- Charts (recharts)
- Video players
- PDF viewers
- Rich text editors
- Floating assistants

---

## 📊 Measuring Performance

### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Network** tab
3. Hard refresh (Ctrl+Shift+R)
4. Check:
   - **Load time**: Total page load
   - **Size**: Total bytes transferred
   - **Requests**: Number of requests

### Lighthouse
1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Click "Generate report"
4. Check:
   - Performance score (aim for 90+)
   - First Contentful Paint
   - Largest Contentful Paint
   - Time to Interactive

### Next.js Build
```bash
npm run build
```

Look for:
- Route sizes (should be < 200KB)
- First Load JS (should be < 100KB)
- Build time

---

## 🐛 Troubleshooting

### Migration Issues

**Error**: "Migration failed"
```bash
# Reset database (DEVELOPMENT ONLY!)
npx prisma migrate reset

# Or force push schema
npx prisma db push --force-reset
```

### Build Issues

**Error**: "Module not found"
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Query Issues

**Error**: "Prisma Client not found"
```bash
# Regenerate Prisma client
npx prisma generate
```

---

## 📋 Checklist for Each Page

When optimizing a page:

- [ ] Use cached queries from `@/lib/cache`
- [ ] Add `select` to only fetch needed fields
- [ ] Add pagination for lists (limit + offset)
- [ ] Add `revalidate` for static content
- [ ] Lazy load heavy components
- [ ] Add loading states
- [ ] Test with Chrome DevTools

---

## 🎨 Example: Optimized Page Template

```typescript
import { getCachedLessonsList } from '@/lib/cache';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const FloatingAssistant = dynamic(
  () => import('@/components/ui/floating-assistant').then(m => m.FloatingAssistant),
  { ssr: false }
);

// ISR - revalidate every 5 minutes
export const revalidate = 300;

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: { page?: string; level?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  // Use cached, optimized query
  const lessons = await getCachedLessonsList({
    status: 'PUBLISHED',
    level: searchParams.level as any,
    limit,
    offset,
  });

  return (
    <div className="container py-10">
      <h1>Lessons</h1>
      
      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>

      <Pagination page={page} />
      
      {/* Lazy loaded */}
      <FloatingAssistant />
    </div>
  );
}
```

---

## 🔗 Useful Links

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Cache API](https://react.dev/reference/react/cache)
- [Web Vitals](https://web.dev/vitals/)

---

## 💡 Pro Tips

1. **Always use `select`** when you don't need all fields
2. **Add pagination** to any list with > 20 items
3. **Use indexes** for any field you filter or sort by
4. **Cache repeated queries** with React's `cache()`
5. **Lazy load** components below the fold
6. **Add ISR** to static content pages
7. **Monitor** performance after each change

---

## 🎯 Priority Order

1. **Database indexes** (biggest impact)
2. **Optimized queries** (select + where + limit)
3. **React cache** (deduplicate queries)
4. **ISR** (cache pages)
5. **Lazy loading** (reduce initial bundle)
6. **Image optimization** (use Next/Image)

Start from the top and work your way down!
