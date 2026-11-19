//#region node_modules/.nitro/vite/services/ssr/assets/constants-r2wn2lLZ.js
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
var TOROX_CLICK_URL_SENTINEL = "torox://campaign/";
/**
* Revtoo user ID placeholder in click URLs.
* Replaced with actual user ID at click time.
*/
var REVTOO_USER_ID_PLACEHOLDER = "REVTOO_USER_ID_PLACEHOLDER";
//#endregion
export { TOROX_CLICK_URL_SENTINEL as n, REVTOO_USER_ID_PLACEHOLDER as t };
