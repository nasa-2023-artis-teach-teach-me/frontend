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
	import { LngLat, type Map } from "maplibre-gl";
	import { Drawer, getDrawerStore, Toast, getToastStore } from "@skeletonlabs/skeleton";
	import type { DrawerSettings, ToastSettings } from "@skeletonlabs/skeleton";
	import type { FireData } from "../models/fire-data";
	import type { Report } from "../models/report";
	import type * as geojson from "geojson";

	export let data;

	const drawerStore = getDrawerStore();
	const toastStore = getToastStore();

	let fireLayer: FireLayer;
	let zoom = 10;
	let reportingStatus: "close" | "selectingPos" | "fillingDetail" = "close";
	let reportingPos: LngLat;
	let bound: "none" | "up" | "down" = "none";
	let selectedFireData: FireData | null = null;
	let selectedReports: Report[] | null = null;

	$: if (selectedFireData) {
		const promiseArr = [];
		for (const position of selectedFireData.positions) {
			promiseArr.push(
				fetch(`https://api.nasa.n0b.me/api/report/${position[0]}/${position[1]}`).then(
					(res) => res.json() as Promise<Report[]>,
				),
			);
		}

		Promise.all(promiseArr).then((reports) => {
			selectedReports = reports.flat();
		});
	}

	let fileEl: HTMLInputElement;
	let descriptionEl: HTMLTextAreaElement;

	let drawerSettings: DrawerSettings = {
		position: window.innerWidth < 768 ? "bottom" : "left",
		bgDrawer: "bg-white",
		bgBackdrop: "bg-[#0005]",
		width: "h-1/3 w-full md:w-1/4 md:h-full",
		rounded: "rounded-lg",
		padding: "p-2",
	};
	let toastSettings: ToastSettings = {
		message: "",
		timeout: 10000,
	};

	window.addEventListener("resize", () => {
		if (window.innerWidth < 768) {
			drawerSettings.position = "bottom";
		} else {
			drawerSettings.position = "left";
		}
	});

	function uploadReport(map: Map) {
		reportingStatus = "close";

		const formData = new FormData();
		formData.append("latitude", reportingPos.lat.toString());
		formData.append("longitude", reportingPos.lng.toString());
		formData.append("message", descriptionEl.value);
		if (fileEl.files && fileEl.files[0]) {
			// for (let i = 0; i < fileEl.files.length; i++) {
			// 	formData.append("image", fileEl.files[i]);
			// }
			formData.append("image", fileEl.files[0]);
		}

		fetch("https://api.nasa.n0b.me/api/report", {
			method: "POST",
			body: formData,
		})
			.then((res) => {
				if (res.ok) {
					toastSettings.message = "Upload successful.";
					toastStore.trigger(toastSettings);

					const date = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const day = date.getDate();

					const dateString = `${year}-${month < 10 ? "0" + month : month}-${
						day < 10 ? "0" + day : day
					}`;

					Promise.all([
						fetch(`https://api.nasa.n0b.me/api/fire/date/${dateString}`),
						fetch(`https://api.nasa.n0b.me/api/fire/raw/${dateString}`),
					]).then(async (resp) => {
						data.geojson = (await resp[0].json()) as geojson.GeoJSON;
						data.fires = (await resp[1].json()) as FireData[];

						fireLayer = new FireLayer(data.fires, map, zoom);
						map.removeLayer("fire-layer");
						map.addLayer(fireLayer);
					});
				} else {
					toastSettings.message = "Upload failed.";
					toastStore.trigger(toastSettings);

					console.log(res);
				}
			})
			.catch((e) => {
				toastSettings.message = "Upload failed.";
				toastStore.trigger(toastSettings);

				console.log(e);
			});
	}

	function handleExistingPosReport() {
		if (!selectedFireData) return;

		const coord = selectedFireData.center as [number, number];
		reportingPos = new LngLat(coord[0], coord[1]);
		reportingStatus = "fillingDetail";
		drawerStore.close();
	}
</script>

<svelte:head>
	<title>UFIS (Ultimate Fire Information System)</title>
</svelte:head>

<Toast />
<Drawer>
	<div class=" flex flex-col gap-4 p-6">
		<div class=" flex items-center justify-between">
			<span class=" font-bold">Reports</span>
			{#if false}
				<button
					on:click={handleExistingPosReport}
					class=" flex h-7 w-7 items-center justify-center rounded-sm bg-gray-100"
				>
					<img src="report.svg" alt="" class=" h-5 w-5" />
				</button>
			{/if}
		</div>
		{#if selectedReports}
			{#each selectedReports as selectedReport}
				<div class=" flex flex-col gap-4 rounded-md bg-gray-100 p-4">
					<div class=" flex items-center gap-4">
						<img
							src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/1024px-User-avatar.svg.png"
							class="h-8 w-8 rounded-full bg-white"
							alt=""
						/>
						<span class=" text-xs font-bold"> Anonymous </span>
					</div>
					<span class=" text-xs text-gray-600">
						{new Date(selectedReport.timestamp).toLocaleString()}
					</span>
					<div class=" h-px border-0 bg-gray-300" />
					<span class=" text-sm">{selectedReport.message}</span>
					{#if selectedReport.image_url !== ""}
						<img src={"http://" + selectedReport.image_url} alt="" />
					{/if}
				</div>
			{/each}
		{/if}
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

		fireLayer = new FireLayer(data.fires, map, zoom);
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
		{#if zoom > 5}
			{#each data.fires as fireData (fireData.center)}
				<Marker
					lngLat={fireData.center}
					class="hover:scale-120 grid h-5 w-5 place-items-center rounded-full "
					on:click={() => {
						selectedFireData = fireData;
						map.flyTo({
							center: fireData.center,
							zoom: window.innerWidth < 768 ? 12 : 14,
							speed: 1.25,
							padding: {
								left: window.innerWidth < 768 ? 0 : window.innerWidth / 4,
								bottom: window.innerWidth < 768 ? window.innerHeight / 3 : 0,
							},
						});
						drawerStore.open(drawerSettings);
					}}
				>
					<img src="pin.svg" alt="" />
				</Marker>
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
				on:submit|preventDefault={() => uploadReport(map)}
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
						bind:this={fileEl}
					/>
				</div>
				<div class="mb-6">
					<label for="description" class="mb-2 block text-sm font-medium text-gray-900">
						Description
					</label>
					<textarea
						id="description"
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
						bind:this={descriptionEl}
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
