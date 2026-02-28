import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { User, LogOut, ChevronDown, Briefcase } from "lucide-react";

export default function ProjectUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { data: profile } = useProfileQuery();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.email?.split("@")[0] || "User";
  };

  const getPersonaLabel = (persona: string) => {
    return persona.charAt(0).toUpperCase() + persona.slice(1);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate({ to: "/" });
  };

  return (
    <div className="relative cursor-pointer overflow-visible" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="User menu"
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full object-cover border border-yellow-400"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-yellow-400 to-yellow-500 text-white flex items-center justify-center font-medium text-sm border border-yellow-400">
            {getDisplayName().charAt(0).toUpperCase()}
          </div>
        )}

        {/* User Info */}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-gray-900">
            {getDisplayName()}
          </span>
          <span className="text-[10px] text-gray-500">
            {getPersonaLabel(profile?.active_persona || "client")}
          </span>
        </div>

        {/* Dropdown Icon */}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""} text-gray-600`}
        />
      </button>

      {isOpen && (
        <div 
          className="w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 absolute right-0 top-full mt-2 z-50"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Briefcase size={16} />
              Return to Dashboard
            </Link>

            <Link
              to="/profile/$profileId"
              params={{ profileId: user?.id || "" }}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <User size={16} />
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
