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
    getBadgeIconUrl,
    getRealUserBadges,
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

const SECRET_SECTIONS: { title: string; subtitle: string; icon: string; features: SecretFeature[] }[] = [
    {
        title: "Stealth & Privacy",
        subtitle: "Ghost mode tools to keep your actions completely invisible to others.",
        icon: "👻",
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
        icon: "👁️",
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
        title: "Audio & Ear Protection",
        subtitle: "Advanced audio processing to amplify quiet voices and protect your hearing.",
        icon: "🔊",
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
        title: "Multi-Accounts & Entertainment",
        subtitle: "Enhancements for multi-account management and media playback.",
        icon: "👥",
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
        icon: "🛡️",
        features: [
            {
                id: "AntiNickname",
                title: "Anti-Nickname",
                description: "Automatically restores your server nickname if moderators reset or change it."
            }
        ]
    }
];

const DATE_PRESETS = [
    { label: "Launch Day (2015)", date: "2015-05-13" },
    { label: "Early 2016", date: "2016-01-01" },
    { label: "OG 2017", date: "2017-06-15" },
    { label: "Veteran 2018", date: "2018-09-01" },
    { label: "Quarantine 2020", date: "2020-03-20" },
    { label: "Today", date: new Date().toISOString().split("T")[0] }
];

const THEME_PALETTES = [
    { name: "Sakura Blossom", primary: "#FF94B8", accent: "#7983F5" },
    { name: "Cyberpunk Neon", primary: "#00F0FF", accent: "#FF007F" },
    { name: "Midnight Rose", primary: "#8A2387", accent: "#E94057" },
    { name: "Deep Space", primary: "#1E3C72", accent: "#2A5298" },
    { name: "Emerald Mist", primary: "#11998E", accent: "#38EF7D" },
    { name: "Sunset Gold", primary: "#F12711", accent: "#F5AF19" }
];

