// ===== borrowing.js =====
// Page Borrowing (pandangan pelajar): tab, status buku, renew loan.
// Data di bawah ialah data contoh. Nanti boleh ganti dengan data sebenar dari sistem.

// ---------- LANGKAH 1: Tetapan ----------
// Tarikh demo supaya sama dengan mockup (hari ini = 9 Nov 2026).
// Bila nak guna tarikh sebenar, tukar kepada false.
const USE_DEMO_DATE = true;
const MAX_RENEWALS = 1;      // boleh renew sekali sahaja
const RENEW_DAYS = 7;        // tambah 7 hari
const DUE_SOON_DAYS = 5;     // "Due in X days" bila baki hari <= 5

// ---------- LANGKAH 2: Data contoh ----------
const loans = [
    { id: 1, title: "The River Between",       code: "B001 · C003", borrowed: "2026-10-23", due: "2026-11-06", renewals: 0 },
    { id: 2, title: "A Brief History of Time", code: "B002 · C006", borrowed: "2026-10-30", due: "2026-11-13", renewals: 0 },
    { id: 3, title: "The Little Prince",       code: "B003 · C009", borrowed: "2026-11-06", due: "2026-11-20", renewals: 0 }
];

const returnedBooks = [
    { title: "Laskar Pelangi",    code: "B010 · C001", borrowed: "2026-10-08", returnedOn: "2026-10-22" },
    { title: "Wonder",            code: "B011 · C004", borrowed: "2026-09-24", returnedOn: "2026-10-08" },
    { title: "Hikayat Hang Tuah", code: "B012 · C002", borrowed: "2026-09-10", returnedOn: "2026-09-24" },
    { title: "Matilda",           code: "B013 · C005", borrowed: "2026-08-20", returnedOn: "2026-09-03" }
];

const reservations = []; // kosong dulu

// ---------- LANGKAH 3: Fungsi bantuan untuk tarikh ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getToday() {
    if (USE_DEMO_DATE) {
        return new Date("2026-11-09T00:00:00");
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toDate(text) {
    return new Date(text + "T00:00:00");
}

// "2026-10-23" -> "23 Oct 2026"
function formatDate(text) {
    const d = toDate(text);
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

// Tambah hari pada tarikh teks, pulangkan teks baharu
function addDays(text, days) {
    const d = toDate(text);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

// Berapa hari lagi sampai tarikh (negatif = dah lepas)
function daysUntil(text) {
    return Math.round((toDate(text) - getToday()) / 86400000);
}

function pluralDays(n) {
    return n === 1 ? "1 day" : n + " days";
}

// ---------- LANGKAH 4: Tentukan status pinjaman ----------
function getLoanStatus(loan) {
    const days = daysUntil(loan.due);
    const renewLeft = loan.renewals < MAX_RENEWALS;

    if (days < 0) {
        return { label: "Overdue · " + pluralDays(-days), cls: "overdue", canRenew: false };
    }
    if (days === 0) {
        return { label: "Due today", cls: "soon", canRenew: renewLeft };
    }
    if (days <= DUE_SOON_DAYS) {
        return { label: "Due in " + pluralDays(days), cls: "soon", canRenew: renewLeft };
    }
    return { label: "On loan", cls: "ok", canRenew: renewLeft };
}

// ---------- LANGKAH 5: Ambil elemen HTML ----------
const overdueBanner = document.getElementById("overdueBanner");
const bannerTitle = document.getElementById("bannerTitle");
const bannerText = document.getElementById("bannerText");
const alertBox = document.getElementById("alertBox");

const tabButtons = document.querySelectorAll(".tab");
const tabCurrent = document.getElementById("tabCurrent");
const tabReturned = document.getElementById("tabReturned");
const tabReservations = document.getElementById("tabReservations");

const recordsWrap = document.getElementById("recordsWrap");
const recordsHead = document.getElementById("recordsHead");
const recordsBody = document.getElementById("recordsBody");
const recordsEmpty = document.getElementById("recordsEmpty");
const recordsNote = document.getElementById("recordsNote");
const recentBody = document.getElementById("recentBody");

const slipBtn = document.getElementById("slipBtn");
const fullHistoryBtn = document.getElementById("fullHistoryBtn");

// Tab yang sedang dibuka: "current", "returned" atau "reservations"
let activeTab = "current";
let alertTimer = null;

// ---------- LANGKAH 6: Mesej selepas tindakan ----------
// type = "success" atau "error"
function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = "alert " + type;

    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
        alertBox.className = "alert hidden";
    }, 4000);
}

// ---------- LANGKAH 7: Banner buku lewat ----------
function renderBanner() {
    // Cari buku pertama yang lewat
    const overdueLoan = loans.find(function (loan) {
        return daysUntil(loan.due) < 0;
    });

    if (!overdueLoan) {
        overdueBanner.classList.add("hidden");
        return;
    }

    bannerTitle.textContent = "Please return " + overdueLoan.title;
    bannerText.textContent =
        "It was due on " + formatDate(overdueLoan.due) +
        ". New borrowing is paused until your overdue book has been returned to the library counter.";
    overdueBanner.classList.remove("hidden");
}

