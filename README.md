redirection page https://hardevv.github.io/obsidian-notifier?deeplink=

Obsidian plugin saves local time without any timezone indicator. `2026-03-21T16:30`
This Backend stores it as `new Data()` then it stores it as UTC in `data.json` -> `.toISOString()`

---

Multiple vault support:
you have to store all of your vaults in a single location.
For example `Documents/Obsidian` you can store there multiple vaults
In app configuration you have to specify names of vaults you want to support
Obsidian CLI is not headless so it will open all of your selected vaults
