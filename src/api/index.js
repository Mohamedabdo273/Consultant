import api from './axios';

// ── Projects ────────────────────────────────────────────────────────────────
// GET    /projects                      → list (filter: clientId, status, ...)
// GET    /projects/{id}                 → detail
// POST   /projects                      → create (AdminOnly)
// PUT    /projects/{id}                 → update (AdminOnly)
// DELETE /projects/{id}                 → delete (AdminOnly)
// GET    /projects/{id}/stats           → stats
// GET    /projects/{id}/members         → member list
// POST   /projects/{id}/members         → add member (AdminOnly)
// DELETE /projects/{id}/members/{uid}   → remove member (AdminOnly)
export const projectsApi = {
  getAll:       (params)            => api.get('/projects', { params }),
  getById:      (id, params)        => api.get(`/projects/${id}`, { params }),
  create:       (data, params)      => api.post('/projects', data, { params }),
  update:       (id, data, params)  => api.put(`/projects/${id}`, data, { params }),
  delete:       (id, params)        => api.delete(`/projects/${id}`, { params }),
  getStats:     (id, params)        => api.get(`/projects/${id}/stats`, { params }),
  getMembers:   (id, params)        => api.get(`/projects/${id}/members`, { params }),
  addMember:    (id, data, params)  => api.post(`/projects/${id}/members`, data, { params }),
  removeMember: (id, userId, params)=> api.delete(`/projects/${id}/members/${userId}`, { params }),
};

// ── Tasks ───────────────────────────────────────────────────────────────────
// GET    /tasks                          → list
// GET    /tasks/{id}                     → detail
// POST   /tasks                          → create
// PUT    /tasks/{id}                     → update
// PATCH  /tasks/{id}/status             → update status  { status: ProjectTaskStatus }
// DELETE /tasks/{id}                     → delete
// GET    /tasks/{id}/comments            → comments list
// POST   /tasks/{id}/comments            → add comment
// NOTE: DELETE /tasks/{id}/comments/{cId} does NOT exist in backend — removed
export const tasksApi = {
  getAll:       (params)            => api.get('/tasks', { params }),
  getById:      (id, params)        => api.get(`/tasks/${id}`, { params }),
  create:       (data, params)      => api.post('/tasks', data, { params }),
  update:       (id, data, params)  => api.put(`/tasks/${id}`, data, { params }),
  delete:       (id, params)        => api.delete(`/tasks/${id}`, { params }),
  updateStatus: (id, data, params)  => api.patch(`/tasks/${id}/status`, data, { params }),
  getComments:  (id, params)        => api.get(`/tasks/${id}/comments`, { params }),
  addComment:   (id, data, params)  => api.post(`/tasks/${id}/comments`, data, { params }),
};

