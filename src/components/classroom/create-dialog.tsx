"use client";

import { useTransition, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClassroom } from "@/actions/classroom";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateClassroomDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    const section = formData.get("section") as string;
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;

    startTransition(async () => {
      try {
        await createClassroom({
          name,
          section,
          subject,
          description,
        });
        toast.success("Classe créée avec succès !");
        setOpen(false);
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Créer une classe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une classe</DialogTitle>
          <DialogDescription>
            Créez une nouvelle classe pour interagir avec vos élèves.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                required
                className="col-span-3"
                placeholder="Maths 1er Bac"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section" className="text-right">
                Section
              </Label>
              <Input
                id="section"
                name="section"
                className="col-span-3"
                placeholder="Groupe 2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Matière
              </Label>
              <Input
                id="subject"
                name="subject"
                className="col-span-3"
                placeholder="Mathématiques"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                className="col-span-3"
                placeholder="Description optionnelle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
