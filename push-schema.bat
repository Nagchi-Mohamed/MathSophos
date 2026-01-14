@echo off
echo Pushing schema to database with direct connection...
set DATABASE_URL=postgresql://postgres.vzxeazcjygqcrtcoygze:nagchi1945ADMIN@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
npx prisma db push --accept-data-loss
echo Done!
pause
