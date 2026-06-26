import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("cr_token") || null,
  loading: false,
  error: null,

  init: async () => {
    const token = localStorage.getItem("cr_token");
    const savedUser = localStorage.getItem("cr_user");
    if (token && savedUser) {
      try {
        set({ user: JSON.parse(savedUser), token });
      } catch {
        localStorage.removeItem("cr_token");
        localStorage.removeItem("cr_user");
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.message, loading: false });
        return { ok: false, msg: data.message };
      }
      localStorage.setItem("cr_token", data.token);
      localStorage.setItem("cr_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, msg: "Network error" };
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.message, loading: false });
        return { ok: false, msg: data.message };
      }
      localStorage.setItem("cr_token", data.token);
      localStorage.setItem("cr_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, msg: "Network error" };
    }
  },

  logout: () => {
    localStorage.removeItem("cr_token");
    localStorage.removeItem("cr_user");
    set({ user: null, token: null });
  },

  updateUser: (updates) =>
    set((s) => ({ user: { ...s.user, ...updates } })),
}));