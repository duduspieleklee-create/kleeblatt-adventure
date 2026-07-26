#!/bin/bash
# Deployment script for Gala Game Development

set -e

echo "🎮 Kleinanzeigen Adventure - Deployment"
echo "========================================"

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored message
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if node modules exist
if [ ! -d "node_modules" ]; then
    print_error "Dependencies not installed. Run: npm install"
    exit 1
fi

# Build the game
echo "📦 Building game..."
cd game

clear
cat > README.md << 'EOF'
# Developing a 2D Browser Game on Gala Playworks
EOF

# Build with Vite
npm run build

if [ $? -eq 0 ]; then
    print_status "Build successful!"
else
    print_error "Build failed!"
    exit 1
fi

# Verify dist folder exists
if [ -d "dist" ]; then
    print_status "Distribution directory created"

    # List files in dist
    echo "📁 Contents of dist folder:"
    ls -la dist/
else
    print_error "Distribution directory not found"
    exit 1
fi

# Copy index.html to dist if not present
if [ ! -f "dist/index.html" ]; then
    print_warning "Creating index.html in dist folder"
    cp game/public/index.html dist/index.html
fi

echo ""
echo "🎮 BUILD COMPLETE!"
echo "=================="
echo ""
echo "To preview locally:"
echo "  cd game/dist"
echo "  python3 -m http.server 8080"
echo ""
echo "Or use:"
echo "  npm run preview"
echo ""
echo "To test on production:"
echo "  npm run deploy"
echo ""
