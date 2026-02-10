// Guest Data Migration Utility
// Handles migrating guest user data to authenticated user accounts

import { getGuestSessionId, clearGuestSession } from "./guestAuth";
import { apiClient } from "@/api";

interface MigrationResult {
  success: boolean;
  migratedRoadmaps: number;
  createdProjects: number;
  errors: string[];
}

/**
 * Migrates all guest user data to an authenticated user account
 * Called automatically after signup or login
 */
export async function migrateGuestData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedRoadmaps: 0,
    createdProjects: 0,
    errors: [],
  };

  try {
    // Get the guest session ID from localStorage
    const guestSessionId = getGuestSessionId();
    if (!guestSessionId) {
      // No guest session to migrate
      result.success = true;
      return result;
    }

    // Call backend API to perform migration
    // Note: Auth token is automatically added by apiClient interceptor
    const response = await apiClient.post("/api/guests/migrate", {
      guest_session_id: guestSessionId,
    });

    const migrationData = response.data.data;

    result.success = migrationData.success;
    result.migratedRoadmaps = migrationData.migrated_roadmaps;
    result.createdProjects = migrationData.created_projects;

    if (migrationData.errors) {
      result.errors = migrationData.errors;
    }

    // Clear guest session from localStorage
    clearGuestSession();

    return result;
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const errorMessage = error.response.data?.error?.message || "Migration API error";
      result.errors.push(`Migration API error: ${errorMessage}`);
    } else {
      result.errors.push(
        `Migration exception: ${error.message || "Unknown error"}`
      );
    }
    return result;
  }
}

/**
 * Checks if there's pending guest data to migrate
 */
export async function hasPendingGuestData(): Promise<boolean> {
  try {
    const guestSessionId = getGuestSessionId();
    if (!guestSessionId) {
      return false;
    }

    const response = await apiClient.get(
      `/api/guests/pending?session_id=${encodeURIComponent(guestSessionId)}`
    );

    return response.data.data.has_pending === true;
  } catch (error) {
    console.error("Error checking for pending guest data:", error);
    return false;
  }
}
