/**
 * Application-wide constants and configuration values
 * Following coding standards: No magic numbers or strings
 */

// ==================== BUSINESS CONSTANTS ====================

/** Maximum file size for uploads (in bytes) - 5MB */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Minimum touch target size for mobile accessibility (in pixels) */
export const MIN_TOUCH_TARGET_SIZE = 44;

/** Grid spacing system (in pixels) */
export const GRID_SPACING = 8;

/** Maximum component line count before splitting */
export const MAX_COMPONENT_LINES = 250;

/** Mobile breakpoint (in pixels) */
export const BREAKPOINT_MOBILE = 375;

/** Tablet breakpoint (in pixels) */
export const BREAKPOINT_TABLET = 768;

/** Desktop breakpoint (in pixels) */
export const BREAKPOINT_DESKTOP = 1440;

/** Minimum supported width (in pixels) */
export const MIN_SUPPORTED_WIDTH = 320;

/** Maximum line length for code readability */
export const MAX_LINE_LENGTH = 100;

// ==================== UI CONSTANTS ====================

/** Default animation duration (in milliseconds) */
export const ANIMATION_DURATION = 300;

/** Toast notification duration (in milliseconds) */
export const TOAST_DURATION = 3000;

/** Debounce delay for search inputs (in milliseconds) */
export const SEARCH_DEBOUNCE_DELAY = 300;

/** API request timeout (in milliseconds) */
export const API_TIMEOUT = 30000;

// ==================== FORM VALIDATION ====================

/** Phone number format pattern */
export const PHONE_PATTERN = /^[+]?[0-9]{10,15}$/;

/** Email format pattern */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pincode format pattern (India) */
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

/** Aadhaar format pattern */
export const AADHAAR_PATTERN = /^[2-9]{1}[0-9]{11}$/;

/** PAN format pattern */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** Maximum length for Aadhaar display */
export const AADHAAR_MAX_LENGTH = 14;

/** Maximum length for mobile number */
export const MOBILE_MAX_LENGTH = 15;

/** Maximum length for name fields */
export const NAME_MAX_LENGTH = 100;

/** Maximum length for description fields */
export const DESCRIPTION_MAX_LENGTH = 500;

// ==================== PLACEHOLDER TEXT ====================

/** Phone number placeholder */
export const PHONE_PLACEHOLDER = "+91 XXXXX XXXXX";

/** Pincode placeholder */
export const PINCODE_PLACEHOLDER = "395001";

/** Aadhaar placeholder */
export const AADHAAR_PLACEHOLDER = "XXXX XXXX XXXX";

/** Invoice reference placeholder */
export const INVOICE_PLACEHOLDER = "INV-2026-001";

/** Purchase order placeholder */
export const PO_PLACEHOLDER = "PO-2026-001";

/** PF account number placeholder */
export const PF_ACCOUNT_PLACEHOLDER = "XX/XXX/0000000/000/0000000";

// ==================== DATE & TIME ====================

/** Date format for display */
export const DATE_FORMAT = "DD MMM YYYY";

/** Time format for display */
export const TIME_FORMAT = "HH:mm";

/** Datetime format for display */
export const DATETIME_FORMAT = "DD MMM YYYY HH:mm";

/** Fiscal year start month (0-indexed, 3 = April) */
export const FISCAL_YEAR_START_MONTH = 3;

// ==================== BUSINESS LOGIC ====================

/** Percentage of revenue as cash pending */
export const CASH_PENDING_PERCENTAGE = 0.04;

/** Percentage of revenue as vendor payables */
export const VENDOR_PAYABLES_PERCENTAGE = 0.15;

/** Maximum retry attempts for failed operations */
export const MAX_RETRY_ATTEMPTS = 3;

/** Retry delay (in milliseconds) */
export const RETRY_DELAY = 1000;

/** Session timeout (in milliseconds) - 30 minutes */
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// ==================== COLOR CONTRAST RATIOS ====================

/** Minimum contrast ratio for normal text (WCAG AA) */
export const MIN_CONTRAST_NORMAL = 4.5;

/** Minimum contrast ratio for large text (WCAG AA) */
export const MIN_CONTRAST_LARGE = 3.0;

// ==================== PERFORMANCE ====================

/** Lazy loading threshold (in pixels from viewport) */
export const LAZY_LOAD_THRESHOLD = 300;

/** Virtual scroll buffer size */
export const VIRTUAL_SCROLL_BUFFER = 5;

/** Maximum items per page in pagination */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum items for infinite scroll */
export const INFINITE_SCROLL_LIMIT = 100;

// ==================== NOTIFICATION MESSAGES ====================

/** Success message for save operations */
export const MSG_SAVE_SUCCESS = "Changes saved successfully";

/** Error message for save operations */
export const MSG_SAVE_ERROR = "Failed to save changes. Please try again.";

/** Success message for delete operations */
export const MSG_DELETE_SUCCESS = "Item deleted successfully";

/** Error message for delete operations */
export const MSG_DELETE_ERROR = "Failed to delete item. Please try again.";

/** Generic error message */
export const MSG_GENERIC_ERROR = "Something went wrong. Please try again later.";

/** Network error message */
export const MSG_NETWORK_ERROR = "Network error. Please check your connection.";

/** Validation error message */
export const MSG_VALIDATION_ERROR = "Please check the form for errors";

// ==================== HTTP STATUS CODES ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==================== LOCAL STORAGE KEYS ====================

export const STORAGE_KEYS = {
  USER_PREFERENCES: "cleancar_user_preferences",
  AUTH_TOKEN: "cleancar_auth_token",
  SELECTED_ROLE: "cleancar_selected_role",
  THEME: "cleancar_theme",
  LANGUAGE: "cleancar_language",
} as const;

// ==================== APPLICATION ROUTES ====================

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  LOGOUT: "/logout",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  NOT_FOUND: "/404",
} as const;

// ==================== EXPORT TYPES ====================

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
