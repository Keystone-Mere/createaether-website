# Aether Architecture

## Overview

Aether is a modular runtime for building immersive digital experiences.

The platform separates experience data, runtime state, rendering systems and transition logic into independent components. This keeps the engine maintainable, extensible and suitable for future desktop, cloud and embedded deployments.

The current implementation powers the Aether Studio website but is designed to evolve into a reusable runtime that can be integrated into multiple products.

---

## Core Principles

The architecture follows several guiding principles:

- Separation of concerns
- Runtime-first design
- Modular visual systems
- Data-driven experiences
- Reusable transition framework
- Strict TypeScript development
- Incremental feature delivery
- Clean Git history

---

## Runtime Pipeline

The runtime is organised into distinct layers:

    Experience JSON
            │
            ▼
    ExperienceLoader
            │
            ▼
    ExperienceState
            │
            ▼
    ExperienceRuntime
            │
            ▼
    VisualSystem
            │
     ┌──────┼────────────┬────────────┐
     ▼      ▼            ▼            ▼
 Lighting  Fog      Particles      Audio

Each layer has a single responsibility.

---

## Experience Layer

Experiences are stored as JSON documents.

Each experience defines:

- metadata
- audio
- atmosphere
- lighting
- fog
- particles
- transitions

This allows experiences to remain portable between Studio, APIs and future cloud services.

---

## Runtime State

ExperienceState provides the single source of truth while an experience is active.

Responsibilities include:

- current experience
- runtime values
- transition settings
- visual configuration
- audio configuration

Visual systems consume state but do not own it.

---

## Rendering Pipeline

Visual effects are implemented as independent modules.

Current systems include:

- CSS Lighting
- CSS Fog
- CSS Particles
- Canvas Particles
- Audio System

Additional systems can be introduced without modifying existing modules.

---

## Transition Framework

Transitions are intentionally separated from rendering.

TransitionController is responsible for:

- timing
- easing
- cancellation
- animation lifecycle

It has no knowledge of colours or rendering.

---

## Colour Interpolation

ColourInterpolator performs:

- Hex to RGB conversion
- RGB interpolation
- Hex reconstruction

Keeping colour mathematics separate allows the same utility to be reused across lighting, fog, particles and future post-processing effects.

---

## Studio Architecture

Current Studio capabilities include:

- Live Preview
- Runtime Switching
- Import
- Export
- Personal Browser Library
- Rename
- Duplicate
- Continue Editing

The editor communicates with the runtime rather than rendering effects directly.

---

## Storage

The current implementation stores personal experiences in browser Local Storage.

This provides:

- offline persistence
- zero server requirements
- instant loading

Future versions may support cloud synchronisation.

---

## Current Runtime Modules

- Audio
- Lighting
- Fog
- CSS Particles
- Canvas Particles

Each module is independently replaceable.

---

## Future Architecture

The runtime has been designed to accommodate future systems including:

- Camera System
- Weather System
- Timeline System
- Animation Presets
- Cloud Synchronisation
- Plugin SDK
- AI-assisted experience generation

---

## Summary

Aether separates experience data, runtime state, rendering systems, transitions and utilities into focused components that can evolve independently while sharing a common runtime architecture.

This modular approach prioritises maintainability, extensibility and long-term product development.
