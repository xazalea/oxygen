#!/usr/bin/env python3
"""
Start the seamless real-time TikTok FYP service.

This script starts the service that automatically:
- Collects data from TikTok
- Trains models continuously
- Serves recommendations
- Improves itself over time

Usage:
    python scripts/start_real_time_service.py [--config CONFIG_PATH]

Environment Variables:
    TIKTOK_MS_TOKEN: TikTok ms_token from cookies (optional but recommended)
    TIKTOK_BROWSER: Browser to use (chromium, firefox, webkit) [default: chromium]
"""

import asyncio
import argparse
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from implementations.v1.services.ultra_fast_service import UltraFastAddictiveService


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Start the seamless real-time TikTok FYP service"
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to configuration file (default: implementations/v1/configs/real_time_config.json)"
    )
    parser.add_argument(
        "--ms-token",
        type=str,
        default=None,
        help="TikTok ms_token (or set TIKTOK_MS_TOKEN env var)"
    )
    parser.add_argument(
        "--browser",
        type=str,
        default=None,
        choices=["chromium", "firefox", "webkit"],
        help="Browser to use (or set TIKTOK_BROWSER env var)"
    )
    
    args = parser.parse_args()
    
    # Set environment variables if provided
    if args.ms_token:
        os.environ["TIKTOK_MS_TOKEN"] = args.ms_token
    if args.browser:
        os.environ["TIKTOK_BROWSER"] = args.browser
    
    # Check for TikTok-Api installation
    try:
        import TikTokApi
    except ImportError:
        print("ERROR: TikTokApi not installed!")
        print("Install it with: pip install TikTokApi")
        print("Also install playwright: python -m playwright install")
        sys.exit(1)
    
    # Check for playwright
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("ERROR: Playwright not installed!")
        print("Install it with: python -m playwright install")
        sys.exit(1)
    
    # Determine config path
    if args.config:
        config_path = Path(args.config)
    else:
        config_path = project_root / "implementations" / "v1" / "configs" / "real_time_config.json"
    
    if not config_path.exists():
        print(f"WARNING: Config file not found: {config_path}")
        print("Using default configuration...")
        config_path = None
    
    # Create and start service
    print("=" * 60)
    print("TikTok FYP Real-Time Service")
    print("=" * 60)
    print(f"Config: {config_path}")
    print(f"MS Token: {'Set' if os.environ.get('TIKTOK_MS_TOKEN') else 'Not set (optional)'}")
    print(f"Browser: {os.environ.get('TIKTOK_BROWSER', 'chromium')}")
    print("=" * 60)
    print()
    
    service = UltraFastAddictiveService(config_path=str(config_path) if config_path else None)
    
    try:
        asyncio.run(service.start())
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")


if __name__ == "__main__":
    main()

