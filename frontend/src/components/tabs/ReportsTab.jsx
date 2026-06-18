import React, { useState, useEffect } from 'react';
import {
  FileText,
  Activity,
  Search,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  Bell
} from 'lucide-react';
import { api } from '../../api';

function AIReportsPanel({ groups = [] }) {
  const [tab, setTab] = useState('summary')
  const [groupId, setGroupId] = useState('')
  const [summary, setSummary] = useState('')
  const [notifType, setNotifType] = useState('rappel_cotisation')
  const [notifMessages, setNotifMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const run = async () => {
    if (!groupId) return
    setLoading(true); setError(''); setSummary(''); setNotifMessages([])
    try {
      if (tab === 'summary') {
        const { resume } = await api.aiReportSummary(Number(groupId))
        setSummary(resume)
      } else {
        const { messages } = await api.aiGenerateNotifications(Number(groupId), notifType)
        setNotifMessages(messages || [])
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const NOTIF_TYPES = [
    { value: 'rappel_cotisation', label: 'Rappel cotisation' },
    { value: 'retard', label: 'Retard paiement' },
    { value: 'bienvenue', label: 'Bienvenue' },
    { value: 'encouragement', label: 'Encouragement' },
  ]

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm print:hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-800 text-sm">Analyse IA</h4>
            <p className="text-[10px] text-slate-400 font-bold">Résumé narratif · Notifications personnalisées</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 font-black">{open ? 'Réduire ▲' : 'Ouvrir ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-1">
            {[{ id: 'summary', label: 'Résumé narratif' }, { id: 'notifs', label: 'Notifications IA' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Groupe</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner un groupe —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>

          {tab === 'notifs' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Type de notification</label>
              <select value={notifType} onChange={(e) => setNotifType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {NOTIF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}

          <button onClick={run} disabled={loading || !groupId}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">
            {loading ? <Loader2 size={12} className="animate-spin" /> : tab === 'summary' ? <FileText size={12} /> : <Bell size={12} />}
            {loading ? 'Génération...' : tab === 'summary' ? 'Générer le résumé' : 'Générer les messages'}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {summary && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}

          {notifMessages.length > 0 && (
            <div className="space-y-2">
              {notifMessages.map((m, i) => (
                <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-black text-blue-600 mb-0.5">{m.nom}</p>
                  <p className="text-xs text-slate-700">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ReportsTab = ({
  groups = [],
  formatCurrency = (v) => v,
}) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch reports when filters change
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.reports(selectedGroup, selectedPeriod);
        setReportsData(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Impossible de charger les rapports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [selectedGroup, selectedPeriod]);

  // Handle Excel (CSV) Export
  const handleExportExcel = () => {
    if (!reportsData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Section 1: Summary Statistics
    csvContent += "PLATEFORME TONTINE - RAPPORT GLOBAL\n";
    csvContent += `Filtres : Groupe = ${selectedGroup ? groups.find(g => String(g.id) === String(selectedGroup))?.nom || selectedGroup : 'Tous'}, Periode = ${selectedPeriod.toUpperCase()}\n\n`;
    csvContent += "INDICATEURS FINANCIERS\n";
    csvContent += `Total collecte,Total distribue,En caisse,Emprunts en cours,Nombre d'emprunts actifs\n`;
    csvContent += `${reportsData.total_collecte},${reportsData.total_distribue},${reportsData.en_caisse},${reportsData.emprunts_en_cours},${reportsData.emprunts_en_cours_count}\n\n`;

    // Section 2: Member Report
    csvContent += "RAPPORT PAR MEMBRE\n";
    csvContent += "Membre,Telephone,Groupe,Cotisations Payees,Cotisations Totales,Retards,Emprunts Actifs,Score Financier (%)\n";
    reportsData.membres_report.forEach(m => {
      csvContent += `"${m.nom}","${m.telephone}","${m.groupe}",${m.cotisations_payees},${m.cotisations_totales},${m.retards},${m.emprunts},${m.score}\n`;
    });
    csvContent += "\n";

    // Section 3: Cycle Report
    csvContent += "RAPPORT PAR CYCLE\n";
    csvContent += "Cycle,Groupe,Beneficiaire,Montant Distribue,Taux de collecte (%)\n";
    reportsData.cycles_report.forEach(c => {
      csvContent += `"${c.cycle}","${c.groupe}","${c.beneficiaire}",${c.montant_distribue || 0},${c.taux_collecte}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_tontine_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle PDF Export (via window.print with custom media print CSS)
  const handleExportPDF = () => {
    window.print();
  };

  // Filter members list by search query
  const filteredMembers = (reportsData?.membres_report || []).filter(m => {
    const term = searchQuery.toLowerCase();
    return (
      m.nom.toLowerCase().includes(term) ||
      m.telephone.toLowerCase().includes(term) ||
      m.groupe.toLowerCase().includes(term)
    );
  });

  // Calculate trends/heights for SVG/CSS Chart
  const maxContribution = reportsData?.evolution_cotisations?.length > 0 
    ? Math.max(...reportsData.evolution_cotisations.map(e => e.montant), 10000) 
    : 10000;

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:bg-white print:text-black">
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-black/5 pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
              <FileText size={24} />
            </span>
            Rapports
          </h2>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de toutes vos tontines</p>
        </div>
        
        {/* Top actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            disabled={loading || !reportsData}
            className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} className="text-slate-500" />
            Excel
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={loading || !reportsData}
            className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} className="text-slate-500" />
            PDF / Imprimer
          </button>
        </div>
      </div>

      <AIReportsPanel groups={groups} />

      {/* Dynamic Time Period and Group Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 print:hidden">
        {/* Group Selector */}
        <div className="relative min-w-[260px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tontines</label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Tous les groupes</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>
        </div>

        {/* Period Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Période de temps</label>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 max-w-fit">
            {[
              { id: 'tous', label: 'Personnalisé' }, // Used for showing custom overall reports
              { id: 'ce_mois', label: 'Ce mois' },
              { id: 'cette_annee', label: 'Cette année' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-4 py-2 rounded-md text-xs font-bold tracking-wide transition-all ${
                  selectedPeriod === p.id 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Chargement des données de rapport...</p>
        </div>
      )}

      {/* Error state indicator */}
      {!loading && error && (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Reports Dashboard Grid */}
      {!loading && !error && reportsData && (
        <>
          {/* Print Title Block */}
          <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
            <h1 className="text-3xl font-extrabold">Rapport d'Activité Tontine</h1>
            <p className="text-sm text-slate-500 mt-2">
              Généré le : {new Date().toLocaleDateString('fr-FR')} · 
              Filtres : {selectedGroup ? 'Groupe filtré' : 'Tous les groupes'} · 
              Période : {selectedPeriod === 'ce_mois' ? 'Ce mois-ci' : selectedPeriod === 'cette_annee' ? 'Cette année' : 'Global'}
            </p>
          </div>

          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total collecté */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block">Total collecté</span>
                <p className="text-4xl font-extrabold text-blue-700 mt-2 tracking-tight">
                  {formatCurrency(reportsData.total_collecte)}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4 font-medium flex items-center gap-1">
                FCFA — {selectedGroup ? 'groupe sélectionné' : 'tous groupes'}
              </p>
            </div>

            {/* Card 2: Total distribué */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block">Total distribué</span>
                <p className="text-4xl font-extrabold text-emerald-600 mt-2 tracking-tight">
                  {formatCurrency(reportsData.total_distribue)}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4 font-medium">
                FCFA — cycles terminés
              </p>
            </div>

            {/* Card 3: En caisse */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block">En caisse</span>
                <p className="text-4xl font-extrabold text-purple-600 mt-2 tracking-tight">
                  {formatCurrency(reportsData.en_caisse)}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4 font-medium">
                FCFA — disponible
              </p>
            </div>

            {/* Card 4: Emprunts en cours */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block">Emprunts en cours</span>
                <p className="text-4xl font-extrabold text-amber-600 mt-2 tracking-tight">
                  {formatCurrency(reportsData.emprunts_en_cours)}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4 font-medium flex items-center gap-1.5">
                FCFA — {reportsData.emprunts_en_cours_count} emprunts
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
            {/* Chart 1: Evolution des cotisations (Bar Chart) */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Activity size={20} className="text-blue-500" />
                  Évolution des cotisations
                </h3>
                
                <span className="text-xs bg-slate-50 border border-slate-150 text-slate-600 px-3 py-1 rounded-full font-bold">
                  6 derniers mois
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                <div className="h-44 flex items-end justify-between gap-3 px-2 pb-2 border-b border-slate-100">
                  {reportsData.evolution_cotisations.map((item, idx) => {
                    const pct = Math.max(8, (item.montant / maxContribution) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded shadow-lg z-10 whitespace-nowrap font-bold">
                          {formatCurrency(item.montant)} FCFA
                        </div>
                        {/* Bar */}
                        <div 
                          style={{ height: `${pct}%` }}
                          className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 relative ${
                            idx === reportsData.evolution_cotisations.length - 1 
                              ? 'bg-blue-600 group-hover:bg-blue-700' 
                              : 'bg-blue-200 group-hover:bg-blue-300'
                          }`}
                        ></div>
                        {/* Label on Hover */}
                        <div className="absolute bottom-full mb-1 text-xs font-bold text-slate-600 scale-0 group-hover:scale-100 transition-all">
                          {Math.round(item.montant / 1000)}k
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Labels */}
                <div className="flex justify-between px-2 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {reportsData.evolution_cotisations.map((item, idx) => (
                    <div key={idx} className="flex-1 text-center max-w-[36px]">
                      {item.mois}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart footer detail */}
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                  ↑ +18% vs mois dernier
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {reportsData.evolution_cotisations[0]?.mois} {reportsData.evolution_cotisations[0]?.annee} - {reportsData.evolution_cotisations[reportsData.evolution_cotisations.length-1]?.mois} {reportsData.evolution_cotisations[reportsData.evolution_cotisations.length-1]?.annee}
                </span>
              </div>
            </div>

            {/* Chart 2: Circular Donut Chart for Taux de participation */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 mb-6">
                <Layers size={20} className="text-emerald-500" />
                Participation par groupe
              </h3>

              <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6">
                {/* SVG Donut Chart */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="50" className="stroke-slate-50" strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="50" 
                      className="stroke-emerald-500 transition-all duration-1000 ease-out" 
                      strokeWidth="10" 
                      fill="transparent"
                      strokeDasharray="314.16"
                      strokeDashoffset={314.16 - (314.16 * reportsData.taux_participation) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-3xl font-black text-slate-800 leading-none">
                      {Math.round(reportsData.taux_participation)}%
                    </p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1.5">payés</p>
                  </div>
                </div>

                {/* Progress bars list for each group */}
                <div className="flex-1 w-full space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-50 pb-2">Par groupe</p>
                  {reportsData.participation_par_groupe.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-bold text-slate-700">
                        <span>{item.groupe}</span>
                        <span>{Math.round(item.taux)}%</span>
                      </div>
                      <div className="w-full bg-slate-50 rounded-full h-2.5 border border-slate-100 overflow-hidden">
                        <div 
                          style={{ width: `${item.taux}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.taux >= 85 ? 'bg-emerald-500' : item.taux >= 65 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {reportsData.participation_par_groupe.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">Aucune donnée disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Member reports Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden print:break-inside-avoid">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 print:border-none print:pb-0">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-blue-500" />
                Rapport par membre
              </h3>

              {/* Table search bar */}
              <div className="relative max-w-xs print:hidden">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
                    <th className="p-4">Membre</th>
                    <th className="p-4">Groupe</th>
                    <th className="p-4 text-center">Cotisations payées</th>
                    <th className="p-4 text-center">Retards</th>
                    <th className="p-4 text-center">Emprunts</th>
                    <th className="p-4">Score financier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMembers.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-850 font-extrabold text-sm">{m.nom}</span>
                          <span className="text-xs text-gray-400 font-semibold tracking-wide mt-0.5">{m.telephone}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-600">{m.groupe}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          m.cotisations_payees === m.cotisations_totales 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {m.cotisations_payees}/{m.cotisations_totales}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black">
                        <span className={m.retards > 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {m.retards}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-slate-500">{m.emprunts}</td>
                      <td className="p-4 min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              style={{ width: `${m.score}%` }} 
                              className={`h-full rounded-full ${
                                m.score >= 90 ? 'bg-emerald-500' : m.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                          <span className={`font-black text-sm ${
                            m.score >= 90 ? 'text-emerald-600' : m.score >= 70 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {Math.round(m.score)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 italic text-sm">
                        Aucun membre trouvé correspondant à la recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cycle reports Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden print:break-inside-avoid">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Layers size={20} className="text-blue-500" />
                Rapport par cycle
              </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-gray-500 font-bold uppercase tracking-wider text-xs">
                    <th className="p-4">Cycle</th>
                    <th className="p-4">Groupe</th>
                    <th className="p-4">Bénéficiaire</th>
                    <th className="p-4">Montant distribué</th>
                    <th className="p-4">Taux de collecte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportsData.cycles_report.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-extrabold text-slate-800">{c.cycle}</td>
                      <td className="p-4 font-bold text-slate-600">{c.groupe}</td>
                      <td className="p-4 font-extrabold text-slate-700">{c.beneficiaire}</td>
                      <td className="p-4 font-black">
                        {c.montant_distribue ? (
                          <span className="text-emerald-600 font-black">
                            {formatCurrency(c.montant_distribue)} FCFA
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="p-4 min-w-[160px]">
                        <div className="flex items-center gap-3">
                          <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              style={{ width: `${c.taux_collecte}%` }} 
                              className={`h-full rounded-full ${
                                c.taux_collecte >= 100 ? 'bg-emerald-500' : c.taux_collecte >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                          <span className={`font-black text-sm ${
                            c.taux_collecte >= 100 ? 'text-emerald-600' : c.taux_collecte >= 70 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {Math.round(c.taux_collecte)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reportsData.cycles_report.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 italic text-sm">
                        Aucune information de cycle disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsTab;