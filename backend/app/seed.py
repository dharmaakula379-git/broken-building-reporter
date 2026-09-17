from datetime import datetime, timedelta
from .db import Base, engine, SessionLocal
from .models import Building, Report

def seed():
    Base.metadata.create_all(bind=engine)
    db=SessionLocal()
    if db.query(Building).count():
        db.close(); return
    buildings=[
        ("B-1048","MG Road, Vijayawada",16.5062,80.6480,"High","Increasing"),
        ("B-1022","Gunadala, Vijayawada",16.5248,80.6493,"Medium","Stable"),
        ("B-0987","Benz Circle, Vijayawada",16.4970,80.6570,"Low","Decreasing"),
        ("B-0955","Eluru Road, Vijayawada",16.5180,80.6350,"High","Increasing"),
        ("B-0911","Labbipet, Vijayawada",16.5002,80.6425,"Medium","Stable"),
        ("B-0876","Patamata, Vijayawada",16.4955,80.6680,"Low","Stable"),
        ("B-0832","Mogalrajpuram, Vijayawada",16.5188,80.6510,"Medium","Increasing"),
        ("B-0774","Governorpet, Vijayawada",16.5170,80.6200,"Low","Stable"),
    ]
    bs=[]
    for x in buildings:
        b=Building(building_code=x[0],address=x[1],latitude=x[2],longitude=x[3],risk=x[4],trend=x[5])
        db.add(b); bs.append(b)
    db.commit()
    reports=[
        ("R-2026-1048",0,"Wall Crack","Large crack observed on external wall.","High",91,91,"Under Inspection"),
        ("R-2026-1022",1,"Water Leakage","Persistent dampness near the stairwell.","Medium",86,66,"Repair Pending"),
        ("R-2026-0987",2,"Damaged Plaster","Loose plaster on the exterior facade.","Low",88,39,"Resolved"),
        ("R-2026-0955",3,"Exposed Wiring","Exposed electrical wiring visible near entrance.","High",94,91,"Reported"),
        ("R-2026-0940",4,"Damaged Balcony","Concrete edge deterioration on balcony.","High",79,89,"Assigned"),
        ("R-2026-0914",5,"Broken Windows","Multiple broken exterior windows.","Low",93,39,"Resolved"),
        ("R-2026-0881",6,"Structural Crack","Diagonal visible crack near window.","High",72,89,"Inspection Required"),
        ("R-2026-0842",7,"Damaged Plaster","Surface plaster damage.","Low",90,39,"Resolved"),
    ]
    for code,bi,dt,desc,sev,conf,score,status in reports:
        b=bs[bi]
        db.add(Report(code=code,building_id=b.id,damage_type=dt,description=desc,latitude=b.latitude,longitude=b.longitude,address=b.address,severity=sev,confidence=conf,priority_score=score,status=status,created_at=datetime.utcnow()-timedelta(days=bi+1)))
    db.commit();db.close()

if __name__=="__main__": seed()
