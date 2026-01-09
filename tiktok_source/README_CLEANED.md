# TikTok Source - Cleaned Version

This directory contains the cleaned version of the reverse-engineered TikTok source code from [huaji233333/tiktok_source](https://github.com/huaji233333/tiktok_source).

## What Was Kept

- **df_miniapp/**: Main functionality of the TikTok app (1699 Java files)
  - Contains the core recommendation logic
  - Includes classes for location tracking, screenshot detection, WiFi tracking, etc.
  - This is the most important part according to the original README

- **README.md**: Original documentation
- **manifest.json**: App manifest
- **icon.png**: App icon

## What Was Removed

- **config.\***: Language-specific configuration files (ar, de, en, es, fr, hi, id, in, it, ja, ko, my, pt, ru, th, tr, vi, zh)
- **config.arm64_v8a/**: Architecture-specific native libraries
- **config.xxxhdpi/**: Screen density resources
- **df_fusing/**: Fusing module (not main functionality)
- **df_photomovie/**: Photo movie module (not main functionality)
- **df_rn_kit/**: React Native kit (not main functionality)
- **df_miniapp.config.\***: Configuration files for df_miniapp
- **.git/**: Git repository (not needed as submodule)

## Key Files in df_miniapp

Based on the original README, important files include:

- **Location tracking**: `TMALocation.java`, `ILocation.java`
- **Phone calls**: `PhoneCallImpl.java`
- **Screenshot detection**: `TakeScreenshotManager.java`
- **WiFi networks**: `ApiGetWifiListCtrl.java`
- **Facial recognition**: `FacialVerifyProtocolActivity.java`
- **Address loading**: `LoadAddressTask.java`

All source files are in `df_miniapp/classes/` directory.

## Usage

This cleaned version is used by our system to extract insights about TikTok's implementation patterns. See `lib/insights/tiktok_source_analyzer.py` for how we use this code.




