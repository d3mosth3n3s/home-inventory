import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://ruotwlkuoqvhnuuscljo.supabase.co";
const supabaseAnonKey = "sb_publishable_M4xxQAWSBPh9qvr2YBJ1aw_d8JWg9vg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
