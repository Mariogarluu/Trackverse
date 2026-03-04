import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { type, external_id, season_number } = await req.json();

    if (!type || !external_id) {
      throw new Error("type y external_id son obligatorios");
    }

    // Por ahora solo detallamos series de TMDB (no anime)
    if (type === "show" && external_id.endsWith("-anime")) {
      return new Response(
        JSON.stringify({ data: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let data: any = null;

    if (type === "show") {
      const tmdbId = parseInt(external_id.replace(/^show-/, ""), 10);
      if (!Number.isFinite(tmdbId)) {
        throw new Error("TMDB id inválido");
      }

      const apiKey = Deno.env.get("TMDB_API");
      if (!apiKey) {
        throw new Error("Variable TMDB_API no configurada");
      }

      if (season_number !== undefined) {
        // Fetch Specific Season
        const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season_number}?api_key=${apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB Season error: ${res.status}`);

        const seasonData = await res.json();
        data = {
          id: seasonData.id,
          name: seasonData.name,
          overview: seasonData.overview,
          season_number: seasonData.season_number,
          episodes: (seasonData.episodes || []).map((e: any) => ({
            id: e.id,
            episode_number: e.episode_number,
            title: e.name,
            overview: e.overview,
            still_path: e.still_path,
            vote_average: e.vote_average,
            air_date: e.air_date
          }))
        };
      } else {
        // Fetch Show Details
        const url =
          `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=es-ES`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`TMDB TV error: ${res.status}`);
        }

        const tv = await res.json();

        data = {
          provider: "tmdb",
          id: tv.id,
          name: tv.name,
          overview: tv.overview,
          number_of_seasons: tv.number_of_seasons,
          number_of_episodes: tv.number_of_episodes,
          episode_run_time: tv.episode_run_time,
          seasons: (tv.seasons || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            season_number: s.season_number,
            episode_count: s.episode_count,
            air_date: s.air_date,
          })),
        };
      }

    }
  } else if (type === "movie") {
    const tmdbId = external_id.replace(/^movie-/, "");
    const apiKey = Deno.env.get("TMDB_API");

    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`;
    const res = await fetch(url);

    if (res.ok) {
      const movie = await res.json();
      data = {
        provider: "tmdb",
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        metadata: {
          creator: "Movie",
          extra_info: movie.release_date ? movie.release_date.split('-')[0] : '',
          total_prog: movie.runtime || 0, // Runtime in minutes
          rating: movie.vote_average
        },
        raw: movie
      };
    }
  } else if (type === "game") {
    const igdbId = external_id.replace(/^game-/, "");

    const clientId = Deno.env.get('IGDB_CLIENT');
    const clientSecret = Deno.env.get('IGDB_API');

    if (!clientId || !clientSecret) {
      throw new Error("IGDB credentials missing");
    }

    // 1. Get Token
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!tokenRes.ok) throw new Error("IGDB Token Failed");
    const { access_token } = await tokenRes.json();

    // 2. Fetch Game Details (including time_to_beat)
    // IGDB uses body for query
    const rawBody = `
         fields name, summary, involved_companies.company.name, first_release_date, cover.url,
                game_modes.name, genres.name, platforms.name,
                aggregated_rating, rating,
                time_to_beat.normally, time_to_beat.hastly, time_to_beat.completely;
         where id = ${igdbId};
      `;

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'text/plain'
      },
      body: rawBody
    });

    if (!igdbRes.ok) throw new Error("IGDB API Failed");

    const [game] = await igdbRes.json();

    if (game) {
      // Harcoded prioritization for "Total Hours": Normal -> Complete -> Hasty
      const hours = game.time_to_beat ?
        (Math.round((game.time_to_beat.normally || game.time_to_beat.completely || game.time_to_beat.hastly || 0) / 3600))
        : 0;

      data = {
        provider: "igdb",
        id: game.id,
        title: game.name,
        description: game.summary,
        // Map to our generic structure
        metadata: {
          creator: game.involved_companies?.[0]?.company?.name || "Unknown",
          extra_info: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : "",
          total_prog: hours, // Normalized to hours
          rating: game.aggregated_rating || game.rating
        },
        raw: game // Keep raw just in case
      };
    }

  } else if (type === "book") {
    // Books usually come with page count from search, but we could re-fetch from Google Books if needed.
    // For now, let's assume search passed enough, but if we have an ID we can fetch more.
    const bookId = external_id.replace(/^book-/, "");
    const url = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
    const res = await fetch(url);
    if (res.ok) {
      const book = await res.json();
      const info = book.volumeInfo;
      data = {
        provider: "google_books",
        id: book.id,
        title: info.title,
        description: info.description?.replace(/<[^>]*>?/gm, ''),
        metadata: {
          creator: info.authors?.[0] || 'Unknown',
          extra_info: info.pageCount ? `${info.pageCount} pgs` : 'Book',
          total_prog: info.pageCount
        }
      };
    }
  } else {
    data = null;
  }

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
} catch (e: any) {
  console.error("media-details error", e);
  return new Response(
    JSON.stringify({ error: e.message ?? "Unknown error" }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    },
  );
}
});


