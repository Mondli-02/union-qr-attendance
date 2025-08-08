const sheetURL = "https://script.google.com/macros/s/AKfycbz3XdoQ9mtCDi8P2WsZtGo2TEdZFwUeQBLzgtMAvIFPtVmxs8ZxIKWTbN0dgal-BcsW/exec";
const beep = document.getElementById("beep-sound");
let presentCount = 0;
const scannedMembers = new Set();
let isScanning = true;

function updateTime() {
  const now = new Date();
  document.getElementById("current-time").textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

function updateStats(memberId, name, institution) {
  const now = new Date();
  const time = now.toLocaleTimeString();
  document.getElementById("last-scan").textContent = time;
  document.getElementById("scan-status").textContent = `${name} from ${institution}`;
  presentCount++;
  document.getElementById("present-count").textContent = presentCount;
  const total = parseInt(document.getElementById("total-count").textContent);
  document.getElementById("attendance-rate").textContent = `${Math.round((presentCount / total) * 100)}%`;

  const row = document.createElement("tr");
  row.innerHTML = `<td>${memberId}</td><td>${name}</td><td>${institution}</td><td>${time}</td>`;
  const list = document.getElementById("recent-entries-list");
  if (list.children[0].textContent.includes("No entries")) list.innerHTML = "";
  list.prepend(row);
}

function logMember(memberId) {
  if (scannedMembers.has(memberId)) {
    document.getElementById("scan-status").textContent = "Already scanned";
    return;
  }

  document.getElementById("scan-status").textContent = "Processing...";

  fetch(`${sheetURL}?memberId=${encodeURIComponent(memberId)}`)
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      const scanStatus = document.getElementById("scan-status");

      if (data.error) {
        if (data.error === "Member already logged today") {
          scanStatus.textContent = "⚠️ Member already logged today.";
        } else if (data.error === "Member not found") {
          scanStatus.textContent = "❌ Member ID not found.";
        } else {
          scanStatus.textContent = `⚠️ ${data.error}`;
        }
        scanStatus.classList.add("error");
        return;
      }

      scannedMembers.add(memberId);
      scanStatus.textContent = `${data.name} from ${data.institution}`;
      scanStatus.classList.remove("error");
      updateStats(data.memberId, data.name, data.institution);
    })
    .catch((error) => {
      const scanStatus = document.getElementById("scan-status");
      scanStatus.textContent = `❌ Server Error. Please try again.`;
      scanStatus.classList.add("error");
      console.error("Fetch error:", error);

      setTimeout(() => {
        isScanning = true;
      }, 1500);
    });
}

function handleScan(qrCodeMessage) {
  if (!isScanning) return;
  isScanning = false;

  beep.currentTime = 0;
  beep.play();
  logMember(qrCodeMessage);

  setTimeout(() => {
    isScanning = true;
  }, 1500);
}

const scanner = new Html5Qrcode("reader");
scanner
  .start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, handleScan)
  .catch((err) => {
    document.getElementById("scan-status").textContent = `Camera error: ${err}`;
  });

document.getElementById("manual-entry-form").addEventListener("submit", function (e) {
  e.preventDefault();
  let manualId = document.getElementById("manual-id").value.trim();
  if (!manualId) return;

  if (!manualId.startsWith("ZEH-")) {
    manualId = "ZEH-" + manualId;
  }

  if (scannedMembers.has(manualId)) {
    document.getElementById("scan-status").textContent = "Already scanned";
  } else {
    beep.currentTime = 0;
    beep.play();
    logMember(manualId);
  }

  document.getElementById("manual-id").value = "";
});
