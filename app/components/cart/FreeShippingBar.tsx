import { FREE_SHIPPING_THRESHOLD_MXN } from "@/lib/constants/shipping"

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function FreeShippingBar({ amount }: { amount: number }) {
  const reached = amount >= FREE_SHIPPING_THRESHOLD_MXN
  const progress = Math.min((amount / FREE_SHIPPING_THRESHOLD_MXN) * 100, 100)
  const remaining = FREE_SHIPPING_THRESHOLD_MXN - amount

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between">
        {reached ? (
          <p className="text-[11px] font-semibold text-[#c9a84c]">
            ¡Envío gratis en tu pedido!
          </p>
        ) : (
          <p className="text-[11px] text-neutral-500">
            Te faltan{" "}
            <span className="font-semibold text-[#1a1a1a]">
              {formatMXN(remaining)}
            </span>{" "}
            para envío gratis
          </p>
        )}
        <p className="text-[10px] tabular-nums text-neutral-400">
          {formatMXN(FREE_SHIPPING_THRESHOLD_MXN)}
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-neutral-200">
        <div
          className="h-full bg-[#c9a84c] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
