#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

arch=${1:-$(node -p 'process.arch')}
case "$arch" in
  x64) flatpak_arch=x86_64 ;;
  arm64) flatpak_arch=aarch64 ;;
  *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
esac
app_id=io.github.kosziPL.scstym
runtime_version=25.08
version=$(node -p "require('./package.json').version")
product_name=$(node -p "require('./package.json').productName")
app_dir="out/${product_name}-linux-${arch}"
test -x "$app_dir/youtube-music-desktop-app"
mkdir -p out/make/flatpak
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
build_dir="$work_dir/app"

# Install the runtime, SDK and Electron base first; see README for the commands.
flatpak build-init --arch="$flatpak_arch" \
  --base=org.electronjs.Electron2.BaseApp --base-version="$runtime_version" \
  "$build_dir" "$app_id" org.freedesktop.Sdk org.freedesktop.Platform "$runtime_version"
cp -a "$app_dir" "$build_dir/files/scstym"
install -Dm755 flatpak/scstym "$build_dir/files/bin/scstym"
install -Dm644 "flatpak/$app_id.desktop" "$build_dir/files/share/applications/$app_id.desktop"
install -Dm644 src/assets/icons/ytmd.png "$build_dir/files/share/icons/hicolor/512x512/apps/$app_id.png"
install -Dm644 "flatpak/$app_id.metainfo.xml" "$build_dir/files/share/metainfo/$app_id.metainfo.xml"
flatpak build-finish --command=scstym \
  --share=ipc --share=network --socket=wayland --socket=fallback-x11 \
  --socket=pulseaudio --device=dri \
  --talk-name=org.freedesktop.Notifications \
  --talk-name=org.freedesktop.secrets \
  --talk-name=org.kde.StatusNotifierWatcher \
  "$build_dir"
flatpak build-export --arch="$flatpak_arch" "$work_dir/repo" "$build_dir" stable
flatpak build-bundle --arch="$flatpak_arch" \
  --runtime-repo=https://dl.flathub.org/repo/flathub.flatpakrepo \
  "$work_dir/repo" "out/make/flatpak/scstym-${version}-linux-${arch}.flatpak" "$app_id" stable
