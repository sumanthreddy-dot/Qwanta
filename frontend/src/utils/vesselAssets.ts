/**
 * Dynamic Vessel Asset Class Imagery and Metadata mapping.
 * Connects registered vessel types to authentic visuals, specs, and fallbacks.
 */

export interface CargoDetail {
  category: string;
  goods: string[];
  capacityUnit: string;
  stowageFactor: string;
  specialHandling: string;
}

export interface VesselClassInfo {
  type: string;
  title: string;
  imagePath: string;
  fallbackColor: string;
  typicalDwt: string;
  speedEnvelope: string;
  primaryFuels: string[];
  description: string;
  cargo: CargoDetail;
}

export const VESSEL_CLASSES: Record<string, VesselClassInfo> = {
  Container: {
    type: 'Container',
    title: 'Container Ship (Ultra Large / Feeder)',
    imagePath: '/images/vessels/container_ship.svg',
    fallbackColor: '#0284C7',
    typicalDwt: '60,000 – 140,000 t',
    speedEnvelope: '14 – 22 knots',
    primaryFuels: ['LNG', 'MGO', 'Biofuel', 'HFO'],
    description: 'High-speed liner service for intermodal containerized freight with hydrodynamic bow profile.',
    cargo: {
      category: 'Intermodal Containerized Freight',
      goods: ['Consumer Electronics', 'Apparel & Textiles', 'Automotive Parts', 'Refrigerated Fruits & Pharma (Reefers)', 'Packaged FMCG'],
      capacityUnit: 'TEU (Twenty-Foot Equivalent Units) & High-Cube Dry Vans',
      stowageFactor: '1.8 – 2.5 m³/t',
      specialHandling: 'Active 440V reefer electrical monitoring, twist-lock cell guides, deck lashings'
    }
  },
  'Bulk Carrier': {
    type: 'Bulk Carrier',
    title: 'Dry Bulk Carrier (Capesize / Panamax)',
    imagePath: '/images/vessels/bulk_carrier.svg',
    fallbackColor: '#F59E0B',
    typicalDwt: '50,000 – 120,000 t',
    speedEnvelope: '11 – 16 knots',
    primaryFuels: ['HFO', 'MGO', 'Biofuel'],
    description: 'High deadweight efficiency for bulk ore, grain, and commodities with heavy hatch covers.',
    cargo: {
      category: 'Dry Bulk Commodities',
      goods: ['Iron Ore & Bauxite', 'Thermal & Coking Coal', 'Wheat, Corn & Soybeans', 'Fertilizers & Minerals', 'Cement Clinker'],
      capacityUnit: 'Deadweight Metric Tonnes (DWT) in Underdeck Holds',
      stowageFactor: '0.4 – 1.4 m³/t',
      specialHandling: 'Continuous hatch moisture monitoring, IMSBC cargo liquefaction prevention, hold washing'
    }
  },
  'Oil Tanker': {
    type: 'Oil Tanker',
    title: 'Crude & Chemical Tanker (VLCC / Aframax)',
    imagePath: '/images/vessels/oil_tanker.svg',
    fallbackColor: '#DC2626',
    typicalDwt: '80,000 – 160,000 t',
    speedEnvelope: '12 – 16 knots',
    primaryFuels: ['HFO', 'LNG', 'MGO'],
    description: 'Double-hull liquid transport with deck pipe manifolds, heating coils, and vapor recovery.',
    cargo: {
      category: 'Liquid Hydrocarbons & Chemicals',
      goods: ['Arabian Light Crude Oil', 'Refined Ultra-Low Sulfur Diesel', 'Aviation Jet A-1 Fuel', 'Naphtha & Petrochemicals', 'Lubricant Base Oils'],
      capacityUnit: 'Barrels (bbl) & Cubic Metres (m³) Liquid Segregations',
      stowageFactor: '1.1 – 1.2 m³/t',
      specialHandling: 'Inert Gas System (IGS) blanketing, closed ullage radar gauging, manifold vapor return'
    }
  },
  'LNG Carrier': {
    type: 'LNG Carrier',
    title: 'Cryogenic LNG Carrier (Q-Flex / Moss)',
    imagePath: '/images/vessels/lng_carrier.svg',
    fallbackColor: '#06B6D4',
    typicalDwt: '75,000 – 105,000 t',
    speedEnvelope: '14 – 19 knots',
    primaryFuels: ['LNG', 'Biofuel', 'MGO'],
    description: 'Cryogenic containment (-162°C) with boil-off gas reliquefaction and dual-fuel propulsion.',
    cargo: {
      category: 'Cryogenic Liquefied Gases',
      goods: ['Liquefied Natural Gas (LNG -162°C)', 'Liquefied Petroleum Gas (Propane / Butane)', 'Ethane & Cryogenic Ethylene', 'Green Liquid Hydrogen (Pilot)'],
      capacityUnit: 'CBM (Cubic Metres Cryogenic Liquid Storage)',
      stowageFactor: '2.1 – 2.3 m³/t',
      specialHandling: 'Sub-zero containment insulation, BOG reliquefaction compressor loop, nitrogen purging'
    }
  },
  'Ro-Ro Ferry': {
    type: 'Ro-Ro Ferry',
    title: 'Roll-on / Roll-off Vehicle Carrier (PCTC)',
    imagePath: '/images/vessels/roro_vessel.svg',
    fallbackColor: '#10B981',
    typicalDwt: '15,000 – 35,000 t',
    speedEnvelope: '16 – 22 knots',
    primaryFuels: ['MGO', 'LNG', 'Electric', 'Biofuel'],
    description: 'Multi-deck vehicle stowage with high stern ramp accessibility and rapid turnaround.',
    cargo: {
      category: 'Wheeled Vehicles & Heavy Machinery',
      goods: ['Electric Vehicles (EVs) & Sedans', 'Commercial Highway Trucks & Busses', 'Heavy Agricultural Tractors', 'Mining & Excavation Machinery', 'Intermodal Trailer Chassis'],
      capacityUnit: 'Lane Metres & CEU (Car Equivalent Units)',
      stowageFactor: '3.0 – 4.5 m³/t',
      specialHandling: 'High-expansion deck foam firefighting, EV lithium thermal monitoring, deck lashing chocks'
    }
  },
  'General Cargo': {
    type: 'General Cargo',
    title: 'Multi-Purpose General Cargo Vessel',
    imagePath: '/images/vessels/general_cargo.svg',
    fallbackColor: '#8B5CF6',
    typicalDwt: '20,000 – 55,000 t',
    speedEnvelope: '12 – 17 knots',
    primaryFuels: ['MGO', 'Biofuel', 'HFO'],
    description: 'Geared multi-purpose ship with heavy deck cranes capable of breakbulk, project cargo, and containers.',
    cargo: {
      category: 'Breakbulk & Project Cargo',
      goods: ['Offshore Wind Turbine Blades', 'Industrial Power Transformers', 'Structural Steel Coils & Pipes', 'Pre-cast Concrete Bridge Beams', 'Palletized Food Provisions'],
      capacityUnit: 'Cubic Meters Hold Volume & Heavy Lift Deck Footprint',
      stowageFactor: '1.4 – 2.0 m³/t',
      specialHandling: 'Dual 80-tonne tandem deck crane tandem lifts, heavy timber dunnage, welded sea fastenings'
    }
  }
};

