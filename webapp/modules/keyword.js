/*
 * FinFore.net 
 * Keyword Module
 *
 */
 
// Define module
finfore.modules.keyword = function() {	
	// Keyword Module Management
	var management = function($container) {
		var category = 'keyword';
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];
		
		// get and render Keyword Managemenet template
		var template = $.View('//webapp/views/module.keyword.management.tmpl', {
			panels: finfore.data.panels.main.keyword
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
		
		// custom keyword functionality for column details		
		var saveDetails = function() {
			var $this = $(this),
				$details = $this.parents('.keyword-panel-settings:first'),
				$input = $details.parents('.mtab-content:first').prevAll('.mtab:first'),
				data = $.data($input[0], 'data'),
				feed_account = data.feed_account,
				text = $('.keyword-text', $details).val(),
				isAggregate = false;
				//followers = $('.keyword-followers', $details).val(),
			
			if($('.keyword-aggregate', $details).is(':checked')) isAggregate = true;			

			var feedAccountParams = {
				_id: feed_account._id,
				keyword_column_attributes: {
					is_aggregate: isAggregate,
					//follower: followers,
					keyword: text,
					_id: feed_account.keyword_column._id
				}
			};			
			
			$.ajax({
				url: finforeBaseUrl + '/feed_accounts/' + feedAccountParams._id + '.json',
				type: 'PUT',
				data: {
					feed_account: feedAccountParams
				},
				success: function(response) {
					$().toastmessage('showSuccessToast', finfore.manage.messages.updateColumn);
					
					// update data-store
					$.data($input[0], 'data', {
						feed_account: response
					});
				},
				error: function(response) {
					$().toastmessage('showErrorToast', finfore.manage.messages.errorUpdateColumn);
				}
			});

		};
		
		$panelContainer.delegate('.keyword-save', 'click', saveDetails);

	};
	
	var init = function($container, options) {
		var users = [];
		
		var timelineCount = 15,
			multiplier = 5,
			$content, 
			$tweets,
			$loadMore;
		
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
			
			var query = options.feed_account.keyword_column.keyword;			
			if(!query) {
				$container.removeClass('panel-loading');
				return false;
			};
			
			$.ajax({
				url: 'http://search.twitter.com/search.json',
				dataType: 'jsonp',
				data: {
					q: query,
					rpp: timelineCount
				},
				success: tweetCallback
			});
			
		};		
		
		var build = function() {
			
			var autorefresh,
				panelTitle = options.feed_account.name;			
			
			var moduleContent = $.View('//webapp/views/module.keyword.tmpl', {});
			var template = $.View('//webapp/views/module.tmpl', {
				title: panelTitle,
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
			
			$content = $('[data-role=content]', $container);
			$tweets = $('.tweets', $content);
			$loadMore = $('.load-more-tweets', $content);			
			
			$container.addClass('panel-loading');			
			
			$loadMore.click(function() {
				$container.trigger('refresh', [true]);
			});
			
			// render markup
			$container.page();			
			
			if(!finfore.smallScreen) {
				var autorefresh = setInterval(refresh, 300000);
			};	
			
			$container.trigger('init');			
		};
		
		build();

	};
	
	return {
		init: init,
		management: management
	}
}();