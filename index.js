// Untuk menjalankan file ini, pastikan Anda telah menginstal Node.js dan Express.
// 1. Inisialisasi proyek: npm init -y
// 2. Instal Express: npm install express
// 3. Jalankan server: node index.js

const express = require("express");
const path = require("path");
const app = express();
const port = 8006; // Port yang diminta

// Middleware untuk menyajikan file statis.
// Meskipun di file HTML ini CSS/JS-nya inline, ini adalah praktik terbaik.
app.use(express.static(path.join(__dirname, "/")));

// Menangani permintaan GET untuk halaman utama
app.get("/", (req, res) => {
  // Menyajikan file index.html.
  // Pastikan file index.html berada di direktori yang sama dengan index.js
  res.sendFile(path.join(__dirname, "index.html"));
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server siap! Buka di: http://localhost:${port}`);
  console.log(
    `(Pastikan file 'index.html' ada di direktori yang sama dengan 'index.js' ini)`
  );
});
