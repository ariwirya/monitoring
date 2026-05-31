"""
Sistem Driver Monitoring System (DMS) - Edge Device
Script monitoring kamera real-time dengan YOLOv8 dan Face Recognition
Fitur: Deteksi pelanggaran, anti-tampering, alarm audio, dan transmisi API
"""

import cv2
import numpy as np
import time
import threading
import requests
import winsound
from ultralytics import YOLO
import pickle
import os
from datetime import datetime
from collections import deque

# Face detection menggunakan OpenCV Haar Cascade (lebih mudah diinstall di Windows)
# Tidak memerlukan Visual C++ Build Tools seperti face_recognition/dlib

# ============================================
# KONFIGURASI SISTEM
# ============================================

# Path model YOLOv8 custom
MODEL_PATH = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\best.pt"

# URL Backend API
BACKEND_API_URL = "http://localhost:3000/api/violations"

# Path untuk menyimpan snapshot
SNAPSHOT_DIR = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\snapshots"

# Konfigurasi threshold waktu (dalam detik)
SMOKING_THRESHOLD = 2.0          # Durasi deteksi smoking untuk trigger alarm
MICROSLEEP_THRESHOLD = 2.0       # Durasi eyes-closed untuk trigger microsleep
CAMERA_COVERED_THRESHOLD = 3.0   # Durasi wajah hilang untuk trigger alarm
API_COOLDOWN = 10.0              # Cooldown antar request API per jenis pelanggaran

# Konfigurasi frame skipping untuk face recognition
FACE_RECOGNITION_SKIP_FRAMES = 15  # Jalankan face recognition setiap 15 frame

# Konfigurasi kamera
CAMERA_INDEX = 0  # Index kamera utama (0 = default)
CAMERA_MAX_INDEX = 2  # Coba indeks 0..N jika kamera utama gagal
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
TARGET_FPS = 30
CAMERA_WARMUP_FRAMES = 5  # Buang frame awal (sering hitam/kosong di Windows)
# Backend: "auto" | "dshow" | "msmf" | "default"
CAMERA_BACKEND = "auto"

# Opsi: Gunakan video file untuk simulasi (set path video file di sini)
# Jika VIDEO_SIMULATION_PATH tidak kosong, sistem akan menggunakan video file sebagai ganti kamera
VIDEO_SIMULATION_PATH = ""  # Contoh: r"D:\path\to\video.mp4"

# Nama pengemudi default (bisa diubah via face recognition)
DRIVER_NAME = "Driver Demo"

# Confidence threshold untuk deteksi YOLOv8
# Tingkatkan nilai ini untuk mengurangi false positive (0.5 - 0.9)
CONFIDENCE_THRESHOLD = 0.5  # Diturunkan karena model confidence rendah

# Debug mode: Tampilkan semua deteksi (termasuk yang di bawah threshold)
DEBUG_MODE = True

# Opsi: Nonaktifkan face detection sementara (karena memory error)
ENABLE_FACE_DETECTION = False  # Set False untuk menonaktifkan sementara

# ============================================
# KELAS MANAJER STATUS PELANGGARAN
# ============================================

