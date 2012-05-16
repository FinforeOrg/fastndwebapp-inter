/*
 * FinFore.net 
 * Podcast Module
 *
 */
 
// Define module
finfore.modules.podcast = function() {
	var multiplier = 15;
	
	// Podcast Module Management
	var management = function($container) {		
		var category = 'podcast';
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];
		
		// get and render Podcast Managemenet template
		var template = $.View('//webapp/views/module.podcast.management.tmpl', {		
			panels: finfore.data.panels.main.podcast
		});
		$(template).appendTo($container);		
		
		// panel management
		var $panelContainer = $('.mtabs-container', $container);
		
		finfore.manage.bindPanelData({
			$container: $panelContainer,
			category: category
			});
		
		finfore.manage.bindPanelData({
			$container: $panelContainer,
			category: category
			});
		
		$('.edit-column-title', $container).click(function() {
			finfore.manage.panels.edit({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});			
		});
		
		$('.add-column', $container).click(function() {			
			finfore.manage.panels.create({
				$node: $panelContainer,
				category: category
			});			
		});
		
		$('.remove-column', $container).click(function() {			
			finfore.manage.panels.remove({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});			
		});
		
		// sources events		
		$panelContainer.delegate('.add-custom-source', 'click', function() {
			finfore.manage.sources.addCustom({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});
		});
		
		$panelContainer.delegate('.remove-source', 'click', function() {
			finfore.manage.sources.remove({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});
		});
		
		// preset sources
		$('.add-preset-source', $container).click(function() {			
			finfore.manage.sources.addPreset({
				$node: $('.mtab:checked', $panelContainer),
				$presets: $('.preset-tabs', $container),
				category: category
			});			
		});		
		
		// make sources content droppable
		$('.mtab-content', $panelContainer).droppable({
			activeClass: "ui-state-highlight",
			drop: function(e, ui) {
				finfore.manage.sources.addPreset({
					$node: $('.mtab:checked', $panelContainer),
					$presets: $('.preset-tabs', $container),
					category: category
				});	
			}
		});		
		
		
		// init feed_infos
		var suggestedCount = allCount = 0;
		var $presetSuggested = $('.preset-sources-suggested', $container),
			$loadMoreSuggested = $('.load-more', $presetSuggested),
			$presetAll = $('.preset-sources-all', $container),
			$loadMoreAll = $('.load-more', $presetAll);
		
		var loadMoreSuggested = function() {
			suggestedCount++;
			finfore.manage.updateFeedInfos({
				$node: $presetSuggested,
				type: category,
				category: 'podcast',
				count: suggestedCount
			});
			return false;
		};
		
		var loadMoreAll = function() {
			allCount++;
			finfore.manage.updateFeedInfos({
				$node: $presetAll,
				type: category,
				category: 'all,podcast',
				count: allCount
			});
			return false;
		};
		
		// bind load more buttons
		$loadMoreSuggested.click(loadMoreSuggested);		
		$loadMoreAll.click(loadMoreAll);
		
		// load more suggested feeds
		loadMoreSuggested();
		loadMoreAll();

	};
	
	var videoExt = ['mp4', '3g2', '3gp', 'asf', 'asx', 'avi', 'flv', 'mov', 'mpg', 'rm', 'vob', 'webm', 'wmv', 'ogv', 'ogg'];
	
	// grab feed data
	var getFeedData = function(options) {
		
		feedReader.get({
			callbackId: options.callbackId,
			sources: options.sources,
			limit: options.limit,
			podcast: true,
			complete: function(entries) {
		
				// if loading more entries, slice the array to only show the latest 5
				if((options.loadMore === true) && (options.limit > 5)) {
					entries = entries.slice(options.limit - multiplier, options.limit);
				}				
				
				// parse entries
				var markup = '',
					entriesLength = entries.length - 1,
					filename;
				
				$.each(entries, function(index, value) {
				
					// check for podcast file
					filename = '';
					if(this.link) {
						filename = this.link;
					} else if(this.enclosure) {
						filename = this.enclosure.url;
					}
				
					if((options.loadMore === true || this.pubDate > options.date) && filename) {
					
						if(index === entriesLength) {
							markup += '<li class="last-in-group" data-icon="false">';
						} else {
							markup += '<li data-icon="false">';
						};

						// check file type
						var extension = filename.split('.').pop();				
						
						markup += '<abbr>' + this.source + '</abbr>';
						markup += '<h3><a href="' + this.link + '" target="_blank">' + this.title + '</a></h3>';
						
						if($.inArray(extension, videoExt) === 0) {
							markup += '<video src="' + filename + '" width="270" height="150" controls="controls" type="video/' + extension + '" preload="none"></video>';
						} else {
							markup += '<audio src="' + filename + '" controls="controls" type="audio/' + extension + '" preload="none"></audio>';
						}
						markup += '<p>' + this.description + '</p>';
						markup += '<abbr>' + this.pubDate.toUTCString() + '</abbr>';
						markup += '</li>';
					}
				});
				
				var $loadMoreLi = $('.load-more-entries', options.$container).parents('li').first(),
					$markup = $(markup),
					$content = $('[data-role=content] ul', options.$container);
					
				$markup.insertBefore($loadMoreLi);
				if($content.jqmData('listview')) {
					$content.listview('refresh');
				} else {
					$content.listview();
				}
				
				if(!finfore.smallScreen && !finfore.tablet && !finforeNative) {
					var $media = $('video, audio', $markup);
					$media.mediaelementplayer({
						audioWidth: 275,
						pluginPath: 'webapp/lib/mediaelement/'
					});	
				};
				
				options.$container.removeClass('panel-loading');
				
			}
		});
	
	};
	
	var init = function($container, options) {
		var feedNumber = 0,
			sources = [];
		
		sources = $.map(options.feed_account.user_feeds, function(n) {
			return n.feed_info.address;
		});
		
		var refresh = function(e, loadmore) {
			$container.addClass('panel-loading');			
			
			if(loadmore === true) {				
				feedNumber += multiplier;				
			};
			
			getFeedData({
				sources: sources,
				$container: $container,
				date: new Date(),
				loadMore: loadmore,				
				limit: feedNumber,
				callbackId: options.feed_account._id
			});			
			
		};		
		
		var build = function() {
			var contentHeight = $(document).height() - 220;			
			
			var moduleContent = $.View('//webapp/views/module.podcast.tmpl', {});
			var template = $.View('//webapp/views/module.tmpl', {
				title: options.feed_account.name,
				smallScreen: finfore.smallScreen,
				content: moduleContent
			});
			$(template).appendTo($container);
			
			var $loadMoreEntriesBtn = $('.load-more-entries', $container);				
			$loadMoreEntriesBtn.click(function(e) {				
				$container.trigger('refresh', [true]);
				
				e.preventDefault();
				return false;					
			});
			
			// bind panel events
			$container.bind('refresh', refresh);
			$container.bind('reinit', function() {
				// clear refresh interval
				clearInterval(autorefresh);
				// cleanup dom
				$container.unbind();
				$container.empty();
				$container.jqmRemoveData();
				
				// reinit
				init($container, options);
			});
			
			if(!finfore.smallScreen) {
				var autorefresh = setInterval(refresh, 300000);
			};
			
			// render markup
			$container.page();
			
			$container.trigger('init');			
		}();		
	
	};
	
	return {
		init: init,
		management: management
	}
}();