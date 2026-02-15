#!/bin/bash

# CVF Quick Start Script
# This script helps you set up CVF in minutes with interactive prompts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
ROCKET="🚀"
WRENCH="🔧"

# Print colored output
print_info() {
    echo -e "${BLUE}${INFO}  $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK}  $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS}  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️   $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            print_success "Node.js $(node -v) installed"
        else
            print_error "Node.js version must be 18 or higher (current: $(node -v))"
            all_ok=false
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+"
        print_info "Download from: https://nodejs.org/"
        all_ok=false
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm -v) installed"
    else
        print_error "npm not found"
        all_ok=false
    fi
    
    # Check git
    if command_exists git; then
        print_success "git $(git --version | cut -d' ' -f3) installed"
    else
        print_error "git not found. Please install git"
        all_ok=false
    fi
    
    # Check Python (optional)
    if command_exists python3; then
        print_success "Python $(python3 --version | cut -d' ' -f2) installed (optional)"
    else
        print_warning "Python3 not found (optional, needed for SDK)"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Prerequisites check failed. Please install missing dependencies."
        exit 1
    fi
    
    echo ""
}

# Interactive setup
interactive_setup() {
    print_header "CVF Setup Wizard"
    
    echo "What would you like to do?"
    echo ""
    echo "1) ${ROCKET} Quick Start - Run Web UI (recommended for beginners)"
    echo "2) ${WRENCH} Full Setup - Clone repo + Web UI + SDK"
    echo "3) 📖 Core CVF Only - Just the framework, no UI"
    echo "4) 👥 Team Setup - Multi-user setup"
    echo ""
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1) quick_start ;;
        2) full_setup ;;
        3) core_only ;;
        4) team_setup ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
}

# Quick start - Web UI only
quick_start() {
    print_header "Quick Start - Web UI"
    
    local project_name="cvf-project"
    read -p "Project name (default: cvf-project): " input_name
    if [ -n "$input_name" ]; then
        project_name="$input_name"
    fi
    
    print_info "Setting up project: $project_name"
    
    # Clone repo
    if [ -d "$project_name" ]; then
        print_warning "Directory $project_name already exists"
        read -p "Remove and re-clone? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            rm -rf "$project_name"
        else
            print_error "Setup cancelled"
            exit 1
        fi
    fi
    
    print_info "Cloning repository..."
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git "$project_name"
    
    cd "$project_name/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web"
    
    # Install dependencies
    print_info "Installing dependencies (this may take a few minutes)..."
    npm install
    
    # Create .env file
    print_info "Creating environment file..."
    if [ ! -f .env ]; then
        cat > .env << EOF
# CVF Configuration
NODE_ENV=development
PORT=3000

# AI Provider API Keys (optional - add your own)
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here
# GOOGLE_API_KEY=your_google_key_here

# Feature Flags
ENABLE_GOVERNANCE=true
ENABLE_AGENT_CHAT=true
ENABLE_MULTI_AGENT=true
EOF
        print_success ".env file created"
    else
        print_warning ".env already exists, skipping"
    fi
    
    # Success message
    echo ""
    print_success "Setup complete! ${ROCKET}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Start the development server:"
    echo "     ${GREEN}cd $project_name/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web${NC}"
    echo "     ${GREEN}npm run dev${NC}"
    echo ""
    echo "  2. Open your browser:"
    echo "     ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "  3. (Optional) Add AI API keys in .env file"
    echo ""
    
    read -p "Start server now? (y/n): " start_now
    if [ "$start_now" = "y" ]; then
        print_info "Starting development server..."
        npm run dev
    fi
}

