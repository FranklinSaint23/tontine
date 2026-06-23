import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Banknote,
  Wallet,
  ShieldCheck,
  RefreshCcw,
  Bell,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  CircleDollarSign,
  Menu,
  X,
  Star,
  TrendingUp,
  Lock,
  Smartphone,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    title: 'Gestion de groupes',
    desc: 'Créez et administrez plusieurs tontines simultanément. Gérez les membres, les rôles et les cycles de chaque groupe indépendamment.',
  },
  {
    icon: Banknote,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Cotisations & paiements',
    desc: 'Suivez chaque cotisation en temps réel. Confirmez les paiements MTN MoMo / Orange Money et recevez des alertes de retard automatiques.',
  },
  {
    icon: RefreshCcw,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Cycles rotatifs',
    desc: 'Automatisez la rotation des bénéficiaires. Planifiez les cycles, désignez les bénéficiaires et clôturez les cycles en un clic.',
  },
  {
    icon: Wallet,
    color: 'bg-amber-50 text-amber-600',
    title: 'Crédits & remboursements',
    desc: "Accordez des prêts aux membres, suivez les remboursements et gérez les taux d'intérêt directement depuis la plateforme.",
  },
  {
    icon: Bell,
    color: 'bg-rose-50 text-rose-600',
    title: 'Notifications en temps réel',
    desc: "Soyez alerté de chaque cotisation reçue, demande d'adhésion ou retard. Approuvez ou rejetez les demandes en un clic.",
  },
  {
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600',
    title: 'Conseils IA intégrés',
    desc: 'Un assistant IA analyse vos données financières et vous propose des recommandations personnalisées pour optimiser votre épargne.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Créez votre compte',
    desc: "Inscription gratuite en moins d'une minute. Choisissez votre rôle : gestionnaire ou membre.",
  },
  {
    number: '02',
    title: 'Créez ou rejoignez un groupe',
    desc: "Créez votre tontine avec les règles que vous souhaitez, ou rejoignez un groupe existant via un code d'invitation.",
  },
  {
    number: '03',
    title: 'Gérez tout en un seul endroit',
    desc: 'Suivez les cotisations, les cycles et les crédits. Recevez des rapports détaillés à tout moment.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Marie K.',
    role: 'Gestionnaire de tontine',
    text: "Avant TontineApp, je gérais tout sur papier. Maintenant j'ai une vue claire sur chaque membre et chaque paiement. Un gain de temps considérable.",
    stars: 5,
  },
  {
    name: 'Paul N.',
    role: 'Membre actif',
    text: "Les notifications m'aident à ne jamais rater ma cotisation. Et voir mon score financier m'a motivé à rembourser plus vite.",
    stars: 5,
  },
  {
    name: 'Célestine T.',
    role: 'Coordinatrice',
    text: "Excellente application pour les groupes d'épargne. Interface claire, rapports complets. Je recommande à tous mes collègues.",
    stars: 5,
  },
]

export default function LandingPage({ onGetStarted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-800 font-[Inter,ui-sans-serif,system-ui]">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <CircleDollarSign size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-800">TontineApp</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <a href="#fonctionnalites" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#comment-ca-marche" className="hover:text-blue-600 transition-colors">Comment ça marche</a>
            <a href="#temoignages" className="hover:text-blue-600 transition-colors">Témoignages</a>
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2"
            >
              Se connecter
            </button>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Commencer gratuitement <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3">
            <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-600 py-2">Fonctionnalités</a>
            <a href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-600 py-2">Comment ça marche</a>
            <a href="#temoignages" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-600 py-2">Témoignages</a>
            <button
              onClick={onGetStarted}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-lg shadow-sm transition-all"
            >
              Commencer gratuitement
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 -left-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 right-1/3 w-48 h-48 bg-white/5 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles size={12} /> Propulsé par l'intelligence artificielle
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto">
            Gérez vos tontines<br />
            <span className="text-blue-200">simplement et en sécurité</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Cotisations, cycles rotatifs, crédits, membres et rapports — tout en un seul endroit.
            Fini les carnets et les tableurs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-8 py-4 rounded-xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
            >
              Créer un compte gratuit <ArrowRight size={18} />
            </button>
            <button
              onClick={onGetStarted}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-all text-base"
            >
              Se connecter
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-blue-200 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-300" /> 100% gratuit</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-300" /> Aucune carte bancaire requise</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-300" /> Données sécurisées</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-300" /> Support Mobile Money</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '100%', label: 'Gratuit' },
            { value: 'MTN & Orange', label: 'Mobile Money' },
            { value: 'IA intégrée', label: 'Conseils financiers' },
            { value: 'Multi-groupes', label: 'Gestion simultanée' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-blue-600">{s.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600">Fonctionnalités</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-800">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            Une plateforme complète pour gérer tous les aspects de votre tontine, sans installation ni configuration complexe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color} mb-4`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-extrabold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="comment-ca-marche" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Démarrage rapide</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-800">
              Opérationnel en 3 minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-blue-100" style={{ left: '20%', right: '20%' }} />

            {STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg mb-5 relative z-10">
                  {step.number}
                </div>
                <h3 className="font-extrabold text-slate-800 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={20} className="md:hidden text-blue-300 mt-4" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-4 rounded-xl shadow-md transition-all text-base inline-flex items-center gap-2"
            >
              Je commence maintenant <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: visual card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <p className="font-extrabold">Interface mobile-first</p>
                <p className="text-xs text-blue-200">Accès depuis n'importe quel appareil</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="font-extrabold">Rapports en temps réel</p>
                <p className="text-xs text-blue-200">Statistiques par groupe, membre et cycle</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-extrabold">Sécurité maximale</p>
                <p className="text-xs text-blue-200">Authentification JWT, accès par rôle</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-extrabold">IA Groq intégrée</p>
                <p className="text-xs text-blue-200">Prédiction des défauts, détection d'anomalies</p>
              </div>
            </div>
          </div>

          {/* Right: text */}
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Pourquoi TontineApp ?</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight">
              La fin des carnets<br />et des disputes
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Combien de fois avez-vous perdu la trace d'une cotisation ou oublié qui devait recevoir le pot ce mois-ci ?
              TontineApp automatise tout cela pour vous.
            </p>
            <ul className="space-y-3">
              {[
                'Traçabilité complète de chaque paiement',
                "Invitations par code — plus besoin d'appeler chacun",
                "Approbation des demandes d'adhésion en un tap",
                'Export PDF des rapports pour les assemblées',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 text-blue-600 font-extrabold text-sm hover:gap-3 transition-all"
            >
              Essayer maintenant <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section id="temoignages" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Témoignages</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-800">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white text-center">
        <div className="max-w-2xl mx-auto px-5 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Prêt à moderniser votre tontine ?
          </h2>
          <p className="text-blue-100 text-lg">
            Rejoignez TontineApp aujourd'hui. C'est gratuit, sécurisé et prêt en 3 minutes.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-10 py-4 rounded-xl shadow-lg transition-all text-base inline-flex items-center gap-2"
          >
            Créer mon compte <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <CircleDollarSign size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-white">TontineApp</span>
          </div>
          <p className="text-sm text-center">
            © {new Date().getFullYear()} TontineApp — Plateforme de gestion de tontines en ligne
          </p>
          <div className="flex gap-4 text-sm">
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Connexion</button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Inscription</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
