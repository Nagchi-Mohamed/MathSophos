"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface ExamsPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
}

export function ExamsPagination({ page, totalPages, total, limit }: ExamsPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-md mt-4">
      <div className="text-sm text-muted-foreground">
        Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} résultats
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
        <span className="text-sm font-medium">
          Page {page} sur {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
