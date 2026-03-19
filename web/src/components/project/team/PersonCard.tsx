import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface PersonCardProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  badge?: string;
  badgeClass?: string;
  onRemove?: () => void;
  removing?: boolean;
  children?: React.ReactNode;
}

export function PersonCard({
  name,
  email,
  avatarUrl,
  badge,
  badgeClass,
  onRemove,
  removing,
  children,
}: PersonCardProps) {
  const [copied, setCopied] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white rounded-lg">
      {/* Top — avatar fill (55% aspect) */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ paddingBottom: "55%" }}
      >
        <div className="absolute inset-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#ff9933]/10">
              <span className="text-2xl font-bold text-[#ff9933]/50 select-none tracking-tight">
                {initials || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Remove button overlay */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-30"
            title="Remove"
          >
            {/* Trash icon inlined to avoid extra import; or import from lucide */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom — info */}
      <div className="flex-1 flex flex-col px-2.5 py-2.5 border-t border-gray-100 bg-white">
        <p className="text-[12px] font-semibold text-gray-800 leading-snug truncate">
          {name}
        </p>
        {email && (
          <div className="flex items-center gap-1 mt-0.5 group/email min-w-0">
            <p className="text-[9.5px] text-gray-400 truncate flex-1">
              {email}
            </p>
            <button
              onClick={handleCopyEmail}
              className="shrink-0 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover/email:opacity-100 transition-opacity focus:opacity-100"
              title="Copy email"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        {badge && badgeClass && (
          <span
            className={`inline-flex items-center mt-1.5 self-start px-2 py-0.5 rounded-full text-[9px] font-semibold ${badgeClass}`}
          >
            {badge}
          </span>
        )}
        {children && <div className="mt-auto pt-1.5">{children}</div>}
      </div>
    </div>
  );
}
