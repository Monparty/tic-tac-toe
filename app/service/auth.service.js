import { supabase } from "../lib/supabase/client";

export const register = async ({ email, password, username }) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            },
        },
    });
    if (error) return { error };
    return { data };
};
export const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const logout = () => supabase.auth.signOut();
export const getCurrentUser = () => supabase.auth.getUser();
