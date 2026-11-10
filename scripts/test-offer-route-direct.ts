/**
 * Test offer route directly without full build
 * Checks if the route exports are correct
 */

async function testOfferRoute() {
  console.log("Testing offer route module exports...\n");

  try {
    // Import the route module
    const routeModule = await import("../src/routes/_authenticated/offer.$offerId.tsx");
    
    console.log("✅ Route module loaded successfully");
    console.log("Exported keys:", Object.keys(routeModule));
    
    // Check if Route export exists
    if (!routeModule.Route) {
      console.error("❌ Route export is missing!");
      process.exit(1);
    }
    
    console.log("✅ Route export exists");
    
    // Check Route properties
    const route = routeModule.Route;
    console.log("\nRoute properties:");
    console.log("  - id:", route.id);
    console.log("  - path:", route.path);
    
    // Try to access component (this is where the crash might happen)
    try {
      const component = route.options?.component;
      if (component) {
        console.log("✅ Component exists:", component.name || "anonymous");
      } else {
        console.log("⚠️  Component is undefined");
      }
    } catch (err: any) {
      console.error("❌ Error accessing component:", err.message);
      process.exit(1);
    }
    
    // Check errorComponent
    try {
      const errorComponent = route.options?.errorComponent;
      if (errorComponent) {
        console.log("✅ ErrorComponent exists:", errorComponent.name || "anonymous");
      } else {
        console.log("⚠️  ErrorComponent is undefined");
      }
    } catch (err: any) {
      console.error("❌ Error accessing errorComponent:", err.message);
    }
    
    console.log("\n✅ All checks passed - route structure is valid");
    
  } catch (err: any) {
    console.error("❌ Failed to load route module:");
    console.error(err);
    process.exit(1);
  }
}

testOfferRoute();
