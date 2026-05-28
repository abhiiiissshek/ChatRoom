export default function AppShell({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-[#08090b] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(103,232,249,0.08),transparent_30%,rgba(167,139,250,0.07)_68%,transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.026)_1px,transparent_1px)] bg-[size:52px_52px] opacity-30" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
