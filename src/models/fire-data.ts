import type { LngLatLike } from "maplibre-gl";

export interface FireData {
	center: LngLatLike;
	positions: number[][];
	id: number[];
}