// ── Invoices ────────────────────────────────────────────────────────────────
// GET    /invoices                       → list
// GET    /invoices/summary               → financial summary (AdminOnly)
// GET    /invoices/{id}                  → detail
// POST   /invoices                       → create (AdminOnly)
// PUT    /invoices/{id}                  → update (AdminOnly)
// POST   /invoices/{id}/send             → send to client (AdminOnly)
// POST   /invoices/{id}/payments         → record payment (AdminOnly)  ← was /pay
// DELETE /invoices/{id}                  → delete (AdminOnly)
// GET    /invoices/{id}/export/pdf       → export PDF
export const invoicesApi = {
  getAll:      (params)   => api.get('/invoices', { params }),
  getSummary:  ()         => api.get('/invoices/summary'),
  getById:     (id)       => api.get(`/invoices/${id}`),
  create:      (data)     => api.post('/invoices', data),
  update:      (id, data) => api.put(`/invoices/${id}`, data),
  delete:      (id)       => api.delete(`/invoices/${id}`),
  send:        (id)       => api.post(`/invoices/${id}/send`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payments`, data),
  exportPdf:   (id)       => api.get(`/invoices/${id}/export/pdf`, { responseType: 'blob' }),
  approve:     (id)       => api.post(`/invoices/${id}/approve`),
  reject:      (id, data) => api.post(`/invoices/${id}/reject`, data),
};

// ── Contracts ───────────────────────────────────────────────────────────────
// GET    /contracts                      → list
// GET    /contracts/{id}                 → detail
// POST   /contracts                      → create (AdminOnly)
// PUT    /contracts/{id}                 → update (AdminOnly)
// POST   /contracts/{id}/send            → send to client (AdminOnly)
// POST   /contracts/{id}/sign            → sign  { signatureType, notes }
// DELETE /contracts/{id}                 → delete (AdminOnly)
// GET    /contracts/{id}/export/pdf      → export PDF
export const contractsApi = {
  getAll:       (params)   => api.get('/contracts', { params }),
  getById:      (id)       => api.get(`/contracts/${id}`),
  create:       (data)     => api.post('/contracts', data),
  update:       (id, data) => api.put(`/contracts/${id}`, data),
  delete:       (id)       => api.delete(`/contracts/${id}`),
  sendToClient: (id)       => api.post(`/contracts/${id}/send`),
  sign:         (id, data) => api.post(`/contracts/${id}/sign`, data),
  exportPdf:    (id)       => api.get(`/contracts/${id}/export/pdf`, { responseType: 'blob' }),
  approve:      (id)       => api.post(`/contracts/${id}/approve`),
  reject:       (id, data) => api.post(`/contracts/${id}/reject`, data),
};

// ── Reports ─────────────────────────────────────────────────────────────────
// GET    /reports                        → list
// GET    /reports/{id}                   → detail
// POST   /reports                        → create
// PUT    /reports/{id}                   → update
// POST   /reports/{id}/submit            → submit for review
// POST   /reports/{id}/approve           → approve (AdminOnly)
// POST   /reports/{id}/reject            → reject (AdminOnly)  { note: string }
// POST   /reports/{id}/analyze           → AI analysis
// DELETE /reports/{id}                   → delete
// GET    /reports/{id}/export/pdf        → export PDF
// GET    /reports/{id}/export/word       → export Word (.docx)
export const reportsApi = {
  getAll:    (params)   => api.get('/reports', { params }),
  getById:   (id)       => api.get(`/reports/${id}`),
  create:    (data)     => api.post('/reports', data),
  update:    (id, data) => api.put(`/reports/${id}`, data),
  delete:    (id)       => api.delete(`/reports/${id}`),
  submit:    (id)       => api.post(`/reports/${id}/submit`),
  approve:   (id)       => api.post(`/reports/${id}/approve`),
  reject:    (id, data) => api.post(`/reports/${id}/reject`, data),
  analyze:   (id)       => api.post(`/reports/${id}/analyze`),
  exportPdf: (id)       => api.get(`/reports/${id}/export/pdf`, { responseType: 'blob' }),
  exportWord:(id)       => api.get(`/reports/${id}/export/word`, { responseType: 'blob' }),
};

// ── Time Entries ─────────────────────────────────────────────────────────────
// GET    /time-entries                   → list
// GET    /time-entries/summary           → summary (params: projectId, userId)
// POST   /time-entries                   → log new entry
// PUT    /time-entries/{id}              → update
// DELETE /time-entries/{id}              → delete
export const timeApi = {
  getAll:     (params)   => api.get('/time-entries', { params }),
  getSummary: (params)   => api.get('/time-entries/summary', { params }),
  create:     (data)     => api.post('/time-entries', data),
  update:     (id, data) => api.put(`/time-entries/${id}`, data),
  delete:     (id)       => api.delete(`/time-entries/${id}`),
};

// ── Notifications ────────────────────────────────────────────────────────────
// GET    /notifications                  → list (params: page, pageSize)
// GET    /notifications/unread-count     → badge count
// PUT    /notifications/{id}/read        → mark one read   ← PUT not PATCH
// PUT    /notifications/read-all         → mark all read   ← PUT not PATCH
// DELETE /notifications/{id}             → delete
export const notificationsApi = {
  getAll:      (params) => api.get('/notifications', { params }),
  getUnread:   ()       => api.get('/notifications/unread-count'),
  markRead:    (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/read-all'),
  delete:      (id)     => api.delete(`/notifications/${id}`),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
// GET /dashboard
// GET /dashboard/consulting
// GET /dashboard/kpis
// GET /dashboard/statistics
// GET /dashboard/trends
// GET /dashboard/benchmark
// GET /dashboard/next-steps
// GET /dashboard/executive-summary
// GET /dashboard/analysis-history
// GET /dashboard/recommendations
export const dashboardApi = {
  get:                () => api.get('/dashboard'),
  getConsulting:      () => api.get('/dashboard/consulting'),
  getKpis:            () => api.get('/dashboard/kpis'),
  getStats:           () => api.get('/dashboard/statistics'),
  getTrends:          () => api.get('/dashboard/trends'),
  getBenchmark:       () => api.get('/dashboard/benchmark'),
  getNextSteps:       () => api.get('/dashboard/next-steps'),
  getSummary:         () => api.get('/dashboard/executive-summary'),
  getHistory:         () => api.get('/dashboard/analysis-history'),
  getRecommendations: () => api.get('/dashboard/recommendations'),
};

// ── Documents ────────────────────────────────────────────────────────────────
// POST   /documents/upload               → upload (multipart)
// GET    /documents                      → list
// GET    /documents/{id}                 → detail
// POST   /documents/{id}/analyze         → trigger analysis
// GET    /documents/{id}/status          → analysis status
// GET    /documents/{id}/download        → download file
// POST   /documents/bulk-analyze         → bulk analyze  { documentIds: [] }
// DELETE /documents/{id}                 → delete
export const documentsApi = {
  getAll:      (params)   => api.get('/documents', { params }),
  getById:     (id)       => api.get(`/documents/${id}`),
  upload:      (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:      (id)       => api.delete(`/documents/${id}`),
  getStatus:   (id)       => api.get(`/documents/${id}/status`),
  analyze:     (id, intake) => api.post(`/documents/${id}/analyze`, intake ?? null),
  getDownload: (id)       => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  bulkAnalyze: (data)     => api.post('/documents/bulk-analyze', data),
};

// ── Analysis ─────────────────────────────────────────────────────────────────
// POST   /analysis/company/analyze       → analyze all company docs
// GET    /analysis/company/latest        → latest result
// GET    /analysis/company/history       → history list
// GET    /analysis/{id}                  → detail by id
// DELETE /analysis/{id}                  → delete
// GET    /analysis/compare?first=&second= → compare two results
// POST   /analysis/competitor            → competitor analysis
// POST   /analysis/schedule/weekly       → schedule weekly auto-analysis
export const analysisApi = {
  analyzeAll:     (intake) => api.post('/analysis/company/analyze', intake ?? null),
  getLatest:      ()     => api.get('/analysis/company/latest'),
  getHistory:     ()     => api.get('/analysis/company/history'),
  getById:        (id)   => api.get(`/analysis/${id}`),
  delete:         (id)   => api.delete(`/analysis/${id}`),
  compare:        (a, b) => api.get('/analysis/compare', { params: { first: a, second: b } }),
  analyzeComp:    (data) => api.post('/analysis/competitor', data),
  scheduleWeekly: ()     => api.post('/analysis/schedule/weekly'),
};

// ── Analysis Notes ────────────────────────────────────────────────────────────
// GET    /analyses/{analysisId}/notes                        → list notes
// POST   /analyses/{analysisId}/notes                        → add note  { content, isPinned }
// PUT    /analyses/{analysisId}/notes/{noteId}               → update note
// DELETE /analyses/{analysisId}/notes/{noteId}               → delete note
// PATCH  /analyses/{analysisId}/notes/{noteId}/pin           → toggle pin
export const analysisNotesApi = {
  getAll:    (analysisId)           => api.get(`/analyses/${analysisId}/notes`),
  add:       (analysisId, data)     => api.post(`/analyses/${analysisId}/notes`, data),
  update:    (analysisId, noteId, data) => api.put(`/analyses/${analysisId}/notes/${noteId}`, data),
  delete:    (analysisId, noteId)   => api.delete(`/analyses/${analysisId}/notes/${noteId}`),
  togglePin: (analysisId, noteId)   => api.patch(`/analyses/${analysisId}/notes/${noteId}/pin`),
};

// ── Chat ─────────────────────────────────────────────────────────────────────
// POST   /chat/ask                       → ask AI  { question, sessionId? }
// GET    /chat/history                   → history  (params: sessionId?, limit)
// GET    /chat/sessions                  → sessions list
// DELETE /chat/history                   → clear  (params: sessionId?)
export const chatApi = {
  ask:          (data)      => api.post('/chat/ask', data),
  getHistory:   (params)    => api.get('/chat/history', { params }),
  getSessions:  ()          => api.get('/chat/sessions'),
  clearHistory: (sessionId) => api.delete('/chat/history', {
    params: sessionId ? { sessionId } : undefined,
  }),
};

// ── Company ──────────────────────────────────────────────────────────────────
// GET    /company/profile                → company profile
// PUT    /company/profile                → update profile
// PUT    /company/contact                → update contact info
// POST   /company/logo                   → upload logo (multipart)
// PUT    /company/ai-focus               → update custom AI prompt focus
export const companyApi = {
  getProfile:    ()       => api.get('/company/profile'),
  updateProfile: (data)   => api.put('/company/profile', data),
  updateContact: (data)   => api.put('/company/contact', data),
  uploadLogo:    (form)   => api.post('/company/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updatePrompt:  (data)   => api.put('/company/ai-focus', data),
};

// ── Profile (current user) ────────────────────────────────────────────────────
// GET    /profile                        → my profile
// PUT    /profile                        → update  { fullName, phoneNumber }
// PUT    /profile/change-password        → change password { currentPassword, newPassword, confirmPassword }
// POST   /profile/2fa/enable             → enable 2FA (sends OTP)
// POST   /profile/2fa/verify             → confirm 2FA  { code }
// DELETE /profile/2fa                    → disable 2FA  { code }
export const profileApi = {
  get:             ()     => api.get('/profile'),
  update:          (data) => api.put('/profile', data),
  changePassword:  (data) => api.put('/profile/change-password', data),
  enable2FA:       ()     => api.post('/profile/2fa/enable'),
  verify2FA:       (data) => api.post('/profile/2fa/verify', data),
  disable2FA:      (data) => api.delete('/profile/2fa', { data }),
};

// ── Users (Company-level management) ─────────────────────────────────────────
// POST   /users/invite                   → invite user
// GET    /users                          → list
// GET    /users/{id}                     → detail
// PUT    /users/{id}/role                → update role
// PUT    /users/{id}/activate            → activate
// DELETE /users/{id}                     → delete
// GET    /users/pending                  → pending approval list
// POST   /users/{id}/approve             → approve
// POST   /users/{id}/reject              → reject  { reason? }
export const usersApi = {
  getAll:     (params)   => api.get('/users', { params }),
  getById:    (id)       => api.get(`/users/${id}`),
  invite:     (data)     => api.post('/users/invite', data),
  updateRole: (id, data) => api.put(`/users/${id}/role`, data),
  activate:   (id)       => api.put(`/users/${id}/activate`),
  delete:     (id)       => api.delete(`/users/${id}`),
  getPending: ()         => api.get('/users/pending'),
  approve:    (id)       => api.post(`/users/${id}/approve`),
  reject:     (id, data) => api.post(`/users/${id}/reject`, data),
};

// ── Attachments ──────────────────────────────────────────────────────────────
// POST   /attachments/{entityType}/{entityId}   → upload file (IFormFile field: "file")
//        entityType: Task | Report | Contract | Invoice
// GET    /attachments/{entityType}/{entityId}   → list attachments for entity
// GET    /attachments/{id}/download             → download attachment
// DELETE /attachments/{id}                      → delete
export const attachmentsApi = {
  upload:   (entityType, entityId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/attachments/${entityType}/${entityId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getByEntity: (entityType, entityId) => api.get(`/attachments/${entityType}/${entityId}`),
  download:    (id) => api.get(`/attachments/${id}/download`, { responseType: 'blob' }),
  delete:      (id) => api.delete(`/attachments/${id}`),
};

// ── Milestones ────────────────────────────────────────────────────────────────
// GET    /projects/{projectId}/milestones   → list
// GET    /milestones/{id}                   → detail
// POST   /milestones                        → create (AdminOnly)
// PUT    /milestones/{id}                   → update (AdminOnly)
// DELETE /milestones/{id}                   → delete (AdminOnly)
// PATCH  /milestones/{id}/complete          → mark complete (AdminOnly)
export const milestonesApi = {
  getByProject: (projectId)   => api.get(`/projects/${projectId}/milestones`),
  getById:      (id)          => api.get(`/milestones/${id}`),
  create:       (data)        => api.post('/milestones', data),
  update:       (id, data)    => api.put(`/milestones/${id}`, data),
  delete:       (id)          => api.delete(`/milestones/${id}`),
  complete:     (id)          => api.patch(`/milestones/${id}/complete`),
};

// ── Email Templates ───────────────────────────────────────────────────────────
// GET    /email-templates                   → list
// GET    /email-templates/{id}              → detail
// POST   /email-templates                   → create (AdminOnly)
// PUT    /email-templates/{id}              → update (AdminOnly)
// DELETE /email-templates/{id}              → delete (AdminOnly)
export const emailTemplatesApi = {
  getAll:  (params)   => api.get('/email-templates', { params }),
  getById: (id)       => api.get(`/email-templates/${id}`),
  create:  (data)     => api.post('/email-templates', data),
  update:  (id, data) => api.put(`/email-templates/${id}`, data),
  delete:  (id)       => api.delete(`/email-templates/${id}`),
};

// ── Project Budget ────────────────────────────────────────────────────────────
// GET /projects/{id}/budget
export const budgetApi = {
  getBudget: (projectId) => api.get(`/projects/${projectId}/budget`),
};

// ── Task Dependencies ─────────────────────────────────────────────────────────
// POST   /tasks/{id}/dependencies           → add dependency  { dependsOnTaskId }
// DELETE /tasks/{id}/dependencies/{depId}   → remove dependency
export const taskDepsApi = {
  add:    (taskId, data)        => api.post(`/tasks/${taskId}/dependencies`, data),
  remove: (taskId, depId)       => api.delete(`/tasks/${taskId}/dependencies/${depId}`),
};

// ── Invoices Approval + Recurring ─────────────────────────────────────────────
// POST /invoices/{id}/approve
// POST /invoices/{id}/reject  { note? }
// (Recurring fields are sent in create/update body: isRecurring, recurringInterval)

// ── Contracts Approval ────────────────────────────────────────────────────────
// POST /contracts/{id}/approve
// POST /contracts/{id}/reject  { note? }

// ── Search ───────────────────────────────────────────────────────────────────
// GET /search?q=...&type=Project|Task|Report|Contract|Invoice&limit=20
export const searchApi = {
  search: (params) => api.get('/search', { params }),
};

// ── Admin (SuperAdmin / Admin only) ───────────────────────────────────────────
// Companies:
//   GET    /admin/companies                        → list (params: page, pageSize, ...)
//   GET    /admin/companies/{id}                   → detail
//   PUT    /admin/companies/{id}/status            → update status
//   DELETE /admin/companies/{id}                   → delete
//   POST   /admin/companies/{id}/analyze           → trigger analysis
// Statistics / Logs:
//   GET    /admin/statistics                       → platform stats
//   GET    /admin/audit-logs                       → audit log (params)
//   GET    /admin/activity-feed                    → recent activity
// Documents:
//   GET    /admin/documents/failed                 → failed docs
//   POST   /admin/documents/{id}/retry             → retry analysis
// Users:
//   GET    /admin/users                            → all users
//   GET    /admin/users/{id}                       → user detail
//   PUT    /admin/users/{id}/activate              → activate user
//   PUT    /admin/users/{id}/deactivate            → deactivate user
//   PUT    /admin/users/{id}/reset-password        → reset password
export const adminApi = {
  // Companies
  getCompanies:        (params)  => api.get('/admin/companies', { params }),
  getCompanyDetails:   (id)      => api.get(`/admin/companies/${id}`),
  updateCompanyStatus: (id, d)   => api.put(`/admin/companies/${id}/status`, d),
  deleteCompany:       (id)      => api.delete(`/admin/companies/${id}`),
  analyzeCompany:      (id)      => api.post(`/admin/companies/${id}/analyze`),
  // Stats / logs
  getStats:            ()        => api.get('/admin/statistics'),
  getAuditLogs:        (params)  => api.get('/admin/audit-logs', { params }),
  getActivityFeed:     ()        => api.get('/admin/activity-feed'),
  // Documents
  getFailedDocs:       ()        => api.get('/admin/documents/failed'),
  retryAnalysis:       (docId)   => api.post(`/admin/documents/${docId}/retry`),
  // Users
  getAllUsers:          (params)  => api.get('/admin/users', { params }),
  getUserById:          (id)      => api.get(`/admin/users/${id}`),
  activateUser:         (id)      => api.put(`/admin/users/${id}/activate`),
  deactivateUser:       (id)      => api.put(`/admin/users/${id}/deactivate`),
  resetPassword:        (id, d)   => api.put(`/admin/users/${id}/reset-password`, d),
};

// ── Risks ─────────────────────────────────────────────────────────────────────
export const risksApi = {
  getDashboard:    ()        => api.get('/risks/dashboard'),
  getMatrix:       ()        => api.get('/risks/matrix'),
  getEarlyWarnings:()        => api.get('/risks/early-warnings'),
  getAll:          (params)  => api.get('/risks', { params }),
  getById:         (id)      => api.get(`/risks/${id}`),
  create:          (data)    => api.post('/risks', data),
  update:          (id, data)=> api.put(`/risks/${id}`, data),
  delete:          (id)      => api.delete(`/risks/${id}`),
  assess:          (id)      => api.post(`/risks/${id}/assess`),
  getDecisionSupport:(id)    => api.get(`/risks/${id}/decision-support`),
};

// ── Business Intelligence ─────────────────────────────────────────────────────
export const biApi = {
  analyzeOpportunities: (data) => api.post('/bi/opportunities', data),
  generateStrategicPlan:(data) => api.post('/bi/strategic-plan', data),
  analyzeInvestment:    (data) => api.post('/bi/investment', data),
  analyzeMarket:        (data) => api.post('/bi/market', data),
};

// ── CRM ───────────────────────────────────────────────────────────────────────
export const crmApi = {
  getDashboard:        ()            => api.get('/crm/dashboard'),
  getClients:          ()            => api.get('/crm/clients'),
  getClientProfile:    (id)          => api.get(`/crm/clients/${id}`),
  getAiInsights:       ()            => api.get('/crm/insights'),
  getClientInsight:    (id)          => api.get(`/crm/clients/${id}/insight`),
  getInteractions:     (clientId)    => api.get(`/crm/clients/${clientId}/interactions`),
  addInteraction:      (data)        => api.post('/crm/interactions', data),
  deleteInteraction:   (id)          => api.delete(`/crm/interactions/${id}`),
};
