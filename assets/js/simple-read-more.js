/**
 * Simple Read More — front-end behaviour.
 *
 * Finds every marker on the page and, for each one, turns every
 * element that follows it into its own self-collapsing unit, without
 * ever moving that element out of its original parent. See the
 * ARCHITECTURE NOTE in includes/class-simple-read-more-assets.php for
 * the full reasoning behind that constraint.
 *
 * Each toggle is a real <a href="#"> so it automatically picks up
 * whatever hyperlink styling the theme or page builder already
 * defines, with role="button" added since it triggers an in-page
 * action rather than navigating anywhere, and the default click
 * behavior (jumping to the top of the page) is prevented. Native <a>
 * elements only fire a click from the Enter key, not Space, so a small
 * keydown handler mirrors native <button> behavior for the Space key.
 *
 * Collapsed sections also get the `inert` attribute, which stops
 * keyboard focus and screen readers from reaching links, buttons, or
 * form fields hidden inside them while closed. Without it, a keyboard
 * user could Tab into content that is invisible on screen, which is
 * confusing and inaccessible. `inert` is supported in all current
 * evergreen browsers.
 *
 * Vanilla JS only, wrapped in an IIFE so nothing leaks into the
 * global namespace. Uses only current, non-deprecated DOM APIs.
 *
 * @package SimpleReadMore
 */

