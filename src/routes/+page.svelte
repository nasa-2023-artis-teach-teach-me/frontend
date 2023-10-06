<script lang="ts">
	import { MapLibre, Control, ControlGroup, ControlButton } from "svelte-maplibre";
	import "../index.css";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
</script>

<MapLibre
	center={[120.9995426, 24.7880827]}
	zoom={18}
	class="map h-screen w-screen"
	standardControls
	style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
	pitch={45}
	bearing={-15}
	let:map
	filterLayers={(l) => {
		// Hide the built-in 3D building layer since we're doing our own.
		return l.id !== "building-3d";
	}}
>
	<Control position="top-right">
		<ControlGroup>
			<ControlButton
				on:click={() => {
					const pitch = tweened(map?.getPitch(), {
						duration: 500,
						easing: cubicOut,
					});

					pitch.subscribe((v) => {
						console.log(v);
						map?.setPitch(v);
					});

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

					pitch.subscribe((v) => {
						console.log(v);
						map?.setPitch(v);
					});

					pitch.set((map?.getPitch() ?? 0) + 15);
				}}
			>
				<img src="down-arrow.svg" alt="" class=" h-5 w-5" />
			</ControlButton>
		</ControlGroup>
		<div class="h-3" />
		<ControlGroup>
			<ControlButton
				on:click={() => {
					const bearing = tweened(map?.getBearing(), {
						duration: 500,
						easing: cubicOut,
					});

					bearing.subscribe((v) => {
						console.log(v);
						map?.setBearing(v);
					});

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

					bearing.subscribe((v) => {
						console.log(v);
						map?.setBearing(v);
					});

					bearing.set((map?.getBearing() ?? 0) - 15);
				}}
			>
				<img src="rotate-r.svg" alt="" class=" h-3 w-3" />
			</ControlButton>
		</ControlGroup>
	</Control>
</MapLibre>
