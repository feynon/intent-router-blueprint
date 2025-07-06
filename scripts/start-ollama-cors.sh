#!/bin/bash

# Ollama CORS Configuration Script
# This script starts Ollama with CORS enabled for browser compatibility

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Ollama with CORS configuration for browser compatibility...${NC}"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   curl -fsSL https://ollama.ai/install.sh | sh${NC}"
    exit 1
fi

# Set CORS environment variables
export OLLAMA_ORIGINS="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_HOST="0.0.0.0"
export OLLAMA_CORS_ALLOW_ORIGIN="http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080"
export OLLAMA_CORS_ALLOW_METHODS="GET,POST,PUT,DELETE,OPTIONS"
export OLLAMA_CORS_ALLOW_HEADERS="Content-Type,Authorization,X-Requested-With,Accept,Origin"
export OLLAMA_CORS_ALLOW_CREDENTIALS="true"

echo -e "${GREEN}✅ Environment variables set:${NC}"
echo -e "   OLLAMA_ORIGINS: ${OLLAMA_ORIGINS}"
echo -e "   OLLAMA_HOST: ${OLLAMA_HOST}"

# Check if Ollama is already running
if pgrep -f "ollama serve" > /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama is already running. Stopping it first...${NC}"
    pkill -f "ollama serve" || true
    sleep 3
fi

# Start Ollama
echo -e "${BLUE}🏃 Starting Ollama server...${NC}"
ollama serve &
OLLAMA_PID=$!

# Wait for the server to start
echo -e "${BLUE}⏳ Waiting for server to start...${NC}"
sleep 5

# Check if the server is running
if pgrep -f "ollama serve" > /dev/null; then
    echo -e "${GREEN}✅ Ollama server is running with CORS enabled!${NC}"
    echo -e "${BLUE}🌐 Server accessible at: http://localhost:11434${NC}"
    echo -e "${BLUE}🔗 Test endpoint: http://localhost:11434/api/tags${NC}"
    echo ""
    echo -e "${YELLOW}📋 To test CORS from browser console:${NC}"
    echo -e "   fetch('http://localhost:11434/api/tags').then(r => r.json()).then(console.log)"
    echo ""
    echo -e "${YELLOW}🛑 To stop the server, run: pkill -f 'ollama serve'${NC}"
    echo -e "${YELLOW}   Or press Ctrl+C to stop this script${NC}"
else
    echo -e "${RED}❌ Failed to start Ollama server${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping Ollama server...${NC}"
    kill $OLLAMA_PID 2>/dev/null || true
    pkill -f "ollama serve" 2>/dev/null || true
    echo -e "${GREEN}✅ Ollama server stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running and show basic status
echo -e "${BLUE}📊 Ollama server running (Press Ctrl+C to stop)${NC}"
while true; do
    if ! pgrep -f "ollama serve" > /dev/null; then
        echo -e "${RED}❌ Ollama server stopped unexpectedly${NC}"
        exit 1
    fi
    sleep 10
done