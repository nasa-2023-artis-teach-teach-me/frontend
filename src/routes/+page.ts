import type { FireData } from "../models/fire-data";
import type { GeoJSON } from "geojson";

export const ssr = false;

export const load = async ({ fetch }) => {
	const date = new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const dateString = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;

	const resp = await Promise.all([
		fetch(`https://api.nasa.n0b.me/api/fire/date/${dateString}`),
		fetch(`https://api.nasa.n0b.me/api/fire/raw/${dateString}`),
	]);

	return {
		geojson: (await resp[0].json()) as GeoJSON,
		fires: (await resp[1].json()) as FireData[],
	};
};
