import api from "./api";
export const contactService = {
  getAll: () => api.get("/contacts"),
  save: (d) => api.post("/contacts", d),
  delete: (id) => api.delete(`/contacts/${id}`),
};
