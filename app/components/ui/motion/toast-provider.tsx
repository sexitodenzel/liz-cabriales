"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import {
  AnimatedToastStack,
  type AnimatedToast,
  type ToastInput,
  type ToastPosition,
} from "./animated-toast-stack"

// Singleton store al estilo sonner/react-hot-toast: permite llamar
// `toast.success("...")` desde cualquier handler sin Context ni prop-drill.
// El ToastViewport se suscribe vía useSyncExternalStore.

const DEFAULT_DURATION_SUCCESS = 3500
const DEFAULT_DURATION_ERROR = 4500
const DEFAULT_DURATION_INFO = 3500

let state: AnimatedToast[] = []
const listeners = new Set<() => void>()
const timers = new Map<string, number>()
let idCounter = 0

function emit() {
  for (const l of listeners) l()
}

function clearTimer(id: string) {
  const t = timers.get(id)
  if (t !== undefined) {
    window.clearTimeout(t)
    timers.delete(id)
  }
}

function scheduleDismiss(id: string, duration: number) {
  clearTimer(id)
  if (duration <= 0) return
  const handle = window.setTimeout(() => {
    timers.delete(id)
    internalDismiss(id)
  }, duration)
  timers.set(id, handle)
}

function internalDismiss(id: string) {
  if (!state.some((t) => t.id === id)) return
  state = state.filter((t) => t.id !== id)
  clearTimer(id)
  emit()
}

function push(input: ToastInput): string {
  const id = input.id ?? `toast-${Date.now()}-${idCounter++}`
  const toast: AnimatedToast = {
    duration: DEFAULT_DURATION_INFO,
    dismissible: true,
    ...input,
    id,
    createdAt: Date.now(),
  }
  state = [...state, toast]
  scheduleDismiss(id, toast.duration ?? 0)
  emit()
  return id
}

function update(id: string, patch: Partial<ToastInput>) {
  let changed: AnimatedToast | undefined
  state = state.map((t) => {
    if (t.id !== id) return t
    const next: AnimatedToast = {
      ...t,
      ...patch,
      id,
      createdAt:
        patch.duration === undefined ? t.createdAt : Date.now(),
    }
    changed = next
    return next
  })
  if (changed) scheduleDismiss(id, changed.duration ?? 0)
  emit()
}

function clear() {
  for (const id of timers.keys()) clearTimer(id)
  state = []
  emit()
}

export const toast = {
  message(title: ReactNode, opts?: Partial<Omit<ToastInput, "title">>) {
    return push({ title, ...opts })
  },
  success(title: ReactNode, opts?: Partial<Omit<ToastInput, "title" | "status">>) {
    return push({
      status: "success",
      duration: DEFAULT_DURATION_SUCCESS,
      title,
      ...opts,
    })
  },
  error(title: ReactNode, opts?: Partial<Omit<ToastInput, "title" | "status">>) {
    return push({
      status: "error",
      duration: DEFAULT_DURATION_ERROR,
      title,
      ...opts,
    })
  },
  info(title: ReactNode, opts?: Partial<Omit<ToastInput, "title" | "status">>) {
    return push({
      status: "info",
      duration: DEFAULT_DURATION_INFO,
      title,
      ...opts,
    })
  },
  loading(title: ReactNode, opts?: Partial<Omit<ToastInput, "title" | "status">>) {
    return push({ status: "loading", duration: 0, title, ...opts })
  },
  update(id: string, patch: Partial<ToastInput>) {
    update(id, patch)
  },
  dismiss(id: string) {
    internalDismiss(id)
  },
  clear,
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

function getServerSnapshot(): AnimatedToast[] {
  return EMPTY
}

const EMPTY: AnimatedToast[] = []

export interface ToastViewportProps {
  position?: ToastPosition
  maxVisible?: number
  className?: string
}

export function ToastViewport({
  position = "bottom-right",
  maxVisible = 4,
  className,
}: ToastViewportProps = {}) {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <AnimatedToastStack
      toasts={toasts}
      onDismiss={internalDismiss}
      position={position}
      maxVisible={maxVisible}
      fixed
      portal
      className={className}
    />
  )
}
