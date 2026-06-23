import type { AdminProductWithCategory } from "@/lib/supabase/admin"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function cell(value: string | number): string {
  const type = typeof value === "number" ? "Number" : "String"
  return `<Cell><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`
}

const HEADERS = [
  "PRODUCTO",
  "CÓDIGO",
  "MARCA",
  "CATEGORÍA",
  "SUBCATEGORÍA",
  "P.COSTO",
  "P.VENTA",
  "P.MAYOREO",
  "STOCK",
  "STOCK MÍN.",
  "ESTADO",
  "DEST.",
  "BEST SELLER",
] as const

function productToRow(product: AdminProductWithCategory): (string | number)[] {
  return [
    product.name,
    product.sku ?? "",
    product.brand ?? "",
    product.category.name,
    product.subcategory ?? "",
    product.cost_price ?? "",
    product.base_price,
    product.wholesale_price ?? "",
    product.stock,
    product.min_stock,
    product.is_active ? "Activo" : "Inactivo",
    product.is_featured ? "Sí" : "No",
    product.is_best_seller ? "Sí" : "No",
  ]
}

function buildSpreadsheetXml(products: AdminProductWithCategory[]): string {
  const headerRow = `<Row>${HEADERS.map((h) => cell(h)).join("")}</Row>`
  const dataRows = products
    .map((product) => {
      const row = productToRow(product)
      return `<Row>${row.map((value) => cell(value)).join("")}</Row>`
    })
    .join("")

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Inventario">
<Table>
${headerRow}
${dataRows}
</Table>
</Worksheet>
</Workbook>`
}

export function exportProductsToXls(
  products: AdminProductWithCategory[],
  filename?: string
): void {
  if (products.length === 0) return

  const date = new Date().toISOString().slice(0, 10)
  const downloadName = filename ?? `inventario-liz-cabriales-${date}.xls`
  const xml = buildSpreadsheetXml(products)
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = downloadName
  anchor.click()
  URL.revokeObjectURL(url)
}
