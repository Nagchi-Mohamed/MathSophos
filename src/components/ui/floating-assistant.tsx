"use client";

import { useState, useEffect, useId } from "react";
import { MessageCircle, X, AlertTriangle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitReport } from "@/actions/reports";
import { ContactReplyNotifications } from "@/components/ui/contact-reply-notifications";
import { useSession } from "next-auth/react";
import { MathAISolver } from "@/components/math-ai-solver";

interface FloatingAssistantProps {
  pageType: "lesson" | "exercise" | "forum" | "exam" | "control" | "series" | "home" | "calculator" | "solver";
  entityId?: string;
  entityTitle?: string;
}

export function FloatingAssistant({ pageType, entityId, entityTitle }: FloatingAssistantProps) {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [contactContent, setContactContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");


  // Generate stable IDs for dialogs to prevent hydration mismatches
  const reportDialogId = useId();
  const contactDialogId = useId();
  const assistantDialogId = useId();

  // Only render after mount to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    // Capture current URL and path when component mounts
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      setCurrentPath(window.location.pathname + window.location.search);
    }
  }, []);

  const handleReportSubmit = async () => {
    if (!reportContent.trim()) {
      toast.error("Erreur", {
        description: "Veuillez décrire l'erreur rencontrée.",
      });
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const reportToSend = reportContent.trim(); // Save the content before clearing

    try {
      const result = await submitReport({
        type: "ERROR",
        content: reportToSend,
        pageType,
        entityId,
        entityTitle,
        url: currentUrl || (typeof window !== "undefined" ? window.location.href : ""),
        path: currentPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : ""),
      });

      if (result.success) {
        // Clear the input immediately
        setReportContent("");

        // Show success message
        toast.success("Signalement envoyé avec succès !", {
          description: "Votre signalement a été reçu. Merci pour votre contribution !",
          duration: 5000,
        });

        // Close the dialog after a short delay to show the success
        setTimeout(() => {
          setIsReportOpen(false);
        }, 500);

        // Log for debugging
        console.log("✅ Report submitted successfully via floating assistant");
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de l'envoi du signalement.",
        });
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de l'envoi du signalement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactContent || !contactContent.trim()) {
      toast.error("Erreur", {
        description: "Veuillez saisir votre message.",
      });
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const messageToSend = contactContent.trim(); // Save the message before clearing

    try {
      const result = await submitReport({
        type: "CONTACT",
        content: messageToSend,
        pageType,
        entityId,
        entityTitle,
        url: currentUrl || (typeof window !== "undefined" ? window.location.href : ""),
        path: currentPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : ""),
      });

      if (result.success) {
        // Clear the input immediately
        setContactContent("");

        // Show success message
        toast.success("Message envoyé avec succès !", {
          description: "Votre message a été reçu. Nous vous répondrons bientôt !",
          duration: 5000,
        });

        // Close the dialog after a short delay to show the success
        setTimeout(() => {
          setIsContactOpen(false);
        }, 500);

        // Log for debugging
        console.log("✅ Contact message submitted successfully via floating assistant");
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de l'envoi du message.",
        });
      }
    } catch (error) {
      console.error("Error in handleContactSubmit:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'envoi du message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatches
  if (!isMounted || !isVisible) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-3">
          {/* Dismiss Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Notifications Button */}
          {session?.user?.id && (
            <ContactReplyNotifications userId={session.user.id} />
          )}

          {/* Main Assistant Button */}
          <div className="flex gap-2">
            {/* Report Error Button */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white h-14 w-14"
                  title="Signaler une erreur"
                >
                  <AlertTriangle className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Signaler une erreur
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-content">Description de l'erreur</Label>
                    <Textarea
                      id="report-content"
                      placeholder="Décrivez l'erreur que vous avez rencontrée..."
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      className="mt-2"
                      rows={4}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReportOpen(false);
                        setReportContent("");
                      }}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleReportSubmit}
                      disabled={isSubmitting || !reportContent.trim()}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contact Us Button */}
            <Dialog open={isContactOpen} onOpenChange={(open) => {
              setIsContactOpen(open);
              if (!open) {
                // Clear content when dialog closes
                setContactContent("");
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white h-14 w-14"
                  title="Contacter nous"
                >
                  <Mail className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
                if (isSubmitting) {
                  e.preventDefault();
                }
              }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    Contacter nous
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleContactSubmit();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="contact-content">Votre message</Label>
                    <Textarea
                      id="contact-content"
                      placeholder="Comment pouvons-nous vous aider ?"
                      value={contactContent}
                      onChange={(e) => setContactContent(e.target.value)}
                      className="mt-2"
                      rows={4}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsContactOpen(false);
                        setContactContent("");
                      }}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !contactContent.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Main Assistant Button */}
            <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full shadow-lg bg-primary hover:bg-primary/90 h-14 w-14"
                  title="Assistant MathSophos AI"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Assistant MathSophos AI
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <MathAISolver
                    context={{
                      pageType,
                      entityTitle
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
}
