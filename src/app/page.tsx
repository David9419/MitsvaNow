import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Mivtsa Now</h1>
      <p className="max-w-md text-muted-foreground">
        La plateforme qui vous met en relation avec l&apos;intervenant le plus
        proche. Le site est en construction.
      </p>
      <Button>Bouton de test shadcn/ui</Button>
    </main>
  );
}
