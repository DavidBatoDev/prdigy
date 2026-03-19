import { ImagePlus } from "lucide-react";
import { UploadModal } from "@/components/profile/UploadModal";

interface OverviewBannerProps {
  bannerUrl: string | null;
  canEdit: boolean;
  isUploading: boolean;
  isOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onUpload: (files: File[]) => void;
}

export function OverviewBanner({
  bannerUrl,
  canEdit,
  isUploading,
  isOpen,
  onOpenModal,
  onCloseModal,
  onUpload,
}: OverviewBannerProps) {
  return (
    <>
      <div className="relative w-full h-40 bg-linear-to-br from-gray-800 via-gray-700 to-gray-900 overflow-hidden rounded-xl mb-8">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Project banner"
            className="w-full h-full object-cover"
          />
        )}
        {canEdit && (
          <button
            type="button"
            onClick={onOpenModal}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            {bannerUrl ? "Change banner" : "Add banner"}
          </button>
        )}
      </div>

      <UploadModal
        isOpen={isOpen}
        onClose={onCloseModal}
        title="Project Banner"
        accept="image/jpeg,image/png,image/webp"
        maxFiles={1}
        maxSizeMb={10}
        aspectHint="4:1 (wide)"
        onUpload={(files) => onUpload(files)}
        isUploading={isUploading}
      />
    </>
  );
}
