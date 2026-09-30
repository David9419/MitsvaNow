"use client"

import { useRef, useState } from "react"
import { Camera, ImageUp, Loader2, Pencil, Trash2 } from "lucide-react"

import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * Photo ronde avec un petit stylo : « Changer la photo » (appareil photo),
 * « Ouvrir mes photos » ou « Supprimer la photo ».
 * onFichier reçoit l'image choisie (à compresser puis envoyer).
 */
export function ChoixPhoto({
  src,
  nom,
  onFichier,
  onSupprimer,
  enCours = false,
  libelles,
  taille = "grande",
}: {
  src: string | null
  nom?: string | null
  onFichier: (f: File) => void
  onSupprimer?: () => void
  enCours?: boolean
  libelles: { changer: string; choisir: string; prendre: string; supprimer: string }
  taille?: "grande" | "moyenne"
}) {
  const galerie = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [ouvert, setOuvert] = useState(false)

  const choisi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (f) onFichier(f)
  }

  return (
    <div className="relative w-fit">
      <Avatar
        src={src}
        nom={nom}
        className={cn(
          "shadow-xl ring-4 ring-card",
          taille === "grande" ? "size-28 text-4xl" : "size-20 text-2xl"
        )}
      />
      {enCours && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm">
          <Loader2 className="size-7 animate-spin text-primary" />
        </span>
      )}
      <DropdownMenu open={ouvert} onOpenChange={setOuvert}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            disabled={enCours}
            aria-label={libelles.changer}
            className="absolute -end-1 -bottom-1 size-9 rounded-full shadow-lg ring-4 ring-card"
          >
            <Pencil className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-52">
          <DropdownMenuItem onClick={() => camera.current?.click()} className="gap-3">
            <Camera /> {libelles.prendre}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => galerie.current?.click()} className="gap-3">
            <ImageUp /> {libelles.choisir}
          </DropdownMenuItem>
          {src && onSupprimer && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onSupprimer} className="gap-3">
                <Trash2 /> {libelles.supprimer}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={galerie} type="file" accept="image/*" className="hidden" onChange={choisi} />
      <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={choisi} />
    </div>
  )
}
