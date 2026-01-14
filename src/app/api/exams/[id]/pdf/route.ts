import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import { getPuppeteerOptions } from "@/lib/puppeteer-config"
import { getExamById } from "@/actions/exams"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Verify exam exists
    const examResult = await getExamById(id)
    if (!examResult.success || !examResult.data) {
      return new NextResponse("Exam not found", { status: 404 })
    }

    const exam = examResult.data

    // Launch browser
    const options = await getPuppeteerOptions()
    const browser = await puppeteer.launch(options)

    const page = await browser.newPage()

    // Set viewport to A4 size approximation
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })

    // Construct the URL to the print exam page
    // We assume the app is running on localhost:3000 for this server-side generation
    // In production, this should be the actual domain
    const protocol = req.headers.get("x-forwarded-proto") || "http"
    const host = req.headers.get("host") || "localhost:3000"

    // Get query params from request
    const searchParams = req.nextUrl.searchParams
    const includeParam = searchParams.get('include')

    let examUrl = `${protocol}://${host}/print/exams/${id}`
    if (includeParam) {
      examUrl += `?include=${includeParam}`
    }

    // Navigate to the page
    // Use domcontentloaded for faster initial load, we rely on #print-ready for full load
    await page.goto(examUrl, { waitUntil: "domcontentloaded", timeout: 60000 })

    // Wait for the ready signal from PrintOptimizer
    try {
      console.log("Waiting for #print-ready...")
      // Increase wait time for content to be fully ready (KaTeX etc)
      await page.waitForSelector('#print-ready', { timeout: 15000 })
      console.log("#print-ready found")
    } catch (e) {
      console.log("Timeout waiting for #print-ready, proceeding anyway...")
    }

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        bottom: "0mm",
        left: "0mm",
        right: "0mm"
      }
    })

    await browser.close()

    // Return the PDF
    return new NextResponse(pdf as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`
      }
    })
  } catch (error) {
    console.error("PDF Generation Error:", error)
    return new NextResponse("Error generating PDF", { status: 500 })
  }
}
