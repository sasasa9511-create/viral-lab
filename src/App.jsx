import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const DEMO_IDEAS = [
  {
    id: "demo-1",
    title: "۵ اشتباه رایج که باعث می‌شود محتوایت وایرال نشود",
    platform: "Instagram",
    viral_score: 92,
    status: "saved",
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "demo-2",
    title: "قبل و بعد: چگونه یک Hook ضعیف را قدرتمند کنیم",
    platform: "TikTok",
    viral_score: 87,
    status: "draft",
    created_at: "2026-08-14T12:00:00Z",
  },
  {
    id: "demo-3",
    title: "۳ ایده برای افزایش تعامل مخاطب",
    platform: "Instagram",
    viral_score: 81,
    status: "published",
    created_at: "2026-08-13T09:30:00Z",
  },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "داشبورد", icon: Home },
  { id: "ideas", label: "ایده‌ها", icon: Lightbulb },
  { id: "content", label: "محتوا", icon: FileText },
  { id: "analytics", label: "تحلیل‌ها", icon: BarChart3 },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ideas, setIdeas] = useState(DEMO_IDEAS);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadSession();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadSession() {
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);

    if (session?.user) {
      await loadIdeas(session.user.id);
    }
  }

  async function loadIdeas(userId) {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setToast("خطا در دریافت ایده‌ها");
      return;
    }

    setIdeas(data || []);
  }

  async function createIdea(form) {
    const newIdea = {
      title: form.title.trim(),
      platform: form.platform,
      viral_score: calculateViralScore(form.title),
      status: "draft",
    };

    if (!newIdea.title) {
      setToast("عنوان ایده را وارد کنید");
      return;
    }

    if (supabase && user) {
      const { data, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          ...newIdea,
        })
        .select()
        .single();

      if (error) {
        setToast("ذخیره ایده انجام نشد");
        return;
      }

      setIdeas((current) => [data, ...current]);
    } else {
      setIdeas((current) => [
        {
          ...newIdea,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
    }

    setShowCreateModal(false);
    setToast("ایده با موفقیت ایجاد شد");
  }

  async function updateIdeaStatus(id, status) {
    if (supabase && user && !String(id).startsWith("demo-")) {
      const { error } = await supabase
        .from("ideas")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        setToast("تغییر وضعیت انجام نشد");
        return;
      }
    }

    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id ? { ...idea, status } : idea
      )
    );

    setToast("وضعیت ایده تغییر کرد");
  }

  async function deleteIdea(id) {
    if (supabase && user && !String(id).startsWith("demo-")) {
      const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        setToast("حذف انجام نشد");
        return;
      }
    }

    setIdeas((current) => current.filter((idea) => idea.id !== id));
    setToast("ایده حذف شد");
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setToast("از حساب خارج شدید");
  }

  const filteredIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return ideas;

    return ideas.filter((idea) =>
      `${idea.title} ${idea.platform} ${idea.status}`
        .toLowerCase()
        .includes(query)
    );
  }, [ideas, search]);

  const averageScore = useMemo(() => {
    if (!ideas.length) return 0;

    return Math.round(
      ideas.reduce((sum, idea) => sum + Number(idea.viral_score || 0), 0) /
        ideas.length
    );
  }, [ideas]);

  const stats = {
    totalIdeas: ideas.length,
    averageScore,
    published: ideas.filter((idea) => idea.status === "published").length,
    highPotential: ideas.filter(
      (idea) => Number(idea.viral_score || 0) >= 80
    ).length,
  };

  return (
    <div className="app" dir="rtl">
      <header className="topbar">
        <button
          className="icon-button mobile-menu"
          onClick={() => setSidebarOpen(true)}
          aria-label="باز کردن منو"
        >
          <Menu size={22} />
        </button>

        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>ViralLab</strong>
            <span>AI Growth Lab</span>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="connection-status">
            <span
              className={
                isSupabaseConfigured ? "status-dot online" : "status-dot"
              }
            />
            {isSupabaseConfigured ? "متصل" : "Demo Mode"}
          </div>

          <button className="icon-button" aria-label="اعلان‌ها">
            <Bell size={20} />
          </button>

          <div className="avatar">
            {user?.email?.charAt(0).toUpperCase() || "V"}
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <span>ViralLab</span>
            <button
              className="icon-button close-sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${
                    activePage === item.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setActivePage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {activePage === item.id && <ChevronRight size={16} />}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-bottom">
            <div className="pro-card">
              <Sparkles size={20} />
              <strong>ViralLab AI</strong>
              <p>ایده‌های بهتر، محتوای قوی‌تر و رشد سریع‌تر.</p>
            </div>

            {user && (
              <button className="logout-button" onClick={signOut}>
                <LogOut size={18} />
                خروج
              </button>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="main">
          {activePage === "dashboard" && (
            <Dashboard
              stats={stats}
              ideas={filteredIdeas}
              loading={loading}
              onCreate={() => setShowCreateModal(true)}
              onNavigate={setActivePage}
              onStatusChange={updateIdeaStatus}
            />
          )}

          {activePage === "ideas" && (
            <IdeasPage
              ideas={filteredIdeas}
              search={search}
              setSearch={setSearch}
              onCreate={() => setShowCreateModal(true)}
              onStatusChange={updateIdeaStatus}
              onDelete={deleteIdea}
            />
          )}

          {activePage === "content" && (
            <ContentPage onCreate={() => setShowCreateModal(true)} />
          )}

          {activePage === "analytics" && <AnalyticsPage ideas={ideas} />}

          {activePage === "settings" && (
            <SettingsPage user={user} />
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateIdeaModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createIdea}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Dashboard({
  stats,
  ideas,
  loading,
  onCreate,
  onNavigate,
  onStatusChange,
}) {
  return (
    <section>
      <PageHeader
        title="داشبورد"
        description="مرکز فرمان ViralLab برای رشد و تولید محتوای وایرال"
        action={
          <button className="primary-button" onClick={onCreate}>
            <Plus size={18} />
            ایده جدید
          </button>
        }
      />

      <div className="hero">
        <div>
          <span className="eyebrow">
            <Sparkles size={16} />
            AI Content Intelligence
          </span>
          <h1>ایده بعدی وایرال خودت را پیدا کن.</h1>
          <p>
            ViralLab به تو کمک می‌کند ایده‌ها را پیدا، امتیازدهی و مدیریت کنی.
          </p>
        </div>

        <button className="hero-button" onClick={onCreate}>
          شروع کنیم
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Lightbulb}
          title="کل ایده‌ها"
          value={stats.totalIdeas}
          detail="ایده ثبت شده"
        />
        <StatCard
          icon={TrendingUp}
          title="میانگین Viral Score"
          value={`${stats.averageScore}/100`}
          detail="قدرت بالقوه محتوا"
        />
        <StatCard
          icon={CheckCircle2}
          title="منتشر شده"
          value={stats.published}
          detail="محتوای منتشرشده"
        />
        <StatCard
          icon={Sparkles}
          title="پتانسیل بالا"
          value={stats.highPotential}
          detail="امتیاز بالای ۸۰"
        />
      </div>

      <div className="section-header">
        <div>
          <h2>آخرین ایده‌ها</h2>
          <p>ایده‌های اخیر خود را مدیریت کنید.</p>
        </div>

        <button
          className="text-button"
          onClick={() => onNavigate("ideas")}
        >
          مشاهده همه
          <ChevronRight size={16} />
        </button>
      </div>

      <IdeaTable
        ideas={ideas.slice(0, 5)}
        loading={loading}
        onStatusChange={onStatusChange}
      />
    </section>
  );
}

function IdeasPage({
  ideas,
  search,
  setSearch,
  onCreate,
  onStatusChange,
  onDelete,
}) {
  return (
    <section>
      <PageHeader
        title="ایده‌ها"
        description="ایده‌های محتوایی خود را مدیریت کنید."
        action={
          <button className="primary-button" onClick={onCreate}>
            <Plus size={18} />
            ایده جدید
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجوی ایده..."
          />
        </div>
      </div>

      <IdeaTable
        ideas={ideas}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    </section>
  );
}

function ContentPage({ onCreate }) {
  return (
    <section>
      <PageHeader
        title="محتوا"
        description="ایده‌ها را به محتوای آماده انتشار تبدیل کنید."
      />

      <div className="empty-state large">
        <FileText size={42} />
        <h2>Content Studio</h2>
        <p>
          این بخش در مرحله بعد به موتور تولید محتوای AI متصل می‌شود.
        </p>
        <button className="primary-button" onClick={onCreate}>
          <Sparkles size={18} />
          شروع با یک ایده
        </button>
      </div>
    </section>
  );
}

function AnalyticsPage({ ideas }) {
  const platforms = [...new Set(ideas.map((idea) => idea.platform))];

  return (
    <section>
      <PageHeader
        title="تحلیل‌ها"
        description="نمای کلی عملکرد ایده‌ها و محتوای ViralLab."
      />

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={20} />
            <h2>Viral Score</h2>
          </div>

          <div className="score-bars">
            {ideas.slice(0, 8).map((idea) => (
              <div className="score-row" key={idea.id}>
                <span>{idea.title}</span>
                <div className="bar">
                  <i style={{ width: `${idea.viral_score || 0}%` }} />
                </div>
                <strong>{idea.viral_score || 0}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <Users size={20} />
            <h2>پلتفرم‌ها</h2>
          </div>

          {platforms.length ? (
            platforms.map((platform) => (
              <div className="platform-row" key={platform}>
                <span>{platform}</span>
                <strong>
                  {ideas.filter((idea) => idea.platform === platform).length}
                </strong>
              </div>
            ))
          ) : (
            <div className="empty-state">هنوز داده‌ای وجود ندارد.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function SettingsPage({ user }) {
  return (
    <section>
      <PageHeader
        title="تنظیمات"
        description="تنظیمات حساب و اتصال ViralLab."
      />

      <div className="panel settings-panel">
        <div className="setting-row">
          <div>
            <strong>حساب کاربری</strong>
            <p>{user?.email || "Demo User"}</p>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <strong>Supabase</strong>
            <p>
              {isSupabaseConfigured
                ? "اتصال Supabase فعال است."
                : "در حال استفاده از Demo Mode هستید."}
            </p>
          </div>

          <span
            className={`badge ${
              isSupabaseConfigured ? "success" : "warning"
            }`}
          >
            {isSupabaseConfigured ? "Connected" : "Demo"}
          </span>
        </div>
      </div>
    </section>
  );
}

function IdeaTable({
  ideas,
  loading,
  onStatusChange,
  onDelete,
}) {
  if (loading) {
    return <div className="empty-state">در حال بارگذاری...</div>;
  }

  if (!ideas.length) {
    return (
      <div className="empty-state large">
        <Lightbulb size={42} />
        <h3>هنوز ایده‌ای وجود ندارد</h3>
        <p>اولین ایده Viral خود را ایجاد کنید.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ایده</th>
            <th>پلتفرم</th>
            <th>Viral Score</th>
            <th>وضعیت</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {ideas.map((idea) => (
            <tr key={idea.id}>
              <td>
                <div className="idea-title">
                  <div className="idea-icon">
                    <Lightbulb size={17} />
                  </div>
                  <span>{idea.title}</span>
                </div>
              </td>

              <td>{idea.platform || "-"}</td>

              <td>
                <Score score={idea.viral_score} />
              </td>

              <td>
                <select
                  value={idea.status}
                  onChange={(event) =>
                    onStatusChange?.(idea.id, event.target.value)
                  }
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="saved">ذخیره‌شده</option>
                  <option value="published">منتشرشده</option>
                  <option value="archived">آرشیو</option>
                </select>
              </td>

              <td>
                {onDelete && (
                  <button
                    className="danger-button"
                    onClick={() => onDelete(idea.id)}
                  >
                    حذف
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateIdeaModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");

  function submit(event) {
    event.preventDefault();
    onCreate({ title, platform });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>ایده جدید</h2>
            <p>ایده محتوایی خود را وارد کنید.</p>
          </div>

          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            عنوان ایده
            <textarea
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً: ۵ اشتباه رایج..."
              rows={4}
              autoFocus
            />
          </label>

          <label>
            پلتفرم
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube</option>
              <option>LinkedIn</option>
              <option>X</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              انصراف
            </button>

            <button type="submit" className="primary-button">
              <Sparkles size={18} />
              ایجاد ایده
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Score({ score = 0 }) {
  const value = Number(score || 0);

  let className = "low";

  if (value >= 80) className = "high";
  else if (value >= 60) className = "medium";

  return (
    <span className={`score ${className}`}>
      <Sparkles size={14} />
      {value}
    </span>
  );
}

function calculateViralScore(title) {
  const text = title.trim();

  if (!text) return 0;

  let score = 50;

  if (text.length >= 20) score += 8;
  if (text.length >= 45) score += 7;

  const keywords = [
    "چرا",
    "چگونه",
    "اشتباه",
    "راز",
    "ترفند",
    "۵",
    "۳",
    "قبل",
    "بعد",
    "بهترین",
  ];

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) score += 4;
  });

  return Math.min(99, score);
}

export default App;