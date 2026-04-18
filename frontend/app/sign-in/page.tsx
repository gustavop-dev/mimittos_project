'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FormEvent, useState, useEffect, useRef } from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import ReCAPTCHA from 'react-google-recaptcha'

import { useAuthStore } from '@/lib/stores/authStore'
import { api } from '@/lib/services/http'

type GoogleUser = {
  email: string
  given_name?: string
  family_name?: string
  picture?: string
}

export default function SignInPage() {
  const router = useRouter()
  const { signIn, googleLogin } = useAuthStore()

  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [siteKey, setSiteKey] = useState<string>('')
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => {
    api.get('google-captcha/site-key/')
      .then((res) => setSiteKey(res.data.site_key || ''))
      .catch(() => {})
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (siteKey && !captchaToken) {
      setError('Por favor completa el captcha')
      return
    }

    setLoading(true)

    try {
      await signIn({ email, password, captcha_token: captchaToken ?? undefined })
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos')
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true)
      setError('')

      if (!credentialResponse.credential) {
        setError('Error con Google')
        return
      }

      let decoded: GoogleUser | null = null
      try { decoded = jwtDecode<GoogleUser>(credentialResponse.credential) } catch { decoded = null }

      await googleLogin({
        credential: credentialResponse.credential,
        email: decoded?.email,
        given_name: decoded?.given_name,
        family_name: decoded?.family_name,
        picture: decoded?.picture,
      })

      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ background: 'linear-gradient(135deg,var(--cream-warm) 0%,var(--pink-melo) 100%)', minHeight: 'calc(100vh - 88px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '40px', gap: 48 }}>
      {/* Left — marketing */}
      <div>
        <div style={{ width: 120, height: 120, marginBottom: 28, animation: 'floatY 4s ease-in-out infinite', position: 'relative' }}>
          <Image src="/mimittos/logo-dark-big.png" alt="MIMITTOS" fill style={{ objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 44, color: 'var(--navy)', lineHeight: 1.1, marginBottom: 16 }}>
          Un club <em style={{ color: 'var(--coral)', fontStyle: 'normal' }}>tierno</em> para guardar tus recuerdos 🧸
        </h1>
        <p style={{ fontSize: 16, color: 'var(--gray-warm)', maxWidth: 440, lineHeight: 1.6, marginBottom: 32 }}>
          Crea tu cuenta para seguir el estado de cada peluche, guardar tus direcciones y recibir mimos exclusivos en fechas especiales.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /></svg>, title: 'Historial completo', desc: 'Revisa, repite y descarga facturas' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, title: 'Direcciones guardadas', desc: 'Checkout en 60 segundos' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>, title: 'Notificaciones', desc: 'Te avisamos cuando tu peluche esté listo' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(12px)', padding: '14px 18px', borderRadius: 16, maxWidth: 420 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--coral)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <strong style={{ display: 'block', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 14, marginBottom: 2 }}>{title}</strong>
                <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form card */}
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 20px 60px -20px rgba(27,42,74,.2)' }}>
        <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--navy)', marginBottom: 6 }}>¡Qué lindo verte de nuevo! 💕</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-warm)', marginBottom: 22 }}>Entra para ver el estado de tus peluches.</p>

        {/* Google login */}
        {hasGoogleClientId && (
          <div style={{ marginBottom: 22 }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Error al iniciar sesión con Google')} size="large" text="signin_with" shape="rectangular" width="100%" />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gray-warm)', fontSize: 12, fontWeight: 600, margin: '22px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(27,42,74,.1)' }} />
          o con correo
          <span style={{ flex: 1, height: 1, background: 'rgba(27,42,74,.1)' }} />
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-warm)', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sofia@ejemplo.com" required style={inputStyle} autoComplete="email" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-warm)', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-warm)', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 13 }}>
            <Link href="/forgot-password" style={{ color: 'var(--coral)', fontWeight: 700 }}>¿Olvidaste tu contraseña?</Link>
          </div>

          {siteKey && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA ref={recaptchaRef} sitekey={siteKey} onChange={(token) => setCaptchaToken(token)} onExpired={() => setCaptchaToken(null)} />
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', padding: '8px 12px', borderRadius: 10 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, borderRadius: 999, background: 'var(--coral)', color: '#fff', border: 'none', fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Entrando...' : <>Entrar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></svg></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-warm)' }}>
          ¿Aún no tienes cuenta? <Link href="/sign-up" style={{ color: 'var(--coral)', fontWeight: 700 }}>Regístrate gratis</Link>
        </p>
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
