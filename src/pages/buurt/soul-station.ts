/** Geloven in de Buurt — Soul Station, Prins Hendrikkade 49, Amsterdam */
export const SOUL_STATION_ID = "4a181cd8acc7";

export function isSoulStation(locationId: string): boolean {
  return locationId === SOUL_STATION_ID;
}
