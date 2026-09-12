/**
 * SVY21 (Singapore Transverse Mercator) to/from WGS84 coordinate converter.
 * Reference standard: Singapore Land Authority (SLA) & Urban Redevelopment Authority (URA).
 */

const a = 6378137.0; // Semi-major axis of WGS84 ellipsoid
const f = 1 / 298.257223563; // Flattening
const b = a * (1 - f); // Semi-minor axis
const e2 = 2 * f - f * f; // First eccentricity squared
const ePrime2 = e2 / (1 - e2); // Second eccentricity squared

// Projection origin
const oLat = (1 + 22 / 60) * (Math.PI / 180); // 1° 22' N in radians
const oLon = (103 + 50 / 60) * (Math.PI / 180); // 103° 50' E in radians
const falseNorthing = 38744.572;
const falseEasting = 28001.642;
const k0 = 1.0;

// Meridian distance coefficients
const A0 = 1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256;
const A2 = (3 / 8) * (e2 + (e2 * e2) / 4 + (15 * e2 * e2 * e2) / 128);
const A4 = (15 / 256) * (e2 * e2 + (3 * e2 * e2 * e2) / 4);
const A6 = (35 * e2 * e2 * e2) / 3072;

function calcMeridianDistance(latRad: number): number {
  return (
    a *
    (A0 * latRad -
      A2 * Math.sin(2 * latRad) +
      A4 * Math.sin(4 * latRad) -
      A6 * Math.sin(6 * latRad))
  );
}

const Mo = calcMeridianDistance(oLat);

/**
 * Converts Singapore SVY21 (Easting, Northing) to WGS84 (Latitude, Longitude) in degrees.
 * Used to position URA private property coordinates on the interactive map.
 */
export function svy21ToWgs84(
  easting: number,
  northing: number
): { lat: number; lng: number } {
  const Nprime = northing - falseNorthing;
  const M = Mo + Nprime / k0;
  const mu =
    M /
    (a *
      (1 -
        e2 / 4 -
        (3 * e2 * e2) / 64 -
        (5 * e2 * e2 * e2) / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const J1 = (3 * e1) / 2 - (27 * e1 * e1 * e1) / 32;
  const J2 = (21 * e1 * e1) / 16 - (55 * e1 * e1 * e1 * e1) / 32;
  const J3 = (151 * e1 * e1 * e1) / 96;
  const J4 = (1097 * e1 * e1 * e1 * e1) / 512;

  const fp =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const C1 = ePrime2 * cosFp * cosFp;
  const T1 = tanFp * tanFp;
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sinFp * sinFp, 1.5);
  const N1 = a / Math.sqrt(1 - e2 * sinFp * sinFp);

  const D = (easting - falseEasting) / (N1 * k0);
  const D2 = D * D;
  const D3 = D2 * D;
  const D4 = D3 * D;
  const D5 = D4 * D;
  const D6 = D5 * D;

  // Latitude
  const latFact1 = (N1 * tanFp) / R1;
  const latFact2 = D2 / 2;
  const latFact3 = ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ePrime2) * D4) / 24;
  const latFact4 =
    ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ePrime2 - 3 * C1 * C1) * D6) /
    720;
  const lat = fp - latFact1 * (latFact2 - latFact3 + latFact4);

  // Longitude
  const lonFact1 = D;
  const lonFact2 = ((1 + 2 * T1 + C1) * D3) / 6;
  const lonFact3 =
    ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ePrime2 + 24 * T1 * T1) * D5) / 120;
  const lon = oLon + (lonFact1 - lonFact2 + lonFact3) / cosFp;

  return {
    lat: (lat * 180) / Math.PI,
    lng: (lon * 180) / Math.PI,
  };
}

/**
 * Converts WGS84 (Latitude, Longitude) in degrees to Singapore SVY21 (Easting, Northing).
 */
export function wgs84ToSvy21(
  latDeg: number,
  lngDeg: number
): { easting: number; northing: number } {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lngDeg * Math.PI) / 180;

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const tanLat = Math.tan(lat);

  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = ePrime2 * cosLat * cosLat;
  const A_ = (lon - oLon) * cosLat;
  const M = calcMeridianDistance(lat);

  const A2 = A_ * A_;
  const A3 = A2 * A_;
  const A4 = A3 * A_;
  const A5 = A4 * A_;
  const A6 = A5 * A_;

  const easting =
    falseEasting +
    k0 *
      N *
      (A_ +
        ((1 - T + C) * A3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * A5) / 120);

  const northing =
    falseNorthing +
    k0 *
      (M -
        Mo +
        N *
          tanLat *
          (A2 / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * A6) / 720));

  return {
    easting: Math.round(easting * 100) / 100,
    northing: Math.round(northing * 100) / 100,
  };
}

/**
 * Computes direct Euclidean distance in meters using SVY21 coordinates.
 */
export function svy21DistanceMeters(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}