class ViolationManager:
    """
    Kelas untuk mengelola status dan timing pelanggaran
    Mengimplementasikan logika akumulasi waktu dan cooldown
    """
    
    def __init__(self):
        # Timer untuk setiap jenis pelanggaran
        self.smoking_start_time = None
        self.eyes_closed_start_time = None
        self.face_not_detected_start_time = None
        
        # Flag untuk logika sekuensial microsleep
        self.is_drowsy_flag = False
        
        # Timer untuk API cooldown per jenis pelanggaran
        self.last_api_call_smoking = 0
        self.last_api_call_microsleep = 0
        self.last_api_call_camera_covered = 0
        
        # Status saat ini
        self.current_status = "safe"
        self.active_violations = set()
        
    def reset_smoking(self):
        """Reset timer smoking"""
        self.smoking_start_time = None
        
    def reset_eyes_closed(self):
        """Reset timer eyes-closed"""
        self.eyes_closed_start_time = None
        
    def reset_face_not_detected(self):
        """Reset timer face not detected"""
        self.face_not_detected_start_time = None
        
    def reset_drowsy_flag(self):
        """Reset flag drowsy saat driver kembali safe"""
        self.is_drowsy_flag = False
        
    def check_smoking_violation(self, is_smoking_detected):
        """
        Cek apakah pelanggaran smoking terjadi
        Returns: (is_violation, duration)
        """
        current_time = time.time()
        
        if is_smoking_detected:
            if self.smoking_start_time is None:
                self.smoking_start_time = current_time
            
            duration = current_time - self.smoking_start_time
            
            # Cek apakah sudah melewati threshold
            if duration >= SMOKING_THRESHOLD:
                return True, duration
            else:
                return False, duration
        else:
            self.reset_smoking()
            return False, 0
            
    def check_microsleep_violation(self, is_eyes_closed, is_yawn_detected):
        """
        Cek apakah pelanggaran microsleep terjadi (logika sekuensial)
        Returns: (is_violation, duration)
        """
        current_time = time.time()
        
        # Tahap 1: Deteksi indikasi mengantuk (yawn atau eyes-closed singkat)
        if is_yawn_detected or (is_eyes_closed and self.eyes_closed_start_time is not None and 
                               (current_time - self.eyes_closed_start_time) < MICROSLEEP_THRESHOLD):
            self.is_drowsy_flag = True
            
        # Tahap 2: Jika flag drowsy aktif, cek eyes-closed berkelanjutan
        if self.is_drowsy_flag and is_eyes_closed:
            if self.eyes_closed_start_time is None:
                self.eyes_closed_start_time = current_time
            
            duration = current_time - self.eyes_closed_start_time
            
            # Cek apakah sudah melewati threshold
            if duration >= MICROSLEEP_THRESHOLD:
                return True, duration
            else:
                return False, duration
        else:
            # Reset jika tidak eyes-closed
            if not is_eyes_closed:
                self.reset_eyes_closed()
            return False, 0
            
    def check_camera_covered_violation(self, face_count):
        """
        Cek apakah kamera ditutupi (wajah tidak terdeteksi)
        Returns: (is_violation, duration)
        """
        current_time = time.time()
        
        if face_count == 0:
            if self.face_not_detected_start_time is None:
                self.face_not_detected_start_time = current_time
            
            duration = current_time - self.face_not_detected_start_time
            
            # Cek apakah sudah melewati threshold
            if duration >= CAMERA_COVERED_THRESHOLD:
                return True, duration
            else:
                return False, duration
        else:
            self.reset_face_not_detected()
            return False, 0
            
    def can_send_api(self, violation_type):
        """
        Cek apakah sudah boleh mengirim API (cek cooldown)
        """
        current_time = time.time()
        
        if violation_type == "smoking":
            return (current_time - self.last_api_call_smoking) >= API_COOLDOWN
        elif violation_type == "microsleep":
            return (current_time - self.last_api_call_microsleep) >= API_COOLDOWN
        elif violation_type == "camera_covered":
            return (current_time - self.last_api_call_camera_covered) >= API_COOLDOWN
        else:
            return True
            
    def update_api_cooldown(self, violation_type):
        """Update timestamp terakhir mengirim API"""
        current_time = time.time()
        
        if violation_type == "smoking":
            self.last_api_call_smoking = current_time
        elif violation_type == "microsleep":
            self.last_api_call_microsleep = current_time
        elif violation_type == "camera_covered":
            self.last_api_call_camera_covered = current_time

# ============================================
# FUNGSI ALARM AUDIO
# ============================================

def play_alarm_sound():
    """
    Memainkan suara alarm menggunakan winsound
    Dijalankan di thread terpisah agar tidak blocking
    """
    try:
        # Frekuensi 1000 Hz, durasi 500ms
        winsound.Beep(1000, 500)
        # Frekuensi 800 Hz, durasi 500ms
        winsound.Beep(800, 500)
    except Exception as e:
        print(f"⚠️ Error memainkan alarm: {e}")

def play_alarm_async():
    """
    Memainkan alarm secara asynchronous menggunakan threading
    """
    alarm_thread = threading.Thread(target=play_alarm_sound)
    alarm_thread.daemon = True
    alarm_thread.start()

# ============================================
# FUNGSI TRANSMISI API
# ============================================

