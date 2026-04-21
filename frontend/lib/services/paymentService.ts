import { api } from './http'

const WOMPI_API_URL = process.env.NEXT_PUBLIC_WOMPI_API_URL ?? 'https://sandbox.wompi.co/v1'
const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? ''

export type PaymentInfo = {
  order_number: string
  reference: string
  amount_in_cents: number
  currency: string
  deposit_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
}

export type PaymentResult = {
  status: 'APPROVED' | 'PENDING' | 'DECLINED' | 'ERROR' | string
  redirect_url: string
  wompi_id: string
}

export type PseBank = {
  financial_institution_code: string
  financial_institution_name: string
}

export type CardTokenData = {
  number: string
  cvc: string
  exp_month: string
  exp_year: string
  card_holder: string
}

export const paymentService = {
  getInfo: (orderNumber: string) =>
    api.get<PaymentInfo>(`/payment/info/${orderNumber}/`).then((r) => r.data),

  getPseBanks: () =>
    api.get<PseBank[]>('/payment/pse-banks/').then((r) => r.data),

  pollStatus: (orderNumber: string) =>
    api.get<PaymentInfo>(`/payment/info/${orderNumber}/`).then((r) => r.data),

  processCard: (orderNumber: string, cardToken: string) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'CARD',
        card_token: cardToken,
        installments: 1,
      })
      .then((r) => r.data),

  processNequi: (orderNumber: string, phoneNumber: string) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'NEQUI',
        phone_number: phoneNumber,
      })
      .then((r) => r.data),

  processPse: (
    orderNumber: string,
    bankCode: string,
    userType: number,
    userLegalIdType: string,
    userLegalId: string,
  ) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'PSE',
        bank_code: bankCode,
        user_type: userType,
        user_legal_id_type: userLegalIdType,
        user_legal_id: userLegalId,
      })
      .then((r) => r.data),

  processBancolombia: (
    orderNumber: string,
    userType: number,
    userLegalIdType: string,
    userLegalId: string,
  ) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'BANCOLOMBIA_TRANSFER',
        user_type: userType,
        user_legal_id_type: userLegalIdType,
        user_legal_id: userLegalId,
      })
      .then((r) => r.data),

  tokenizeCard: async (data: CardTokenData): Promise<string> => {
    const resp = await fetch(`${WOMPI_API_URL}/tokens/cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      const msg =
        err?.error?.messages?.number?.[0] ||
        err?.error?.messages?.cvc?.[0] ||
        err?.error?.messages?.exp_month?.[0] ||
        'Datos de tarjeta inválidos.'
      throw new Error(msg)
    }
    const json = await resp.json()
    return json.data.id as string
  },
}
