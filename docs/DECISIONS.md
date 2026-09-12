# Aether Engineering Decisions

## Purpose

This document records important architectural decisions and the reasoning behind them.

It is intended to explain *why* the platform is designed the way it is, helping future contributors understand the trade-offs made during development.

---

## Decision 001

### Runtime-first Architecture

Decision

The runtime is developed independently of the Studio user interface.

Reason

Separating runtime logic from presentation allows the same engine to power multiple applications in the future.

Consequence

The runtime can later support web, desktop and cloud environments without redesign.

---

## Decision 002

### Data-driven Experiences

Decision

Experiences are stored as JSON.

Reason

JSON is portable, easy to version, and suitable for APIs, browser storage and future cloud synchronisation.

Consequence

Experiences remain independent of the editor.

---

## Decision 003

### Generic Transition Controller

Decision

TransitionController manages timing only.

Reason

Animation timing should remain independent from rendering.

Consequence

The same controller can animate lighting, fog, particles, audio and future systems.

---

## Decision 004

### ColourInterpolator

Decision

Colour interpolation is implemented separately from TransitionController.

Reason

Colour mathematics and animation timing are different responsibilities.

Consequence

The colour utility can be reused anywhere within the runtime.

---

## Decision 005

### Modular Visual Systems

Decision

Lighting, fog, particles and audio are implemented as independent systems.

Reason

Each visual effect evolves independently.

Consequence

Future systems can be added without modifying existing modules.

---

## Decision 006

### Browser Experience Library

Decision

The personal experience library uses browser Local Storage.

Reason

It provides immediate persistence without requiring backend infrastructure.

Consequence

Future cloud synchronisation can be added without changing the experience format.

---

## Future Decisions

Additional architectural decisions should be added as the platform evolves rather than replacing earlier entries.

Historical context is valuable.
