import { GoogleGenerativeAI } from "@google/generative-ai"

// Regular API key for user-facing features (math solver) - free tier
export const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

// Admin API keys rotation logic
const getAdminKeys = () => {
  const keys: string[] = [];

  // 1. Add primary key
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY_ADMIN) keys.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY_ADMIN);

  // 2. Add numbered admin keys (1-10 supported)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GOOGLE_GENERATIVE_AI_API_KEY_ADMIN${i}`];
    if (key) keys.push(key);
  }

  // 3. Fallback to standard keys if no admin keys found (sharing pool)
  if (keys.length === 0) {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) keys.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GOOGLE_GENERATIVE_AI_API_KEY${i}`];
      if (key) keys.push(key);
    }
  }

  return keys.length > 0 ? keys : [""];
}

const adminKeys = getAdminKeys();

// Export the default one for backward compatibility
export const googleGenAIAdmin = new GoogleGenerativeAI(adminKeys[0] || "");

/**
 * Get an admin client specific to a rotation index.
 * Useful for retrying with different keys.
 */
export const getRotatedAdminClient = (retryCount: number) => {
  const keyIndex = retryCount % adminKeys.length;
  const key = adminKeys[keyIndex];
  console.log(`🔑 Using API Key index: ${keyIndex} (Total keys: ${adminKeys.length})`);
  return new GoogleGenerativeAI(key);
}

/**
 * Get total number of available admin keys
 */
export const getAdminKeyCount = () => adminKeys.length;

/**
 * Parse Google Generative AI errors and return user-friendly messages
 */
export function parseGoogleAIError(error: any): string {
  // Log the error for debugging
  console.error("Parsing Google AI error:", {
    status: error.status,
    message: error.message,
    code: error.code,
    name: error.name
  })

  // Handle quota/rate limit errors (429) - be more specific
  if (error.status === 429 ||
    (error.message?.includes("429") && error.message?.includes("Too Many Requests")) ||
    error.message?.includes("Quota exceeded") ||
    (error.message?.includes("quota") && error.message?.includes("exceeded"))) {
    let retryDelay: number | null = null
    let quotaLimit = ""
    let quotaMetric = ""

    // Check for retry delay in error details
    if (error.details) {
      try {
        const details = Array.isArray(error.details) ? error.details : [error.details]
        for (const detail of details) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
            const delay = detail.retryDelay.seconds || detail.retryDelay
            retryDelay = typeof delay === 'string' ? parseFloat(delay) : delay
          }
          if (detail['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure') {
            quotaMetric = detail.violations?.[0]?.quotaMetric || ""
            quotaLimit = detail.violations?.[0]?.quotaValue || ""
          }
        }
      } catch (e) {
        console.error("Error parsing quota details:", e)
      }
    }

    // Check error message for retry delay and quota info
    if (!retryDelay) {
      const retryMatch = error.message?.match(/retry in ([\d.]+)s/i) || error.message?.match(/retryDelay["\s:]+([\d.]+)/i)
      if (retryMatch) {
        retryDelay = parseFloat(retryMatch[1])
      }
    }

    // Extract quota limit from message if not found in details
    if (!quotaLimit) {
      const limitMatch = error.message?.match(/limit:\s*(\d+)/i)
      if (limitMatch) {
        quotaLimit = limitMatch[1]
      }
    }

    const quotaInfo = quotaLimit
      ? ` Vous avez atteint la limite quotidienne de ${quotaLimit} requêtes gratuites pour ce modèle.`
      : " Vous avez atteint votre limite quotidienne de requêtes gratuites."

    const retryMessage = retryDelay
      ? ` Le quota sera réinitialisé dans ${Math.ceil(retryDelay)} seconde${Math.ceil(retryDelay) > 1 ? 's' : ''}.`
      : " Le quota sera réinitialisé demain ou vous pouvez passer à un plan payant."

    return `Quota quotidien de l'API Google Generative AI dépassé.${quotaInfo}${retryMessage}`
  }

  // Handle Service Unavailable / Overloaded (503)
  if (error.status === 503 || error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("Service Unavailable")) {
    return "Le service IA est actuellement surchargé (Erreur 503). Une nouvelle tentative automatique a échoué. Veuillez réessayer dans quelques instants."
  }

  // Handle API key errors
  if (error.message?.includes("API_KEY") || error.message?.includes("API key") || error.message?.includes("API_KEY_INVALID")) {
    return "Clé API invalide. Veuillez contacter l'administrateur."
  }

  // Handle safety filter errors
  if (error.message?.includes("SAFETY") || error.message?.includes("safety") || error.message?.includes("blocked")) {
    return "Le contenu a été bloqué par les filtres de sécurité. Veuillez modifier vos instructions."
  }

  // Handle rate limit errors (not quota)
  if (error.message?.includes("RATE_LIMIT") || error.message?.includes("rate limit")) {
    return "Trop de requêtes. Veuillez réessayer dans quelques instants."
  }

  // Generic error - include more details for debugging
  const errorMessage = error.message || "Une erreur est survenue lors de la génération"

  // If it's a network or timeout error, provide specific message
  if (error.message?.includes("timeout") || error.message?.includes("TIMEOUT") || error.code === "ETIMEDOUT") {
    return "La requête a pris trop de temps. Le prompt est peut-être trop long. Veuillez réessayer ou simplifier vos instructions."
  }

  if (error.message?.includes("network") || error.message?.includes("ECONNREFUSED") || error.code === "ECONNREFUSED") {
    return "Erreur de connexion à l'API. Vérifiez votre connexion internet et réessayez."
  }

  // Return the original error message so user can see what went wrong
  return errorMessage
}
