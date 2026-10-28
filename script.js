
/* =========================================================
   BY-SANN WEDDING INVITATION
   SCRIPT.JS
   8 HALAMAN + 6 BUTANG NAVIGASI
   ========================================================= */

import {
    db,
    collection,
    addDoc,
    doc,
    getDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "./firebase.js";

/* =========================================================
   HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function formatFirestoreDate(timestamp) {
    if (!timestamp) return "";

    try {
        const date = typeof timestamp.toDate === "function"
            ? timestamp.toDate()
            : new Date(timestamp);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("ms-MY", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch {
        return "";
    }
}

/* =========================================================
   FIREBASE COLLECTIONS
   ========================================================= */

const rsvpRef = collection(db, "rsvps");
const wishRef = collection(db, "wishes");

/* =========================================================
   SETTINGS
   ========================================================= */

let CONFIG = {
    bride: "Hafiy Aziemah Azyan",
    groom: "Muhammad Nur Afiq",

    day: "Ahad",
    date: "13 Disember 2026",

    time: "10:00 AM",
    endTime: "3:00 PM",

    weddingDate: "2026-12-13",

    address: "Kampung Kukut, Padas Damit, Beaufort, Sabah",

    maps: "",
    waze: "",

    phone: "",
    contactName: "Wakil Pengantin",
    contactRole: "Untuk dihubungi",

    music: "music/song.m4a"
};

async function loadSettings() {
    try {
        const snap = await getDoc(doc(db, "settings", "config"));

        if (snap.exists()) {
            const data = snap.data();

            CONFIG = {
                ...CONFIG,
                ...data,

                bride: data.brideName || data.bride || CONFIG.bride,
                groom: data.groomName || data.groom || CONFIG.groom,

                date: data.displayDate || data.date || CONFIG.date,
                time: data.weddingTime || data.time || CONFIG.time,

                address: data.address || CONFIG.address,
                maps: data.maps || CONFIG.maps,
                waze: data.waze || CONFIG.waze,
                phone: data.phone || CONFIG.phone,

                music: data.music || CONFIG.music
            };

            if (!data.displayDate && data.weddingDate) {
                CONFIG.weddingDate = data.weddingDate;
            }
        }
    } catch (error) {
        console.error("Gagal memuat tetapan Firebase:", error);
    }

    setMusicSource();
}

/* =========================================================
   COVER / BUKA UNDANGAN
   ========================================================= */

async function openInvitation() {
    const cover = $("cover");
    const nav = $("bottomNav");

    cover?.classList.add("hidden");
    nav?.classList.remove("hidden");

    document.body.style.overflowX = "hidden";

    document.querySelectorAll(".fade-section").forEach(section => {
        section.classList.add("visible");
    });

    // Cuba mainkan muzik; website tetap dibuka jika audio disekat.
    try {
        if ($("music")) {
            setMusicSource();
            await $("music").play();
            $("musicBtn")?.classList.add("playing");
        }
    } catch (error) {
        console.warn("Muzik tidak dapat dimainkan secara automatik.", error);
    }
}

$("coverOpenBtn")?.addEventListener("click", openInvitation);

/* =========================================================
   MUZIK
   ========================================================= */

let musicPlaying = false;

function setMusicSource() {
    const audio = $("music");
    if (!audio) return;

    const source = audio.querySelector("source");

    if (source) {
        source.src = CONFIG.music || "music/song.m4a";
    } else {
        audio.src = CONFIG.music || "music/song.m4a";
    }

    audio.loop = true;
    audio.load();
}

async function toggleMusic() {
    const audio = $("music");
    const button = $("musicBtn");

    if (!audio) return;

    try {
        if (audio.paused) {
            await audio.play();
            musicPlaying = true;
            button?.classList.add("playing");
        } else {
            audio.pause();
            musicPlaying = false;
            button?.classList.remove("playing");
        }
    } catch (error) {
        console.error("Ralat muzik:", error);
        showToast("Muzik tidak dapat dimainkan.");
    }
}

$("musicBtn")?.addEventListener("click", toggleMusic);

/* =========================================================
   BOTTOM SHEET
   ========================================================= */

function openSheet(content) {
    const sheet = $("bottomSheet");
    const overlay = $("sheetOverlay");
    const contentBox = $("sheetContent");

    if (!sheet || !contentBox) return;

    contentBox.innerHTML = content;
    sheet.classList.add("show");
    overlay?.classList.add("show");
    overlay?.setAttribute("aria-hidden", "false");

    $("bottomNav")?.classList.add("hidden");
    $("musicBtn")?.classList.add("sheetMusicHidden");
    $("musicBtn")?.style.setProperty("display", "none");
}

function closeSheet() {
    $("bottomSheet")?.classList.remove("show");
    $("sheetOverlay")?.classList.remove("show");
    $("sheetOverlay")?.setAttribute("aria-hidden", "true");

    $("bottomNav")?.classList.remove("hidden");
    $("musicBtn")?.style.removeProperty("display");
}

$("sheetOverlay")?.addEventListener("click", closeSheet);

/* =========================================================
   1. TARIKH DAN TEMPAT
   ========================================================= */

function openDate() {
    openSheet(`
        <h2>Tarikh dan Tempat</h2>

        <p><strong>Pengantin perempuan:</strong><br>
        ${escapeHTML(CONFIG.bride)}</p>

        <p><strong>Pengantin lelaki:</strong><br>
        ${escapeHTML(CONFIG.groom)}</p>

        <p><strong>Hari:</strong> ${escapeHTML(CONFIG.day)}</p>
        <p><strong>Tarikh:</strong> ${escapeHTML(CONFIG.date)}</p>

        <p><strong>Masa:</strong>
        ${escapeHTML(CONFIG.time)} – ${escapeHTML(CONFIG.endTime)}</p>

        <p><strong>Tempat:</strong><br>
        ${escapeHTML(CONFIG.address)}</p>
    `);
}

/* =========================================================
   2. LOKASI
   ========================================================= */

function openLocation() {
    const mapsButton = CONFIG.maps
        ? `<a href="${escapeHTML(CONFIG.maps)}"
              target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-map-location-dot"></i>
              Buka Google Maps
           </a>`
        : "";

    const wazeButton = CONFIG.waze
        ? `<a href="${escapeHTML(CONFIG.waze)}"
              target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-location-arrow"></i>
              Buka Waze
           </a>`
        : "";

    openSheet(`
        <h2>Lokasi Majlis</h2>

        <p>${escapeHTML(CONFIG.address)}</p>

        ${mapsButton}
        ${wazeButton}

        ${!CONFIG.maps && !CONFIG.waze
            ? "<p> pautan peta belum ditetapkan. Sila kemas kini melalui Admin Settings.</p>"
            : ""}
    `);
}

/* =========================================================
   3. UNTUK DIHUBUNGI
   ========================================================= */

function openContact() {
    const phone = String(CONFIG.phone || "").trim();
    const digits = phone.replace(/\D/g, "");

    let whatsappNumber = digits;

    if (whatsappNumber.startsWith("0")) {
        whatsappNumber = "6" + whatsappNumber;
    }

    const whatsappButton = whatsappNumber
        ? `<a href="https://wa.me/${escapeHTML(whatsappNumber)}"
              target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
           </a>`
        : "";

    const callButton = phone
        ? `<a href="tel:${escapeHTML(phone)}">
              <i class="fa-solid fa-phone"></i> Telefon
           </a>`
        : "";

    openSheet(`
        <h2>Untuk Dihubungi</h2>

        <p><strong>${escapeHTML(CONFIG.contactName)}</strong></p>
        <p>${escapeHTML(CONFIG.contactRole)}</p>

        ${phone ? `<p>${escapeHTML(phone)}</p>` : ""}

        ${whatsappButton}
        ${callButton}

        ${!phone ? "<p>Sila tetapkan nombor telefon melalui Admin Settings.</p>" : ""}
    `);
}

/* =========================================================
   4. RSVP FORM
   ========================================================= */

function openRSVP() {
    openSheet(`
        <h2>RSVP Kehadiran</h2>
        <p>Sila sahkan kehadiran anda.</p>

        <form id="rsvpForm">
            <label for="rsvpName">Nama</label>
            <input id="rsvpName" name="name"
                   maxlength="100" required
                   placeholder="Masukkan nama anda">

            <label for="rsvpPhone">Nombor telefon</label>
            <input id="rsvpPhone" name="phone"
                   type="tel" maxlength="30"
                   placeholder="Contoh: 0123456789">

            <label for="rsvpAttendance">Kehadiran</label>
            <select id="rsvpAttendance" name="attendance" required>
                <option value="">Pilih kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
            </select>

            <label for="rsvpGuests">Bilangan tetamu</label>
            <input id="rsvpGuests" name="guests"
                   type="number" min="1" max="100"
                   value="1" required>

            <button type="submit">
                <i class="fa-solid fa-paper-plane"></i>
                Hantar RSVP
            </button>
        </form>
    `);

    $("rsvpForm")?.addEventListener("submit", submitRSVP);
}

async function submitRSVP(event) {
    event.preventDefault();

    const name = $("rsvpName")?.value.trim();
    const phone = $("rsvpPhone")?.value.trim() || "";
    const attendance = $("rsvpAttendance")?.value;
    const guests = Number($("rsvpGuests")?.value || 1);

    if (!name || !attendance) {
        showToast("Sila lengkapkan nama dan kehadiran.");
        return;
    }

    if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
        showToast("Sila masukkan bilangan tetamu yang sah.");
        return;
    }

    const submitButton = $("rsvpForm")?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        await addDoc(rsvpRef, {
            name,
            phone,
            attendance,
            guests,
            createdAt: serverTimestamp()
        });

        showToast("RSVP berjaya dihantar ❤️");
        closeSheet();
    } catch (error) {
        console.error("Ralat RSVP:", error);
        showToast("RSVP gagal dihantar. Sila cuba lagi.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

/* =========================================================
   5. RSVP LIVE PADA PAGE 5
   ========================================================= */

function listenRSVP() {
    const list = $("rsvpList");
    if (!list) return;

    const q = query(rsvpRef, orderBy("createdAt", "desc"));

    onSnapshot(q, snapshot => {
        list.replaceChildren();

        if (snapshot.empty) {
            const empty = document.createElement("p");
            empty.className = "rsvpCard";
            empty.textContent = "Belum ada pengesahan kehadiran.";
            list.appendChild(empty);
            return;
        }

        snapshot.forEach(item => {
            const data = item.data();

            const card = document.createElement("article");
            card.className = "rsvpCard";

            const name = document.createElement("div");
            name.className = "rsvpName";
            name.textContent = data.name || "Tetamu";

            const info = document.createElement("div");
            info.className = "rsvpInfo";

            const guests = Number(data.guests || 1);
            info.textContent =
                `${data.attendance || "Belum dinyatakan"} · ${guests} tetamu`;

            card.append(name, info);
            list.appendChild(card);
        });
    }, error => {
        console.error("Ralat memuatkan RSVP:", error);
        list.textContent = "Senarai RSVP tidak dapat dimuatkan.";
    });
}

/* =========================================================
   6. UCAPAN FORM
   ========================================================= */

function openWishes() {
    openSheet(`
        <h2>Ucapan untuk Pengantin</h2>
        <p>Tinggalkan doa dan ucapan anda ❤️</p>

        <form id="wishForm">
            <label for="wishName">Nama</label>
            <input id="wishName" name="name"
                   maxlength="100" required
                   placeholder="Masukkan nama anda">

            <label for="wishMessage">Ucapan</label>
            <textarea id="wishMessage" name="message"
                      maxlength="1000" rows="5"
                      required placeholder="Tulis ucapan anda..."></textarea>

            <button type="submit">
                <i class="fa-solid fa-heart"></i>
                Hantar Ucapan
            </button>
        </form>
    `);

    $("wishForm")?.addEventListener("submit", submitWish);
}

async function submitWish(event) {
    event.preventDefault();

    const name = $("wishName")?.value.trim();
    const message = $("wishMessage")?.value.trim();

    if (!name || !message) {
        showToast("Sila isi nama dan ucapan.");
        return;
    }

    const submitButton = $("wishForm")?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        await addDoc(wishRef, {
            name,
            message,
            likes: 0,
            createdAt: serverTimestamp()
        });

        showToast("Ucapan berjaya dihantar ❤️");
        closeSheet();
    } catch (error) {
        console.error("Ralat ucapan:", error);
        showToast("Ucapan gagal dihantar. Sila cuba lagi.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

/* =========================================================
   UCAPAN LIVE PADA PAGE 6
   ========================================================= */

function listenWishes() {
    const list = $("wishList");
    if (!list) return;

    const q = query(wishRef, orderBy("createdAt", "desc"));

    onSnapshot(q, snapshot => {
        list.replaceChildren();

        if (snapshot.empty) {
            const empty = document.createElement("article");
            empty.className = "wishCard";
            empty.textContent = "Jadilah orang pertama yang meninggalkan ucapan ❤️";
            list.appendChild(empty);
            return;
        }

        snapshot.forEach(item => {
            const data = item.data();

            const card = document.createElement("article");
            card.className = "wishCard";

            const name = document.createElement("div");
            name.className = "wishName";
            name.textContent = data.name || "Tetamu";

            const message = document.createElement("div");
            message.className = "wishMessage";
            message.textContent = data.message || "";

            const dateText = formatFirestoreDate(data.createdAt);

            card.append(name, message);

            if (dateText) {
                const date = document.createElement("div");
                date.className = "wishDate";
                date.textContent = dateText;
                card.appendChild(date);
            }

            list.appendChild(card);
        });
    }, error => {
        console.error("Ralat memuatkan ucapan:", error);
        list.textContent = "Ucapan tidak dapat dimuatkan.";
    });
}

/* =========================================================
   6. SALAM KAUT QR
   ========================================================= */

function openSalamKaut() {
    openSheet(`
        <h2>Salam Kaut</h2>
        <p>Imbas kod QR di bawah untuk memberi salam kaut kepada pengantin.</p>

        <div style="text-align:center; padding:12px;">
            <img
                src="images/salam-kaut.png"
                alt="Kod QR Salam Kaut"
                style="width:min(260px, 100%); margin:0 auto; object-fit:contain;"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">

            <p style="display:none;">
                Kod QR belum tersedia. Letakkan imej QR di
                <strong>images/salam-kaut.png</strong>.
            </p>
        </div>
    `);
}

/* =========================================================
   NAVIGASI UTAMA
   ========================================================= */

$("dateBtn")?.addEventListener("click", openDate);
$("locationBtn")?.addEventListener("click", openLocation);
$("contactBtn")?.addEventListener("click", openContact);
$("rsvpBtn")?.addEventListener("click", openRSVP);
$("wishBtn")?.addEventListener("click", openWishes);
$("salamKautBtn")?.addEventListener("click", openSalamKaut);

/* =========================================================
   ANIMASI HALAMAN
   ========================================================= */

function setupRevealObserver() {
    const sections = document.querySelectorAll(".fade-section");

    if (!("IntersectionObserver" in window)) {
        sections.forEach(section => section.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, {
        threshold: 0.08
    });

    sections.forEach(section => observer.observe(section));
}

/* =========================================================
   MULA WEBSITE
   ========================================================= */

async function init() {
    setupRevealObserver();

    // Dengar perubahan Firebase supaya senarai dikemas kini secara langsung.
    listenRSVP();
    listenWishes();

    await loadSettings();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
