
import { pdfStyles } from './styles';

interface CommonPdfProps {
  title: string;
  subtitle?: string;
  content: string; // Pre-rendered HTML or processed Markdown
  meta?: Record<string, string>;
  headerType: 'lesson' | 'chapter' | 'series' | 'exam' | 'solver';
  isPreNumbered?: boolean; // NEW: Flag to control CSS counters
}

import fs from 'fs';
import path from 'path';
// Import katex to ensure it's tracked as a dependency for Next.js Standalone build
import 'katex';

/**
 * Generates the full HTML document for Puppeteer
 */
export function generatePdfHtml({ title, subtitle, content, meta, headerType, isPreNumbered = false }: CommonPdfProps): string {
  // Generate Header HTML based on type
  const headerHtml = generateHeader(headerType, title, subtitle, meta);

  // KaTeX Assets Logic
  let katexCss = '';
  let katexJs = '';
  let autoRenderJs = '';
  let useCdn = false;

  try {
    // Attempt to resolve paths using Node's resolution algorithm
    // This is more robust than hardcoded paths for Standalone builds
    const katexJsPath = require.resolve('katex/dist/katex.min.js');
    const katexCssPath = require.resolve('katex/dist/katex.min.css');
    const autoRenderJsPath = require.resolve('katex/dist/contrib/auto-render.min.js');

    katexCss = fs.readFileSync(katexCssPath, 'utf-8');
    // Replace font paths to absolute CDN
    katexCss = katexCss.replace(/url\((['"]?)fonts\//g, 'url($1https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/fonts/');

    katexJs = fs.readFileSync(katexJsPath, 'utf-8');
    autoRenderJs = fs.readFileSync(autoRenderJsPath, 'utf-8');

    console.log("[PDF Gen] Successfully inlined KaTeX assets from node_modules");
  } catch (e) {
    console.warn("[PDF Gen] Failed to read KaTeX files from node_modules, falling back to CDN:", e);
    useCdn = true;
  }

  // Construct Head Scripts
  let styles = '';
  let scripts = '';

  if (useCdn) {
    styles = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">`;
    scripts = `
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/contrib/auto-render.min.js"></script>
    `;
  } else {
    styles = `<style>${katexCss}</style>`;
    scripts = `
      <script>${katexJs}</script>
      <script>${autoRenderJs}</script>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
      
      <!-- KaTeX Styles -->
      ${styles}
      
      <!-- Custom Styles -->
      <style>
        ${pdfStyles}
      </style>

      <!-- KaTeX Scripts -->
      ${scripts}
    </head>
    <body class="pdf-document ${isPreNumbered ? 'pre-numbered' : ''}">
      <!-- Fixed Border Frame (Now safe at top:0 because page margin is 0) -->
      <div class="page-frame">
        <div class="page-frame-inner"></div>
      </div>

      <!-- Main Content Table (Simulates Margins) -->
      <table class="layout-table">
        <thead>
          <tr>
            <td>
              <!-- Top Margin Spacer (Repeats on every page) -->
              <div class="header-spacer"></div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="content-cell">
              ${headerHtml}
              <div class="main-content">
                ${content}
                
                <!-- Footer with QR Code -->
                <div class="pdf-footer-qr" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; page-break-inside: avoid;">
                  <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px;">
                    <div>
                      <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">MathSophos</div>
                      <div style="font-size: 0.9em; color: #64748b; margin-bottom: 5px;">Plateforme d'apprentissage des mathématiques</div>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #2563eb; text-decoration: none; font-size: 0.9em;">
                        ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                      </a>
                    </div>
                    <div style="text-align: center;">
                       <img 
                         src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}" 
                         width="80" 
                         height="80" 
                         alt="QR Code" 
                         style="border: 2px solid white; border-radius: 4px;"
                       />
                       <div style="font-size: 0.7em; color: #94a3b8; margin-top: 3px;">Scanner pour accéder</div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <!-- Bottom Margin Spacer (Repeats on every page) -->
              <div class="footer-spacer"></div>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Script to signal Puppeteer -->
      <script>
        // Math is pre-rendered server-side with rehype-katex
        // Just signal readiness immediately
        document.addEventListener("DOMContentLoaded", function() {
          console.log("[PDF] DOMContentLoaded - Content is pre-rendered");
          const div = document.createElement('div');
          div.id = 'print-ready';
          document.body.appendChild(div);
          console.log("[PDF] Print-ready signal sent");
        });
      </script>
    </body>
    </html>
  `;
}


function generateHeader(type: string, title: string, subtitle?: string, meta?: Record<string, string>) {
  if (type === 'lesson' || type === 'chapter' || type === 'series' || type === 'exam' || type === 'solver') {
    const level = meta?.level || "Niveau";
    const stream = meta?.stream;
    const semester = meta?.semester ? `Semestre ${meta.semester}` : "";
    const category = meta?.category || "MATHEMATICS";
    const professor = meta?.professor || "Prof: Mohamed Nagchi";

    // Combine Level and Stream for the first box if both exist
    const info1Label = "FILIÈRE / NIVEAU";
    const info1Value = stream ? `${level} - ${stream}` : level;

    // Combine Module/Semester for second box
    const info2Label = "MODULE / SEMESTRE";
    const info2Value = semester || "N/A";

    return `
      <div class="header-simple">
        <!-- Top Row: Brand + Prof -->
        <div class="hs-top">
          <div class="hs-brand">
             <div class="hs-logo">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
             </div>
             <div>
               <div class="hs-brand-name">MathSophos</div>
               <div class="hs-brand-sub">Plateforme d'apprentissage des mathématiques</div>
             </div>
          </div>
          
          <div class="hs-prof-box">
            <div class="hs-prof-label">PROFESSEUR</div>
            <div class="hs-prof-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M22 10v6M2 10v6"/><path d="M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10"/><path d="M12 2a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4Z"/></svg>
              <span>${professor.replace('Prof:', '').trim()}</span>
            </div>
          </div>
        </div>

        ${type !== 'solver' ? `
        <!-- Middle Row: Info Boxes -->
        <div class="hs-info-row">
          <div class="hs-info-box">
            <div class="hs-info-label">${info1Label}</div>
            <div class="hs-info-value">${info1Value}</div>
          </div>
          <div class="hs-info-box">
            <div class="hs-info-label">${info2Label}</div>
            <div class="hs-info-value">${info2Value}</div>
          </div>
        </div>
        ` : ''}

        <!-- Bottom Row: Title Banner -->
        <div class="hs-title-banner">
          <div class="hs-subject">${category}</div>
          <h1 class="hs-main-title">${title}</h1>
        </div>
      </div>
    `;
  }

  // Fallback for other types
  const metaHtml = meta
    ? `<div class="header-meta">
        ${Object.entries(meta).map(([key, value]) => `<span>${value}</span>`).join('')}
       </div>`
    : '';

  let icon = '';
  switch (type) {
    case 'exam': icon = '📝'; break;
    case 'series': icon = '🔢'; break;
    case 'solver': icon = '🤖'; break;
    default: icon = '📄';
  }

  return `
    <header class="header-${type}">
      <div style="margin-bottom: 10px; font-size: 2rem;">${icon}</div>
      <h1 class="header-title">${title}</h1>
      ${subtitle ? `<div class="header-subtitle">${subtitle}</div>` : ''}
      ${metaHtml}
    </header>
  `;
}

