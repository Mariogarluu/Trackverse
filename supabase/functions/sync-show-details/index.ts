import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { show_id, external_id } = await req.json();

        if (!show_id || !external_id) {
            throw new Error("show_id y external_id son obligatorios");
        }

        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Fetch from TMDB
        const tmdbKey = Deno.env.get("TMDB_API");
        if (!tmdbKey) throw new Error("TMDB_API key missing");

        // Extract ID number if it has prefix 'show-'
        const tmdbId = external_id.replace(/^show-/, "").replace(/-anime$/, "");

        const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbKey}&language=es-ES&append_to_response=season/1,season/2,season/3,season/4,season/5,season/6,season/7,season/8,season/9,season/10`;
        // Note: append_to_response is limited. Better to fetch basic info + iterate seasons if needed.
        // For robustness, let's fetch basic info to get season numbers, then fetch seasons in parallel if needed (or just rely on what basic info gives if enough).
        // Actually, standard /tv/{id} endpoint gives 'seasons' array but without episode details. 
        // We NEED episode details. So we must fetch each season.

        const showRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbKey}&language=es-ES`);
        if (!showRes.ok) throw new Error("Failed to fetch show from TMDB");

        const showData = await showRes.json();
        const seasons = showData.seasons || [];

        console.log(`Syncing ${seasons.length} seasons for show ${show_id}...`);

        // 3. Iterate Seasons and Fetch Episodes
        for (const season of seasons) {
            // Skip "Specials" (season 0) if desired, or keep them. keeping them.

            const seasonRes = await fetch(
                `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${tmdbKey}&language=es-ES`
            );

            if (!seasonRes.ok) {
                console.error(`Failed to fetch season ${season.season_number}`);
                continue;
            }

            const seasonData: any = await seasonRes.json();

            // A. Insert/Update Catalog Season
            const { data: seasonRecord, error: seasonError } = await supabase
                .from("catalog_seasons")
                .upsert({
                    show_id: show_id,
                    season_number: season.season_number,
                    title: seasonData.name || season.name,
                    overview: seasonData.overview,
                    episode_count: season.episode_count,
                    air_date: season.air_date,
                    poster_path: season.poster_path,
                    external_id: `season/${season.id}`
                }, { onConflict: "show_id, season_number" })
                .select("id")
                .single();

            if (seasonError) {
                console.error("Error creating season", seasonError);
                continue;
            }

            const seasonId = seasonRecord.id;

            // B. Prepare Episodes
            const episodes = seasonData.episodes || [];
            const episodeRows = episodes.map((ep: any) => ({
                show_id: show_id,
                season_id: seasonId,
                episode_number: ep.episode_number,
                title: ep.name,
                overview: ep.overview,
                air_date: ep.air_date,
                still_path: ep.still_path,
                vote_average: ep.vote_average,
                runtime: ep.runtime,
                external_id: `ep/${ep.id}`
            }));

            // C. Bulk Insert/Upsert Episodes
            if (episodeRows.length > 0) {
                const { error: epError } = await supabase
                    .from("catalog_episodes")
                    .upsert(episodeRows, { onConflict: "season_id, episode_number" });

                if (epError) console.error("Error inserting episodes", epError);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: `Synced ${seasons.length} seasons` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e: any) {
        console.error("sync-show-details error", e);
        return new Response(
            JSON.stringify({ error: e.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
