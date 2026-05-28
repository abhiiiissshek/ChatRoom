import { MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";

const highlights = [
  { icon: Zap, label: "Realtime delivery" },
  { icon: ShieldCheck, label: "Firebase auth" },
  { icon: Sparkles, label: "Smart replies" },
];

export default function Login({ onSignIn }) {
  return (
    <AppShell>
      <main className="grid h-full place-items-center px-5 py-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-zinc-950 shadow-lg shadow-cyan-500/15">
                <MessageCircle size={22} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">ConvoWave</h1>
                <p className="text-sm text-slate-500">Modern realtime messaging</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-7">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to continue your conversations across devices with a fast,
              focused chat experience.
            </p>

            <button
              onClick={onSignIn}
              className="mt-7 flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-zinc-950 shadow-lg shadow-black/20 transition hover:bg-slate-200 active:scale-[0.98]"
            >
              Continue with Google
            </button>

            <div className="mt-6 grid gap-2">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"
                >
                  <Icon size={17} className="text-cyan-200" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}
