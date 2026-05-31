"""
Script Encoding Wajah Driver untuk Face Recognition
Script ini digunakan untuk mengencode foto driver menjadi file .pkl
yang dapat digunakan oleh sistem DMS untuk identifikasi driver

Catatan: Script ini memerlukan library face_recognition
Jika face_recognition sulit diinstall, gunakan OpenCV Haar Cascade sebagai alternatif
"""

import cv2
import pickle
import os
import sys

# Path ke folder foto driver
DRIVER_PHOTOS_DIR = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_photos"
# Path untuk menyimpan file encoding
ENCODINGS_FILE = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\driver_encodings.pkl"

def encode_faces_with_face_recognition():
    """
    Encode wajah menggunakan library face_recognition
    Returns: (encodings, names)
    """
    try:
        import face_recognition
        print("✅ Menggunakan face_recognition library")
    except ImportError:
        print("❌ Library face_recognition tidak terinstall")
        print("💡 Install dengan: pip install dlib-binary face_recognition")
        print("💡 Atau gunakan fungsi encode_faces_with_opencv() sebagai alternatif")
        return None, None

    known_encodings = []
    known_names = []

    # Cek folder driver_photos
    if not os.path.exists(DRIVER_PHOTOS_DIR):
        print(f"❌ Folder tidak ditemukan: {DRIVER_PHOTOS_DIR}")
        return None, None

    # Loop setiap file di folder driver_photos
    for filename in os.listdir(DRIVER_PHOTOS_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Ambil nama driver dari filename (tanpa ekstensi)
            driver_name = os.path.splitext(filename)[0]
            
            # Path lengkap ke foto
            image_path = os.path.join(DRIVER_PHOTOS_DIR, filename)
            
            print(f"⏳ Memproses: {filename} (Driver: {driver_name})")
            
            try:
                # Load image
                image = cv2.imread(image_path)
                rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Deteksi wajah
                boxes = face_recognition.face_locations(rgb, model='hog')
                
                if len(boxes) == 0:
                    print(f"⚠️ Tidak ada wajah terdeteksi di {filename}")
                    continue
                
                if len(boxes) > 1:
                    print(f"⚠️ Lebih dari 1 wajah terdeteksi di {filename}, menggunakan wajah pertama")
                
                # Encode wajah pertama
                encoding = face_recognition.face_encodings(rgb, boxes)[0]
                
                known_encodings.append(encoding)
                known_names.append(driver_name)
                
                print(f"✅ Berhasil encode: {driver_name}")
                
            except Exception as e:
                print(f"❌ Error memproses {filename}: {e}")
                continue

    return known_encodings, known_names

def encode_faces_with_opencv():
    """
    Encode wajah menggunakan OpenCV (alternatif jika face_recognition tidak tersedia)
    Ini adalah implementasi sederhana untuk face detection, bukan full recognition
    Returns: (encodings, names) - encodings berupa path foto
    """
    print("✅ Menggunakan OpenCV untuk face detection (mode alternatif)")
    
    known_encodings = []
    known_names = []

    # Cek folder driver_photos
    if not os.path.exists(DRIVER_PHOTOS_DIR):
        print(f"❌ Folder tidak ditemukan: {DRIVER_PHOTOS_DIR}")
        return None, None

    # Loop setiap file di folder driver_photos
    for filename in os.listdir(DRIVER_PHOTOS_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Ambil nama driver dari filename (tanpa ekstensi)
            driver_name = os.path.splitext(filename)[0]
            
            # Path lengkap ke foto
            image_path = os.path.join(DRIVER_PHOTOS_DIR, filename)
            
            print(f"⏳ Memproses: {filename} (Driver: {driver_name})")
            
            try:
                # Load image
                image = cv2.imread(image_path)
                
                # Deteksi wajah menggunakan Haar Cascade
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) == 0:
                    print(f"⚠️ Tidak ada wajah terdeteksi di {filename}")
                    continue
                
                # Simpan path foto sebagai "encoding" (sederhana)
                known_encodings.append(image_path)
                known_names.append(driver_name)
                
                print(f"✅ Berhasil deteksi wajah: {driver_name}")
                
            except Exception as e:
                print(f"❌ Error memproses {filename}: {e}")
                continue

    return known_encodings, known_names

def save_encodings(encodings, names):
    """
    Menyimpan encodings ke file .pkl
    """
    if not encodings or not names:
        print("❌ Tidak ada data untuk disimpan")
        return False

    data = {
        'encodings': encodings,
        'names': names
    }

    try:
        with open(ENCODINGS_FILE, 'wb') as f:
            pickle.dump(data, f)
        
        print(f"✅ Encodings berhasil disimpan ke: {ENCODINGS_FILE}")
        print(f"📊 Total driver: {len(names)}")
        print(f"👥 Daftar driver: {', '.join(names)}")
        return True
    except Exception as e:
        print(f"❌ Error menyimpan encodings: {e}")
        return False

def main():
    """
    Fungsi utama untuk encoding wajah driver
    """
    print("🚀 Memulai Encoding Wajah Driver...")
    print(f"📁 Folder Foto: {DRIVER_PHOTOS_DIR}")
    print(f"💾 File Output: {ENCODINGS_FILE}")
    print()

    # Coba gunakan face_recognition jika tersedia
    try:
        import face_recognition
        print("🔍 Menggunakan face_recognition library...")
        encodings, names = encode_faces_with_face_recognition()
    except ImportError:
        print("🔍 face_recognition tidak tersedia, menggunakan OpenCV...")
        encodings, names = encode_faces_with_opencv()

    # Simpan encodings
    if encodings and names:
        save_encodings(encodings, names)
    else:
        print("❌ Gagal melakukan encoding wajah")
        print("\n💡 Pastikan:")
        print("   1. Folder driver_photos berisi foto driver (.jpg, .jpeg, .png)")
        print("   2. Nama file = nama driver (contoh: 'budi.jpg', 'siti.png')")
        print("   3. Foto menampilkan wajah dengan jelas")

if __name__ == "__main__":
    main()
