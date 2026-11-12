import math
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import Report

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in meters."""
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def find_duplicates(
    db: Session,
    latitude: float,
    longitude: float,
    damage_type: str,
    threshold_meters: float = 120.0,
    exclude_report_id: Optional[int] = None
) -> List[dict]:
    """Find nearby reports with similar damage types."""
    query = db.query(Report)
    if exclude_report_id:
        query = query.filter(Report.id != exclude_report_id)
        
    all_reports = query.all()
    duplicates = []
    
    for r in all_reports:
        # Fast bounding box pre-filter (~1km)
        if abs(r.latitude - latitude) > 0.01 or abs(r.longitude - longitude) > 0.01:
            continue
            
        distance = haversine_distance_meters(latitude, longitude, r.latitude, r.longitude)
        if distance <= threshold_meters:
            # Check damage category similarity
            is_same_category = (
                r.damage_type.lower() == damage_type.lower() or
                ("crack" in r.damage_type.lower() and "crack" in damage_type.lower()) or
                ("wire" in r.damage_type.lower() and "wire" in damage_type.lower()) or
                ("leak" in r.damage_type.lower() and "leak" in damage_type.lower())
            )
            
            duplicates.append({
                "id": r.id,
                "code": r.code,
                "damage_type": r.damage_type,
                "address": r.address,
                "status": r.status,
                "severity": r.severity,
                "distance_meters": round(distance, 1),
                "is_same_category": is_same_category,
                "created_at": r.created_at.isoformat()
            })
            
    # Sort closest first
    duplicates.sort(key=lambda x: x["distance_meters"])
    return duplicates
