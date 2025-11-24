#!/bin/bash

# Deployment script for arena_oracle on Sui testnet

echo "🚀 Deploying arena_oracle to Sui Testnet..."

# Build the contract
echo "📦 Building contract..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy to testnet
echo "🌐 Publishing to Sui testnet..."
RESULT=$(sui client publish --gas-budget 100000000 --json)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

# Extract package ID
PACKAGE_ID=$(echo $RESULT | jq -r '.objectChanges[] | select(.type=="published") | .packageId')

echo "✅ Deployment successful!"
echo ""
echo "📝 Package ID: $PACKAGE_ID"
echo ""
echo "Save this to your .env file:"
echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID"
echo ""
echo "🎉 Contract deployed successfully!"
