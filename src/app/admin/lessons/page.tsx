import Link from "next/link"
import { Plus, BookOpen, School, Calculator, GraduationCap, Folder, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPaginatedLessons, LessonFilters, getLessonById } from "@/actions/content"
import { AdminLessonCard } from "@/components/admin/admin-lesson-card"
import { EducationalLevel, Stream } from "@/lib/enums"
import { EDUCATION_SYSTEM, Cycle } from "@/lib/education-system"
import { getStreamsByLevel, getStreamById } from "@/actions/streams"
import { AddStreamDialog } from "@/components/admin/add-stream-dialog"
import { DeleteStreamButton } from "@/components/admin/delete-stream-button"
import { RenameStreamButton } from "@/components/admin/rename-stream-button"
import { getModulesByStream } from "@/actions/modules"
import { AddModuleDialog } from "@/components/admin/add-module-dialog"
import { RenameModuleButton } from "@/components/admin/rename-module-button"
import { DeleteModuleButton } from "@/components/admin/delete-module-button"
import { RenameLessonButton } from "@/components/admin/rename-lesson-button"
import { DeleteLessonButton } from "@/components/admin/delete-lesson-button"
import { AddLessonDialog } from "@/components/admin/add-lesson-dialog"
import { getChaptersByLesson } from "@/actions/chapters"
import { AdminChapterCard } from "@/components/admin/admin-chapter-card"
import { ChapterManagerWrapper } from "@/components/admin/chapter-manager-wrapper"
import { ImportLessonsDialog } from "@/components/admin/import-lessons-dialog"

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    cycle?: Cycle
    level?: EducationalLevel
    stream?: Stream
    semester?: string
    streamId?: string
    moduleId?: string
    lessonId?: string
  }>
}

