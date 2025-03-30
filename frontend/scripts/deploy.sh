#!/bin/bash

# Script for deploying the GDM application

# Display info
echo "===== GDM Application Deployment ====="
echo "This script will deploy the application to your server"

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null
then
    echo "Docker and/or docker-compose are not installed"
    echo "Please install Docker and docker-compose before running this script"
    exit 1
fi

# Check for environment file
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database configuration
POSTGRES_USER=gdmadmin
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=gdmapp

# JWT configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d

# API configuration
NODE_ENV=production
PORT=5000
EOL
    echo ".env file created with random passwords"
else
    echo ".env file already exists, using existing configuration"
fi

# Create SSL directory if it doesn't exist
if [ ! -d "ssl" ]; then
    echo "Creating ssl directory..."
    mkdir -p ssl
    
    # Generate self-signed certificates for development
    echo "Generating self-signed SSL certificates for development..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/gdm.example.com.key \
        -out ssl/gdm.example.com.crt \
        -subj "/C=TH/ST=Bangkok/L=Bangkok/O=GDM App/OU=IT/CN=gdm.example.com"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/api.gdm.example.com.key \
        -out ssl/api.gdm.example.com.crt \
        -subj "/C=TH/ST=Bangkok/L=Bangkok/O=GDM App/OU=IT/CN=api.gdm.example.com"
        
    echo "Self-signed certificates generated. Replace these with real certificates in production."
else
    echo "ssl directory already exists, using existing certificates"
fi

# Build and start the application
echo "Building and starting the application..."
docker-compose up -d --build

# Display information
echo ""
echo "===== Deployment Complete ====="
echo "The application is now running"
echo ""
echo "Frontend: https://gdm.example.com"
echo "API: https://api.gdm.example.com"
echo ""
echo "For a production environment, please:"
echo "1. Replace the self-signed certificates with real certificates"
echo "2. Update DNS settings to point your domains to this server"
echo "3. Update the .env file with secure passwords for production"
echo ""
echo "To stop the application, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
