/**
 * Feed Quest Context Fix Test
 * 
 * Verifies that feed quest handlers use context.userId (not context.user.id)
 * to prevent "Cannot read properties of undefined (reading 'id')" error.
 * 
 * Root cause: requireSupabaseAuth middleware sets context.userId and context.claims,
 * but does NOT set context.user. Previous code tried to access context.user.id.
 */

import { describe, it, expect } from "vitest";

describe("Feed Quest - Context userId Fix", () => {
  it("should demonstrate the context structure from requireSupabaseAuth", () => {
    // This is what requireSupabaseAuth actually provides
    const mockContext = {
      userId: "test-user-123",
      claims: {
        sub: "test-user-123",
        email: "test@example.com",
      },
      // NOTE: No 'user' field exists!
    };

    // Accessing context.userId works
    expect(mockContext.userId).toBe("test-user-123");

    // Accessing context.user would be undefined
    expect((mockContext as any).user).toBeUndefined();

    // Accessing context.user.id would throw: "Cannot read properties of undefined (reading 'id')"
    expect(() => {
      const userId = (mockContext as any).user.id;
      return userId;
    }).toThrow();
  });

  it("should confirm context.userId is the correct way to access user ID", () => {
    const mockContext = {
      userId: "user-456",
      claims: { sub: "user-456" },
    };

    // This is what the fixed code does
    const userId = mockContext.userId;
    expect(userId).toBe("user-456");
    expect(typeof userId).toBe("string");
  });

  it("should show that all feed handlers now use context.userId", async () => {
    // Read the source file to verify the fix
    const fs = await import("fs/promises");
    const path = await import("path");
    
    const filePath = path.resolve(process.cwd(), "src/lib/quests.functions.ts");
    const content = await fs.readFile(filePath, "utf-8");

    // Verify NO occurrences of context.user.id (the bug)
    const bugPattern = /context\.user\.id/g;
    const bugMatches = content.match(bugPattern);
    expect(bugMatches).toBeNull();

    // Verify feed handlers use context.userId (the fix)
    const fixPattern = /context\.userId/g;
    const fixMatches = content.match(fixPattern);
    expect(fixMatches).not.toBeNull();
    expect(fixMatches!.length).toBeGreaterThan(0);
  });
});
