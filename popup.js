import { signIn, signOut, getSession } from "./supabase-api.js";
import { CONFIG } from "./config.js";

const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btn-login");
const authError = document.getElementById("auth-error");
const userEmailDisplay = document.getElementById("user-email-display");
const btnLogout = document.getElementById("btn-logout");
const btnSyncNow = document.getElementById("btn-sync-now");
const linkOpenReachOwl = document.getElementById("link-open-reachowl");
const statusTag = document.getElementById("status-tag");

// Facebook DOM
const fbIdText = document.getElementById("fb-id-text");
const fbStatusBadge = document.getElementById("fb-status-badge");
const fbStatusLabel = document.getElementById("fb-status-label");

// Instagram DOM
const igIdText = document.getElementById("ig-id-text");
const igStatusBadge = document.getElementById("ig-status-badge");
const igStatusLabel = document.getElementById("ig-status-label");

function renderAccountsUI(accounts) {
  const fb = accounts.find((a) => a.platform === "Facebook") || { isLoggedIn: false };
  const ig = accounts.find((a) => a.platform === "Instagram") || { isLoggedIn: false };

  // Facebook
  if (fb.isLoggedIn) {
    fbStatusBadge.className = "status-badge-live online";
    fbStatusLabel.textContent = "Login";
    fbIdText.textContent = `ID: ${fb.accountId || "-"} • Tersimpan di Supabase`;
  } else {
    fbStatusBadge.className = "status-badge-live offline";
    fbStatusLabel.textContent = "Belum Login";
    fbIdText.textContent = "Tidak ada sesi aktif";
  }

  // Instagram
  if (ig.isLoggedIn) {
    igStatusBadge.className = "status-badge-live online";
    igStatusLabel.textContent = "Login";
    igIdText.textContent = `ID: ${ig.accountId || "-"} • Tersimpan di Supabase`;
  } else {
    igStatusBadge.className = "status-badge-live offline";
    igStatusLabel.textContent = "Belum Login";
    igIdText.textContent = "Tidak ada sesi aktif";
  }
}

async function checkCurrentState() {
  const session = await getSession();

  if (session && session.user) {
    // Tampilkan Dashboard
    authSection.style.display = "none";
    dashboardSection.style.display = "flex";
    userEmailDisplay.textContent = session.user.email;
    statusTag.textContent = "Online";
    statusTag.style.background = "#059669";

    // Minta data status dari background
    chrome.runtime.sendMessage({ type: "REACHOWL_GET_STATUS" }, (response) => {
      if (response && response.accounts) {
        renderAccountsUI(response.accounts);
      }
    });
  } else {
    // Tampilkan Form Login
    authSection.style.display = "flex";
    dashboardSection.style.display = "none";
    statusTag.textContent = "Login Req";
    statusTag.style.background = "#E2683C";
  }
}

// Handler Submit Login Form
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.style.display = "none";

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) return;

  btnLogin.disabled = true;
  btnLogin.firstElementChild.textContent = "Memverifikasi...";

  const res = await signIn(email, password);

  btnLogin.disabled = false;
  btnLogin.firstElementChild.textContent = "Masuk ke ReachOwl";

  if (res.success) {
    // Login berhasil, lakukan scan otomatis & simpan ke Supabase
    chrome.runtime.sendMessage({ type: "REACHOWL_TRIGGER_SCAN" }, (scanRes) => {
      checkCurrentState();
      if (scanRes && scanRes.accounts) {
        renderAccountsUI(scanRes.accounts);
      }
    });
  } else {
    authError.textContent = res.error || "Gagal masuk. Periksa email atau kata sandi Anda.";
    authError.style.display = "block";
  }
});

// Handler Logout
btnLogout.addEventListener("click", async () => {
  await signOut();
  checkCurrentState();
});

// Handler Pindai Sekarang
btnSyncNow.addEventListener("click", () => {
  btnSyncNow.disabled = true;
  btnSyncNow.textContent = "Memindai & Menyimpan ke Supabase...";

  chrome.runtime.sendMessage({ type: "REACHOWL_TRIGGER_SCAN" }, (response) => {
    btnSyncNow.disabled = false;
    btnSyncNow.textContent = "Pindai & Simpan ke Supabase Sekarang";
    if (response && response.accounts) {
      renderAccountsUI(response.accounts);
    }
  });
});

// Buka Halaman Browsers
linkOpenReachOwl.addEventListener("click", () => {
  chrome.tabs.create({ url: `${CONFIG.APP_URL}/browsers` });
});

// Inisialisasi saat popup dibuka
checkCurrentState();
