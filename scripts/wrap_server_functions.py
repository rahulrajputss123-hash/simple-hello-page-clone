#!/usr/bin/env python3
"""
Wrap ALL server functions with withServerTiming() middleware.
This script intelligently parses TypeScript function definitions and wraps their handlers.
"""

import re
import sys
from pathlib import Path

def extract_function_name(line):
    """Extract the function name from 'export const functionName = createServerFn'"""
    match = re.match(r'export const (\w+) = createServerFn', line)
    return match.group(1) if match else None

def is_already_wrapped(lines, start_idx):
    """Check if the handler at start_idx is already wrapped with withServerTiming"""
    # Look for withServerTiming in the next 5 lines
    for i in range(start_idx, min(start_idx + 5, len(lines))):
        if 'withServerTiming' in lines[i]:
            return True
    return False

def find_handler_line(lines, start_idx):
    """Find the .handler( line after a function declaration"""
    for i in range(start_idx, min(start_idx + 50, len(lines))):
        if '.handler(' in lines[i]:
            return i
    return None

def wrap_handler(lines, handler_idx, fn_name):
    """Wrap the handler at handler_idx with withServerTiming"""
    line = lines[handler_idx]
    
    # Pattern: .handler(async (...) => {
    # Replace with: .handler(withServerTiming("fnName", async (...) => {
    
    # Match variations:
    # .handler(async ({ ... }) => {
    # .handler(async () => {
    # .handler(async (ctx) => {
    
    if 'async' in line:
        # Simple replacement
        new_line = line.replace(
            '.handler(async ',
            f'.handler(withServerTiming("{fn_name}", async '
        )
        lines[handler_idx] = new_line
        return True
    
    return False

def add_import_if_missing(lines):
    """Add withServerTiming import if not present"""
    for i, line in enumerate(lines):
        if 'withServerTiming' in line:
            return lines  # Already imported
        if 'from "@/integrations/supabase/auth-middleware"' in line:
            # Add import on next line
            lines.insert(i + 1, 'import { withServerTiming } from "@/lib/server-timing-middleware";\n')
            return lines
    return lines

def process_file(filepath):
    """Process a single .functions.ts file"""
    print(f"\n📄 Processing {filepath.name}...")
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Add import if missing
    lines = add_import_if_missing(lines)
    
    wrapped_count = 0
    skipped_count = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        fn_name = extract_function_name(line)
        
        if fn_name:
            # Found a function declaration
            handler_idx = find_handler_line(lines, i)
            
            if handler_idx:
                if is_already_wrapped(lines, handler_idx):
                    print(f"  ⏭️  {fn_name}: already wrapped")
                    skipped_count += 1
                else:
                    if wrap_handler(lines, handler_idx, fn_name):
                        print(f"  ✅ {fn_name}: wrapped")
                        wrapped_count += 1
                    else:
                        print(f"  ⚠️  {fn_name}: could not wrap (unusual pattern)")
        
        i += 1
    
    # Write back
    with open(filepath, 'w') as f:
        f.writelines(lines)
    
    print(f"\n  Summary: {wrapped_count} wrapped, {skipped_count} skipped")
    return wrapped_count, skipped_count

def main():
    base_dir = Path(__file__).parent.parent
    
    files = [
        base_dir / "src/lib/quests.functions.ts",
        base_dir / "src/lib/offers.functions.ts",
        base_dir / "src/lib/marketplace.functions.ts",
        base_dir / "src/lib/analytics/analytics.functions.ts",
        base_dir / "src/lib/coinquest.functions.ts",
        base_dir / "src/lib/tasks.functions.ts",
        base_dir / "src/lib/sdk-offerwall.functions.ts",
        base_dir / "src/lib/automation.functions.ts",
        base_dir / "src/lib/assistant.functions.ts",
        base_dir / "src/lib/offers/torox.functions.ts",
    ]
    
    total_wrapped = 0
    total_skipped = 0
    
    for filepath in files:
        if not filepath.exists():
            print(f"⚠️  Skipping {filepath.name}: file not found")
            continue
        
        wrapped, skipped = process_file(filepath)
        total_wrapped += wrapped
        total_skipped += skipped
    
    print(f"\n{'='*60}")
    print(f"🎉 COMPLETE")
    print(f"{'='*60}")
    print(f"  Wrapped: {total_wrapped}")
    print(f"  Already wrapped: {total_skipped}")
    print(f"  Total: {total_wrapped + total_skipped}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
