# Build Instructions for CarPolly APK

## Prerequisites

1. Install dependencies: `npm install`
2. Fix any security vulnerabilities: `npm audit fix`
3. Install EAS CLI: `npm install -g eas-cli`
4. Login to Expo: `eas login`

## Building APK Files

### Development Build (for testing)

```bash
eas build --platform android --profile development
```

### Preview Build (for testing before production)

```bash
eas build --platform android --profile preview
```

### Production Build (final APK)

```bash
eas build --platform android --profile production
```

## Build Configuration

The `eas.json` file includes three build profiles:

1. **Development** - For internal testing with development client
2. **Preview** - For testing the app before production release
3. **Production** - Final release build for distribution

## Download Built APK

After building, you can:

1. Visit https://expo.dev/accounts/[username]/projects/carpolly-react-native/builds
2. Download the APK file from the build dashboard
3. Install the APK on your Android device

## App Configuration

The app is configured in `app.json` with:

- App name: "CarPolly"
- Package: "com.carpolly.reactnative"
- Version: "1.0.0"
- Icon and splash screen configured
- Android adaptive icon set up

## Notes

- Make sure you have Android build tools installed
- The first build may take longer as it needs to set up the build environment
- You can check build status with: `eas build:list`
