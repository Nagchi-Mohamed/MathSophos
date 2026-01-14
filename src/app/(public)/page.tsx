"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  BookOpen,
  Brain,
  GraduationCap,
  Users,
  Check,
  Stars,
  LifeBuoy,
  TrendingUp,
  History,
  Lightbulb,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { MathAISolver } from "@/components/math-ai-solver"
import { HomeVideoSection } from "@/components/home/home-video-section"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Decorative Background */}
        <div
          className="absolute inset-0 z-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'url("/images/hero-math.svg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'float 6s ease-in-out infinite'
          }}
        />

        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg" style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                Maîtrisez les Maths avec MathSophos
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed"
            >
              L'excellence mathématique au service du système éducatif marocain. Une plateforme intelligente alliant rigueur pédagogique et puissance de l'IA pour votre réussite.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-white text-blue-700 hover:bg-blue-50 border-none shadow-lg hover:-translate-y-1 transition-all duration-300">
                  Commencer Gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/lessons">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-white text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  Explorer les Cours
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mt-8"
            >
              {[
                { icon: LifeBuoy, text: "Support 24/7" },
                { icon: Check, text: "Programme Officiel" },
                { icon: Stars, text: "IA Avancée" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium">
                  <item.icon className="h-4 w-4" />
                  {item.text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section >

      {/* MathSophos AI Section */}
      <section className="py-20 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
      }}>
        {/* Decorative elements */}
        < div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 mb-4">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Nouveau</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Essayez MathSophos AI
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Résolvez vos problèmes mathématiques instantanément. Tapez, téléchargez ou photographiez votre problème.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MathAISolver />
          </motion.div>
        </div>
      </section >

      {/* Statistics Section */}
      < section className="py-12 border-b bg-background" >
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10k+", label: "Élèves Actifs" },
              { value: "500+", label: "Cours Vidéo" },
              { value: "95%", label: "Taux de Réussite" },
              { value: "24/7", label: "Disponibilité IA" }
            ].map((stat, index) => (
              <div key={index} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Features Section */}
      < section className="py-20 bg-muted/30" >
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Pourquoi choisir MathSophos ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une approche pédagogique moderne combinant excellence académique et puissance de l'intelligence artificielle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                title: "Tuteur IA Intelligent",
                desc: "Un assistant disponible 24/7 pour répondre à vos questions et vous guider pas à pas.",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20"
              },
              {
                icon: BookOpen,
                title: "Contenu Conforme",
                desc: "Des cours et exercices rigoureusement alignés sur le programme officiel du Ministère.",
                color: "text-green-600",
                bg: "bg-green-50 dark:bg-green-900/20"
              },
              {
                icon: Users,
                title: "Communauté Active",
                desc: "Échangez avec d'autres élèves et des professeurs sur notre forum d'entraide.",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-900/20"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${feature.bg}`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section >

      {/* How It Works Section */}
      < section className="py-20 bg-background" >
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8 relative max-w-6xl mx-auto">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

            {[
              {
                step: 1,
                title: "Choisissez votre niveau",
                desc: "Sélectionnez votre année scolaire et accédez au programme complet.",
                icon: History
              },
              {
                step: 2,
                title: "Apprenez à votre rythme",
                desc: "Suivez les cours vidéo et pratiquez avec des exercices interactifs.",
                icon: TrendingUp
              },
              {
                step: 3,
                title: "Progressez avec l'IA",
                desc: "Obtenez de l'aide instantanée et suivez vos progrès en temps réel.",
                icon: Lightbulb
              }
            ].map((item, index) => (
              <div key={index} className="relative z-10 bg-background p-6 rounded-xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="mt-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Descriptive Videos Section */}
      <HomeVideoSection />

      {/* Levels Section */}
      < section className="py-20 bg-muted/30" >
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Niveaux Disponibles</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                level: "COLLEGE",
                title: "Collège",
                desc: "De la 1ère à la 3ème année",
                color: "text-orange-600",
                bg: "bg-orange-100",
                hover: "group-hover:bg-orange-600"
              },
              {
                level: "LYCEE",
                title: "Lycée",
                desc: "Tronc Commun, 1ère et 2ème Bac",
                color: "text-blue-600",
                bg: "bg-blue-100",
                hover: "group-hover:bg-blue-600"
              },
              {
                level: "SUPERIEUR",
                title: "Supérieur",
                desc: "Classes Prépa & Université",
                color: "text-indigo-600",
                bg: "bg-indigo-100",
                hover: "group-hover:bg-indigo-600"
              }
            ].map((item, index) => (
              <Link key={index} href={`/lessons?cycle=${item.level}`}>
                <Card className="group hover:border-primary transition-all cursor-pointer h-full hover:shadow-lg hover:-translate-y-1 duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 ${item.bg} ${item.color} rounded-lg ${item.hover} group-hover:text-white transition-colors duration-300`}>
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{item.desc}</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Mathématiques</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Exercices Corrigés</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Examens Blancs</li>
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section >

      {/* CTA Section */}
      <section className="py-20 text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à exceller en maths ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto font-light">
            Rejoignez des milliers d'élèves marocains qui utilisent MathSophos pour réussir leurs examens.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all bg-white text-primary hover:bg-gray-50 border-none">
              Créer un compte gratuit
            </Button>
          </Link>
        </div>
      </section >
    </div >
  )
}

