const TIME_SLOTS = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "14:00 - 15:00",
    "15:00 - 16:00"
];

let facilities = [
    { id: "F1", name: "Discussion Room 1", status: "Available" },
    { id: "F2", name: "Audio-Visual Room", status: "Available" },
    { id: "F3", name: "PC Terminal A", status: "Available" },
    { id: "F4", name: "NILAM Reading Room", status: "Maintenance" }
];

const today = new Date().toISOString().split("T")[0];

let bookings = [
    {
        id: "B1",
        facilityId: "F1",
        role: "STUDENT",
        user: "Student User",
        date: today,
        slot: "09:00 - 10:00",
        purpose: "Group Study",
        status: "Active"
    },
    {
        id: "B2",
        facilityId: "F1",
        role: "TEACHER",
        user: "Teacher User",
        date: today,
        slot: "11:00 - 12:00",
        purpose: "Class Briefing",
        status: "Active"
    }
];

const roleSelect = document.getElementById("roleSelect");
const facilitySelect = document.getElementById("facilitySelect");
const dateInput = document.getElementById("dateInput");
const slotSelect = document.getElementById("slotSelect");
const purposeInput = document.getElementById("purposeInput");
const bookingForm = document.getElementById("bookingForm");
const editId = document.getElementById("editId");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formHeading = document.getElementById("formHeading");
const alertBox = document.getElementById("alertBox");
const slotGrid = document.getElementById("slotGrid");
const scheduleSubtitle = document.getElementById("scheduleSubtitle");
const bookingsBody = document.getElementById("bookingsBody");
const tableHeading = document.getElementById("tableHeading");
const gpmPanel = document.getElementById("gpmPanel");
const facilityStatusList = document.getElementById("facilityStatusList");

function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    setTimeout(() => {
        alertBox.className = "alert";
    }, 4000);
}

function renderSelects() {
    const selectedFac = facilitySelect.value;
    facilitySelect.innerHTML = facilities.map(f =>
        `<option value="${f.id}">${f.name} (${f.status})</option>`
    ).join("");
    if (selectedFac) facilitySelect.value = selectedFac;

    slotSelect.innerHTML = TIME_SLOTS.map(s =>
        `<option value="${s}">${s}</option>`
    ).join("");
}

function renderSlots() {
    const facId = facilitySelect.value;
    const date = dateInput.value;
    const fac = facilities.find(f => f.id === facId);

    scheduleSubtitle.textContent = `${fac.name} — ${date} (click a green slot to select)`;
    slotGrid.innerHTML = "";

    TIME_SLOTS.forEach(slot => {
        const box = document.createElement("div");
        const isBooked = bookings.some(b =>
            b.facilityId === facId &&
            b.date === date &&
            b.slot === slot &&
            b.status === "Active"
        );

        if (fac.status !== "Available") {
            box.className = "slot-item slot-closed";
            box.innerHTML = `<strong>${slot}</strong><br>Maintenance`;
        } else if (isBooked) {
            box.className = "slot-item slot-booked";
            box.innerHTML = `<strong>${slot}</strong><br>Booked`;
        } else {
            box.className = "slot-item slot-available";
            box.innerHTML = `<strong>${slot}</strong><br>Available`;
            box.onclick = () => {
                slotSelect.value = slot;
            };
        }

        slotGrid.appendChild(box);
    });
}

