import React from "react";
import { css } from "@emotion/react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Building2,
  Layers,
  FileSpreadsheet,
  SquareDashedMousePointer,
  Ruler,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  Compass,
} from "lucide-react";
import {
  ACCENT_PRIMARY,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG_PANEL,
  BG_PANEL_ALT,
  BG_SURFACE_HOVER,
  SHADOW_MD,
  RADIUS_SM,
  RADIUS_MD,
} from "@/theme/color";
import { useLayerStore } from "@/state/layerStore";
import { useHiddenStore } from "@/three/Space";

interface LeftSidebarProps {
  step: number;
  onSelectRegion: () => void;
  onResetView?: () => void;
  totalBuildingsCount?: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  step,
  onSelectRegion,
  onResetView,
  totalBuildingsCount = 0,
}) => {
  const isSidebarOpen = useLayerStore((s) => s.isSidebarOpen);
  const toggleSidebar = useLayerStore((s) => s.toggleSidebar);
  const activeTab = useLayerStore((s) => s.activeTab);
  const setActiveTab = useLayerStore((s) => s.setActiveTab);

  const showBuildings = useLayerStore((s) => s.showBuildings);
  const showRoads = useLayerStore((s) => s.showRoads);
  const showParcels = useLayerStore((s) => s.showParcels);
  const showLabels = useLayerStore((s) => s.showLabels);
  const toggleLayer = useLayerStore((s) => s.toggleLayer);

  const activeTool = useLayerStore((s) => s.activeTool);
  const setActiveTool = useLayerStore((s) => s.setActiveTool);

  const hiddenIds = useHiddenStore((s) => s.hiddenIds);
  const showAll = useHiddenStore((s) => s.showAll);

  const projectNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "map", label: "3D Map", icon: MapIcon, badge: "Live" },
    { id: "properties", label: "Properties", icon: Compass, badge: null },
    { id: "buildings", label: "Buildings", icon: Building2, badge: totalBuildingsCount > 0 ? String(totalBuildingsCount) : null },
    { id: "floors", label: "Floors", icon: Layers, badge: null },
    { id: "records", label: "ULPIN Records", icon: FileSpreadsheet, badge: null },
  ] as const;

  const layerItems = [
    { key: "showParcels", label: "Cadastral Parcels", checked: showParcels },
    { key: "showBuildings", label: "3D Buildings", checked: showBuildings },
    { key: "showRoads", label: "Road Network", checked: showRoads },
    { key: "showLabels", label: "3D Annotations", checked: showLabels },
  ] as const;

  return (
    <aside
      css={css({
        position: "absolute",
        top: "3.5rem",
        left: "1rem",
        bottom: "2.5rem",
        width: isSidebarOpen ? "260px" : "48px",
        backgroundColor: BG_PANEL,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: RADIUS_MD,
        boxShadow: SHADOW_MD,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        userSelect: "none",
      })}
    >
      {/* Header / Collapse Toggle */}
      <div
        css={css({
          padding: isSidebarOpen ? "0.75rem 0.85rem" : "0.75rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: isSidebarOpen ? "space-between" : "center",
          borderBottom: `1px solid ${BORDER_COLOR}`,
          backgroundColor: BG_PANEL_ALT,
        })}
      >
        {isSidebarOpen && (
          <div css={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}>
            <span
              css={css({
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: TEXT_SECONDARY,
              })}
            >
              GIS Navigator
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          css={css({
            background: "none",
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: RADIUS_SM,
            padding: "0.3rem",
            color: TEXT_SECONDARY,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            backgroundColor: BG_PANEL,
            ":hover": {
              backgroundColor: BG_SURFACE_HOVER,
              color: TEXT_PRIMARY,
            },
          })}
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Content Area */}
      <div
        css={css({
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: isSidebarOpen ? "0.85rem 0.65rem" : "0.5rem 0.35rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        })}
      >
        {/* SECTION: PROJECT */}
        <div>
          {isSidebarOpen && (
            <div
              css={css({
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: TEXT_MUTED,
                marginBottom: "0.4rem",
                paddingLeft: "0.5rem",
              })}
            >
              Project
            </div>
          )}
          <nav css={css({ display: "flex", flexDirection: "column", gap: "0.15rem" })}>
            {projectNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  css={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    width: "100%",
                    padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                    justifyContent: isSidebarOpen ? "flex-start" : "center",
                    borderRadius: RADIUS_SM,
                    border: "none",
                    backgroundColor: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    color: isActive ? ACCENT_PRIMARY : TEXT_SECONDARY,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    ":hover": {
                      backgroundColor: isActive ? "rgba(37, 99, 235, 0.12)" : BG_SURFACE_HOVER,
                      color: isActive ? ACCENT_PRIMARY : TEXT_PRIMARY,
                    },
                  })}
                >
                  <Icon size={15} color={isActive ? ACCENT_PRIMARY : undefined} />
                  {isSidebarOpen && (
                    <span css={css({ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
                      {item.label}
                    </span>
                  )}
                  {isSidebarOpen && item.badge && (
                    <span
                      css={css({
                        fontSize: "10px",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "999px",
                        backgroundColor: isActive ? ACCENT_PRIMARY : "rgba(100, 116, 139, 0.12)",
                        color: isActive ? "#ffffff" : TEXT_SECONDARY,
                        fontWeight: 700,
                      })}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECTION: LAYERS */}
        <div>
          {isSidebarOpen && (
            <div
              css={css({
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: TEXT_MUTED,
                marginBottom: "0.4rem",
                paddingLeft: "0.5rem",
              })}
            >
              Layers
            </div>
          )}
          <div css={css({ display: "flex", flexDirection: "column", gap: "0.15rem" })}>
            {layerItems.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleLayer(item.key)}
                title={item.label}
                css={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                  justifyContent: isSidebarOpen ? "flex-start" : "center",
                  borderRadius: RADIUS_SM,
                  border: "none",
                  backgroundColor: "transparent",
                  color: item.checked ? TEXT_PRIMARY : TEXT_MUTED,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  ":hover": {
                    backgroundColor: BG_SURFACE_HOVER,
                  },
                })}
              >
                {item.checked ? (
                  <CheckSquare size={14} color={ACCENT_PRIMARY} />
                ) : (
                  <Square size={14} color={TEXT_MUTED} />
                )}
                {isSidebarOpen && (
                  <span css={css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: TOOLS */}
        <div>
          {isSidebarOpen && (
            <div
              css={css({
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: TEXT_MUTED,
                marginBottom: "0.4rem",
                paddingLeft: "0.5rem",
              })}
            >
              GIS Tools
            </div>
          )}
          <div css={css({ display: "flex", flexDirection: "column", gap: "0.2rem" })}>
            <button
              onClick={onSelectRegion}
              title="Select New Bounding Region"
              css={css({
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                width: "100%",
                padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                justifyContent: isSidebarOpen ? "flex-start" : "center",
                borderRadius: RADIUS_SM,
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: step === 0 ? "rgba(37, 99, 235, 0.08)" : BG_PANEL,
                color: step === 0 ? ACCENT_PRIMARY : TEXT_PRIMARY,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                ":hover": {
                  backgroundColor: BG_SURFACE_HOVER,
                },
              })}
            >
              <SquareDashedMousePointer size={14} />
              {isSidebarOpen && <span>Select Region (2D)</span>}
            </button>

            <button
              onClick={() => setActiveTool(activeTool === "measure" ? "none" : "measure")}
              title="Spatial Measurement Tool"
              css={css({
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                width: "100%",
                padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                justifyContent: isSidebarOpen ? "flex-start" : "center",
                borderRadius: RADIUS_SM,
                border: `1px solid ${activeTool === "measure" ? ACCENT_PRIMARY : BORDER_COLOR}`,
                backgroundColor: activeTool === "measure" ? "rgba(37, 99, 235, 0.08)" : BG_PANEL,
                color: activeTool === "measure" ? ACCENT_PRIMARY : TEXT_PRIMARY,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                ":hover": {
                  backgroundColor: BG_SURFACE_HOVER,
                },
              })}
            >
              <Ruler size={14} />
              {isSidebarOpen && <span>Measure Distance</span>}
            </button>

            {hiddenIds.size > 0 && (
              <button
                onClick={showAll}
                title="Reveal all hidden buildings"
                css={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                  justifyContent: isSidebarOpen ? "flex-start" : "center",
                  borderRadius: RADIUS_SM,
                  border: `1px solid rgba(217, 119, 6, 0.3)`,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  color: "#b45309",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  ":hover": {
                    backgroundColor: "rgba(245, 158, 11, 0.16)",
                  },
                })}
              >
                <Eye size={14} />
                {isSidebarOpen && <span>Reveal Cut ({hiddenIds.size})</span>}
              </button>
            )}

            {onResetView && (
              <button
                onClick={onResetView}
                title="Reset Camera View"
                css={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: isSidebarOpen ? "0.45rem 0.6rem" : "0.5rem",
                  justifyContent: isSidebarOpen ? "flex-start" : "center",
                  borderRadius: RADIUS_SM,
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: BG_PANEL,
                  color: TEXT_SECONDARY,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  ":hover": {
                    backgroundColor: BG_SURFACE_HOVER,
                    color: TEXT_PRIMARY,
                  },
                })}
              >
                <RotateCcw size={14} />
                {isSidebarOpen && <span>Reset 3D View</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
