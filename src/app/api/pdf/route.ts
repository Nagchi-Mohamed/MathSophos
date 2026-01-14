import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { getPuppeteerOptions } from "@/lib/puppeteer-config"
import { auth } from "@/auth"
import { canAccessAdmin } from "@/lib/roles"

export async function POST(req: NextRequest) {
  try {
    console.log("PDF API called")

    // Check authentication and permissions
    const session = await auth()
    console.log("Session:", session?.user?.email, session?.user?.role)

    if (!session?.user || !session.user.role || !canAccessAdmin(session.user.role)) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url } = await req.json()
    console.log("Requested URL:", url)

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Launch browser
    console.log("Launching Puppeteer...")
    const browser = await puppeteer.launch(getPuppeteerOptions())
    console.log("Browser launched")

    const page = await browser.newPage()

    // Pass authentication cookies to Puppeteer
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=')
        const value = valueParts.join('=') // Rejoin if value had = in it
        return {
          name,
          value,
          domain: new URL(url).hostname, // Set domain from target URL
          path: '/',
        }
      })

      // Filter out invalid cookies or handle errors if setCookie fails
      if (cookies.length > 0) {
        await page.setCookie(...cookies)
        console.log(`Passed ${cookies.length} cookies to Puppeteer`)
      }
    }

    // Set viewport to A4 size (approximate pixels at 96 DPI)
    // A4 is 210mm x 297mm. At 96 DPI: 794px x 1123px
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2, // Higher scale for better quality
    })

    // Emulate light mode/print media
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' },
    ])

    // Navigate to the print view
    console.log(`Generating PDF for URL: ${url}`)

    // Capture browser console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));

    // Increase timeout to 60s and use domcontentloaded + explicit selector wait
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })

    // Force light mode by removing dark class from html element
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    })

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
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        bottom: "0mm",
        left: "0mm",
        right: "0mm",
      },
      displayHeaderFooter: false, // We use CSS for headers/footers
    })

    console.log("PDF generated successfully")
    await browser.close()

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF Generation Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : ""
    console.error("Error details:", { errorMessage, errorStack })

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
