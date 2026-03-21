obsidian files ext=md
obsidian search:context query="/\[reminder::/"
obsidian vault info=path

redirection page https://hardevv.github.io/obsidian-notifier?deeplink=

Obsidian plugin saves local time without any timezone indicator. `2026-03-21T16:30`
This Backend stores it as `new Data()` then it stores it as UTC in `data.json` -> `.toISOString()`
