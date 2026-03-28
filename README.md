redirection page https://hardevv.github.io/obsidian-notifier?deeplink=

Obsidian plugin saves local time without any timezone indicator. `2026-03-21T16:30`
This Backend stores it as `new Data()` then it stores it as UTC in `data.json` -> `.toISOString()`

---

Multiple vault support:
you have to store all of your vaults in a single location.
For example `Documents/Obsidian` you can store there multiple vaults
In app configuration you have to specify names of vaults you want to support
Obsidian CLI is not headless so it will open all of your selected vaults

---

## Features

- ### Plugin [TODO: plugin URL]
  - Inline actions that can be turned on/off in settings
  - A single command to set/edit reminders
  - Beautiful rendering of reminders. The plugin detects reminder text and renders it as a polished component
    - The component has a trash button to delete the reminder
    - When you click the date/time of the reminder, you enter edit mode
  - The plugin automatically handles reminder IDs, so ID collisions are less likely
  - Custom time format: AM/PM or 24h
  - Start week from - you can choose whether Monday or Sunday is shown as the first day of the week in the date picker
  - Safety cleanup - if anything weird happens to your reminders, you can remove all of them from your vault, and they will also be removed from the reminder app
- ### APP
  - Reminders cache - the app caches your reminders so it can handle reminders even when you're not using Obsidian
  - Reminders are sent to your Discord channel via webhook, which is easy to set up
  - It handles multiple vaults. The only condition is that you keep them in a single directory
  - Privacy settings
    - reminder content toggle - you can choose whether to send your reminder text to your Discord channel
    - Obsidian link toggle - you can choose whether to send a link to your reminder
