import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowLeft,
  Bell,
  CircleDollarSign,
  Landmark,
  LogOut,
  Plus,
  ShieldCheck,
  UsersRound,
  LayoutDashboard,
  Users,
  RefreshCcw,
  Banknote,
  Wallet,
  FileText,
  Settings,
  Menu,
  CheckCircle2,
  Clock,
  UserPlus,
  Activity,
  X
} from 'lucide-react'
import { api } from './api'
import AuthScreen from './components/AuthScreen'
import Field from './components/Field'
import StatCard from './components/StatCard'
import Sidebar from './components/layout/Sidebar'
import DashboardTab from './components/tabs/DashboardTab'
import GroupsTab from './components/tabs/GroupsTab'
import MembersTab from './components/tabs/MembersTab'
import CyclesTab from './components/tabs/CyclesTab'
import ContributionsTab from './components/tabs/ContributionsTab'
import LoansTab from './components/tabs/LoansTab'
import ReportsTab from './components/tabs/ReportsTab'
import SettingsTab from './components/tabs/SettingsTab'
import AIFloatingChat from './components/AIFloatingChat'
import './styles.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(Number(value))
}

const emptyGroup = {
  nom: '',
  montant_cotisation: '',
  frequence: 'mensuel',
  type: 'rotatif',
  date_debut: new Date().toISOString().slice(0, 10),
}
const emptyMember = {
  utilisateur_id: '',
  ordre_reception: '',
  date_adhesion: new Date().toISOString().slice(0, 10),
}
const emptyCycle = {
  numero_cycle: '',
  beneficiaire_id: '',
  date_debut: new Date().toISOString().slice(0, 10),
  date_fin: new Date().toISOString().slice(0, 10),
}
const emptyContribution = {
  cycle_id: '',
  membre_id: '',
  montant: '',
  numero_transaction: '',
  date_paiement: new Date().toISOString().slice(0, 10),
}
const emptyLoan = {
  emprunteur_id: '',
  montant: '',
  taux_interet: '',
  date_demande: new Date().toISOString().slice(0, 10),
  date_limite: new Date().toISOString().slice(0, 10),
}
const emptyRepayment = {
  emprunt_id: '',
  montant: '',
  numero_transaction: '',
}
const emptyJoinRequest = {
  code_invitation: '',
  message: '',
}
const emptyExitRequest = {
  groupe_id: '',
  motif: '',
}

