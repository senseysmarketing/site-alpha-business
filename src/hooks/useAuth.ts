import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return !!data;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = async (u: User | null) => {
      setUser(u);
      if (u) {
        const admin = await fetchIsAdmin(u.id);
        if (!cancelled) {
          setIsAdmin(admin);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolve(session?.user ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, isAdmin, signOut };
}
