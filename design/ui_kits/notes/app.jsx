// Notes module — list, detail, upload form
const { useState: useStateNotes } = React;

// ── Note card (used in list) ─────────────────────────────────────────────
const NoteCard = ({ note, onOpen }) => (
  <div className="card hoverable card-pad" onClick={() => onOpen(note)}>
    <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
      <div className="row" style={{ gap: 14 }}>
        <div className="mod-plate mod-notes"><Icon>{I.fileText}</Icon></div>
        <div>
          <div style={{ font: "600 16px var(--font-sans)", letterSpacing: "-0.01em" }}>{note.title}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            <Badge tone="info" mono>{note.course}</Badge>
            <span style={{ margin: "0 6px" }}>·</span>
            {note.semester} · {note.author}
          </div>
        </div>
      </div>
      <div className="muted mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{note.size}</div>
    </div>
    <div className="muted" style={{ fontSize: 13, marginTop: 12, display: "flex", gap: 16 }}>
      <span><Icon style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 4 }}>{I.download}</Icon>{note.downloads} indirme</span>
      <span>{note.date}</span>
    </div>
  </div>
);

// ── Notes list page ─────────────────────────────────────────────────────
const NotesList = ({ notes, onOpen, onNew }) => (
  <>
    <PageHead
      title="Notlar"
      sub="Ders notlarını ve geçmiş sınavları paylaş."
      action={<button className="btn btn-primary" onClick={onNew}><Icon>{I.plus}</Icon>Not yükle</button>}
    />
    <FilterBar>
      <div className="with-icon">
        <Icon>{I.search}</Icon>
        <input className="input" placeholder="Başlık veya ders ara…" />
      </div>
      <select className="select"><option>Tüm dersler</option><option>CS301</option><option>MATH210</option><option>EE204</option></select>
      <select className="select"><option>Tüm dönemler</option><option>Güz 2025</option><option>Bahar 2025</option><option>Güz 2024</option></select>
      <button className="btn btn-outline"><Icon>{I.filter}</Icon>Filtre</button>
    </FilterBar>
    <div className="stack">
      {notes.map(n => <NoteCard key={n.id} note={n} onOpen={onOpen} />)}
    </div>
  </>
);

// ── Note detail page ────────────────────────────────────────────────────
const NoteDetail = ({ note, onBack }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Notlara dön
    </button>
    <div className="card card-pad">
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="mod-plate mod-notes" style={{ width: 56, height: 56, borderRadius: 12 }}>
            <Icon style={{ width: 28, height: 28 }}>{I.fileText}</Icon>
          </div>
          <div>
            <h2 style={{ font: "700 24px var(--font-sans)", letterSpacing: "-0.02em", margin: 0 }}>{note.title}</h2>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <Badge tone="info" mono>{note.course}</Badge>
              <Badge tone="neutral">{note.semester}</Badge>
              <span className="muted" style={{ fontSize: 13 }}>· {note.author}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-primary"><Icon>{I.download}</Icon>PDF indir</button>
      </div>
      <hr className="divider" style={{ margin: "20px 0" }} />
      <p style={{ lineHeight: 1.6, margin: 0 }}>
        Final öncesi tüm haftaları kapsayan özet. Algoritma karmaşıklığı, temel veri yapıları,
        dinamik programlama örnekleri ve geçmiş sınavda çıkan tipik sorular tek dosyada toplandı.
        Notlardaki örnekler ders kitabıyla uyumludur, slaytlardan daha kısa anlatılmıştır.
      </p>
      <div className="muted mono" style={{ fontSize: 12, marginTop: 16 }}>
        {note.size} · {note.downloads} indirme · 14 Mart 2026 tarihinde yüklendi
      </div>
    </div>
  </>
);

// ── Upload form ─────────────────────────────────────────────────────────
const NoteUpload = ({ onCancel, onDone }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Vazgeç
    </button>
    <PageHead title="Yeni not" sub="PDF dosyanı yükle, sınıfla paylaş." />
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="field">
          <label className="label">Başlık</label>
          <input className="input" placeholder="Algoritmalar — vize özeti" />
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Kurs kodu</label>
            <input className="input mono" placeholder="CS301" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Dönem</label>
            <select className="select"><option>Güz 2025</option><option>Bahar 2025</option></select>
          </div>
        </div>
        <div className="field">
          <label className="label">Açıklama</label>
          <textarea className="textarea" placeholder="Notlarının kısa bir özetini yaz."></textarea>
        </div>
        <div className="field">
          <label className="label">Dosya</label>
          <div style={{
            border: "1px dashed hsl(var(--border))", borderRadius: 8, padding: 24,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "hsl(var(--muted) / 0.4)"
          }}>
            <Icon style={{ width: 24, height: 24, color: "hsl(var(--muted-foreground))" }}>{I.upload}</Icon>
            <div style={{ fontWeight: 500, fontSize: 14 }}>PDF dosyanı buraya bırak</div>
            <div className="help">veya <a style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>dosya seç</a> · en fazla 10 MB</div>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Vazgeç</button>
          <button className="btn btn-primary" onClick={onDone}><Icon>{I.upload}</Icon>Yükle</button>
        </div>
      </div>
    </div>
  </>
);

// ── App ─────────────────────────────────────────────────────────────────
const SAMPLE_NOTES = [
  { id: 1, title: "Algoritmalar — vize özeti", course: "CS301", semester: "Güz 2025", author: "Ayşe K.", size: "512 KB", downloads: 142, date: "14 Mart 2026" },
  { id: 2, title: "Doğrusal cebir formül kağıdı", course: "MATH210", semester: "Bahar 2025", author: "Carol L.", size: "100 KB", downloads: 98, date: "2 Mart 2026" },
  { id: 3, title: "Sayısal elektronik final notları", course: "EE204", semester: "Güz 2025", author: "Mert D.", size: "1.2 MB", downloads: 64, date: "28 Şubat 2026" },
  { id: 4, title: "Kalkülüs II vize çözümleri", course: "MATH102", semester: "Bahar 2025", author: "Selin Y.", size: "780 KB", downloads: 211, date: "20 Şubat 2026" },
  { id: 5, title: "Veri yapıları — quiz arşivi", course: "CS210", semester: "Güz 2024", author: "Bob J.", size: "340 KB", downloads: 187, date: "11 Şubat 2026" },
];

function NotesApp() {
  const [view, setView] = useStateNotes({ name: "list" });
  return (
    <div className="app">
      <Navbar active="notes" />
      <main className="page">
        {view.name === "list" && (
          <NotesList notes={SAMPLE_NOTES}
            onOpen={(n) => setView({ name: "detail", note: n })}
            onNew={() => setView({ name: "new" })} />
        )}
        {view.name === "detail" && (
          <NoteDetail note={view.note} onBack={() => setView({ name: "list" })} />
        )}
        {view.name === "new" && (
          <NoteUpload onCancel={() => setView({ name: "list" })} onDone={() => setView({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<NotesApp />);
