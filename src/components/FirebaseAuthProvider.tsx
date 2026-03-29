"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  plan: "free" | "premium";
  ai_credits: number;
  daily_question_count: number;
  streak_count: number;
  is_donor: boolean;
  donation_total: number;
}

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  updateProfile: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncedUidRef = useRef<string | null>(null);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const syncProfile = useCallback(async (appUser: AppUser): Promise<UserProfile | null> => {
    try {
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: appUser.id,
          email: appUser.email,
          name: appUser.user_metadata?.full_name || appUser.user_metadata?.name || appUser.email?.split("@")[0] || null,
          phone: appUser.phone || null,
        }),
      });

      if (!syncRes.ok) {
        return null;
      }

      const { user } = await syncRes.json();
      setProfile(user as UserProfile);
      return user as UserProfile;
    } catch (syncError) {
      console.error("Failed to sync user to DB", syncError);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`/api/users?uid=${userId}`);
      if (res.ok) {
        const { user } = await res.json();
        setProfile(user as UserProfile);
        return user as UserProfile;
      }

      if (res.status !== 404) {
        console.error("Profile fetch failed with status", res.status);
      }

      return null;
    } catch (error) {
      console.error("Error fetching profile from API:", error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const currentProfile = await fetchProfile(user.id);
      if (!currentProfile) {
        const syncedProfile = await syncProfile(user);
        if (syncedProfile) {
          lastSyncedUidRef.current = user.id;
        }
      }
    }
  }, [fetchProfile, syncProfile, user]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!active) return;

      if (firebaseUser) {
        const appUser: AppUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber,
          user_metadata: {
            full_name: firebaseUser.displayName || undefined,
            name: firebaseUser.displayName || undefined,
            avatar_url: firebaseUser.photoURL || undefined,
          }
        };
        setUser(appUser);

        if (lastSyncedUidRef.current === firebaseUser.uid && profile?.id === firebaseUser.uid) {
          setLoading(false);
          return;
        }

        const currentProfile = await syncProfile(appUser);
        if (currentProfile) {
          lastSyncedUidRef.current = firebaseUser.uid;
        } else {
          const fallbackProfile = await fetchProfile(firebaseUser.uid);
          if (fallbackProfile) {
            lastSyncedUidRef.current = firebaseUser.uid;
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        lastSyncedUidRef.current = null;
      }
      
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchProfile, profile?.id, syncProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
