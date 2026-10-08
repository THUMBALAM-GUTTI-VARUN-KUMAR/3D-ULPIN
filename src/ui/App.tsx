import React, { useEffect, useState } from "react";
import { css, keyframes } from "@emotion/react";
import { Space, useHiddenStore } from "../three/Space";
import { MapComponent } from "@/components/map/SelectMap";
import { SearchBar } from "@/components/map/SearchBar";
import { BuildingHeights, Building } from "@/components/map/Processing";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  Loader2,
  AlertTriangle,
  Layers3,
  Sparkles,
  MapPin,
  Maximize2,
  Eye,
} from "lucide-react";
import { useAreaStore } from "@/state/areaStore";
import { useActionStore } from "@/state/exportStore";
import { Modal } from "@/components/modal/Modal";
import { TopNav } from "@/components/nav/TopNav";
import { LeftSidebar } from "@/components/nav/LeftSidebar";
import { PropertyPanel } from "@/components/panels/PropertyPanel";
import { BottomStatusBar } from "@/components/panels/BottomStatusBar";
import { MovementHint } from "@/components/controls/MovementHint";
import { getCookie } from "@/utils/cookie";
import instanceFleet from "@/api/axios";
import {
  ACCENT_PRIMARY,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG_PANEL,
  BG_PANEL_ALT,
  SHADOW_MD,
  RADIUS_SM,
  RADIUS_MD,
} from "@/theme/color";
import { useLayerStore } from "@/state/layerStore";

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

