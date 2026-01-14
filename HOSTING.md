# Hosting Guide

This guide describes how to deploy the MathSophos application to a production environment.

## Prerequisites

- **Node.js**: Version 18 or later (LTS recommended)
- **PostgreSQL**: A running PostgreSQL database instance
- **Environment Variables**: A `.env.production` file (or environment variables set in your hosting platform)

## 1. Environment Setup

Create a `.env.production` file (or set these variables in your deployment dashboard) with the following keys. Refer to `.env.example` for a complete list.

```bash
# Database
DATABASE_URL="postgresql://postgres:password@host:port/database?schema=public"

> [!IMPORTANT]
> **Supabase Users**: You MUST use the **IPv4 Connection Pooler** (Port 6543, "Transaction" mode) for deployment to work on networks that don't support IPv6 (like Vercel or many VPS). 
> - Go to **Database** > **Connect** > **Transaction Pooler**.
> - Append `?pgbouncer=true` to the end of your connection string.

# Authentication (NextAuth)
AUTH_SECRET="your-generated-secret-key" # Generate with `openssl rand -base64 32`
NEXTAUTH_URL="https://your-domain.com" # The canonical URL of your site

# AI Provider Keys
OPENAI_API_KEY="sk-..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."

# Email (Resend)
RESEND_API_KEY="re_..."
```

## 2. Database Migration

Before starting the application, you must push the Prisma schema to your production database.

```bash
# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database with initial data if needed
# npx prisma db seed
```

## 3. Building the Application

Build the Next.js application for production.

```bash
npm run build
```

This command will optimize your application and generate the `.next` folder.

## 4. Starting the Server

Start the production server.

```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port defined by `PORT` env var).


## Hosting Recommendations

### Google Cloud Run (User Choice)
Since you have a `Dockerfile`, deploying to Cloud Run is straightforward.

1.  **Install Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated (`gcloud auth login`).
2.  **Configure Project**: Set your project ID:
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```
3.  **Build and Push Image**:
    ```bash
    gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/math-sophos
    ```
4.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy math-sophos \
      --image gcr.io/[YOUR_PROJECT_ID]/math-sophos \
      --platform managed \
      --region [YOUR_REGION] \
      --allow-unauthenticated
    ```
5.  **Set Environment Variables**:
    You need to set the production secrets in Cloud Run. You can do this via the Google Cloud Console UI or CLI.
    *   **Crucial Variables**: `DATABASE_URL` (use the Transaction Pooler URL), `NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`.
    *   *Tip*: Using the Console UI (Edit & Deploy New Revision -> Variables) is often easier for managing many secrets.

### Vercel (Alternative)
1.  Connect your GitHub repository to Vercel.
2.  Configure the Environment Variables in the Vercel dashboard.
3.  Vercel automatically detects Next.js and handles the build/start commands.
4.  Current configuration includes `puppeteer` for PDF generation, which requires specific Vercel configuration (serverless function size limit might be an issue, consider increasing it or separating the PDF service if heavy).
    *   *Note*: The current `next.config.ts` includes `serverExternalPackages: ['puppeteer', 'puppeteer-core']` which is good for serverless.

### VPS (Ubuntu/Debian)
1.  Install Node.js, NPM, and PM2: `npm install -g pm2`
2.  Clone the repo and install dependencies: `npm ci`
3.  Set up Nginx as a reverse proxy pointing to port 3000.
4.  Run the app with PM2:
    ```bash
    pm2 start npm --name "math-sophos" -- start
    pm2 save
    pm2 startup
    ```

## Troubleshooting

-   **PDF Generation**: If PDF generation fails in production, ensure the environment has the necessary dependencies for Puppeteer (chrome-headless-shell). On Vercel, this usually works out of the box with `puppeteer-core` and `@sparticuz/chromium` (if you were using that), but standard `puppeteer` might need a custom build cache or specific configuration.
-   **Database**: Ensure your database is accessible from the hosting provider.