function renderBookings() {
    const currentRole = roleSelect.value;
    tableHeading.textContent = currentRole === "GPM" ? "All Facility Bookings" : "My Bookings";

    const rows = currentRole === "GPM"
        ? bookings
        : bookings.filter(b => b.role === currentRole);

    if (rows.length === 0) {
        bookingsBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No bookings found.</td></tr>`;
        return;
    }

    bookingsBody.innerHTML = rows.map(b => {
        const fac = facilities.find(f => f.id === b.facilityId);
        const canEdit = b.status === "Active" && (b.role === currentRole || currentRole === "GPM");

        return `
            <tr>
                <td><strong>${fac ? fac.name : b.facilityId}</strong><br><span class="muted">${b.purpose}</span></td>
                <td>${b.date}<br>${b.slot}</td>
                <td>${b.user}</td>
                <td><span class="status-badge ${b.status === "Active" ? "status-active" : "status-cancelled"}">${b.status}</span></td>
                <td>
                    ${canEdit ? `
                        <button class="btn-sm" onclick="editBooking('${b.id}')">Reschedule</button>
                        <button class="btn-sm btn-danger" onclick="cancelBooking('${b.id}')">Cancel</button>
                    ` : "-"}
                </td>
            </tr>
        `;
    }).join("");
}

function renderGpmPanel() {
    if (roleSelect.value !== "GPM") {
        gpmPanel.classList.add("hidden");
        return;
    }
    gpmPanel.classList.remove("hidden");

    facilityStatusList.innerHTML = facilities.map(f => `
        <div class="admin-row">
            <span><strong>${f.name}</strong> — ${f.status}</span>
            <button class="btn-sm" onclick="toggleStatus('${f.id}')">
                ${f.status === "Available" ? "Set Maintenance" : "Set Available"}
            </button>
        </div>
    `).join("");
}

window.toggleStatus = function(facId) {
    if (roleSelect.value !== "GPM") return;
    const fac = facilities.find(f => f.id === facId);
    fac.status = fac.status === "Available" ? "Maintenance" : "Available";
    showAlert(`${fac.name} is now ${fac.status}.`, "success");
    refresh();
};

bookingForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const currentRole = roleSelect.value;
    const facId = facilitySelect.value;
    const date = dateInput.value;
    const slot = slotSelect.value;
    const purpose = purposeInput.value.trim();
    const editingId = editId.value;

    const fac = facilities.find(f => f.id === facId);
    if (fac.status !== "Available") {
        showAlert("Cannot book: this facility is currently under maintenance.", "error");
        return;
    }

    const overlap = bookings.some(b =>
        b.id !== editingId &&
        b.facilityId === facId &&
        b.date === date &&
        b.slot === slot &&
        b.status === "Active"
    );

    if (overlap) {
        showAlert(`Slot conflict: ${fac.name} is already booked for ${date} (${slot}).`, "error");
        return;
    }

    if (editingId) {
        const target = bookings.find(b => b.id === editingId);
        target.facilityId = facId;
        target.date = date;
        target.slot = slot;
        target.purpose = purpose;
        showAlert("Booking updated successfully.", "success");
        resetForm();
    } else {
        const labelMap = {
            STUDENT: "Student User",
            TEACHER: "Teacher User",
            GPM: "Admin / GPM"
        };
        bookings.push({
            id: "B" + Date.now(),
            facilityId: facId,
            role: currentRole,
            user: labelMap[currentRole],
            date: date,
            slot: slot,
            purpose: purpose,
            status: "Active"
        });
        showAlert("Facility slot reserved!", "success");
        purposeInput.value = "";
    }

    refresh();
});

window.editBooking = function(id) {
    const b = bookings.find(item => item.id === id);
    if (!b) return;
    editId.value = b.id;
    facilitySelect.value = b.facilityId;
    dateInput.value = b.date;
    slotSelect.value = b.slot;
    purposeInput.value = b.purpose;
    formHeading.textContent = "Reschedule Booking";
    submitBtn.textContent = "Update Booking";
    cancelEditBtn.classList.remove("hidden");
    refresh();
};

window.cancelBooking = function(id) {
    const b = bookings.find(item => item.id === id);
    if (!b) return;
    if (b.role !== roleSelect.value && roleSelect.value !== "GPM") {
        showAlert("You do not have permission to cancel this booking.", "error");
        return;
    }
    b.status = "Cancelled";
    showAlert("Booking cancelled and slot released.", "success");
    refresh();
};

function resetForm() {
    editId.value = "";
    formHeading.textContent = "Book a Facility";
    submitBtn.textContent = "Reserve Slot";
    cancelEditBtn.classList.add("hidden");
    purposeInput.value = "";
}

cancelEditBtn.addEventListener("click", resetForm);

function refresh() {
    renderSelects();
    renderSlots();
    renderBookings();
    renderGpmPanel();
}

dateInput.value = today;
dateInput.min = today;

facilitySelect.addEventListener("change", renderSlots);
dateInput.addEventListener("change", renderSlots);
roleSelect.addEventListener("change", () => {
    resetForm();
    refresh();
});

refresh();
