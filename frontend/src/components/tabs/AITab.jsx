import { useState, useRef, useEffect } from 'react'
import {
  Bot, Send, AlertTriangle, FileText, Bell, Activity,
  TrendingDown, Lightbulb, HelpCircle, List, Tag,
  Loader2, Sparkles, ChevronRight, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import { api } from '../../api'

const FEATURES = [
  { id: 'chat',       icon: Bot,          label: 'Assistant IA',        desc: 'Posez vos questions en langage naturel' },
  { id: 'loan_risk',  icon: AlertTriangle, label: 'Risque prêt',         desc: 'Analyse de risque avant approbation' },
  { id: 'report',     icon: FileText,      label: 'Résumé rapport',      desc: 'Résumé narratif du groupe' },
  { id: 'notifs',     icon: Bell,          label: 'Notifications IA',    desc: 'Messages personnalisés pour les membres' },
  { id: 'anomalies',  icon: Activity,      label: 'Détection anomalies', desc: 'Comportements atypiques dans le groupe' },
  { id: 'defaults',   icon: TrendingDown,  label: 'Prédiction défaillance', desc: 'Qui risque de ne pas payer ?' },
  { id: 'advice',     icon: Lightbulb,     label: 'Conseils financiers', desc: 'Recommandations personnalisées' },
  { id: 'qa',         icon: HelpCircle,    label: 'Q&A Règles',          desc: 'Questions sur les règles du groupe' },
  { id: 'order',      icon: List,          label: 'Ordre de tirage',     desc: 'Suggestion d\'ordre optimal' },
  { id: 'classify',   icon: Tag,           label: 'Classification',      desc: 'Catégoriser une demande automatiquement' },
]

const NOTIF_TYPES = [
  { value: 'rappel_cotisation', label: 'Rappel cotisation' },
  { value: 'retard',            label: 'Notification retard' },
  { value: 'bienvenue',         label: 'Message de bienvenue' },
  { value: 'encouragement',     label: 'Encouragement' },
]

const severiteColor = (s) => {
  if (s === 'haute') return 'text-red-600 bg-red-50 border-red-200'
  if (s === 'moyenne') return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-emerald-600 bg-emerald-50 border-emerald-200'
}

const risqueColor = (r) => {
  if (r === 'élevé') return 'text-red-600 bg-red-50'
  if (r === 'moyen') return 'text-amber-600 bg-amber-50'
  return 'text-emerald-600 bg-emerald-50'
}

const scoreColor = (score) => {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function GroupSelect({ groups, value, onChange, label = 'Groupe' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">— Sélectionner un groupe —</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.nom}</option>
        ))}
      </select>
    </div>
  )
}

function AIButton({ onClick, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
      {children}
    </button>
  )
}

function ResultBox({ children }) {
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
      {children}
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
      <XCircle size={15} className="mt-0.5 shrink-0" />
      {message}
    </div>
  )
}

// ── 1. Chatbot ──────────────────────────────────────────────────────────────
function ChatFeature({ groups }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant tontine. Posez-moi vos questions sur vos cotisations, emprunts ou cycles.' }
  ])
  const [input, setInput] = useState('')
  const [groupId, setGroupId] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const { reply } = await api.aiChat(userMsg, groupId ? Number(groupId) : undefined)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} label="Contexte groupe (optionnel)" />
      <div className="mt-3 flex-1 overflow-y-auto space-y-3 max-h-80 p-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 size={14} className="animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Posez votre question..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ── 2. Risque prêt ──────────────────────────────────────────────────────────
