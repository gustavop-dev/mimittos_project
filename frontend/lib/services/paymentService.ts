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

export type AcceptanceTokens = {
  acceptance_token: string
  acceptance_permalink: string
  personal_auth_token: string
}

export const paymentService = {
  getInfo: (orderNumber: string) =>
    api.get<PaymentInfo>(`/payment/info/${orderNumber}/`).then((r) => r.data),

  getPseBanks: () =>
    api.get<PseBank[]>('/payment/pse-banks/').then((r) => r.data),

  pollStatus: (orderNumber: string) =>
    api.get<PaymentInfo>(`/payment/info/${orderNumber}/`).then((r) => r.data),

  getAcceptanceTokens: async (): Promise<AcceptanceTokens> => {
    const resp = await fetch(`${WOMPI_API_URL}/merchants/${WOMPI_PUBLIC_KEY}`)
    const json = await resp.json()
    const data = json.data ?? {}
    return {
      acceptance_token: data.presigned_acceptance?.acceptance_token ?? '',
      acceptance_permalink: data.presigned_acceptance?.permalink ?? '',
      personal_auth_token: data.presigned_personal_data_auth?.acceptance_token ?? '',
    }
  },

  processCard: (orderNumber: string, cardToken: string, acceptanceToken: string, personalAuthToken: string) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'CARD',
        card_token: cardToken,
        installments: 1,
        acceptance_token: acceptanceToken,
        acceptance_personal_auth_token: personalAuthToken,
      })
      .then((r) => r.data),

  processNequi: (orderNumber: string, phoneNumber: string, acceptanceToken: string, personalAuthToken: string) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'NEQUI',
        phone_number: phoneNumber,
        acceptance_token: acceptanceToken,
        acceptance_personal_auth_token: personalAuthToken,
      })
      .then((r) => r.data),

  processPse: (
    orderNumber: string,
    bankCode: string,
    userType: number,
    userLegalIdType: string,
    userLegalId: string,
    acceptanceToken: string,
    personalAuthToken: string,
  ) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'PSE',
        bank_code: bankCode,
        user_type: userType,
        user_legal_id_type: userLegalIdType,
        user_legal_id: userLegalId,
        acceptance_token: acceptanceToken,
        acceptance_personal_auth_token: personalAuthToken,
      })
      .then((r) => r.data),

  processBancolombia: (
    orderNumber: string,
    userType: number,
    userLegalIdType: string,
    userLegalId: string,
    acceptanceToken: string,
    personalAuthToken: string,
  ) =>
    api
      .post<PaymentResult>('/payment/process/', {
        order_number: orderNumber,
        method: 'BANCOLOMBIA_TRANSFER',
        user_type: userType,
        user_legal_id_type: userLegalIdType,
        user_legal_id: userLegalId,
        acceptance_token: acceptanceToken,
        acceptance_personal_auth_token: personalAuthToken,
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
      const msgs = err?.error?.messages ?? {}
      const msg = msgs.number?.[0] || msgs.cvc?.[0] || msgs.exp_month?.[0] || 'Datos de tarjeta inválidos.'
      throw new Error(msg)
    }
    const json = await resp.json()
    return json.data.id as string
  },
}
