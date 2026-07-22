/**
 * Smoke de seguridad SOLO contra localhost.
 *
 * Uso:
 *   node scripts/security-smoke-local.mjs
 *   node scripts/security-smoke-local.mjs --base http://127.0.0.1:3000
 *
 * NUNCA apuntar a producción.
 */

const DEFAULT_BASE = "http://127.0.0.1:3000"

function parseArgs(argv) {
  let base = DEFAULT_BASE
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base" && argv[i + 1]) {
      base = argv[++i].replace(/\/$/, "")
    }
  }
  return { base }
}

function assertLocalOnly(base) {
  let url
  try {
    url = new URL(base)
  } catch {
    throw new Error(`URL base inválida: ${base}`)
  }
  const host = url.hostname.toLowerCase()
  const allowed =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  if (!allowed || url.protocol === "https:") {
    // Permitimos http localhost; bloqueamos cualquier host remoto.
  }
  if (!allowed) {
    throw new Error(
      `ABORTADO: este script solo puede correr contra localhost/127.0.0.1. Recibido: ${base}`
    )
  }
}

async function request(base, path, { method = "GET", body, headers = {} } = {}) {
  const started = Date.now()
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    text,
    json,
    ms: Date.now() - started,
  }
}

/** IP falsa solo para aislar buckets del rate-limit en memoria durante el smoke. */
function testIp(suite) {
  return {
    "X-Forwarded-For": `203.0.113.${suite}`,
    "X-Real-IP": `203.0.113.${suite}`,
  }
}

function printResult(name, pass, details) {
  const tag = pass ? "PASS" : "FAIL"
  console.log(`\n[${tag}] ${name}`)
  for (const line of details) {
    console.log(`  - ${line}`)
  }
  return pass
}

async function testRateLimit(base) {
  /**
   * El login con contraseña habla directo con Supabase Auth (no hay /api/login).
   * La primera puerta del flujo de login SÍ está en nuestra app:
   * POST /api/auth/check-email — límite 10/min/IP (rate limit corre ANTES de Turnstile).
   */
  const ipHeaders = testIp(10)
  const statuses = []
  for (let i = 1; i <= 12; i++) {
    const res = await request(base, "/api/auth/check-email", {
      method: "POST",
      headers: ipHeaders,
      body: {
        email: `security-smoke-${i}@example.com`,
        // Sin token: tras el rate limit respondería 403; nos importa el 429.
        turnstileToken: "",
      },
    })
    statuses.push(res.status)
  }

  const firstTen = statuses.slice(0, 10)
  const afterLimit = statuses.slice(10)
  const firstTenOk = firstTen.every((s) => s === 403 || s === 400 || s === 200)
  const got429 = afterLimit.includes(429)
  const pass = firstTenOk && got429

  return printResult(
    "1) Rate limiting en flujo de login (/api/auth/check-email)",
    pass,
    [
      `Estados 1–10: ${firstTen.join(", ")} (esperados: 403/400/200, no 429 aún)`,
      `Estados 11–12: ${afterLimit.join(", ")} (esperado: al menos un 429)`,
      got429
        ? "Se activó 429 después del límite de 10/min."
        : "NO se observó 429. El rate limit no se activó o el servidor reinició el bucket.",
      "Nota: signInWithPassword va a Supabase, no a una API propia; este test cubre la puerta de check-email del login.",
    ]
  )
}

async function testTurnstile(base) {
  const details = []
  let pass = true
  const ipHeaders = testIp(20)

  // A) Como pidió el usuario: /api/orders sin turnstileToken
  const orders = await request(base, "/api/orders", {
    method: "POST",
    headers: ipHeaders,
    body: {
      delivery_type: "pickup",
      // sin turnstileToken a propósito
    },
  })
  details.push(
    `POST /api/orders sin turnstileToken → ${orders.status} body=${JSON.stringify(orders.json)}`
  )

  // Sin sesión autenticada, la ruta autentica ANTES que Turnstile → 401.
  // Eso también es correcto (no procesa la orden), pero NO es el 403 de Turnstile.
  if (orders.status === 403) {
    details.push("Turnstile en /api/orders: 403 (ideal).")
  } else if (orders.status === 401) {
    details.push(
      "Turnstile en /api/orders: se obtuvo 401 (auth primero). La orden no se crea, pero este caso no prueba Turnstile."
    )
    // No falla el bloque completo; lo marcamos como hallazgo y validamos Turnstile en endpoints públicos.
  } else {
    pass = false
    details.push(`FAIL parcial: /api/orders respondió ${orders.status}; se esperaba 401 o 403.`)
  }

  // B) Endpoint público de Turnstile — prueba directa del 403
  const verify = await request(base, "/api/turnstile/verify", {
    method: "POST",
    headers: ipHeaders,
    body: {},
  })
  details.push(
    `POST /api/turnstile/verify sin token → ${verify.status} code=${verify.json?.error?.code ?? "?"}`
  )
  if (verify.status !== 403) {
    pass = false
    details.push("Se esperaba 403 en /api/turnstile/verify sin token.")
  }

  // C) check-email sin token (también público)
  const checkEmail = await request(base, "/api/auth/check-email", {
    method: "POST",
    headers: ipHeaders,
    body: { email: "smoke-turnstile@example.com" },
  })
  details.push(
    `POST /api/auth/check-email sin token → ${checkEmail.status} code=${checkEmail.json?.error?.code ?? "?"}`
  )
  if (checkEmail.status !== 403) {
    pass = false
    details.push("Se esperaba 403 en check-email sin token.")
  }

  return printResult("2) Turnstile (token ausente)", pass, details)
}

