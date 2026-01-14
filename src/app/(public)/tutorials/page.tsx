
import { prisma } from "@/lib/prisma";
import { TutorialsFeed } from "@/components/tutorials/tutorials-feed";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutoriels | MathSophos",
  description: "Découvrez nos tutoriels vidéos courts et interactifs pour maîtriser les mathématiques.",
};

export const revalidate = 60; // ISR

export default async function TutorialsPage() {
  const tutorials = await prisma.platformVideo.findMany({
    where: {
      entityType: "tutorial", // Matches entityType used in Admin Page
      entityId: "feed"      // Matches entityId used in Admin Page
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black">
      <TutorialsFeed initialVideos={tutorials} />
    </main>
  );
}
