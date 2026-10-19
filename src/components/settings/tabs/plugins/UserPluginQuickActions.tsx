/*
 * NyaCord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { installUserPluginFromFile, loadRuntimeUserPlugins } from "@api/UserPluginLoader";
import { FolderIcon, PlusIcon, RestartIcon, UploadIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { React, showToast, useRef } from "@webpack/common";

import { openInstallUserPluginModal } from "./InstallUserPluginModal";

export function UserPluginQuickActions() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const installedName = await installUserPluginFromFile(file);
            showToast({
                text: `Plugin ${installedName} installed successfully!`,
                variant: "success",
                position: "bottom"
            });
        } catch (err: any) {
            showToast({
                text: `Failed to install plugin: ${err?.message || err}`,
                variant: "critical",
                position: "bottom"
            });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                accept=".js,.ts,.tsx,.jsx"
                style={{ display: "none" }}
                onChange={handleFileSelect}
            />
            <QuickActionCard>
                {VencordNative?.userplugins && (
                    <QuickAction
                        text="Open Plugins Folder"
                        action={() => VencordNative.userplugins.openFolder()}
                        Icon={FolderIcon}
                    />
                )}
                <QuickAction
                    text="Install Plugin"
                    action={() => openInstallUserPluginModal()}
                    Icon={PlusIcon}
                />
                <QuickAction
                    text="Choose File"
                    action={() => fileInputRef.current?.click()}
                    Icon={UploadIcon}
                />
                <QuickAction
                    text="Reload Plugins"
                    action={async () => {
                        await loadRuntimeUserPlugins();
                        showToast({
                            text: "Userplugins reloaded!",
                            variant: "success",
                            position: "bottom"
                        });
                    }}
                    Icon={RestartIcon}
                />
            </QuickActionCard>
        </>
    );
}
