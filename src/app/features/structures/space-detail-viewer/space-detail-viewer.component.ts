import {
    Component, Input, OnInit, OnDestroy, AfterViewInit,
    ViewChild, ElementRef, inject, signal, NgZone, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { SpacesFacade } from '../../../core/services/spaces.facade';
import { Feature } from '../../../core/models';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CUBE_COLORS = [
    0x6366f1, 0x06b6d4, 0xf59e0b, 0xef4444,
    0x22c55e, 0xa855f7, 0xf97316, 0xec4899,
];

@Component({
    selector: 'app-space-detail-viewer',
    imports: [CommonModule, LucideAngularModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './space-detail-viewer.component.html',
    styleUrl: './space-detail-viewer.component.scss'
})
export class SpaceDetailViewerComponent implements OnInit, AfterViewInit, OnDestroy {
    /** The Space ID to render */
    @Input({ required: true }) spaceId!: string;
    /** The features assigned to this space */
    @Input() features: Feature[] = [];
    /** Optional GLB model URL */
    @Input() modelUrl?: string;
    /** User saved camera settings */
    @Input() cameraSettings?: {
        position: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
    };
    /** User saved model scale */
    @Input() modelScale?: { x: number; y: number; z: number };

    @ViewChild('viewerContainer') viewerContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('viewerCanvas') viewerCanvas!: ElementRef<HTMLCanvasElement>;

    private readonly ngZone = inject(NgZone);
    private readonly spacesFacade = inject(SpacesFacade);

    // Tooltip state
    tooltipVisible = signal(false);
    tooltipX = signal(0);
    tooltipY = signal(0);
    tooltipName = signal('');
    tooltipDescription = signal('');
    tooltipIcon = signal('box');

    // Three.js members
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private orbitControls!: OrbitControls;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private animationFrameId = 0;
    private resizeObserver!: ResizeObserver;
    private cubes: THREE.Mesh[] = [];
    private isDestroyed = false;
    private gltfLoader = new GLTFLoader();
    private modelObjectUrl: string | null = null;

    ngOnInit(): void {
        // Load positions from localStorage via facade
        this.spacesFacade.loadFeaturePositions(this.spaceId);
    }

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
            this.initThreeJS();
            this.buildCubes();
            if (this.modelUrl) {
                this.spacesFacade.getSpaceModel(this.spaceId).then(blob => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        this.modelObjectUrl = url;
                        this.loadGLBModel(url);
                    } else {
                        // Use provided URL as fallback (now pointing to assets/3D/...)
                        this.loadGLBModel(this.modelUrl!);
                    }
                });
            }
            this.animate();
        });
    }

    ngOnDestroy(): void {
        this.isDestroyed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }

        this.cubes.forEach(cube => {
            cube.geometry.dispose();
            if (cube.material instanceof THREE.Material) {
                cube.material.dispose();
            }
        });
        this.cubes = [];

        if (this.scene) {
            this.scene.traverse(obj => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose();
                    if (obj.material instanceof THREE.Material) {
                        obj.material.dispose();
                    } else if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    }
                }
            });
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
        }

        if (this.modelObjectUrl) {
            URL.revokeObjectURL(this.modelObjectUrl);
        }
    }

    private initThreeJS(): void {
        const container = this.viewerContainer.nativeElement;
        const canvas = this.viewerCanvas.nativeElement;
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 350;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);

        if (this.cameraSettings) {
            const pos = this.cameraSettings.position;
            this.camera.position.set(pos.x, pos.y, pos.z);
            const target = this.cameraSettings.target;
            this.camera.lookAt(target.x, target.y, target.z);
        } else {
            this.camera.position.set(4, 4, 4);
            this.camera.lookAt(0, 0, 0);
        }

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(8, 12, 8);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Grid floor
        const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333355);
        this.scene.add(gridHelper);

        // Shadow floor
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.5
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // OrbitControls (read-only navigation)
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        if (this.cameraSettings) {
            const target = this.cameraSettings.target;
            this.orbitControls.target.set(target.x, target.y, target.z);
        }
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.08;
        this.orbitControls.maxPolarAngle = Math.PI / 2;

        // Raycasting click handler
        canvas.addEventListener('click', (event: MouseEvent) => {
            this.onCanvasClick(event);
        });

        // Resize handling
        this.resizeObserver = new ResizeObserver(() => {
            this.onResize();
        });
        this.resizeObserver.observe(container);
    }

    private buildCubes(): void {
        const positions = this.spacesFacade.getFeaturePositions(this.spaceId);

        this.features.forEach((feature, index) => {
            const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const color = CUBE_COLORS[index % CUBE_COLORS.length];
            const material = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.4,
                metalness: 0.3,
                emissive: new THREE.Color(color).multiplyScalar(0.15)
            });

            const cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true;
            cube.receiveShadow = true;

            const savedPos = positions[feature.id];
            if (savedPos) {
                cube.position.set(savedPos.x, savedPos.y, savedPos.z);
            } else {
                cube.position.set(index * 1.2 - 3, 0.3, 0);
            }

            cube.userData['featureId'] = feature.id;
            cube.userData['featureName'] = feature.name;
            cube.userData['featureDescription'] = feature.description || '';
            cube.userData['featureIcon'] = feature.icon || 'box';
            cube.name = `cube_${feature.id}`;

            this.scene.add(cube);
            this.cubes.push(cube);
        });
    }

    private loadGLBModel(url: string): void {
        this.gltfLoader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                if (this.modelScale) {
                    model.scale.set(this.modelScale.x, this.modelScale.y, this.modelScale.z);
                }
                this.scene.add(model);
            },
            undefined,
            (error) => {
                console.warn('[SpaceViewer] Failed to load GLB model:', error);
            }
        );
    }

    private animate(): void {
        if (this.isDestroyed) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.orbitControls?.update();
        this.renderer?.render(this.scene, this.camera);
    }

    private onResize(): void {
        const container = this.viewerContainer?.nativeElement;
        if (!container || !this.camera || !this.renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private onCanvasClick(event: MouseEvent): void {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cubes);

        if (intersects.length > 0) {
            const hit = intersects[0].object as THREE.Mesh;

            // Project 3D position to 2D screen coordinates for tooltip
            const worldPos = new THREE.Vector3();
            hit.getWorldPosition(worldPos);
            worldPos.y += 0.5; // offset above cube

            const projected = worldPos.clone().project(this.camera);
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;

            const screenX = (projected.x * halfWidth) + halfWidth;
            const screenY = -(projected.y * halfHeight) + halfHeight;

            this.ngZone.run(() => {
                this.tooltipX.set(screenX);
                this.tooltipY.set(screenY);
                this.tooltipName.set(hit.userData['featureName'] || 'Feature');
                this.tooltipDescription.set(hit.userData['featureDescription'] || '');
                this.tooltipIcon.set(hit.userData['featureIcon'] || 'box');
                this.tooltipVisible.set(true);
            });
        } else {
            this.ngZone.run(() => {
                this.tooltipVisible.set(false);
            });
        }
    }
}
