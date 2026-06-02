"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  profile: any;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // PROFILE LOADER
  // =========================
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile error:", error);
      return;
    }

    setProfile(data);
  };

  // =========================
  // INIT AUTH (ONE SOURCE OF TRUTH)
  // =========================
  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth init error:", error);
        }

        if (!alive) return;

        setUser(user ?? null);

        if (user) {
          await loadProfile(user.id);
        } else {
          setProfile(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    init();

    return () => {
      alive = false;
    };
  }, []);

  // =========================
  // AUTH LISTENER (SAFE VERSION)
  // =========================
  useEffect(() => {
    const { data: subscription } =
      supabase.auth.onAuthStateChange((event) => {
        // НЕ доверяем session из event → он может быть временно null

        supabase.auth.getUser().then(({ data, error }) => {
          if (error) {
            console.error("Auth event error:", error);
            return;
          }

          const currentUser = data.user ?? null;

          setUser(currentUser);

          if (currentUser) {
            loadProfile(currentUser.id);
          } else {
            setProfile(null);
          }
        });
      });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // =========================
  // CONTEXT VALUE
  // =========================
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);