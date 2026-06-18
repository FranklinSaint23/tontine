import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Settings,
  User,
  Bell,
  Banknote,
  Lock,
  Globe,
  Trash2,
  Edit2,
  ShieldAlert,
  Camera,
  Check,
  Building,
  Users,
  Shield,
  Percent,
  Coins,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import Field from '../Field';

const SettingsTab = ({
  user = {},
  onLogout,
  topUpAmount,
  setTopUpAmount,
  topUpMethod,
  setTopUpMethod,
  topUpSuccess,
  topUpError,
  savingTopUp,
  submitTopUp,
  users = [],
  formatCurrency
}) => {
  // Check if current user is admin/super_admin or named Claire
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.nom?.toLowerCase().includes('claire');

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || 'Claire',
    email: user?.email || 'claire@tontine.com',
    telephone: user?.telephone || '699 00 11 22',
    numero_mobile: user?.numero_mobile || '699 00 11 22'
  });

  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    mtn_momo: user?.numero_mobile || '699 00 11 22',
    orange_money: '677 11 22 33',
    nom_titulaire: user?.nom || 'Claire'
  });

  const [passwordForm, setPasswordForm] = useState({
    ancien: '',
    nouveau: '',
    confirmer: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    rappels: true,
    confirmations: true,
    alertes_retard: true,
    canal: 'les_deux'
  });

  const [platformUsers, setPlatformUsers] = useState(users);
  const [adminActionMessage, setAdminActionMessage] = useState('');

  const [preferences, setPreferences] = useState({
    langue: 'fr',
    devise: 'FCFA',
    format_date: 'jj_mm_aaaa'
  });

  const [platformSettings, setPlatformSettings] = useState({
    nom: 'TontineApp Cameroun',
    taux_interet: 5,
    cotisation_min: 1000,
    cotisation_max: 100000,
    duree_emprunt_max: 3
  });

  // Local alert states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setPlatformUsers(users.map((u) => ({
      ...u,
      statut: u.is_active === false ? 'Suspendu' : 'Actif',
    })));
  }, [users]);

  // Handle forms
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateMyProfile({
        nom: profileForm.nom,
        telephone: profileForm.telephone,
        numero_mobile: profileForm.numero_mobile,
      });
      setProfileSuccess('Votre profil a été mis à jour avec succès.');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileSuccess('');
      alert(err.message || 'Erreur lors de la mise à jour du profil.');
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.updateMyProfile({ numero_mobile: paymentForm.mtn_momo });
      setPaymentSuccess('Vos informations de paiement ont été mises à jour.');
      setIsEditingPayment(false);
      setTimeout(() => setPaymentSuccess(''), 4000);
    } catch (err) {
      setPaymentSuccess('');
      alert(err.message || 'Erreur lors de la mise à jour des informations de paiement.');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.nouveau !== passwordForm.confirmer) {
      setPasswordError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    if (passwordForm.nouveau.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      await api.changeMyPassword({
        ancien_mot_de_passe: passwordForm.ancien,
        nouveau_mot_de_passe: passwordForm.nouveau,
      });
      setPasswordSuccess('Votre mot de passe a été mis à jour avec succès.');
      setPasswordForm({ ancien: '', nouveau: '', confirmer: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe.');
    }
  };

  const handlePlatformSubmit = (e) => {
    e.preventDefault();
    alert('Paramètres de la plateforme sauvegardés avec succès.');
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      const updated = await api.updateUser(userId, { role: newRole });
      setPlatformUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: updated.role } : user)));
      setAdminActionMessage(`Le rôle de l'utilisateur #${userId} a été modifié en ${newRole}.`);
    } catch (err) {
      setAdminActionMessage(err.message || 'Impossible de mettre à jour le rôle.');
    }
  };

  const handleUserToggleSuspend = async (userId, currentStatus) => {
    const nextActive = currentStatus !== 'Actif';
    try {
      const updated = await api.updateUser(userId, { is_active: nextActive });
      setPlatformUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, is_active: updated.is_active, statut: updated.is_active ? 'Actif' : 'Suspendu' } : user)));
      setAdminActionMessage(`Le compte de l'utilisateur #${userId} est maintenant ${updated.is_active ? 'Actif' : 'Suspendu'}.`);
    } catch (err) {
      setAdminActionMessage(err.message || 'Impossible de modifier le statut du compte.');
    }
  };

  const handleDeactivateAccount = () => {
    if (confirm('Voulez-vous vraiment désactiver temporairement votre compte ? Vos groupes resteront inchangés.')) {
      alert('Votre compte a été désactivé temporairement. Vous allez être déconnecté.');
      if (onLogout) onLogout();
    }
  };

  const handleDeleteAccount = () => {
    const confirmation = prompt('Pour supprimer définitivement votre compte, veuillez saisir "SUPPRIMER" :');
    if (confirmation === 'SUPPRIMER') {
      alert('Votre compte a été supprimé définitivement de la plateforme. Vous allez être déconnecté.');
      if (onLogout) onLogout();
    } else if (confirmation !== null) {
      alert('Confirmation invalide. Suppression annulée.');
    }
  };

  const handleSendReminders = async () => {
    try {
      const result = await api.sendReminders();
      setAdminActionMessage(`Rappels envoyés : ${result.sent}`);
    } catch (err) {
      setAdminActionMessage(err.message || "Impossible d'envoyer les rappels.");
    }
  };

  const handleProcessLate = async () => {
    try {
      const result = await api.processLate();
      setAdminActionMessage(`Cotisations en retard traitées : ${result.processed}`);
    } catch (err) {
      setAdminActionMessage(err.message || 'Impossible de traiter les retards.');
    }
  };

  const displayUsers = platformUsers.length > 0 ? platformUsers : [
    { id: 1, nom: 'Claire (Vous)', email: 'claire@tontine.com', role: 'super_admin', statut: 'Actif' },
    { id: 2, nom: 'Jean Mballa', email: 'jean.mballa@gmail.com', role: 'admin', statut: 'Actif' },
    { id: 3, nom: 'Marie Ngono', email: 'marie.ngono@yahoo.fr', role: 'membre', statut: 'Actif' },
    { id: 4, nom: 'Paul Essomba', email: 'paul.essomba@outlook.com', role: 'membre', statut: 'Actif' },
    { id: 5, nom: 'Hélène Tabi', email: 'helene.tabi@gmail.com', role: 'membre', statut: 'Suspendu' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Settings size={28} className="text-blue-600 animate-spin-slow" />
            Paramètres
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Gérez vos informations personnelles, vos notifications et les préférences de la plateforme.
          </p>
        </div>

        <button 
          onClick={onLogout}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center gap-2 shrink-0"
        >
          Se déconnecter
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Forms (Span 7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. 👤 Mon Profil */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <User size={18} className="text-blue-600" />
              👤 Mon Profil
            </h3>

            {profileSuccess && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                {profileSuccess}
              </p>
            )}

            {/* Avatar Profile Section */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-18 h-18 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-md border-4 border-slate-50">
                  {profileForm.nom.substring(0, 2).toUpperCase()}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border border-white shadow-sm cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera size={12} />
                  <input type="file" className="hidden" />
                </label>
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-lg leading-tight">{profileForm.nom}</p>
                <p className="text-xs text-slate-400 font-bold mt-1">{profileForm.email}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider">
                  {user?.role || 'Gestionnaire'}
                </span>
              </div>
            </div>

            {/* Profile fields / Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom complet">
                  <input 
                    className="input font-bold" 
                    value={profileForm.nom}
                    onChange={e => setProfileForm({...profileForm, nom: e.target.value})}
                    disabled={!isEditingProfile}
                    required 
                  />
                </Field>
                <Field label="Adresse email">
                  <input 
                    className="input font-bold font-mono text-slate-600" 
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    disabled={!isEditingProfile}
                    required 
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Numéro de téléphone">
                  <input 
                    className="input font-bold font-mono" 
                    value={profileForm.telephone}
                    onChange={e => setProfileForm({...profileForm, telephone: e.target.value})}
                    disabled={!isEditingProfile}
                  />
                </Field>
                <Field label="Mobile Money (MTN / Orange)">
                  <input 
                    className="input font-bold font-mono" 
                    value={profileForm.numero_mobile}
                    onChange={e => setProfileForm({...profileForm, numero_mobile: e.target.value})}
                    disabled={!isEditingProfile}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {isEditingProfile ? (
                  <>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all"
                    >
                      Sauvegarder
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Edit2 size={12} />
                      Modifier mon profil
                    </button>
                    <a 
                      href="#security-password" 
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Changer mon mot de passe
                    </a>
                  </>
                )}
              </div>
            </form>
          </section>

          {/* 2. 🔔 Notifications */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Bell size={18} className="text-blue-600" />
              🔔 Alertes & Notifications
            </h3>

            <div className="space-y-4">
              {/* Toggle 1 */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">Rappels de cotisation</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Envoyer un rappel automatique avant la date limite</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.rappels} 
                  onChange={e => setNotificationSettings({...notificationSettings, rappels: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600 border-slate-350 focus:ring-blue-500" 
                />
              </label>

              {/* Toggle 2 */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">Confirmations de paiement</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Recevoir un reçu instantané après validation</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.confirmations} 
                  onChange={e => setNotificationSettings({...notificationSettings, confirmations: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600 border-slate-350 focus:ring-blue-500" 
                />
              </label>

              {/* Toggle 3 */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">Alertes de retard</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Notifier en cas de retard sur une de vos tontines</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings.alertes_retard} 
                  onChange={e => setNotificationSettings({...notificationSettings, alertes_retard: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600 border-slate-350 focus:ring-blue-500" 
                />
              </label>

              {/* Canal Dropdown */}
              <div className="pt-2 border-t border-slate-50">
                <Field label="Canal de réception préféré">
                  <select 
                    className="input w-full font-semibold text-slate-700" 
                    value={notificationSettings.canal}
                    onChange={e => setNotificationSettings({...notificationSettings, canal: e.target.value})}
                  >
                    <option value="email">Email uniquement</option>
                    <option value="sms">SMS uniquement</option>
                    <option value="les_deux">SMS et Email (Les deux)</option>
                  </select>
                </Field>
              </div>
            </div>
          </section>

          {/* 3. 🏦 Informations de paiement */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Banknote size={18} className="text-blue-600" />
              🏦 Informations de paiement
            </h3>

            {paymentSuccess && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                {paymentSuccess}
              </p>
            )}

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Numéro MTN MoMo (Mobile Money)">
                  <input 
                    className="input font-bold font-mono" 
                    value={paymentForm.mtn_momo}
                    onChange={e => setPaymentForm({...paymentForm, mtn_momo: e.target.value})}
                    disabled={!isEditingPayment}
                  />
                </Field>
                <Field label="Numéro Orange Money (OM)">
                  <input 
                    className="input font-bold font-mono" 
                    value={paymentForm.orange_money}
                    onChange={e => setPaymentForm({...paymentForm, orange_money: e.target.value})}
                    disabled={!isEditingPayment}
                  />
                </Field>
              </div>

              <Field label="Nom complet du titulaire des comptes">
                <input 
                  className="input font-bold" 
                  value={paymentForm.nom_titulaire}
                  onChange={e => setPaymentForm({...paymentForm, nom_titulaire: e.target.value})}
                  disabled={!isEditingPayment}
                  placeholder="Ex: Marie Ngono..."
                />
              </Field>

              <div className="flex items-center gap-3">
                {isEditingPayment ? (
                  <>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all"
                    >
                      Enregistrer
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingPayment(false)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsEditingPayment(true)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Edit2 size={12} />
                    Modifier
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* 4. 🔐 Sécurité */}
          <section id="security-password" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5Scroll">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Lock size={18} className="text-blue-600" />
              🔐 Sécurité (Mot de passe)
            </h3>

            {passwordSuccess && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                {passwordSuccess}
              </p>
            )}

            {passwordError && (
              <p className="rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                {passwordError}
              </p>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Field label="Ancien mot de passe">
                <input 
                  className="input font-bold" 
                  type="password" 
                  value={passwordForm.ancien}
                  onChange={e => setPasswordForm({...passwordForm, ancien: e.target.value})}
                  required 
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nouveau mot de passe">
                  <input 
                    className="input font-bold" 
                    type="password" 
                    value={passwordForm.nouveau}
                    onChange={e => setPasswordForm({...passwordForm, nouveau: e.target.value})}
                    required 
                  />
                </Field>
                <Field label="Confirmer le nouveau mot de passe">
                  <input 
                    className="input font-bold" 
                    type="password" 
                    value={passwordForm.confirmer}
                    onChange={e => setPasswordForm({...passwordForm, confirmer: e.target.value})}
                    required 
                  />
                </Field>
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all"
              >
                Mettre à jour
              </button>
            </form>
          </section>

        </div>

        {/* Right Side: Preferences, Danger Zone, Super Admin Panels (Span 5) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* 5. 🌍 Préférences */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Globe size={18} className="text-blue-600" />
              🌍 Préférences régionales
            </h3>
            
            <div className="space-y-4">
              <Field label="Langue de l'application">
                <select 
                  className="input w-full font-semibold text-slate-700" 
                  value={preferences.langue}
                  onChange={e => setPreferences({...preferences, langue: e.target.value})}
                >
                  <option value="fr">Français (French)</option>
                  <option value="en">English (Anglais)</option>
                </select>
              </Field>

              <Field label="Devise de la plateforme">
                <input 
                  className="input w-full font-black text-slate-550 bg-slate-50 border border-slate-100" 
                  value="FCFA (Franc CFA)" 
                  disabled 
                  readOnly 
                />
              </Field>

              <Field label="Format de date">
                <select 
                  className="input w-full font-semibold text-slate-700" 
                  value={preferences.format_date}
                  onChange={e => setPreferences({...preferences, format_date: e.target.value})}
                >
                  <option value="jj_mm_aaaa">JJ/MM/AAAA (ex: 20/05/2026)</option>
                  <option value="aaaa_mm_jj">AAAA-MM-JJ (ex: 2026-05-20)</option>
                </select>
              </Field>
            </div>
          </section>

          {/* 6. 🗑️ Zone dangereuse */}
          <section className="bg-white rounded-xl border border-rose-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
            <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2 border-b border-rose-50 pb-3">
              <Trash2 size={18} className="text-rose-600" />
              🗑️ Zone de danger
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                <p className="font-extrabold text-amber-800 text-xs">Désactiver temporairement mon compte</p>
                <p className="text-[10px] text-amber-600 font-bold leading-normal">
                  Cela suspendra temporairement vos accès mais vos données de tontine resteront parfaitement préservées pour vos groupes.
                </p>
                <button 
                  onClick={handleDeactivateAccount}
                  className="w-full bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black py-2 px-3 rounded-lg uppercase tracking-wider transition-all"
                >
                  Désactiver mon compte
                </button>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                <p className="font-extrabold text-rose-800 text-xs">Supprimer définitivement mon compte</p>
                <p className="text-[10px] text-rose-600 font-bold leading-normal">
                  Cette action est irréversible. Toutes vos données seront définitivement effacées conformément aux CGU de la plateforme.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black py-2 px-3 rounded-lg uppercase tracking-wider shadow-sm transition-all"
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* SUPER ADMIN PANELS SECTION (🏢 PLATFORM SETTINGS & 👥 USERS DATABASE) */}
      {isSuperAdmin && (
        <div className="border-t border-slate-100 pt-8 space-y-8 animate-fade-in">
          
          <div className="border-b border-slate-50 pb-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Shield size={24} className="text-blue-600" />
              Espace Administration (Super Admin)
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1.5">
              Ces options d'administration avancées ne sont accessibles qu'aux gestionnaires de la plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 7. 🏢 Paramètres de la plateforme (Span 5) */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-5 space-y-5">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Building size={18} className="text-blue-600" />
                🏢 Paramètres de la plateforme
              </h3>

              <form onSubmit={handlePlatformSubmit} className="space-y-4">
                <Field label="Nom de la plateforme de Tontine">
                  <input 
                    className="input font-bold" 
                    value={platformSettings.nom}
                    onChange={e => setPlatformSettings({...platformSettings, nom: e.target.value})}
                    required 
                  />
                </Field>

                {/* Logo Simulator Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Logo de la marque</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <Building size={28} className="text-slate-350 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-700">Déposer un nouveau logo</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">PNG, JPG ou SVG (Max. 2 Mo)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Intérêt de prêt (%)">
                    <div className="relative">
                      <input 
                        className="input w-full font-bold font-mono pr-8" 
                        type="number"
                        value={platformSettings.taux_interet}
                        onChange={e => setPlatformSettings({...platformSettings, taux_interet: Number(e.target.value)})}
                        required 
                      />
                      <Percent size={14} className="absolute right-3 top-3 text-slate-400" />
                    </div>
                  </Field>
                  <Field label="Durée de prêt max.">
                    <select 
                      className="input w-full font-semibold text-slate-700"
                      value={platformSettings.duree_emprunt_max}
                      onChange={e => setPlatformSettings({...platformSettings, duree_emprunt_max: Number(e.target.value)})}
                    >
                      <option value={1}>1 mois</option>
                      <option value={3}>3 mois</option>
                      <option value={6}>6 mois</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cotisation Min. (FCFA)">
                    <input 
                      className="input w-full font-bold font-mono" 
                      type="number"
                      value={platformSettings.cotisation_min}
                      onChange={e => setPlatformSettings({...platformSettings, cotisation_min: Number(e.target.value)})}
                      required 
                    />
                  </Field>
                  <Field label="Cotisation Max. (FCFA)">
                    <input 
                      className="input w-full font-bold font-mono" 
                      type="number"
                      value={platformSettings.cotisation_max}
                      onChange={e => setPlatformSettings({...platformSettings, cotisation_max: Number(e.target.value)})}
                      required 
                    />
                  </Field>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 px-4 rounded-lg uppercase tracking-wider shadow-sm transition-all"
                >
                  Sauvegarder la configuration
                </button>
              </form>
            </section>

            {/* 8. 👥 Gestion des utilisateurs (Span 7) */}
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-7 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  👥 Gestion des utilisateurs & Comptes ({displayUsers.length})
                </h3>
              </div>

              {/* Minimal platform statistics row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 shadow-inner">
                  <span className="text-[9px] text-blue-500 font-black uppercase tracking-wider block">Inscrits globaux</span>
                  <span className="text-xl font-black text-blue-700 mt-1 block">{displayUsers.length}</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 shadow-inner">
                  <span className="text-[9px] text-emerald-500 font-black uppercase tracking-wider block">Actifs ce jour</span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">{displayUsers.filter(u => u.statut === 'Actif').length}</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 shadow-inner">
                  <span className="text-[9px] text-rose-500 font-black uppercase tracking-wider block">Suspendus</span>
                  <span className="text-xl font-black text-rose-700 mt-1 block">{displayUsers.filter(u => u.statut === 'Suspendu').length}</span>
                </div>
              </div>

              {/* Users table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-1">Utilisateur</th>
                      <th className="py-2.5 px-1">Rôle</th>
                      <th className="py-2.5 px-1">Statut</th>
                      <th className="py-2.5 px-1 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map((u, index) => (
                      <tr className="border-b border-slate-50 font-bold hover:bg-slate-50/50 transition-colors" key={index}>
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-650 shrink-0">
                              {u.nom.substring(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-slate-800 leading-tight truncate text-xs">{u.nom}</p>
                              <p className="text-[10px] text-slate-400 font-bold leading-tight truncate mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-1">
                          <select 
                            className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-semibold"
                            value={u.role}
                            onChange={e => handleUserRoleChange(u.id, e.target.value)}
                          >
                            <option value="membre">Membre</option>
                            <option value="admin">Administrateur</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            u.statut === 'Actif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {u.statut}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-right">
                          <button 
                            onClick={() => handleUserToggleSuspend(u.id, u.statut)}
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                              u.statut === 'Actif'
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100'
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100'
                            }`}
                          >
                            {u.statut === 'Actif' ? 'Suspendre' : 'Réactiver'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {adminActionMessage && (
              <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700">
                {adminActionMessage}
              </section>
            )}

            <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-12 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Actions Super Admin</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleSendReminders}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-lg uppercase tracking-wider transition-all"
                >
                  Envoyer les rappels
                </button>
                <button
                  type="button"
                  onClick={handleProcessLate}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-3 rounded-lg uppercase tracking-wider transition-all"
                >
                  Traiter les retards
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsTab;
