// Mock truck fleet data with Indian city routes
// Used for standalone frontend development

const CITIES = {
  mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai' },
  delhi: { lat: 28.6139, lng: 77.209, name: 'Delhi' },
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  hyderabad: { lat: 17.385, lng: 78.4867, name: 'Hyderabad' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
};

export const WAREHOUSES = [
  { id: 'wh-001', name: 'Mumbai Central Warehouse', city: 'Mumbai', address: 'Plot 14, MIDC Andheri East, Mumbai 400093' },
  { id: 'wh-002', name: 'Delhi NCR Hub', city: 'Delhi', address: 'Sector 63, Noida-Greater Noida Expressway, Noida 201301' },
  { id: 'wh-003', name: 'Bangalore Tech Park Depot', city: 'Bangalore', address: 'Whitefield Main Road, ITPL Area, Bangalore 560066' },
  { id: 'wh-004', name: 'Chennai Port Warehouse', city: 'Chennai', address: 'Harbour Estate Road, Royapuram, Chennai 600013' },
  { id: 'wh-005', name: 'Kolkata Metro Depot', city: 'Kolkata', address: 'Salt Lake Sector V, Bidhannagar, Kolkata 700091' },
  { id: 'wh-006', name: 'Hyderabad Logistics Center', city: 'Hyderabad', address: 'Shamshabad Industrial Area, Hyderabad 500409' },
];

export const DELIVERY_LOCATIONS = [
  { id: 'dl-001', name: 'Pune Distribution Center', city: 'Pune', address: 'Hinjewadi Phase 3, Pune 411057' },
  { id: 'dl-002', name: 'Jaipur Commercial Hub', city: 'Jaipur', address: 'Sitapura Industrial Area, Jaipur 302022' },
  { id: 'dl-003', name: 'Ahmedabad Retail Point', city: 'Ahmedabad', address: 'SG Highway, Bodakdev, Ahmedabad 380054' },
  { id: 'dl-004', name: 'Lucknow Fulfillment Center', city: 'Lucknow', address: 'Chinhat Industrial Area, Lucknow 226019' },
  { id: 'dl-005', name: 'Kochi Port Terminal', city: 'Kochi', address: 'Willingdon Island, Kochi 682003' },
  { id: 'dl-006', name: 'Chandigarh Distribution Hub', city: 'Chandigarh', address: 'Industrial Area Phase I, Chandigarh 160002' },
];

// Generate route waypoints between two cities (simple interpolation)
function generateRoute(from, to, numPoints = 20) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Add slight curve for realism
    const curve = Math.sin(t * Math.PI) * 0.5;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t + curve * (Math.random() - 0.5),
      lng: from.lng + (to.lng - from.lng) * t + curve * (Math.random() - 0.5),
    });
  }
  return points;
}

const TRUCK_ROUTES = [
  { from: 'mumbai', to: 'delhi', cargo: 'Electronics' },
  { from: 'chennai', to: 'bangalore', cargo: 'Textiles' },
  { from: 'kolkata', to: 'hyderabad', cargo: 'Pharmaceuticals' },
  { from: 'pune', to: 'jaipur', cargo: 'Automotive Parts' },
  { from: 'ahmedabad', to: 'lucknow', cargo: 'Food & Beverages' },
  { from: 'delhi', to: 'chennai', cargo: 'Machinery' },
];

const DRIVER_NAMES = [
  'Rajesh Kumar', 'Amit Sharma', 'Suresh Patel',
  'Vikram Singh', 'Deepak Verma', 'Arun Yadav',
];

const TRUCK_IDS = ['TRK-001', 'TRK-002', 'TRK-003', 'TRK-004', 'TRK-005', 'TRK-006'];

// Generate the fleet
export const mockFleet = TRUCK_ROUTES.map((route, i) => {
  const from = CITIES[route.from];
  const to = CITIES[route.to];
  const routePoints = generateRoute(from, to);
  const progress = Math.random() * 0.7 + 0.1; // 10-80% along route

  return {
    id: TRUCK_IDS[i],
    driver: DRIVER_NAMES[i],
    phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
    origin: from,
    originName: from.name,
    destination: to,
    destinationName: to.name,
    cargo: route.cargo,
    route: routePoints,
    progress: progress,
    currentPosition: {
      lat: routePoints[Math.floor(progress * routePoints.length)].lat,
      lng: routePoints[Math.floor(progress * routePoints.length)].lng,
    },
    speed: Math.floor(40 + Math.random() * 40), // 40-80 km/h
    status: Math.random() > 0.2 ? 'on-route' : 'delayed',
    eta: `${Math.floor(2 + Math.random() * 12)}h ${Math.floor(Math.random() * 60)}m`,
    distanceRemaining: `${Math.floor(50 + Math.random() * 800)} km`,
    departedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
  };
});

