````markdown
# Backend Main API - Task Dummy Microservices

Repository ini merupakan Backend Utama (REST API) yang bertugas menangani operasi GET (Membaca data), PUT (Mengupdate data), DELETE (Menghapus data), serta integrasi dengan Firebase.

## 💻 Tech Stack

- Node.js & Express.js
- PostgreSQL (pg)
- Firebase Admin SDK
- CORS & Dotenv

## ⚙️ Persyaratan (Environment Variables)

Karena alasan keamanan, file rahasia tidak disertakan di repository ini. Anda wajib membuat/menambahkan file berikut di _root folder_ sebelum menjalankan aplikasi:

1. File `.env` (berisi _connection string_ ke database Azure PostgreSQL).
2. File `firebase-key.json` (kredensial dari Firebase Console).

## 🚀 Cara Menjalankan Server

1. Install dependencies:
   ```bash
   npm install
   ```
2. Lalu jalankan :
   ```bash
   node server.js
   ```
3. Server akan berjalan pada Port 3000

## Daftar Endpoint & Parameter:

1. RUD (PostgreSQL)

- Read (GET): GET /api/policies -> Menampilkan semua data policies.

- Read (GET): GET /api/devices -> Menampilkan semua data device.

- Read (GET): GET /api/users -> Menampilkan semua data user.
- Read (GET): GET /api/users/:id -> Menampilkan data user by id (ganti parameter id dengan id user yang ingin dicari).
- Update (PUT): PUT /api/users/:id -> Ganti parameter :id di ujung URL dengan angka ID user yang mau diubah. Data Update via tab Body -> raw (JSON).
- Delete (DELETE): DELETE /api/users/:id -> Ganti parameter :id di URL dengan angka ID user yang mau dihapus

2. Upload File (Firebase Storage)

- endpoint: POST /api/upload -> Di Postman, buka tab Body -> pilih form-data. Masukkan Key bernama "file" (ubah tipe Key-nya dari Text menjadi File), lalu di kolom Value silakan upload gambar/file.

Catatan Response: Setelah sukses upload, Response akan berupa filename gambar tersebut di Firebase

- Get File: GET /api/file/:filename -> Ganti :filename dengan filename yang ingi di lihat yang ada di firebase.
````
