import * as maplibregl from "maplibre-gl";
import * as THREE from "three";
import type { CustomLayerInterface } from "maplibre-gl";
// @ts-ignore
import particleFire from "three-particle-fire";
import type { FireData } from "../models/fire-data";

particleFire.install({ THREE: THREE });

export class FireLayer implements CustomLayerInterface {
	id: string = "fire-layer";
	type = "custom" as const;
	renderingMode: "3d" | "2d" = "3d";

	private cameraOrigin: maplibregl.LngLatLike = [0, 0];
	private modelAltitude = 0;
	private modelRotate = [Math.PI / 2, 0, 0];
	private modelTransform: {
		translateX: number;
		translateY: number;
		translateZ: number;
		rotateX: number;
		rotateY: number;
		rotateZ: number;
		scale: number;
	};

	private scene: THREE.Scene = new THREE.Scene();
	private camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
	private renderer: THREE.WebGLRenderer | undefined = undefined;
	private clock: THREE.Clock = new THREE.Clock();

	private fireRadius = 150;
	private fireHeight = 500;
	private particleCount = 10000;

	private filreGeo = new particleFire.Geometry(
		this.fireRadius,
		this.fireHeight,
		this.particleCount,
	);
	private fireMat = new particleFire.Material({ color: 0xff2200 });
	private fireMesh: THREE.Points | undefined = undefined;

	private l: THREE.Matrix4;

	constructor(private fires: FireData[], private map: maplibregl.Map, private scale: number) {
		const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
			this.cameraOrigin,
			this.modelAltitude,
		);

		this.modelTransform = {
			translateX: modelAsMercatorCoordinate.x,
			translateY: modelAsMercatorCoordinate.y,
			translateZ: modelAsMercatorCoordinate.z,
			rotateX: this.modelRotate[0],
			rotateY: this.modelRotate[1],
			rotateZ: this.modelRotate[2],
			scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
		};

		this.l = new THREE.Matrix4()
			.makeTranslation(
				this.modelTransform.translateX,
				this.modelTransform.translateY,
				this.modelTransform.translateZ,
			)
			.scale(
				new THREE.Vector3(
					this.modelTransform.scale,
					-this.modelTransform.scale,
					this.modelTransform.scale,
				),
			)
			.multiply(
				new THREE.Matrix4().makeRotationAxis(
					new THREE.Vector3(1, 0, 0),
					this.modelTransform.rotateX,
				),
			)
			.multiply(
				new THREE.Matrix4().makeRotationAxis(
					new THREE.Vector3(0, 1, 0),
					this.modelTransform.rotateY,
				),
			)
			.multiply(
				new THREE.Matrix4().makeRotationAxis(
					new THREE.Vector3(0, 0, 1),
					this.modelTransform.rotateZ,
				),
			);
	}

	onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: map.getCanvas(),
			context: gl,
			antialias: true,
		});

		this.renderer.autoClear = false;
		this.setFireScale(this.scale);

		for (const fireCoord of this.fires
			.map((fire) => fire.positions)
			.reduce((a, b) => a.concat(b))) {
			this.addNewFire(fireCoord as maplibregl.LngLatLike);
		}
	}

	addNewFire(modelOrigin: maplibregl.LngLatLike) {
		this.fireMesh = new THREE.Points(this.filreGeo, this.fireMat);

		const modelPos = maplibregl.MercatorCoordinate.fromLngLat(modelOrigin, this.modelAltitude);
		this.fireMesh?.position.set(
			(modelPos.x - this.modelTransform.translateX) / this.modelTransform.scale,
			0,
			(modelPos.y - this.modelTransform.translateY) / this.modelTransform.scale,
		);

		this.scene.add(this.fireMesh);
	}

	render(
		gl: WebGLRenderingContext | WebGL2RenderingContext,
		matrix:
			| Float32Array
			| [
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
			  ],
	) {
		const m = new THREE.Matrix4().fromArray(matrix);

		this.camera.projectionMatrix = m.multiply(this.l);
		this.renderer?.resetState();
		this.renderer?.render(this.scene, this.camera);
		this.map.triggerRepaint();

		// @ts-ignore
		this.fireMesh?.material.update(this.clock.getDelta());
	}

	onRemove(): void {
		this.renderer?.dispose();
	}

	setFireScale(scale: number) {
		this.fireMat.setPerspective(
			this.camera.fov,
			Math.max(18 * scale - 200, 0) *
				(this.renderer?.getSize(new THREE.Vector2(window.innerWidth, window.innerHeight)).height ||
					0),
		);
	}
}
