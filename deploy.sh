#!/usr/bin/env bash

# OvenPlatform Deployment Script
# Version: 1.1.2
#
# This script automates the deployment process for OvenPlatform
# It allows users to easily set up either development or production environments
# and handles all the necessary configuration steps.

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# Function to display usage instructions
show_usage() {
  echo -e "${BOLD}Usage:${RESET} ./deploy.sh [options]"
  echo
  echo "Options:"
  echo "  -e, --env ENV     Set environment (development or production)"
  echo "  -h, --help        Show this help message and exit"
  echo
  echo "Examples:"
  echo "  ./deploy.sh --env development    # Deploy in development mode"
  echo "  ./deploy.sh --env production     # Deploy in production mode"
}

# Function to check prerequisites
check_prerequisites() {
  echo -e "${BLUE}${BOLD}Checking prerequisites...${RESET}"
  
  # Check Docker
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${RESET}"
    exit 1
  else
    echo -e "${GREEN}✓ Docker is installed${RESET}"
  fi
  
  # Check Docker Compose
  if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed or not in path. Please install Docker Compose first.${RESET}"
    exit 1
  else
    echo -e "${GREEN}✓ Docker Compose is installed${RESET}"
  fi
  
  # Check Node.js (optional but useful for running setup scripts)
  if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠ Node.js is not installed. It's recommended for running setup scripts, but not required for deployment.${RESET}"
  else
    echo -e "${GREEN}✓ Node.js is installed${RESET}"
  fi
}

# Function to setup environment files
setup_environment() {
  local env=$1
  
  echo -e "${BLUE}${BOLD}Setting up $env environment...${RESET}"
  
  # Create a root .env file
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${RESET}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${RESET}"
  else
    echo -e "${GREEN}✓ Root .env file already exists${RESET}"
  fi
  
  # Setup frontend environment
  cd ovenPlatform-web
  
  if [ "$env" == "development" ]; then
    echo -e "${YELLOW}Setting up frontend development environment...${RESET}"
    
    if [ ! -f ".env.development" ]; then
      if command -v node &> /dev/null; then
        echo -e "${YELLOW}Running env setup script...${RESET}"
        npm run setup-env -- development
      else
        echo -e "${YELLOW}Copying example env file...${RESET}"
        cp .env.example .env.development
        echo -e "${YELLOW}⚠ You need to manually edit .env.development to set required values${RESET}"
      fi
    else
      echo -e "${GREEN}✓ Frontend development environment file already exists${RESET}"
    fi
  else
    echo -e "${YELLOW}Setting up frontend production environment...${RESET}"
    
    if [ ! -f ".env" ]; then
      if command -v node &> /dev/null; then
        echo -e "${YELLOW}Running env setup script...${RESET}"
        npm run setup-env -- production
      else
        echo -e "${YELLOW}Copying example env file...${RESET}"
        cp .env.example .env
        echo -e "${YELLOW}⚠ You need to manually edit .env to set required values${RESET}"
      fi
    else
      echo -e "${GREEN}✓ Frontend production environment file already exists${RESET}"
    fi
  fi
  
  cd ..
  
  # Setup backend environment
  cd ovenPlatform-be
  
  if [ "$env" == "development" ]; then
    echo -e "${YELLOW}Setting up backend development environment...${RESET}"
    
    if [ ! -f ".env.development" ]; then
      echo -e "${YELLOW}Copying example env file...${RESET}"
      cp .env.example .env.development
      echo -e "${YELLOW}⚠ You need to manually edit .env.development to set required values${RESET}"
    else
      echo -e "${GREEN}✓ Backend development environment file already exists${RESET}"
    fi
  else
    echo -e "${YELLOW}Setting up backend production environment...${RESET}"
    
    if [ ! -f ".env" ]; then
      echo -e "${YELLOW}Copying example env file...${RESET}"
      cp .env.example .env
      echo -e "${YELLOW}⚠ You need to manually edit .env to set required values${RESET}"
    else
      echo -e "${GREEN}✓ Backend production environment file already exists${RESET}"
    fi
  fi
  
  cd ..
}

# Function to build and deploy
deploy() {
  local env=$1
  
  echo -e "${BLUE}${BOLD}Building and deploying OvenPlatform in $env mode...${RESET}"
  
  if [ "$env" == "development" ]; then
    # Build development images
    echo -e "${YELLOW}Building development Docker images...${RESET}"
    cd ovenPlatform-web
    npm run docker-build:dev
    
    cd ../ovenPlatform-be
    npm run docker-build:dev
    
    # Deploy development containers
    echo -e "${YELLOW}Starting development containers...${RESET}"
    cd ../ovenPlatform-depl
    docker compose -f compose.dev.yaml up -d
  else
    # Build production images
    echo -e "${YELLOW}Building production Docker images...${RESET}"
    cd ovenPlatform-web
    npm run docker-build:prod
    
    cd ../ovenPlatform-be
    npm run docker-build:prod
    
    # Deploy production containers
    echo -e "${YELLOW}Starting production containers...${RESET}"
    cd ../ovenPlatform-depl
    docker compose -f compose.prod.yaml up -d
  fi
  
  cd ..
  
  echo -e "${GREEN}${BOLD}✓ Deployment completed!${RESET}"
  
  # Show service info
  if [ "$env" == "development" ]; then
    echo -e "${BLUE}${BOLD}Development services:${RESET}"
    echo -e "  * Frontend: ${GREEN}http://localhost:8080${RESET}"
    echo -e "  * Backend API: ${GREEN}http://localhost:3001${RESET}"
  else
    echo -e "${BLUE}${BOLD}Production services:${RESET}"
    echo -e "  * Frontend: ${GREEN}http://localhost:4173${RESET}"
    echo -e "  * Backend API: ${GREEN}http://localhost:4172${RESET}"
  fi
}

# Parse command line arguments
ENVIRONMENT=""

while [ "$1" != "" ]; do
  case $1 in
    -e | --env )  shift
                  ENVIRONMENT=$1
                  ;;
    -h | --help ) show_usage
                  exit 0
                  ;;
    * )           echo -e "${RED}Unknown option: $1${RESET}"
                  show_usage
                  exit 1
  esac
  shift
done

# Check if environment is specified
if [ -z "$ENVIRONMENT" ]; then
  echo -e "${RED}Error: Environment not specified.${RESET}"
  show_usage
  exit 1
fi

# Validate environment value
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Must be 'development' or 'production'.${RESET}"
  show_usage
  exit 1
fi

# Execute deployment steps
echo -e "${BLUE}${BOLD}OvenPlatform Deployment Script - v1.1.2${RESET}"
echo -e "${YELLOW}Target Environment: ${BOLD}$ENVIRONMENT${RESET}"
echo

# Check prerequisites
check_prerequisites

# Setup environment files
setup_environment "$ENVIRONMENT"

# Deploy the application
deploy "$ENVIRONMENT"

echo
echo -e "${GREEN}${BOLD}Deployment successful!${RESET}"
echo -e "${YELLOW}For more information, refer to the documentation in ${BOLD}DEPLOYMENT.md${RESET} and ${BOLD}ENV_CONFIG.md${RESET}"
