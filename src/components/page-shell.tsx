import { ErrorBanner } from "./error-banner";

export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className={`mx-auto min-h-[calc(100vh-4rem)] max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9 ${className}`}>
        {children}
      </div>
      <ErrorBanner />
    </>
  );
}
