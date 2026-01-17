import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import { getPuppeteerOptions } from "@/lib/puppeteer-config"
import { auth } from "@/auth"

export const maxDuration = 60; // Set max execution time to 60s for Vercel

// Define a type for the response to avoid implicit any errors if needed, 
// though NextResponse covers it.

export async function GET(req: NextRequest) {
  const session = await auth()
  // Allow if user is authenticated (teacher)
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const ficheId = searchParams.get("id")

  if (!ficheId) {
    return new NextResponse("Missing fiche ID", { status: 400 })
  }

  // Define the URL to capture
  // Needs to be an absolute URL. Using headers to get host.
  const host = req.headers.get("host")
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const url = `${protocol}://${host}/print/fiche/${ficheId}`

  let browser

  try {
    const options = await getPuppeteerOptions();
    browser = await puppeteer.launch(options)

    const page = await browser.newPage()

    // Set viewport to A4 size roughly (at 96 DPI)
    // A4 width ~794px, height ~1123px
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })

    // We need to pass the session cookie to the puppeteer instance so it can access the protected print page
    // HOWEVER, the print page might need to be publicly accessible via a special token if cookies appear tricky.
    // simpler: The print page checks auth, so we must share cookies.
    const cookies = req.cookies.getAll()
    // Puppeteer setCookie format
    const puppeteerCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: host?.split(':')[0], // strip port
      path: '/',
    }))

    if (host) { // check needed for TS
      await page.setCookie(...puppeteerCookies)
    }


    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px"
      }
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fiche-${ficheId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF Generation Error:", error)
    if (browser) await browser.close()
    return new NextResponse("Failed to generate PDF", { status: 500 })
  }
}
