"""
Mock Supply Chain Disruption Documents & Intelligence Notices
5 realistic operational intelligence documents across policy, logistics, weather, and supplier events.
"""
from typing import List, Dict, Any

MOCK_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "id": "DOC-GST-2026-04",
        "title": "Central Board of Indirect Taxes & Customs (CBIC) Notification: GST Rate Revision on Man-Made Fibers",
        "category": "GST & Tariff Policy",
        "date": "2026-08-20",
        "summary": "Notification regarding revised 18% GST tariff on MMF and synthetic filament yarns under HS Code 5402.",
        "content": (
            "MINISTRY OF FINANCE (DEPARTMENT OF REVENUE) - CBIC NOTIFICATION NO. 24/2026-CENTRAL TAX (RATE). "
            "In exercise of powers conferred under Section 9(1) of the CGST Act, the Central Government hereby notifies "
            "an inverted duty correction on man-made fibers (MMF), polyester filament yarns, and viscose fabrics exported "
            "or dispatched from textile clusters including Surat, Ahmedabad, and Bhiwandi. Consignments undergoing transit "
            "must present updated Electronic Way Bills (E-Way Bills) and revised tax invoices matching the unified 18% GST schedule. "
            "Shipments with mismatched classification under legacy HSN codes will face audit holds and mandatory 48-hour customs clearance delays."
        ),
        "affected_locations": ["Surat", "Ahmedabad", "Bhiwandi", "Gujarat"],
        "affected_sectors": ["Textiles", "Synthetic Fibers", "Apparel Manufacturing"],
        "severity": "medium",
    },
    {
        "id": "DOC-LOG-2026-11",
        "title": "JNPT & Nhava Sheva Port Container Drayage Association Flash Strike Notice",
        "category": "Port Logistics & Labor",
        "date": "2026-08-22",
        "summary": "Indefinite strike by drayage truck operators union at JNPT/Nhava Sheva container terminals.",
        "content": (
            "MUMBAI PORT & JNPT DRAYAGE OPERATORS FEDERATION - URGENT TRADE CIRCULAR. "
            "Notice is hereby served to all shipping lines, freight forwarders, and logistics operators that unionized drayage "
            "drivers and container trailer operators at Jawaharlal Nehru Port (JNPT / Nhava Sheva) have initiated an indefinite flash strike "
            "over diesel price surcharges and empty container turnaround wait times. Effective immediately, inter-terminal road haulage "
            "between Container Freight Stations (CFS) and port terminal gates (NSICT, BMCT, APMT) is halted. Dwell times for export and import "
            "boxes originating from industrial belts in Pune, Chakan, Talegaon, and Aurangabad are expected to exceed 7 to 10 days. "
            "Shippers are strongly advised to divert high-priority consignments to Hazira or Mundra."
        ),
        "affected_locations": ["JNPT", "Nhava Sheva", "Mumbai", "Pune", "Maharashtra"],
        "affected_sectors": ["Heavy Machinery", "Hydraulics", "Automotive Assemblies", "Consumer Durables"],
        "severity": "high",
    },
    {
        "id": "DOC-WX-2026-08",
        "title": "India Meteorological Department (IMD) Red Alert: Severe Cyclonic Storm in Bay of Bengal",
        "category": "Severe Weather & Climate",
        "date": "2026-08-23",
        "summary": "Severe Cyclone alert affecting Coromandel Coast and maritime gateways at Chennai, Ennore, and Kattupalli.",
        "content": (
            "INDIA METEOROLOGICAL DEPARTMENT (IMD) SPECIAL TROPICAL CYCLONE BULLETIN NO. 09. "
            "The Severe Cyclonic Storm 'Varun' located over the southwest Bay of Bengal has intensified and is moving northwestward towards "
            "the north Tamil Nadu and south Andhra Pradesh coastline. Maximum sustained surface wind speed is 90-110 km/h gusting to 125 km/h. "
            "A RED ALERT has been issued for coastal districts including Chennai, Tiruvallur, and Kanchipuram. Operations at Chennai Port Trust, "
            "Kamarajar Port (Ennore), and Kattupalli International Container Terminal are suspended for 72 hours. All vessel berthing, gantry crane "
            "operations, and container freight terminal logistics are halted. Heavy to extremely heavy rainfall will disrupt road freight along "
            "NH-16 and arterial industrial corridors connecting Sriperumbudur and Oragadam manufacturing clusters."
        ),
        "affected_locations": ["Chennai", "Ennore", "Kattupalli", "Sriperumbudur", "Tamil Nadu"],
        "affected_sectors": ["Precision Forgings", "Automotive Electronics", "Heavy Engineering", "Export Components"],
        "severity": "high",
    },
    {
        "id": "DOC-CUST-2026-19",
        "title": "Directorate General of Foreign Trade (DGFT) Policy Circular: Quality Control Orders (QCO) for Fasteners & Steel Castings",
        "category": "Customs Policy & Compliance",
        "date": "2026-08-19",
        "summary": "Mandatory Bureau of Indian Standards (BIS) certification for steel fasteners and industrial casting alloys.",
        "content": (
            "MINISTRY OF COMMERCE & INDUSTRY - DGFT POLICY CIRCULAR NO. 14/2026-27. "
            "Implementation of Steel and Steel Products Quality Control Order (QCO) 2026 for high-tensile industrial fasteners, "
            "threaded bolts, and alloy steel castings (IS 1364 and IS 1367 series). Importers and procurement entities sourcing components "
            "through Inland Container Depots (ICD Dhandari Kalan Ludhiana, ICD Tughlakabad) must submit valid Bureau of Indian Standards (BIS) "
            "Marking Certificates at the time of Bill of Entry filing. Goods arriving without verified BIS standard conformity marks will be "
            "detained for lab metallurgical testing, incurring demurrage and customs inspection lead times of 5-8 business days."
        ),
        "affected_locations": ["Ludhiana", "Delhi-NCR", "Punjab", "National Dry Ports"],
        "affected_sectors": ["Fasteners", "Automotive Hardware", "Pumps & Castings", "Infrastructure Steel"],
        "severity": "medium",
    },
    {
        "id": "DOC-SUP-2026-03",
        "title": "Saurashtra Foundry Association Supply Chain Disruption Report: Pig Iron Blast Furnace Outages",
        "category": "Supplier Lead-Time & Capacity Report",
        "date": "2026-08-21",
        "summary": "Raw material bottleneck and blast furnace relining causing 4-7 day casting delivery deferrals in Rajkot hub.",
        "content": (
            "SAURASHTRA FOUNDRY ASSOCIATION (SFA) - MONTHLY RAW MATERIAL & DISPATCH VULNERABILITY ADVISORY. "
            "Due to scheduled capital overhaul and refractory relining of major merchant pig iron blast furnaces in the Western Region, "
            "foundry units in Rajkot, Jamnagar, and Morbi are experiencing a 25% reduction in high-purity nodular pig iron feedstock. "
            "Foundries producing Ductile Iron (SG Iron) castings, agricultural pump housings, and transmission cases report a standard 4 to 7 "
            "day postponement in dispatch schedules. Machining centers and CNC job shops are operating on backlog buffers. Downstream buyers "
            "are advised to adjust production assembly schedules and verify foundry safety stock levels."
        ),
        "affected_locations": ["Rajkot", "Jamnagar", "Morbi", "Gujarat"],
        "affected_sectors": ["Foundry & Casting", "Pump Housings", "Agricultural Machinery", "Submersible Motors"],
        "severity": "medium",
    },
]


def get_all_documents() -> List[Dict[str, Any]]:
    """Returns all 5 mock supply chain intelligence documents."""
    return MOCK_DOCUMENTS


def get_document_by_id(doc_id: str) -> Dict[str, Any] | None:
    """Finds a mock document by its ID."""
    for doc in MOCK_DOCUMENTS:
        if doc["id"] == doc_id:
            return doc
    return None
