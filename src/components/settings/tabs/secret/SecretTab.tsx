import { isPluginEnabled, startDependenciesRecursive, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings, useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import {
    applyToCurrentUser,
    CollectibleItem,
    DISCORD_BADGES,
    fetchDiscordCollectibles,
    settings as localCosmeticsSettings
} from "@plugins/localCosmetics";
import { Margins } from "@utils/margins";
import { promptToRestart } from "@utils/promptToRestart";
import { React, showToast, useEffect, useState } from "@webpack/common";
import Plugins from "~plugins";

import { SettingsTab, wrapTab } from "../BaseTab";
import { openPluginModal } from "../plugins/PluginModal";

interface SecretFeature {
    id: string;
    title: string;
    description: string;
    badge?: string;
    restartRequired?: boolean;
}

const SECRET_SECTIONS: { title: string; subtitle: string; features: SecretFeature[] }[] = [
    {
        title: "Stealth & Privacy",
        subtitle: "Ghost mode tools to keep your actions completely invisible to others.",
        features: [
            {
                id: "SilentTyping",
                title: "Silent Typing",
                description: "Type in any channel or direct message without broadcasting the typing indicator."
            },
            {
                id: "SilentEdit",
                title: "Silent Edit",
                description: "Edit your sent messages stealthily without leaving the (edited) badge."
            },
            {
                id: "MessageLogger",
                title: "Anti-Delete (Message Logger)",
                description: "Retain deleted and edited messages in chat with complete modification history."
            }
        ]
    },
    {
        title: "Surveillance & Information",
        subtitle: "Reveal restricted Discord server elements and hidden UI components.",
        features: [
            {
                id: "ShowHiddenChannels",
                title: "Show Hidden Channels",
                description: "View locked and inaccessible channels, channel topics, and required role permissions.",
                restartRequired: true
            },
            {
                id: "ShowHiddenThings",
                title: "Show Hidden Things",
                description: "Reveal hidden badges, hidden Discord developer flags, and restricted interface elements."
            }
        ]
    },
    {
        title: "Audio & Voice Powers",
        subtitle: "Advanced audio processing to amplify quiet voices and protect your hearing.",
        features: [
            {
                id: "VolumeBooster",
                title: "Volume Booster",
                description: "Unlocks volume sliders to go up to 500% (bypasses Discord 200% slider cap)."
            },
            {
                id: "AudioLimiter",
                title: "Audio Ear Protection Limiter",
                description: "Compresses extreme audio spikes to protect your hearing from loud mic screams."
            }
        ]
    },
    {
        title: "Accounts & Entertainment",
        subtitle: "Enhancements for multi-account management and media playback.",
        features: [
            {
                id: "SpotifyCrack",
                title: "Spotify Crack & Listen Along",
                description: "Enables Spotify Listen Along without Premium and stops 30-second voice call auto-pause.",
                restartRequired: true
            },
            {
                id: "UnlimitedAccounts",
                title: "Unlimited Accounts Switcher",
                description: "Removes the Discord 5-account limit so you can switch between any number of accounts."
            }
        ]
    },
    {
        title: "Anti-Moderation Protection",
        subtitle: "Automated defenses against unwanted server modifications.",
        features: [
            {
                id: "AntiNickname",
                title: "Anti-Nickname",
                description: "Automatically restores your server nickname if moderators reset or change it."
            }
        ]
    }
];

function LocalCosmeticsEditor() {
    const isCosmeticsEnabled = isPluginEnabled("LocalCosmetics");
    useSettings(["plugins.LocalCosmetics.enabled" as any]);

    const [collectibles, setCollectibles] = useState<CollectibleItem[]>([]);
    const [selectedBadges, setSelectedBadges] = useState<string[]>(() => {
        const raw = localCosmeticsSettings.store.customBadges;
        return raw ? raw.split(",").map(b => b.trim()).filter(Boolean) : [];
    });
    const [displayName, setDisplayName] = useState(localCosmeticsSettings.store.customDisplayName || "");
    const [username, setUsername] = useState(localCosmeticsSettings.store.customUsername || "");
    const [createdAt, setCreatedAt] = useState(localCosmeticsSettings.store.customCreatedAt || "");
    const [selectedDeco, setSelectedDeco] = useState(localCosmeticsSettings.store.customDecorationAsset || "");

    useEffect(() => {
        fetchDiscordCollectibles().then(items => {
            setCollectibles(items.filter(i => i.type === 0));
        });
    }, []);

    const toggleBadge = (badgeId: string) => {
        const updated = selectedBadges.includes(badgeId)
            ? selectedBadges.filter(id => id !== badgeId)
            : [...selectedBadges, badgeId];
        setSelectedBadges(updated);
        localCosmeticsSettings.store.customBadges = updated.join(",");
        applyToCurrentUser();
    };

    const handleApply = () => {
        localCosmeticsSettings.store.customDisplayName = displayName;
        localCosmeticsSettings.store.customUsername = username;
        localCosmeticsSettings.store.customCreatedAt = createdAt;
        localCosmeticsSettings.store.customBadges = selectedBadges.join(",");
        localCosmeticsSettings.store.customDecorationAsset = selectedDeco;

        const foundDeco = collectibles.find(c => c.asset === selectedDeco);
        if (foundDeco) {
            localCosmeticsSettings.store.customDecorationSkuId = foundDeco.skuId;
        }

        applyToCurrentUser();
        showToast({ text: "Local cosmetics applied successfully!", variant: "success" });
    };

    const handleReset = () => {
        setDisplayName("");
        setUsername("");
        setCreatedAt("");
        setSelectedBadges([]);
        setSelectedDeco("");

        localCosmeticsSettings.store.customDisplayName = "";
        localCosmeticsSettings.store.customUsername = "";
        localCosmeticsSettings.store.customCreatedAt = "";
        localCosmeticsSettings.store.customBadges = "";
        localCosmeticsSettings.store.customDecorationAsset = "";
        localCosmeticsSettings.store.customDecorationSkuId = "";

        applyToCurrentUser();
        showToast({ text: "Local cosmetics cleared.", variant: "success" });
    };

    const onTogglePlugin = (enabled: boolean) => {
        const plugin = Plugins.LocalCosmetics;
        if (!plugin) return;
        Settings.plugins.LocalCosmetics.enabled = enabled;
        if (enabled) {
            startPlugin(plugin);
        } else {
            stopPlugin(plugin);
        }
    };

    return (
        <Card style={{ marginBottom: "24px", padding: "16px", backgroundColor: "var(--background-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--header-primary)" }}>
                        Local Profile Cosmetics (Nightcord Visuals)
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Customize your profile locally with real Discord badges, dynamically loaded avatar decorations, custom display name, handle, and account creation date.
                    </div>
                </div>
                <FormSwitch
                    title=""
                    hideBorder
                    value={isCosmeticsEnabled}
                    onChange={onTogglePlugin}
                />
            </div>

            {isCosmeticsEnabled && (
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Display Name (Nick)
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                placeholder="Custom display name"
                                onChange={e => setDisplayName(e.target.value)}
                                style={{
                                    width: "100%",
                                    marginTop: "4px",
                                    padding: "8px 10px",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--background-tertiary)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    color: "var(--text-normal)",
                                    fontSize: "12.5px"
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Username Handle
                            </label>
                            <input
                                type="text"
                                value={username}
                                placeholder="Custom username"
                                onChange={e => setUsername(e.target.value)}
                                style={{
                                    width: "100%",
                                    marginTop: "4px",
                                    padding: "8px 10px",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--background-tertiary)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    color: "var(--text-normal)",
                                    fontSize: "12.5px"
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Member Since Date
                            </label>
                            <input
                                type="text"
                                value={createdAt}
                                placeholder="YYYY-MM-DD (e.g. 2015-05-13)"
                                onChange={e => setCreatedAt(e.target.value)}
                                style={{
                                    width: "100%",
                                    marginTop: "4px",
                                    padding: "8px 10px",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--background-tertiary)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    color: "var(--text-normal)",
                                    fontSize: "12.5px"
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>
                            Profile Badges
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {DISCORD_BADGES.map(badge => {
                                const isSelected = selectedBadges.includes(badge.id);
                                return (
                                    <button
                                        key={badge.id}
                                        type="button"
                                        onClick={() => toggleBadge(badge.id)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 8px",
                                            borderRadius: "16px",
                                            border: isSelected ? "1px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                            backgroundColor: isSelected ? "var(--brand-500-02a, rgba(88, 101, 242, 0.2))" : "var(--background-tertiary)",
                                            color: isSelected ? "var(--header-primary)" : "var(--text-muted)",
                                            cursor: "pointer",
                                            fontSize: "11.5px"
                                        }}
                                    >
                                        <img
                                            src={`https://cdn.discordapp.com/badge-icons/${badge.icon}.png`}
                                            alt={badge.name}
                                            width={16}
                                            height={16}
                                        />
                                        <span>{badge.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>
                            Avatar Decoration (Dynamically Loaded from Discord Shop)
                        </label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select
                                value={selectedDeco}
                                onChange={e => {
                                    setSelectedDeco(e.target.value);
                                    const item = collectibles.find(c => c.asset === e.target.value);
                                    if (item) {
                                        localCosmeticsSettings.store.customDecorationSkuId = item.skuId;
                                    }
                                    localCosmeticsSettings.store.customDecorationAsset = e.target.value;
                                    applyToCurrentUser();
                                }}
                                style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--background-tertiary)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    color: "var(--text-normal)",
                                    fontSize: "12.5px"
                                }}
                            >
                                <option value="">-- None (No Decoration) --</option>
                                {collectibles.map(item => (
                                    <option key={item.asset} value={item.asset}>
                                        {item.categoryName ? `[${item.categoryName}] ` : ""}{item.name}
                                    </option>
                                ))}
                            </select>
                            {selectedDeco && (
                                <img
                                    src={`https://cdn.discordapp.com/avatar-decoration-presets/${selectedDeco}.png?size=96&passthrough=true`}
                                    alt="Decoration preview"
                                    width={36}
                                    height={36}
                                    style={{ borderRadius: "50%", backgroundColor: "var(--background-tertiary)" }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <Button
                            variant="primary"
                            size="small"
                            onClick={handleApply}
                        >
                            Apply Profile Changes
                        </Button>
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={handleReset}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}

function SecretFeatureRow({ feature }: { feature: SecretFeature }) {
    const plugin = Plugins[feature.id];
    useSettings([`plugins.${feature.id}.enabled` as any]);

    const isEnabled = isPluginEnabled(feature.id);

    const onToggle = (enabled: boolean) => {
        if (!plugin) {
            showToast({ text: `Plugin ${feature.id} not found`, variant: "critical" });
            return;
        }

        const settings = Settings.plugins[feature.id];
        settings.enabled = enabled;

        if (enabled) {
            const { restartNeeded, failures } = startDependenciesRecursive(plugin);
            if (failures.length) {
                showToast({ text: `Failed to start dependencies: ${failures.join(", ")}`, variant: "critical" });
                return;
            }
            if (restartNeeded || feature.restartRequired || plugin.patches?.length) {
                promptToRestart("relaunch");
                return;
            }
            startPlugin(plugin);
        } else {
            if (feature.restartRequired || plugin.patches?.length) {
                promptToRestart("relaunch");
                return;
            }
            stopPlugin(plugin);
        }
    };

    return (
        <Card style={{ marginBottom: "10px", padding: "12px 16px", backgroundColor: "var(--background-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1, paddingRight: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--header-primary)" }}>
                            {feature.title}
                        </span>
                        {plugin?.settings && (
                            <button
                                type="button"
                                onClick={() => openPluginModal(plugin)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "2px 6px",
                                    borderRadius: "4px"
                                }}
                                title="Configure Settings"
                            >
                                Settings
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {feature.description}
                    </div>
                </div>
                <FormSwitch
                    title=""
                    hideBorder
                    value={isEnabled}
                    onChange={onToggle}
                />
            </div>
        </Card>
    );
}

function SecretTab() {
    return (
        <SettingsTab>
            <Heading className={Margins.top8}>NyaCord Secret</Heading>
            <Paragraph className={Margins.bottom16}>
                Advanced stealth, unhide, and power features inspired by Nightcord. Built natively into NyaCord with pure open source logic and zero telemetry.
            </Paragraph>

            <LocalCosmeticsEditor />

            <Divider style={{ margin: "16px 0" }} />

            {SECRET_SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: "24px" }}>
                    <Heading style={{ fontSize: "15px", marginBottom: "4px" }}>
                        {section.title}
                    </Heading>
                    <Paragraph style={{ fontSize: "12px", marginBottom: "12px" }}>
                        {section.subtitle}
                    </Paragraph>
                    {section.features.map(f => (
                        <SecretFeatureRow key={f.id} feature={f} />
                    ))}
                </div>
            ))}
        </SettingsTab>
    );
}

export default wrapTab(SecretTab, "NyaCord Secret");
