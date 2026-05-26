# Skenario Testing LostFindings

Dokumen ini berisi skenario testing manual untuk aplikasi LostFindings, aplikasi lost and found kampus berbasis Expo/React Native dengan Supabase. Fokus pengujian: autentikasi, verifikasi mahasiswa, laporan barang, klaim, chat, notifikasi, profil, dan admin.

## Lingkup Pengujian

Platform:
- Android emulator/perangkat fisik
- iOS simulator/perangkat fisik jika tersedia
- Expo Go atau development build

Role yang diuji:
- Guest atau belum login
- User belum terverifikasi
- User terverifikasi
- Admin

Data minimum:
- 1 akun admin
- 2 akun user biasa: User A dan User B
- User A sudah terverifikasi
- User B belum terverifikasi
- Minimal 1 barang hilang dan 1 barang temuan

## Matriks Prioritas

| Prioritas | Area |
|---|---|
| P0 | Login, register, gate verifikasi, post barang, klaim barang, chat, serah terima, admin approval |
| P1 | Search/filter barang, upload foto, notifikasi, edit profil, ubah password |
| P2 | Empty state, share, FAQ, tampilan statistik admin |

## Skenario Auth

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| AUTH-01 | Login berhasil | Buka login, isi email dan password valid, tap `Masuk` | User masuk ke tab utama dan data profil tersimpan di state |
| AUTH-02 | Login field kosong | Tap `Masuk` tanpa email/password | Alert `Isi email dan password dulu!` muncul |
| AUTH-03 | Login credential salah | Isi email/password tidak valid, tap `Masuk` | Alert `Login Gagal` muncul |
| AUTH-04 | Register berhasil | Buka register, isi nama, NIM, fakultas, email, password valid, tap `Daftar Sekarang` | Akun dibuat, data user masuk tabel `users`, alert berhasil, diarahkan ke login |
| AUTH-05 | Register field wajib kosong | Kosongkan salah satu field wajib, tap daftar | Alert `Lengkapi semua field!` muncul |
| AUTH-06 | Persist session | Login, tutup/reload app, buka kembali | Session tetap terbaca dan user tetap login |
| AUTH-07 | Logout | Dari profil tap `Keluar`, konfirmasi | Supabase sign out, store user kosong, diarahkan ke login |

## Skenario Verifikasi Mahasiswa

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| VER-01 | User belum verifikasi melihat banner | Login sebagai user belum verified, buka Beranda | Banner `Verifikasi Mahasiswa` tampil |
| VER-02 | Gate posting untuk user belum verified | Tap tombol post `+` | Alert `Verifikasi Diperlukan`, tersedia aksi ke halaman verifikasi |
| VER-03 | Submit verifikasi tanpa foto | Buka verifikasi, tap submit tanpa upload foto | Tombol disabled atau alert `Upload foto KTM dulu!` |
| VER-04 | Submit verifikasi dengan foto | Upload foto KTM, tap `Kirim untuk Verifikasi` | File terupload, row `verifications` status `pending`, notifikasi system dibuat |
| VER-05 | Admin approve verifikasi | Admin buka Verifikasi Mahasiswa, pilih pending, tap `Setujui` | Status verifikasi `approved`, `users.is_verified=true`, user menerima notifikasi |
| VER-06 | Admin reject verifikasi | Admin tap `Tolak` pada request pending | Status `rejected`, user menerima notifikasi penolakan |
| VER-07 | Admin bypass gate | Login admin, tap post/klaim/chat | Admin dapat lanjut tanpa status `is_verified` |

