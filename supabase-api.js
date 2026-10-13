import { CONFIG } from "./config.js";

/**
 * Login user ke Supabase via Auth REST API
 */
export async function signIn(email, password) {
  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": CONFIG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error_description || data.msg || data.message || "Gagal masuk. Periksa email dan sandi.";
      return { success: false, error: msg };
    }

    const session = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    // Simpan ke storage lokal ekstensi
    await chrome.storage.local.set({ reachowl_session: session });
    return { success: true, user: session.user };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Tidak dapat terhubung ke server Supabase.",
    };
  }
}

/**
 * Logout dari ekstensi
 */
export async function signOut() {
  await chrome.storage.local.remove(["reachowl_session"]);
  return { success: true };
}

/**
 * Ambil sesi user saat ini dari chrome.storage.local
 */
export async function getSession() {
  const result = await chrome.storage.local.get(["reachowl_session"]);
  return result.reachowl_session || null;
}

/**
 * Simpan atau perbarui akun sosial (Facebook / Instagram) langsung ke tabel Supabase
 */
export async function syncSocialAccountToSupabase(session, account) {
  if (!session || !session.accessToken) {
    console.warn("User belum login di ekstensi, data belum dapat dikirim ke Supabase.");
    return { success: false, error: "Not authenticated" };
  }

  const { platform, isLoggedIn, accountId, name, lastLoggedIn } = account;

  const headers = {
    "apikey": CONFIG.SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  try {
    // 1. Cek apakah row untuk platform ini sudah ada di tabel browser_social_accounts
    const checkRes = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/browser_social_accounts?platform=eq.${encodeURIComponent(platform)}&select=id`,
      { headers }
    );

    const existing = await checkRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      // 2. Update baris yang sudah ada
      const recordId = existing[0].id;
      const updatePayload = {
        is_connected: Boolean(isLoggedIn),
        updated_at: new Date().toISOString(),
        user_id: session.user.id,
      };

      if (isLoggedIn) {
        updatePayload.last_logged_in = lastLoggedIn || new Date().toISOString();
        if (accountId) updatePayload.account_id = accountId;
        if (name && !name.startsWith("Akun ")) updatePayload.name = name;
      }

      const updateRes = await fetch(
        `${CONFIG.SUPABASE_URL}/rest/v1/browser_social_accounts?id=eq.${recordId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(updatePayload),
        }
      );

      return { success: updateRes.ok, action: "updated" };
    } else {
      // 3. Masukkan baris baru
      const insertPayload = {
        user_id: session.user.id,
        platform: platform,
        name: name || `Akun ${platform}`,
        is_connected: Boolean(isLoggedIn),
        last_logged_in: isLoggedIn ? lastLoggedIn || new Date().toISOString() : null,
        account_id: accountId || null,
        is_primary: false,
        min_interval_seconds: 30,
        max_interval_seconds: 60,
        warmup_active: true,
      };

      const insertRes = await fetch(
        `${CONFIG.SUPABASE_URL}/rest/v1/browser_social_accounts`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(insertPayload),
        }
      );

      return { success: insertRes.ok, action: "inserted" };
    }
  } catch (err) {
    console.error(`Gagal menyimpan ${platform} ke Supabase:`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
