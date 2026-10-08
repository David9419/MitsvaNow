/**
 * Change le thème (clair / sombre) avec une jolie animation : le nouveau thème
 * s'ouvre en cercle à partir du bouton. Sans animation si le navigateur ne sait
 * pas le faire ou si la personne a demandé de réduire les animations.
 */
export function changerThemeAnime(
  vers: "light" | "dark",
  setTheme: (theme: string) => void,
  origine?: HTMLElement | null
) {
  const racine = document.documentElement
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (typeof document.startViewTransition !== "function" || reduit) {
    setTheme(vers)
    return
  }

  // Point de départ du cercle : le centre du bouton (ou le haut de l'écran)
  const r = origine?.getBoundingClientRect()
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2
  const y = r ? r.top + r.height / 2 : 0
  const rayon = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  racine.classList.add("theme-anime")
  const transition = document.startViewTransition(() => {
    // On applique le thème tout de suite (next-themes le retiendra ensuite)
    racine.classList.toggle("dark", vers === "dark")
    racine.style.colorScheme = vers
    setTheme(vers)
  })
  transition.ready
    .then(() =>
      racine.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rayon}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
    .catch(() => {})
  transition.finished.finally(() => racine.classList.remove("theme-anime"))
}
