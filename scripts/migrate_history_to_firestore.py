#!/usr/bin/env python3
"""
Migration script to backfill existing history.json data into Firebase Firestore.
Run this once to populate Firestore with historical data before switching to the new scraper.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

def initialize_firebase():
    """Initialize Firebase Admin SDK with service account from environment variable"""
    try:
        # Get the service account key from environment variable (set in GitHub secrets or local env)
        service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
        if not service_account_json:
            print("ERROR: FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set")
            print("Please set it to the JSON string of your service account key")
            return False
        
        # Parse the JSON string from environment variable
        service_account_info = json.loads(service_account_json)
        cred = credentials.Certificate(service_account_info)
        
        firebase_admin.initialize_app(cred)
        print("Firebase Admin initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return False

def get_mood_label(mmi_value):
    """Returns the mood label based on MMI value."""
    # MMI Zones based on user preference: Emerald→Rose gradient
    # Extreme Fear: < 25 (Emerald/Green)
    # Fear: 25 - 50 (Lime/Green-Yellow)
    # Greed: 50 - 75 (Amber/Yellow-Orange)
    # Extreme Greed: > 75 (Rose/Red-Pink)
    if mmi_value < 25:
        return "Extreme Fear"
    elif mmi_value < 50:
        return "Fear"
    elif mmi_value < 75:
        return "Greed"
    else:
        return "Extreme Greed"

def migrate_history_to_firestore():
    """Migrate existing history.json data to Firestore"""
    try:
        db = firestore.client()
        
        # Load existing history
        history_file = os.path.join("data", "history.json")
        if not os.path.exists(history_file):
            print(f"ERROR: {history_file} not found")
            return False
        
        with open(history_file, "r") as f:
            history = json.load(f)
        
        print(f"Loaded {len(history)} historical records from {history_file}")
        
        # Process each record
        migrated_count = 0
        skipped_count = 0
        
        for entry in history:
            try:
                timestamp_str = entry.get("timestamp")
                value = entry.get("value")
                
                if timestamp_str is None or value is None:
                    print(f"Skipping entry with missing data: {entry}")
                    skipped_count += 1
                    continue
                
                # Prepare document data
                doc_data = {
                    "timestamp": timestamp_str,  // Keep original timestamp as string
                    "value": value,
                    "mood": entry.get("mood", get_mood_label(value)),
                    "nifty": entry.get("raw_data", {}).get("nifty") if entry.get("raw_data") else None,
                    "fma": entry.get("raw_data", {}).get("fma") if entry.get("raw_data") else None,
                    "sma": entry.get("raw_data", {}).get("sma") if entry.get("raw_data") else None,
                    "createdAt": firestore.SERVER_TIMESTAMP  // When we migrated it
                }
                
                # Use a Firestore-safe document ID based on the timestamp
                doc_id = timestamp_str.replace(":", "-").replace(".", "-")
                
                # Write to mmi_readings collection
                db.collection("mmi_readings").document(doc_id).set(doc_data)
                migrated_count += 1
                
                # Progress indicator for large datasets
                if migrated_count % 100 == 0:
                    print(f"Migrated {migrated_count} records...")
                    
            except Exception as e:
                print(f"Error migrating entry {entry}: {e}")
                skipped_count += 1
                continue
        
        # Also set the latest record in mmi_meta for fast dashboard access
        if history:
            latest_entry = history[-1]
            latest_doc_data = {
                "timestamp": latest_entry.get("timestamp"),
                "value": latest_entry.get("value"),
                "mood": latest_entry.get("mood", get_mood_label(latest_entry.get("value"))),
                "nifty": latest_entry.get("raw_data", {}).get("nifty") if latest_entry.get("raw_data") else None,
                "fma": latest_entry.get("raw_data", {}).get("fma") if latest_entry.get("raw_data") else None,
                "sma": latest_entry.get("raw_data", {}).get("sma") if latest_entry.get("raw_data") else None,
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            db.collection("mmi_meta").document("latest").set(latest_doc_data, merge=True)
            print("Updated latest record in mmi_meta collection")
        
        print(f"\nMigration complete!")
        print(f"Successfully migrated: {migrated_count} records")
        print(f"Skipped: {skipped_count} records")
        print(f"Total processed: {len(history)} records")
        
        return migrated_count > 0
        
    except Exception as e:
        print(f"Error during migration: {e}")
        return False

def main():
    print("Starting migration of history.json to Firebase Firestore...")
    print("Make sure FIREBASE_SERVICE_ACCOUNT_JSON environment variable is set")
    print("=" * 60)
    
    # Initialize Firebase
    if not initialize_firebase():
        print("Failed to initialize Firebase. Exiting.")
        return
    
    # Run migration
    success = migrate_history_to_firestore()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("You can now update your GitHub Actions workflow to use the new scraper.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    exit(main())