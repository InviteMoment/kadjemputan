
/* ==========================================================
   BY-SANN ADMIN
   Dashboard + RSVP + Ucapan + Media Manager
========================================================== */

import {
    auth,
    db,
    collection,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    signOut,
    onAuthStateChanged
} from "./firebase.js";


/* ==========================================================
   FIREBASE COLLECTIONS
========================================================== */

const rsvpRef = collection(db, "rsvps");
const wishRef = collection(db, "wishes");
const settingsRef = doc(db, "settings", "config");


/* ==========================================================
   CLOUDINARY
========================================================== */

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/onarqwtu/image/upload";

const CLOUDINARY_PRESET = "bysann_cover";


/* ==========================================================
   GLOBAL DATA
========================================================== */

let currentEditId = "";
let rsvpData = [];
let wishData = [];


/* ==========================================================
   ELEMENTS
========================================================== */

// Navigation
const menuButtons = document.querySelectorAll(".menuBtn");
const pages = document.querySelectorAll(".pageContent");
const pageTitle = document.getElementById("pageTitle");
const logoutBtn = document.getElementById("logoutBtn");

// Dashboard
const totalRsvp = document.getElementById("totalRsvp");
const totalWish = document.getElementById("totalWish");

// RSVP
const searchRsvp = document.getElementById("searchRsvp");
const rsvpList = document.getElementById("rsvpList");

// Ucapan
const searchWish = document.getElementById("searchWish");
const wishList = document.getElementById("wishList");

// Edit RSVP
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editAttendance = document.getElementById("editAttendance");
const editGuest = document.getElementById("editGuest");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Image preview
const imageModal = document.getElementById("imageModal");
const previewImage = document.getElementById("previewImage");
const closeImageModal = document.getElementById("closeImageModal");

// Media
const coverUpload = document.getElementById("coverUpload");
const coverPreview = document.getElementById("coverPreview");
const uploadCover = document.getElementById("uploadCover");
const pageMediaList = document.getElementById("pageMediaList");


/* ==========================================================
   HELPER
========================================================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(timestamp) {
    if (!timestamp) return "-";

    try {
        const date = typeof timestamp.toDate === "function"
            ? timestamp.toDate()
            : new Date(timestamp);

        if (Number.isNaN(date.getTime())) return "-";

        return date.toLocaleString("ms-MY", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    } catch {
        return "-";
    }
}


function updateDashboard() {
    if (totalRsvp) {
        totalRsvp.textContent = rsvpData.length;
    }

    if (totalWish) {
        totalWish.textContent = wishData.length;
    }
}


/* ==========================================================
   AUTHENTICATION
========================================================== */

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
    }
});


if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout gagal:", error);
            alert("Tidak berjaya logout. Sila cuba lagi.");
        }
    });
}


/* ==========================================================
   NAVIGATION
========================================================== */

const PAGE_MAP = {
    dashboard: "dashboardPage",
    rsvp: "rsvpPage",
    wishes: "wishesPage",
    media: "mediaPage"
};


