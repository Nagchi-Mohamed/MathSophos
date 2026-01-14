
import { Resend } from 'resend';

// Use a fallback key if environment variable is missing to check functionality
// But for production, this should be in .env
const resendApiKey = process.env.RESEND_API_KEY || 're_123456789';

export const resend = new Resend(resendApiKey);
