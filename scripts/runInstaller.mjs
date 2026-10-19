/*
 * NyaCord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./checkNodeVersion.js";

import { execFileSync } from "child_process";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { fileURLToPath } from "url";

const BASE_URL = "https://github.com/Equicord/Equilotl/releases/latest/download/";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = join(BASE_DIR, "dist");
const FILE_DIR = join(DIST_DIR, "Installer");

function byArch(files) {
    return files[process.arch] ?? files.default;
}

function getFilename(isGui = false) {
    if (isGui) {
        switch (process.platform) {
            case "win32":
                return byArch({
                    arm64: "Equilotl-arm64.exe",
                    default: "Equilotl.exe"
                });
            case "darwin":
                return byArch({
                    arm64: "Equilotl-arm64.dmg",
                    default: "Equilotl.dmg"
                });
            case "linux":
                return byArch({
                    arm64: "Equilotl-wayland-arm64",
                    default: "Equilotl"
                });
            default:
                throw new Error("Unsupported platform: " + process.platform);
        }
    }

    switch (process.platform) {
        case "win32":
            return byArch({
                arm64: "EquilotlCli-arm64.exe",
                default: "EquilotlCli.exe"
            });
        case "darwin":
            return byArch({
                x64: "EquilotlCli-x64",
                arm64: "EquilotlCli-arm64",
                default: "EquilotlCli-universal"
            });
        case "linux":
            return byArch({
                arm64: "EquilotlCli-linux-arm64",
                default: "EquilotlCli-Linux"
            });
        default:
            throw new Error("Unsupported platform: " + process.platform);
    }
}

async function ensureBinary(isGui = false) {
    const filename = getFilename(isGui);
    const etagFile = join(FILE_DIR, `${filename}.etag.txt`);
    const outputFile = join(FILE_DIR, filename);

    mkdirSync(FILE_DIR, { recursive: true });

    if (!existsSync(outputFile)) {
        console.log(`Downloading ${filename}...`);
        const etag = existsSync(etagFile) ? readFileSync(etagFile, "utf-8") : null;

        const res = await fetch(BASE_URL + filename, {
            headers: {
                "User-Agent": "NyaCord (https://github.com/nyawkdev/NyaCord)",
                ...(etag ? { "If-None-Match": etag } : {})
            }
        });

        if (res.status === 304 && existsSync(outputFile)) {
            console.log(`${filename} is up to date.`);
        } else if (!res.ok) {
            throw new Error(`Failed to download installer ${filename}: ${res.status} ${res.statusText}`);
        } else {
            const newEtag = res.headers.get("etag");
            if (newEtag) writeFileSync(etagFile, newEtag);

            const body = Readable.fromWeb(res.body);
            await finished(body.pipe(createWriteStream(outputFile, {
                mode: 0o755,
                autoClose: true
            })));
            console.log(`Finished downloading ${filename}!`);
        }
    }

    // Create convenient NyaCord aliases
    const ext = process.platform === "win32" ? ".exe" : "";
    const aliasName = isGui ? `NyaCordInstaller${ext}` : `NyaCordInstallerCli${ext}`;
    const aliasPathInInstaller = join(FILE_DIR, aliasName);
    const aliasPathInDist = join(DIST_DIR, aliasName);

    try {
        copyFileSync(outputFile, aliasPathInInstaller);
        copyFileSync(outputFile, aliasPathInDist);
    } catch { }

    return outputFile;
}

export async function prepareBothInstallers() {
    console.log("Preparing NyaCord Installers (CLI & GUI)...");
    const cliBin = await ensureBinary(false);
    const guiBin = await ensureBinary(true);

    if (process.platform === "win32") {
        // Create batch launcher scripts in dist/
        const guiBat = `@echo off\r\nset "NYACORD_DIRECTORY=%~dp0desktop"\r\nset "EQUICORD_DIRECTORY=%~dp0desktop"\r\nset "NYACORD_DEV_INSTALL=1"\r\nset "EQUICORD_DEV_INSTALL=1"\r\nstart "" "%~dp0NyaCordInstaller.exe" %*\r\n`;
        const cliBat = `@echo off\r\nset "NYACORD_DIRECTORY=%~dp0desktop"\r\nset "EQUICORD_DIRECTORY=%~dp0desktop"\r\nset "NYACORD_DEV_INSTALL=1"\r\nset "EQUICORD_DEV_INSTALL=1"\r\n"%~dp0NyaCordInstallerCli.exe" %*\r\npause\r\n`;

        writeFileSync(join(DIST_DIR, "install-gui.bat"), guiBat);
        writeFileSync(join(DIST_DIR, "install-cli.bat"), cliBat);
    }

    console.log("Both installers ready in dist/ and dist/Installer/!");
    return { cliBin, guiBin };
}

const isGui = process.argv.includes("--gui");
const isDownloadOnly = process.argv.includes("--download-only") || process.argv.includes("--prepare-only");

const { cliBin, guiBin } = await prepareBothInstallers();

if (isDownloadOnly) {
    process.exit(0);
}

const targetBin = isGui ? guiBin : cliBin;
console.log(`Now running ${isGui ? "GUI" : "CLI"} Installer...`);

const argStart = process.argv.indexOf("--");
let args = argStart === -1 ? [] : process.argv.slice(argStart + 1);

// Filter out internal flags
args = args.filter(a => a !== "--gui" && a !== "--cli" && a !== "--download-only");

try {
    execFileSync(targetBin, args, {
        stdio: "inherit",
        env: {
            ...process.env,
            NYACORD_USER_DATA_DIR: BASE_DIR,
            NYACORD_DIRECTORY: join(BASE_DIR, "dist/desktop"),
            NYACORD_DEV_INSTALL: "1",
            EQUICORD_USER_DATA_DIR: BASE_DIR,
            EQUICORD_DIRECTORY: join(BASE_DIR, "dist/desktop"),
            EQUICORD_DEV_INSTALL: "1"
        }
    });
} catch {
    console.error("Installer finished or exited.");
}
