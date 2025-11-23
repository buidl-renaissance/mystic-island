export interface LocationScene {
  slug: string;
  sceneURI: string;
  displayName: string;
  metadataURI?: string;
}

let cachedScenes: Record<string, LocationScene> | null = null;

/**
 * Load location scenes from the API
 * Uses caching to avoid repeated API calls
 */
export async function loadLocationScenes(): Promise<Record<string, LocationScene>> {
  if (cachedScenes !== null) {
    return cachedScenes;
  }

  try {
    const response = await fetch("/api/location-scenes");
    if (!response.ok) {
      // If API fails, return empty object
      cachedScenes = {};
      return {};
    }
    const scenes = await response.json();
    cachedScenes = scenes;
    return scenes || {};
  } catch (error) {
    console.error("Error loading location scenes:", error);
    cachedScenes = {};
    return {};
  }
}

/**
 * Get scene URI for a specific location slug
 */
export async function getLocationSceneURI(slug: string): Promise<string | null> {
  const scenes = await loadLocationScenes();
  return scenes[slug]?.sceneURI || null;
}

/**
 * Check if a location scene already exists
 */
export async function hasLocationScene(slug: string): Promise<boolean> {
  const scenes = await loadLocationScenes();
  return slug in scenes && !!scenes[slug]?.sceneURI;
}

/**
 * Clear the cache (useful after syncing)
 */
export function clearLocationScenesCache() {
  cachedScenes = null;
}

