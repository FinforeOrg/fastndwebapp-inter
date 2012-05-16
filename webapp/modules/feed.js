/*
 * FinFore.net 
 * Feed Module
 *
 */
 
// Define module
finfore.modules.feed = function() {
	var multiplier = 15;
	
	// Feed Module Management
	var management = function($container) {
		var category = 'feed';	
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];
		
		// get and render Podcast Managemenet template
		var template = $.View('//webapp/views/module.feed.management.tmpl', {		
			panels: finfore.data.panels.main.feed
		});
		$(template).appendTo($container);		
		
		// panel management
		var $panelContainer = $('.mtabs-container', $container);		
		
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
				category: 'rss',
				count: suggestedCount
			});
			return false;
		};
		
		var loadMoreAll = function() {
			allCount++;
			finfore.manage.updateFeedInfos({
				$node: $presetAll,
				type: category,
				category: 'all,rss',
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

	// grab feed data
	var getFeedData = function(options) {
		
		// copy the array so that we can modify the urls, without affecting the original
		var sources = options.sources.slice(0);
		
		// detect if Bing API, to add count offset to url
		if(options.bingsearch && options.limit > multiplier) {
			sources[0] += '&news.offset=';
			sources[0] += (options.limit * 1) - 14;
		}
		
		feedReader.get({
			callbackId: options.callbackId,
			sources: sources,
			limit: options.limit,
			
			bingsearch: options.bingsearch,
			blogsearch: options.blogsearch,
			company: options.company,
			
			complete: function(entries) {
				
				// if loading more entries, slice the array to only show the latest 10
				if(!options.bingsearch && ((options.loadMore === true) && (options.limit > multiplier))) {
					entries = entries.slice(options.limit - multiplier, options.limit);
				};
				
				// parse entries
				var markup = '',
					entriesLength = entries.length - 1;
				
				$.each(entries, function(index) {
					// check date
					if((options.loadMore === true) || (this.pubDate > options.date)) {
						if(index === entriesLength) {
							markup += '<li class="last-in-group" data-icon="false">';
						} else {
							markup += '<li data-icon="false">';
						};
						
						if(finfore.smallScreen) {
							markup += '<a><abbr>' + this.source + '</abbr>';
							markup += '<h3>' + this.title + '</h3>';
							markup += '<abbr>' + this.pubDate.toUTCString() + '</abbr>';
							markup += '</a><a href="' + this.link + '" target="_blank" class="mobile-column-select"></a>';
						} else {
							markup += '<a href="' + this.link + '" target="_blank"><abbr>' + this.source + '</abbr>';
							markup += '<h3>' + this.title + '</h3>';
							markup += '<p>' + this.description + '</p>';
							markup += '<abbr>' + this.pubDate.toUTCString() + '</abbr>';
							markup += '</a>';
						}
						
						markup += '</li>';

						if(!options.company || !finfore.smallScreen) {
							if(this.pubDate > finfore.ticker.date) {
								finfore.ticker.updateNews(this);
							};
						};
					}
					
				});
				
				var $loadMoreLi = $('.load-more-entries', options.$container).parents('li').first();
				$(markup).insertBefore($loadMoreLi);
				
				var $content = $('[data-role=content] ul', options.$container);
				if($content.jqmData('listview')) {
					$content.listview('refresh');
				} else {
					$content.listview();
				}	
				
				options.$container.removeClass('panel-loading');
			}
		});
		
	};
	
	var init = function($container, options) {
		var feedNumber = 0,
			sources = [];
		
		// Company News
		if(options.company) {
			
			var sourceUrl;
			if(options.blogsearch) {
				sourceUrl = 'http://www.google.com/search?hl=en&q=' + $.URLEncode(options.company.feed_info.company_competitor.blog_keyword) + '&ie=utf-8&tbm=blg&num=100&output=rss';
			} else if(options.bingsearch) {
				// replace the ',' character in the string with ' OR ', to be compatible with Bing Search API
				options.company.feed_info.company_competitor.bing_keyword = options.company.feed_info.company_competitor.bing_keyword.replace(',', ' OR ');
				
				sourceUrl = 'http://api.bing.com/rss.aspx?Source=News&Market=en-US&Version=2.0&Query=' + $.URLEncode(options.company.feed_info.company_competitor.bing_keyword) + '&news.count=' + multiplier;
			} else {
				sourceUrl = 'http://www.google.com/finance/company_news?q=' + options.company.feed_info.company_competitor.finance_keyword + '&authuser=0&output=rss&num=100';
			}
			
			sources = [sourceUrl];			
		}
		
		// Portfolio News
		if(options.portfolio && options.portfolio.overview.rss.chanel.item) {
			if($.isArray(options.portfolio.overview.rss.chanel.item)) {
				$.each(options.portfolio.overview.rss.chanel.item, function() {
					sources.push('http://www.google.com/finance/company_news?q=' + this.google_ticker + '&authuser=0&output=rss');
				});
			} else {
				sources = ['http://www.google.com/finance/company_news?q=' + options.portfolio.overview.rss.chanel.item.google_ticker + '&authuser=0&output=rss'];
			}
		};
		
		// Main
		if(options.feed_account && !options.portfolio) {
			sources = $.map(options.feed_account.user_feeds, function(n) {
				return n.feed_info.address;
			});
		};
		
		var refresh = function(e, loadmore) {
			$container.addClass('panel-loading');
			
			if(loadmore === true) {
				feedNumber += multiplier;
			};
			
			var callbackId;
			if(options.feed_account) {
				callbackId = options.feed_account._id;
			} else if(options.company) {
				// prevent multiple feed columns in the same company
				// from having the same callback
				callbackId = options.company._id;
				if(options.blogsearch) callbackId += 'blogsearch';
				if(options.bingsearch) callbackId += 'bingsearch';
			}
			
			getFeedData({
				sources: sources,
				$container: $container,
				date: new Date(),
				loadMore: loadmore,
				limit: feedNumber,
				blogsearch: options.blogsearch,
				bingsearch: options.bingsearch,
				company: options.company,
				callbackId: callbackId
			});
			
		};		
		
		var build = function() {		
			var contentHeight = $(document).height() - 220;
			if(options.feed_account) {
				var title = options.feed_account.name;
			}
			if(options.portfolio) {
				title = options.portfolio.title
			};
			if(options.company) {
				var title = 'Company News';
				if(options.blogsearch) {
					title = 'News from Blogs';
				}
				if(options.bingsearch) {
					title = 'Additional News';
				}
			}
			
			var moduleContent = $.View('//webapp/views/module.feed.tmpl', {
				smallScreen: finfore.smallScreen
			});
			
			var template = $.View('//webapp/views/module.tmpl', {
				title: title,
				smallScreen: finfore.smallScreen,
				content: moduleContent
			});
			$(template).appendTo($container);
			
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
			
			var $loadMoreEntriesBtn = $('.load-more-entries', $container);				
			$loadMoreEntriesBtn.click(function(e) {				
				$container.trigger('refresh', [true]);
				
				e.preventDefault();
				return false;
			});
			
			if(!finfore.smallScreen) {
				var autorefresh = setInterval(refresh, 300000);
			};
			
			// render markup
			$container.page();
			
			// trigger init event
			$container.trigger('init');
		}();
	
	};
	
	return {
		init: init,
		management: management
	}
}();