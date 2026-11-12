/**
 * Tests for Torox click URL response parsing
 * 
 * Torox API returns click URLs in various field names.
 * We need to handle all possible field names correctly.
 */

import { describe, it, expect } from "vitest";

/**
 * Simulates the URL extraction logic from torox.functions.ts
 */
function extractClickUrl(parsed: unknown): string {
  let clickUrl = "";
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    
    // Try top-level fields first
    clickUrl = String(obj.clickUrl ?? obj.url ?? obj.click_url ?? obj.tracking_url ?? obj.redirect_url ?? "").trim();
    
    // Try nested data.url pattern
    if (!clickUrl && obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      clickUrl = String(data.clickUrl ?? data.url ?? data.click_url ?? data.tracking_url ?? data.redirect_url ?? "").trim();
    }
    
    // Try nested result.url pattern
    if (!clickUrl && obj.result && typeof obj.result === "object") {
      const result = obj.result as Record<string, unknown>;
      clickUrl = String(result.clickUrl ?? result.url ?? result.click_url ?? result.tracking_url ?? result.redirect_url ?? "").trim();
    }
  }
  
  return clickUrl;
}

describe("Torox Click URL Parsing", () => {
  describe("Top-level field extraction", () => {
    it("should extract clickUrl (camelCase) from top level", () => {
      const response = {
        ok: true,
        clickUrl: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract url from top level", () => {
      const response = {
        ok: true,
        url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract click_url (snake_case) from top level", () => {
      const response = {
        ok: true,
        click_url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract tracking_url from top level", () => {
      const response = {
        ok: true,
        tracking_url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract redirect_url from top level", () => {
      const response = {
        ok: true,
        redirect_url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });
  });

  describe("Nested data field extraction", () => {
    it("should extract clickUrl from nested data object", () => {
      const response = {
        ok: true,
        data: {
          clickUrl: "https://api.wall.torox.io/click?t=abc123"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract url from nested data object", () => {
      const response = {
        ok: true,
        data: {
          url: "https://api.wall.torox.io/click?t=abc123"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });
  });

  describe("Nested result field extraction", () => {
    it("should extract clickUrl from nested result object", () => {
      const response = {
        ok: true,
        result: {
          clickUrl: "https://api.wall.torox.io/click?t=abc123"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should extract url from nested result object", () => {
      const response = {
        ok: true,
        result: {
          url: "https://api.wall.torox.io/click?t=abc123"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });
  });

  describe("Priority and fallback", () => {
    it("should prioritize clickUrl over other field names", () => {
      const response = {
        ok: true,
        clickUrl: "https://api.wall.torox.io/click?t=correct",
        url: "https://api.wall.torox.io/click?t=wrong",
        click_url: "https://api.wall.torox.io/click?t=wrong2"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=correct");
    });

    it("should fallback to url if clickUrl is missing", () => {
      const response = {
        ok: true,
        url: "https://api.wall.torox.io/click?t=abc123",
        click_url: "https://api.wall.torox.io/click?t=wrong"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should prefer top-level over nested fields", () => {
      const response = {
        ok: true,
        clickUrl: "https://api.wall.torox.io/click?t=top",
        data: {
          clickUrl: "https://api.wall.torox.io/click?t=nested"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=top");
    });

    it("should prefer data over result for nested fields", () => {
      const response = {
        ok: true,
        data: {
          clickUrl: "https://api.wall.torox.io/click?t=data"
        },
        result: {
          clickUrl: "https://api.wall.torox.io/click?t=result"
        }
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=data");
    });
  });

  describe("Edge cases", () => {
    it("should return empty string if no URL field found", () => {
      const response = {
        ok: true,
        message: "Success"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("");
    });

    it("should trim whitespace from extracted URL", () => {
      const response = {
        ok: true,
        clickUrl: "  https://api.wall.torox.io/click?t=abc123  "
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should handle null values gracefully", () => {
      const response = {
        ok: true,
        clickUrl: null,
        url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should handle undefined values gracefully", () => {
      const response = {
        ok: true,
        clickUrl: undefined,
        url: "https://api.wall.torox.io/click?t=abc123"
      };
      
      const result = extractClickUrl(response);
      expect(result).toBe("https://api.wall.torox.io/click?t=abc123");
    });

    it("should return empty string for non-object input", () => {
      const result1 = extractClickUrl(null);
      const result2 = extractClickUrl(undefined);
      const result3 = extractClickUrl("string");
      const result4 = extractClickUrl(123);
      
      expect(result1).toBe("");
      expect(result2).toBe("");
      expect(result3).toBe("");
      expect(result4).toBe("");
    });
  });
});
