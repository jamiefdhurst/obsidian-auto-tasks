# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-01-13

### Added

- feat: support sub-tasks at multiple levels (38e78ef)
- (e902cbc)

### Other

- chore: add more tests for task changes (8144bc2)

## [0.5.0] - 2026-01-06

### Added

- feat: add loaded event (fde5ed3)
- (f32efda)

### Other

- chore: update deps and workflows to match periodic-notes (3fb2701)
- chore: fix issue with task factory checking dataview status before tasks plugin loaded (cbf23d8)
- (3ef75c7)
- chore: ensure build also releases styles file (7d3fb43)
- chore: fix release notes in build step (6a2e55c)
- [skip ci] Update version to v0.5.0 (5c008ef)

## [0.4.1] - 2025-08-21

### Changed

- Update periodic-notes-provider to extend ts (f0d3341)
- (7b90ab4)

### Other

- [skip ci] Update version to v0.4.1 (53a3f35)

## [0.4.0] - 2025-08-18

### Added

- Add archive for kanban board and auto-archive support (0d6f027)
- (784e937)

### Other

- [skip ci] Update version to v0.4.0 (3b5e814)

## [0.3.0] - 2025-07-30

### Added

- Add Dataview support and split out dataview/emoji tasks (1f03f29)

### Other

- (af513f4)
- [skip ci] Update version to v0.3.0 (7811a72)

## [0.2.1] - 2025-07-23

### Changed

- Update notes provider with fixed version (0a22dfc)
- (d085d7a)

### Other

- [skip ci] Update version to v0.2.1 (8a73ea2)

## [0.2.0] - 2025-07-14

### Changed

- Update to use obsidian-periodic-notes-provider (335a3d6)
- (bf16676)

### Other

- [skip ci] Update version to v0.2.0 (db1d680)

## [0.1.6] - 2025-02-16

### Other

- Ability to ignore task names with regex matches (d7b099b)
- (5ec6157)
- [skip ci] Update version to v0.1.6 (2fe47d1)

## [0.1.5] - 2025-02-12

### Other

- Remove commented out old find/replace in build (bc93d84)
- Carried over tasks can have a prefix (4f76896)
- (083fc6e)
- [skip ci] Update version to v0.1.5 (c98b629)

## [0.1.4] - 2025-02-10

### Other

- Ignore package-lock, too dangerous (3987f7f)
- [skip ci] Update version to v0.1.4 (75193ea)

## [0.1.3] - 2025-02-10

### Other

- Attempt a better package replacement script for build (b901a93)
- [skip ci] Update version to v0.1.3 (32a88dd)

## [0.1.2] - 2025-02-10

### Other

- Ensure package and package-lock are updated together (d274488)
- Bump esbuild from 0.23.1 to 0.25.0 (5902a66)
- (c2796e4)
- [skip ci] Update version to v0.1.2 (661c80d)
- Ensure package and package-lock are updated together (2b8ec50)
- Trigger a new build (bad297b)
- [skip ci] Update version to v0.1.2 (4d0bd90)
- Trigger a new build (b1095e8)
- [skip ci] Update version to v0.1.2 (507de2d)
- Trigger a new build (f50e098)
- [skip ci] Update version to v0.1.2 (9d1a814)

## [0.1.1] - 2025-02-10

### Other

- Use existing header in daily/weekly template if present (1dc5cdf)
- (4174f40)
- [skip ci] Update version to v0.1.1 (3e58bc4)

## [0.1.0] - 2025-02-09

### Fixed

- Fix tests to use latest upload-artifact (203acfd)

### Other

- WIP: Settings for ignored folders (80f0ea5)
- Folders ignored when synchronising Kanban tasks (e3a6111)
- (a4b0779)
- [skip ci] Update version to v0.1.0 (ff053ae)

## [0.0.6] - 2025-01-26

### Added

- Add file suggest for kanban board, stop trying to resolve it (ad9ea21)
- (be664f9)

### Other

- npm audit (c5749c2)
- [skip ci] Update version to v0.0.6 (f7d2d69)

## [0.0.5] - 2025-01-25

### Changed

- Update code coverage action (3feff41)
- Update thresholds to be representative (680db84)

### Other

- Reset date in note classes to ensure it is always a current date/time (1ff033e)
- Only run testing workflow on PR (6321736)
- (9860f0e)
- [skip ci] Update version to v0.0.5 (31c6508)

## [0.0.4] - 2024-11-15

### Changed

- Updated code based on release feedback (136443f)
- (59936ac)

### Other

- [skip ci] Update version to v0.0.4 (2f558ed)

## [0.0.3] - 2024-11-13

### Fixed

- Fix issue with manifest and version generation (71f03f7)

### Other

- [skip ci] Update version to v0.0.3 (b35e89a)

## [0.0.2] - 2024-11-04

### Other

- Make repo public (9a06a9d)
- Close initial milestone now development is complete (21a4968)
- Remove tests that require TFile casts, and protect the synchroniser process call (710ebe1)
- (c53c5f7)
- [skip ci] Update version to v0.0.2 (093ab8a)

## [0.0.1] - 2024-11-03

### Added

- Add initial settings page (35b899f)
- (20e37e7)
- Add carry-over support for daily and weekly tasks (38d0684)
- (8464b8e)
- Add heading settings (7c1770d)
- Add due TODO logic, without setting (54e2b69)
- Added due tasks from other locations, removed set due date (4fb4157)
- Add notes tests (9ddc845)
- Add plugin tests (927db9e)
- Adding settings basic logic tests, no onchange (fbb4b21)
- Add build workflow (b31961d)

### Changed

- Refactored and simplified the kanban and task areas (3aa4cea)
- Switch previous note to search baackwards until it finds one (a0f3162)
- Switching threshold to 80% for best endeavours (6c92930)
- Updated README to show full feature set and settings (b39894c)
- Tidy up imports (d2978b4)

### Other

- Initial commit with dummy app (23a2b8f)
- Open the milestone (6febd6c)
- Simplify by removing svelte and using Obsidian settings API (e217638)
- (2d23392)
- Carry over filtering on heading working (165438e)
- (f2c5a6a)
- Very basic kanban support (88eea82)
- (e107c38)
- (75dca98)
- Tasks plugin now optional and due functionality working as expected (dc6a365)
- (000a091)
- Board manager tests (1519606)
- Kanban tests complete (dc4cc9a)
- Finishing tests for now with tasks (c670dce)

### Testing

- (18c5ff3)
