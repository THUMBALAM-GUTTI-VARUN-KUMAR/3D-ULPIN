import React from "react";
import { css } from "@emotion/react";
import {
  Building2,
  MapPin,
  Globe2,
  Database,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";
import {
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG_PANEL,
  ACCENT_PRIMARY,
  RADIUS_SM,
} from "@/theme/color";
import { useLayerStore } from "@/state/layerStore";
import type { Building } from "@/components/map/Processing";

interface BottomStatusBarProps {
  buildings: Building[];
  step: number;
  centerCoordinates?: { lat: number; lng: number }[];
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  buildings,
  step,
  centerCoordinates,
}) => {
  const selectedBuilding = useLayerStore((s) => s.selectedBuilding);

  const totalBuildings = buildings.length;
  const withHeight = buildings.filter((b) => b.tags.height).length;

  const coordString =
    centerCoordinates && centerCoordinates.length >= 2
      ? `${centerCoordinates[0].lat.toFixed(4)}°N, ${centerCoordinates[0].lng.toFixed(4)}°E`
      : "Spatial Coordinates Unset";

  return (
    <footer
      css={css({
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "2rem",
        backgroundColor: BG_PANEL,
        borderTop: `1px solid ${BORDER_COLOR}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        fontSize: "11px",
        color: TEXT_SECONDARY,
        zIndex: 40,
        userSelect: "none",
      })}
    >
      {/* Left items: Counts & Selection */}
      <div css={css({ display: "flex", alignItems: "center", gap: "1.25rem" })}>
        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <Building2 size={13} color={ACCENT_PRIMARY} />
          <span>
            Buildings: <strong css={css({ color: TEXT_PRIMARY })}>{totalBuildings}</strong>
          </span>
        </div>

        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <Layers size={13} color={TEXT_MUTED} />
          <span>
            With Height: <strong css={css({ color: TEXT_PRIMARY })}>{withHeight}</strong>
          </span>
        </div>

        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <Compass size={13} color={TEXT_MUTED} />
          <span>
            Selected:{" "}
            <strong css={css({ color: selectedBuilding ? ACCENT_PRIMARY : TEXT_MUTED, fontFamily: "monospace" })}>
              {selectedBuilding ? (selectedBuilding.baseUlpin || `ID #${selectedBuilding.buildingId}`) : "None"}
            </strong>
          </span>
        </div>
      </div>

      {/* Right items: Mode, Provider, Database */}
      <div css={css({ display: "flex", alignItems: "center", gap: "1.25rem" })}>
        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <MapPin size={13} color={TEXT_MUTED} />
          <span css={css({ fontFamily: "monospace" })}>{coordString}</span>
        </div>

        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <Globe2 size={13} color={TEXT_MUTED} />
          <span>
            View: <strong css={css({ color: TEXT_PRIMARY })}>{step === 2 ? "3D Cadastre" : "2D Map Selector"}</strong>
          </span>
        </div>

        <div css={css({ display: "flex", alignItems: "center", gap: "0.35rem" })}>
          <span
            css={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              color: "#16a34a",
              fontWeight: 700,
              fontSize: "10px",
            })}
          >
            <CheckCircle2 size={11} /> OpenStreetMap & Supabase PostGIS
          </span>
        </div>
      </div>
    </footer>
  );
};
