import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getPuppeteerOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production (Vercel/AWS Lambda)
    // We use chromium-min to fit within standard serverless limits and dependencies
    // On Vercel, this usually defaults to a suitable path, but we can verify

    // Configure remote executable path - typically for min version we might need 
    // to point to a specific pack or use the default which relies on a separate binary upload.
    // However, sparticuz/chromium-min usually behaves like the standard one but smaller.

    // IMPORTANT: For -min package, we must sometimes provide the pack location if not bundled
    // But let's try standard first as it often bundles a lighter version or expects download.
    // Actually, sparticuz/chromium-min often requires the specific pack url.
    // Let's stick to the secure default behavior first which works on Vercel Pro usually.

    return {
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar'),
      headless: true,
      ignoreHTTPSErrors: true,
    };
  } else {
    // Local Development
    // We need to point to a local Chrome installation since we only have puppeteer-core now
    const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Common Windows path, user might need to adjust

    return {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: localExecutablePath,
      headless: true,
    };
  }
}

