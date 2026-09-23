"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Un champ de formulaire avec son étiquette. */
export function Champ({
  label,
  id,
  aide,
  ...props
}: ComponentProps<typeof Input> & { label: string; id: string; aide?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-11" {...props} />
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
    </div>
  )
}

/** Champ mot de passe avec bouton « œil » pour l'afficher. */
export function ChampMotDePasse({
  label = "Mot de passe",
  autoComplete,
  aide,
}: {
  label?: string
  autoComplete: string
  aide?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="mot_de_passe">{label}</Label>
      <div className="relative">
        <Input
          id="mot_de_passe"
          name="mot_de_passe"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={visible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
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
