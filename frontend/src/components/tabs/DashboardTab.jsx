import React, { useState } from 'react';
import { api } from '../../api';
import {
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  UserPlus,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Landmark,
  Calendar,
  X,
  ArrowRight,
  LogOut,
  RefreshCcw,
  User,
  Bell,
  AlertCircle,
  Lightbulb,
  Loader2,
  Sparkles
} from 'lucide-react';
import Field from '../Field';

function AIAdviceCard() {
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const getAdvice = async () => {
    setLoading(true); setError(''); setAdvice('')
    setOpen(true)
    try {
      const { conseils } = await api.aiFinancialAdvice()
      setAdvice(conseils)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Conseils IA</h4>
            <p className="text-[10px] text-slate-400 font-bold">Recommandations personnalisées</p>
          </div>
        </div>
        <button
          onClick={getAdvice}
          disabled={loading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
          {loading ? 'Analyse...' : 'Obtenir des conseils'}
        </button>
      </div>
      {open && (
        <div className="mt-3 text-xs text-slate-700 leading-relaxed">
          {loading && <p className="text-slate-400 italic">L'IA analyse votre profil...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {advice && <p className="whitespace-pre-wrap">{advice}</p>}
        </div>
      )}
    </div>
  )
}

const DashboardTab = ({
  dashboardStats,
  recentActivity = [],
  notifications = [],
  notificationsLoading = false,
  setNotificationsOpen,
  statsLoading = false,
  groups = [],
  user = {},
  onRefresh,
  onLogout,
  setActiveTab,
  groupForm,
  setGroupForm,
  saving,
  error,
  setError,
  submitGroup,
  joinRequestForm,
  setJoinRequestForm,
  joinRequestMessage,
  joinRequestError,
  savingJoinRequest,
  submitJoinRequest,
  exitRequestForm,
  setExitRequestForm,
  exitRequestMessage,
  exitRequestError,
  savingExitRequest,
  submitExitRequest,
  openGroup,
  openGroupForCotisations,
  declarePayment,
  formatCurrency,
  api
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const canCreateGroup = user?.role === 'gestionnaire' || user?.role === 'super_admin' || user?.role === 'admin';

  // Dynamic date in French
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };



  // Activities to display
  const activitiesToDisplay = recentActivity && recentActivity.length > 0 
    ? recentActivity.map(item => {
        const isConfirmed = item.statut === 'confirme' || item.statut === 'approuve' || item.statut === 'rembourse';
        const isLate = item.statut === 'retard';
        return {
          id: item.id,
          type: item.type === 'contribution' ? (isConfirmed ? 'contribution' : (isLate ? 'late' : 'pending')) : 'pending',
          titre: item.titre,
          description: `${item.description}${item.groupe ? ` · ${item.groupe}` : ''}`,
          date: new Date(item.date).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          statut: item.statut === 'confirme' ? 'Confirmé' : item.statut === 'en_attente' ? 'En attente' : item.statut === 'retard' ? 'Retard' : item.statut
        };
      })
    : [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Banner / Header area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Vue d'ensemble
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            {getFormattedDate()} — Résumé de vos tontines
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg font-bold text-slate-700 shadow-sm transition-all text-sm flex items-center gap-2"
          >
            <UserPlus size={16} className="text-slate-500" />
            Rejoindre / Quitter
          </button>
          
          {canCreateGroup ? (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Nouveau groupe
            </button>
          ) : null}
        </div>
      </div>

      {/* 4 Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Groupes actifs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <span className="text-sm font-bold text-blue-600 uppercase tracking-wider block">Groupes actifs</span>
          <p className="text-4xl font-extrabold text-slate-850 mt-3 tracking-tight">
            {dashboardStats?.groupes_actifs || 0}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">
            {groups ? groups.filter(g => g.type === 'rotatif').length : 0} rotatif(s) · {groups ? groups.filter(g => g.type === 'credit').length : 0} crédit(s) · {groups ? groups.filter(g => g.type === 'les_deux').length : 0} mixte(s)
          </p>
        </div>

        {/* Stat 2: Membres actifs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider block">Membres actifs</span>
          <p className="text-4xl font-extrabold text-slate-855 mt-3 tracking-tight">
            {dashboardStats?.membres_actifs || 0}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">
            Tous groupes confondus
          </p>
        </div>

        {/* Stat 3: Cotisations en attente */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <span className="text-sm font-bold text-amber-600 uppercase tracking-wider block">Cotisations en attente</span>
          <p className="text-4xl font-extrabold text-slate-855 mt-3 tracking-tight">
            {dashboardStats?.cotisations_en_attente || 0}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">
            À confirmer cette semaine
          </p>
        </div>

        {/* Stat 4: Caisse totale */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
          <span className="text-sm font-bold text-purple-600 uppercase tracking-wider block">Caisse totale</span>
          <p className="text-4xl font-extrabold text-slate-855 mt-3 tracking-tight">
            {formatCurrency(dashboardStats?.caisse_totale || 0)}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">
            FCFA — tous groupes
          </p>
        </div>
      </div>

      {/* Advanced dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Collecte ce mois</span>
            <TrendingUp size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-850">
            {formatCurrency(dashboardStats?.collecte_ce_mois || 0)}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">Total des cotisations validées ce mois</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Emprunts en cours</span>
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-850">
            {dashboardStats?.emprunts_en_cours_count || 0}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">Total emprunts ouverts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Taux de paiement</span>
            <Clock size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-850">
            {dashboardStats?.taux_paiement ?? 0}%
          </p>
          <p className="text-xs text-slate-400 font-bold mt-4">Part des cotisations validées</p>
        </div>
      </div>

      {/* Main Double Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Activity (Grid span 7) */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-7">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
            <h3 className="text-lg font-extrabold text-slate-855 flex items-center gap-2">
              <Activity size={20} className="text-blue-600 animate-pulse" />
              Activité récente
            </h3>
            <button 
              onClick={() => setActiveTab('reports')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors uppercase tracking-wider"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-5">
            {activitiesToDisplay.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-semibold text-slate-400">Aucune activité récente.</p>
              </div>
            ) : activitiesToDisplay.map((item, index) => {
              // Icon styling depending on action type
              let iconBg = 'bg-slate-50 text-slate-600';
              let icon = <Clock size={16} />;
              let badgeStyle = 'bg-slate-100 text-slate-700';

              if (item.type === 'contribution') {
                iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                icon = <CheckCircle2 size={16} />;
                badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
              } else if (item.type === 'pending') {
                iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
                icon = <Clock size={16} />;
                badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-100';
              } else if (item.type === 'new_member') {
                iconBg = 'bg-blue-50 text-blue-600 border border-blue-100';
                icon = <UserPlus size={16} />;
                badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-100';
              } else if (item.type === 'late') {
                iconBg = 'bg-red-50 text-red-600 border border-red-100';
                icon = <AlertTriangle size={16} />;
                badgeStyle = 'bg-red-50 text-red-700 border border-red-100';
              }

              return (
                <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-slate-50/50 transition-all border border-transparent hover:border-slate-50" key={index}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} shadow-sm`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-extrabold text-slate-800 text-sm leading-tight truncate">{item.titre}</p>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-wide bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-1 tracking-wide">{item.description}</p>
                  </div>
                  <span className={`h-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 ${badgeStyle}`}>
                    {item.statut}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Mes groupes (Grid span 5) */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
              <h3 className="text-lg font-extrabold text-slate-855 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Mes groupes
              </h3>
              <button 
                onClick={() => setActiveTab('groups')} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors uppercase tracking-wider"
              >
                Gérer
              </button>
            </div>

            <div className="space-y-6">
              {!groups || groups.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-400">Aucun groupe pour le moment.</p>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm"
                  >
                    Créer un groupe
                  </button>
                </div>
              ) : (
                groups.slice(0, 3).map((group) => {
                  const progressPct = group.progres_pourcentage || 0;
                  const progressColor = progressPct >= 75 ? 'bg-emerald-600' : progressPct >= 40 ? 'bg-blue-600' : 'bg-amber-500';
                  const membersCount = group.membres_count || 0;
                  const isManager = group?.gestionnaire_id === user?.id;

                  return (
                    <article 
                      key={group.id} 
                      onClick={() => { openGroup(group); setActiveTab('groups'); }}
                      className="group cursor-pointer border border-transparent hover:border-slate-100 hover:bg-slate-50/30 p-3 rounded-xl transition-all space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                            {group.nom}
                          </h4>
                          <p className="text-xs text-gray-400 font-bold mt-1.5 tracking-wide">
                            {membersCount} membres · {formatCurrency(group.montant_cotisation)} FCFA · {group.frequence}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isManager 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {isManager ? 'Gérant' : 'Membre'}
                        </span>
                      </div>
                      
                      {/* Dynamic completion bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Progression</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${progressPct === 10 ? 'bg-orange-500' : progressColor}`} style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <AIAdviceCard />

      {/* Bottom 3 Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bottom Card 1: Prochain bénéficiaire */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
            <User size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Prochain bénéficiaire</span>
            {dashboardStats?.prochain_beneficiaire_nom ? (
              <>
                <p className="text-lg font-extrabold text-slate-800 mt-1 leading-tight">
                  {dashboardStats.prochain_beneficiaire_nom}
                </p>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  Groupe {dashboardStats.prochain_beneficiaire_groupe || '—'} · Cycle {dashboardStats.prochain_beneficiaire_cycle || 1}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-slate-500 mt-1">
                Aucun cycle en cours
              </p>
            )}
          </div>
        </div>

        {/* Bottom Card 2: Collecté ce mois */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Collecté ce mois</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
              {formatCurrency(dashboardStats?.collecte_ce_mois || 0)}
            </p>
            <p className="text-xs text-gray-400 font-bold mt-1">FCFA</p>
          </div>
        </div>

        {/* Bottom Card 3: Emprunts en cours */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
            <Landmark size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Emprunts en cours</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
              {dashboardStats?.emprunts_en_cours_count || 0}
            </p>
            <p className="text-xs text-gray-400 font-bold mt-1">
              Total : {formatCurrency(dashboardStats?.emprunts_en_cours_montant || 0)} FCFA
            </p>
          </div>
        </div>
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2.5 mb-5">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Plus size={18} />
              </span>
              <h3 className="font-extrabold text-slate-855 text-base">Créer un nouveau groupe de tontine</h3>
            </div>

            {error ? (
              <p className="mb-4 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </p>
            ) : null}

            <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await submitGroup(groupForm); if (!error) setIsCreateModalOpen(false); }}>
              <Field label="Nom de la tontine">
                <input 
                  className="input w-full" 
                  placeholder="Ex: Groupe Cuisine, Épargne Collègues..."
                  onChange={e => setGroupForm({...groupForm, nom: e.target.value})} 
                  value={groupForm.nom} 
                  required 
                />
              </Field>
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="Montant cotisation (FCFA)">
                  <input 
                    className="input w-full" 
                    type="number" 
                    placeholder="Ex: 5000"
                    onChange={e => setGroupForm({...groupForm, montant_cotisation: e.target.value})} 
                    value={groupForm.montant_cotisation} 
                    required 
                  />
                </Field>
                <Field label="Date de début">
                  <input 
                    className="input w-full" 
                    type="date" 
                    onChange={e => setGroupForm({...groupForm, date_debut: e.target.value})} 
                    value={groupForm.date_debut} 
                    required 
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Fréquence">
                  <select 
                    className="input w-full" 
                    onChange={e => setGroupForm({...groupForm, frequence: e.target.value})} 
                    value={groupForm.frequence}
                  >
                    <option value="hebdo">Hebdomadaire</option>
                    <option value="mensuel">Mensuelle</option>
                  </select>
                </Field>
                <Field label="Type de tontine">
                  <select 
                    className="input w-full" 
                    onChange={e => setGroupForm({...groupForm, type: e.target.value})} 
                    value={groupForm.type}
                  >
                    <option value="rotatif">Rotatif</option>
                    <option value="credit">Crédit</option>
                    <option value="les_deux">Les deux</option>
                  </select>
                </Field>
              </div>

              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-2" 
                disabled={saving} 
                type="submit"
              >
                {saving ? 'Création en cours...' : 'Créer le groupe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN / EXIT MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up">
            <button 
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2.5 mb-5">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={18} />
              </span>
              <h3 className="font-extrabold text-slate-855 text-base">Adhésion / Options de sortie</h3>
            </div>

            <div className="space-y-6">
              {/* Join form */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rejoindre avec un code d'invitation</h4>
                {joinRequestMessage ? <p className="text-xs text-emerald-600 font-bold">{joinRequestMessage}</p> : null}
                {joinRequestError ? <p className="text-xs text-rose-600 font-bold">{joinRequestError}</p> : null}
                <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await submitJoinRequest(joinRequestForm); if (!joinRequestError) setJoinRequestForm({...joinRequestForm, code_invitation: ''}); }}>
                  <input 
                    className="input flex-1" 
                    placeholder="Entrez le code d'invitation..." 
                    onChange={e => setJoinRequestForm({...joinRequestForm, code_invitation: e.target.value.toUpperCase()})} 
                    value={joinRequestForm.code_invitation} 
                    required 
                  />
                  <button 
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-4 rounded-lg text-sm font-bold transition-all shrink-0" 
                    disabled={savingJoinRequest} 
                    type="submit"
                  >
                    Valider
                  </button>
                </form>
              </div>

              {/* Exit form */}
              <div className="space-y-3 border-t border-slate-50 pt-5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quitter un groupe de tontine</h4>
                {exitRequestMessage ? <p className="text-xs text-emerald-600 font-bold">{exitRequestMessage}</p> : null}
                {exitRequestError ? <p className="text-xs text-rose-600 font-bold">{exitRequestError}</p> : null}
                <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await submitExitRequest(exitRequestForm); }}>
                  <select 
                    className="input flex-1 font-semibold text-slate-700" 
                    onChange={e => setExitRequestForm({...exitRequestForm, groupe_id: e.target.value})} 
                    value={exitRequestForm.groupe_id} 
                    required
                  >
                    <option value="">Sélectionnez un groupe...</option>
                    {groups && groups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
                  </select>
                  <button 
                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 px-4 rounded-lg text-sm font-bold transition-all shrink-0" 
                    disabled={savingExitRequest || !groups || groups.length === 0} 
                    type="submit"
                  >
                    Quitter
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
