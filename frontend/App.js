import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import LoginScreen from "./components/LoginScreen";
import InventoryApp from "./InventoryApp";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return null;
  return session ? <InventoryApp session={session} /> : <LoginScreen />;
}
