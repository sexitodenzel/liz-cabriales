import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

type NominatimResult = {
  address?: {
    city?:         string
    town?:         string
    village?:      string
    municipality?: string
    county?:       string
    state?:        string
    postcode?:     string
  }
}

export async function GET(request: NextRequest) {
  const cp = request.nextUrl.searchParams.get("cp")?.trim()

  if (!cp || !/^\d{5}$/.test(cp)) {
    return NextResponse.json(
      { data: null, error: "Código postal inválido" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cp}&countrycodes=mx&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "LizCabriales-Checkout/1.0",
        },
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { data: null, error: "Código postal no encontrado" },
        { status: 404 }
      )
    }

    const json = (await res.json()) as NominatimResult[]
    const addr = json[0]?.address

    if (!addr?.state) {
      return NextResponse.json(
        { data: null, error: "Código postal no encontrado" },
        { status: 404 }
      )
    }

    const ciudad    = addr.city ?? addr.town ?? addr.village ?? ""
    const municipio = addr.municipality ?? addr.county ?? ciudad

    return NextResponse.json({
      data: {
        municipio,
        estado: addr.state,
        ciudad,
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: "Error al consultar el código postal" },
      { status: 500 }
    )
  }
}
