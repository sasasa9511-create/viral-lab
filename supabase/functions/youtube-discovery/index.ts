import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function isoDuration(value: string): number {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "Supabase configuration is missing" }, 500);
  if (!youtubeKey) return json({ error: "YOUTUBE_API_KEY is not configured" }, 500);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body = await req.json();
    const query = String(body?.query || "").trim();
    const projectId = String(body?.project_id || "").trim();
    const maxResults = Math.min(Math.max(Number(body?.max_results || 10), 1), 100);
    const publishedAfter = body?.published_after ? String(body.published_after) : undefined;

    if (!query || !projectId) return json({ error: "query and project_id are required" }, 400);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();
    if (projectError || !project) return json({ error: "Project not found or not owned by user" }, 403);

    const params = new URLSearchParams({
      key: youtubeKey,
      part: "snippet",
      type: "video",
      q: query,
      maxResults: String(maxResults),
      order: "viewCount",
    });
    if (publishedAfter) params.set("publishedAfter", publishedAfter);

    const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const searchData = await searchResponse.json();
    if (!searchResponse.ok) return json({ error: searchData?.error?.message || "YouTube search failed" }, 502);

    const ids = (searchData.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
    if (!ids.length) return json({ videos: [] });

    const detailsParams = new URLSearchParams({
      key: youtubeKey,
      part: "snippet,statistics,contentDetails",
      id: ids.join(","),
    });
    const detailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailsParams}`);
    const detailsData = await detailsResponse.json();
    if (!detailsResponse.ok) return json({ error: detailsData?.error?.message || "YouTube details failed" }, 502);

    const videos = (detailsData.items || []).map((item: any) => ({
      platform: "youtube",
      external_id: item.id,
      title: item.snippet?.title || "Untitled",
      channel_name: item.snippet?.channelTitle || null,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || null,
      published_at: item.snippet?.publishedAt || null,
      views: Number(item.statistics?.viewCount || 0),
      likes: Number(item.statistics?.likeCount || 0),
      comments: Number(item.statistics?.commentCount || 0),
      duration_seconds: isoDuration(item.contentDetails?.duration || ""),
      metadata: {
        category_id: item.snippet?.categoryId || null,
        tags: item.snippet?.tags || [],
        discovery_query: query,
      },
    }));

    return json({ videos });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected discovery error" }, 500);
  }
});