function LoanRiskFeature({ groups, members }) {
  const [groupId, setGroupId] = useState('')
  const [emprunteurId, setEmprunteurId] = useState('')
  const [montant, setMontant] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const groupMembers = members.filter((m) => m.statut === 'actif')

  const analyze = async () => {
    if (!groupId || !emprunteurId || !montant) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.aiLoanRisk(Number(groupId), Number(emprunteurId), Number(montant))
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Emprunteur</label>
        <select value={emprunteurId} onChange={(e) => setEmprunteurId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Sélectionner un membre —</option>
          {groupMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.utilisateur?.nom || `Membre #${m.id}`}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Montant demandé (FCFA)</label>
        <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)}
          placeholder="ex: 150000"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <AIButton onClick={analyze} loading={loading}>Analyser le risque</AIButton>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
            <div className={`text-4xl font-black ${scoreColor(result.score)}`}>{result.score}</div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Score de sécurité</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-black uppercase ${risqueColor(result.niveau)}`}>
                Risque {result.niveau}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2 font-bold text-sm">
              {result.recommandation === 'Approuver'
                ? <CheckCircle size={18} className="text-emerald-600" />
                : result.recommandation === 'Rejeter'
                ? <XCircle size={18} className="text-red-600" />
                : <AlertCircle size={18} className="text-amber-600" />}
              {result.recommandation}
            </div>
          </div>
          <ResultBox>{result.details}</ResultBox>
        </div>
      )}
    </div>
  )
}

// ── 3. Résumé rapport ──────────────────────────────────────────────────────
function ReportSummaryFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setResult('')
    try {
      const { resume } = await api.aiReportSummary(Number(groupId))
      setResult(resume)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <AIButton onClick={generate} loading={loading}>Générer le résumé</AIButton>
      {error && <ErrorBox message={error} />}
      {result && <ResultBox>{result}</ResultBox>}
    </div>
  )
}

// ── 4. Notifications IA ────────────────────────────────────────────────────
function NotificationsFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [type, setType] = useState('rappel_cotisation')
  const [result, setResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setResult([])
    try {
      const { messages } = await api.aiGenerateNotifications(Number(groupId), type)
      setResult(messages)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Type de notification</label>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {NOTIF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <AIButton onClick={generate} loading={loading}>Générer les messages</AIButton>
      {error && <ErrorBox message={error} />}
      {result.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.map((m, i) => (
            <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs font-black text-blue-600 mb-1">{m.nom}</div>
              <p className="text-sm text-slate-700">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 5. Anomalies ────────────────────────────────────────────────────────────
function AnomaliesFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [result, setResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const detect = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setResult([])
    try {
      const { anomalies } = await api.aiAnomalies(Number(groupId))
      setResult(anomalies)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <AIButton onClick={detect} loading={loading}>Analyser les anomalies</AIButton>
      {error && <ErrorBox message={error} />}
      {result.length === 0 && !loading && !error && groupId && (
        <p className="text-sm text-slate-400 mt-4">Aucune anomalie détectée ou analyse non lancée.</p>
      )}
      {result.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.map((a, i) => (
            <div key={i} className={`p-3 border rounded-xl ${severiteColor(a.severite)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wide">{a.type.replace(/_/g, ' ')}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border">{a.severite}</span>
              </div>
              {a.membre_nom && <div className="text-sm font-bold mb-1">{a.membre_nom}</div>}
              <p className="text-sm">{a.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 6. Prédiction défaillances ─────────────────────────────────────────────
function PredictDefaultsFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [result, setResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const predict = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setResult([])
    try {
      const { predictions } = await api.aiPredictDefaults(Number(groupId))
      setResult(predictions)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <AIButton onClick={predict} loading={loading}>Lancer la prédiction</AIButton>
      {error && <ErrorBox message={error} />}
      {result.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.map((p, i) => (
            <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
              <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-black uppercase ${risqueColor(p.risque)}`}>
                {p.risque}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-slate-800">{p.membre_nom}</div>
                <p className="text-xs text-slate-500 mt-0.5">{p.raison}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-lg font-black ${scoreColor(p.probabilite)}`}>{p.probabilite}%</div>
                <div className="text-[10px] text-slate-400">prob. paiement</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 7. Conseils financiers ─────────────────────────────────────────────────
function AdviceFeature() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAdvice = async () => {
    setLoading(true); setError(''); setResult('')
    try {
      const { conseils } = await api.aiFinancialAdvice()
      setResult(conseils)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">L'IA analyse votre historique d'épargne et vos contributions pour vous donner des conseils personnalisés.</p>
      <AIButton onClick={getAdvice} loading={loading}>Obtenir mes conseils</AIButton>
      {error && <ErrorBox message={error} />}
      {result && <ResultBox>{result}</ResultBox>}
    </div>
  )
}

// ── 8. Q&A Règles ───────────────────────────────────────────────────────────
function RulesQAFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ask = async () => {
    if (!groupId || !question.trim()) return
    setLoading(true); setError(''); setResult('')
    try {
      const { reponse } = await api.aiGroupQA(Number(groupId), question.trim())
      setResult(reponse)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Votre question</label>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="ex: Que se passe-t-il si je rate 2 cotisations ?"
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <AIButton onClick={ask} loading={loading}>Poser la question</AIButton>
      {error && <ErrorBox message={error} />}
      {result && <ResultBox>{result}</ResultBox>}
    </div>
  )
}

// ── 9. Ordre de tirage ──────────────────────────────────────────────────────
function SuggestOrderFeature({ groups }) {
  const [groupId, setGroupId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const suggest = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.aiSuggestOrder(Number(groupId))
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
      <AIButton onClick={suggest} loading={loading}>Générer la suggestion</AIButton>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="mt-4 space-y-3">
          {result.ordre?.length > 0 && (
            <div className="space-y-1.5">
              {result.ordre.map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {o.position}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800">{o.membre_nom}</div>
                    <p className="text-xs text-slate-500">{o.raison}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.explication && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-slate-600">
              <div className="text-xs font-black text-blue-600 mb-1 uppercase tracking-wide">Logique utilisée</div>
              {result.explication}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 10. Classification demandes ─────────────────────────────────────────────
function ClassifyFeature() {
  const [motif, setMotif] = useState('')
  const [type, setType] = useState('loan')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const classify = async () => {
    if (!motif.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.aiClassifyRequest(motif.trim(), type)
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const prioriteColor = (p) => {
    if (p === 'urgente') return 'bg-red-100 text-red-700 border-red-200'
    if (p === 'haute') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (p === 'normale') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Type de demande</label>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="loan">Demande de prêt</option>
          <option value="other">Demande de sortie / adhésion</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Motif de la demande</label>
        <textarea value={motif} onChange={(e) => setMotif(e.target.value)}
          placeholder="ex: J'ai besoin de financer les frais médicaux de ma mère hospitalisée..."
          rows={4}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <AIButton onClick={classify} loading={loading}>Classifier</AIButton>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-black uppercase">
              {result.categorie?.replace(/_/g, ' ')}
            </span>
            <span className={`px-2.5 py-1 border rounded-lg text-xs font-black uppercase ${prioriteColor(result.priorite)}`}>
              Priorité {result.priorite}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold">
              {result.sentiment}
            </span>
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Résumé</div>
            <p className="text-sm text-slate-700">{result.resume}</p>
          </div>
          {result.recommandation && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Recommandation IA</div>
              <p className="text-sm font-medium text-slate-800">{result.recommandation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function AITab({ groups = [], members = [] }) {
  const [activeFeature, setActiveFeature] = useState('chat')

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':      return <ChatFeature groups={groups} />
      case 'loan_risk': return <LoanRiskFeature groups={groups} members={members} />
      case 'report':    return <ReportSummaryFeature groups={groups} />
      case 'notifs':    return <NotificationsFeature groups={groups} />
      case 'anomalies': return <AnomaliesFeature groups={groups} />
      case 'defaults':  return <PredictDefaultsFeature groups={groups} />
      case 'advice':    return <AdviceFeature />
      case 'qa':        return <RulesQAFeature groups={groups} />
      case 'order':     return <SuggestOrderFeature groups={groups} />
      case 'classify':  return <ClassifyFeature />
      default:          return null
    }
  }

  const active = FEATURES.find((f) => f.id === activeFeature)

  return (
    <div className="flex gap-5 h-full">
      {/* Sidebar features */}
      <aside className="w-56 shrink-0 space-y-1">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Sparkles size={16} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">IA Fonctionnalités</span>
        </div>
        {FEATURES.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFeature(f.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              activeFeature === f.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <f.icon size={16} className="shrink-0" />
            <span className="text-xs font-bold truncate">{f.label}</span>
            {activeFeature === f.id && <ChevronRight size={12} className="ml-auto shrink-0" />}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-100">
          {active && (
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <active.icon size={20} className="text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="font-black text-slate-800">{active?.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{active?.desc}</p>
          </div>
        </div>
        {renderFeature()}
      </div>
    </div>
  )
}
