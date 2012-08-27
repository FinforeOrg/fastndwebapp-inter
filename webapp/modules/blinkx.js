/*
 * FinFore.net 
 * Blinkx Module
 *
 */
 
// Define module
finfore.modules.blinkx = function() {
	
	var videoExt = ['mp4', '3g2', '3gp', 'asf', 'asx', 'avi', 'flv', 'mov', 'mpg', 'rm', 'vob', 'webm', 'wmv', 'ogv', 'mp4', 'ogg'];
	
	// grab data
	var getBlinkxData = function(options) {
		
		// replace spaces with +
		options.company.feed_info.company_competitor.broadcast_keyword = options.company.feed_info.company_competitor.broadcast_keyword.replace(/ /g, '+');
		
		// remove double quotes
		options.company.feed_info.company_competitor.broadcast_keyword = options.company.feed_info.company_competitor.broadcast_keyword.replace(/"/g, '');
		
		// remove &
		options.company.feed_info.company_competitor.broadcast_keyword = options.company.feed_info.company_competitor.broadcast_keyword.replace(/&/g, '');
		
		// escape special chars
		options.company.feed_info.company_competitor.broadcast_keyword = escape(options.company.feed_info.company_competitor.broadcast_keyword);
		
		// yql and blinkx api
		var yqlUrl = 'http://query.yahooapis.com/v1/public/yql',
			blinkxUrl = 'http://usp1.blinkx.com/partnerapi/user/?uid=2ehiek5947&text=%22' + options.company.feed_info.company_competitor.broadcast_keyword + '%22&start=' + options.start + '&MaxResults=' + options.end + '&sortby=date&AdultFilter=true&ReturnLink=true',
			q = 'select * from xml where url=\'' + blinkxUrl + '\'', // YQL query
			callbackName = 'blinkxModuleCallback' + options.company._id; // generate callback name based on unique _id, for YQL caching
		
		// generated callback
		window[callbackName] = function(response) {
			blinkxCallback(response, options); // call real callback with params
		};
		
		// YQL call
		$.ajax({
			url: yqlUrl,
			dataType: 'jsonp',
			jsonpCallback: callbackName,
			cache: true,
			data: {
				q: q,
				format: 'json',
				_maxage: 300,
				diagnostics: false
			}
		});	
	};
	
	var init = function($container, options) {
		var start = 0,
			end = 0,
			multiplier = 20;
		
		var refresh = function(e, loadmore) {
			$container.addClass('panel-loading');			
			
			if(loadmore === true) {
				start = end + 1;
				end += multiplier;
				
				getBlinkxData({
					start: start,
					end: end,
					date: new Date(),
					loadMore: loadmore,
					company: options.company,
					$container: $container
				});			
			
			} else {
				
				getBlinkxData({
					start: 1,
					end: end,
					date: new Date(),
					loadMore: loadmore,
					company: options.company,
					$container: $container
				});
				
			};			
			
			
		};		
		
		var build = function() {
			var contentHeight = $(document).height() - 220;			
			
			var moduleContent = $.View('//webapp/views/module.blinkx.tmpl', {});
			var template = $.View('//webapp/views/module.tmpl', {
				title: 'Broadcast News',
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
		init: init
	}
}();

// yql callback
var blinkxCallback = function(result, params) {
	var hits = [],
		hit,
		markup,
		entriesLength,
		date,
		extension,
		title,
		source,
		summary,
		image,
		url,
		pubDate;
	
	// check for response
	if(result.query.results && result.query.results.response.responsedata) hits = result.query.results.response.responsedata.hit;

	if(hits) {
	
		// cache length
		entriesLength = hits.length - 1;
		
		$.each(hits, function(index, value) {
			hit = this;
			
			date = hit.date;
			extension = hit.media_format_string;
			title = hit.title;
			source = hit.channel;
			summary = hit.summary;
			image = hit.staticpreview;
			url = hit.url;
			
			// check date
			pubDate = new Date(date * 1000);					
			
			if(finfore.smallScreen || touchSupport) {
				url = url.replace('http://www.blinkx.com/burl?v=', 'http://m.blinkx.com/info/');
			};
			
			if((params.loadMore === true) || (pubDate > params.date)) {
				if(index === entriesLength) {
					markup += '<li class="last-in-group" data-icon="false">';
				} else {
					markup += '<li data-icon="false">';				
				};
				
				markup += '<a href="' + url + '" target="_blank"><abbr>' + source + '</abbr>';
				markup += '<h3>' + title + '</h3>';
				
				markup += '<img src="' + image + '" />';
				
				markup += '<p>' + summary.substring(0, 100) + '..' + '</p>';
				markup += '<abbr>' + pubDate.toUTCString() + '</abbr>';
				markup += '</a></li>';
			}
		});
		
		var $loadMoreLi = $('.load-more-entries', params.$container).parents('li').first();
		var $markup = $(markup);
		$markup.insertBefore($loadMoreLi);
		
		var $listview = $('[data-role=content] ul', params.$container);
		$listview.listview('refresh');
		
	};
	
	params.$container.removeClass('panel-loading');

};