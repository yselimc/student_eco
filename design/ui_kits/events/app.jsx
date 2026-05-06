// Events module — list, detail with RSVP, new event form
const { useState: useStateEvents } = React;

const fmtDate = (d) => {
  const months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${d.day} ${months[d.month-1]} ${d.year}`;
};

const CategoryBadge = ({ c }) => {
  const map = {
    "academic": { tone: "info", label: "Akademik" },
    "social": { tone: "primary", label: "Sosyal" },
    "sports": { tone: "success", label: "Spor" },
    "career": { tone: "warn", label: "Kariyer" },
  };
  const m = map[c] || { tone: "neutral", label: c };
  return <Badge tone={m.tone}>{m.label}</Badge>;
};

const DateBlock = ({ d, mo }) => (
  <div style={{
    width: 64, height: 72, borderRadius: 8, border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", flex: "none"
  }}>
    <div style={{ font: "600 11px var(--font-sans)", color: "hsl(var(--primary-strong))", textTransform: "uppercase", letterSpacing: "0.05em" }}>{mo}</div>
    <div style={{ font: "700 26px var(--font-sans)", letterSpacing: "-0.02em" }}>{d}</div>
  </div>
);

const EventRow = ({ ev, onOpen, going, onRsvp }) => {
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return (
    <div className="card hoverable card-pad" onClick={() => onOpen(ev)}>
      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <DateBlock d={ev.date.day} mo={months[ev.date.month-1]} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <CategoryBadge c={ev.category} />
            <span className="muted mono" style={{ fontSize: 12 }}>
              {ev.time} · {ev.location}
            </span>
          </div>
          <div style={{ font: "600 17px var(--font-sans)", letterSpacing: "-0.01em" }}>{ev.title}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            <Icon style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 4 }}>{I.users}</Icon>
            {ev.attendees} katılımcı · {ev.organizer}
          </div>
        </div>
        <button
          className={going ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}
          onClick={(e) => { e.stopPropagation(); onRsvp(ev); }}
        >
          {going ? <><Icon>{I.check}</Icon>Katılıyorum</> : "Katıl"}
        </button>
      </div>
    </div>
  );
};

const EventsList = ({ events, going, onOpen, onRsvp, onNew }) => (
  <>
    <PageHead
      title="Etkinlikler"
      sub="Çalışma grupları, sosyal buluşmalar, kariyer söyleşileri."
      action={<button className="btn btn-primary" onClick={onNew}><Icon>{I.plus}</Icon>Etkinlik oluştur</button>}
    />
    <FilterBar>
      <div className="with-icon">
        <Icon>{I.search}</Icon>
        <input className="input" placeholder="Etkinlik ara…" />
      </div>
      <select className="select"><option>Tüm kategoriler</option><option>Akademik</option><option>Sosyal</option><option>Spor</option><option>Kariyer</option></select>
      <select className="select"><option>Bu hafta</option><option>Bu ay</option><option>Hepsi</option></select>
      <button className="btn btn-outline"><Icon>{I.filter}</Icon>Filtre</button>
    </FilterBar>
    <div className="stack">
      {events.map(e => (
        <EventRow key={e.id} ev={e} going={going.has(e.id)} onOpen={onOpen} onRsvp={onRsvp} />
      ))}
    </div>
  </>
);

const EventDetail = ({ ev, going, onBack, onRsvp }) => {
  const isGoing = going.has(ev.id);
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <Icon>{I.arrowL}</Icon>Etkinliklere dön
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div className="card card-pad">
          <CategoryBadge c={ev.category} />
          <h2 style={{ font: "700 28px var(--font-sans)", letterSpacing: "-0.02em", margin: "10px 0 16px" }}>{ev.title}</h2>
          <div className="stack" style={{ gap: 10, fontSize: 14 }}>
            <div className="row" style={{ gap: 8 }}>
              <Icon style={{ color: "hsl(var(--muted-foreground))" }}>{I.calendar}</Icon>
              <span>{fmtDate(ev.date)}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Icon style={{ color: "hsl(var(--muted-foreground))" }}>{I.clock}</Icon>
              <span>{ev.time}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Icon style={{ color: "hsl(var(--muted-foreground))" }}>{I.mapPin}</Icon>
              <span>{ev.location}</span>
            </div>
          </div>
          <hr className="divider" style={{ margin: "20px 0" }} />
          <p style={{ lineHeight: 1.6, margin: 0 }}>
            Final öncesi son tekrar buluşması. Geçmiş yıl sorularını birlikte çözeceğiz,
            takılan yerlerde grupça tartışacağız. Defterini, kalemini ve geçmiş yıl
            sorularını getirmen yeterli — kahveyi organizatör ısmarlıyor.
          </p>
          <div className="row" style={{ gap: 8, marginTop: 24 }}>
            <button
              className={isGoing ? "btn btn-outline" : "btn btn-primary"}
              onClick={() => onRsvp(ev)}
            >
              {isGoing ? <><Icon>{I.check}</Icon>Katılıyorum</> : "Katıl"}
            </button>
            <button className="btn btn-ghost"><Icon>{I.heart}</Icon>Kaydet</button>
          </div>
        </div>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 12 }}>
            <div style={{ font: "600 14px var(--font-sans)" }}>Katılımcılar</div>
            <Badge tone="neutral">{ev.attendees + (isGoing ? 1 : 0)}</Badge>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {["Alice S.","Bob J.","Carol L.","Mert D.","Selin Y."].map(n => (
              <div key={n} className="row" style={{ gap: 10 }}>
                <Avatar name={n} size="sm" />
                <span style={{ fontSize: 14 }}>{n}</span>
              </div>
            ))}
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>+ {ev.attendees - 5} kişi daha</div>
          </div>
          <hr className="divider" style={{ margin: "16px 0" }} />
          <div style={{ font: "600 14px var(--font-sans)", marginBottom: 8 }}>Organizatör</div>
          <div className="row">
            <Avatar name={ev.organizer} size="md" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.organizer}</div>
              <div className="muted" style={{ fontSize: 12 }}>Matematik bölümü</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const NewEvent = ({ onCancel, onDone }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Vazgeç
    </button>
    <PageHead title="Yeni etkinlik" sub="Tarih, yer ve kategoriyi seç." />
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="field">
          <label className="label">Başlık</label>
          <input className="input" placeholder="Kalkülüs II final çalışma grubu" />
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Kategori</label>
            <select className="select"><option>Akademik</option><option>Sosyal</option><option>Spor</option><option>Kariyer</option></select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Konum</label>
            <input className="input" placeholder="Kütüphane, 204 numaralı oda" />
          </div>
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Başlangıç</label>
            <input className="input mono" defaultValue="10.05.2026 18:00" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Bitiş</label>
            <input className="input mono" defaultValue="10.05.2026 20:00" />
          </div>
        </div>
        <div className="field">
          <label className="label">Açıklama</label>
          <textarea className="textarea" placeholder="Ne çalışacaksınız, ne getirilmeli…"></textarea>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Vazgeç</button>
          <button className="btn btn-primary" onClick={onDone}>Etkinliği yayınla</button>
        </div>
      </div>
    </div>
  </>
);

const SAMPLE_EVENTS = [
  { id: 1, title: "Kalkülüs II final çalışma grubu", category: "academic", date: { day: 10, month: 5, year: 2026 }, time: "18:00 – 20:00", location: "Kütüphane 204", attendees: 14, organizer: "Carol L." },
  { id: 2, title: "Bahar konseri — kampüs amfi", category: "social", date: { day: 14, month: 5, year: 2026 }, time: "20:00", location: "Açık hava amfi", attendees: 87, organizer: "Öğrenci Konseyi" },
  { id: 3, title: "Yapay zekâ söyleşisi", category: "career", date: { day: 16, month: 5, year: 2026 }, time: "14:00 – 15:30", location: "Mühendislik A1", attendees: 42, organizer: "IEEE Kulübü" },
  { id: 4, title: "Sabah koşusu — kampüs turu", category: "sports", date: { day: 18, month: 5, year: 2026 }, time: "07:00", location: "Spor sahası", attendees: 23, organizer: "Mert D." },
  { id: 5, title: "Algoritmalar quiz hazırlığı", category: "academic", date: { day: 20, month: 5, year: 2026 }, time: "16:00 – 18:00", location: "Müh. fakültesi 312", attendees: 9, organizer: "Ayşe K." },
];

function EventsApp() {
  const [view, setView] = useStateEvents({ name: "list" });
  const [going, setGoing] = useStateEvents(new Set([2]));
  const toggleRsvp = (ev) => {
    const next = new Set(going);
    next.has(ev.id) ? next.delete(ev.id) : next.add(ev.id);
    setGoing(next);
  };
  return (
    <div className="app">
      <Navbar active="events" />
      <main className="page">
        {view.name === "list" && (
          <EventsList events={SAMPLE_EVENTS} going={going}
            onOpen={(e) => setView({ name: "detail", ev: e })}
            onRsvp={toggleRsvp}
            onNew={() => setView({ name: "new" })} />
        )}
        {view.name === "detail" && (
          <EventDetail ev={view.ev} going={going}
            onBack={() => setView({ name: "list" })}
            onRsvp={toggleRsvp} />
        )}
        {view.name === "new" && (
          <NewEvent onCancel={() => setView({ name: "list" })} onDone={() => setView({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<EventsApp />);
