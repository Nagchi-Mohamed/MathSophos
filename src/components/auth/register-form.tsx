"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/actions/register"
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function RegisterForm() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    setIsLoading(true)
    try {
      const result = await registerUser(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Compte créé avec succès ! Redirection...")
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      }
    } catch (error) {
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
          <CardTitle className="text-2xl font-bold gradient-text">Inscription</CardTitle>
          <CardDescription>Créez un compte pour commencer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Votre nom"
                    required
                    className="pl-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="exemple@email.com"
                    required
                    className="pl-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10 pr-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col space-y-2">
                <Label>Je suis</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      defaultChecked
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Étudiant</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Professeur</span>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
              {success && <p className="text-sm text-green-500 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-800">{success}</p>}
            </div>
            <div className="mt-6">
              <Button type="submit" className="w-full rounded-xl py-6 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

