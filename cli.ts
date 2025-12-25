#!/usr/bin/env node
/**
 * Custom Elements Manifest Generator CLI
 *
 * Usage:
 *   node cli.ts [options] <files...>
 *   bun run cli.ts [options] <files...>
 *   deno run --allow-read --allow-write --allow-env cli.ts [options] <files...>
 *
 * Options:
 *   -o, --output <file>    Output file (default: custom-elements.json)
 *   -b, --basedir <path>   Base directory for path resolution in manifest
 *   -p, --pretty           Pretty print JSON
 *   -h, --help             Show help
 */

import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { Analyzer } from "./analyzer.ts";
import { exit, expandGlob, getArgs, getCwd, writeFile } from "./runtime.ts";

const HELP_TEXT = `
Custom Elements Manifest Generator

Usage:
  cem-generator [options] <files...>

Options:
  -o, --output <file>    Output file (default: custom-elements.json)
                         Use "-" to output to stdout
  -b, --basedir <path>   Base directory for path resolution in manifest
                         (default: current working directory)
  -p, --pretty           Pretty print JSON
  -h, --help             Show help

Examples:
  cem-generator src/*.ts
  cem-generator -o manifest.json -p src/**/*.ts
  cem-generator -b src -o manifest.json src/**/*.ts
  cem-generator -o - src/**/*.ts

Runtimes:
  node --experimental-strip-types cli.ts <files...>
  bun run cli.ts <files...>
  deno run --allow-read --allow-write --allow-env cli.ts <files...>
`;

async function main(): Promise<void> {
	const args = getArgs();

	const { values, positionals } = parseArgs({
		args,
		options: {
			output: { type: "string", short: "o", default: "custom-elements.json" },
			basedir: { type: "string", short: "b" },
			pretty: { type: "boolean", short: "p", default: false },
			help: { type: "boolean", short: "h", default: false },
		},
		allowPositionals: true,
	});

	if (values.help || positionals.length === 0) {
		console.log(HELP_TEXT);
		exit(values.help ? 0 : 1);
	}

	const cwd = getCwd();
	const baseDir = values.basedir ? resolve(cwd, values.basedir) : cwd;

	// Expand globs
	const files = await expandGlob(positionals, cwd);

	if (files.length === 0) {
		console.error("No files found");
		exit(1);
	}

	console.error(`Analyzing ${files.length} file(s)...`);
	for (const file of files) {
		console.error(`  ${relative(baseDir, file)}`);
	}

	const analyzer = new Analyzer(files, baseDir);
	const manifest = analyzer.analyze();

	const json = values.pretty ? JSON.stringify(manifest, null, 2) : JSON.stringify(manifest);

	if (values.output === "-") {
		console.log(json);
	} else {
		writeFile(values.output, json);
		console.error(`Manifest written to: ${values.output}`);
	}
}

// Run when executed as main module
// Note: For Bun/Deno, import.meta.main works directly
// For Node.js, we check if this is the entry point
const isBun = typeof (globalThis as Record<string, unknown>).Bun !== "undefined";
const isDeno = typeof (globalThis as Record<string, unknown>).Deno !== "undefined";

if (isBun || isDeno) {
	// Bun and Deno support import.meta.main
	if ((import.meta as { main?: boolean }).main) {
		main().catch((err) => {
			console.error(err);
			exit(1);
		});
	}
} else {
	// Node.js: always run since this is the CLI entry point
	main().catch((err) => {
		console.error(err);
		exit(1);
	});
}

export { main };
