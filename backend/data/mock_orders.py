"""
Mock MSME Supply Orders Dataset
Contains purely factual manufacturing and procurement order details.
No hardcoded risk levels or static alerts — risk is computed dynamically by the multi-agent orchestrator.
"""
from typing import List, Dict, Any

MOCK_ORDERS: List[Dict[str, Any]] = [
    {
        "id": "MSME-ORD-101",
        "supplier_name": "Kaveri Precision Forgings Pvt Ltd",
        "item": "CNC Machined High-Tensile Crankshafts (Grade 42CrMo4)",
        "expected_delivery_date": "2026-09-05",
        "supplier_location": "Chennai, Tamil Nadu",
        "category": "Automotive & Heavy Engineering",
        "order_value_inr": 2850000,
        "dispatch_port": "Chennai Port (Ennore)",
    },
    {
        "id": "MSME-ORD-102",
        "supplier_name": "Vibrant Synthetic Silk Mills",
        "item": "Polyester Filament Yarn & Mercerized Viscose Fabric (10,000 m)",
        "expected_delivery_date": "2026-09-12",
        "supplier_location": "Surat, Gujarat",
        "category": "Technical Textiles",
        "order_value_inr": 1420000,
        "dispatch_port": "Hazira Port / JNPT",
    },
    {
        "id": "MSME-ORD-103",
        "supplier_name": "Guru Nanak Auto Components Ltd",
        "item": "Hardened Hexagonal Bolts, Fasteners & Threaded Studs (M12-M24)",
        "expected_delivery_date": "2026-09-02",
        "supplier_location": "Ludhiana, Punjab",
        "category": "Industrial Fasteners & Hardware",
        "order_value_inr": 680000,
        "dispatch_port": "ICD Dhandari Kalan (Dry Port)",
    },
    {
        "id": "MSME-ORD-104",
        "supplier_name": "Sahyadri Hydraulics & Fluid Power",
        "item": "Dual-Acting Hydraulic Cylinders & Pneumatic Control Valves",
        "expected_delivery_date": "2026-09-08",
        "supplier_location": "Pune, Maharashtra",
        "category": "Fluid Power & Construction Equipment",
        "order_value_inr": 3400000,
        "dispatch_port": "JNPT / Nhava Sheva",
    },
    {
        "id": "MSME-ORD-105",
        "supplier_name": "Kongu Electro-Motors & Pumps",
        "item": "Three-Phase Submersible Induction Motor Stators (5 HP, IE3)",
        "expected_delivery_date": "2026-09-18",
        "supplier_location": "Coimbatore, Tamil Nadu",
        "category": "Electrical Machinery & Agro-Pumps",
        "order_value_inr": 920000,
        "dispatch_port": "Tuticorin (V.O. Chidambaranar Port)",
    },
    {
        "id": "MSME-ORD-106",
        "supplier_name": "Saurashtra Casting & Dies LLP",
        "item": "Spheroidal Graphite (SG) Iron Precision Pump Housings",
        "expected_delivery_date": "2026-09-15",
        "supplier_location": "Rajkot, Gujarat",
        "category": "Foundry & Capital Goods",
        "order_value_inr": 1750000,
        "dispatch_port": "Kandla / Mundra Port",
    }
]


def get_all_orders() -> List[Dict[str, Any]]:
    """Returns all factual Indian MSME supply orders."""
    return MOCK_ORDERS


def get_order_by_id(order_id: str) -> Dict[str, Any] | None:
    """Finds an MSME order by its unique ID."""
    for order in MOCK_ORDERS:
        if order["id"] == order_id:
            return order
    return None
