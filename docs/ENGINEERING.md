# Aether Engineering Standards

## Purpose

This document defines the engineering principles used throughout Aether.

The goal is to keep the runtime modular, maintainable and easy to evolve.

---

## Core Principles

Every component should have one clear responsibility.

Large features should be composed from small reusable systems.

The runtime should remain independent from the user interface.

Experience data should remain portable.

All new functionality should preserve backwards compatibility where practical.

---

## Runtime Design

The runtime is built from independent systems.

Examples include:

- ExperienceLoader
- ExperienceState
- ExperienceRuntime
- VisualSystem
- AudioSystem
- TransitionController
- ColourInterpolator

No runtime module should become responsible for unrelated behaviour.

---

## Transition System

Transitions should never be implemented directly inside rendering code.

Instead:

- TransitionController manages timing.
- Rendering systems update visuals.
- Helper utilities perform calculations.

This keeps animation reusable across the entire platform.

---

## Coding Standards

- Use TypeScript strict mode.
- Prefer composition over inheritance.
- Avoid duplicated logic.
- Keep functions focused.
- Use descriptive names.
- Avoid unnecessary dependencies.
- Write code that is easy to review.

---

## Git Workflow

Every feature should be developed in small commits.

Before committing:

- Run the production build.
- Check git diff --check.
- Review the diff.
- Write a meaningful commit message.

---

## Documentation

Documentation is treated as part of the product.

Major architectural changes should update:

- ARCHITECTURE.md
- ENGINEERING.md
- DECISIONS.md
- CHANGELOG.md

---

## Long-Term Goal

The codebase should remain understandable by a new developer after reading the documentation and reviewing the recent commit history.

Engineering quality is considered a product feature.
