<script lang="ts">
	import type { Control, LatLngTuple, MapOptions, TileLayerOptions } from "leaflet";
	import { LeafletMap, Marker, Popup, ScaleControl, TileLayer } from "svelte-leafletjs";
	import "../index.css";
	// import { onDestroy } from "svelte";

	const mapOptions: MapOptions = {
		center: [24.7880827, 120.9995426],
		zoom: 18,
	};
	const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
	const tileLayerOptions: TileLayerOptions = {
		minZoom: 0,
		maxZoom: 20,
		maxNativeZoom: 19,
		attribution: "© OpenStreetMap contributors",
	};
	const scaleControlOptions: Control.ScaleOptions = {
		maxWidth: 200,
	};

	let scaleControl;
	let pos: LatLngTuple = [24.787359, 120.9979121];

	// const interval = setInterval(() => {
	// 	pos = [pos[0] + (Math.random() - 0.5) * 0.0001, pos[1] + (Math.random() - 0.5) * 0.0001];
	// }, 100);

	// onDestroy(() => {
	// 	clearInterval(interval);
	// });
</script>

<div class=" h-screen w-screen">
	<LeafletMap options={mapOptions}>
		<TileLayer url={tileUrl} options={tileLayerOptions} />
		<Marker latLng={pos}>
			<Popup>
				<div class=" h-full w-full bg-black">
					<h1>aaa</h1>
					<h1>aaaeihgp;aeihgn;aejg;a</h1>
					<h1>aaa</h1>
					<h1>aaa</h1>
				</div>
			</Popup>
		</Marker>
		<ScaleControl bind:this={scaleControl} position="bottomleft" options={scaleControlOptions} />
	</LeafletMap>
</div>
