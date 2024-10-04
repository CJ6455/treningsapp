import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../supabase";
import { Session } from "@supabase/supabase-js";
import { Alert, AppState, AppStateStatus } from "react-native";
import { set } from "date-fns";

export type UserRole = "client" | "professional" | "admin";

interface ProfessionalData {
  id: string;
  // Add other professional-specific fields as needed
}

interface AuthContextType {
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  professionalData: ProfessionalData | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  role: null,
  loading: true,
  professionalData: null,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [professionalData, setProfessionalData] =
    useState<ProfessionalData | null>(null);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      setRole(profile.role);

      if (profile.role === "professional") {
        // Fetch professional-specific data
        const { data: proData, error: proError } = await supabase
          .from("specialists")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (proError) throw proError;

        setProfessionalData(proData);
      } else {
        setProfessionalData(null);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error.message);
      setRole(null);
      setProfessionalData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Initializing...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(session);
        console.log("Session:", session);
        if (session && session.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setRole(null);
          setProfessionalData(null);
        }
      } catch (error: any) {
        console.error("Initialization error:", error.message);
      } finally {
        console.log("Initialization complete.");
        setLoading(false);
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session && session.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setRole(null);
          setProfessionalData(null);
          setLoading(false);
        }
      }
    );

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup subscriptions on unmount
    return () => {
      authListener.subscription.unsubscribe();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let profileSubscription: any;

    if (session && session.user) {
      profileSubscription = supabase
        .channel(`public:profiles:id=eq.${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${session.user.id}`,
          },
          async (payload: any) => {
            try {
              const newRole = payload.new.role;
              setRole(newRole);

              if (newRole === "professional") {
                await fetchUserProfile(session.user.id);
              } else {
                setProfessionalData(null);
              }
            } catch (error: any) {
              console.error(
                "Error fetching professional data in subscription:",
                error.message
              );
              setProfessionalData(null);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [session]);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Sign-in error:", error.message);
      setLoading(false);
      return { error };
    }
    setSession(data.session);
    if (data.session && data.session.user) {
      await fetchUserProfile(data.session.user.id);
    }
    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error.message);
      setLoading(false);
      return { error };
    }
    setSession(null);
    setRole(null);
    setProfessionalData(null);
    setLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Sign-up error:", error.message);
      setLoading(false);
      return { error };
    }

    if (!data.session) {
      Alert.alert("Please check your inbox for email verification!");
      setLoading(false);
      return { error: "Please check your inbox for email verification!" };
    }
    setSession(data.session);
    setRole("client");

    await fetchUserProfile(data.session.user.id);
    setLoading(false);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        loading,
        professionalData,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
