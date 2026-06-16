import requests
import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Configuration
API_URL = "https://api.tickertape.in/mmi/now"
DATA_DIR = "data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
README_FILE = "README.md"

# Headers and Cookies from the user request
HEADERS = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "accept-version": "8.14.0",
    "dnt": "1",
    "origin": "https://www.tickertape.in",
    "priority": "u=1, i",
    "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
}

COOKIES = {
    "AMP_d9d4ec74fa": "JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIwZGExNDExZS02MTk1LTQ5OTAtOGIzYy03MGEwNjNmYmMwMWElMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzcxMjU0NjgxNTEyJTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTc3MTI1NTY0MTI1NiUyQyUyMmxhc3RFdmVudElkJTIyJTNBNDI3JTdE"
}

# Initialize Firebase Admin
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account"""
    try:
        # Try to get the service account key from environment variable
        service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
        if service_account_json:
            # Parse the JSON string from environment variable
            service_account_info = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_info)
        else:
            # Fallback to local file (for local development)
            cred_path = os.path.join(os.environ.get('USERPROFILE', ''), 'firebase-keys', 'tickertape-mmi-mmi-scraper-key.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                print("ERROR: Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or place key in ~/firebase-keys/")
                return False
        
        firebase_admin.initialize_app(cred)
        print("Firebase Admin initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return False

def fetch_mmi_data():
    """Fetches the current MMI data from Ticker Tape API."""
    try:
        response = requests.get(API_URL, headers=HEADERS, cookies=COOKIES, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("success"):
            return data["data"]
        else:
            print(f"API returned success=False: {data}")
            return None
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

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

def get_zone_color(mood):
    """Returns the color for each mood zone for dashboard use"""
    colors = {
        "Extreme Fear": "#10B981",  // Emerald
        "Fear": "#84CC16",     // Lime
        "Greed": "#F59E0B",    // Amber
        "Extreme Greed": "#F43F5E"  // Rose
    }
    return colors.get(mood, "#6B7280")  // Default to gray

def write_to_firestore(data):
    """Write MMI data to Firestore"""
    try:
        db = firestore.client()
        
        # Prepare document data
        timestamp_str = data.get("date")
        value = data.get("currentValue")
        
        doc_data = {
            "timestamp": firestore.SERVER_TIMESTAMP,  // Server timestamp for when written
            "value": value,
            "mood": get_mood_label(value),
            "nifty": data.get("nifty"),
            "fma": data.get("fma"),
            "sma": data.get("sma"),
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        
        # Use the API timestamp as document ID for idempotency
        doc_id = timestamp_str.replace(":", "-").replace(".", "-")  // Make Firestore-safe ID
        
        # Write to mmi_readings collection
        db.collection("mmi_readings").document(doc_id).set(doc_data)
        
        # Also update the latest reading in mmi_meta collection for fast dashboard access
        db.collection("mmi_meta").document("latest").set(doc_data, merge=True)
        
        print(f"Successfully wrote MMI data to Firestore: {value} ({get_mood_label(value)})")
        return True
    except Exception as e:
        print(f"Error writing to Firestore: {e}")
        return False

def update_history_file(data):
    """Keep a local copy of history.json for migration/backup purposes (optional)"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            print("Error reading history.json, starting with empty list.")

    # Extract relevant data
    timestamp = data.get("date")
    value = data.get("currentValue")

    new_entry = {
        "timestamp": timestamp,
        "value": value,
        "mood": get_mood_label(value),
        "raw_data": {  // Optional: store some other fields if useful
            "nifty": data.get("nifty"),
            "fma": data.get("fma"),
            "sma": data.get("sma")
        }
    }

    # Avoid duplicate data points based on timestamp from source
    if history and history[-1]["timestamp"] == timestamp:
        print("Data for this timestamp already exists in history.json. Skipping append.")
    else:
        history.append(new_entry)
        with open(HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=4)
        print(f"Appended new data point to history.json: {value} ({new_entry['mood']}) at {timestamp}")

    return history

def update_readme_badge(latest_entry):
    """Updates the README.md with just the latest MMI value and dashboard link (no chart)"""
    if not latest_entry:
        return

    mmi_value = latest_entry['value']
    mood = latest_entry['mood']
    timestamp = latest_entry['timestamp']

    # Convert timestamp to readable format
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        readable_time = dt.strftime("%Y-%m-%d %H:%M UTC")
    except:
        readable_time = timestamp

    # Get color for the mood
    zone_color = get_zone_color(mood)
    
    content = f"""# Ticker Tape MMI Tracker

[![MMI Value](https://img.shields.io/badge/MMI-{mmi_value:.2f}-{zone_color.replace('#', '%23')})](https://tickertape-mmi.vercel.app)

A scraper for the Ticker Tape Market Mood Index (MMI) that stores data in Firebase Firestore.
View the live dashboard: [https://tickertape-mmi.vercel.app](https://tickertape-mmi.vercel.app)

## Latest MMI Value

**{mmi_value:.2f}** - **{mood}**
<small>Last Updated: {readable_time}</small>

## About

This repository contains a scraper that fetches the MMI value hourly and stores it in Firebase Firestore.
The data is visualized in a live dashboard at [https://tickertape-mmi.vercel.app](https://tickertape-mmi.vercel.app).

## Data Access

Historical data is available via Firebase Firestore. For direct JSON access, check the GitHub repository
for migration scripts or contact the maintainer.

### Zones Reference
- **Extreme Fear:** &lt; 25
- **Fear:** 25 - 50
- **Greed:** 50 - 75
- **Extreme Greed:** &gt; 75

## API Endpoint

The dashboard fetches data from Firebase Firestore. No public API endpoint is maintained in this repo
to avoid abuse, but the Firebase project is configured for secure access.
"""

    with open(README_FILE, "w") as f:
        f.write(content)
    print("README.md updated with badge only.")

def main():
    print("Starting MMI Scraper with Firestore integration...")
    
    # Initialize Firebase
    if not initialize_firebase():
        print("Failed to initialize Firebase. Exiting.")
        return
    
    # Fetch data from API
    data = fetch_mmi_data()
    if not data:
        print("Failed to fetch data from API. Exiting.")
        return
    
    # Write to Firestore
    if not write_to_firestore(data):
        print("Failed to write to Firestore. Continuing...")
    
    # Keep local history file (optional, for backup/migration)
    history = update_history_file(data)
    
    # Update README with just the badge (no chart)
    if history:
        update_readme_badge(history[-1])
    else:
        update_readme_badge({"value": data.get("currentValue"), "mood": get_mood_label(data.get("currentValue")), "timestamp": data.get("date")})
    
    print("MMI Scraper completed successfully.")

if __name__ == "__main__":
    main()