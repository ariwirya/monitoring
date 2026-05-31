# Folder Foto Driver untuk Face Recognition

## 📁 Lokasi Folder
```
D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_photos\
```

## 📝 Cara Penggunaan

### 1. Siapkan Foto Driver
- Masukkan foto driver ke folder ini
- Format file: `.jpg`, `.jpeg`, atau `.png`
- **Penting**: Nama file harus sesuai dengan nama driver
  - Contoh: `budi_santoso.jpg`, `siti_aminah.png`, `ahmad.jpeg`

### 2. Requirements Foto
- Wajah terlihat jelas dan fokus
- Pencahayaan cukup
- Wajah menghadap ke depan
- Tidak menggunakan kacamata hitam/masker
- Resolusi minimal 640x480 pixel

### 3. Encoding Wajah
Setelah foto dimasukkan, jalankan script encoding:

```bash
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database
python encode_driver_faces.py
```

Script ini akan:
- Membaca semua foto di folder ini
- Mendeteksi dan mengencode wajah
- Menyimpan hasil encoding ke `driver_encodings.pkl`

### 4. Output Encoding
File encoding akan disimpan di:
```
D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_encodings.pkl
```

## 🔧 Catatan Penting

### Tentang Face Recognition vs Face Detection
- **Face Recognition (full)**: Mengidentifikasi siapa orangnya (memerlukan `face_recognition` library)
- **Face Detection**: Hanya mendeteksi ada/tidaknya wajah (menggunakan OpenCV Haar Cascade)

Sistem DMS saat ini menggunakan **OpenCV Haar Cascade** untuk face detection karena:
- Lebih mudah diinstall di Windows (tidak perlu Visual C++ Build Tools)
- Sudah cukup untuk fitur anti-tampering (deteksi wajah hilang)
- Lebih ringan dan cepat

### Jika Ingin Menggunakan Face Recognition Penuh
Jika Anda ingin fitur identifikasi driver (bukan hanya deteksi wajah), Anda perlu:
1. Install library face_recognition:
   ```bash
   pip install dlib-binary face_recognition
   ```
2. Script encoding akan otomatis menggunakan face_recognition jika tersedia
3. Update script dms_monitor.py untuk memuat encodings dari file

## 📊 Struktur Data Encoding

File `driver_encodings.pkl` berisi:
```python
{
    'encodings': [encoding1, encoding2, ...],  # Vector encoding wajah
    'names': ['driver1', 'driver2', ...]      # Nama driver sesuai filename
}
```

## 🎯 Contoh Penggunaan

### Contoh 1: Menambah Driver Baru
1. Siapkan foto: `john_doe.jpg`
2. Masukkan ke folder `driver_photos/`
3. Jalankan: `python encode_driver_faces.py`
4. Driver akan otomatis terdaftar di sistem

### Contoh 2: Update Foto Driver
1. Ganti foto lama dengan foto baru (nama file sama)
2. Jalankan ulang: `python encode_driver_faces.py`
3. Encoding akan di-update

## ⚠️ Troubleshooting

### Error: "Tidak ada wajah terdeteksi"
- Pastikan foto menampilkan wajah dengan jelas
- Cek pencahayaan foto
- Pastikan wajah tidak tertutup objek

### Error: "Library face_recognition tidak terinstall"
- Sistem akan otomatis menggunakan OpenCV sebagai alternatif
- Untuk face recognition penuh, install: `pip install dlib-binary face_recognition`

### Error: "Folder tidak ditemukan"
- Pastikan folder `driver_photos` sudah dibuat
- Path folder: `D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_photos\`
