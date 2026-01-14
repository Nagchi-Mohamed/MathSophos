"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Mail, Loader2, ArrowLeft } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { requestPasswordReset } from "@/actions/auth-actions"
import { toast } from "sonner"
import Link from "next/link"

export function ForgotPasswordForm() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.success || "Un email contenant votre code a été envoyé.")
        toast.success("Email envoyé !")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Logo Circle */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-[70px] h-[70px] rounded-full shadow-lg" style={{
        background: 'rgb(var(--primary))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <GraduationCap className="h-8 w-8 text-white" />
      </div>

      <Card className="w-full border-none shadow-2xl backdrop-blur-md pt-8" style={{
        background: isDark ? 'var(--gradient-paper-dark)' : 'var(--gradient-paper)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
      }}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold gradient-text">Récupération</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un code d'accès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
                  {success}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button type="submit" className="w-full rounded-xl py-6 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le code"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <Link href="/login" className="w-full">
            <Button
              variant="ghost"
              className="w-full rounded-xl hover:bg-background/50 text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
