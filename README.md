# ReachOwl Background Bridge Extension (Headless)

Ekstensi ini bertindak sebagai **background worker otomatis (tanpa tombol dan tanpa form login)** untuk aplikasi ReachOwl.

---

## ⚡ Cara Kerja Headless Extension:
1. **100% Otomatis**: Anda tidak perlu membuka popup atau menekan tombol apa pun di ekstensi.
2. **Koneksi Langsung dari Web**: Seluruh aksi dan tombol **Connect** ditekan langsung dari tabel aplikasi ReachOwl (http://localhost:3000/browsers).
3. **Pendeteksian Cookie Realtime**:
   - Begitu tab ReachOwl dibuka atau tombol Connect ditekan, ekstensi otomatis memeriksa cookie c_user (Facebook) dan ds_user_id (Instagram) di browser.
   - Status dan ID akun langsung dikirimkan ke aplikasi web ReachOwl.
   - Aplikasi ReachOwl langsung menyimpan dan mengupdate data tersebut ke database **Supabase**.
4. **Auto-Login Detection**:
   - Jika Facebook/Instagram belum login di browser saat Anda klik Connect di web app, browser akan membuka tab login Facebook/Instagram.
   - Begitu Anda selesai login di tab tersebut, ekstensi otomatis mendeteksi cookie baru dan tombol di web app langsung berubah menjadi **Connected** warna hijau.

---

## 🛠️ Cara Memasang di Chrome / Edge
1. Buka chrome://extensions/
2. Aktifkan **Developer mode** di kanan atas.
3. Klik **Load unpacked**.
4. Pilih folder:
   `	ext
   D:\reachowlextension
   `
