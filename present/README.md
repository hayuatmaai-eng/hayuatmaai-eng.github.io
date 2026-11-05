# Kinetic Deck

Presentasi HTML beranimasi yang disinkronkan dari presenter ke audiens. Animasi dirender di browser masing-masing peserta, jadi tetap halus walau sesi online.

- Presenter: `https://hayuatmaai-eng.github.io/present/?presenter` → klik **Salin link audiens**, tempel di chat Teams/Zoom.
- Audiens: `.../present/?room=KODE` (tanpa akun).
- Mandiri: `.../present/`

Kontrol: → ← / clicker / klik / geser · `N` catatan · `F` layar penuh · `H` sembunyikan panel · Home/End.
Membuka link presenter di perangkat kedua (mis. HP) dengan URL yang sama juga bisa dipakai sebagai remote.

## Membuat deck baru
Salin `index.html` ke folder baru (mis. `present/topik-x/index.html`), ganti path `engine.css`/`engine.js` menjadi `../engine.css`/`../engine.js`, ubah `data-deck`, lalu isi `<section class="slide">`.

Atribut animasi:
- `data-anim="up|down|left|right|scale|pop|blur|fade|draw"` (`draw` untuk garis SVG dengan `pathLength="1"`)
- `data-split` — teks muncul per kata
- `data-count="60"` — angka naik
- `data-step="n"` — muncul pada klik ke-n · `style="--d:.3s"` — jeda
- `<aside class="notes">` — catatan presenter

## Sinkronisasi
Relay memakai [ntfy.sh](https://ntfy.sh) (pub/sub publik). Isi pesan hanya `{"s":slide,"f":step}`. Siapa pun yang tahu kode ruang secara teknis bisa mengirim perintah, jadi jangan dipakai untuk materi rahasia. Untuk server sendiri, set `window.KDECK_RELAY = 'https://ntfy.perusahaan.id'` sebelum `engine.js`.
