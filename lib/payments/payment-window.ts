/**
 * Pestaña del pago de MercadoPago.
 *
 * Tiene que abrirse en el mismo tick del clic: si esperamos a que respondan
 * la creación de la orden y la preferencia, el navegador ya no lo considera
 * un gesto del usuario y bloquea la ventana.
 *
 * Como la URL real llega segundos después, la pestaña arranca en `about:blank`.
 * Eso se ve roto y da ganas de cerrarla, así que le escribimos un mensaje de
 * espera mientras tanto.
 */

const PLACEHOLDER_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Abriendo MercadoPago…</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        background: #fbfbfa;
        color: #1a1a1a;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        text-align: center;
        padding: 24px;
      }
      .ring {
        width: 32px;
        height: 32px;
        border: 2px solid #e4e4e4;
        border-top-color: #c6a75e;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .ring { animation: none; } }
      p { margin: 0; font-size: 15px; }
      small { color: #6b6b6b; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="ring"></div>
    <p>Preparando tu pago…</p>
    <small>No cierres esta pestaña, se abrirá MercadoPago en un momento.</small>
  </body>
</html>`

/** Abre la pestaña del pago. Llamar de forma síncrona dentro del handler del clic. */
export function reservePaymentWindow(): Window | null {
  const win = window.open("", "_blank")
  if (!win) return null
  try {
    win.document.write(PLACEHOLDER_HTML)
    win.document.close()
  } catch {
    /* Si el navegador no deja escribir en la pestaña, queda en blanco y ya. */
  }
  return win
}

/** Manda la pestaña reservada a MercadoPago. `false` si ya no está disponible. */
export function sendPaymentWindowTo(win: Window | null, url: string): boolean {
  if (!win || win.closed) return false
  win.location.href = url
  return true
}