def send_violation_to_api(frame, violation_type, duration, driver_name):
    """
    Mengirim data pelanggaran ke backend API
    Dijalankan di thread terpisah agar tidak blocking
    """
    try:
        # Generate nama file snapshot
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot_filename = f"{violation_type}_{timestamp}.jpg"
        snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_filename)
        
        # Simpan snapshot frame
        cv2.imwrite(snapshot_path, frame)
        
        # Siapkan payload data
        payload = {
            'driver_name': driver_name,
            'violation_type': violation_type,
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration,
            'description': f"{violation_type} terdeteksi selama {duration:.2f} detik",
            'source': 'edge',
        }
        
        # Siapkan file untuk upload
        files = {
            'snapshot': (snapshot_filename, open(snapshot_path, 'rb'), 'image/jpeg')
        }
        
        # Kirim ke backend API
        response = requests.post(BACKEND_API_URL, data=payload, files=files, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Data pelanggaran {violation_type} berhasil dikirim ke server")
        else:
            print(f"⚠️ Gagal mengirim data: Status {response.status_code}")
            
        # Tutup file
        files['snapshot'][1].close()
        
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error koneksi ke backend: {e}")
    except Exception as e:
        print(f"⚠️ Error mengirim data pelanggaran: {e}")

def handle_violation(violation_manager, frame, violation_type, duration, driver_name):
    """
    Menangani pelanggaran: play alarm, kirim API (dengan cooldown)
    """
    # Cek cooldown API
    if violation_manager.can_send_api(violation_type):
        # Update cooldown
        violation_manager.update_api_cooldown(violation_type)
        
        # Play alarm
        play_alarm_async()
        
        # Kirim ke API di thread terpisah
        api_thread = threading.Thread(
            target=send_violation_to_api,
            args=(frame, violation_type, duration, driver_name)
        )
        api_thread.daemon = True
        api_thread.start()
        
        print(f"🚨 PELANGGARAN {violation_type.upper()}! Durasi: {duration:.2f} detik")
    else:
        # Hanya play alarm tanpa kirim API (masih dalam cooldown)
        play_alarm_async()

# ============================================
# FUNGSI FACE RECOGNITION
# ============================================

def detect_faces_opencv(frame):
    """
    Mendeteksi wajah menggunakan OpenCV Haar Cascade
    Returns: list dari (x, y, w, h) bounding box wajah
    """
    try:
        # Load Haar Cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert ke grayscale untuk deteksi
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Deteksi wajah
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Convert ke format (top, right, bottom, left) seperti face_recognition
        face_locations = []
        for (x, y, w, h) in faces:
            top = y
            right = x + w
            bottom = y + h
            left = x
            face_locations.append((top, right, bottom, left))
        
        return face_locations
    except Exception as e:
        print(f"⚠️ Error deteksi wajah OpenCV: {e}")
        return []

def recognize_face_simple(frame, face_locations):
    """
    Face recognition sederhana menggunakan OpenCV
    Untuk skripsi, face detection sudah cukup untuk anti-tampering
    Returns: (driver_name, confidence)
    """
    # Untuk implementasi sederhana, kita gunakan driver default
    # Face recognition penuh memerlukan training data yang kompleks
    return DRIVER_NAME, 100.0

# ============================================
# FUNGSI INISIALISASI KAMERA
# ============================================

def _camera_backend_candidates():
    """Urutan backend VideoCapture untuk Windows (MSMF sering lebih stabil dari DSHOW)."""
    backend_map = {
        "dshow": [(cv2.CAP_DSHOW, "DSHOW")],
        "msmf": [(cv2.CAP_MSMF, "MSMF")],
        "default": [(None, "default")],
    }
    if CAMERA_BACKEND in backend_map:
        return backend_map[CAMERA_BACKEND]

    if os.name == "nt":
        return [
            (cv2.CAP_MSMF, "MSMF"),
            (cv2.CAP_DSHOW, "DSHOW"),
            (None, "default"),
        ]
    return [(None, "default")]


def _video_capture_params():
    """Timeout agar backend yang gagal tidak menggantung puluhan detik (Windows)."""
    if not hasattr(cv2, "CAP_PROP_OPEN_TIMEOUT_MSEC"):
        return []
    return [
        cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 3000,
        cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000,
    ]


def _create_video_capture(source, backend_flag, backend_name):
    """Buka VideoCapture; source = indeks int atau path file video."""
    params = _video_capture_params() if isinstance(source, int) else []
    try:
        if backend_flag is None:
            cap = cv2.VideoCapture(source, params=params) if params else cv2.VideoCapture(source)
        else:
            cap = (
                cv2.VideoCapture(source, backend_flag, params)
                if params
                else cv2.VideoCapture(source, backend_flag)
            )
    except Exception:
        return None

    if not cap.isOpened():
        cap.release()
        return None

    if isinstance(source, int):
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, TARGET_FPS)
        try:
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass

    return cap


