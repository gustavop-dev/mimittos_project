import Swal from 'sweetalert2'

import type { ColorUsage, SizeUsage } from '../types'

interface ConfirmDeleteArgs {
  entity: 'color' | 'talla'
  name: string
  impact: string[]
}

export function isConfirmationValid(input: string, name: string): boolean {
  return input.trim() === name.trim()
}

export function buildColorImpact(usage: ColorUsage): string[] {
  const lines: string[] = []
  if (usage.products > 0) lines.push(`Se quitará de ${usage.products} producto(s)`)
  if (usage.photos > 0) lines.push(`Se borrarán ${usage.photos} foto(s) de color`)
  if (usage.orders > 0) lines.push(`${usage.orders} pedido(s) conservarán el nombre como texto`)
  return lines
}

export function buildSizeImpact(usage: SizeUsage): string[] {
  const lines: string[] = []
  if (usage.products > 0) lines.push(`Se quitará de ${usage.products} producto(s)`)
  if (usage.orders > 0) lines.push(`${usage.orders} pedido(s) conservarán la talla como texto`)
  return lines
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function confirmDangerousDelete({ entity, name, impact }: ConfirmDeleteArgs): Promise<boolean> {
  const safeName = escapeHtml(name)
  const impactHtml = impact.length > 0
    ? `<ul style="text-align:left;margin:12px 0;padding-left:18px">${
        impact.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
      }</ul>`
    : '<p>Este color/talla no está en uso. Se puede eliminar de forma segura.</p>'

  const result = await Swal.fire({
    title: `Eliminar ${entity} «${name}»`,
    html: `${impactHtml}<p style="margin-top:8px">Para confirmar, escribe <b>${safeName}</b>:</p>`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: name,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: {
      popup: 'swal-mimittos',
      input: 'swal-mimittos-input',
      confirmButton: 'swal-mimittos-confirm',
      cancelButton: 'swal-mimittos-cancel',
    },
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton()
      const input = Swal.getInput()
      if (!confirmButton || !input) return
      confirmButton.disabled = true
      input.addEventListener('input', () => {
        confirmButton.disabled = !isConfirmationValid(input.value, name)
      })
    },
    preConfirm: (value: string) => {
      if (!isConfirmationValid(value ?? '', name)) {
        Swal.showValidationMessage('El nombre no coincide.')
        return false
      }
      return true
    },
  })

  return result.isConfirmed === true
}

export function notifyDeleteError(message: string): Promise<unknown> {
  return Swal.fire({
    title: 'No se pudo eliminar',
    text: message,
    icon: 'error',
    confirmButtonText: 'Entendido',
    customClass: { popup: 'swal-mimittos', confirmButton: 'swal-mimittos-confirm' },
  })
}
