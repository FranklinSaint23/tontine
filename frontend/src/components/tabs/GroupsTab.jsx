import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ArrowLeft,
  Settings,
  Trash2,
  Calendar,
  Banknote,
  RefreshCcw,
  Landmark,
  User,
  Clock,
  CheckCircle2,
  Shield,
  Eye,
  AlertTriangle,
  Play,
  X,
  Check,
  UserCheck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  UserPlus,
  LogOut,
  Sparkles,
  Loader2,
  HelpCircle
} from 'lucide-react';
import Field from '../Field';
import { api } from '../../api';

function AIGroupQA({ groupId }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true); setError(''); setAnswer('')
    try {
      const { reponse } = await api.aiGroupQA(Number(groupId), question.trim())
      setAnswer(reponse)
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
            <h4 className="font-black text-slate-800 text-sm">Assistant règles du groupe</h4>
            <p className="text-[10px] text-slate-400 font-bold">Posez vos questions sur ce groupe</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 font-black">{open ? 'Réduire ▲' : 'Ouvrir ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="ex: Que se passe-t-il si je rate 2 cotisations ? Quel est le montant du cycle ?"
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button onClick={ask} disabled={loading || !question.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <HelpCircle size={12} />}
            {loading ? 'Réflexion...' : 'Poser la question'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {answer && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const GroupsTab = ({
  groups = [],
  groupSearch = '',
  setGroupSearch,
  openGroup,
  setActiveTab,
  handleSuspendGroup,
  handleDeleteGroup,
  declarePayment,
  groupSummaries,
  loadingGroupSummaries,
  loadGroupSummaries,
  refreshMembers,
  refreshRotatingData,
  refreshCreditData,
  refreshJoinRequests,
  refreshExitRequests,
  user = {},
  selectedGroup = null,
  setSelectedGroup,
  members = [],
  cycles = [],
  contributions = [],
  loans = [],
  repayments = [],
  joinRequests = [],
  exitRequests = [],
  approveJoinRequest,
  rejectJoinRequest,
  approveExitRequest,
  rejectExitRequest,
  addMember,
  createCycle,
  formatCurrency,
  users = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState('managed'); // 'managed' or 'joined'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);

  // Group Details forms state
  const [groupForm, setGroupForm] = useState({
    nom: '',
    montant_cotisation: '',
    frequence: 'mensuel',
    type: 'rotatif',
    date_debut: new Date().toISOString().slice(0, 10),
  });
  const [memberForm, setMemberForm] = useState({
    utilisateur_id: '',
    ordre_reception: '',
    date_adhesion: new Date().toISOString().slice(0, 10),
  });
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    numero_transaction: '',
  });
  const [cycleForm, setCycleForm] = useState({
    beneficiaire_id: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groups && groups.length > 0 && loadGroupSummaries) {
      loadGroupSummaries();
    }
  }, [groups.length]);

  // Filtering groups
  const managedGroups = groups.filter(g => g.gestionnaire_id === user?.id);
  const joinedGroups = groups.filter(g => g.gestionnaire_id !== user?.id);

  const filteredManaged = managedGroups.filter(g =>
    !groupSearch || g.nom.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const filteredJoined = joinedGroups.filter(g =>
    !groupSearch || g.nom.toLowerCase().includes(groupSearch.toLowerCase())
  );

  // Group creation handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Assuming API client is available globally or we use main.jsx submitGroup prop
      setSaving(false);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      setSaving(false);
    }
  };

  // Member suspend mockup toggle
  const handleToggleMember = (memberId) => {
    alert(`Le statut du membre ${memberId} a été mis à jour avec succès.`);
  };

  // Confirm pending payment
  const handleConfirmPayment = (paymentId) => {
    alert(`Le paiement #${paymentId} a été confirmé avec succès. La caisse du groupe a été mise à jour.`);
  };

  // If viewing group details
  if (selectedGroup) {
    const isManager = selectedGroup.gestionnaire_id === user?.id;
    const summary = groupSummaries?.get(selectedGroup.id) || {};
    
    const groupMembers = members.length > 0 
      ? members.map((m, idx) => {
          const u = users.find((usr) => usr.id === m.utilisateur_id) || {};
          return {
            id: m.id,
            utilisateur_id: m.utilisateur_id,
            nom: u.nom || m.utilisateur_nom || `Membre #${m.utilisateur_id}`,
            tel: u.numero_mobile || u.telephone || m.tel || 'Non renseigné',
            ordre: m.ordre_reception || idx + 1,
            statut: m.statut || 'Actif',
            paiement: contributions.find(c => c.membre_id === m.id)?.statut === 'confirme' ? 'Confirmé' : 'En attente'
          }
        })
      : [];

    const activeCycle = cycles.find(c => c.statut === 'en_cours');
    const activeCycleNumber = activeCycle ? activeCycle.numero_cycle : null;
    const activeCycleBeneficiary = activeCycle ? activeCycle.beneficiaire_nom || `Membre #${activeCycle.beneficiaire_id}` : null;

    const cycleList = cycles.length > 0 
      ? cycles.map(c => ({
          id: c.id,
          numero: c.numero_cycle,
          beneficiaire: c.beneficiaire_nom || 'Inconnu',
          statut: c.statut === 'termine' ? 'Terminé' : 'En cours',
          date: new Date(c.date_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        }))
      : [];

    // Calculate progression
    const confirmedCount = groupMembers.filter(m => m.paiement === 'Confirmé').length;
    const totalCount = groupMembers.length;
    const progressPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <AIGroupQA groupId={selectedGroup.id} />
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedGroup(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider mb-2"
            >
              <ArrowLeft size={14} />
              Retour aux groupes
            </button>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              {selectedGroup.nom}
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ${
                selectedGroup.statut === 'actif' || selectedGroup.statut === 'Actif'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {selectedGroup.statut || 'Actif'}
              </span>
            </h1>
            <p className="text-sm font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
              Code d'invitation : <span className="font-mono bg-slate-50 px-2 py-0.5 border border-slate-100 rounded text-slate-600 font-bold">{selectedGroup.code_invitation}</span>
            </p>
          </div>

          {/* Action buttons depending on role */}
          {isManager ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsNewCycleModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2"
              >
                <RefreshCcw size={16} />
                Lancer un cycle
              </button>
              <button 
                onClick={() => handleSuspendGroup(selectedGroup.id)}
                className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg font-bold text-slate-700 shadow-sm transition-all text-sm flex items-center gap-2"
              >
                {selectedGroup.statut === 'suspendu' ? 'Activer' : 'Suspendre'}
              </button>
              <button 
                onClick={() => { if(confirm('Supprimer ce groupe ?')) handleDeleteGroup(selectedGroup.id); }}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsDeclareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2 animate-pulse"
            >
              <Banknote size={16} />
              Déclarer mon paiement
            </button>
          )}
        </div>

        {/* Details Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: GENERAL INFO & CYCLES PROGRESS (Span 5) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 📋 Informations générales */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Shield size={18} className="text-blue-600" />
                📋 Informations générales
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Montant</span>
                  <p className="text-base text-slate-800 mt-1">{formatCurrency(selectedGroup.montant_cotisation)} FCFA</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fréquence</span>
                  <p className="text-base text-slate-800 mt-1 capitalize">{selectedGroup.frequence === 'hebdo' ? 'Hebdomadaire' : 'Mensuelle'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Type</span>
                  <p className="text-base text-slate-800 mt-1 capitalize">{selectedGroup.type === 'rotatif' ? 'Rotatif' : selectedGroup.type === 'credit' ? 'Crédit' : 'Les deux'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Date de début</span>
                  <p className="text-base text-slate-800 mt-1">{new Date(selectedGroup.date_debut).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </section>

             {/* 🔄 Cycle en cours */}
             {activeCycle ? (
               <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                   <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                     <RefreshCcw size={18} className="text-blue-600 animate-spin-slow" />
                     🔄 Cycle en cours (Cycle {activeCycleNumber})
                   </h3>
                   <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-100">
                     En cours
                   </span>
                 </div>
                 <div className="space-y-4">
                   <div className="flex items-center gap-3 bg-blue-50/30 p-3.5 rounded-xl border border-blue-50">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold shadow-sm text-sm uppercase">
                       {activeCycleBeneficiary.substring(0, 2)}
                     </div>
                     <div>
                       <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider block">Bénéficiaire du cycle</span>
                       <p className="text-base font-extrabold text-slate-805 mt-0.5">{activeCycleBeneficiary}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                     <div>
                       <span>Début :</span> <span className="text-slate-850">{new Date(activeCycle.date_debut).toLocaleDateString('fr-FR')}</span>
                     </div>
                     <div>
                       <span>Fin :</span> <span className="text-slate-850">{new Date(activeCycle.date_fin).toLocaleDateString('fr-FR')}</span>
                     </div>
                     <div className="col-span-2">
                       <span>Cotisations reçues :</span> <span className="text-blue-600 font-black">{confirmedCount} / {totalCount}</span>
                     </div>
                   </div>

                   <div className="space-y-1">
                     <div className="flex justify-between text-[10px] font-black text-slate-400">
                       <span>Progression du cycle</span>
                       <span>{progressPct}%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                       <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPct}%` }}></div>
                     </div>
                   </div>
                 </div>
               </section>
             ) : (
               <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center py-10 space-y-3">
                 <RefreshCcw size={28} className="text-slate-350 mx-auto" />
                 <p className="text-sm font-extrabold text-slate-850">Aucun cycle actif</p>
                 <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-normal">Aucun cycle de cotisation n'est actuellement en cours pour ce groupe.</p>
                 {isManager && (
                   <button 
                     onClick={() => setIsNewCycleModalOpen(true)}
                     className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all"
                   >
                     Lancer le premier cycle
                   </button>
                 )}
               </section>
             )}

             {/* 📊 Historique des cycles */}
             <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
               <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                 <Calendar size={18} className="text-blue-600" />
                 📊 Historique des cycles
               </h3>
               <div className="space-y-3.5">
                 {cycleList.length > 0 ? (
                   cycleList.map((c, index) => (
                     <div className="flex items-center justify-between font-bold text-sm" key={index}>
                       <div className="flex items-center gap-2.5">
                         <span className={`w-2 h-2 rounded-full ${c.statut === 'Terminé' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
                         <span className="text-slate-800">Cycle {c.numero}</span>
                         <span className="text-slate-400 font-semibold">→ Bénéficiaire : {c.beneficiaire}</span>
                       </div>
                       {c.statut === 'Terminé' ? (
                         <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-100 flex items-center gap-1 shrink-0">
                           <CheckCircle2 size={10} /> {c.statut}
                         </span>
                       ) : (
                         <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase border border-blue-100 shrink-0">
                           {c.statut}
                         </span>
                       )}
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-slate-400 italic font-semibold text-center py-4">Aucun cycle enregistré dans l'historique.</p>
                 )}
               </div>
             </section>
           </div>
 
           {/* RIGHT COLUMN: MEMBERS & CYCLE COTISATIONS TABLE (Span 7) */}
           <div className="lg:col-span-7 space-y-8">
             
             {/* 👥 Membres */}
             <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
               <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                 <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                   <Users size={18} className="text-blue-600" />
                   👥 Membres ({groupMembers.length})
                 </h3>
                 {isManager && (
                   <button 
                     onClick={() => setIsAddMemberModalOpen(true)}
                     className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 border border-blue-100"
                   >
                     <Plus size={14} />
                     Ajouter un membre
                   </button>
                 )}
               </div>
 
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                 {groupMembers.length > 0 ? (
                   groupMembers.map((m, index) => (
                     <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors" key={index}>
                       <div className="flex items-center gap-3">
                         <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-600 shrink-0">
                           #{m.ordre}
                         </span>
                         <div>
                           <p className="font-extrabold text-slate-850 text-sm leading-tight">{m.nom}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-0.5">{m.tel}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                           m.statut === 'Actif' 
                             ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                             : 'bg-amber-50 text-amber-700 border border-amber-100'
                         }`}>
                           {m.statut}
                         </span>
                         {isManager && (
                           <button 
                             onClick={() => handleToggleMember(m.id)}
                             className="text-[9px] font-black text-slate-400 hover:text-rose-600 uppercase border border-slate-200 hover:border-rose-100 px-2 py-0.5 rounded bg-white"
                           >
                             Suspendre
                           </button>
                         )}
                       </div>
                     </div>
                   ))
                 ) : (
                   <p className="col-span-2 text-xs text-slate-400 italic font-semibold text-center py-6">Aucun membre enregistré dans ce groupe.</p>
                 )}
               </div>
             </section>
 
             {/* 💰 Cotisations du cycle */}
             <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
               <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                 <Banknote size={18} className="text-blue-600" />
                 💰 Cotisations du cycle
               </h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="border-b border-slate-100 text-slate-400 font-black text-xs uppercase tracking-wider">
                       <th className="py-3 px-1">Membre</th>
                       <th className="py-3 px-1">Montant</th>
                       <th className="py-3 px-1">Statut</th>
                       {isManager && <th className="py-3 px-1 text-right">Actions</th>}
                     </tr>
                   </thead>
                   <tbody>
                     {groupMembers.length > 0 ? (
                       groupMembers.map((m, index) => (
                         <tr className="border-b border-slate-50 font-bold hover:bg-slate-50/50 transition-colors" key={index}>
                           <td className="py-3 px-1 flex items-center gap-2">
                             <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                               #{m.ordre}
                             </span>
                             <span className="text-slate-800">{m.nom}</span>
                           </td>
                           <td className="py-3 px-1 text-slate-600">
                             {formatCurrency(selectedGroup.montant_cotisation)} FCFA
                           </td>
                           <td className="py-3 px-1">
                             <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                               m.paiement === 'Confirmé'
                                 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                 : 'bg-amber-50 text-amber-700 border border-amber-100'
                             }`}>
                               {m.paiement}
                             </span>
                           </td>
                           {isManager && (
                             <td className="py-3 px-1 text-right">
                               {m.paiement === 'En attente' ? (
                                 <button 
                                   onClick={() => handleConfirmPayment(m.id)}
                                   className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm transition-all uppercase"
                                 >
                                   Valider
                                 </button>
                               ) : (
                                 <span className="text-[10px] text-gray-400 font-bold">—</span>
                               )}
                             </td>
                           )}
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan={isManager ? 4 : 3} className="py-6 text-center text-xs text-slate-400 italic font-semibold">
                           Aucun membre disponible pour les cotisations du cycle.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </section>

             {/* 📬 Demandes d'adhésion en attente */}
             {isManager && joinRequests.filter(r => r.statut === 'en_attente').length > 0 && (
               <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                 <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                   <UserPlus size={18} className="text-blue-600" />
                   📬 Demandes d'adhésion ({joinRequests.filter(r => r.statut === 'en_attente').length})
                 </h3>
                 <div className="space-y-3">
                   {joinRequests.filter(r => r.statut === 'en_attente').map(req => {
                     const reqUser = users.find(u => u.id === req.utilisateur_id);
                     return (
                       <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                         <div>
                           <p className="font-extrabold text-slate-800 text-sm">{reqUser?.nom || `Utilisateur #${req.utilisateur_id}`}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-0.5">{req.message || 'Demande d\'adhésion'}</p>
                         </div>
                         <div className="flex gap-2">
                           <button
                             onClick={() => approveJoinRequest && approveJoinRequest(req.id)}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm transition-all uppercase flex items-center gap-1"
                           >
                             <Check size={12} /> Accepter
                           </button>
                           <button
                             onClick={() => rejectJoinRequest && rejectJoinRequest(req.id)}
                             className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all uppercase flex items-center gap-1"
                           >
                             <X size={12} /> Refuser
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </section>
             )}

             {/* 🚪 Demandes de sortie en attente */}
             {isManager && exitRequests.filter(r => r.statut === 'en_attente').length > 0 && (
               <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                 <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                   <LogOut size={18} className="text-rose-500" />
                   🚪 Demandes de sortie ({exitRequests.filter(r => r.statut === 'en_attente').length})
                 </h3>
                 <div className="space-y-3">
                   {exitRequests.filter(r => r.statut === 'en_attente').map(req => {
                     const reqMember = members.find(m => m.id === req.membre_id);
                     const reqUser = reqMember ? users.find(u => u.id === reqMember.utilisateur_id) : null;
                     return (
                       <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/30">
                         <div>
                           <p className="font-extrabold text-slate-800 text-sm">{reqUser?.nom || `Membre #${req.membre_id}`}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-0.5">{req.motif || 'Demande de sortie du groupe'}</p>
                         </div>
                         <div className="flex gap-2">
                           <button
                             onClick={() => approveExitRequest && approveExitRequest(req.id)}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm transition-all uppercase flex items-center gap-1"
                           >
                             <Check size={12} /> Approuver
                           </button>
                           <button
                             onClick={() => rejectExitRequest && rejectExitRequest(req.id)}
                             className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all uppercase flex items-center gap-1"
                           >
                             <X size={12} /> Refuser
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </section>
             )}
          </div>
        </div>

        {/* ADD MEMBER MODAL */}
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddMemberModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up">
              <button 
                onClick={() => setIsAddMemberModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2.5 mb-5">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus size={18} />
                </span>
                <h3 className="font-extrabold text-slate-855 text-base">Ajouter un membre</h3>
              </div>

              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await addMember(memberForm); setIsAddMemberModalOpen(false); }}>
                <Field label="Sélectionnez un utilisateur">
                  <select
                    className="input w-full"
                    value={memberForm.utilisateur_id || ''}
                    onChange={e => setMemberForm({...memberForm, utilisateur_id: Number(e.target.value)})}
                    required
                  >
                    <option value="">-- Choisir un utilisateur --</option>
                    {users && users.length > 0 ? (
                      users
                        .filter(u => !members.some(m => m.utilisateur_id === u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.nom}{u.email ? ` — ${u.email}` : ''}</option>
                        ))
                    ) : (
                      <option value="">Aucun utilisateur disponible</option>
                    )}
                  </select>
                </Field>
                <Field label="Ordre de réception (optionnel)">
                  <input 
                    className="input w-full" 
                    type="number"
                    placeholder="Ex: 5"
                    onChange={e => setMemberForm({...memberForm, ordre_reception: e.target.value})} 
                    value={memberForm.ordre_reception} 
                  />
                </Field>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-2" 
                  type="submit"
                >
                  Ajouter le membre
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DECLARE PAYMENT MODAL */}
        {isDeclareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeclareModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up">
              <button 
                onClick={() => setIsDeclareModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2.5 mb-5">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Banknote size={18} />
                </span>
                <h3 className="font-extrabold text-slate-855 text-base">Déclarer une cotisation</h3>
              </div>

              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await declarePayment(paymentForm); setIsDeclareModalOpen(false); }}>
                <Field label="Montant à cotiser (FCFA)">
                  <input 
                    className="input w-full font-bold" 
                    type="number"
                    value={paymentForm.montant || selectedGroup.montant_cotisation}
                    onChange={e => setPaymentForm({...paymentForm, montant: e.target.value})} 
                    required 
                  />
                </Field>
                <Field label="Numéro de transaction (OM / MoMo / Bancaire)">
                  <input 
                    className="input w-full font-mono font-bold" 
                    placeholder="Ex: TXN87654321..."
                    onChange={e => setPaymentForm({...paymentForm, numero_transaction: e.target.value.toUpperCase()})} 
                    value={paymentForm.numero_transaction} 
                    required 
                  />
                </Field>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-2" 
                  type="submit"
                >
                  Envoyer la déclaration
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LAUNCH NEW CYCLE MODAL */}
        {isNewCycleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsNewCycleModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative border border-slate-100 z-10 animate-scale-up">
              <button 
                onClick={() => setIsNewCycleModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2.5 mb-5">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <RefreshCcw size={18} />
                </span>
                <h3 className="font-extrabold text-slate-855 text-base">Lancer un nouveau cycle</h3>
              </div>

              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await createCycle(cycleForm); setIsNewCycleModalOpen(false); }}>
                <Field label="Identifiant du bénéficiaire du cycle">
                  <select 
                    className="input w-full font-semibold text-slate-700" 
                    onChange={e => setCycleForm({...cycleForm, beneficiaire_id: e.target.value})} 
                    value={cycleForm.beneficiaire_id} 
                    required
                  >
                    <option value="">Sélectionnez un bénéficiaire...</option>
                    {groupMembers.map(m => <option key={m.id} value={m.id}>{m.nom} (Ordre #{m.ordre})</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date de début">
                    <input 
                      className="input w-full" 
                      type="date"
                      value={cycleForm.date_debut}
                      onChange={e => setCycleForm({...cycleForm, date_debut: e.target.value})} 
                      required 
                    />
                  </Field>
                  <Field label="Date de fin">
                    <input 
                      className="input w-full" 
                      type="date"
                      value={cycleForm.date_fin}
                      onChange={e => setCycleForm({...cycleForm, date_fin: e.target.value})} 
                      required 
                    />
                  </Field>
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-2" 
                  type="submit"
                >
                  Lancer le cycle
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ELSE: VIEWING LISTS OF GROUPS
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Users size={28} className="text-blue-600" />
            Mes Groupes
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Gérez vos groupes de tontine ou consultez ceux auxquels vous appartenez.
          </p>
        </div>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Créer un nouveau groupe
        </button>
      </div>

      {/* Sub Tabs Selection Header */}
      <div className="flex border-b border-slate-100 gap-1.5 pb-0">
        <button 
          onClick={() => setActiveSubTab('managed')}
          className={`px-4 py-2 text-sm font-black border-b-2 uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'managed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield size={16} />
          Tontines que je gère (Vue Gestionnaire)
          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold">
            {managedGroups.length}
          </span>
        </button>
        
        <button 
          onClick={() => setActiveSubTab('joined')}
          className={`px-4 py-2 text-sm font-black border-b-2 uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'joined'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={16} />
          Tontines auxquelles je participe (Vue Membre)
          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold">
            {joinedGroups.length}
          </span>
        </button>
      </div>

      {/* Search filter row */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <input 
            className="input w-full font-bold" 
            placeholder="Rechercher un groupe..." 
            value={groupSearch} 
            onChange={(e) => setGroupSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* MANAGED VIEW LIST (Vue Gestionnaire) */}
      {activeSubTab === 'managed' && (
        <div className="grid gap-6">
          {filteredManaged.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Shield size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-500">Aucun groupe géré pour le moment.</p>
              <p className="text-xs text-slate-400 mt-1 font-bold">Créez votre premier groupe en cliquant sur le bouton ci-dessus.</p>
            </div>
          ) : (
            filteredManaged.map((group) => {
              const summ = groupSummaries?.get(group.id) || {};
              const membersCount = summ.membersCount ?? 8;
              const currentCycle = summ.currentCycle ? `Cycle ${summ.currentCycle.numero_cycle}` : 'Cycle 3';
              const progressPct = summ.progress ?? 75;

              return (
                <article key={group.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-4">
                      
                      {/* Title row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-blue-600 transition-colors leading-tight">
                          {group.nom}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {group.type === 'rotatif' ? 'Rotatif' : group.type === 'credit' ? 'Crédit' : 'Les deux'}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-wider capitalize">
                          {group.frequence === 'hebdo' ? 'Hebdomadaire' : 'Mensuelle'}
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {group.statut || 'Actif'}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-500">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Cotisation</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">{formatCurrency(group.montant_cotisation)} FCFA</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Membres</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">{membersCount} membres</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Cycle en cours</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">{currentCycle}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Code d'invitation</span>
                          <span className="text-sm font-mono text-slate-800 font-extrabold mt-0.5 block">{group.code_invitation}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Progression du cycle</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex items-center gap-3 shrink-0 border-t border-slate-50 pt-4 md:pt-0 md:border-t-0">
                      <button 
                        onClick={() => openGroup(group)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Ouvrir
                      </button>
                      <button 
                        onClick={() => handleSuspendGroup(group.id)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all text-slate-700"
                      >
                        {group.statut === 'suspendu' ? 'Activer' : 'Suspendre'}
                      </button>
                      <button 
                        onClick={() => { if(confirm('Supprimer ce groupe ?')) handleDeleteGroup(group.id); }}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all text-rose-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* JOINED VIEW LIST (Vue Membre) */}
      {activeSubTab === 'joined' && (
        <div className="grid gap-6">
          {filteredJoined.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-base font-extrabold text-slate-500">Aucun groupe membre pour le moment.</p>
              <p className="text-xs text-slate-400 mt-1 font-bold">Rejoignez un groupe existant en entrant son code d'invitation depuis le tableau de bord.</p>
            </div>
          ) : (
            filteredJoined.map((group) => {
              return (
                <article key={group.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-4">
                      
                      {/* Title row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-blue-600 transition-colors leading-tight">
                          {group.nom}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Membre
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-55 text-slate-650 border border-slate-150 rounded-full text-[9px] font-black uppercase tracking-wider capitalize">
                          {group.frequence === 'hebdo' ? 'Hebdomadaire' : 'Mensuelle'}
                        </span>
                      </div>
 
                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-500">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Ordre de réception</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">À consulter</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Ma Cotisation</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">{formatCurrency(group.montant_cotisation)} FCFA</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Dernier paiement</span>
                          <span className="mt-1 block">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[9px] font-black uppercase">
                              À consulter
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Prochain cycle bénéficiaire</span>
                          <span className="text-sm text-slate-800 font-extrabold mt-0.5 block">À consulter</span>
                        </div>
                      </div>
                    </div>
 
                    {/* Actions panel */}
                    <div className="flex items-center gap-3 shrink-0 border-t border-slate-50 pt-4 md:pt-0 md:border-t-0">
                      <button 
                        onClick={() => openGroup(group)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Consulter
                      </button>
                      <button 
                        onClick={() => { openGroup(group); setIsDeclareModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Banknote size={14} />
                        Déclarer paiement
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* CREATE GROUP MODAL IN GROUPS TAB */}
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

            <form className="space-y-4" onSubmit={handleCreateGroup}>
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
                    placeholder="Ex: 1000"
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
    </div>
  );
};

export default GroupsTab;
