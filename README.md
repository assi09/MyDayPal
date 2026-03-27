# MyDayPal

**Your Daily Companion** -- A premium task management desktop app built with Tauri and React.

## Features

- **Kanban Board** -- Drag-and-drop tasks between To Do, In Progress, and Done columns
- **List View** -- Compact sortable task list with expandable details and priority indicators
- **Calendar View** -- Monthly calendar with task pills, day detail panel, and month statistics
- **Roadmap View** -- Hierarchical tree graph or lane-based view with 5 smart scoring modes (Priority, Due Date, Complexity, Score, Flow)
- **Projects** -- Organize tasks by color-coded projects
- **Search and Filters** -- Filter by priority, tags, and full-text search
- **Dark / Light Theme** -- Toggle between dark and light mode
- **Notifications** -- Desktop notifications and dock badge for urgent and overdue tasks
- **Subtasks** -- Break tasks into subtasks with progress tracking
- **Task Scoring** -- Automatic scoring engine that factors priority, urgency, complexity, and subtask progress
- **Animated Splash Screen** -- WebGL shader background with animated grid on launch
- **Guided Onboarding** -- Step-by-step walkthrough for new users with sample tasks

## Screenshots

Screenshots coming soon.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19, TypeScript |
| State | Zustand with localStorage persistence |
| Drag and drop | dnd-kit |
| Dates | date-fns |
| Icons | lucide-react |
| Graphics | WebGL2 (splash screen shader) |
| Build | Vite 7 |

## Download

Pre-built installers are available on the [Releases](https://github.com/assi09/MyDayPal/releases) page:

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `.dmg` (aarch64) |
| macOS (Intel) | `.dmg` (x64) |
| Windows | `.exe` installer |
| Linux | `.deb`, `.rpm`, `.AppImage` |

**Note:** The app is not code-signed. On first launch:
- **macOS** -- Right-click the app and select "Open", or run `xattr -cr /Applications/MyDayPal.app` in the terminal
- **Windows** -- Click "More info" then "Run anyway" on the SmartScreen prompt

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri 2 prerequisites for your platform ([see Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Setup

```bash
git clone https://github.com/assi09/MyDayPal.git
cd MyDayPal
npm install
```

### Run in development

```bash
npm run tauri dev
```

### Build for production

```bash
npm run tauri build
```

The built app and installer will be in `src-tauri/target/release/bundle/`.

## License

MIT
