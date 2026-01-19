"use client"

import { useEffect, useState } from "react"
import { getAnalyticsData } from "@/actions/admin"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Users, BookOpen } from "lucide-react"

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalyticsData().then(res => {
      if (res.success && res.data) {
        setData(res.data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytique</h1>
        <p className="text-muted-foreground">
          Statistiques de croissance de la plateforme sur les 30 derniers jours.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nouveaux Utilisateurs</CardTitle>
              <CardDescription>Inscriptions journalières</CardDescription>
            </div>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" name="Utilisateurs" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lesson Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Création de Contenu</CardTitle>
              <CardDescription>Nouvelles leçons par jour</CardDescription>
            </div>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <Area type="monotone" dataKey="lessons" stroke="#82ca9d" fillOpacity={1} fill="url(#colorLessons)" name="Leçons" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">Note sur le suivi des visites</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-800 dark:text-amber-200 text-sm">
          Pour l'instant, nous suivons uniquement les actions enregistrées en base de données (Inscriptions, Création de contenu).
          Pour suivre le nombre de visiteurs (trafic), il faudrait intégrer un outil comme Google Analytics ou créer un système de "logs de visite" interne.
        </CardContent>
      </Card>
    </div>
  )
}
