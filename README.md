-Base URL untuk semua request: http://localhost:3000

Daftar Endpoint & Parameter:

1. CRUD Users (PostgreSQL)

-Read (GET): GET /api/users -> Menampilkan semua data user.
-Update (PUT): PUT /api/users/:id -> Ganti parameter :id di ujung URL dengan angka ID user yang mau diubah. Data Update via tab Body -> raw (JSON).
-Delete (DELETE): DELETE /api/users/:id -> Ganti parameter :id di URL dengan angka ID user yang mau dihapus

2. Upload File (Firebase Storage)

- endpoint: POST /api/upload -> Di Postman, buka tab Body -> pilih form-data. Masukkan Key bernama "file" (ubah tipe Key-nya dari Text menjadi File), lalu di kolom Value silakan upload gambar/file.

Catatan Response: Setelah sukses upload, Response akan berupa filename gambar tersebut di Firebase

-Get File: GET /api/file/:filename -> Ganti :filename dengan filename yang ingi di lihat yang ada di firebase.

3. Create User (Pub/Sub Express)

- Endpoint: POST /api/pubsub/user
  Cara pakai: Kirim data name dan email via tab Body -> raw (JSON).
