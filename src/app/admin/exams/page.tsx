import { Suspense } from "react"
import { getPaginatedExams, ExamFilters } from "@/actions/exams"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, School, BookOpen, Calculator, GraduationCap, Folder } from "lucide-react"
import { EducationalLevel, Stream } from "@prisma/client"
import { EDUCATION_SYSTEM, Cycle, SEMESTERS } from "@/lib/education-system"
import { getStreamsByLevel, getStreamById } from "@/actions/streams"
import { getModulesByStream } from "@/actions/modules"
import { getPaginatedLessons, LessonFilters } from "@/actions/content"
import { ExamsPagination } from "@/components/admin/exams-pagination"
import { ExamCard } from "@/components/ui/exam-card"

interface AdminExamsPageProps {
  searchParams: Promise<{
    page?: string
    cycle?: Cycle
    level?: EducationalLevel
    stream?: Stream
    streamId?: string
    moduleId?: string
    lessonId?: string
    semester?: string
    type?: string
    search?: string
    sortBy?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function AdminExamsPage({ searchParams }: AdminExamsPageProps) {
  const resolvedParams = await searchParams
  const { cycle, level, stream, semester, type, search, sortBy, page, streamId, moduleId, lessonId } = resolvedParams

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
      examType: undefined,
      search: search,
      sortBy: sortBy as any,
      educationalStreamId: streamId
    }
    if (cycle === "SUPERIEUR") {
      filters.level = EducationalLevel.UNIVERSITY
    }
    const result = await getPaginatedExams(filters, limit, offset)
    if (result.success && result.data) {
      examsData = result.data
    }
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

  const exams = examsData?.exams || []
  const total = examsData?.total || 0
  const totalPages = examsData?.totalPages || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold">Examens & Contrôles</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez les examens et contrôles continus de la plateforme
            </p>
          </div>

        </div>

        {/* Navigation Views */}
        {!showList && (
          <>
            {/* 1. Root: Select Cycle */}
            {!cycle && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-semibold text-center mb-8">Sélectionnez un cycle</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CycleCard
                    title="Collège"
                    description="1ère à 3ème année"
                    icon={<BookOpen className="w-10 h-10 text-green-500" />}
                    href="/admin/exams?cycle=COLLEGE"
                    color="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                  />
                  <CycleCard
                    title="Lycée"
                    description="Tronc commun et Bac"
                    icon={<Calculator className="w-10 h-10 text-orange-500" />}
                    href="/admin/exams?cycle=LYCEE"
                    color="bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40"
                  />
                  <CycleCard
                    title="Supérieur"
                    description="Université et Grandes Écoles"
                    icon={<GraduationCap className="w-10 h-10 text-purple-500" />}
                    href="/admin/exams?cycle=SUPERIEUR"
                    color="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40"
                  />
                </div>
              </div>
            )}

            {/* 2. Select Level (Standard) */}
            {cycle && !level && cycle !== "SUPERIEUR" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/exams" },
                  { label: EDUCATION_SYSTEM[cycle].label }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez le niveau</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EDUCATION_SYSTEM[cycle].levels.map((lvl) => (
                    <SelectionCard
                      key={lvl.value}
                      label={lvl.label}
                      href={`/admin/exams?cycle=${cycle}&level=${lvl.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Select Stream (Lycée only) */}
            {cycle === "LYCEE" && level && !stream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/exams" },
                  { label: "Lycée", href: "/admin/exams?cycle=LYCEE" },
                  { label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label || level }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez la filière</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.map((st) => (
                    <SelectionCard
                      key={st.value}
                      label={st.label}
                      href={`/admin/exams?cycle=${cycle}&level=${level}&stream=${st.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Select Semester (Standard) */}
            {cycle && level && !semester && cycle !== "SUPERIEUR" && !(cycle === "LYCEE" && !stream) && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/exams" },
                  { label: EDUCATION_SYSTEM[cycle].label, href: `/admin/exams?cycle=${cycle}` },
                  { label: EDUCATION_SYSTEM[cycle].levels.find(l => l.value === level)?.label || level, href: `/admin/exams?cycle=${cycle}&level=${level}` },
                  ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : [])
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez le semestre</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <SelectionCard
                    label="Semestre 1"
                    href={`/admin/exams?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=1`}
                  />
                  <SelectionCard
                    label="Semestre 2"
                    href={`/admin/exams?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=2`}
                  />
                </div>
              </div>
            )}

            {/* 5. Select Stream (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && !streamId && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/exams" },
                  { label: "Supérieur" }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Filières</h2>

                {dynamicStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicStreams.map((st: any) => (
                      <Link key={st.id} href={`/admin/exams?cycle=SUPERIEUR&streamId=${st.id}`} className="block h-full">
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold group-hover:text-primary transition-colors">{st.name}</span>
                          <span className="text-sm text-muted-foreground mt-1">{st.semesterCount} semestres</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucune filière</h3>
                    <p className="text-muted-foreground mb-4">Aucune filière disponible pour le niveau Supérieur.</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Select Module (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && !moduleId && currentStream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/exams" },
                  { label: "Supérieur", href: "/admin/exams?cycle=SUPERIEUR" },
                  { label: currentStream.name }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez le module</h2>
                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <SelectionCard
                        key={module.id}
                        label={module.name}
                        href={`/admin/exams?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${module.id}`}
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
                  { label: "Cycles", href: "/admin/exams" },
                  { label: "Supérieur", href: "/admin/exams?cycle=SUPERIEUR" },
                  { label: currentStream?.name || "", href: `/admin/exams?cycle=SUPERIEUR&streamId=${streamId}` },
                  { label: currentModule.name }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez la leçon</h2>
                {lessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson: any) => (
                      <Link
                        key={lesson.id}
                        href={`/admin/exams?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lesson.id}`}
                        className="block h-full"
                      >
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                          <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-semibold group-hover:text-primary transition-colors">{lesson.titleFr}</span>
                          <span className="text-sm text-muted-foreground mt-1">Cliquez pour générer un examen</span>
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
        {showList && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-6">
              <Breadcrumbs items={[
                { label: "Cycles", href: "/admin/exams" },
                { label: cycle ? EDUCATION_SYSTEM[cycle].label : "", href: `/admin/exams?cycle=${cycle}` },
                ...(level ? [{ label: EDUCATION_SYSTEM[cycle!].levels.find(l => l.value === level)?.label || level, href: `/admin/exams?cycle=${cycle}&level=${level}` }] : []),
                ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : []),
                ...(currentStream ? [{ label: currentStream.name, href: `/admin/exams?cycle=SUPERIEUR&streamId=${streamId}` }] : []),
                ...(currentModule ? [{ label: currentModule.name, href: `/admin/exams?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` }] : []),
                ...(currentLesson ? [{ label: currentLesson.titleFr }] : []),
                ...(semester && cycle !== "SUPERIEUR" ? [{ label: `Semestre ${semester}` }] : [])
              ]} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Examens et Contrôles disponibles</h2>
                <p className="text-muted-foreground">{total} document{total > 1 ? 's' : ''}</p>
              </div>
              <Link href={`/admin/exams/create?cycle=${cycle || ''}&level=${level || ''}&stream=${stream || ''}&semester=${semester || ''}&streamId=${streamId || ''}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </Link>
            </div>

            {exams.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map((exam: any) => (
                    <ExamCard key={exam.id} exam={exam} showAdminActions={true} />
                  ))}
                </div>

                <ExamsPagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun examen trouvé</h3>
                <p className="text-muted-foreground mb-6">Créez votre premier examen ou contrôle pour ce niveau</p>
                <Link href={`/admin/exams/create?cycle=${cycle || ''}&level=${level || ''}&stream=${stream || ''}&semester=${semester || ''}&streamId=${streamId || ''}&moduleId=${moduleId || ''}&lessonId=${lessonId || ''}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un examen
                  </Button>
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

function CycleCard({ title, description, icon, href, color }: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}) {
  return (
    <Link href={href} className="group">
      <div className={`h-full p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}>
        <div className="mb-4 bg-white dark:bg-background p-3 rounded-full w-fit shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </Link>
  )
}

function SelectionCard({ label, href }: { label: string, href: string }) {
  return (
    <Link href={href}>
      <div className="p-6 h-full flex items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
        <span className="text-lg font-semibold group-hover:text-primary transition-colors">{label}</span>
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
