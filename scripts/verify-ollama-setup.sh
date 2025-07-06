#!/bin/bash

# Ollama Setup Verification Script
# This script verifies that Ollama is properly configured for browser use

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Ollama setup for browser compatibility...${NC}"
echo ""

# Check 1: Ollama installation
echo -e "${BLUE}1. Checking Ollama installation...${NC}"
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Ollama is installed: $OLLAMA_VERSION${NC}"
else
    echo -e "${RED}❌ Ollama is not installed${NC}"
    echo -e "${YELLOW}   Install with: curl -fsSL https://ollama.ai/install.sh | sh${NC}"
    exit 1
fi

# Check 2: Ollama server status
echo -e "${BLUE}2. Checking Ollama server status...${NC}"
if pgrep -f "ollama serve" > /dev/null; then
    echo -e "${GREEN}✅ Ollama server is running${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Ollama server is not running${NC}"
    echo -e "${YELLOW}   Start with: ollama serve${NC}"
    SERVER_RUNNING=false
fi

# Check 3: Model availability
echo -e "${BLUE}3. Checking required models...${NC}"
REQUIRED_MODEL="qwen2.5:4b"
if ollama list 2>/dev/null | grep -q "$REQUIRED_MODEL"; then
    echo -e "${GREEN}✅ Required model $REQUIRED_MODEL is available${NC}"
    MODEL_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Required model $REQUIRED_MODEL is not available${NC}"
    echo -e "${YELLOW}   Pull with: ollama pull $REQUIRED_MODEL${NC}"
    MODEL_AVAILABLE=false
fi

# Check 4: CORS environment variables
echo -e "${BLUE}4. Checking CORS environment variables...${NC}"
if [ -n "$OLLAMA_ORIGINS" ]; then
    echo -e "${GREEN}✅ OLLAMA_ORIGINS is set: $OLLAMA_ORIGINS${NC}"
    CORS_CONFIGURED=true
else
    echo -e "${YELLOW}⚠️  OLLAMA_ORIGINS is not set${NC}"
    echo -e "${YELLOW}   Set with: export OLLAMA_ORIGINS=\"http://localhost:3000,http://localhost:8080\"${NC}"
    CORS_CONFIGURED=false
fi

if [ -n "$OLLAMA_HOST" ]; then
    echo -e "${GREEN}✅ OLLAMA_HOST is set: $OLLAMA_HOST${NC}"
else
    echo -e "${YELLOW}⚠️  OLLAMA_HOST is not set${NC}"
    echo -e "${YELLOW}   Set with: export OLLAMA_HOST=\"0.0.0.0\"${NC}"
    CORS_CONFIGURED=false
fi

# Check 5: Server connectivity (if server is running)
if [ "$SERVER_RUNNING" = true ]; then
    echo -e "${BLUE}5. Testing server connectivity...${NC}"
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo -e "${GREEN}✅ Server is accessible at http://localhost:11434${NC}"
        SERVER_ACCESSIBLE=true
    else
        echo -e "${RED}❌ Server is not accessible${NC}"
        echo -e "${YELLOW}   Check firewall settings or restart Ollama${NC}"
        SERVER_ACCESSIBLE=false
    fi
else
    echo -e "${BLUE}5. Skipping connectivity test (server not running)${NC}"
    SERVER_ACCESSIBLE=false
fi

# Check 6: Model functionality (if everything is available)
if [ "$SERVER_RUNNING" = true ] && [ "$MODEL_AVAILABLE" = true ]; then
    echo -e "${BLUE}6. Testing model functionality...${NC}"
    if timeout 30 ollama run "$REQUIRED_MODEL" "Hello" 2>/dev/null | head -1 > /dev/null; then
        echo -e "${GREEN}✅ Model $REQUIRED_MODEL is working correctly${NC}"
        MODEL_WORKING=true
    else
        echo -e "${YELLOW}⚠️  Model $REQUIRED_MODEL may have issues or is slow${NC}"
        MODEL_WORKING=false
    fi
else
    echo -e "${BLUE}6. Skipping model test (prerequisites not met)${NC}"
    MODEL_WORKING=false
fi

echo ""
echo -e "${BLUE}📊 Setup Summary:${NC}"
echo "=========================="

# Summary
if [ "$SERVER_RUNNING" = true ] && [ "$MODEL_AVAILABLE" = true ] && [ "$CORS_CONFIGURED" = true ] && [ "$SERVER_ACCESSIBLE" = true ] && [ "$MODEL_WORKING" = true ]; then
    echo -e "${GREEN}🎉 All checks passed! Ollama is ready for browser use.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Quick start commands:${NC}"
    echo -e "   Test API: ${YELLOW}curl http://localhost:11434/api/tags${NC}"
    echo -e "   Test model: ${YELLOW}ollama run $REQUIRED_MODEL 'Hello world'${NC}"
    echo ""
    echo -e "${BLUE}🌐 Browser test JavaScript:${NC}"
    echo -e "   ${YELLOW}fetch('http://localhost:11434/api/tags').then(r => r.json()).then(console.log)${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some issues found. Please address them and run this script again.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Recommended actions:${NC}"
    
    if [ "$SERVER_RUNNING" = false ]; then
        echo -e "   1. Start Ollama: ${YELLOW}ollama serve${NC}"
    fi
    
    if [ "$MODEL_AVAILABLE" = false ]; then
        echo -e "   2. Pull model: ${YELLOW}ollama pull $REQUIRED_MODEL${NC}"
    fi
    
    if [ "$CORS_CONFIGURED" = false ]; then
        echo -e "   3. Configure CORS: ${YELLOW}./scripts/start-ollama-cors.sh${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}💡 Or run the automated setup: ${YELLOW}./scripts/setup-ollama-models.sh${NC}"
    exit 1
fi