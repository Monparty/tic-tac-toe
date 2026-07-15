import { supabase } from "../lib/supabase/client";

export async function insertGame(data) {
    return supabase.from("games").insert(data);
}

export async function upsertUserScores(data) {
    return supabase.from("user_scores").upsert(data, { onConflict: "user_id" });
}

export async function getUserScores() {
    return supabase
        .from("user_scores")
        .select(
            `
            *,
            profiles (
                username
            )
        `,
        )
        .order("score", { ascending: false });
}
