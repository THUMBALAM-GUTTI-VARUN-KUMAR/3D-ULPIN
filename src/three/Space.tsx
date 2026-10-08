import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useAreaStore } from "@/state/areaStore";
import { Html, Sky, Environment, Line } from "@react-three/drei";
import * as THREE from "three";
import { useActionStore } from "@/state/exportStore";
import { GLTFExporter } from "three/examples/jsm/Addons.js";
import Car from "./Car";
import instanceFleet from "@/api/axios";
import { create } from "zustand";
import {
  getOrCreateBuilding,
  getOrCreateFloors,
  getOrCreateParcel,
} from "@/api/supabase";
import { generateBaseUlpin } from "@/utils/ulpin";
import { checkHeightFloorMismatch } from "@/utils/validation";
import {
  ANNOTATION_COLORS,
  BuildingAnnotationColor,
  useBuildingAnnotationStore,
} from "@/state/buildingAnnotationStore";
import { useLayerStore } from "@/state/layerStore";

const SCALE = 51000;

// ─── Hidden Buildings Store ───
interface HiddenStore {
  hiddenIds: Set<number>;
  selectedBuildingId: number | null;
  toggleHidden: (id: number) => void;
  selectBuilding: (id: number | null) => void;
  showAll: () => void;
  hiddenCount: () => number;
}

export const useHiddenStore = create<HiddenStore>((set, get) => ({
  hiddenIds: new Set(),
  selectedBuildingId: null,
  toggleHidden: (id) =>
    set((state) => {
      const next = new Set(state.hiddenIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        hiddenIds: next,
        selectedBuildingId:
          state.selectedBuildingId === id ? null : state.selectedBuildingId,
      };
    }),
  selectBuilding: (id) => set({ selectedBuildingId: id }),
  showAll: () => set({ hiddenIds: new Set() }),
  hiddenCount: () => get().hiddenIds.size,
}));

// ─── Color palette for building types ───
const BUILDING_COLORS: Record<string, string> = {
  residential: "#b8a99a",
  apartments: "#b0a090",
  commercial: "#a0aab0",
  retail: "#a5b0a8",
  industrial: "#8a9098",
  office: "#9aa5b0",
  church: "#c8b8a0",
  school: "#a0b0a0",
  university: "#98a8a0",
  hospital: "#b0a0a8",
  default: "#9da0a3",
};

const HOVERED_COLOR = "#d4c8b8";
const SELECTED_COLOR = "#38b2ac";

function getBuildingColor(tags: Record<string, string | undefined>): string {
  const buildingType = tags.building ?? "default";
  return BUILDING_COLORS[buildingType] ?? BUILDING_COLORS.default;
}

// ─── Coordinate Projection ───
function createProjection(refLat: number, refLng: number) {
  return (lat: number, lng: number): THREE.Vector2 => {
    const x = (lng - refLng) * SCALE * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * SCALE;
    return new THREE.Vector2(x, y);
  };
}

// ─── Building Component ───
interface BuildingProps {
  shape: THREE.Shape;
  extrudeSettings: { steps: number; depth: number; bevelEnabled: boolean };
  tags: Record<string, string | undefined>;
  buildingId: number;
  markerPosition: THREE.Vector3;
  rawCenter: { lat: number; lng: number };
  floorCount: number;
}

