import SummaryCards from './SummaryCards';
import AlertTrendChart from './AlertTrendChart';

export default function OverviewTab() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-brand">Ringkasan</h3>
        <SummaryCards />
      </section>
      <section>
        <AlertTrendChart />
      </section>
    </div>
  );
}
