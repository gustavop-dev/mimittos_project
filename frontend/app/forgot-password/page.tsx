'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

import { useAuthStore } from '@/lib/stores/authStore'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { sendPasswordResetCode, resetPassword } = useAuthStore()

  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const pwStrength = (() => {
    let s = 0
    if (newPassword.length >= 8) s++
    if (/[A-Z]/.test(newPassword)) s++
    if (/[0-9]/.test(newPassword)) s++
    if (/[^A-Za-z0-9]/.test(newPassword)) s++
    return s
  })()
  const pwColor = pwStrength < 2 ? '#E53935' : pwStrength < 3 ? '#FB8C00' : pwStrength < 4 ? '#43A047' : '#2E7D32'
  const meterColors = [0, 1, 2, 3].map(i => i < pwStrength ? (pwStrength < 2 ? '#E53935' : pwStrength < 3 ? '#FB8C00' : pwStrength < 4 ? '#FDD835' : '#43A047') : 'rgba(27,42,74,.1)')

  const onSendCode = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await sendPasswordResetCode(email)
      setStep('reset')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el código')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (resendCooldown > 0) return
    try {
      await sendPasswordResetCode(email)
      setResendCooldown(60)
    } catch {
      // silently ignore
    }
  }

  const onResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ email, code, new_password: newPassword })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ background: 'linear-gradient(135deg,var(--cream-warm) 0%,var(--pink-melo) 100%)', minHeight: 'calc(100vh - 88px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {(['email', 'reset', 'done'] as const).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step === s ? 'var(--coral)' : (['email', 'reset', 'done'].indexOf(step) > i) ? '#E8F5E9' : 'rgba(27,42,74,.1)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: step === s ? '#fff' : (['email', 'reset', 'done'].indexOf(step) > i) ? '#2E7D32' : 'var(--gray-warm)', transition: 'all .3s' }}>
                {(['email', 'reset', 'done'].indexOf(step) > i) ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                ) : i + 1}
              </div>
              {i < 2 && <div style={{ width: 24, height: 2, background: (['email', 'reset', 'done'].indexOf(step) > i) ? 'var(--coral)' : 'rgba(27,42,74,.1)', transition: 'background .3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 20px 60px -20px rgba(27,42,74,.2)' }}>

          {step === 'email' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--cream-peach)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 24, color: 'var(--navy)', margin: '0 0 8px' }}>
                  ¿Olvidaste tu contraseña?
                </h1>
                <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6, margin: 0 }}>
                  Sin problema. Ingresa tu correo y te enviamos un código para crear una nueva contraseña.
                </p>
              </div>

              <form onSubmit={onSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Correo electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      autoFocus
                      style={inputStyle}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', padding: '8px 12px', borderRadius: 10 }}>{error}</p>}

                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? 'Enviando código...' : 'Enviar código →'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--cream-peach)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 24, color: 'var(--navy)', margin: '0 0 8px' }}>
                  Revisa tu correo
                </h1>
                <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6, margin: 0 }}>
                  Enviamos un código de 6 dígitos a<br />
                  <strong style={{ color: 'var(--navy)' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={onResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Código de verificación</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '0.3em', paddingLeft: 15 }}
                  />
                  <p style={{ fontSize: 12, color: 'var(--gray-warm)', marginTop: 6 }}>
                    Revisa también la carpeta de spam.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-warm)', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  </div>
                  {newPassword && (
                    <>
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        {meterColors.map((c, i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: c, transition: 'background .3s' }} />)}
                      </div>
                      <p style={{ fontSize: 11, color: pwColor, marginTop: 5 }}>
                        {pwStrength < 2 ? 'Contraseña débil' : pwStrength < 3 ? 'Contraseña media' : pwStrength < 4 ? 'Contraseña buena' : '¡Contraseña excelente! 💪'}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', padding: '8px 12px', borderRadius: 10 }}>{error}</p>}

                <button type="submit" disabled={loading || code.length < 6} style={btnPrimary(loading || code.length < 6)}>
                  {loading ? 'Actualizando...' : 'Crear nueva contraseña →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--gray-warm)' }}>
                ¿No recibiste el código?{' '}
                {resendCooldown > 0 ? (
                  <span>Reenviar en {resendCooldown}s</span>
                ) : (
                  <button onClick={onResend} style={{ background: 'none', border: 'none', color: 'var(--coral)', fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}>
                    Reenviar código
                  </button>
                )}
              </p>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E8F5E9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ fontSize: 14, color: 'var(--gray-warm)', lineHeight: 1.6, marginBottom: 28 }}>
                Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link
                href="/sign-in"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: 'var(--coral)', color: '#fff', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,132,138,.35)' }}
              >
                Iniciar sesión
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            </div>
          )}

          {step !== 'done' && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--gray-warm)' }}>
              ¿Ya tienes tu contraseña?{' '}
              <Link href="/sign-in" style={{ color: 'var(--coral)', fontWeight: 700 }}>Inicia sesión</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 15px 13px 44px', border: '1.5px solid rgba(27,42,74,.08)',
  borderRadius: 12, fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)',
  background: 'var(--cream-warm)', outline: 'none', boxSizing: 'border-box',
}

const iconStyle: React.CSSProperties = {
  position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
  color: 'var(--gray-warm)', width: 16, height: 16,
}

const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: 15, borderRadius: 999, background: 'var(--coral)', color: '#fff',
  border: 'none', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1,
})
