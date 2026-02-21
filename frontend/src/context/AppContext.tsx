"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ScanResponse,
  GenerateRecipesResponse,
  IdentifiedItem,
} from "@/lib/types";

interface AppState {
  // Scan state
  scanResult: ScanResponse | null;
  selectedItems: IdentifiedItem[];
  selectedFilters: string[];
  dietaryPreferences: string[];

  // Recipe state
  recipesResult: GenerateRecipesResponse | null;

  // Loading
  isScanning: boolean;
  isGenerating: boolean;

  // Actions
  setScanResult: (result: ScanResponse) => void;
  toggleItem: (item: IdentifiedItem) => void;
  removeItem: (name: string) => void;
  addCustomItem: (name: string) => void;
  toggleFilter: (filter: string) => void;
  toggleDietaryPreference: (pref: string) => void;
  setRecipesResult: (result: GenerateRecipesResponse) => void;
  setIsScanning: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  reset: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [scanResult, setScanResultState] = useState<ScanResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<IdentifiedItem[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [recipesResult, setRecipesResult] =
    useState<GenerateRecipesResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setScanResult = useCallback((result: ScanResponse) => {
    setScanResultState(result);
    setSelectedItems(result.identified_items);
    setSelectedFilters([]);
    setDietaryPreferences([]);
    setRecipesResult(null);
  }, []);

  const toggleItem = useCallback((item: IdentifiedItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.name === item.name);
      if (exists) return prev.filter((i) => i.name !== item.name);
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((name: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const addCustomItem = useCallback((name: string) => {
    setSelectedItems((prev) => {
      if (prev.find((i) => i.name === name)) return prev;
      return [...prev, { name, confidence: 1.0, source: "Personal" }];
    });
  }, []);

  const toggleFilter = useCallback((filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  }, []);

  const toggleDietaryPreference = useCallback((pref: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }, []);

  const reset = useCallback(() => {
    setScanResultState(null);
    setSelectedItems([]);
    setSelectedFilters([]);
    setDietaryPreferences([]);
    setRecipesResult(null);
    setIsScanning(false);
    setIsGenerating(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        scanResult,
        selectedItems,
        selectedFilters,
        dietaryPreferences,
        recipesResult,
        isScanning,
        isGenerating,
        setScanResult,
        toggleItem,
        removeItem,
        addCustomItem,
        toggleFilter,
        toggleDietaryPreference,
        setRecipesResult,
        setIsScanning,
        setIsGenerating,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
