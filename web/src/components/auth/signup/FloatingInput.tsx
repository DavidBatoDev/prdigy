import { useId, useState } from "react";

interface FloatingInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  rightElement?: React.ReactNode;
  min?: string;
  max?: string;
}

export function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  required,
  disabled,
  autoComplete,
  rightElement,
  min,
  max,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  // Date inputs always show browser chrome so label should always float
  const floated = focused || value.length > 0 || type === "date";

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        min={min}
        max={max}
        style={{
          padding: "22px 16px 10px",
          paddingRight: rightElement ? "44px" : "16px",
          height: "52px",
          borderRadius: "10px",
          border: focused
            ? "1px solid #FF962E"
            : "1px solid #E5E5E5",
          boxShadow: focused
            ? "0 0 0 3px rgba(255, 150, 46, 0.12)"
            : "none",
          outline: "none",
          width: "100%",
          background: disabled ? "#F9F9F9" : "white",
          color: "#2E2E2E",
          fontSize: "14px",
          fontFamily: "'Open Sans', sans-serif",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      />
      <label
        htmlFor={id}
        style={{
          position: "absolute",
          left: "16px",
          top: floated ? "7px" : "50%",
          transform: floated ? "none" : "translateY(-50%)",
          fontSize: floated ? "10px" : "14px",
          fontWeight: 500,
          color: focused ? "#FF962E" : "#BDBDBD",
          transition: "all 0.2s ease",
          pointerEvents: "none",
          lineHeight: 1,
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        {label}
        {required && " *"}
      </label>
      {rightElement && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {rightElement}
        </div>
      )}
    </div>
  );
}