function LocalCosmeticsEditor() {
    const isCosmeticsEnabled = isPluginEnabled("LocalCosmetics");
    useSettings(["plugins.LocalCosmetics.enabled" as any]);

    const [activeSubTab, setActiveSubTab] = useState<"identity" | "badges" | "decorations" | "effects" | "theme">("identity");

    // Collectibles & Real badges
    const [decorations, setDecorations] = useState<CollectibleItem[]>([]);
    const [effects, setEffects] = useState<CollectibleItem[]>([]);
    const [realBadges, setRealBadges] = useState<any[]>([]);

    // Toggles for individual replacements
    const [enableDisplayName, setEnableDisplayName] = useState(localCosmeticsSettings.store.enableDisplayName ?? false);
    const [displayName, setDisplayName] = useState(localCosmeticsSettings.store.customDisplayName || "");

    const [enableUsername, setEnableUsername] = useState(localCosmeticsSettings.store.enableUsername ?? false);
    const [username, setUsername] = useState(localCosmeticsSettings.store.customUsername || "");

    const [enableCreatedAt, setEnableCreatedAt] = useState(localCosmeticsSettings.store.enableCreatedAt ?? false);
    const [createdAt, setCreatedAt] = useState(localCosmeticsSettings.store.customCreatedAt || "2015-05-13");

    const [enableBadges, setEnableBadges] = useState(localCosmeticsSettings.store.enableBadges ?? true);
    const [selectedBadges, setSelectedBadges] = useState<string[]>(() => {
        const raw = localCosmeticsSettings.store.customBadges;
        return raw ? raw.split(",").map(b => b.trim()).filter(Boolean) : [];
    });
    const [hiddenBadges, setHiddenBadges] = useState<string[]>(() => {
        const raw = localCosmeticsSettings.store.hiddenBadges;
        return raw ? raw.split(",").map(b => b.trim()).filter(Boolean) : [];
    });
    const [badgeCategory, setBadgeCategory] = useState<string>("All");

    const [enableDecoration, setEnableDecoration] = useState(localCosmeticsSettings.store.enableDecoration ?? false);
    const [selectedDeco, setSelectedDeco] = useState(localCosmeticsSettings.store.customDecorationAsset || "");
    const [decoCategory, setDecoCategory] = useState<string>("All");
    const [decoSearch, setDecoSearch] = useState<string>("");

    const [enableProfileEffect, setEnableProfileEffect] = useState(localCosmeticsSettings.store.enableProfileEffect ?? false);
    const [selectedEffect, setSelectedEffect] = useState(localCosmeticsSettings.store.customProfileEffectId || "");
    const [effectCategory, setEffectCategory] = useState<string>("All");

    const [enableThemeColors, setEnableThemeColors] = useState(localCosmeticsSettings.store.enableThemeColors ?? false);
    const [primaryColor, setPrimaryColor] = useState(localCosmeticsSettings.store.primaryThemeColor || "#7983F5");
    const [accentColor, setAccentColor] = useState(localCosmeticsSettings.store.accentThemeColor || "#FF94B8");

    const [enableBanner, setEnableBanner] = useState(localCosmeticsSettings.store.enableBanner ?? false);
    const [customBanner, setCustomBanner] = useState(localCosmeticsSettings.store.customBannerUrl || "");

    useEffect(() => {
        fetchDiscordCollectibles().then(res => {
            setDecorations(res.decorations);
            setEffects(res.effects);
        });
        const currentReal = getRealUserBadges();
        setRealBadges(currentReal);
    }, []);

    const isAlreadyOnProfile = (badgeId: string, badgeIcon: string) => {
        return realBadges.some(rb => rb.id === badgeId || rb.icon === badgeIcon);
    };

    const toggleBadge = (badgeId: string, badgeIcon: string) => {
        if (isAlreadyOnProfile(badgeId, badgeIcon)) return;
        const updated = selectedBadges.includes(badgeId)
            ? selectedBadges.filter(id => id !== badgeId)
            : [...selectedBadges, badgeId];
        setSelectedBadges(updated);
        localCosmeticsSettings.store.customBadges = updated.join(",");
        applyToCurrentUser();
    };

    const toggleHideRealBadge = (identifier: string) => {
        const updated = hiddenBadges.includes(identifier)
            ? hiddenBadges.filter(id => id !== identifier)
            : [...hiddenBadges, identifier];
        setHiddenBadges(updated);
        localCosmeticsSettings.store.hiddenBadges = updated.join(",");
        applyToCurrentUser();
    };

    const handleApply = () => {
        localCosmeticsSettings.store.enableDisplayName = enableDisplayName;
        localCosmeticsSettings.store.customDisplayName = displayName;

        localCosmeticsSettings.store.enableUsername = enableUsername;
        localCosmeticsSettings.store.customUsername = username;

        localCosmeticsSettings.store.enableCreatedAt = enableCreatedAt;
        localCosmeticsSettings.store.customCreatedAt = createdAt;

        localCosmeticsSettings.store.enableBadges = enableBadges;
        localCosmeticsSettings.store.customBadges = selectedBadges.join(",");
        localCosmeticsSettings.store.hiddenBadges = hiddenBadges.join(",");

        localCosmeticsSettings.store.enableDecoration = enableDecoration;
        localCosmeticsSettings.store.customDecorationAsset = selectedDeco;
        const foundDeco = decorations.find(c => c.asset === selectedDeco);
        if (foundDeco) {
            localCosmeticsSettings.store.customDecorationSkuId = foundDeco.skuId;
        }

        localCosmeticsSettings.store.enableProfileEffect = enableProfileEffect;
        localCosmeticsSettings.store.customProfileEffectId = selectedEffect;

        localCosmeticsSettings.store.enableThemeColors = enableThemeColors;
        localCosmeticsSettings.store.primaryThemeColor = primaryColor;
        localCosmeticsSettings.store.accentThemeColor = accentColor;

        localCosmeticsSettings.store.enableBanner = enableBanner;
        localCosmeticsSettings.store.customBannerUrl = customBanner;

        applyToCurrentUser();
        showToast({ text: "Profile cosmetics applied successfully!", variant: "success" });
    };

    const handleReset = () => {
        setEnableDisplayName(false);
        setDisplayName("");
        setEnableUsername(false);
        setUsername("");
        setEnableCreatedAt(false);
        setCreatedAt("2015-05-13");
        setEnableBadges(false);
        setSelectedBadges([]);
        setHiddenBadges([]);
        setEnableDecoration(false);
        setSelectedDeco("");
        setEnableProfileEffect(false);
        setSelectedEffect("");
        setEnableThemeColors(false);
        setPrimaryColor("#7983F5");
        setAccentColor("#FF94B8");
        setEnableBanner(false);
        setCustomBanner("");

        localCosmeticsSettings.store.enableDisplayName = false;
        localCosmeticsSettings.store.customDisplayName = "";
        localCosmeticsSettings.store.enableUsername = false;
        localCosmeticsSettings.store.customUsername = "";
        localCosmeticsSettings.store.enableCreatedAt = false;
        localCosmeticsSettings.store.customCreatedAt = "";
        localCosmeticsSettings.store.enableBadges = false;
        localCosmeticsSettings.store.customBadges = "";
        localCosmeticsSettings.store.hiddenBadges = "";
        localCosmeticsSettings.store.enableDecoration = false;
        localCosmeticsSettings.store.customDecorationAsset = "";
        localCosmeticsSettings.store.customDecorationSkuId = "";
        localCosmeticsSettings.store.enableProfileEffect = false;
        localCosmeticsSettings.store.customProfileEffectId = "";
        localCosmeticsSettings.store.enableThemeColors = false;
        localCosmeticsSettings.store.primaryThemeColor = "#7983F5";
        localCosmeticsSettings.store.accentThemeColor = "#FF94B8";
        localCosmeticsSettings.store.enableBanner = false;
        localCosmeticsSettings.store.customBannerUrl = "";

        applyToCurrentUser();
        showToast({ text: "All local cosmetics reset to defaults.", variant: "success" });
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

    // Filter categories
    const decoCategories = ["All", ...Array.from(new Set(decorations.map(d => d.categoryName).filter(Boolean)))];
    const filteredDecos = decorations
        .filter(d => decoCategory === "All" || d.categoryName === decoCategory)
        .filter(d => !decoSearch || d.name.toLowerCase().includes(decoSearch.toLowerCase()));

    const effectCategories = ["All", ...Array.from(new Set(effects.map(e => e.categoryName).filter(Boolean)))];
    const filteredEffects = effects.filter(e => effectCategory === "All" || e.categoryName === effectCategory);

    const badgeCategories = ["All", "Special", "HypeSquad", "Developer", "Nitro", "Booster"];
    const filteredBadges = badgeCategory === "All" ? DISCORD_BADGES : DISCORD_BADGES.filter(b => b.category === badgeCategory);

    const formatDatePreview = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    };

    return (
        <Card style={{ marginBottom: "24px", padding: "18px", backgroundColor: "var(--background-secondary)", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--header-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Local Profile Cosmetics</span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(255, 148, 184, 0.2)", color: "#FF94B8" }}>
                            Nightcord Visuals (=^･ω･^=)
                        </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                        Locally customize your profile with official badges, Nitro tenure tiers, avatar frames, profile effects, colors, and account registration date.
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
                <div style={{ marginTop: "14px" }}>
                    {/* Navigation Sub-Tabs */}
                    <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--background-modifier-accent)", paddingBottom: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab("identity")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                backgroundColor: activeSubTab === "identity" ? "var(--background-modifier-selected)" : "transparent",
                                color: activeSubTab === "identity" ? "var(--header-primary)" : "var(--text-muted)"
                            }}
                        >
                            👤 Identity & Date
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab("badges")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                backgroundColor: activeSubTab === "badges" ? "var(--background-modifier-selected)" : "transparent",
                                color: activeSubTab === "badges" ? "var(--header-primary)" : "var(--text-muted)"
                            }}
                        >
                            🏅 Badges & Nitro
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab("decorations")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                backgroundColor: activeSubTab === "decorations" ? "var(--background-modifier-selected)" : "transparent",
                                color: activeSubTab === "decorations" ? "var(--header-primary)" : "var(--text-muted)"
                            }}
                        >
                            🖼️ Avatar Frames
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab("effects")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                backgroundColor: activeSubTab === "effects" ? "var(--background-modifier-selected)" : "transparent",
                                color: activeSubTab === "effects" ? "var(--header-primary)" : "var(--text-muted)"
                            }}
                        >
                            🌌 Profile Effects
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab("theme")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                backgroundColor: activeSubTab === "theme" ? "var(--background-modifier-selected)" : "transparent",
                                color: activeSubTab === "theme" ? "var(--header-primary)" : "var(--text-muted)"
                            }}
                        >
                            🎨 Theme & Banner
                        </button>
                    </div>

                    {/* SUB-TAB 1: IDENTITY & DATE */}
                    {activeSubTab === "identity" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Display Name Section */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Display Name (Nickname)
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Overrides your displayed nickname locally across channels and member lists.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableDisplayName}
                                        onChange={v => {
                                            setEnableDisplayName(v);
                                            localCosmeticsSettings.store.enableDisplayName = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>
                                {enableDisplayName && (
                                    <input
                                        type="text"
                                        value={displayName}
                                        placeholder="Enter custom nickname..."
                                        onChange={e => setDisplayName(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 10px",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--background-secondary)",
                                            border: "1px solid var(--background-modifier-accent)",
                                            color: "var(--text-normal)",
                                            fontSize: "12.5px"
                                        }}
                                    />
                                )}
                            </div>

                            {/* Username Handle Section */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Username Handle
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Overrides your unique account username handle locally.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableUsername}
                                        onChange={v => {
                                            setEnableUsername(v);
                                            localCosmeticsSettings.store.enableUsername = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>
                                {enableUsername && (
                                    <input
                                        type="text"
                                        value={username}
                                        placeholder="Enter custom username handle..."
                                        onChange={e => setUsername(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 10px",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--background-secondary)",
                                            border: "1px solid var(--background-modifier-accent)",
                                            color: "var(--text-normal)",
                                            fontSize: "12.5px"
                                        }}
                                    />
                                )}
                            </div>

                            {/* Account Creation Date Section */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Member Since / Registration Date
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Modifies your account snowflake creation timestamp shown on profile popouts.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableCreatedAt}
                                        onChange={v => {
                                            setEnableCreatedAt(v);
                                            localCosmeticsSettings.store.enableCreatedAt = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableCreatedAt && (
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                            <input
                                                type="date"
                                                value={createdAt}
                                                min="2015-05-13"
                                                max={new Date().toISOString().split("T")[0]}
                                                onChange={e => setCreatedAt(e.target.value)}
                                                style={{
                                                    padding: "7px 12px",
                                                    borderRadius: "4px",
                                                    backgroundColor: "var(--background-secondary)",
                                                    border: "1px solid var(--background-modifier-accent)",
                                                    color: "var(--text-normal)",
                                                    fontSize: "13px",
                                                    cursor: "pointer"
                                                }}
                                            />
                                            {createdAt && (
                                                <span style={{ fontSize: "12px", color: "var(--header-secondary)" }}>
                                                    📅 Displayed: <strong>{formatDatePreview(createdAt)}</strong>
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "4px" }}>
                                                Quick Presets:
                                            </span>
                                            {DATE_PRESETS.map(p => (
                                                <button
                                                    key={p.date}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreatedAt(p.date);
                                                        localCosmeticsSettings.store.customCreatedAt = p.date;
                                                        applyToCurrentUser();
                                                    }}
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        border: createdAt === p.date ? "1px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                        backgroundColor: createdAt === p.date ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                        color: createdAt === p.date ? "var(--header-primary)" : "var(--text-muted)"
                                                    }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 2: BADGES & NITRO */}
                    {activeSubTab === "badges" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Real Badges Detected (Hide/Show) */}
                            {realBadges.length > 0 && (
                                <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)", marginBottom: "4px" }}>
                                        Existing Real Badges on Your Profile
                                    </div>
                                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px" }}>
                                        Click a real badge below to hide or unhide it from your profile:
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {realBadges.map((rb, idx) => {
                                            const idKey = rb.id || rb.icon || `real_${idx}`;
                                            const isHidden = hiddenBadges.includes(rb.id) || hiddenBadges.includes(rb.icon);
                                            const iconSrc = getBadgeIconUrl(rb);
                                            return (
                                                <button
                                                    key={idKey}
                                                    type="button"
                                                    onClick={() => toggleHideRealBadge(rb.id || rb.icon)}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "5px 10px",
                                                        borderRadius: "16px",
                                                        border: isHidden ? "1px dashed var(--status-danger)" : "1px solid var(--status-positive)",
                                                        backgroundColor: isHidden ? "rgba(218, 55, 60, 0.15)" : "rgba(35, 165, 90, 0.15)",
                                                        color: isHidden ? "var(--status-danger)" : "var(--header-primary)",
                                                        cursor: "pointer",
                                                        fontSize: "11.5px",
                                                        opacity: isHidden ? 0.65 : 1
                                                    }}
                                                    title={isHidden ? "Click to unhide this badge" : "Click to hide this badge"}
                                                >
                                                    {iconSrc && (
                                                        <img
                                                            src={iconSrc}
                                                            alt={rb.description || "Badge"}
                                                            width={16}
                                                            height={16}
                                                            style={{ objectFit: "contain" }}
                                                        />
                                                    )}
                                                    <span>{rb.description || rb.id}</span>
                                                    <span style={{ fontSize: "10px", fontWeight: "bold" }}>
                                                        {isHidden ? "✖ HIDDEN" : "✔ VISIBLE"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Add Custom Badges */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Add Custom Badges & Nitro Tiers
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Select badges to display on your profile. Hover over any badge to view its tooltip.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableBadges}
                                        onChange={v => {
                                            setEnableBadges(v);
                                            localCosmeticsSettings.store.enableBadges = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableBadges && (
                                    <div>
                                        {/* Category Filter Pills */}
                                        <div style={{ display: "flex", gap: "5px", marginBottom: "10px", flexWrap: "wrap" }}>
                                            {badgeCategories.map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setBadgeCategory(cat)}
                                                    style={{
                                                        padding: "4px 11px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        border: badgeCategory === cat ? "1px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                        backgroundColor: badgeCategory === cat ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                        color: badgeCategory === cat ? "var(--header-primary)" : "var(--text-muted)"
                                                    }}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Badges List with working icons */}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                            {filteredBadges.map(badge => {
                                                const isSelected = selectedBadges.includes(badge.id);
                                                const alreadyOwned = isAlreadyOnProfile(badge.id, badge.icon);
                                                const iconUrl = getBadgeIconUrl(badge);

                                                return (
                                                    <button
                                                        key={badge.id}
                                                        type="button"
                                                        onClick={() => toggleBadge(badge.id, badge.icon)}
                                                        disabled={alreadyOwned}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            padding: "5px 10px",
                                                            borderRadius: "16px",
                                                            border: alreadyOwned
                                                                ? "1px solid var(--background-modifier-accent)"
                                                                : isSelected
                                                                ? "1px solid var(--brand-500)"
                                                                : "1px solid var(--background-modifier-accent)",
                                                            backgroundColor: alreadyOwned
                                                                ? "var(--background-modifier-hover)"
                                                                : isSelected
                                                                ? "rgba(121, 131, 245, 0.2)"
                                                                : "var(--background-secondary)",
                                                            color: alreadyOwned
                                                                ? "var(--text-muted)"
                                                                : isSelected
                                                                ? "var(--header-primary)"
                                                                : "var(--text-normal)",
                                                            cursor: alreadyOwned ? "not-allowed" : "pointer",
                                                            fontSize: "11.5px",
                                                            opacity: alreadyOwned ? 0.6 : 1
                                                        }}
                                                        title={alreadyOwned ? "Already present on your real profile" : badge.description}
                                                    >
                                                        {iconUrl && (
                                                            <img
                                                                src={iconUrl}
                                                                alt={badge.name}
                                                                width={16}
                                                                height={16}
                                                                style={{ objectFit: "contain" }}
                                                            />
                                                        )}
                                                        <span>{badge.name}</span>
                                                        {alreadyOwned && (
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                                                (Owned)
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 3: AVATAR DECORATIONS (FRAMES) */}
                    {activeSubTab === "decorations" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Avatar Frame Decoration
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Visual gallery of all official Discord avatar frames with live animated preview.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableDecoration}
                                        onChange={v => {
                                            setEnableDecoration(v);
                                            localCosmeticsSettings.store.enableDecoration = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableDecoration && (
                                    <div>
                                        {/* Filter & Search Bar */}
                                        <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                            <input
                                                type="text"
                                                value={decoSearch}
                                                placeholder="Search avatar frames..."
                                                onChange={e => setDecoSearch(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: "160px",
                                                    padding: "6px 10px",
                                                    borderRadius: "4px",
                                                    backgroundColor: "var(--background-secondary)",
                                                    border: "1px solid var(--background-modifier-accent)",
                                                    color: "var(--text-normal)",
                                                    fontSize: "12px"
                                                }}
                                            />
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {decoCategories.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setDecoCategory(c)}
                                                        style={{
                                                            padding: "3px 8px",
                                                            borderRadius: "10px",
                                                            fontSize: "11px",
                                                            cursor: "pointer",
                                                            border: decoCategory === c ? "1px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                            backgroundColor: decoCategory === c ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                            color: decoCategory === c ? "var(--header-primary)" : "var(--text-muted)"
                                                        }}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Visual Grid of Frames */}
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))", gap: "10px", maxHeight: "320px", overflowY: "auto", padding: "4px" }}>
                                            {/* None Card */}
                                            <div
                                                onClick={() => {
                                                    setSelectedDeco("");
                                                    localCosmeticsSettings.store.customDecorationAsset = "";
                                                    localCosmeticsSettings.store.customDecorationSkuId = "";
                                                    applyToCurrentUser();
                                                }}
                                                style={{
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    backgroundColor: selectedDeco === "" ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                    border: selectedDeco === "" ? "2px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minHeight: "100px"
                                                }}
                                            >
                                                <span style={{ fontSize: "22px", opacity: 0.5 }}>🚫</span>
                                                <span style={{ fontSize: "11px", marginTop: "6px", color: "var(--text-muted)" }}>None</span>
                                            </div>

                                            {/* Decoration Cards */}
                                            {filteredDecos.map(item => {
                                                const isSel = selectedDeco === item.asset;
                                                return (
                                                    <div
                                                        key={item.asset}
                                                        onClick={() => {
                                                            setSelectedDeco(item.asset);
                                                            localCosmeticsSettings.store.customDecorationAsset = item.asset;
                                                            localCosmeticsSettings.store.customDecorationSkuId = item.skuId;
                                                            applyToCurrentUser();
                                                        }}
                                                        style={{
                                                            position: "relative",
                                                            padding: "10px 8px",
                                                            borderRadius: "8px",
                                                            backgroundColor: isSel ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                            border: isSel ? "2px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                            cursor: "pointer",
                                                            textAlign: "center",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center"
                                                        }}
                                                    >
                                                        {/* Avatar Frame with preview circle */}
                                                        <div style={{ position: "relative", width: "48px", height: "48px", marginBottom: "6px" }}>
                                                            <div style={{ width: "40px", height: "40px", margin: "4px", borderRadius: "50%", backgroundColor: "var(--background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <span style={{ fontSize: "16px" }}>🐱</span>
                                                            </div>
                                                            <img
                                                                src={`https://cdn.discordapp.com/avatar-decoration-presets/${item.asset}.png?size=96&passthrough=true`}
                                                                alt={item.name}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: "48px",
                                                                    height: "48px",
                                                                    pointerEvents: "none"
                                                                }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: "11px", fontWeight: 500, color: isSel ? "var(--header-primary)" : "var(--text-normal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                                                            {item.name}
                                                        </span>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                            {item.categoryName}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 4: PROFILE EFFECTS */}
                    {activeSubTab === "effects" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Profile Effect (Animated Background)
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Visual gallery of all animated background effects for your profile banner.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableProfileEffect}
                                        onChange={v => {
                                            setEnableProfileEffect(v);
                                            localCosmeticsSettings.store.enableProfileEffect = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableProfileEffect && (
                                    <div>
                                        {/* Category Filter */}
                                        <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
                                            {effectCategories.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setEffectCategory(c)}
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: "10px",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        border: effectCategory === c ? "1px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                        backgroundColor: effectCategory === c ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                        color: effectCategory === c ? "var(--header-primary)" : "var(--text-muted)"
                                                    }}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Visual Grid of Effects */}
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", maxHeight: "300px", overflowY: "auto", padding: "4px" }}>
                                            <div
                                                onClick={() => {
                                                    setSelectedEffect("");
                                                    localCosmeticsSettings.store.customProfileEffectId = "";
                                                    applyToCurrentUser();
                                                }}
                                                style={{
                                                    padding: "12px 8px",
                                                    borderRadius: "8px",
                                                    backgroundColor: selectedEffect === "" ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                    border: selectedEffect === "" ? "2px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                <span style={{ fontSize: "20px", opacity: 0.5 }}>🚫</span>
                                                <span style={{ fontSize: "11px", marginTop: "6px", color: "var(--text-muted)" }}>None</span>
                                            </div>

                                            {filteredEffects.map(item => {
                                                const isSel = selectedEffect === item.skuId;
                                                return (
                                                    <div
                                                        key={item.skuId}
                                                        onClick={() => {
                                                            setSelectedEffect(item.skuId);
                                                            localCosmeticsSettings.store.customProfileEffectId = item.skuId;
                                                            applyToCurrentUser();
                                                        }}
                                                        style={{
                                                            padding: "12px 8px",
                                                            borderRadius: "8px",
                                                            backgroundColor: isSel ? "rgba(121, 131, 245, 0.2)" : "var(--background-secondary)",
                                                            border: isSel ? "2px solid var(--brand-500)" : "1px solid var(--background-modifier-accent)",
                                                            cursor: "pointer",
                                                            textAlign: "center",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center"
                                                        }}
                                                    >
                                                        <span style={{ fontSize: "22px" }}>✨</span>
                                                        <span style={{ fontSize: "11.5px", fontWeight: 500, color: isSel ? "var(--header-primary)" : "var(--text-normal)", marginTop: "4px" }}>
                                                            {item.name}
                                                        </span>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                            {item.categoryName}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 5: THEME & BANNER (ПРОЧЕЕ) */}
                    {activeSubTab === "theme" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Profile Gradient Colors */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Profile Theme Gradient Colors
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Set custom dual-color gradient themes for your profile popout and card.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableThemeColors}
                                        onChange={v => {
                                            setEnableThemeColors(v);
                                            localCosmeticsSettings.store.enableThemeColors = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableThemeColors && (
                                    <div>
                                        <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={e => setPrimaryColor(e.target.value)}
                                                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                                                />
                                                <span style={{ fontSize: "12px", color: "var(--text-normal)" }}>Primary: {primaryColor}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <input
                                                    type="color"
                                                    value={accentColor}
                                                    onChange={e => setAccentColor(e.target.value)}
                                                    style={{ width: "32px", height: "32px", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                                                />
                                                <span style={{ fontSize: "12px", color: "var(--text-normal)" }}>Accent: {accentColor}</span>
                                            </div>
                                            {/* Preview Bar */}
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: "32px",
                                                    borderRadius: "6px",
                                                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                                                    border: "1px solid var(--background-modifier-accent)"
                                                }}
                                            />
                                        </div>

                                        {/* Presets */}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "4px" }}>
                                                Palettes:
                                            </span>
                                            {THEME_PALETTES.map(p => (
                                                <button
                                                    key={p.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setPrimaryColor(p.primary);
                                                        setAccentColor(p.accent);
                                                        localCosmeticsSettings.store.primaryThemeColor = p.primary;
                                                        localCosmeticsSettings.store.accentThemeColor = p.accent;
                                                        applyToCurrentUser();
                                                    }}
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "5px",
                                                        backgroundColor: "var(--background-secondary)",
                                                        border: "1px solid var(--background-modifier-accent)",
                                                        color: "var(--text-normal)"
                                                    }}
                                                >
                                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }} />
                                                    <span>{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Custom Profile Banner URL */}
                            <div style={{ padding: "12px", backgroundColor: "var(--background-tertiary)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--header-primary)" }}>
                                            Custom Profile Banner (Image or GIF URL)
                                        </div>
                                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                                            Override your profile banner with any custom image or animated GIF link.
                                        </div>
                                    </div>
                                    <FormSwitch
                                        title=""
                                        hideBorder
                                        value={enableBanner}
                                        onChange={v => {
                                            setEnableBanner(v);
                                            localCosmeticsSettings.store.enableBanner = v;
                                            applyToCurrentUser();
                                        }}
                                    />
                                </div>

                                {enableBanner && (
                                    <div>
                                        <input
                                            type="text"
                                            value={customBanner}
                                            placeholder="https://example.com/banner.gif or image URL"
                                            onChange={e => setCustomBanner(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "8px 10px",
                                                borderRadius: "4px",
                                                backgroundColor: "var(--background-secondary)",
                                                border: "1px solid var(--background-modifier-accent)",
                                                color: "var(--text-normal)",
                                                fontSize: "12.5px"
                                            }}
                                        />
                                        {customBanner && (
                                            <div style={{ marginTop: "8px", maxHeight: "100px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--background-modifier-accent)" }}>
                                                <img src={customBanner} alt="Banner Preview" style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Common Action Buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--background-modifier-accent)" }}>
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
                            Reset to Default
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
        <Card style={{ marginBottom: "8px", padding: "12px 16px", backgroundColor: "var(--background-secondary)" }}>
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
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
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

            <Divider style={{ margin: "20px 0 16px" }} />

            {SECRET_SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px" }}>{section.icon}</span>
                        <Heading style={{ fontSize: "15px" }}>
                            {section.title}
                        </Heading>
                    </div>
                    <Paragraph style={{ fontSize: "12px", marginBottom: "10px" }}>
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
