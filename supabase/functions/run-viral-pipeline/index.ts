import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return json({ error: "Supabase configuration is missing" }, 500);

  const supabase = createClient(url, key, { global: { headers: { Authorization: authHeader } } });
  try {
    const { project_id: projectId } = await req.json();
    if (!projectId) return json({ error: "project_id is required" }, 400);

    const { data: project, error: projectError } = await supabase.from("projects").select("id,niche").eq("id", projectId).single();
    if (projectError || !project) return json({ error: "Project not found or not owned by user" }, 403);
    const { data: videos, error: videosError } = await supabase.from("videos").select("*").eq("project_id", projectId).order("viral_score", { ascending: false }).limit(100);
    if (videosError) throw videosError;
    if (!videos?.length) return json({ error: "No videos found for this project" }, 400);

    const totalViews = videos.reduce((s: number, v: any) => s + Number(v.views || 0), 0);
    const engagement = videos.map((v: any) => {
      const views = Number(v.views || 0);
      return views ? ((Number(v.likes || 0) + Number(v.comments || 0)) / views) * 100 : 0;
    });
    const averageEngagement = engagement.reduce((s: number, n: number) => s + n, 0) / engagement.length;
    const top = videos.slice(0, Math.min(5, videos.length));
    const avgDuration = top.reduce((s: number, v: any) => s + Number(v.duration_seconds || 0), 0) / top.length;
    const shortForm = avgDuration > 0 && avgDuration <= 90;

    const { data: run, error: runError } = await supabase.from("analysis_runs").insert({ project_id: projectId, status: "running", analysis_type: "quick" }).select().single();
    if (runError) throw runError;

    const patterns = [
      { name: "High-velocity topic", category: "trend", score: Math.min(100, 50 + Math.round(Math.log10(Math.max(totalViews, 1)) * 5)), evidence: { top_views: Number(top[0]?.views || 0) } },
      { name: shortForm ? "Short-form pacing" : "Long-form pacing", category: "format", score: shortForm ? 78 : 62, evidence: { average_duration_seconds: Math.round(avgDuration) } },
      { name: averageEngagement >= 5 ? "Strong engagement" : "Engagement opportunity", category: "engagement", score: Math.min(100, Math.round(averageEngagement * 10)), evidence: { average_engagement_percent: Number(averageEngagement.toFixed(2)) } },
    ];
    const { data: savedPatterns, error: patternError } = await supabase.from("patterns").insert(patterns.map((p) => ({ ...p, project_id: projectId, analysis_run_id: run.id }))).select();
    if (patternError) throw patternError;

    const hook = shortForm ? `در ۳ ثانیه اول، نتیجه یا تضاد اصلی «${project.niche || "موضوع"}» را نشان بده.` : `با یک سؤال مشخص درباره «${project.niche || "موضوع"}» شروع کن و سریع وعده نتیجه بده.`;
    const script = `Hook: ${hook}\n\nBody:\n1. مسئله اصلی مخاطب را در یک جمله مشخص کن.\n2. سه نکته کوتاه و قابل اجرا ارائه بده.\n3. یک مثال واقعی یا مقایسه قبل/بعد اضافه کن.\n\nCTA:\nاز مخاطب بخواه تجربه یا سؤال خودش را کامنت کند.`;
    const { data: blueprint, error: blueprintError } = await supabase.from("blueprints").insert({ project_id: projectId, analysis_run_id: run.id, title: `Blueprint — ${project.niche || "Viral Content"}`, hook, script, cta: "تجربه یا سؤال خودت را کامنت کن.", shot_list: ["Hook / 0-3s", "Problem / 3-8s", "3 value beats", "Example / proof", "CTA"], originality_notes: "ساختار و الگوها استخراج شده‌اند؛ متن و اجرای نهایی باید متناسب با برند و خلاقیت شما بازنویسی شود." }).select().single();
    if (blueprintError) throw blueprintError;

    const summary = { video_count: videos.length, average_engagement_percent: Number(averageEngagement.toFixed(2)), total_views: totalViews, top_video_id: top[0]?.external_id || null };
    await supabase.from("analysis_runs").update({ status: "completed", summary }).eq("id", run.id);
    return json({ summary, patterns: savedPatterns || [], blueprint, script: { title: blueprint.title, hook, script } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Pipeline failed" }, 500);
  }
});
