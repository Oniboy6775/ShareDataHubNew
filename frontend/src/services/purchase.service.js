import api from "./api";
export const purchaseService = {
  getPlans: (params) => api.get("/plans", { params }),
  buyData: (d) => api.post("/buy/data", d),
  buyAirtime: (d) => api.post("/buy/airtime", d),
  buyElectricity: (d) => api.post("/buy/electricity", d),
  buyCable: (d) => api.post("/buy/cable", d),
  validateMeter: (d) => api.post("/buy/validateMeter", d),
  fetchDiscos: () => api.get("/buy/fetchDiscos"),
};
