import axios from 'axios';

// Resolve the API base URL at runtime (highest priority first):
//   1. window.__ETHIOBRIDGE_API_URL__  — runtime override set by a deployment config script
//   2. import.meta.env.VITE_API_URL     — build-time env var
//   3. /api                             — same-origin (dev: Vite proxy; prod: reverse proxy / backend-served)
const runtimeApiUrl = typeof window !== 'undefined' ? window.__ETHIOBRIDGE_API_URL__ : undefined;

const API = axios.create({
  baseURL: runtimeApiUrl || import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ethiobridge_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — skip for token-verification calls (getMe) and login attempts
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !err.config?.headers?.['X-Skip-Auth-Redirect'] && !isLoginRequest) {
      localStorage.removeItem('ethiobridge_token');
      localStorage.removeItem('ethiobridge_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: (config) => API.get('/auth/me', config),
  updateProfile: (data) =>
    API.put('/auth/profile', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ---- Infrastructure ----
export const infraAPI = {
  create: (data) => API.post('/infrastructure', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  createGuest: (data) => API.post('/infrastructure/guest', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  trackGuest: (data) => API.post('/infrastructure/track', data),
  getPublic: (params) => API.get('/infrastructure/public', { params }),
  getPublicAutocomplete: (params) => API.get('/infrastructure/public/autocomplete', { params }),
  getAll: (params) => API.get('/infrastructure/admin/all', { params }),
  getMy: (params) => API.get('/infrastructure/my/reports', { params }),
  getAssigned: (params) => API.get('/infrastructure/assigned', { params }),
  getGovernmentReports: (params) => API.get('/infrastructure/government/reports', { params }),
  getOne: (id) => API.get(`/infrastructure/${id}`),
  track: (reportId) => API.get(`/infrastructure/track/${reportId}`),
  verify: (id, data) => API.put(`/infrastructure/${id}/verify`, data),
  assign: (id, data) => API.put(`/infrastructure/${id}/assign`, data),
  updateStatus: (id, data) => API.put(`/infrastructure/${id}/status`, data),
  citizenVerify: (id, data) => API.put(`/infrastructure/${id}/citizen-verify`, data),
  addFeedback: (id, data) => API.put(`/infrastructure/${id}/feedback`, data),
  escalate: (id, data) => API.put(`/infrastructure/${id}/escalate`, data),
  addComment: (id, data) => API.post(`/infrastructure/${id}/comments`, data),
  addAfterMedia: (id, data) => API.put(`/infrastructure/${id}/after-media`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  getAnalytics: (params) => API.get('/infrastructure/analytics', { params }),
  getEnhancedAnalytics: (params) => API.get('/infrastructure/analytics/enhanced', { params }),
  getSLAStats: () => API.get('/infrastructure/analytics/sla'),
  bulkVerify: (data) => API.post('/infrastructure/bulk/verify', data),
  bulkDelete: (data) => API.post('/infrastructure/bulk/delete', data),
  bulkAssign: (data) => API.post('/infrastructure/bulk/assign', data),
  export: (params) => API.get('/infrastructure/export', { params }),
  exportPDF: (id) => API.get(`/infrastructure/export/pdf/${id}`, { responseType: 'blob' }),
  exportBulkPDF: (params) => API.get('/infrastructure/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => API.get('/infrastructure/export/excel', { params, responseType: 'blob' }),
  getGovernmentUsers: () => API.get('/infrastructure/government-users'),
  getDepartmentStats: () => API.get('/infrastructure/department-stats'),
  delete: (id) => API.delete(`/infrastructure/${id}`),
};

// ---- News ----
export const newsAPI = {
  create: (data) => API.post('/news', data),
  getPublic: (params) => API.get('/news', { params }),
  getAll: (params) => API.get('/news/admin/all', { params }),
  getOne: (id) => API.get(`/news/${id}`),
  publish: (id) => API.put(`/news/${id}/publish`),
  update: (id, data) => API.put(`/news/${id}`, data),
  delete: (id) => API.delete(`/news/${id}`),
};

// ---- Success Stories ----
export const successStoryAPI = {
  create: (data) => API.post('/success-stories', data),
  getMy: (params) => API.get('/success-stories/my', { params }),
  delete: (id) => API.delete(`/success-stories/${id}`),
  uploadImage: (data) => API.post('/success-stories/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ---- Notifications ----
export const notifAPI = {
  get: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

// ---- Admin ----
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getRegionStats: () => API.get('/admin/region-stats'),
  getDepartments: () => API.get('/admin/departments'),
  getActivityLogs: (params) => API.get('/admin/activity-logs', { params }),
  getUsers: (params) => API.get('/admin/users', { params }),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  approveUser: (id, data) => API.put(`/admin/users/${id}/approve`, data),
  toggleActive: (id) => API.put(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getPendingApprovals: () => API.get('/admin/pending-approvals'),
  getCategories: (params) => API.get('/admin/categories', { params }),
  createCategory: (data) => API.post('/admin/categories', data),
  updateCategory: (id, data) => API.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
  getContactMessages: (params) => API.get('/admin/contact-messages', { params }),
  getContactMessage: (id) => API.get(`/admin/contact-messages/${id}`),
  markContactMessageRead: (id) => API.patch(`/admin/contact-messages/${id}/read`),
  replyContactMessage: (id, data) => API.patch(`/admin/contact-messages/${id}/reply`, data),
  deleteContactMessage: (id) => API.delete(`/admin/contact-messages/${id}`),
};

// ---- Public ----
export const publicAPI = {
  getStats: () => API.get('/public/stats'),
  getRegionStats: () => API.get('/public/region-stats'),
  getAnalytics: () => API.get('/public/analytics'),
  getMapMarkers: () => API.get('/public/map-markers'),
  getMapAnalytics: () => API.get('/public/map-analytics'),
  getVolunteers: (params) => API.get('/public/volunteers', { params }),
  submitContact: (data) => API.post('/public/contact', data),
  getReceiptUrl: (number, pin) =>
    `${API.defaults.baseURL}/public/receipt?number=${encodeURIComponent(number)}&pin=${encodeURIComponent(pin)}`,
};

// ---- Public Complaints ----
export const complaintAPI = {
  create: (data) => API.post('/public-complaints', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  getAll: (params) => API.get('/public-complaints', { params }),
  getOne: (id) => API.get(`/public-complaints/${id}`),
  track: (trackingNumber) => API.get(`/public-complaints/track/${trackingNumber}`),
  updateStatus: (id, data) => API.patch(`/public-complaints/${id}/status`, data),
  addMessage: (id, data) => API.post(`/public-complaints/${id}/comments`, data),
  getStats: () => API.get('/public-complaints/stats'),
};

// ---- Alert Broadcasts ----
export const alertAPI = {
  create: (data) => API.post('/alerts', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  getActive: (params) => API.get('/alerts', { params }),
  getOne: (id) => API.get(`/alerts/${id}`),
  update: (id, data) => API.put(`/alerts/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  updateStatus: (id, data) => API.patch(`/alerts/${id}/status`, data),
  delete: (id) => API.delete(`/alerts/${id}`),
  getStats: () => API.get('/alerts/stats'),
  getAll: (params) => API.get('/alerts/all', { params }),
  getMine: (params) => API.get('/alerts/mine', { params }),
  // Citizen-scoped alerts with per-user read tracking.
  getCitizen: (params) => API.get('/alerts/citizen', { params }),
  markRead: (id) => API.post(`/alerts/${id}/read`),
  markAllRead: () => API.post('/alerts/read-all'),
};

// ---- Workflow (Administrative Levels) ----
export const workflowAPI = {
  getStats: () => API.get('/workflow/stats'),
  getHierarchy: () => API.get('/workflow/hierarchy'),
  getReports: (params) => API.get('/workflow/reports', { params }),
  getReportDetail: (id) => API.get(`/workflow/reports/${id}`),
  forwardReport: (id, data) => API.post(`/workflow/reports/${id}/forward`, data),
  resolveReport: (id, data) => API.post(`/workflow/reports/${id}/resolve`, data),
  closeCase: (id, data) => API.post(`/workflow/reports/${id}/close`, data),
  addComment: (id, data) => API.post(`/workflow/reports/${id}/comment`, data),
  getOfficersAtLevel: (level) => API.get(`/workflow/officers/${level}`),
};

// ---- Campaigns / Fundraising ----
export const campaignAPI = {
  getPublic: (params) => API.get('/campaigns/public', { params }),
  getPublicCampaign: (id) => API.get(`/campaigns/public/${id}`),
  getCategoryStats: () => API.get('/campaigns/public/category-stats'),
  getSuccessStories: () => API.get('/campaigns/public/success-stories'),
  getTopDonors: () => API.get('/campaigns/public/top-donors'),

  getAll: (params) => API.get('/campaigns', { params }),
  getMy: (params) => API.get('/campaigns/my', { params }),
  getOne: (id) => API.get(`/campaigns/public/${id}`),
  create: (data) => API.post('/campaigns', data),
  uploadImages: (data) => API.post('/campaigns/upload-images', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => API.put(`/campaigns/${id}`, data),
  delete: (id) => API.delete(`/campaigns/${id}`),
  approve: (id) => API.put(`/campaigns/${id}/approve`),
  reject: (id) => API.put(`/campaigns/${id}/reject`),
  publish: (id) => API.post(`/campaigns/${id}/publish`),
  close: (id) => API.post(`/campaigns/${id}/close`),
  addComment: (id, data) => API.post(`/campaigns/${id}/comments`, data),
  getCampaignDonations: (id, params) => API.get(`/campaigns/${id}/donations`, { params }),
  getCampaignAnalytics: (id) => API.get(`/campaigns/${id}/analytics`),
  getStats: () => API.get('/campaigns/stats'),

  donate: (data) => API.post('/campaigns/donate', data),
  getDonationHistory: (params) => API.get('/campaigns/donations/history', { params }),
  getReceipt: (receiptNumber) => API.get(`/campaigns/donations/receipt/${receiptNumber}`),
  getMyReceipts: () => API.get('/campaigns/donations/receipts/my'),

  // Payment sessions (initiate → scan/confirm → verify)
  initiatePayment: (data) => API.post('/campaigns/payments/initiate', data),
  verifyPayment: (data) => API.post('/campaigns/payments/verify', data),
  getPaymentStatus: (txRef) => API.get(`/campaigns/payments/${txRef}/status`),

  saveCampaign: (id) => API.post(`/campaigns/${id}/save`),
  getSavedCampaigns: () => API.get('/campaigns/saved/my'),

  getFinancialReports: () => API.get('/campaigns/financial/reports'),
  getFinancialAnalytics: () => API.get('/campaigns/financial/analytics'),
  getDistributionReports: () => API.get('/campaigns/financial/distribution'),
  detectFraud: () => API.get('/campaigns/admin/fraud-detection'),

  // Report-to-Campaign Integration
  getAvailableReports: () => API.get('/campaigns/available-reports'),
  createFromReport: (data) => API.post('/campaigns/create-from-report', data),
};

// ---- Subcity Dashboard ----
export const subcityAPI = {
  getStats: () => API.get('/subcity/stats'),
  getReports: (params) => API.get('/subcity/reports', { params }),
  getReportDetail: (id) => API.get(`/subcity/reports/${id}`),
  updateReportStatus: (id, data) => API.put(`/subcity/reports/${id}/status`, data),
  getElectricityReports: (params) => API.get('/subcity/electricity-reports', { params }),
  updateElectricityReportStatus: (id, data) => API.put(`/subcity/electricity-reports/${id}/status`, data),
  getComplaints: (params) => API.get('/subcity/complaints', { params }),
  getComplaintStats: () => API.get('/subcity/complaint-departments'),
  getAnalytics: () => API.get('/subcity/analytics'),
  getPublicComplaints: (params) => API.get('/subcity/public-complaints', { params }),
  getCampaigns: (params) => API.get('/subcity/campaigns', { params }),
  updateCampaignStatus: (id, data) => API.put(`/subcity/campaigns/${id}/status`, data),
  addComplaintFeedback: (id, data) => API.post(`/subcity/complaints/${id}/feedback`, data),
  getDepartmentFeedback: (params) => API.get('/subcity/department-feedback', { params }),
  addDepartmentFeedback: (data) => API.post('/subcity/department-feedback', data),
  updateComplaintStatus: (id, data) => API.put(`/subcity/complaints/${id}/status`, data),
  getNotifications: () => API.get('/subcity/notifications'),
  getCitizens: () => API.get('/subcity/citizens'),
  createWoredaUser: (data) => API.post('/subcity/woreda-users', data),
  toggleWoredaUserActive: (id) => API.put(`/subcity/woreda-users/${id}/toggle-active`),
  resetUserPassword: (id, data) => API.put(`/subcity/users/${id}/reset-password`, data),
};

// ---- Feedback ----
export const feedbackAPI = {
  create: (data) => API.post('/feedback', data),
  getMine: () => API.get('/feedback/mine'),
  getIncoming: (params) => API.get('/feedback/incoming', { params }),
};

// ---- Woreda ----
export const woredaAPI = {
  getList: () => API.get('/woreda'),
  create: (data) => API.post('/woreda', data),
  update: (id, data) => API.put(`/woreda/${id}`, data),
  delete: (id) => API.delete(`/woreda/${id}`),
  getUsers: () => API.get('/woreda/users'),
  getStats: () => API.get('/woreda/stats'),
  getAnalytics: () => API.get('/woreda/analytics'),
  getReports: (params) => API.get('/woreda/reports', { params }),
  getReportDetail: (id) => API.get(`/woreda/reports/${id}`),
  updateInfrastructureStatus: (id, data) => API.put(`/woreda/reports/${id}/status`, data),
  assignToDepartment: (id, data) => API.put(`/woreda/reports/${id}/assign-department`, data),
  getCampaigns: (params) => API.get('/woreda/campaigns', { params }),
  updateCampaignStatus: (id, data) => API.put(`/woreda/campaigns/${id}/status`, data),
  updateComplaintStatus: (id, data) => API.put(`/woreda/complaints/${id}/status`, data),
  addComplaintComment: (id, data) => API.put(`/woreda/complaints/${id}/comment`, data),
  upgradeComplaint: (id, data) => API.put(`/complaints/${id}/upgrade`, data),
  resolveComplaint: (id, data) => API.put(`/complaints/${id}/resolve`, data),
  getDepartmentFeedback: (params) => API.get('/woreda/department-feedback', { params }),
  addDepartmentFeedback: (data) => API.post('/woreda/department-feedback', data),
};

// ---- Department ----
export const deptAPI = {
  getStats: () => API.get('/department/stats'),
  getReports: (params) => API.get('/department/reports', { params }),
  getReportDetail: (id) => API.get(`/department/reports/${id}`),
  acceptReport: (id) => API.put(`/department/reports/${id}/accept`),
  rejectReport: (id, data) => API.put(`/department/reports/${id}/reject`, data),
  startWorking: (id) => API.put(`/department/reports/${id}/start`),
  markComplete: (id, data) => API.put(`/department/reports/${id}/complete`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
};

// ---- Location & Department Management (dynamic dropdowns) ----
export const locationAPI = {
  // Subcities
  getSubcities: () => API.get('/subcities'),
  getAllSubcities: () => API.get('/subcities/all'),
  createSubcity: (data) => API.post('/subcities', data),
  updateSubcity: (id, data) => API.put(`/subcities/${id}`, data),
  deleteSubcity: (id) => API.delete(`/subcities/${id}`),
  // Woredas
  getWoredas: (params) => API.get('/woredas', { params }),
  getWoredasBySubcity: (subcityId) => API.get(`/woredas/${subcityId}`),
  getAllWoredas: (params) => API.get('/woredas/all', { params }),
  createWoreda: (data) => API.post('/woredas', data),
  updateWoreda: (id, data) => API.put(`/woredas/${id}`, data),
  deleteWoreda: (id) => API.delete(`/woredas/${id}`),
  // Departments
  getDepartments: () => API.get('/departments'),
  getPublicComplaintDepartments: () => API.get('/departments/form'),
  getAllDepartments: () => API.get('/departments/all'),
  createDepartment: (data) => API.post('/departments', data),
  updateDepartment: (id, data) => API.put(`/departments/${id}`, data),
  deleteDepartment: (id) => API.delete(`/departments/${id}`),
};

// ---- Report Complaint (Complaint model) ----
export const complaintReportAPI = {
  create: (data) => API.post('/complaints', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  createMy: (data) => API.post('/complaints/my', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  getMy: (params) => API.get('/complaints/my/reports', { params }),
  track: (data) => API.post('/complaints/track', data),
};

// ---- AI Assistant (bilingual English/Amharic chat agent) ----
export const aiAPI = {
  chat: (data) => API.post('/ai-assistant/chat', data),
  health: () => API.get('/ai-assistant/health'),
};

// ---- Volunteer Task Management ----
export const volunteerTaskAPI = {
  // Volunteer
  getStats: () => API.get('/volunteer-tasks/stats'),
  getAvailableTasks: () => API.get('/volunteer-tasks/available'),
  getMyAssignedTasks: () => API.get('/volunteer-tasks/my-assigned'),
  getMyApplications: () => API.get('/volunteer-tasks/my-applications'),
  applyToTask: (id, data) => API.post(`/volunteer-tasks/${id}/apply`, data),
  startTask: (id) => API.put(`/volunteer-tasks/${id}/start`),
  updateTaskProgress: (id, data) => API.put(`/volunteer-tasks/${id}/progress`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  requestCompletion: (id) => API.put(`/volunteer-tasks/${id}/complete`),
  toggleSubtask: (taskId, subtaskId) => API.patch(`/volunteer-tasks/${taskId}/subtasks/${subtaskId}/toggle`),
  // Woreda / Sub-city
  getOrgStats: () => API.get('/volunteer-tasks/org/stats'),
  getOrgTasks: () => API.get('/volunteer-tasks/org/tasks'),
  createTask: (data) => API.post('/volunteer-tasks', data),
  getOrgApplications: (params) => API.get('/volunteer-tasks/org/applications', { params }),
  approveApplication: (id) => API.put(`/volunteer-tasks/applications/${id}/approve`),
  rejectApplication: (id, data) => API.put(`/volunteer-tasks/applications/${id}/reject`, data),
  getOrgCompletions: () => API.get('/volunteer-tasks/org/completions'),
  verifyCompletion: (id) => API.put(`/volunteer-tasks/${id}/verify`),
  rejectCompletion: (id, data) => API.put(`/volunteer-tasks/${id}/verify-reject`, data),
  getOrgVolunteers: () => API.get('/volunteer-tasks/org/volunteers'),
};

export default API;
