'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const DURATION = 3200; // ms before redirect

export default function SplashScreen() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const goToMap = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => router.push('/map'), 450);
  };

  useEffect(() => {
    timerRef.current = setTimeout(goToMap, DURATION);
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        animation: exiting
          ? 'splash-exit 0.45s ease-in forwards'
          : 'fade-in 0.5s ease-out',
      }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-950 to-emerald-950" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

      {/* ── Logo area ── */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">

        {/* Pulsing rings */}
        <div className="relative flex items-center justify-center">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute rounded-full border border-sky-400/30"
              style={{
                width: 140 + i * 56,
                height: 140 + i * 56,
                animation: `ring-out 2.4s ease-out ${i * 0.55}s infinite`,
              }}
            />
          ))}

          {/* Logo circle */}
          <div
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-2xl flex items-center justify-center"
            style={{ animation: 'logo-pop 0.7s cubic-bezier(.34,1.56,.64,1) 0.1s both' }}
          >
            <img
              src="/stn-aed/img/logo.png"
              alt="AED Satun Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Title */}
        <div
          className="text-center"
          style={{ animation: 'text-rise 0.6s ease-out 0.5s both' }}
        >
          <p className="text-sky-400 text-sm font-semibold tracking-[0.25em] uppercase mb-2">
            จังหวัดสตูล
          </p>
          <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight drop-shadow-lg">
            ระบบติดตาม
          </h1>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 text-3xl sm:text-4xl font-bold leading-tight">
            จุดบริการเครื่องกู้ชีพ AED
          </h1>
        </div>

        {/* Sub description */}
        <p
          className="text-slate-400 text-sm text-center max-w-xs leading-relaxed"
          style={{ animation: 'text-rise 0.6s ease-out 0.8s both' }}
        >
          Automated External Defibrillator<br />
          สำนักงานสาธารณสุขจังหวัดสตูล
        </p>

        {/* Progress bar */}
        <div
          className="w-64 flex flex-col items-center gap-3"
          style={{ animation: 'text-rise 0.6s ease-out 1s both' }}
        >
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              style={{
                animation: `bar-fill ${DURATION}ms linear 0.2s both`,
              }}
            />
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-sky-400"
                style={{ animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
            <span className="ml-2 text-slate-400 text-xs tracking-wide">กำลังโหลด...</span>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={goToMap}
          className="mt-2 text-slate-500 hover:text-white text-xs transition-colors duration-200 underline underline-offset-4"
          style={{ animation: 'text-rise 0.6s ease-out 1.2s both' }}
        >
          เข้าสู่ระบบทันที →
        </button>
      </div>

      {/* Footer */}
      <p
        className="absolute bottom-6 text-slate-600 text-xs z-10"
        style={{ animation: 'text-rise 0.6s ease-out 1.4s both' }}
      >
        © 2568 สำนักงานสาธารณสุขจังหวัดสตูล
      </p>
    </div>
  );
}