def _warmup_capture(cap):
    """Pastikan kamera benar-benar mengirim frame (isOpened() saja tidak cukup di Windows)."""
    for _ in range(CAMERA_WARMUP_FRAMES):
        ret, frame = cap.read()
        if ret and frame is not None and frame.size > 0:
            return True
        time.sleep(0.05)
    return False


def open_camera_capture():
    """
    Buka kamera dengan beberapa backend dan indeks.
    Returns: (cap, info_string) atau (None, None) jika gagal.
    """
    indices = [CAMERA_INDEX]
    for idx in range(CAMERA_MAX_INDEX + 1):
        if idx not in indices:
            indices.append(idx)

    backends = _camera_backend_candidates()

    for index in indices:
        for backend_flag, backend_name in backends:
            label = f"index={index}, backend={backend_name}"
            print(f"   Mencoba kamera ({label})...")
            cap = _create_video_capture(index, backend_flag, backend_name)
            if cap is None:
                continue
            if _warmup_capture(cap):
                print(f"✅ Kamera aktif ({label})")
                return cap, label
            cap.release()
            print(f"   ⚠️ Terbuka tetapi tidak ada frame valid ({label})")

    return None, None


def open_video_source():
    """Buka file video simulasi atau kamera fisik."""
    if VIDEO_SIMULATION_PATH and os.path.exists(VIDEO_SIMULATION_PATH):
        print(f"⏳ Menggunakan video simulasi: {VIDEO_SIMULATION_PATH}")
        cap = cv2.VideoCapture(VIDEO_SIMULATION_PATH)
        if cap.isOpened() and _warmup_capture(cap):
            return cap, "simulation", True
        if cap is not None:
            cap.release()
        return None, None, True

    print("⏳ Menginisialisasi kamera...")
    cap, info = open_camera_capture()
    return cap, info, False


# ============================================
# FUNGSI UTAMA MONITORING
# ============================================

