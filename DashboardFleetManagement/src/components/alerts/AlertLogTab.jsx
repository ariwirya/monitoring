import AlertLogTable from './AlertLogTable';

export default function AlertLogTab() {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-brand">Log Peringatan Keseluruhan</h3>
        <p className="text-sm text-slate-500">
          Seluruh riwayat peringatan dari perangkat IoT — microsleep, merokok, dan kejernihan solar
        </p>
      </div>
      <AlertLogTable />
    </div>
  );
}