function openPage(page) {
    pages.forEach(section => {
        section.classList.add("hidden");
    });

    menuButtons.forEach(button => {
        button.classList.remove("active");
    });

    const target = document.getElementById(PAGE_MAP[page]);

    if (!target) return;

    target.classList.remove("hidden");

    const activeButton = document.querySelector(
        `.menuBtn[data-page="${page}"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");

        if (pageTitle) {
            pageTitle.textContent =
                activeButton.textContent.trim();
        }
    }
}


menuButtons.forEach(button => {
    const page = button.dataset.page;

    if (!page) return;

    button.addEventListener("click", () => {
        openPage(page);
    });
});


/* ==========================================================
   REALTIME RSVP
========================================================== */

onSnapshot(
    rsvpRef,
    snapshot => {
        rsvpData = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        updateDashboard();
        renderRsvp();
    },
    error => {
        console.error("Ralat RSVP Firebase:", error);

        if (rsvpList) {
            rsvpList.textContent =
                "RSVP tidak dapat dimuatkan.";
        }
    }
);


/* ==========================================================
   RENDER RSVP
========================================================== */

function renderRsvp(data = rsvpData) {
    if (!rsvpList) return;

    rsvpList.replaceChildren();

    if (!data.length) {
        rsvpList.innerHTML = `
            <div class="emptyState">
                Tiada rekod RSVP.
            </div>
        `;
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");

        card.className = "rsvpCard";

        const guests = Number(item.guests ?? item.guest ?? 1);

        card.innerHTML = `
            <div class="rsvpHeader">
                <h3>${escapeHTML(item.name || "Tetamu")}</h3>
                <span>${escapeHTML(item.attendance || "-")}</span>
            </div>

            <div class="rsvpBody">
                <p>📞 ${escapeHTML(item.phone || "-")}</p>
                <p>👥 ${guests} tetamu</p>
                <p>🕒 ${escapeHTML(formatDate(item.createdAt))}</p>
            </div>

            <div class="rsvpAction">
                <button
                    type="button"
                    class="editBtn"
                    data-id="${escapeHTML(item.id)}"
                >
                    ✏ Edit
                </button>

                <button
                    type="button"
                    class="deleteBtn"
                    data-id="${escapeHTML(item.id)}"
                >
                    🗑 Padam
                </button>
            </div>
        `;

        rsvpList.appendChild(card);
    });
}


/* ==========================================================
   SEARCH RSVP
========================================================== */

if (searchRsvp) {
    searchRsvp.addEventListener("input", () => {
        const keyword = searchRsvp.value
            .trim()
            .toLowerCase();

        const filtered = rsvpData.filter(item => {
            return (
                String(item.name || "").toLowerCase().includes(keyword) ||
                String(item.phone || "").toLowerCase().includes(keyword) ||
                String(item.attendance || "").toLowerCase().includes(keyword)
            );
        });

        renderRsvp(filtered);
    });
}


/* ==========================================================
   RSVP ACTIONS
========================================================== */

if (rsvpList) {
    rsvpList.addEventListener("click", event => {
        const editButton = event.target.closest(".editBtn");
        const deleteButton = event.target.closest(".deleteBtn");

        if (editButton) {
            openEditModal(editButton.dataset.id);
        }

        if (deleteButton) {
            removeRsvp(deleteButton.dataset.id);
        }
    });
}


function openEditModal(id) {
    const item = rsvpData.find(record => record.id === id);

    if (!item || !editModal) return;

    currentEditId = id;

    editName.value = item.name || "";
    editPhone.value = item.phone || "";
    editAttendance.value = item.attendance || "Hadir";

    // Utamakan medan guests yang digunakan oleh script.js.
    editGuest.value = item.guests ?? item.guest ?? 1;

    editModal.style.display = "flex";
}


if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async () => {
        if (!currentEditId) return;

        const name = editName.value.trim();
        const phone = editPhone.value.trim();
        const attendance = editAttendance.value;
        const guests = Number(editGuest.value);

        if (!name) {
            alert("Sila masukkan nama tetamu.");
            return;
        }

        if (!Number.isInteger(guests) || guests < 1) {
            alert("Bilangan tetamu tidak sah.");
            return;
        }

        saveEditBtn.disabled = true;

        try {
            await updateDoc(
                doc(db, "rsvps", currentEditId),
                {
                    name,
                    phone,
                    attendance,
                    guests
                }
            );

            editModal.style.display = "none";
            currentEditId = "";

        } catch (error) {
            console.error("Gagal kemas kini RSVP:", error);
            alert("RSVP gagal dikemas kini.");
        } finally {
            saveEditBtn.disabled = false;
        }
    });
}


if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        editModal.style.display = "none";
        currentEditId = "";
    });
}


async function removeRsvp(id) {
    if (!confirm("Adakah anda pasti mahu memadam RSVP ini?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "rsvps", id));
    } catch (error) {
        console.error("Gagal padam RSVP:", error);
        alert("RSVP gagal dipadam.");
    }
}


/* ==========================================================
   REALTIME UCAPAN
========================================================== */

onSnapshot(
    wishRef,
    snapshot => {
        wishData = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        updateDashboard();
        renderWish();
    },
    error => {
        console.error("Ralat Ucapan Firebase:", error);

        if (wishList) {
            wishList.textContent =
                "Ucapan tidak dapat dimuatkan.";
        }
    }
);


/* ==========================================================
   RENDER UCAPAN
========================================================== */

function renderWish(data = wishData) {
    if (!wishList) return;

    wishList.replaceChildren();

    if (!data.length) {
        wishList.innerHTML = `
            <div class="emptyState">
                Tiada ucapan buat masa ini.
            </div>
        `;
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");

        card.className = "wishCard";

        card.innerHTML = `
            <div class="wishHeader">
                <h3>${escapeHTML(item.name || "Tetamu")}</h3>
                <span>❤️ ${Number(item.likes || 0)}</span>
            </div>

            <div class="wishMessage">
                ${escapeHTML(item.message || "-")}
            </div>

            <div class="wishFooter">
                <small>${escapeHTML(formatDate(item.createdAt))}</small>
            </div>

            <div class="wishAction">
                <button
                    type="button"
                    class="deleteWish"
                    data-id="${escapeHTML(item.id)}"
                >
                    🗑 Padam
                </button>
            </div>
        `;

        wishList.appendChild(card);
    });
}


/* ==========================================================
   SEARCH UCAPAN
========================================================== */

if (searchWish) {
    searchWish.addEventListener("input", () => {
        const keyword = searchWish.value
            .trim()
            .toLowerCase();

        const filtered = wishData.filter(item => {
            return (
                String(item.name || "").toLowerCase().includes(keyword) ||
                String(item.message || "").toLowerCase().includes(keyword)
            );
        });

        renderWish(filtered);
    });
}


/* ==========================================================
   DELETE UCAPAN
========================================================== */

if (wishList) {
    wishList.addEventListener("click", async event => {
        const button = event.target.closest(".deleteWish");

        if (!button) return;

        const id = button.dataset.id;

        if (!confirm("Adakah anda pasti mahu memadam ucapan ini?")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "wishes", id));
        } catch (error) {
            console.error("Gagal padam ucapan:", error);
            alert("Ucapan gagal dipadam.");
        }
    });
}


/* ==========================================================
   PAGE IMAGES - GITHUB
========================================================== */

function renderMedia() {
    if (!pageMediaList) return;

    pageMediaList.replaceChildren();

    // Gambar yang digunakan dalam index.html.
    const pageImages = [
        "page1.webp",
        "page2.webp",
        "page3.webp",
        "page4.webp",
        "page5.webp",
        "page6.webp",
        "page7.webp"
    ];

    pageImages.forEach(filename => {
        const card = document.createElement("div");

        card.className = "mediaItem";

        const title = document.createElement("h4");
        title.textContent = filename;

        const image = document.createElement("img");
        image.src = `images/${filename}`;
        image.alt = filename;
        image.className = "mediaPreview";
        image.loading = "lazy";

        image.addEventListener("click", () => {
            if (!imageModal || !previewImage) return;

            previewImage.src = image.src;
            imageModal.style.display = "flex";
        });

        image.addEventListener("error", () => {
            image.alt = "Gambar tidak dijumpai";
        });

        card.append(title, image);
        pageMediaList.appendChild(card);
    });
}


/* ==========================================================
   IMAGE MODAL
========================================================== */

if (closeImageModal) {
    closeImageModal.addEventListener("click", () => {
        imageModal.style.display = "none";
    });
}


if (imageModal) {
    imageModal.addEventListener("click", event => {
        if (event.target === imageModal) {
            imageModal.style.display = "none";
        }
    });
}


document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (imageModal) imageModal.style.display = "none";
        if (editModal) editModal.style.display = "none";
    }
});


/* ==========================================================
   LOAD COVER SETTING
========================================================== */

async function loadCover() {
    try {
        const snapshot = await getDoc(settingsRef);

        if (!snapshot.exists()) return;

        const data = snapshot.data();

        if (data.coverImage && coverPreview) {
            coverPreview.src = data.coverImage;
            coverPreview.hidden = false;
        }

    } catch (error) {
        console.error("Gagal memuat cover:", error);
    }
}


/* ==========================================================
   COVER PREVIEW
========================================================== */

if (coverUpload) {
    coverUpload.addEventListener("change", () => {
        const file = coverUpload.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Sila pilih fail gambar.");
            coverUpload.value = "";
            return;
        }

        const previewURL = URL.createObjectURL(file);

        coverPreview.src = previewURL;
        coverPreview.hidden = false;
    });
}


/* ==========================================================
   UPLOAD COVER - CLOUDINARY
========================================================== */

if (uploadCover) {
    uploadCover.addEventListener("click", async () => {
        const file = coverUpload?.files?.[0];

        if (!file) {
            alert("Sila pilih gambar cover terlebih dahulu.");
            return;
        }

        uploadCover.disabled = true;
        uploadCover.textContent = "Sedang upload...";

        try {
            const formData = new FormData();

            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_PRESET);

            const response = await fetch(CLOUDINARY_URL, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.secure_url) {
                throw new Error(
                    result.error?.message || "Upload Cloudinary gagal."
                );
            }

            await setDoc(
                settingsRef,
                {
                    coverImage: result.secure_url
                },
                {
                    merge: true
                }
            );

            coverPreview.src = result.secure_url;
            coverPreview.hidden = false;

            coverUpload.value = "";

            alert("Cover berjaya dimuat naik dan disimpan.");

        } catch (error) {
            console.error("Upload Cover:", error);
            alert("Upload Cover gagal: " + error.message);
        } finally {
            uploadCover.disabled = false;
            uploadCover.innerHTML =
                '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Cover';
        }
    });
}


/* ==========================================================
   START ADMIN
========================================================== */

renderMedia();
loadCover();
openPage("dashboard");

console.log("By-Sann Admin: Dashboard, RSVP, Ucapan dan Media Manager");
