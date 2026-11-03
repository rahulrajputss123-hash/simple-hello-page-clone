/**
 * Ad network script registry for timed PTC quests.
 * Each network returns a script configuration or throws "not configured".
 */

export type AdNetworkScript = {
  src: string;
  attributes?: Record<string, string>;
};

/**
 * Get the ad network script configuration for the given network ID.
 * @throws Error if the network is not configured
 */
export function getAdNetworkScript(networkId: string): AdNetworkScript {
  switch (networkId.toLowerCase()) {
    case "monetag":
      return {
        src: "https://quge5.com/88/tag.min.js",
        attributes: {
          "data-zone": "303885",
          async: "true",
          "data-cfasync": "false",
        },
      };

    // Stub entries for future networks
    case "propush":
    case "rollerads":
    case "evadav":
    case "adsterra":
    case "hilltopads":
      throw new Error(`Ad network "${networkId}" is not configured yet.`);

    default:
      throw new Error(`Unknown ad network: "${networkId}"`);
  }
}

/**
 * Inject an ad network script into the document head.
 * Returns a cleanup function to remove the script.
 */
export function injectAdNetworkScript(networkId: string): () => void {
  try {
    const config = getAdNetworkScript(networkId);
    const script = document.createElement("script");
    script.src = config.src;

    // Set attributes
    if (config.attributes) {
      Object.entries(config.attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
    }

    document.head.appendChild(script);

    // Return cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  } catch (error) {
    console.error("Failed to inject ad network script:", error);
    // Return no-op cleanup for unconfigured networks
    return () => {};
  }
}
