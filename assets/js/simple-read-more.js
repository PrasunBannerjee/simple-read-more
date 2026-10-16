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
 * Because the link that was just activated hides itself, focus is
 * moved on every toggle: to the start of the revealed text on open,
 * and back to "Read More" on close. Otherwise a keyboard user would be
 * sent back to the top of the page each time.
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

	// Paragraph-like elements: a marker inside one of these splits that
	// element in two. A marker directly inside anything else that is
	// block-level (a div, a page-builder widget, a table cell) stays
	// inside it; see srmSetupMarker().
	var SRM_TEXT_BLOCK_TAGS = [ 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'DT', 'DD', 'PRE', 'ADDRESS', 'FIGCAPTION' ];

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

		var parentEl = marker.parentElement;
		if ( ! parentEl || ! parentEl.parentElement ) {
			return;
		}

		// Usually the marker sits inside a paragraph (or heading, list
		// item, etc.). That element is split at the marker and the
		// paragraphs after it are hidden, all within the paragraph's
		// own parent.
		//
		// Sometimes, though, the marker sits directly inside a
		// structural box instead: a Custom HTML block puts it straight
		// into the post content container, and a page builder's text
		// widget can hold bare text with no paragraph around it at all.
		// Treating that box as "the paragraph" would split the box
		// itself, duplicating it, and hide whatever follows it, such as
		// a button widget in the same page-builder container. So in that
		// case nothing outside the box is touched: the marker itself is
		// the split point, and everything after it inside the box is
		// collapsed where it stands.
		var isInBox = SRM_TEXT_BLOCK_TAGS.indexOf( parentEl.tagName ) === -1 &&
			window.getComputedStyle( parentEl ).display.indexOf( 'inline' ) !== 0;

		var anchorEl = isInBox ? marker : parentEl;
		var containerEl = anchorEl.parentElement; // the shared parent we work within

		var hostSourceEls = [];

		if ( isInBox ) {
			srmWrapTrailingText( marker );
		} else {
			srmSplitAnchor( marker, anchorEl, containerEl, hostSourceEls );
		}

		// Anything that already followed the anchor element (or, if a
		// twin element was just split off, anything that follows THAT)
		// also becomes hidden content. Collected up front, before any
		// further DOM changes, so this traversal can never be thrown
		// off by mutations made later in this same setup.
		var afterEl = hostSourceEls.length ? hostSourceEls[ hostSourceEls.length - 1 ] : anchorEl;
		var sib = afterEl.nextElementSibling;
		while ( sib ) {
			hostSourceEls.push( sib );
			sib = sib.nextElementSibling;
		}

		if ( ! hostSourceEls.length ) {
			// Nothing to hide, so no toggle is added at all.
			marker.remove();
			return;
		}

		srmSetupToggles( anchorEl, containerEl, hostSourceEls );
		marker.remove();
	}

	// For a marker sitting directly in a box: gathers each run of bare
	// text and inline elements after the marker into its own <div>, in
	// place, so that run can collapse like any other block. Block
	// elements after the marker are left as they are. A <div> is used
	// because it inherits the box's text styling and, like a paragraph
	// would, lines up with the box's other blocks.
	function srmWrapTrailingText( marker ) {
		var parentEl = marker.parentElement;
		var runEl = null;

		srmDropLeadingBreak( marker );
		var node = marker.nextSibling;

		while ( node ) {
			var nextNode = node.nextSibling;
			if ( srmIsInlineNode( node ) ) {
				if ( ! runEl ) {
					if ( node.nodeType === 3 && ! node.nodeValue.trim() ) {
						// Whitespace between blocks; leave it where it is.
						node = nextNode;
						continue;
					}
					runEl = document.createElement( 'div' );
					parentEl.insertBefore( runEl, node );
				}
				runEl.appendChild( node );
			} else {
				runEl = null;
			}
			node = nextNode;
		}
	}

	// True for text, and for elements that are laid out inline.
	function srmIsInlineNode( node ) {
		if ( node.nodeType === 3 ) {
			return true;
		}
		if ( node.nodeType !== 1 ) {
			return false;
		}
		var display = window.getComputedStyle( node ).display;
		return display.indexOf( 'inline' ) === 0 || display === 'none' || display === 'contents';
	}

	// The line break right after a marker typed on its own line ends
	// the marker's line, not the hidden text's. Left in place it would
	// open the revealed text with an empty line, so it is dropped,
	// along with any whitespace before it.
	function srmDropLeadingBreak( marker ) {
		var node = marker.nextSibling;
		while ( node && node.nodeType === 3 && ! node.nodeValue.trim() ) {
			node = node.nextSibling;
		}
		if ( node && node.nodeType === 1 && node.tagName === 'BR' ) {
			while ( marker.nextSibling !== node ) {
				marker.nextSibling.remove();
			}
			node.remove();
		}
	}

	// Splits the element holding the marker, as described below, and
	// adds the twin (if any) to hostSourceEls.
	function srmSplitAnchor( marker, anchorEl, containerEl, hostSourceEls ) {
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
		srmDropLeadingBreak( marker );
		var trailingInlineNodes = [];
		var node = marker.nextSibling;
		while ( node ) {
			trailingInlineNodes.push( node );
			node = node.nextSibling;
		}
		marker.remove();

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
	}

	// Collapses every element in hostSourceEls and adds the two toggles:
	// "Read More" right after anchorEl, "Read Less" after the last
	// collapsed element.
	function srmSetupToggles( anchorEl, containerEl, hostSourceEls ) {
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
		srmSetToggleHidden( linkLessEl, true );

		var firstHostEl = hostEls[ 0 ];
		var lastHostEl = hostEls[ hostEls.length - 1 ];

		// Lets srmToggle() move focus to the start of the revealed text
		// without adding that element to the Tab order. An element that
		// already carries its own tabindex is left alone.
		if ( ! firstHostEl.hasAttribute( 'tabindex' ) ) {
			firstHostEl.setAttribute( 'tabindex', '-1' );
		}

		// "Read More" goes right after the anchor paragraph. "Read
		// Less" goes right after the LAST hidden element, as a new
		// sibling following a real block element; this is what
		// guarantees it always starts on its own line. Each link sits
		// inside its own block wrapper, so it is the wrapper, not the
		// link, that becomes a child of the container.
		containerEl.insertBefore( linkMoreEl.parentElement, anchorEl.nextSibling );
		if ( lastHostEl.nextSibling ) {
			containerEl.insertBefore( linkLessEl.parentElement, lastHostEl.nextSibling );
		} else {
			containerEl.appendChild( linkLessEl.parentElement );
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
			srmSetToggleHidden( linkMoreEl, isOpenState );
			srmSetToggleHidden( linkLessEl, ! isOpenState );

			// The link just activated is now hidden, and a hidden element
			// cannot keep focus, so the browser would drop it back to the
			// top of the page. Move it somewhere useful instead: into the
			// revealed text on open, back to "Read More" on close. This
			// runs after inert is removed above, since an inert element
			// cannot take focus. preventScroll on open because the
			// revealed text starts right where the reader already is and
			// is still animating open; on close, letting the browser
			// scroll brings "Read More" back into view.
			if ( isOpenState ) {
				firstHostEl.focus( { preventScroll: true } );
			} else {
				linkMoreEl.focus();
			}
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

	// Builds a toggle link inside its own block-level wrapper. The link
	// stays an inline <a> so it keeps the theme's link styling, but it
	// is never a direct child of the content container. Block themes
	// align every child of a "constrained" layout to the text column
	// with auto side margins, which only work on block boxes; a bare
	// inline-block link ignores them and drifts to the container's left
	// edge, outside the column. The wrapper is the block box that gets
	// aligned, and the link simply sits at its start, like text.
	function srmBuildToggle( extraClass, label, collapseIds ) {
		var wrapEl = document.createElement( 'div' );
		wrapEl.className = 'srm-toggle-wrap';

		var linkEl = document.createElement( 'a' );
		linkEl.href = '#';
		linkEl.setAttribute( 'role', 'button' );
		linkEl.className = 'srm-toggle ' + extraClass;
		linkEl.textContent = label;
		linkEl.setAttribute( 'aria-expanded', 'false' );
		linkEl.setAttribute( 'aria-controls', collapseIds );

		wrapEl.appendChild( linkEl );
		return linkEl;
	}

	// Hides or shows a toggle together with its wrapper. Hiding only
	// the link would leave an empty wrapper behind, and block themes
	// put a gap above every child of the container, so that empty
	// wrapper would still show up as blank space.
	function srmSetToggleHidden( linkEl, isHidden ) {
		linkEl.hidden = isHidden;
		linkEl.parentElement.hidden = isHidden;
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', srmInit );
	} else {
		srmInit();
	}
}() );
