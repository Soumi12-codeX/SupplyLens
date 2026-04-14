from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import requests
import json
import time

app = FastAPI()

# Configuration
SPRING_BOOT_URL = "http://localhost:8080/api/alerts/from-python"

class NewsArticle(BaseModel):
    articleText: str
    source: str

class OptimizationRequest(BaseModel):
    alertId: int
    shipmentId: int
    blockedNode: str
    source: str
    destination: str

@app.post("/simulate-news")
def simulate_news(article: NewsArticle, background_tasks: BackgroundTasks):
    """
    Step 2 & 3: Python News AI -> Send Alert to Spring Boot
    """
    # In a real scenario, we'd use Gemini here:
    # prompt = f"Analyze this news: {article.articleText}. Return JSON with nodeId, eventType, riskScore, severity."
    # response = gemini_model.generate_content(prompt)
    
    # Mocked AI Output
    ai_output = {
        "nodeName": "HAMBURG",
        "alertType": "LABOR_STRIKE",
        "severity": 8,
        "messsage": f"AI Detection: strike detected at Hamburg according to {article.source}. High risk for routes passing through.",
    }
    
    # Step 3: Call Spring Boot
    def send_to_spring():
        try:
            print(f"[AI] sending alert to Spring Boot: {ai_output}")
            resp = requests.post(SPRING_BOOT_URL, json=ai_output)
            print(f"[AI] Spring Boot response: {resp.status_code}")
        except Exception as e:
            print(f"[AI] Failed to send alert: {e}")

    background_tasks.add_task(send_to_spring)
    return {"status": "Analysis started", "analysis": ai_output}

@app.post("/ai/optimize-route")
def optimize_route(req: OptimizationRequest):
    """
    Step 6: Python AI -> Route Optimization Engine
    """
    print(f"[AI] Optimizing route for shipment {req.shipmentId} avoiding {req.blockedNode}")
    
    # Simple graph logic for demo (mostly German-focused as per your latest request)
    # HAMBURG -> HANOVER -> FRANKFURT -> MUNICH
    
    route_options = [
        {
            "label": "Safe Route",
            "path": "HAMBURG, ROTTERDAM, FRANKFURT, MUNICH",
            "estimatedHours": 12,
            "riskLevel": "LOW",
            "tradeoff": "Avoids strike zone, adds 3 hours to ETA"
        },
        {
            "label": "Balanced Route",
            "path": "HAMBURG, HANOVER, KOLN, MUNICH",
            "estimatedHours": 9,
            "riskLevel": "MEDIUM",
            "tradeoff": "Minor congestion risk, standard ETA"
        }
    ]
    
    # Returns the options back to Spring Boot (which called this)
    return {"shipmentId": req.shipmentId, "routeOptions": route_options}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
