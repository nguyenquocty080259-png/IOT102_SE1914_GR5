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
    plugins: { legend: { display: false } }
  }
});


// ================= DOM =================
const moistureEl = document.getElementById('moisture');
const modeEl = document.getElementById('mode');
const pumpEl = document.getElementById('pump');
const stateEl = document.getElementById('state');
const statusEl = document.getElementById('status');

const minEl = document.getElementById('minM');
const maxEl = document.getElementById('maxM');

const tabControl = document.getElementById('tabControl');
const tabPlant = document.getElementById('tabPlant');
const controlContent = document.getElementById('controlContent');
const plantContent = document.getElementById('plantContent');

const autoBtn = document.getElementById('autoBtn');
const manualBtn = document.getElementById('manualBtn');
const pumpOnBtn = document.getElementById('pumpOn');
const pumpOffBtn = document.getElementById('pumpOff');
const pumpBox = document.getElementById('pumpControlBox');

const type = document.getElementById('type');
const leaf = document.getElementById('leaf');
const root = document.getElementById('root');
const stage = document.getElementById('stage');
const calcBtn = document.getElementById('calcBtn');
const saveBtn = document.getElementById('saveBtn');
const resultEl = document.getElementById('result');

const alarmBox = document.getElementById('alarmBox');


// ================= SOUND =================
const sound = new Audio("https://tiengdong.com/tieng-coi-canh-bao?utm_source=copylink&utm_medium=share_button&utm_campaign=shared_from_tiengdong.com&utm_content=vi-20h29-29-03-2026");
sound.loop = true;

let soundEnabled = false;

// 🔓 AUTO UNLOCK bằng click bất kỳ
function unlockSound() {
  if (soundEnabled) return;

  sound.play().then(() => {
    sound.pause();
    sound.currentTime = 0;
    soundEnabled = true;
    console.log("🔓 Sound unlocked");
  }).catch(() => {
    console.log("❌ Unlock failed");
  });
}

document.addEventListener('click', unlockSound, { once: true });
document.addEventListener('touchstart', unlockSound, { once: true });


// ================= ALARM =================
let alarmActive = false;
let alarmTimeout = null;

function startAlarm() {
  if (alarmActive) return;

  alarmActive = true;

  alarmBox.classList.remove('hidden');
  document.body.classList.add('alarm-bg');

  if (soundEnabled) {
    sound.play().catch(() => {});
  } else {
    console.log("⚠️ Sound chưa unlock");
  }
}

function stopAlarm() {
  alarmActive = false;

  alarmBox.classList.add('hidden');
  document.body.classList.remove('alarm-bg');

  sound.pause();
  sound.currentTime = 0;
}


// ================= TAB =================
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


// ================= PLANT CALC =================
let minM = 40;
let maxM = 70;

calcBtn.onclick = () => {
  const base = parseFloat(type.value);
  const leafVal = parseFloat(leaf.value);
  const rootVal = parseFloat(root.value);
  const stageVal = parseFloat(stage.value);

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


// ================= CONTROL =================
autoBtn.onclick = () => db.ref('control/manual').set(false);
manualBtn.onclick = () => db.ref('control/manual').set(true);
pumpOnBtn.onclick = () => db.ref('control/pump').set(true);
pumpOffBtn.onclick = () => db.ref('control/pump').set(false);


// ================= SENSOR =================
db.ref('sensor/moisture_percent').on('value', snap => {
  let val = snap.val() ?? 0;
  val = Math.max(0, Math.min(100, val));

  moistureEl.innerText = val + "%";

  const min = parseInt(minEl.innerText) || 40;
  const max = parseInt(maxEl.innerText) || 70;

  let color = "green";
  if (val < min) color = "orange";
  else if (val > max) color = "blue";

  moistureChart.data.datasets[0].data = [val, 100 - val];
  moistureChart.data.datasets[0].backgroundColor = [color, "#eee"];
  moistureChart.update();

  moistureEl.style.color = color;
});


// ================= SYSTEM =================
db.ref('system').on('value', snap => {
  const d = snap.val() || {};

  pumpEl.innerText = d.pump_state ? "ON" : "OFF";
  pumpEl.style.color = d.pump_state ? "green" : "gray";

  statusEl.innerText = d.status || "OK";

  if (d.status === "ERROR") {
    statusEl.style.color = "red";

    // ⏱ delay 3s chống báo giả
    if (!alarmTimeout && !alarmActive) {
      alarmTimeout = setTimeout(() => {
        startAlarm();
      }, 3000);
    }

  } else {
    statusEl.style.color = "green";

    // clear delay
    if (alarmTimeout) {
      clearTimeout(alarmTimeout);
      alarmTimeout = null;
    }

    // tắt alarm
    if (alarmActive) {
      stopAlarm();
    }
  }

  stateEl.innerText = d.state || "IDLE";
});


// ================= MODE =================
db.ref('control/manual').on('value', snap => {
  const isManual = snap.val() || false;

  modeEl.innerText = isManual ? "MANUAL" : "AUTO";
  modeEl.style.color = isManual ? "orange" : "green";

  pumpBox.style.display = isManual ? "block" : "none";

  autoBtn.disabled = !isManual;
  manualBtn.disabled = isManual;
});


// ================= CONFIG =================
db.ref('config').on('value', snap => {
  const d = snap.val() || {};
  minEl.innerText = d.minMoisture ?? "--";
  maxEl.innerText = d.maxMoisture ?? "--";
});


// ================= INIT =================
window.onload = () => {
  plantContent.classList.add('hidden');
};
