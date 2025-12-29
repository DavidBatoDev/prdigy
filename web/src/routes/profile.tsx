import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/ui/button";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfileQuery();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    first_name: "",
    last_name: "",
    bio: "",
    phone_number: "",
    country: "",
    city: "",
  });

  // Update form data when profile loads or changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        bio: profile.bio || "",
        phone_number: profile.phone_number || "",
        country: profile.country || "",
        city: profile.city || "",
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        bio: profile.bio || "",
        phone_number: profile.phone_number || "",
        country: profile.country || "",
        city: profile.city || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    updateProfile(formData, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-48"></div>
            <div className="bg-white rounded-2xl shadow-lg p-8 h-64"></div>
            <div className="bg-white rounded-2xl shadow-lg p-8 h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600">Please try logging in again</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.display_name) {
      return profile.display_name[0].toUpperCase();
    }
    return profile.email[0].toUpperCase();
  };

  const getPersonaLabel = () => {
    return profile.active_persona.charAt(0).toUpperCase() + profile.active_persona.slice(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-32 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="relative group">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-linear-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials()}
                  </div>
                )}
                <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer">
                  <Camera size={20} />
                </button>
              </div>

              {!isEditing && (
                <Button
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all hover:shadow-lg cursor-pointer"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.display_name || `${profile.first_name} ${profile.last_name}` || "User"}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{profile.email}</span>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {getPersonaLabel()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User size={24} className="text-blue-600" />
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="How should we call you?"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.display_name || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="First name"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.first_name || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Last name"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.last_name || "Not set"}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.bio || "No bio yet"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Location Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <MapPin size={24} className="text-blue-600" />
            Contact & Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.phone_number || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Country
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="United States"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.country || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="San Francisco"
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.city || "Not set"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (shown when editing) */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleCancel}
              disabled={isPending}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
