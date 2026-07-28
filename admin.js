import {
db,
collection,
getDocs,
query,
orderBy,
onSnapshot,
doc,
deleteDoc
} from "./firebase.js";

/* =========================
ELEMENT
========================= */

const totalRSVP=document.getElementById("totalRSVP");
const totalGuest=document.getElementById("totalGuest");
const totalWish=document.getElementById("totalWish");
const totalAttend=document.getElementById("totalAttend");
const totalAbsent=document.getElementById("totalAbsent");

const rsvpList=document.getElementById("rsvpList");
const wishList=document.getElementById("wishList");

const loginPage=document.getElementById("loginPage");
const dashboard=document.getElementById("dashboard");
const loginBtn=document.getElementById("loginBtn");
const password=document.getElementById("password");

const logoutBtn=document.getElementById("logoutBtn");
const exportBtn=document.getElementById("exportBtn");
const searchRSVP=document.getElementById("searchRSVP");
const searchWish=document.getElementById("searchWish");

const guestList = document.getElementById("guestList");
const searchGuest = document.getElementById("searchGuest");

const ADMIN_PASSWORD="Sanbengg15";

function openDashboard(){

loginPage.style.display="none";

dashboard.style.display="block";

}

if(localStorage.getItem("adminLogin")==="true"){

openDashboard();

}

loginBtn.addEventListener("click",()=>{

if(password.value===ADMIN_PASSWORD){

localStorage.setItem("adminLogin","true");

openDashboard();

}else{

alert("Password salah.");

}

});

/* =========================
RSVP
========================= */

const rsvpQuery = query(
    collection(db, "rsvp"),
    orderBy("createdAt", "desc")
);

onSnapshot(rsvpQuery, (snapshot) => {

    rsvpList.innerHTML = "";
    guestList.innerHTML = "";

    let guest = 0;
    let attend = 0;
    let absent = 0;
    let no = 1;

    totalRSVP.textContent = snapshot.size;

    snapshot.forEach((item) => {

        const data = item.data();

        if (data.kehadiran === "Hadir") {
            attend++;
        } else {
            absent++;
        }

        guest += Number(data.jumlahTetamu || 0);

        /* ---------- Senarai RSVP ---------- */

        const card = document.createElement("div");

        card.dataset.nama = (data.nama || "").toLowerCase();

        card.className = "listCard";

        card.innerHTML = `
            <h3>${data.nama}</h3>

            <p><strong>Status:</strong> ${data.kehadiran}</p>

            <p><strong>Tetamu:</strong> ${data.jumlahTetamu}</p>

            <button
                class="deleteBtn"
                onclick="deleteRSVP('${item.id}')">
                Padam
            </button>
        `;

        rsvpList.appendChild(card);

        /* ---------- Senarai Tetamu Hadir ---------- */

        if (data.kehadiran === "Hadir") {

            let masa = "-";

            if (data.createdAt?.toDate) {
                masa = data.createdAt
                    .toDate()
                    .toLocaleString("ms-MY");
            }

            guestList.innerHTML += `
                <div class="guest-card">

                    <h3>${no}. ${data.nama}</h3>

                    <p>👥 ${data.jumlahTetamu} Tetamu</p>

                    <p>🕒 ${masa}</p>

                    <span class="hadirBadge">✅ Hadir</span>

                </div>
            `;

            no++;
        }

    });

    totalGuest.textContent = guest;
    totalAttend.textContent = attend;
    totalAbsent.textContent = absent;

    filterGuest();

});

function filterGuest() {

    const keyword = searchGuest.value.toLowerCase();

    document.querySelectorAll(".guest-card").forEach((card) => {

        card.style.display = card.innerText
            .toLowerCase()
            .includes(keyword)
            ? "block"
            : "none";

    });

}

if (searchGuest) {
    searchGuest.addEventListener("input", filterGuest);
}

/* =========================
UCAPAN
========================= */

const wishQuery=query(
collection(db,"wishes"),
orderBy("createdAt","desc")
);

onSnapshot(wishQuery,(snapshot)=>{

wishList.innerHTML="";

totalWish.textContent=snapshot.size;

snapshot.forEach((item)=>{

const data=item.data();

const card=document.createElement("div");

card.dataset.search =
(
(data.nama || "") +
" " +
(data.ucapan || "")
).toLowerCase();

card.className="listCard";

card.innerHTML=`

<h3>${data.nama}</h3>

<p>${data.ucapan}</p>

<p>❤️ ${data.likes||0}</p>

<button
class="deleteBtn"
onclick="deleteWish('${item.id}')">

Padam

</button>

`;

wishList.appendChild(card);

});

});

/* =========================
DELETE RSVP
========================= */

window.deleteRSVP=async(id)=>{

if(!confirm("Padam RSVP ini?")) return;

await deleteDoc(
doc(db,"rsvp",id)
);

};

/* =========================
DELETE WISH
========================= */

window.deleteWish=async(id)=>{

if(!confirm("Padam ucapan ini?")) return;

await deleteDoc(
doc(db,"wishes",id)
);

};

logoutBtn.addEventListener("click",()=>{

localStorage.removeItem("adminLogin");

location.reload();

});

exportBtn.addEventListener("click", async()=>{

const snapshot=await getDocs(collection(db,"rsvp"));

const data=[];

snapshot.forEach((doc)=>{

const item=doc.data();

data.push({

Nama:item.nama,
Telefon:item.telefon,
Status:item.kehadiran,
Tetamu:item.jumlahTetamu

});

});

const worksheet=XLSX.utils.json_to_sheet(data);

const workbook=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"RSVP"
);

XLSX.writeFile(
workbook,
"RSVP_Tetamu.xlsx"
);

});

searchRSVP.addEventListener("input",()=>{

const keyword=searchRSVP.value.toLowerCase();

document.querySelectorAll("#rsvpList .listCard").forEach(card=>{

card.style.display=
card.dataset.nama.includes(keyword)
?
"block"
:
"none";

});

});

searchWish.addEventListener("input",()=>{

const keyword=searchWish.value.toLowerCase();

document.querySelectorAll("#wishList .listCard").forEach(card=>{

card.style.display=
card.dataset.search.includes(keyword)
?
"block"
:
"none";

});

});

const printBtn = document.getElementById("printGuestBtn");

if (printBtn) {
    printBtn.addEventListener("click", () => {
        window.print();
    });
}

const printWishBtn = document.getElementById("printWishBtn");

if (printWishBtn) {

    printWishBtn.addEventListener("click", () => {

        const printWindow = window.open("", "_blank");

        let html = `
        <html>
        <head>
            <title>Ucapan Tetamu</title>
            <style>
                body{
                    font-family:Arial,sans-serif;
                    padding:30px;
                    line-height:1.6;
                }

                h1{
                    text-align:center;
                    margin-bottom:30px;
                }

                .wish{
                    border-bottom:1px solid #ddd;
                    padding:15px 0;
                }

                h3{
                    margin:0 0 8px;
                }

                p{
                    margin:0;
                }
            </style>
        </head>
        <body>

        <h1>❤️ Ucapan & Doa Tetamu</h1>
        `;

        document.querySelectorAll("#wishList .listCard").forEach(card=>{

            html += `
            <div class="wish">
                ${card.innerHTML}
            </div>
            `;

        });

        html += `
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();

    });

}