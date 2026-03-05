interface StepIndicatorProps {
  currentStep: 1 | 2;
}

const STEPS = [
  { id: 1 as const, label: "Account" },
  { id: 2 as const, label: "Profile" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;

        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flex: index < STEPS.length - 1 ? 1 : "none" }}
          >
            {/* Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "100px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Open Sans', sans-serif",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
                background: isActive
                  ? "#FF962E"
                  : isDone
                  ? "rgba(255, 150, 46, 0.1)"
                  : "#F5F5F5",
                color: isActive
                  ? "white"
                  : isDone
                  ? "#FF962E"
                  : "#BDBDBD",
                border: isActive
                  ? "1px solid #FF962E"
                  : isDone
                  ? "1px solid rgba(255, 150, 46, 0.4)"
                  : "1px solid #E5E5E5",
                boxShadow: isActive
                  ? "0 2px 10px rgba(255, 150, 46, 0.35)"
                  : "none",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 5l2.5 2.5L8.5 2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </span>
              {step.label}
            </div>

            {/* Connector line - between steps */}
            {index < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  margin: "0 8px",
                  backgroundColor: isDone ? "#FF962E" : "#E5E5E5",
                  transition: "background-color 0.4s ease",
                  minWidth: "40px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
