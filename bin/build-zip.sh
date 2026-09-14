#!/usr/bin/env bash
#
# Builds the distributable .zip for the WordPress.org plugin directory.
#
# Every top-level entry listed in .distignore is excluded, so the
# archive carries only runtime files. The archive's top-level folder is
# always "simple-read-more", which is what WordPress uses as the install
# directory name.
#
# Requires rsync and zip. On Windows, use bin/build-zip.ps1 instead.
#
# Usage: bash bin/build-zip.sh

set -euo pipefail

SLUG="simple-read-more"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/build"
STAGE_DIR="${BUILD_DIR}/${SLUG}"

for tool in rsync zip; do
	if ! command -v "${tool}" >/dev/null 2>&1; then
		echo "error: ${tool} is required but not installed." >&2
		echo "       On Windows, run bin/build-zip.ps1 instead." >&2
		exit 1
	fi
done

# Read the version straight out of the plugin header so the filename
# can never drift from what is actually inside the archive.
VERSION="$(grep -m1 -E '^[[:space:]]*\*[[:space:]]*Version:' "${ROOT_DIR}/${SLUG}.php" | sed -E 's/.*Version:[[:space:]]*//' | tr -d '[:space:]')"

if [ -z "${VERSION}" ]; then
	echo "error: could not read Version from ${SLUG}.php" >&2
	exit 1
fi

STABLE_TAG="$(grep -m1 -E '^Stable tag:' "${ROOT_DIR}/readme.txt" | sed -E 's/^Stable tag:[[:space:]]*//' | tr -d '[:space:]')"

if [ "${VERSION}" != "${STABLE_TAG}" ]; then
	echo "error: plugin header Version (${VERSION}) does not match readme.txt Stable tag (${STABLE_TAG})." >&2
	echo "       WordPress.org serves whatever Stable tag points at, so these must agree." >&2
	exit 1
fi

echo "Building ${SLUG} ${VERSION}"

rm -rf "${BUILD_DIR}"
mkdir -p "${STAGE_DIR}"

# Turn .distignore into rsync exclude rules. The leading slash anchors
# each rule to the top level of the transfer, which is what keeps this
# script and build-zip.ps1 in agreement about what gets dropped.
EXCLUDES=( "--exclude=/build" )
while IFS= read -r line || [ -n "${line}" ]; do
	line="${line%$'\r'}"
	case "${line}" in
		''|'#'*) continue ;;
	esac
	EXCLUDES+=( "--exclude=/${line}" )
done < "${ROOT_DIR}/.distignore"

rsync -a "${EXCLUDES[@]}" "${ROOT_DIR}/" "${STAGE_DIR}/"

# Safety net: these must never reach the directory, whatever the
# .distignore happens to say.
for forbidden in .git node_modules vendor; do
	if [ -e "${STAGE_DIR}/${forbidden}" ]; then
		echo "error: ${forbidden} leaked into the build. Check .distignore." >&2
		exit 1
	fi
done

( cd "${BUILD_DIR}" && zip -rq "${SLUG}-${VERSION}.zip" "${SLUG}" )

echo "Created build/${SLUG}-${VERSION}.zip"
unzip -l "${BUILD_DIR}/${SLUG}-${VERSION}.zip"
