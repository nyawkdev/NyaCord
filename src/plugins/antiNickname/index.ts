import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Constants, FluxDispatcher, RestAPI, showToast, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    preferredNick: {
        type: OptionType.STRING,
        description: "Your default nickname to enforce across servers when changed",
        default: ""
    },
    autoRevert: {
        type: OptionType.BOOLEAN,
        description: "Automatically revert nickname if changed by a server moderator",
        default: true
    }
});

const lastNickMap = new Map<string, string>();

async function onMemberUpdate(event: { guildId: string; user: { id: string }; nick?: string }) {
    if (!settings.store.autoRevert) return;

    const me = UserStore.getCurrentUser();
    if (!me || event.user.id !== me.id) return;

    const expectedNick = settings.store.preferredNick || lastNickMap.get(event.guildId);
    if (!expectedNick) {
        if (event.nick) lastNickMap.set(event.guildId, event.nick);
        return;
    }

    if (event.nick !== expectedNick) {
        try {
            await RestAPI.patch({
                url: Constants.Endpoints.GUILD_MEMBER(event.guildId, "@me"),
                body: { nick: expectedNick }
            });
            showToast({ text: "AntiNickname: Reverted forced nickname change" });
        } catch {
        }
    }
}

export default definePlugin({
    name: "AntiNickname",
    description: "Automatically restores your nickname if a moderator resets or changes it",
    authors: [Devs.Megu],
    tags: ["Utility", "Privacy"],
    settings,

    start() {
        FluxDispatcher.subscribe("GUILD_MEMBER_UPDATE", onMemberUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("GUILD_MEMBER_UPDATE", onMemberUpdate);
    }
});
