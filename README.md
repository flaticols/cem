# CEM Generator

Custom Elements Manifest generator using TypeScript compiler API with full class inheritance support.

## Features

- **Cross-runtime** - Works with Node.js, Bun, and Deno (zero dependencies)
- **AST-based parsing** - Uses TypeScript's compiler API, not regex
- **Class inheritance resolution** - Tracks inherited members with `inheritedFrom` references
- **JSDoc support** - Parses `@attr`, `@fires`, `@slot`, `@cssProperty`, `@cssPart`, `@customElement`, `@deprecated`
- **Decorator support** - Recognizes `@customElement()` and `@property()` decorators
- **CEM v2.1.0 compliant** - Outputs valid Custom Elements Manifest

## Installation

```bash
# Bun
bun add @flaticols/cem

# npm
npm install @flaticols/cem

# JSR (Deno)
deno add jsr:@flaticols/cem
```

## CLI Usage

```bash
# Bun
bun run cem-generator src/**/*.ts

# Node.js (v22.6+)
npx cem-generator src/**/*.ts

# Deno
deno run --allow-read --allow-write --allow-env jsr:@flaticols/cem/cli src/**/*.ts
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file (default: `custom-elements.json`), use `-` for stdout |
| `-b, --basedir <path>` | Base directory for path resolution in manifest |
| `-p, --pretty` | Pretty print JSON output |
| `-h, --help` | Show help |

### Examples

```bash
# Pretty print to custom file
cem-generator -o manifest.json -p src/**/*.ts

# Custom base path (paths in manifest will be relative to src/)
cem-generator -b src -o manifest.json src/**/*.ts

# Output to stdout
cem-generator -o - src/**/*.ts
```

## Programmatic Usage

```typescript
import { Analyzer, type Manifest } from "@flaticols/cem";

const files = ["src/my-element.ts"];
const baseDir = process.cwd();

const analyzer = new Analyzer(files, baseDir);
const manifest: Manifest = analyzer.analyze();

console.log(JSON.stringify(manifest, null, 2));
```

## Supported JSDoc Tags

| Tag | Description |
|-----|-------------|
| `@customElement <tag-name>` | Defines custom element tag name |
| `@attr [name]` | Marks property as an attribute |
| `@fires <event-name>` | Documents fired events |
| `@slot [name]` | Documents slots |
| `@cssProperty <name>` | Documents CSS custom properties |
| `@cssPart <name>` | Documents CSS parts |
| `@deprecated [message]` | Marks as deprecated |

## Example

```typescript
/**
 * A button component
 * @customElement my-button
 * @fires click - Fired on click
 * @slot icon - Optional icon slot
 * @cssProperty --button-bg - Background color
 */
export class MyButton extends HTMLElement {
  /**
   * Button variant
   * @attr
   */
  variant: "primary" | "secondary" = "primary";
}
```

## License

MIT
