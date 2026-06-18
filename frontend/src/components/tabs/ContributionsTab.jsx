import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Check,
  X,
  Send,
  Calendar,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Users,
  ChevronRight,
  Plus,
  Filter,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Clock,
  Smartphone,
  Sparkles,
  Loader2,
  TrendingDown,
  Activity
} from 'lucide-react';
import { api } from '../../api';

function AIContribPanel({ groupId }) {
  const [tab, setTab] = useState('defaults')
  const [defaults, setDefaults] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const run = async () => {
    if (!groupId) return
    setLoading(true); setError('')
    try {
      if (tab === 'defaults') {
        const { predictions } = await api.aiPredictDefaults(Number(groupId))
        setDefaults(predictions || [])
      } else {
        const { anomalies: data } = await api.aiAnomalies(Number(groupId))
        setAnomalies(data || [])
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const risqueColor = (r) => r === 'élevé' ? 'bg-red-100 text-red-700' : r === 'moyen' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
  const sevColor = (s) => s === 'haute' ? 'border-red-200 bg-red-50 text-red-700' : s === 'moyenne' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-800 text-sm">Analyse IA du groupe</h4>
            <p className="text-[10px] text-slate-400 font-bold">Prédiction défaillances · Détection anomalies</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 font-black">{open ? 'Réduire ▲' : 'Ouvrir ▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex gap-1 mb-4">
            {[{ id: 'defaults', label: 'Défaillances' }, { id: 'anomalies', label: 'Anomalies' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={run} disabled={loading || !groupId}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg mb-4 transition-colors">
            {loading ? <Loader2 size={12} className="animate-spin" /> : tab === 'defaults' ? <TrendingDown size={12} /> : <Activity size={12} />}
            {loading ? 'Analyse...' : tab === 'defaults' ? 'Prédire les défaillances' : 'Détecter les anomalies'}
          </button>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          {tab === 'defaults' && defaults.length > 0 && (
            <div className="space-y-2">
              {defaults.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase ${risqueColor(p.risque)}`}>{p.risque}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{p.membre_nom}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.raison}</p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-slate-700">{p.probabilite}%</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'anomalies' && anomalies.length > 0 && (
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className={`p-2.5 border rounded-xl ${sevColor(a.severite)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase">{a.type?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border">{a.severite}</span>
                  </div>
                  {a.membre_nom && <p className="text-xs font-black">{a.membre_nom}</p>}
                  <p className="text-[11px] mt-0.5">{a.description}</p>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && tab === 'defaults' && defaults.length === 0 && (
            <p className="text-xs text-slate-400 italic">Lancez l'analyse pour voir les prédictions.</p>
          )}
          {!loading && !error && tab === 'anomalies' && anomalies.length === 0 && (
            <p className="text-xs text-slate-400 italic">Lancez l'analyse pour détecter les anomalies.</p>
          )}
        </div>
      )}
    </div>
  )
}

const ContributionsTab = ({
  selectedGroup,
  setSelectedGroup,
  setActiveTab,
  groups = [],
  contributionGroupId,
  setContributionGroupId,
  openGroupForCotisations,
  confirmContribution,
  rejectContribution,
  loadGroupData,
  remindMember,
  declarePayment,
  openGroup,
  user,
  members = [],
  cycles = [],
  contributions = [],
  users = []
}) => {
  // Local States
  const [activeGroupId, setActiveGroupId] = useState(selectedGroup?.id || '');
  const [activeCycleId, setActiveCycleId] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingContribId, setRejectingContribId] = useState(null);
  const [rejectMotif, setRejectMotif] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States for Manager Register Payment
  const [registerForm, setRegisterForm] = useState({
    membre_id: '',
    numero_transaction: '',
    date_paiement: new Date().toISOString().slice(0, 10),
  });

  // Form States for Member Declare Payment
  const [declareForm, setDeclareForm] = useState({
    paymentMethod: 'MTN MoMo',
    numero_transaction: '',
    date_paiement: new Date().toISOString().slice(0, 10),
    note: ''
  });

  // Load Group detail when activeGroupId changes (data only, no tab switch)
  useEffect(() => {
    if (activeGroupId) {
      setLoading(true);
      const loader = loadGroupData || openGroup;
      loader(activeGroupId).finally(() => setLoading(false));
    }
  }, [activeGroupId]);

  // Set default activeCycleId to the current in-progress cycle
  const activeGroup = useMemo(() => {
    return groups.find(g => String(g.id) === String(activeGroupId));
  }, [groups, activeGroupId]);

  const activeCycle = useMemo(() => {
    // Current in-progress cycle
    return cycles.find(c => c.statut === 'en_cours') || cycles[cycles.length - 1] || null;
  }, [cycles]);

  useEffect(() => {
    if (activeCycle) {
      setActiveCycleId(activeCycle.id);
    } else {
      setActiveCycleId('');
    }
  }, [activeCycle]);

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

  // Helper formatting
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  // 1. MANAGER: Stats computation for the active cycle
  const stats = useMemo(() => {
    if (!activeGroup) return { attendu: 0, recu: 0, reste: 0, retards: 0, progression: 0 };
    
    const cycleContribs = contributions.filter(c => String(c.cycle_id) === String(activeCycleId));
    const confirmedCount = cycleContribs.filter(c => c.statut === 'confirme').length;
    
    const totalMembers = members.length;
    const cotisationAmount = Number(activeGroup.montant_cotisation || 0);
    
    const attendu = totalMembers * cotisationAmount;
    const recu = confirmedCount * cotisationAmount;
    const reste = Math.max(0, attendu - recu);
    
    // Unpaid or late members
    const paidMemberIds = new Set(cycleContribs.map(c => String(c.membre_id)));
    const retardsCount = members.filter(m => !paidMemberIds.has(String(m.id))).length;
    
    const progression = attendu > 0 ? Math.round((recu / attendu) * 100) : 0;
    
    return { attendu, recu, reste, retards: retardsCount, progression };
  }, [activeGroup, members, contributions, activeCycleId]);

  // 2. MANAGER/MEMBER: Filtered contributions table
  const filteredContributions = useMemo(() => {
    return contributions.filter(c => {
      // Must match selected cycle
      if (String(c.cycle_id) !== String(activeCycleId)) return false;
      
      // If member, only see their own cotisations
      if (!isManager && myMembership) {
        if (String(c.membre_id) !== String(myMembership.id)) return false;
      }

      // Status filter
      if (statusFilter === 'Confirmé') return c.statut === 'confirme';
      if (statusFilter === 'En attente') return c.statut === 'en_attente';
      if (statusFilter === 'Retard') return c.statut === 'retard';
      
      return true;
    });
  }, [contributions, activeCycleId, isManager, myMembership, statusFilter]);

  // Find User by Membership
  const getUserNameByMembershipId = (membId) => {
    const memb = members.find(m => String(m.id) === String(membId));
    if (!memb) return 'Inconnu';
    const u = users.find(usr => usr.id === memb.utilisateur_id);
    return u ? u.nom : `Utilisateur #${memb.utilisateur_id}`;
  };

  // Rule Enforcer: Check duplicate transaction code
  const isTransactionUnique = (code) => {
    return !contributions.some(c => c.numero_transaction.trim().toLowerCase() === code.trim().toLowerCase());
  };

  // Rule Enforcer: Check if member already paid for active cycle
  const hasAlreadyPaid = (membId) => {
    return contributions.some(c => 
      String(c.cycle_id) === String(activeCycleId) && 
      String(c.membre_id) === String(membId) &&
      (c.statut === 'confirme' || c.statut === 'en_attente')
    );
  };

  // MANAGER: Submit registration form
  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!registerForm.membre_id || !registerForm.numero_transaction.trim()) {
      setActionError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!isTransactionUnique(registerForm.numero_transaction)) {
      setActionError('Ce numéro de transaction Mobile Money a déjà été utilisé.');
      return;
    }

    if (hasAlreadyPaid(registerForm.membre_id)) {
      setActionError('Ce membre a déjà un paiement en attente ou confirmé pour ce cycle.');
      return;
    }

    setLoading(true);
    try {
      await declarePayment({
        cycle_id: Number(activeCycleId),
        membre_id: Number(registerForm.membre_id),
        montant: Number(activeGroup.montant_cotisation),
        numero_transaction: registerForm.numero_transaction.trim(),
        date_paiement: new Date(registerForm.date_paiement).toISOString(),
      });
      setActionSuccess('La cotisation a été enregistrée avec succès !');
      setIsRegisterModalOpen(false);
      setRegisterForm({
        membre_id: '',
        numero_transaction: '',
        date_paiement: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setActionError(err.message || "Impossible d'enregistrer la cotisation.");
    } finally {
      setLoading(false);
    }
  };

  // MEMBER: Submit declaration form
  const handleDeclarePayment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!declareForm.numero_transaction.trim()) {
      setActionError('Veuillez entrer le numéro de transaction.');
      return;
    }

    if (!isTransactionUnique(declareForm.numero_transaction)) {
      setActionError('Ce numéro de transaction a déjà été déclaré.');
      return;
    }

    if (myMembership && hasAlreadyPaid(myMembership.id)) {
      setActionError('Vous avez déjà déclaré un paiement en attente ou confirmé pour ce cycle.');
      return;
    }

    setLoading(true);
    try {
      await declarePayment({
        cycle_id: Number(activeCycleId),
        membre_id: Number(myMembership.id),
        montant: Number(activeGroup.montant_cotisation),
        numero_transaction: declareForm.numero_transaction.trim(),
        date_paiement: new Date(declareForm.date_paiement).toISOString(),
      });
      setActionSuccess('Votre paiement a été déclaré au gestionnaire avec succès !');
      setIsDeclareModalOpen(false);
      setDeclareForm({
        paymentMethod: 'MTN MoMo',
        numero_transaction: '',
        date_paiement: new Date().toISOString().slice(0, 10),
        note: ''
      });
    } catch (err) {
      setActionError(err.message || "Impossible de déclarer votre paiement.");
    } finally {
      setLoading(false);
    }
  };

  // MANAGER: Confirmer Paiement
  const handleConfirm = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      await confirmContribution(id);
      setActionSuccess('Cotisation confirmée avec succès !');
      if (activeGroupId) await loadGroupData(activeGroupId);
    } catch (err) {
      setActionError(err.message || "Erreur lors de la confirmation.");
    }
  };

  // MANAGER: Rejeter Paiement
  const handleOpenReject = (id) => {
    setRejectingContribId(id);
    setRejectMotif('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectMotif.trim()) {
      alert("Veuillez saisir un motif.");
      return;
    }
    setIsRejectModalOpen(false);
    setLoading(true);
    try {
      await rejectContribution(rejectingContribId, rejectMotif);
      setActionSuccess('La cotisation a été rejetée et le membre a été notifié.');
      if (activeGroupId) await loadGroupData(activeGroupId);
    } catch (err) {
      setActionError(err.message || "Impossible de rejeter la cotisation.");
    } finally {
      setLoading(false);
    }
  };

  // MANAGER: Relancer
  const handleRemind = async (memberId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await remindMember(activeGroupId, memberId);
      setActionSuccess('Rappel envoyé au membre avec succès !');
    } catch (err) {
      setActionError("Impossible d'envoyer le rappel.");
    }
  };

  // Clean empty state selectedGroup
  if (!activeGroupId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Banknote size={24} />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Cotisations</h2>
            <p className="text-xs text-slate-500 font-bold">Sélectionnez un groupe pour gérer ou déclarer vos cotisations.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <DollarSign size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Choisissez un groupe de tontine</h3>
            <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto">
              Visualisez le résumé du cycle en cours, validez les paiements des membres, ou déclarez vos transferts Mobile Money.
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
                  value={contributionGroupId}
                  onChange={(e) => setContributionGroupId(e.target.value)}
                >
                  <option value="">Sélectionner un groupe...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nom} · {formatCurrency(g.montant_cotisation)} FCFA
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                disabled={!contributionGroupId}
                onClick={() => {
                  const g = groups.find(x => String(x.id) === String(contributionGroupId));
                  if (g) {
                    setActiveGroupId(g.id);
                    openGroupForCotisations(g);
                  }
                }}
              >
                Accéder aux Cotisations
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
              setContributionGroupId('');
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
                {isManager ? 'Cotisations (Gestion)' : 'Mes Cotisations'}
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
            onChange={(e) => {
              setActiveGroupId(e.target.value);
              const g = groups.find(x => String(x.id) === String(e.target.value));
              if (g) openGroupForCotisations(g);
            }}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>

          {/* Cycles Switcher */}
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none"
            value={activeCycleId}
            onChange={(e) => setActiveCycleId(e.target.value)}
          >
            <option value="">Tous les cycles</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>Cycle {c.numero_cycle} {c.statut === 'en_cours' ? '(En cours)' : ''}</option>
            ))}
          </select>

          {/* Enregistrer/Déclarer Payment Button */}
          {isManager ? (
            <button
              onClick={() => {
                if (!activeCycleId) {
                  alert("Veuillez d'abord activer un cycle pour ce groupe.");
                  return;
                }
                setIsRegisterModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              Enregistrer un paiement
            </button>
          ) : (
            <button
              onClick={() => {
                if (!activeCycleId) {
                  alert("Aucun cycle actif pour déclarer un paiement.");
                  return;
                }
                setIsDeclareModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Smartphone size={14} />
              Déclarer mon paiement
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check size={16} />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {/* DYNAMIC VIEW GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* RESUME CARD */}
        <div className="lg:col-span-1 space-y-6">
          {isManager ? (
            // MANAGER RESUME
            <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <DollarSign size={120} />
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Résumé du cycle actif</span>
                    <h3 className="font-extrabold text-lg text-white">Cycle {activeCycle?.numero_cycle || 'Inactif'}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {activeGroup?.nom}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bénéficiaire du cycle</span>
                  <span className="font-black text-sm text-slate-200">
                    {activeCycle ? getUserNameByMembershipId(activeCycle.beneficiaire_id) : 'Aucun'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Attendu</span>
                    <span className="text-sm font-black text-white">{formatCurrency(stats.attendu)} F</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Reçu</span>
                    <span className="text-sm font-black text-emerald-400">{formatCurrency(stats.recu)} F</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Reste à collecter</span>
                    <span className="text-sm font-black text-amber-400">{formatCurrency(stats.reste)} F</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Retards</span>
                    <span className="text-sm font-black text-rose-400">{stats.retards} membres</span>
                  </div>
                </div>

                {/* Progression Bar */}
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Progression</span>
                    <span className="text-emerald-400 font-black">{stats.progression}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${stats.progression}%` }}></div>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            // MEMBER RESUME
            <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={120} />
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Mon statut personnel</span>
                  <h3 className="font-extrabold text-lg text-white">{activeGroup?.nom} — Cycle {activeCycle?.numero_cycle || 'N/A'}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Mon statut</span>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      contributions.some(c => String(c.cycle_id) === String(activeCycleId) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'confirme')
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : contributions.some(c => String(c.cycle_id) === String(activeCycleId) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'en_attente')
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {contributions.some(c => String(c.cycle_id) === String(activeCycleId) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'confirme')
                        ? '✅ À jour'
                        : contributions.some(c => String(c.cycle_id) === String(activeCycleId) && String(c.membre_id) === String(myMembership?.id) && c.statut === 'en_attente')
                        ? '⏳ En attente'
                        : '❌ En retard'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Prochain tour</span>
                    <span className="text-sm font-black text-slate-200 mt-1 block">
                      {myMembership?.ordre_reception ? `Cycle ${myMembership.ordre_reception}` : 'Non défini'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Retards accumulés</span>
                    <span className="text-sm font-black text-rose-400 mt-1 block">0</span>
                  </div>
                </div>

                {!contributions.some(c => String(c.cycle_id) === String(activeCycleId) && String(c.membre_id) === String(myMembership?.id)) && (
                  <button 
                    onClick={() => setIsDeclareModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-4"
                  >
                    💳 Déclarer mon paiement
                  </button>
                )}
              </div>
            </article>
          )}

          {/* STATUS FILTERS CARD */}
          <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              Filtrer les cotisations
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {['Tous', 'Confirmé', 'En attente', 'Retard'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    statusFilter === tab 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* CONTRIBUTIONS LIST TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Tableau des cotisations</h3>
                <p className="text-xs text-slate-400 font-bold">{filteredContributions.length} cotisation(s) correspondante(s)</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <span className="text-xs font-bold">Chargement des données...</span>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users size={32} className="text-slate-350 mx-auto mb-3" />
                <p className="text-xs font-extrabold text-slate-500">Aucune cotisation trouvée pour ce cycle.</p>
                {isManager && (
                  <p className="text-[10px] text-slate-400 mt-1">Vous pouvez en enregistrer une manuellement via le bouton du haut.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <th className="py-3 px-2">Membre</th>
                      <th className="py-3 px-2">Montant</th>
                      <th className="py-3 px-2">N° Transaction</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Statut</th>
                      {isManager && <th className="py-3 px-2 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContributions.map(c => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 font-black text-slate-800">
                          {getUserNameByMembershipId(c.membre_id)}
                        </td>
                        <td className="py-3 px-2 text-slate-800 font-black">
                          {formatCurrency(c.montant)} FCFA
                        </td>
                        <td className="py-3 px-2 font-mono text-[10px] font-bold text-slate-500">
                          {c.numero_transaction}
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-bold">
                          {new Date(c.date_paiement).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            c.statut === 'confirme' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : c.statut === 'en_attente'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {c.statut === 'confirme' ? 'Confirmé' : c.statut === 'en_attente' ? 'En attente' : 'Retard'}
                          </span>
                        </td>
                        {isManager && (
                          <td className="py-3 px-2 text-right">
                            {c.statut === 'en_attente' && (
                              <div className="inline-flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleConfirm(c.id)}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg transition-colors"
                                  title="Confirmer le paiement"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleOpenReject(c.id)}
                                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg transition-colors"
                                  title="Rejeter le paiement"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                            {c.statut === 'retard' && (
                              <button
                                onClick={() => handleRemind(c.membre_id)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ml-auto"
                              >
                                <Send size={10} />
                                Relancer
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* HISTORIQUE DES CYCLES PASSES */}
          {cycles.length > 1 && (
            <section className="bg-slate-50 rounded-2xl border border-slate-150 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Historique des cycles passés</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Consultez en lecture seule les cotisations validées des cycles précédents.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-500">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Total collecté par cycle</span>
                  <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">
                    {formatCurrency(stats.recu)} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Bénéficiaire final</span>
                  <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">
                    {activeCycle ? getUserNameByMembershipId(activeCycle.beneficiaire_id) : 'Aucun'}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL ENREGISTRER PAIEMENT (MANAGER) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsRegisterModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up space-y-5">
            <button 
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Plus size={20} />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Enregistrer un paiement</h3>
                <p className="text-[10px] text-slate-400 font-bold">Enregistrez un paiement manuel de membre pour le Cycle {activeCycle?.numero_cycle}.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Membre cotisant *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  value={registerForm.membre_id}
                  onChange={(e) => setRegisterForm({ ...registerForm, membre_id: e.target.value })}
                >
                  <option value="">Sélectionner un membre...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{getUserNameByMembershipId(m.id)}</option>
                  ))}
                </select>
              </div>

              {/* Cycle (ReadOnly) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Cycle de paiement</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`Cycle ${activeCycle?.numero_cycle || 'Inactif'}`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Montant (ReadOnly) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Montant attendu</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${formatCurrency(activeGroup?.montant_cotisation)} FCFA`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Transaction Number */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Numéro de transaction Mobile Money *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: TXN987654321"
                  value={registerForm.numero_transaction}
                  onChange={(e) => setRegisterForm({ ...registerForm, numero_transaction: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Date du jour</label>
                <input
                  type="date"
                  required
                  value={registerForm.date_paiement}
                  onChange={(e) => setRegisterForm({ ...registerForm, date_paiement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm"
              >
                {loading ? 'Enregistrement en cours...' : 'Enregistrer la cotisation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL DECLARER PAIEMENT (MEMBER) */}
      {isDeclareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeclareModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up space-y-5">
            <button 
              onClick={() => setIsDeclareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Smartphone size={20} />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Déclarer mon paiement</h3>
                <p className="text-[10px] text-slate-400 font-bold">Déclarez un versement Mobile Money pour validation par le gestionnaire.</p>
              </div>
            </div>

            <form onSubmit={handleDeclarePayment} className="space-y-4">
              {/* Active Group Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Groupe sélectionné</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={activeGroup?.nom}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Montant (ReadOnly) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Montant de cotisation</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${formatCurrency(activeGroup?.montant_cotisation)} FCFA`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-450 focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Moyen de Paiement */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Moyen de paiement *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  value={declareForm.paymentMethod}
                  onChange={(e) => setDeclareForm({ ...declareForm, paymentMethod: e.target.value })}
                >
                  <option value="MTN MoMo">MTN Mobile Money</option>
                  <option value="Orange Money">Orange Money</option>
                </select>
              </div>

              {/* Transaction Number */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Numéro de transaction Mobile Money *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: TXN123456789"
                  value={declareForm.numero_transaction}
                  onChange={(e) => setDeclareForm({ ...declareForm, numero_transaction: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Date du jour</label>
                <input
                  type="date"
                  required
                  value={declareForm.date_paiement}
                  onChange={(e) => setDeclareForm({ ...declareForm, date_paiement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Note optionnelle au gestionnaire</label>
                <textarea
                  placeholder="ex: Cotisation de Mai effectuée ce matin"
                  rows={2}
                  value={declareForm.note}
                  onChange={(e) => setDeclareForm({ ...declareForm, note: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm"
              >
                {loading ? 'Déclaration en cours...' : 'Déclarer mon paiement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeGroup && <AIContribPanel groupId={activeGroup.id} />}

      {/* ========================================================================= */}
      {/* 3. MICRO-MODAL MOTIF REJET (MANAGER) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Motif du rejet</h3>
              <p className="text-[10px] text-slate-400 font-bold">Veuillez indiquer le motif du rejet de cette cotisation.</p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="ex: Numéro de transaction invalide ou introuvable"
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xs uppercase py-2.5 rounded-xl border border-slate-150 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Rejeter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributionsTab;
