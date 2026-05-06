// Marketplace module — listing grid, listing detail, message thread, new listing
const { useState: useStateMarket } = React;

// ── Listing card ────────────────────────────────────────────────────────
const ListingCard = ({ listing, onOpen }) => (
  <div className="card hoverable" onClick={() => onOpen(listing)} style={{ overflow: "hidden" }}>
    <div style={{
      aspectRatio: "4/3", background: listing.bg || "#F5F3FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderBottom: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))",
      position: "relative"
    }}>
      <Icon style={{ width: 48, height: 48, opacity: 0.4 }}>{I.image}</Icon>
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
        {listing.status === "sold"
          ? <Badge tone="dest">Satıldı</Badge>
          : <Badge tone="success">Müsait</Badge>}
      </div>
    </div>
    <div style={{ padding: 14 }}>
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div style={{ font: "600 15px var(--font-sans)", letterSpacing: "-0.01em" }}>{listing.title}</div>
        <div className="mono" style={{ font: "700 16px var(--font-mono)", color: "hsl(var(--primary-strong))", whiteSpace: "nowrap" }}>
          ₺{listing.price.toFixed(2).replace(".", ",")}
        </div>
      </div>
      <div className="row" style={{ gap: 6, marginTop: 8 }}>
        <Badge tone="neutral">{listing.category}</Badge>
        <span className="muted" style={{ fontSize: 12 }}>· {listing.seller}</span>
      </div>
    </div>
  </div>
);

// ── Listing grid ────────────────────────────────────────────────────────
const ListingGrid = ({ listings, onOpen, onNew }) => (
  <>
    <PageHead
      title="Pazaryeri"
      sub="Kitap, hesap makinesi, ne ararsan."
      action={<button className="btn btn-primary" onClick={onNew}><Icon>{I.plus}</Icon>İlan ver</button>}
    />
    <FilterBar>
      <div className="with-icon">
        <Icon>{I.search}</Icon>
        <input className="input" placeholder="Ürün ara…" />
      </div>
      <select className="select"><option>Tüm kategoriler</option><option>Ders kitabı</option><option>Elektronik</option><option>Mobilya</option><option>Diğer</option></select>
      <select className="select"><option>En yeni</option><option>Fiyat artan</option><option>Fiyat azalan</option></select>
      <button className="btn btn-outline"><Icon>{I.filter}</Icon>Filtre</button>
    </FilterBar>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
      {listings.map(l => <ListingCard key={l.id} listing={l} onOpen={onOpen} />)}
    </div>
  </>
);

// ── Listing detail ──────────────────────────────────────────────────────
const ListingDetail = ({ listing, onBack, onMessage }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Pazaryerine dön
    </button>
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          aspectRatio: "4/3", background: listing.bg || "#F5F3FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "hsl(var(--muted-foreground))"
        }}>
          <Icon style={{ width: 80, height: 80, opacity: 0.4 }}>{I.image}</Icon>
        </div>
        <div className="row" style={{ padding: 12, gap: 8, justifyContent: "center" }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: 56, height: 56, borderRadius: 6,
              background: "hsl(var(--muted))",
              border: i === 1 ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))"
            }} />
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="card card-pad">
          <div className="row" style={{ gap: 6, marginBottom: 8 }}>
            <Badge tone="neutral">{listing.category}</Badge>
            {listing.status === "sold"
              ? <Badge tone="dest">Satıldı</Badge>
              : <Badge tone="success">Müsait</Badge>}
          </div>
          <h2 style={{ font: "700 24px var(--font-sans)", letterSpacing: "-0.02em", margin: "0 0 8px" }}>{listing.title}</h2>
          <div className="mono" style={{ font: "800 32px var(--font-mono)", color: "hsl(var(--primary-strong))", marginBottom: 16 }}>
            ₺{listing.price.toFixed(2).replace(".", ",")}
          </div>
          <p style={{ lineHeight: 1.6, margin: 0, color: "hsl(var(--foreground))" }}>
            Az kullanılmış, temiz durumda. İçinde yazı veya çizim yok. Vize döneminde
            kütüphanede teslim edebilirim. Pazarlık makul.
          </p>
          <hr className="divider" style={{ margin: "16px 0" }} />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <Avatar name={listing.seller} size="md" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{listing.seller}</div>
                <div className="muted" style={{ fontSize: 12 }}>Bilgisayar Mühendisliği</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => onMessage(listing)}>
              <Icon>{I.message}</Icon>Satıcıya mesaj
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

// ── Message thread ──────────────────────────────────────────────────────
const Bubble = ({ mine, body, time, read }) => (
  <div style={{
    display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 6
  }}>
    <div style={{
      maxWidth: "70%", padding: "8px 12px", borderRadius: 12,
      borderBottomRightRadius: mine ? 4 : 12, borderBottomLeftRadius: mine ? 12 : 4,
      background: mine ? "hsl(var(--primary))" : "hsl(var(--muted))",
      color: mine ? "#fff" : "hsl(var(--foreground))",
      fontSize: 14, lineHeight: 1.4
    }}>
      {body}
      <div style={{
        fontSize: 10, marginTop: 4, opacity: 0.7,
        display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end"
      }}>
        {time}
        {mine && <Icon style={{ width: 12, height: 12, color: read ? "#86EFAC" : "currentColor" }}>
          {read ? I.doubleCheck : I.check2}
        </Icon>}
      </div>
    </div>
  </div>
);

