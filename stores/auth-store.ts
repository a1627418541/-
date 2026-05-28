import { create } from "zustand";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string, turnstileToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,

  init: async () => {
    const { data } = await authClient.getSession();
    if (data?.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          image: data.user.image ?? null,
        },
      });
    }
  },

  login: async (email, password, turnstileToken) => {
    set({ isLoading: true, error: null });

    if (turnstileToken) {
      const verifyRes = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json().catch(() => ({}));
        set({ error: verifyData.error || "人机验证失败", isLoading: false });
        return false;
      }
    }

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
    });
    if (error) {
      set({ error: error.message || "登录失败", isLoading: false });
      return false;
    }
    set({
      user: data?.user
        ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.image ?? null,
          }
        : null,
      isLoading: false,
    });
    return true;
  },

  register: async (email, password, name, turnstileToken) => {
    set({ isLoading: true, error: null });

    if (turnstileToken) {
      const verifyRes = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json().catch(() => ({}));
        set({ error: verifyData.error || "人机验证失败", isLoading: false });
        return false;
      }
    }

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: name || email.split("@")[0],
      callbackURL: "/",
    });
    if (error) {
      set({ error: error.message || "注册失败", isLoading: false });
      return false;
    }
    set({
      user: data?.user
        ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.image ?? null,
          }
        : null,
      isLoading: false,
    });
    return true;
  },

  logout: async () => {
    await authClient.signOut();
    set({ user: null, error: null });
  },

  setUser: (user) => set({ user }),
}));
