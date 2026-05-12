import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getCurrentSession, onAuthStateChange } from '../services/auth.service';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentSession()
      .then((s) => {
        if (!cancelled) {
          setSession(s);
          setUser(s?.user ?? null);
        }
      })
      .catch(() => {
        // session check failed — treat as unauthenticated
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const subscription = onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}
