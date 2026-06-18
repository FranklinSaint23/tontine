const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function request(path, options = {}) {
  const token = localStorage.getItem('tontine_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail || 'Une erreur est survenue')
  }
  return payload
}

export const api = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/users/me'),
  users: () => request('/users'),
  groups: () => request('/groups'),
  dashboard: () => request('/dashboard'),
  recentActivity: () => request('/dashboard/recent'),
  reports: (groupId, period) => {
    let query = '';
    const params = new URLSearchParams();
    if (groupId) params.append('group_id', groupId);
    if (period) params.append('period', period);
    const queryString = params.toString();
    if (queryString) query = '?' + queryString;
    return request(`/reports${query}`);
  },
  notifications: () => request('/notifications'),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  deleteNotification: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' }),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  suspendGroup: (groupId) => request(`/groups/${groupId}/suspend`, { method: 'PATCH' }),
  deleteGroup: (groupId) => request(`/groups/${groupId}`, { method: 'DELETE' }),
  members: (groupId) => request(`/groups/${groupId}/members`),
  addMember: (groupId, data) =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMembership: (membershipId, data) =>
    request(`/memberships/${membershipId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMembership: (membershipId) =>
    request(`/memberships/${membershipId}`, { method: 'DELETE' }),
  topUpWallet: (data) => request('/users/me/recharge', { method: 'POST', body: JSON.stringify(data) }),
  updateMyProfile: (data) => request('/users/me/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changeMyPassword: (data) => request('/users/me/change-password', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (userId, data) => request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendReminders: () => request('/maintenance/admin/send-reminders', { method: 'POST' }),
  processLate: () => request('/maintenance/admin/process-late', { method: 'POST' }),
  cycles: (groupId) => request(`/groups/${groupId}/cycles`),
  createCycle: (groupId, data) =>
    request(`/groups/${groupId}/cycles`, { method: 'POST', body: JSON.stringify(data) }),
  closeCycle: (cycleId) =>
    request(`/cycles/${cycleId}/close`, { method: 'PATCH' }),
  contributions: (groupId) => request(`/groups/${groupId}/contributions`),
  createContribution: (groupId, data) =>
    request(`/groups/${groupId}/contributions`, { method: 'POST', body: JSON.stringify(data) }),
  confirmContribution: (contributionId) =>
    request(`/contributions/${contributionId}/confirm`, { method: 'PATCH' }),
  rejectContribution: (contributionId, motif) =>
    request(`/contributions/${contributionId}?motif=${encodeURIComponent(motif)}`, { method: 'DELETE' }),
  remindMember: (groupId, memberId) =>
    request(`/groups/${groupId}/members/${memberId}/remind`, { method: 'POST' }),
  loans: (groupId) => request(`/groups/${groupId}/loans`),
  createLoan: (groupId, data) =>
    request(`/groups/${groupId}/loans`, { method: 'POST', body: JSON.stringify(data) }),
  approveLoan: (loanId) => request(`/loans/${loanId}/approve`, { method: 'PATCH' }),
  repayments: (groupId) => request(`/groups/${groupId}/repayments`),
  createRepayment: (loanId, data) =>
    request(`/loans/${loanId}/repayments`, { method: 'POST', body: JSON.stringify(data) }),
  confirmRepayment: (repaymentId) =>
    request(`/repayments/${repaymentId}/confirm`, { method: 'PATCH' }),
  createJoinRequest: (data) =>
    request('/join-requests', { method: 'POST', body: JSON.stringify(data) }),
  joinRequests: (groupId) => request(`/groups/${groupId}/join-requests`),
  approveJoinRequest: (requestId) =>
    request(`/join-requests/${requestId}/approve`, { method: 'PATCH' }),
  rejectJoinRequest: (requestId) =>
    request(`/join-requests/${requestId}/reject`, { method: 'PATCH' }),
  createExitRequest: (data) =>
    request('/exit-requests', { method: 'POST', body: JSON.stringify(data) }),
  exitRequests: (groupId) => request(`/groups/${groupId}/exit-requests`),
  approveExitRequest: (requestId) =>
    request(`/exit-requests/${requestId}/approve`, { method: 'PATCH' }),
  rejectExitRequest: (requestId) =>
    request(`/exit-requests/${requestId}/reject`, { method: 'PATCH' }),

  // ── IA (Groq) ──────────────────────────────────────────────────────────
  aiChat: (message, groupId) =>
    request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, group_id: groupId ?? null }) }),
  aiLoanRisk: (groupId, emprunteurId, montant) =>
    request(`/ai/groups/${groupId}/loan-risk`, { method: 'POST', body: JSON.stringify({ emprunteur_id: emprunteurId, montant }) }),
  aiReportSummary: (groupId) =>
    request(`/ai/groups/${groupId}/report-summary`),
  aiGenerateNotifications: (groupId, type) =>
    request(`/ai/groups/${groupId}/notifications/generate`, { method: 'POST', body: JSON.stringify({ type }) }),
  aiAnomalies: (groupId) =>
    request(`/ai/groups/${groupId}/anomalies`),
  aiPredictDefaults: (groupId) =>
    request(`/ai/groups/${groupId}/predict-defaults`),
  aiFinancialAdvice: () =>
    request('/ai/me/advice'),
  aiGroupQA: (groupId, question) =>
    request(`/ai/groups/${groupId}/qa`, { method: 'POST', body: JSON.stringify({ question }) }),
  aiSuggestOrder: (groupId) =>
    request(`/ai/groups/${groupId}/suggest-order`),
  aiClassifyRequest: (motif, type) =>
    request('/ai/requests/classify', { method: 'POST', body: JSON.stringify({ motif, type }) }),
}
