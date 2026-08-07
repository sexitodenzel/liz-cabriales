import type { ReactNode } from "react"

type AdminPageHeaderProps = {
  /** Etiqueta corta arriba del título; por convención, el grupo del sidebar
   *  al que pertenece la sección (Tienda, Estudio, Contenido…). */
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  /** Botones/enlaces alineados a la derecha (crear, filtros, exportar…). */
  actions?: ReactNode
  /** Por defecto lleva una línea inferior que separa del contenido. */
  divider?: boolean
  className?: string
}

/**
 * Encabezado unificado del panel admin: eyebrow + título (grotesca display) +
 * descripción opcional + slot de acciones a la derecha. Reemplaza los tres
 * estilos de header que convivían por sección. Presentacional puro → sirve
 * igual en Server y Client Components.
 */
export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  divider = true,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        divider ? "border-b border-neutral-200 pb-6" : ""
      } ${className}`}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {eyebrow}
          </p>
        )}
        <h1
          className="mt-2 text-3xl font-medium tracking-tight text-neutral-900"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
