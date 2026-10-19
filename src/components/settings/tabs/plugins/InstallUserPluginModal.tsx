/*
 * NyaCord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { installUserPluginFromFile, installUserPluginFromUrl, loadRuntimeUserPlugins } from "@api/UserPluginLoader";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { FolderIcon, PlusIcon, UploadIcon } from "@components/Icons";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, React, showToast, TextInput, useRef, useState } from "@webpack/common";

export function openInstallUserPluginModal() {
    openModal(props => <InstallUserPluginModal {...props} />);
}

export function InstallUserPluginModal(props: RenderModalProps) {
    const [url, setUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleInstallFromUrl() {
        if (!url.trim()) return;
        setIsLoading(true);
        setError(null);

        try {
            const installedName = await installUserPluginFromUrl(url.trim(), fileName.trim() || undefined);
            showToast({
                text: `Plugin ${installedName} installed successfully!`,
                variant: "success",
                position: "bottom"
            });
            props.onClose();
        } catch (err: any) {
            setError(err?.message || String(err));
            showToast({
                text: `Failed to install plugin: ${err?.message || err}`,
                variant: "critical",
                position: "bottom"
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const installedName = await installUserPluginFromFile(file);
            showToast({
                text: `Plugin ${installedName} installed successfully!`,
                variant: "success",
                position: "bottom"
            });
            props.onClose();
        } catch (err: any) {
            setError(err?.message || String(err));
            showToast({
                text: `Failed to install plugin: ${err?.message || err}`,
                variant: "critical",
                position: "bottom"
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <Modal
            {...props}
            size="md"
            title="Install UserPlugin"
            subtitle="Add custom plugins after build with hot-reloading"
            actions={[
                {
                    text: "Cancel",
                    variant: "secondary",
                    onClick: props.onClose
                },
                {
                    text: isLoading ? "Installing..." : "Install from URL",
                    variant: "primary",
                    onClick: handleInstallFromUrl,
                    disabled: isLoading || !url.trim(),
                    loading: isLoading
                }
            ]}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Notice.Info>
                    You can install plugins directly from GitHub links, raw code URLs, or by choosing a local <code>.js</code>, <code>.ts</code>, or <code>.tsx</code> file.
                </Notice.Info>

                {error && (
                    <Notice.Warning>
                        {error}
                    </Notice.Warning>
                )}

                <div>
                    <Paragraph weight="semibold" className={Margins.bottom8}>
                        Install from URL
                    </Paragraph>
                    <Paragraph size="xs" color="text-muted" className={Margins.bottom8}>
                        Paste a direct URL to a plugin file (GitHub file/raw URLs and Gists are supported):
                    </Paragraph>
                    <TextInput
                        placeholder="https://raw.githubusercontent.com/.../plugin.ts"
                        value={url}
                        onChange={setUrl}
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <Paragraph weight="semibold" className={Margins.bottom8}>
                        File Name (Optional)
                    </Paragraph>
                    <TextInput
                        placeholder="MyPlugin.ts (leave empty to infer from URL)"
                        value={fileName}
                        onChange={setFileName}
                        disabled={isLoading}
                    />
                </div>

                <Divider />

                <div>
                    <Paragraph weight="semibold" className={Margins.bottom8}>
                        Install from File
                    </Paragraph>
                    <Paragraph size="xs" color="text-muted" className={Margins.bottom8}>
                        Select a <code>.js</code>, <code>.ts</code>, or <code>.tsx</code> file from your computer:
                    </Paragraph>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".js,.ts,.tsx,.jsx"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                    >
                        <UploadIcon width={16} height={16} />
                        Choose Plugin File
                    </Button>
                </div>

                {VencordNative?.userplugins && (
                    <>
                        <Divider />
                        <div>
                            <Paragraph weight="semibold" className={Margins.bottom8}>
                                Manual File Drop
                            </Paragraph>
                            <Paragraph size="xs" color="text-muted" className={Margins.bottom8}>
                                You can also simply open the userplugins folder and drop your plugin files or folders there. They will be detected and loaded automatically!
                            </Paragraph>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    VencordNative.userplugins.openFolder();
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                            >
                                <FolderIcon width={16} height={16} />
                                Open UserPlugins Folder
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
