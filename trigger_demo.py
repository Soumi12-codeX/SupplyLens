import requests
import json
import time

def trigger_demo():
    print("--- 🚛 SupplyLens Dynamic Rerouting Demo Trigger ---")
    
    # Step 1: Simulate the "News AI" detecting a problem
    article = {
        "articleText": "Urgent: Major dock strike reported at Hamburg port. All transport nodes expected to be blocked for 48 hours.",
        "source": "Global Logistics News"
    }
    
    print("\n[1] Simulating AI News analysis...")
    try:
        # Assuming the AI service is running on port 5000
        resp = requests.post("http://localhost:5000/simulate-news", json=article)
        if resp.status_code == 200:
            print(f"Success! Python AI Response: {resp.json()['status']}")
            print(f"AI Detection Result: {resp.json()['analysis']['messsage']}")
        else:
            print(f"Error: Python service returned {resp.status_code}")
            return
    except Exception as e:
        print(f"Failed to reach Python AI service: {e}")
        print("Make sure you run: python python_ai/ai_service.py")
        return

    print("\n--- Flow check ---")
    print("1. Python AI Service is analyzing the 'News'...")
    print("2. It will POST a 'node blockage' alert to the Spring Boot backend.")
    print("3. Spring Boot will search the DB for shipments passing through 'HAMBURG'.")
    print("4. Spring Boot will call Python back to 'optimize' the route.")
    print("5. Spring Boot will broadcast the new Reroute options via WebSocket to the Admin.")
    print("\nCheck your Admin Dashboard Live Map now!")

if __name__ == "__main__":
    trigger_demo()