function App() {
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);
  const [areaData, setAreaData] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [step, setStep] = useState(0);
  const [isWarnModal, setIsWarnModal] = useState(false);
  const [isFleetLogin, setIsFleetLogin] = useState(false);
  const [isFleetModal, setIsFleetModal] = useState(false);
  const [spaceList, setSpaceList] = useState<
    { id: string; title: string }[]
  >([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isFetchingBuildings, setIsFetchingBuildings] = useState(false);
  const [hasFetchedBuildings, setHasFetchedBuildings] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const setCenter = useAreaStore((state) => state.setCenter);
  const appendAreas = useAreaStore((state) => state.appendAreas);
  const setExportType = useActionStore((state) => state.setExportType);
  const setFleet = useActionStore((state) => state.setFleet);

  const setSelectedBuilding = useLayerStore((s) => s.setSelectedBuilding);

  const checkIsBig = (): boolean => {
    if (areaData.length < 2) return false;
    const a = areaData[0].lat - areaData[1].lat;
    const b = areaData[0].lng - areaData[1].lng;
    return a + b > 0.1;
  };

  const getFleetSpaces = async () => {
    try {
      const getSpace: { data: { spaces: { id: string; title: string }[] } } =
        await instanceFleet.get("space");
      setSpaceList(
        getSpace.data.spaces.map((item) => ({
          ...item,
          key: item.id,
        }))
      );
    } catch (e) {
      console.error("Fleet space fetch error:", e);
    }
  };

  const putGlbOnFleetSpace = (spaceId: string) => {
    setFleet(spaceId, "fleet");
    setExportType("fleet");
    window.VPMSExportModel?.("fleet");
  };

  const checkFleetLogin = () => {
    try {
      const isCookie = getCookie("token");
      if (isCookie) {
        setIsFleetLogin(true);
      }
    } catch {
      // silently ignore cookie errors
    }
  };

  const handleDone = (data: { lat: number; lng: number }[]) => {
    setAreaData(data);
    setCenter(data);
    setIsNextButtonDisabled(false);
    setBuildings([]);
    setHasFetchedBuildings(false);
  };

  const handleRemove = () => {
    setAreaData([]);
    setIsNextButtonDisabled(true);
    setBuildings([]);
    setHasFetchedBuildings(false);
    setSelectedBuilding(null);
  };

  const handleResetDemo = () => {
    handleRemove();
    setStep(0);
    setResetKey((k) => k + 1);
  };

  const requestBuildings = async () => {
    if (areaData.length < 2) return;
    setIsFetchingBuildings(true);

    const south = areaData[1].lat;
    const west = areaData[1].lng;
    const north = areaData[0].lat;
    const east = areaData[0].lng;
    const query = `[out:json][timeout:25];(way["building"]( ${south},${west},${north},${east} );relation["building"]( ${south},${west},${north},${east} ););out body geom;`;

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await response.json();
      const blds: Building[] = data.elements.map(
        (element: {
          id: number;
          tags: { [key: string]: string | undefined };
          geometry?: { lat: number; lon: number }[];
        }) => ({
          id: element.id,
          tags: element.tags,
          geometry: element.geometry
            ? element.geometry.map((pt) => ({ lat: pt.lat, lng: pt.lon }))
            : undefined,
        })
      );
      setBuildings(blds);
      appendAreas(blds);
      setHasFetchedBuildings(true);
    } catch (error) {
      console.error("Error fetching building data:", error);
    } finally {
      setIsFetchingBuildings(false);
    }
  };

  // Automatically trigger building data fetch when entering Step 1 (Processing)
  useEffect(() => {
    if (
      step === 1 &&
      !hasFetchedBuildings &&
      !isFetchingBuildings &&
      areaData.length >= 2
    ) {
      requestBuildings();
    }
  }, [step, hasFetchedBuildings, isFetchingBuildings, areaData]);

  const handleClickNextStep = async () => {
    if (step === 0 && checkIsBig()) {
      setIsWarnModal(true);
      return;
    }
    if (step === 1 && (isFetchingBuildings || !hasFetchedBuildings)) return;
    setStep(step + 1);
  };

  const handleClickPrevStep = () => {
    setStep(step - 1);
  };

  const handleGlobalSearch = async (query: string) => {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", query);

      const response = await fetch(url.toString(), {
        headers: { "Accept-Language": "en" },
      });
      const results = await response.json();
      if (results && results.length > 0) {
        setSelectedLocation({
          lat: Number(results[0].lat),
          lng: Number(results[0].lon),
        });
        if (step !== 0) {
          setStep(0);
        }
      }
    } catch (e) {
      console.error("Search error:", e);
    }
  };

  useEffect(() => {
    checkFleetLogin();
  }, []);

  return (
    <div
      css={css({
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
      })}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <TopNav
        step={step}
        onResetDemo={handleResetDemo}
        onSearchSubmit={handleGlobalSearch}
        onToggleView={() => setStep(step === 2 ? 0 : 2)}
      />

      {/* 2. LEFT GIS SIDEBAR */}
      <LeftSidebar
        step={step}
        onSelectRegion={() => setStep(0)}
        onResetView={handleResetDemo}
        totalBuildingsCount={buildings.length}
      />

      {/* 3. MAIN VIEWPORT AREA */}
      <main
        css={css({
          position: "absolute",
          top: "3.25rem",
          bottom: "2rem",
          left: 0,
          right: 0,
          overflow: "hidden",
        })}
      >
        {/* Step 0: 2D Geospatial Bounding Region Selector */}
        {step === 0 && (
          <div
            css={css({
              position: "absolute",
              inset: 0,
              zIndex: 20,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            })}
          >
            <div
              css={css({
                width: "100%",
                maxWidth: "1100px",
                height: "85vh",
                maxHeight: "800px",
                backgroundColor: BG_PANEL,
                borderRadius: RADIUS_MD,
                border: `1px solid ${BORDER_COLOR}`,
                boxShadow: SHADOW_MD,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              })}
            >
              {/* Modal Header */}
              <div
                css={css({
                  padding: "0.85rem 1.25rem",
                  borderBottom: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: BG_PANEL_ALT,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                })}
              >
                <div>
                  <div css={css({ fontSize: "15px", fontWeight: 700, color: TEXT_PRIMARY })}>
                    Select Geographic Bounding Region
                  </div>
                  <div css={css({ fontSize: "11px", color: TEXT_SECONDARY, marginTop: "2px" })}>
                    Draw a bounding box or search a location to extract 3D cadastral parcels and building footprints.
                  </div>
                </div>

                <button
                  disabled={isNextButtonDisabled || isFetchingBuildings}
                  onClick={handleClickNextStep}
                  css={css({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1rem",
                    borderRadius: RADIUS_SM,
                    border: "none",
                    backgroundColor: isNextButtonDisabled ? "rgba(148, 163, 184, 0.3)" : ACCENT_PRIMARY,
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: isNextButtonDisabled ? "not-allowed" : "pointer",
                    boxShadow: isNextButtonDisabled ? "none" : "0 2px 4px rgba(37, 99, 235, 0.2)",
                  })}
                >
                  Generate 3D Cadastre <ChevronRight size={14} />
                </button>
              </div>

              {/* Map Search & 2D Leaflet Container */}
              <div css={css({ padding: "0.75rem 1rem 0" })}>
                <SearchBar
                  onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                />
              </div>

              <div css={css({ flex: 1, padding: "0.75rem 1rem 1rem", minHeight: 0 })}>
                <MapComponent
                  onRemove={handleRemove}
                  onDone={handleDone}
                  flyTarget={selectedLocation}
                  resetKey={resetKey}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Spatial Geometry Processing Dialog */}
        {step === 1 && (
          <div
            css={css({
              position: "absolute",
              inset: 0,
              zIndex: 20,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            })}
          >
            <div
              css={css({
                width: "100%",
                maxWidth: "680px",
                backgroundColor: BG_PANEL,
                borderRadius: RADIUS_MD,
                border: `1px solid ${BORDER_COLOR}`,
                boxShadow: SHADOW_MD,
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              })}
            >
              <div>
                <div css={css({ fontSize: "16px", fontWeight: 800, color: TEXT_PRIMARY })}>
                  Processing Spatial Cadastre Data
                </div>
                <div css={css({ fontSize: "12px", color: TEXT_SECONDARY, marginTop: "0.25rem" })}>
                  Querying OpenStreetMap Overpass vector layers and generating 3D vertical topology models.
                </div>
              </div>

              <BuildingHeights
                buildings={buildings}
                loading={isFetchingBuildings}
              />

              <div css={css({ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.5rem" })}>
                <button
                  onClick={handleClickPrevStep}
                  css={css({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.85rem",
                    borderRadius: RADIUS_SM,
                    border: `1px solid ${BORDER_COLOR}`,
                    backgroundColor: BG_PANEL,
                    color: TEXT_PRIMARY,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  })}
                >
                  <ChevronLeft size={14} /> Back to Region Selector
                </button>

                <button
                  disabled={isFetchingBuildings || !hasFetchedBuildings}
                  onClick={handleClickNextStep}
                  css={css({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1.1rem",
                    borderRadius: RADIUS_SM,
                    border: "none",
                    backgroundColor: isFetchingBuildings || !hasFetchedBuildings ? "rgba(148, 163, 184, 0.3)" : ACCENT_PRIMARY,
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: isFetchingBuildings || !hasFetchedBuildings ? "not-allowed" : "pointer",
                  })}
                >
                  {isFetchingBuildings ? (
                    <>
                      <Loader2 size={14} css={css({ animation: `${spinAnimation} 1s linear infinite` })} />
                      Processing Spatial Polygons...
                    </>
                  ) : (
                    <>
                      Enter 3D Cadastre Viewport <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3D WebGL Canvas Viewport (Space) */}
        <Space />

        {/* Movement Hint for Vehicle Mode */}
        <MovementHint isVisible={step === 2} />
      </main>

      {/* 4. RIGHT PROPERTY INFORMATION PANEL */}
      <PropertyPanel />

      {/* 5. BOTTOM TELEMETRY STATUS BAR */}
      <BottomStatusBar
        buildings={buildings}
        step={step}
        centerCoordinates={areaData}
      />

      {/* Area Too Big Warning Modal */}
      <Modal isOpen={isWarnModal} onClose={() => setIsWarnModal(false)}>
        <div css={css({ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem" })}>
          <div css={css({ display: "flex", alignItems: "center", gap: "0.75rem" })}>
            <div
              css={css({
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "999px",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "#d97706",
                display: "grid",
                placeItems: "center",
              })}
            >
              <AlertTriangle size={16} />
            </div>
            <div>
              <div css={css({ fontSize: "14px", fontWeight: 700, color: TEXT_PRIMARY })}>
                Large Geographic Area Selected
              </div>
              <div css={css({ fontSize: "12px", color: TEXT_SECONDARY, marginTop: "2px" })}>
                Selected polygon exceeds standard boundary thresholds. 3D generation may take several seconds.
              </div>
            </div>
          </div>

          <div css={css({ display: "flex", justifyContent: "flex-end", gap: "0.5rem" })}>
            <button
              onClick={() => setIsWarnModal(false)}
              css={css({
                padding: "0.45rem 0.85rem",
                borderRadius: RADIUS_SM,
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: BG_PANEL,
                color: TEXT_SECONDARY,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              })}
            >
              Adjust Area
            </button>
            <button
              onClick={() => {
                setIsWarnModal(false);
                setStep(1);
              }}
              css={css({
                padding: "0.45rem 1rem",
                borderRadius: RADIUS_SM,
                border: "none",
                backgroundColor: ACCENT_PRIMARY,
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              })}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </Modal>

      {/* Fleet Cloud Space Destination Modal */}
      <Modal isOpen={isFleetModal} onClose={() => setIsFleetModal(false)}>
        <div css={css({ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "0.5rem" })}>
          <div css={css({ fontSize: "14px", fontWeight: 700, color: TEXT_PRIMARY })}>
            Select Destination Cloud Space
          </div>
          <div css={css({ fontSize: "12px", color: TEXT_SECONDARY })}>
            Pick a workspace destination for the exported binary 3D model.
          </div>
          <div css={css({ display: "grid", gap: "0.4rem", maxHeight: "200px", overflowY: "auto" })}>
            {spaceList.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  putGlbOnFleetSpace(item.id);
                  setIsFleetModal(false);
                }}
                css={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: RADIUS_SM,
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: BG_PANEL,
                  color: TEXT_PRIMARY,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  ":hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                    borderColor: ACCENT_PRIMARY,
                  },
                })}
              >
                <Layers3 size={14} color={ACCENT_PRIMARY} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
