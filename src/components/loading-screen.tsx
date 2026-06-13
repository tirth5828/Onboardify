export function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="pulse-ring mx-auto mb-5 h-10 w-10 rounded-lg bg-[#315efb]" />
        <p className="eyebrow text-[#667085]">Loading monitored environment</p>
      </div>
    </div>
  );
}
