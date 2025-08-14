const sheetURL = "https://script.google.com/macros/s/AKfycbz3XdoQ9mtCDi8P2WsZtGo2TEdZFwUeQBLzgtMAvIFPtVmxs8ZxIKWTbN0dgal-BcsW/exec";
const beep = document.getElementById("beep-sound");
let presentCount = 0;
const scannedMembers = new Set();
let isScanning = true;

let memberMap = {};

// Track institutions and their counts
const institutionsPresent = new Set();
const institutionCountMap = {};

fetch('members_map.json')
  .then(res => res.json())
  .then(data => {
    memberMap = data;
    console.log("Member map loaded:", Object.keys(memberMap).length, "members");
  })
  .catch(err => console.error("Error loading member JSON:", err));

function updateTime() {
  const now = new Date();
  document.getElementById("current-time").textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

function updateStats(memberId, name, institution) {
  document.getElementById("scan-status").textContent = `${name} from ${institution}`;
  presentCount++;
  document.getElementById("present-count").textContent = presentCount;

  // --- Institutions Present logic
  institutionsPresent.add(institution);
  document.getElementById("institutions-count").textContent = institutionsPresent.size;

  // --- Most Represented Institution logic
  if (!institutionCountMap[institution]) {
    institutionCountMap[institution] = 0;
  }
  institutionCountMap[institution]++;

  // Find most represented institution
  let mostInstitution = null;
  let mostCount = 0;
  for (const [inst, count] of Object.entries(institutionCountMap)) {
    if (count > mostCount) {
      mostCount = count;
      mostInstitution = inst;
    }
  }
  if (mostInstitution) {
    document.getElementById("most-represented-institution").textContent = `${mostInstitution} (${mostCount})`;
  } else {
    document.getElementById("most-represented-institution").textContent = "N/A";
  }

  // Update recent entries as before
  const row = document.createElement("tr");
  row.innerHTML = `<td>${memberId}</td><td>${name}</td><td>${institution}</td>`;
  const list = document.getElementById("recent-entries-list");
  if (list.children[0] && list.children[0].textContent.includes("No entries")) list.innerHTML = "";
  list.prepend(row);
}

function logMember(memberId) {
  if (scannedMembers.has(memberId)) {
    document.getElementById("scan-status").textContent = "Member present";
    return;
  }

  document.getElementById("scan-status").textContent = "Processing...";

  const memberDetails = memberMap[memberId];
  if (!memberDetails) {
    document.getElementById("scan-status").textContent = "❌ Sorry, this Member ID was not found";
    return;
  }

  scannedMembers.add(memberId);
  const { name, institution } = memberDetails;
  updateStats(memberId, name, institution);

  fetch(`${sheetURL}?memberId=${encodeURIComponent(memberId)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        const scanStatus = document.getElementById("scan-status");
        scanStatus.textContent = `⚠️ ${data.error}`;
        scanStatus.classList.add("error");
      }
    })
    .catch(error => {
      const scanStatus = document.getElementById("scan-status");
      scanStatus.textContent = `❌ Server Error. Please try again.`;
      scanStatus.classList.add("error");
      console.error("Fetch error:", error);
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

function getQrBoxSize() {
  const width = window.innerWidth;
  if (width < 480) return 180;
  if (width < 768) return 220;
  return 250;
}

// Start the scanner
function startScanner() {
  scanner
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: getQrBoxSize() },
      handleScan
    )
    .catch(err => {
      document.getElementById("scan-status").textContent = `Camera error: ${err}`;
    });
}

// Stop and restart the scanner safely
let lastWindowWidth = window.innerWidth;
let resizeTimeout;
window.addEventListener("resize", () => {
  // Only react to significant width changes (to avoid restarts for keyboard popups, etc.)
  const nowWidth = window.innerWidth;
  if (Math.abs(nowWidth - lastWindowWidth) < 40) return;
  lastWindowWidth = nowWidth;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    scanner.stop().then(() => {
      startScanner();
    }).catch(err => console.error("Scanner restart error:", err));
  }, 500);
});

// Start once on load
startScanner();

document.getElementById("manual-entry-form").addEventListener("submit", function(e) {
  e.preventDefault();
  let manualId = document.getElementById("manual-id").value.trim();
  if (!manualId) return;

  if (!manualId.startsWith("ZEH-")) {
    manualId = "ZEH-" + manualId;
  }

  if (scannedMembers.has(manualId)) {
    document.getElementById("scan-status").textContent = "Member present";
  } else {
    beep.currentTime = 0;
    beep.play();
    logMember(manualId);
  }

  document.getElementById("manual-id").value = "";
});