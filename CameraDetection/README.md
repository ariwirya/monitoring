# Driver Monitoring System (DMS) - Dokumentasi Lengkap

## 📋 Deskripsi Proyek

Sistem Driver Monitoring System (DMS) berbasis Real-Time Object Detection dan Face Recognition untuk Armada Transportasi Komersial. Sistem ini menggunakan teknologi AI untuk mendeteksi pelanggaran perilaku pengemudi seperti merokok, microsleep (mengantuk), dan manipulasi kamera secara real-time.

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE DEVICE (Laptop/Truck)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Python Script (dms_monitor.py)                         │  │
│  │  - YOLOv8 Object Detection (best.pt)                    │  │
│  │  - Face Recognition (face_recognition)                    │  │
│  │  - Camera Capture & Processing                          │  │
│  │  - Violation Detection Logic                            │  │
│  │  - Audio Alarm (winsound)                                │  │
│  │  - API Transmission (Threading)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │ HTTP POST (FormData)             │
│                              ▼                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server (server.js)                              │  │
│  │  - REST API Endpoints                                     │  │
│  │  - File Upload (Multer)                                   │  │
│  │  - SQLite Database                                        │  │
│  │  - CORS Enabled                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │ REST API                        │
│                              ▼                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND DASHBOARD (React.js)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components                                        │  │
│  │  - DMS Stats Card                                        │  │
│  │  - Monitoring Status                                     │  │
│  │  - Violation Table (with Polling)                        │  │
│  │  - Image Lightbox                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Struktur Folder

```
CameraDetection/
├── backend/                      # Backend Node.js Express
│   ├── package.json             # Dependencies backend
│   └── server.js                # Server Express dengan REST API
├── python_edge/                 # Python Edge Device
│   └── dms_monitor.py          # Script monitoring kamera utama
├── database/                    # Database SQLite
│   ├── init_db.py              # Script inisialisasi database
│   └── dms_fleet.db            # Database SQLite (auto-generated)
├── snapshots/                  # Snapshot pelanggaran
├── logs/                       # Log sistem
└── README.md                   # Dokumentasi ini

DashboardFleetManagement/       # React Frontend (sudah ada)
├── src/
│   ├── components/
│   │   └── dms/               # Komponen DMS
│   │       ├── DMSTab.jsx     # Tab utama DMS
│   │       ├── DMSStatsCard.jsx
│   │       ├── DMSMonitoringStatus.jsx
│   │       └── DMSViolationTable.jsx
│   └── utils/
│       └── dmsApi.js          # Service API untuk backend
└── package.json
```

## 🔧 Teknologi yang Digunakan

### Edge Device (Python)
- **YOLOv8/Ultralytics**: Object detection untuk deteksi pelanggaran
- **face_recognition**: Face recognition berbasis dlib
- **OpenCV**: Capture dan processing kamera
- **winsound**: Audio alarm (Windows native)
- **requests**: HTTP client untuk API calls
- **threading**: Multithreading untuk non-blocking operations

### Backend (Node.js)
- **Express**: Web framework untuk REST API
- **SQLite3**: Database untuk menyimpan log pelanggaran
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### Frontend (React.js)
- **React**: UI framework
- **Lucide React**: Icon library
- **Fetch API**: HTTP client untuk polling data

## 🚀 Panduan Instalasi

### 1. Persiapan Environment

#### Python Environment (Edge Device)
```bash
# Install Python 3.8+ jika belum ada
# Buat virtual environment (opsional tapi disarankan)
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies Python
pip install ultralytics opencv-python face_recognition dlib requests numpy
```

#### Node.js Environment (Backend)
```bash
# Install Node.js 16+ jika belum ada
# Masuk ke folder backend
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\backend

# Install dependencies
npm install
```

#### React Environment (Frontend)
```bash
# Masuk ke folder dashboard React
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\DashboardFleetManagement

# Install dependencies (jika belum)
npm install
```

### 2. Inisialisasi Database

```bash
# Jalankan script inisialisasi database
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database
python init_db.py
```

Database akan dibuat di: `D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\dms_fleet.db`

### 3. Konfigurasi Model YOLOv8

Pastikan file model `best.pt` ada di path yang sudah ditentukan:
```
D:\Kuliah\Semester Akhir 2.0\Skripsi\best.pt
```

Model harus memiliki 4 kelas:
- `safe-driving`: Pengemudi mengemudi dengan aman
- `smoking`: Pengemudi merokok
- `eyes-closed`: Mata pengemudi tertutup
- `yawn`: Pengemudi menguap

### 4. Menjalankan Backend Server

```bash
# Terminal 1: Jalankan backend server
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\backend
npm start

# Atau untuk development dengan auto-reload
npm run dev
```

Backend akan berjalan di: `http://localhost:3000`

### 5. Menjalankan Frontend Dashboard

```bash
# Terminal 2: Jalankan React dashboard
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\DashboardFleetManagement
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173` (atau port lain yang ditentukan Vite)

