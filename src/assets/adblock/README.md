# Bundled ad-blocking filters

`engine.bin` is the serialized ads-and-tracking preset produced by
`@ghostery/adblocker-electron` 2.20.3. It includes EasyList, EasyPrivacy,
Peter Lowe's list, and the uBlock Origin rules and scriptlet resources selected
by Ghostery. Source lists, licenses and engine implementation:
https://github.com/ghostery/adblocker/tree/master/packages/adblocker/assets
https://github.com/ghostery/adblocker

Run `yarn adblock:update` to refresh the bundle before a release. Refresh it
whenever upgrading the Ghostery dependency, because serialization is versioned.
The app uses the bundled snapshot without contacting a filter-list server.
`preload.cjs` is the self-contained Ghostery Electron preload (MPL-2.0), copied
from `@ghostery/adblocker-electron-preload` by the same update command.
