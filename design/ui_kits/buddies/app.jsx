// Buddies module — buddy list, buddy detail, edit own profile
const { useState: useStateBuddy } = React;

const STYLE_LABEL = { group: "Grup çalışması", solo: "Bireysel", mixed: "Karışık" };

const BuddyCard = ({ b, onOpen }) => (
  <div className="card hoverable card-pad" onClick={() => onOpen(b)}>
    <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
      <Avatar name={b.name} size="lg" />
      <div style={{ flex: 1 }}>
        <div className="between">
          <div>
            <div style={{ font: "600 16px var(--font-sans)", letterSpacing: "-0.01em" }}>{b.name}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{b.dept}</div>
          </div>
          <Badge tone="primary">{STYLE_LABEL[b.style]}</Badge>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {b.subjects.map(s => <Badge key={s} tone="neutral" mono>{s}</Badge>)}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
          {b.bio}
        </div>
      </div>
    </div>
  </div>
);

const BuddyList = ({ buddies, onOpen, onEditMe }) => (
  <>
    <PageHead
      title="Çalışma arkadaşı"
      sub="Aynı dersi alan birini bul, dışarıdan iletişime geç."
      action={<button className="btn btn-primary" onClick={onEditMe}><Icon>{I.user}</Icon>Profilimi düzenle</button>}
    />
    <FilterBar>
      <div className="with-icon">
        <Icon>{I.search}</Icon>
        <input className="input" placeholder="Ders, isim veya konu ara…" />
      </div>
      <select className="select"><option>Tüm dersler</option><option>CS301</option><option>MATH210</option><option>EE204</option></select>
      <select className="select"><option>Tüm stiller</option><option>Grup çalışması</option><option>Bireysel</option><option>Karışık</option></select>
      <button className="btn btn-outline"><Icon>{I.filter}</Icon>Filtre</button>
    </FilterBar>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
      {buddies.map(b => <BuddyCard key={b.id} b={b} onOpen={onOpen} />)}
    </div>
  </>
);

