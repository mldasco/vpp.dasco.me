import { mockSystemState, mockActivity, mockPriceIntervals } from "@/lib/mock-data";
import StatusBar from "@/components/dashboard/StatusBar";
import MetricCards from "@/components/dashboard/MetricCards";
import EnergyFlow from "@/components/dashboard/EnergyFlow";
import PriceChart from "@/components/dashboard/PriceChart";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <StatusBar state={mockSystemState} />
      <MetricCards state={mockSystemState} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EnergyFlow state={mockSystemState} />
          <PriceChart intervals={mockPriceIntervals} />
        </div>
        <ActivityFeed entries={mockActivity} />
      </div>
    </div>
  );
}
