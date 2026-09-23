"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Bloc avec une lumière douce qui suit la souris. */
export function CarteLumiere({ className, onMouseMove, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("carte-lumiere", className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`)
        onMouseMove?.(e)
      }}
      {...props}
    />
  )
}