function Main({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [groupForm, setGroupForm] = useState(emptyGroup)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groups, setGroups] = useState([])
  const [contributionGroupId, setContributionGroupId] = useState('')
  const [contributionFilterCycleId, setContributionFilterCycleId] = useState('')
  const [contributionFilterStatus, setContributionFilterStatus] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [users, setUsers] = useState([])
  const [members, setMembers] = useState([])
  const [cycles, setCycles] = useState([])
  const [contributions, setContributions] = useState([])
  const [loans, setLoans] = useState([])
  const [repayments, setRepayments] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [exitRequests, setExitRequests] = useState([])
  const [memberForm, setMemberForm] = useState(emptyMember)
  const [cycleForm, setCycleForm] = useState(emptyCycle)
  const [contributionForm, setContributionForm] = useState(emptyContribution)
  const [loanForm, setLoanForm] = useState(emptyLoan)
  const [repaymentForm, setRepaymentForm] = useState(emptyRepayment)
  const [joinRequestForm, setJoinRequestForm] = useState(emptyJoinRequest)
  const [exitRequestForm, setExitRequestForm] = useState(emptyExitRequest)
  const [error, setError] = useState('')
  const [memberError, setMemberError] = useState('')
  const [cycleError, setCycleError] = useState('')
  const [contributionError, setContributionError] = useState('')
  const [loanError, setLoanError] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [groupSummaries, setGroupSummaries] = useState(new Map())
  const [loadingGroupSummaries, setLoadingGroupSummaries] = useState(false)
  const [repaymentError, setRepaymentError] = useState('')
  const [joinRequestError, setJoinRequestError] = useState('')
  const [joinRequestMessage, setJoinRequestMessage] = useState('')
  const [exitRequestError, setExitRequestError] = useState('')
  const [exitRequestMessage, setExitRequestMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [savingCycle, setSavingCycle] = useState(false)
  const [savingContribution, setSavingContribution] = useState(false)
  const [savingLoan, setSavingLoan] = useState(false)
  const [savingRepayment, setSavingRepayment] = useState(false)
  const [savingJoinRequest, setSavingJoinRequest] = useState(false)
  const [savingExitRequest, setSavingExitRequest] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpMethod, setTopUpMethod] = useState('momo')
  const [topUpError, setTopUpError] = useState('')
  const [topUpSuccess, setTopUpSuccess] = useState('')
  const [savingTopUp, setSavingTopUp] = useState(false)
  // Data loading and handlers wired to API endpoints
  const fetchInitialData = async () => {
    try {
      setStatsLoading(true)
      setNotificationsLoading(true)
      const [usersData, groupsData, dashboardData, notificationsData, recentData] = await Promise.all([
        api.users().catch(() => []),
        api.groups().catch(() => []),
        api.dashboard().catch(() => null),
        api.notifications().catch(() => []),
        api.recentActivity().catch(() => []),
      ])
      setUsers(usersData || [])
      setGroups(groupsData || [])
      setDashboardStats(dashboardData)
      setNotifications(notificationsData || [])
      setRecentActivity(recentData || [])
    } catch (err) {
      // ignore — errors will be surfaced in UI where relevant
      console.error(err)
    } finally {
      setStatsLoading(false)
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const onRefresh = async () => {
    await fetchInitialData()
    if (selectedGroup) {
      await openGroup(selectedGroup.id)
    }
  }

  const onLogout = () => {
    localStorage.removeItem('tontine_token')
    window.location.reload()
  }

  const submitGroup = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = groupForm
    }
    setSaving(true)
    try {
      const created = await api.createGroup(data)
      setGroups((prev) => [created, ...prev])
      setGroupForm(emptyGroup)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const submitJoinRequest = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = joinRequestForm
    }
    setSavingJoinRequest(true)
    try {
      await api.createJoinRequest(data)
      setJoinRequestMessage('Demande envoyée')
    } catch (err) {
      setJoinRequestError(err.message || String(err))
    } finally {
      setSavingJoinRequest(false)
    }
  }

  const submitExitRequest = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = exitRequestForm
    }
    setSavingExitRequest(true)
    try {
      await api.createExitRequest(data)
      setExitRequestMessage('Demande envoyée')
    } catch (err) {
      setExitRequestError(err.message || String(err))
    } finally {
      setSavingExitRequest(false)
    }
  }

  // Charge les données d'un groupe SANS changer d'onglet
  const loadGroupData = async (groupOrId) => {
    const id = typeof groupOrId === 'number' || typeof groupOrId === 'string' ? groupOrId : groupOrId?.id
    const group = groups.find((g) => String(g.id) === String(id)) || (typeof groupOrId === 'object' ? groupOrId : null)
    if (!group) return
    setSelectedGroup(group)
    try {
      const [membersData, cyclesData, contributionsData, loansData, repaymentsData, joinReqs, exitReqs] = await Promise.all([
        api.members(group.id).catch(() => []),
        api.cycles(group.id).catch(() => []),
        api.contributions(group.id).catch(() => []),
        api.loans(group.id).catch(() => []),
        api.repayments(group.id).catch(() => []),
        api.joinRequests(group.id).catch(() => []),
        api.exitRequests(group.id).catch(() => []),
      ])
      setMembers(membersData || [])
      setCycles(cyclesData || [])
      setContributions(contributionsData || [])
      setLoans(loansData || [])
      setRepayments(repaymentsData || [])
      setJoinRequests(joinReqs || [])
      setExitRequests(exitReqs || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Charge les données ET navigue vers l'onglet groupes
  const openGroup = async (groupOrId) => {
    await loadGroupData(groupOrId)
    setActiveTab('groups')
  }

  const openGroupForCotisations = async (group) => {
    await loadGroupData(group)
    setActiveTab('cotisations')
  }

  const declarePayment = async (evOrGroup) => {
    // If a group object is passed, open it and switch to cotisations
    if (evOrGroup && evOrGroup.id) {
      await openGroupForCotisations(evOrGroup)
      return
    }
    // Else assume a submit event or direct data for contribution
    let data = evOrGroup
    if (evOrGroup && evOrGroup.preventDefault) {
      evOrGroup.preventDefault()
      data = contributionForm
    }
    if (!selectedGroup) return
    setSavingContribution(true)
    try {
      await api.createContribution(selectedGroup.id, data)
      const refreshed = await api.contributions(selectedGroup.id)
      setContributions(refreshed || [])
    } catch (err) {
      setContributionError(err.message || String(err))
      throw err
    } finally {
      setSavingContribution(false)
    }
  }

  const handleSuspendGroup = async (groupId) => {
    try {
      const updated = await api.suspendGroup(groupId)
      setGroups((prev) => prev.map((g) => String(g.id) === String(groupId) ? updated : g))
      if (selectedGroup && String(selectedGroup.id) === String(groupId)) setSelectedGroup(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteGroup(groupId)
      setGroups((prev) => prev.filter((g) => String(g.id) !== String(groupId)))
      if (selectedGroup && String(selectedGroup.id) === String(groupId)) setSelectedGroup(null)
    } catch (err) {
      console.error(err)
    }
  }

  const loadGroupSummaries = async () => {
    setLoadingGroupSummaries(true)
    try {
      const allGroups = await api.groups().catch(() => [])
      const map = new Map()
      for (const g of allGroups || []) {
        map.set(g.id, { members: 0 })
      }
      setGroupSummaries(map)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingGroupSummaries(false)
    }
  }

  const refreshMembers = async () => {
    if (!selectedGroup) return
    const m = await api.members(selectedGroup.id).catch(() => [])
    setMembers(m || [])
  }

  const refreshRotatingData = async () => {
    if (!selectedGroup) return
    const c = await api.cycles(selectedGroup.id).catch(() => [])
    setCycles(c || [])
  }

  const refreshCreditData = async () => {
    if (!selectedGroup) return
    const [l, r] = await Promise.all([
      api.loans(selectedGroup.id).catch(() => []),
      api.repayments(selectedGroup.id).catch(() => []),
    ])
    setLoans(l || [])
    setRepayments(r || [])
  }

  const refreshJoinRequests = async () => {
    if (!selectedGroup) return
    const r = await api.joinRequests(selectedGroup.id).catch(() => [])
    setJoinRequests(r || [])
  }

  const refreshExitRequests = async () => {
    if (!selectedGroup) return
    const r = await api.exitRequests(selectedGroup.id).catch(() => [])
    setExitRequests(r || [])
  }

  const submitTopUp = async (evOrData) => {
    if (evOrData && evOrData.preventDefault) evOrData.preventDefault()
    setSavingTopUp(true)
    try {
      await api.topUpWallet({ montant: Number(topUpAmount), methode: topUpMethod })
      setTopUpSuccess('Rechargement demandé')
    } catch (err) {
      setTopUpError(err.message || String(err))
    } finally {
      setSavingTopUp(false)
    }
  }

  // Members
  const addMember = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = memberForm
    }
    if (!selectedGroup) return
    setSavingMember(true)
    try {
      await api.addMember(selectedGroup.id, { ...data, utilisateur_id: data.utilisateur_id })
      await refreshMembers()
      setMemberForm(emptyMember)
    } catch (err) {
      setMemberError(err.message || String(err))
      throw err
    } finally {
      setSavingMember(false)
    }
  }

  const updateMembership = async (membershipId, data) => {
    try {
      await api.updateMembership(membershipId, data)
      await refreshMembers()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const deleteMembership = async (membershipId) => {
    try {
      await api.deleteMembership(membershipId)
      await refreshMembers()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Cycles
  const createCycle = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = cycleForm
    }
    if (!selectedGroup) return
    setSavingCycle(true)
    try {
      await api.createCycle(selectedGroup.id, data)
      await refreshRotatingData()
      setCycleForm(emptyCycle)
    } catch (err) {
      setCycleError(err.message || String(err))
      throw err
    } finally {
      setSavingCycle(false)
    }
  }

  const closeCycle = async (cycleId) => {
    try {
      await api.closeCycle(cycleId)
      await refreshRotatingData()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Loans
  const createLoan = async (evOrData) => {
    let data = evOrData
    if (evOrData && evOrData.preventDefault) {
      evOrData.preventDefault()
      data = loanForm
    }
    if (!selectedGroup) return
    setSavingLoan(true)
    try {
      await api.createLoan(selectedGroup.id, data)
      await refreshCreditData()
      setLoanForm(emptyLoan)
    } catch (err) {
      setLoanError(err.message || String(err))
      throw err
    } finally {
      setSavingLoan(false)
    }
  }

  const approveLoanById = async (loanId) => {
    try {
      await api.approveLoan(loanId)
      await refreshCreditData()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Join Request handlers
  const approveJoinRequestById = async (requestId) => {
    try {
      await api.approveJoinRequest(requestId)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'approbation')
    }
  }

  const rejectJoinRequestById = async (requestId) => {
    try {
      await api.rejectJoinRequest(requestId)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || 'Erreur lors du rejet')
    }
  }

  const approveExitRequestById = async (requestId) => {
    try {
      await api.approveExitRequest(requestId)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || "Erreur lors de l'approbation de la demande de sortie")
    }
  }

  const rejectExitRequestById = async (requestId) => {
    try {
      await api.rejectExitRequest(requestId)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || 'Erreur lors du rejet de la demande de sortie')
    }
  }

  // Join Request + Notification handlers: approve/reject and mark notification read
  const handleApproveNotification = async (notification) => {
    try {
      if (!notification?.reference_id) return
      await api.approveJoinRequest(notification.reference_id)
      // delete the originating notification so buttons disappear
      await api.deleteNotification(notification.id)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'approbation')
    }
  }

  const handleRejectNotification = async (notification) => {
    try {
      if (!notification?.reference_id) return
      await api.rejectJoinRequest(notification.reference_id)
      await api.deleteNotification(notification.id)
      await fetchInitialData()
    } catch (err) {
      alert(err.message || 'Erreur lors du rejet')
    }
  }

  // Confirmations
  const confirmContribution = async (contributionId) => {
    try {
      await api.confirmContribution(contributionId)
      const groupId = selectedGroup?.id
      if (groupId) {
        const refreshed = await api.contributions(groupId).catch(() => [])
        setContributions(refreshed || [])
      }
      setCycles(prev => prev.map(c => ({ ...c })))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const rejectContribution = async (contributionId, motif) => {
    try {
      await api.rejectContribution(contributionId, motif)
      const groupId = selectedGroup?.id
      if (groupId) {
        const refreshed = await api.contributions(groupId).catch(() => [])
        setContributions(refreshed || [])
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const remindMember = async (groupId, memberId) => {
    try {
      await api.remindMember(groupId, memberId)
    } catch (err) {
      console.error(err)
    }
  }

  const confirmRepaymentById = async (repaymentId) => {
    try {
      await api.confirmRepayment(repaymentId)
      if (selectedGroup) {
        const refreshed = await api.repayments(selectedGroup.id).catch(() => [])
        setRepayments(refreshed || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const createRepayment = async (loanId, data) => {
    await api.createRepayment(loanId, data)
    if (selectedGroup) {
      const [l, r] = await Promise.all([
        api.loans(selectedGroup.id).catch(() => []),
        api.repayments(selectedGroup.id).catch(() => []),
      ])
      setLoans(l || [])
      setRepayments(r || [])
    }
  }

  // Notifications
  const markNotificationReadById = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, lu: true } : n)))
    } catch (err) {
      console.error(err)
    }
  }
  const [dashboardStats, setDashboardStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Effect hooks and helper functions would remain here but simplified
  // ... (keeping the core logic but moving UI components to separate files)
  // Lightweight fallback details view when a dedicated `GroupDetails` component
  // is not present in the repo. It composes existing tab components to avoid
  // runtime errors and keep the UI functional.
  const GroupDetailsFallback = ({ group }) => {
    const commonProps = {
      selectedGroup: group,
      setSelectedGroup,
      setActiveTab,
      members,
      users,
      cycles,
      contributions,
      loans,
      repayments,
      joinRequests,
      exitRequests,
      addMember,
      createCycle,
      declarePayment,
      confirmContribution,
      createLoan,
      approveLoanById,
      confirmRepaymentById,
      refreshMembers,
      refreshRotatingData,
      refreshCreditData,
      refreshJoinRequests,
      refreshExitRequests,
      user,
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-black/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{group.nom}</h2>
              <p className="text-sm text-gray-500">Code : <span className="font-mono">{group.code_invitation}</span></p>
            </div>
            <div className="text-sm text-gray-500">Montant : {formatCurrency(group.montant_cotisation)}</div>
          </div>
        </div>

        <MembersTab {...commonProps} />
        <CyclesTab {...commonProps} />
        <ContributionsTab {...commonProps} />
        <LoansTab {...commonProps} />
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
          dashboardStats={dashboardStats}
          recentActivity={recentActivity}
          notifications={notifications}
          notificationsLoading={notificationsLoading}
          setNotificationsOpen={setNotificationsOpen}
          statsLoading={statsLoading}
          groups={groups}
          user={user}
          onRefresh={onRefresh} // Would need to define
          onLogout={onLogout} // Would need to define
          setActiveTab={setActiveTab}
          groupForm={groupForm}
          setGroupForm={setGroupForm}
          saving={saving}
          error={error}
          setError={setError}
          submitGroup={submitGroup} // Would need to define
          joinRequestForm={joinRequestForm}
          setJoinRequestForm={setJoinRequestForm}
          joinRequestMessage={joinRequestMessage}
          joinRequestError={joinRequestError}
          savingJoinRequest={savingJoinRequest}
          submitJoinRequest={submitJoinRequest} // Would need to define
          exitRequestForm={exitRequestForm}
          setExitRequestForm={setExitRequestForm}
          exitRequestMessage={exitRequestMessage}
          exitRequestError={exitRequestError}
          savingExitRequest={savingExitRequest}
          submitExitRequest={submitExitRequest} // Would need to define
          openGroup={openGroup} // Would need to define
          openGroupForCotisations={openGroupForCotisations} // Would need to define
          declarePayment={declarePayment} // Would need to define
          formatCurrency={formatCurrency}
          api={api}
          markNotificationRead={markNotificationReadById}
        />
      case 'groups':
        return <GroupsTab 
          groups={groups}
          groupSearch={groupSearch}
          setGroupSearch={setGroupSearch}
          setActiveTab={setActiveTab}
          groupSummaries={groupSummaries}
          loadingGroupSummaries={loadingGroupSummaries}
          openGroup={openGroup}
          declarePayment={declarePayment}
          handleSuspendGroup={handleSuspendGroup}
          handleDeleteGroup={handleDeleteGroup}
          loadGroupSummaries={loadGroupSummaries}
          refreshMembers={refreshMembers}
          refreshRotatingData={refreshRotatingData}
          refreshCreditData={refreshCreditData}
          refreshJoinRequests={refreshJoinRequests}
          refreshExitRequests={refreshExitRequests}
          user={user}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          members={members}
          cycles={cycles}
          contributions={contributions}
          loans={loans}
          repayments={repayments}
          joinRequests={joinRequests}
          exitRequests={exitRequests}
          approveJoinRequest={approveJoinRequestById}
          rejectJoinRequest={rejectJoinRequestById}
          approveExitRequest={approveExitRequestById}
          rejectExitRequest={rejectExitRequestById}
          addMember={addMember}
          createCycle={createCycle}
          formatCurrency={formatCurrency}
          users={users}
        />
      case 'members':
        return <MembersTab 
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          setActiveTab={setActiveTab}
          members={members}
          users={users}
          addMember={addMember}
          refreshMembers={refreshMembers}
          groups={groups}
          user={user}
          updateMembership={updateMembership}
          deleteMembership={deleteMembership}
          remindMember={remindMember}
          contributions={contributions}
          loans={loans}
          openGroup={openGroup}
          loadGroupData={loadGroupData}
          cycles={cycles}
          createJoinRequest={api.createJoinRequest}
        />
      case 'cycles':
        return <CyclesTab 
           selectedGroup={selectedGroup}
           setSelectedGroup={setSelectedGroup}
           setActiveTab={setActiveTab}
           cycles={cycles}
           members={members}
           users={users}
           createCycle={createCycle}
           refreshRotatingData={refreshRotatingData}
           groups={groups}
           user={user}
           closeCycle={closeCycle}
           contributions={contributions}
           openGroup={openGroup}
           loadGroupData={loadGroupData}
         />
      case 'cotisations':
        return <ContributionsTab 
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          setActiveTab={setActiveTab}
          groups={groups}
          contributionGroupId={contributionGroupId}
          setContributionGroupId={setContributionGroupId}
          openGroupForCotisations={openGroupForCotisations}
          confirmContribution={confirmContribution}
          rejectContribution={rejectContribution}
          loadGroupData={loadGroupData}
          remindMember={remindMember}
          declarePayment={declarePayment}
          openGroup={openGroup}
          user={user}
          members={members}
          cycles={cycles}
          contributions={contributions}
          users={users}
        />
      case 'emprunts':
        return <LoansTab
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          setActiveTab={setActiveTab}
          loans={loans}
          repayments={repayments}
          members={members}
          users={users}
          createLoan={createLoan}
          approveLoan={approveLoanById}
          confirmRepayment={confirmRepaymentById}
          createRepayment={createRepayment}
          groups={groups}
          openGroup={openGroup}
          loadGroupData={loadGroupData}
          user={user}
        />
      case 'reports':
        return <ReportsTab 
          groups={groups}
          dashboardStats={dashboardStats}
          formatCurrency={formatCurrency}
          // ... other required props
        />
      case 'settings':
        return <SettingsTab 
          user={user}
          onLogout={onLogout} // Would need to define
          topUpAmount={topUpAmount}
          setTopUpAmount={setTopUpAmount}
          topUpMethod={topUpMethod}
          setTopUpMethod={setTopUpMethod}
          topUpSuccess={topUpSuccess}
          topUpError={topUpError}
          savingTopUp={savingTopUp}
          submitTopUp={submitTopUp} // Would need to define
          // optional handlers
          markNotificationRead={markNotificationReadById}
          users={users}
          formatCurrency={formatCurrency}
        />
      // ai tab removed — chatbot is now floating
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-ink">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={onLogout} // Would need to define
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-black/5 shadow-sm shrink-0">
          <div>
            {selectedGroup && activeTab === 'groups' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Groupe sélectionné</span>
                <span className="text-sm font-extrabold text-slate-800">{selectedGroup.nom}</span>
              </div>
            ) : (
              <p className="text-sm font-extrabold text-slate-800">Bonjour, {user.nom} 👋</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Header actions */}
            <button 
              onClick={() => setNotificationsOpen(true)} 
              className="relative p-2 hover:bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm transition-colors text-slate-600 shrink-0"
              title="Notifications"
            >
              <Bell size={18} className={notificationsLoading ? 'animate-spin' : ''} />
              {notifications && notifications.filter((n) => !n.lu).length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Profile Pill in Header */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg shrink-0">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
                {user.nom.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">{user.nom}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </main>

      <AIFloatingChat groups={groups} />

      {/* Notifications Modal */}
      <div className={`fixed inset-0 z-55 flex items-center justify-center ${notificationsOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)}></div>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative border border-slate-100 z-10 animate-scale-up">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              Notifications
            </h2>
            <button 
              onClick={() => setNotificationsOpen(false)} 
              className="p-1.5 hover:bg-slate-55 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm font-semibold">Aucune notification pour le moment.</p>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="flex flex-col gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-extrabold text-slate-800 text-sm leading-tight truncate">{notification.titre}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          notification.lu 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {notification.lu ? 'Lu' : 'Nouveau'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(notification.date_creation || notification.created_at || Date.now()).toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{notification.message}</p>
                    </div>
                  </div>
                  {notification.type === 'membre' && notification.reference_id && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => { handleApproveNotification(notification); setNotificationsOpen(false); }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm transition-all uppercase"
                      >
                        Approuver
                      </button>
                      <button 
                        onClick={() => { handleRejectNotification(notification); setNotificationsOpen(false); }}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm transition-all uppercase"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the main component
export default function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('tontine_token')
      if (!token) {
        setCheckingAuth(false)
        return
      }
      try {
        const me = await api.me()
        setUser(me)
      } catch (err) {
        localStorage.removeItem('tontine_token')
      } finally {
        setCheckingAuth(false)
      }
    }
    check()
  }, [])

  const handleLogin = async () => {
    try {
      const me = await api.me()
      setUser(me)
    } catch (err) {
      console.error('login callback failed', err)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chargement...</h2>
          <p className="text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />
  }

  return <Main user={user} />
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    if (!window.__TONTINE_ROOT__) {
      window.__TONTINE_ROOT__ = createRoot(rootElement)
    }
    window.__TONTINE_ROOT__.render(<App />)
  } catch (err) {
    // If mounting into #root fails (HMR created a different root), fallback to a new container
    console.warn('createRoot on #root failed, mounting to fallback container', err)
    let fallback = document.getElementById('root-react')
    if (!fallback) {
      fallback = document.createElement('div')
      fallback.id = 'root-react'
      document.body.appendChild(fallback)
    }
    if (!window.__TONTINE_ROOT__) {
      window.__TONTINE_ROOT__ = createRoot(fallback)
    }
    window.__TONTINE_ROOT__.render(<App />)
  }
}
