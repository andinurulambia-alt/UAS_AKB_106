/* ===================================================================
   BUKU INDUK — app.js
   Modul bersama: koneksi API (Apps Script), sesi login, shell UI,
   helper format & kalkulasi nilai (mirror dari Code.gs untuk preview).
   =================================================================== */

/* -------------------------------------------------------------------
   1. KONFIGURASI
   Tempel URL Web App Apps Script kamu di bawah ini (lihat panduan
   instalasi, Langkah 3). Jangan hapus tanda kutip.
------------------------------------------------------------------- */
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbywqDXsbhRsjy2pxxvtUhFpVEpbEMD-uFtcvUvIGrwg5SDI5t44w4HHx7lG5S2_aSv6/exec",
};

/* -------------------------------------------------------------------
   2. PEMANGGILAN API
------------------------------------------------------------------- */
async function Api(action, payload = {}) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.indexOf("PASTE_URL") !== -1) {
    throw new Error("URL Apps Script belum diatur. Buka assets/app.js dan isi CONFIG.APPS_SCRIPT_URL dengan URL Web App kamu.");
  }
  let res;
  try {
    res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, payload }),
    });
  } catch (e) {
    throw new Error("Tidak dapat menghubungi server. Periksa koneksi internet dan URL Apps Script.");
  }
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error("Respons server tidak valid. Pastikan Web App di-deploy dengan akses 'Anyone'.");
  }
  if (!json.ok) throw new Error(json.error || "Terjadi kesalahan pada server.");
  return json.data;
}

/* -------------------------------------------------------------------
   3. SESI LOGIN
------------------------------------------------------------------- */
const Session = {
  KEY: "bi_session",
  set(user) { localStorage.setItem(this.KEY, JSON.stringify(user)); },
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); }
    catch (e) { return null; }
  },
  clear() { localStorage.removeItem(this.KEY); },
  requireLogin() {
    const u = this.get();
    if (!u) { window.location.href = "index.html"; return null; }
    return u;
  },
  requireRole(roles) {
    const u = this.requireLogin();
    if (!u) return null;
    if (!roles.includes(u.role)) {
      window.location.href = "dashboard.html";
      return null;
    }
    return u;
  },
};

function roleLabel(role) {
  return { admin: "Administrator", dosen: "Dosen", mahasiswa: "Mahasiswa" }[role] || role;
}

/* -------------------------------------------------------------------
   4. IKON (SVG inline, ringan, tanpa dependensi luar)
------------------------------------------------------------------- */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.5c.6-3.4 3.1-5.3 6.2-5.3s5.6 1.9 6.2 5.3"/><circle cx="17" cy="8.5" r="2.6"/><path d="M16 14.4c2.3.3 4 1.9 4.4 4.4"/></svg>',
  idcard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.8 1.8-2.7 3-2.7s2.5.9 3 2.7"/><path d="M14 9.5h6M14 13h6M14 16h4"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="7.5" width="19" height="12" rx="2"/><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"/><path d="M2.5 13h19"/><path d="M10.5 13v1.4h3V13"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4.8c2.4-.9 5-.9 8 0v14.4c-3-.9-5.6-.9-8 0Z"/><path d="M20 4.8c-2.4-.9-5-.9-8 0v14.4c3-.9 5.6-.9 8 0Z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l.9-3.9L16.6 4.4a1.8 1.8 0 0 1 2.6 0l.4.4a1.8 1.8 0 0 1 0 2.6L8 19.1z"/><path d="M14.5 6.5l3 3"/></svg>',
  calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h2M11.5 11h2M15 11h2M8 14.5h2M11.5 14.5h2M15 14.5h2M8 18h2M11.5 18h5.5"/></svg>',
  scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3.5h11a2 2 0 0 1 2 2V18a2.5 2.5 0 0 1-2.5 2.5H6"/><path d="M6 3.5A2 2 0 0 0 4 5.5v13A2 2 0 0 0 6 20.5"/><path d="M8.5 8h6M8.5 11.5h6M8.5 15h3.5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.7 7.7 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.6c.8.7 1.7 1.2 2.6 1.5L10 22h4l.4-2.7c.9-.3 1.8-.8 2.6-1.5l2.3.6 2-3.4z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.7-4.7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l.7-3.2L15.2 6.3a1.5 1.5 0 0 1 2.1 0l.4.4a1.5 1.5 0 0 1 0 2.1L7.2 19.3z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M7 7l.8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L17 7"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.3 4.3L19 7"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3.5h11a2 2 0 0 1 2 2V18a2.5 2.5 0 0 1-2.5 2.5H6"/><path d="M6 3.5A2 2 0 0 0 4 5.5v13A2 2 0 0 0 6 20.5"/></svg>',
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", roles: ["admin", "dosen", "mahasiswa"], icon: ICON.home },
  { key: "mahasiswa", label: "Data Mahasiswa", href: "mahasiswa.html", roles: ["admin"], icon: ICON.users },
  { key: "dosen", label: "Data Dosen", href: "dosen.html", roles: ["admin"], icon: ICON.idcard },
  { key: "staf", label: "Data Staf", href: "staf.html", roles: ["admin"], icon: ICON.briefcase },
  { key: "matakuliah", label: "Mata Kuliah", href: "matakuliah.html", roles: ["admin"], icon: ICON.book },
  { key: "nilai", label: "Input Nilai", href: "nilai.html", roles: ["admin", "dosen"], icon: ICON.pencil },
  { key: "generate", label: "Generate IP / IPK", href: "generate.html", roles: ["admin"], icon: ICON.calc },
  { key: "transkrip", label: "Transkrip", href: "transkrip.html", roles: ["admin", "dosen", "mahasiswa"], icon: ICON.scroll },
  { key: "pengaturan", label: "Pengaturan Nilai", href: "pengaturan.html", roles: ["admin"], icon: ICON.gear },
];

