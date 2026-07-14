import { supabase } from "../lib/supabase/client";

export async function upsertGame(data) {
    return supabase.from("games").upsert(data);
}

export async function upsertUserScores(data) {
    return supabase.from("user_scores").upsert(data);
}