( function () {
	'use strict';

	// Labels are printed just above this file by PHP so the plugin's
	// label constants stay the single source of truth. The fallbacks
	// keep the script working on its own if that inline block is ever
	// stripped by an aggressive optimisation plugin.
	var config = window.simpleReadMoreConfig || {};
	var SRM_LABEL_MORE = config.labelMore || 'Read More';
	var SRM_LABEL_LESS = config.labelLess || 'Read Less';

	// Incremented per instance so ids stay unique even with several
	// [readmore] sections on the same page.
	var srmInstanceCount = 0;

	// Tags whose direct children must not be relocated: li/tr need to
	// stay direct children of ul/ol/table to render bullets, numbering,
	// and table layout correctly.
	var SRM_STRUCTURAL_TAGS = [ 'UL', 'OL', 'TABLE' ];

	function srmInit() {
		var markers = document.querySelectorAll( '.srm-marker' );
		if ( ! markers.length ) {
			return;
		}
		// Convert to a static array up front. Once we start moving
		// nodes around, a live NodeList could change under us.
		Array.prototype.slice.call( markers ).forEach( srmSetupMarker );
	}

	function srmSetupMarker( marker ) {
		if ( marker.dataset.srmDone === '1' ) {
			return;
		}
		marker.dataset.srmDone = '1';

		var anchorEl = marker.parentElement; // e.g. the <p> containing the marker
		if ( ! anchorEl || ! anchorEl.parentElement ) {
			return;
		}
		var containerEl = anchorEl.parentElement; // the shared parent we work within

		// If the marker sits in the middle of a paragraph (or heading,
		// list item, etc.) rather than alone on its own line, split
		// that element into two at the marker: the original element
		// keeps everything before the marker completely untouched, a
		// new twin element, same tag and same class/style attributes,
		// takes everything after it. Because the twin has the exact
		// same tag and attributes and sits as a proper sibling in the
		// same container, it inherits identical CSS to the original,
		// whether that CSS targets it by class or by its position in
		// the page; no styling is copied or guessed, only the real
		// attributes that were already there.
		var trailingInlineNodes = [];
		var node = marker.nextSibling;
		while ( node ) {
			trailingInlineNodes.push( node );
			node = node.nextSibling;
		}
		marker.remove();

		var hostSourceEls = [];

		if ( trailingInlineNodes.length ) {
			var splitEl = document.createElement( anchorEl.tagName );
			Array.prototype.forEach.call( anchorEl.attributes, function ( attr ) {
				// "id" is skipped: an element already on the page owns
				// that id, duplicating it would create two elements
				// sharing one id, which is invalid and can confuse any
				// other script or CSS on the page that relies on it.
				if ( attr.name !== 'id' ) {
					splitEl.setAttribute( attr.name, attr.value );
				}
			} );
			trailingInlineNodes.forEach( function ( n ) {
				splitEl.appendChild( n );
			} );
			containerEl.insertBefore( splitEl, anchorEl.nextSibling );
			hostSourceEls.push( splitEl );
		}

		// If nothing is left in the anchor element (the documented,
		// simplest usage: [readmore] alone on its own line), hide it
		// entirely rather than leave a blank element (which would
		// otherwise still show its own margin as empty space).
		if ( ! anchorEl.childNodes.length ) {
			anchorEl.classList.add( 'srm-anchor-empty' );
		}

		// Anything that already followed the anchor element (or, if a
		// twin element was just split off above, anything that follows
		// THAT) also becomes hidden content. Collected up front, before
		// any further DOM changes, so this traversal can never be
		// thrown off by mutations made later in this same setup.
		var afterEl = hostSourceEls.length ? hostSourceEls[ hostSourceEls.length - 1 ] : anchorEl;
		var sib = afterEl.nextElementSibling;
		while ( sib ) {
			hostSourceEls.push( sib );
			sib = sib.nextElementSibling;
		}

		if ( ! hostSourceEls.length ) {
			// Nothing to hide, so no toggle is added at all.
			return;
		}

		srmInstanceCount += 1;
		var idBase = 'srm-collapse-' + srmInstanceCount;

		var hostEls = hostSourceEls.map( function ( rawEl, i ) {
			return srmConvertToHost( rawEl, idBase + '-' + i );
		} );

		var collapseIds = hostEls.map( function ( h ) {
			return h.id;
		} ).join( ' ' );

		var linkMoreEl = srmBuildToggle( 'srm-toggle-more', SRM_LABEL_MORE, collapseIds );
		var linkLessEl = srmBuildToggle( 'srm-toggle-less', SRM_LABEL_LESS, collapseIds );
		linkLessEl.hidden = true;

		var lastHostEl = hostEls[ hostEls.length - 1 ];

		// "Read More" goes right after the anchor paragraph. "Read
		// Less" goes right after the LAST hidden element, as a new
		// sibling following a real block element; this is what
		// guarantees it always starts on its own line.
		containerEl.insertBefore( linkMoreEl, anchorEl.nextSibling );
		if ( lastHostEl.nextSibling ) {
			containerEl.insertBefore( linkLessEl, lastHostEl.nextSibling );
		} else {
			containerEl.appendChild( linkLessEl );
		}

		var isOpenState = false;

		function srmToggle( event ) {
			// Prevent the "#" href from jumping the page to the top.
			event.preventDefault();
			isOpenState = ! isOpenState;
			hostEls.forEach( function ( hostEl ) {
				hostEl.classList.toggle( 'srm-is-open', isOpenState );
				hostEl.toggleAttribute( 'inert', ! isOpenState );
			} );
			linkMoreEl.setAttribute( 'aria-expanded', isOpenState ? 'true' : 'false' );
			linkLessEl.setAttribute( 'aria-expanded', isOpenState ? 'true' : 'false' );
			linkMoreEl.hidden = isOpenState;
			linkLessEl.hidden = ! isOpenState;
		}

		// Native <a> elements only fire "click" from the Enter key.
		// This mirrors native <button> behavior so Space also works.
		function srmHandleKeydown( event ) {
			if ( event.key === ' ' || event.key === 'Spacebar' || event.keyCode === 32 ) {
				event.preventDefault();
				event.target.click();
			}
		}

		linkMoreEl.addEventListener( 'click', srmToggle );
		linkLessEl.addEventListener( 'click', srmToggle );
		linkMoreEl.addEventListener( 'keydown', srmHandleKeydown );
		linkLessEl.addEventListener( 'keydown', srmHandleKeydown );
	}

	// Turns an existing element into a self-collapsing unit. In the
	// normal case (a paragraph, heading, div, etc.) its own children
	// are moved into one inner wrapper nested INSIDE itself, and the
	// element keeps its original tag, classes, id, and position, so
	// any CSS already targeting it keeps working exactly as before.
	//
	// For list/table elements, or elements with no children to move,
	// a small wrapper div is placed around the element instead; the
	// element itself still never leaves its original position in the
	// page, it is simply nested one level deeper.
	function srmConvertToHost( hostEl, id ) {
		var targetEl = hostEl;
		var needsOutsideWrap =
			SRM_STRUCTURAL_TAGS.indexOf( hostEl.tagName ) !== -1 || ! hostEl.firstChild;

		if ( needsOutsideWrap ) {
			targetEl = document.createElement( 'div' );
			hostEl.parentElement.insertBefore( targetEl, hostEl );

			var outerInnerEl = document.createElement( 'div' );
			outerInnerEl.className = 'srm-hide-el-inner';
			outerInnerEl.appendChild( hostEl );
			targetEl.appendChild( outerInnerEl );
		} else {
			var innerEl = document.createElement( 'span' );
			innerEl.className = 'srm-hide-el-inner';
			while ( hostEl.firstChild ) {
				innerEl.appendChild( hostEl.firstChild );
			}
			hostEl.appendChild( innerEl );
		}

		if ( ! targetEl.id ) {
			targetEl.id = id;
		}
		targetEl.classList.add( 'srm-hide-el' );
		targetEl.setAttribute( 'inert', '' ); // starts collapsed

		return targetEl;
	}

	function srmBuildToggle( extraClass, label, collapseIds ) {
		var linkEl = document.createElement( 'a' );
		linkEl.href = '#';
		linkEl.setAttribute( 'role', 'button' );
		linkEl.className = 'srm-toggle ' + extraClass;
		linkEl.textContent = label;
		linkEl.setAttribute( 'aria-expanded', 'false' );
		linkEl.setAttribute( 'aria-controls', collapseIds );
		return linkEl;
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', srmInit );
	} else {
		srmInit();
	}
}() );
