import type { TemplateComponent } from "./whatsapp-client"

export const TEMPLATE_NAMES = {
  PHONE_VERIFY_OTP: "phone_verify_otp",
  ADMIN_NEW_ORDER: "admin_new_order",
  ORDER_PRODUCTS_CONFIRMED: "order_products_confirmed",
  SHIPPING_PAYMENT_REQUEST: "shipping_payment_request",
  SHIPPING_PAID_ADMIN: "shipping_paid_admin",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
} as const

export type TemplateName = (typeof TEMPLATE_NAMES)[keyof typeof TEMPLATE_NAMES]

export const TEMPLATE_LANGUAGE = "es_MX"

function text(value: string) {
  return { type: "text" as const, text: value }
}

function body(...values: string[]): TemplateComponent {
  return { type: "body", parameters: values.map(text) }
}

// ─── Builders por plantilla ───────────────────────────────────────────────────

export function buildPhoneVerifyOtpComponents(code: string): TemplateComponent[] {
  return [body(code)]
}

export function buildAdminNewOrderComponents(
  orderShortId: string,
  total: string,
  clientName: string,
  deliveryLabel: string
): TemplateComponent[] {
  return [body(orderShortId, total, clientName, deliveryLabel)]
}

export function buildOrderProductsConfirmedComponents(
  firstName: string,
  orderShortId: string,
  total: string
): TemplateComponent[] {
  return [body(firstName, orderShortId, total)]
}

export function buildShippingPaymentRequestComponents(
  firstName: string,
  shippingAmount: string,
  orderShortId: string,
  paymentUrl: string
): TemplateComponent[] {
  return [body(firstName, shippingAmount, orderShortId, paymentUrl)]
}

export function buildShippingPaidAdminComponents(
  orderShortId: string,
  shippingAmount: string,
  clientName: string
): TemplateComponent[] {
  return [body(orderShortId, shippingAmount, clientName)]
}

export function buildOrderShippedComponents(
  firstName: string,
  orderShortId: string,
  carrier: string,
  trackingNumber: string
): TemplateComponent[] {
  return [body(firstName, orderShortId, carrier, trackingNumber)]
}

export function buildOrderDeliveredComponents(
  firstName: string,
  orderShortId: string
): TemplateComponent[] {
  return [body(firstName, orderShortId)]
}
