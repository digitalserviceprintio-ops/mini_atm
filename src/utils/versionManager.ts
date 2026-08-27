import { useState, useEffect, useCallback } from 'react';

export interface VersionChangeLog {
  id: string;
  timestamp: string;
  version: string;
  type: 'TRANSACTION' | 'PRODUCT' | 'SETTING' | 'STOCK' | 'ACCOUNT' | 'USER' | 'SYSTEM' | 'MANUAL';
  description: string;
}

export interface VersionState {
  major: number;
  minor: number;
  patch: number;
  buildNumber: number;
  changeCount: number;
  lastUpdated: string;
  lastDescription: string;
  history: VersionChangeLog[];
}

const STORAGE_KEY = 'miniatm_version_state';
const BASE_MAJOR = 1;
const BASE_MINOR = 2;

// Initial state baseline (Enterprise v1.2)
const getInitialVersionState = (): VersionState => {
  if (typeof window === 'undefined') {
    return {
      major: BASE_MAJOR,
      minor: BASE_MINOR,
      patch: 0,
      buildNumber: 120,
      changeCount: 0,
      lastUpdated: new Date().toISOString(),
      lastDescription: 'Rilis Enterprise v1.2 Baseline',
      history: [
        {
          id: 'INIT_120',
          timestamp: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          version: `v${BASE_MAJOR}.${BASE_MINOR}`,
          type: 'SYSTEM',
          description: 'Inisialisasi sistem Enterprise v1.2',
        },
      ],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: VersionState = JSON.parse(raw);
      // Ensure major and minor are strictly updated to 1.2 if previously older
      if (parsed.major !== BASE_MAJOR || parsed.minor !== BASE_MINOR) {
        parsed.major = BASE_MAJOR;
        parsed.minor = BASE_MINOR;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading version state:', e);
  }

  const defaultState: VersionState = {
    major: BASE_MAJOR,
    minor: BASE_MINOR,
    patch: 0,
    buildNumber: 120,
    changeCount: 0,
    lastUpdated: new Date().toISOString(),
    lastDescription: 'Rilis Enterprise v1.2 Sistem Mini ATM & POS',
    history: [
      {
        id: 'INIT_120',
        timestamp: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        version: `v${BASE_MAJOR}.${BASE_MINOR}`,
        type: 'SYSTEM',
        description: 'Pembaruan Enterprise v1.2 dengan Auto-Increment Versioning',
      },
    ],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  } catch (e) {
    // Ignore storage quota errors
  }

  return defaultState;
};

// Global in-memory cache
let currentVersionState: VersionState = getInitialVersionState();

export const getAppVersionState = (): VersionState => {
  return currentVersionState;
};

export const formatAppVersion = (state: VersionState = currentVersionState): string => {
  if (state.patch > 0) {
    return `v${state.major}.${state.minor}.${state.patch}`;
  }
  return `v${state.major}.${state.minor}`;
};

export const formatEnterpriseVersion = (state: VersionState = currentVersionState): string => {
  if (state.patch > 0) {
    return `Enterprise v${state.major}.${state.minor}.${state.patch}`;
  }
  return `Enterprise v${state.major}.${state.minor}`;
};

export const formatBuildDetails = (state: VersionState = currentVersionState): string => {
  return `Build #${state.buildNumber} (${state.changeCount} update)`;
};

/**
 * Automatically triggers a version increment whenever data/state changes occur in the app.
 */
export const recordVersionChange = (
  description: string,
  type: VersionChangeLog['type'] = 'SYSTEM'
): VersionState => {
  const nextPatch = currentVersionState.patch + 1;
  const nextBuild = currentVersionState.buildNumber + 1;
  const nextCount = currentVersionState.changeCount + 1;

  const nowFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newVersionStr = `v${BASE_MAJOR}.${BASE_MINOR}.${nextPatch}`;

  const newLog: VersionChangeLog = {
    id: `CHG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: nowFormatted,
    version: newVersionStr,
    type,
    description,
  };

  const updatedHistory = [newLog, ...(currentVersionState.history || [])].slice(0, 50);

  currentVersionState = {
    ...currentVersionState,
    major: BASE_MAJOR,
    minor: BASE_MINOR,
    patch: nextPatch,
    buildNumber: nextBuild,
    changeCount: nextCount,
    lastUpdated: new Date().toISOString(),
    lastDescription: description,
    history: updatedHistory,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentVersionState));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('miniatm-version-change', {
          detail: currentVersionState,
        })
      );
    }
  } catch (e) {
    console.error('Error saving version state:', e);
  }

  return currentVersionState;
};

/**
 * Reset version state back to baseline v1.2.0
 */
export const resetAppVersion = (): VersionState => {
  currentVersionState = {
    major: BASE_MAJOR,
    minor: BASE_MINOR,
    patch: 0,
    buildNumber: 120,
    changeCount: 0,
    lastUpdated: new Date().toISOString(),
    lastDescription: 'Reset ke Enterprise v1.2 Baseline',
    history: [
      {
        id: `RESET_${Date.now()}`,
        timestamp: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        version: `v${BASE_MAJOR}.${BASE_MINOR}`,
        type: 'SYSTEM',
        description: 'Sistem di-reset ke Enterprise v1.2 Baseline',
      },
    ],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentVersionState));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('miniatm-version-change', {
          detail: currentVersionState,
        })
      );
    }
  } catch (e) {
    console.error('Error resetting version state:', e);
  }

  return currentVersionState;
};

/**
 * Custom React Hook to consume reactive application version state
 */
export const useAppVersion = () => {
  const [versionState, setVersionState] = useState<VersionState>(() => currentVersionState);

  useEffect(() => {
    const handleVersionChange = (e: Event) => {
      const customEvent = e as CustomEvent<VersionState>;
      if (customEvent.detail) {
        setVersionState(customEvent.detail);
      } else {
        setVersionState(getAppVersionState());
      }
    };

    window.addEventListener('miniatm-version-change', handleVersionChange);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        setVersionState(getInitialVersionState());
      }
    });

    return () => {
      window.removeEventListener('miniatm-version-change', handleVersionChange);
    };
  }, []);

  const triggerChange = useCallback(
    (description: string, type: VersionChangeLog['type'] = 'SYSTEM') => {
      return recordVersionChange(description, type);
    },
    []
  );

  const reset = useCallback(() => {
    return resetAppVersion();
  }, []);

  return {
    state: versionState,
    version: formatAppVersion(versionState),
    enterpriseVersion: formatEnterpriseVersion(versionState),
    buildDetails: formatBuildDetails(versionState),
    recordChange: triggerChange,
    resetVersion: reset,
  };
};
