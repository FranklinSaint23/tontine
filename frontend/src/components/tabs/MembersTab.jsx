import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  ShieldAlert, 
  Check, 
  X, 
  Send, 
  Trash2, 
  Eye, 
  Sliders, 
  UserCheck, 
  UserMinus, 
  Phone, 
  CreditCard, 
  Mail, 
  Calendar,
  Activity,
  Award,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const MembersTab = ({
  selectedGroup,
  setSelectedGroup,
  setActiveTab,
  members = [],
  users = [],
  addMember,
  refreshMembers,
  groups = [],
  user,
  updateMembership,
  deleteMembership,
  remindMember,
  contributions = [],
  loans = [],
  openGroup,
  loadGroupData,
  cycles = [],
  createJoinRequest
}) => {
  // Local States
  const [activeGroupId, setActiveGroupId] = useState(selectedGroup?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  
  // Selected entities for modals
  const [selectedMember, setSelectedMember] = useState(null);
  const [newOrderValue, setNewOrderValue] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States for Add Member
  const [addForm, setAddForm] = useState({
    utilisateur_id: '',
    ordre_reception: '',
    date_adhesion: new Date().toISOString().slice(0, 10)
  });

  // Fetch group data on change
  useEffect(() => {
    if (activeGroupId) {
      setLoading(true);
      loadGroupData(activeGroupId).finally(() => setLoading(false));
    }
  }, [activeGroupId]);

  // Sync activeGroupId when selectedGroup prop changes
  useEffect(() => {
    setActiveGroupId(selectedGroup?.id || '');
  }, [selectedGroup]);

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

  // Helper formatting
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  // Maps for quick user info extraction
  const usersMap = useMemo(() => {
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  // Unregistered Users (for add member select)
  const selectableUsers = useMemo(() => {
    const memberUserIds = new Set(members.map(m => m.utilisateur_id));
    return users.filter(u => !memberUserIds.has(u.id));
  }, [users, members]);

  // Find User by ID
  const getUserInfo = (userId) => {
    return usersMap.get(userId) || { nom: `Utilisateur #${userId}`, email: '', telephone: '', momo: '' };
  };

  // Determine latest payment date for a member
  const getLatestCotisationDate = (memberId) => {
    const memberContribs = contributions.filter(c => String(c.membre_id) === String(memberId) && c.statut === 'confirme');
    if (memberContribs.length === 0) return 'Aucune';
    const latest = memberContribs.sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement))[0];
    return new Date(latest.date_paiement).toLocaleDateString('fr-FR');
  };

  // Determine if a member is "En retard" for the active/latest cycle
  const isMemberLate = (memberId) => {
    const activeCycle = cycles.find(c => c.statut === 'en_cours') || cycles[cycles.length - 1];
    if (!activeCycle) return false;
    
    // Check if they have a confirmed/pending payment for this cycle
    const hasPaid = contributions.some(c => 
      String(c.cycle_id) === String(activeCycle.id) && 
      String(c.membre_id) === String(memberId) &&
      (c.statut === 'confirme' || c.statut === 'en_attente')
    );
    return !hasPaid;
  };

  // Member statistics for detail modal
  const getMemberStats = (memberId) => {
    const memberContribs = contributions.filter(c => String(c.membre_id) === String(memberId));
    const paidCount = memberContribs.filter(c => c.statut === 'confirme').length;
    const totalCycles = cycles.length || 1;
    const payRatio = totalCycles > 0 ? Math.round((paidCount / totalCycles) * 100) : 0;
    
    const activeLoans = loans.filter(l => String(l.emprunteur_id) === String(memberId) && l.statut === 'approuve').length;
    
    // Late payments
    const lateCount = totalCycles - paidCount;
    
    // Reliability Score
    const reliability = Math.max(0, 100 - (lateCount * 15));
    
    return {
      paidCount,
      totalCycles,
      payRatio,
      activeLoans,
      lateCount: Math.max(0, lateCount),
      reliability
    };
  };

  // Dynamic Members stats summary for quick display
  const statsSummary = useMemo(() => {
    const total = members.length;
    const actives = members.filter(m => m.statut === 'actif').length;
    const suspended = members.filter(m => m.statut === 'suspendu').length;
    
    // Late check
    const lates = members.filter(m => isMemberLate(m.id) && m.statut === 'actif').length;
    
    return { total, actives, suspended, lates };
  }, [members, cycles, contributions]);

  // Reactive filtering by search query
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const u = getUserInfo(m.utilisateur_id);
      const q = searchQuery.toLowerCase();
      return (
        u.nom.toLowerCase().includes(q) || 
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.telephone && u.telephone.toLowerCase().includes(q))
      );
    });
  }, [members, searchQuery, usersMap]);

  // ACTIONS
  // 1. MANAGER: Invite member (sends Join Request) submit
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!addForm.utilisateur_id || !selectedGroup) {
      setActionError('Veuillez sélectionner utilisateur et groupe.');
      return;
    }

    setLoading(true);
    try {
      await createJoinRequest({
        groupe_id: selectedGroup.id,
        utilisateur_id: Number(addForm.utilisateur_id),
        message: "Vous avez été invité à rejoindre ce groupe."
      });
      setActionSuccess('Invitation envoyée : le membre va recevoir une notification pour confirmer son adhésion.');
      setIsAddModalOpen(false);
      setAddForm({
        utilisateur_id: '',
        ordre_reception: '',
        date_adhesion: new Date().toISOString().slice(0, 10)
      });
    } catch (err) {
      setActionError(err.detail || err.message || "Erreur lors de l'envoi de l'invitation.");
    } finally {
      setLoading(false);
    }
  };

  // 2. MANAGER: Toggle Suspend/Active
  const handleToggleSuspend = async (member) => {
    setActionError('');
    setActionSuccess('');
    const newStatus = member.statut === 'suspendu' ? 'actif' : 'suspendu';
    try {
      await updateMembership(member.id, { statut: newStatus });
      setActionSuccess(`Le statut du membre a été mis à jour avec succès (${newStatus === 'actif' ? 'Réactivé' : 'Suspendu'}).`);
    } catch (err) {
      setActionError("Impossible de modifier le statut du membre.");
    }
  };

  // 3. MANAGER: Update Reception Order
  const handleOpenEditOrder = (member) => {
    setSelectedMember(member);
    setNewOrderValue(member.ordre_reception || '');
    setIsEditOrderModalOpen(true);
  };

  const handleEditOrderSubmit = async (e) => {
    e.preventDefault();
    setIsEditOrderModalOpen(false);
    setActionError('');
    setActionSuccess('');
    try {
      await updateMembership(selectedMember.id, { ordre_reception: newOrderValue ? Number(newOrderValue) : null });
      setActionSuccess("L'ordre de réception a été mis à jour avec succès.");
    } catch (err) {
      setActionError("Impossible de modifier l'ordre de réception.");
    }
  };

  // 4. MANAGER: Remind Late payment
  const handleRemindMember = async (memberId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await remindMember(activeGroupId, memberId);
      setActionSuccess("Rappel de cotisation envoyé au membre avec succès.");
    } catch (err) {
      setActionError("Erreur lors de l'envoi de la relance.");
    }
  };

  // 5. MANAGER: Delete Member
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer définitivement ce membre du groupe ?")) return;
    setActionError('');
    setActionSuccess('');
    try {
      await deleteMembership(memberId);
      setActionSuccess("Le membre a été exclu définitivement du groupe.");
    } catch (err) {
      setActionError("Impossible d'exclure le membre.");
    }
  };

  // 6. MANAGER: Open profile card sheet
  const handleOpenDetail = (member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  // Estimate payout date for Member View
  const estimatedTourDetails = useMemo(() => {
    if (!myMembership?.ordre_reception || !activeGroup) return null;
    
    const freq = activeGroup.frequence; // hebdo or mensuel
    const startDate = new Date(activeGroup.date_debut || new Date());
    const orderIndex = myMembership.ordre_reception; // e.g. 4
    
    // Calculate weeks/months offsets
    const daysOffset = freq === 'hebdo' ? (orderIndex - 1) * 7 : (orderIndex - 1) * 30;
    const estDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    return {
      order: `${orderIndex}${orderIndex === 1 ? 'er' : 'ème'}`,
      cycle: `Cycle ${orderIndex}`,
      dateStr: estDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    };
  }, [myMembership, activeGroup]);

  // Clean empty state selectedGroup
  if (!activeGroupId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestion des Membres</h2>
            <p className="text-xs text-slate-500 font-bold">Sélectionnez un groupe pour administrer ou consulter les listes de membres.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <UserPlus size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Choisissez votre groupe de tontine</h3>
            <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto">
              Accédez aux profils de confiance, réorganisez l'ordre de passage, gérez les suspensions, et consultez la position estimée de réception.
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
                Accéder aux Membres
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
                {isManager ? 'Gestion des Membres' : 'Membres du Groupe'}
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
          {/* Group Switcher */}
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none"
            value={activeGroupId}
            onChange={(e) => setActiveGroupId(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Manager Action: Add Member */}
          {isManager && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              Ajouter un membre
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2 animate-scale-up">
          <Check size={16} />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-2 animate-scale-up">
          <ShieldAlert size={16} />
          {actionError}
        </div>
      )}

      {/* MANAGER VIEW PORTAL */}
      {isManager ? (
        <div className="space-y-6">
          
          {/* STATS QUICK CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <article className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={20} />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Membres Totaux</span>
                <span className="text-xl font-black text-slate-800">{statsSummary.total}</span>
              </div>
            </article>

            <article className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck size={20} />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Membres Actifs</span>
                <span className="text-xl font-black text-slate-800">{statsSummary.actives}</span>
              </div>
            </article>

            <article className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <span className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <UserMinus size={20} />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Suspendus</span>
                <span className="text-xl font-black text-slate-800">{statsSummary.suspended}</span>
              </div>
            </article>

            <article className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ShieldAlert size={20} />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">En retard</span>
                <span className="text-xl font-black text-slate-800">{statsSummary.lates}</span>
              </div>
            </article>
          </div>

          {/* MAIN INTERACTIVE TABLE */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-base">Tableau d'administration des membres</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Membre</th>
                    <th className="py-3 px-2">Téléphone</th>
                    <th className="py-3 px-2">N° Mobile Money</th>
                    <th className="py-3 px-2">Ordre</th>
                    <th className="py-3 px-2">Statut</th>
                    <th className="py-3 px-2">Dernière cotisation</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m, idx) => {
                    const u = getUserInfo(m.utilisateur_id);
                    const isLate = isMemberLate(m.id) && m.statut === 'actif';
                    
                    return (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-4 px-2">
                          <div>
                            <span className="font-black text-slate-800 block leading-none">{u.nom}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 font-mono text-[10px] text-slate-500 font-bold">{u.telephone || '—'}</td>
                        <td className="py-4 px-2 font-bold text-slate-500 text-[10px]">{u.momo || '—'}</td>
                        <td className="py-4 px-2 font-black text-slate-800">
                          {m.ordre_reception ? `${m.ordre_reception}${m.ordre_reception === 1 ? 'er' : 'ème'}` : '—'}
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            m.statut === 'suspendu' 
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : isLate 
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {m.statut === 'suspendu' ? '🚫 Suspendu' : isLate ? '⚠️ Retard' : '✅ Actif'}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-bold text-slate-500">
                          {getLatestCotisationDate(m.id)}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleOpenDetail(m)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150 rounded-lg transition-colors"
                              title="Voir fiche complète"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleOpenEditOrder(m)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150 rounded-lg transition-colors"
                              title="Modifier l'ordre"
                            >
                              <Sliders size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(m)}
                              className={`p-1.5 border rounded-lg transition-colors ${
                                m.statut === 'suspendu'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-150'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-150'
                              }`}
                              title={m.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                            >
                              {m.statut === 'suspendu' ? <UserCheck size={13} /> : <UserMinus size={13} />}
                            </button>
                            {isLate && (
                              <button
                                onClick={() => handleRemindMember(m.id)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-150 rounded-lg transition-colors"
                                title="Relancer paiement"
                              >
                                <Send size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMember(m.id)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-150 rounded-lg transition-colors"
                              title="Retirer définitivement"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        
        // MEMBER VIEW PORTAL
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* MY POSITION SIDEBAR CARD */}
          <div className="md:col-span-1 space-y-6">
            <article className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Award size={120} />
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Ma position de tirage</span>
                  <h3 className="font-extrabold text-lg text-white">Ma Position Estimée</h3>
                </div>

                {estimatedTourDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mon Ordre</span>
                        <span className="text-sm font-black text-slate-200 mt-1 block">{estimatedTourDetails.order}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Prochain Tour</span>
                        <span className="text-sm font-black text-emerald-400 mt-1 block">{estimatedTourDetails.cycle}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Date Estimée</span>
                      <span className="text-sm font-black text-blue-400 mt-1 block capitalize">{estimatedTourDetails.dateStr}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">Votre ordre de réception n'a pas encore été configuré par le gestionnaire.</p>
                )}
              </div>
            </article>

            {/* CONFIDENTIALITY STATEMENT */}
            <article className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert size={16} />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Règle de vie privée</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal">
                  Pour votre sécurité et votre tranquillité, les numéros de téléphone et les coordonnées Mobile Money des autres membres sont exclusivement visibles par le gestionnaire de la tontine.
                </p>
              </div>
            </article>
          </div>

          {/* PRIVACY-FILTERED MEMBER LIST */}
          <div className="md:col-span-2">
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h3 className="font-extrabold text-slate-800 text-base">Liste des membres du groupe</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                      <th className="py-3 px-2">#</th>
                      <th className="py-3 px-2">Nom</th>
                      <th className="py-3 px-2">Ordre de réception</th>
                      <th className="py-3 px-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m, idx) => {
                      const u = getUserInfo(m.utilisateur_id);
                      const isMe = u.id === user?.id;
                      const isLate = isMemberLate(m.id) && m.statut === 'actif';
                      
                      return (
                        <tr key={m.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isMe ? 'bg-blue-50/20' : ''}`}>
                          <td className="py-4 px-2 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-4 px-2 font-black text-slate-800">
                            {isMe ? 'Moi (' + u.nom + ')' : u.nom}
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-550">
                            {m.ordre_reception ? `${m.ordre_reception}${m.ordre_reception === 1 ? 'er' : 'ème'}` : 'Non défini'}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              m.statut === 'suspendu' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : isLate 
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {m.statut === 'suspendu' ? '🚫 Suspendu' : isLate ? '⚠️ Retard' : '✅ Actif'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODAL AJOUTER UN MEMBRE (MANAGER) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up space-y-5">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserPlus size={20} />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Inviter un membre</h3>
                <p className="text-[10px] text-slate-400 font-bold">Sélectionnez un compte utilisateur existant et envoyez-lui une invitation à rejoindre le groupe.</p>
              </div>
            </div>

             <form onSubmit={handleAddMemberSubmit} className="space-y-4">
               {/* Select User */}
               <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Sélectionner l'utilisateur *</label>
                 <select
                   required
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                   value={addForm.utilisateur_id}
                   onChange={(e) => setAddForm({ ...addForm, utilisateur_id: e.target.value })}
                 >
                   <option value="">Sélectionner...</option>
                   {selectableUsers.map(u => (
                     <option key={u.id} value={u.id}>{u.nom} ({u.email || u.telephone || 'Aucune info'})</option>
                   ))}
                 </select>
               </div>

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm"
               >
                 {loading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL MODIFIER L'ORDRE DE RECEPTION (MANAGER) */}
      {isEditOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsEditOrderModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Modifier l'ordre de réception</h3>
              <p className="text-[10px] text-slate-400 font-bold">
                Configurez la position de réception pour <span className="font-extrabold text-slate-600">{getUserInfo(selectedMember?.utilisateur_id).nom}</span>.
              </p>
            </div>

            <form onSubmit={handleEditOrderSubmit} className="space-y-4">
              <input
                type="number"
                min="1"
                required
                placeholder="ex: 3"
                value={newOrderValue}
                onChange={(e) => setNewOrderValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOrderModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xs uppercase py-2.5 rounded-xl border border-slate-150 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL FICHE DETAILLE DU MEMBRE (MANAGER SHEET) */}
      {isDetailModalOpen && selectedMember && (() => {
        const u = getUserInfo(selectedMember.utilisateur_id);
        const mStats = getMemberStats(selectedMember.id);
        const mContribs = contributions.filter(c => String(c.membre_id) === String(selectedMember.id));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsDetailModalOpen(false)}></div>
            <div className="bg-white h-full w-full max-w-md p-6 relative border-l border-slate-100 z-10 animate-slide-left space-y-6 overflow-y-auto shadow-2xl">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>

              {/* Member General Info Card */}
              <div className="space-y-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-lg">
                    {u.nom.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-none">{u.nom}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                      {selectedMember.statut === 'suspendu' ? '🚫 Suspendu' : '✅ Membre Actif'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 font-semibold pt-2">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span>Email : {u.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>Tél : {u.telephone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400" />
                    <span>MoMo : {u.momo || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Membre depuis : {new Date(selectedMember.date_adhesion).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-slate-400" />
                    <span>Ordre : {selectedMember.ordre_reception ? `${selectedMember.ordre_reception}${selectedMember.ordre_reception === 1 ? 'er' : 'ème'} à recevoir` : 'Non défini'}</span>
                  </div>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="space-y-4 border-b border-slate-100 pb-5">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Activity size={14} />
                  Statistiques
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Cotisations payées</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{mStats.paidCount}/{mStats.totalCycles} ({mStats.payRatio}%)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Retards</span>
                    <span className="text-sm font-black text-rose-600 mt-1 block">{mStats.lateCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Emprunts en cours</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{mStats.activeLoans}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Score fiabilité</span>
                    <span className="text-sm font-black text-emerald-600 mt-1 block">{mStats.reliability}%</span>
                  </div>
                </div>

                {/* Score visual meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Niveau de confiance</span>
                    <span className="text-slate-700 font-extrabold">{mStats.reliability}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${mStats.reliability}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Payments History */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <BookOpen size={14} />
                  Historique de paiements
                </h4>

                {mContribs.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-400 italic">Aucune cotisation enregistrée pour ce membre.</p>
                ) : (
                  <div className="space-y-2">
                    {mContribs.map(c => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Cycle {cycles.find(cy => cy.id === c.cycle_id)?.numero_cycle || '—'}</span>
                          <span className="text-slate-800 font-black mt-0.5 block">{formatCurrency(c.montant)} FCFA</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            c.statut === 'confirme' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {c.statut === 'confirme' ? 'Confirmé' : 'En attente'}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1 font-bold">{new Date(c.date_paiement).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MembersTab;
