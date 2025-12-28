"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

export function MonthSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMonth = searchParams.get("month")
    ? Number(searchParams.get("month"))
    : new Date().getMonth()

  const currentYear = searchParams.get("year")
    ? Number(searchParams.get("year"))
    : new Date().getFullYear()

  const date = new Date(currentYear, currentMonth, 1)

  const handleNavigate = (direction: "prev" | "next") => {
    const newDate = new Date(date)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    const params = new URLSearchParams(searchParams)
    params.set("month", newDate.getMonth().toString())
    params.set("year", newDate.getFullYear().toString())

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex w-full items-center justify-between gap-1 rounded-full border border-white/5 bg-zinc-900/50 p-1 shadow-sm backdrop-blur-md md:w-auto md:justify-start">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("prev")}
        className="h-7 w-7 rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronLeft size={14} />
      </Button>

      <div className="flex flex-1 items-center justify-center px-2 md:min-w-[110px] md:flex-none">
        <span className="select-none text-xs font-semibold capitalize tracking-wide text-zinc-200">
          {date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate("next")}
        className="h-7 w-7 rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  )
}