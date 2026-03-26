// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDMo-hfBNigTyFQ8hWO9nJXp0_pDNyjR2M",
  databaseURL: "https://smart-garden-603ff-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// ================= CHART =================
const ctx = document.getElementById('moistureChart').getContext('2d');

const moistureChart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [0, 100],
      backgroundColor: ['green', '#eee']
    }]
  },
  options: {
    cutout: '70%',
    plugins: {
      legend: { display: false }
    }
  }
});

// ================= DOM =================
// STATUS
const moistureEl = document.getElementById('moisture');
const modeEl = document.getElementById('mode');
const pumpEl = document.getElementById('pump');
const stateEl = document.getElementById('state');
const statusEl = document.getElementById('status');
const minEl = document.getElementById('minM');
const maxEl = document.getElementById('maxM');

// TAB
const tabControl = document.getElementById('tabControl');
const tabPlant = document.getElementById('tabPlant');
const controlContent = document.getElementById('controlContent');
const plantContent = document.getElementById('plantContent');

// CONTROL
const autoBtn = document.getElementById('autoBtn');
const manualBtn = document.getElementById('manualBtn');
const pumpOnBtn = document.getElementById('pumpOn');
const pumpOffBtn = document.getElementById('pumpOff');
const pumpBox = document.getElementById('pumpControlBox');

// PLANT
const type = document.getElementById('type');
const leaf = document.getElementById('leaf');
const root = document.getElementById('root');
const stage = document.getElementById('stage');
const calcBtn = document.getElementById('calcBtn');
const saveBtn = document.getElementById('saveBtn');
const resultEl = document.getElementById('result');


// ================= TAB SWITCH =================
tabControl.onclick = () => {
  controlContent.classList.remove('hidden');
  plantContent.classList.add('hidden');

  tabControl.classList.add('active');
  tabPlant.classList.remove('active');
};

tabPlant.onclick = () => {
  plantContent.classList.remove('hidden');
  controlContent.classList.add('hidden');

  tabPlant.classList.add('active');
  tabControl.classList.remove('active');
};


// ================= REALTIME SENSOR =================
db.ref('sensor/moisture_percent').on('value', snap => {
  let val = snap.val() ?? 0;
  val = Math.max(0, Math.min(100, val));

  moistureEl.innerText = val + "%";

  // ===== LẤY CONFIG =====
  let min = parseInt(minEl.innerText) || 40;
  let max = parseInt(maxEl.innerText) || 70;

  // ===== MÀU =====
  let color = "green";

  if (val < min) color = "orange";   // DRY
  else if (val > max) color = "blue"; // WET

  // ===== UPDATE CHART =====
  moistureChart.data.datasets[0].data = [val, 100 - val];
  moistureChart.data.datasets[0].backgroundColor = [color, "#eee"];
  moistureChart.update();

  // ===== TEXT COLOR =====
  moistureEl.style.color = color;
});


// ================= SYSTEM STATUS =================
db.ref('system').on('value', snap => {
  const d = snap.val() || {};

  // Pump
  pumpEl.innerText = d.pump_state ? "ON" : "OFF";
  pumpEl.style.color = d.pump_state ? "green" : "gray";

  // Status
  statusEl.innerText = d.status || "OK";

  if (d.status === "ERROR") {
    statusEl.style.color = "red";
  } else if (d.status?.includes("MANUALTOAUTO")) {
    statusEl.style.color = "orange";
  } else {
    statusEl.style.color = "green";
  }

  // State (nếu ESP có gửi)
  stateEl.innerText = d.state || "IDLE";
});


// ================= MODE =================
db.ref('control/manual').on('value', snap => {
  const isManual = snap.val() || false;

  modeEl.innerText = isManual ? "MANUAL" : "AUTO";
  modeEl.style.color = isManual ? "orange" : "green";

  // 🔥 ẨN/HIỆN PUMP CONTROL
  pumpBox.style.display = isManual ? "block" : "none";
});


// ================= CONFIG =================
db.ref('config').on('value', snap => {
  const d = snap.val() || {};

  minEl.innerText = d.minMoisture ?? "--";
  maxEl.innerText = d.maxMoisture ?? "--";
});


// ================= CONTROL BUTTON =================
autoBtn.onclick = () => {
  db.ref('control/manual').set(false);
};

manualBtn.onclick = () => {
  db.ref('control/manual').set(true);
};

pumpOnBtn.onclick = () => {
  db.ref('control/pump').set(true);
};

pumpOffBtn.onclick = () => {
  db.ref('control/pump').set(false);
};


// ================= PLANT CALC =================
let minM = 40;
let maxM = 70;

calcBtn.onclick = () => {
  const base = parseFloat(type.value);
  const leafVal = parseFloat(leaf.value);
  const rootVal = parseFloat(root.value);
  const stageVal = parseFloat(stage.value);

  // công thức chuẩn theo bạn
  const kc = (base + leafVal) * stageVal;

  minM = Math.round(30 + kc * 20 + rootVal);
  maxM = minM + 25;

  resultEl.innerText = `Min: ${minM}% | Max: ${maxM}%`;
};


// ================= SAVE CONFIG =================
saveBtn.onclick = () => {
  db.ref('config').set({
    minMoisture: minM,
    maxMoisture: maxM
  });

  resultEl.innerText = "✅ Saved!";
};


// ================= SYNC INIT =================
// đảm bảo UI đúng ngay khi load
window.onload = () => {
  plantContent.classList.add('hidden');
};