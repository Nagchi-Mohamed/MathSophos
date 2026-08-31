/**
 * Direct Supabase Keep-Alive Ping Script
 * 
 * Performs direct pinging to Supabase via multiple independent paths:
 * 1. Direct Supabase REST API request
 * 2. Direct PostgreSQL database query using Prisma / pg
 * 3. HTTP ping to web application /api/keep-alive
 */

const https = require('https');
const http = require('http');

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 Starting Supabase Direct Keep-Alive Task...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('--------------------------------------------------');

  let successCount = 0;
  let attemptCount = 0;

  // Extract variables from environment
  const supabaseRef = process.env.SUPABASE_PROJECT_REF || extractProjectRef(process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseApiKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  const appUrl = process.env.APP_URL;
  const keepAliveSecret = process.env.KEEP_ALIVE_SECRET;

  // ----------------------------------------------------
  // METHOD 1: Direct Supabase REST API Ping
  // ----------------------------------------------------
  if (supabaseRef && supabaseApiKey) {
    attemptCount++;
    console.log(`\n1️⃣ Testing Direct Supabase REST API (Project Ref: ${supabaseRef})...`);
    try {
      const restSuccess = await pingSupabaseRest(supabaseRef, supabaseApiKey);
      if (restSuccess) {
        console.log('   ✅ Direct Supabase REST API Ping SUCCESSFUL');
        successCount++;
      } else {
        console.warn('   ⚠️ Direct Supabase REST API Ping returned non-OK status');
      }
    } catch (err) {
      console.error(`   ❌ Direct Supabase REST API Ping error: ${err.message}`);
    }
  } else {
    console.log('\n1️⃣ Skipping Direct REST API Ping (SUPABASE_PROJECT_REF or SUPABASE_ANON_KEY not set)');
  }

  // ----------------------------------------------------
  // METHOD 2: Direct Prisma / PostgreSQL DB Ping
  // ----------------------------------------------------
  if (databaseUrl) {
    attemptCount++;
    console.log('\n2️⃣ Testing Direct PostgreSQL / Prisma Database Connection...');
    try {
      const dbSuccess = await pingPrismaDatabase();
      if (dbSuccess) {
        console.log('   ✅ PostgreSQL Database Write/Upsert SUCCESSFUL');
        successCount++;
      } else {
        console.warn('   ⚠️ PostgreSQL Database Ping returned non-OK status');
      }
    } catch (err) {
      console.error(`   ❌ PostgreSQL Database Ping error: ${err.message}`);
    }
  } else {
    console.log('\n2️⃣ Skipping Direct DB Ping (DATABASE_URL not set)');
  }

  // ----------------------------------------------------
  // METHOD 3: Web App HTTP Endpoint Ping
  // ----------------------------------------------------
  if (appUrl && keepAliveSecret) {
    attemptCount++;
    console.log(`\n3️⃣ Testing Web Application Endpoint (${appUrl}/api/keep-alive)...`);
    try {
      const appSuccess = await pingWebApp(appUrl, keepAliveSecret);
      if (appSuccess) {
        console.log('   ✅ Web Application Endpoint Ping SUCCESSFUL');
        successCount++;
      } else {
        console.warn('   ⚠️ Web Application Endpoint Ping returned non-200 status');
      }
    } catch (err) {
      console.error(`   ❌ Web Application Endpoint Ping error: ${err.message}`);
    }
  } else {
    console.log('\n3️⃣ Skipping Web App Ping (APP_URL or KEEP_ALIVE_SECRET not set)');
  }

  // Summary
  console.log('\n--------------------------------------------------');
  console.log(`📊 Summary: ${successCount}/${attemptCount} keep-alive methods succeeded.`);
  
  if (attemptCount === 0) {
    console.error('❌ ERROR: No keep-alive methods were attempted. Please configure environment variables.');
    process.exit(1);
  }

  if (successCount > 0) {
    console.log('🎉 Keep-Alive Task Completed Successfully!');
    process.exit(0);
  } else {
    console.error('❌ All attempted Keep-Alive methods failed.');
    process.exit(1);
  }
}

/**
 * Helper to extract project ref from Supabase URL or postgres connection string
 */
function extractProjectRef(urlStr) {
  if (!urlStr) return null;
  // Try matching standard Supabase hostname e.g. postgresql://...db.abcdefgh.supabase.co
  const matchHost = urlStr.match(/db\.([a-z0-9]+)\.supabase\.co/i);
  if (matchHost && matchHost[1]) return matchHost[1];
  
  // Try matching https://abcdefgh.supabase.co
  const matchHttp = urlStr.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (matchHttp && matchHttp[1]) return matchHttp[1];

  return null;
}

/**
 * Direct HTTPS GET request to Supabase REST API
 */
function pingSupabaseRest(projectRef, apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'MathSophos-KeepAlive/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Any 2xx or 3xx status, or 200 with OpenAPI info, indicates active project gateway
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          console.warn(`   Rest API response HTTP ${res.statusCode}: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.warn(`   Rest API request failed: ${e.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn('   Rest API request timed out');
      resolve(false);
    });

    req.end();
  });
}

/**
 * Direct Database ping using Prisma Client
 */
async function pingPrismaDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Upsert singleton record
    const result = await prisma.keepAlive.upsert({
      where: { id: 'singleton' },
      update: { ping: { increment: 1 } },
      create: { id: 'singleton', ping: 1 }
    });

    await prisma.$disconnect();
    return !!result;
  } catch (err) {
    console.warn(`   Prisma execution failed: ${err.message}`);
    return false;
  }
}

/**
 * Web App HTTP Ping
 */
function pingWebApp(appUrl, secret) {
  return new Promise((resolve) => {
    try {
      const targetUrl = new URL(`/api/keep-alive?secret=${encodeURIComponent(secret)}`, appUrl);
      const httpModule = targetUrl.protocol === 'https:' ? https : http;

      const req = httpModule.get(targetUrl.toString(), { timeout: 15000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            console.warn(`   Web App returned HTTP ${res.statusCode}: ${data.substring(0, 100)}`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.warn(`   Web App ping failed: ${err.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('   Web App ping timed out');
        resolve(false);
      });

    } catch (err) {
      console.warn(`   Invalid URL ${appUrl}: ${err.message}`);
      resolve(false);
    }
  });
}

main();