function Building({
  shape,
  extrudeSettings,
  tags,
  buildingId,
  markerPosition,
  rawCenter,
  floorCount,
}: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState<THREE.Vector3 | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationTitle, setAnnotationTitle] = useState("");
  const [annotationNotes, setAnnotationNotes] = useState("");
  const [annotationColor, setAnnotationColor] =
    useState<BuildingAnnotationColor>("red");
  const [floors, setFloors] = useState<
    { floor_number: number; floor_ulpin: string; flag: boolean }[]
  >([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [buildingInfo, setBuildingInfo] = useState<{
    dbId: number;
    osmId: number;
    parcelId: number;
    baseUlpin: string;
  } | null>(null);

  const toggleHidden = useHiddenStore((s) => s.toggleHidden);
  const selectedBuildingId = useHiddenStore((s) => s.selectedBuildingId);
  const selectBuilding = useHiddenStore((s) => s.selectBuilding);
  const setSelectedBuilding = useLayerStore((s) => s.setSelectedBuilding);
  const updateSelectedFloors = useLayerStore((s) => s.updateSelectedFloors);
  const updateSelectedDbInfo = useLayerStore((s) => s.updateSelectedDbInfo);
  const showLabels = useLayerStore((s) => s.showLabels);

  const annotation = useBuildingAnnotationStore(
    (s) => s.annotations[buildingId]
  );
  const upsertAnnotation = useBuildingAnnotationStore(
    (s) => s.upsertAnnotation
  );
  const removeAnnotation = useBuildingAnnotationStore(
    (s) => s.removeAnnotation
  );
  const selected = selectedBuildingId === buildingId;

  const handleBuildingClick = async () => {
    const nextSelected = !selected;
    selectBuilding(nextSelected ? buildingId : null);
    if (!nextSelected) {
      setSelectedBuilding(null);
      return;
    }

    const baseUlpin = generateBaseUlpin(rawCenter.lat, rawCenter.lng);
    const flagged = checkHeightFloorMismatch(
      extrudeSettings.depth,
      floorCount
    );

    setSelectedBuilding({
      buildingId,
      osmId: buildingId,
      tags,
      height: extrudeSettings.depth,
      floorCount,
      rawCenter,
      baseUlpin,
      isFlagged: flagged,
    });

    setLoadingFloors(true);

    const parcel = await getOrCreateParcel(
      baseUlpin,
      rawCenter.lat,
      rawCenter.lng
    );

    if (!parcel) {
      setLoadingFloors(false);
      return;
    }

    const building = await getOrCreateBuilding(
      buildingId,
      tags.name || "Unnamed Building",
      floorCount,
      parcel.id
    );

    if (building) {
      setBuildingInfo({
        dbId: building.id,
        osmId: buildingId,
        parcelId: parcel.id,
        baseUlpin,
      });
      updateSelectedDbInfo({
        dbBuildingId: building.id,
        parcelId: parcel.id,
        baseUlpin,
      });

      const floorRows = await getOrCreateFloors(
        building.id,
        baseUlpin,
        floorCount,
        flagged
      );
      setFloors(floorRows);
      updateSelectedFloors(floorRows, flagged);
    }
    setLoadingFloors(false);
  };

  const baseColor = getBuildingColor(tags);
  const displayColor =
    selected ? SELECTED_COLOR : hovered ? HOVERED_COLOR : baseColor;

  const hasAnyData =
    tags.name ||
    (tags.building && tags.building !== "yes") ||
    tags.height ||
    tags["building:levels"] ||
    tags.amenity ||
    tags["addr:street"];

  const closePopup = () => {
    setHovered(false);
    setShowAdditionalInfo(false);
    setShowTranslations(false);
    setShowAnnotationForm(false);
    selectBuilding(null);
    setSelectedBuilding(null);
  };

  const openAnnotationEditor = () => {
    setShowAdditionalInfo(false);
    setShowTranslations(false);
    setAnnotationTitle(annotation?.title ?? "");
    setAnnotationNotes(annotation?.notes ?? "");
    setAnnotationColor(annotation?.color ?? "red");
    setShowAnnotationForm(true);
  };

  return (
    <>
      {annotation && showLabels && (
        <group position={markerPosition}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 8, 12]} />
            <meshBasicMaterial
              color={ANNOTATION_COLORS[annotation.color]}
              transparent
              opacity={0.42}
            />
          </mesh>
          <pointLight
            color={ANNOTATION_COLORS[annotation.color]}
            intensity={0.75}
            distance={18}
          />
          <Html position={[0, 8.5, 0]} center>
            <div
              style={{
                maxWidth: "160px",
                padding: "4px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.88)",
                border: `1px solid ${ANNOTATION_COLORS[annotation.color]}44`,
                color: "#111827",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.14)",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: 1.25,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                pointerEvents: "none",
              }}
            >
              {annotation.title}
            </div>
          </Html>
        </group>
      )}

      <mesh
        onPointerOver={(e) => {
          setHovered(true);
          e.stopPropagation();
        }}
        onPointerOut={(e) => {
          setHovered(false);
          e.stopPropagation();
        }}
        onClick={(e) => {
          handleBuildingClick();
          e.stopPropagation();
        }}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ exportToGLB: true }}
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={displayColor}
          transparent={selected && useLayerStore.getState().isolatedFloor !== null}
          opacity={selected && useLayerStore.getState().isolatedFloor !== null ? 0.35 : 1.0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 3D Isolated Floor Highlight */}
      {selected && useLayerStore.getState().isolatedFloor !== null && (
        <mesh
          position={[
            0,
            (useLayerStore.getState().isolatedFloor ?? 0) *
              (extrudeSettings.depth / Math.max(1, floorCount)),
            0,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <extrudeGeometry
            args={[
              shape,
              {
                steps: 1,
                depth: extrudeSettings.depth / Math.max(1, floorCount),
                bevelEnabled: false,
              },
            ]}
          />
          <meshStandardMaterial
            color="#2563eb"
            emissive="#1d4ed8"
            emissiveIntensity={0.5}
            roughness={0.2}
          />
        </mesh>
      )}
    </>
  );
}