const BuddyDetail = ({ b, onBack }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Listeye dön
    </button>
    <div className="card card-pad" style={{ maxWidth: 720 }}>
      <div className="row" style={{ alignItems: "flex-start", gap: 20 }}>
        <Avatar name={b.name} size="xl" />
        <div style={{ flex: 1 }}>
          <h2 style={{ font: "700 24px var(--font-sans)", letterSpacing: "-0.02em", margin: 0 }}>{b.name}</h2>
          <div className="muted" style={{ marginTop: 4 }}>{b.dept} · {b.university}</div>
          <Badge tone="primary" style={{ marginTop: 10 }}>{STYLE_LABEL[b.style]}</Badge>
        </div>
      </div>
      <hr className="divider" style={{ margin: "20px 0" }} />
      <div className="t-label" style={{ marginBottom: 8 }}>Hakkında</div>
      <p style={{ lineHeight: 1.6, margin: 0 }}>{b.bio}</p>
      <hr className="divider" style={{ margin: "20px 0" }} />
      <div className="t-label" style={{ marginBottom: 8 }}>Çalıştığı dersler</div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
        {b.subjects.map(s => <Badge key={s} tone="info" mono>{s}</Badge>)}
      </div>
      <hr className="divider" style={{ margin: "20px 0" }} />
      <div className="t-label" style={{ marginBottom: 8 }}>Müsaitlik</div>
      <div style={{ fontSize: 14 }}>{b.availability}</div>
      <hr className="divider" style={{ margin: "20px 0" }} />
      <div style={{
        background: "hsl(var(--primary-soft))", padding: 16,
        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div className="t-label" style={{ marginBottom: 4 }}>İletişim</div>
          <div className="mono" style={{ font: "500 15px var(--font-mono)", color: "hsl(var(--primary-strong))" }}>{b.contact}</div>
        </div>
        <button className="btn btn-primary"><Icon>{I.message}</Icon>İletişime geç</button>
      </div>
    </div>
  </>
);

const EditMe = ({ me, onCancel, onDone }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Vazgeç
    </button>
    <PageHead title="Profilim" sub="Diğer öğrenciler seni bu bilgilerle görür." />
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="row" style={{ marginBottom: 20 }}>
        <Avatar name={me.name} size="xl" />
        <div>
          <div style={{ fontWeight: 600 }}>{me.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{me.dept}</div>
        </div>
      </div>
      <div className="stack" style={{ gap: 16 }}>
        <div className="field">
          <label className="label">Hakkında</label>
          <textarea className="textarea" defaultValue={me.bio}></textarea>
        </div>
        <div className="field">
          <label className="label">Dersler</label>
          <input className="input mono" defaultValue={me.subjects.join(", ")} />
          <div className="help">Virgülle ayır. Örn: CS301, MATH210</div>
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Çalışma stili</label>
            <select className="select" defaultValue={me.style}>
              <option value="group">Grup çalışması</option>
              <option value="solo">Bireysel</option>
              <option value="mixed">Karışık</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Müsaitlik</label>
            <input className="input" defaultValue={me.availability} />
          </div>
        </div>
        <div className="field">
          <label className="label">İletişim</label>
          <input className="input mono" defaultValue={me.contact} />
          <div className="help">E-posta, Telegram, Instagram — paylaşmak istediğini yaz.</div>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: "hsl(var(--destructive))" }}>
            <Icon>{I.trash}</Icon>Profili sil
          </button>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" onClick={onDone}>Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  </>
);

const SAMPLE_BUDDIES = [
  { id: 1, name: "Alice Smith",  dept: "Bilgisayar Müh.", university: "State Uni", style: "group", subjects: ["CS301","CS210"], bio: "Bilgisayar Mühendisliği 3. sınıf. Vize döneminde odaklanmış kısa seanslar tercih ediyorum, geçmiş yıl sorularını birlikte çözmeyi seviyorum.", availability: "Hafta içi akşamları", contact: "alice@uni.edu.tr" },
  { id: 2, name: "Carol Lee",    dept: "Matematik",       university: "State Uni", style: "mixed", subjects: ["MATH210","MATH310"], bio: "Matematik bölümü, sınav hazırlığı arkadaşı. Genelde kütüphanede çalışıyorum, kısa molalarla.", availability: "Hafta sonları", contact: "@carol_tg" },
  { id: 3, name: "Mert Demir",   dept: "Elektrik-Elektronik", university: "State Uni", style: "solo", subjects: ["EE204","PHYS101"], bio: "Sessiz çalışmayı seviyorum ama haftada bir takılan yerlerde fikir alışverişi iyi olur.", availability: "Pazartesi/Çarşamba 19:00 sonrası", contact: "mert.d@uni.edu.tr" },
  { id: 4, name: "Selin Yılmaz", dept: "Endüstri Müh.", university: "State Uni", style: "group", subjects: ["IE220","STAT201"], bio: "Grup çalışmasında verimli oluyorum, karşılıklı anlatma yöntemini deniyorum.", availability: "Hafta içi öğleden sonra", contact: "selin.y@uni.edu.tr" },
  { id: 5, name: "Bob Jones",    dept: "Bilgisayar Müh.", university: "State Uni", style: "mixed", subjects: ["CS210","CS401"], bio: "Hem kendim çalışıyorum hem ara sıra grup. Quiz öncesi ekibe gelmeyi seviyorum.", availability: "Esnek", contact: "@bobjones" },
  { id: 6, name: "Yusuf Kaya",   dept: "Makine Müh.", university: "State Uni", style: "solo", subjects: ["ME201","MATH102"], bio: "Sessiz ortam, uzun seanslar. Pomodoro kullanıyorum.", availability: "Sabah 08:00–12:00", contact: "yusuf@uni.edu.tr" },
];

const ME = { name: "Yusuf Kaya", dept: "Makine Müh.", style: "solo", subjects: ["ME201","MATH102"], bio: "Sessiz ortam, uzun seanslar. Pomodoro kullanıyorum.", availability: "Sabah 08:00–12:00", contact: "yusuf@uni.edu.tr" };

function BuddiesApp() {
  const [view, setView] = useStateBuddy({ name: "list" });
  return (
    <div className="app">
      <Navbar active="buddies" />
      <main className="page">
        {view.name === "list" && (
          <BuddyList buddies={SAMPLE_BUDDIES}
            onOpen={(b) => setView({ name: "detail", b })}
            onEditMe={() => setView({ name: "edit" })} />
        )}
        {view.name === "detail" && (
          <BuddyDetail b={view.b} onBack={() => setView({ name: "list" })} />
        )}
        {view.name === "edit" && (
          <EditMe me={ME} onCancel={() => setView({ name: "list" })} onDone={() => setView({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<BuddiesApp />);
