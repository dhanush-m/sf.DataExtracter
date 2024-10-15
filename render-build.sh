#!/usr/bin/env bash
# exit on error
set -o errexit

# Add debugging output
echo "Starting build process..."

# Clean install of dependencies
echo "Cleaning npm cache..."
npm cache clean --force

echo "Removing existing node_modules..."
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules

echo "Installing root dependencies..."
npm install --legacy-peer-deps

echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

echo "Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..

# Build the project
echo "Building the project..."
npm run build

echo "Build process completed."
