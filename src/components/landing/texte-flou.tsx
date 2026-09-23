/**
 * Texte qui apparaît mot par mot en sortant d'un flou.
 * Dans un <Reveal>, l'animation attend que le bloc arrive à l'écran.
 */
export function TexteFlou({
  texte,
  delai = 0,
  pas = 70,
  className,
  classeMot,
}: {
  texte: string
  delai?: number
  pas?: number
  className?: string
  /** Classes appliquées à chaque mot (ex. un dégradé de couleur) */
  classeMot?: string
}) {
  const mots = texte.split(" ")
  return (
    <span className={className} aria-label={texte}>
      {mots.map((mot, i) => (
        <span
          key={i}
          aria-hidden
          className={classeMot ? `mot-flou ${classeMot}` : "mot-flou"}
          style={{ animationDelay: `${delai + i * pas}ms` }}
        >
          {mot}
          {i < mots.length - 1 && " "}
        </span>
      ))}
    </span>
  )
}
