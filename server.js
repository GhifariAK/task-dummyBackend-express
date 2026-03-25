const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Buat Next.js bisa nembak API ke sini
app.use(express.json()); // Agar API bisa membaca request format JSON

require('dotenv').config();
const pool = require('./db'); // Memanggil koneksi database

const admin = require('firebase-admin');
const multer = require('multer');
const serviceAccount = require('./firebase-key.json');

//----FB
// Inisialisasi Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'task-backend-storage.firebasestorage.app' 
});

const bucket = admin.storage().bucket();

// Setup Multer untuk membaca file dari frontend (disimpan di RAM sementara)
const upload = multer({ storage: multer.memoryStorage() });

// //-----Pubsub
// const EventEmitter = require('events');
// // Membuat instance Pub/Sub bawaan Node.js
// const pubsub = new EventEmitter();

// // Pubsubnya bikin project terpisah (create)

// // SUBSCRIBER: Bertugas mengeksekusi query Insert ke DB
// pubsub.on('create_user_event', async (userData) => {
//     try {
//         const { username, full_name, email_address, password } = userData;
        
//         // tenant_id (50), type (1), status_ad (0), dan create_at (NOW())
//         // Karena Dbnya gabisa null pas bagian itu
//         const query = `
//             INSERT INTO tb_users (username, full_name, email_address, password, tenant_id, type, status_ad, create_at) 
//             VALUES ($1, $2, $3, $4, 50, 1, 0, NOW()) 
//             RETURNING *
//         `;

//         const values = [username, full_name, email_address, password];
//         const newUser = await pool.query(query, values);
        
//         console.log(`\n[SUBSCRIBER SUKSES] -> User baru berhasil dibuat di database:`);
//         console.log(newUser.rows[0]);
//     } catch (err) {
//         console.error(`\n[SUBSCRIBER ERROR] -> Gagal membuat user:`, err.message);
//     }
// });

// Endpoint testing
app.get('/', (req, res) => {
    res.json({ message: 'Halo! BE berhasil Jalan.' });
});


// ENDPOINT: GET LIST POLICY
app.get('/api/policies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tb_policy ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
});

// ENDPOINT: GET LIST DEVICE
app.get('/api/devices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tb_device ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
});

// ENDPOINT: READ (GET) USER
// 1. Get semua user
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tb_users ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (Server Error)' });
    }
});

// 2. Get spesifik 1 user berdasarkan ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tb_users WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (Server Error)' });
    }
});

// ENDPOINT: UPDATE (PUT) USER
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, full_name, email_address } = req.body; // Mengambil data baru dari FE

        // Validasi sederhana: pastikan nama dan email diisi
        if (!username || !full_name || !email_address) {
            return res.status(400).json({ success: false, message: 'username, full_name, dan email_address wajib diisi' });
        }

        const query = `
            UPDATE tb_users 
            SET username = $1, full_name = $2, email_address = $3
            WHERE id = $4 
            RETURNING *
        `;

        // Update data di database dan kembalikan data yang baru di-update (RETURNING *)
        const result = await pool.query(query, [username, full_name, email_address, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        res.json({ success: true, message: 'User berhasil diupdate', data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        // Tangkap error jika email sudah dipakai orang lain (UNIQUE constraint)
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
});

// ENDPOINT: DELETE USER (Bagian dari D di RUD)
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM tb_users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        res.json({ success: true, message: 'User berhasil dihapus', data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (Server Error)' });
    }
});

//-------------------------FB
// 1. ENDPOINT UPLOAD FILE KE FIREBASE
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
        }

        // Bikin nama file jadi unik pakai angka waktu sekarang biar nggak bentrok
        const originalName = req.file.originalname.replace(/\s+/g, '_'); 
        const fileName = `${Date.now()}_${originalName}`;
        const fileUpload = bucket.file(fileName);

        // Mulai streaming upload ke Firebase
        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType: req.file.mimetype }
        });

        blobStream.on('error', (error) => {
            console.error('Error Firebase:', error);
            res.status(500).json({ success: false, message: 'Gagal upload ke Firebase' });
        });

        blobStream.on('finish', () => {
            // Berhasil! Kita kirim nama filenya balik ke Frontend
            res.json({ 
                success: true, 
                message: 'File berhasil diunggah!', 
                file_name: fileName 
            });
        });

        blobStream.end(req.file.buffer);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// 2. ENDPOINT GET FILE LINK 
app.get('/api/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const file = bucket.file(filename);

        // Cek dulu filenya beneran ada atau nggak di Firebase
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        // Bikin URL Download sementara (berlaku 7 hari)
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7 
        });

        res.json({ success: true, file_url: url });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Gagal mendapatkan link file' });
    }
});

// Endpoint untuk melihat semua nama file di Firebase
app.get('/api/files', async (req, res) => {
    try {
        const [files] = await bucket.getFiles();
        const fileNames = files.map(file => file.name);
        res.json({ success: true, data: fileNames });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil list file Firebase' });
    }
});


// //----------------------PUBSUB
// // PUBLISHER: Menerima request dan menyiarkan pesan
// app.post('/api/pubsub/user', (req, res) => {
//     try {
//         const { username, full_name, email_address, password } = req.body;

//         if (!username || !full_name || !email_address || !password) {
//             return res.status(400).json({ success: false, message: 'username, full_name, email_address, dan password wajib diisi' });
//         }

//         // Publisher menyiarkan event beserta datanya ke Subscriber
//         pubsub.emit('create_user_event', { username, full_name, email_address, password });

//         // Publisher langsung membalas ke Frontend TANPA menunggu proses insert DB selesai
//         res.json({ 
//             success: true, 
//             message: 'Request diterima! User sedang dibuat di background oleh Subscriber.' 
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
//     }
// });


// Menjalankan server di port 3000
const PORT = process.env.PORT_MAIN || 3000;
app.listen(PORT, () => {
    console.log(`Server BE jalan di http://localhost:${PORT}`);
});