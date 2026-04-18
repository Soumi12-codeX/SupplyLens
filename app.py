import os
import requests
import networkx as nx
import google.generativeai as genai
from flask import Flask, request, jsonify
from newsapi import NewsApiClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# --- CONFIGURATION (Replace with your actual keys) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# Backend Endpoints
JAVA_ALERT_URL = "http://localhost:8080/api/alerts/from-python"
JAVA_MAP_URL = "http://localhost:8080/api/route/all-segments"

# Initialize AI Clients
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')
news_client = NewsApiClient(api_key=NEWS_API_KEY)

@app.route('/test', methods=['GET'])
def test_connection():
    return "Python is ALIVE!"

# --- 1. UTILITY: DYNAMIC RISK SCORING (GEMINI) ---
def get_ai_risk_score(event_desc, city):
    """Reasoning: Converts raw text into a 0-100 score."""
    prompt = (f"Analyze this logistics risk in {city}: '{event_desc}'. "
              "On a scale of 0 to 100, how much does this delay a truck? "
              "Return ONLY the numerical score.")
    try:
        response = gemini_model.generate_content(prompt)
        # Fix: Extract only digits to prevent 'hallucination' text errors
        score_text = "".join(filter(str.isdigit, response.text))
        return int(score_text) if score_text else 50
    except:
        return 50  # Fallback score

def get_severity_label(score):
    if score >= 80: return "CRITICAL"
    if score >= 50: return "HIGH"
    if score >= 30: return "MEDIUM"
    return "LOW"

# --- 2. SENSOR: REAL-TIME SCANNING ---
@app.route('/ai/scan-nodes', methods=['POST'])
def scan_nodes():
    data = request.json
    nodes = data.get('nodes', [])
    shipment_id = data.get('shipmentId')
    admin_id = data.get('adminId') # Receive adminId from Java

    for node in nodes:
        city = node.strip().lower()
        
        # A. News Scan
        news = news_client.get_everything(q=f"{city} strike OR protest", language='en')
        if news['totalResults'] > 0:
            desc = news['articles'][0]['title']
            # Pass admin_id to the report function
            report_to_java(city, "STRIKE", desc, admin_id)

        # B. Weather Scan
        # ... (Same weather logic as before) ...
        # report_to_java(city, "WEATHER", f"Hazardous weather: {cond}", admin_id)

    return jsonify({"status": "Scan Complete", "adminHandled": admin_id})

def report_to_java(city, alert_type, desc, admin_id):
    score = get_ai_risk_score(desc, city)
    payload = {
        "nodeName": city,
        "type": alert_type,
        "severity": get_severity_label(score),
        "description": f"(AI Score: {score}) {desc}",
        "adminId": admin_id # Send it back to Java
    }
    requests.post(JAVA_ALERT_URL, json=payload)

# --- 3. BRAIN: REROUTE OPTIMIZATION ---
@app.route('/ai/optimize-route', methods=['POST'])
def optimize():
    data = request.json
    src = data['source'].lower()
    dest = data['destination'].lower()
    blocked = data['blockedNode'].lower()

    # ANOMALY FIX: Dynamic map sync
    G = nx.Graph()
    try:
        resp = requests.get(JAVA_MAP_URL).json()
        for s in resp:
            u, v, d = s['u'].lower(), s['v'].lower(), float(s['distance'])
            G.add_edge(u, v, weight=d)
    except:
        return jsonify({"error": "Java Map API offline"}), 500

    if blocked in G:
        G.remove_node(blocked)

    try:
        # ANOMALY FIX: Handle NodeNotFound errors
        path = nx.shortest_path(G, source=src, target=dest, weight='weight')
        return jsonify([{
            "label": "AI Optimized Path",
            "path": [p.capitalize() for p in path], # Capitalize for UI
            "tradeoff": "Path recalculated via Gemini risk insights."
        }])
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return jsonify({"error": "No valid alternate path found"}), 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)