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

    // Nitro Subscriptions (Tenure Tiers)
    { id: "nitro_1m", name: "Nitro (1 Month)", category: "Nitro", icon: "2ba85e8026a8614b640c2837bcdfe21b", description: "Subscriber since May 13, 2024", link: "https://discord.com/settings/premium" },
    { id: "nitro_2m", name: "Nitro (2 Months)", category: "Nitro", icon: "085ec396db819194eb430d88ef56fc5d", description: "Subscriber since Mar 13, 2024", link: "https://discord.com/settings/premium" },
    { id: "nitro_3m", name: "Nitro (3 Months)", category: "Nitro", icon: "98664ec28205f41076cc13b35ec03657", description: "Subscriber since Jan 13, 2024", link: "https://discord.com/settings/premium" },
    { id: "nitro_6m", name: "Nitro (6 Months)", category: "Nitro", icon: "632cd6fe702f342c8dcf936551b9d1b0", description: "Subscriber since Jul 13, 2023", link: "https://discord.com/settings/premium" },
    { id: "nitro_9m", name: "Nitro (9 Months)", category: "Nitro", icon: "955767eb0155b463242194602c89283e", description: "Subscriber since Apr 13, 2023", link: "https://discord.com/settings/premium" },
    { id: "nitro_1y", name: "Nitro (1 Year)", category: "Nitro", icon: "4902111feab4865d83aab5083693dd98", description: "Subscriber since Jan 13, 2023", link: "https://discord.com/settings/premium" },
    { id: "nitro_15m", name: "Nitro (15 Months)", category: "Nitro", icon: "1e90d2e557b7f14b679549ff31eb5c50", description: "Subscriber since Oct 13, 2022", link: "https://discord.com/settings/premium" },
    { id: "nitro_18m", name: "Nitro (18 Months)", category: "Nitro", icon: "4668ac29e2ff9fb12b598ce1b22e1180", description: "Subscriber since Jul 13, 2022", link: "https://discord.com/settings/premium" },
    { id: "nitro_2y", name: "Nitro (2 Years)", category: "Nitro", icon: "ec3432d0ffeb6dae4453504fb49cfd2d", description: "Subscriber since Jan 13, 2022", link: "https://discord.com/settings/premium" },
    { id: "nitro_3y", name: "Nitro (3 Years)", category: "Nitro", icon: "3bb10825eb6745145b23d577ca226d70", description: "Subscriber since Jan 13, 2021", link: "https://discord.com/settings/premium" },
    { id: "nitro_4y", name: "Nitro (4 Years)", category: "Nitro", icon: "56143c68ff83c6f1d8f1d3c054e0c3d9", description: "Subscriber since Jan 13, 2020", link: "https://discord.com/settings/premium" },
    { id: "nitro_5y", name: "Nitro (5 Years)", category: "Nitro", icon: "c0f9949ee42d3c5097aa49db96d4ec3d", description: "Subscriber since Jan 13, 2019", link: "https://discord.com/settings/premium" },
    { id: "nitro_6y", name: "Nitro (6 Years)", category: "Nitro", icon: "44d6db8e4f1a233b879ec3d03ca4d13e", description: "Subscriber since Jan 13, 2018", link: "https://discord.com/settings/premium" },

    // Server Booster Badges
    { id: "booster_1m", name: "Booster (1 Month)", category: "Booster", icon: "51040c70d4f20a921ad6674ff86fc95c", description: "Server Booster since May 13, 2024" },
    { id: "booster_2m", name: "Booster (2 Months)", category: "Booster", icon: "0e409940733a4645ef59a03233ba3576", description: "Server Booster since Mar 13, 2024" },
    { id: "booster_3m", name: "Booster (3 Months)", category: "Booster", icon: "72bed924410c304dbe3d00a6e593ff59", description: "Server Booster since Jan 13, 2024" },
    { id: "booster_6m", name: "Booster (6 Months)", category: "Booster", icon: "11c479427320b9e832d203844f2430b3", description: "Server Booster since Jul 13, 2023" },
    { id: "booster_9m", name: "Booster (9 Months)", category: "Booster", icon: "d9aa1787c95e1e19488a0b06c8c4a938", description: "Server Booster since Apr 13, 2023" },
    { id: "booster_12m", name: "Booster (12 Months)", category: "Booster", icon: "938743d8376c69818ab9d7eb38b97d19", description: "Server Booster since Jan 13, 2023" },
    { id: "booster_15m", name: "Booster (15 Months)", category: "Booster", icon: "b57cf63d395728a40dd7e2a975f9ee69", description: "Server Booster since Oct 13, 2022" },
    { id: "booster_18m", name: "Booster (18 Months)", category: "Booster", icon: "8aa46d51829e07297e201777d1a29367", description: "Server Booster since Jul 13, 2022" },
    { id: "booster_24m", name: "Booster (24 Months)", category: "Booster", icon: "37a34ae5a04bb01ea8dc735bc2cb3782", description: "Server Booster since Jan 13, 2022" }
];

export interface CollectibleItem {
    id: string;
    skuId: string;
    name: string;
    type: number;
    asset: string;
    categoryName: string;
}

export const FALLBACK_DECORATIONS: CollectibleItem[] = [
    { id: "sakura", skuId: "1144003461608280174", name: "Sakura Petals", type: 0, asset: "a_738676a60424a7bc9b6e838ff48ebf5b", categoryName: "Anime" },
    { id: "cat_ears", skuId: "1144003461608280175", name: "Kitty Ears", type: 0, asset: "a_0d7ba9182315fb38c35698b97d2e7b68", categoryName: "Cute" },
    { id: "cyberpunk", skuId: "1144003461608280176", name: "Cyberpunk Visor", type: 0, asset: "a_8a7d5df2f0d9a6c76e7323eead089ba8", categoryName: "Cyberpunk" },
    { id: "magic_portal", skuId: "1144003461608280177", name: "Magic Portal", type: 0, asset: "a_f08e4265ca598d9c57d7ee46d0a1b63e", categoryName: "Fantasy" },
    { id: "autumn_leaves", skuId: "1144003461608280178", name: "Autumn Leaves", type: 0, asset: "a_fa53f4787d559b3f3a8b4172c7a52233", categoryName: "Nature" },
    { id: "galaxy", skuId: "1144003461608280179", name: "Galaxy Orbit", type: 0, asset: "a_6e995f59048aef4627d2c3df83c92131", categoryName: "Space" }
];

export const FALLBACK_EFFECTS: CollectibleItem[] = [
    { id: "sakura_fall", skuId: "1144003461608280201", name: "Sakura Petals Fall", type: 1, asset: "e_738676a60424a7bc9b6e838ff48ebf5b", categoryName: "Anime" },
    { id: "cyber_grid", skuId: "1144003461608280202", name: "Cyber Circuit Grid", type: 1, asset: "e_8a7d5df2f0d9a6c76e7323eead089ba8", categoryName: "Cyberpunk" },
    { id: "arcane_runes", skuId: "1144003461608280203", name: "Arcane Runes", type: 1, asset: "e_f08e4265ca598d9c57d7ee46d0a1b63e", categoryName: "Fantasy" },
    { id: "cosmic_nebula", skuId: "1144003461608280204", name: "Cosmic Nebula", type: 1, asset: "e_6e995f59048aef4627d2c3df83c92131", categoryName: "Space" },
    { id: "retro_synth", skuId: "1144003461608280205", name: "Retro Synthwave", type: 1, asset: "e_fa53f4787d559b3f3a8b4172c7a52233", categoryName: "Retro" }
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
