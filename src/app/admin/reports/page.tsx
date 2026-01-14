import { Suspense } from "react"
import { getReports, getReportCounts } from "@/actions/reports"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Mail, Clock, Filter, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { MarkReportResolvedButton } from "@/components/admin/mark-report-resolved-button"
import { CommentModerationActions } from "@/components/admin/comment-moderation-actions"
import { ReportUserActions } from "@/components/admin/report-user-actions"
import { ReplyToMessageButton } from "@/components/admin/reply-to-message-button"
import { DeleteReportButton } from "@/components/admin/delete-report-button"
import { ClearInboxButton } from "@/components/admin/clear-inbox-button"
import Link from "next/link"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const session = await auth()

  if (!session?.user?.role || !canAccessAdmin(session.user.role)) {
    redirect("/login")
  }

  const params = await searchParams
  
  // Build filters for database query
  const filters: {
    status?: "pending" | "resolved"
    type?: "ERROR" | "CONTACT" | "FORUM_COMMENT"
  } = {}
  
  if (params.status === "pending" || params.status === "resolved") {
    filters.status = params.status
  }
  if (params.type === "ERROR" || params.type === "CONTACT" || params.type === "FORUM_COMMENT") {
    filters.type = params.type
  }

  // Fetch reports with filters applied at database level and counts in parallel
  const [filteredReports, counts] = await Promise.all([
    getReports(filters),
    getReportCounts(),
  ])

  const { pendingCount, errorCount, contactCount, forumCommentCount } = counts

  // Debug log
  console.log("📊 Reports page - Filters:", filters, "Reports found:", filteredReports.length)

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Signalements et Messages</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les signalements d'erreurs et les messages de contact des utilisateurs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erreurs</p>
                <p className="text-2xl font-bold">{errorCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{contactCount}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commentaires signalés</p>
                <p className="text-2xl font-bold">{forumCommentCount}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
        <a
          href="/admin/reports"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !params.status && !params.type
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Tous
        </a>
        <a
          href="/admin/reports?status=pending"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            params.status === "pending"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          En attente
        </a>
        <a
          href="/admin/reports?status=resolved"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            params.status === "resolved"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Résolus
        </a>
        <a
          href="/admin/reports?type=ERROR"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            params.type === "ERROR"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Erreurs
        </a>
        <a
          href="/admin/reports?type=CONTACT"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            params.type === "CONTACT"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Messages
        </a>
        <a
          href="/admin/reports?type=FORUM_COMMENT"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            params.type === "FORUM_COMMENT"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Commentaires signalés
        </a>
        </div>
        <ClearInboxButton />
      </div>

      <div className="grid gap-6">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun signalement</h3>
              <p className="text-muted-foreground text-center">
                Il n'y a actuellement aucun signalement ou message à traiter.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report: any) => (
            <Card key={report.id} className={report.isResolved ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {report.type === "ERROR" ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : report.type === "FORUM_COMMENT" ? (
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Mail className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {report.type === "ERROR" 
                          ? "Signalement d'erreur" 
                          : report.type === "FORUM_COMMENT"
                          ? "Commentaire signalé"
                          : "Message de contact"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={report.isResolved ? "secondary" : "default"}>
                          {report.isResolved ? "Résolu" : "En attente"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Par {report.user?.name || report.user?.email || report.email || "Anonyme"}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.type === "CONTACT" && !report.isResolved && (
                      <ReplyToMessageButton reportId={report.id} />
                    )}
                    {report.userId && (
                      <ReportUserActions
                        userId={report.userId}
                        userName={report.user?.name || report.user?.email || "Anonyme"}
                        userEmail={report.user?.email}
                      />
                    )}
                    <DeleteReportButton reportId={report.id} />
                    {!report.isResolved && (
                      <MarkReportResolvedButton reportId={report.id} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Titre</h4>
                    <p className="font-medium">{report.title}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{report.description}</p>
                    </div>
                  </div>
                  {report.metadata && typeof report.metadata === 'object' && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Informations supplémentaires</h4>
                      <div className="text-sm space-y-1">
                        {report.metadata.pageType && (
                          <p><span className="font-medium">Type de page:</span> {report.metadata.pageType}</p>
                        )}
                        {report.metadata.path && (
                          <p>
                            <span className="font-medium">Référence de la page:</span>{" "}
                            <a 
                              href={report.metadata.url || report.metadata.path} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 underline break-all"
                            >
                              {report.metadata.path}
                            </a>
                          </p>
                        )}
                        {report.metadata.url && report.metadata.url !== report.metadata.path && (
                          <p>
                            <span className="font-medium">URL complète:</span>{" "}
                            <a 
                              href={report.metadata.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 underline break-all text-xs"
                            >
                              {report.metadata.url}
                            </a>
                          </p>
                        )}
                        {report.metadata.entityId && (
                          <p><span className="font-medium">ID de l'entité:</span> {report.metadata.entityId}</p>
                        )}
                        {report.type === "FORUM_COMMENT" && report.metadata.replyId && (
                          <>
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="font-medium mb-2">Commentaire signalé:</p>
                              <p className="text-xs text-muted-foreground mb-1">
                                Par: <span className="font-medium">{report.metadata.replyAuthorName || "Anonyme"}</span>
                              </p>
                              <p className="whitespace-pre-wrap text-xs">{report.metadata.replyContent}</p>
                            </div>
                            {report.metadata.postId && (
                              <p className="mt-2">
                                <Link 
                                  href={`/forum/${report.metadata.postId}`}
                                  className="text-blue-500 hover:text-blue-600 underline"
                                >
                                  Voir le sujet du forum →
                                </Link>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {report.type === "FORUM_COMMENT" && report.metadata && typeof report.metadata === 'object' && report.metadata.replyId && (
                    <div className="mt-4 pt-4 border-t">
                      <CommentModerationActions
                        replyId={report.metadata.replyId}
                        replyAuthorId={report.metadata.replyAuthorId}
                        replyAuthorName={report.metadata.replyAuthorName || "Anonyme"}
                        postId={report.metadata.postId}
                      />
                    </div>
                  )}
                  {report.type === "CONTACT" && report.replies && report.replies.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Réponses</h4>
                      <div className="space-y-3">
                        {report.replies.map((reply: any) => (
                          <div key={reply.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {reply.repliedBy?.name || "Admin"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.createdAt), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
