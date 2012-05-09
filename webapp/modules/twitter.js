/*
 * FinFore.net 
 * Feed Module
 *
 */
 
// Define module
finfore.modules.twitter = function() {	
	// Twitter Module Management
	var management = function($container) {
		var category = 'twitter';
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];
		
		// get and render Twitter Managemenet template
		var template = $.View('//webapp/views/module.twitter.management.tmpl', {
			panels: finfore.data.panels.main.twitter
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
		
		// users events		
		$panelContainer.delegate('.add-custom-source', 'click', function() {
			finfore.manage.twitter.addCustom({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});
		});
		
		$panelContainer.delegate('.remove-source', 'click', function() {
			finfore.manage.twitter.remove({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});
		});
		
		// preset users
		$('.add-preset-source', $container).click(function() {			
			finfore.manage.twitter.addPreset({
				$node: $('.mtab:checked', $panelContainer),
				$presets: $('.preset-tabs', $container),
				category: category
			});			
		});		
		
		// make sources content droppable
		$('.mtab-content', $panelContainer).droppable({
			activeClass: "ui-state-highlight",
			drop: function(e, ui) {
				finfore.manage.twitter.addPreset({
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
				category: 'twitter',
				count: suggestedCount
			});
			return false;
		};
		
		var loadMoreAll = function() {
			allCount++;
			finfore.manage.updateFeedInfos({
				$node: $presetAll,
				type: category,
				category: 'all,twitter',
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
	
	var init = function($container, options) {
		var tweetTemplate;
		
		var timelineCount = 20, multiplier = 5;
		var $content, $tweets, $loadMore, $connectButton, $pinForm;	
		
		var tweetCallback = function(tweets) {
			empty($tweets[0]);
			$container.removeClass('panel-loading');
			
			if(tweets.results) tweets = tweets.results;
			
			$.each(tweets, function() {
				this.html = $.linkUrl(this.text);				
				
				if(this.user) {
					this.screen_name = this.user.screen_name;
					this.profile_image_url = this.user.profile_image_url;
				};
			});
			
			tweetTemplate = $.View('//webapp/views/module.twitter.tweet.tmpl', {
								tweets: tweets
							});
			
			$tweets.append(tweetTemplate);
			
			if(tweets) {
				$.each(tweets, function() {
					var tweetDate = new Date(this.created_at);
					
					if(!(options.company && finfore.smallScreen)) {
						if(tweetDate > finfore.ticker.shortDate) {
							finfore.ticker.updateNews(this);
						};
					};
				});
			};
		};
		
		var refresh = function(loadmore) {
			$container.addClass('panel-loading');
			
			if(loadmore === true) {
				timelineCount += multiplier;			
			};			
			
			$tweets.removeData();
			if(options.company) {
				$tweets.unbind('load');				
				
				var query;
				if(options.competitor) {					
					query = options.company.feed_info.company_competitor.keyword.replace(/,/g,' OR ');					
				} else {
					query = options.company.feed_info.company_competitor.company_ticker + ' OR ' + options.company.feed_info.company_competitor.broadcast_keyword;
				}
				
				$.ajax({
					url: 'http://search.twitter.com/search.json',
					dataType: 'jsonp',
					data: {
						q: query,
						rpp: timelineCount
					},
					success: tweetCallback
				});
				
			} else {
			
				$.ajax({
					url: finforeBaseUrl + '/tweetfores/home_timeline.json',
					type: 'POST',
					data: {
						auth_token: finfore.data.user.single_access_token,
						auth_secret: finfore.data.user.persistence_token,
						feed_account_id: options.feed_account._id,
						count: timelineCount
					},
					success: tweetCallback
				});
				
			};
			
		};
		
		var build = function() {
			var autorefresh,
				panelTitle,
				connected = false;
			
			if(options.company) {
				panelTitle = 'Breaking News';
				
				if(options.competitor) panelTitle = 'Competitors News';
			}
			
			if(!options.company) {
				panelTitle = options.feed_account.name;
				connected = (!options.feed_account.feed_token || !options.feed_account.feed_token.token);
			};
			
			var moduleContent = $.View('//webapp/views/module.twitter.tmpl', {
				connected: !connected
			});
			var template = $.View('//webapp/views/module.tmpl', {
				title: panelTitle,				
				smallScreen: finfore.smallScreen,
				content: moduleContent
			});
			$(template).appendTo($container);
			
			$content = $('[data-role=content]', $container);
			$tweets = $('.tweets', $content);
			$loadMore = $('.load-more-tweets', $content);
			$connectButton = $('.twitter-connect-button', $container);			
			
			$container.addClass('panel-loading');			
						
			// if a token is not set
			if(connected) {
				refresh();
				//var authUrl = options.feed_account.feed_token.url_oauth;
				var authUrl = finforeBaseUrl + '/feed_accounts/twitter/auth?feed_account_id=' + options.feed_account._id;
				
				$connectButton.click(function() {
					$connectButton.hide();
					$container.addClass('panel-loading');
												
					var authWindow = window.open(authUrl, 'twitterAuthWindow', 'resizable=yes,scrollbars=yes,status=yes');
					
					/* Because we can't use the onunload event properly on the popup,
					 * we have to check the token from the server at an interval with an ajax call.
					 * If the call returns a proper feed, the account has been authorized,
					 * else we keep repeating the call.
					 */					
					var checkAuth = function() {
						$.ajax({
							url: finforeBaseUrl + '/feed_tokens.json',
							type: 'POST',
							data: {
								auth_token: finfore.data.user.single_access_token,
								feed_token: {
									feed_account_id: options.feed_account.id,
									user_id: options.feed_account.user_id
								}
							},
							success: function(token) {								
								if(token.feed_token && token.feed_token.token) {
									options.feed_account.feed_token = token.feed_token;
									
									empty($container[0]);
									$container.removeClass('panel-loading');
									$container.removeData();
									
									build();
								} else {
									// If the popup is still open, Check the token again after 10sec
									if(!authWindow.closed) {
										setTimeout(checkAuth, 10000);
									} else {
										$connectButton.show();
										$container.removeClass('panel-loading');
									}

								}
							}
						});
					};					
					checkAuth();
					
					return false;
				});

			} else {
			
				if(!finfore.smallScreen) {
					var autorefresh = setInterval(refresh, 300000);
				};
				
			};
			
			$loadMore.click(function() {
				$container.trigger('refresh', [true]);
			});
			
			// render markup
			$container.page();
			
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
			
			$container.trigger('init');			
		};
		
		build();

	};
	
	return {
		init: init,
		management: management
	}
}();