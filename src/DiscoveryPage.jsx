import { useState } from "react";
import { ExternalLink, Loader2, Play, Search, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";

const COUNTS = [10, 50, 100];
const RANGES = [["day", "امروز"], ["week", "این هفته"], ["month", "این ماه"], ["year", "امسال"]];

function publishedAfter(range) {
  const days = { day: 1, week: 7, month: 30, year: 365 };
  return new Date(Date.now() - days[range] * 86400000).toISOString();
}

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

export default function DiscoveryPage({ user, onToast }) {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(10);
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [projectId, setProjectId] = useState("");

  async function discover() {
    if (!query.trim()) return onToast("موضوع جستجو را وارد کنید");
    if (!supabase || !user) return onToast("ابتدا وارد حساب شوید");
    setLoading(true);
    try {
      let pid = projectId;
      if (!pid) {
        const { data, error } = await supabase.from("projects").insert({ user_id: user.id, name: `ViralLab — ${query.trim()}`, niche: query.trim(), default_platform: "youtube" }).select().single();
        if (error) throw error;
        pid = data.id;
        setProjectId(pid);
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const { data, error } = await supabase.functions.invoke("youtube-discovery", {
        body: { project_id: pid, query: query.trim(), max_results: count, published_after: publishedAfter(range) },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const videos = (data?.videos || []).map((video) => ({ ...video, viral_score: scoreVideo(video) }));
      if (videos.length) {
        const rows = videos.map(({ viral_score, ...video }) => ({ project_id: pid, ...video, metadata: { ...(video.metadata || {}), discovery_query: query.trim(), range } }));
        const { data: saved, error: saveError } = await supabase.from("videos").upsert(rows, { onConflict: "project_id,platform,external_id" }).select();
        if (saveError) throw saveError;
        const byId = new Map((saved || []).map((v) => [v.external_id, v]));
        setResults(videos.map((v) => ({ ...v, id: byId.get(v.external_id)?.id || v.external_id })));
      } else setResults([]);
      onToast(`تعداد ${videos.length} ویدئو پیدا و ذخیره شد`);
    } catch (error) {
      onToast(error?.message || "خطا در کشف ویدئوها");
    } finally { setLoading(false); }
  }

  return <section>
    <div className="page-header"><div><h1>کشف ویدئوهای وایرال</h1><p>ویدئوهای واقعی YouTube را پیدا، ذخیره و برای تحلیل آماده کنید.</p></div></div>
    <div className="hero" style={{ marginBottom: 24 }}><div><span className="eyebrow"><Sparkles size={16} /> Viral Discovery Engine</span><h1>از داده واقعی، الگوی وایرال بساز.</h1><p>تعداد ویدئو، بازه زمانی و موضوع را انتخاب کن.</p></div></div>
    <div className="panel">
      <label>موضوع یا کلیدواژه</label>
      <div className="search-box discovery-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && discover()} placeholder="مثلاً آموزش زبان، کسب‌وکار، آشپزی..." /></div>
      <div className="form-grid" style={{ marginTop: 18 }}>
        <div><label>تعداد ویدئو</label><div className="segmented">{COUNTS.map((n) => <button key={n} className={count === n ? "selected" : ""} onClick={() => setCount(n)}>{n}</button>)}</div></div>
        <div><label>بازه زمانی</label><select value={range} onChange={(e) => setRange(e.target.value)}>{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <button className="primary-button wide" disabled={loading} onClick={discover} style={{ marginTop: 18 }}>{loading ? <><Loader2 className="spin" size={18} /> در حال جستجو...</> : <><Search size={18} /> شروع کشف ویدئوها</>}</button>
    </div>
    {results.length > 0 && <div className="results-grid" style={{ marginTop: 24 }}>{results.map((video) => <article className="card video-card" key={video.id}>{video.thumbnail_url && <img src={video.thumbnail_url} alt="" />}<div><strong>{video.title}</strong><p>{video.channel_name}</p><div className="score high"><Sparkles size={14} /> {video.viral_score}</div><a href={video.url} target="_blank" rel="noreferrer"><Play size={14} /> مشاهده <ExternalLink size={13} /></a></div></article>)}</div>}
  </section>;
}