def main():
    """
    Fungsi utama sistem monitoring DMS
    """
    print("🚀 Memulai Sistem Driver Monitoring System (DMS)...")
    print(f"📷 Model YOLOv8: {MODEL_PATH}")
    print(f"🌐 Backend API: {BACKEND_API_URL}")
    print(f"📁 Snapshot Directory: {SNAPSHOT_DIR}")
    
    # Pastikan directory snapshot ada
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    
    # Load model YOLOv8
    print("⏳ Memuat model YOLOv8...")
    try:
        model = YOLO(MODEL_PATH)
        print("✅ Model YOLOv8 berhasil dimuat")
    except Exception as e:
        print(f"❌ Gagal memuat model YOLOv8: {e}")
        return
    
    # Inisialisasi kamera atau video simulasi
    cap = None
    camera_info = None
    cap, camera_info, use_simulation = open_video_source()

    if cap is None:
        print("❌ Gagal membuka kamera/video")
        if use_simulation:
            print(f"💡 Pastikan file video ada: {VIDEO_SIMULATION_PATH}")
        else:
            print("💡 Tips: Pastikan kamera terhubung dan tidak dipakai aplikasi lain (Teams, Zoom, kamera Windows)")
            print("💡 Tips: Aktifkan akses kamera: Pengaturan Windows → Privasi → Kamera")
            print(f"💡 Tips: Ubah CAMERA_INDEX (saat ini {CAMERA_INDEX}) atau CAMERA_BACKEND ('dshow' / 'msmf')")
            print("💡 Tips: Atau set VIDEO_SIMULATION_PATH ke file .mp4 untuk uji tanpa kamera")
        return
    
    # Load known face encodings (jika ada)
    known_encodings = []
    known_names = []
    
    # Path file encoding driver
    encodings_file = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_encodings.pkl"
    
    if os.path.exists(encodings_file):
        try:
            with open(encodings_file, 'rb') as f:
                data = pickle.load(f)
                known_encodings = data['encodings']
                known_names = data['names']
            print(f"✅ Berhasil memuat {len(known_names)} encoding driver")
            print(f"👥 Driver terdaftar: {', '.join(known_names)}")
        except Exception as e:
            print(f"⚠️ Gagal memuat encodings: {e}")
            print("💡 Menggunakan driver default")
    else:
        print("⚠️ File encoding tidak ditemukan")
        print(f"💡 Buat encoding dengan: python encode_driver_faces.py")
        print("💡 Menggunakan driver default untuk saat ini")
    
    # Inisialisasi violation manager
    violation_manager = ViolationManager()
    
    # Counter untuk frame skipping face recognition
    frame_count = 0
    
    # Buffer untuk smoothing deteksi
    detection_buffer = deque(maxlen=5)
    
    # Driver name saat ini
    current_driver_name = DRIVER_NAME
    
    print("🎥 Memulai monitoring kamera...")
    if camera_info:
        print(f"📷 Sumber video: {camera_info}")
    print("Tekan 'q' untuk keluar")
    
    try:
        while True:
            # Baca frame dari kamera
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Gagal membaca frame dari kamera")
                break
            
            # Increment frame counter
            frame_count += 1
            
            # ========================================
            # PROSES OBJECT DETECTION (YOLOv8)
            # ========================================
            results = model(frame, verbose=False)
            
            # Ekstrak deteksi
            detections = results[0]
            
            # Flag untuk setiap jenis pelanggaran
            is_smoking_detected = False
            is_eyes_closed_detected = False
            is_yawn_detected = False
            is_safe_driving = False
            
            # Proses setiap deteksi
            for box in detections.boxes:
                # Ambil class ID dan confidence
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                # Mapping class ID ke nama kelas (sesuai model)
                # Mapping yang benar: 0=eyes-closed, 1=safe-driving, 2=smoking, 3=yawn
                class_names = ['eyes-closed', 'safe-driving', 'smoking', 'yawn']
                class_name = class_names[class_id] if class_id < len(class_names) else 'unknown'
                
                # Debug: Tampilkan semua deteksi
                if DEBUG_MODE:
                    print(f"🔍 Deteksi: {class_name} (Confidence: {confidence:.2f})")
                
                # Filter berdasarkan confidence threshold
                if confidence < CONFIDENCE_THRESHOLD:
                    if DEBUG_MODE:
                        print(f"   ❌ Ditolak (threshold: {CONFIDENCE_THRESHOLD})")
                    continue
                
                # Debug: Tampilkan deteksi yang lolos threshold
                if DEBUG_MODE:
                    print(f"   ✅ Diterima")
                
                # Update flag berdasarkan class
                if class_name == 'smoking':
                    is_smoking_detected = True
                elif class_name == 'eyes-closed':
                    is_eyes_closed_detected = True
                elif class_name == 'yawn':
                    is_yawn_detected = True
                elif class_name == 'safe-driving':
                    is_safe_driving = True
            
            # ========================================
            # PROSES FACE DETECTION (dengan frame skipping)
            # ========================================
            face_locations = []
            
            if ENABLE_FACE_DETECTION and frame_count % FACE_RECOGNITION_SKIP_FRAMES == 0:
                # Deteksi lokasi wajah menggunakan OpenCV Haar Cascade
                try:
                    face_locations = detect_faces_opencv(frame)
                    
                    # Jika ada wajah terdeteksi, lakukan recognition sederhana
                    if len(face_locations) > 0:
                        driver_name, confidence = recognize_face_simple(frame, face_locations)
                        current_driver_name = driver_name
                            
                except Exception as e:
                    print(f"⚠️ Error deteksi wajah: {e}")
            # Jika face detection dinonaktifkan, biarkan face_locations kosong
            # Fitur camera covered akan dinonaktifkan otomatis
            
            # ========================================
            # CEK PELANGGARAN & UPDATE STATUS
            # ========================================
            
            # Cek pelanggaran smoking
            is_smoking_violation, smoking_duration = violation_manager.check_smoking_violation(
                is_smoking_detected
            )
            
            # Cek pelanggaran microsleep (logika sekuensial)
            is_microsleep_violation, microsleep_duration = violation_manager.check_microsleep_violation(
                is_eyes_closed_detected, is_yawn_detected
            )
            
            # Cek pelanggaran camera covered (dinonaktifkan karena face detection off)
            is_camera_covered_violation = False
            camera_covered_duration = 0
            # is_camera_covered_violation, camera_covered_duration = violation_manager.check_camera_covered_violation(
            #     len(face_locations)
            # )
            
            # Reset drowsy flag jika safe driving
            if is_safe_driving and not is_smoking_detected and not is_eyes_closed_detected:
                violation_manager.reset_drowsy_flag()
            
            # ========================================
            # HANDLE PELANGGARAN
            # ========================================
            
            if is_smoking_violation:
                handle_violation(
                    violation_manager, frame, "smoking", 
                    smoking_duration, current_driver_name
                )
                violation_manager.current_status = "danger"
                violation_manager.active_violations.add("smoking")
                
            if is_microsleep_violation:
                handle_violation(
                    violation_manager, frame, "microsleep", 
                    microsleep_duration, current_driver_name
                )
                violation_manager.current_status = "danger"
                violation_manager.active_violations.add("microsleep")
                
            if is_camera_covered_violation:
                handle_violation(
                    violation_manager, frame, "camera_covered", 
                    camera_covered_duration, current_driver_name
                )
                violation_manager.current_status = "danger"
                violation_manager.active_violations.add("camera_covered")
            
            # Update status jika tidak ada pelanggaran aktif
            if not (is_smoking_violation or is_microsleep_violation or is_camera_covered_violation):
                # Jika tidak ada pelanggaran aktif, status adalah safe
                violation_manager.current_status = "safe"
                violation_manager.active_violations.clear()
            
            # ========================================
            # DRAW VISUAL INDICATORS
            # ========================================
            
            # Copy frame untuk drawing
            display_frame = frame.copy()
            
            # Draw status text di pojok kiri atas
            if violation_manager.current_status == "safe":
                status_text = "STATUS: AMAN (DRIVING SAFE)"
                status_color = (0, 255, 0)  # Hijau
                
                # Jika safe-driving, HAPUS semua bounding box
                # Tidak draw bounding box untuk safe-driving
                
            elif violation_manager.current_status == "danger":
                status_text = "STATUS: PERINGATAN / BAHAYA!"
                status_color = (0, 0, 255)  # Merah
                
                # Draw bounding box MERAH hanya untuk pelanggaran
                for box in detections.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # Mapping yang benar: 0=eyes-closed, 1=safe-driving, 2=smoking, 3=yawn
                    class_names = ['eyes-closed', 'safe-driving', 'smoking', 'yawn']
                    class_name = class_names[class_id] if class_id < len(class_names) else 'unknown'
                    
                    # Hanya draw jika pelanggaran dan confidence cukup tinggi
                    if confidence >= CONFIDENCE_THRESHOLD and class_name in ['smoking', 'eyes-closed', 'yawn']:
                        # Ambil koordinat bounding box
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        
                        # Draw bounding box merah
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        
                        # Draw label
                        label = f"{class_name}: {confidence:.2f}"
                        cv2.putText(display_frame, label, (x1, y1 - 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            else:
                status_text = "STATUS: WARNING"
                status_color = (0, 165, 255)  # Orange
            
            # Draw status text
            cv2.putText(display_frame, status_text, (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)
            
            # Draw info driver
            driver_info = f"Driver: {current_driver_name}"
            cv2.putText(display_frame, driver_info, (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Draw FPS
            fps = cap.get(cv2.CAP_PROP_FPS)
            fps_info = f"FPS: {fps:.1f}"
            cv2.putText(display_frame, fps_info, (10, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Draw face count
            face_count_info = f"Faces: {len(face_locations)}"
            cv2.putText(display_frame, face_count_info, (10, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # ========================================
            # DISPLAY FRAME
            # ========================================
            
            cv2.imshow('DMS - Driver Monitoring System', display_frame)
            
            # Exit dengan tombol 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring dihentikan oleh user")
    except Exception as e:
        print(f"❌ Error dalam monitoring: {e}")
    finally:
        if cap is not None:
            cap.release()
        cv2.destroyAllWindows()
        print("🔚 Sistem DMS dimatikan")

if __name__ == "__main__":
    main()