// ---------- LANGKAH 8: Bilangan pada tab ----------
function renderTabCounts() {
    tabCurrent.textContent = "(" + loans.length + ")";
    tabReturned.textContent = "(" + returnedBooks.length + ")";
    tabReservations.textContent = "(" + reservations.length + ")";
}

// Satu sel "Book / copy" (tajuk + kod)
function bookCell(title, code) {
    return '<td><span class="book-title">' + title + '</span><span class="book-code">' + code + "</span></td>";
}

// ---------- LANGKAH 9: Papar jadual ikut tab ----------
function renderCurrentLoans() {
    recordsHead.innerHTML =
        "<tr><th>Book / copy</th><th>Borrowed on</th><th>Return by</th><th>Status</th><th>Renewal</th><th>Action</th></tr>";

    let rows = "";
    loans.forEach(function (loan) {
        const status = getLoanStatus(loan);

        let actionHTML = '<button type="button" class="btn-small" disabled>Cannot renew</button>';
        if (status.canRenew) {
            actionHTML = '<button type="button" class="btn-small renew-btn" data-id="' + loan.id + '">Renew loan</button>';
        }

        rows +=
            "<tr>" +
            bookCell(loan.title, loan.code) +
            "<td>" + formatDate(loan.borrowed) + "</td>" +
            "<td>" + formatDate(loan.due) + "</td>" +
            '<td><span class="pill ' + status.cls + '">' + status.label + "</span></td>" +
            "<td>" + loan.renewals + " of " + MAX_RENEWALS + " used</td>" +
            "<td>" + actionHTML + "</td>" +
            "</tr>";
    });

    recordsBody.innerHTML = rows;
    recordsNote.classList.remove("hidden");
}

function renderReturned() {
    recordsHead.innerHTML =
        "<tr><th>Book / copy</th><th>Borrowed on</th><th>Returned on</th><th>Status</th></tr>";

    let rows = "";
    returnedBooks.forEach(function (book) {
        rows +=
            "<tr>" +
            bookCell(book.title, book.code) +
            "<td>" + formatDate(book.borrowed) + "</td>" +
            "<td>" + formatDate(book.returnedOn) + "</td>" +
            '<td><span class="pill returned">Returned</span></td>' +
            "</tr>";
    });

    recordsBody.innerHTML = rows;
    recordsNote.classList.add("hidden");
}

function renderRecords() {
    // Reservations kosong -> tunjuk mesej sahaja
    if (activeTab === "reservations") {
        recordsWrap.classList.add("hidden");
        recordsEmpty.classList.remove("hidden");
        recordsNote.classList.add("hidden");
        return;
    }

    recordsWrap.classList.remove("hidden");
    recordsEmpty.classList.add("hidden");

    if (activeTab === "current") {
        renderCurrentLoans();
    } else {
        renderReturned();
    }
}

// ---------- LANGKAH 10: Kad "Recently Returned" (2 terkini) ----------
function renderRecent() {
    // Salin senarai, susun dari tarikh terbaru, ambil 2
    const latest = returnedBooks
        .slice()
        .sort(function (a, b) {
            return toDate(b.returnedOn) - toDate(a.returnedOn);
        })
        .slice(0, 2);

    let rows = "";
    latest.forEach(function (book) {
        rows +=
            "<tr>" +
            '<td><span class="book-title">' + book.title + "</span></td>" +
            "<td>" + formatDate(book.returnedOn) + "</td>" +
            '<td><span class="pill returned">Returned</span></td>' +
            "</tr>";
    });
    recentBody.innerHTML = rows;
}

// ---------- LANGKAH 11: Tukar tab ----------
function setTab(name) {
    activeTab = name;

    tabButtons.forEach(function (button) {
        const isActive = button.dataset.tab === name;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    renderRecords();
}

tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        setTab(button.dataset.tab);
    });
});

fullHistoryBtn.addEventListener("click", function () {
    setTab("returned");
});

// ---------- LANGKAH 12: Butang "Renew loan" ----------
// Butang dibuat oleh JavaScript, jadi kita dengar klik pada tbody
recordsBody.addEventListener("click", function (event) {
    if (!event.target.classList.contains("renew-btn")) {
        return;
    }

    const loanId = Number(event.target.dataset.id);
    const loan = loans.find(function (item) {
        return item.id === loanId;
    });

    if (!loan || !getLoanStatus(loan).canRenew) {
        showAlert("This loan cannot be renewed.", "error");
        return;
    }

    loan.due = addDays(loan.due, RENEW_DAYS); // tambah 7 hari
    loan.renewals++;                          // tanda dah guna 1 renew

    refresh();
    showAlert(loan.title + " renewed. New return date: " + formatDate(loan.due) + ".", "success");
});

// ---------- LANGKAH 13: Butang "Download loan slip" ----------
// Cara paling mudah: buka dialog print (boleh pilih "Save as PDF")
slipBtn.addEventListener("click", function () {
    window.print();
});

// ---------- LANGKAH 14: Mula ----------
function refresh() {
    renderBanner();
    renderTabCounts();
    renderRecords();
    renderRecent();
}

refresh();