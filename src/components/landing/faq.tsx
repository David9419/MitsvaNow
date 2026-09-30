import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function Faq({ questions }: { questions: { q: string; r: string }[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {questions.map((item, i) => (
        <AccordionItem key={i} value={`q${i}`}>
          <AccordionTrigger className="text-start font-sans text-base font-semibold hover:text-primary hover:no-underline">
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
