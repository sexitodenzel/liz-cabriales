"use client"

import Link from "next/link"

const baseClass =
  "shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] transition-colors"

const activeClass = `${baseClass} text-black underline underline-offset-4 decoration-1`
const inactiveClass = `${baseClass} text-neutral-600 hover:text-black`

type LinkTabProps = {
  as: "link"
  href: string
  active: boolean
  label: string
  navId?: string
}

type ButtonTabProps = {
  as: "button"
  onClick: () => void
  active: boolean
  label: string
  navId?: string
}

type AccountSubNavTabProps = LinkTabProps | ButtonTabProps

export const accountSubNavRowClass =
  "flex items-center gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

export default function AccountSubNavTab(props: AccountSubNavTabProps) {
  const navIdProp = props.navId ? { "data-nav-id": props.navId } : {}

  if (props.active) {
    if (props.as === "link") {
      return (
        <span className={activeClass} {...navIdProp}>
          {props.label}
        </span>
      )
    }

    return (
      <button
        type="button"
        onClick={props.onClick}
        className={activeClass}
        aria-current="page"
        {...navIdProp}
      >
        {props.label}
      </button>
    )
  }

  if (props.as === "link") {
    return (
      <Link href={props.href} className={inactiveClass} {...navIdProp}>
        {props.label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={props.onClick} className={inactiveClass} {...navIdProp}>
      {props.label}
    </button>
  )
}

export const accountSubNavInlineClass = inactiveClass
