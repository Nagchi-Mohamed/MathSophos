"use client";

import { useTransition, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClassroom } from "@/actions/classroom";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

export function JoinClassroomDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const code = formData.get("code") as string;

    startTransition(async () => {
      try {
        const result = await joinClassroom(code);
        toast.success(result.message);
        setOpen(false);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Impossible de rejoindre la classe. Vérifiez le code.");
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" />
          Rejoindre une classe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rejoindre une classe</DialogTitle>
          <DialogDescription>
            Demandez le code de la classe à votre enseignant, puis saisissez-le ici.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right whitespace-nowrap">
                Code de la classe
              </Label>
              <Input
                id="code"
                name="code"
                required
                className="col-span-3"
                placeholder="ex: 7g5h9k3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Connexion..." : "Rejoindre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
