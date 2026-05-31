/**
 * Backend Server untuk Driver Monitoring System (DMS)
 * Node.js Express dengan REST API
 * Menerima data pelanggaran dari Python dan menyediakan endpoint untuk React Dashboard
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ============================================
// KONFIGURASI SERVER
// ============================================

const PORT = 3000;
const DB_PATH = path.join(__dirname, '../database/dms_fleet.db');
const SNAPSHOTS_DIR = path.join(__dirname, '../snapshots');

// Pastikan directory snapshots ada
if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

function normalizeText(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseFloatValue(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function runStatement(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function getTableColumns(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map((row) => row.name));
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await getTableColumns(tableName);
  if (!columns.includes(columnName)) {
    await runStatement(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

// ============================================
// INISIALISASI EXPRESS
// ============================================

const app = express();

// Middleware
app.use(cors()); // Enable CORS untuk React frontend
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// Serve static files (snapshots)
app.use('/snapshots', express.static(SNAPSHOTS_DIR));

// ============================================
// KONFIGURASI MULTER (FILE UPLOAD)
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SNAPSHOTS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate nama file unik dengan timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const filename = `${timestamp}_${originalName}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit 10MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya terima file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan'), false);
    }
  }
});

// ============================================
// KONEKSI DATABASE SQLITE
// ============================================

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error koneksi database:', err.message);
  } else {
    console.log('✅ Terhubung ke database SQLite');
    initializeDatabase().catch((initError) => {
      console.error('❌ Gagal inisialisasi database:', initError.message);
    });
  }
});

// Fungsi inisialisasi tabel database
async function initializeDatabase() {
  await runStatement(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_plate TEXT NOT NULL UNIQUE,
      photo_url TEXT,
      face_encoding_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runStatement(`
    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER,
      driver_name TEXT,
      violation_type TEXT NOT NULL,
      violation_description TEXT,
      snapshot_path TEXT,
      snapshot_filename TEXT,
      snapshot_mime_type TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_seconds REAL,
      severity TEXT DEFAULT 'medium',
      source TEXT DEFAULT 'edge',
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    )
  `);

  await runStatement(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_type TEXT NOT NULL,
      message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runStatement(`
    CREATE TABLE IF NOT EXISTS monitoring_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER,
      driver_name TEXT,
      current_status TEXT DEFAULT 'inactive',
      last_violation_type TEXT,
      last_violation_time TIMESTAMP,
      camera_status TEXT DEFAULT 'active',
      last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    )
  `);

  await ensureColumn('drivers', 'photo_url', 'photo_url TEXT');
  await ensureColumn('violations', 'driver_id', 'driver_id INTEGER');
  await ensureColumn('violations', 'driver_name', 'driver_name TEXT');
  await ensureColumn('violations', 'violation_type', 'violation_type TEXT');
  await ensureColumn('violations', 'violation_description', 'violation_description TEXT');
  await ensureColumn('violations', 'snapshot_path', 'snapshot_path TEXT');
  await ensureColumn('violations', 'snapshot_filename', 'snapshot_filename TEXT');
  await ensureColumn('violations', 'snapshot_mime_type', 'snapshot_mime_type TEXT');
  await ensureColumn('violations', 'timestamp', 'timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('violations', 'duration_seconds', 'duration_seconds REAL');
  await ensureColumn('violations', 'severity', "severity TEXT DEFAULT 'medium'");
  await ensureColumn('violations', 'source', "source TEXT DEFAULT 'edge'");
  await ensureColumn('monitoring_status', 'driver_id', 'driver_id INTEGER');
  await ensureColumn('monitoring_status', 'driver_name', 'driver_name TEXT');
  await ensureColumn('monitoring_status', 'current_status', "current_status TEXT DEFAULT 'inactive'");
  await ensureColumn('monitoring_status', 'last_violation_type', 'last_violation_type TEXT');
  await ensureColumn('monitoring_status', 'last_violation_time', 'last_violation_time TIMESTAMP');
  await ensureColumn('monitoring_status', 'camera_status', "camera_status TEXT DEFAULT 'active'");
  await ensureColumn('monitoring_status', 'last_heartbeat', 'last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await runStatement(`CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp DESC)`);
  await runStatement(`CREATE INDEX IF NOT EXISTS idx_violations_driver_id ON violations(driver_id)`);
  await runStatement(`CREATE INDEX IF NOT EXISTS idx_violations_type ON violations(violation_type)`);

  console.log('✅ Tabel database berhasil diinisialisasi');
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/violations
 * Menerima data pelanggaran dari Python script
 * Body: driver_name, violation_type, timestamp, duration_seconds, description, snapshot (file)
 */
