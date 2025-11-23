/**
 * Location unlock requirements mapping and logic
 * Defines what conditions must be met to unlock each location
 */

import { LocationData } from "@/data/realm-content";

export type UnlockRequirementType =
  | "first_artifact" // Unlocked by submitting first artifact
  | "parent_unlocked" // Unlocked when parent location is unlocked
  | "key_required" // Requires a key to unlock
  | "totem_power" // Requires minimum totem power
  | "custom"; // Custom requirement (e.g., tune flower nodes)

export interface LocationRequirement {
  locationId: number;
  requirementType: UnlockRequirementType;
  value?: number | string; // For totem_power (number) or custom requirement description
  keyLocationId?: number; // Location that grants the key (for key_required)
}

/**
 * Maps location slugs to their unlock requirements
 * Location IDs are based on the order in MYSTIC_ISLAND_LOCATIONS array
 */
export const LOCATION_REQUIREMENTS: Record<string, LocationRequirement> = {
  // ROOT NODE
  "explorers-main-path": {
    locationId: 1,
    requirementType: "first_artifact",
  },
  
  // PATH A — Metal Flower Branch
  "metal-flower-grove": {
    locationId: 2,
    requirementType: "parent_unlocked",
  },
  "planetarium-sunset-plains": {
    locationId: 3,
    requirementType: "parent_unlocked",
  },
  
  // PATH B — Lumen Meadow Branch
  "meadow-lumen-tree": {
    locationId: 4,
    requirementType: "parent_unlocked",
  },
  
  // PATH C — Forest Branch
  "forest-entryway-deep-woods": {
    locationId: 5,
    requirementType: "parent_unlocked",
  },
  "sanctuary-gate": {
    locationId: 6,
    requirementType: "parent_unlocked",
    // Note: This location is marked as unlocked in the spec, but we'll handle that via auto-unlock
  },
  
  // PATH D — Central Waters
  "island-pond-sacred-water": {
    locationId: 7,
    requirementType: "parent_unlocked",
  },
};

/**
 * Get requirement for a location by slug
 */
export function getLocationRequirement(
  slug: string
): LocationRequirement | undefined {
  return LOCATION_REQUIREMENTS[slug];
}

/**
 * Get requirement for a location by ID
 */
export function getLocationRequirementById(
  locationId: number
): LocationRequirement | undefined {
  return Object.values(LOCATION_REQUIREMENTS).find(
    (req) => req.locationId === locationId
  );
}

/**
 * Check if a location can be unlocked based on its requirement
 */
export async function canUnlockLocation(
  locationId: number,
  requirement: LocationRequirement,
  context: {
    hasSubmittedFirstArtifact?: boolean;
    parentUnlocked?: boolean;
    hasKey?: boolean;
    totemPower?: number;
    customConditionMet?: boolean;
  }
): Promise<boolean> {
  switch (requirement.requirementType) {
    case "first_artifact":
      return context.hasSubmittedFirstArtifact === true;

    case "parent_unlocked":
      return context.parentUnlocked === true;

    case "key_required":
      return context.hasKey === true;

    case "totem_power":
      const requiredPower = requirement.value as number;
      return (context.totemPower ?? 0) >= requiredPower;

    case "custom":
      return context.customConditionMet === true;

    default:
      return false;
  }
}

/**
 * Get human-readable requirement description
 */
export function getRequirementDescription(
  requirement: LocationRequirement,
  locationData?: LocationData
): string {
  if (locationData?.unlockRequirement) {
    return locationData.unlockRequirement;
  }

  switch (requirement.requirementType) {
    case "first_artifact":
      return "Submit your first artifact to unlock this location";

    case "parent_unlocked":
      return "Unlock the parent location first";

    case "key_required":
      return "A key is required to unlock this location";

    case "totem_power":
      return `Requires a totem with power of ${requirement.value} or higher`;

    case "custom":
      return (requirement.value as string) || "Complete the custom requirement";

    default:
      return "Unknown requirement";
  }
}

