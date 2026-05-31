# Dashboard Manajemen Armada

SPA React untuk memantau perilaku pengemudi dan kondisi kendaraan dari perangkat IoT.

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Recharts (grafik)
- Lucide React (ikon)

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`

## Struktur Proyek

```
src/
├── App.jsx                 # Root SPA & routing tab
├── constants/navigation.js # ID menu sidebar
├── data/mockData.js        # Mock data — ganti dengan API
├── types/alerts.js         # JSDoc tipe data
├── utils/
│   ├── alertUtils.js       # Agregasi & filter log
│   ├── dateUtils.js        # Format & periode filter
│   └── trendData.js        # Data grafik tren
└── components/
    ├── layout/             # Sidebar, MainLayout
    ├── dashboard/          # Overview, kartu, grafik
    ├── drivers/            # Grid sopir & modal riwayat
    ├── alerts/             # Tabel log keseluruhan
    └── ui/                 # Badge, Modal
```

## Integrasi API

1. Ganti `src/data/mockData.js` dengan service fetch (`src/services/api.js`).
2. Hook data di komponen tab atau gunakan React Query / SWR.
3. Tipe data mengikuti `src/types/alerts.js`.

### Endpoint yang disarankan

| Fitur | Data |
|-------|------|
| Summary cards | `GET /alerts/summary` |
| Grafik tren | `GET /alerts/trend?period=week` |
| Daftar sopir | `GET /drivers` |
| Riwayat sopir | `GET /drivers/:id/alerts` |
| Log keseluruhan | `GET /alerts?driverName=&date=` |

## Aturan Data Peringatan

- **Microsleep & Merokok**: `driverId`, `driverName`, `date`, `time`, `location`, `evidenceUrl`
- **Kejernihan Solar**: `driverId`, `driverName`, `date`, `time`, `location` (tanpa bukti foto)

## Fitur UI

- Branding: Smart Fleet Management PT. Indoefti
- Grafik tren: filter periode (hari / bulan / tahun) + filter jenis peringatan
- Lightbox bukti dokumentasi: zoom, unduh, tanpa tab baru
- Modal sopir: scrollable + unduh laporan PDF
