import { create } from "zustand";

export interface SelectedBuildingDetails {
  buildingId: number;
  osmId: number;
  tags: Record<string, string | undefined>;
  height: number;
  floorCount: number;
  rawCenter: { lat: number; lng: number };
  baseUlpin?: string;
  parcelId?: number;
  dbBuildingId?: number;
  floors?: { floor_number: number; floor_ulpin: string; flag: boolean }[];
  isFlagged?: boolean;
}

interface LayerState {
  // Layer Toggles
  showBuildings: boolean;
  showRoads: boolean;
  showParcels: boolean;
  showLabels: boolean;
  toggleLayer: (layer: "showBuildings" | "showRoads" | "showParcels" | "showLabels") => void;
  setLayer: (layer: "showBuildings" | "showRoads" | "showParcels" | "showLabels", value: boolean) => void;

  // Sidebar & Navigation
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeTab: "dashboard" | "map" | "properties" | "buildings" | "floors" | "records";
  setActiveTab: (tab: "dashboard" | "map" | "properties" | "buildings" | "floors" | "records") => void;

  // Active GIS Tool
  activeTool: "select" | "measure" | "cut" | "none";
  setActiveTool: (tool: "select" | "measure" | "cut" | "none") => void;

  // Selected Property Inspector State
  selectedBuilding: SelectedBuildingDetails | null;
  setSelectedBuilding: (details: SelectedBuildingDetails | null) => void;
  updateSelectedFloors: (floors: { floor_number: number; floor_ulpin: string; flag: boolean }[], isFlagged?: boolean) => void;
  updateSelectedDbInfo: (info: { dbBuildingId: number; parcelId: number; baseUlpin: string }) => void;
  isolatedFloor: number | null;
  setIsolatedFloor: (floor: number | null) => void;
  isPropertyPanelOpen: boolean;
  setPropertyPanelOpen: (open: boolean) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  showBuildings: true,
  showRoads: true,
  showParcels: true,
  showLabels: true,
  toggleLayer: (layer) => set((s) => ({ [layer]: !s[layer] })),
  setLayer: (layer, value) => set({ [layer]: value }),

  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  activeTab: "map",
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeTool: "none",
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedBuilding: null,
  setSelectedBuilding: (details) =>
    set({
      selectedBuilding: details,
      isPropertyPanelOpen: details !== null,
      isolatedFloor: null,
    }),
  updateSelectedFloors: (floors, isFlagged) =>
    set((s) => ({
      selectedBuilding: s.selectedBuilding
        ? { ...s.selectedBuilding, floors, isFlagged: isFlagged ?? s.selectedBuilding.isFlagged }
        : null,
    })),
  updateSelectedDbInfo: (info) =>
    set((s) => ({
      selectedBuilding: s.selectedBuilding
        ? {
            ...s.selectedBuilding,
            dbBuildingId: info.dbBuildingId,
            parcelId: info.parcelId,
            baseUlpin: info.baseUlpin,
          }
        : null,
    })),
  isolatedFloor: null,
  setIsolatedFloor: (floor) => set({ isolatedFloor: floor }),
  isPropertyPanelOpen: false,
  setPropertyPanelOpen: (open) => set({ isPropertyPanelOpen: open }),
}));
