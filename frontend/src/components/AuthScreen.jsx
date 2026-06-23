import React, { useState } from 'react'
import { CheckCircle2, ShieldCheck, UsersRound, CircleDollarSign } from 'lucide-react'
import { api } from '../api'
import Field from './Field'

const emptyLogin = { email: '', password: '' }
const emptyRegister = {
  nom: '',
  email: '',
  password: '',
  telephone: '',
  numero_mobile: '',
  role: 'gestionnaire',
}

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await api.login(loginForm)
      localStorage.setItem('tontine_token', token.access_token)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitRegister(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api.register(registerForm)
      setMessage('Compte créé. Connectez-vous maintenant.')
      setMode('login')
      setLoginForm({ email: registerForm.email, password: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-ink">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_420px]">
        {/* Marketing side — hidden on mobile, visible on large screens */}
        <div className="hidden lg:block max-w-xl">
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-palm text-white shadow-sm">
              <CircleDollarSign size={20} />
            </div>
            <p className="text-base font-bold">TontineApp</p>
          </div>

          <h1 className="max-w-md text-4xl font-semibold leading-tight md:text-5xl">
            Gérez vos tontines simplement
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-black/75">
            Cotisations, cycles rotatifs, crédits et membres - tout en un seul endroit.
          </p>

          <div className="mt-8 space-y-4">
            <FeatureLine icon={UsersRound} color="bg-emerald-100 text-palm" text="Créez et gérez plusieurs groupes" />
            <FeatureLine icon={CheckCircle2} color="bg-sky-100 text-sky-700" text="Validez les cotisations et paiements" />
            <FeatureLine icon={ShieldCheck} color="bg-indigo-100 text-indigo-700" text="Accès sécurisé par rôle" />
          </div>
        </div>

        {/* Login/Register form — full width on mobile, right column on large screens */}
        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm w-full max-w-md mx-auto lg:max-w-none">
          <div className="mb-7 grid grid-cols-2 rounded-lg bg-[#f2efe9] p-1">
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'text-black/70'
              }`}
              onClick={() => setMode('login')}
              type="button"
            >
              Connexion
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === 'register' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'text-black/70'
              }`}
              onClick={() => setMode('register')}
              type="button"
            >
              Inscription
            </button>
          </div>

          {error ? <p className="mb-4 rounded-md bg-clay/10 p-3 text-sm font-medium text-clay">{error}</p> : null}
          {message ? <p className="mb-4 rounded-md bg-palm/10 p-3 text-sm font-medium text-palm">{message}</p> : null}

          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={submitLogin}>
              <Field label="Email">
                <input
                  className="input"
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  placeholder="vous@exemple.com"
                  required
                  type="email"
                  value={loginForm.email}
                />
              </Field>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-black/70">Mot de passe</span>
                  <button className="text-xs font-semibold text-palm" type="button">
                    Oublié ?
                  </button>
                </div>
                <input
                  className="input"
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={loginForm.password}
                />
              </div>
              <button className="btn-primary mt-2 w-full" disabled={loading} type="submit">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <p className="text-center text-sm text-black/70">
                Pas encore de compte ?{' '}
                <button className="font-semibold text-palm" onClick={() => setMode('register')} type="button">
                  Créer un compte
                </button>
              </p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitRegister}>
              <Field label="Nom complet">
                <input
                  className="input"
                  onChange={(event) => setRegisterForm({ ...registerForm, nom: event.target.value })}
                  required
                  value={registerForm.nom}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                  placeholder="vous@exemple.com"
                  required
                  type="email"
                  value={registerForm.email}
                />
              </Field>
              <Field label="Mot de passe">
                <input
                  className="input"
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                  required
                  type="password"
                  value={registerForm.password}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone">
                  <input
                    className="input"
                    onChange={(event) => setRegisterForm({ ...registerForm, telephone: event.target.value })}
                    value={registerForm.telephone}
                    required
                    type="tel"
                    placeholder="+237699001122"
                    pattern="\+?[0-9]{7,15}"
                    title="Numéro invalide - entre 7 et 15 chiffres, optionnellement débutant par +"
                  />
                </Field>
                <Field label="Mobile Money">
                  <input
                    className="input"
                    onChange={(event) => setRegisterForm({ ...registerForm, numero_mobile: event.target.value })}
                    value={registerForm.numero_mobile}
                  />
                </Field>
              </div>
              <Field label="Role">
                <select
                  className="input"
                  onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}
                  value={registerForm.role}
                >
                  <option value="gestionnaire">Gestionnaire</option>
                  <option value="membre">Membre</option>
                </select>
              </Field>
              <button className="btn-primary mt-2 w-full" disabled={loading} type="submit">
                {loading ? 'Création...' : 'Créer le compte'}
              </button>
              <p className="text-center text-sm text-black/70">
                Déjà un compte ?{' '}
                <button className="font-semibold text-palm" onClick={() => setMode('login')} type="button">
                  Se connecter
                </button>
              </p>
            </form>
          )}
        </section>
      </section>
    </main>
  )
}

function FeatureLine({ icon: Icon, color, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${color}`}>
        <Icon size={17} />
      </div>
      <p className="text-sm font-medium text-black/80">{text}</p>
    </div>
  )
}
