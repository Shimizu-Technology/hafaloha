import { useEffect, useState } from 'react';
import { configApi } from '../services/api';
import type { AppConfig } from '../types/order';

let cachedConfig: AppConfig | null = null;
let inFlight: Promise<AppConfig> | null = null;

export default function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      return;
    }

    if (!inFlight) {
      inFlight = configApi.getConfig()
        .then((data) => {
          cachedConfig = data;
          return data;
        })
        .catch((error) => {
          console.error('Failed to load app config:', error);
          return null as unknown as AppConfig;
        });
    }

    inFlight.then((data) => {
      if (data) {
        setConfig(data);
      }
    });
  }, []);

  return config;
}