### 6. Menjalankan Python Monitoring Script

```bash
# Terminal 3: Jalankan script monitoring kamera
cd D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\python_edge
python dms_monitor.py
```

## 🔄 Alur Kerja Sistem

### 1. Inisialisasi
1. Python script memuat model YOLOv8 dari `best.pt`
2. Kamera diinisialisasi dengan resolusi 640x480 @ 30 FPS
3. ViolationManager diinisialisasi untuk tracking pelanggaran
4. Face recognition siap (dengan frame skipping untuk optimasi)

### 2. Loop Utama (Per Frame)
1. **Capture Frame**: Ambil frame dari kamera
2. **Object Detection (YOLOv8)**:
   - Deteksi objek dalam frame
   - Identifikasi kelas: safe-driving, smoking, eyes-closed, yawn
   - Filter berdasarkan confidence threshold (0.5)
3. **Face Recognition (setiap 15 frame)**:
   - Deteksi lokasi wajah
   - Encode wajah dan bandingkan dengan database
   - Identifikasi pengemudi
4. **Violation Detection**:
   - **Smoking**: Cek kontinuitas deteksi >= 2 detik
   - **Microsleep**: Logika sekuensial (yawn/eyes-closed → eyes-closed kontinu >= 2 detik)
   - **Camera Covered**: Cek wajah tidak terdeteksi >= 3 detik
5. **Visual Indicators**:
   - Jika safe-driving: Tampilkan teks hijau "STATUS: AMAN", sembunyikan bounding box
   - Jika pelanggaran: Tampilkan bounding box merah, teks "STATUS: PERINGATAN / BAHAYA!"
6. **Alarm Handling**:
   - Jika threshold terpenuhi: Play alarm audio (non-blocking via threading)
   - Kirim data ke backend API (dengan cooldown 10 detik per jenis pelanggaran)
   - Capture snapshot frame saat pelanggaran terdeteksi
7. **Display**: Tampilkan frame dengan visual indicators ke layar

### 3. Backend Processing
1. Terima data pelanggaran via POST `/api/violations`
2. Simpan snapshot ke folder `snapshots/`
3. Insert data ke database SQLite
4. Update monitoring status
5. Return response ke Python script

### 4. Frontend Display (Polling)
1. React melakukan polling ke backend setiap 2-5 detik
2. Fetch data pelanggaran terbaru
3. Update tampilan dashboard real-time
4. Tampilkan statistik, status monitoring, dan tabel pelanggaran
5. User dapat melihat bukti foto via lightbox

## 🎯 Fitur Utama

### 1. Custom Bounding Box Logic
- **Safe-driving**: Bounding box disembunyikan, teks status hijau
- **Pelanggaran**: Bounding box merah hanya pada objek pelanggaran

### 2. Time Accumulation & Alarm Logic
- **Smoking**: Trigger alarm jika terdeteksi kontinu >= 2 detik
- **Microsleep**: Logika 2 tahap (indikasi mengantuk → eksekusi microsleep)
- **Flag Reset**: Otomatis reset saat driver kembali safe-driving

### 3. Anti-Tampering Detection
- Deteksi jika kamera ditutupi/wajah hilang >= 3 detik
- Trigger alarm khusus "CAMERA_COVERED"
- Capture snapshot meski gelap sebagai bukti

### 4. Audio Alarm System
- Menggunakan `winsound` (Windows native)
- Non-blocking via threading
- Tidak mengganggu flow kamera (tetap 30 FPS)

### 5. API Transmission with Cooldown
- Kirim snapshot + data pelanggaran ke backend
- Cooldown 10 detik per jenis pelanggaran
- Multithreading agar tidak blocking kamera

### 6. Performance Optimization
- Face recognition setiap 15 frame (hemat CPU)
- Threading untuk operasi I/O (API calls, audio)
- Efficient image processing

### 7. Real-Time Dashboard
- Polling otomatis setiap 2-5 detik
- Statistik pelanggaran real-time
- Status monitoring live
- Tabel pelanggaran dengan filter
- Lightbox untuk melihat bukti foto

## 📡 API Endpoints

### Backend API (http://localhost:3000)

#### POST `/api/violations`
Menerima data pelanggaran dari Python script
- Body: `driver_name`, `violation_type`, `timestamp`, `duration_seconds`, `description`, `snapshot` (file)
- Response: `{ success: true, violation_id: 123 }`

#### GET `/api/violations`
Mendapatkan semua data pelanggaran
- Query params: `limit`, `offset`, `driver_name`, `violation_type`, `start_date`, `end_date`
- Response: `{ success: true, data: [...], count: 10 }`

#### GET `/api/violations/stats`
Mendapatkan statistik pelanggaran
- Response: `{ success: true, stats: { total, today_count, by_type, by_driver } }`

#### GET `/api/drivers`
Mendapatkan semua data driver
- Response: `{ success: true, data: [...] }`

#### POST `/api/drivers`
Menambahkan driver baru
- Body: `name`, `license_plate`, `face_encoding_path`
- Response: `{ success: true, driver_id: 123 }`

