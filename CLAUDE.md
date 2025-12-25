# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CEM Generator is a Custom Elements Manifest generator that uses TypeScript's compiler API to parse web component source files and generate `custom-elements.json` manifests following the CEM v2.1.0 specification.

## Commands

```bash
# Install dependencies
bun install

# Generate manifest (Bun)
bun run cli.ts src/**/*.ts

# Generate manifest (Node.js)
node --experimental-strip-types cli.ts src/**/*.ts

# Generate manifest (Deno)
deno run --allow-read --allow-write --allow-env cli.ts src/**/*.ts

# CLI options
bun run cli.ts -o manifest.json -p src/**/*.ts  # Pretty print to file
bun run cli.ts -b src -o manifest.json src/**/*.ts  # Custom base path
bun run cli.ts -o - src/**/*.ts  # Output to stdout

# Linting and formatting
bun run lint      # Check with Biome
bun run check     # Check and auto-fix
bun run format    # Format only

# Type check
bunx tsc --noEmit
```

## Architecture

The codebase is split into focused modules:

| File | Purpose |
|------|---------|
| `types.ts` | CEM v2.1.0 manifest types (Manifest, Module, Declaration, etc.) |
| `analyzer.ts` | Core `Analyzer` class - creates TS program, visits AST, builds manifest |
| `jsdoc.ts` | JSDoc parsing: `getJSDoc()`, `extractTagName()`, `extractAttributeName()` |
| `inheritance.ts` | `resolveAllInheritance()` - copies inherited members with `inheritedFrom` refs |
| `runtime.ts` | Cross-runtime utilities: `expandGlob()`, `getArgs()`, `writeFile()`, etc. |
| `cli.ts` | CLI entry point with arg parsing |
| `index.ts` | Public API exports |

### Analysis Flow

1. `Analyzer.analyze()` runs two passes:
   - **Pass 1**: Visit all source files, collect classes/functions/variables into `this.classes` and `this.modules` maps
   - **Pass 2**: `resolveAllInheritance()` uses depth-first traversal to copy inherited members
2. Declarations are updated with inherited data and manifest is returned

### Cross-Runtime Support

`runtime.ts` provides zero-dependency abstractions:
- Bun: Uses `Bun.Glob`, `Bun.argv`
- Node.js: Uses `fs.readdirSync` + manual glob matching
- Deno: Uses `Deno.readDirSync` + manual glob matching

## Test Data

`testdata/` contains example web components testing various patterns:
- `base-element.ts`, `button-element.ts` - Inheritance chain
- `decorators.ts` - `@customElement()`, `@property()` decorators
- `generics.ts` - Generic classes with type parameters
- `static-members.ts` - Static properties and methods
- `constructor-params.ts` - Constructor parameter properties
- `functions-vars.ts` - Standalone functions and variables
- `edge-cases.ts` - Abstract classes, complex types, private fields

Run the generator against test files:
```bash
bun run cli.ts -p testdata/*.ts
```

## Supported JSDoc Tags

| Tag | Description |
|-----|-------------|
| `@customElement <tag>` | Defines custom element tag name |
| `@attr [name]` | Marks property as attribute |
| `@fires <event>` | Documents fired events |
| `@slot [name]` | Documents slots |
| `@cssProperty <name>` | Documents CSS custom properties |
| `@cssPart <name>` | Documents CSS parts |
| `@deprecated [msg]` | Marks as deprecated |
