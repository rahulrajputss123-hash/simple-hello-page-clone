#!/usr/bin/env python3
"""
Fix missing closing parens for all withServerTiming wrappers
"""

import re
from pathlib import Path

def fix_file(filepath):
    """Fix all withServerTiming wrappers in a file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Pattern: .handler(withServerTiming(...async ... => { ... }));
    # Replace: .handler(withServerTiming(...async ... => { ... })));
    
    # Find all instances where there's a closing brace followed by });
    # but NOT followed by ));
    pattern = r'(\.handler\(withServerTiming\([^,]+,\s*async[^{]*\{[^}]*\}\)\);)'
    
    def replace_fn(match):
        text = match.group(1)
        # Change }); to }));
        if not text.endswith(')));'):
            text = text[:-2] + ')));'
        return text
    
    original_len = len(content)
    content = re.sub(pattern, replace_fn, content, flags=re.DOTALL)
    
    if len(content) != original_len:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    base_dir = Path(__file__).parent.parent
    
    files = list((base_dir / "src/lib").rglob("*.functions.ts"))
    
    fixed_count = 0
    for filepath in files:
        if fix_file(filepath):
            print(f"✅ Fixed {filepath.name}")
            fixed_count += 1
        else:
            print(f"⏭️  Skipped {filepath.name} (no changes needed)")
    
    print(f"\n🎉 Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
