'use server'

import { prisma } from "@/lib/prisma"

export async function getHomeVideos() {
  try {
    const videos = await prisma.platformVideo.findMany({
      where: {
        entityType: 'home-explanation',
        entityId: 'main'
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    return videos
  } catch (error) {
    console.error("Error fetching home videos:", error)
    return []
  }
}
