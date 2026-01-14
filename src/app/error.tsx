"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Une erreur est survenue</h2>
      <p className="text-muted-foreground max-w-[500px]">
        Nous sommes désolés, mais quelque chose s'est mal passé. Veuillez réessayer ou contacter le support si le problème persiste.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Réessayer
        </Button>
        <Button onClick={() => window.location.href = "/"} variant="outline">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
