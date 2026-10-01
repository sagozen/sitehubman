# 🧯 BioCloud Disaster Recovery & Database Restoration Guide

This document establishes the official operational workflow for restoring the database state in the event of severe application-level data corruption, accidental drop cycles, or infrastructure emergencies.

## 📊 Step 1: Audit Active Available Snapshots
To list all cryptographically secure, point-in-time backups managed within our Google Cloud tenant, run:
```bash
gcloud alpha firestore backups list --location=asia-southeast1
```
*Note: Locate the exact target `BACKUP_ID` matching the precise historical time token prior to the execution anomaly.*

## 🔄 Step 2: Execute Target Database Restore Sequence
Firestore scheduled backups cannot be written directly into an active, running database instance to prevent structural schema pollution. The engine recovers snapshots into a fresh, isolated destination database entity. Run the official restoration loop via the Google Cloud CLI pipeline:
```bash
gcloud alpha firestore databases restore \
  --source-backup=projects/YOUR_PROJECT_ID/locations/asia-southeast1/backups/TARGET_BACKUP_ID \
  --destination-database=biocloud-restored-prod
```

## 🔌 Step 3: Switch Core Production Workspaces
Once the structural indexing and collection configurations compile completely in the background:
1. Verify the integrity data schemas within the `biocloud-restored-prod` console instance.
2. Update the environment pointer definitions inside our target Serverless functions context file to target the new destination database identifier.
3. Run `firebase deploy --only functions` to point your API bridges directly to the verified backup data collection.