## Skenario Beranda, Search, dan Filter

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| HOME-01 | Load daftar barang aktif | Buka Beranda | Hanya item `status=active` tampil, urut terbaru |
| HOME-02 | Search nama barang | Ketik keyword yang cocok dengan item | List hanya menampilkan item yang namanya cocok |
| HOME-03 | Search tidak ditemukan | Ketik keyword acak | Empty state `Barang tidak ditemukan` tampil |
| HOME-04 | Filter kategori | Pilih kategori `Dompet`, `Kunci`, dll. | List hanya menampilkan kategori terpilih |
| HOME-05 | Clear search | Isi search lalu tap ikon clear | Keyword kosong dan list kembali sesuai filter aktif |
| HOME-06 | Pull to refresh | Tarik list ke bawah | Data diambil ulang tanpa crash |
| HOME-07 | Buka detail barang | Tap salah satu item | Masuk ke halaman detail barang yang sesuai |

## Skenario Post Barang

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| ITEM-01 | Post barang hilang berhasil | User verified buka post, pilih `Barang Hilang`, isi nama/kategori/lokasi/deskripsi, submit | Row `items` dibuat dengan `type=lost`, `status=active`, diarahkan ke Beranda |
| ITEM-02 | Post barang temuan berhasil | Pilih `Barang Temuan`, isi field wajib, submit | Row `items` dibuat dengan `type=found` |
| ITEM-03 | Validasi field wajib | Kosongkan nama/kategori/lokasi, submit | Alert `Lengkapi nama, kategori, dan lokasi!` |
| ITEM-04 | Upload foto dari galeri | Tambahkan 1-3 foto dari galeri lalu submit | Foto diupload ke storage, `image_url` berisi URL publik |
| ITEM-05 | Upload foto kamera permission denied | Pilih kamera lalu tolak permission | Alert permission kamera muncul, app tidak crash |
| ITEM-06 | Hapus foto sebelum submit | Pilih foto, tap ikon close pada foto | Foto hilang dari preview dan tidak ikut diupload |
| ITEM-07 | Submit saat user tidak login | Paksa buka halaman post tanpa session lalu submit | Alert `Login dulu ya!` atau gate login muncul |

## Skenario Detail Barang, Klaim, Share, Report

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| DETAIL-01 | Detail barang dengan foto | Buka item yang punya foto | Foto tampil, informasi nama/lokasi/waktu/pelapor tampil |
| DETAIL-02 | Detail barang tanpa foto | Buka item tanpa `image_url` | Placeholder ikon kategori tampil |
| DETAIL-03 | Viewer multi foto | Buka item dengan beberapa URL foto, tap foto, swipe | Image viewer tampil dan bisa ditutup |
| DETAIL-04 | Owner tidak melihat tombol klaim/chat | Login sebagai pelapor item, buka detail item sendiri | Tombol klaim/chat ke diri sendiri tidak muncul |
| DETAIL-05 | Klaim barang temuan berhasil | User verified non-owner buka item `found`, tap `Ajukan Klaim` | Row `claims` pending dibuat, tombol berubah `Klaim Terkirim` |
| DETAIL-06 | Klaim ditolak bila sudah ada pending | User lain coba klaim item yang sudah punya claim pending | Alert `Barang ini sedang dalam proses klaim...` |
| DETAIL-07 | User belum verified klaim | User belum verified tap klaim | Gate verifikasi muncul |
| DETAIL-08 | Hubungi pemilik barang hilang | Non-owner buka item `lost`, tap `Hubungi Pemilik` | Chat dibuat atau chat existing dibuka |
| DETAIL-09 | Share barang | Tap `Bagikan` | Native share sheet muncul dengan ringkasan barang |
| DETAIL-10 | Laporkan barang | Non-owner tap `Laporkan`, pilih alasan | Row `reports` pending dibuat dan alert laporan terkirim |

