<script lang="ts">
	import {
		MapLibre,
		Control,
		ControlGroup,
		ControlButton,
		Marker,
		GeoJSON,
		HeatmapLayer,
	} from "svelte-maplibre";
	import "../index.css";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { FireLayer } from "$lib/FireLayer";
	import type { LngLatLike } from "maplibre-gl";
	import { Drawer, getDrawerStore } from "@skeletonlabs/skeleton";
	import type { DrawerSettings } from "@skeletonlabs/skeleton";

	export let data;

	const drawerStore = getDrawerStore();

	let fireLayer: FireLayer;
	let zoom = 10;
	let reportingStatus: "close" | "selectingPos" | "fillingDetail" = "close";
	let reportingPos: LngLatLike;
	let bound: "none" | "up" | "down" = "none";
	let selectedPos: LngLatLike | null = null;

	let drawerSettings: DrawerSettings = {
		position: window.innerWidth < 768 ? "bottom" : "left",
		bgDrawer: "bg-white",
		bgBackdrop: "bg-[#0005]",
		width: "h-1/3 w-full md:w-1/4 md:h-full",
		rounded: "rounded-lg",
		padding: "p-2",
	};

	window.addEventListener("resize", () => {
		if (window.innerWidth < 768) {
			drawerSettings.position = "bottom";
		} else {
			drawerSettings.position = "left";
		}
	});
</script>

<Drawer>
	<div class=" p-6">
		{selectedPos}
	</div>
</Drawer>
<MapLibre
	center={[-80.130936, 27.016399]}
	bind:zoom
	class="map h-screen w-screen"
	standardControls
	style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
	pitch={45}
	bearing={-15}
	on:load={(e) => {
		const map = e.detail;
		map.setMaxZoom(16);

		fireLayer = new FireLayer(
			data.fires.map((fireData) => fireData.center),
			map,
			zoom,
		);
		map.addLayer(fireLayer);
	}}
	on:zoom={() => {
		fireLayer.setFireScale(zoom);
	}}
	let:map
