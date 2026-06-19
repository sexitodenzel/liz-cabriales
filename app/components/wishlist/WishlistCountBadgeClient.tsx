"use client"

import dynamic from "next/dynamic"

const WishlistCountBadge = dynamic(() => import("./WishlistCountBadge"), {
  ssr: false,
})

export default WishlistCountBadge