// ─── Helpers ───
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        margin: "4px 0",
      }}
    >
      <span style={{ fontWeight: "500", color: "#5f6368" }}>{label}:</span>
      <span style={{ textTransform: "capitalize" }}>{value}</span>
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    building: "Type",
    height: "Height",
    "building:levels": "Levels",
    amenity: "Facility",
    denomination: "Denomination",
  };
  return (
    labels[key] ??
    key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
  );
}

// ─── Road Colors ───
const ROAD_COLORS: Record<string, string> = {
  motorway: "#ffffff",
  trunk: "#e0e0e0",
  primary: "#d0d0d0",
  secondary: "#a0a0a0",
  tertiary: "#808080",
  residential: "#606060",
  service: "#505050",
  footway: "#404040",
  path: "#383838",
  default: "#34f516",
};

interface RoadElement {
  id: number;
  tags: Record<string, string | undefined>;
  geometry?: { lat: number; lon: number }[];
}

function Roads({
  area,
}: {
  area: { lat: number; lng: number }[] | undefined;
}) {
  const [roads, setRoads] = useState<RoadElement[]>([]);
  const showRoads = useLayerStore((s) => s.showRoads);

  if (!area || area.length < 2 || !showRoads) return null;

  const refLat = (area[1].lat + area[0].lat) / 2;
  const refLng = (area[1].lng + area[0].lng) / 2;
  const project = createProjection(refLat, refLng);

  useEffect(() => {
    const south = area[1].lat;
    const west = area[1].lng;
    const north = area[0].lat;
    const east = area[0].lng;
    const query = `[out:json][timeout:25];(way["highway"](${south},${west},${north},${east}););out body geom;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((response) => response.json())
      .then((data) => setRoads(data.elements))
      .catch((err) => console.error(err));
  }, [area]);

  return (
    <>
      {roads.map((road) => {
        if (!road.geometry || road.geometry.length < 2) return null;

        const color = "#34f516";

        const points = road.geometry.map((pt) => {
          const v = project(pt.lat, pt.lon);
          return new THREE.Vector3(v.x, 0.1, -v.y);
        });

        return (
          <Line
            key={road.id}
            points={points}
            color={color}
            lineWidth={1}
            userData={{ exportToGLB: true }}
          />
        );
      })}
    </>
  );
}

// ─── Export ───
export function Export() {
  const { scene } = useThree();
  const getActionState = useActionStore.getState;

  useEffect(() => {
    window.VPMSExportModel = (mode: "glb" | "fleet") => {
      exportGLB(mode);
    };

    return () => {
      window.VPMSExportModel = undefined;
    };
  }, [scene]);

  const uploadFleet = async (blob: Blob) => {
    const { fleetSpaceId } = getActionState();
    const formData = new FormData();
    formData.append("object", blob, "box3d.glb");
    formData.append("title", "New Object");
    formData.append("description", "");
    formData.append("spaceId", fleetSpaceId);

    await instanceFleet.post("space/file/mesh", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const exportGLB = (mode: "glb" | "fleet") => {
    const exportRoot = new THREE.Group();
    scene.updateMatrixWorld(true);
    scene.traverse((child) => {
      if (child.userData?.exportToGLB === true) {
        exportRoot.add(child.clone(true));
      }
    });

    const exporter = new GLTFExporter();
    const options = { binary: true, embedImages: true };
    exportRoot.updateMatrixWorld(true);

    if (exportRoot.children.length === 0) {
      console.error("GLB export skipped: no exportable objects were found.");
      return;
    }

    exporter.parse(
      exportRoot,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });

          if (mode === "glb") {
            const link = document.createElement("a");
            link.style.display = "none";
            document.body.appendChild(link);
            link.href = URL.createObjectURL(blob);
            link.download = "scene.glb";
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
          }

          if (mode === "fleet") {
            uploadFleet(blob);
          }
        } else {
          console.error("GLB export failed: unexpected result", result);
        }
      },
      (error) => {
        console.error("An error occurred during export", error);
      },
      options
    );
  };

  return null;
}

// ─── Main Scene ───
export function Space() {
  const areas = useAreaStore((state) => state.areas);
  const hiddenIds = useHiddenStore((s) => s.hiddenIds);
  const showBuildings = useLayerStore((s) => s.showBuildings);
  const [realCenter, setRealCenter] = useState<
    { lat: number; lng: number }[] | undefined
  >();
  const center = useAreaStore((state) => state.center);
  const refLat = (center[1].lat + center[0].lat) / 2;
  const refLng = (center[1].lng + center[0].lng) / 2;
  const project = createProjection(refLat, refLng);

  const buildingsData = useMemo(() => {
    const result: BuildingProps[] = [];
    areas.forEach(
      (bld: {
        id: number;
        geometry?: { lat: number; lng: number }[];
        tags: Record<string, string | undefined>;
      }) => {
        if (!bld.geometry || bld.geometry.length < 3) return;

        const shapePoints = bld.geometry.map((pt) =>
          project(pt.lat, pt.lng)
        );
        if (!shapePoints[0].equals(shapePoints[shapePoints.length - 1])) {
          shapePoints.push(shapePoints[0]);
        }
        const shape = new THREE.Shape(shapePoints);

        let heightValue = parseFloat(bld.tags.height || "");
        const heightLevels = parseFloat(bld.tags["building:levels"] || "");
        if (isNaN(heightValue)) heightValue = 10;
        if (!isNaN(heightLevels)) heightValue = heightLevels * 2.2;

        const extrudeSettings = {
          steps: 1,
          depth: heightValue,
          bevelEnabled: false,
        };

        const rawLat =
          bld.geometry.reduce((sum, p) => sum + p.lat, 0) /
          bld.geometry.length;
        const rawLng =
          bld.geometry.reduce((sum, p) => sum + p.lng, 0) /
          bld.geometry.length;
        const floorCount = !isNaN(heightLevels)
          ? Math.round(heightLevels)
          : Math.max(1, Math.round(heightValue / 3));

        result.push({
          shape,
          extrudeSettings,
          tags: bld.tags,
          buildingId: bld.id,
          markerPosition: new THREE.Vector3(
            shapePoints.reduce((sum, point) => sum + point.x, 0) /
              shapePoints.length,
            heightValue + 0.4,
            -shapePoints.reduce((sum, point) => sum + point.y, 0) /
              shapePoints.length
          ),
          rawCenter: { lat: rawLat, lng: rawLng },
          floorCount,
        });
      }
    );
    return result;
  }, [areas, refLat, refLng]);

  useEffect(() => {
    setRealCenter(center);
  }, [areas]);

  return (
    <Canvas camera={{ fov: 90, near: 0.1, far: 7000 }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />

      {showBuildings &&
        buildingsData.map((item) =>
          hiddenIds.has(item.buildingId) ? null : (
            <Building
              key={item.buildingId}
              shape={item.shape}
              extrudeSettings={item.extrudeSettings}
              tags={item.tags}
              buildingId={item.buildingId}
              markerPosition={item.markerPosition}
              rawCenter={item.rawCenter}
              floorCount={item.floorCount}
            />
          )
        )}

      <Roads area={realCenter} />
      <pointLight
        position={[-10, -10, -10]}
        decay={0}
        intensity={Math.PI}
      />
      <Car />
      <Export />
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      <Environment preset="city" />
    </Canvas>
  );
}
