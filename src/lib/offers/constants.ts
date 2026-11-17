/**
 * Shared constants for offer providers
 * 
 * This file contains constants that are used by both client and server code.
 * DO NOT import any .server.ts files here.
 */

/**
 * Torox click URLs use a sentinel pattern since they must be generated per-user.
 * Stored as sentinel in cached offers, real URL fetched at click time.
 */
export const TOROX_CLICK_URL_SENTINEL = "torox://campaign/";

/**
 * Revtoo user ID placeholder in click URLs.
 * Replaced with actual user ID at click time.
 */
export const REVTOO_USER_ID_PLACEHOLDER = "REVTOO_USER_ID_PLACEHOLDER";
