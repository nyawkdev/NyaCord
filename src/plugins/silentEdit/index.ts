import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    allMessages: {
        type: OptionType.BOOLEAN,
        description: "Hide (edited) badge for all users, not just your own messages",
        default: false
    }
});

function onMessageUpdate(event: any) {
    if (!event.message) return;

    const currentUserId = UserStore.getCurrentUser()?.id;
    if (settings.store.allMessages || event.message.author?.id === currentUserId) {
        event.message.edited_timestamp = null;
        if (event.message.editedTimestamp) {
            event.message.editedTimestamp = null;
        }
    }
}

export default definePlugin({
    name: "SilentEdit",
    description: "Removes the (edited) indicator from messages, inspired by stealth clients",
    authors: [Devs.Megu],
    tags: ["Chat", "Utility", "Stealth"],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onMessageUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onMessageUpdate);
    }
});
