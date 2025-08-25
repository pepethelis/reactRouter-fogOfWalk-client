import { useState, useEffect, useCallback } from "react";

export type UserGeolocationPosition = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
};

export type GeolocationState = {
  position: UserGeolocationPosition | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
  isSupported: boolean;
};

export type UseGeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 60000,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const getCurrentPosition = useCallback(() => {
    if (!state.isSupported) {
      const geolocationError: GeolocationPositionError = {
        code: 2,
        message: "Geolocation is not supported",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };
      setState((prev) => ({
        ...prev,
        error: geolocationError,
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    const onSuccess = (position: GeolocationPosition) => {
      setState((prev) => ({
        ...prev,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        },
        error: null,
        isLoading: false,
      }));
    };

    const onError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        error,
        isLoading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      positionOptions
    );
  }, [enableHighAccuracy, timeout, maximumAge, state.isSupported]);

  useEffect(() => {
    if (!watch || !state.isSupported) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    const onSuccess = (position: GeolocationPosition) => {
      setState((prev) => ({
        ...prev,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        },
        error: null,
        isLoading: false,
      }));
    };

    const onError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        error,
        isLoading: false,
      }));
    };

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      positionOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge, state.isSupported]);

  return {
    ...state,
    getCurrentPosition,
  };
};
