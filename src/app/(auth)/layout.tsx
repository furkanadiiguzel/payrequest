export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-600">PayRequest</h1>
        <p className="text-sm text-gray-500 mt-1">Send and receive payment requests</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
