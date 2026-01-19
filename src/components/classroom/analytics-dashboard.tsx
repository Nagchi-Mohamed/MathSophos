"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  MessageSquare,
  Video,
  Award,
  Activity,
  Calendar,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  classroomId: string;
  onClose: () => void;
}

export function AnalyticsDashboard({ classroomId, onClose }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock data - in production, fetch from API
  const stats = {
    totalSessions: 24,
    totalParticipants: 156,
    averageDuration: 45, // minutes
    totalMessages: 1247,
    attendanceRate: 87,
    engagementScore: 92,
  };

  const sessionData = [
    { date: "Lun", sessions: 4, participants: 23, duration: 42 },
    { date: "Mar", sessions: 3, participants: 19, duration: 38 },
    { date: "Mer", sessions: 5, participants: 28, duration: 51 },
    { date: "Jeu", sessions: 4, participants: 25, duration: 45 },
    { date: "Ven", sessions: 3, participants: 21, duration: 40 },
    { date: "Sam", sessions: 2, participants: 15, duration: 35 },
    { date: "Dim", sessions: 3, participants: 25, duration: 48 },
  ];

  const participationData = [
    { name: "Très actif", value: 45, color: "#10b981" },
    { name: "Actif", value: 30, color: "#3b82f6" },
    { name: "Modéré", value: 15, color: "#f59e0b" },
    { name: "Passif", value: 10, color: "#ef4444" },
  ];

  const featureUsage = [
    { feature: "Chat", usage: 95 },
    { feature: "Partage d'écran", usage: 78 },
    { feature: "Tableau blanc", usage: 65 },
    { feature: "Sondages", usage: 52 },
    { feature: "Quiz", usage: 48 },
    { feature: "Salles de sous-groupes", usage: 35 },
  ];

  const topParticipants = [
    { name: "Alice Martin", sessions: 22, messages: 156, engagement: 98 },
    { name: "Bob Dupont", sessions: 21, messages: 142, engagement: 95 },
    { name: "Claire Bernard", sessions: 20, messages: 138, engagement: 92 },
    { name: "David Petit", sessions: 19, messages: 125, engagement: 89 },
    { name: "Emma Rousseau", sessions: 18, messages: 118, engagement: 87 },
  ];

  const exportReport = () => {
    // In production, generate PDF or CSV
    console.log("Exporting report...");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Tableau de bord analytique
              </h2>
              <p className="text-sm text-zinc-400">
                Statistiques et insights de votre classe
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              className="border-zinc-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
              <p className="text-xs text-zinc-400">Sessions totales</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
              <p className="text-xs text-zinc-400">Participants</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.averageDuration}m</p>
              <p className="text-xs text-zinc-400">Durée moyenne</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
              <p className="text-xs text-zinc-400">Messages</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Video className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.attendanceRate}%</p>
              <p className="text-xs text-zinc-400">Assiduité</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.engagementScore}%</p>
              <p className="text-xs text-zinc-400">Engagement</p>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Session Activity */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Activité des sessions
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sessions"
                  />
                  <Line
                    type="monotone"
                    dataKey="participants"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Participants"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Participation Distribution */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Distribution de la participation
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={participationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {participationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Feature Usage */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Utilisation des fonctionnalités
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis dataKey="feature" type="category" stroke="#888" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="usage" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Participants */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Participants les plus actifs
              </h3>
              <div className="space-y-3">
                {topParticipants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 && "bg-yellow-500 text-black",
                          index === 1 && "bg-gray-400 text-black",
                          index === 2 && "bg-orange-600 text-white",
                          index > 2 && "bg-zinc-700 text-zinc-300"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {participant.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {participant.sessions} sessions • {participant.messages} messages
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        participant.engagement >= 90
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}
                    >
                      {participant.engagement}%
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Insights et recommandations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-400 mb-1">
                      Excellente participation
                    </p>
                    <p className="text-sm text-zinc-400">
                      Le taux d'assiduité a augmenté de 12% cette semaine
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400 mb-1">
                      Engagement élevé
                    </p>
                    <p className="text-sm text-zinc-400">
                      Les étudiants participent activement aux discussions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-400 mb-1">
                      Durée optimale
                    </p>
                    <p className="text-sm text-zinc-400">
                      Les sessions de 45 minutes montrent le meilleur engagement
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-400 mb-1">
                      Fonctionnalités populaires
                    </p>
                    <p className="text-sm text-zinc-400">
                      Le chat et le partage d'écran sont les plus utilisés
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </ScrollArea>
      </Card>
    </div>
  );
}
