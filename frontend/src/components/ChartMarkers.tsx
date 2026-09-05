import React from 'react';

/**
 * Custom Recharts SVG Data Point Markers.
 * Replaces generic circular dots with nautical directional arrows, chevrons, and delta triangles.
 */

interface MarkerProps {
  cx?: number;
  cy?: number;
  stroke?: string;
  fill?: string;
  payload?: any;
  value?: any;
}

/**
 * Directional Arrow / Chevron Pointer (────▶────▶────▶────)
 * Points along the operational progression of the curve.
 */
export const DirectionalArrowDot: React.FC<MarkerProps> = ({
  cx,
  cy,
  stroke = '#10B981',
  fill = '#10B981'
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  return (
    <svg
      x={cx - 6}
      y={cy - 6}
      width={12}
      height={12}
      viewBox="0 0 12 12"
      className="overflow-visible transition-transform duration-200 hover:scale-150 cursor-pointer"
    >
      <polygon
        points="1,1 11,6 1,11 4,6"
        fill={fill}
        stroke="#0F172A"
        strokeWidth="1.2"
        className="filter drop-shadow"
      />
    </svg>
  );
};

/**
 * Delta Navigation Triangle Marker (▲)
 * Represents hydrodynamics and optimization convergence minima.
 */
export const NavigationTriangleDot: React.FC<MarkerProps> = ({
  cx,
  cy,
  stroke = '#06B6D4',
  fill = '#06B6D4'
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  return (
    <svg
      x={cx - 5}
      y={cy - 5}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      className="overflow-visible transition-transform duration-200 hover:scale-150 cursor-pointer"
    >
      <polygon
        points="5,0 10,9 0,9"
        fill={fill}
        stroke="#0F172A"
        strokeWidth="1.2"
      />
    </svg>
  );
};

/**
 * Inverted Delta Triangle (▼) for energy descent.
 */
export const EnergyDescentTriangleDot: React.FC<MarkerProps> = ({
  cx,
  cy,
  stroke = '#10B981',
  fill = '#10B981'
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  return (
    <svg
      x={cx - 4}
      y={cy - 4}
      width={8}
      height={8}
      viewBox="0 0 8 8"
      className="overflow-visible transition-transform duration-200 hover:scale-150 cursor-pointer"
    >
      <polygon
        points="0,1 8,1 4,8"
        fill={fill}
        stroke="#0F172A"
        strokeWidth="1"
      />
    </svg>
  );
};

/**
 * Diamond Milestone Dot (◆)
 */
export const DiamondMarkerDot: React.FC<MarkerProps> = ({
  cx,
  cy,
  stroke = '#38BDF8',
  fill = '#38BDF8'
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  return (
    <svg
      x={cx - 5}
      y={cy - 5}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      className="overflow-visible transition-transform duration-200 hover:scale-150 cursor-pointer"
    >
      <polygon
        points="5,0 10,5 5,10 0,5"
        fill={fill}
        stroke="#0F172A"
        strokeWidth="1.2"
      />
    </svg>
  );
};
