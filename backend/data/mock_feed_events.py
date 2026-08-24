"""
SentinelChain Live Risk Feed Scenario Pool
Realistic operational disruption events for live streaming simulation.
"""
from typing import List, Dict, Any
from datetime import datetime, timezone

RISK_FEED_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "FEED-EVT-01",
        "title": "IMD Deep Depression & Cyclone Warning near Kochi & Malabar Coast",
        "category": "Weather & Climate",
        "severity": "high",
        "affected_locations": ["Coimbatore", "Kochi", "Tuticorin", "Tamil Nadu", "Kerala"],
        "affected_sectors": ["Electrical Machinery", "Agro-Pumps", "General Manufacturing"],
        "content_snippet": (
            "India Meteorological Department (IMD) issues Orange Alert for severe squalls (75-90 km/h) "
            "and torrential rainfall along the Malabar Coast and Coimbatore-Palakkad transit corridor. "
            "Tuticorin and Kochi container freight terminals have suspended vessel berthing for 48 hours."
        ),
        "target_orders": ["MSME-ORD-105"],
        "toast_message": "🚨 WEATHER ALERT: Cyclone alert near Kochi/Coimbatore corridor. Tuticorin port ops halted.",
    },
    {
        "id": "FEED-EVT-02",
        "title": "CBIC Emergency 22% Anti-Dumping Duty on Synthetic Viscose Filaments",
        "category": "Tariff & Regulatory Policy",
        "severity": "high",
        "affected_locations": ["Surat", "Gujarat", "Hazira"],
        "affected_sectors": ["Technical Textiles", "Apparel & Synthetic Fabrics"],
        "content_snippet": (
            "Ministry of Finance (CBIC) Notification No. 18/2026-Customs levies immediate 22% provisional "
            "anti-dumping duty on man-made synthetic yarns and filaments entering Hazira Port. "
            "All active textile consignments in Surat must submit revised IGST clearance bonds."
        ),
        "target_orders": ["MSME-ORD-102"],
        "toast_message": "⚠️ TARIFF UPDATE: CBIC levies 22% anti-dumping duty on synthetic yarn at Surat/Hazira.",
    },
    {
        "id": "FEED-EVT-03",
        "title": "JNPT Nhava Sheva Total Drayage Truckers Flash Strike",
        "category": "Logistics & Transport",
        "severity": "high",
        "affected_locations": ["Pune", "Mumbai", "Maharashtra", "JNPT"],
        "affected_sectors": ["Automotive", "Fluid Power & Hydraulics", "Heavy Machinery"],
        "content_snippet": (
            "Nhava Sheva Container Drayage Association commences indefinite flash strike over diesel surcharge disputes. "
            "Zero container movements reported on the Pune-Mumbai Expressway corridor with 3,500+ TEUs stranded."
        ),
        "target_orders": ["MSME-ORD-104", "MSME-ORD-102"],
        "toast_message": "🛑 PORT STRIKE: Total truckers strike at JNPT Nhava Sheva. Pune-Mumbai dispatch stranded.",
    },
    {
        "id": "FEED-EVT-04",
        "title": "Ludhiana Billet & Steel Wire Rod Supply Quota Curtailment",
        "category": "Supplier & Manufacturing Health",
        "severity": "medium",
        "affected_locations": ["Ludhiana", "Punjab", "Dhandari Kalan"],
        "affected_sectors": ["Industrial Fasteners", "Hardware & Engineering"],
        "content_snippet": (
            "Northern Steel Rolling Mills Association reports a 35% cut in billet allocations due to power rationing. "
            "Industrial fastener manufacturers in Ludhiana project a 5 to 8-day delay in high-tensile bolt shipments."
        ),
        "target_orders": ["MSME-ORD-103"],
        "toast_message": "⏳ SUPPLIER DELAY: Steel wire rationing in Ludhiana causing 5-8 day fastener dispatch delay.",
    },
    {
        "id": "FEED-EVT-05",
        "title": "Chennai Port ICEGATE EDI Customs Server Failure & Cargo Backlog",
        "category": "Customs & Trade Compliance",
        "severity": "high",
        "affected_locations": ["Chennai", "Ennore", "Tamil Nadu"],
        "affected_sectors": ["Automotive & Heavy Engineering", "Precision Forgings"],
        "content_snippet": (
            "Customs ICEGATE Electronic Data Interchange server at Chennai Port suffers critical database corruption. "
            "Manual Bill of Entry clearances have created a 72-hour congestion backlog across Ennore and Chennai Harbor."
        ),
        "target_orders": ["MSME-ORD-101"],
        "toast_message": "⚡ CUSTOMS BACKLOG: ICEGATE server crash at Chennai Port creating 72-hour clearance stall.",
    },
    {
        "id": "FEED-EVT-06",
        "title": "National Highway Freight Diesel Surcharge Surge Across Western Corridors",
        "category": "Logistics & Transport",
        "severity": "medium",
        "affected_locations": ["Rajkot", "Surat", "Kandla", "Mundra", "Gujarat"],
        "affected_sectors": ["Foundry & Capital Goods", "Textiles", "General Cargo"],
        "content_snippet": (
            "All India Motor Transport Congress implements a mandatory +14% emergency fuel surcharge on Western "
            "expressway corridors. Heavy casting shipments from Rajkot and Mundra Port face 48-hour transit rescheduling."
        ),
        "target_orders": ["MSME-ORD-106", "MSME-ORD-102"],
        "toast_message": "🚚 LOGISTICS DISRUPTION: +14% fuel surcharge & carrier delays across Rajkot/Mundra corridors.",
    }
]


def get_all_scenarios() -> List[Dict[str, Any]]:
    """Returns all risk feed scenarios."""
    return RISK_FEED_SCENARIOS
