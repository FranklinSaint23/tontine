import React, { useState } from 'react';
import { Plus, Wallet, Sparkles, Loader2, AlertTriangle, CheckCircle, XCircle, AlertCircle, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import Field from '../Field';
import { api } from '../../api';

function AILoanPanel({ groupId, members = [] }) {
  const [tab, setTab] = useState('risk')
  const [emprunteurId, setEmprunteurId] = useState('')
  const [montant, setMontant] = useState('')
  const [riskResult, setRiskResult] = useState(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskError, setRiskError] = useState('')
  const [motif, setMotif] = useState('')
  const [classResult, setClassResult] = useState(null)
  const [classLoading, setClassLoading] = useState(false)
  const [classError, setClassError] = useState('')
  const [open, setOpen] = useState(false)

  const analyzeRisk = async () => {
    if (!emprunteurId || !montant) return
    setRiskLoading(true); setRiskError(''); setRiskResult(null)
    try {
      const data = await api.aiLoanRisk(Number(groupId), Number(emprunteurId), Number(montant))
      setRiskResult(data)
    } catch (err) { setRiskError(err.message) }
    finally { setRiskLoading(false) }
  }

  const classify = async () => {
    if (!motif.trim()) return
    setClassLoading(true); setClassError(''); setClassResult(null)
    try {
      const data = await api.aiClassifyRequest(motif.trim(), 'loan')
      setClassResult(data)
    } catch (err) { setClassError(err.message) }
    finally { setClassLoading(false) }
  }

  const scoreColor = (s) => s >= 70 ? 'text-emerald-600' : s >= 40 ? 'text-amber-600' : 'text-red-600'
  const prioriteColor = (p) => p === 'urgente' ? 'bg-red-100 text-red-700' : p === 'haute' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-800 text-sm">Analyse IA</h4>
            <p className="text-[10px] text-slate-400 font-bold">Risque prêt · Classification demande</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 font-black">{open ? 'Réduire ▲' : 'Ouvrir ▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex gap-1 mb-4">
            {[{ id: 'risk', label: 'Risque prêt' }, { id: 'classify', label: 'Classification' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'risk' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Emprunteur</label>
                <select value={emprunteurId} onChange={(e) => setEmprunteurId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner —</option>
                  {members.filter(m => m.statut === 'actif').map((m) => (
                    <option key={m.id} value={m.id}>{m.utilisateur?.nom || `Membre #${m.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Montant (FCFA)</label>
                <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)}
                  placeholder="ex: 150000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={analyzeRisk} disabled={riskLoading || !emprunteurId || !montant}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">
                {riskLoading ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                Analyser le risque
              </button>
              {riskError && <p className="text-xs text-red-600 mt-2">{riskError}</p>}
              {riskResult && (
                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black ${scoreColor(riskResult.score)}`}>{riskResult.score}</span>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Score sécurité</p>
                      <span className="text-xs font-black text-slate-700">Risque {riskResult.niveau}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs font-black">
                      {riskResult.recommandation === 'Approuver' ? <CheckCircle size={15} className="text-emerald-600" /> :
                       riskResult.recommandation === 'Rejeter' ? <XCircle size={15} className="text-red-600" /> :
                       <AlertCircle size={15} className="text-amber-600" />}
                      {riskResult.recommandation}
                    </div>
                  </div>
                  {riskResult.details && <p className="text-xs text-slate-600">{riskResult.details}</p>}
                </div>
              )}
            </div>
          )}
          {tab === 'classify' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Motif de la demande</label>
                <textarea value={motif} onChange={(e) => setMotif(e.target.value)}
                  placeholder="ex: J'ai besoin de financer les frais médicaux..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <button onClick={classify} disabled={classLoading || !motif.trim()}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">
                {classLoading ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
                Classifier
              </button>
              {classError && <p className="text-xs text-red-600 mt-2">{classError}</p>}
              {classResult && (
                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">{classResult.categorie?.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${prioriteColor(classResult.priorite)}`}>Priorité {classResult.priorite}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{classResult.sentiment}</span>
                  </div>
                  {classResult.resume && <p className="text-xs text-slate-700">{classResult.resume}</p>}
                  {classResult.recommandation && <p className="text-xs font-bold text-slate-800">{classResult.recommandation}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const today = new Date().toISOString().slice(0, 10)
const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const LoansTab = ({
  selectedGroup,
  setSelectedGroup,
  setActiveTab,
  loans = [],
  repayments = [],
  members = [],
  users = [],
  createLoan,
  approveLoan,
  confirmRepayment,
  createRepayment,
  groups = [],
  openGroup,
  loadGroupData,
  user,
}) => {
  const [loanForm, setLoanForm] = useState({ emprunteur_id: '', montant: '', taux_interet: '', date_demande: today, date_limite: monthLater })
  const [repayForm, setRepayForm] = useState({ emprunt_id: '', montant: '', numero_transaction: '' })
  const [loanError, setLoanError] = useState('')
  const [repayError, setRepayError] = useState('')
  const [loanSuccess, setLoanSuccess] = useState('')
  const [repaySuccess, setRepaySuccess] = useState('')
  const [savingLoan, setSavingLoan] = useState(false)
  const [savingRepay, setSavingRepay] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [showRepayForm, setShowRepayForm] = useState(false)

  const membersById = new Map(members.map((m) => [m.id, m]))
  const usersById = new Map(users.map((u) => [u.id, u]))
  const loansById = new Map(loans.map((l) => [l.id, l]))

  const isManager = selectedGroup && user && (selectedGroup.gestionnaire_id === user.id || user.role === 'super_admin')

  const getMemberName = (membershipId) => {
    const m = membersById.get(membershipId)
    if (!m) return `Membre #${membershipId}`
    const u = usersById.get(m.utilisateur_id)
    return u?.nom || `Membre #${membershipId}`
  }

  const handleCreateLoan = async (e) => {
    e.preventDefault()
    setLoanError(''); setLoanSuccess('')
    if (!loanForm.emprunteur_id) { setLoanError('Sélectionnez un emprunteur'); return }
    setSavingLoan(true)
    try {
      await createLoan(loanForm)
      setLoanSuccess('Demande d\'emprunt créée avec succès !')
      setLoanForm({ emprunteur_id: '', montant: '', taux_interet: '', date_demande: today, date_limite: monthLater })
      setShowLoanForm(false)
      if (selectedGroup && loadGroupData) await loadGroupData(selectedGroup.id)
    } catch (err) {
      setLoanError(err.message || 'Erreur lors de la création')
    } finally {
      setSavingLoan(false)
    }
  }

  const handleApproveLoan = async (loanId) => {
    try {
      await approveLoan(loanId)
      if (selectedGroup && loadGroupData) await loadGroupData(selectedGroup.id)
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'approbation')
    }
  }

  const handleCreateRepayment = async (e) => {
    e.preventDefault()
    setRepayError(''); setRepaySuccess('')
    if (!repayForm.emprunt_id) { setRepayError('Sélectionnez un emprunt'); return }
    setSavingRepay(true)
    try {
      await createRepayment(Number(repayForm.emprunt_id), { emprunt_id: Number(repayForm.emprunt_id), montant: repayForm.montant, numero_transaction: repayForm.numero_transaction })
      setRepaySuccess('Remboursement enregistré !')
      setRepayForm({ emprunt_id: '', montant: '', numero_transaction: '' })
      setShowRepayForm(false)
      if (selectedGroup && loadGroupData) await loadGroupData(selectedGroup.id)
    } catch (err) {
      setRepayError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSavingRepay(false)
    }
  }

  const handleConfirmRepayment = async (repaymentId) => {
    try {
      await confirmRepayment(repaymentId)
      if (selectedGroup && loadGroupData) await loadGroupData(selectedGroup.id)
    } catch (err) {
      alert(err.message || 'Erreur lors de la confirmation')
    }
  }

  const statusBadge = (statut) => {
    const map = { en_attente: 'bg-amber-100 text-amber-700', approuve: 'bg-emerald-100 text-emerald-700', rejete: 'bg-red-100 text-red-700', rembourse: 'bg-blue-100 text-blue-700', confirme: 'bg-emerald-100 text-emerald-700' }
    return map[statut] || 'bg-slate-100 text-slate-600'
  }

  if (!selectedGroup) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Wallet size={22} className="text-blue-600" /> Emprunts</h2>
        </div>
        {groups.length > 0 ? (
          <div className="grid gap-3">
            {groups.map((g) => (
              <button key={g.id} onClick={() => openGroup && openGroup(g)} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors text-left shadow-sm">
                <div>
                  <p className="font-bold text-slate-800">{g.nom}</p>
                  <p className="text-xs text-slate-500">{g.statut}</p>
                </div>
                <Wallet size={18} className="text-blue-400" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-black/10 shadow-sm p-8 text-center max-w-lg mx-auto">
            <Wallet size={48} className="mx-auto text-blue-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Sélectionnez un groupe</h3>
            <p className="text-gray-500 mb-6">Les emprunts et remboursements sont gérés par groupe.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors" onClick={() => setActiveTab('groups')}>
              Aller à Mes groupes
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Wallet size={22} className="text-blue-600" /> Emprunts</h2>
          <p className="text-sm text-gray-500">{selectedGroup.nom}</p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
              onClick={() => { setShowLoanForm((v) => !v); setLoanError(''); setLoanSuccess('') }}>
              <Plus size={16} /> Nouveau prêt
            </button>
          )}
          <button className="btn-ghost text-sm" onClick={() => { setSelectedGroup(null); setActiveTab('groups') }}>
            Retour
          </button>
        </div>
      </div>

      {/* New Loan Form */}
      {showLoanForm && isManager && (
        <section className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600" /> Nouvelle demande d'emprunt</h3>
          {loanError && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-2">{loanError}</p>}
          {loanSuccess && <p className="text-emerald-600 text-sm mb-3 bg-emerald-50 rounded-lg p-2">{loanSuccess}</p>}
          <form onSubmit={handleCreateLoan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Emprunteur">
              <select className="input w-full" required value={loanForm.emprunteur_id}
                onChange={(e) => setLoanForm({ ...loanForm, emprunteur_id: e.target.value })}>
                <option value="">— Choisir un membre —</option>
                {members.filter(m => m.statut === 'actif').map((m) => (
                  <option key={m.id} value={m.id}>{getMemberName(m.id)}</option>
                ))}
              </select>
            </Field>
            <Field label="Montant (FCFA)">
              <input className="input w-full" type="number" min="1" required placeholder="ex: 50000"
                value={loanForm.montant} onChange={(e) => setLoanForm({ ...loanForm, montant: e.target.value })} />
            </Field>
            <Field label="Taux d'intérêt (%)">
              <input className="input w-full" type="number" min="0" step="0.1" required placeholder="ex: 5"
                value={loanForm.taux_interet} onChange={(e) => setLoanForm({ ...loanForm, taux_interet: e.target.value })} />
            </Field>
            <Field label="Date limite de remboursement">
              <input className="input w-full" type="date" required
                value={loanForm.date_limite} onChange={(e) => setLoanForm({ ...loanForm, date_limite: e.target.value })} />
            </Field>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={savingLoan}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg transition-colors">
                {savingLoan ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Enregistrer
              </button>
              <button type="button" onClick={() => setShowLoanForm(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        </section>
      )}

      {/* Loans List */}
      <section className="bg-white rounded-xl border border-black/10 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">Emprunts ({loans.length})</h3>
        {loans.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 text-center">Aucun emprunt pour ce groupe.</p>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <article key={loan.id} className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">{getMemberName(loan.emprunteur_id)}</p>
                  <p className="text-sm text-slate-500">
                    {Number(loan.montant).toLocaleString('fr-FR')} FCFA · {loan.taux_interet}% · Total {Number(loan.montant_total_a_rembourser).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-slate-400">Limite : {loan.date_limite}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge(loan.statut)}`}>{loan.statut}</span>
                  {isManager && loan.statut === 'en_attente' && (
                    <button onClick={() => handleApproveLoan(loan.id)}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle size={13} /> Approuver
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Repayments */}
      <section className="bg-white rounded-xl border border-black/10 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Remboursements ({repayments.length})</h3>
          <button onClick={() => { setShowRepayForm((v) => !v); setRepayError(''); setRepaySuccess('') }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={14} /> Nouveau remboursement
          </button>
        </div>

        {showRepayForm && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {repayError && <p className="text-red-600 text-xs mb-2">{repayError}</p>}
            {repaySuccess && <p className="text-emerald-600 text-xs mb-2">{repaySuccess}</p>}
            <form onSubmit={handleCreateRepayment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Emprunt">
                <select className="input w-full text-sm" required value={repayForm.emprunt_id}
                  onChange={(e) => setRepayForm({ ...repayForm, emprunt_id: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {loans.filter(l => l.statut === 'approuve').map((l) => (
                    <option key={l.id} value={l.id}>#{l.id} · {getMemberName(l.emprunteur_id)} · {Number(l.montant).toLocaleString('fr-FR')} FCFA</option>
                  ))}
                </select>
              </Field>
              <Field label="Montant (FCFA)">
                <input className="input w-full text-sm" type="number" min="1" required placeholder="ex: 10000"
                  value={repayForm.montant} onChange={(e) => setRepayForm({ ...repayForm, montant: e.target.value })} />
              </Field>
              <Field label="N° Transaction">
                <input className="input w-full text-sm" required placeholder="ex: TXN-001"
                  value={repayForm.numero_transaction} onChange={(e) => setRepayForm({ ...repayForm, numero_transaction: e.target.value })} />
              </Field>
              <div className="sm:col-span-3 flex gap-2">
                <button type="submit" disabled={savingRepay}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                  {savingRepay ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Enregistrer
                </button>
                <button type="button" onClick={() => setShowRepayForm(false)} className="btn-ghost text-sm">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {repayments.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 text-center">Aucun remboursement enregistré.</p>
        ) : (
          <div className="space-y-3">
            {repayments.map((repayment) => {
              const loan = loansById.get(repayment.emprunt_id)
              return (
                <article key={repayment.id} className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{loan ? getMemberName(loan.emprunteur_id) : `Emprunt #${repayment.emprunt_id}`}</p>
                    <p className="text-sm text-slate-500">{Number(repayment.montant).toLocaleString('fr-FR')} FCFA · {repayment.numero_transaction}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge(repayment.statut)}`}>{repayment.statut}</span>
                    {isManager && repayment.statut === 'en_attente' && (
                      <button onClick={() => handleConfirmRepayment(repayment.id)}
                        className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        <CheckCircle size={13} /> Confirmer
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <AILoanPanel groupId={selectedGroup?.id} members={members} />
    </div>
  )
}

export default LoansTab;
