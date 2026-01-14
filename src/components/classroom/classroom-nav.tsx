"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ClassroomNavProps {
  classroomId: string;
}

export function ClassroomNav({ classroomId }: ClassroomNavProps) {
  const pathname = usePathname();

  // Exact match for stream, startsWith for others to handle sub-routes if any
  const isStream = pathname === `/classrooms/${classroomId}`;
  const isClasswork = pathname?.startsWith(`/classrooms/${classroomId}/assignments`);
  const isPeople = pathname?.startsWith(`/classrooms/${classroomId}/people`);
  const isLive = pathname?.startsWith(`/classrooms/${classroomId}/live`);

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl mb-8 w-full md:w-auto overflow-x-auto border border-zinc-200 dark:border-zinc-800">
      <Link
        href={`/classrooms/${classroomId}`}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
          isStream
            ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
        )}
      >
        Flux
      </Link>
      <Link
        href={`/classrooms/${classroomId}/assignments`}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
          isClasswork
            ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
        )}
      >
        Travaux
      </Link>
      <Link
        href={`/classrooms/${classroomId}/people`}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
          isPeople
            ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
        )}
      >
        Personnes
      </Link>
      <Link
        href={`/classrooms/${classroomId}/live`}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2",
          isLive
            ? "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/20"
            : "text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75", isLive ? "bg-red-400" : "bg-zinc-400 hidden")}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isLive ? "bg-red-500" : "bg-zinc-400")}></span>
          </span>
          Cours en direct
        </div>
      </Link>
    </div>
  );
}
