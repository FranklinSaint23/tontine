import { LayoutDashboard, Users, UserPlus, RefreshCcw, Banknote, Wallet, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-blue-600 text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard size={24} /> TontineApp
        </h1>
        <p className="text-blue-200 text-sm mt-1">Plateforme de gestion</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
          { id: 'groups', icon: Users, label: 'Mes groupes' },
          { id: 'members', icon: UserPlus, label: 'Membres' },
          { id: 'cycles', icon: RefreshCcw, label: 'Cycles' },
          { id: 'cotisations', icon: Banknote, label: 'Cotisations' },
          { id: 'emprunts', icon: Wallet, label: 'Emprunts' },
          { id: 'reports', icon: FileText, label: 'Rapports' },
          { id: 'settings', icon: Settings, label: 'Paramètres' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-700/50 text-white'
                : 'hover:bg-blue-700/30 text-blue-100'
            }`}
          >
            <tab.icon size={20} /> {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-500/30 mt-auto">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center font-bold text-lg shadow-inner">
            {user.nom.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium truncate">{user.nom}</p>
            <p className="text-xs text-blue-200 truncate">{user.role || 'Gestionnaire'}</p>
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-blue-700 rounded-lg transition-colors" title="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;