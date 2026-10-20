import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, RestAPI, SnowflakeUtils, UserProfileStore, UserStore } from "@webpack/common";

export interface DiscordBadgeDef {
    id: string;
    name: string;
    category: "Special" | "HypeSquad" | "Developer" | "Nitro" | "Booster";
    icon: string;
    description: string;
    flag?: number;
    link?: string;
}

export function getBadgeIconUrl(badge: { icon: string }): string {
    if (!badge.icon) return "";
    if (badge.icon.startsWith("http")) return badge.icon;
    return `https://cdn.discordapp.com/badge-icons/${badge.icon}.png`;
}

export const DISCORD_BADGES: DiscordBadgeDef[] = [
    // Special
    { id: "staff", name: "Discord Staff", category: "Special", icon: "5e74e9b61934fc1f67c65515d1f7e60d", description: "Discord Staff", flag: 1 << 0, link: "https://discord.com/company" },
    { id: "partner", name: "Partnered Server Owner", category: "Special", icon: "3f9748e53446a137a052f3454e2de41e", description: "Partnered Server Owner", flag: 1 << 1, link: "https://discord.com/partners" },
    { id: "early_supporter", name: "Early Supporter", category: "Special", icon: "7060786766c9c840eb3019e725d2b358", description: "Early Supporter", flag: 1 << 9, link: "https://discord.com/settings/premium" },
    { id: "certified_moderator", name: "Moderator Programs Alumni", category: "Special", icon: "fee1624003e2fee35cb398e125dc479b", description: "Moderator Programs Alumni", flag: 1 << 18, link: "https://discord.com/safety" },
    { id: "quest_completed", name: "Completed a Quest", category: "Special", icon: "7d9ae358c8c5e118768335d387b463a8", description: "Completed a Quest" },

    // HypeSquad
    { id: "hypesquad", name: "HypeSquad Events", category: "HypeSquad", icon: "bf01d1073931f921909045f3a39fd264", description: "HypeSquad Events Member", flag: 1 << 2, link: "https://discord.com/hypesquad" },
    { id: "hypesquad_house_1", name: "HypeSquad Bravery", category: "HypeSquad", icon: "8a88d63823d8a71cd5e390baa45efa02", description: "HypeSquad Bravery", flag: 1 << 6, link: "https://discord.com/settings/hypesquad-online" },
    { id: "hypesquad_house_2", name: "HypeSquad Brilliance", category: "HypeSquad", icon: "011940fd013da3f7fb926e4a1cd2e618", description: "HypeSquad Brilliance", flag: 1 << 7, link: "https://discord.com/settings/hypesquad-online" },
    { id: "hypesquad_house_3", name: "HypeSquad Balance", category: "HypeSquad", icon: "3aa41de486fa12454c3761e8e223442e", description: "HypeSquad Balance", flag: 1 << 8, link: "https://discord.com/settings/hypesquad-online" },

    // Developer & Bug Hunter
    { id: "bug_hunter_level_1", name: "Bug Hunter Level 1", category: "Developer", icon: "2717692c7dca7289b35297368a940dd0", description: "Discord Bug Hunter", flag: 1 << 3, link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { id: "bug_hunter_level_2", name: "Bug Hunter Level 2", category: "Developer", icon: "848f79194d4be5ff5f81505cbd0ce1e6", description: "Discord Bug Hunter", flag: 1 << 14, link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { id: "verified_developer", name: "Early Verified Bot Developer", category: "Developer", icon: "6df5892e0f35b051f8b61eace34f4967", description: "Early Verified Bot Developer", flag: 1 << 17 },
    { id: "active_developer", name: "Active Developer", category: "Developer", icon: "6bdc42827a38498929a4920da12695d9", description: "Active Developer", flag: 1 << 22, link: "https://support-dev.discord.com/hc/en-us/articles/10113997751447" },

    // Nitro Subscriptions (Tenure Tiers with Official Working Discord CDN Assets)
    { id: "nitro_1m", name: "Nitro Bronze (1 Month)", category: "Nitro", icon: "https://discord.com/assets/0386191373eb17c272df.svg", description: "Subscriber since May 13, 2024", link: "https://discord.com/settings/premium" },
    { id: "nitro_3m", name: "Nitro Silver (3 Months)", category: "Nitro", icon: "https://discord.com/assets/9d4d362c62da3c985845.svg", description: "Subscriber since Jan 13, 2024", link: "https://discord.com/settings/premium" },
    { id: "nitro_6m", name: "Nitro Gold (6 Months)", category: "Nitro", icon: "https://discord.com/assets/8725fe12ada9afa51c1a.svg", description: "Subscriber since Jul 13, 2023", link: "https://discord.com/settings/premium" },
    { id: "nitro_1y", name: "Nitro Platinum (1 Year)", category: "Nitro", icon: "https://discord.com/assets/746689c803e06be87705.svg", description: "Subscriber since Jan 13, 2023", link: "https://discord.com/settings/premium" },
    { id: "nitro_2y", name: "Nitro Diamond (2 Years)", category: "Nitro", icon: "https://discord.com/assets/f3521e2861ff44a0384d.svg", description: "Subscriber since Jan 13, 2022", link: "https://discord.com/settings/premium" },
    { id: "nitro_3y", name: "Nitro Emerald (3 Years)", category: "Nitro", icon: "https://discord.com/assets/f2b9b02fb22cc6459922.svg", description: "Subscriber since Jan 13, 2021", link: "https://discord.com/settings/premium" },
    { id: "nitro_5y", name: "Nitro Ruby (5 Years)", category: "Nitro", icon: "https://discord.com/assets/ecf86e18838013c9d95a.svg", description: "Subscriber since Jan 13, 2019", link: "https://discord.com/settings/premium" },
    { id: "nitro_6y", name: "Nitro Opal (6+ Years)", category: "Nitro", icon: "https://discord.com/assets/b4fc7a9c37ec2fae36e3.svg", description: "Subscriber since Jan 13, 2018", link: "https://discord.com/settings/premium" },

    // Server Booster Badges (Tenure Tiers with Official Working Discord CDN Assets)
    { id: "booster_1m", name: "Booster (1 Month)", category: "Booster", icon: "https://discord.com/assets/ca18353be0e57a2b3b3132fa1c08d6b4.svg", description: "Server Booster since May 13, 2024" },
    { id: "booster_2m", name: "Booster (2 Months)", category: "Booster", icon: "https://discord.com/assets/22f99ed6e34eaca48950254c70f8fe8d.svg", description: "Server Booster since Mar 13, 2024" },
    { id: "booster_3m", name: "Booster (3 Months)", category: "Booster", icon: "https://discord.com/assets/4a2618502278029ce88adeea179ed435.svg", description: "Server Booster since Jan 13, 2024" },
    { id: "booster_6m", name: "Booster (6 Months)", category: "Booster", icon: "https://discord.com/assets/fbafa6adb7c49a6a2c3822521ff2af2f.svg", description: "Server Booster since Jul 13, 2023" },
    { id: "booster_9m", name: "Booster (9 Months)", category: "Booster", icon: "https://discord.com/assets/0599f90e32c15b532647163edd72f70a.svg", description: "Server Booster since Apr 13, 2023" },
    { id: "booster_12m", name: "Booster (1 Year)", category: "Booster", icon: "https://discord.com/assets/e07c08cdc72bcc78b69c76d2c7ceb344.svg", description: "Server Booster since Jan 13, 2023" },
    { id: "booster_15m", name: "Booster (15 Months)", category: "Booster", icon: "https://discord.com/assets/c7f26927db5e7806790f4e968038630a.svg", description: "Server Booster since Oct 13, 2022" },
    { id: "booster_18m", name: "Booster (18 Months)", category: "Booster", icon: "https://discord.com/assets/c6d88d1d12afe03bdc4ebb747f8d196b.svg", description: "Server Booster since Jul 13, 2022" },
    { id: "booster_24m", name: "Booster (2 Years)", category: "Booster", icon: "https://discord.com/assets/d96ed283b74de75692487b7499fb8d09.svg", description: "Server Booster since Jan 13, 2022" }
];

export interface CollectibleItem {
    id: string;
    skuId: string;
    name: string;
    type: number;
    asset: string;
    categoryName: string;
    previewUrl?: string;
}

export const FALLBACK_DECORATIONS: CollectibleItem[] = [
    { id: "sakura", skuId: "1144003461608280174", name: "Sakura Petals", type: 0, asset: "a_738676a60424a7bc9b6e838ff48ebf5b", categoryName: "Anime" },
    { id: "cat_ears", skuId: "1144003461608280175", name: "Kitty Ears", type: 0, asset: "a_0d7ba9182315fb38c35698b97d2e7b68", categoryName: "Cute" },
    { id: "cyberpunk", skuId: "1144003461608280176", name: "Cyberpunk Visor", type: 0, asset: "a_8a7d5df2f0d9a6c76e7323eead089ba8", categoryName: "Cyberpunk" },
    { id: "magic_portal", skuId: "1144003461608280177", name: "Magic Portal", type: 0, asset: "a_f08e4265ca598d9c57d7ee46d0a1b63e", categoryName: "Fantasy" },
    { id: "autumn_leaves", skuId: "1144003461608280178", name: "Autumn Leaves", type: 0, asset: "a_fa53f4787d559b3f3a8b4172c7a52233", categoryName: "Nature" },
    { id: "galaxy", skuId: "1144003461608280179", name: "Galaxy Orbit", type: 0, asset: "a_6e995f59048aef4627d2c3df83c92131", categoryName: "Space" },
    { id: "pixel_heart", skuId: "1144003461608280180", name: "Pixel Hearts", type: 0, asset: "a_4578b8a071ef24a1e94119fa9d0e2e5c", categoryName: "Retro" },
    { id: "flame_aura", skuId: "1144003461608280181", name: "Fire Aura", type: 0, asset: "a_534e6fef3724c7f078972f7ca5d4ee38", categoryName: "Fantasy" },
    { id: "electric_spark", skuId: "1144003461608280182", name: "Neon Sparks", type: 0, asset: "a_d908e2f89b7d3077e682aa1a18d1844b", categoryName: "Cyberpunk" },
    { id: "angel_halo", skuId: "1144003461608280183", name: "Angel Halo", type: 0, asset: "a_7e937d6e6f4f26b52758156dbd1297e5", categoryName: "Cute" }
];

export const FALLBACK_EFFECTS: CollectibleItem[] = [
    { id: "sakura_fall", skuId: "1144003461608280201", name: "Sakura Petals Fall", type: 1, asset: "e_738676a60424a7bc9b6e838ff48ebf5b", categoryName: "Anime" },
    { id: "cyber_grid", skuId: "1144003461608280202", name: "Cyber Circuit Grid", type: 1, asset: "e_8a7d5df2f0d9a6c76e7323eead089ba8", categoryName: "Cyberpunk" },
    { id: "arcane_runes", skuId: "1144003461608280203", name: "Arcane Runes", type: 1, asset: "e_f08e4265ca598d9c57d7ee46d0a1b63e", categoryName: "Fantasy" },
    { id: "cosmic_nebula", skuId: "1144003461608280204", name: "Cosmic Nebula", type: 1, asset: "e_6e995f59048aef4627d2c3df83c92131", categoryName: "Space" },
    { id: "retro_synth", skuId: "1144003461608280205", name: "Retro Synthwave", type: 1, asset: "e_fa53f4787d559b3f3a8b4172c7a52233", categoryName: "Retro" },
    { id: "starfall", skuId: "1144003461608280206", name: "Shooting Stars", type: 1, asset: "e_1d6248bcf9a4a768d6f081498b958742", categoryName: "Space" }
];

let loadedDecorations: CollectibleItem[] = [];
let loadedEffects: CollectibleItem[] = [];

export async function fetchDiscordCollectibles(): Promise<{ decorations: CollectibleItem[]; effects: CollectibleItem[] }> {
    if (loadedDecorations.length > 0 || loadedEffects.length > 0) {
        return { decorations: loadedDecorations, effects: loadedEffects };
    }
    try {
        const res = await RestAPI.get({ url: "/collectibles-categories?include_bundles=true" });
        const categories = res.body ?? [];
        const decos: CollectibleItem[] = [];
        const effs: CollectibleItem[] = [];

        for (const cat of categories) {
            for (const prod of cat.products ?? []) {
                for (const item of prod.items ?? []) {
                    const itemType = item.type ?? prod.type ?? 0;
                    const entry: CollectibleItem = {
                        id: item.id || prod.sku_id,
                        skuId: item.sku_id || prod.sku_id,
                        name: prod.name || item.name || (itemType === 1 ? "Profile Effect" : "Decoration"),
                        type: itemType,
                        asset: item.asset || prod.sku_id,
                        categoryName: cat.name || "General"
                    };
                    if (itemType === 1) {
                        effs.push(entry);
                    } else if (item.asset) {
                        decos.push(entry);
                    }
                }
            }
        }

        if (decos.length > 0) loadedDecorations = decos;
        if (effs.length > 0) loadedEffects = effs;

        return {
            decorations: loadedDecorations.length ? loadedDecorations : FALLBACK_DECORATIONS,
            effects: loadedEffects.length ? loadedEffects : FALLBACK_EFFECTS
        };
    } catch {
        return { decorations: FALLBACK_DECORATIONS, effects: FALLBACK_EFFECTS };
    }
}

export const settings = definePluginSettings({
    enableDisplayName: {
        type: OptionType.BOOLEAN,
        description: "Enable custom display name override",
        default: false
    },
    customDisplayName: {
        type: OptionType.STRING,
        description: "Local display name (nickname) visible to you",
        default: ""
    },
    enableUsername: {
        type: OptionType.BOOLEAN,
        description: "Enable custom username override",
        default: false
    },
    customUsername: {
        type: OptionType.STRING,
        description: "Local username handle visible to you",
        default: ""
    },
    enableCreatedAt: {
        type: OptionType.BOOLEAN,
        description: "Enable custom account creation date override",
        default: false
    },
    customCreatedAt: {
        type: OptionType.STRING,
        description: "Local account creation date (YYYY-MM-DD)",
        default: "2015-05-13"
    },
    enableBadges: {
        type: OptionType.BOOLEAN,
        description: "Enable custom badges",
        default: true
    },
    customBadges: {
        type: OptionType.STRING,
        description: "Comma-separated list of local badge IDs to display",
        default: "staff,early_supporter"
    },
    hiddenBadges: {
        type: OptionType.STRING,
        description: "Comma-separated list of real badge IDs/icons to hide",
        default: ""
    },
    enableDecoration: {
        type: OptionType.BOOLEAN,
        description: "Enable avatar decoration frame",
        default: false
    },
    customDecorationAsset: {
        type: OptionType.STRING,
        description: "Avatar decoration asset hash",
        default: ""
    },
    customDecorationSkuId: {
        type: OptionType.STRING,
        description: "Avatar decoration SKU ID",
        default: ""
    },
    enableProfileEffect: {
        type: OptionType.BOOLEAN,
        description: "Enable profile effect background",
        default: false
    },
    customProfileEffectId: {
        type: OptionType.STRING,
        description: "Profile effect SKU ID",
        default: ""
    },
    enableThemeColors: {
        type: OptionType.BOOLEAN,
        description: "Enable custom profile gradient colors",
        default: false
    },
    primaryThemeColor: {
        type: OptionType.STRING,
        description: "Primary theme hex color (e.g. #FF94B8)",
        default: "#7983F5"
    },
    accentThemeColor: {
        type: OptionType.STRING,
        description: "Accent theme hex color (e.g. #7983F5)",
        default: "#FF94B8"
    },
    enableBanner: {
        type: OptionType.BOOLEAN,
        description: "Enable custom banner image or gif",
        default: false
    },
    customBannerUrl: {
        type: OptionType.STRING,
        description: "Custom profile banner image or GIF URL",
        default: ""
    }
});

let originalExtractTimestamp: any = null;
let originalGetUserProfile: any = null;

export function getRealUserBadges(): any[] {
    const me = UserStore?.getCurrentUser?.();
    if (!me) return [];
    const profile = UserProfileStore?.getUserProfile?.(me.id);
    if (!profile) return [];
    return (profile as any)._originalBadges || profile.badges || [];
}

export function applyToCurrentUser() {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    if ((me as any)._origGlobalName === undefined) (me as any)._origGlobalName = me.globalName;
    if ((me as any)._origUsername === undefined) (me as any)._origUsername = me.username;
    if ((me as any)._origAvatarDeco === undefined) (me as any)._origAvatarDeco = (me as any).avatarDecorationData;
    if ((me as any)._origFlags === undefined) (me as any)._origFlags = me.flags;

    // Display Name
    if (settings.store.enableDisplayName && settings.store.customDisplayName) {
        me.globalName = settings.store.customDisplayName;
    } else if ((me as any)._origGlobalName !== undefined) {
        me.globalName = (me as any)._origGlobalName;
    }

    // Username
    if (settings.store.enableUsername && settings.store.customUsername) {
        me.username = settings.store.customUsername;
    } else if ((me as any)._origUsername !== undefined) {
        me.username = (me as any)._origUsername;
    }

    // Avatar Decoration
    if (settings.store.enableDecoration && settings.store.customDecorationAsset) {
        const deco = {
            asset: settings.store.customDecorationAsset,
            skuId: settings.store.customDecorationSkuId || "1144003461608280174"
        };
        (me as any).avatarDecorationData = deco;
        (me as any).avatarDecoration = deco;
    } else {
        (me as any).avatarDecorationData = (me as any)._origAvatarDeco ?? null;
        (me as any).avatarDecoration = (me as any)._origAvatarDeco ?? null;
    }

    // Profile Effect
    if (settings.store.enableProfileEffect && settings.store.customProfileEffectId) {
        (me as any).profileEffectId = settings.store.customProfileEffectId;
    }

    // Badges Flags
    if (settings.store.enableBadges) {
        const badgeIds = settings.store.customBadges
            ? settings.store.customBadges.split(",").map(b => b.trim()).filter(Boolean)
            : [];

        let combinedFlags = (me as any)._origFlags || 0;
        for (const badgeId of badgeIds) {
            const def = DISCORD_BADGES.find(b => b.id === badgeId);
            if (def?.flag) {
                combinedFlags |= def.flag;
            }
        }
        me.flags = combinedFlags;
        me.publicFlags = combinedFlags;
    } else if ((me as any)._origFlags !== undefined) {
        me.flags = (me as any)._origFlags;
        me.publicFlags = (me as any)._origFlags;
    }

    FluxDispatcher.dispatch({
        type: "USER_UPDATE",
        user: me
    });
}

function parseHexColor(hex: string): number {
    if (!hex) return 0;
    const clean = hex.replace("#", "").trim();
    const val = parseInt(clean, 16);
    return isNaN(val) ? 0 : val;
}

function patchStores() {
    if (SnowflakeUtils && !originalExtractTimestamp) {
        originalExtractTimestamp = SnowflakeUtils.extractTimestamp;
        SnowflakeUtils.extractTimestamp = function (id: string) {
            const me = UserStore?.getCurrentUser?.();
            if (me && id === me.id && settings.store.enableCreatedAt && settings.store.customCreatedAt) {
                const parsed = new Date(settings.store.customCreatedAt).getTime();
                if (!isNaN(parsed)) return parsed;
            }
            return originalExtractTimestamp.call(this, id);
        };
    }

    if (UserProfileStore && !originalGetUserProfile) {
        originalGetUserProfile = UserProfileStore.getUserProfile.bind(UserProfileStore);
        UserProfileStore.getUserProfile = function (id: string) {
            const profile = originalGetUserProfile(id);
            const me = UserStore?.getCurrentUser?.();
            if (profile && me && id === me.id) {
                if (!(profile as any)._originalBadges && profile.badges) {
                    (profile as any)._originalBadges = profile.badges.slice();
                }
                const realBadges: any[] = (profile as any)._originalBadges || profile.badges || [];

                const hiddenList = settings.store.hiddenBadges
                    ? settings.store.hiddenBadges.split(",").map(b => b.trim()).filter(Boolean)
                    : [];
                const visibleReal = realBadges.filter(b => !hiddenList.includes(b.id) && !hiddenList.includes(b.icon));

                if (settings.store.enableBadges) {
                    const badgeIds = settings.store.customBadges
                        ? settings.store.customBadges.split(",").map(b => b.trim()).filter(Boolean)
                        : [];

                    const extraBadges = badgeIds
                        .filter(bid => !visibleReal.some(rb => rb.id === bid))
                        .map(bid => {
                            const def = DISCORD_BADGES.find(b => b.id === bid);
                            if (!def) return null;
                            return {
                                id: def.id,
                                description: def.description || def.name,
                                icon: def.icon,
                                link: def.link
                            };
                        })
                        .filter(Boolean);

                    profile.badges = [...extraBadges, ...visibleReal];
                } else {
                    profile.badges = visibleReal;
                }

                if (settings.store.enableDecoration && settings.store.customDecorationAsset) {
                    profile.avatarDecoration = {
                        asset: settings.store.customDecorationAsset,
                        skuId: settings.store.customDecorationSkuId || "1144003461608280174"
                    };
                }

                if (settings.store.enableProfileEffect && settings.store.customProfileEffectId) {
                    profile.profileEffectId = settings.store.customProfileEffectId;
                }

                if (settings.store.enableThemeColors) {
                    profile.themeColors = [
                        parseHexColor(settings.store.primaryThemeColor),
                        parseHexColor(settings.store.accentThemeColor)
                    ];
                }

                if (settings.store.enableBanner && settings.store.customBannerUrl) {
                    profile.banner = settings.store.customBannerUrl;
                }
            }
            return profile;
        };
    }
}

function unpatchStores() {
    if (SnowflakeUtils && originalExtractTimestamp) {
        SnowflakeUtils.extractTimestamp = originalExtractTimestamp;
        originalExtractTimestamp = null;
    }
    if (UserProfileStore && originalGetUserProfile) {
        UserProfileStore.getUserProfile = originalGetUserProfile;
        originalGetUserProfile = null;
    }
}

export default definePlugin({
    name: "LocalCosmetics",
    description: "Customize your profile locally with real Discord badges, loaded shop decorations, custom names, and creation date",
    authors: [Devs.Megu],
    tags: ["Customisation", "Appearance", "Utility"],
    settings,

    start() {
        patchStores();
        applyToCurrentUser();
        fetchDiscordCollectibles();
    },

    stop() {
        unpatchStores();
    }
});
