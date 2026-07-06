import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getMyProfile } from "./lib/api";
import { supabase } from "./lib/supabase";
import type { MemberProfile } from "./types";

type AuthStatus = "initializing" | "guest" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: MemberProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<MemberProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      let nextProfile = await getMyProfile();
      if (!nextProfile) {
        const currentUser = (await supabase.auth.getUser()).data.user;
        const fallbackName =
          typeof currentUser?.user_metadata?.full_name === "string"
            ? currentUser.user_metadata.full_name
            : null;
        const repaired = await supabase.rpc("upsert_mweb_authenticated_lead", {
          lead_name: fallbackName,
        });
        if (repaired.error) throw repaired.error;
        nextProfile = (repaired.data?.[0] ?? null) as MemberProfile | null;
      }
      setProfile(nextProfile);
      return nextProfile;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "guest");
      if (!nextSession) {
        setProfile(null);
        setProfileLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      if (data.session) void refreshProfile().catch(() => setProfile(null));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && nextSession) {
        window.setTimeout(() => {
          void refreshProfile().catch(() => setProfile(null));
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    setSession(null);
    setProfile(null);
    setStatus("guest");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      refreshProfile,
      signOut,
    }),
    [profile, profileLoading, refreshProfile, session, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