export default async function AdminLessonsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const { cycle, level, stream, semester, streamId, moduleId, lessonId } = resolvedParams

  // Determine if we should show the list
  let showList = false
  let showChapters = false
  if (cycle === "COLLEGE" && level && semester) {
    showList = true
  } else if (cycle === "LYCEE" && level && stream && semester) {
    showList = true
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && !lessonId) {
    showList = true
  } else if (cycle === "SUPERIEUR" && streamId && moduleId && lessonId) {
    showChapters = true
  }

  let lessonsData = null
  if (showList) {
    const filters: LessonFilters = {
      level: level,
      stream: stream,
      semester: semester ? Number(semester) : undefined,
    }
    // SUPERIEUR uses educationalStreamId and moduleId instead of level/stream/semester
    if (cycle === "SUPERIEUR") {
      filters.level = EducationalLevel.UNIVERSITY
      filters.educationalStreamId = streamId
      filters.moduleId = moduleId
      // Clear stream and semester for SUPERIEUR (not used)
      delete filters.stream
      delete filters.semester
    }
    lessonsData = await getPaginatedLessons(100, 0, filters)
  }

  const lessons = lessonsData?.data?.lessons || []

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

  // Fetch modules if needed
  let modules: any[] = []
  let currentModule = null
  if (cycle === "SUPERIEUR" && streamId) {
    try {
      const modulesResult = await getModulesByStream(streamId)
      if (modulesResult.success) {
        modules = modulesResult.data || []
        if (moduleId) {
          currentModule = modules.find((m: any) => m.id === moduleId)
        }
      } else {
        console.error("Error fetching modules:", modulesResult.error)
        // If modules table doesn't exist yet, return empty array
        modules = []
      }
    } catch (error) {
      console.error("Error fetching modules:", error)
      modules = []
    }
  }

  // Fetch current lesson and chapters if needed
  let currentLesson = null
  let chapters: any[] = []
  if (showChapters && lessonId) {
    try {
      console.log(`🔍 Admin page: Fetching lesson and chapters for lessonId: ${lessonId}`);
      const lessonResult = await getLessonById(lessonId)
      if (lessonResult.success) {
        currentLesson = lessonResult.data
        console.log(`✅ Lesson found: ${currentLesson?.titleFr}`);
      } else {
        console.error(`❌ Lesson not found: ${lessonId}`);
      }
      const chaptersResult = await getChaptersByLesson(lessonId)
      if (chaptersResult.success) {
        chapters = chaptersResult.data || []
        console.log(`📚 Admin page: Found ${chapters.length} chapters`);
        // Ensure all chapters have required fields
        chapters = chapters.map((chapter: any) => ({
          ...chapter,
          slug: chapter.slug || '',
          chapterNumber: chapter.chapterNumber || 1,
          order: chapter.order || chapter.chapterNumber || 1,
          status: chapter.status || 'DRAFT',
        }))
        console.log(`📚 Admin page: Processed ${chapters.length} chapters after normalization`);
      } else {
        console.error("❌ Error fetching chapters:", chaptersResult.error)
      }
    } catch (error) {
      console.error("❌ Error fetching lesson/chapters:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold">Gestion des Leçons</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez le contenu éducatif de la plateforme
            </p>
          </div>
          {showList && cycle !== "SUPERIEUR" && (
            <Link href={`/admin/lessons/create?cycle=${cycle || ''}&level=${level || ''}&stream=${stream || ''}&semester=${semester || ''}&streamId=${streamId || ''}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Leçon
              </Button>
            </Link>
          )}
        </div>

        {/* Navigation Views */}
        {!showList && !showChapters && (
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
                    href="/admin/lessons?cycle=COLLEGE"
                    color="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                  />
                  <CycleCard
                    title="Lycée"
                    description="Tronc commun et Bac"
                    icon={<Calculator className="w-10 h-10 text-orange-500" />}
                    href="/admin/lessons?cycle=LYCEE"
                    color="bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40"
                  />
                  <CycleCard
                    title="Supérieur"
                    description="Université et Grandes Écoles"
                    icon={<GraduationCap className="w-10 h-10 text-purple-500" />}
                    href="/admin/lessons?cycle=SUPERIEUR"
                    color="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40"
                  />
                </div>
              </div>
            )}

            {/* 2. Select Level (Standard) */}
            {cycle && !level && cycle !== "SUPERIEUR" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/lessons" },
                  { label: EDUCATION_SYSTEM[cycle].label }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez le niveau</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EDUCATION_SYSTEM[cycle].levels.map((lvl) => (
                    <SelectionCard
                      key={lvl.value}
                      label={lvl.label}
                      href={`/admin/lessons?cycle=${cycle}&level=${lvl.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Select Stream (Lycée only) */}
            {cycle === "LYCEE" && level && !stream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/lessons" },
                  { label: "Lycée", href: "/admin/lessons?cycle=LYCEE" },
                  { label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label || level }
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez la filière</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.map((st) => (
                    <SelectionCard
                      key={st.value}
                      label={st.label}
                      href={`/admin/lessons?cycle=${cycle}&level=${level}&stream=${st.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Select Semester (Standard) */}
            {cycle && level && !semester && cycle !== "SUPERIEUR" && !(cycle === "LYCEE" && !stream) && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/lessons" },
                  { label: EDUCATION_SYSTEM[cycle].label, href: `/admin/lessons?cycle=${cycle}` },
                  { label: EDUCATION_SYSTEM[cycle].levels.find(l => l.value === level)?.label || level, href: `/admin/lessons?cycle=${cycle}&level=${level}` },
                  ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : [])
                ]} />
                <h2 className="text-2xl font-semibold mb-6">Choisissez le semestre</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <SelectionCard
                    label="Semestre 1"
                    href={`/admin/lessons?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=1`}
                  />
                  <SelectionCard
                    label="Semestre 2"
                    href={`/admin/lessons?cycle=${cycle}&level=${level}${stream ? `&stream=${stream}` : ''}&semester=2`}
                  />
                </div>
              </div>
            )}

            {/* 5. Select Stream (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && !streamId && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/lessons" },
                  { label: "Supérieur" }
                ]} />
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Filières</h2>
                  <AddStreamDialog level={EducationalLevel.UNIVERSITY} />
                </div>

                {dynamicStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicStreams.map((st: any) => (
                      <div key={st.id} className="relative group h-full">
                        <Link href={`/admin/lessons?cycle=SUPERIEUR&streamId=${st.id}`} className="block h-full">
                          <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50">
                            <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold group-hover:text-primary transition-colors">{st.name}</span>
                            {st.semesterCount > 0 && (
                              <span className="text-sm text-muted-foreground mt-1">{st.semesterCount} semestres</span>
                            )}
                          </div>
                        </Link>
                        <RenameStreamButton streamId={st.id} streamName={st.name} />
                        <DeleteStreamButton streamId={st.id} streamName={st.name} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucune filière</h3>
                    <p className="text-muted-foreground mb-4">Commencez par ajouter une filière pour le niveau Supérieur.</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Select Module (Supérieur - Dynamic) */}
            {cycle === "SUPERIEUR" && streamId && !moduleId && currentStream && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Breadcrumbs items={[
                  { label: "Cycles", href: "/admin/lessons" },
                  { label: "Supérieur", href: "/admin/lessons?cycle=SUPERIEUR" },
                  { label: currentStream.name }
                ]} />
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Modules</h2>
                  <AddModuleDialog educationalStreamId={streamId} />
                </div>

                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <div key={module.id} className="relative group h-full">
                        <Link href={`/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${module.id}`} className="block h-full">
                          <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50">
                            <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold group-hover:text-primary transition-colors">{module.name}</span>
                            {module.description && (
                              <span className="text-sm text-muted-foreground mt-1">{module.description}</span>
                            )}
                            <span className="text-sm text-muted-foreground mt-1">{module.lessons?.length || 0} leçon{module.lessons?.length !== 1 ? 's' : ''}</span>
                          </div>
                        </Link>
                        <RenameModuleButton moduleId={module.id} moduleName={module.name} />
                        <DeleteModuleButton moduleId={module.id} moduleName={module.name} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">Aucun module</h3>
                    <p className="text-muted-foreground mb-4">Commencez par ajouter un module pour organiser les leçons.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Chapters View (SUPERIEUR only) */}
        {showChapters && currentLesson && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-6">
              <Breadcrumbs items={[
                { label: "Cycles", href: "/admin/lessons" },
                { label: "Supérieur", href: "/admin/lessons?cycle=SUPERIEUR" },
                { label: currentStream?.name || "", href: `/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}` },
                { label: currentModule?.name || "", href: `/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` },
                { label: currentLesson.titleFr }
              ]} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Chapitres de {currentLesson.titleFr}</h2>
                <p className="text-muted-foreground">{chapters.length} chapitre{chapters.length > 1 ? 's' : ''}</p>
              </div>
              <ChapterManagerWrapper
                lessonId={currentLesson.id}
                lessonTitle={currentLesson.titleFr}
                showOnlyButton={true}
              />
            </div>

            {chapters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapters.map((chapter: any) => (
                  <AdminChapterCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun chapitre</h3>
                <p className="text-muted-foreground mb-6">Créez votre premier chapitre pour cette leçon</p>
                <Link href={`/admin/lessons/${currentLesson.id}/edit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un chapitre
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {showList && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-6">
              <Breadcrumbs items={[
                { label: "Cycles", href: "/admin/lessons" },
                { label: cycle ? EDUCATION_SYSTEM[cycle].label : "", href: `/admin/lessons?cycle=${cycle}` },
                ...(level ? [{ label: EDUCATION_SYSTEM[cycle!].levels.find(l => l.value === level)?.label || level, href: `/admin/lessons?cycle=${cycle}&level=${level}` }] : []),
                ...(stream ? [{ label: EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || stream }] : []),
                ...(currentStream ? [{ label: currentStream.name, href: `/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}` }] : []),
                ...(currentModule ? [{ label: currentModule.name, href: `/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}` }] : [])
              ]} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Leçons disponibles</h2>
                <p className="text-muted-foreground">{lessons.length} leçon{lessons.length > 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {cycle === "SUPERIEUR" && currentModule && (
                  <AddLessonDialog
                    moduleId={currentModule.id}
                    moduleName={currentModule.name}
                    educationalStreamId={streamId || ""}
                  />
                )}
                {cycle === "SUPERIEUR" && streamId && !moduleId && currentStream && (
                  <ImportLessonsDialog
                    targetStreamId={streamId}
                    targetModuleId={undefined}
                    targetStreamName={currentStream.name}
                  />
                )}
                {cycle === "SUPERIEUR" && streamId && moduleId && currentStream && (
                  <ImportLessonsDialog
                    targetStreamId={streamId}
                    targetModuleId={moduleId}
                    targetStreamName={currentStream.name}
                  />
                )}
                {cycle === "LYCEE" && level && stream && (
                  <ImportLessonsDialog
                    targetStreamId={`ENUM:${level}:${stream}`}
                    targetModuleId={undefined}
                    targetStreamName={EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.streams?.find(s => s.value === stream)?.label || "Filière actuelle"}
                  />
                )}
                {cycle === "COLLEGE" && level && (
                  <ImportLessonsDialog
                    targetStreamId={`ENUM:${level}:NONE`}
                    targetModuleId={undefined}
                    targetStreamName={EDUCATION_SYSTEM.COLLEGE.levels.find(l => l.value === level)?.label || "Niveau actuel"}
                  />
                )}
              </div>
            </div>

            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson: any) => {
                  // For LYCEE/COLLEGE: use AdminLessonCard (proper card with badges, status, etc.)
                  // For SUPERIEUR: use folder-style card (lessons act like semesters, lead to chapters)
                  if (cycle === "SUPERIEUR") {
                    return (
                      <div key={lesson.id} className="relative group h-full">
                        <Link
                          href={`/admin/lessons?cycle=SUPERIEUR&streamId=${streamId}&moduleId=${moduleId}&lessonId=${lesson.id}`}
                          className="block h-full"
                        >
                          <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
                            <Folder className="w-12 h-12 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-semibold group-hover:text-primary transition-colors">{lesson.titleFr}</span>
                            <span className="text-sm text-muted-foreground mt-2">Cliquez pour voir les chapitres</span>
                          </div>
                        </Link>
                        <RenameLessonButton lessonId={lesson.id} lessonTitle={lesson.titleFr} />
                        <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.titleFr} />
                      </div>
                    )
                  } else {
                    // Use AdminLessonCard for LYCEE/COLLEGE
                    return <AdminLessonCard key={lesson.id} lesson={lesson} />
                  }
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune leçon trouvée</h3>
                <p className="text-muted-foreground mb-6">Créez votre première leçon pour ce niveau</p>
                {cycle === "SUPERIEUR" && currentModule ? (
                  <AddLessonDialog
                    moduleId={currentModule.id}
                    moduleName={currentModule.name}
                    educationalStreamId={streamId || ""}
                  />
                ) : (
                  <Link href={`/admin/lessons/create?cycle=${cycle || ''}&level=${level || ''}&stream=${stream || ''}&semester=${semester || ''}&streamId=${streamId || ''}&moduleId=${moduleId || ''}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une leçon
                    </Button>
                  </Link>
                )}
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

function SelectionCard({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="p-6 h-full flex items-center justify-center text-center bg-card hover:bg-accent/50 border rounded-xl transition-all hover:shadow-md hover:border-primary/50 group">
        <span className="text-lg font-semibold group-hover:text-primary transition-colors">{label}</span>
      </div>
    </Link>
  )
}

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
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
