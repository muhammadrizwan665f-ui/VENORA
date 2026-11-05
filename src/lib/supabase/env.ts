export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Public catalogue + auth can work. */
export const isSupabaseConfigured = () => Boolean(supabaseUrl() && supabaseAnonKey());
/** Admin writes, order recording and tracking can work (server only). */
export const isAdminConfigured = () => isSupabaseConfigured() && Boolean(supabaseServiceKey());
