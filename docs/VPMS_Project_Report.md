# VPMS — 3D Vertical Property Mapping System
## Comprehensive Technical Documentation & System Report
**Smart India Hackathon (SIH) — Problem Statement 11: 3D ULPIN Generation**

---

## 1. Executive Summary

The **Vertical Property Mapping System (VPMS)** is an interactive 3D WebGL geospatial platform designed for next-generation cadastral management. As cities expand vertically, traditional 2D cadastral systems fail to capture multi-layered property rights across stacked floors, basements, and elevated structures. VPMS provides a modern 3D spatial interface that bridges 2D OpenStreetMap vector footprints with 3D volumetric extrusion, deterministic 3D Unique Land Parcel Identification Numbers (ULPIN), floor-level property indexing, and automated spatial anomaly detection.

---

## 2. Problem Statement & Objectives

### 2.1 The 2D Cadastral Gap
Traditional land records (e.g., 2D ULPIN / Bhu-Naksha) map properties as flat two-dimensional polygons $(X, Y)$. However, in multi-story residential and commercial towers, hundreds of independent owners share the same 2D footprint at varying vertical elevations ($Z$). This creates severe limitations:
- **Ownership Ambiguity**: Lack of spatial indexing for vertically stratified apartments, offices, and sub-surface basements.
- **Cadastral Non-Compliance**: Inability to detect height vs. floor count violations and unpermitted vertical expansions.
- **Interoperability Gap**: Lack of 3D spatial models compatible with modern digital twin platforms and GIS engines.

### 2.2 System Objectives
- **Real-Time Spatial Vector Extraction**: Extract building footprints and highway vectors on-demand via OpenStreetMap Overpass queries.
- **Deterministic 3D ULPIN Encoding**: Generate unique, coordinate-based 14-digit base ULPINs and vertical floor sub-ULPINs without centralized sequence collisions.
- **Volumetric 3D Cadastral Rendering**: Extrude 2D vector boundaries into 3D solid geometries in WebGL with individual floor segmentation.
- **Automated Anomaly Detection**: Validate building height against declared floor counts using adaptive variance thresholds.
- **Digital Twin Integration**: Export rendered 3D spatial models in binary GLTF (`.glb`) format for local CAD or remote cloud storage.

---

## 3. Technology Stack & System Architecture

| Layer | Technology | Description / Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Type-safe modular component architecture with strict types. |
| **Build & Dev Server** | **Vite 6** | Lightning-fast HMR and optimized production bundling. |
| **3D Graphics Engine** | **Three.js + React Three Fiber** | Hardware-accelerated WebGL scene graph, custom meshes, and shaders. |
| **3D Utilities** | **@react-three/drei** | Camera controllers, dynamic sky, lighting, and GLTFExporter. |
| **2D GIS Mapping** | **Leaflet & React-Leaflet** | Interactive bounding box selector and coordinate positioning. |
| **Geocoding Engine** | **OSM Nominatim API** | Real-time forward geocoding search for global landmarks and addresses. |
| **Vector GIS Pipeline** | **OSM Overpass API** | Live spatial queries extracting building polygons and road networks. |
| **State Management** | **Zustand** | Lightweight, reactive state stores for layers, selections, and telemetry. |
| **Database Backend** | **Supabase (PostgreSQL)** | Cloud database storing Parcels, Buildings, Floors, and anomaly flags. |
| **UI Styling** | **Emotion (CSS-in-JS)** | Glassmorphism aesthetics, responsive layouts, and smooth transitions. |

---

## 4. Algorithms & Mathematical Formulations

### 4.1 Local Equirectangular Tangent Plane Projection
To convert spherical WGS84 geographic coordinates $(\text{latitude}, \text{longitude})$ into 3D Cartesian coordinates $(X, Y, Z)$ in WebGL world space, VPMS calculates a tangent plane around the bounding box centroid $(\text{refLat}, \text{refLng})$:

$$\Delta\text{lng} = \text{lng} - \text{refLng}$$

$$\Delta\text{lat} = \text{lat} - \text{refLat}$$

$$X = \Delta\text{lng} \times \text{SCALE} \times \cos\left(\frac{\text{refLat} \times \pi}{180}\right)$$

$$Y = \Delta\text{lat} \times \text{SCALE}$$

$$\mathbf{P}_{3D} = \begin{bmatrix} X \\ \text{elevation} \\ -Y \end{bmatrix}$$

*(Scale factor $\text{SCALE} = 51{,}000$ maps geographic degrees to WebGL world units).*

---

### 4.2 Volumetric 3D Extrusion & Building Height Derivation
Polygon footprints are converted into closed planar shapes (`THREE.Shape`) and extruded into solid 3D geometries (`THREE.ExtrudeGeometry`) with derived heights:

