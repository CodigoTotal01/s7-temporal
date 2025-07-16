// Configuración de Mercado Pago
export const MERCADOPAGO_CONFIG = {
  PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'TEST-12345678-1234-1234-1234-123456789012',
  ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  CURRENCY: 'PEN',
  COUNTRY: 'PE'
}

// URLs de Mercado Pago
export const MERCADOPAGO_URLS = {
  SANDBOX: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=',
  PRODUCTION: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id='
} 