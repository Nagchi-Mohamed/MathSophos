
import { getPaginatedSeries, SeriesFilters } from "@/actions/series";
import { SeriesCard } from "@/components/ui/series-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EducationalLevel, Stream } from "@/lib/enums";
import { EDUCATION_SYSTEM, Cycle, SEMESTERS } from "@/lib/education-system";
import { BookOpen, GraduationCap, School, Calculator, Folder, ArrowRight } from "lucide-react";
import { ExerciseSearchFilters } from "@/components/exercises/exercise-search-filters";
import { getStreamsByLevel, getStreamById } from "@/actions/streams";
import { getModulesByStream } from "@/actions/modules";
import { getPaginatedLessons, LessonFilters } from "@/actions/content";
import { T } from "@/components/ui/t";

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

export default async function ExercisesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { cycle, level, stream, semester, category, page, search, streamId, moduleId, lessonId } = resolvedParams;

  const currentPage = Number(page) || 1;
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  // Determine if we should show the list or the navigation
  let seriesData = null;
  let showList = false;

  if (search) {
    showList = true;
  } else if (cycle === "COLLEGE" && level && semester) {
    showList = true;
  } else if (cycle === "LYCEE" && level && stream && semester) {
    showList = true;
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    showList = true;
  }

  if (showList) {
    const filters: SeriesFilters = {
      cycle: cycle,
      level: level,
      stream: stream,
      semester: semester,
      educationalStreamId: streamId,
    };
    // SUPERIEUR uses lessonId instead of semester
    if (cycle === "SUPERIEUR") {
      filters.level = EducationalLevel.UNIVERSITY;
      filters.educationalStreamId = streamId;
      filters.lessonId = lessonId;
      // Clear stream and semester for SUPERIEUR (not used)
      delete filters.stream;
      delete filters.semester;
    }
    seriesData = await getPaginatedSeries(filters, limit, offset);
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

  // Fetch lessons for SUPERIEUR if moduleId is selected
  let lessons: any[] = [];
  let currentLesson = null;
  if (cycle === "SUPERIEUR" && streamId && moduleId && !lessonId) {
    const lessonFilters: LessonFilters = {
      level: EducationalLevel.UNIVERSITY,
      educationalStreamId: streamId,
      moduleId: moduleId,
    };
    const lessonsResult = await getPaginatedLessons(100, 0, lessonFilters);
    lessons = lessonsResult.data?.lessons || [];
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    const lessonFilters: LessonFilters = {
      level: EducationalLevel.UNIVERSITY,
      educationalStreamId: streamId,
      moduleId: moduleId,
    };
    const lessonsResult = await getPaginatedLessons(100, 0, lessonFilters);
    lessons = lessonsResult.data?.lessons || [];
    currentLesson = lessons.find((l: any) => l.id === lessonId);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ExerciseSearchFilters />

      <div className="container pb-20">
        {/* Navigation Views (Browse Flow) */}
        {!showList && (
          <>
            {/* 1. Root: Select Cycle */}
            {!cycle && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100"><T k="pages.exercises.title" fallback="Bibliothèque d'Exercices" /></h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                  <T k="pages.exercises.subtitle" fallback="Sélectionnez votre cycle d'études pour accéder aux exercices et problèmes." />
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CycleCard
                    title={<T k="cycles.COLLEGE" fallback="Collège" />}
                    description={<T k="cycles.COLLEGE_DESC" fallback="1ère à 3ème année" />}
                    icon={<BookOpen className="w-10 h-10 text-green-500" />}
                    href="/exercises?cycle=COLLEGE"
                    color="bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/70"
                  />
                  <CycleCard
                    title={<T k="cycles.LYCEE" fallback="Lycée" />}
                    description={<T k="cycles.LYCEE_DESC" fallback="Tronc commun et Bac" />}
                    icon={<Calculator className="w-10 h-10 text-orange-500" />}
                    href="/exercises?cycle=LYCEE"
                    color="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-950/70"
                  />
                  <CycleCard
                    title={<T k="cycles.SUPERIEUR" fallback="Supérieur" />}
                    description={<T k="cycles.SUPERIEUR_DESC" fallback="Université et Grandes Écoles" />}
                    icon={<GraduationCap className="w-10 h-10 text-purple-500" />}
                    href="/exercises?cycle=SUPERIEUR"
                    color="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/70"
                  />
                </div>
              </div>
            )}

            {/* 2. Select Level */}
            {cycle && !level && cycle !== "SUPERIEUR" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" }, { label: <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} /> }]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseLevel" fallback="Choisissez votre niveau" /></h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EDUCATION_SYSTEM[cycle].levels.map((lvl) => (
                    <SelectionCard
                      key={lvl.value}
                      label={lvl.label}
                      href={`/exercises?cycle=${cycle}&level=${lvl.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Select Stream */}
            {cycle === "LYCEE" && level && !stream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" },
                  { label: <T k="cycles.LYCEE" fallback="Lycée" />, href: "/exercises?cycle=LYCEE" },
                  { label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label || level }
                ]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseStream" fallback="Choisissez votre filière" /></h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.map((st) => (
                    <SelectionCard
                      key={st.value}
                      label={st.label}
                      href={`/exercises?cycle=${cycle}&level=${level}&stream=${st.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Select Semester */}
            {cycle && level && !semester && cycle !== "SUPERIEUR" && (
              !(cycle === "LYCEE" && !stream) && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <Breadcrumbs items={[
                    { label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" },
                    { label: <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} />, href: `/exercises?cycle=${cycle}` },
                    { label: EDUCATION_SYSTEM[cycle].levels.find(l => l.value === level)?.label || level, href: `/exercises?cycle=${cycle}&level=${level}` },
                    ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream, href: `/exercises?cycle=${cycle}&level=${level}&stream=${stream}` }] : [])
                  ]} />
                  <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseSemester" fallback="Choisissez le semestre" /></h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {SEMESTERS.map((sem) => (
                      <SelectionCard
                        key={sem.value}
                        label={sem.label}
                        href={`/exercises?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=${sem.value}`}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 5. Select Stream (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && !streamId && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" }, { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" /> }]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseStream" fallback="Choisissez votre filière" /></h1>
                {dynamicStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicStreams.map((st: any) => (
                      <Link key={st.id} href={`/exercises?cycle=SUPERIEUR&streamId=${st.id}`}>
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold group-hover:text-primary transition-colors">{st.name}</span>
                          <span className="text-sm text-muted-foreground mt-1">{st._count?.modules || 0} <T k="common.modules" fallback="modules" /></span>
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
                  { label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" },
                  { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" />, href: "/exercises?cycle=SUPERIEUR" },
                  { label: currentStream.name }
                ]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseModule" fallback="Choisissez le module" /></h1>
                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <SelectionCard
                        key={module.id}
                        label={module.name}
                        href={`/exercises?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${module.id}`}
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

            {/* 7. Select Lesson (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && moduleId && !lessonId && currentModule && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" },
                  { label: <T k="cycles.SUPERIEUR" fallback="Supérieur" />, href: "/exercises?cycle=SUPERIEUR" },
                  { label: currentStream?.name || "", href: `/exercises?cycle=SUPERIEUR&streamId=${streamId}` },
                  { label: currentModule.name }
                ]} />
                <h1 className="text-3xl font-bold mb-8"><T k="pages.common.chooseLesson" fallback="Choisissez la leçon" /></h1>
                {lessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson: any) => (
                      <Link
                        key={lesson.id}
                        href={`/exercises?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lesson.id}`}
                        className="block h-full"
                      >
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold group-hover:text-primary transition-colors">{lesson.titleFr}</span>
                          <span className="text-sm text-muted-foreground mt-1"><T k="common.clickToViewExercises" fallback="Cliquez pour voir les exercices" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1"><T k="common.noLesson" fallback="Aucune leçon" /></h3>
                    <p className="text-muted-foreground mb-4">Aucune leçon n'est disponible pour ce module.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* List View */}
        {showList && seriesData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Breadcrumbs items={[
                    { label: <T k="nav.home" fallback="Accueil" />, href: "/exercises" },
                    { label: cycle ? <T k={`cycles.${cycle}`} fallback={EDUCATION_SYSTEM[cycle].label} /> : <T k="common.search" fallback="Recherche" />, href: cycle ? `/exercises?cycle=${cycle}` : undefined },
                    ...(level ? [{ label: EDUCATION_SYSTEM[cycle!].levels.find(l => l.value === level)?.label || level, href: `/exercises?cycle=${cycle}&level=${level}` }] : []),
                    ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : []),
                    ...(currentStream ? [{ label: currentStream.name, href: `/exercises?cycle=SUPERIEUR&streamId=${streamId}` }] : []),
                    ...(currentModule ? [{ label: currentModule.name, href: `/exercises?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` }] : []),
                    ...(currentLesson ? [{ label: currentLesson.titleFr }] : []),
                    ...(semester && cycle !== "SUPERIEUR" ? [{ label: <><T k="common.semester" fallback="Semestre" /> {semester}</> }] : [])
                  ]} />
                  <h1 className="text-3xl font-bold mt-2"><T k="common.availableSeries" fallback="Séries d'exercices" /></h1>
                  <p className="text-muted-foreground">
                    {seriesData.data?.total || 0} <T k="common.resultsFound" fallback="séries trouvées" />
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesData.data?.series?.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
              {(!seriesData.data?.series || seriesData.data.series.length === 0) && (
                <div className="col-span-full text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-lg"><T k="common.noResults" fallback="Aucune série trouvée pour ces critères." /></p>
                  <Link href="/exercises">
                    <Button variant="link" className="mt-2">
                      <T k="common.tryOtherFilters" fallback="Essayez d'autres filtres" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {Math.ceil((seriesData.data?.total || 0) / limit) > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-4">
                <Link
                  href={createPaginationLink(currentPage - 1, resolvedParams)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage <= 1}><T k="common.previous" fallback="Précédent" /></Button>
                </Link>
                <span className="text-sm font-medium">
                  Page {currentPage} sur {Math.ceil((seriesData.data?.total || 0) / limit)}
                </span>
                <Link
                  href={createPaginationLink(currentPage + 1, resolvedParams)}
                  className={currentPage >= Math.ceil((seriesData.data?.total || 0) / limit) ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage >= Math.ceil((seriesData.data?.total || 0) / limit)}><T k="common.next" fallback="Suivant" /></Button>
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

function CycleCard({
  title,
  description,
  icon,
  href,
  color,
  badgeText,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  color: string;
  badgeText?: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full p-7 rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-xl shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 hover:border-primary/50 overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-primary shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              {icon}
            </div>
            {badgeText && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {badgeText}
              </span>
            )}
          </div>

          <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {description}
          </p>
        </div>

        <div className="flex items-center text-sm font-semibold text-primary pt-4 border-t border-border/40 group-hover:border-primary/30 transition-colors">
          <span>Explorer les exercices</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
        </div>
      </div>
    </Link>
  );
}

function SelectionCard({ label, href }: { label: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group block h-full">
      <div className="p-6 h-full flex items-center justify-between bg-card/80 hover:bg-card border border-border/60 hover:border-primary/50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {label}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
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
  return `/exercises?${searchParams.toString()}`;
}
