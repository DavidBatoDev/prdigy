import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { fetchProfile, profileKeys } from "@/queries/profile";
import { useQuery } from "@tanstack/react-query";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { Button } from "@/ui/button";
import { User, Camera, BadgeCheck, MapPin, Edit2 } from "lucide-react";
import Header from "../../components/layout/Header";

export const Route = createFileRoute("/profile/$profileId")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { profileId } = Route.useParams();
  const { user } = useAuthStore();
  const isOwner = user?.id === profileId;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: profileKeys.byUser(profileId),
    queryFn: () => fetchProfile(profileId),
    enabled: !!profileId,
  });

  const { mutate: updateProfile, isPending } = useUpdateProfile();
  
  // Separate edit states for different sections
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    first_name: "",
    last_name: "",
    bio: "",
    phone_number: "",
    country: "",
    city: "",
  });

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

  const handleCancelAll = () => {
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
    setIsEditingHeader(false);
    setIsEditingBio(false);
    setIsEditingContact(false);
  };

  const handleSave = () => {
    updateProfile(formData, {
      onSuccess: () => {
        setIsEditingHeader(false);
        setIsEditingBio(false);
        setIsEditingContact(false);
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
      <div className="min-h-screen bg-gray-50 p-8 pt-24">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 h-96 bg-white rounded-2xl border border-gray-100"></div>
              <div className="lg:col-span-3 h-96 bg-white rounded-2xl border border-gray-100"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pt-24">
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-6">The profile you are looking for might not exist.</p>
        </div>
      </div>
    );
  }

  const fullName = profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  const initial = fullName.charAt(0).toUpperCase();

  const getPersonaLabel = () => {
    return profile.active_persona.charAt(0).toUpperCase() + profile.active_persona.slice(1);
  };

  // Helper formatting dates (mock since we don't have created_at usually in profile response)
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + " local time";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white pb-12 px-2 sm:px-2 lg:px-2">
      <div className="max-w-[1100px] mx-auto">
        
        {/* Header Section (Style - Clean, White, No Gradient) */}
        <div className="bg-white rounded-t-2xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-0">
          
          <div className="flex items-center gap-6 w-full sm:w-auto">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {initial}
                </div>
              )}
              {/* Online indicator dot */}
              <div className="absolute top-1 left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              
              {isOwner && (
                <button className="absolute bottom-0 right-0 bg-white border border-gray-200 text-gray-600 p-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                  <Camera size={14} />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              {isEditingHeader ? (
                <div className="space-y-3 max-w-md">
                   <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary text-lg font-bold"
                      placeholder="Display Name"
                    />
                   <div className="grid grid-cols-2 gap-3">
                     <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary text-sm"
                        placeholder="First Name"
                      />
                     <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary text-sm"
                        placeholder="Last Name"
                      />
                   </div>
                   <div className="flex gap-2 mt-2">
                     <Button size="sm" onClick={handleSave} disabled={isPending} className="bg-primary text-white cursor-pointer px-4">Save</Button>
                     <Button size="sm" variant="outlined" onClick={handleCancelAll} className="cursor-pointer px-4">Cancel</Button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      {fullName}
                    </h1>
                    {profile.is_consultant_verified && (
                      <BadgeCheck className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {profile.city || profile.country ? (
                      <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
                    ) : (
                      <span>Location not set</span>
                    )}
                    <span className="text-gray-400 mx-1">–</span>
                    <span>{currentTime}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top Right Actions */}
          {isOwner && (
            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
              <Link to="/consultant/$profileId" params={{ profileId: profile.id }} className="w-full sm:w-auto">
                <Button variant="outlined" className="w-full sm:w-auto text-primary border-primary hover:bg-primary/10 font-medium rounded-full px-6 transition-colors">
                  See public view
                </Button>
              </Link>
              <Button 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-6 transition-colors"
                onClick={() => setIsEditingHeader(true)}
              >
                Profile settings
              </Button>
            </div>
          )}
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 border-x border-b border-gray-200 rounded-b-2xl overflow-hidden bg-white">
          
          {/* LEFT SIDEBAR (Col 1) */}
          <div className="lg:col-span-1 border-r border-gray-200 bg-white">
            
            {/* Persona Block */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Platform Role</h3>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 font-medium text-sm rounded-full border border-green-200">
                {getPersonaLabel()}
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">Contact</h3>
                {isOwner && !isEditingContact && (
                  <button onClick={() => setIsEditingContact(true)} className="p-1.5 rounded-full border border-gray-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {isEditingContact ? (
                <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary text-sm"
                        placeholder="+1 (555) 000-0000"
                      />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary text-sm"
                        placeholder="City"
                      />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary text-sm"
                        placeholder="Country"
                      />
                   </div>
                   <div className="flex gap-2 pt-2">
                     <Button size="sm" onClick={handleSave} disabled={isPending} className="bg-primary text-white cursor-pointer px-4 w-full">Save</Button>
                     <Button size="sm" variant="outlined" onClick={handleCancelAll} className="cursor-pointer px-4 w-full">Cancel</Button>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-0.5">Email address</p>
                    <a href={`mailto:${profile.email}`} className="text-primary hover:underline text-sm font-medium break-all block">
                      {profile.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-0.5">Phone number</p>
                    {profile.phone_number ? (
                      <p className="text-gray-900 text-sm font-medium">{profile.phone_number}</p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">Not provided</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Languages / Stats Placeholder */}
            <div className="p-6">
               <h3 className="font-semibold text-gray-900 text-lg mb-4">System Stats</h3>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-gray-600">Member since</span>
                   <span className="font-medium text-gray-900">2026</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Profile Status</span>
                   <span className="font-medium text-gray-900">Complete</span>
                 </div>
               </div>
            </div>

          </div>

          {/* RIGHT MAIN CONTENT (Col 3) */}
          <div className="lg:col-span-3 bg-white">
            
            {/* Bio/Overview Section */}
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div className="max-w-xl">
                  {/* Title (Mocked up as Consultant Headline for Upwork style) */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    {profile.is_consultant_verified ? "Professional Expert Consultant" : "Registered Platform User"}
                  </h2>
                </div>
                
                {/* Actions (Hourly Rate + Edit) */}
                <div className="flex items-center gap-4 shrink-0 mt-1">
                  {profile.is_consultant_verified && (
                     <div className="text-lg font-medium text-gray-900 flex items-center gap-2">
                       $50.00/hr <span className="p-1 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer"><Edit2 size={14} /></span>
                     </div>
                  )}
                  {isOwner && !isEditingBio && (
                    <button onClick={() => setIsEditingBio(true)} className="p-2 rounded-full border border-gray-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Bio Content */}
              {isEditingBio ? (
                <div className="space-y-4">
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-700 resize-y"
                    placeholder="Describe your expertise and top skills..."
                  />
                  <div className="flex gap-3 justify-end">
                    <Button variant="outlined" onClick={handleCancelAll} className="cursor-pointer font-medium text-primary border-primary/20 hover:bg-primary/10 rounded-full px-6">Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending} className="bg-primary hover:bg-primary/90 text-white cursor-pointer font-medium rounded-full px-8">Save</Button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none text-gray-800 text-[15px] leading-relaxed relative">
                  {profile.bio ? (
                    <>
                      <p className="whitespace-pre-line">{profile.bio}</p>
                      {/* Fake 'more' button if text is long */}
                      {profile.bio.length > 300 && (
                        <button className="text-primary font-medium hover:underline mt-2">more</button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 italic">No overview provided. Click the edit icon to add your professional summary.</p>
                  )}
                </div>
              )}
            </div>

            {/* Skills Section */}
            <div className="p-6 sm:p-8 border-b border-gray-200">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                 {isOwner && (
                    <button className="p-2 rounded-full border border-gray-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer">
                      <Edit2 size={16} />
                    </button>
                  )}
               </div>
               
               {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No specific skills listed.</p>
              )}
            </div>

            {/* Portfolio / Projects Placeholder */}
            <div className="p-6 sm:p-8">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                 {isOwner && (
                    <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer text-xl font-light">
                      +
                    </button>
                  )}
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="aspect-4/3 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                   Portflio Item 1
                 </div>
                 <div className="aspect-4/3 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                   Portflio Item 2
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
     </div>
    </>
  );
}
