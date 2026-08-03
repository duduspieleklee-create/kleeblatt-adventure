/** Shared API response shapes */

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service?: string;
  time?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}
