"use server"

// pdf-parse is a CommonJS module, so we use require or a specific import strategy.
// In Next.js server actions, require is often more reliable for such modules.
const pdf = require("pdf-parse")

export async function extractTextFromFile(formData: FormData) {
  const file = formData.get("file") as File

  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === "application/pdf") {
      const data = await pdf(buffer)
      return { text: data.text }
    } else if (file.type === "text/plain") {
      return { text: buffer.toString("utf-8") }
    } else {
      return { error: "Format de fichier non supporté. Utilisez PDF ou TXT." }
    }
  } catch (error) {
    console.error("Erreur d'extraction:", error)
    return { error: "Échec de la lecture du fichier." }
  }
}
