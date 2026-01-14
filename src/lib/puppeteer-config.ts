import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function getPuppeteerOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production (Vercel/AWS Lambda)
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as any,
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

