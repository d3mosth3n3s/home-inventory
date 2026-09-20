import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const client = axios.create({ baseURL: API_BASE });

export const getItems = () => client.get("/items");
export const createItem = (item) => client.post("/items", item);
export const updateItem = (id, item) => client.put(`/items/${id}`, item);
export const deleteItem = (id) => client.delete(`/items/${id}`);
export const getSummary = () => client.get("/items/summary");
export const getExportUrl = () => `${API_BASE}/items/export`;
