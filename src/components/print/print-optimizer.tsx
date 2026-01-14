"use client"

import { useEffect } from "react"

export function PrintOptimizer() {
  useEffect(() => {
    // Force open all details elements
    const openDetails = () => {
      const details = document.querySelectorAll("details")
      details.forEach((detail) => {
        detail.open = true
        // Trigger a toggle event so any listeners know it changed
        detail.dispatchEvent(new Event("toggle"))
      })
    }

    const signalReady = () => {
      if (!document.getElementById('print-ready')) {
        const readyDiv = document.createElement('div')
        readyDiv.id = 'print-ready'
        document.body.appendChild(readyDiv)
        console.log("Print ready signal dispatched")
      }
    }

    const prepareContent = async () => {
      openDetails()

      // Give a moment for any initial React rendering/effects to settle
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Wait for KaTeX if it's present (it should be auto-rendering)
      // layout.tsx sets up auto-render on DOMContentLoaded
      // We'll give it a bit more time to be safe, or check for rendered elements

      // If we are using MathJax (legacy support or specific pages)
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        try {
          await (window as any).MathJax.typesetPromise()
        } catch (e) {
          console.error("MathJax typesetting failed:", e)
        }
      }

      // Additional safety delay for images/layout to stabilize
      const images = Array.from(document.images)
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
        })
      }))

      setTimeout(signalReady, 1000)
    }

    // Run sequence
    if (document.readyState === "complete") {
      prepareContent()
    } else {
      window.addEventListener("load", prepareContent)
      return () => window.removeEventListener("load", prepareContent)
    }

    return () => { }
  }, [])

  return null
}