/* -------------------------------------------------------------------
   5. SHELL (sidebar + topbar) — dipasang lewat Shell.mount()
------------------------------------------------------------------- */
const Shell = {
  mount({ active, eyebrow, title, roles }) {
    const user = roles ? Session.requireRole(roles) : Session.requireLogin();
    if (!user) return null;

    const navHtml = NAV_ITEMS
      .filter((i) => i.roles.includes(user.role))
      .map((i) => {
        const label = i.key === "transkrip" && user.role === "mahasiswa" ? "Transkrip Saya" : i.label;
        return `<a class="nav-item ${i.key === active ? "active" : ""}" href="${i.href}">
          <span class="ic">${i.icon}</span>${label}
        </a>`;
      })
      .join("");

    const shellEl = document.createElement("div");
    shellEl.className = "app-shell";
    shellEl.innerHTML = `
      <div class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="crest">BI</div>
          <div>
            <div class="name">Portal Akademik</div>
            <div class="sub">Adm. Perkantoran</div>
          </div>
        </div>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-foot">Sistem Informasi Akademik<br>Prodi Administrasi Perkantoran</div>
      </div>
      <div class="main">
        <div class="topbar">
          <div style="display:flex;align-items:center;">
            <button class="menu-toggle" id="menuToggle" aria-label="Menu"><span></span><span></span><span></span></button>
            <div class="topbar-title">
              <span class="eyebrow">${escapeHtml(eyebrow || "")}</span>
              <h2>${escapeHtml(title || "")}</h2>
            </div>
          </div>
          <div class="user-chip" id="userChip">
            <div class="ava">${escapeHtml((user.nama || "?").charAt(0).toUpperCase())}</div>
            <div class="meta"><div class="nm">${escapeHtml(user.nama)}</div><div class="rl">${roleLabel(user.role)}</div></div>
            <div class="user-menu" id="userMenu">
              <a href="#" id="logoutBtn">Keluar</a>
            </div>
          </div>
        </div>
        <div class="content" id="pageContent"></div>
      </div>
    `;
    document.body.prepend(shellEl);

    // pindahkan konten halaman (#page-root) ke dalam area content
    const root = document.getElementById("page-root");
    const contentArea = document.getElementById("pageContent");
    if (root) {
      root.hidden = false;
      contentArea.appendChild(root);
    }

    // toggle menu user
    const chip = document.getElementById("userChip");
    const menu = document.getElementById("userMenu");
    chip.addEventListener("click", (e) => {
      menu.classList.toggle("open");
      e.stopPropagation();
    });
    document.addEventListener("click", () => menu.classList.remove("open"));

    // logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      Session.clear();
      window.location.href = "index.html";
    });

    // toggle sidebar mobile
    document.getElementById("menuToggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });

    return user;
  },
};

