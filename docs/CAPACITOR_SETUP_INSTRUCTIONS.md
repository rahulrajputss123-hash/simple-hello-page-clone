# Capacitor Android Setup Instructions

⚠️ **AUTOMATED SETUP INCOMPLETE** — npm install timed out twice (180s and 300s)

The `capacitor.config.ts` has been updated with the correct configuration:
- **appId**: `com.rahulrajput.coinquest` 
- **appName**: `CashGPT`
- **server.url**: `https://cashgpt.in`

## Manual Steps Required

Run these commands to complete the Android setup:

```bash
# Install Capacitor packages (may take several minutes)
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Android platform
npx cap add android

# Sync web assets to Android
npx cap sync android
```

## Expected Result

After successful installation, you should see:
- `android/` directory created with Android Studio project
- `node_modules/@capacitor/` packages installed
- Updated `package.json` with Capacitor dependencies

## Verification

```bash
# List installed Capacitor packages
npm list @capacitor/core @capacitor/cli @capacitor/android

# Check Android directory exists
ls -la android/
```

## Next Steps After Setup

1. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

2. Update Android-specific settings:
   - App icons and splash screens
   - Permissions in `AndroidManifest.xml`
   - Build configuration in `build.gradle`

3. Build APK for testing or AAB for Google Play Store

## Important Notes

- **appId cannot be changed** after first Play Store publish
- Keep `capacitor.config.ts` committed to git
- Commit `android/` folder after initial setup completes
- `.gitignore` already has appropriate exclusions for Android build artifacts

## Troubleshooting

If npm install continues to timeout:
- Try with faster network connection
- Use `npm install --verbose` to see progress
- Install packages individually if needed
- Consider using `yarn` or `pnpm` as alternative package managers
