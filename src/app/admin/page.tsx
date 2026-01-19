import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, Users, MessageSquare, Activity, Plus, Settings, FileText } from "lucide-react"
import { getAdminStats, getRecentForumPosts } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let statsResult = { success: false, error: "Failed to fetch stats", data: null };
  let postsResult = { success: false, error: "Failed to fetch posts", data: [] };

  try {
    const [stats, posts] = await Promise.all([
      getAdminStats().catch(e => ({ success: false, error: e.message, data: null })),
      getRecentForumPosts(5).catch(e => ({ success: false, error: e.message, data: [] }))
    ]);
    statsResult = stats as any;
    postsResult = posts as any;
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }

  if (!statsResult.success) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600 text-lg">❌ {statsResult.error || 'Impossible de charger les statistiques.'}</p>
      </div>
    );
  }

  const stats = statsResult.data || {
    totalUsers: 0,
    recentUsers: 0,
    totalLessons: 0,
    totalExercises: 0,
    totalForumPosts: 0
  };
  const recentPosts = (postsResult.success && postsResult.data) ? postsResult.data : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transform transition-transform hover:scale-105 hover:shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentUsers ?? 0} ce mois-ci</p>
          </CardContent>
        </Card>
        <Card className="transform transition-transform hover:scale-105 hover:shadow-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leçons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sur la plateforme</p>
          </CardContent>
        </Card>
        <Card className="transform transition-transform hover:scale-105 hover:shadow-xl bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900 dark:to-fuchsia-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExercises ?? 0}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card className="transform transition-transform hover:scale-105 hover:shadow-xl bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900 dark:to-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Forum</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForumPosts ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total des discussions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente du Forum</CardTitle>
            <CardDescription>
              Les dernières discussions de la communauté.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune activité récente.</p>
              ) : (
                recentPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={post.user.image} alt={post.user.name} />
                      <AvatarFallback>{post.user.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        par {post.user.name} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-sm text-muted-foreground">
                      {post._count.replies} réponses
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Raccourcis vers les tâches courantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/admin/lessons">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <BookOpen className="mr-2 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Gérer les Leçons</span>
                  <span className="text-xs text-muted-foreground">Modifier ou ajouter du contenu</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Users className="mr-2 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Gérer les Utilisateurs</span>
                  <span className="text-xs text-muted-foreground">Voir et modifier les comptes</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/exercises">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="mr-2 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Banque d'Exercices</span>
                  <span className="text-xs text-muted-foreground">Gérer les exercices et corrections</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/references">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <BookOpen className="mr-2 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Documents de Référence</span>
                  <span className="text-xs text-muted-foreground">Uploader Manuels et Orientations</span>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
