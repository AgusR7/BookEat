import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'bookeat-restaurant-preferences';
const UPDATE_EVENT = 'restaurant-preferences-updated';
export const RESTAURANT_FOCUS_EVENT = 'bookeat-focus-restaurant';

export interface RestaurantPreferenceSummary {
  id: number;
  name: string;
  neighborhood?: string;
  address?: string;
  tags?: string[];
  updatedAt: string;
}

interface RestaurantPreferencesState {
  favorites: RestaurantPreferenceSummary[];
  recentViews: RestaurantPreferenceSummary[];
}

interface RestaurantPreferenceInput {
  id: number;
  name: string;
  neighborhood?: string;
  address?: string;
  tags?: string[];
}

const createSummary = (restaurant: RestaurantPreferenceInput): RestaurantPreferenceSummary => ({
  id: restaurant.id,
  name: restaurant.name,
  neighborhood: restaurant.neighborhood,
  address: restaurant.address,
  tags: restaurant.tags || [],
  updatedAt: new Date().toISOString()
});

const defaultState: RestaurantPreferencesState = {
  favorites: [],
  recentViews: []
};

const readState = (): RestaurantPreferencesState => {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return defaultState;
    }

    const parsed = JSON.parse(rawValue) as RestaurantPreferencesState;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recentViews: Array.isArray(parsed.recentViews) ? parsed.recentViews : []
    };
  } catch {
    return defaultState;
  }
};

const writeState = (nextState: RestaurantPreferencesState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

const dedupeByRestaurant = (items: RestaurantPreferenceSummary[]) => {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

export const focusRestaurantOnMap = (restaurantId: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(RESTAURANT_FOCUS_EVENT, {
      detail: { restaurantId }
    })
  );
};

export const useRestaurantPreferences = () => {
  const [state, setState] = useState<RestaurantPreferencesState>(() => readState());

  useEffect(() => {
    const sync = () => setState(readState());
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const updateState = (
    updater: (currentState: RestaurantPreferencesState) => RestaurantPreferencesState
  ) => {
    const nextState = updater(readState());
    writeState(nextState);
    setState(nextState);
  };

  const toggleFavorite = (restaurant: RestaurantPreferenceInput) => {
    updateState((currentState) => {
      const summary = createSummary(restaurant);
      const alreadySaved = currentState.favorites.some((favorite) => favorite.id === summary.id);

      return {
        ...currentState,
        favorites: alreadySaved
          ? currentState.favorites.filter((favorite) => favorite.id !== summary.id)
          : dedupeByRestaurant([summary, ...currentState.favorites]).slice(0, 12)
      };
    });
  };

  const removeFavorite = (restaurantId: number) => {
    updateState((currentState) => ({
      ...currentState,
      favorites: currentState.favorites.filter((favorite) => favorite.id !== restaurantId)
    }));
  };

  const addRecentView = (restaurant: RestaurantPreferenceInput) => {
    updateState((currentState) => {
      const summary = createSummary(restaurant);
      return {
        ...currentState,
        recentViews: dedupeByRestaurant([summary, ...currentState.recentViews]).slice(0, 6)
      };
    });
  };

  const isFavorite = (restaurantId: number) =>
    state.favorites.some((favorite) => favorite.id === restaurantId);

  return useMemo(
    () => ({
      favorites: state.favorites,
      recentViews: state.recentViews,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      addRecentView
    }),
    [state]
  );
};
