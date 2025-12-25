/**
 * Cross-runtime utilities for Node.js, Bun, and Deno compatibility
 * Zero dependencies - uses only native APIs
 */

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// Declare global types for Bun and Deno
declare const Bun: {
	argv: string[];
	Glob: new (
		pattern: string,
	) => {
		scan: (opts: { cwd: string; absolute: boolean }) => AsyncIterable<string>;
	};
};

declare const Deno: {
	args: string[];
	cwd: () => string;
	exit: (code: number) => never;
	writeTextFileSync: (path: string, content: string) => void;
	readDirSync: (path: string) => Iterable<{ name: string; isDirectory: boolean; isFile: boolean }>;
	statSync: (path: string) => { isDirectory: boolean; isFile: boolean };
};

/**
 * Detected runtime environment
 */
export const runtime: "bun" | "deno" | "node" =
	typeof Bun !== "undefined" ? "bun" : typeof Deno !== "undefined" ? "deno" : "node";

/**
 * Get CLI arguments (excluding runtime and script path)
 */
export function getArgs(): string[] {
	if (runtime === "bun") {
		return Bun.argv.slice(2);
	}
	if (runtime === "deno") {
		return Deno.args;
	}
	return process.argv.slice(2);
}

/**
 * Get current working directory
 */
export function getCwd(): string {
	if (runtime === "deno") {
		return Deno.cwd();
	}
	return process.cwd();
}

/**
 * Exit process with code
 */
export function exit(code: number): never {
	if (runtime === "deno") {
		Deno.exit(code);
	}
	process.exit(code);
}

/**
 * Write content to file synchronously
 */
export function writeFile(path: string, content: string): void {
	if (runtime === "deno") {
		Deno.writeTextFileSync(path, content);
		return;
	}
	writeFileSync(path, content);
}

/**
 * Check if current module is the main entry point
 */
export function isMainModule(importMetaUrl: string): boolean {
	if (runtime === "bun" || runtime === "deno") {
		// Both Bun and Deno support import.meta.main but we receive the url for safety
		return true; // Called only from cli.ts which checks import.meta.main
	}
	// Node.js: compare import.meta.url with process.argv[1]
	const scriptPath = resolve(process.argv[1] ?? "");
	const modulePath = importMetaUrl.startsWith("file://") ? importMetaUrl.slice(7) : importMetaUrl;
	return resolve(modulePath) === scriptPath;
}

/**
 * Simple glob pattern matching
 * Supports: *, **, ?
 */
function matchGlob(pattern: string, path: string): boolean {
	// Normalize separators
	const normalizedPattern = pattern.replace(/\//g, sep);
	const normalizedPath = path.replace(/\//g, sep);

	// Convert glob pattern to regex
	let regexStr = "^";
	let i = 0;

	while (i < normalizedPattern.length) {
		const char = normalizedPattern[i];

		if (char === "*") {
			if (normalizedPattern[i + 1] === "*") {
				// ** matches any path including separators
				if (normalizedPattern[i + 2] === sep || i + 2 >= normalizedPattern.length) {
					regexStr += `(?:.*(?:${sep.replace(/\\/g, "\\\\")}|$))?`;
					i += normalizedPattern[i + 2] === sep ? 3 : 2;
				} else {
					regexStr += ".*";
					i += 2;
				}
			} else {
				// * matches anything except separator
				regexStr += `[^${sep.replace(/\\/g, "\\\\")}]*`;
				i++;
			}
		} else if (char === "?") {
			regexStr += `[^${sep.replace(/\\/g, "\\\\")}]`;
			i++;
		} else if (
			char === "[" ||
			char === "]" ||
			char === "(" ||
			char === ")" ||
			char === "{" ||
			char === "}" ||
			char === "." ||
			char === "+" ||
			char === "^" ||
			char === "$" ||
			char === "|" ||
			char === "\\"
		) {
			regexStr += `\\${char}`;
			i++;
		} else {
			regexStr += char;
			i++;
		}
	}

	regexStr += "$";

	try {
		const regex = new RegExp(regexStr, "i");
		return regex.test(normalizedPath);
	} catch {
		return false;
	}
}

/**
 * Recursively walk directory and collect files matching pattern
 */
function walkDir(dir: string, baseDir: string, pattern: string, results: string[]): void {
	let entries: { name: string; isDirectory: boolean }[];

	if (runtime === "deno") {
		entries = Array.from(Deno.readDirSync(dir)).map((e) => ({
			name: e.name,
			isDirectory: e.isDirectory,
		}));
	} else {
		entries = readdirSync(dir, { withFileTypes: true }).map((e) => ({
			name: e.name,
			isDirectory: e.isDirectory(),
		}));
	}

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		const relativePath = relative(baseDir, fullPath);

		if (entry.isDirectory) {
			// Check if pattern could match files in this directory
			if (
				pattern.includes("**") ||
				pattern.startsWith(relativePath) ||
				relativePath.startsWith(pattern.split("*")[0] ?? "")
			) {
				walkDir(fullPath, baseDir, pattern, results);
			}
		} else {
			if (matchGlob(pattern, relativePath)) {
				results.push(fullPath);
			}
		}
	}
}

/**
 * Expand glob patterns to file paths
 * Uses native Bun.Glob for Bun, manual implementation for Node/Deno
 */
export async function expandGlob(patterns: string[], cwd: string): Promise<string[]> {
	const files: string[] = [];
	const seen = new Set<string>();

	for (const pattern of patterns) {
		if (runtime === "bun") {
			// Use native Bun.Glob
			const glob = new Bun.Glob(pattern);
			for await (const file of glob.scan({ cwd, absolute: true })) {
				if (!seen.has(file)) {
					seen.add(file);
					files.push(file);
				}
			}
		} else {
			// Manual glob expansion for Node.js and Deno
			const absoluteCwd = resolve(cwd);

			// Handle simple file path (no glob chars)
			if (!pattern.includes("*") && !pattern.includes("?")) {
				const fullPath = resolve(absoluteCwd, pattern);
				try {
					const stat = runtime === "deno" ? Deno.statSync(fullPath) : statSync(fullPath);
					if (stat.isFile && !seen.has(fullPath)) {
						seen.add(fullPath);
						files.push(fullPath);
					}
				} catch {
					// File doesn't exist, skip
				}
				continue;
			}

			// Walk directory for glob patterns
			const results: string[] = [];
			walkDir(absoluteCwd, absoluteCwd, pattern, results);

			for (const file of results) {
				if (!seen.has(file)) {
					seen.add(file);
					files.push(file);
				}
			}
		}
	}

	return files;
}
