// Auth hook v4 — with role support + presence heartbeat
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "gerente" | "corretor" | "assistente" | "moderator" | "user" | null;

const HEARTBEAT_KEY = "presence:last_touch";
const HEARTBEAT_MIN_MS = 2 * 60 * 1000; // no more than once per 2 min
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // fire every 5 min while tab is open

async function fetchRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .single();
  return (data?.role as AppRole) || null;
}

async function touchLastSeen() {
  try {
    const now = Date.now();
    const prev = Number(localStorage.getItem(HEARTBEAT_KEY) || 0);
    if (now - prev < HEARTBEAT_MIN_MS) return;
    localStorage.setItem(HEARTBEAT_KEY, String(now));
    await supabase.rpc("touch_last_seen");
  } catch {
    // silent
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    let cancelled = false;

    const resolve = async (u: User | null) => {
      setUser(u);
      if (u) {
        const r = await fetchRole(u.id);
        if (!cancelled) {
          setRole(r);
          setLoading(false);
        }
        touchLastSeen();
      } else {
        if (!cancelled) {
          setRole(null);
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

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") touchLastSeen();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") touchLastSeen();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem(HEARTBEAT_KEY);
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
  };

  return { user, loading, isAdmin, role, signOut };
}
