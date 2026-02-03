import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query } = await req.json();
        if (!query) throw new Error('Query parameter is required');

        console.log(`Searching for: ${query}`);

        // Parallel Execution
        const [games, shows, anime, books] = await Promise.all([
            searchIGDB(query).catch(logError('IGDB')),
            searchTMDB(query).catch(logError('TMDB')),
            searchAniList(query).catch(logError('AniList')),
            searchGoogleBooks(query).catch(logError('Books'))
        ]);

        // Merge & Sort
        const results = [...games, ...shows, ...anime, ...books].sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const q = query.toLowerCase();
            if (aTitle === q && bTitle !== q) return -1;
            if (bTitle === q && aTitle !== q) return 1;
            return 0; // Keep natural order from APIs roughly
        });

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
    }
})

const logError = (apiName: string) => (e: any) => {
    console.error(`${apiName} Error:`, e);
    return [];
};

// --- IGDB (Games) ---
async function searchIGDB(query: string) {
    const clientId = Deno.env.get('IGDB_CLIENT_ID');
    const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET');

    if (!clientId || !clientSecret) return [];

    // 1. Get Token
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        })
    });
    const { access_token } = await tokenRes.json();

    // 2. Search (Games) - Include time_to_beat (hltb) if available (IGDB structure varies)
    // Note: 'time_to_beat' is an endpoint/field. Simple search first.
    // We search for games involved.
    const rawSearch = `
        search "${query}";
        fields name, cover.url, summary, first_release_date, involved_companies.company.name;
        limit 6;
    `;

    const searchRes = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'text/plain'
        },
        body: rawSearch
    });

    if (!searchRes.ok) throw new Error('IGDB Search Failed');
    const data = await searchRes.json();
    // C. Normalize
    return data.map((g: any) => ({
        id: `game-${g.id}`,
        type: 'game',
        title: g.name,
        cover_url: g.cover?.url ? `https:${g.cover.url.replace('t_thumb', 't_cover_big')}` : null,
        description: g.summary, // IGDB description
        metadata: {
            creator: g.involved_companies?.[0]?.company?.name || 'Unknown Dev',
            extra_info: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear().toString() : '',
            // NOTE: Time To Beat requires a separate call or expand. Keeping simple for single search.
            // Ideally we'd map this, but for now we'll rely on client detail view to fetch full metadata.
            total_prog: null
        }
    }));
}

// --- 2. TMDB (Shows/Movies) Integration ---
async function searchTMDB(query: string) {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) return [];

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`;
    const res = await fetch(url);
    const { results } = await res.json();

    return results
        .filter((item: any) => (item.media_type === 'tv' || item.media_type === 'movie'))
        .slice(0, 6)
        .map((item: any) => {
            const isMovie = item.media_type === 'movie';
            return {
                id: `show-${item.id}`,
                type: 'show',
                title: isMovie ? item.title : item.name,
                cover_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                description: item.overview, // TMDB description
                metadata: {
                    creator: isMovie ? 'Movie' : 'TV Series',
                    extra_info: (isMovie ? item.release_date : item.first_air_date)?.split('-')[0] || '',
                    total_prog: null // Seasons/Runtime would need detail fetch
                }
            };
        });
}

// --- 3. AniList (Anime/Manga) ---
async function searchAniList(query: string) {
    // No Key needed for public read
    const gqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large }
          description
          episodes
          seasonYear
          studios(isMain: true) { nodes { name } }
        }
      }
    }
    `;

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables: { search: query } })
    });

    if (!res.ok) throw new Error('AniList Failed');
    const { data } = await res.json();

    return data.Page.media.map((a: any) => ({
        id: `show-${a.id}-anime`, // Suffix to distinguish? Or just show-ID
        type: 'show', // Keeping as 'show' but could be 'anime' if frontend supports it
        title: a.title.english || a.title.romaji,
        cover_url: a.coverImage?.large,
        description: a.description?.replace(/<[^>]*>?/gm, ''), // Strip HTML from AniList
        metadata: {
            creator: a.studios?.nodes?.[0]?.name || 'Anime Studio',
            extra_info: a.seasonYear ? `${a.seasonYear} (Anime)` : 'Anime',
            total_prog: a.episodes
        }
    }));
}

// --- 4. Google Books Integration ---
async function searchGoogleBooks(query: string) {
    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6${keyParam}`;

    const res = await fetch(url);
    const { items } = await res.json();
    if (!items) return [];

    return items.map((item: any) => {
        const info = item.volumeInfo;
        return {
            id: `book-${item.id}`,
            type: 'book',
            title: info.title,
            cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
            description: info.description, // Google Books description
            metadata: {
                creator: info.authors?.[0] || 'Unknown Author',
                extra_info: info.pageCount ? `${info.pageCount} pgs` : 'Book',
                total_prog: info.pageCount
            }
        };
    });
}
