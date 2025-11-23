import type { Location } from "@/hooks/useLocationRegistry";

export interface LocationTreeNode {
  location: Location;
  children: LocationTreeNode[];
  isDeadEnd: boolean;
  depth: number;
}

/**
 * Build a hierarchical tree structure from flat location array
 */
export function buildLocationTree(locations: Location[]): LocationTreeNode[] {
  // Create a map for quick lookup
  const locationMap = new Map<bigint, Location>();
  locations.forEach((loc) => {
    locationMap.set(loc.id, loc);
  });

  // Build tree starting from root locations (parentLocationId === 0)
  const rootLocations = locations.filter((loc) => loc.parentLocationId === 0n);
  
  function buildNode(location: Location, depth: number): LocationTreeNode {
    const children = locations
      .filter((loc) => loc.parentLocationId === location.id)
      .map((child) => buildNode(child, depth + 1));

    return {
      location,
      children,
      isDeadEnd: children.length === 0,
      depth,
    };
  }

  return rootLocations.map((root) => buildNode(root, 0));
}

/**
 * Get child locations of a parent location
 */
export function getChildLocations(
  parentId: bigint,
  locations: Location[]
): Location[] {
  return locations.filter((loc) => loc.parentLocationId === parentId);
}

/**
 * Check if a location is a dead end (has no children)
 */
export function isDeadEnd(locationId: bigint, locations: Location[]): boolean {
  return !locations.some((loc) => loc.parentLocationId === locationId);
}

/**
 * Get the path from root to a specific location
 */
export function getPathToLocation(
  locationId: bigint,
  locations: Location[]
): Location[] {
  const locationMap = new Map<bigint, Location>();
  locations.forEach((loc) => {
    locationMap.set(loc.id, loc);
  });

  const path: Location[] = [];
  let currentId: bigint | undefined = locationId;

  while (currentId !== undefined) {
    const location = locationMap.get(currentId);
    if (!location) break;

    path.unshift(location);
    currentId = location.parentLocationId === 0n ? undefined : location.parentLocationId;
  }

  return path;
}

/**
 * Filter locations by unlock status
 */
export function getAccessibleLocations(
  unlockedIds: bigint[],
  locations: Location[]
): Location[] {
  const unlockedSet = new Set(unlockedIds.map((id) => id.toString()));
  return locations.filter((loc) => unlockedSet.has(loc.id.toString()));
}

/**
 * Get all ancestors of a location (parent, grandparent, etc.)
 */
export function getAncestors(
  locationId: bigint,
  locations: Location[]
): Location[] {
  const locationMap = new Map<bigint, Location>();
  locations.forEach((loc) => {
    locationMap.set(loc.id, loc);
  });

  const ancestors: Location[] = [];
  let currentId: bigint | undefined = locationId;

  while (currentId !== undefined) {
    const location = locationMap.get(currentId);
    if (!location) break;

    if (location.parentLocationId !== 0n) {
      const parent = locationMap.get(location.parentLocationId);
      if (parent) {
        ancestors.unshift(parent);
        currentId = parent.parentLocationId === 0n ? undefined : parent.parentLocationId;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Get all descendants of a location (children, grandchildren, etc.)
 */
export function getDescendants(
  locationId: bigint,
  locations: Location[]
): Location[] {
  const descendants: Location[] = [];
  const children = getChildLocations(locationId, locations);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getDescendants(child.id, locations));
  }

  return descendants;
}

/**
 * Find a location in the tree by ID
 */
export function findLocationInTree(
  locationId: bigint,
  tree: LocationTreeNode[]
): LocationTreeNode | null {
  for (const node of tree) {
    if (node.location.id === locationId) {
      return node;
    }

    const found = findLocationInTree(locationId, node.children);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Get all locations that should be unlocked when a parent is visited
 * (includes the parent and all its descendants)
 */
export function getLocationsToUnlock(
  parentId: bigint,
  locations: Location[]
): bigint[] {
  const parent = locations.find((loc) => loc.id === parentId);
  if (!parent) return [];

  const toUnlock: bigint[] = [parentId];
  const descendants = getDescendants(parentId, locations);
  toUnlock.push(...descendants.map((loc) => loc.id));

  return toUnlock;
}

