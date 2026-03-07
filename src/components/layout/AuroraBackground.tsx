"use client";

export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Warm radial top gradient */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,171,0,0.05) 0%, rgba(204,136,0,0.015) 40%, transparent 70%)",
        }}
      />

      {/* Central gold bloom */}
      <div
        className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] opacity-[0.035]"
        style={{
          background: "radial-gradient(ellipse at center, #FFAB00 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* Left aurora blob */}
      <div
        className="absolute -left-32 top-1/4 h-[500px] w-[500px] animate-aurora-1 rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #CC8800 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />

      {/* Right aurora blob */}
      <div
        className="absolute right-[-80px] top-[15%] h-[400px] w-[400px] animate-aurora-2 rounded-full opacity-[0.025]"
        style={{
          background: "radial-gradient(circle, #FFD700 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />

      {/* Bottom glow */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-[0.02]"
        style={{
          background: "radial-gradient(ellipse at center bottom, #FFAB00 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, #09090B 100%)",
        }}
      />

      {/* Texture overlays */}
      <div className="noise-overlay" />
      <div className="grid-overlay" />
    </div>
  );
}
