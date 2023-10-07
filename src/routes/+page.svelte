<script lang="ts">
	import { MapLibre, Control, ControlGroup, ControlButton } from "svelte-maplibre";
	import "../index.css";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { FireLayer } from "$lib/FireLayer";

	let fireLayer: FireLayer;
</script>

<MapLibre
	center={[18.53, -33.84294]}
	zoom={18}
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
		fireLayer = new FireLayer(
			[
				[18.53, -33.84294],
				[18.84533, -33.31696],
				[18.04532, -32.96122],
				[18.76004, -32.94015],
				[18.75798, -32.93877],
				[30.24382, -28.98739],
				[30.24247, -28.98285],
				[30.25678, -28.97047],
				[30.23735, -28.96939],
				[29.81649, -28.88107],
				[29.11519, -28.85361],
				[29.21437, -28.82914],
				[27.8222, -28.63973],
				[27.82375, -28.63878],
				[28.69284, -28.62149],
				[28.69305, -28.61786],
			],
			map,
		);
		map.addLayer(fireLayer);
	}}
	on:zoom={(e) => {
		fireLayer.setFireScale(e.detail.target.getZoom());
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
	</Control>
</MapLibre>