async function testInputValidation(base) {
  const payloads = [
    { label: "SQLi", value: "' OR '1'='1" },
    { label: "XSS", value: "<script>alert(1)</script>" },
  ]
  const details = []
  let pass = true
  const ipHeaders = testIp(30)

  for (const payload of payloads) {
    // Email en check-email
    const emailRes = await request(base, "/api/auth/check-email", {
      method: "POST",
      headers: ipHeaders,
      body: {
        email: payload.value,
        turnstileToken: "invalid-token-for-validation-order-test",
      },
    })
    details.push(
      `check-email [${payload.label}] → ${emailRes.status} msg=${emailRes.json?.error?.message ?? emailRes.text.slice(0, 120)}`
    )

    // Aceptable: 400 validación, 403 turnstile. NO aceptable: 500.
    // (Con token inválido Turnstile responde 403 antes de validar el email — también es seguro.)
    if (emailRes.status >= 500) {
      pass = false
      details.push(`FAIL: check-email reventó con ${emailRes.status} ante ${payload.label}.`)
    }
    if (![400, 403].includes(emailRes.status)) {
      details.push(
        `AVISO: check-email [${payload.label}] → ${emailRes.status} (esperado 400 o 403).`
      )
    }

    // No debe devolver HTML que ejecute el script (API JSON).
    if (
      emailRes.text.includes("<script>") &&
      !emailRes.text.includes("\\u003c") &&
      emailRes.headers["content-type"]?.includes("text/html")
    ) {
      pass = false
      details.push(`FAIL: respuesta HTML refleja <script> sin escapar (${payload.label}).`)
    }

    // Búsqueda pública
    const q = encodeURIComponent(payload.value)
    const searchRes = await request(base, `/api/products/search-suggestions?q=${q}`, {
      headers: ipHeaders,
    })
    details.push(
      `search-suggestions [${payload.label}] → ${searchRes.status}`
    )
    if (searchRes.status >= 500) {
      pass = false
      details.push(`FAIL: search-suggestions reventó con ${searchRes.status} ante ${payload.label}.`)
    }
    if (
      searchRes.text.includes("<script>alert(1)</script>") &&
      searchRes.headers["content-type"]?.includes("text/html")
    ) {
      pass = false
      details.push("FAIL: search reflejó XSS en HTML.")
    }

    // Confirmar que el JSON no “rompe” el parseo
    if (searchRes.status === 200 && searchRes.json === null) {
      pass = false
      details.push(`FAIL: search-suggestions no devolvió JSON válido ante ${payload.label}.`)
    }
  }

  // Cabeceras de seguridad básicas en la home (XSS defense in depth)
  const home = await request(base, "/")
  const csp = home.headers["content-security-policy"] || ""
  details.push(`GET / → ${home.status}; CSP presente=${Boolean(csp)}`)
  if (!csp) {
    pass = false
    details.push("FAIL: no hay Content-Security-Policy en /.")
  } else {
    details.push(`CSP (inicio): ${csp.slice(0, 140)}…`)
  }

  return printResult("3) Validación de inputs (SQLi / XSS)", pass, details)
}

async function main() {
  const { base } = parseArgs(process.argv.slice(2))
  assertLocalOnly(base)

  console.log("=== Security smoke (LOCAL ONLY) ===")
  console.log(`Base: ${base}`)
  console.log(`Hora: ${new Date().toISOString()}`)

  // Health
  try {
    const health = await request(base, "/")
    if (health.status >= 500) {
      console.error(`Servidor local respondió ${health.status}. Aborta.`)
      process.exit(2)
    }
    console.log(`Servidor OK (GET / → ${health.status})`)
  } catch (err) {
    console.error(`No se pudo conectar a ${base}:`, err.message)
    console.error("Arranca `npm run dev` y vuelve a intentar.")
    process.exit(2)
  }

  const results = []
  results.push(await testRateLimit(base))
  results.push(await testTurnstile(base))
  results.push(await testInputValidation(base))

  const passed = results.filter(Boolean).length
  const failed = results.length - passed
  console.log("\n=== RESUMEN ===")
  console.log(`PASS: ${passed}  FAIL: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Error inesperado:", err)
  process.exit(2)
})