app.post('/api/violations', upload.single('snapshot'), (req, res) => {
  try {
    const {
      driver_id,
      driver_name,
      violation_type,
      timestamp,
      duration_seconds,
      description,
      source,
    } = req.body;
    const snapshot_path = req.file
      ? `/snapshots/${req.file.filename}`
      : normalizeText(req.body.snapshot_path || req.body.snapshot_url || req.body.evidence_url);

    // Log data yang diterima
    console.log('📥 Data pelanggaran diterima:');
    console.log(`   Driver: ${driver_name}`);
    console.log(`   Tipe: ${violation_type}`);
    console.log(`   Durasi: ${duration_seconds}s`);
    console.log(`   Snapshot: ${snapshot_path}`);

    // Insert ke database
    if (!violation_type) {
      return res.status(400).json({ error: 'violation_type wajib diisi' });
    }

    // Tentukan severity berdasarkan tipe pelanggaran
    let severity = 'medium';
    if (violation_type === 'microsleep' || violation_type === 'camera_covered') {
      severity = 'high';
    } else if (violation_type === 'smoking') {
      severity = 'medium';
    }

    db.run(
      `
      INSERT INTO violations (
        driver_id,
        driver_name,
        violation_type,
        violation_description,
        snapshot_path,
        snapshot_filename,
        snapshot_mime_type,
        timestamp,
        duration_seconds,
        severity,
        source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        driver_id ? parseInteger(driver_id, null) : null,
        driver_name || 'Unknown',
        violation_type,
        description || null,
        snapshot_path,
        req.file?.filename || null,
        req.file?.mimetype || null,
        timestamp || new Date().toISOString(),
        parseFloatValue(duration_seconds, 0),
        severity,
        source || 'edge',
      ],
      function(err) {
      if (err) {
        console.error('❌ Error insert pelanggaran:', err.message);
        return res.status(500).json({ error: 'Gagal menyimpan data pelanggaran' });
      }

      // Update monitoring status
      updateMonitoringStatus(driver_name, violation_type);

      // Log ke system_logs
      logSystemEvent('violation_received', `Pelanggaran ${violation_type} dari driver ${driver_name}`);

      res.status(200).json({
        success: true,
        message: 'Data pelanggaran berhasil disimpan',
        violation_id: this.lastID,
        data: {
          id: this.lastID,
          driver_id: driver_id ? parseInteger(driver_id, null) : null,
          driver_name: driver_name || 'Unknown',
          violation_type,
          violation_description: description || null,
          snapshot_path,
          snapshot_url: snapshot_path ? `http://localhost:${PORT}${snapshot_path}` : null,
          timestamp: timestamp || new Date().toISOString(),
          duration_seconds: parseFloatValue(duration_seconds, 0),
          severity,
          source: source || 'edge',
        },
      });
    });

  } catch (error) {
    console.error('❌ Error processing violation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/violations
 * Mendapatkan semua data pelanggaran
 * Query params: limit, offset, driver_name, violation_type, start_date, end_date
 */
app.get('/api/violations', (req, res) => {
  try {
    const { limit = 50, offset = 0, driver_name, violation_type, start_date, end_date } = req.query;

    let query = 'SELECT * FROM violations WHERE 1=1';
    const params = [];

    // Filter berdasarkan driver_name
    if (driver_name) {
      query += ' AND driver_name LIKE ?';
      params.push(`%${driver_name}%`);
    }

    // Filter berdasarkan violation_type
    if (violation_type) {
      query += ' AND violation_type = ?';
      params.push(violation_type);
    }

    // Filter berdasarkan rentang tanggal
    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    // Order by timestamp descending (terbaru dulu)
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching violations:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil data pelanggaran' });
      }

      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length
      });
    });

  } catch (error) {
    console.error('❌ Error fetching violations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/violations/:id
 * Mendapatkan detail satu pelanggaran
 */
app.get('/api/violations/:id', (req, res) => {
  const violationId = parseInteger(req.params.id, null);
  if (violationId === null) {
    return res.status(400).json({ error: 'ID pelanggaran tidak valid' });
  }

  db.get('SELECT * FROM violations WHERE id = ?', [violationId], (err, row) => {
    if (err) {
      console.error('❌ Error fetching violation:', err.message);
      return res.status(500).json({ error: 'Gagal mengambil detail pelanggaran' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Pelanggaran tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...row,
        snapshot_url: row.snapshot_path ? `http://localhost:${PORT}${row.snapshot_path}` : null,
      },
    });
  });
});

/**
 * GET /api/violations/:id/evidence
 * Mendapatkan metadata bukti pelanggaran
 */
app.get('/api/violations/:id/evidence', (req, res) => {
  const violationId = parseInteger(req.params.id, null);
  if (violationId === null) {
    return res.status(400).json({ error: 'ID pelanggaran tidak valid' });
  }

  db.get(
    'SELECT id, driver_name, violation_type, snapshot_path, snapshot_filename, snapshot_mime_type FROM violations WHERE id = ?',
    [violationId],
    (err, row) => {
      if (err) {
        console.error('❌ Error fetching evidence:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil bukti pelanggaran' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Bukti pelanggaran tidak ditemukan' });
      }

      res.status(200).json({
        success: true,
        data: {
          ...row,
          snapshot_url: row.snapshot_path ? `http://localhost:${PORT}${row.snapshot_path}` : null,
        },
      });
    },
  );
});

/**
 * GET /api/violations/stats
 * Mendapatkan statistik pelanggaran
 */
app.get('/api/violations/stats', (req, res) => {
  try {
    // Total pelanggaran
    db.get('SELECT COUNT(*) as total FROM violations', (err, totalRow) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal mengambil statistik' });
      }

      // Statistik per tipe pelanggaran
      db.all(`
        SELECT violation_type, COUNT(*) as count, AVG(duration_seconds) as avg_duration
        FROM violations
        GROUP BY violation_type
      `, (err, typeStats) => {
        if (err) {
          return res.status(500).json({ error: 'Gagal mengambil statistik per tipe' });
        }

        // Statistik per driver
        db.all(`
          SELECT driver_name, COUNT(*) as count
          FROM violations
          GROUP BY driver_name
          ORDER BY count DESC
          LIMIT 10
        `, (err, driverStats) => {
          if (err) {
            return res.status(500).json({ error: 'Gagal mengambil statistik per driver' });
          }

          // Pelanggaran hari ini
          db.get(`
            SELECT COUNT(*) as today_count
            FROM violations
            WHERE DATE(timestamp) = DATE('now')
          `, (err, todayRow) => {
            if (err) {
              return res.status(500).json({ error: 'Gagal mengambil statistik hari ini' });
            }

            res.status(200).json({
              success: true,
              stats: {
                total: totalRow.total,
                today_count: todayRow.today_count,
                by_type: typeStats,
                by_driver: driverStats
              }
            });
          });
        });
      });
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/drivers
 * Mendapatkan semua data driver
 */
app.get('/api/drivers', (req, res) => {
  try {
    db.all(
      `
        SELECT
          drivers.*,
          (
            SELECT COUNT(*)
            FROM violations
            WHERE violations.driver_id = drivers.id
          ) AS violation_count
        FROM drivers
        ORDER BY created_at DESC
      `,
      (err, rows) => {
      if (err) {
        console.error('❌ Error fetching drivers:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil data driver' });
      }

      res.status(200).json({
        success: true,
        data: rows
      });
    });

  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/drivers/:id
 * Mendapatkan detail driver beserta bukti pelanggaran terbarunya
 */
app.get('/api/drivers/:id', (req, res) => {
  const driverId = parseInteger(req.params.id, null);
  if (driverId === null) {
    return res.status(400).json({ error: 'ID driver tidak valid' });
  }

  db.get('SELECT * FROM drivers WHERE id = ?', [driverId], (err, driverRow) => {
    if (err) {
      console.error('❌ Error fetching driver:', err.message);
      return res.status(500).json({ error: 'Gagal mengambil data driver' });
    }

    if (!driverRow) {
      return res.status(404).json({ error: 'Driver tidak ditemukan' });
    }

    db.all(
      `
        SELECT *
        FROM violations
        WHERE driver_id = ?
        ORDER BY timestamp DESC
      `,
      [driverId],
      (violationErr, violations) => {
        if (violationErr) {
          console.error('❌ Error fetching driver violations:', violationErr.message);
          return res.status(500).json({ error: 'Gagal mengambil riwayat pelanggaran driver' });
        }

        res.status(200).json({
          success: true,
          data: {
            ...driverRow,
            photo_url: driverRow.photo_url || null,
            violations: violations.map((violation) => ({
              ...violation,
              snapshot_url: violation.snapshot_path ? `http://localhost:${PORT}${violation.snapshot_path}` : null,
            })),
          },
        });
      },
    );
  });
});

/**
 * POST /api/drivers
 * Menambahkan driver baru
 */
app.post('/api/drivers', (req, res) => {
  try {
    const {
      name,
      license_plate,
      vehiclePlate,
      photo_url,
      photoUrl,
      face_encoding_path,
    } = req.body;
    const normalizedName = normalizeText(name);
    const normalizedPlate = normalizeText(license_plate || vehiclePlate);
    const normalizedPhoto = normalizeText(photo_url || photoUrl);

    if (!normalizedName || !normalizedPlate) {
      return res.status(400).json({ error: 'Nama dan license plate wajib diisi' });
    }

    const query = `
      INSERT INTO drivers (name, license_plate, photo_url, face_encoding_path, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.run(query, [normalizedName, normalizedPlate, normalizedPhoto, normalizeText(face_encoding_path)], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'License plate sudah terdaftar' });
        }
        console.error('❌ Error insert driver:', err.message);
        return res.status(500).json({ error: 'Gagal menambahkan driver' });
      }

      res.status(201).json({
        success: true,
        message: 'Driver berhasil ditambahkan',
        driver_id: this.lastID,
        data: {
          id: this.lastID,
          name: normalizedName,
          license_plate: normalizedPlate,
          photo_url: normalizedPhoto,
          face_encoding_path: normalizeText(face_encoding_path),
        },
      });
    });

  } catch (error) {
    console.error('❌ Error adding driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/drivers/:id
 * Menghapus driver berdasarkan ID
 */
app.delete('/api/drivers/:id', (req, res) => {
  const driverId = parseInteger(req.params.id, null);
  if (driverId === null) {
    return res.status(400).json({ error: 'ID driver tidak valid' });
  }

  db.run('DELETE FROM drivers WHERE id = ?', [driverId], function(err) {
    if (err) {
      console.error('❌ Error delete driver:', err.message);
      return res.status(500).json({ error: 'Gagal menghapus driver' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Driver tidak ditemukan' });
    }

    logSystemEvent('driver_deleted', `Driver ID ${driverId} dihapus dari sistem`);

    res.status(200).json({
      success: true,
      message: 'Driver berhasil dihapus',
    });
  });
});

/**
 * GET /api/drivers/:id/violations
 * Mendapatkan riwayat pelanggaran per driver
 */
app.get('/api/drivers/:id/violations', (req, res) => {
  const driverId = parseInteger(req.params.id, null);
  if (driverId === null) {
    return res.status(400).json({ error: 'ID driver tidak valid' });
  }

  const { limit = 100 } = req.query;

  db.all(
    `
      SELECT *
      FROM violations
      WHERE driver_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `,
    [driverId, parseInteger(limit, 100)],
    (err, rows) => {
      if (err) {
        console.error('❌ Error fetching driver violations:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil riwayat pelanggaran driver' });
      }

      res.status(200).json({
        success: true,
        data: rows.map((row) => ({
          ...row,
          snapshot_url: row.snapshot_path ? `http://localhost:${PORT}${row.snapshot_path}` : null,
        })),
      });
    },
  );
});

/**
 * GET /api/monitoring/status
 * Mendapatkan status monitoring terbaru
 */
app.get('/api/monitoring/status', (req, res) => {
  try {
    db.get(`
      SELECT * FROM monitoring_status
      ORDER BY last_heartbeat DESC
      LIMIT 1
    `, (err, row) => {
      if (err) {
        console.error('❌ Error fetching monitoring status:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil status monitoring' });
      }

      res.status(200).json({
        success: true,
        data: row || null
      });
    });

  } catch (error) {
    console.error('❌ Error fetching monitoring status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/monitoring/heartbeat
 * Menerima heartbeat dari edge device
 */
app.post('/api/monitoring/heartbeat', (req, res) => {
  try {
    const { driver_name, current_status, camera_status } = req.body;

    const query = `
      INSERT INTO monitoring_status (driver_name, current_status, camera_status, last_heartbeat)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [
      driver_name || 'Unknown',
      current_status || 'inactive',
      camera_status || 'active',
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error('❌ Error insert heartbeat:', err.message);
        return res.status(500).json({ error: 'Gagal menyimpan heartbeat' });
      }

      res.status(200).json({
        success: true,
        message: 'Heartbeat berhasil disimpan'
      });
    });

  } catch (error) {
    console.error('❌ Error processing heartbeat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/logs
 * Mendapatkan log sistem
 */
app.get('/api/logs', (req, res) => {
  try {
    const { limit = 100 } = req.query;

    db.all(`
      SELECT * FROM system_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `, [parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('❌ Error fetching logs:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil log sistem' });
      }

      res.status(200).json({
        success: true,
        data: rows
      });
    });

  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateMonitoringStatus(driverName, violationType) {
  const query = `
    INSERT INTO monitoring_status (driver_name, current_status, last_violation_type, last_violation_time, last_heartbeat)
    VALUES (?, 'danger', ?, ?, ?)
  `;

  db.run(query, [
    driverName || 'Unknown',
    violationType,
    new Date().toISOString(),
    new Date().toISOString()
  ], (err) => {
    if (err) {
      console.error('❌ Error update monitoring status:', err.message);
    }
  });
}

function logSystemEvent(logType, message) {
  const query = `
    INSERT INTO system_logs (log_type, message)
    VALUES (?, ?)
  `;

  db.run(query, [logType, message], (err) => {
    if (err) {
      console.error('❌ Error insert log:', err.message);
    }
  });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('🚀 Backend Server DMS berjalan');
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`📸 Snapshots: ${SNAPSHOTS_DIR}`);
  console.log('\n📋 API Endpoints tersedia:');
  console.log('   POST   /api/violations          - Terima data pelanggaran');
  console.log('   GET    /api/violations          - Ambil semua pelanggaran');
  console.log('   GET    /api/violations/stats    - Ambil statistik pelanggaran');
  console.log('   GET    /api/drivers             - Ambil semua driver');
  console.log('   POST   /api/drivers             - Tambah driver baru');
  console.log('   GET    /api/monitoring/status   - Ambil status monitoring');
  console.log('   POST   /api/monitoring/heartbeat - Kirim heartbeat');
  console.log('   GET    /api/logs                - Ambil log sistem');
});
