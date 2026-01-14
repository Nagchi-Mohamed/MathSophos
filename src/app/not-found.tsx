import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Page introuvable</h2>
      <p className="text-muted-foreground max-w-[500px]">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link href="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}