## Skenario Chat dan Janjian

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| CHAT-01 | Daftar chat kosong | Login user tanpa chat, buka tab Chat | Empty state `Belum Ada Chat` tampil |
| CHAT-02 | Buka chat dari detail item | Tap chat/hubungi dari detail item | Room chat terbuka dengan nama lawan bicara dan nama barang |
| CHAT-03 | Kirim pesan | Ketik pesan, tap send | Pesan muncul di bubble user, tersimpan di `messages`, notifikasi dibuat untuk lawan bicara |
| CHAT-04 | Terima pesan realtime | User A dan User B membuka chat yang sama, User A kirim pesan | User B menerima pesan tanpa refresh manual |
| CHAT-05 | Empty message | Tap send saat input kosong/spasi | Tidak ada pesan baru yang dibuat |
| CHAT-06 | Jadwalkan janjian berhasil | Dari chat tap kalender, pilih tanggal/waktu/lokasi, kirim | Row `appointments` pending dibuat dan pesan `JADWAL_JANJIAN` muncul |
| CHAT-07 | Validasi janjian | Kirim janjian tanpa tanggal/waktu/lokasi | Alert validasi sesuai field yang kosong |
| CHAT-08 | Terima janjian | Lawan bicara tap `Terima` pada kartu jadwal | Status appointment `accepted`, pesan sistem muncul |
| CHAT-09 | Tolak janjian | Lawan bicara tap `Tolak` | Status appointment `declined`, pesan sistem muncul |
| CHAT-10 | Konfirmasi satu pihak | Penemu atau pemilik tap banner konfirmasi | Field konfirmasi pihak tersebut menjadi true, notifikasi ke pihak lain dibuat |
| CHAT-11 | Konfirmasi dua pihak selesai | Kedua pihak konfirmasi serah terima | Chat `completed=true`, item `status=claimed`, notifikasi match dibuat, input chat ditutup |
| CHAT-12 | Batalkan klaim | Sebelum ada konfirmasi, tap `Batalkan Klaim` | Claim `cancelled`, item kembali `active`, chat reset, pesan sistem dan notifikasi dibuat |

## Skenario Notifikasi

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| NOTIF-01 | Load notifikasi | Login user yang punya notifikasi, buka tab Notifikasi | List notifikasi tampil urut terbaru |
| NOTIF-02 | Realtime notifikasi | User lain mengirim pesan/klaim | Notifikasi baru muncul di list tanpa refresh manual |
| NOTIF-03 | Buka notifikasi pesan/klaim/match | Tap notifikasi type `msg`, `claim`, atau `match` | Notifikasi ditandai read dan diarahkan ke chat terkait atau daftar chat |
| NOTIF-04 | Buka notifikasi system | Tap notifikasi type `system` | Notifikasi read dan diarahkan ke Profil |
| NOTIF-05 | Hapus semua | Tap `Hapus semua` | Semua notifikasi user terhapus dan empty state tampil |
| NOTIF-06 | Empty state | User tanpa notifikasi membuka tab | Empty state `Tidak Ada Notifikasi` tampil |

## Skenario Profil

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| PROF-01 | Profil belum login | Buka Profil tanpa session | Tampilan `Belum Login` dan tombol login muncul |
| PROF-02 | Profil user login | Login user, buka Profil | Nama, NIM, fakultas, statistik laporan, dan laporan terbaru tampil |
| PROF-03 | Edit profil berhasil | Buka edit profil, ubah nama/fakultas, simpan | Tabel `users` terupdate, store user terupdate, kembali ke profil |
| PROF-04 | Edit profil nama kosong | Kosongkan nama, simpan | Alert `Nama tidak boleh kosong!` |
| PROF-05 | NIM dan email read-only | Buka edit profil, coba ubah NIM/email | Field tidak bisa diedit |
| PROF-06 | Ubah password valid | Isi field password, password baru sama dengan konfirmasi, submit | Supabase auth update berhasil dan kembali |
| PROF-07 | Password baru tidak cocok | Isi password baru dan konfirmasi berbeda | Alert `Password baru tidak cocok!` |
| PROF-08 | Password terlalu pendek | Isi password baru kurang dari 6 karakter | Alert `Password minimal 6 karakter!` |

