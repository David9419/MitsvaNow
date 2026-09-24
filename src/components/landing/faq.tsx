import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const questions = [
  {
    q: "Est-ce que Mivtsa Now est gratuit ?",
    r: "Oui. Faire une demande est entièrement gratuit. Les intervenants viennent vous aider par amour de la mitsva.",
  },
  {
    q: "Faut-il être pratiquant pour faire une demande ?",
    r: "Pas du tout. Mivtsa Now est ouvert à tous, quel que soit votre niveau. Chacun avance à son rythme, sans jugement et sans pression.",
  },
  {
    q: "Comment l'intervenant le plus proche est-il choisi ?",
    r: "Quand vous faites une demande, la plateforme regarde les intervenants disponibles de l'espace choisi et contacte celui qui est le plus près de vous. S'il ne peut pas, la demande passe automatiquement au suivant.",
  },
  {
    q: "Qui sont les intervenants ?",
    r: "Ce sont des bahourim, des femmes de l'équipe, des soferim, des rabbanim, des rabbaniot et des chlou'him. Chacun gère son espace : il se rend disponible quand il le souhaite et choisit les services qu'il propose.",
  },
  {
    q: "Ma position est-elle partagée avec tout le monde ?",
    r: "Non. Votre position sert uniquement à trouver l'intervenant le plus proche. Seul l'intervenant à qui votre demande est proposée voit votre nom et votre adresse, et votre téléphone seulement s'il accepte.",
  },
  {
    q: "Que se passe-t-il si personne n'est disponible ?",
    r: "Votre demande reste en attente et nous continuons à chercher. Vous pouvez suivre son statut à tout moment depuis votre espace, et l'annuler si besoin.",
  },
  {
    q: "Comment devenir intervenant ?",
    r: "Cliquez sur « Devenir intervenant », choisissez votre espace et créez votre compte. Activez votre localisation, passez en « Disponible » : vous recevez tout de suite les demandes proches de chez vous.",
  },
  {
    q: "Puis-je être à la fois demandeur et intervenant ?",
    r: "Oui. Un même compte permet de faire des demandes et, si vous êtes intervenant, d'en recevoir.",
  },
]

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {questions.map((item, i) => (
        <AccordionItem key={i} value={`q${i}`}>
          <AccordionTrigger className="text-left font-sans text-base font-semibold hover:text-primary hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-base leading-relaxed text-muted-foreground duration-500">
            {/* La réponse apparaît en fondu à chaque ouverture */}
            <div className="reponse-fondu">
              {item.r}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
