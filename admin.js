
import {
    auth,
    db,
    collection,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    signOut,
    onAuthStateChanged
} from "./firebase.js";

// ==============================
// AUTHENTICATION
// ==============================

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});

// ==============================
// DATA
// ==============================

let rsvpData = [];
let wishData = [];

const rsvpList = document.getElementById("rsvpList");
const wishList = document.getElementById("wishList");

const totalRsvp = document.getElementById("totalRsvp");
const totalGuests = document.getElementById("totalGuests");
const totalWish = document.getElementById("totalWish");

// ==============================
// PAGE NAVIGATION
// ==============================

const pages = {
    dashboard: "dashboardPage",
    rsvp: "rsvpPage",
    wishes: "wishesPage",
    media: "mediaPage",
    details: "detailsPage"
};

const pageTitles = {
    dashboard: "Dashboard",
    rsvp: "RSVP",
    wishes: "Ucapan",
    media: "Gambar",
    details: "Maklumat Majlis"
};

document.querySelectorAll(".menuBtn[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;

        document.querySelectorAll(".menuBtn").forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        Object.values(pages).forEach((pageId) => {
            document.getElementById(pageId).classList.add("hidden");
        });

        document.getElementById(pages[page]).classList.remove("hidden");
        document.getElementById("pageTitle").textContent = pageTitles[page];

        if (page === "details") {
            loadDetails();
        }
    });
});

// ==============================
// LOGOUT
// ==============================

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const confirmed = confirm("Adakah anda pasti mahu logout?");

    if (!confirmed) return;

    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        alert("Logout gagal. Sila cuba lagi.");
        console.error(error);
    }
});

// ==============================
// FORMAT TARIKH
// ==============================

function formatDate(value) {
    if (!value) return "-";

    let date;

    if (typeof value.toDate === "function") {
        date = value.toDate();
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("ms-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ==============================
// CREATE ELEMENT SAFELY
// ==============================

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// ==============================
// DASHBOARD
// ==============================

function updateDashboard() {
    totalRsvp.textContent = rsvpData.length;

    const attendingGuests = rsvpData.reduce((total, item) => {
        if (item.attendance !== "Hadir") return total;

        const guests = Number(item.guests ?? item.guest ?? 1);

        return total + (Number.isFinite(guests) ? guests : 0);
    }, 0);

    totalGuests.textContent = attendingGuests;
    totalWish.textContent = wishData.length;
}

// ==============================
// RSVP
// ==============================

function renderRsvp() {
    const search = document
        .getElementById("searchRsvp")
        .value
        .toLowerCase()
        .trim();

    const filtered = rsvpData.filter((item) => {
        const name = String(item.name ?? "").toLowerCase();
        const phone = String(item.phone ?? "").toLowerCase();

        return name.includes(search) || phone.includes(search);
    });

    rsvpList.replaceChildren();

    if (filtered.length === 0) {
        rsvpList.appendChild(
            createElement("p", "emptyMessage", "Tiada rekod RSVP ditemui.")
        );
        return;
    }

    filtered.forEach((item) => {
        const card = createElement("div", "dataCard");
        const details = createElement("div", "dataDetails");

        details.appendChild(
            createElement("h3", "", item.name || "Tanpa nama")
        );

        details.appendChild(
            createElement("p", "", `Telefon: ${item.phone || "-"}`)
        );

        details.appendChild(
            createElement("p", "", `Kehadiran: ${item.attendance || "-"}`)
        );

        details.appendChild(
            createElement(
                "p",
                "",
                `Jumlah tetamu: ${item.guests ?? item.guest ?? 1}`
            )
        );

        details.appendChild(
            createElement("small", "", `Tarikh: ${formatDate(item.createdAt)}`)
        );

        const deleteButton = createElement("button", "deleteBtn", "Padam");

        deleteButton.type = "button";
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                `Padam rekod RSVP bagi ${item.name || "tetamu ini"}?`
            );

            if (!confirmed) return;

            try {
                await deleteDoc(doc(db, "rsvps", item.id));
            } catch (error) {
                alert("Rekod RSVP gagal dipadam.");
                console.error(error);
            }
        });

        card.append(details, deleteButton);
        rsvpList.appendChild(card);
    });
}

document.getElementById("searchRsvp").addEventListener("input", renderRsvp);

// ==============================
// UCAPAN
// ==============================

function renderWishes() {
    const search = document
        .getElementById("searchWish")
        .value
        .toLowerCase()
        .trim();

    const filtered = wishData.filter((item) => {
        const name = String(item.name ?? "").toLowerCase();
        const message = String(item.message ?? "").toLowerCase();

        return name.includes(search) || message.includes(search);
    });

    wishList.replaceChildren();

    if (filtered.length === 0) {
        wishList.appendChild(
            createElement("p", "emptyMessage", "Tiada ucapan ditemui.")
        );
        return;
    }

    filtered.forEach((item) => {
        const card = createElement("div", "dataCard");
        const details = createElement("div", "dataDetails");

        details.appendChild(
            createElement("h3", "", item.name || "Tanpa nama")
        );

        details.appendChild(
            createElement("p", "", item.message || "-")
        );

        details.appendChild(
            createElement("small", "", `Tarikh: ${formatDate(item.createdAt)}`)
        );

        const deleteButton = createElement("button", "deleteBtn", "Padam");

        deleteButton.type = "button";
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                `Padam ucapan daripada ${item.name || "pengguna ini"}?`
            );

            if (!confirmed) return;

            try {
                await deleteDoc(doc(db, "wishes", item.id));
            } catch (error) {
                alert("Ucapan gagal dipadam.");
                console.error(error);
            }
        });

        card.append(details, deleteButton);
        wishList.appendChild(card);
    });
}

