import {
    Component, OnInit, OnDestroy, Input, inject, signal, computed,
    ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, NgZone
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SpacesFacade } from '../../../core/services/spaces.facade';
import { FeaturesFacade } from '../../../core/services/features.facade';
import { StructuresFacade } from '../../../core/services/structures.facade';
import {
    CreateSpaceDto, SpaceType, SPACE_TYPE_LABELS,
    Feature, CreateFeatureDto, FeatureCategory, FEATURE_CATEGORY_LABELS
} from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Color palette for feature cubes
const CUBE_COLORS = [
    0x6366f1, // indigo
    0x06b6d4, // cyan
    0xf59e0b, // amber
    0xef4444, // red
    0x22c55e, // green
    0xa855f7, // purple
    0xf97316, // orange
    0xec4899, // pink
];

@Component({
    selector: 'app-space-editor',
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, PageHeaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './space-editor.component.html',
    styleUrl: './space-editor.component.scss'
})
export class SpaceEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() structureId!: string;
    @Input() spaceId?: string;
    @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly ngZone = inject(NgZone);
    private readonly spacesFacade = inject(SpacesFacade);
    private readonly featuresFacade = inject(FeaturesFacade);
    private readonly structuresFacade = inject(StructuresFacade);
    private readonly location = inject(Location);

    form!: FormGroup;
    featureForm!: FormGroup;
    isSubmitting = false;
    showDeleteDialog = false;
    selectedFeatureIds: string[] = [];

    structureName = signal<string>('');
    allFeatures = signal<Feature[]>([]);
    showAddFeaturePanel = signal(false);
    isClosingPanel = signal(false);
    isCreatingFeature = signal(false);
    selectedCubeFeatureName = signal<string>('');
    selectedFeatureId = signal<string | null>(null);
    modelFileName = signal<string>('');

    // Feature position signals
    featureX = signal(0);
    featureY = signal(0);
    featureZ = signal(0);

    // Camera settings signals (live preview)
    cameraX = signal(5);
    cameraY = signal(5);
    cameraZ = signal(5);
    cameraFov = signal(60);

    // Model scale signals
    modelScale = signal(1);
    modelScaleX = signal(1);
    modelScaleY = signal(1);
    modelScaleZ = signal(1);

    spaceTypes: SpaceType[] = ['meeting_room', 'office', 'bathroom', 'common_area', 'storage', 'kitchen'];
    featureCategories: FeatureCategory[] = ['connectivity', 'equipment', 'accessibility', 'comfort'];
    featureIcons = [
        { value: 'wifi', label: 'Wi-Fi' },
        { value: 'presentation', label: 'Projector' },
        { value: 'accessibility', label: 'Accessibility' },
        { value: 'thermometer', label: 'Climate Control' },
        { value: 'video', label: 'Video Conference' },
        { value: 'square', label: 'Whiteboard' },
        { value: 'cable', label: 'Ethernet' },
        { value: 'sun', label: 'Natural Light' }
    ];

    // ── Three.js members ─────────────────────────────────────────
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private orbitControls!: OrbitControls;
    private transformControls!: TransformControls;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private animationFrameId = 0;
    private resizeObserver!: ResizeObserver;

    // Map featureId → cube mesh (used for sync)
    private cubeMap = new Map<string, THREE.Mesh>();
    private gltfLoader = new GLTFLoader();
    private isDestroyed = false;
    private modelFile: File | null = null;
    private modelObjectUrl: string | null = null;
    private currentRoomModel: THREE.Object3D | null = null;

    get isEditMode(): boolean {
        return !!this.spaceId;
    }

    // ── Lifecycle ────────────────────────────────────────────────

    ngOnInit(): void {
        this.initForm();
        this.initFeatureForm();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
            this.initThreeJS();
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

        // Dispose Three.js resources
        if (this.transformControls) {
            this.transformControls.dispose();
        }
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }

        this.cubeMap.forEach(cube => {
            cube.geometry.dispose();
            if (cube.material instanceof THREE.Material) {
                cube.material.dispose();
            }
        });
        this.cubeMap.clear();

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

        // Revoke object URL if created
        if (this.modelObjectUrl) {
            URL.revokeObjectURL(this.modelObjectUrl);
            this.modelObjectUrl = null;
        }
    }

    // ── Three.js Setup ──────────────────────────────────────────

    private initThreeJS(): void {
        const container = this.canvasContainer.nativeElement;
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        // Grid floor (always visible, fallback when no GLB)
        const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333355);
        this.scene.add(gridHelper);

        // Floor plane (for shadows)
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
        floor.name = '__floor__';
        this.scene.add(floor);

        // OrbitControls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.08;
        this.orbitControls.maxPolarAngle = Math.PI / 2;

        // TransformControls
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.setMode('translate');
        this.transformControls.setSize(0.8);
        this.scene.add(this.transformControls.getHelper());

        // Disable orbit while dragging transform
        this.transformControls.addEventListener('dragging-changed', (event: any) => {
            this.orbitControls.enabled = !event.value;
        });

        // Save position on drag end
        this.transformControls.addEventListener('objectChange', () => {
            const obj = this.transformControls.object;
            if (!obj) return;

            const featureId = obj.userData['featureId'] as string;
            if (featureId && this.spaceId) {
                this.ngZone.run(() => {
                    const pos = {
                        x: parseFloat(obj.position.x.toFixed(3)),
                        y: parseFloat(obj.position.y.toFixed(3)),
                        z: parseFloat(obj.position.z.toFixed(3))
                    };
                    this.spacesFacade.updateFeaturePosition(this.spaceId!, featureId, pos);

                    // Sync signals
                    this.featureX.set(pos.x);
                    this.featureY.set(pos.y);
                    this.featureZ.set(pos.z);
                });
            }
        });

        // Canvas click → Raycasting to select cubes
        this.renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => {
            this.onCanvasClick(event);
        });

        // Resize handling
        this.resizeObserver = new ResizeObserver(() => {
            this.onResize();
        });
        this.resizeObserver.observe(container);
    }

    private animate(): void {
        if (this.isDestroyed) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.orbitControls?.update();
        this.renderer?.render(this.scene, this.camera);
    }

    private onResize(): void {
        const container = this.canvasContainer?.nativeElement;
        if (!container || !this.camera || !this.renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private onCanvasClick(event: PointerEvent): void {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const cubes = Array.from(this.cubeMap.values());
        const intersects = this.raycaster.intersectObjects(cubes);

        if (intersects.length > 0) {
            const hit = intersects[0].object as THREE.Mesh;
            this.transformControls.attach(hit);
            this.ngZone.run(() => {
                this.selectedFeatureId.set(hit.userData['featureId']);
                this.selectedCubeFeatureName.set(hit.userData['featureName'] || '');
                this.featureX.set(parseFloat(hit.position.x.toFixed(3)));
                this.featureY.set(parseFloat(hit.position.y.toFixed(3)));
                this.featureZ.set(parseFloat(hit.position.z.toFixed(3)));
            });
        } else {
            this.transformControls.detach();
            this.ngZone.run(() => {
                this.selectedFeatureId.set(null);
                this.selectedCubeFeatureName.set('');
            });
        }
    }

    // ── 3D Cube Management ──────────────────────────────────────

    private syncCubesToFeatures(): void {
        const featureIds = new Set(this.selectedFeatureIds);
        const features = this.allFeatures();
        const positions = this.spaceId
            ? this.spacesFacade.getFeaturePositions(this.spaceId)
            : {};

        // Remove cubes for deselected features
        for (const [fId, cube] of this.cubeMap) {
            if (!featureIds.has(fId)) {
                this.transformControls.detach();
                this.scene.remove(cube);
                cube.geometry.dispose();
                if (cube.material instanceof THREE.Material) {
                    cube.material.dispose();
                }
                this.cubeMap.delete(fId);
            }
        }

        // Add/update cubes for selected features
        let index = 0;
        for (const fId of this.selectedFeatureIds) {
            const feature = features.find(f => f.id === fId);
            if (!feature) { index++; continue; }

            let cube = this.cubeMap.get(fId);
            if (!cube) {
                cube = this.createFeatureCube(feature, index);
                this.cubeMap.set(fId, cube);
                this.scene.add(cube);
            }

            // Apply saved position if exists
            const savedPos = positions[fId];
            if (savedPos) {
                cube.position.set(savedPos.x, savedPos.y, savedPos.z);
            }

            index++;
        }
    }

    private createFeatureCube(feature: Feature, index: number): THREE.Mesh {
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

        // Default position: spread along x-axis
        const savedPos = this.spaceId
            ? this.spacesFacade.getFeaturePositions(this.spaceId)[feature.id]
            : null;

        if (savedPos) {
            cube.position.set(savedPos.x, savedPos.y, savedPos.z);
        } else {
            cube.position.set(index * 1.2 - 3, 0.3, 0);
        }

        // Store metadata on the mesh
        cube.userData['featureId'] = feature.id;
        cube.userData['featureName'] = feature.name;
        cube.userData['featureDescription'] = feature.description || '';
        cube.name = `cube_${feature.id}`;

        return cube;
    }

    private loadGLBModel(url: string): void {
        // Remove previous room model if exists
        if (this.currentRoomModel) {
            this.scene.remove(this.currentRoomModel);
            this.currentRoomModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
            this.currentRoomModel = null;
        }

        this.gltfLoader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                model.name = '__room_model__';
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.currentRoomModel = model;
                this.scene.add(model);
                this.applyModelScale();
            },
            undefined,
            (error) => {
                console.warn('[SpaceEditor] Failed to load GLB model:', error);
            }
        );
    }

    private loadGLBFromFile(file: File): void {
        // Revoke previous object URL
        if (this.modelObjectUrl) {
            URL.revokeObjectURL(this.modelObjectUrl);
        }
        this.modelObjectUrl = URL.createObjectURL(file);
        this.loadGLBModel(this.modelObjectUrl);
    }

    // ── Form Logic ──────────────────────────────────────────────

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            type: ['', Validators.required],
            floor: [null],
            capacity: [null, [Validators.min(1)]]
        });
    }

    private initFeatureForm(): void {
        this.featureForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            category: ['', Validators.required],
            icon: ['', Validators.required],
            description: ['']
        });
    }

    private loadData(): void {
        this.structuresFacade.loadStructure(this.structureId);
        this.featuresFacade.loadFeatures();

        const checkStructure = setInterval(() => {
            if (this.isDestroyed) { clearInterval(checkStructure); return; }
            const structure = this.structuresFacade.selectedStructure();
            if (structure && structure.id === this.structureId) {
                this.structureName.set(structure.name);
                clearInterval(checkStructure);
            }
        }, 100);

        const checkFeatures = setInterval(() => {
            if (this.isDestroyed) { clearInterval(checkFeatures); return; }
            const features = this.featuresFacade.features();
            if (features.length > 0 || !this.featuresFacade.loading()) {
                this.allFeatures.set(features);
                clearInterval(checkFeatures);
                // Sync cubes after features loaded
                this.syncCubesToFeatures();
            }
        }, 100);

        if (this.isEditMode) {
            this.loadSpace();
        }
    }

    private loadSpace(): void {
        this.spacesFacade.loadSpace(this.spaceId!);
        const checkLoaded = setInterval(() => {
            if (this.isDestroyed) { clearInterval(checkLoaded); return; }
            const space = this.spacesFacade.selectedSpace();
            if (space && space.id === this.spaceId) {
                this.form.patchValue({
                    name: space.name,
                    type: space.type,
                    floor: space.floor,
                    capacity: space.capacity
                });
                this.selectedFeatureIds = [...space.featureIds];

                // Restore camera settings if saved
                if (space.cameraSettings) {
                    this.cameraX.set(space.cameraSettings.position.x);
                    this.cameraY.set(space.cameraSettings.position.y);
                    this.cameraZ.set(space.cameraSettings.position.z);
                }

                // Restore model filename hint
                if (space.modelUrl) {
                    this.modelFileName.set(space.modelUrl.split('/').pop() || 'model.glb');
                }

                // Restore model scale if saved
                if (space.modelScale) {
                    this.modelScaleX.set(space.modelScale.x);
                    this.modelScaleY.set(space.modelScale.y);
                    this.modelScaleZ.set(space.modelScale.z);
                    this.modelScale.set(space.modelScale.x); // use X as uniform reference
                }

                clearInterval(checkLoaded);

                // Load GLB if available
                if (space.modelUrl) {
                    this.spacesFacade.getSpaceModel(space.id).then(blob => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            this.modelObjectUrl = url;
                            this.loadGLBModel(url);
                        } else {
                            this.loadGLBModel(space.modelUrl!);
                        }
                    });
                }

                // Sync cubes with feature positions from localStorage
                this.syncCubesToFeatures();
            }
        }, 100);
    }

    goBack(): void {
        this.location.back();
    }

    getTypeLabel(type: SpaceType): string {
        return SPACE_TYPE_LABELS[type];
    }

    getFeatureCategoryLabel(category: FeatureCategory): string {
        return FEATURE_CATEGORY_LABELS[category];
    }

    isFieldInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && control.touched);
    }

    isFeatureFieldInvalid(field: string): boolean {
        const control = this.featureForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    isFeatureSelected(featureId: string): boolean {
        return this.selectedFeatureIds.includes(featureId);
    }

    toggleFeature(featureId: string): void {
        const index = this.selectedFeatureIds.indexOf(featureId);
        if (index > -1) {
            this.selectedFeatureIds.splice(index, 1);
        } else {
            this.selectedFeatureIds.push(featureId);
        }
        // Re-sync 3D cubes
        this.syncCubesToFeatures();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValue = this.form.value;

        const data: CreateSpaceDto = {
            name: formValue.name,
            type: formValue.type,
            structureId: this.structureId,
            floor: formValue.floor,
            capacity: formValue.capacity,
            featureIds: this.selectedFeatureIds,
            modelUrl: this.modelFileName() ? `assets/3D/${this.modelFileName()}` : undefined,
            cameraSettings: {
                position: { x: this.cameraX(), y: this.cameraY(), z: this.cameraZ() },
                target: { x: 0, y: 0, z: 0 }
            },
            modelScale: {
                x: this.modelScaleX(),
                y: this.modelScaleY(),
                z: this.modelScaleZ()
            }
        };

        const action$ = this.isEditMode
            ? this.spacesFacade.updateSpace(this.spaceId!, data)
            : this.spacesFacade.createSpace(data);

        action$.subscribe({
            next: async (savedSpace) => {
                const spaceId = savedSpace?.id || this.spaceId;
                if (this.modelFile && spaceId) {
                    try {
                        await this.spacesFacade.saveSpaceModel(spaceId, this.modelFile);
                    } catch (e) {
                        console.error('Failed to save model to IndexedDB', e);
                    }
                }
                this.router.navigate(['/structures', this.structureId]);
            },
            error: () => {
                this.isSubmitting = false;
            }
        });
    }

    // ── Delete ───────────────────────────────────────────────────

    confirmDelete(): void {
        this.showDeleteDialog = true;
    }

    onDeleteCancel(): void {
        this.showDeleteDialog = false;
    }

    onDeleteConfirm(): void {
        if (this.spaceId) {
            this.spacesFacade.deleteSpace(this.spaceId).subscribe(() => {
                this.router.navigate(['/structures', this.structureId]);
            });
        }
        this.showDeleteDialog = false;
    }

    // ── Feature Panel ───────────────────────────────────────────

    openAddFeaturePanel(): void {
        this.initFeatureForm();
        this.showAddFeaturePanel.set(true);
    }

    closeAddFeaturePanel(): void {
        if (this.isClosingPanel()) return;
        this.isClosingPanel.set(true);
        setTimeout(() => {
            this.showAddFeaturePanel.set(false);
            this.isClosingPanel.set(false);
        }, 200);
    }

    onCreateFeature(): void {
        if (this.featureForm.invalid) {
            this.featureForm.markAllAsTouched();
            return;
        }

        this.isCreatingFeature.set(true);
        const data: CreateFeatureDto = this.featureForm.value;

        this.featuresFacade.createFeature(data).subscribe({
            next: (newFeature) => {
                this.allFeatures.update(features => [...features, newFeature]);
                this.selectedFeatureIds.push(newFeature.id);
                this.isCreatingFeature.set(false);
                this.closeAddFeaturePanel();
                // Sync new cube
                this.syncCubesToFeatures();
            },
            error: () => {
                this.isCreatingFeature.set(false);
            }
        });
    }

    // ── File Upload ──────────────────────────────────────────────

    onModelFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.handleModelFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.add('drag-over');
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.remove('drag-over');
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.remove('drag-over');

        if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
                this.handleModelFile(file);
            }
        }
    }

    private handleModelFile(file: File): void {
        this.modelFile = file;
        this.modelFileName.set(file.name);
        this.loadGLBFromFile(file);
    }

    removeModelFile(event: Event): void {
        event.stopPropagation();
        this.modelFile = null;
        this.modelFileName.set('');

        // Remove current room model from scene
        if (this.currentRoomModel) {
            this.scene.remove(this.currentRoomModel);
            this.currentRoomModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
            this.currentRoomModel = null;
        }

        // Revoke object URL
        if (this.modelObjectUrl) {
            URL.revokeObjectURL(this.modelObjectUrl);
            this.modelObjectUrl = null;
        }
    }

    // ── Camera Sliders ───────────────────────────────────────────

    onCameraSliderChange(axis: 'x' | 'y' | 'z', event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        switch (axis) {
            case 'x': this.cameraX.set(value); break;
            case 'y': this.cameraY.set(value); break;
            case 'z': this.cameraZ.set(value); break;
        }
        this.applyCameraPosition();
    }

    onFovSliderChange(event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        this.cameraFov.set(value);
        if (this.camera) {
            this.camera.fov = value;
            this.camera.updateProjectionMatrix();
        }
    }

    resetCameraDefaults(): void {
        this.cameraX.set(5);
        this.cameraY.set(5);
        this.cameraZ.set(5);
        this.cameraFov.set(60);
        this.applyCameraPosition();
        if (this.camera) {
            this.camera.fov = 60;
            this.camera.updateProjectionMatrix();
        }
    }

    private applyCameraPosition(): void {
        if (this.camera) {
            this.camera.position.set(this.cameraX(), this.cameraY(), this.cameraZ());
            this.camera.lookAt(0, 0, 0);
        }
        if (this.orbitControls) {
            this.orbitControls.target.set(0, 0, 0);
            this.orbitControls.update();
        }
    }

    // ── Model Scale ──────────────────────────────────────────────

    onModelScaleChange(event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        this.modelScale.set(value);
        this.modelScaleX.set(value);
        this.modelScaleY.set(value);
        this.modelScaleZ.set(value);
        this.applyModelScale();
    }

    onModelAxisScaleChange(axis: 'x' | 'y' | 'z', event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        switch (axis) {
            case 'x': this.modelScaleX.set(value); break;
            case 'y': this.modelScaleY.set(value); break;
            case 'z': this.modelScaleZ.set(value); break;
        }
        this.applyModelScale();
    }

    resetModelScale(): void {
        this.modelScale.set(1);
        this.modelScaleX.set(1);
        this.modelScaleY.set(1);
        this.modelScaleZ.set(1);
        this.applyModelScale();
    }

    private applyModelScale(): void {
        if (this.currentRoomModel) {
            this.currentRoomModel.scale.set(
                this.modelScaleX(),
                this.modelScaleY(),
                this.modelScaleZ()
            );
        }
    }

    onFeatureSliderChange(axis: 'x' | 'y' | 'z', event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        const featureId = this.selectedFeatureId();
        if (!featureId) return;

        const cube = this.cubeMap.get(featureId);
        if (cube) {
            cube.position[axis] = value;

            // Sync signals
            if (axis === 'x') this.featureX.set(value);
            if (axis === 'y') this.featureY.set(value);
            if (axis === 'z') this.featureZ.set(value);

            // Persist
            if (this.spaceId) {
                this.spacesFacade.updateFeaturePosition(this.spaceId, featureId, {
                    x: cube.position.x,
                    y: cube.position.y,
                    z: cube.position.z
                });
            }
        }
    }
}
