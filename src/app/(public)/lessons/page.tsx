
import { getPaginatedLessons, LessonFilters } from "@/actions/content";
import { LessonCard } from "@/components/ui/lesson-card";
import { ChapterCard } from "@/components/ui/chapter-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EducationalLevel, Stream } from "@/lib/enums";
import { EDUCATION_SYSTEM, Cycle, SEMESTERS } from "@/lib/education-system";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, School, Calculator, Search, Filter, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLevel } from "@/utils/formatters";
import { T } from "@/components/ui/t";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LessonSearchFilters } from "@/components/lessons/lesson-search-filters";
import { getStreamsByLevel, getStreamById } from "@/actions/streams";
import { getModulesByStream } from "@/actions/modules";
import { getChaptersByLesson } from "@/actions/chapters";
import { getLessonById } from "@/actions/content";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{
    cycle?: Cycle;
    level?: EducationalLevel;
    stream?: Stream;
    semester?: string;
    category?: string;
    page?: string;
    search?: string;
    streamId?: string;
    moduleId?: string;
    lessonId?: string;
  }>;
}

export default async function LessonsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { cycle, level, stream, semester, category, page, search, streamId, moduleId, lessonId } = resolvedParams;

  const currentPage = Number(page) || 1;
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  // Determine if we should show the list, chapters, or the navigation
  let showList = false;
  let showChapters = false;

  if (search) {
    showList = true;
  } else if (cycle === "COLLEGE" && level && semester) {
    showList = true;
  } else if (cycle === "LYCEE" && level && stream && semester) {
    showList = true;
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    showChapters = true;
  } else if (cycle === "SUPERIEUR" && streamId && moduleId) {
    showList = true;
  }

  // Fetch lessons if we are showing the list
  let lessonsData = null;

  if (showList) {
    const filters: LessonFilters = {
      level: level,
      stream: stream,
      semester: semester ? Number(semester) : undefined,
      category: category,
      search: search,
    };
    // SUPERIEUR uses educationalStreamId and moduleId instead of level/stream/semester
    if (cycle === "SUPERIEUR") {
      filters.level = EducationalLevel.UNIVERSITY;
      filters.educationalStreamId = streamId;
      filters.moduleId = moduleId;
      // Clear stream and semester for SUPERIEUR (not used)
      delete filters.stream;
      delete filters.semester;
    }

    lessonsData = await getPaginatedLessons(limit, offset, filters);
  }

  // Fetch dynamic streams if needed
  let dynamicStreams: any[] = [];
  if (cycle === "SUPERIEUR" && !streamId) {
    const result = await getStreamsByLevel(EducationalLevel.UNIVERSITY);
    dynamicStreams = result.data || [];
  }

  // Fetch current stream details if needed
  let currentStream = null;
  if (cycle === "SUPERIEUR" && streamId) {
    const result = await getStreamById(streamId);
    currentStream = result.data;
  }

  // Fetch modules for SUPERIEUR if streamId is selected
  let modules: any[] = [];
  let currentModule = null;
  if (cycle === "SUPERIEUR" && streamId && !moduleId && !lessonId) {
    const modulesResult = await getModulesByStream(streamId);
    modules = modulesResult.data || [];
  } else if (cycle === "SUPERIEUR" && streamId && moduleId) {
    const modulesResult = await getModulesByStream(streamId);
    modules = modulesResult.data || [];
    currentModule = modules.find((m: any) => m.id === moduleId);
  }

  // Fetch current lesson and chapters if showing chapters view
  let currentLesson = null;
  let chapters: any[] = [];
  if (showChapters && lessonId) {
    try {
      console.log(`🔍 Public page: Fetching lesson and chapters for lessonId: ${lessonId}`);
      const lessonResult = await getLessonById(lessonId);
      if (lessonResult.success) {
        currentLesson = lessonResult.data;
        console.log(`✅ Lesson found: ${currentLesson?.titleFr}`);
      } else {
        console.error(`❌ Lesson not found: ${lessonId}`);
      }
      const chaptersResult = await getChaptersByLesson(lessonId);
      if (chaptersResult.success) {
        chapters = chaptersResult.data || [];
        console.log(`📚 Public page: Found ${chapters.length} chapters`);
      } else {
        console.error(`❌ Error fetching chapters: ${chaptersResult.error}`);
      }
    } catch (error) {
      console.error("Error fetching lesson/chapters:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <LessonSearchFilters />

      <div className="container pb-20">
        {/* Navigation Views (Browse Flow) */}
        {!showList && (
          <>
            {/* 1. Root: Select Cycle */}
            {!cycle && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100"><T k="pages.lessons.title" fallback="Bibliothèque de Leçons" /></h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                  <T k="pages.lessons.subtitle" fallback="Sélectionnez votre cycle d'études pour accéder aux cours et exercices." />
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CycleCard
                    title={<T k="cycles.COLLEGE" fallback="Collège" />}
                    description={<T k="cycles.COLLEGE_DESC" fallback="1ère à 3ème année" />}
                    icon={<BookOpen className="w-10 h-10 text-green-500" />}
                    href="/lessons?cycle=COLLEGE"
                    color="bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/70"
                  />
                  <CycleCard
                    title={<T k="cycles.LYCEE" fallback="Lycée" />}
                    description={<T k="cycles.LYCEE_DESC" fallback="Tronc commun et Bac" />}
                    icon={<Calculator className="w-10 h-10 text-orange-500" />}
                    href="/lessons?cycle=LYCEE"
                    color="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-950/70"
                  />
                  <CycleCard
                    title={<T k="cycles.SUPERIEUR" fallback="Supérieur" />}
                    description={<T k="cycles.SUPERIEUR_DESC" fallback="Université et Grandes Écoles" />}
                    icon={<GraduationCap className="w-10 h-10 text-purple-500" />}
                    href="/lessons?cycle=SUPERIEUR"
                    color="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/70"
                  />
                </div>
              </div>
            )}

            {/* 2. Select Level */}
            {cycle && !level && cycle !== "SUPERIEUR" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" }, { label: <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} /> }]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseLevel" fallback="Choisissez votre niveau" /></h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EDUCATION_SYSTEM[cycle].levels.map((lvl) => (
                    <SelectionCard
                      key={lvl.value}
                      label={lvl.label}
                      href={`/lessons?cycle=${cycle}&level=${lvl.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Select Stream */}
            {cycle === "LYCEE" && level && !stream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" },
                  { label: <T k="cycles.LYCEE" fallback="Lycée" />, href: "/lessons?cycle=LYCEE" },
                  { label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label || level }
                ]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseStream" fallback="Choisissez votre filière" /></h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.map((st) => (
                    <SelectionCard
                      key={st.value}
                      label={st.label}
                      href={`/lessons?cycle=${cycle}&level=${level}&stream=${st.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Select Semester */}
            {cycle && level && !semester && cycle !== "SUPERIEUR" && (
              // Ensure stream is selected for Lycee
              !(cycle === "LYCEE" && !stream) && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <Breadcrumbs items={[
                    { label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" },
                    { label: <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} />, href: `/lessons?cycle=${cycle}` },
                    { label: EDUCATION_SYSTEM[cycle].levels.find(l => l.value === level)?.label || level, href: `/lessons?cycle=${cycle}&level=${level}` },
                    ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream, href: `/lessons?cycle=${cycle}&level=${level}&stream=${stream}` }] : [])
                  ]} />
                  <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseSemester" fallback="Choisissez le semestre" /></h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {SEMESTERS.map((sem) => (
                      <SelectionCard
                        key={sem.value}
                        label={sem.label}
                        href={`/lessons?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=${sem.value}`}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 5. Select Stream (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && !streamId && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" }, { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" /> }]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseStream" fallback="Choisissez votre filière" /></h1>

                {dynamicStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicStreams.map((st: any) => (
                      <Link key={st.id} href={`/lessons?cycle=SUPERIEUR&streamId=${st.id}`}>
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold group-hover:text-primary transition-colors">{st.name}</span>
                          <span className="text-sm text-muted-foreground mt-1">{st.semesterCount} <T k="common.semester" fallback="semestres" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1"><T k="common.noStream" fallback="Aucune filière" /></h3>
                    <p className="text-muted-foreground mb-4">Aucune filière n'est disponible pour le moment.</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Select Module (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && !moduleId && currentStream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" },
                  { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" />, href: "/lessons?cycle=SUPERIEUR" },
                  { label: currentStream.name }
                ]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseModule" fallback="Choisissez le module" /></h1>
                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <SelectionCard
                        key={module.id}
                        label={module.name}
                        href={`/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${module.id}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1"><T k="common.noModule" fallback="Aucun module" /></h3>
                    <p className="text-muted-foreground mb-4">Aucun module n'est disponible pour cette filière.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Chapters View (SUPERIEUR only) */}
        {showChapters && currentLesson && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
              <Breadcrumbs items={[
                { label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" },
                { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" />, href: "/lessons?cycle=SUPERIEUR" },
                { label: currentStream?.name || "", href: `/lessons?cycle=SUPERIEUR&streamId=${streamId}` },
                { label: currentModule?.name || "", href: `/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` },
                { label: currentLesson.titleFr }
              ]} />
              <h1 className="text-3xl font-bold mt-2"><T k="pages.common.chaptersOf" fallback="Chapitres de" /> {currentLesson.titleFr}</h1>
              <p className="text-muted-foreground">
                {chapters.length} chapitre{chapters.length > 1 ? 's' : ''}
              </p>
            </div>

            {chapters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapters.map((chapter: any) => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={{
                      id: chapter.id,
                      titleFr: chapter.titleFr,
                      slug: chapter.slug,
                      chapterNumber: chapter.chapterNumber,
                      category: currentLesson.category || 'Mathématiques',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2"><T k="common.noChapter" fallback="Aucun chapitre" /></h3>
                <p className="text-muted-foreground">Aucun chapitre disponible pour cette leçon.</p>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {showList && lessonsData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Breadcrumbs items={[
                    { label: <T k="nav.home" fallback="Accueil" />, href: "/lessons" },
                    { label: cycle ? <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} /> : <T k="common.search" fallback="Recherche" />, href: cycle ? `/lessons?cycle=${cycle}` : undefined },
                    ...(level ? [{ label: EDUCATION_SYSTEM[cycle!].levels.find(l => l.value === level)?.label || level, href: `/lessons?cycle=${cycle}&level=${level}` }] : []),
                    ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : []),
                    ...(currentStream ? [{ label: currentStream.name, href: `/lessons?cycle=SUPERIEUR&streamId=${streamId}` }] : []),
                    ...(moduleId && modules.find(m => m.id === moduleId) ? [{ label: modules.find(m => m.id === moduleId)?.name || "Module" }] : [])
                  ]} />
                  <h1 className="text-3xl font-bold mt-2"><T k="common.availableLessons" fallback="Leçons disponibles" /></h1>
                  <p className="text-muted-foreground">
                    {lessonsData.data?.total || 0} <T k="common.resultsFound" fallback="résultats trouvés" />
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonsData.data?.lessons?.map((lesson) => {
                // For SUPERIEUR lessons, use folder-style card (lessons act like folders, lead to chapters)
                if (cycle === "SUPERIEUR" && lesson.level === EducationalLevel.UNIVERSITY) {
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lesson.id}`}
                      className="block h-full"
                    >
                      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                        <Folder className="w-12 h-12 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-semibold group-hover:text-primary transition-colors">{lesson.titleFr}</span>
                        <span className="text-sm text-muted-foreground mt-2"><T k="common.clickToViewChapters" fallback="Cliquez pour voir les chapitres" /></span>
                      </div>
                    </Link>
                  )
                }
                return <LessonCard key={lesson.id} lesson={lesson} />
              })}
              {(!lessonsData.data?.lessons || lessonsData.data.lessons.length === 0) && (
                <div className="col-span-full text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-lg"><T k="common.noResults" fallback="Aucune leçon trouvée pour ces critères." /></p>
                  <Link href="/lessons">
                    <Button variant="link" className="mt-2">
                      <T k="common.tryOtherFilters" fallback="Essayez d'autres filtres" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {Math.ceil((lessonsData.data?.total || 0) / limit) > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-4">
                <Link
                  href={createPaginationLink(currentPage - 1, resolvedParams)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage <= 1}><T k="common.previous" fallback="Précédent" /></Button>
                </Link>
                <span className="text-sm font-medium">
                  Page {currentPage} sur {Math.ceil((lessonsData.data?.total || 0) / limit)}
                </span>
                <Link
                  href={createPaginationLink(currentPage + 1, resolvedParams)}
                  className={currentPage >= Math.ceil((lessonsData.data?.total || 0) / limit) ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage >= Math.ceil((lessonsData.data?.total || 0) / limit)}><T k="common.next" fallback="Suivant" /></Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Components ---

function CycleCard({ title, description, icon, href, color }: { title: React.ReactNode, description: React.ReactNode, icon: React.ReactNode, href: string, color: string }) {
  return (
    <Link href={href} className="group">
      <div className={`h-full p-6 rounded-xl border dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}>
        <div className="mb-4 bg-white dark:bg-gray-800 p-3 rounded-full w-fit shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </div>
    </Link>
  );
}

function SelectionCard({ label, href }: { label: React.ReactNode, href: string }) {
  return (
    <Link href={href}>
      <div className="p-6 h-full flex items-center justify-center text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-xl transition-all hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 group">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{label}</span>
      </div>
    </Link>
  );
}

function Breadcrumbs({ items }: { items: { label: React.ReactNode, href?: string }[] }) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function createPaginationLink(page: number, params: any) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') {
      searchParams.set(key, value as string);
    }
  });
  searchParams.set('page', page.toString());
  return `/lessons?${searchParams.toString()}`;
}
