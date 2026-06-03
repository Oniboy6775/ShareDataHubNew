import api from "./api";
export const authService = {
  register: (d) => api.post("/auth/register", d),
  login: (d) => api.post("/auth/login", d),
  getProfile: () => api.get("/auth/profile"),
  changePassword: (d) => api.post("/auth/change-password", d),
  generateApiKey: () => api.post("/auth/generate-api-key"),
  updateProfile: (d) => api.patch("/auth/profile", d),
  redeemCoupon: (d) => api.post("/auth/redeem-coupon", d),
  getTransactions: (p) => api.get("/auth/transactions", { params: p }),
  initiateFunding: (d) => api.post("/fundwallet/fund", d),
  forgotPassword: (d) => api.post("/auth/forgot-password", d),
  resetPassword: (d) => api.post("/auth/reset-password", d),
  createReservedAccount: () => api.post("/fundwallet/reserved-account"),
  createBillStackAccount: (d) => api.post("/fundwallet/billstack-account", d),
  setPin: (d) => api.post("/auth/set-pin", d),
  removePin: () => api.post("/auth/remove-pin"),
  getStats: () => api.get("/auth/stats"),
};
