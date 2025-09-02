#!/bin/bash

# Ngaan Development Environment Setup Script

set -e

echo "🚀 Setting up Ngaan development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_status "Starting development databases..."

# Start databases using Docker Compose
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.dev.yml up -d
else
    docker compose -f docker-compose.dev.yml up -d
fi

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 10

# Test database connections
print_status "Testing database connections..."

# Test PostgreSQL main database
if nc -z localhost 5432 2>/dev/null; then
    print_success "PostgreSQL main database is running on port 5432"
else
    print_warning "PostgreSQL main database connection failed"
fi

# Test PostgreSQL shadow database
if nc -z localhost 5433 2>/dev/null; then
    print_success "PostgreSQL shadow database is running on port 5433"
else
    print_warning "PostgreSQL shadow database connection failed"
fi

# Test Redis
if nc -z localhost 6379 2>/dev/null; then
    print_success "Redis is running on port 6379"
else
    print_warning "Redis connection failed"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate

# Push database schema
print_status "Pushing database schema..."
npm run db:push

print_success "Development environment setup complete!"

echo ""
echo "📋 Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Access the app at http://localhost:3001"
echo "  3. Access Adminer (database admin) at http://localhost:8080"
echo "     - Server: postgres"
echo "     - Username: postgres"
echo "     - Password: ngaan123"
echo "     - Database: ngaan_dev"
echo ""
echo "🛠 Useful commands:"
echo "  - npm run db:studio    # Open Prisma Studio"
echo "  - npm run db:migrate   # Create and apply migrations"
echo "  - npm run dev:backend  # Start backend API server"
echo "  - npm run typecheck    # Check TypeScript types"
echo "  - npm run lint         # Run linting"
echo ""