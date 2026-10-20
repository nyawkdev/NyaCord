import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, RestAPI, SnowflakeUtils, UserProfileStore, UserStore } from "@webpack/common";

export interface DiscordBadgeDef {
    id: string;
    name: string;
    icon: string;
    flag?: number;
    link?: string;
}

export const DISCORD_BADGES: DiscordBadgeDef[] = [
    { id: "staff", name: "Discord Staff", icon: "5e74e9b61934fc1f67c65515d1f7e60d", flag: 1 << 0, link: "https://discord.com/company" },
    { id: "partner", name: "Partnered Server Owner", icon: "3f9748e53446a137a052f3454e2de41e", flag: 1 << 1, link: "https://discord.com/partners" },
    { id: "hypesquad", name: "HypeSquad Events", icon: "bf01d1073931f921909045f3a39fd264", flag: 1 << 2, link: "https://discord.com/hypesquad" },
    { id: "bug_hunter_level_1", name: "Bug Hunter Level 1", icon: "2717692c7dca7289b35297368a940dd0", flag: 1 << 3, link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { id: "hypesquad_house_1", name: "HypeSquad Bravery", icon: "8a88d63823d8a71cd5e390baa45efa02", flag: 1 << 6, link: "https://discord.com/settings/hypesquad-online" },
    { id: "hypesquad_house_2", name: "HypeSquad Brilliance", icon: "011940fd013da3f7fb926e4a1cd2e618", flag: 1 << 7, link: "https://discord.com/settings/hypesquad-online" },
    { id: "hypesquad_house_3", name: "HypeSquad Balance", icon: "3aa41de486fa12454c3761e8e223442e", flag: 1 << 8, link: "https://discord.com/settings/hypesquad-online" },
    { id: "early_supporter", name: "Early Supporter", icon: "7060786766c9c840eb3019e725d2b358", flag: 1 << 9, link: "https://discord.com/settings/premium" },
    { id: "bug_hunter_level_2", name: "Bug Hunter Level 2", icon: "848f79194d4be5ff5f81505cbd0ce1e6", flag: 1 << 14, link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { id: "verified_developer", name: "Early Verified Bot Developer", icon: "6df5892e0f35b051f8b61eace34f4967", flag: 1 << 17 },
    { id: "certified_moderator", name: "Moderator Programs Alumni", icon: "fee1624003e2fee35cb398e125dc479b", flag: 1 << 18, link: "https://discord.com/safety" },
    { id: "active_developer", name: "Active Developer", icon: "6bdc42827a38498929a4920da12695d9", flag: 1 << 22, link: "https://support-dev.discord.com/hc/en-us/articles/10113997751447" },
    { id: "premium", name: "Nitro Subscriber", icon: "2ba85e8026a8614b640c2837bcdfe21b", link: "https://discord.com/settings/premium" },
    { id: "quest_completed", name: "Completed a Quest", icon: "7d9ae358c8c5e118768335d387b463a8" }
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

let loadedCollectibles: CollectibleItem[] = [];

export async function fetchDiscordCollectibles(): Promise<CollectibleItem[]> {
    if (loadedCollectibles.length > 0) return loadedCollectibles;
    try {
        const res = await RestAPI.get({ url: "/collectibles-categories?include_bundles=true" });
        const categories = res.body ?? [];
        const items: CollectibleItem[] = [];

        for (const cat of categories) {
            for (const prod of cat.products ?? []) {
                for (const item of prod.items ?? []) {
                    if (item.asset) {
                        items.push({
                            id: item.id || prod.sku_id,
                            skuId: item.sku_id || prod.sku_id,
                            name: prod.name || item.name || "Decoration",
                            type: item.type ?? 0,
                            asset: item.asset,
                            categoryName: cat.name || "General"
                        });
                    }
                }
            }
        }

        if (items.length > 0) {
            loadedCollectibles = items;
            return items;
        }
    } catch {
    }

    loadedCollectibles = FALLBACK_DECORATIONS;
    return loadedCollectibles;
}

export const settings = definePluginSettings({
    customDisplayName: {
        type: OptionType.STRING,
        description: "Local display name (nickname) visible to you",
        default: ""
    },
    customUsername: {
        type: OptionType.STRING,
        description: "Local username handle visible to you",
        default: ""
    },
    customCreatedAt: {
        type: OptionType.STRING,
        description: "Local account creation date (YYYY-MM-DD)",
        default: ""
    },
    customBadges: {
        type: OptionType.STRING,
        description: "Comma-separated list of local badge IDs to display",
        default: "staff,early_supporter,verified_developer"
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
    }
});

let originalExtractTimestamp: any = null;
let originalGetUserProfile: any = null;

export function applyToCurrentUser() {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    if (settings.store.customDisplayName) {
        me.globalName = settings.store.customDisplayName;
    }
    if (settings.store.customUsername) {
        me.username = settings.store.customUsername;
    }

    if (settings.store.customDecorationAsset) {
        const deco = {
            asset: settings.store.customDecorationAsset,
            skuId: settings.store.customDecorationSkuId || "1144003461608280174"
        };
        (me as any).avatarDecorationData = deco;
        (me as any).avatarDecoration = deco;
    }

    const badgeIds = settings.store.customBadges
        ? settings.store.customBadges.split(",").map(b => b.trim()).filter(Boolean)
        : [];

    let combinedFlags = me.flags || 0;
    for (const badgeId of badgeIds) {
        const def = DISCORD_BADGES.find(b => b.id === badgeId);
        if (def?.flag) {
            combinedFlags |= def.flag;
        }
    }
    me.flags = combinedFlags;
    me.publicFlags = combinedFlags;

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
            if (me && id === me.id && settings.store.customCreatedAt) {
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
                const badgeIds = settings.store.customBadges
                    ? settings.store.customBadges.split(",").map(b => b.trim()).filter(Boolean)
                    : [];

                if (badgeIds.length > 0) {
                    const extraBadges = badgeIds.map(bid => {
                        const def = DISCORD_BADGES.find(b => b.id === bid);
                        if (!def) return null;
                        return {
                            id: def.id,
                            description: def.name,
                            icon: def.icon,
                            link: def.link
                        };
                    }).filter(Boolean);

                    const existing = (profile.badges || []).filter((b: any) => !badgeIds.includes(b.id));
                    profile.badges = [...extraBadges, ...existing];
                }

                if (settings.store.customDecorationAsset) {
                    profile.avatarDecoration = {
                        asset: settings.store.customDecorationAsset,
                        skuId: settings.store.customDecorationSkuId || "1144003461608280174"
                    };
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
