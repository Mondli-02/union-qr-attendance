const sheetURL = "https://script.google.com/macros/s/AKfycbz3XdoQ9mtCDi8P2WsZtGo2TEdZFwUeQBLzgtMAvIFPtVmxs8ZxIKWTbN0dgal-BcsW/exec";
const beep = document.getElementById("beep-sound");
let presentCount = 0;
const scannedMembers = new Set();
let isScanning = true;

let memberMap = {};

// Load Map-style JSON on page load
fetch('members_map.json') // ensure this file is in your repo
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

  // Lookup member in the JSON first
  const memberDetails = memberMap[memberId];

  if (!memberDetails) {
    document.getElementById("scan-status").textContent = "❌ Member ID not found in JSON";
    return;
  }

  scannedMembers.add(memberId);
  const { name, institution } = memberDetails;
  document.getElementById("scan-status").textContent = `${name} from ${institution}`;
  updateStats(memberId, name, institution);

  // Continue logging to Google Sheet
  fetch(`${sheetURL}?memberId=${encodeURIComponent(memberId)}`)
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      if (data.error) {
        const scanStatus = document.getElementById("scan-status");
        if (data.error === "Member already logged today") {
          scanStatus.textContent = "⚠️ Member already logged today.";
        } else {
          scanStatus.textContent = `⚠️ ${data.error}`;
        }
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
scanner
  .start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, handleScan)
  .catch(err => {
    document.getElementById("scan-status").textContent = `Camera error: ${err}`;
  });

document.getElementById("manual-entry-form").addEventListener("submit", function(e) {
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
