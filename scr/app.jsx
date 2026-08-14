import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { BarChart3, Bot, CheckCircle2, FileText, LayoutDashboard, LogOut, Plus, Settings, Sparkles, TrendingUp, Users, WandSparkles } from 'lucide-react'

const demoStats = [
  { label: 'Content ideas', value: '24', change: '+18%', icon: Sparkles },
  { label: 'Published', value: '12', change: '+25%', icon: FileText },
  { label: 'Engagement', value: '8.4K', change: '+31%', icon: TrendingUp },
  { label: 'Audience', value: '3.2K', change: '+12%', icon: Users },
]

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [active, setActive] = useState('Dashboard')
  const [ideas, setIdeas] = useState([
    { title: '3 hooks that stop the scroll', platform: 'Instagram', score: 92 },
    { title: 'The 30-second growth audit', platform: 'TikTok', score: 88 },
    { title: 'Before/after: turn one idea into ten', platform: 'LinkedIn', score: 84 },
  ])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn() {
    if (!email) return setMessage('Enter your email first.')
    if (!supabase) return setMessage('Demo mode: Supabase is not configured yet.')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setMessage(error ? error.message : 'Magic link sent. Check your email.')
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
  }

  function addIdea() {
    setIdeas((items) => [{ title: 'A fresh ViralLab campaign concept', platform: 'Multi-platform', score: 90 }, ...items])
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Bot size={22}/></div><span>ViralLab</span></div>
      <nav>{['Dashboard','Ideas','Content','Analytics','Settings'].map((item) => <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}>{item === 'Dashboard' ? <LayoutDashboard size={18}/> : item === 'Ideas' ? <WandSparkles size={18}/> : item === 'Content' ? <FileText size={18}/> : item === 'Analytics' ? <BarChart3 size={18}/> : <Settings size={18}/>}<span>{item}</span></button>)}</nav>
      <div className="sidebar-bottom">{session ? <button className="nav-item" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button> : <div className="mini-status"><CheckCircle2 size={16}/><span>{isSupabaseConfigured ? 'Supabase connected' : 'Demo mode'}</span></div>}</div>
    </aside>

    <main className="main">
      <header className="topbar"><div><p className="eyebrow">AI growth workspace</p><h1>{active}</h1></div><div className="top-actions"><span className="status-dot"></span><span>{session?.user?.email || 'Guest'}</span></div></header>

      {active === 'Dashboard' && <>
        <section className="hero"><div><span className="pill"><Sparkles size={14}/> AI-powered</span><h2>Turn ideas into <span>viral content.</span></h2><p>Find stronger hooks, create content faster, and measure what actually works.</p><button className="primary" onClick={addIdea}><Plus size={18}/> Generate idea</button></div><div className="hero-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><Bot size={74}/></div></section>
        <section className="stats">{demoStats.map(({label,value,change,icon:Icon}) => <div className="stat-card" key={label}><div className="stat-icon"><Icon size={19}/></div><p>{label}</p><strong>{value}</strong><small>{change} this month</small></div>)}</section>
        <section className="grid-two"><div className="panel"><div className="panel-head"><div><h3>Top ideas</h3><p>Highest predicted performance</p></div><button className="ghost" onClick={() => setActive('Ideas')}>View all</button></div>{ideas.map((idea) => <div className="idea" key={idea.title}><div className="idea-main"><div className="idea-icon"><Sparkles size={16}/></div><div><strong>{idea.title}</strong><span>{idea.platform}</span></div></div><div className="score"><b>{idea.score}</b><span>viral score</span></div></div>)}</div><div className="panel"><div className="panel-head"><div><h3>Quick start</h3><p>Build your next campaign</p></div></div><div className="quick-list"><button onClick={() => setActive('Ideas')}><WandSparkles/><span><b>Generate ideas</b><small>Get hooks and concepts</small></span></button><button onClick={() => setActive('Content')}><FileText/><span><b>Create content</b><small>Turn an idea into a post</small></span></button><button onClick={() => setActive('Analytics')}><BarChart3/><span><b>Analyze performance</b><small>See what is working</small></span></button></div></div></section>
      </>}

      {active !== 'Dashboard' && <section className="workspace"><div className="panel large"><div className="panel-head"><div><h3>{active}</h3><p>This module is ready in the ViralLab foundation.</p></div><span className="pill">Foundation ready</span></div>{active === 'Settings' ? <div className="login-card"><h4>Connect Supabase</h4><p>Authentication and database are wired to the environment variables. Add the project URL and publishable key to enable production auth.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code>{!session && <div className="auth-row"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><button className="primary" onClick={signIn}>Send magic link</button></div>}<p className="message">{message}</p></div> : <div className="empty-state"><div className="empty-icon"><Bot size={30}/></div><h4>{active} module</h4><p>The UI shell is live. The next implementation layer can connect this module to Supabase tables and AI services.</p><button className="primary" onClick={addIdea}><Plus size={18}/> Add demo item</button></div>}</div></section>}
    </main>
  </div>
}

export default App