const MessageThread = ({ listing, onBack }) => {
  const [msgs, setMsgs] = useStateMarket([
    { id: 1, mine: false, body: "Selam, kitap hâlâ var mı?", time: "14:02", read: true },
    { id: 2, mine: true, body: "Evet, müsait. Ne zaman görüşelim?", time: "14:03", read: true },
    { id: 3, mine: false, body: "Yarın kütüphanede 16:00'da olur mu?", time: "14:05", read: true },
    { id: 4, mine: true, body: "Olur, A blok girişinde buluşalım.", time: "14:06", read: false },
  ]);
  const [draft, setDraft] = useStateMarket("");
  const send = () => {
    if (!draft.trim()) return;
    setMsgs([...msgs, { id: Date.now(), mine: true, body: draft, time: "şimdi", read: false }]);
    setDraft("");
  };
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <Icon>{I.arrowL}</Icon>İlana dön
      </button>
      <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <Avatar name={listing.seller} size="md" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{listing.seller}</div>
                <div className="muted" style={{ fontSize: 12 }}>{listing.title}</div>
              </div>
            </div>
            <Badge tone="primary">{listing.category}</Badge>
          </div>
        </div>
        <div style={{ padding: 16, height: 360, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {msgs.map(m => <Bubble key={m.id} {...m} />)}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid hsl(var(--border))", display: "flex", gap: 8 }}>
          <input className="input" placeholder="Mesaj yaz…" value={draft}
                 onChange={e => setDraft(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && send()} />
          <button className="btn btn-primary btn-icon" onClick={send} aria-label="Gönder">
            <Icon>{I.send}</Icon>
          </button>
        </div>
      </div>
    </>
  );
};

// ── New listing form ────────────────────────────────────────────────────
const NewListing = ({ onCancel, onDone }) => (
  <>
    <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 16 }}>
      <Icon>{I.arrowL}</Icon>Vazgeç
    </button>
    <PageHead title="Yeni ilan" sub="Görseller ekle, fiyatını yaz, yayınla." />
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="field">
          <label className="label">Başlık</label>
          <input className="input" placeholder="CLRS — Algorithms 4. baskı" />
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Kategori</label>
            <select className="select"><option>Ders kitabı</option><option>Elektronik</option><option>Mobilya</option><option>Diğer</option></select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Fiyat</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: 10, fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>₺</span>
              <input className="input mono" style={{ paddingLeft: 28 }} placeholder="35,00" />
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label">Açıklama</label>
          <textarea className="textarea" placeholder="Ürünün durumu, kullanım süresi, teslim şekli…"></textarea>
        </div>
        <div className="field">
          <label className="label">Fotoğraflar</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                aspectRatio: "1", border: "1px dashed hsl(var(--border))", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.4)"
              }}>
                <Icon>{i === 0 ? I.upload : I.plus}</Icon>
              </div>
            ))}
          </div>
          <div className="help">En fazla 8 fotoğraf · her biri en fazla 5 MB</div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Vazgeç</button>
          <button className="btn btn-primary" onClick={onDone}>İlanı yayınla</button>
        </div>
      </div>
    </div>
  </>
);

// ── App ─────────────────────────────────────────────────────────────────
const SAMPLE_LISTINGS = [
  { id: 1, title: "CLRS — Algorithms 4. baskı", price: 350, category: "Ders kitabı", status: "available", seller: "Bob J.", bg: "#FEF3C7" },
  { id: 2, title: "TI-84 hesap makinesi",        price: 500, category: "Elektronik",  status: "available", seller: "Alice S.", bg: "#DBEAFE" },
  { id: 3, title: "İngilizce sözlük (Oxford)",  price: 80,  category: "Ders kitabı", status: "available", seller: "Mert D.", bg: "#FCE7F3" },
  { id: 4, title: "Çalışma masası",              price: 750, category: "Mobilya",     status: "sold",      seller: "Selin Y.", bg: "#DCFCE7" },
  { id: 5, title: "Lineer cebir kitabı",         price: 120, category: "Ders kitabı", status: "available", seller: "Carol L.", bg: "#FFEDD5" },
  { id: 6, title: "Kulaklık (Sony WH-1000XM4)", price: 2200, category: "Elektronik",  status: "available", seller: "Yusuf K.", bg: "#E0E7FF" },
  { id: 7, title: "Kitaplık (3 raflı)",          price: 400, category: "Mobilya",     status: "available", seller: "Ayşe K.", bg: "#FEE2E2" },
  { id: 8, title: "Termodinamik kitabı",         price: 90,  category: "Ders kitabı", status: "sold",      seller: "Mert D.", bg: "#F5F3FF" },
];

function MarketApp() {
  const [view, setView] = useStateMarket({ name: "list" });
  return (
    <div className="app">
      <Navbar active="market" />
      <main className="page">
        {view.name === "list" && (
          <ListingGrid listings={SAMPLE_LISTINGS}
            onOpen={(l) => setView({ name: "detail", listing: l })}
            onNew={() => setView({ name: "new" })} />
        )}
        {view.name === "detail" && (
          <ListingDetail listing={view.listing}
            onBack={() => setView({ name: "list" })}
            onMessage={(l) => setView({ name: "thread", listing: l })} />
        )}
        {view.name === "thread" && (
          <MessageThread listing={view.listing}
            onBack={() => setView({ name: "detail", listing: view.listing })} />
        )}
        {view.name === "new" && (
          <NewListing onCancel={() => setView({ name: "list" })} onDone={() => setView({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MarketApp />);
