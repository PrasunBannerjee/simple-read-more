# Security Policy

## Supported versions

Security fixes go into the latest release only. Older versions are not
patched; update to the current release to get a fix.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub instead: open the
[Security tab](https://github.com/PrasunBannerjee/simple-read-more/security)
of this repository and choose **Report a vulnerability**. Only the
maintainer can see the report.

Include what you can of:

- the plugin version, WordPress version, and PHP version,
- the steps or the markup needed to reproduce it,
- what an attacker could do with it.

You will get a reply once the report has been read. If the problem is
confirmed, a fix is released and then the issue is disclosed, with
credit to you unless you prefer otherwise.

## Scope

The plugin is deliberately small, which keeps its attack surface small:
it has no settings screen, reads no request data, writes nothing to the
database, makes no external requests, and outputs only a fixed marker
`<span>` plus its own CSS and JavaScript. Reports about any of that
code are in scope.

`bin/serve-tests.js` and everything under `tests/` are local development
tools that never ship in the plugin zip. Problems there are still worth
reporting, but they do not affect sites running the plugin.
