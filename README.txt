THE UNSAID COLLECTION — PERSONAL CHECKPOINT
============================================

CARA MENJALANKAN
1. Ekstrak folder ZIP.
2. Buka file index.html menggunakan browser.
3. Masukkan salah satu kode personal di bawah.

KODE PERSONAL
- R7M4X9
- A8V3C7
- L4D6W2
- R3Q8F5
- A9X4N2

PEMETAAN TEMA
- Raya  : Ostara — lembut, blooming, hangat, dan penuh harapan.
- Andin : Eulalie — elegan dan lembut untuk permintaan maaf tanpa tekanan.
- Lika  : Minouet — dreamy dan nostalgia untuk kenangan lama.
- Reta  : Iliad — hangat, dewasa, dan lebih lugas.
- Anggi : SOTB — tegas, berani, dan cocok untuk closure yang final.

STRUKTUR UTAMA
- index.html                Halaman pembuka dan input kode.
- message.html              Halaman pesan personal.
- css/style.css             Gaya dasar dan halaman pesan.
- css/landing-v2.css        Tema halaman awal Dream Gate.
- css/themes.css            Tema berbeda untuk tiap penerima.
- css/message-v2.css        Alur visual dan animasi halaman pesan.
- js/messages.js            Nama, kode, tema, judul, dan isi pesan.
- js/app.js                 Validasi kode dan interaksi halaman awal.
- js/message.js             Interaksi halaman pesan.

MENGUBAH PESAN
Buka js/messages.js. Semua data penerima ada di file tersebut.
Kode harus ditulis dalam huruf kapital dan harus unik.

CATATAN PRIVASI
Versi ini hanya memakai HTML, CSS, dan JavaScript. Kode dan isi pesan masih bisa
terlihat melalui source/Inspect Element. Gunakan untuk prototipe atau penggunaan
pribadi. Untuk privasi sungguhan, validasi kode dan isi pesan perlu dipindahkan ke
backend/database.


MESSAGE NOTE
------------
The five message bodies in js/messages.js preserve the original wording exactly as supplied, including informal spelling, capitalization, emojis, and Indonesian-English mixing.


ONE-TIME READ MODE
------------------
After a recipient confirms that they have finished reading, the invitation code is stored as consumed in localStorage and cannot be reopened in the same browser profile.

Important: this is a front-end-only safeguard. Clearing browser/site data, using another browser, or opening the website on another device resets the status. A truly global one-time code requires a backend/database.

For testing, use a private/incognito window or clear this site's browser data to reset consumed codes.


OWNER RESET CONTROL
-------------------
An invisible 34 x 34 px maintenance button is located at the extreme bottom-left corner of the landing page. Hovering that corner changes the cursor to a pointer. Clicking it asks for confirmation and clears consumed invitation codes from localStorage in the current browser.


PRIVACY DETERRENTS
- Text selection, copy, cut, drag, context menu, save, source, and print shortcuts are blocked on the message page.
- The message blurs when the tab/window loses focus, where supported.
- Print output is replaced with a privacy notice.
- Screenshot and screen recording cannot be fully prevented by a normal browser website; operating-system capture tools or another camera can still record the screen.
