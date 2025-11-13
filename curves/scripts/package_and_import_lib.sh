#!/bin/bash
# Stop on errors
set -e

# Determine current working directory (curves project root)
CURVES_DIR=$(pwd)

echo "🧭 Starting in: $CURVES_DIR"

# Move two directories up to reach the parent and then into lib
cd ../lib

echo "→ Packaging local library..."
npm run package

# Find the most recently created .tgz file (newest first)
PKG_FILE=$(ls -t *.tgz 2>/dev/null | head -n 1)

# Verify we actually found one
if [ -z "$PKG_FILE" ]; then
  echo "❌ No .tgz file found in lib folder!"
  exit 1
fi

echo "📦 Found latest package: $PKG_FILE"

# Go back to curves/iframe-server
cd "$CURVES_DIR/iframe-server"

# Full path to the tarball
PKG_PATH="../../lib/$PKG_FILE"

# Verify file exists at that path
if [ ! -f "$PKG_PATH" ]; then
  echo "❌ Package file not found at expected path: $PKG_PATH"
  exit 1
fi

echo "📥 Installing $PKG_PATH into iframe-server as pc-messaging-kernel ..."
npm install "$PKG_PATH" --save pc-messaging-kernel

echo "✅ Local package installed successfully!"
