#!/bin/bash

# =============================================================================
# TiNHiH Portal - Project Setup Script
# =============================================================================

set -e

echo "🏥 TiNHiH Portal - Project Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_status "npm $(npm -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_info "Creating .env file from development template..."
        cp env.development .env
        print_status ".env file created"
        print_warning "Please update the .env file with your actual database credentials and API keys"
    else
        print_status ".env file already exists"
    fi
}

# Check database connection
check_database() {
    print_info "Checking database connection..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        if [ -f .env ]; then
            export $(grep -v '^#' .env | xargs)
        fi
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not found. Please set up your database connection in .env file"
        return 1
    fi
    
    # Try to connect to database (basic check)
    if command -v psql &> /dev/null; then
        # Extract connection details from DATABASE_URL
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
            if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
                print_status "Database connection successful"
            else
                print_warning "Database connection failed. Please check your DATABASE_URL"
            fi
        fi
    else
        print_warning "PostgreSQL client not found. Skipping database connection test"
    fi
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    npm run db:push
    print_status "Database migrations completed"
}

# Build the project
build_project() {
    print_info "Building the project..."
    npm run build
    print_status "Project built successfully"
}

# Check TypeScript
check_typescript() {
    print_info "Checking TypeScript configuration..."
    npm run check
    print_status "TypeScript check completed"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    # Create directories if they don't exist
    mkdir -p dist
    mkdir -p server/public
    mkdir -p logs
    
    print_status "Directories created"
}

# Setup development tools
setup_dev_tools() {
    print_info "Setting up development tools..."
    
    # Create .vscode settings if it doesn't exist
    if [ ! -d .vscode ]; then
        mkdir -p .vscode
        cat > .vscode/settings.json << EOF
{
    "typescript.preferences.importModuleSpecifier": "relative",
    "typescript.suggest.autoImports": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.associations": {
        "*.env*": "dotenv"
    }
}
EOF
        print_status "VS Code settings created"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with actual database credentials"
    echo "2. Set up your PostgreSQL database"
    echo "3. Configure Stripe keys (if using billing features)"
    echo "4. Run 'npm run dev' to start the development server"
    echo ""
    echo "Available commands:"
    echo "  npm run dev      - Start development server"
    echo "  npm run build    - Build for production"
    echo "  npm run check    - TypeScript type checking"
    echo "  npm run db:push  - Run database migrations"
    echo ""
    echo "For more information, check the README.md file"
}

# Main setup function
main() {
    echo "Starting project setup..."
    echo ""
    
    check_node
    check_npm
    install_dependencies
    setup_env
    create_directories
    setup_dev_tools
    check_database
    run_migrations
    check_typescript
    build_project
    
    show_next_steps
}

# Run main function
main "$@" 