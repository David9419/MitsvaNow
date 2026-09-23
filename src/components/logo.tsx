import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/** Logo : le « M » + le nom Mivtsa Now. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={40}
        height={35}
        priority
        className="h-8 w-auto transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
      />
      <span className="font-heading text-lg font-bold">
        <span className="text-foreground">Mivtsa</span>{" "}
        <span className="text-primary">Now</span>
      </span>
    </Link>
  )
}