// AI alert scenarios
const ALERT_TYPES = [
  {
    type: 'heavy_rainfall',
    icon: '🌧️',
    severity: 'high',
    title: 'Heavy Rainfall Alert',
    description: 'Heavy rainfall reported causing waterlogging and reduced visibility.',
  },
  {
    type: 'road_block',
    icon: '🚧',
    severity: 'critical',
    title: 'Road Blockage Detected',
    description: 'Road blocked due to landslide. Vehicles cannot pass through.',
  },
  {
    type: 'accident',
    icon: '⚠️',
    severity: 'high',
    title: 'Accident on Route',
    description: 'Multi-vehicle accident reported causing major traffic congestion.',
  },
  {
    type: 'construction',
    icon: '🏗️',
    severity: 'medium',
    title: 'Road Under Construction',
    description: 'Ongoing road construction causing single-lane traffic.',
  },
  {
    type: 'flood',
    icon: '🌊',
    severity: 'critical',
    title: 'Flood Warning',
    description: 'Flash flood warning issued. Roads may become impassable.',
  },
];

export function generateMockAlert(truckId) {
  const truck = mockFleet.find((t) => t.id === truckId) || mockFleet[0];
  const alertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];

  const timeSaved = Math.floor(15 + Math.random() * 90);
  const timeDelay = Math.floor(30 + Math.random() * 120);

  return {
    id: `alert-${Date.now()}`,
    truckId: truck.id,
    driverName: truck.driver,
    ...alertType,
    affectedArea: `Near ${truck.originName}-${truck.destinationName} Highway`,
    suggestedRoute: {
      description: `Alternate route via ${Object.values(CITIES)[Math.floor(Math.random() * Object.values(CITIES).length)].name}`,
      timeSaved: `${timeSaved} min`,
      additionalDistance: `${Math.floor(10 + Math.random() * 50)} km`,
    },
    originalETA: truck.eta,
    newETA: `${parseInt(truck.eta) + Math.floor(timeDelay / 60)}h ${timeDelay % 60}m`,
    timestamp: new Date().toISOString(),
  };
}

// Map alert severity → road condition type
const SEVERITY_TO_CONDITION = {
  critical: 'blocked',
  high: 'congested',
  medium: 'semi_congested',
};

/**
 * Generates a road condition segment from the truck's current position ahead on its route.
 * Condition type driven by alert severity.
 */
export function generateRoadCondition(alert, fleet) {
  const truck = fleet.find((t) => t.id === alert.truckId) || fleet[0];
  if (!truck) return null;

  const condition = SEVERITY_TO_CONDITION[alert.severity] || 'congested';

  // Pick a slice of 4-6 route points starting just ahead of the truck
  const startIdx = Math.min(
    Math.floor(truck.progress * truck.route.length) + 1,
    truck.route.length - 6
  );
  const segLen = 4 + Math.floor(Math.random() * 3); // 4-6 points
  const points = truck.route.slice(startIdx, startIdx + segLen);

  if (points.length < 2) return null;

  return {
    id: `cond-${alert.id}`,
    alertId: alert.id,
    truckId: truck.id,
    condition,
    points,
    label: alert.title,
  };
}

// Mock simulation — moves trucks along their routes
export class MockSimulator {
  constructor(onUpdate, onAlert, onCondition) {
    this.onUpdate = onUpdate;
    this.onAlert = onAlert;
    this.onCondition = onCondition || (() => {});
    this.fleet = JSON.parse(JSON.stringify(mockFleet));
    this.intervalId = null;
    this.alertIntervalId = null;
  }

  start() {
    // Update truck positions every 2 seconds
    this.intervalId = setInterval(() => {
      this.fleet = this.fleet.map((truck) => {
        const newProgress = Math.min(truck.progress + 0.005 + Math.random() * 0.003, 0.99);
        const pointIndex = Math.floor(newProgress * (truck.route.length - 1));
        const point = truck.route[pointIndex];

        return {
          ...truck,
          progress: newProgress,
          currentPosition: { lat: point.lat, lng: point.lng },
          speed: Math.floor(35 + Math.random() * 45),
          distanceRemaining: `${Math.floor((1 - newProgress) * 1000)} km`,
        };
      });

      this.onUpdate(this.fleet);
    }, 2000);

    // Generate random AI alerts every 15-30 seconds
    this.alertIntervalId = setInterval(() => {
      const randomTruck = this.fleet[Math.floor(Math.random() * this.fleet.length)];
      const alert = generateMockAlert(randomTruck.id);
      const condition = generateRoadCondition(alert, this.fleet);

      this.onAlert(alert);
      if (condition) this.onCondition(condition);
    }, 15000 + Math.random() * 15000);
  }

  stop() {
    clearInterval(this.intervalId);
    clearInterval(this.alertIntervalId);
  }
}

export default { mockFleet, generateMockAlert, generateRoadCondition, MockSimulator, WAREHOUSES, DELIVERY_LOCATIONS };
