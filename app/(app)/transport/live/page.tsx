import LiveMap from "@/components/LiveMap";

export default function LiveTransportPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Live transport</h1>
          <p className="muted mt-1">Real-time positions · updates every 2s</p>
        </div>
      </div>
      <LiveMap />
    </div>
  );
}
