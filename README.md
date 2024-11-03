# Automatic Tasks for Obsidian

Combine periodic notes with tags and tasks to automatically manage your daily, weekly and project TODO lists.

Designed to work with [Obsidian](https://obsidian.md), requires the [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) plugin. The [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) and [Kanban](https://github.com/mgmeyers/obsidian-kanban) plugins are optional.

This plugin works well with the [Auto Periodic Notes](https://github.com/jamiefdhurst/obsidian-auto-periodic-notes) plugin.

## Features

- Reads tasks from previous periodic notes and carries over any incomplete ones
- Adds the header for tasks when creating the note
- Searches all or specific headers within the periodic note so you can separate a daily list from other areas
- Adds a due date to copied tasks so they can be appropriately tracked in the Tasks plugin
- Collects tasks from the whole vault and adds them to a central Kanban board automatically

### Carrying over your tasks

![Example of tasks in a daily note within Obsidian](/docs/tasks.png)

For daily and weekly notes, if you maintain a task list within your periodic notes, any incomplete tasks will be automatically copied over to the next day or week's note, so you can easily track and maintain your current TODO list.

The new header for tasks will be added to the end of the new note, with any tasks added under that header.

YTou can specify in the settings whether to search through the whole note for all tasks, or to restrict your search to specific headers (e.g. `## TODOs` in the example above).

### Due date support

When copying over tasks, you can choose to add a due date automatically onto the task, which will be preserved when tasks are copied, showing the original date that it was added.

### Kanban support

![Example of tasks shown in a Kanban board within Obsidian](/docs/kanban.png)

All the tasks within the periodic notes and elsewhere in the vault can be collated and centralised into a Kanban board, where they are synced automatically and isolated by task name.

## Settings

![Example of Settings screen within Obsidian](/docs/settings.png)

Depending on your Periodic Notes configuration, the plugin supports working with both daily and weekly notes - these must be enabled in the Periodic Notes plugin to appear. For each type of note you can choose to carry over your daily tasks, whether to automatically add any tasks from anywhere in your vault that are due either that day or week, and how to read the tasks from your existing periodic note.

When the Kanban plugin is available, you can choose to sync all of the tasks within your vault automatically to a board, which will be created for you.

## Development

This plugin has been developed using Typescript with the Obsidian and Periodic Notes APIs, and Jest for testing.

Once you've cloned the repository, to speed up plugin development it is recommended to symlink the location of the plugin directly into your local Obsidian:

```bash
ln -s obsidian-auto-tasks ~/.obsidian/plugins/
```

You can then run the plugin build automatically to pick up any changes:

```bash
npm run dev
```

To test the plugin using Jest, you can run it with or without coverage:

```bash
npm run test
npm run coverage
```

When submitting a PR, the plugin will be automatically tested, and when merged into main this will be built and released using GitHub Actions.

## Thanks

Many thanks to [Liam Cain](https://liamca.in/hello) for the Periodic Notes plugin, and to [Clare Macrae](https://github.com/claremacrae) and the [Obsidian Tasks Group](https://github.com/obsidian-tasks-group) for their Tasks plugin!
