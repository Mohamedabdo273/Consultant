import api from './axios';

export const authApi = {
  // ── Registration flow ─────────────────────────────────────────────────────
  register:        (data) => api.post('/auth/register/initiate', data),
  resendOtp:       (data) => api.post('/auth/register/resend-otp', data),
  verifyOtp:       (data) => api.post('/auth/register/verify-otp', data),
  completeReg:     (data) => api.post('/auth/register/complete', data),
  clientRegister:  (data) => api.post('/auth/register/client', data),

  // ── Session ───────────────────────────────────────────────────────────────
  login:           (data) => api.post('/auth/login', data),
  logout:          ()     => api.post('/auth/logout'),
  refreshToken:    (data) => api.post('/auth/refresh', data),

  // ── Profile / token ───────────────────────────────────────────────────────
  me:              ()     => api.get('/auth/me'),
  validateToken:   ()     => api.get('/auth/validate-token'),
  changePassword:  (data) => api.post('/auth/change-password', data),

  // ── Password reset ────────────────────────────────────────────────────────
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  resetPassword:   (data) => api.post('/auth/reset-password', data),

  // ── 2FA ───────────────────────────────────────────────────────────────────
  enable2FA:       ()     => api.post('/auth/2fa/enable'),
  confirm2FA:      (data) => api.post('/auth/2fa/confirm', data),
  verify2FA:       (data) => api.post('/auth/2fa/verify', data),
  disable2FA:      ()     => api.delete('/auth/2fa/disable'),

  // ── OAuth ─────────────────────────────────────────────────────────────────
  googleLogin:     (data) => api.post('/auth/google', data),
};
