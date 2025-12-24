# Gestione Strutture - Structure & Space Management Platform

<div align="center">

![Angular](https://img.shields.io/badge/Angular-19.2+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8+-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900?style=for-the-badge&logo=leaflet&logoColor=white)

A modern Single Page Application for managing a catalog of physical structures, internal spaces, and reusable features/services. Built with Angular 19+ using the latest standalone component architecture, reactive patterns with Signals, and the Facade Pattern for clean state management.

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Reference](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Domain Model](#-domain-model)
- [Core Modules](#-core-modules)
- [State Management](#-state-management)
- [API Reference](#-api-reference)
- [UI Components](#-ui-components)
- [Styling System](#-styling-system)
- [Routing & Navigation](#-routing--navigation)
- [Best Practices Applied](#-best-practices-applied)
- [Development Guidelines](#-development-guidelines)

---

## 🚀 Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Complete CRUD Operations** | Full Create, Read, Update, Delete functionality for all three entity types |
| **Hierarchical Navigation** | Navigable structure: Structures → Spaces → Features |
| **Interactive Maps** | Leaflet-powered map integration with geolocation and reverse geocoding |
| **Reactive Forms** | Angular Reactive Forms with comprehensive validation |
| **Real-time Search** | Client-side filtering with instant results |
| **Dark/Light Theme** | Persistent theme switching with system preference detection |

### UX/UI Features

- ✅ **Responsive Layout** - Mobile-first design with collapsible sidebar navigation
- ✅ **Loading States** - Visual feedback during API operations
- ✅ **Empty States** - Informative placeholders when no data exists
- ✅ **Error States** - User-friendly error messages with retry options
- ✅ **Confirmation Dialogs** - Safety prompts for destructive operations
- ✅ **Toast-like Feedback** - Immediate visual confirmation of actions
- ✅ **Smooth Animations** - CSS transitions and keyframe animations

### Technical Highlights

- ✅ **Angular 19+** with standalone components (no NgModules)
- ✅ **Signals** for reactive state management
- ✅ **Facade Pattern** for business logic isolation
- ✅ **Lazy Loading** for optimized bundle sizes
- ✅ **OnPush Change Detection** for improved performance
- ✅ **Simulated REST API** using angular-in-memory-web-api
- ✅ **TailwindCSS v4** with CSS custom properties

---

## 🏗 Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Structures    │  │     Spaces      │  │    Features     │  │
│  │   Components    │  │   Components    │  │   Components    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                    SHARED COMPONENTS                      │  │
│  │  PageHeader │ SearchInput │ ConfirmDialog │ States (UI)   │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────┐
│                         FACADE LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Structures     │  │    Spaces       │  │   Features      │  │
│  │    Facade       │  │    Facade       │  │    Facade       │  │
│  │ (State+Logic)   │  │ (State+Logic)   │  │ (State+Logic)   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
┌───────────▼────────────────────▼────────────────────▼───────────┐
│                          DATA LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              InMemoryDataService (Mock API)              │   │
│  │  - Structures Collection                                 │   │
│  │  - Spaces Collection                                     │   │
│  │  - Features Collection                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Patterns Applied

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Facade Pattern** | `*Facade` services | Isolates components from complex state management and API logic |
| **Repository Pattern** | InMemoryDataService | Abstracts data persistence layer |
| **Smart/Dumb Components** | Container vs Presentational | Separates data logic from UI rendering |
| **Observable Store** | Signal-based state | Reactive state management with computed values |

---

## 🛠 Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 19.2.17+ | Core SPA framework with standalone components |
| **TypeScript** | 5.5.2 | Static typing and modern JavaScript features |
| **RxJS** | 7.8.x | Reactive programming and HTTP operations |
| **Angular Router** | 19.2.17+ | Client-side routing with lazy loading |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **TailwindCSS** | 4.1.18 | Utility-first CSS framework |
| **Spartan UI** | 0.0.1-alpha.584 | Angular headless UI components base |
| **Lucide Angular** | 0.562.0 | Modern, customizable icon library |
| **SCSS** | - | Enhanced CSS with variables and mixins |

### Maps & Geolocation

| Technology | Version | Purpose |
|------------|---------|---------|
| **Leaflet** | 1.9.4 | Interactive map rendering |
| **OpenStreetMap** | - | Map tiles and geocoding services |

### Development & Build

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular CLI** | 19.2.19 | Project scaffolding and build tooling |
| **angular-in-memory-web-api** | 0.21.0 | Mock REST API simulation |
| **Karma/Jasmine** | 6.4.0/5.2.0 | Unit testing framework |
| **PostCSS** | 8.5.6 | CSS processing pipeline |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x (LTS recommended)
- **npm** >= 9.x or **yarn** >= 1.22.x
- **Angular CLI** >= 19.x (globally installed)

```bash
# Verify installations
node --version  # Should output v18.x or higher
npm --version   # Should output 9.x or higher
ng version      # Should show Angular CLI 19.x
```

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd gestione-strutture
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm start
# or
ng serve
```

4. **Open in browser**

Navigate to `http://localhost:4200/`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 4200 |
| `npm run build` | Create production build in `dist/` |
| `npm run watch` | Build with file watching |
| `npm test` | Run unit tests with Karma |

---

## 📁 Project Structure

```
gestione-strutture/
├── src/
│   ├── app/
│   │   ├── core/                      # Core singleton services & models
│   │   │   ├── models/                # TypeScript interfaces & DTOs
│   │   │   │   ├── structure.model.ts # Structure entity definition
│   │   │   │   ├── space.model.ts     # Space entity definition
│   │   │   │   ├── feature.model.ts   # Feature entity definition
│   │   │   │   └── index.ts           # Barrel export
│   │   │   └── services/              # Application-wide services
│   │   │       ├── structures.facade.ts   # Structure state management
│   │   │       ├── spaces.facade.ts       # Space state management
│   │   │       ├── features.facade.ts     # Feature state management
│   │   │       ├── in-memory-data.service.ts  # Mock API data
│   │   │       └── index.ts           # Barrel export
│   │   │
│   │   ├── features/                  # Feature modules (lazy-loaded)
│   │   │   ├── structures/            # Structure management feature
│   │   │   │   ├── structures-list/   # List view component
│   │   │   │   ├── structure-detail/  # Detail view with spaces
│   │   │   │   ├── structure-form/    # Create/Edit form
│   │   │   │   ├── space-form/        # Space CRUD within structure
│   │   │   │   └── structures.routes.ts  # Feature routes
│   │   │   │
│   │   │   └── features/              # Features/Services management
│   │   │       ├── features-list/     # List view component
│   │   │       ├── feature-form/      # Create/Edit form
│   │   │       └── features.routes.ts # Feature routes
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   └── main-layout/           # App shell with sidebar
│   │   │
│   │   ├── shared/                    # Shared reusable components
│   │   │   └── components/
│   │   │       ├── confirm-dialog/    # Confirmation modal
│   │   │       ├── empty-state/       # Empty data placeholder
│   │   │       ├── error-state/       # Error display component
│   │   │       ├── loading-state/     # Loading spinner
│   │   │       ├── page-header/       # Page title component
│   │   │       ├── search-input/      # Search bar component
│   │   │       └── index.ts           # Barrel export
│   │   │
│   │   ├── app.component.ts           # Root component
│   │   ├── app.config.ts              # Application configuration
│   │   └── app.routes.ts              # Root routing configuration
│   │
│   ├── assets/                        # Static assets
│   ├── styles.scss                    # Global styles & design system
│   ├── main.ts                        # Application bootstrap
│   └── index.html                     # HTML entry point
│
├── angular.json                       # Angular workspace config
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
└── tailwind.config.js                 # TailwindCSS configuration
```

---

## 📊 Domain Model

### Entity Relationships

```
┌─────────────────┐
│    Structure    │
│─────────────────│
│ id: string      │
│ name: string    │
│ address: string │
│ city: string    │        ┌─────────────────┐
│ coordinates     │◄───────┤     Space       │
│ openingHours    │   1:N  │─────────────────│
│ phone           │        │ id: string      │
│ email           │        │ structureId     │──────┐
│ description     │        │ name: string    │      │
│ createdAt       │        │ type: SpaceType │      │
│ updatedAt       │        │ capacity        │      │
└─────────────────┘        │ floor           │      │   ┌─────────────────┐
                           │ featureIds[]    │──────┼──►│    Feature      │
                           │ createdAt       │  N:M │   │─────────────────│
                           │ updatedAt       │      │   │ id: string      │
                           └─────────────────┘      │   │ name: string    │
                                                    │   │ icon: string    │
                                                    │   │ category        │
                                                    │   │ description     │
                                                    └──►└─────────────────┘
```

### Structure Entity

```typescript
interface Structure {
    id: string;
    name: string;           // Required - Building/venue name
    address: string;        // Required - Street address
    city: string;           // Required - City name
    description?: string;   // Optional - Detailed description
    openingHours?: string;  // Optional - Business hours
    phone?: string;         // Optional - Contact phone
    email?: string;         // Optional - Contact email
    coordinates: {          // Required - Map position
        lat: number;
        lng: number;
    };
    imageUrl?: string;      // Optional - Structure image
    createdAt: Date;        // Auto-generated
    updatedAt: Date;        // Auto-updated on changes
}
```

### Space Entity

```typescript
type SpaceType = 'meeting_room' | 'office' | 'bathroom' | 
                 'common_area' | 'storage' | 'kitchen';

interface Space {
    id: string;
    structureId: string;    // Required - Parent structure reference
    name: string;           // Required - Space name
    type: SpaceType;        // Required - Classification
    capacity?: number;      // Optional - Max occupancy
    floor?: string;         // Optional - Floor level
    featureIds: string[];   // Array of associated feature IDs
    createdAt: Date;
    updatedAt: Date;
}
```

### Feature Entity

```typescript
type FeatureCategory = 'connectivity' | 'equipment' | 
                       'accessibility' | 'comfort';

interface Feature {
    id: string;
    name: string;           // Required - Feature name
    icon: string;           // Required - Lucide icon name
    category: FeatureCategory;  // Required - Classification
    description?: string;   // Optional - Detailed description
}
```

---

## 🎯 Core Modules

### Core Module (`/core`)

The core module contains singleton services and domain models that are instantiated once and shared across the entire application.

#### Models (`/core/models`)

| File | Purpose |
|------|---------|
| `structure.model.ts` | Structure interface, CreateStructureDto, UpdateStructureDto |
| `space.model.ts` | Space interface, SpaceType enum, DTOs, SPACE_TYPE_LABELS |
| `feature.model.ts` | Feature interface, FeatureCategory enum, DTOs, FEATURE_CATEGORY_LABELS |
| `index.ts` | Barrel export for clean imports |

#### Services (`/core/services`)

| File | Purpose |
|------|---------|
| `structures.facade.ts` | Structure state management and API operations |
| `spaces.facade.ts` | Space state management with structure context |
| `features.facade.ts` | Feature state management with category filtering |
| `in-memory-data.service.ts` | Mock REST API with sample data |

### Shared Module (`/shared`)

Reusable, presentational components with no business logic.

| Component | Purpose | Inputs |
|-----------|---------|--------|
| `PageHeaderComponent` | Page titles with optional subtitles | `title`, `subtitle` |
| `SearchInputComponent` | Search bar with clear button | `value`, `placeholder` |
| `LoadingStateComponent` | Loading spinner overlay | `message` |
| `EmptyStateComponent` | Empty data placeholder | `icon`, `title`, `message` |
| `ErrorStateComponent` | Error display with retry | `message`, `retryAction` |
| `ConfirmDialogComponent` | Confirmation modal | `isOpen`, `title`, `message`, `variant` |

### Layout Module (`/layout`)

Application shell components.

| Component | Purpose |
|-----------|---------|
| `MainLayoutComponent` | App shell with sidebar, topbar, and router outlet |

### Feature Modules (`/features`)

Lazy-loaded feature areas organized by domain.

#### Structures Feature

| Component | Description |
|-----------|-------------|
| `StructuresListComponent` | Grid view of all structures with search |
| `StructureDetailComponent` | Detail view with map and spaces list |
| `StructureFormComponent` | Create/edit form with geocoding |
| `SpaceFormComponent` | Create/edit spaces within structure context |

#### Features Feature

| Component | Description |
|-----------|-------------|
| `FeaturesListComponent` | Grid view with category filters |
| `FeatureFormComponent` | Create/edit feature form |

---

## 🔄 State Management

### Signal-Based Reactive State

The application uses Angular's new **Signals** API for reactive state management, combined with the **Facade Pattern** for clean separation of concerns.

#### Facade Structure

Each facade follows this pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class StructuresFacade {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'api/structures';

    // Private mutable state
    private readonly _state = signal<StructuresState>(initialState);

    // Public read-only computed signals
    readonly structures = computed(() => this._state().structures);
    readonly selectedStructure = computed(() => this._state().selectedStructure);
    readonly loading = computed(() => this._state().loading);
    readonly error = computed(() => this._state().error);
    readonly isEmpty = computed(() => !this.loading() && this.structures().length === 0);

    // Client-side filtering
    private searchTerm = signal('');
    readonly filteredStructures = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.structures();
        return this.structures().filter(s => 
            s.name.toLowerCase().includes(term) ||
            s.city.toLowerCase().includes(term)
        );
    });

    // State mutations via private method
    private updateState(partial: Partial<StructuresState>): void {
        this._state.update(state => ({ ...state, ...partial }));
    }
}
```

#### State Interface Pattern

```typescript
interface StructuresState {
    structures: Structure[];
    selectedStructure: Structure | null;
    loading: boolean;
    error: string | null;
}
```

### Benefits of This Approach

1. **Immutable Updates** - State changes create new objects, enabling OnPush detection
2. **Computed Values** - Derived data (filters, isEmpty) are automatically memoized
3. **Type Safety** - Full TypeScript inference for state shape
4. **Component Isolation** - Components only access what facades expose
5. **Testability** - Facades can be easily mocked for unit tests

---

## 📡 API Reference

### REST Endpoints (Simulated)

The application uses `angular-in-memory-web-api` to simulate a REST backend. All endpoints follow RESTful conventions:

#### Structures API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/structures` | Get all structures |
| GET | `/api/structures/:id` | Get structure by ID |
| POST | `/api/structures` | Create new structure |
| PUT | `/api/structures/:id` | Update structure |
| DELETE | `/api/structures/:id` | Delete structure |

#### Spaces API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spaces` | Get all spaces |
| GET | `/api/spaces/:id` | Get space by ID |
| POST | `/api/spaces` | Create new space |
| PUT | `/api/spaces/:id` | Update space |
| DELETE | `/api/spaces/:id` | Delete space |

#### Features API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/features` | Get all features |
| GET | `/api/features/:id` | Get feature by ID |
| POST | `/api/features` | Create new feature |
| PUT | `/api/features/:id` | Update feature |
| DELETE | `/api/features/:id` | Delete feature |

### Mock Data Configuration

The `InMemoryDataService` provides initial seed data:

```typescript
createDb() {
    return {
        structures: [...],  // 9 landmark structures
        spaces: [...],      // 23 spaces across structures
        features: [...]     // 8 feature types
    };
}
```

### External API Integration

The application integrates with **Nominatim (OpenStreetMap)** for geocoding:

| Service | Purpose |
|---------|---------|
| Forward Geocoding | Convert address text to coordinates |
| Reverse Geocoding | Convert coordinates to address |

---

## 🎨 UI Components

### Design System

The application implements a cohesive design system using CSS custom properties:

#### Color Tokens (Light Mode)

```scss
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--card: 0 0% 100%;
--primary: 240 5.9% 10%;
--secondary: 240 4.8% 95.9%;
--muted: 240 4.8% 95.9%;
--accent: 240 4.8% 95.9%;
--destructive: 0 84.2% 60.2%;
--border: 240 5.9% 90%;
```

#### Color Tokens (Dark Mode)

```scss
.dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --primary: 0 0% 98%;
    --secondary: 240 3.7% 15.9%;
    --muted: 240 3.7% 15.9%;
    --accent: 240 3.7% 15.9%;
    --destructive: 0 62.8% 30.6%;
    --border: 240 3.7% 15.9%;
}
```

### Component Classes

#### Buttons

| Class | Description |
|-------|-------------|
| `.btn` | Base button styles |
| `.btn-primary` | Primary action button |
| `.btn-outline` | Secondary outlined button |
| `.btn-danger` | Destructive action button |
| `.btn-sm` | Small button variant |
| `.icon-btn` | Icon-only button |

#### Cards

| Class | Description |
|-------|-------------|
| `.card` | Base card container |
| `.card-header` | Card header section |
| `.card-title` | Card title text |
| `.list-card` | Card for list items |
| `.form-card` | Card for forms |

#### Forms

| Class | Description |
|-------|-------------|
| `.form-group` | Form field wrapper |
| `.form-row` | Two-column form row |
| `.form-label` | Input label |
| `.form-input` | Text input styling |
| `.form-select` | Select dropdown styling |
| `.form-textarea` | Multiline text input |
| `.form-error` | Error message text |

---

## 🚀 Styling System

### TailwindCSS v4 Integration

The project uses TailwindCSS v4 with PostCSS for modern CSS processing:

```scss
// styles.scss
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "@spartan-ng/brain/hlm-tailwind-preset.css";
```

### CSS Architecture

```
styles.scss
├── Theme Layer (CSS Variables)
│   ├── Light Mode Variables
│   └── Dark Mode Variables
├── Base Layer (Reset & Defaults)
│   ├── Body Styles
│   ├── Scrollbar Customization
│   └── Selection Styles
├── Components Layer
│   ├── Button Styles (.btn-*)
│   ├── Card Styles (.card-*)
│   ├── Form Styles (.form-*)
│   ├── Dialog Styles (.dialog-*)
│   ├── List Styles (.list-*)
│   └── Map Styles (.map-*)
└── Utilities Layer
    └── Page Container, Spinner, etc.
```

### Responsive Breakpoints

| Breakpoint | Width | CSS |
|------------|-------|-----|
| Mobile | < 640px | `@media (max-width: 640px)` |
| Tablet | < 1024px | `@media (max-width: 1024px)` |
| Desktop | >= 1024px | Default |

---

## 🔀 Routing & Navigation

### Route Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/main-layout/main-layout.component')
            .then(m => m.MainLayoutComponent),
        children: [
            { path: '', redirectTo: 'structures', pathMatch: 'full' },
            {
                path: 'structures',
                loadChildren: () => import('./features/structures/structures.routes')
                    .then(m => m.STRUCTURES_ROUTES)
            },
            {
                path: 'features',
                loadChildren: () => import('./features/features/features.routes')
                    .then(m => m.FEATURES_ROUTES)
            }
        ]
    },
    { path: '**', redirectTo: 'structures' }
];
```

### Feature Routes

#### Structures Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/structures` | StructuresListComponent | View all structures |
| `/structures/new` | StructureFormComponent | Create structure |
| `/structures/:id` | StructureDetailComponent | View structure details |
| `/structures/:id/edit` | StructureFormComponent | Edit structure |
| `/structures/:structureId/spaces/new` | SpaceFormComponent | Add space |
| `/structures/:structureId/spaces/:spaceId/edit` | SpaceFormComponent | Edit space |

#### Features Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/features` | FeaturesListComponent | View all features |
| `/features/new` | FeatureFormComponent | Create feature |
| `/features/:id/edit` | FeatureFormComponent | Edit feature |

### Navigation Features

- **Lazy Loading** - Feature modules loaded on demand
- **Component Input Binding** - Route params bound directly to component inputs
- **RouterLinkActive** - Active route highlighting in sidebar
- **Programmatic Navigation** - Router service for imperative navigation

---

## ✅ Best Practices Applied

### Software Design Principles

| Principle | Implementation |
|-----------|---------------|
| **DRY** (Don't Repeat Yourself) | Shared components, utility classes, barrel exports |
| **KISS** (Keep It Simple, Stupid) | Simple component architecture, clear naming |
| **Separation of Concerns** | Facades for logic, components for UI, services for data |
| **Single Responsibility** | Each component/service has one clear purpose |

### Angular Best Practices

| Practice | Implementation |
|----------|---------------|
| **Standalone Components** | All components use `standalone: true` |
| **OnPush Change Detection** | Enabled on all presentation components |
| **Lazy Loading** | Feature modules loaded on demand |
| **Reactive Forms** | FormBuilder with validators |
| **TypeScript Strict Mode** | Full type safety enforcement |
| **Barrel Exports** | Clean import paths via index.ts files |

### Performance Optimizations

| Optimization | Benefit |
|--------------|---------|
| **Lazy Route Loading** | Smaller initial bundle size |
| **OnPush Detection** | Reduced change detection cycles |
| **Signal Memoization** | Computed values cached automatically |
| **TrackBy Functions** | Efficient list rendering |
| **Pure Pipes** | Cached transformation results |

### Code Organization

| Pattern | Purpose |
|---------|---------|
| **Feature Folders** | Colocate related components, routes, styles |
| **Smart/Dumb Components** | Separate container logic from presentation |
| **Facade Pattern** | Hide complexity behind simple interfaces |
| **Barrel Exports** | Simplify import statements |

---

## 👨‍💻 Development Guidelines

### Component Creation

When creating new components:

```typescript
@Component({
    selector: 'app-component-name',
    standalone: true,
    imports: [CommonModule, ...],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './component-name.component.html',
    styleUrl: './component-name.component.scss'
})
export class ComponentNameComponent {
    // Use inject() for dependencies
    private readonly service = inject(SomeService);
    
    // Use signals for local state
    data = signal<DataType | null>(null);
}
```

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Angular Team](https://angular.dev) - For the fantastic framework
- [Leaflet](https://leafletjs.com) - For the mapping library
- [Lucide Icons](https://lucide.dev) - For the beautiful icon set
- [TailwindCSS](https://tailwindcss.com) - For the utility-first CSS framework
- [OpenStreetMap](https://www.openstreetmap.org) - For map tiles and geocoding

---

<div align="center">

**Built with ❤️ using Angular 19+**

</div>
