import { useEffect, useState } from "react";
import { BarChart3, Loader2, Play, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";

function scoreVideo(video) {
  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const comments = Number(video.comments || 0);
  const duration = Number(video.duration_seconds || 0);
  const engagement = views ? ((likes + comments) / views) * 100 : 0;
  const viewSignal = Math.min(45, Math.log10(Math.max(views, 1)) * 5);
  const engagementSignal = Math.min(30, engagement * 4);
  const durationSignal = duration >= 20 && duration <= 900 ? 15 : 8;
  return Math.round(Math.min(100, viewSignal + engagementSignal + durationSignal));
}

function analyze(video) {
  const viral = scoreVideo(video);
  const title = video.title || "";
  const hook = Math.min(100, 45 + (/[?!:]/.test(title) ? 15 : 0) + (/(چرا|چگونه|راز|اشتباه|ترفند|how|why|secret|mistake|tips)/i.test(title) ? 25 : 5));
  const duration = Number(video.duration_seconds || 0);
  const pacing = duration === 0 ? 50 : duration < 60 ? 92 : duration < 300 ? 82 : duration < 900 ? 70 : 55;
  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const comments = Number(video.comments || 0);
  const engagement = views ? Math.min(100, (((likes + comments * 2) / views) * 100) * 10) : 0;
  const cta = /(subscribe|follow|comment|share|سابسکرایب|دنبال|نظر|اشتراک)/i.test(`${title} ${video.description || ""}`) ? 82 : 48;
  return {
    viral_score: viral, hook_score: Math.round(hook), retention_score: Math.round((pacing + hook) / 2),
    pacing_score: Math.round(pacing), engagement_score: Math.round(engagement), cta_score: cta,
    title_score: Math.round(hook), thumbnail_score: Math.min(95, Math.round(55 + viral * 0.4)),
    hook_text: title, cta_text: cta >= 70 ? "CTA در عنوان/توضیحات شناسایی شد" : "CTA واضح در متادیتا شناسایی نشد",
    structure: { opening: hook >= 70 ? "strong-hook" : "standard-opening", pacing: pacing >= 80 ? "fast" : "moderate", duration_seconds: duration },
    scenes: [], strengths: [viral >= 75 ? "سیگنال عملکرد بالا" : "داده عملکرد قابل استفاده", hook >= 70 ? "Hook قوی در عنوان" : "عنوان قابل بهبود"],
    weaknesses: [cta < 70 ? "CTA واضح نیست" : "", pacing < 70 ? "مدت ویدئو برای ریتم سریع طولانی است" : ""].filter(Boolean),
    recommendations: [hook < 70 ? "۳ ثانیه اول را با یک سؤال یا وعده مشخص شروع کنید" : "Hook را حفظ و سریع‌تر به ارزش اصلی برسید", cta < 70 ? "CTA مشخص در پایان اضافه کنید" : "CTA فعلی را کوتاه و مستقیم نگه دارید"]
  };
}

export default function AnalysisPage({ user, onToast }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState("");

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("videos").select("*, video_analyses(*)").order("created_at", { ascending: false }).limit(100);
    if (error) onToast?.("دریافت ویدئوها انجام نشد");
    setVideos(data || []); setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function runAnalysis(video) {
    setRunning(video.id);
    try {
      const result = analyze(video);
      const { error } = await supabase.from("video_analyses").insert({ video_id: video.id, ...result, status: "completed", model: "virallab-heuristic-v1" });
      if (error) throw error;
      onToast?.("تحلیل ویدئو ذخیره شد"); await load();
    } catch (e) { onToast?.(e?.message || "تحلیل انجام نشد"); }
    finally { setRunning(""); }
  }

  return <section>
    <div className="page-header"><div><h1>تحلیل ویدئو</h1><p>ویدئوهای ذخیره‌شده را با Viral Score و شاخص‌های Hook، Pacing، CTA و Engagement تحلیل کنید.</p></div></div>
    {loading ? <div className="empty-state"><Loader2 className="spin" /> در حال بارگذاری...</div> : !videos.length ? <div className="empty-state large"><BarChart3 size={42}/><h2>هنوز ویدئویی برای تحلیل نیست</h2><p>ابتدا از بخش «کشف ویدئو» چند ویدئو پیدا و ذخیره کنید.</p></div> : <div className="results-grid">
      {videos.map((video) => { const analysis = video.video_analyses?.[0]; return <article className="card video-card" key={video.id}>
        {video.thumbnail_url && <img src={video.thumbnail_url} alt=""/>}<div><strong>{video.title}</strong><p>{video.channel_name}</p>
        {analysis ? <div className="analysis-metrics"><span className="score high"><Sparkles size={14}/> {analysis.viral_score}</span><small>Hook {analysis.hook_score} · Pacing {analysis.pacing_score} · CTA {analysis.cta_score}</small></div> : <button className="primary-button" disabled={running === video.id} onClick={() => runAnalysis(video)}>{running === video.id ? <><Loader2 className="spin" size={16}/> در حال تحلیل...</> : <><BarChart3 size={16}/> تحلیل کن</>}</button>}
        <a href={video.url} target="_blank" rel="noreferrer"><Play size={14}/> مشاهده ویدئو</a></div></article>; })}
    </div>}
  </section>;
}
