/*
 * NyaCord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled, startPlugin, stopPlugin } from "@api/PluginManager";
import { definePluginSettings, PlainSettings, Settings, SettingsStore } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { type OptionType, type Plugin, type PluginDef, type StartAt } from "@utils/types";
import { transform } from "sucrase";
import Plugins, { PluginMeta } from "~plugins";

const logger = new Logger("UserPluginLoader", "#e06c75");

export const RuntimeOptionType = {
    STRING: 0,
    NUMBER: 1,
    BIGINT: 2,
    BOOLEAN: 3,
    SELECT: 4,
    SLIDER: 5,
    COMPONENT: 6,
    CUSTOM: 7
} as const;

export const RuntimeStartAt = {
    Init: "Init",
    DOMContentLoaded: "DOMContentLoaded",
    WebpackReady: "WebpackReady"
} as const;

export const runtimePluginFiles = new Map<string, string>(); // pluginName -> fileName
const userPluginChangeListeners = new Set<() => void>();

export function addUserPluginChangeListener(listener: () => void) {
    userPluginChangeListeners.add(listener);
}

export function removeUserPluginChangeListener(listener: () => void) {
    userPluginChangeListeners.delete(listener);
}

function notifyChangeListeners() {
    userPluginChangeListeners.forEach(listener => {
        try {
            listener();
        } catch (e) {
            logger.error("Error in user plugin change listener:", e);
        }
    });
}

function asModule(mod: any) {
    if (!mod || (typeof mod !== "object" && typeof mod !== "function")) return mod;
    return new Proxy(mod, {
        get(target, prop) {
            if (prop === "__esModule") return true;
            if (prop === "default") return target.default ?? target;
            return target[prop];
        }
    });
}

function createPluginRequire(safeDefinePlugin: <P extends PluginDef>(def: P) => Plugin) {
    return function pluginRequire(id: string) {
        const v = (window as any).Vencord;
        if (!v) return asModule({});
        if (id === "@webpack/common" || id === "react") return asModule(v.Webpack?.Common ?? {});
        if (id === "@webpack") return asModule(v.Webpack ?? {});
        if (id === "@utils/types") return asModule({ default: safeDefinePlugin, definePlugin: safeDefinePlugin, OptionType: RuntimeOptionType, StartAt: RuntimeStartAt });
        if (id === "@utils/constants") return asModule(v.Util?.Constants ?? {});
        if (id === "@utils/misc") return asModule(v.Util?.Misc ?? {});
        if (id === "@utils/Logger") return asModule({ Logger: v.Util?.Logger ?? Logger, default: v.Util?.Logger ?? Logger });
        if (id === "@api/Settings") return asModule({ ...v.Api?.Settings, Settings, definePluginSettings, SettingsStore, PlainSettings });
        if (id === "@api/Notifications") return asModule(v.Api?.Notifications ?? {});
        if (id === "@api/Notices") return asModule(v.Api?.Notices ?? {});
        if (id === "@api/Badges") return asModule(v.Api?.Badges ?? {});
        if (id === "@api/Commands") return asModule(v.Api?.Commands ?? {});
        if (id === "@api/ContextMenu") return asModule(v.Api?.ContextMenu ?? {});
        if (id.startsWith("@api/")) {
            const key = id.slice(5);
            return asModule(v.Api?.[key] ?? {});
        }
        if (id.startsWith("@components/")) {
            const key = id.slice(12);
            return asModule(v.Components?.[key] ?? v.Components ?? {});
        }
        if (id.startsWith("@utils/")) {
            const key = id.slice(7);
            return asModule(v.Util?.[key] ?? v.Util ?? {});
        }
        return asModule(v[id] ?? {});
    };
}

export function evaluatePluginCode(rawCode: string, fileName: string): Plugin | null {
    let jsCode = rawCode;
    const needsTransform = /\.(tsx?|jsx)$/i.test(fileName) ||
        rawCode.includes("import ") || rawCode.includes("export ") ||
        rawCode.includes("<") || rawCode.includes("interface ") ||
        rawCode.includes("type ") || rawCode.includes(": ");

    if (needsTransform) {
        try {
            jsCode = transform(rawCode, {
                transforms: ["typescript", "jsx", "imports"],
                jsxRuntime: "classic",
                jsxPragma: "React.createElement",
                jsxFragmentPragma: "React.Fragment",
                production: true
            }).code;
        } catch (e) {
            logger.error(`Failed to transpile ${fileName}:`, e);
            return null;
        }
    }

    let capturedPlugin: any = null;
    const safeDefinePlugin = <P extends PluginDef>(def: P) => {
        capturedPlugin = def;
        return def as unknown as Plugin;
    };

    (window as any).definePlugin = safeDefinePlugin;

    const moduleObj = { exports: {} as any };
    const exportsObj = moduleObj.exports;
    const v = (window as any).Vencord;

    const scope: Record<string, any> = {
        module: moduleObj,
        exports: exportsObj,
        require: createPluginRequire(safeDefinePlugin),
        OptionType: RuntimeOptionType,
        StartAt: RuntimeStartAt,
        Vencord: v,
        React: v?.Webpack?.Common?.React ?? (window as any).React,
        Webpack: v?.Webpack,
        Api: v?.Api,
        Util: v?.Util,
        Components: v?.Components,
    };

    try {
        const fn = new Function(...Object.keys(scope), jsCode);
        fn(...Object.values(scope));
    } catch (e) {
        logger.error(`Error executing plugin code for ${fileName}:`, e);
        return null;
    }

    const pluginCandidate = moduleObj.exports?.default ?? moduleObj.exports ?? capturedPlugin;
    if (pluginCandidate && typeof pluginCandidate === "object" && typeof pluginCandidate.name === "string") {
        return pluginCandidate as Plugin;
    }

    if (capturedPlugin && typeof capturedPlugin === "object" && typeof capturedPlugin.name === "string") {
        return capturedPlugin as Plugin;
    }

    return null;
}

export async function loadRuntimeUserPlugins(): Promise<void> {
    if (!VencordNative?.userplugins) return;

    try {
        const files = await VencordNative.userplugins.list();
        const currentFound = new Set<string>();

        for (const item of files) {
            try {
                const code = await VencordNative.userplugins.getData(item.fileName);
                if (!code) continue;

                const plugin = evaluatePluginCode(code, item.fileName);
                if (!plugin || !plugin.name) {
                    logger.warn(`File ${item.fileName} did not export a valid plugin (missing name)`);
                    continue;
                }

                currentFound.add(plugin.name);
                runtimePluginFiles.set(plugin.name, item.fileName);

                // If already running, stop previous version
                if (Plugins[plugin.name]?.started) {
                    try {
                        stopPlugin(Plugins[plugin.name]);
                    } catch (e) {
                        logger.error(`Error stopping previous version of ${plugin.name}:`, e);
                    }
                }

                // Register into Plugins and PluginMeta
                Plugins[plugin.name] = plugin;
                PluginMeta[plugin.name] = {
                    folderName: `src/userplugins/${item.name}`,
                    userPlugin: true,
                    fileName: item.fileName
                };

                // Initialize settings if defined
                if (plugin.settings) {
                    plugin.settings.pluginName = plugin.name;
                    for (const [key, def] of Object.entries(plugin.settings.def)) {
                        if (def.onChange) {
                            SettingsStore.addChangeListener(`plugins.${plugin.name}.${key}`, def.onChange);
                        }
                    }
                }

                // Start plugin if enabled
                const isEnabled = Settings.plugins[plugin.name]?.enabled ?? true;
                if (isEnabled) {
                    Settings.plugins[plugin.name] ??= { enabled: true };
                    startPlugin(plugin);
                }

                logger.info(`Loaded userplugin: ${plugin.name} (${item.fileName})`);
            } catch (err) {
                logger.error(`Failed to load userplugin from ${item.fileName}:`, err);
            }
        }

        // Cleanup removed plugins
        for (const [name, file] of runtimePluginFiles.entries()) {
            if (!currentFound.has(name)) {
                if (Plugins[name]) {
                    if (Plugins[name].started) {
                        stopPlugin(Plugins[name]);
                    }
                    delete Plugins[name];
                    delete PluginMeta[name];
                }
                runtimePluginFiles.delete(name);
                logger.info(`Unloaded deleted userplugin: ${name} (${file})`);
            }
        }

        notifyChangeListeners();
    } catch (e) {
        logger.error("Failed to load runtime userplugins:", e);
    }
}

export async function installUserPluginFromUrl(url: string, targetName?: string): Promise<string> {
    let fetchUrl = url.trim();
    if (fetchUrl.includes("github.com") && !fetchUrl.includes("raw.githubusercontent.com")) {
        fetchUrl = fetchUrl
            .replace("github.com", "raw.githubusercontent.com")
            .replace("/blob/", "/");
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const code = await res.text();

    let fileName = targetName?.trim();
    if (!fileName) {
        try {
            const urlParts = new URL(fetchUrl).pathname.split("/");
            fileName = urlParts.pop() || "plugin.js";
        } catch {
            fileName = "plugin.js";
        }
        if (!/\.(js|ts|jsx|tsx)$/i.test(fileName)) {
            fileName += ".js";
        }
    }

    await VencordNative.userplugins.save(fileName, code);
    await loadRuntimeUserPlugins();
    return fileName;
}

export async function installUserPluginFromFile(file: File): Promise<string> {
    const code = await file.text();
    const fileName = file.name || "plugin.js";
    await VencordNative.userplugins.save(fileName, code);
    await loadRuntimeUserPlugins();
    return fileName;
}

export async function deleteUserPlugin(target: string): Promise<void> {
    const fileName = runtimePluginFiles.get(target) ?? target;
    await VencordNative.userplugins.delete(fileName);
    runtimePluginFiles.delete(target);
    await loadRuntimeUserPlugins();
}

export function initRuntimeUserPlugins(): void {
    if (!VencordNative?.userplugins) return;

    loadRuntimeUserPlugins();

    VencordNative.userplugins.addChangeListener(() => {
        logger.info("Userplugins directory changed, reloading...");
        loadRuntimeUserPlugins();
    });
}
