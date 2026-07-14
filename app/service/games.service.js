import { supabase } from "../lib/supabase/client";

export async function insertGame(data) {
    return supabase.from("games").insert(data);
}

export async function upsertUserScores(data) {
    return supabase.from("user_scores").upsert(data, { onConflict: "user_id" });
}
