/**
 * JWT Token Payload Model
 * Represents the structure of the decoded JWT token
 */
export const TokenPayload = {
  sub: "", // User ID (UUID)
  unique_name: "", // Username
  email: "", // Email address
  jti: "", // JWT ID (unique token identifier)
  permissions: [], // Array of permission strings (e.g., "SYSTEM_USERS.Read")
  nbf: 0, // Not before (Unix timestamp)
  exp: 0, // Expiration time (Unix timestamp)
  iat: 0, // Issued at (Unix timestamp)
  iss: "", // Issuer (e.g., "SocialMedia.Api")
  aud: "", // Audience (e.g., "SocialMedia.Client")
};

/**
 * Function to decode JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Function to check if token has specific permission
 * @param {array} permissions - Array of user permissions
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (permissions, requiredPermission) => {
  return Array.isArray(permissions) && permissions.includes(requiredPermission);
};

/**
 * Function to check if token is expired
 * @param {number} exp - Expiration timestamp
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (exp) => {
  return Math.floor(Date.now() / 1000) >= exp;
};

/**
 * Permission Constants
 */
export const PERMISSIONS = {
  CONTENT_COMMENTS: {
    READ: "CONTENT_COMMENTS.Read",
    WRITE: "CONTENT_COMMENTS.Write",
    DELETE: "CONTENT_COMMENTS.Delete",
  },
  CONTENT_POSTS: {
    READ: "CONTENT_POSTS.Read",
    WRITE: "CONTENT_POSTS.Write",
    DELETE: "CONTENT_POSTS.Delete",
  },
  REPORT_ANALYTICS: {
    READ: "REPORT_ANALYTICS.Read",
    WRITE: "REPORT_ANALYTICS.Write",
    DELETE: "REPORT_ANALYTICS.Delete",
  },
  SYSTEM_ROLES: {
    READ: "SYSTEM_ROLES.Read",
    WRITE: "SYSTEM_ROLES.Write",
    DELETE: "SYSTEM_ROLES.Delete",
  },
  SYSTEM_USERS: {
    READ: "SYSTEM_USERS.Read",
    WRITE: "SYSTEM_USERS.Write",
    DELETE: "SYSTEM_USERS.Delete",
  },
};
