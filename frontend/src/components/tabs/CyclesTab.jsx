import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCcw,
  Calendar,
  User,
  DollarSign,
  Check,
  X,
  Plus,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Play,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  TrendingUp,
  Award,
  Lock,
  Sparkles,
  Loader2,
  List
} from 'lucide-react';
import { api } from '../../api';

function AISuggestOrderPanel({ groupId }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-800 text-sm">Ordre de tirage IA</h4>
            <p className="text-[10px] text-slate-400 font-bold">Suggestion optimisée basée sur la fiabilité</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 font-black">{open ? 'Réduire ▲' : 'Ouvrir ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <button onClick={suggest} disabled={loading || !groupId}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <List size={12} />}
            {loading ? 'Génération...' : 'Générer la suggestion'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {result && (
            <div className="space-y-2">
              {result.ordre?.map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">{o.position}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{o.membre_nom}</p>
                    <p className="text-[10px] text-slate-400 truncate">{o.raison}</p>
                  </div>
                </div>
              ))}
              {result.explication && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-slate-600">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Logique</p>
                  {result.explication}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CyclesTab = ({
  selectedGroup,
  setSelectedGroup,
  setActiveTab,
  cycles = [],
  members = [],
  users = [],
  createCycle,
  refreshRotatingData,
  groups = [],
  user,
  closeCycle,
  contributions = [],
  openGroup,
  loadGroupData
}) => {
  // Local States
  const [activeGroupId, setActiveGroupId] = useState(selectedGroup?.id || '');
  const [isLancerModalOpen, setIsLancerModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State for Lancer Cycle
  const [lancerForm, setLancerForm] = useState({
    beneficiaire_id: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: ''
  });

  // Fetch group data on change
  useEffect(() => {
    if (activeGroupId) {
      setLoading(true);
      loadGroupData(activeGroupId).finally(() => setLoading(false));
    }
  }, [activeGroupId]);

  // Active Group helper
  const activeGroup = useMemo(() => {
    return groups.find(g => String(g.id) === String(activeGroupId));
  }, [groups, activeGroupId]);

  // Role Checker
  const isManager = useMemo(() => {
    if (!activeGroup || !user) return false;
    return activeGroup.gestionnaire_id === user.id || user.role === 'super_admin';
  }, [activeGroup, user]);

  // Member's own membership details
  const myMembership = useMemo(() => {
    if (!user) return null;
    return members.find(m => m.utilisateur_id === user.id);
  }, [members, user]);

  // Map users for names
  const usersMap = useMemo(() => {
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  const getUserName = (userId) => {
    const u = usersMap.get(userId);
    return u ? u.nom : `Utilisateur #${userId}`;
  };

  // Find User Name by Membership ID
  const getUserNameByMembershipId = (membId) => {
    const memb = members.find(m => String(m.id) === String(membId));
    if (!memb) return 'Inconnu';
    return getUserName(memb.utilisateur_id);
  };

  // Helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  // Active cycle
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.statut === 'en_cours');
  }, [cycles]);

  // Days remaining helper
  const daysRemaining = useMemo(() => {
    if (!activeCycle) return 0;
    const diffTime = new Date(activeCycle.date_fin) - new Date();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [activeCycle]);

  // Members payment state for active cycle
  const activeCyclePayments = useMemo(() => {
    if (!activeCycle) return [];
    
    // For each member, find their contribution for the active cycle
    return members.map(m => {
      const contrib = contributions.find(c => 
        String(c.cycle_id) === String(activeCycle.id) && 
        String(c.membre_id) === String(m.id)
      );
      
      return {
        member: m,
        userName: getUserName(m.utilisateur_id),
        contrib,
        statut: contrib ? contrib.statut : 'retard', // default to retard if not paid
        datePaiement: contrib ? new Date(contrib.date_paiement).toLocaleDateString('fr-FR') : '—'
      };
    });
  }, [members, contributions, activeCycle, usersMap]);

  // Summary figures of the active cycle
  const stats = useMemo(() => {
    if (!activeGroup || !activeCycle) return { paidCount: 0, totalCount: 0, received: 0, totalAmt: 0, hasLate: false };
    
    const paidCount = activeCyclePayments.filter(p => p.statut === 'confirme').length;
    const totalCount = members.length;
    const cotisation = Number(activeGroup.montant_cotisation || 0);
    const received = paidCount * cotisation;
    const totalAmt = totalCount * cotisation;
    const hasLate = activeCyclePayments.some(p => p.statut === 'retard' || p.statut === 'en_attente');
    
    return { paidCount, totalCount, received, totalAmt, hasLate };
  }, [activeGroup, activeCycle, activeCyclePayments, members]);

  // Determine next beneficiary in order (excluding suspended members)
  const nextBeneficiary = useMemo(() => {
    if (members.length === 0) return null;
    
    // Sort active members by reception order
    const activeSorted = members
      .filter(m => m.statut === 'actif')
      .sort((a, b) => (a.ordre_reception || 99) - (b.ordre_reception || 99));
    
    if (activeSorted.length === 0) return null;
    
    // Find who has NOT received yet (has no completed or in-progress cycle where they are beneficiary)
    const receivedIds = new Set(cycles.map(c => String(c.beneficiaire_id)));
    const candidate = activeSorted.find(m => !receivedIds.has(String(m.id)));
    
    // Fallback: cycle back to the first active member in the order
    return candidate || activeSorted[0];
  }, [members, cycles]);

  // Trigger when launching new cycle modal
  useEffect(() => {
    if (isLancerModalOpen && nextBeneficiary && activeGroup) {
      // Calculate end date based on frequency
      const freq = activeGroup.frequence;
      const start = new Date();
      const end = new Date(start.getTime() + (freq === 'hebdo' ? 7 : 30) * 24 * 60 * 60 * 1000);
      
      setLancerForm({
        beneficiaire_id: nextBeneficiary.id,
        date_debut: start.toISOString().slice(0, 10),
        date_fin: end.toISOString().slice(0, 10)
      });
    }
  }, [isLancerModalOpen, nextBeneficiary, activeGroup]);

  // Sync activeGroupId when selectedGroup prop changes
  useEffect(() => {
    setActiveGroupId(selectedGroup?.id || '');
  }, [selectedGroup]);

  // Clôturer un cycle
  const handleCloturerCycle = async (force = false) => {
    setActionError('');
    setActionSuccess('');

    if (!activeCycle) return;

    if (stats.hasLate && !force) {
      // If there are unpaid members, show warning modal
      setIsWarningModalOpen(true);
      return;
    }

    setIsWarningModalOpen(false);
    setLoading(true);
    try {
      await closeCycle(activeCycle.id);
      setActionSuccess("Le cycle a été clôturé avec succès et la cagnotte a été distribuée !");
    } catch (err) {
      setActionError("Erreur lors de la clôture du cycle.");
    } finally {
      setLoading(false);
    }
  };

  // Lancer un nouveau cycle
  const handleLancerSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (activeCycle) {
      setActionError("Un cycle est déjà en cours. Veuillez le clôturer avant d'en lancer un nouveau.");
      return;
    }

    if (!lancerForm.beneficiaire_id) {
      setActionError("Veuillez sélectionner un bénéficiaire.");
      return;
    }

    setLoading(true);
    try {
      const nextCycleNum = cycles.length > 0 ? Math.max(...cycles.map(c => c.numero_cycle)) + 1 : 1;
      
      await createCycle({
        numero_cycle: nextCycleNum,
        beneficiaire_id: Number(lancerForm.beneficiaire_id),
        date_debut: lancerForm.date_debut,
        date_fin: lancerForm.date_fin
      });
      setActionSuccess(`Le Cycle ${nextCycleNum} a été lancé avec succès !`);
      setIsLancerModalOpen(false);
    } catch (err) {
      setActionError("Impossible de lancer le nouveau cycle.");
    } finally {
      setLoading(false);
    }
  };

  // Estimate my next tour card values (Member View)
  const myNextTour = useMemo(() => {
    if (!myMembership?.ordre_reception || !activeGroup) return null;
    
    const freq = activeGroup.frequence;
    const start = new Date(activeGroup.date_debut || new Date());
    const daysOffset = freq === 'hebdo' ? (myMembership.ordre_reception - 1) * 7 : (myMembership.ordre_reception - 1) * 30;
    const estDate = new Date(start.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    const activeMembersCount = members.filter(m => m.statut === 'actif').length;
    const amount = activeMembersCount * Number(activeGroup.montant_cotisation || 0);
    
    return {
      cycleNum: `Cycle ${myMembership.ordre_reception}`,
      dateStr: estDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      amount
    };
  }, [myMembership, activeGroup, members]);

  // Planning future cycles list
  const futurePlanningList = useMemo(() => {
    if (!activeGroup || members.length === 0) return [];
    
    // Sort active members by reception order
    const activeSorted = members
      .filter(m => m.statut === 'actif')
      .sort((a, b) => (a.ordre_reception || 99) - (b.ordre_reception || 99));

    const totalCyclesCount = cycles.length;
    const lastCycleNum = cycles.length > 0 ? Math.max(...cycles.map(c => c.numero_cycle)) : 0;
    
    const freq = activeGroup.frequence;
    const referenceDate = activeCycle ? new Date(activeCycle.date_fin) : new Date();

    // Map next 4 cycles
    return Array.from({ length: 4 }).map((_, idx) => {
      const futureCycleNum = lastCycleNum + idx + 1;
      
      // Beneficiary in cyclic order
      const membIdx = (futureCycleNum - 1) % activeSorted.length;
      const benef = activeSorted[membIdx];
      const benefName = benef ? getUserName(benef.utilisateur_id) : 'Aucun';

      // Estimate date
      const daysOffset = freq === 'hebdo' ? (idx + 1) * 7 : (idx + 1) * 30;
      const estDate = new Date(referenceDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      
      return {
        cycleNum: `Cycle ${futureCycleNum}`,
        benefName,
        dateStr: estDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      };
    });
  }, [activeGroup, members, cycles, activeCycle, usersMap]);

  // Clean empty state selectedGroup
  if (!activeGroupId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <RefreshCcw size={24} />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Cycles</h2>
            <p className="text-xs text-slate-500 font-bold">Sélectionnez un groupe pour lancer, suivre ou clôturer vos cycles.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CalendarDays size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Choisissez votre groupe de tontine</h3>
            <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto">
              Visualisez le cycle actif en cours, lancez un nouveau cycle de cagnotte, clôturez les cotisations et consultez le calendrier de réception.
            </p>
          </div>

          {groups.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-extrabold">Vous n'avez rejoint aucun groupe pour le moment.</p>
              <button 
                onClick={() => setActiveTab('groups')}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-2 px-6 rounded-lg transition-all"
              >
                Créer ou rejoindre
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Groupe de Tontine</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={activeGroupId}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                >
                  <option value="">Sélectionner un groupe...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nom}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                disabled={!activeGroupId}
                onClick={() => {
                  const g = groups.find(x => String(x.id) === String(activeGroupId));
                  if (g) {
                    setSelectedGroup(g);
                  }
                }}
              >
                Accéder aux Cycles
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSelectedGroup(null);
              setActiveGroupId('');
              setActiveTab('dashboard');
            }}
            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors border border-slate-100"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {isManager ? 'Suivi des Cycles' : 'Mes Cycles'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isManager ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {isManager ? 'Gestionnaire' : 'Membre'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold">
              Groupe actif : <span className="text-slate-600 font-extrabold">{activeGroup?.nom}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Group Switcher */}
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none"
            value={activeGroupId}
            onChange={(e) => setActiveGroupId(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>

          {/* Current cycle status indicator badge */}
          <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border tracking-wider ${
            activeCycle 
              ? 'bg-amber-50 text-amber-700 border-amber-100' 
              : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {activeCycle ? '🔄 Cycle en cours' : '🔒 Aucun cycle actif'}
          </span>

          {/* Manager Action: Lancer Cycle */}
          {isManager && !activeCycle && (
            <button
              onClick={() => setIsLancerModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5 animate-pulse"
            >
              <Play size={14} />
              Lancer un nouveau cycle
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2 animate-scale-up">
          <Check size={16} />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-2 animate-scale-up">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {/* DYNAMIC LAYOUT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* RESUME CARD COL */}
        <div className="lg:col-span-1 space-y-6">
          {isManager ? (
            // MANAGER VIEW ACTIVE RESUME
            activeCycle ? (
              <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <RefreshCcw size={120} />
                </div>
                
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Résumé du cycle actif</span>
                  <h3 className="font-extrabold text-lg text-white">Cycle {activeCycle.numero_cycle}</h3>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-350">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span>Bénéficiaire : <span className="font-extrabold text-white">{getUserNameByMembershipId(activeCycle.beneficiaire_id)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Début : {new Date(activeCycle.date_debut).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Jours restants : <span className="font-black text-amber-400">{daysRemaining} jours</span></span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Cotisations reçues</span>
                    <span className="text-emerald-400 font-black">{stats.paidCount}/{stats.totalCount} membres</span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(stats.paidCount/stats.totalCount)*100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">
                    Cagnotte : {formatCurrency(stats.received)} FCFA / {formatCurrency(stats.totalAmt)} FCFA
                  </span>
                </div>

                <div className="flex gap-2 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => handleCloturerCycle(false)}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Clôturer ce cycle
                  </button>
                  <button
                    onClick={() => setActiveTab('cotisations')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
                    title="Voir les cotisations"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </article>
            ) : (
              <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md text-center space-y-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Aucun cycle actif</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">
                    Tous les cycles précédents ont été clôturés. Lancez le cycle suivant pour démarrer les cotisations.
                  </p>
                </div>
                <button
                  onClick={() => setIsLancerModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase py-2.5 rounded-xl tracking-wider transition-all"
                >
                  Lancer le cycle
                </button>
              </article>
            )
          ) : (
            // MEMBER VIEW ACTIVE RESUME
            <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <RefreshCcw size={120} />
              </div>
              
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Mon cycle en cours</span>
                <h3 className="font-extrabold text-lg text-white">Cycle {activeCycle?.numero_cycle || 'Inactif'}</h3>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-350">
                <div>
                  <span className="text-[9px] text-slate-450 block uppercase tracking-wider mb-0.5">Bénéficiaire du cycle</span>
                  <span className="font-extrabold text-white">{activeCycle ? getUserNameByMembershipId(activeCycle.beneficiaire_id) : '—'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 block uppercase tracking-wider mb-0.5">Mon statut paiement</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                    contributions.some(c => String(c.cycle_id) === String(activeCycle?.id) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'confirme')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {contributions.some(c => String(c.cycle_id) === String(activeCycle?.id) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'confirme')
                      ? '✅ Payé'
                      : '❌ Non payé / Retard'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 block uppercase tracking-wider mb-0.5">Jours restants</span>
                  <span className="font-black text-amber-400">{activeCycle ? daysRemaining : 0} jours</span>
                </div>
              </div>
            </article>
          )}

          {/* MEMBER ONLY: PROCHAIN TOUR CARD */}
          {!isManager && myNextTour && (
            <article className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Award size={16} />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">🎉 Mon Prochain tour</h4>
                  <p className="text-[9px] text-slate-400 font-bold">Votre tour estimé de réception</p>
                </div>
              </div>

              <div className="space-y-3 font-semibold text-xs text-slate-650">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Cycle</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{myNextTour.cycleNum}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Montant estimé</span>
                  <span className="text-sm font-black text-emerald-600 block mt-0.5">{formatCurrency(myNextTour.amount)} FCFA</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Date estimée</span>
                  <span className="text-xs font-extrabold text-blue-600 block mt-0.5 capitalize">{myNextTour.dateStr}</span>
                </div>
              </div>
            </article>
          )}
        </div>

        {/* DETAILS GRID COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MANAGER: ACTIVE CYCLE PAYMENTS CHECKLIST */}
          {isManager && activeCycle && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">État des cotisations du cycle en cours</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <th className="py-2.5 px-2">Membre</th>
                      <th className="py-2.5 px-2">Ordre</th>
                      <th className="py-2.5 px-2">Montant</th>
                      <th className="py-2.5 px-2">Statut</th>
                      <th className="py-2.5 px-2">Date paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCyclePayments.map((p, idx) => (
                      <tr key={p.member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 font-black text-slate-800">{p.userName}</td>
                        <td className="py-3 px-2 font-bold text-slate-500">
                          {p.member.ordre_reception ? `${p.member.ordre_reception}${p.member.ordre_reception === 1 ? 'er' : 'ème'}` : '—'}
                        </td>
                        <td className="py-3 px-2 text-slate-850 font-black">
                          {formatCurrency(activeGroup?.montant_cotisation)} FCFA
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            p.statut === 'confirme' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : p.statut === 'en_attente'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {p.statut === 'confirme' ? 'Confirmé' : p.statut === 'en_attente' ? 'En attente' : 'Retard'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-500">{p.datePaiement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* HISTORICAL CYCLES TABLE */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Historique des cycles</h3>
            
            {cycles.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-150">
                <Clock size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-extrabold">Aucun cycle archivé pour ce groupe.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <th className="py-2.5 px-2">Cycle</th>
                      <th className="py-2.5 px-2">Bénéficiaire</th>
                      <th className="py-2.5 px-2">Montant distribué</th>
                      <th className="py-2.5 px-2">Collecte</th>
                      <th className="py-2.5 px-2">Début</th>
                      <th className="py-2.5 px-2">Fin</th>
                      <th className="py-2.5 px-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map(c => {
                      const isActive = c.statut === 'en_cours';
                      const activeMembersCount = members.filter(m => m.statut === 'actif').length;
                      
                      // Payout: Active members * group's cotisation amount
                      const jackpot = activeMembersCount * Number(activeGroup?.montant_cotisation || 0);
                      
                      // Calculate real collected %
                      const cycleContribs = contributions.filter(co => String(co.cycle_id) === String(c.id) && co.statut === 'confirme');
                      const collectePct = activeMembersCount > 0 ? Math.round((cycleContribs.length / activeMembersCount) * 100) : 0;
                      
                      return (
                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-2 font-black text-slate-800">Cycle {c.numero_cycle}</td>
                          <td className="py-3 px-2 font-bold text-slate-700">{getUserNameByMembershipId(c.beneficiaire_id)}</td>
                          <td className="py-3 px-2 font-black text-emerald-600">
                            {isActive ? '—' : `${formatCurrency(jackpot)} F`}
                          </td>
                          <td className="py-3 px-2 font-mono text-[10px] font-bold text-slate-500">{collectePct}%</td>
                          <td className="py-3 px-2 text-slate-500 font-bold">{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                          <td className="py-3 px-2 text-slate-500 font-bold">{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {isActive ? 'En cours' : 'Terminé'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* PLANNING CYCLES TO COME */}
          <section className="bg-slate-50 rounded-2xl border border-slate-150 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" />
              Planning des cycles à venir
            </h3>
            
            {members.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-400">Aucun membre configuré pour estimer les cycles à venir.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {futurePlanningList.map((f, index) => (
                  <article key={index} className="bg-white p-4 rounded-xl border border-slate-150 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">{f.cycleNum}</span>
                      <span className="font-black text-slate-800 mt-0.5 block">{f.benefName}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 capitalize bg-blue-50/50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      {f.dateStr}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL LANCER NOUVEAU CYCLE (MANAGER) */}
      {isLancerModalOpen && nextBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsLancerModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up space-y-5">
            <button 
              onClick={() => setIsLancerModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Play size={20} />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Lancer un nouveau cycle</h3>
                <p className="text-[10px] text-slate-400 font-bold">Un cycle ne peut démarrer que si le précédent est clôturé.</p>
              </div>
            </div>

            <form onSubmit={handleLancerSubmit} className="space-y-4">
              {/* Group name (Readonly) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Groupe</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={activeGroup?.nom}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Cycle Number (Calculated automatically) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Numéro du cycle</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`Cycle ${cycles.length > 0 ? Math.max(...cycles.map(c => c.numero_cycle)) + 1 : 1}`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Next Beneficiary (Calculated automatically) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Bénéficiaire (membre suivant)</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  value={lancerForm.beneficiaire_id}
                  onChange={(e) => setLancerForm({ ...lancerForm, beneficiaire_id: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{getUserNameByMembershipId(m.id)}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Date de début</label>
                <input
                  type="date"
                  required
                  value={lancerForm.date_debut}
                  onChange={(e) => setLancerForm({ ...lancerForm, date_debut: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Date de fin</label>
                <input
                  type="date"
                  required
                  value={lancerForm.date_fin}
                  onChange={(e) => setLancerForm({ ...lancerForm, date_fin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Lancer le Cycle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WARNING CLÔTURE D'UN CYCLE MODAL (MANAGER) */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsWarningModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <span className="p-1.5 bg-amber-50 rounded-lg">
                <AlertCircle size={20} />
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">Avertissement de Retard</h3>
            </div>

            <p className="text-xs text-slate-500 font-bold leading-normal">
              ⚠️ Certains membres n'ont pas encore payé ou ont des cotisations en retard pour le Cycle {activeCycle?.numero_cycle}. 
              Voulez-vous quand même clôturer et procéder à la distribution de la cagnotte ?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsWarningModalOpen(false)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xs uppercase py-2.5 rounded-xl border border-slate-150 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleCloturerCycle(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase py-2.5 rounded-xl shadow-sm transition-all animate-pulse"
              >
                Confirmer quand même
              </button>
            </div>
          </div>
        </div>
      )}

      {activeGroup && <AISuggestOrderPanel groupId={activeGroup.id} />}
    </div>
  );
};

export default CyclesTab;