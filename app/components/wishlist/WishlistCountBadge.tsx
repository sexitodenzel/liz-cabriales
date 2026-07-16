"use client"

type Props = {
  count: number
  className?: string
}

const defaultClassName =
  "absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6a75e] px-1 text-[10px] text-white"

export default function WishlistCountBadge({ count, className }: Props) {
  if (count <= 0) return null

  return (
    <span className={className ?? defaultClassName}>
      {count}
    </span>
  )
}
