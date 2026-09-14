# Changelog

All notable changes to Simple Read More are documented here. The
user-facing copy lives in the `== Changelog ==` section of
[`readme.txt`](readme.txt), which is what WordPress.org renders; keep
the two in sync when releasing.

This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0]

Initial release.

### Features

- `[readmore]` shortcode that splits content into a visible part and a
  collapsible part, plus an equivalent `srm-marker` span for widgets
  that do not process shortcodes.
- "Read Less" is placed at the end of the revealed content rather than
  back where "Read More" was, so the collapse control sits where the
  reader's eyes land.
- Elements collapse **in place**, never relocated out of their original
  parent, so theme and page-builder CSS that targets them by position
  keeps matching. Lists and tables are wrapped from the outside so their
  children stay direct children.
- A marker placed mid-paragraph splits that paragraph in two, with the
  twin element inheriting the original's attributes but not its id.
- Accessibility: real link elements with `role="button"`, synced
  `aria-expanded` / `aria-controls`, Enter and Space both activate, and
  `inert` on collapsed sections so keyboard users cannot Tab into hidden
  content. The animation is skipped under `prefers-reduced-motion`.
- Labels are changeable via the `simple_read_more_labels` filter or the
  `SIMPLE_READ_MORE_LABEL_MORE` / `SIMPLE_READ_MORE_LABEL_LESS`
  constants.
- `simple_read_more_enqueue_assets` filter for skipping the CSS and JS.
- Translation-ready, with a `.pot` under `languages/`.
- Stores nothing: no options, tables, post meta, cron events, or
  transients, and no external requests.
