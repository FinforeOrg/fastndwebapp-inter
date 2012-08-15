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
		
		// set jquery mobile param to true
		$.mobile.allowCrossDomainPages = true;
		
	});
})
.then('//webapp/lib/jquery.mobile.js', '//webapp/lib/jquery.mobile.css')
.then(function() {
	// show loader
	Loader.show();
})
// Libs
.then('//webapp/lib/flash_detect_min.js', '//webapp/lib/jquery-ui/jquery-ui.min.js', '//webapp/lib/mediaelement/mediaelement-and-player.js','//webapp/lib/toast/jquery.toastmessage.js', '//webapp/lib/jquery-impromptu.3.1.js', '//webapp/lib/iscroll.js')
// Load Core Templates
.then('//webapp/views/desktop.tmpl', '//webapp/views/tab-view.tmpl', '//webapp/views/login.tmpl', '//webapp/views/addcompanymobile.tmpl', '//webapp/views/profile.tmpl', '//webapp/views/panel.controlgroup.tmpl', '//webapp/views/manage.tmpl', '//webapp/views/manage.feed-infos.tmpl', '//webapp/views/manage.panels.tmpl', '//webapp/views/manage.source.tmpl', '//webapp/views/signup.tmpl', '//webapp/views/addcompany.tmpl', '//webapp/views/help.tmpl')
// Load Core CSS
.then('../lib/mediaelement/mediaelementplayer.css', '../lib/toast/jquery.toastmessage.css')
.then('../css/shared.css').then('../css/base.css').then('../css/management.css')
// Load Core Components
//.then('./models.js')
.then('./core.js')
.then('./desktop.js', './manage.js', './login.js', './signup.js', './profile.js', './addcompany.js', './help.js')
// Load Module Templates
.then('//webapp/views/module.tmpl', '//webapp/views/module.feed.tmpl', '//webapp/views/module.feed.management.tmpl', '//webapp/views/module.podcast.tmpl', '//webapp/views/module.podcast.management.tmpl', '//webapp/views/module.twitter.tmpl', '//webapp/views/module.twitter.tweet.tmpl', '//webapp/views/module.twitter.management.tmpl', '//webapp/views/module.prices.tmpl', '//webapp/views/module.prices.management.tmpl', '//webapp/views/module.portfolio.tmpl', '//webapp/views/module.portfolio.management.tmpl', '//webapp/views/module.agenda.tmpl', '//webapp/views/module.linkedin.tmpl', '//webapp/views/module.linkedin.management.tmpl', '//webapp/views/module.blinkx.tmpl', '//webapp/views/module.keyword.management.tmpl', '//webapp/views/module.keyword.tmpl')
// Load Modules
.then('../modules/feed.js', '../modules/podcast.js', '../modules/twitter.js', '../modules/prices.js', '../modules/portfolio.js', '../modules/agenda.js', '../modules/linkedin.js', '../modules/blinkx.js', '../modules/keyword.js')
// Init Finfore.net
.then(function(){	
	if(!(typeof window.hideBrowserNotice == 'function')) finfore.init();
});