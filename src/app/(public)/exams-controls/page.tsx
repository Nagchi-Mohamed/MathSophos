import { getPaginatedExams, ExamFilters } from "@/actions/exams"
import { ExamCard } from "@/components/ui/exam-card"
import { ExamSearchFilters } from "@/components/exams-controls/exam-search-filters"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { EducationalLevel, Stream, Exam } from "@prisma/client"
import { EDUCATION_SYSTEM, Cycle, SEMESTERS } from "@/lib/education-system"
import { BookOpen, GraduationCap, School, Calculator, FileText, Folder } from "lucide-react"
import { getStreamsByLevel, getStreamById } from "@/actions/streams"
import { getModulesByStream } from "@/actions/modules"
import { getPaginatedLessons, LessonFilters } from "@/actions/content"

export const revalidate = 60

interface PageProps {
  searchParams: Promise<{
    cycle?: Cycle
    level?: EducationalLevel
    stream?: Stream
    streamId?: string
    moduleId?: string
    lessonId?: string
    semester?: string
    type?: string
    examType?: string
    search?: string
    sortBy?: 'newest' | 'oldest' | 'title'
    page?: string
  }>
}

export default async function ExamsControlsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const { cycle, level, stream, semester, type, examType, search, sortBy, page, streamId, moduleId, lessonId } = resolvedParams

  const currentPage = Number(page) || 1
  const limit = 12
  const offset = (currentPage - 1) * limit

  // Determine if we should show the list or the navigation
  let examsData = null
  let showList = false

  // Show list if search is active or if we have complete filter criteria
  if (search) {
    showList = true
  } else if (cycle === "COLLEGE" && level && semester) {
    showList = true
  } else if (cycle === "LYCEE" && level && stream && semester) {
    showList = true
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    showList = true
  }

  if (showList) {
    const filters: ExamFilters = {
      cycle: cycle,
      level: level,
      stream: stream,
      semester: semester ? Number(semester) : undefined,
      type: type,
      examType: examType,
      search: search,
      sortBy: sortBy,
      educationalStreamId: streamId
    }
    if (cycle === "SUPERIEUR") {
      filters.level = EducationalLevel.UNIVERSITY
    }
    examsData = await getPaginatedExams(filters, limit, offset)
  }

  // Fetch dynamic streams if needed
  let dynamicStreams: any[] = []
  if (cycle === "SUPERIEUR" && !streamId) {
    const result = await getStreamsByLevel(EducationalLevel.UNIVERSITY)
    dynamicStreams = result.data || []
  }

  // Fetch current stream details if needed
  let currentStream = null
  if (cycle === "SUPERIEUR" && streamId) {
    const result = await getStreamById(streamId)
    currentStream = result.data
  }

  // Fetch modules for SUPERIEUR if streamId is selected
  let modules: any[] = []
  let currentModule = null
  if (cycle === "SUPERIEUR" && streamId && !moduleId && !lessonId) {
    const modulesResult = await getModulesByStream(streamId)
    modules = modulesResult.data || []
  } else if (cycle === "SUPERIEUR" && streamId && moduleId) {
    const modulesResult = await getModulesByStream(streamId)
    modules = modulesResult.data || []
    currentModule = modules.find((m: any) => m.id === moduleId)
  }

  // Fetch lessons for SUPERIEUR if moduleId is selected
  let lessons: any[] = []
  let currentLesson = null
  if (cycle === "SUPERIEUR" && streamId && moduleId && !lessonId) {
    const lessonFilters: LessonFilters = {
      level: EducationalLevel.UNIVERSITY,
      educationalStreamId: streamId,
      moduleId: moduleId,
    }
    const lessonsResult = await getPaginatedLessons(100, 0, lessonFilters)
    lessons = lessonsResult.data?.lessons || []
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    const lessonFilters: LessonFilters = {
      level: EducationalLevel.UNIVERSITY,
      educationalStreamId: streamId,
      moduleId: moduleId,
    }
    const lessonsResult = await getPaginatedLessons(100, 0, lessonFilters)
    lessons = lessonsResult.data?.lessons || []
    currentLesson = lessons.find((l: any) => l.id === lessonId)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Search Filters - Show when list is displayed */}
      {showList && <ExamSearchFilters />}

      <div className="container pb-20">
        {/* Navigation Views (Browse Flow) */}
        {!showList && (
          <>
            {/* 1. Root: Select Cycle */}
            {!cycle && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">Examens et Contrôles</h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                  Accédez aux examens nationaux, régionaux et contrôles continus.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CycleCard
                    title="Collège"
                    description="1ère à 3ème année"
                    icon={<BookOpen className="w-10 h-10 text-green-500" />}
                    href="/exams-controls?cycle=COLLEGE"
                    color="bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/70"
                  />
                  <CycleCard
                    title="Lycée"
                    description="Tronc commun et Bac"
                    icon={<Calculator className="w-10 h-10 text-orange-500" />}
                    href="/exams-controls?cycle=LYCEE"
                    color="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-950/70"
                  />
                  <CycleCard
                    title="Supérieur"
                    description="Université et Grandes Écoles"
                    icon={<GraduationCap className="w-10 h-10 text-purple-500" />}
                    href="/exams-controls?cycle=SUPERIEUR"
                    color="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/70"
                  />
                </div>
              </div>
            )}

            {/* 2. Select Level - Hide for SUPERIEUR */}
            {cycle && !level && (cycle === "COLLEGE" || cycle === "LYCEE") && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: "Accueil", href: "/exams-controls" }, { label: EDUCATION_SYSTEM[cycle].label }]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez votre niveau</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EDUCATION_SYSTEM[cycle].levels.map((lvl) => (
                    <SelectionCard
                      key={lvl.value}
                      label={lvl.label}
                      href={`/exams-controls?cycle=${cycle}&level=${lvl.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Select Stream */}
            {cycle === "LYCEE" && level && !stream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Accueil", href: "/exams-controls" },
                  { label: "Lycée", href: "/exams-controls?cycle=LYCEE" },
                  { label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label || level }
                ]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez votre filière</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.map((st) => (
                    <SelectionCard
                      key={st.value}
                      label={st.label}
                      href={`/exams-controls?cycle=${cycle}&level=${level}&stream=${st.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Select Semester */}
            {cycle && level && !semester && !(cycle === "LYCEE" && !stream) && cycle !== "SUPERIEUR" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Accueil", href: "/exams-controls" },
                  { label: EDUCATION_SYSTEM[cycle].label, href: `/exams-controls?cycle=${cycle}` },
                  { label: EDUCATION_SYSTEM[cycle].levels.find(l => l.value === level)?.label || level, href: `/exams-controls?cycle=${cycle}&level=${level}` },
                  ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream, href: `/exams-controls?cycle=${cycle}&level=${level}&stream=${stream}` }] : [])
                ]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez le semestre</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {SEMESTERS.map((sem) => (
                    <SelectionCard
                      key={sem.value}
                      label={sem.label}
                      href={`/exams-controls?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=${sem.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 5. Select Stream (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && !streamId && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[{ label: "Accueil", href: "/exams-controls" }, { label: "Supérieur" }]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez votre filière</h1>
                {dynamicStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicStreams.map((st: any) => (
                      <Link key={st.id} href={`/exams-controls?cycle=SUPERIEUR&streamId=${st.id}`}>
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-xl transition-all hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{st.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">{st._count?.modules || 0} modules</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucune filière</h3>
                    <p className="text-muted-foreground mb-4">Aucune filière n'est disponible pour le moment.</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Select Module (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && !moduleId && currentStream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Accueil", href: "/exams-controls" },
                  { label: "Supérieur", href: "/exams-controls?cycle=SUPERIEUR" },
                  { label: currentStream.name }
                ]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez le module</h1>
                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <SelectionCard
                        key={module.id}
                        label={module.name}
                        href={`/exams-controls?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${module.id}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucun module</h3>
                    <p className="text-muted-foreground mb-4">Aucun module n'est disponible pour cette filière.</p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Select Lesson (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && moduleId && !lessonId && currentModule && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Accueil", href: "/exams-controls" },
                  { label: "Supérieur", href: "/exams-controls?cycle=SUPERIEUR" },
                  { label: currentStream?.name || "", href: `/exams-controls?cycle=SUPERIEUR&streamId=${streamId}` },
                  { label: currentModule.name }
                ]} />
                <h1 className="text-3xl font-bold mb-8">Choisissez la leçon</h1>
                {lessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson: any) => (
                      <Link
                        key={lesson.id}
                        href={`/exams-controls?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lesson.id}`}
                        className="block h-full"
                      >
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-xl transition-all hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{lesson.titleFr}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cliquez pour voir les examens</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucune leçon</h3>
                    <p className="text-muted-foreground mb-4">Aucune leçon n'est disponible pour ce module.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* List View */}
        {showList && examsData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Breadcrumbs items={[
                    { label: "Accueil", href: "/exams-controls" },
                    { label: cycle ? EDUCATION_SYSTEM[cycle].label : "Recherche", href: cycle ? `/exams-controls?cycle=${cycle}` : undefined },
                    ...(level ? [{ label: EDUCATION_SYSTEM[cycle!].levels.find(l => l.value === level)?.label || level, href: `/exams-controls?cycle=${cycle}&level=${level}` }] : []),
                    ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : []),
                    ...(currentStream ? [{ label: currentStream.name, href: `/exams-controls?cycle=SUPERIEUR&streamId=${streamId}` }] : []),
                    ...(currentModule ? [{ label: currentModule.name, href: `/exams-controls?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` }] : []),
                    ...(currentLesson ? [{ label: currentLesson.titleFr }] : []),
                    ...(semester && cycle !== "SUPERIEUR" ? [{ label: `Semestre ${semester}` }] : [])
                  ]} />
                  <h1 className="text-3xl font-bold mt-2">Examens et Contrôles</h1>
                  <p className="text-muted-foreground">
                    {examsData.data?.total || 0} document(s) trouvé(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examsData.data?.exams?.map((exam: any) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
              {(!examsData.data?.exams || examsData.data.exams.length === 0) && (
                <div className="col-span-full text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">Aucun examen trouvé pour ces critères.</p>
                  <Link href="/exams-controls">
                    <Button variant="link" className="mt-2">
                      Retour à l'accueil
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {Math.ceil((examsData.data?.total || 0) / limit) > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-4">
                <Link
                  href={createPaginationLink(currentPage - 1, resolvedParams)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage <= 1}>Précédent</Button>
                </Link>
                <span className="text-sm font-medium">
                  Page {currentPage} sur {Math.ceil((examsData.data?.total || 0) / limit)}
                </span>
                <Link
                  href={createPaginationLink(currentPage + 1, resolvedParams)}
                  className={currentPage >= Math.ceil((examsData.data?.total || 0) / limit) ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" disabled={currentPage >= Math.ceil((examsData.data?.total || 0) / limit)}>Suivant</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Components ---

function CycleCard({ title, description, icon, href, color }: { title: string, description: string, icon: React.ReactNode, href: string, color: string }) {
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
  )
}

function SelectionCard({ label, href }: { label: string, href: string }) {
  return (
    <Link href={href}>
      <div className="p-6 h-full flex items-center justify-center text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-xl transition-all hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 group">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{label}</span>
      </div>
    </Link>
  )
}

function Breadcrumbs({ items }: { items: { label: string, href?: string }[] }) {
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
  )
}

function createPaginationLink(page: number, params: any) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') {
      searchParams.set(key, value as string)
    }
  })
  searchParams.set('page', page.toString())
  return `/exams-controls?${searchParams.toString()}`
}