$$\text{Height } (H) = \begin{cases} \text{tags.height} & \text{if tag exists} \\ \text{tags.building:levels} \times 2.2\text{ m} & \text{if level count exists} \\ 10.0\text{ m} & \text{default fallback} \end{cases}$$

$$\text{Floor Count } (F) = \begin{cases} \text{round}(\text{tags.building:levels}) & \text{if tag exists} \\ \max\left(1, \text{round}\left(\frac{H}{3.0}\right)\right) & \text{otherwise} \end{cases}$$

---

### 4.3 Deterministic Base ULPIN Generation Algorithm
VPMS generates an immutable 14-digit Base ULPIN deterministically from the building centroid coordinates, preventing collisions without relying on centralized database auto-increments:

$$\text{latPart} = \text{round}\left((\text{lat} + 90) \times 10^5\right)\text{.padStart}(7, \text{"0"})$$

$$\text{lngPart} = \text{round}\left((\text{lng} + 180) \times 10^5\right)\text{.padStart}(7, \text{"0"})$$

$$\text{Base ULPIN} = \text{latPart} \mathbin{\Vert} \text{lngPart}$$

---

### 4.4 Vertical Unit Sub-ULPIN (Floor-Level Identifier)
For each vertically stacked level or apartment unit:

$$\text{Floor ULPIN} = \langle\text{Base ULPIN}\rangle - \langle\text{Building ID}\rangle - \langle\text{Floor Number}\rangle$$

*Example:* `10284752839102-39281-04` uniquely references **Floor 4** of building `39281` on that specific parcel.

---

### 4.5 Height-to-Floor Topology Validation & Anomaly Detection
To flag unauthorized vertical expansions and data discrepancies:

$$\text{Expected Height } (H_{\text{exp}}) = F \times 3.0\text{ meters}$$

$$\Delta H = |H - H_{\text{exp}}|$$

$$\text{Tolerance } = H_{\text{exp}} \times 0.30 \quad (30\% \text{ natural architectural variation})$$

$$\text{isFlagged} = \Delta H > \text{Tolerance}$$

---

### 4.6 Vehicle Kinematics & Camera LERP Simulation
Ground-level property inspection includes an interactive vehicle with physics:
- **Velocity Integration:** $v_{t+\Delta t} = \text{clamp}(v_t + a \cdot \Delta t, -v_{\max}, v_{\max})$
- **Friction Deceleration:** $v_{t+\Delta t} = \text{sign}(v_t) \cdot \max(0, |v_t| - d_{\text{friction}} \cdot \Delta t)$
- **Camera Damping (LERP):** $\mathbf{C}_{t+\Delta t} = \mathbf{C}_t + 0.08 \cdot (\mathbf{C}_{\text{target}} - \mathbf{C}_t)$

---

## 5. Relational Database Schema (Supabase PostgreSQL)

- **`parcels`**: Stores base geographic parcels (`id`, `ulpin`, `lat`, `lng`, `area`, `created_at`).
- **`buildings`**: Stores building structures linked to parcels (`id`, `osm_id`, `building_name`, `floor_count`, `parcel_id`, `created_at`).
- **`floors`**: Stores vertical property records (`id`, `building_id`, `floor_number`, `floor_ulpin`, `flag`, `created_at`).

---

## 6. Core User Workflow & Features

1. **Step 0: Bounding Region Selector**: Search global locations via Nominatim and draw a 2D bounding polygon on Leaflet.
2. **Step 1: Spatial Geometry Processing**: Queries Overpass API in real time, parses building vertices, and calculates preliminary height telemetry.
3. **Step 2: Interactive 3D Cadastre Viewport**: Renders 3D extruded buildings, road networks, dynamic sky, and lighting.
4. **Vertical Floor Isolation**: Clicking any building allows the user to isolate individual floors with emissive blue highlight shaders while ghosting the surrounding structure.
5. **3D Spatial Annotations**: Add and edit persistent 3D billboard pin markers with custom notes and color-coded tags.
6. **Vehicle Drive Mode**: Switch to third-person driving mode with WASD controls and pointer-lock mouse look.
7. **GLTF / GLB Export**: Export the complete 3D scene into standard `.glb` binary models for external GIS / CAD pipelines.

---

## 7. Future Roadmap & Strategic Extensions

- **LiDAR Point Cloud Integration**: Incorporate airborne LiDAR (LAS/LAZ) point clouds to construct exact architectural rooflines.
- **BIM / IFC Ingestion**: Parse IFC building information models for detailed interior room, corridor, and utility mappings.
- **Blockchain Cadastral Registry**: Record 3D ULPIN property deeds and ownership transfers on an immutable blockchain ledger.
- **Automated Boundary Conflict Engine**: Run 3D boolean intersection queries to detect volumetric boundary encroachments automatically.
