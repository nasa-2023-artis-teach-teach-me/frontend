<script lang="ts">
	import { MapLibre, Control, ControlGroup, ControlButton, Marker } from "svelte-maplibre";
	import "../index.css";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { FireLayer } from "$lib/FireLayer";
	import type { LngLatLike } from "maplibre-gl";

	let fireLayer: FireLayer;
	let zoom = 18;

	const firePos: LngLatLike[] = [
		[-76.787148, 35.479481],
		[-78.369896, 35.422173],
		[-78.588127, 36.58757],
		[-77.324165, 37.34866],
		[-77.323593, 37.353703],
		[-82.808647, 31.688133],
		[-82.810219, 31.68717],
		[-82.897942, 32.023228],
		[-82.901718, 32.022118],
		[-82.898392, 32.016663],
		[-84.197365, 31.72546],
		[-80.130936, 27.016399],
		[-80.134659, 27.016724],
		[-77.321487, 37.354218],
		[-77.324341, 37.348251],
		[-94.577583, 38.536098],
		[-80.898453, 33.377056],
		[-95.003372, 36.507267],
		[-96.109924, 34.793766],
		[-97.195557, 31.855425],
		[-103.803642, 32.653038],
		[-93.598213, 34.073982],
		[-93.828712, 34.031563],
		[-93.344254, 31.925722],
		[-103.807228, 32.65332],
		[-94.373993, 34.435837],
		[-96.06739, 32.80777],
		[-95.669273, 33.498173],
		[-96.728203, 32.680237],
		[-84.024101, 31.607441],
		[-96.445366, 32.23999],
		[-95.665588, 33.494164],
		[-84.020615, 31.606611],
		[-95.669945, 33.494781],
		[-94.360718, 33.194942],
		[-95.369263, 34.522625],
		[-95.368515, 34.526001],
		[-96.367508, 34.378693],
		[-95.378006, 34.523849],
		[-96.865967, 34.745548],
	];
</script>

<MapLibre
	center={[-80.130936, 27.016399]}
	zoom={16}
	class="map h-screen w-screen"
	standardControls
	style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
	pitch={45}
	bearing={-15}
	filterLayers={(l) => {
		// Hide the built-in 3D building layer since we're doing our own.
		return l.id !== "building-3d";
	}}
	on:load={(e) => {
		const map = e.detail;
		fireLayer = new FireLayer(firePos, map);
		map.addLayer(fireLayer);

		map.setMaxZoom(18);
	}}
	on:zoom={(e) => {
		zoom = e.detail.target.getZoom();
		fireLayer.setFireScale(zoom);
	}}
	let:map
>
	<Control position="top-right" class="flex flex-col gap-y-2.5">
		<ControlGroup>
			<ControlButton
				on:click={() => {
					const pitch = tweened(map?.getPitch(), {
						duration: 500,
						easing: cubicOut,
					});

					pitch.subscribe((v) => map?.setPitch(v));
					pitch.set((map?.getPitch() ?? 0) - 15);
				}}
			>
				<img src="up-arrow.svg" alt="" class=" h-5 w-5" />
			</ControlButton>
			<ControlButton
				on:click={() => {
					const pitch = tweened(map?.getPitch(), {
						duration: 500,
						easing: cubicOut,
					});

					pitch.subscribe((v) => map?.setPitch(v));
					pitch.set((map?.getPitch() ?? 0) + 15);
				}}
			>
				<img src="down-arrow.svg" alt="" class=" h-5 w-5" />
			</ControlButton>
		</ControlGroup>
		<ControlGroup>
			<ControlButton
				on:click={() => {
					const bearing = tweened(map?.getBearing(), {
						duration: 500,
						easing: cubicOut,
					});

					bearing.subscribe((v) => map?.setBearing(v));
					bearing.set((map?.getBearing() ?? 0) + 15);
				}}
			>
				<img src="rotate-l.svg" alt="" class=" h-3 w-3" />
			</ControlButton>
			<ControlButton
				on:click={() => {
					const bearing = tweened(map?.getBearing(), {
						duration: 500,
						easing: cubicOut,
					});

					bearing.subscribe((v) => map?.setBearing(v));
					bearing.set((map?.getBearing() ?? 0) - 15);
				}}
			>
				<img src="rotate-r.svg" alt="" class=" h-3 w-3" />
			</ControlButton>
		</ControlGroup>
		{#if zoom < 13}
			{#each firePos as lngLat}
				<Marker
					{lngLat}
					class="grid h-3 w-3 place-items-center rounded-full bg-red-600 text-black  focus:outline-2 focus:outline-black"
					on:click={() => {
						map?.flyTo({
							center: lngLat,
							zoom: 16,
							speed: 1.25,
						});
					}}
				/>
			{/each}
		{/if}
	</Control>
</MapLibre>
