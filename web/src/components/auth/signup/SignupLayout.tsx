interface SignupLayoutProps {
  children: React.ReactNode;
}

export function SignupLayout({ children }: SignupLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ── Left: Form panel ──────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "#FAFAFA",
          overflowY: "auto",
        }}
        className="lg:w-[40%]"
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>{children}</div>
      </div>

      {/* ── Right: Brand panel (hidden on mobile) ─────────────────── */}
      <div
        className="hidden lg:flex"
        style={{
          width: "60%",
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E11C84 0%, #FF2D75 40%, #FF962E 100%)",
          flexShrink: 0,
        }}
      >
        {/* Decorative bubbles */}
        <div
          style={{
            position: "absolute",
            top: "-128px",
            right: "-128px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "620px",
            height: "620px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "15%",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "45%",
            right: "8%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        {/* Dot grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            pointerEvents: "none",
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            color: "white",
            maxWidth: "520px",
            padding: "0 64px",
          }}
        >
          {/* Logo */}
          <img
            src="/prodigylogos/light/logo1.svg"
            alt="Prodigitality"
            style={{
              height: "36px",
              marginBottom: "56px",
              filter: "brightness(0) invert(1)",
            }}
          />

          {/* Headline */}
          <h2
            style={{
              fontFamily: "'Glacial Indifference', 'Open Sans', sans-serif",
              fontSize: "2.6rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "20px",
              margin: "0 0 20px",
            }}
          >
            Build projects faster with the right experts.
          </h2>

          {/* Subline */}
          <p
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              margin: "0 0 48px",
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            Join thousands of teams who trust Prodigitality to connect with
            top talent and deliver exceptional results.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "56px" }}>
            {[
              "Smart project matching",
              "Vetted expert network",
              "End-to-end collaboration tools",
            ].map((feature) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M1.5 7l3.5 3.5L12.5 3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.9rem",
                fontStyle: "italic",
                lineHeight: 1.6,
                margin: "0 0 16px",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              "Prodigitality helped us find the right developer in days, not
              months. The quality of talent is unmatched."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.28)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    margin: 0,
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  Sarah Chen
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.75rem",
                    margin: 0,
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  CTO, TechFlow Inc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
