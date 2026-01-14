
export const pdfStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');

  :root {
    --primary-color: #0f172a;
    --primary-light: #f1f5f9;
    --primary-border: #cbd5e1;
    --accent-color: #2563eb;
    --border-outer: #dc2626; /* Red */
    --border-inner: #000000; /* Black */
    --text-muted: #64748b;
    
    /* Layout Variables */
    /* 
       User Requirement:
       - 0.25cm (2.5mm) Red Border.
       - 0.5cm (5mm) Black Border.
       - Content must start 0.5cm AFTER the black border (inside).
       - Total Padding = 5mm (Border) + 5mm (Gap) = 10mm.
       User also requested "when a new page start we must let 0.5cm before content start".
       Standard body padding handles this naturally if content flows.
    */
    --page-margin: 10mm;
    --red-box-inset: 2.5mm;
    --black-box-inset: 5mm;
  }

  /* --- Layout & Table Variables --- */
  :root {
    /* ... colors ... */
    --spacer-height: 10mm; /* Top/Bottom Margin simulation */
    --side-padding: 10mm;  /* Left/Right Margin simulation */
  }

  @page {
    margin: 0; /* Zero margin to allow full-bleed borders */
    size: A4;
  }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-family: 'Outfit', 'Roboto', sans-serif;
    color: #000000;
    font-size: 11pt;
    line-height: 1.6;
    background: white;
  }

  /* Fixed Page Frame - Absolute Static Positioning */
  /* Since @page margin is 0, we position from Top Left of sheet */
  .page-frame {
    position: fixed;
    top: 0;
    left: 0;
    width: 210mm;
    height: 297mm;
    pointer-events: none;
    z-index: 1000;
  }

  /* Red Border (Outer) - 2.5mm Inset */
  .page-frame::before {
    content: "";
    position: absolute;
    top: 2.5mm;
    left: 2.5mm;
    width: 205mm; /* 210 - 5 */
    height: 292mm; /* 297 - 5 */
    border: 1px solid var(--border-outer);
    z-index: 1;
  }

  /* Black Border (Inner) - 5mm Inset */
  .page-frame-inner {
    position: absolute;
    top: 5mm;
    left: 5mm;
    width: 200mm; /* 210 - 10 */
    height: 287mm; /* 297 - 10 */
    border: 1px solid var(--border-inner);
    z-index: 2;
  }

  /* --- Table Layout (Simulating Margins) --- */
  table.layout-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Strict sizing */
  }

  /* Spacers for Top/Bottom margins */
  .header-spacer { height: var(--spacer-height); }
  .footer-spacer { height: var(--spacer-height); }

  /* Content Padding (Left/Right margins) */
  td.content-cell {
    padding-left: var(--side-padding);
    padding-right: var(--side-padding);
    vertical-align: top;
  }
  
  /* Ensure header/footer rows act as groups (essential for repetition) */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }


  /* --- Simplified Lesson Header (Proportions Scaled Down ~15%) --- */
  .header-simple {
    margin-bottom: 1.5rem; /* Reduced from 2rem */
    font-family: 'Roboto', sans-serif;
  }

  .hs-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem; /* Reduced from 1.5rem */
  }

  .hs-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* Reduced */
  }

  .hs-logo {
    background-color: #2563eb; 
    color: white;
    width: 40px; /* Reduced from 48px */
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hs-brand-name {
    font-size: 1.25rem; /* Reduced from 1.5rem */
    font-weight: 700; 
    color: #2563eb;
    line-height: 1.1;
  }

  .hs-brand-sub {
    font-size: 0.75rem; /* Reduced */
    color: #64748b;
  }

  .hs-prof-box {
    background-color: #000;
    color: white;
    padding: 0.5rem 1rem; /* Reduced padding */
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 160px; /* Condensed */
  }

  .hs-prof-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    color: #9ca3af; 
    margin-bottom: 0.2rem;
    letter-spacing: 0.05em;
  }

  .hs-prof-row {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 0.9rem; /* Reduced */
  }

  .hs-info-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem; /* Reduced */
  }

  .hs-info-box {
    flex: 1;
    border: 1px solid #1e293b; 
    border-radius: 10px;
    padding: 0.75rem 1rem; /* Reduced */
    background: white;
  }

  .hs-info-label {
    text-transform: uppercase;
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 0.25rem;
    letter-spacing: 0.05em;
  }

  .hs-info-value {
    font-size: 1rem; /* Reduced */
    font-weight: 700;
    color: #0f172a;
  }

  .hs-title-banner {
    background-color: #2563eb; 
    color: white;
    border-radius: 10px;
    padding: 1.25rem 1.75rem; /* Reduced */
  }

  .hs-subject {
    text-transform: uppercase;
    font-size: 0.7rem;
    opacity: 0.9;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .hs-main-title {
    font-size: 1.75rem; /* Reduced from 2rem */
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
    border-bottom: none; 
    display: block;
    padding-bottom: 0;
  }

  /* Content Typography */
  h1, h2, h3 { color: var(--primary-color); margin-top: 1.5rem; margin-bottom: 0.75rem; page-break-after: avoid; }
  h1 { font-size: 1.8rem; border-bottom: 2px solid var(--accent-color); padding-bottom: 0.25rem; display: inline-block; }
  h2 { font-size: 1.5rem; font-weight: 700; }
  h3 { font-size: 1.25rem; font-weight: 600; }

  p { margin-bottom: 1rem; text-align: justify; }
  ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
  li { margin-bottom: 0.25rem; }

  img { max-width: 100%; border-radius: 8px; margin: 1rem auto; display: block; }
  
  /* Math */
  .katex { font-size: 1.1em; line-height: 1.2; }
  .katex-display { margin: 1rem 0; overflow-x: visible; overflow-y: hidden; padding: 0.5rem 0; }

  /* --- Section Box Styles (Matching App MarkdownRenderer) --- */
  section.lesson-box {
    margin: 1.5rem 0;
    border-radius: 0.75rem;
    border-left: 4px solid #3b82f6; /* Blue-500 by DEFAULT (matches Introduction) */
    padding: 1.25rem;
    /* Allow breaking inside the box to save space */
    break-inside: auto; 
    page-break-inside: auto;
    background-color: transparent;
    box-shadow: none;
    position: relative;
  }

  /* Protect specific elements from splitting */
  table, img, figure, .katex-display {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Ensure headers stick to their following content */
  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* App Colors (Tailwind -> Hex approximations) */
  /* Introduction: Blue-500 (#3b82f6) */
  section.box-introduction { border-color: #3b82f6; } 
  
  /* Definition: Green-500 (#22c55e) */
  section.box-definition { border-color: #22c55e; }

  /* Theorem: Purple-500 (#a855f7) */
  section.box-theorem { border-color: #a855f7; }

  /* Formula: Red-500 (#ef4444) */
  section.box-formula { border-color: #ef4444; }

  /* Example: Yellow-500 (#eab308) */
  section.box-example { border-color: #eab308; }

  /* Exercise: Orange-500 (#f97316) */
  section.box-exercise { border-color: #f97316; }

  /* Summary: Gray-500 (#6b7280) */
  section.box-summary { border-color: #6b7280; }

  /* Alert: Red-500 (#ef4444) */
  section.box-alert { border-color: #ef4444; }


  /* Initialize Counter */
  body {
    counter-reset: lesson-section; /* Start counter */
  }

  /* Section Title Styling inside Box */
  section.lesson-box h2,
  section.lesson-box h3 {
    counter-increment: lesson-section; /* Increment per section */
    margin-top: 0;
    font-size: 1.25rem; /* text-xl */
    font-weight: 700;
    border-bottom: 1px solid #e5e7eb; /* gray-200 for print */
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
    display: flex; 
    align-items: center;
    color: #000000;
  }

  /* Icons + Numbering via pseudo-elements */
  
  /* BASE RULE: Default to Book Icon + Blue (Introduction Style) */
  
  /* Case 1: NOT Pre-Numbered (Fallback / Raw content) -> Use CSS Counters */
  body:not(.pre-numbered) section.lesson-box h2::before,
  body:not(.pre-numbered) section.lesson-box h3::before {
    content: "📖 " counter(lesson-section) ". "; 
    margin-right: 0.5rem;
    font-size: 1.5rem;
  }

  /* Case 2: Pre-Numbered (Structured Lesson) -> Icon Only (Number is in text) */
  body.pre-numbered section.lesson-box h2::before,
  body.pre-numbered section.lesson-box h3::before {
    content: "📖 "; 
    margin-right: 0.5rem;
    font-size: 1.5rem;
  }

  /* Specific Overrides (Icons only) - Need to repeat selector specificity */
  
  /* Override for Case 1 (Counter) */
  body:not(.pre-numbered) section.box-introduction h2::before, body:not(.pre-numbered) section.box-introduction h3::before { content: "📖 " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-definition h2::before,   body:not(.pre-numbered) section.box-definition h3::before   { content: "📝 " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-theorem h2::before,      body:not(.pre-numbered) section.box-theorem h3::before      { content: "📐 " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-formula h2::before,      body:not(.pre-numbered) section.box-formula h3::before      { content: "∫ "  counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-example h2::before,      body:not(.pre-numbered) section.box-example h3::before      { content: "💡 " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-exercise h2::before,     body:not(.pre-numbered) section.box-exercise h3::before     { content: "✍️ " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-summary h2::before,      body:not(.pre-numbered) section.box-summary h3::before      { content: "📋 " counter(lesson-section) ". "; }
  body:not(.pre-numbered) section.box-alert h2::before,        body:not(.pre-numbered) section.box-alert h3::before        { content: "⚠️ " counter(lesson-section) ". "; }

  /* Override for Case 2 (No Counter) */
  body.pre-numbered section.box-introduction h2::before, body.pre-numbered section.box-introduction h3::before { content: "📖 "; }
  body.pre-numbered section.box-definition h2::before,   body.pre-numbered section.box-definition h3::before   { content: "📝 "; }
  body.pre-numbered section.box-theorem h2::before,      body.pre-numbered section.box-theorem h3::before      { content: "📐 "; }
  body.pre-numbered section.box-formula h2::before,      body.pre-numbered section.box-formula h3::before      { content: "∫ "; }
  body.pre-numbered section.box-example h2::before,      body.pre-numbered section.box-example h3::before      { content: "💡 "; }
  body.pre-numbered section.box-exercise h2::before,     body.pre-numbered section.box-exercise h3::before     { content: "✍️ "; }
  body.pre-numbered section.box-summary h2::before,      body.pre-numbered section.box-summary h3::before      { content: "📋 "; }
  body.pre-numbered section.box-alert h2::before,        body.pre-numbered section.box-alert h3::before        { content: "⚠️ "; }

  /* Utilities */
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .italic { font-style: italic; }
`;


