import React, { useState } from "react";
import { css } from "@emotion/react";
import {
  Building2,
  Layers,
  MapPin,
  Ruler,
  AlertTriangle,
  Scissors,
  X,
  Copy,
  Check,
  BookmarkPlus,
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
import {
  ANNOTATION_COLORS,
  BuildingAnnotationColor,
  useBuildingAnnotationStore,
} from "@/state/buildingAnnotationStore";

export const PropertyPanel: React.FC = () => {
  const selectedBuilding = useLayerStore((s) => s.selectedBuilding);
  const setSelectedBuilding = useLayerStore((s) => s.setSelectedBuilding);
  const isolatedFloor = useLayerStore((s) => s.isolatedFloor);
  const setIsolatedFloor = useLayerStore((s) => s.setIsolatedFloor);
  const isPropertyPanelOpen = useLayerStore((s) => s.isPropertyPanelOpen);
  const setPropertyPanelOpen = useLayerStore((s) => s.setPropertyPanelOpen);

  const toggleHidden = useHiddenStore((s) => s.toggleHidden);

  const [copiedUlpin, setCopiedUlpin] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNotes, setAnnotationNotes] = useState("");
  const [annotationColor, setAnnotationColor] =
    useState<BuildingAnnotationColor>("red");

  const annotation = useBuildingAnnotationStore((s) =>
    selectedBuilding ? s.annotations[selectedBuilding.buildingId] : undefined
  );
  const upsertAnnotation = useBuildingAnnotationStore(
    (s) => s.upsertAnnotation
  );
  const removeAnnotation = useBuildingAnnotationStore(
    (s) => s.removeAnnotation
  );

  if (!isPropertyPanelOpen) return null;

  const handleCopyBaseUlpin = () => {
    if (selectedBuilding?.baseUlpin) {
      navigator.clipboard.writeText(selectedBuilding.baseUlpin);
      setCopiedUlpin(true);
      setTimeout(() => setCopiedUlpin(false), 2000);
    }
  };

  const handleCutBuilding = () => {
    if (selectedBuilding) {
      toggleHidden(selectedBuilding.buildingId);
      setSelectedBuilding(null);
    }
  };

  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding || !annotationTitle.trim()) return;
    upsertAnnotation({
      buildingId: selectedBuilding.buildingId,
      title: annotationTitle.trim(),
      notes: annotationNotes.trim(),
      color: annotationColor,
    });
    setShowAnnotationForm(false);
  };

  const handleOpenAnnotation = () => {
    if (annotation) {
      setAnnotationTitle(annotation.title);
      setAnnotationNotes(annotation.notes);
      setAnnotationColor(annotation.color);
    } else {
      setAnnotationTitle("");
      setAnnotationNotes("");
      setAnnotationColor("red");
    }
    setShowAnnotationForm(true);
  };

  return (
    <aside
      css={css({
        position: "absolute",
        top: "3.5rem",
        right: "1rem",
        bottom: "2.5rem",
        width: "340px",
        backgroundColor: BG_PANEL,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: RADIUS_MD,
        boxShadow: SHADOW_MD,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      })}
    >
      {/* Header */}
      <div
        css={css({
          padding: "0.85rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${BORDER_COLOR}`,
          backgroundColor: BG_PANEL_ALT,
        })}
      >
        <div css={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}>
          <Building2 size={16} color={ACCENT_PRIMARY} />
          <span
            css={css({
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: TEXT_PRIMARY,
            })}
          >
            PROPERTY INFORMATION
          </span>
        </div>
        <button
          onClick={() => setPropertyPanelOpen(false)}
          title="Close panel"
          css={css({
            background: "none",
            border: "none",
            color: TEXT_MUTED,
            cursor: "pointer",
            padding: "0.2rem",
            borderRadius: RADIUS_SM,
            display: "grid",
            placeItems: "center",
            ":hover": {
              backgroundColor: BG_SURFACE_HOVER,
              color: TEXT_PRIMARY,
            },
          })}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div
        css={css({
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        })}
      >
        {!selectedBuilding ? (
          <div
            css={css({
              textAlign: "center",
              padding: "3rem 1rem",
              color: TEXT_MUTED,
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            })}
          >
            <Building2 size={36} strokeWidth={1.5} color={TEXT_MUTED} />
            <div>
              <div css={css({ fontWeight: 700, color: TEXT_PRIMARY, marginBottom: "0.25rem" })}>
                Select a building
              </div>
              <div>Select a building to view property information.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Building Overview */}
            <div
              css={css({
                padding: "0.85rem",
                borderRadius: RADIUS_SM,
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: BG_PANEL_ALT,
              })}
            >
              <div
                css={css({
                  fontSize: "14px",
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  marginBottom: "0.25rem",
                })}
              >
                {selectedBuilding.tags.name || `Building #${selectedBuilding.buildingId}`}
              </div>
              <div css={css({ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.35rem" })}>
                <span
                  css={css({
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: ACCENT_PRIMARY,
                    textTransform: "capitalize",
                  })}
                >
                  {selectedBuilding.tags.building || "Building"}
                </span>
                {selectedBuilding.tags.amenity && (
                  <span
                    css={css({
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                      backgroundColor: "rgba(13, 148, 136, 0.1)",
                      color: "#0d9488",
                    })}
                  >
                    {selectedBuilding.tags.amenity}
                  </span>
                )}
              </div>
            </div>

            {/* BASE ULPIN (High Visual Priority Card) */}
            <div
              css={css({
                padding: "0.85rem",
                borderRadius: RADIUS_SM,
                border: `1px solid rgba(37, 99, 235, 0.25)`,
                backgroundColor: "rgba(37, 99, 235, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              })}
            >
              <div
                css={css({
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: ACCENT_PRIMARY,
                })}
              >
                BASE ULPIN
              </div>
              <div
                css={css({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                })}
              >
                <span
                  css={css({
                    fontSize: "14px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: TEXT_PRIMARY,
                    letterSpacing: "0.02em",
                  })}
                >
                  {selectedBuilding.baseUlpin || "Generating..."}
                </span>

                {selectedBuilding.baseUlpin && (
                  <button
                    onClick={handleCopyBaseUlpin}
                    title="Copy Base ULPIN"
                    css={css({
                      border: "none",
                      backgroundColor: copiedUlpin ? "#16a34a" : ACCENT_PRIMARY,
                      color: "#ffffff",
                      padding: "0.3rem 0.55rem",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s ease",
                    })}
                  >
                    {copiedUlpin ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUlpin ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            {/* Cadastral Identifiers */}
            <div>
              <div
                css={css({
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: TEXT_MUTED,
                  marginBottom: "0.45rem",
                })}
              >
                Cadastral Identifiers
              </div>

              <div css={css({ display: "grid", gap: "0.35rem", fontSize: "12px" })}>
                <DataRow
                  label="Parcel ID"
                  value={selectedBuilding.parcelId ? `#${selectedBuilding.parcelId}` : "Not available"}
                />
                <DataRow
                  label="Building ID"
                  value={selectedBuilding.dbBuildingId ? `#${selectedBuilding.dbBuildingId}` : `#${selectedBuilding.buildingId}`}
                />
                <DataRow
                  label="OSM ID"
                  value={selectedBuilding.osmId ? String(selectedBuilding.osmId) : "Not available"}
                />
                <DataRow
                  label="Physical Height"
                  value={selectedBuilding.height ? `${selectedBuilding.height.toFixed(1)} m` : "Not available"}
                />
                <DataRow
                  label="Floor Count"
                  value={`${selectedBuilding.floorCount} Level${selectedBuilding.floorCount > 1 ? "s" : ""}`}
                />
                <DataRow
                  label="Coordinates"
                  value={`${selectedBuilding.rawCenter.lat.toFixed(5)}, ${selectedBuilding.rawCenter.lng.toFixed(5)}`}
                />
              </div>
            </div>

            {/* Topology Discrepancy Alert */}
            {selectedBuilding.isFlagged && (
              <div
                css={css({
                  display: "flex",
                  gap: "0.6rem",
                  padding: "0.65rem 0.75rem",
                  borderRadius: RADIUS_SM,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#b45309",
                  fontSize: "11px",
                  lineHeight: 1.4,
                })}
              >
                <AlertTriangle size={15} css={css({ flexShrink: 0, marginTop: "2px" })} />
                <div>
                  <strong>Topology Flag:</strong> Physical height ({selectedBuilding.height.toFixed(1)}m) diverges from standard {selectedBuilding.floorCount * 3}m projection.
                </div>
              </div>
            )}

            {/* VERTICAL STRUCTURE */}
            <div>
              <div
                css={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.45rem",
                })}
              >
                <span
                  css={css({
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: TEXT_MUTED,
                  })}
                >
                  VERTICAL STRUCTURE
                </span>
                <span css={css({ fontSize: "11px", color: TEXT_PRIMARY, fontWeight: 700 })}>
                  {selectedBuilding.floors ? `${selectedBuilding.floors.length} Floors` : `${selectedBuilding.floorCount} Floors`}
                </span>
              </div>

              <div
                css={css({
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  maxHeight: "220px",
                  overflowY: "auto",
                  paddingRight: "0.2rem",
                })}
              >
                {selectedBuilding.floors && selectedBuilding.floors.length > 0 ? (
                  selectedBuilding.floors
                    .slice()
                    .sort((a, b) => b.floor_number - a.floor_number)
                    .map((floor) => {
                      const isIsolated = isolatedFloor === floor.floor_number;
                      return (
                        <div
                          key={floor.floor_number}
                          onClick={() => setIsolatedFloor(isIsolated ? null : floor.floor_number)}
                          css={css({
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                            padding: "0.45rem 0.6rem",
                            borderRadius: RADIUS_SM,
                            border: `1px solid ${isIsolated ? ACCENT_PRIMARY : BORDER_COLOR}`,
                            backgroundColor: isIsolated ? "rgba(37, 99, 235, 0.08)" : BG_PANEL,
                            fontSize: "11px",
                            fontFamily: "monospace",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            ":hover": {
                              borderColor: ACCENT_PRIMARY,
                              backgroundColor: isIsolated ? "rgba(37, 99, 235, 0.12)" : BG_PANEL_ALT,
                            },
                          })}
                        >
                          <div css={css({ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 })}>
                            <span
                              css={css({
                                fontWeight: 700,
                                color: isIsolated ? ACCENT_PRIMARY : TEXT_PRIMARY,
                                fontFamily: "sans-serif",
                                minWidth: "50px",
                              })}
                            >
                              Floor {floor.floor_number}
                            </span>
                            <span
                              css={css({
                                color: TEXT_SECONDARY,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              })}
                              title={floor.floor_ulpin}
                            >
                              {floor.floor_ulpin}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsolatedFloor(isIsolated ? null : floor.floor_number);
                            }}
                            title={isIsolated ? "Show entire building" : `Isolate Floor ${floor.floor_number}`}
                            css={css({
                              border: "none",
                              backgroundColor: isIsolated ? ACCENT_PRIMARY : "rgba(100, 116, 139, 0.1)",
                              color: isIsolated ? "#ffffff" : TEXT_SECONDARY,
                              padding: "0.2rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              fontFamily: "sans-serif",
                              cursor: "pointer",
                              ":hover": {
                                backgroundColor: isIsolated ? "#1d4ed8" : "rgba(100, 116, 139, 0.2)",
                              },
                            })}
                          >
                            {isIsolated ? "Isolating" : "Isolate"}
                          </button>
                        </div>
                      );
                    })
                ) : (
                  <div css={css({ fontSize: "11px", color: TEXT_MUTED, padding: "0.5rem 0" })}>
                    Generating floor-level ULPIN records...
                  </div>
                )}
              </div>
            </div>

            {/* Annotation Section */}
            {annotation && !showAnnotationForm && (
              <div
                css={css({
                  padding: "0.75rem",
                  borderRadius: RADIUS_SM,
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: BG_PANEL_ALT,
                })}
              >
                <div
                  css={css({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.3rem",
                  })}
                >
                  <div css={css({ display: "flex", alignItems: "center", gap: "0.4rem" })}>
                    <span
                      css={css({
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        backgroundColor: ANNOTATION_COLORS[annotation.color],
                      })}
                    />
                    <span css={css({ fontSize: "12px", fontWeight: 700, color: TEXT_PRIMARY })}>
                      {annotation.title}
                    </span>
                  </div>
                  <div css={css({ display: "flex", gap: "0.4rem" })}>
                    <button
                      onClick={handleOpenAnnotation}
                      css={css({
                        border: "none",
                        background: "none",
                        color: ACCENT_PRIMARY,
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      })}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeAnnotation(selectedBuilding.buildingId)}
                      css={css({
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {annotation.notes && (
                  <div css={css({ fontSize: "11px", color: TEXT_SECONDARY, lineHeight: 1.4 })}>
                    {annotation.notes}
                  </div>
                )}
              </div>
            )}

            {showAnnotationForm && (
              <form
                onSubmit={handleSaveAnnotation}
                css={css({
                  display: "grid",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  borderRadius: RADIUS_SM,
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: BG_PANEL_ALT,
                })}
              >
                <div css={css({ fontSize: "11px", fontWeight: 700, color: TEXT_PRIMARY })}>
                  {annotation ? "Edit Cadastral Note" : "Attach Cadastral Pin"}
                </div>
                <input
                  value={annotationTitle}
                  onChange={(e) => setAnnotationTitle(e.target.value)}
                  placeholder="Note title (e.g. Survey #402)"
                  maxLength={48}
                  css={css({
                    fontSize: "12px",
                    padding: "0.4rem 0.5rem",
                    borderRadius: RADIUS_SM,
                    border: `1px solid ${BORDER_COLOR}`,
                    outline: "none",
                    backgroundColor: BG_PANEL,
                    color: TEXT_PRIMARY,
                  })}
                />
                <textarea
                  value={annotationNotes}
                  onChange={(e) => setAnnotationNotes(e.target.value)}
                  placeholder="Additional survey details..."
                  rows={2}
                  maxLength={200}
                  css={css({
                    fontSize: "12px",
                    padding: "0.4rem 0.5rem",
                    borderRadius: RADIUS_SM,
                    border: `1px solid ${BORDER_COLOR}`,
                    outline: "none",
                    backgroundColor: BG_PANEL,
                    color: TEXT_PRIMARY,
                    resize: "vertical",
                  })}
                />
                <div css={css({ display: "flex", gap: "0.4rem", alignItems: "center" })}>
                  {(Object.keys(ANNOTATION_COLORS) as BuildingAnnotationColor[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAnnotationColor(key)}
                      css={css({
                        width: "18px",
                        height: "18px",
                        borderRadius: "999px",
                        border: annotationColor === key ? "2px solid #0f172a" : "1px solid rgba(0,0,0,0.1)",
                        backgroundColor: ANNOTATION_COLORS[key],
                        cursor: "pointer",
                      })}
                    />
                  ))}
                  <div css={css({ marginLeft: "auto", display: "flex", gap: "0.35rem" })}>
                    <button
                      type="button"
                      onClick={() => setShowAnnotationForm(false)}
                      css={css({
                        fontSize: "11px",
                        padding: "0.3rem 0.55rem",
                        borderRadius: RADIUS_SM,
                        border: `1px solid ${BORDER_COLOR}`,
                        backgroundColor: BG_PANEL,
                        cursor: "pointer",
                      })}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!annotationTitle.trim()}
                      css={css({
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "0.3rem 0.65rem",
                        borderRadius: RADIUS_SM,
                        border: "none",
                        backgroundColor: ACCENT_PRIMARY,
                        color: "#ffffff",
                        cursor: annotationTitle.trim() ? "pointer" : "not-allowed",
                      })}
                    >
                      Save Pin
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Action Buttons */}
            <div css={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "auto" })}>
              {!annotation && !showAnnotationForm && (
                <button
                  onClick={handleOpenAnnotation}
                  css={css({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    padding: "0.55rem",
                    borderRadius: RADIUS_SM,
                    border: `1px solid ${BORDER_COLOR}`,
                    backgroundColor: BG_PANEL,
                    color: TEXT_PRIMARY,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    ":hover": {
                      backgroundColor: BG_SURFACE_HOVER,
                    },
                  })}
                >
                  <BookmarkPlus size={14} />
                  Add Note
                </button>
              )}

              <button
                onClick={handleCutBuilding}
                css={css({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.55rem",
                  borderRadius: RADIUS_SM,
                  border: `1px solid rgba(220, 38, 38, 0.2)`,
                  backgroundColor: "rgba(220, 38, 38, 0.04)",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  gridColumn: !annotation && !showAnnotationForm ? undefined : "1 / -1",
                  ":hover": {
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                  },
                })}
              >
                <Scissors size={14} />
                Cut / Hide Building
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      css={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.35rem 0.5rem",
        borderRadius: RADIUS_SM,
        backgroundColor: BG_PANEL_ALT,
        border: `1px solid ${BORDER_COLOR}`,
      })}
    >
      <span css={css({ color: TEXT_SECONDARY, fontSize: "11px", fontWeight: 500 })}>
        {label}
      </span>
      <span
        css={css({
          fontWeight: 700,
          color: TEXT_PRIMARY,
          fontFamily: label.includes("OSM") || label.includes("Coordinates") ? "monospace" : "inherit",
          fontSize: "11px",
          textAlign: "right",
          maxWidth: "180px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        })}
      >
        {value}
      </span>
    </div>
  );
}
