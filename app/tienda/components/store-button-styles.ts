const storeButtonHover =
  "transition-all duration-200 ease-out hover:bg-neutral-900 hover:text-white active:scale-[0.99] disabled:hover:bg-neutral-100 disabled:hover:text-neutral-400"

export const storeCardButtonClassName = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-2 py-2 text-[10px] font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

export const storeDetailButtonClassName = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-5 py-3 text-sm font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
].join(" ")

export const storeInlineButtonClassName = [
  "inline-flex items-center justify-center rounded-full border border-neutral-900 bg-white px-4 py-2 text-[11px] font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
].join(" ")

const storeCheckoutBase = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 font-normal uppercase tracking-wide text-white",
  "transition-all duration-200 ease-out hover:bg-neutral-800 active:scale-[0.99]",
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
].join(" ")

export const storeCheckoutButtonClassName = [
  storeCheckoutBase,
  "px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

export const storeCheckoutDetailButtonClassName = [
  storeCheckoutBase,
  "px-5 py-3 text-sm",
].join(" ")
