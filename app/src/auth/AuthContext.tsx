import { createContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { registerForPush } from '@/lib/push';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const registeredFor = useRef<string | null>(null);

  // Push-Token registrieren, sobald ein User eingeloggt ist (einmal pro User).
  useEffect(() => {
    const uid = session?.user?.id;
    if (uid && registeredFor.current !== uid) {
      registeredFor.current = uid;
      registerForPush(uid);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
