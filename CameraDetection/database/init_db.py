"""
Script Inisialisasi Database SQLite untuk Sistem DMS
Database ini akan menyimpan log riwayat pelanggaran dan data pengemudi
"""

import sqlite3
import os
from datetime import datetime

# Path absolut ke database
DB_PATH = r"D:\Kuliah\Semester Akhir 2.0\Skripsi\CameraDetection\database\dms_fleet.db"

def create_database():
    """
    Membuat database dan tabel-tabel yang diperlukan untuk sistem DMS
    """
    
    # Membuat koneksi ke database (akan dibuat otomatis jika belum ada)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tabel 1: drivers - Menyimpan data profil pengemudi
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            license_plate TEXT NOT NULL UNIQUE,
            face_encoding_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabel 2: violations - Menyimpan log riwayat pelanggaran
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER,
            violation_type TEXT NOT NULL,
            violation_description TEXT,
            snapshot_path TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            duration_seconds REAL,
            severity TEXT DEFAULT 'medium',
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    ''')
    
    # Tabel 3: system_logs - Menyimpan log aktivitas sistem
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_type TEXT NOT NULL,
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabel 4: monitoring_status - Menyimpan status real-time monitoring
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monitoring_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER,
            current_status TEXT DEFAULT 'inactive',
            last_violation_type TEXT,
            last_violation_time TIMESTAMP,
            camera_status TEXT DEFAULT 'active',
            last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    ''')
    
    # Membuat indeks untuk optimasi query
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_violations_timestamp 
        ON violations(timestamp DESC)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_violations_driver_id 
        ON violations(driver_id)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_violations_type 
        ON violations(violation_type)
    ''')
    
    # Commit perubahan
    conn.commit()
    
    # Menambahkan data pengemudi contoh (opsional)
    cursor.execute('''
        INSERT OR IGNORE INTO drivers (name, license_plate, face_encoding_path)
        VALUES (?, ?, ?)
    ''', ('Driver Demo', 'B 1234 XYZ', 'encodings/driver_demo.pkl'))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database berhasil dibuat di: {DB_PATH}")
    print("📊 Tabel yang dibuat:")
    print("   - drivers (data profil pengemudi)")
    print("   - violations (log riwayat pelanggaran)")
    print("   - system_logs (log aktivitas sistem)")
    print("   - monitoring_status (status real-time monitoring)")

def test_connection():
    """
    Menguji koneksi database dan menampilkan data awal
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Cek jumlah data di setiap tabel
    cursor.execute("SELECT COUNT(*) FROM drivers")
    driver_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM violations")
    violation_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM system_logs")
    log_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM monitoring_status")
    status_count = cursor.fetchone()[0]
    
    conn.close()
    
    print(f"\n📈 Statistik Database:")
    print(f"   - Total Pengemudi: {driver_count}")
    print(f"   - Total Pelanggaran: {violation_count}")
    print(f"   - Total Log Sistem: {log_count}")
    print(f"   - Total Status Monitoring: {status_count}")

if __name__ == "__main__":
    print("🚀 Memulai inisialisasi database DMS Fleet...")
    create_database()
    test_connection()
    print("\n✨ Inisialisasi database selesai!")
