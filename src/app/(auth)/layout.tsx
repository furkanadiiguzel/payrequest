export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Brand mark */}
      <div className="mb-8 text-center" style={{ animation: 'slide-in-up 0.3s ease-out both' }}>
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-lg font-bold">
            P
          </span>
          <h1 className="text-2xl font-bold text-foreground">PayRequest</h1>
        </div>
        <p className="text-sm text-muted-foreground">Send and receive payment requests</p>
      </div>
      <div className="w-full max-w-sm" style={{ animation: 'slide-in-up 0.35s ease-out 0.05s both', opacity: 0 }}>
        {children}
      </div>
    </div>
  );
}
