/*
 * nyroModal - jQuery Plugin
 * http://nyromodal.nyrodev.com
 *
 * Copyright (c) 2008 Cedric Nirousset (nyrodev.com)
 * Licensed under the MIT license
 *
 * $Date: 2008-06-24 (Tue, 24 Jun 2008) $
 * $version: 1.2.8
 */
jQuery(function($) {

	// -------------------------------------------------------
	// Private Variables
	// -------------------------------------------------------
	
	var isIE6 = ($.browser.msie && parseInt($.browser.version.substr(0,1)) < 7);
	var body = $('body');
	
	var currentSettings;
	
	// To know if the fix for the Issue 10 should be applied (or has been applied)
	var fixFF = false;
	
	// Used for retrieve the content from an hidden div
	var contentElt;
	var contentEltLast;
	
	// Contains info about nyroModal state and all div references
	var modal = {
		ready: false,
		dataReady: false,
		anim: false,
		loadingShown: false,
		transition: false,
		error: false,
		full: null,
		bg: null,
		loading: null,
		tmp: null,
		content: null,
		wrapper: null,
		contentWrapper: null,
		scripts: new Array()
	};
	
	// Indicate of the height or the width was resized, to reinit the currentsettings related to null
	var resized = {
		width: false,
		height: false
	};
	
	// -------------------------------------------------------
	// Public function
	// -------------------------------------------------------
	
	// jQuery extension function. A paramater object could be used to overwrite the default settings
	$.fn.nyroModal = function(settings) {
		if (!this)
			return false;
		return this.each(function(){
			if (this.nodeName.toLowerCase() == 'form') {
				$(this).submit(function(e) {
					if (this.enctype == 'multipart/form-data') {
						processModal($.extend(settings, {
							from: this
						}));
						return true;
					}
					e.preventDefault();
					processModal($.extend(settings, {
						from: this
					}));
					return false;
				});
			} else {
				$(this).click(function(e) {
					e.preventDefault();
					processModal($.extend(settings, {
						from: this
					}));
					return false;
				});
			}
		});
	};
	
	// jQuery extension function to call manually the modal. A paramater object could be used to overwrite the default settings
	$.fn.nyroModalManual = function(settings) {
		if (!this.length)
			processModal(settings);
		return this.each(function(){
			processModal($.extend(settings, {
				from: this
			}));
		});
	};
	
	$.nyroModalManual = function(settings) {
		processModal(settings);
	};
	
	// Update the current settings
	// object settings
	// string deep1 first key where overwrite the settings
	// string deep2 second key where overwrite the settings
	$.nyroModalSettings = function(settings, deep1, deep2) {
		setCurrentSettings(settings, deep1, deep2);
		if (!deep1 && modal.ready) {
			if (settings.bgColor)
				currentSettings.updateBgColor(modal, currentSettings, function(){});
			
			if ((modal.dataReady && !modal.anim && !modal.transition) && (settings.width || settings.height)) {
				calculateSize(true);
				
				if (fixFF)
					modal.content.css({position: ''});
				currentSettings.resize(modal, currentSettings, function() {
					if (fixFF)
						modal.content.css({position: 'fixed'});
					if ($.isFunction(currentSettings.endResize))
						currentSettings.endResize(modal, currentSettings);
				});
			}
		}
	};
	
	// Remove the modal function
	$.nyroModalRemove = function() {
		removeModal();
	};
	
	// Go to the next image for a gallery
	// return false if nothing was done
	$.nyroModalNext = function() {
		if (currentSettings.type == 'gallery') {
			var gallery = $('[rel="'+currentSettings.from.rel+'"]');
			var currentIndex = gallery.index(currentSettings.from);
			if (currentIndex < gallery.length-1) {
				return gallery.eq(currentIndex+1).nyroModalManual(currentSettings);
			}
		}
		return false;
	};
	
	// Go to the previous image for a gallery
	// return false if nothing was done
	$.nyroModalPrev = function() {
		if (currentSettings.type == 'gallery') {
			var gallery = $('[rel="'+currentSettings.from.rel+'"]');
			var currentIndex = gallery.index(currentSettings.from);
			if (currentIndex > 0) {
				return gallery.eq(currentIndex-1).nyroModalManual(currentSettings);
			}
		}
		return false;
	};

	
	// -------------------------------------------------------
	// Default Settings
	// -------------------------------------------------------
	
	$.fn.nyroModal.settings = {
		debug: false, // Show the debug in the background
		
		modal: false, // Esc key or click backgrdound enabling or not
	
		type: '', // nyroModal type (form, formData, iframe, image, etc...)
		from: '', // Dom object where the call come from
		hash: '', // Eventual hash in the url
		
		processHandler: null, // Handler just before the real process
		
		selIndicator: 'nyroModalSel', // Value added when a form or Ajax is sent with a filter content
		
		formIndicator: 'nyroModal', // Value added when a form is sent
		
		content: null, // Raw content if type content is used

		bgColor: '#000000', // Background color
		
		ajax: {}, // Ajax option (url, data, type, success will be overwritten for a form, url and success only for an ajax call)
		
		width: null, // default Width If null, will be calculate automatically
		height: null, // default Height If null, will be calculate automatically
		
		minWidth: 400, // Minimum width
		minHeight: 300, // Minimum height
		
		resizeable: true, // Indicate if the content is resizable. Will be set to false for swf
		autoSizable: true, // Indicate if the content is auto sizable. If not, the min size will be used
		
		padding: 20, // padding for the max modal size
		
		extImg: 'jpg|jpeg|png|tiff|gif|bmp', // Images extensions seperate by | (regexp using)
		defaultImgAlt: 'Image', // Default alt attribute for the images
		setWidthImgTitle: true, // Set the width to the image title
		
		css: { // Default CSS option for the nyroModal Div. Some will be overwritten or updated when using IE6
			bg: {
				zIndex: 100,
				position: 'fixed',
				top: 0,
				left: 0,
				height: '100%',
				width: '100%'
			},
			wrapper: {
				zIndex: 101,
				position: 'fixed',
				top: '50%',
				left: '50%'
			},
			wrapper2: {
			},
			content: {
				overflow: 'auto'
			},
			loading: {
				zIndex: 102,
				position: 'fixed',
				top: '50%',
				left: '50%',
				marginTop: '-50px',
				marginLeft: '-50px'
			}
		},
		
		wrap: { // Wrapper div used to style the modal regarding the content type
			div: '<div class="wrapper"></div>',
			ajax: '<div class="wrapper"></div>',
			form: '<div class="wrapper"></div>',
			formData: '<div class="wrapper"></div>',
			image: '<div class="wrapperImg"></div>',
			gallery: '<div class="wrapperImg"><a href="#" class="nyroModalPrev">Prev</a><a href="#"  class="nyroModalNext">Next</a></div>', // Use .nyroModalPrev and .nyroModalNext to set the navigation link
			swf: '<div class="wrapperSwf"></div>',
			iframe: '<div class="wrapperIframe"></div>',
			manual: '<div class="wrapper"></div>'
		},
		
		closeButton: '<a href="#" class="nyroModalClose" id="closeBut" title="close">Close</a>', // Adding automaticly as the first child of #nyroModalWrapper 
		
		openSelector: '.nyroModal', // selector for open a new modal. will be used to parse automaticly at page loading
		closeSelector: '.nyroModalClose', // selector to close the modal
		
		contentLoading: '<a href="#" class="nyroModalClose">Cancel</a>', // Loading div content
		
		errorClass: 'error', // CSS Error class added to the loading div in case of error
		contentError: 'The requested content cannot be loaded.<br />Please try again later.<br /><a href="#" class="nyroModalClose">Close</a>', // Content placed in the loading div in case of error 
	
		handleError: null, // Callback in case of error
		
		showBackground: showBackground, // Show background animation function
		hideBackground: hideBackground, // Hide background animation function
		
		endFillContent: null, // Will be called after filling and wraping the content, before parsing closeSelector and openSelector and showing the content
		showContent: showContent, // Show content animation function
		endShowContent: null, // Will be called once the content is shown
		hideContent: hideContent, // Hide content animation function
		
		showTransition: showTransition, // Show the transition animation (a modal is already shown and a new one is requested)
		hideTransition: hideTransition, // Hide the transition animation to show the content
		
		showLoading: showLoading, // show loading animation function
		hideLoading: hideLoading, // hide loading animation function
		
		resize: resize, // Resize animation function
		endResize: null, // Will be called one the content is resized
		
		updateBgColor: updateBgColor, // Change background color animation function
		
		endRemove: null // Will be called once the modal is totally gone
	};

	
	// -------------------------------------------------------
	// Private function
	// -------------------------------------------------------
	
	// Main function
	function processModal(settings) {
		if (modal.loadingShown || modal.transition || modal.anim)
			return;
		debug('processModal');
		setDefaultCurrentSettings(settings);
		modal.error = false;
		modal.dataReady = false;
		modal.scripts = new Array();
		
		currentSettings.type = fileType();
		
		if ($.isFunction(currentSettings.processHandler))
			currentSettings.processHandler(currentSettings);

		from = currentSettings.from;
		
		if (currentSettings.type == 'swf') {
			// Swf is transforming as a raw content
			currentSettings.resizable = false;
			currentSettings.content = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+currentSettings.width+'" height="'+currentSettings.height+'"><param name="movie" value="'+currentSettings.url+'"></param><param name="wmode" value="transparent"></param><embed src="'+currentSettings.url+'" type="application/x-shockwave-flash" wmode="transparent" width="'+currentSettings.width+'" height="'+currentSettings.height+'"></embed></object>';
		}
		
		if (from) {
			if (currentSettings.type == 'form') {
				currentSettings.selector = getHash(from.action);
				var url = from.action.substring(0, from.action.length-currentSettings.selector.length);
				var data = $(from).serializeArray();
				data.push({name: currentSettings.formIndicator, value: 1});
				if (currentSettings.selector)
					data.push({name: currentSettings.selIndicator, value: currentSettings.selector.substring(1)});
				$.ajax($.extend({}, currentSettings.ajax, {
						url: url,
						data: data,
						type: from.method,
						success: ajaxLoaded,
						error: loadingError
					}));
				debug('Form Ajax Load: '+from.action);
				showModal();
			} else if (currentSettings.type == 'formData') {
				// Form with data. We're using a hidden iframe
				initModal();
				from.target = 'nyroModalIframe';
				currentSettings.selector = getHash(from.action);
				var url = from.action.substring(0, from.action.length - currentSettings.selector.length);
				from.action = url;
				$(from).prepend('<input type="hidden" name="'+currentSettings.formIndicator+'" value="1" />');
				if (currentSettings.selector)
					$(from).prepend('<input type="hidden" name="'+currentSettings.selIndicator+'" value="'+currentSettings.selector.substring(1)+'" />');
				modal.tmp.html('<iframe frameborder="0" hspace="0" name="nyroModalIframe"></iframe>');
				$('iframe', modal.tmp)
					.css({
						width: currentSettings.width,
						height: currentSettings.height
					})
					.error(loadingError)
					.load(formDataLoaded);
				debug('Form Data Load: '+from.action);
				showModal();
				showContentOrLoading();
			} else if (currentSettings.type == 'image' || currentSettings.type == 'gallery') {
				var title = from.title || currentSettings.defaultImgAlt;
				initModal();
				modal.tmp.html('<img id="nyroModalImg" alt="'+title+'" />');
				debug('Image Load: '+from.href);
				$('img', modal.tmp)
					.error(loadingError)
					.load(function() {
						debug('Image Loaded: '+this.src);
						$(this).unbind('load');
						var w = modal.tmp.width();
						var h = modal.tmp.height();
						setCurrentSettings({
							width: w,
							height: h,
							imgWidth: w,
							imgHeight: h
						});
						modal.dataReady = true;
						if (modal.loadingShown || modal.transition)
							showContentOrLoading();
					})
					.attr('src', from.href);
				showModal();
			} else if (currentSettings.type == 'iframe') {
				initModal();
				modal.tmp.html('<iframe frameborder="0" hspace="0" src="'+from.href+'" name="nyroModalIframe"></iframe>');
				debug('Iframe Load: '+from.href);
				$('iframe', modal.tmp).eq(0)
					.css({
						width: '100%',
						height: '100%'
					});
				currentSettings.autoSizable = false;
				modal.dataReady = true;
				showModal();
			} else if (currentSettings.type) {
				// Could be every other kind of type or a dom selector
				debug('Content: '+currentSettings.type);
				initModal();
				modal.tmp.html(currentSettings.content);
				var w = modal.tmp.width();
				var h = modal.tmp.height();
				var div = $(currentSettings.type);
				if (div.length) {
					setCurrentSettings({type: 'div'});
					w = div.width();
					h = div.height();
					if (contentElt)
						contentEltLast = contentElt;
					contentElt = div;
					modal.tmp.append(div.contents());
				}
				setCurrentSettings({
					width: w,
					height: h
				});
				if (modal.tmp.html())
					modal.dataReady = true;
				else
					loadingError();
				showModal();
				showContentOrLoading();
			} else {
				debug('Ajax Load: '+currentSettings.url);
				setCurrentSettings({type: 'ajax'});
				var data = {};
				if (currentSettings.selector) {
					data = currentSettings.ajax.data || {};
					data[currentSettings.selIndicator] = currentSettings.selector.substring(1);
				}
				$.ajax($.extend({}, currentSettings.ajax, {
					url: currentSettings.url.substring(0, currentSettings.url.length-currentSettings.selector.length),
					success: ajaxLoaded,
					error: loadingError,
					data: data
				}));
				showModal();
			}
		} else if (currentSettings.content) {
			// Raw content not from a DOM element
			debug('Content: '+currentSettings.type);
			setCurrentSettings({type: 'manual'});
			initModal();
			modal.tmp.html($('<div/>').html(currentSettings.content).contents());
			if (modal.tmp.html())
				modal.dataReady = true;
			else
				loadingError();
			showModal();
		} else {
			// What should we show here? nothing happen
		}
	}
	
	// Update the current settings
	// object settings
	// string deep1 first key where overwrite the settings
	// string deep2 second key where overwrite the settings
	function setDefaultCurrentSettings(settings) {
		debug('setDefaultCurrentSettings');
		currentSettings = $.extend({}, $.fn.nyroModal.settings, settings);
		currentSettings.selector = '',
		currentSettings.borderW = 0,
		currentSettings.borderH = 0,
		currentSettings.resizable = true;
		setMargin();
	}
	
	function setCurrentSettings(settings, deep1, deep2) {
		if (deep1 && deep2) {
			$.extend(currentSettings[deep1][deep2], settings);
		} else if (deep1) {
			$.extend(currentSettings[deep1], settings);
		} else {
			$.extend(currentSettings, settings);
		}
	}

	// Set the margin for postionning the element. Useful for IE6
	function setMarginScroll() {
		if (isIE6) {
			if (document.documentElement) {
				currentSettings.marginScrollLeft = document.documentElement.scrollLeft;
				currentSettings.marginScrollTop = document.documentElement.scrollTop;
			} else {
				currentSettings.marginScrollLeft = document.body.scrollLeft;
				currentSettings.marginScrollTop = document.body.scrollTop;
			}
		} else {
			currentSettings.marginScrollLeft = 0;
			currentSettings.marginScrollTop = 0;
		}
	}
	
	// Set the margin for the content
	function setMargin() {
		setMarginScroll();
		currentSettings.marginLeft = -(currentSettings.width+currentSettings.borderW)/2 + currentSettings.marginScrollLeft;
		currentSettings.marginTop = -(currentSettings.height+currentSettings.borderH)/2 + currentSettings.marginScrollTop;
	}
	
	// Init the nyroModal div by settings the CSS elements and hide needed elements
	function initModal() {
		debug('initModal');
		if (!modal.full) {
			if (currentSettings.debug)
				setCurrentSettings({color: 'white'}, 'css', 'bg');
		
			var iframeHideIE = '';
			if (isIE6) {
				body.css({
					height: body.height()+'px',
					width: body.width()+'px',
					position: 'static',
					overflow: 'hidden'});
				$('html').css({overflow: 'hidden'});
				setCurrentSettings({
					position: 'absolute',
					height: '110%',
					width: '110%',
					top: currentSettings.marginScrollTop+'px',
					left: currentSettings.marginScrollLeft+'px'
				}, 'css', 'bg');
				
				setCurrentSettings({position: 'absolute'}, 'css', 'loading');
				setCurrentSettings({position: 'absolute'}, 'css', 'wrapper');
				
				iframeHideIE = $('<iframe id="nyroModalIframeHideIe"></iframe>')
								.css($.extend({},
									currentSettings.css.bg, {
										opacity: 0,
										zIndex: 50,
										border: 'none'
									}));
			}
		
			body.append($('<div id="nyroModalFull"><div id="nyroModalBg"></div><div id="nyroModalWrapper"><div id="nyroModalContent"></div></div><div id="nyrModalTmp"></div><div id="nyroModalLoading"></div></div>').hide());
			
			modal.full = $('#nyroModalFull').show();
			modal.bg = $('#nyroModalBg')
				.css($.extend({
						backgroundColor: currentSettings.bgColor
					}, currentSettings.css.bg))
				.before(iframeHideIE);
			if (!currentSettings.modal)
				modal.bg.click(removeModal);
			modal.loading = $('#nyroModalLoading')
				.css(currentSettings.css.loading)
				.hide();
			modal.contentWrapper = $('#nyroModalWrapper')
				.css(currentSettings.css.wrapper)
				.hide();
			modal.content = $('#nyroModalContent');
			modal.tmp = $('#nyrModalTmp').hide();
			
			// To stop the mousewheel if the the plugin is available
			if ($.isFunction($.fn.mousewheel)) {
				modal.content.mousewheel(function(e, d) {
					var elt = modal.content.get(0);
					if ((d > 0 && elt.scrollTop == 0) ||
							(d < 0 && elt.scrollHeight - elt.scrollTop == elt.clientHeight)) {
						e.preventDefault();
						e.stopPropagation();
					}
				});
			}
			
			$(document).keydown(keyHandler);
			modal.content.css({width: 'auto', height: 'auto'});
			modal.contentWrapper.css({width: 'auto', height: 'auto'});
		}
	}
	
	// Show the modal (ie: the background and then the loading if needed or the content directly)
	function showModal() {
		debug('showModal');
		if (!modal.ready) {
			initModal();
			modal.anim = true;
			currentSettings.showBackground(modal, currentSettings, endBackground);
		} else {
			modal.anim = true;
			modal.transition = true;
			currentSettings.showTransition(modal, currentSettings, function(){endHideContent();modal.anim=false;showContentOrLoading();});
		}
	}
	
	// Used for the escape key or the arrow in the gallery type
	function keyHandler(e) {
		if (e.keyCode == 27) {
			if (!currentSettings.modal)
				removeModal();
		} else if (currentSettings.type == 'gallery' && modal.ready && modal.dataReady && !modal.anim && !modal.transition) {
			if (e.keyCode == 39 || e.keyCode == 40) {
				e.preventDefault();
				$('.nyroModalNext', modal.content).eq(0).trigger('click');
				return false;
			} else if (e.keyCode == 37 || e.keyCode == 38) {
				e.preventDefault();
				$('.nyroModalPrev', modal.content).eq(0).trigger('click');
				return false;
			}
		}
	}
	
	// Determine the filetype regarding the link DOM element
	function fileType() {
		var from = currentSettings.from;
		
		var url = currentSettings.url;
		
		if (from && from.nodeName) {
			if (from.nodeName.toLowerCase() == 'form') {
				if (from.enctype == 'multipart/form-data')
					return 'formData';
				return 'form';
			}
			
			if (from.rev == 'modal')
				currentSettings.modal = true;
			
			var image = new RegExp('[^\.]\.('+currentSettings.extImg+')\s*$', 'i');
			if (image.test(from.href)) {
				if (from.rel)
					return 'gallery';
				else
					return 'image';
			}
			
			var swf = new RegExp('[^\.]\.(swf)\s*$', 'i');
			if (swf.test(from.href))
				return 'swf';
			
			if (from.target.toLowerCase() == '_blank' || (from.hostname.replace(/:\d*$/,'') != window.location.hostname.replace(/:\d*$/,'')))
				return 'iframe';
			
			url = from.href;
		}
		
		if (url) {
			if (from)
				currentSettings.url = url;
			else
				currentSettings.from = true;
			var hash = getHash(url);
			var hashLoc = getHash(window.location.href);
			var curLoc = window.location.href.substring(0, window.location.href.length - hashLoc.length);
			var req = url.substring(0, url.length - hash.length);
			
			if (req == curLoc)
				return hash;
			else
				currentSettings.selector = hash;
		}
	}

	// Called when the content cannot be loaded or tiemout reached
	function loadingError() {
		debug('loadingError');
		
		modal.error = true;
		
		if (!modal.ready)
			return;
		
		if ($.isFunction(currentSettings.handleError))
			currentSettings.handleError(modal, currentSettings);
		
		modal.loading
			.addClass(currentSettings.errorClass)
			.html(currentSettings.contentError);
		$(currentSettings.closeSelector, modal.loading).click(removeModal);
	}
	
	// Put the content from modal.tmp to modal.content
	function fillContent() {
		debug('fillContent');
		if (!modal.tmp.html())
			return;
		
		modal.content.html(modal.tmp.contents());
		modal.tmp.empty();
		wrapContent();
		
		if ($.isFunction(currentSettings.endFillContent))
			currentSettings.endFillContent(modal, currentSettings);
		
		modal.content.append(modal.scripts);
		
		var currentSettingsNew = $.extend({}, currentSettings);
		if (resized.width)
			currentSettingsNew.width = null;
		if (resized.height)
			currentSettingsNew.height = null;
		$(currentSettings.closeSelector, modal.contentWrapper).click(removeModal);
		$(currentSettings.openSelector, modal.contentWrapper).nyroModal(currentSettingsNew);
	}
	
	// Wrap the content and update the modal size if needed
	function wrapContent() {
		debug('wrapContent');
		
		var wrap = $(currentSettings.wrap[currentSettings.type]);
		modal.content.append(wrap.children().remove());
		modal.contentWrapper.wrapInner(wrap);
		
		if (currentSettings.type == 'gallery') {
			// Set the action for the next and prev button (or remove them)
			var gallery = $('[rel="'+currentSettings.from.rel+'"]');
			var currentIndex = gallery.index(currentSettings.from);
			if (currentIndex > 0) {
				var linkPrev = gallery.eq(currentIndex-1);
				$('.nyroModalPrev', modal.contentWrapper)
					.attr('href', linkPrev.attr('href'))
					.click(function(e) {
						e.preventDefault();
						linkPrev.nyroModalManual(currentSettings);
						return false;
					});
			} else {
				$('.nyroModalPrev', modal.contentWrapper).remove();
			}
			if (currentIndex < gallery.length-1) {
				var linkNext = gallery.eq(currentIndex+1);
				$('.nyroModalNext', modal.contentWrapper)
					.attr('href', linkNext.attr('href'))
					.click(function(e) {
						e.preventDefault();
						linkNext.nyroModalManual(currentSettings);
						return false;
					});
			} else {
				$('.nyroModalNext', modal.contentWrapper).remove();
			}
		}
		
		calculateSize();
	}
	
	// Calculate the size for the contentWrapper
	function calculateSize(resizing) {
		debug('calculateSize');
		
		if (!modal.wrapper)
			modal.wrapper = modal.contentWrapper.children(':first');
		
		resized.width = false;
		resized.height = false;
		if (currentSettings.autoSizable && (!currentSettings.width || !currentSettings.height)) {
			modal.contentWrapper.css({opacity: 0}).show();
			var tmp = {
				width: 'auto',
				height: 'auto'
			};
			if (currentSettings.width)
				tmp.width = currentSettings.width;
			if (currentSettings.height)
				tmp.height = currentSettings.height;
			modal.content.css(tmp);
			if (!currentSettings.width) {
				currentSettings.width = modal.content.width();
				resized.width = true;
			}
			if (!currentSettings.height) {
				currentSettings.height = modal.content.height();
				resized.height = true;
			}
			modal.contentWrapper.hide().css({opacity: 1});
		}
		
		currentSettings.width = Math.max(currentSettings.width, currentSettings.minWidth);
		currentSettings.height = Math.max(currentSettings.height, currentSettings.minHeight);
		
		var outerWrapper = getOuter(modal.contentWrapper);
		var outerWrapper2 = getOuter(modal.wrapper);
		var outerContent = getOuter(modal.content);
		
		var tmp = {
			content: {
				width: currentSettings.width,
				height: currentSettings.height
			},
			wrapper2: {
				width: currentSettings.width + outerContent.w.total,
				height: currentSettings.height + outerContent.h.total
			},
			wrapper: {
				width: currentSettings.width + outerContent.w.total + outerWrapper2.w.total,
				height: currentSettings.height + outerContent.h.total + outerWrapper2.h.total
			}
		};
		
		if (currentSettings.resizable) {
			var maxHeight = $(window).height()
					- currentSettings.padding*2
					- outerWrapper.h.border
					- (tmp.wrapper.height - currentSettings.height);
			var maxWidth = $(window).width()
					- currentSettings.padding*2
					- outerWrapper.w.border
					- (tmp.wrapper.width - currentSettings.width);
			
			if (tmp.content.height > maxHeight || tmp.content.width > maxWidth) {
				// We're gonna resize the modal as it will goes outside the view port
				if (currentSettings.type == 'image' || currentSettings.type == 'gallery') {
					// An image is resized proportionnaly
					var diffW = tmp.content.width - currentSettings.imgWidth;
					var diffH = tmp.content.height - currentSettings.imgHeight;
						if (diffH < 0) diffH = 0;
						if (diffW < 0) diffW = 0;
					var calcH = maxHeight - diffH;
					var calcW = maxWidth - diffW;
					var ratio = Math.min(calcH/currentSettings.imgHeight, calcW/currentSettings.imgWidth);
					
					calcH = Math.floor(currentSettings.imgHeight*ratio);
					calcW = Math.floor(currentSettings.imgWidth*ratio);
					$('img#nyroModalImg', modal.content).css({
						height: calcH+'px',
						width: calcW+'px'
					});
					tmp.content.height = calcH + diffH;
					tmp.content.width = calcW + diffW;
				} else {
					// For an HTML content, we simply decrease the size
					tmp.content.height = Math.min(tmp.content.height, maxHeight);
					tmp.content.width = Math.min(tmp.content.width, maxWidth);
				}
				tmp.wrapper2 = {
						width: tmp.content.width + outerContent.w.total,
						height: tmp.content.height + outerContent.h.total
					};
				tmp.wrapper = {
						width: tmp.content.width + outerContent.w.total + outerWrapper2.w.total,
						height: tmp.content.height + outerContent.h.total + outerWrapper2.h.total
					};
			}
		}
		
		modal.content.css($.extend({}, tmp.content, currentSettings.css.content));
		modal.wrapper.css($.extend({}, tmp.wrapper2, currentSettings.css.wrapper2));
		
		if (!resizing) {
			modal.contentWrapper.css($.extend({}, tmp.wrapper, currentSettings.css.wrapper));
			if (currentSettings.type == 'image' || currentSettings.type == 'gallery') {
				// Adding the title for the image
				var title = $('img', modal.content).attr('alt');
				$('img', modal.content).removeAttr('alt');
				if (title != currentSettings.defaultImgAlt) {
					var divTitle = $('<div>'+title+'</div>');
					modal.content.append(divTitle);
					if (currentSettings.setWidthImgTitle) {
						var outerDivTitle = getOuter(divTitle);
						divTitle.css({width: (tmp.content.width + outerContent.w.padding - outerDivTitle.w.total)+'px'});
					}
				}
			}
			
			if (!currentSettings.modal)
				modal.contentWrapper.prepend(currentSettings.closeButton);
		}
		tmp.wrapper.borderW = outerWrapper.w.border;
		tmp.wrapper.borderH = outerWrapper.h.border;
		
		setCurrentSettings(tmp.wrapper);
		setMargin();
	}
	
	function removeModal(e) {
		debug('removeModal');
		if (e)
			e.preventDefault();
		if (modal.full && modal.ready) {
			modal.ready = false;
			modal.anim = true;
			if (modal.loadingShown || modal.transition) {
				currentSettings.hideLoading(modal, currentSettings, function() {
						modal.loading.hide();
						modal.loadingShown = false;
						modal.transition = false;
						currentSettings.hideBackground(modal, currentSettings, endRemove);
					});
			} else {
				if (fixFF)
					modal.content.css({position: ''}); // Fix Issue #10, remove the attribute
				modal.wrapper.css({overflow: 'hidden'}); // Used to fix a visual issue when hiding
				modal.content.css({overflow: 'hidden'}); // Used to fix a visual issue when hiding
				currentSettings.hideContent(modal, currentSettings, function() {
						endHideContent();
						currentSettings.hideBackground(modal, currentSettings, endRemove);
					});
			}
		}
		if (e)
			return false;
	}
	
	function showContentOrLoading() {
		debug('showContentOrLoading');
		if (modal.ready && !modal.anim) {
			if (modal.dataReady) {
				if (modal.tmp.html()) {
					modal.anim = true;
					if (modal.transition) {
						fillContent();
						currentSettings.hideTransition(modal, currentSettings, function() {
							modal.loading.hide();
							modal.transition = false;
							modal.loadingShown = false;
							endShowContent();
						});
					} else {
						currentSettings.hideLoading(modal, currentSettings, function() {
								modal.loading.hide();
								modal.loadingShown = false;
								fillContent();
								currentSettings.showContent(modal, $.extend({}, currentSettings), endShowContent);
							});
					}
				}
			} else if (!modal.loadingShown && !modal.transition) {
				modal.anim = true;
				modal.loadingShown = true;
				if (modal.error)
					loadingError();
				else
					modal.loading.html(currentSettings.contentLoading);
				$(currentSettings.closeSelector, modal.loading).click(removeModal);
				currentSettings.showLoading(modal, currentSettings, function(){modal.anim=false;showContentOrLoading();});
			}
		}
	}


	// -------------------------------------------------------
	// Private Data Loaded callback
	// -------------------------------------------------------
	
	function ajaxLoaded(data) {
		debug('AjaxLoaded: '+this.url);
		modal.tmp.html(currentSettings.selector
			?filterScripts($('<div>'+data+'</div>').find(currentSettings.selector).contents())
			:filterScripts(data));
		if (modal.tmp.html()) {
			modal.dataReady = true;
			showContentOrLoading();
		} else
			loadingError();
	}
	
	function formDataLoaded() {
		debug('formDataLoaded');
		currentSettings.from.action += currentSettings.selector;
		currentSettings.from.target = '';
		$('input[name='+currentSettings.formIndicator+']', currentSettings.from).remove();
		var iframe = modal.tmp.children('iframe');
		var iframeContent = iframe.unbind('load').contents().find(currentSettings.selector || 'body').not('script[src]');
		iframe.attr('src', 'about:blank'); // Used to stop the loading in FF
		modal.tmp.html(iframeContent.html());
		if (modal.tmp.html()) {
			modal.dataReady = true;
			showContentOrLoading();
		} else
			loadingError();
	}


	// -------------------------------------------------------
	// Private Animation callback
	// -------------------------------------------------------
	
	function endHideContent() {
		debug('endHideContent');
		modal.anim = false;
		
		if (contentEltLast) {
			contentEltLast.append(modal.content.contents());
			contentEltLast= null;
		} else if (contentElt) {
			contentElt.append(modal.content.contents());
			contentElt= null;
		}
		modal.content.empty();
		modal.contentWrapper
			.empty()
			.removeAttr('style')
			.hide()
			.css(currentSettings.css.wrapper)
			.append(modal.content);
		showContentOrLoading();
	}
	
	function endRemove() {
		debug('endRemove');
		$(document).unbind('keydown', keyHandler);
		modal.anim = false;
		modal.full.remove();
		modal.full = null;
		if (isIE6) {
			body.css({height: '', width: '', position: '', overflow: ''});
			$('html').css({overflow: ''});
		}
		if ($.isFunction(currentSettings.endRemove))
			currentSettings.endRemove(modal, currentSettings);
	}
	
	function endBackground() {
		debug('endBackground');
		modal.ready = true;
		modal.anim = false;
		showContentOrLoading();
	}
	
	function endShowContent() {
		debug('endShowContent');
		modal.anim = false;
		modal.contentWrapper.css({opacity: ''}); // for the close button in IE
		fixFF = $.browser.mozilla && parseFloat($.browser.version) < 1.9 && currentSettings.type != 'gallery' && currentSettings.type != 'image';
		if (fixFF)
			modal.content.css({position: 'fixed'}); // Fix Issue #10
		if ($.isFunction(currentSettings.endShowContent))
			currentSettings.endShowContent(modal, currentSettings);
		if (resized.width)
			setCurrentSettings({width: null});
		if (resized.height)
			setCurrentSettings({height: null});
	}


	// -------------------------------------------------------
	// Utilities
	// -------------------------------------------------------
	
	// Get the selector from an url (as string)
	function getHash(url) {
		var hashPos = url.indexOf('#');
		if (hashPos > -1)
			return url.substring(hashPos);
		return '';
	}
	
	// Filter an html content to remove the script[src]
	function filterScripts(data) {
		// Removing the body, head and html tag
		if (typeof data == 'string')
			data = data.replace(/<\/?(html|head|body)([^>]*)>/gi, '');
		var tmp = new Array();
		$.each($.clean({0:data}, this.ownerDocument), function() {
			if ($.nodeName(this, "script")) {
				if (!this.src || $(this).attr('rel') == 'forceLoad')
					modal.scripts.push(this);
			} else
				tmp.push(this);
		});
		return tmp;
	}
	
	// Get the vertical and horizontal margin, padding and border dimension
	function getOuter(elm) {
		elm = elm.get(0);
		var ret = {
			h: {
				margin: getCurCSS(elm, 'marginTop') + getCurCSS(elm, 'marginBottom'),
				border: getCurCSS(elm, 'borderTopWidth') + getCurCSS(elm, 'borderBottomWidth'),
				padding: getCurCSS(elm, 'paddingTop') + getCurCSS(elm, 'paddingBottom')
			},
			w: {
				margin: getCurCSS(elm, 'marginLeft') + getCurCSS(elm, 'marginRight'),
				border: getCurCSS(elm, 'borderLeftWidth') + getCurCSS(elm, 'borderRightWidth'),
				padding: getCurCSS(elm, 'paddingLeft') + getCurCSS(elm, 'paddingRight')
			}
		};
		
		ret.h.outer = ret.h.margin + ret.h.border;
		ret.w.outer = ret.w.margin + ret.w.border;
		
		ret.h.inner = ret.h.padding + ret.h.border;
		ret.w.inner = ret.w.padding + ret.w.border;
		
		ret.h.total = ret.h.outer + ret.h.padding;
		ret.w.total = ret.w.outer + ret.w.padding;
		
		return ret;
	}
	
	function getCurCSS(elm, name) {
		var ret = parseInt($.curCSS(elm, name, true));
		if (isNaN(ret))
			ret = 0;
		return ret;
	}
	
	// Show the message in the background if possible.
	function debug(msg) {
		//alert(msg);
		if (currentSettings && currentSettings.debug && modal.full)
			modal.bg.prepend(msg+'<br />');
	}
	
	// -------------------------------------------------------
	// Default animation function
	// -------------------------------------------------------
	
	function showBackground(elts, settings, callback) {
		elts.bg.css({opacity:0}).fadeTo(500, 0.75, callback);
	}
	
	function hideBackground(elts, settings, callback) {
		elts.bg.fadeOut(300, callback);
	}
	
	function showLoading(elts, settings, callback) {
		var h = elts.loading.height();
		var w = elts.loading.width();
		elts.loading
			.css({
				height: h+'px',
				width: w+'px',
				marginTop: (-h/2 + settings.marginScrollTop)+'px',
				marginLeft: (-w/2 + settings.marginScrollLeft)+'px',
				opacity: 0
			})
			.show()
			.animate({
				opacity: 1
			}, {complete: callback, duration: 400});
	}
	
	function hideLoading(elts, settings, callback) {
		callback();
	}
	
	function showContent(elts, settings, callback) {
		var h = elts.loading.height();
		var w = elts.loading.width();
		elts.loading
			.css({
				height: h+'px',
				width: w+'px',
				marginTop: (-h/2 + settings.marginScrollTop)+'px',
				marginLeft: (-w/2 + settings.marginScrollLeft)+'px'
			})
			.show()
			.animate({
				width: settings.width+'px',
				height: settings.height+'px',
				marginTop: (settings.marginTop)+'px',
				marginLeft: (settings.marginLeft)+'px'
			}, {duration: 350, complete: function() {
				elts.contentWrapper
					.css({
						width: settings.width+'px',
						height: settings.height+'px',
						marginTop: (settings.marginTop)+'px',
						marginLeft: (settings.marginLeft)+'px'
					})
					.show();
					elts.loading.fadeOut(200, callback);
				}
			});
	}
	
	function hideContent(elts, settings, callback) {
		elts.contentWrapper
			.animate({
				height: '50px',
				width: '50px',
				marginTop: 25+settings.marginScrollTop+'px',
				marginLeft: 25+settings.marginScrollLeft+'px'
			}, {duration: 350, complete: function() {
				elts.contentWrapper.hide();
				callback();
			}});
	}
	
	function showTransition(elts, settings, callback) {
		// Put the loading with the same dimensions of the current content
		elts.loading
			.css({
				marginTop: elts.contentWrapper.css('marginTop'),
				marginLeft: elts.contentWrapper.css('marginLeft'),
				height: elts.contentWrapper.css('height'),
				width: elts.contentWrapper.css('width'),
				opacity: 0
			})
			.show()
			.fadeTo(400, 1, function() {
					elts.contentWrapper.hide();
					callback();
				});
	}
	
	function hideTransition(elts, settings, callback) {
		// Place the content wrapper underneath the the loading with the right dimensions
		elts.contentWrapper
			.css({
				width: settings.width+'px',
				marginLeft: (settings.marginLeft)+'px',
				height: settings.height+'px',
				marginTop: (settings.marginTop)+'px',
				opacity: 1
			});
		elts.loading
			.animate({
				width: settings.width+'px',
				marginLeft: (settings.marginLeft)+'px',
				height: settings.height+'px',
				marginTop: (settings.marginTop)+'px'
			}, {complete: function() {
					elts.contentWrapper.show();
					elts.loading.fadeOut(400, function() {
						elts.loading.hide();
						callback();
					});
				}, duration: 350});
	}
	
	function resize(elts, settings, callback) {
		elts.contentWrapper
			.animate({
				width: settings.width+'px',
				marginLeft: (settings.marginLeft)+'px',
				height: settings.height+'px',
				marginTop: (settings.marginTop)+'px'
			}, {complete: callback, duration: 400});
	}
	
	function updateBgColor(elts, settings, callback) {
		if (!$.fx.step.backgroundColor) {
			elts.bg.css({backgroundColor: settings.bgColor});
			callback();
		} else
			elts.bg
				.animate({
					backgroundColor: settings.bgColor
				}, {complete: callback, duration: 400});
	}
	
	// -------------------------------------------------------
	// Default initialization
	// -------------------------------------------------------
	
	$($.fn.nyroModal.settings.openSelector).nyroModal();	
});