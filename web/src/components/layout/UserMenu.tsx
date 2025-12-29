import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { profileKeys } from "@/queries/profile";
import { User, LogOut, ChevronDown } from "lucide-react";
import { switchPersona } from "@/lib/auth-api";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangingPersona, setIsChangingPersona] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useProfileQuery(); // Use query instead of store
  const { signOut } = useAuthStore();
  const queryClient = useQueryClient();
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

  const handlePersonaChange = async (newPersona: string) => {
    if (newPersona === profile?.active_persona) return;

    setIsChangingPersona(true);
    try {
      // Use the authenticated helper which attaches the Supabase access token
      await switchPersona(newPersona as any);

      // Refresh the profile to get updated data
      if (profile?.id) {
        await queryClient.invalidateQueries({
          queryKey: profileKeys.byUser(profile.id),
        });
      }

      // Close dropdown
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to change persona:", error);
      alert(error.message || error.response?.data?.error?.message || "Failed to change persona");
    } finally {
      setIsChangingPersona(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate({ to: "/" });
  };

  // Get available personas
  const getAvailablePersonas = () => {
    const personas = ["freelancer", "client"];
    if (profile?.is_consultant_verified) {
      personas.push("consultant");
    }
    return personas;
  };

  return (
    <div className="relative cursor-pointer" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer   flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="User menu"
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={getDisplayName()}
            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-yellow-400 to-yellow-500 text-white flex items-center justify-center font-semibold text-lg border-2 border-yellow-400">
            {getDisplayName().charAt(0).toUpperCase()}
          </div>
        )}

        {/* User Info */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900">
            {getDisplayName()}
          </span>
          <span className="text-xs text-gray-500">
            {getPersonaLabel(profile?.active_persona || "client")}
          </span>
        </div>

        {/* Dropdown Icon */}
        <ChevronDown
          size={20}
          className={`transition-transform ${isOpen ? "rotate-180" : ""} text-gray-600`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Loading Overlay */}
          {isChangingPersona && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"></div>
                </div>
                <span className="text-sm font-semibold text-gray-800 animate-pulse">Switching persona...</span>
              </div>
            </div>
          )}

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>

          {/* Persona Selector */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Switch Persona</p>
            <div className="space-y-1">
              {getAvailablePersonas().map((persona) => (
                <button
                  key={persona}
                  onClick={() => handlePersonaChange(persona)}
                  disabled={isChangingPersona || persona === profile?.active_persona}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                    persona === profile?.active_persona
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${isChangingPersona ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {getPersonaLabel(persona)}
                  {persona === profile?.active_persona && (
                    <span className="ml-2 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/profile"
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