>
	{#if map}
		<Control position="top-right" class="flex flex-col gap-y-2.5">
			<ControlGroup>
				<ControlButton
					on:click={() => {
						const pitch = tweened(map.getPitch(), {
							duration: 500,
							easing: cubicOut,
						});

						if ((map.getPitch() ?? 0) - 15 <= 0) {
							bound = "up";
						} else {
							bound = "none";
						}

						pitch.subscribe((v) => map.setPitch(v));
						pitch.set((map.getPitch() ?? 0) - 15);
					}}
				>
					<img src="up-arrow.svg" alt="" class=" h-5 w-5" class:opacity-20={bound == "up"} />
				</ControlButton>
				<ControlButton
					on:click={() => {
						const pitch = tweened(map.getPitch(), {
							duration: 500,
							easing: cubicOut,
						});

						if ((map.getPitch() ?? 0) + 15 >= 60) {
							bound = "down";
						} else {
							bound = "none";
						}

						pitch.subscribe((v) => map.setPitch(v));
						pitch.set((map.getPitch() ?? 0) + 15);
					}}
				>
					<img src="down-arrow.svg" alt="" class=" h-5 w-5" class:opacity-20={bound == "down"} />
				</ControlButton>
			</ControlGroup>
			<ControlGroup>
				<ControlButton
					on:click={() => {
						const bearing = tweened(map.getBearing(), {
							duration: 500,
							easing: cubicOut,
						});

						bearing.subscribe((v) => map.setBearing(v));
						bearing.set((map.getBearing() ?? 0) + 15);
					}}
				>
					<img src="rotate-l.svg" alt="" class=" h-3 w-3" />
				</ControlButton>
				<ControlButton
					on:click={() => {
						const bearing = tweened(map.getBearing(), {
							duration: 500,
							easing: cubicOut,
						});

						bearing.subscribe((v) => map.setBearing(v));
						bearing.set((map.getBearing() ?? 0) - 15);
					}}
				>
					<img src="rotate-r.svg" alt="" class=" h-3 w-3" />
				</ControlButton>
			</ControlGroup>
			{#if reportingStatus !== "fillingDetail"}
				<ControlGroup>
					{#if reportingStatus == "close"}
						<ControlButton
							on:click={() => {
								reportingStatus = "selectingPos";
								reportingPos = map.getCenter();
							}}
						>
							<img src="report.svg" alt="" class=" h-5 w-5" />
						</ControlButton>
					{:else if reportingStatus == "selectingPos"}
						<ControlButton
							on:click={() => {
								reportingStatus = "fillingDetail";
							}}
						>
							<img src="confirm.svg" alt="" class=" h-4 w-4" />
						</ControlButton>
						<ControlButton
							on:click={() => {
								reportingStatus = "close";
							}}
						>
							<img src="cancel.svg" alt="" class=" h-4 w-4" />
						</ControlButton>
					{/if}
				</ControlGroup>
			{/if}
		</Control>
		<GeoJSON data={data.geojson}>
			<HeatmapLayer
				maxzoom={20}
				paint={{
					"heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
					"heatmap-color": [
						"interpolate",
						["linear"],
						["heatmap-density"],
						0,
						"rgba(255,255,255,0)",
						1,
						"rgb(255,34,0)",
					],
					"heatmap-radius": ["interpolate", ["exponential", 2], ["zoom"], 7, 20, 16, 1000],
					"heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 10, 1, 20, 0],
				}}
			/>
		</GeoJSON>
		{#if 7 < zoom}
			{#each data.fires as fireData (fireData.center)}
				<Marker
					lngLat={fireData.center}
					class="hover:scale-120 grid h-3 w-3 place-items-center rounded-full bg-red-600 text-black transition-[background-color] hover:bg-red-300 focus:outline-2 focus:outline-black"
					on:click={() => {
						selectedPos = fireData.center;
						map.flyTo({
							center: fireData.center,
							zoom: window.innerWidth < 768 ? 14 : 16,
							speed: 1.25,
							padding: {
								left: window.innerWidth < 768 ? 0 : window.innerWidth / 4,
								bottom: window.innerWidth < 768 ? window.innerHeight / 3 : 0,
							},
						});
						drawerStore.open(drawerSettings);
					}}
				/>
			{/each}
		{/if}
		{#if reportingStatus == "selectingPos"}
			<Marker bind:lngLat={reportingPos} draggable>
				<img src="pin.svg" alt="" class="h-12 w-12" />
			</Marker>
			<span
				class=" absolute left-1/2 top-[90%] w-full -translate-x-1/2 -translate-y-1/2 text-center text-lg text-white opacity-50"
			>
				Drag the pin to report the fire position, then click the checkmark to confirm.
			</span>
		{:else if reportingStatus == "fillingDetail"}
			<form
				class="absolute left-1/2 top-1/2 w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 text-lg opacity-80 md:w-1/3"
				on:submit|preventDefault={() => {
					reportingStatus = "close";
				}}
			>
				<div class="mb-6">
					<label for="image" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
						Upload Images
					</label>
					<input
						type="file"
						id="image"
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
						accept="image/*"
					/>
				</div>
				<div class="mb-6">
					<label for="description" class="mb-2 block text-sm font-medium text-gray-900">
						Description
					</label>
					<textarea
						id="description"
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
					/>
				</div>
				<button
					type="submit"
					class="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800"
				>
					Submit
				</button>
				<button
					class="absolute right-0 top-0 bg-white p-3 text-sm text-gray-900 opacity-80 hover:opacity-100"
					on:click={() => {
						reportingStatus = "selectingPos";
					}}
				>
					<img src="close.svg" alt="" class="h-5 w-5" />
				</button>
			</form>

			<span
				class=" absolute left-1/2 top-[90%] w-full -translate-x-1/2 -translate-y-1/2 text-center text-lg text-white opacity-50"
			>
				Describe the fire in detail.
			</span>
		{/if}
	{/if}
</MapLibre>