/* -------------------------------------------------------------------
   6. TOAST & DIALOG
------------------------------------------------------------------- */
function toast(msg, type = "ok") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function confirmDialog(message, opts = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay open";
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div class="modal-head"><h3>${escapeHtml(opts.title || "Konfirmasi")}</h3></div>
        <div class="modal-body"><p style="font-size:13.8px;color:var(--slate-700);margin:0;">${escapeHtml(message)}</p></div>
        <div class="modal-foot">
          <button class="btn btn-outline" data-act="cancel">Batal</button>
          <button class="btn ${opts.danger === false ? "btn-primary" : "btn-danger"}" data-act="ok">${escapeHtml(opts.okLabel || "Hapus")}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-act="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('[data-act="ok"]').onclick = () => { overlay.remove(); resolve(true); };
  });
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

/* -------------------------------------------------------------------
   7. KALKULASI NILAI (mirror dari Code.gs, untuk live preview)
------------------------------------------------------------------- */
function hitungNilaiAkhir(komponen, bobot) {
  const totalBobot = (+bobot.tugas || 0) + (+bobot.praktik || 0) + (+bobot.uts || 0) + (+bobot.uas || 0) + (+bobot.absen || 0);
  if (totalBobot <= 0) return 0;
  const totalSkor =
    (+komponen.tugas || 0) * (+bobot.tugas || 0) +
    (+komponen.praktik || 0) * (+bobot.praktik || 0) +
    (+komponen.uts || 0) * (+bobot.uts || 0) +
    (+komponen.uas || 0) * (+bobot.uas || 0) +
    (+komponen.absen || 0) * (+bobot.absen || 0);
  return totalSkor / totalBobot;
}

function tentukanHuruf(na, skala) {
  const s = skala || { a: 80, b: 70, c: 60, d: 50 };
  if (na >= s.a) return { huruf: "A", bobotHuruf: 4 };
  if (na >= s.b) return { huruf: "B", bobotHuruf: 3 };
  if (na >= s.c) return { huruf: "C", bobotHuruf: 2 };
  if (na >= s.d) return { huruf: "D", bobotHuruf: 1 };
  return { huruf: "E", bobotHuruf: 0 };
}

/* -------------------------------------------------------------------
   8. HELPER FORMAT & TAMPILAN
------------------------------------------------------------------- */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtNum(n, d = 2) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return num.toFixed(d);
}
function badgeHuruf(huruf) {
  if (!huruf) return "—";
  return `<span class="badge badge-${huruf.toLowerCase()}">${huruf}</span>`;
}
function badgeStatusLulus(status) {
  return status === "Lulus"
    ? `<span class="badge badge-lulus">Lulus</span>`
    : `<span class="badge badge-tidak">Tidak Lulus</span>`;
}
function badgeStatusMhs(status) {
  const map = { Aktif: "badge-aktif", Lulus: "badge-lulus", Cuti: "badge-c", "Non-Aktif": "badge-tidak" };
  return `<span class="badge ${map[status] || "badge-aktif"}">${escapeHtml(status || "Aktif")}</span>`;
}
function setLoading(tbody, colspan, message = "Memuat data...") {
  tbody.innerHTML = `<tr class="empty-row"><td colspan="${colspan}">${escapeHtml(message)}</td></tr>`;
}
function setEmpty(tbody, colspan, message = "Belum ada data.") {
  tbody.innerHTML = `<tr class="empty-row"><td colspan="${colspan}">${escapeHtml(message)}</td></tr>`;
}
function showErr(err) {
  console.error(err);
  toast(err && err.message ? err.message : "Terjadi kesalahan.", "err");
}

/* -------------------------------------------------------------------
   9. STAMP / SEGEL — badge stempel melingkar untuk IPK & Status
------------------------------------------------------------------- */
function renderStamp({ value, caption, kind = "neutral", size = 148 }) {
  const id = "p" + Math.random().toString(36).slice(2, 8);
  return `
  <svg class="stamp ${kind}" viewBox="0 0 160 160" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><path id="${id}" d="M 14 80 A 66 66 0 1 1 146 80" /></defs>
    <g transform="rotate(-6 80 80)">
      <circle class="ring" cx="80" cy="80" r="70" />
      <circle class="ring" cx="80" cy="80" r="58" stroke-dasharray="2.5 3.5" />
      <text class="curve"><textPath href="#${id}" startOffset="2">PRODI ADMINISTRASI PERKANTORAN</textPath></text>
      <text class="big" x="80" y="88" text-anchor="middle">${escapeHtml(value)}</text>
    </g>
  </svg>`;
}
