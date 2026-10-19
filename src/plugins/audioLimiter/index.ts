import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";

const settings = definePluginSettings({
    threshold: {
        description: "Compression Threshold (dB) - Level above which audio is suppressed",
        type: OptionType.SLIDER,
        markers: makeRange(-36, -6, 6),
        default: -18,
        stickToMarkers: true
    },
    ratio: {
        description: "Limiter Ratio - Compression intensity for loud audio spikes",
        type: OptionType.SLIDER,
        markers: makeRange(4, 20, 2),
        default: 12,
        stickToMarkers: true
    }
});

export default definePlugin({
    name: "AudioLimiter",
    description: "Ear protection limiter to prevent deafening audio spikes and loud noises",
    authors: [Devs.Megu],
    tags: ["Voice", "Utility", "Safety"],
    settings
});
