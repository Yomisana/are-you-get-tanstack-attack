#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(process.argv[2] || ".");
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const badVersions = new Map([
  ["@tanstack/react-router", new Set(["1.169.5", "1.169.8"])],
  ["@tanstack/react-start", new Set(["1.167.68", "1.167.71"])],
  ["@tanstack/router-core", new Set(["1.169.5", "1.169.8"])],
  ["@tanstack/router-devtools-core", new Set(["1.167.6", "1.167.9"])],
  ["@tanstack/react-router-devtools", new Set(["1.166.16", "1.166.19"])],
  ["@tanstack/router-plugin", new Set(["1.167.38", "1.167.41"])],
  ["@tanstack/router-vite-plugin", new Set(["1.166.53", "1.166.56"])],
  ["@tanstack/router-cli", new Set(["1.166.46", "1.166.49"])],
  ["@tanstack/router-generator", new Set(["1.166.45", "1.166.48"])],
  ["@tanstack/virtual-file-routes", new Set(["1.161.10", "1.161.13"])],
  ["@tanstack/history", new Set(["1.161.9", "1.161.12"])],
]);

const findings = {
  routerInit: [],
  optionalDeps: [],
  badPackageVersions: [],
  badLockVersions: [],
  npmLogs: [],
  errors: [],
};

const visited = new Set();

function shouldSkipDir(name) {
  return [
    ".git",
    ".next",
    ".nuxt",
    ".turbo",
    ".cache",
    ".DS_Store",
    "dist",
    "build",
    "coverage",
    ".yarn",
  ].includes(name);
}

function safeRead(file) {
  try {
    const st = fs.statSync(file);
    if (!st.isFile()) return null;
    if (st.size > MAX_FILE_SIZE) return null;
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function pushUnique(arr, item) {
  const key = JSON.stringify(item);
  if (!visited.has(key)) {
    visited.add(key);
    arr.push(item);
  }
}

function inspectPackageJson(file) {
  const content = safeRead(file);
  if (!content) return;

  let pkg;
  try {
    pkg = JSON.parse(content);
  } catch {
    return;
  }

  const name = pkg.name;
  const version = pkg.version;
  const optionalDependencies = pkg.optionalDependencies || {};

  if (
    optionalDependencies["@tanstack/setup"] ||
    Object.values(optionalDependencies).some(
      (v) => typeof v === "string" && v.includes("github:tanstack/router#")
    )
  ) {
    pushUnique(findings.optionalDeps, {
      file,
      packageName: name || null,
      version: version || null,
      optionalDependencies,
    });
  }

  if (name && version && badVersions.has(name) && badVersions.get(name).has(version)) {
    pushUnique(findings.badPackageVersions, { file, packageName: name, version });
  }
}

function inspectLockfile(file) {
  const content = safeRead(file);
  if (!content) return;

  for (const [pkg, versions] of badVersions.entries()) {
    for (const ver of versions) {
      const patterns = [
        `${pkg}@${ver}`,
        `"${pkg}": "${ver}"`,
        `"${pkg}":"${ver}"`,
        `"version": "${ver}"`,
        `/${pkg.replace("/", "\\/")}/${ver}`,
      ];
      if (patterns.some((p) => content.includes(p))) {
        pushUnique(findings.badLockVersions, { file, packageName: pkg, version: ver });
      }
    }
  }
}

function inspectNpmLog(file) {
  const content = safeRead(file);
  if (!content) return;

  const interesting = [
    "@tanstack/react-router",
    "@tanstack/react-start",
    "@tanstack/router-plugin",
    "@tanstack/react-router-devtools",
    "@tanstack/router-cli",
    "@tanstack/router-generator",
    "@tanstack/router-vite-plugin",
  ];

  const matched = interesting.filter((s) => content.includes(s));
  if (matched.length > 0) {
    pushUnique(findings.npmLogs, { file, matched });
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    findings.errors.push({ dir, error: e.message });
    return;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    try {
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) continue;
        walk(full);
        continue;
      }

      if (!entry.isFile()) continue;

      if (entry.name === "router_init.js") {
        pushUnique(findings.routerInit, { file: full });
      }

      if (entry.name === "package.json") {
        inspectPackageJson(full);
      }

      if (
        entry.name === "package-lock.json" ||
        entry.name === "pnpm-lock.yaml" ||
        entry.name === "yarn.lock"
      ) {
        inspectLockfile(full);
      }

      if (
        full.includes(`${path.sep}.npm${path.sep}_logs${path.sep}`) &&
        entry.name.endsWith(".log")
      ) {
        inspectNpmLog(full);
      }
    } catch (e) {
      findings.errors.push({ file: full, error: e.message });
    }
  }
}

function summarizeRisk() {
  if (
    findings.routerInit.length ||
    findings.optionalDeps.length ||
    findings.badPackageVersions.length ||
    findings.badLockVersions.length
  ) {
    return "HIGH";
  }
  if (findings.npmLogs.length) {
    return "MEDIUM";
  }
  return "LOW";
}

walk(rootDir);

const result = {
  scannedRoot: rootDir,
  risk: summarizeRisk(),
  summary: {
    routerInit: findings.routerInit.length,
    optionalDeps: findings.optionalDeps.length,
    badPackageVersions: findings.badPackageVersions.length,
    badLockVersions: findings.badLockVersions.length,
    npmLogs: findings.npmLogs.length,
    errors: findings.errors.length,
  },
  findings,
};

console.log(JSON.stringify(result, null, 2));
