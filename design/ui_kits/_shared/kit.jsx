// Shared shell + primitives for Student Eco UI kits.
// Loaded via <script type="text/babel" src="../_shared/kit.jsx"></script>.
// Components are exported to window so other kit files can use them.

const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────
// Icons — minimal lucide-style set we draw inline so kits run without CDN
// ─────────────────────────────────────────────────────────────────────────
const Icon = ({ d, children, className = "icon", ...p }) => (
  <svg viewBox="0 0 24 24" className={className} {...p}>
    {children || (typeof d === "string" ? <path d={d} /> : d)}
  </svg>
);
const I = {
  bookOpen: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  store:    <><path d="M3 7l1.5-3h15L21 7"/><path d="M3 7v13h18V7"/><path d="M3 7c0 1.7 1.3 3 3 3s3-1.3 3-3 1.3 3 3 3 3-1.3 3-3 1.3 3 3 3 3-1.3 3-3"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  users:    <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 19c0-2.5 2-4.5 4.5-4.5"/></>,
  search:   <><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>,
  plus:     <><path d="M12 5v14M5 12h14"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
  message:  <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z"/></>,
  check:    <path d="M20 6 9 17l-5-5"/>,
  x:        <><path d="M18 6 6 18"/><path d="M6 6l12 12"/></>,
  send:     <><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>,
  sun:      <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon:     <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
  bell:     <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  pin:      <><path d="M12 2v4M12 14v8M5 8h14l-2 6H7z"/></>,
  upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>,
  trash:    <><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
  filter:   <><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></>,
  chevron:  <polyline points="6 9 12 15 18 9"/>,
  arrowL:   <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
  mapPin:   <><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
  clock:    <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></>,
  tag:      <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="15" y1="17" y2="17"/></>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  check2:   <><polyline points="20 6 9 17 4 12"/></>,
  doubleCheck: <><polyline points="2 12 7 17 16 8"/><polyline points="9 12 14 17 22 7"/></>,
  more:     <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>,
  heart:    <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.7l-1.06-1.1a5.5 5.5 0 1 0-7.78 7.78L12 21.2l8.84-8.82a5.5 5.5 0 0 0 0-7.78z"/>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><polyline points="21 15 16 10 5 21"/></>,
};

// ─────────────────────────────────────────────────────────────────────────
// Theme: read/write to localStorage, toggle .dark on <html>
// ─────────────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("eco-theme") || "light"; } catch { return "light"; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("eco-theme", theme); } catch {}
  }, [theme]);
  return [theme, setTheme];
}

const ThemeToggle = ({ theme, onToggle }) => (
  <button className="theme-toggle" onClick={onToggle} aria-label="Tema değiştir">
    <Icon>{theme === "dark" ? I.sun : I.moon}</Icon>
    <span>{theme === "dark" ? "Açık" : "Koyu"}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────
// Avatar — initials, deterministic color
// ─────────────────────────────────────────────────────────────────────────
function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
function colorFor(name) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 6 + 1;
  return `av-${i}`;
}
const Avatar = ({ name, size = "md" }) => (
  <span className={`av av-${size} ${colorFor(name)}`}>{initials(name)}</span>
);

// ─────────────────────────────────────────────────────────────────────────
// Top nav with module switcher (drives kit-level page state)
// ─────────────────────────────────────────────────────────────────────────
const MODULES = [
  { key: "notes",    label: "Notlar",       href: "../notes/index.html",       icon: I.bookOpen },
  { key: "market",   label: "Pazaryeri",    href: "../marketplace/index.html", icon: I.store },
  { key: "events",   label: "Etkinlikler",  href: "../events/index.html",      icon: I.calendar },
  { key: "buddies",  label: "Arkadaş",      href: "../buddies/index.html",     icon: I.users },
];

const Navbar = ({ active, user = "Yusuf K." }) => {
  const [theme, setTheme] = useTheme();
  return (
    <header className="nav">
      <a className="nav-logo" href="../../README.md" onClick={(e) => e.preventDefault()}>
        eco<span className="dot"></span>
      </a>
      <nav className="nav-links">
        {MODULES.map(m => (
          <a key={m.key} href={m.href}
             className={"nav-link" + (active === m.key ? " active" : "")}>
            <Icon>{m.icon}</Icon>
            <span>{m.label}</span>
          </a>
        ))}
      </nav>
      <div className="nav-right">
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
        <button className="btn btn-ghost btn-icon" aria-label="Bildirimler">
          <Icon>{I.bell}</Icon>
        </button>
        <Avatar name={user} size="md" />
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Shared little bits
// ─────────────────────────────────────────────────────────────────────────
const Badge = ({ tone = "neutral", mono = false, children }) => (
  <span className={`badge bd-${tone}${mono ? " bd-mono" : ""}`}>{children}</span>
);

const FilterBar = ({ children }) => <div className="filterbar">{children}</div>;

const PageHead = ({ title, sub, action }) => (
  <div className="page-head">
    <div>
      <h1 className="page-title">{title}</h1>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon, title, body, action, mod = "primary" }) => (
  <div className="empty">
    <div className="plate"><Icon>{icon}</Icon></div>
    <h3>{title}</h3>
    <p>{body}</p>
    {action}
  </div>
);

// Expose to window for cross-file access
Object.assign(window, {
  Icon, I, useTheme, ThemeToggle, Avatar, Navbar, Badge,
  FilterBar, PageHead, EmptyState, MODULES,
});
