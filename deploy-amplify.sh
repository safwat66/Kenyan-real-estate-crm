#!/bin/bash

# Kenyan Real Estate CRM - Amplify Deployment Script

echo "🚀 Starting Amplify Gen 2 deployment for Kenyan Real Estate CRM"
echo "📍 Region: eu-west-1 (Ireland - cost-effective for Kenya)"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Navigate to amplify directory and install backend dependencies
cd amplify
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Amplify backend dependencies..."
    npm install
fi

# Build and deploy the backend
echo "🏗️  Building and deploying Amplify backend..."
npx ampx sandbox --region eu-west-1

echo "✅ Amplify backend deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the generated configuration values"
echo "2. Update src/amplifyconfiguration.json with the actual values"
echo "3. Test the application with 'npm start'"
echo "4. Deploy to production with Amplify Hosting when ready"
echo ""
echo "💡 Tip: Keep the sandbox running for development, or use 'npx ampx sandbox delete' to clean up resources"
