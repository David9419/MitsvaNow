import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Mivtsa <span className="text-primary">Now</span>
      </h1>
      <p className="max-w-md text-muted-foreground">
        La plateforme qui vous met en relation avec l&apos;intervenant le plus
        proche. Le site est en construction.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button>Principal</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          Accent
        </Button>
        <Button className="bg-success text-success-foreground hover:bg-success/90">
          Succès
        </Button>
        <Button variant="destructive">Annuler</Button>
      </div>
    </main>
  );
}
