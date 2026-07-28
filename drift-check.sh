#!/bin/bash
set -e

FRONTEND_DIR="path/to/frontend/folder" # Update this to your GAIS UI folder path
PORT_FILE="server.ts"

# 1. Fetch remote tracking branches without moving your local HEAD
echo "Checking Google AI Studio for updates..."
git fetch origin main

# 2. DETERMINISTIC DRIFT DETECTION
# Compare your current local main (before reset) with the incoming remote main
IF_CHANGES=$(git diff HEAD origin/main --name-only -- "$FRONTEND_DIR")

if [ -n "$IF_CHANGES" ]; then
    echo "⚠️ GAIS UI updates detected! Generating drift report..."
    
    # Generate structural drift report (List of changed files, additions, deletions)
    git diff HEAD origin/main --stat -- "$FRONTEND_DIR" > gais_drift_report.txt
    
    # Extract API/URL string changes specifically (Inference-style log)
    echo -e "\n--- Detected API Call / Route Changes ---" >> gais_drift_report.txt
    git diff HEAD origin/main -G"fetch|axios|api|http" -- "$FRONTEND_DIR" >> gais_drift_report.txt
    
    echo "✅ Drift report saved to gais_drift_report.txt"


    # 3. EXECUTE YOUR SAFE WORKFLOW
    echo "Syncing branches..."
    git checkout main
    git reset --hard HEAD~1
    git pull origin main

    # Create unique dev branch name based on timestamp or increment
    NEW_DEV_BRANCH="dev-$(date +%Y%m%d%H%M%S)"
    git checkout -b "$NEW_DEV_BRANCH"

    # 4. AUTOMATIC PORT FIX (Avoids manual editing every time)
    if [ -f "$PORT_FILE" ]; then
        echo "Updating port configuration in $PORT_FILE..."
        # Replaces 'PORT = 3000' with your custom local port (e.g., 5000)
        sed -i 's/PORT = 3000/PORT = 5000/g' "$PORT_FILE" 
    fi

    # Open editor as requested
    kate "$PORT_FILE"
else
    echo "✅ No UI changes detected from GAIS."
fi