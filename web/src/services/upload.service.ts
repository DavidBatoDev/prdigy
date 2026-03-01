/**
 * Upload Service
 * Handles file uploads to Supabase Storage via signed upload URLs.
 * Flow: get signed URL from backend → PUT file directly to Supabase → confirm URL.
 */

import apiClient from "@/api/axios";

export type UploadBucket = "avatars" | "banners" | "portfolio_projects";

export interface SignedUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
}

class UploadService {
  private base = "/api/uploads";

  /**
   * Full upload flow:
   * 1. Get a signed upload URL from the backend
   * 2. PUT the file directly to Supabase Storage
   * 3. Return the public URL
   */
  async upload(bucket: UploadBucket, file: File): Promise<string> {
    // Step 1 — get signed URL
    const { data: meta } = await apiClient.post<{ data: SignedUrlResponse }>(
      `${this.base}/signed-url`,
      {
        bucket,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
      },
    );
    const { signedUrl, publicUrl } = meta.data;

    // Step 2 — PUT directly to storage (no auth header needed for signed uploads)
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Storage upload failed: ${uploadRes.statusText}`);
    }

    return publicUrl;
  }

  /**
   * Upload avatar and persist to profile
   */
  async uploadAvatar(file: File): Promise<string> {
    const publicUrl = await this.upload("avatars", file);
    await apiClient.post(`${this.base}/confirm-avatar`, {
      avatar_url: publicUrl,
    });
    return publicUrl;
  }

  /**
   * Upload banner and persist to profile
   */
  async uploadBanner(file: File): Promise<string> {
    const publicUrl = await this.upload("banners", file);
    await apiClient.post(`${this.base}/confirm-banner`, {
      banner_url: publicUrl,
    });
    return publicUrl;
  }

  /**
   * Upload a portfolio project image.
   * Returns the public URL — no DB confirm needed; caller sets image_url on the portfolio record.
   */
  async uploadPortfolioImage(file: File): Promise<string> {
    return this.upload("portfolio_projects", file);
  }

  /**
   * Remove avatar from storage and clear the profile field
   */
  async deleteAvatar(): Promise<void> {
    await apiClient.delete(`${this.base}/avatar`);
  }
}

export const uploadService = new UploadService();
