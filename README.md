<p align="center">
  <img src="./assets/banner.png" alt="NyaCord Banner" width="100%">
</p>

# [<img src="./assets/logo.png" width="36" align="left" alt="NyaCord">](https://github.com/nyawkdev/NyaCord) NyaCord

[🇷🇺 Читать на русском языке](README.ru.md)

[![Build and Release](https://github.com/nyawkdev/NyaCord/actions/workflows/build.yml/badge.svg)](https://github.com/nyawkdev/NyaCord/actions/workflows/build.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

NyaCord is a fast, clean, and customizable Discord client modification based on **Equicord** and **Vencord**, featuring over 300+ built-in plugins, runtime user plugin loading, and the **NyaCord Secret** suite.

---

## ✨ Features

- **300+ Built-in Plugins:** Everything from themes, custom CSS, rich presence, utility shortcuts, to audio tweaks.
- **Runtime UserPlugins:** Drop any custom `.js`, `.ts`, or `.tsx` plugin directly into `%AppData%\NyaCord\userplugins` without needing to recompile the client.
- **Local Profile Cosmetics (Nightcord Visuals):** Freely customize your profile locally with real Discord badges, live-loaded shop avatar decorations, custom display name, username handle, and account creation date.
- **NyaCord Secret Suite:** Built-in stealth & power features inspired by underground clients, engineered cleanly with zero tracking or telemetry:
  - **SilentTyping:** Type invisibly without sending typing indicator events.
  - **SilentEdit:** Edit messages without the `(edited)` tag.
  - **Anti-Delete (MessageLogger):** Keep deleted and edited messages visible in chat with complete modification history.
  - **ShowHiddenChannels:** View locked channels, channel topics, and required role permissions.
  - **VolumeBooster:** Boost user volume sliders up to 500%.
  - **AudioLimiter:** Protect ears from sudden loud screams and ear-rape audio.
  - **SpotifyCrack:** Listen along without Spotify Premium and disable the 30-second call auto-pause.
  - **UnlimitedAccounts:** Switch between unlimited accounts in the Discord account switcher.
  - **AntiNickname:** Automatically restore your nickname if server moderators change or reset it.
- **⚡ OpenAsar Compatibility:** Instant one-click installation of OpenAsar for lower memory footprint and snappy performance.
- **🚫 Zero Telemetry & No Cloud Dependency:** Pure offline security, local settings backup & restore, no tracking.

---

## 🚀 Installation

### Automated Installers (Windows)

Download the latest release from the [Releases](https://github.com/nyawkdev/NyaCord/releases) page:
- **GUI Installer:** Run `NyaCordInstaller.exe` for a clean, minimalist graphical setup.
- **CLI Installer:** Run `NyaCordInstallerCli.exe` for terminal / headless installation.

---

## 🛠️ Building from Source

### Prerequisites
- [Node.js LTS (v20+)](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Git](https://git-scm.com/)

```shell
# 1. Clone the repository
git clone https://github.com/nyawkdev/NyaCord.git
cd NyaCord

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Build NyaCord
pnpm build

# 4. Run installer or dev patch
./dist/install-gui.bat
```

For browser extension builds:
```shell
pnpm buildWeb
```

---

## 📜 Credits

NyaCord is built upon the incredible work of the open-source community:
- [Equicord](https://github.com/Equicord/Equicord) — for extensive plugin libraries and modifications.
- [Vencord](https://github.com/Vendicated/Vencord) — by [Vendicated](https://github.com/Vendicated) and contributors for the original mod framework.
- [OpenAsar](https://openasar.dev) — by [Goose](https://github.com/GooseMod) for the optimized Discord desktop core.

---

## 📄 License

NyaCord is licensed under the [GNU General Public License v3.0](LICENSE).