# Full setup - everything
full_setup() {
    print_header "Full Setup"
    
    local project_name="cvf-full"
    read -p "Project name (default: cvf-full): " input_name
    if [ -n "$input_name" ]; then
        project_name="$input_name"
    fi
    
    # Clone repo
    print_info "Cloning repository..."
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git "$project_name"
    cd "$project_name"
    
    # Setup Web UI
    print_info "Setting up Web UI..."
    cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
    npm install
    
    # Create .env
    if [ ! -f .env ]; then
        cat > .env << EOF
NODE_ENV=development
PORT=3000
ENABLE_GOVERNANCE=true
ENABLE_AGENT_CHAT=true
EOF
        print_success "Web UI .env created"
    fi
    
    cd ../../..
    
    # Setup Python SDK (if Python available)
    if command_exists python3; then
        print_info "Setting up Python SDK..."
        cd EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk
        
        if command_exists pip3; then
            pip3 install -e . --break-system-packages 2>/dev/null || pip3 install -e .
            print_success "Python SDK installed"
        else
            print_warning "pip3 not found, skipping SDK setup"
        fi
        
        cd ../../..
    fi
    
    # Success
    echo ""
    print_success "Full setup complete! ${ROCKET}"
    echo ""
    echo "You now have:"
    echo "  ${CHECK} Web UI (v1.6)"
    echo "  ${CHECK} Python SDK (v1.3)"
    echo "  ${CHECK} All documentation"
    echo "  ${CHECK} Governance toolkit"
    echo ""
    echo "Quick start:"
    echo "  ${GREEN}cd $project_name/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web${NC}"
    echo "  ${GREEN}npm run dev${NC}"
    echo ""
}

# Core only setup
core_only() {
    print_header "Core CVF Setup"
    
    print_info "This will clone the repo and show you the core documentation."
    
    local project_name="cvf-core"
    read -p "Directory name (default: cvf-core): " input_name
    if [ -n "$input_name" ]; then
        project_name="$input_name"
    fi
    
    print_info "Cloning repository..."
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git "$project_name"
    
    cd "$project_name"
    
    echo ""
    print_success "Repository cloned!"
    echo ""
    echo "Core CVF documentation:"
    echo ""
    echo "  📖 Manifesto:     ${GREEN}v1.0/CVF_MANIFESTO.md${NC}"
    echo "  📋 Usage Guide:   ${GREEN}v1.0/USAGE.md${NC}"
    echo "  🔄 Phases:        ${GREEN}v1.0/phases/${NC}"
    echo "  ✅ Governance:    ${GREEN}v1.0/governance/${NC}"
    echo ""
    echo "Start here:"
    echo "  ${GREEN}cd $project_name${NC}"
    echo "  ${GREEN}cat v1.0/CVF_MANIFESTO.md${NC}"
    echo ""
}

# Team setup
team_setup() {
    print_header "Team Setup"
    
    print_info "This will set up CVF for team collaboration."
    
    quick_start
    
    echo ""
    print_info "Additional team setup steps:"
    echo ""
    echo "1. Share the project directory with your team"
    echo "2. Each team member should run: ${GREEN}npm install${NC}"
    echo "3. Configure governance in: ${GREEN}governance/toolkit/${NC}"
    echo "4. Set up roles:"
    echo "   - Project Owner: Phase A (Discovery)"
    echo "   - Architect: Phase B (Design)"
    echo "   - Developer: Phase C (Build)"
    echo "   - QA: Phase D (Review)"
    echo ""
    echo "Documentation: ${BLUE}docs/guides/team-setup.md${NC}"
    echo ""
}

# Check for updates
check_updates() {
    print_info "Checking for updates..."
    
    local latest_version=$(curl -s https://api.github.com/repos/Blackbird081/Controlled-Vibe-Framework-CVF/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [ -n "$latest_version" ]; then
        print_info "Latest version: $latest_version"
    else
        print_warning "Could not check for updates (offline?)"
    fi
}

# Main
main() {
    clear
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                            ║${NC}"
    echo -e "${BLUE}║        ${GREEN}CVF Quick Start Setup${BLUE}             ║${NC}"
    echo -e "${BLUE}║    Controlled Vibe Framework v1.6.0        ║${NC}"
    echo -e "${BLUE}║                                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    check_updates
    interactive_setup
}

# Run main
main
