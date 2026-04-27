import os
import math
import requests
import networkx as nx
import google.generativeai as genai
from flask import Flask, request, jsonify
from newsapi import NewsApiClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

import logging
logging.basicConfig(filename='ai_debug.log', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s: %(message)s')

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
JAVA_ALERT_URL = "http://localhost:8080/api/alerts/from-python"
JAVA_NODES_URL = "http://localhost:8080/api/route/all-nodes" 

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')
news_client = NewsApiClient(api_key=NEWS_API_KEY)

# In your Flask app.py
@app.route('/ai/scan-nodes', methods=['POST'])  # Check for spelling/slashes
def scan_nodes():
    data = request.json
    nodes = data.get('nodes', [])
    # ... rest of your scanning logic
    return jsonify({"status": "Scan initiated", "nodes": nodes}), 200

def calculate_distance(lat1, lon1, lat2, lon2):
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

def get_coords_nominatim(city):
    try:
        url = f"https://nominatim.openstreetmap.org/search?city={city}&format=json&limit=1"
        headers = {'User-Agent': 'SupplyLens_AI_Bot'}
        resp = requests.get(url, headers=headers).json()
        if resp:
            return float(resp[0]['lat']), float(resp[0]['lon'])
    except:
        return None, None
    return None, None

@app.route('/ai/optimize-route', methods=['POST'])
def optimize():
    data = request.json
    src = data.get('source', '').lower().strip()
    dest = data.get('destination', '').lower().strip()
    blocked = data.get('blockedNode', '').lower().strip()

    G = nx.Graph()
    try:
        nodes_from_db = requests.get(JAVA_NODES_URL).json()
        for node in nodes_from_db:
            name = node['name'].lower().strip()
            # Note: Ensure Java returns 'latitude' and 'longitude' keys
            G.add_node(name, pos=(node['latitude'], node['longitude']))
            
        # USE COORDINATES FROM JAVA IF PROVIDED
        if data.get('sourceLat') and src not in G:
            G.add_node(src, pos=(data['sourceLat'], data['sourceLng']))
        if data.get('destLat') and dest not in G:
            G.add_node(dest, pos=(data['destLat'], data['destLng']))

        # NOMINATIM FALLBACK (only if still missing)
        for city in [src, dest]:
            if city not in G:
                lat, lon = get_coords_nominatim(city)
                if lat:
                    G.add_node(city, pos=(lat, lon))

        # --- CRITICAL: DYNAMIC EDGE BUILDING ---
        node_list = list(G.nodes(data=True))
        for i in range(len(node_list)):
            for j in range(i + 1, len(node_list)):
                u_name, u_data = node_list[i]
                v_name, v_data = node_list[j]
                dist = calculate_distance(u_data['pos'][0], u_data['pos'][1], 
                                          v_data['pos'][0], v_data['pos'][1])
                
                # Increased threshold to 10.0 for better connectivity
                if dist < 10.0: 
                    G.add_edge(u_name, v_name, weight=dist)

    except Exception as e:
        print(f">>> MAP ERROR: {e}")
        return jsonify({"error": str(e)}), 500

    if blocked in G:
        G.remove_node(blocked)
        print(f">>> AI ACTION: Removed {blocked} from potential paths.")

    try:
        logging.info(f"Finding path from {src} to {dest} avoiding {blocked}")
        path = nx.shortest_path(G, source=src, target=dest, weight='weight')
        logging.info(f"Path found: {path}")
        
        # Return DICTIONARY with 'routeOptions' key to match AlertService
        return jsonify({
            "routeOptions": [{
                "label": "AI Dynamic Reroute",
                "path": path, 
                "estimatedHours": int(len(path) * 2.5),
                "riskLevel": "LOW",
                "tradeoff": f"Bypassed {blocked} using the safest dynamic connections."
            }]
        })
        
    except (nx.NetworkXNoPath, nx.NodeNotFound) as e:
        logging.error(f"Path error: {e}")
        return jsonify({"routeOptions": []}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)