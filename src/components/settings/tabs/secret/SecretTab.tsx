import { isPluginEnabled, startDependenciesRecursive, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings, useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { promptToRestart } from "@utils/promptToRestart";
import { React, showToast } from "@webpack/common";
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
                                ⚙️ Configure
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
