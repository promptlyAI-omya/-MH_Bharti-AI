"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  plan: "free" | "premium";
  ai_credits: number;
  daily_question_count: number;
  streak_count: number;
}

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(SupabaseContext);
}

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setProfile(data as UserProfile);
      return data as UserProfile;
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let active = true;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const currentProfile = await fetchProfile(session.user.id);
        // Auto-create user row if it doesn't exist (covers all auth methods)
        if (!currentProfile && (_event === "SIGNED_IN" || _event === "INITIAL_SESSION")) {
          await supabase.from("users").upsert(
            {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
              phone: session.user.phone || null,
              plan: "free",
              ai_credits: 5,
              daily_question_count: 0,
              streak_count: 0,
            },
            { onConflict: "id" }
          );
          await fetchProfile(session.user.id);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Make sure initial loading resolves if there is no session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
      {children}
    </SupabaseContext.Provider>
  );
}
