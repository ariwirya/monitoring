import { useState } from 'react';
import { DriverProvider } from './context/DriverContext';
import MainLayout from './components/layout/MainLayout';
import OverviewTab from './components/dashboard/OverviewTab';
import DriverListTab from './components/drivers/DriverListTab';
import AlertLogTab from './components/alerts/AlertLogTab';
import DMSTab from './components/dms/DMSTab';
import { TABS } from './constants/navigation';

const TAB_CONTENT = {
  [TABS.OVERVIEW]: OverviewTab,
  [TABS.DRIVERS]: DriverListTab,
  [TABS.ALERT_LOG]: AlertLogTab,
  [TABS.DMS]: DMSTab,
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const ActiveComponent = TAB_CONTENT[activeTab];

  return (
    <DriverProvider>
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <ActiveComponent />
      </MainLayout>
    </DriverProvider>
  );
}
