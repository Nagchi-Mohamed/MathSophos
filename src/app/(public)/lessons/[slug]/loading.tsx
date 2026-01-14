import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function LessonDetailLoading() {
  return (
    <div className="container py-10 max-w-7xl">
      <LoadingSkeleton className="h-4 w-32 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-9 space-y-8">
          <div className="space-y-4 border-b pb-8">
            <div className="flex gap-2">
              <LoadingSkeleton className="h-6 w-24" />
              <LoadingSkeleton className="h-6 w-32" />
            </div>
            <LoadingSkeleton className="h-12 w-3/4" />
            <LoadingSkeleton className="h-4 w-48" />
          </div>

          <div className="space-y-4">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-5/6" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-4/5" />
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">
            <LoadingSkeleton className="h-6 w-32 mb-4" />
            <LoadingSkeleton className="h-4 w-full mb-2" />
            <LoadingSkeleton className="h-4 w-full mb-2" />
            <LoadingSkeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