/**
 * Dynamically resolve the image path for any vessel based on its type.
 */
export function getVesselImage(vesselType: string): string {
  const norm = (vesselType || '').trim().toLowerCase();
  
  if (norm.includes('container')) return VESSEL_CLASSES['Container'].imagePath;
  if (norm.includes('bulk')) return VESSEL_CLASSES['Bulk Carrier'].imagePath;
  if (norm.includes('tanker') || norm.includes('oil')) return VESSEL_CLASSES['Oil Tanker'].imagePath;
  if (norm.includes('lng') || norm.includes('gas')) return VESSEL_CLASSES['LNG Carrier'].imagePath;
  if (norm.includes('ro-ro') || norm.includes('ferry') || norm.includes('vehicle')) return VESSEL_CLASSES['Ro-Ro Ferry'].imagePath;
  if (norm.includes('cargo') || norm.includes('general')) return VESSEL_CLASSES['General Cargo'].imagePath;

  // Fallback to container ship
  return '/images/vessels/container_ship.svg';
}

/**
 * Get class info by type.
 */
export function getVesselClassInfo(vesselType: string): VesselClassInfo {
  const norm = (vesselType || '').trim().toLowerCase();
  if (norm.includes('container')) return VESSEL_CLASSES['Container'];
  if (norm.includes('bulk')) return VESSEL_CLASSES['Bulk Carrier'];
  if (norm.includes('tanker') || norm.includes('oil')) return VESSEL_CLASSES['Oil Tanker'];
  if (norm.includes('lng') || norm.includes('gas')) return VESSEL_CLASSES['LNG Carrier'];
  if (norm.includes('ro-ro') || norm.includes('ferry') || norm.includes('vehicle')) return VESSEL_CLASSES['Ro-Ro Ferry'];
  if (norm.includes('cargo') || norm.includes('general')) return VESSEL_CLASSES['General Cargo'];

  return VESSEL_CLASSES['Container'];
}