#### GET `/api/monitoring/status`
Mendapatkan status monitoring terbaru
- Response: `{ success: true, data: { driver_name, current_status, camera_status, last_heartbeat } }`

#### POST `/api/monitoring/heartbeat`
Menerima heartbeat dari edge device
- Body: `driver_name`, `current_status`, `camera_status`
- Response: `{ success: true }`

#### GET `/api/logs`
Mendapatkan log sistem
- Query params: `limit`
- Response: `{ success: true, data: [...] }`

## 🔧 Konfigurasi

### Python Script (`dms_monitor.py`)
```python
# Path model YOLOv8
MODEL_PATH = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\best.pt"

# URL Backend API
BACKEND_API_URL = "http://localhost:3000/api/violations"

# Threshold waktu (detik)
SMOKING_THRESHOLD = 2.0
MICROSLEEP_THRESHOLD = 2.0
CAMERA_COVERED_THRESHOLD = 3.0
API_COOLDOWN = 10.0

# Frame skipping face recognition
FACE_RECOGNITION_SKIP_FRAMES = 15

# Konfigurasi kamera
CAMERA_INDEX = 0
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
TARGET_FPS = 30
```

### Backend Server (`server.js`)
```javascript
const PORT = 3000;
const DB_PATH = path.join(__dirname, '../database/dms_fleet.db');
const SNAPSHOTS_DIR = path.join(__dirname, '../snapshots');
```

### React Frontend (`dmsApi.js`)
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🐛 Troubleshooting

### Python Script Tidak Berjalan
- Pastikan model `best.pt` ada di path yang benar
- Cek kamera terdeteksi: `CAMERA_INDEX = 0` (ubah jika perlu)
- Install dependencies: `pip install ultralytics opencv-python face_recognition dlib requests numpy`

### Backend Server Error
- Pastikan Node.js terinstall: `node --version`
- Install dependencies: `npm install`
- Cek port 3000 tidak dipakai aplikasi lain

### Frontend Tidak Connect ke Backend
- Pastikan backend berjalan di `http://localhost:3000`
- Cek CORS enabled di backend
- Verify API_BASE_URL di `dmsApi.js`

### Face Recognition Error
- Install dlib dengan compiler C++ yang sesuai
- Untuk Windows: `pip install dlib-binary` (lebih mudah)
- Pastikan ada cukup RAM untuk encoding

### Database Error
- Jalankan `python init_db.py` untuk inisialisasi
- Cek permission write di folder database
- Pastikan path database benar di `server.js`

## 📊 Skema Database

### Tabel `drivers`
- `id`: Primary key
- `name`: Nama pengemudi
- `license_plate`: Plat nomor unik
- `face_encoding_path`: Path file encoding wajah
- `created_at`: Timestamp pembuatan
- `updated_at`: Timestamp update terakhir

### Tabel `violations`
- `id`: Primary key
- `driver_id`: Foreign key ke drivers
- `driver_name`: Nama pengemudi
- `violation_type`: Tipe pelanggaran (smoking, microsleep, camera_covered)
- `violation_description`: Deskripsi pelanggaran
- `snapshot_path`: Path file snapshot
- `timestamp`: Timestamp pelanggaran
- `duration_seconds`: Durasi pelanggaran
- `severity`: Severity (low, medium, high)

### Tabel `system_logs`
- `id`: Primary key
- `log_type`: Tipe log
- `message`: Pesan log
- `timestamp`: Timestamp log

### Tabel `monitoring_status`
- `id`: Primary key
- `driver_id`: Foreign key ke drivers
- `driver_name`: Nama pengemudi
- `current_status`: Status saat ini (safe, danger, warning, inactive)
- `last_violation_type`: Tipe pelanggaran terakhir
- `last_violation_time`: Timestamp pelanggaran terakhir
- `camera_status`: Status kamera (active, inactive)
- `last_heartbeat`: Timestamp heartbeat terakhir

## 🔒 Keamanan

- **CORS**: Backend mengizinkan request dari frontend
- **File Upload**: Limit 10MB per file
- **SQL Injection**: Menggunakan parameterized queries
- **Input Validation**: Validasi data di backend

## 📈 Performa

- **FPS Kamera**: 30 FPS target
- **Object Detection**: Real-time dengan YOLOv8
- **Face Recognition**: Setiap 15 frame (optimasi CPU)
- **API Polling**: 2-5 detik interval
- **Database**: SQLite untuk performa tinggi

## 🎓 Referensi

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

## 👥 Kontribusi

Proyek ini dibuat untuk skripsi S1. Untuk pertanyaan atau masukan, silakan hubungi pengembang.

## 📄 Lisensi

Proyek ini adalah bagian dari skripsi akademik. Penggunaan untuk tujuan komersial memerlukan izin.

---

**Dibuat oleh**: Mahasiswa Skripsi
**Tanggal**: 2026
**Versi**: 1.0.0
