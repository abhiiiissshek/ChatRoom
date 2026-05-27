import React, { useEffect, useRef } from "react";

export default function Login({ onSignIn }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const handleMouse = (e) => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);

      el.style.setProperty("--rx", `${y / 20}deg`);
      el.style.setProperty("--ry", `${-x / 20}deg`);
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="ultra-wrapper">
      {/* Future Nebula Field */}
      <div className="future-bg"></div>
      <div className="energy-particles"></div>
      <div className="holo-grid"></div>

      {/* AI Core Pulse */}
      <div className="ai-core"></div>

      {/* LOGIN CARD */}
      <div className="ultra-card" ref={cardRef}>
        <div className="ultra-title">ConvoWave</div>
        <div className="ultra-sub">Where Intelligence Becomes Alive.</div>

        <button className="ultra-btn" onClick={onSignIn}>
          Continue with Google
        </button>

        <div className="ultra-foot">Quantum-secured authentication • v7.2</div>
      </div>
    </div>
  );
}