document.getElementById("searchWish").addEventListener("input", renderWishes);

// ==============================
// MAKLUMAT MAJLIS - FIREBASE
// ==============================

const detailsForm = document.getElementById("detailsForm");
const detailsMessage = document.getElementById("detailsMessage");
const saveDetailsBtn = document.getElementById("saveDetailsBtn");

async function loadDetails() {
    try {
        const snapshot = await getDoc(doc(db, "settings", "config"));

        const data = snapshot.exists() ? snapshot.data() : {};

        document.getElementById("mapImage").value =
            data.mapImage || "images/maps.jpg";

        document.getElementById("mapsLink").value =
            data.maps || "";

        document.getElementById("venueAddress").value =
            data.address || "";

        document.getElementById("contactName").value =
            data.contactName || "Wakil Pengantin";

        document.getElementById("contactRole").value =
            data.contactRole || "Untuk dihubungi";

        document.getElementById("contactPhone").value =
            data.phone || "";

        detailsMessage.textContent = "";
    } catch (error) {
        console.error("Gagal memuatkan maklumat majlis:", error);
        detailsMessage.textContent =
            "Maklumat gagal dimuatkan. Sila cuba lagi.";
    }
}

// ==============================
// SIMPAN MAKLUMAT MAJLIS
// ==============================

detailsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mapImage = document.getElementById("mapImage").value.trim();
    const maps = document.getElementById("mapsLink").value.trim();
    const address = document.getElementById("venueAddress").value.trim();
    const contactName = document.getElementById("contactName").value.trim();
    const contactRole = document.getElementById("contactRole").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();

    if (maps) {
        try {
            const url = new URL(maps);

            if (!["http:", "https:"].includes(url.protocol)) {
                throw new Error("Pautan tidak sah");
            }
        } catch {
            detailsMessage.textContent =
                "Sila masukkan pautan Google Maps yang sah.";
            return;
        }
    }

    if (!mapImage) {
        detailsMessage.textContent =
            "Sila masukkan lokasi fail gambar Maps.";
        return;
    }

    saveDetailsBtn.disabled = true;
    saveDetailsBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    detailsMessage.textContent = "";

    try {
        await setDoc(
            doc(db, "settings", "config"),
            {
                mapImage,
                maps,
                address,
                contactName,
                contactRole,
                phone
            },
            { merge: true }
        );

        detailsMessage.textContent =
            "Maklumat majlis berjaya disimpan.";

        alert("Maklumat majlis berjaya disimpan!");

    } catch (error) {
        console.error("Gagal menyimpan maklumat:", error);

        detailsMessage.textContent =
            "Maklumat gagal disimpan. Sila cuba lagi.";

        alert("Gagal menyimpan maklumat. Sila semak sambungan Firebase.");

    } finally {
        saveDetailsBtn.disabled = false;
        saveDetailsBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Simpan Maklumat';
    }
});

// ==============================
// FIREBASE REALTIME - RSVP
// ==============================

onSnapshot(
    collection(db, "rsvps"),
    (snapshot) => {
        rsvpData = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));

        rsvpData.sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() ?? 0;
            const dateB = b.createdAt?.toMillis?.() ?? 0;

            return dateB - dateA;
        });

        updateDashboard();
        renderRsvp();
    },
    (error) => {
        console.error("RSVP Firebase error:", error);
        rsvpList.textContent = "Tidak dapat memuatkan data RSVP.";
    }
);

// ==============================
// FIREBASE REALTIME - UCAPAN
// ==============================

onSnapshot(
    collection(db, "wishes"),
    (snapshot) => {
        wishData = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));

        wishData.sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() ?? 0;
            const dateB = b.createdAt?.toMillis?.() ?? 0;

            return dateB - dateA;
        });

        updateDashboard();
        renderWishes();
    },
    (error) => {
        console.error("Wishes Firebase error:", error);
        wishList.textContent = "Tidak dapat memuatkan data ucapan.";
    }
);

// ==============================
// GALERI GAMBAR GITHUB
// ==============================

const githubImages = [
    "Ecard2026-v2.jpg",
    "Ecard2026.jpg",
    "maps.jpg",
    "page1.webp",
    "page2.webp",
    "page3.webp",
    "page4.webp",
    "page5.webp",
    "page6.webp",
    "page7.webp",
    "favicon.png",
    "salam-kaut.png"
];

const mediaList = document.getElementById("pageMediaList");

githubImages.forEach((filename) => {
    const card = createElement("div", "mediaItem");

    const image = document.createElement("img");
    image.src = `images/${filename}`;
    image.alt = filename;
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.style.display = "none";

        const errorText = createElement(
            "p",
            "emptyMessage",
            `Imej tidak ditemui: ${filename}`
        );

        card.appendChild(errorText);
    });

    card.appendChild(image);
    card.appendChild(createElement("p", "", filename));

    mediaList.appendChild(card);
});
