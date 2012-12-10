/*
 * Finfore.net 
 * Buildfile
 *
 * Copyright (C) 2012 Finfore.net
 *
 * Developed by Barandi Solutions
 * www.barandisolutions.ro 
 * 
 * version 0.8.0
 */

// Steal jquerymx
steal('jquery/view/tmpl')
// Load utils
.then('//webapp/core/utils.js', '//webapp/core/api.js')
// Set jQuery Mobile Defaults
.then(function() {

	// make sure jQuery has CORS support
	jQuery.support.cors = true;

	$(document).bind("mobileinit", function() {
		// jquery mobile defaults
		$.extend($.mobile , {
			ajaxEnabled: false,
			autoInitialize: false,
			hashListeningEnabled: false,
			defaultPageTransition: 'none',
			defaultDialogTransition: 'slidedown',
			pushStateEnabled: false,
			linkBindingEnabled: false
		});
		
		$.extend($.mobile.changePage.defaults, {
			changeHash: false
		});
		
		// swipe threshold
		$.event.special.swipe.horizontalDistanceThreshold = 80;
		
		// set jquery mobile param to true
		$.mobile.allowCrossDomainPages = true;
		
	});	
})
.then('//webapp/lib/jquery.mobile.js', '../lib/jquery.mobile.css')
.then(function() {
	// show loader
	Loader.show();
})
// Libs
.then('//webapp/lib/flash_detect_min.js', '//webapp/lib/toast/jquery.toastmessage.js', '//webapp/lib/jquery.mobile.js', '//webapp/lib/jquery-impromptu.3.1.js')
// Load Core Templates
.then('//webapp/views/desktop.mobile.tmpl', '//webapp/views/login.tmpl', '//webapp/views/signup.tmpl', '//webapp/views/addcompanymobile.tmpl', '//webapp/views/profile.tmpl')
// Load Core CSS
.then('../lib/jquery.mobile.css', '../lib/toast/jquery.toastmessage.css')
.then('../css/shared.css').then('../css/small-screen.css')
// Load Core Components
.then('./core.js')
.then('./desktop.mobile.js', './login.js', './signup.js', './profile.js', './addcompany.js')
// Load Module Templates
.then('//webapp/views/module.tmpl', '//webapp/views/module.feed.tmpl', '//webapp/views/module.podcast.tmpl', '//webapp/views/module.twitter.tmpl', '//webapp/views/module.twitter.tweet.tmpl', '//webapp/views/module.prices.tmpl', '//webapp/views/module.portfolio.tmpl', '//webapp/views/module.agenda.tmpl', '//webapp/views/module.linkedin.tmpl', '//webapp/views/module.blinkx.tmpl', '//webapp/views/module.keyword.tmpl')
// Load Modules
.then('../modules/feed.js', '../modules/podcast.js', '../modules/twitter.js', '../modules/prices.js', '../modules/portfolio.js', '../modules/agenda.js', '../modules/linkedin.js', '../modules/blinkx.js', '../modules/keyword.js')
// Init Finfore.net
.then(function(){	
	finfore.init();
});