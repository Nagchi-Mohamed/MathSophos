import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"

export const maxDuration = 60; // Set max execution time to 60s for Vercel
import { getPuppeteerOptions } from "@/lib/puppeteer-config"
import { auth } from "@/auth"
import { latexPreprocessor } from "@/lib/latex-preprocessor"

export async function POST(req: NextRequest) {
  try {
    console.log("PDF Content API called")

    // Check authentication - allow any authenticated user for math solver
    const session = await auth()
    if (!session?.user) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, title = "MathSophos Solution" } = await req.json()
    console.log("Content length:", content?.length)

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Normalize LaTeX content to fix AI artifacts and ensure MathJax compatibility
    const normalizedContent = latexPreprocessor.normalizeLatex(content);

    // Launch browser
    console.log("Launching Puppeteer...")
    const options = await getPuppeteerOptions()
    const browser = await puppeteer.launch(options)
    console.log("Browser launched")

    const page = await browser.newPage()

    // Set viewport to A4 size (approximate pixels at 96 DPI)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2, // Higher scale for better quality
    })

    // Create HTML content for the solution
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true,
              processEnvironments: true
            },
            options: {
              skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
              ignoreHtmlClass: 'tex2jax_ignore',
              processHtmlClass: 'tex2jax_process'
            },
            startup: {
              pageReady: () => {
                return MathJax.startup.defaultPageReady().then(() => {
                  document.body.setAttribute('data-ready', 'true');
                  console.log('MathJax initial typesetting complete');
                });
              }
            }
          };
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #000;
            background: white;
            margin: 0;
            padding: 0;
            max-width: none;
          }

          .header-container {
            background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
            border: 2px solid rgba(37, 99, 235, 0.2);
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 2px solid rgba(37, 99, 235, 0.2);
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .logo-box {
            background: #2563eb;
            color: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .logo-box svg {
            width: 32px;
            height: 32px;
          }

          .branding h3 {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            margin: 0;
          }

          .branding p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }

          .professor-badge {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.8);
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid rgba(37, 99, 235, 0.3);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .professor-badge svg {
            width: 24px;
            height: 24px;
            color: #2563eb;
          }

          .professor-info {
            text-align: right;
          }

          .professor-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0;
          }

          .professor-name {
            font-weight: 700;
            font-size: 18px;
            color: #111827;
            margin: 0;
          }

          .title-box {
            background: #2563eb;
            color: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .title-box .title {
            font-size: 30px;
            font-weight: 800;
            margin: 0;
            line-height: 1.2;
          }

          .content {
            max-width: none;
          }

          .prose {
            max-width: none;
          }

          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: #000;
            font-weight: bold;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }

          .prose p {
            margin-bottom: 1em;
          }

          .prose ul, .prose ol {
            margin-bottom: 1em;
            padding-left: 2em;
          }

          .prose li {
            margin-bottom: 0.5em;
          }

          .prose table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
          }

          .prose th, .prose td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          .prose th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .prose img {
            max-width: 100%;
            height: auto;
          }

          .prose .math {
            font-family: 'Computer Modern', 'Latin Modern Roman', serif;
          }

          @media print {
            * {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }

            body {
              background: white !important;
            }

            img, table, figure {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-top">
            <div class="header-left">
              <div class="logo-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="branding">
                <h3>MathSophos</h3>
                <p>Plateforme d'apprentissage des mathématiques</p>
              </div>
            </div>
            <div class="professor-badge">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14v9M12 14l-9-5m9 5l9-5m-9 5v9m0-9l-9-5m9 5l9-5" />
              </svg>
              <div class="professor-info">
                <p class="professor-label">Professeur</p>
                <p class="professor-name">${process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi"}</p>
              </div>
            </div>
          </div>
          <div class="title-box">
            <div class="title">${title}</div>
          </div>
        </div>

        <div class="content">
          <div class="prose">
            ${normalizedContent}
          </div>
        </div>

        <script>
          // Fallback if MathJax doesn't load or signal
          setTimeout(() => {
            if (!document.body.getAttribute('data-ready')) {
              document.body.setAttribute('data-ready', 'true');
            }
          }, 5000);
        </script>
      </body>
      </html>
    `

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" })

    // Wait for MathJax to finish processing
    try {
      await page.waitForFunction(
        () => document.body.getAttribute('data-ready') === 'true',
        { timeout: 10000 }
      )
      console.log("Content ready for PDF generation")
    } catch (e) {
      console.log("Timeout waiting for content ready, proceeding anyway...")
    }

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
      displayHeaderFooter: false,
    })

    console.log("PDF generated successfully")
    await browser.close()

    // Return PDF
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = sanitizedTitle + '.pdf'

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("PDF Content Generation Error:", error)
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
