import type { ReactNode } from "react"

import type { OrderForDisplay } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/types"
import { orderStatusLabel } from "@/app/perfil/account-utils"

type Size = "small" | "large"

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const SIZE_TOKENS = {
  small: {
    container: "max-w-[440px]",
    padding: "px-6 py-7 sm:px-8",
    bodyText: "text-[13px]",
    title: "text-base tracking-[0.26em]",
    titleSub: "mt-1 text-[10px] tracking-[0.34em]",
    rows: "text-[12px]",
    rowsSpacing: "space-y-1",
    productList: "mt-2 space-y-2.5",
    productLabelHeader: "text-[10px] tracking-[0.2em]",
    productMeta: "text-[11px]",
    total: "text-[15px] tracking-[0.16em]",
    totalsRow: "text-[12px]",
    address: "text-[11px]",
    footer: "text-[10px] tracking-[0.3em]",
    footerSub: "mt-1 text-[10px] tracking-[0.2em]",
    dividerSpacing: "my-3",
    notchHeight: "h-3",
    notchSize: "16px 16px",
  },
  large: {
    container: "max-w-[680px]",
    padding: "px-8 py-10 sm:px-14 sm:py-14",
    bodyText: "text-[15px]",
    title: "text-xl tracking-[0.3em]",
    titleSub: "mt-2 text-[11px] tracking-[0.38em]",
    rows: "text-[14px]",
    rowsSpacing: "space-y-1.5",
    productList: "mt-3 space-y-4",
    productLabelHeader: "text-[11px] tracking-[0.22em]",
    productMeta: "text-[12px]",
    total: "text-[22px] tracking-[0.18em]",
    totalsRow: "text-[14px]",
    address: "text-[12px]",
    footer: "text-[11px] tracking-[0.32em]",
    footerSub: "mt-2 text-[11px] tracking-[0.22em]",
    dividerSpacing: "my-5",
    notchHeight: "h-4",
    notchSize: "22px 22px",
  },
} as const

function Divider({
  solid = false,
  spacing,
}: {
  solid?: boolean
  spacing: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`${spacing} border-t ${
        solid ? "border-neutral-800" : "border-dashed border-neutral-300"
      }`}
    />
  )
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={`uppercase tracking-[0.12em] ${
          strong ? "text-[#0a0a0a]" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right ${
          strong ? "font-semibold text-[#0a0a0a]" : "text-[#0a0a0a]"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function DigitalTicket({
  order,
  size = "small",
  footer: footerSlot,
}: {
  order: OrderForDisplay
  size?: Size
  footer?: ReactNode
}) {
  const t = SIZE_TOKENS[size]

  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )
  const shipping =
    order.delivery_type === "shipping"
      ? order.shipping_amount_final ?? order.shipping_cost ?? 0
      : 0
  const extras = Math.round(order.total - itemsSubtotal - shipping)
  const shortId = order.id.slice(0, 8).toUpperCase()

  const footer =
    order.status === "cancelled"
      ? {
          primary: "Pedido cancelado",
          secondary: "Puedes intentar de nuevo cuando quieras",
        }
      : order.status === "pending"
        ? {
            primary: "Pago pendiente",
            secondary: "Completa tu pago para procesar el pedido",
          }
        : {
            primary: "Gracias por tu compra",
            secondary: "Te esperamos pronto",
          }

  return (
    <div
      className={`mx-auto w-full ${t.container} overflow-hidden border border-neutral-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07),0_8px_28px_rgba(0,0,0,0.04)]`}
    >
      <div
        className={`${t.padding} font-mono ${t.bodyText} leading-relaxed text-[#0a0a0a]`}
      >
        <div className="text-center">
          <p className={`font-semibold ${t.title}`}>LIZ CABRIALES</p>
          <p className={`uppercase text-neutral-500 ${t.titleSub}`}>
            Studio · Ticket digital
          </p>
        </div>

        <Divider spacing={t.dividerSpacing} />

        <div className={`${t.rowsSpacing} ${t.rows}`}>
          <Row label="Orden" value={`#${shortId}`} />
          <Row
            label="Fecha"
            value={new Date(order.created_at).toLocaleString("es-MX", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          />
          <Row
            label="Estado"
            value={orderStatusLabel(order.status as OrderStatus)}
          />
        </div>

        <Divider spacing={t.dividerSpacing} />

        <div
          className={`flex justify-between uppercase text-neutral-400 ${t.productLabelHeader}`}
        >
          <span>Producto</span>
          <span>Importe</span>
        </div>
        <ul className={t.productList}>
          {order.items.map((item) => (
            <li key={item.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="pr-2 text-[#0a0a0a]">{item.product_name}</span>
                <span className="whitespace-nowrap font-semibold text-[#0a0a0a]">
                  {formatPrice(item.quantity * item.unit_price)}
                </span>
              </div>
              <div className={`text-neutral-500 ${t.productMeta}`}>
                {item.quantity} x {formatPrice(item.unit_price)}
                {item.variant_name && item.variant_name !== item.product_name
                  ? ` · ${item.variant_name}`
                  : ""}
              </div>
            </li>
          ))}
        </ul>

        <Divider spacing={t.dividerSpacing} />

        <div className={`${t.rowsSpacing} ${t.totalsRow}`}>
          <Row label="Subtotal" value={formatPrice(itemsSubtotal)} />
          {order.delivery_type === "shipping" && (
            <Row
              label="Envio"
              value={shipping > 0 ? formatPrice(shipping) : "Por calcular"}
            />
          )}
          {extras > 0 && (
            <Row label="Factura / ajustes" value={formatPrice(extras)} />
          )}
        </div>

        <Divider solid spacing={t.dividerSpacing} />

        <div
          className={`flex items-baseline justify-between gap-3 ${t.total}`}
        >
          <span className="font-semibold uppercase">Total</span>
          <span className="font-bold">{formatPrice(order.total)}</span>
        </div>

        <Divider spacing={t.dividerSpacing} />

        <div className={`${t.rowsSpacing} ${t.totalsRow}`}>
          <Row
            label="Entrega"
            value={
              order.delivery_type === "shipping"
                ? "Envio a domicilio"
                : "Retiro en local"
            }
          />
          {order.carrier && <Row label="Paqueteria" value={order.carrier} />}
          {order.tracking_number && (
            <Row label="Guia" value={order.tracking_number} />
          )}
        </div>

        {order.delivery_type === "shipping" && order.shipping_address && (
          <div className={`mt-3 text-neutral-500 ${t.address}`}>
            <p className="uppercase tracking-[0.12em] text-neutral-400">
              Direccion
            </p>
            <p className="mt-1 whitespace-pre-line text-[#0a0a0a]">
              {order.shipping_address}
            </p>
            {order.shipping_city && order.shipping_state && (
              <p className="text-[#0a0a0a]">
                {order.shipping_city}, {order.shipping_state}
              </p>
            )}
          </div>
        )}

        <Divider spacing={t.dividerSpacing} />

        <p
          className={`text-center uppercase text-neutral-500 ${t.footer}`}
        >
          {footer.primary}
        </p>
        <p
          className={`text-center uppercase text-neutral-400 ${t.footerSub}`}
        >
          {footer.secondary}
        </p>

        {footerSlot}
      </div>

      <div
        aria-hidden="true"
        className={`${t.notchHeight} w-full bg-neutral-100`}
        style={{
          backgroundImage:
            "linear-gradient(135deg, #ffffff 50%, transparent 50%), linear-gradient(225deg, #ffffff 50%, transparent 50%)",
          backgroundSize: t.notchSize,
          backgroundPosition: "left bottom",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  )
}
