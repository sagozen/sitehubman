#!/bin/bash

# ==============================================================================
# 🏢 BIOCLOUD ENTERPRISE PRODUCTION DEPLOYMENT ENGINE
# ==============================================================================
# Target Stack: React Native (Expo) + TypeScript + Firebase (Auth, Firestore, Cloud Functions)
# Project Scope: $100,000 App Launch Sequence
# ==============================================================================

set -e # Exit instantly if any structural command throws an error exit code

# Color palette variables for terminal output presentation
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🚀 INITIALIZING FULL ENTERPRISE RELEASE PREPARATION SEQUENCE${NC}"
echo -e "${BLUE}================================================================${NC}\n"

# 🛠️ PHASE 1: STRICT TYPE CHECKS & STATIC ANALYSIS
echo -e "${YELLOW}[PHASE 1/4] Running strict compilation checks...${NC}"
npm run tsc -- --noEmit

# 🔐 PHASE 2: ENVIRONMENT VALIDATION & FIREBASE SECURITY BOUNDS
echo -e "${YELLOW}[PHASE 2/4] Authenticating cloud architecture environment...${NC}"

# Extract active project settings to guarantee zero production environment pollution
ACTIVE_PROJECT=$(firebase use)
echo -e "Active Firebase Environment Context: ${GREEN}${ACTIVE_PROJECT}${NC}"

# Prompt for absolute user verification loop before deploying data layers
read -p "Confirm deployment to project [${ACTIVE_PROJECT}]? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Deployment aborted by operations engineer.${NC}"
    exit 1
fi

echo -e "${YELLOW}Deploying database firewalls and spatial indexes...${NC}"
firebase deploy --only firestore:rules,firestore:indexes

# ⚙️ PHASE 3: SERVERLESS WEBHOOKS & CRYPTOGRAPHIC ENGINE
echo -e "${YELLOW}[PHASE 3/4] Packaging and deploying serverless functions...${NC}"
# Deploying the sync trigger and cryptographically sealed webhook simultaneously
firebase deploy --only functions:syncUserAccessClaims,functions:paymentWebhookAba

# 📲 PHASE 4: MOBILE ASSET BINDING & EAS PRODUCTION COMPILE
echo -e "${YELLOW}[PHASE 4/4] Packing multi-persona Expo production assets...${NC}"

# Trigger EAS production branch building pipeline
echo -e "${YELLOW}Publishing production Javascript bundles to Expo Application Services...${NC}"
eas update --branch production --message "Production Launch: Hardened Core Security Architecture v1.0.0"

# 🎉 DEPLOYMENT SEQUENCE SUCCESS VERIFICATION
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🏁 PRODUCTION LAUNCH PIPELINE EXECUTED SUCCESSFULLY${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "• Firestore Rules:     ${GREEN}ACTIVE${NC}"
echo -e "• Firestore Indexes:   ${GREEN}ACTIVE${NC}"
echo -e "• Serverless Webhooks: ${GREEN}PROVISIONED${NC}"
echo -e "• Mobile App Bundle:   ${GREEN}DISTRIBUTED TO EAS PRODUCTION BRANCH${NC}"
echo -e "================================================================\n"