## Skenario Admin

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| ADM-01 | Non-admin akses dashboard | Login user biasa, buka tab/admin route admin | Halaman `Akses Ditolak` tampil |
| ADM-02 | Admin dashboard statistik | Login admin, buka Admin Dashboard | Statistik total barang, user, dikembalikan, terverifikasi tampil sesuai data |
| ADM-03 | Kelola barang search/filter | Buka Kelola Barang, cari nama/lokasi/pelapor dan pilih filter | List berubah sesuai search dan filter |
| ADM-04 | Tandai barang kembali | Admin tap `Tandai Kembali` pada item active | Item berubah `status=claimed` |
| ADM-05 | Aktifkan barang kembali | Admin tap `Aktifkan Lagi` pada item claimed | Item berubah `status=active` |
| ADM-06 | Hapus barang | Admin tap hapus, konfirmasi | Item terhapus, notifikasi system dikirim ke owner |
| ADM-07 | Kelola user search | Admin cari nama/NIM/email | List user sesuai keyword |
| ADM-08 | Ban/unban user | Admin tap ikon ban lalu konfirmasi | `users.is_banned` berubah sesuai aksi |
| ADM-09 | Admin tidak bisa diban dari UI | Lihat user role admin di daftar user | Tombol ban/delete tidak tampil untuk admin |
| ADM-10 | Hapus user | Admin tap hapus user biasa, konfirmasi | Row user terhapus dari tabel `users` |
| ADM-11 | Review report abaikan | Admin buka laporan pending, tap `Abaikan` | Report berubah `dismissed` |
| ADM-12 | Review report hapus barang | Admin tap `Hapus Barang` pada report pending | Item terhapus, report `reviewed`, owner mendapat notifikasi |

## Skenario Non-Fungsional

| ID | Skenario | Langkah | Expected Result |
|---|---|---|---|
| NF-01 | App startup tanpa env Supabase | Jalankan app tanpa `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` | Error konfigurasi mudah terdeteksi saat startup |
| NF-02 | Koneksi lambat saat load list | Throttle jaringan, buka Beranda/Chat/Admin | Loading state muncul dan app tidak freeze |
| NF-03 | Koneksi putus saat submit | Matikan jaringan saat post barang/verifikasi/kirim chat | Error alert muncul, loading berhenti |
| NF-04 | Format waktu Jakarta | Kirim pesan/janjian | Jam tampil dalam format `id-ID` zona `Asia/Jakarta` |
| NF-05 | Safe area dan keyboard | Uji login/register/chat di perangkat kecil | Input tidak tertutup keyboard dan konten tetap bisa discroll |
| NF-06 | Image URL tidak valid | Buat item dengan `image_url` rusak | App tidak crash, placeholder atau error image tidak mengganggu alur |

## Checklist Regression Singkat

Jalankan sebelum demo atau rilis:
- Register akun baru berhasil.
- Login akun lama berhasil.
- User belum verified tidak bisa post, klaim, atau chat.
- User verified bisa post barang hilang dan barang temuan.
- Search dan filter di Beranda berjalan.
- Detail item bisa dibuka.
- Klaim barang temuan membuat claim pending.
- Chat bisa kirim pesan dan membuat notifikasi.
- Janjian bisa dibuat dan diterima/ditolak.
- Serah terima dua pihak mengubah barang menjadi `claimed`.
- Admin bisa approve verifikasi.
- Admin bisa kelola barang, user, dan report.
- Logout mengembalikan user ke login.

## Catatan Risiko dari Kode Saat Ini

Beberapa area yang sebaiknya diberi perhatian ekstra saat testing:
- File `app/admin/index.tsx` dan `app/chat/index.tsx` kosong, sementara route yang aktif tampaknya memakai `app/(tabs)/admin.tsx` dan `app/(tabs)/chat.tsx`.
- Fitur ban user hanya mengubah `users.is_banned`; belum terlihat gate eksplisit yang mencegah user banned login atau memakai fitur.
- `markAllRead` di notifikasi didefinisikan tetapi tidak dipakai di UI.
- Ubah password tidak memverifikasi password lama secara eksplisit; field password saat ini hanya validasi UI, update dilakukan langsung via Supabase session.
- Beberapa aksi admin dan destructive action bergantung pada policy Supabase/RLS. Pastikan RLS mengizinkan hanya admin, bukan sekadar menyembunyikan tombol di UI.
