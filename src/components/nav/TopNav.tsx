import React, { useState } from "react";
import { css } from "@emotion/react";
import {
  Layers3,
  CarFront,
  RotateCcw,
  Download,
  Search,
  SlidersHorizontal,
  User,
  MapPin,
  HelpCircle,
  Eye,
  CheckCircle2,
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
  SHADOW_SM,
  RADIUS_SM,
  RADIUS_MD,
} from "@/theme/color";
import { useCarStore } from "@/state/carStore";
import { useActionStore } from "@/state/exportStore";
import { useLayerStore } from "@/state/layerStore";

interface TopNavProps {
  step: number;
  onResetDemo?: () => void;
  onSearchSubmit?: (query: string) => void;
  onToggleView?: () => void;
  isExporting?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  step,
  onResetDemo,
  onSearchSubmit,
  onToggleView,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const setThirdMode = useCarStore((state) => state.setThirdMode);
  const thirdMode = useCarStore((state) => state.thirdMode);
  const setExportType = useActionStore((state) => state.setExportType);

  const handleExportGLB = () => {
    setExportType("glb");
    window.VPMSExportModel?.("glb");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  return (
    <header
      css={css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3.25rem",
        backgroundColor: BG_PANEL,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        boxShadow: SHADOW_SM,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        userSelect: "none",
      })}
    >
      {/* Brand / Logo */}
      <div css={css({ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "260px" })}>
        <div
          css={css({
            width: "2.1rem",
            height: "2.1rem",
            borderRadius: RADIUS_SM,
            backgroundColor: "#1e3a8a",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            flexShrink: 0,
            boxShadow: "0 2px 4px rgba(30, 58, 138, 0.2)",
          })}
        >
          <Layers3 size={16} />
        </div>

        <div>
          <div
            css={css({
              fontSize: "14px",
              fontWeight: 800,
              color: TEXT_PRIMARY,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            })}
          >
            3D ULPIN
            <span
              css={css({
                fontSize: "9px",
                padding: "0.1rem 0.35rem",
                borderRadius: "3px",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: ACCENT_PRIMARY,
                fontWeight: 700,
              })}
            >
              GIS v2.0
            </span>
          </div>
          <div
            css={css({
              fontSize: "10px",
              fontWeight: 500,
              color: TEXT_MUTED,
              lineHeight: 1.2,
            })}
          >
            Vertical Property Mapping System
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        css={css({
          flex: 1,
          maxWidth: "420px",
          position: "relative",
          margin: "0 1rem",
        })}
      >
        <Search
          size={14}
          color={TEXT_MUTED}
          css={css({
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          })}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location, ULPIN, Parcel ID, or OSM ID..."
          css={css({
            width: "100%",
            height: "2.1rem",
            padding: "0 0.75rem 0 2.2rem",
            borderRadius: RADIUS_SM,
            border: `1px solid ${BORDER_COLOR}`,
            backgroundColor: BG_PANEL_ALT,
            fontSize: "12px",
            color: TEXT_PRIMARY,
            outline: "none",
            transition: "all 0.15s ease",
            ":focus": {
              backgroundColor: BG_PANEL,
              borderColor: ACCENT_PRIMARY,
              boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.15)",
            },
          })}
        />
      </form>

      {/* Right Controls / Actions */}
      <div css={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}>
        {/* Step / Mode Indicator */}
        <button
          onClick={onToggleView}
          title="Toggle 2D Selector / 3D Cadastre"
          css={css({
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            borderRadius: RADIUS_SM,
            border: `1px solid ${BORDER_COLOR}`,
            backgroundColor: BG_PANEL_ALT,
            color: TEXT_PRIMARY,
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            ":hover": {
              backgroundColor: BG_SURFACE_HOVER,
            },
          })}
        >
          <span
            css={css({
              width: "7px",
              height: "7px",
              borderRadius: "999px",
              backgroundColor: step === 2 ? "#16a34a" : "#2563eb",
            })}
          />
          {step === 2 ? "3D Cadastre" : "2D Selector"}
        </button>

        {/* Car / Drive Mode */}
        {step === 2 && (
          <button
            onClick={() => setThirdMode(!thirdMode)}
            title={thirdMode ? "Exit Vehicle Drive Mode" : "Explore in Vehicle Drive Mode"}
            css={css({
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              borderRadius: RADIUS_SM,
              border: `1px solid ${thirdMode ? ACCENT_PRIMARY : BORDER_COLOR}`,
              backgroundColor: thirdMode ? "rgba(37, 99, 235, 0.1)" : BG_PANEL,
              color: thirdMode ? ACCENT_PRIMARY : TEXT_PRIMARY,
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              ":hover": {
                backgroundColor: thirdMode ? "rgba(37, 99, 235, 0.15)" : BG_SURFACE_HOVER,
              },
            })}
          >
            <CarFront size={14} />
            <span>{thirdMode ? "Exit Drive" : "Drive View"}</span>
          </button>
        )}

        {/* Export GLB */}
        {step === 2 && (
          <button
            onClick={handleExportGLB}
            title="Export 3D Model as GLTF/GLB"
            css={css({
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              borderRadius: RADIUS_SM,
              border: "1px solid #1d4ed8",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
              ":hover": {
                backgroundColor: "#1d4ed8",
              },
            })}
          >
            <Download size={13} />
            <span>Export GLB</span>
          </button>
        )}

        {/* Reset Demo */}
        <button
          onClick={onResetDemo}
          title="Reset View & Clear Selection"
          css={css({
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.4rem 0.65rem",
            borderRadius: RADIUS_SM,
            border: `1px solid ${BORDER_COLOR}`,
            backgroundColor: BG_PANEL,
            color: TEXT_SECONDARY,
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            ":hover": {
              backgroundColor: BG_SURFACE_HOVER,
              color: TEXT_PRIMARY,
            },
          })}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
