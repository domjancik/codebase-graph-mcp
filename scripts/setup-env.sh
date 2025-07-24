#!/bin/bash

# Environment Setup Script for Command Filtering
# Usage: ./scripts/setup-env.sh [environment-name]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Command Filtering Environment Setup${NC}"
    echo ""
    echo "Usage: $0 [environment-name]"
    echo ""
    echo -e "${YELLOW}Available environments:${NC}"
    echo "  dev      - Local development (no filtering)"
    echo "  safe     - Safe local environment (read-only + comments)"
    echo "  tasks    - Task management focused"
    echo "  modeling - Component modeling focused"
    echo "  custom   - Custom whitelist template"
    echo ""
    echo "  list     - List all available environments"
    echo "  current  - Show current environment configuration"
    echo "  reset    - Reset to default (no filtering)"
    echo ""
}

# Function to show current configuration
show_current() {
    echo -e "${BLUE}Current Command Filtering Configuration:${NC}"
    echo ""
    
    if [ -z "$MCP_FILTER_MODE" ]; then
        echo -e "${YELLOW}No environment variables set - using defaults${NC}"
        echo "Filter Mode: whitelist (default)"
    else
        echo "Filter Mode: $MCP_FILTER_MODE"
        [ ! -z "$MCP_COMMAND_PRESET" ] && echo "Preset: $MCP_COMMAND_PRESET"
        [ ! -z "$MCP_ALLOWED_GROUPS" ] && echo "Allowed Groups: $MCP_ALLOWED_GROUPS"
        [ ! -z "$MCP_ALLOWED_COMMANDS" ] && echo "Allowed Commands: $MCP_ALLOWED_COMMANDS"
        [ ! -z "$MCP_BLOCKED_GROUPS" ] && echo "Blocked Groups: $MCP_BLOCKED_GROUPS"
        [ ! -z "$MCP_BLOCKED_COMMANDS" ] && echo "Blocked Commands: $MCP_BLOCKED_COMMANDS"
        [ ! -z "$MCP_DEBUG_FILTERING" ] && echo "Debug Filtering: $MCP_DEBUG_FILTERING"
    fi
    echo ""
}

# Function to list environments
list_environments() {
    echo -e "${BLUE}Available Environment Configurations:${NC}"
    echo ""
    
    for env_file in environments/*.env; do
        if [ -f "$env_file" ]; then
            env_name=$(basename "$env_file" .env)
            env_name=${env_name#local-}
            
            # Extract description from file
            description=$(grep "^#" "$env_file" | head -2 | tail -1 | sed 's/^# //')
            
            echo -e "${GREEN}$env_name${NC} - $description"
        fi
    done
    echo ""
}

# Function to load environment
load_environment() {
    local env_name="$1"
    local env_file="environments/local-$env_name.env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}Error: Environment file '$env_file' not found${NC}"
        echo ""
        list_environments
        return 1
    fi
    
    echo -e "${BLUE}Loading environment configuration: $env_name${NC}"
    echo ""
    
    # Source the environment file
    set -a  # Automatically export all variables
    source "$env_file"
    set +a  # Turn off automatic export
    
    echo -e "${GREEN}Environment '$env_name' loaded successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Configuration loaded:${NC}"
    
    # Show what was loaded
    grep -E "^[A-Z_]+=.*" "$env_file" | while read line; do
        echo "  $line"
    done
    
    echo ""
    echo -e "${YELLOW}To persist these settings, add them to your shell profile:${NC}"
    echo "  export \$(cat $env_file | grep -E '^[A-Z_]+=' | xargs)"
    echo ""
}

# Function to reset environment
reset_environment() {
    echo -e "${BLUE}Resetting command filtering environment...${NC}"
    
    # Unset all MCP filtering environment variables
    unset MCP_FILTER_MODE
    unset MCP_COMMAND_PRESET
    unset MCP_ALLOWED_COMMANDS
    unset MCP_BLOCKED_COMMANDS
    unset MCP_ALLOWED_GROUPS
    unset MCP_BLOCKED_GROUPS
    unset MCP_WARN_UNKNOWN_FIELDS
    unset MCP_STRICT_MODE
    unset MCP_DEBUG_FILTERING
    unset MCP_VALIDATE_CONFIG
    
    echo -e "${GREEN}Environment reset to defaults${NC}"
    echo ""
}

# Main script logic
case "$1" in
    "list")
        list_environments
        ;;
    "current")
        show_current
        ;;
    "reset")
        reset_environment
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    "")
        usage
        ;;
    *)
        load_environment "$1"
        ;;
esac
