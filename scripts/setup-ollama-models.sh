#!/bin/bash

# Ollama Model Setup Script
# This script pulls the required models for the intent router

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Setting up Ollama models for intent-router-blueprint...${NC}"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   curl -fsSL https://ollama.ai/install.sh | sh${NC}"
    exit 1
fi

# Default models used by the intent router
PLANNER_MODEL="qwen2.5:4b"
ALTERNATIVE_MODELS=("llama3.2:3b" "llama3.1:8b" "mistral:7b" "gemma2:2b")

# Function to check if a model is available
check_model() {
    local model="$1"
    if ollama list | grep -q "$model"; then
        echo -e "${GREEN}✅ Model $model is already available${NC}"
        return 0
    else
        echo -e "${YELLOW}❌ Model $model is not available${NC}"
        return 1
    fi
}

# Function to pull a model
pull_model() {
    local model="$1"
    echo -e "${BLUE}⬇️  Pulling model: $model${NC}"
    if ollama pull "$model"; then
        echo -e "${GREEN}✅ Successfully pulled $model${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to pull $model${NC}"
        return 1
    fi
}

# Function to test model
test_model() {
    local model="$1"
    echo -e "${BLUE}🧪 Testing model: $model${NC}"
    if timeout 30 ollama run "$model" "Hello" 2>/dev/null | head -1 > /dev/null; then
        echo -e "${GREEN}✅ Model $model is working correctly${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Model $model may have issues or is slow to respond${NC}"
        return 1
    fi
}

# Check if Ollama is running, start if not
if ! pgrep -f "ollama serve" > /dev/null; then
    echo -e "${YELLOW}🚀 Ollama is not running. Starting it first...${NC}"
    ollama serve &
    sleep 5
    
    # Wait for Ollama to be ready
    echo -e "${BLUE}⏳ Waiting for Ollama to be ready...${NC}"
    for i in {1..30}; do
        if ollama list > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# Check if Ollama is accessible
if ! ollama list > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to Ollama. Make sure it's running.${NC}"
    echo -e "${YELLOW}   Try running: ollama serve${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking current models...${NC}"
ollama list

echo ""
echo -e "${BLUE}📋 Setting up required models...${NC}"

# Pull the primary planner model
if ! check_model "$PLANNER_MODEL"; then
    echo -e "${BLUE}📥 Pulling primary planner model: $PLANNER_MODEL${NC}"
    if pull_model "$PLANNER_MODEL"; then
        echo -e "${GREEN}✅ Primary model setup complete${NC}"
    else
        echo -e "${YELLOW}❌ Failed to pull primary model. Trying alternatives...${NC}"
        
        # Try alternative models
        success=false
        for alt_model in "${ALTERNATIVE_MODELS[@]}"; do
            echo -e "${BLUE}🔄 Trying alternative model: $alt_model${NC}"
            if pull_model "$alt_model"; then
                echo -e "${GREEN}✅ Alternative model $alt_model pulled successfully${NC}"
                echo -e "${YELLOW}⚠️  Remember to update your configuration to use: $alt_model${NC}"
                PLANNER_MODEL="$alt_model"
                success=true
                break
            fi
        done
        
        if [ "$success" = false ]; then
            echo -e "${RED}❌ Failed to pull any model. Please check your internet connection.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ Primary model $PLANNER_MODEL is already available${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Model setup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Current models:${NC}"
ollama list

echo ""
test_model "$PLANNER_MODEL"

echo ""
echo -e "${GREEN}🚀 Setup complete! You can now use the intent router with browser compatibility.${NC}"
echo -e "${BLUE}💡 To start Ollama with CORS, run: ./scripts/start-ollama-cors.sh${NC}"
echo -e "${BLUE}🔧 To test the setup, run: ollama run $PLANNER_MODEL 'Hello world'${NC}"