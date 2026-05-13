# TanStack Router CVE Scanner

A security scanning tool to detect the [TanStack Router CVE](https://nvd.nist.gov/vuln/detail/CVE-2026-45321) | [TanStack Router GHSA](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx) in your projects.

## Overview

This tool scans your codebase for indicators of the TanStack Router vulnerability (CVE-2026-45321 / GHSA-g7cv-rxg3-hmpx), which affects specific versions of TanStack Router packages. It detects:

- `router_init.js` files that may contain malicious code
- Suspicious optional dependencies in `package.json`
- Known vulnerable package versions
- Vulnerable versions in lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)
- Related entries in npm logs

## Known Vulnerable Versions

The following package versions are flagged as vulnerable:

| Package | Vulnerable Versions |
|---------|---------------------|
| `@tanstack/react-router` | 1.169.5, 1.169.8 |
| `@tanstack/react-start` | 1.167.68, 1.167.71 |
| `@tanstack/router-core` | 1.169.5, 1.169.8 |
| `@tanstack/router-devtools-core` | 1.167.6, 1.167.9 |
| `@tanstack/react-router-devtools` | 1.166.16, 1.166.19 |
| `@tanstack/router-plugin` | 1.167.38, 1.167.41 |
| `@tanstack/router-vite-plugin` | 1.166.53, 1.166.56 |
| `@tanstack/router-cli` | 1.166.46, 1.166.49 |
| `@tanstack/router-generator` | 1.166.45, 1.166.48 |
| `@tanstack/virtual-file-routes` | 1.161.10, 1.161.13 |
| `@tanstack/history` | 1.161.9, 1.161.12 |

## Risk Levels

- **HIGH**: Found `router_init.js`, suspicious optional dependencies, or vulnerable versions in `package.json`/lock files
- **MEDIUM**: Found related entries in npm logs only
- **LOW**: No indicators found

## Installation

### macOS

1. Open Terminal
2. Navigate to your project directory:
   ```bash
   cd /path/to/your/project
   ```
3. Run the scanner (see Usage below)

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to your project directory:
   ```cmd
   cd C:\path\to\your\project
   ```
3. Run the scanner (see Usage below)

### Linux

1. Open Terminal
2. Navigate to your project directory:
   ```bash
   cd /path/to/your/project
   ```
3. Run the scanner (see Usage below)

## Usage

### Basic Usage

**Scan current directory:**
```bash
node scan.js
```

**Scan specific folder:**
```bash
node scan.js /path/to/your/project
```

**Scan home directory:**
```bash
node scan.js ~
```

### Save Output to JSON File

**macOS / Linux:**
```bash
node scan.js ~/your-project > scan-result.json
```

**Windows (Command Prompt):**
```cmd
node scan.js C:\Users\YourName\your-project > scan-result.json
```

**Windows (PowerShell):**
```powershell
node scan.js C:\Users\YourName\your-project | Out-File -FilePath scan-result.json
```

### Example Workflows

**Scan a single project:**
```bash
cd /Users/username/my-react-app
node scan.js . > result.json
cat result.json
```

**Scan entire system (macOS/Linux):**
```bash
node scan.js ~ > full-scan.json
```

**Scan with jq (macOS/Linux) - filter just the risk level:**
```bash
node scan.js . | jq -r '.risk'
```

## Output Format

The scanner outputs JSON with the following structure:

```json
{
  "scannedRoot": "/path/to/scanned/directory",
  "risk": "HIGH|MEDIUM|LOW",
  "summary": {
    "routerInit": 0,
    "optionalDeps": 0,
    "badPackageVersions": 0,
    "badLockVersions": 0,
    "npmLogs": 0,
    "errors": 0
  },
  "findings": {
    "routerInit": [],
    "optionalDeps": [],
    "badPackageVersions": [],
    "badLockVersions": [],
    "npmLogs": [],
    "errors": []
  }
}
```

## Skipped Directories

The scanner automatically skips the following directories to improve performance:

- `.git`
- `.next`
- `.nuxt`
- `.turbo`
- `.cache`
- `.DS_Store`
- `dist`
- `build`
- `coverage`
- `.yarn`

Files larger than 5MB are also skipped.

## What to Do If Vulnerable

If the scanner reports **HIGH** risk:

1. **Immediately check** the affected `package.json` files
2. **Update vulnerable packages** to the latest safe versions
3. **Remove** any suspicious `router_init.js` files
4. **Clean install** dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
5. **Review** your lock files for any malicious configurations
6. **Report** the vulnerability if you found evidence of exploitation

## Additional Resources

- [TanStack Router GitHub](https://github.com/TanStack/router)
- [NVD CVE-2026-45321](https://nvd.nist.gov/vuln/detail/CVE-2026-45321)
- [Security Advisory](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx)
