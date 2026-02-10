import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken } from "../lib/supabase";

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token or guest user ID to requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get access token from Supabase session
      const token = await getAccessToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // No auth session, check for guest user
        const guestUserId = localStorage.getItem("prdigy_guest_user_id");
        if (guestUserId && config.headers) {
          config.headers["X-Guest-User-Id"] = guestUserId;
        }
      }
    } catch (error) {
      console.error("Error adding auth headers:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      switch (status) {
        case 401:
          console.error("Unauthorized - Please log in");
          // Could trigger logout/redirect here
          break;
        case 403:
          console.error("Forbidden - Insufficient permissions");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 429:
          console.error("Too many requests - Please try again later");
          break;
        case 500:
          console.error("Server error - Please try again later");
          break;
        default:
          console.error(`API Error (${status}):`, error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("No response from server - Check your connection");
    } else {
      // Other errors
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  },
);

// Export the configured axios instance
export default apiClient;

// Also export the base URL for cases where it's needed
export { API_BASE_URL };
