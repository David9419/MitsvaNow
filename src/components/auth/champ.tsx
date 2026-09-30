"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react"

import { useT } from "@/components/i18n/langue-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Un champ de formulaire avec son étiquette et son icône. */
export function Champ({
  label,
  id,
  icon: Icon,
  ...props
}: ComponentProps<typeof Input> & { label: string; id: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="group relative">
        {Icon && (
          <Icon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        )}
        <Input
          id={id}
          name={id}
          className={`h-12 bg-card transition-shadow focus-visible:shadow-md ${Icon ? "ps-10" : ""}`}
          {...props}
        />
      </div>
    </div>
  )
}

/** Champ mot de passe avec bouton « œil » pour l'afficher. */
export function ChampMotDePasse({
  label,
  autoComplete,
  aide,
  nom = "mot_de_passe",
}: {
  label?: string
  autoComplete: string
  aide?: string
  /** Nom du champ dans le formulaire */
  nom?: string
}) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={nom}>{label ?? t.auth.champs.mdp}</Label>
      <div className="group relative">
        <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          id={nom}
          name={nom}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          placeholder="••••••••"
          // Le téléphone ne doit rien changer (pas de majuscule ni de correction)
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 bg-card ps-10 pe-11 transition-shadow focus-visible:shadow-md"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={visible ? t.auth.champs.cacher : t.auth.champs.afficher}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
    </div>
  )
}

/** Message d'erreur qui « secoue » pour attirer l'attention. */
export function MessageErreur({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      key={message}
      role="alert"
      className="animate-secoue rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
    >
      {message}
    </div>
  )
}
