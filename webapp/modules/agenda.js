/*
 * FinFore.net 
 * Feed Module
 *
 */
 
// Define module
finfore.modules.agenda = function() {
	
	var init = function($container, options) {
		
		var loadData = function(params) {
			params.$container.addClass('panel-loading');
			
			var markup = '',
				ticker_data = '',
				columnId; // needed for company and portfolios
			
			if(options.company) {
				// company id
				columnId = options.company._id;
				
				if(options.competitor) {
					ticker_data = options.company.feed_info.company_competitor.competitor_ticker;
					
					// different callbackId for competitor calendars
					// to prevent creating the same callback for multiple calendar columns
					columnId += 'competitor';
				} else {
					ticker_data = options.company.feed_info.company_competitor.company_ticker;					
				};
				
			} else {
				
				if($.isArray(options.portfolio.overview.rss.chanel.item)) {
					$.each(options.portfolio.overview.rss.chanel.item, function(i) {
						if(this.google_ticker) {
							ticker_data += this.google_ticker + ',';
						}
					});
				} else {
					
					// data validation in case channel is returned empty from api
					if(options.portfolio.overview.rss.chanel.item) {
						ticker_data = options.portfolio.overview.rss.chanel.item.google_ticker;
					};
				};
				
				// portfolio id
				columnId = options.portfolio.id_bare;
			};			
			
			/* If ticker_data is still empty, there was an error with the web service,
			 * so we won't go any further.
			 */
			if(!ticker_data) return false;
			
			// remove all spaces (if they exist, because of web service error) from tickers			
			ticker_data = ticker_data.replace(/\s/g, '');
			
			var yqlUrl = 'http://query.yahooapis.com/v1/public/yql',
				q = 'select * from json where url="http://www.google.com/finance/events?output=json&q=' + ticker_data + '"', // YQL query
				callbackName = 'agendaModuleCallback' + columnId; // generate callback name based on unique _id, for YQL caching
			
			// generated callback
			window[callbackName] = function(response) {
				agendaCalendarCallback(response, params); // call real callback with params
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
	
		var refresh = function(event, params) {
			
			empty($('[data-role=content] .events-months-container', $container)[0]);
			
			// time to breath
			// make sure it gets the right container
			loadData({
				$container: $container
			});
		};
		
		var build = function() {	
			var contentHeight = $(document).height() - 220;			
			if(options.company) {
				var title = "Calendar";
				if(options.competitor) title = "Competitors Calendar";
			} else {
				if(options.portfolio) {
					var title = options.portfolio.title
				} else {
					var title = options.feed_account.name;
				};
			}
			
			var moduleContent = $.View('//webapp/views/module.agenda.tmpl', {});
			var template = $.View('//webapp/views/module.tmpl', {
				title: title,
				smallScreen: finfore.smallScreen,
				content: moduleContent
			});
			$(template).appendTo($container);
			
			if(!finfore.smallScreen) {
				var autorefresh = setInterval(refresh, 300000);
			};
			
			// render markup
			$container.page();

			// bind panel events
			$container.bind('refresh', refresh);
		
			$container.trigger('init');	
		};
		
		build();
	};
	
	return {
		init: init		
	}
}();

// yql callback
var agendaCalendarCallback = function(result, params) {
	var currentMonth = '',
		markup = '',
		calendar = [],
		today = new Date(),
		itemDate;
	
	if(result.query.results) calendar = result.query.results.json.events;

	if($.isArray(calendar) && calendar.length) {
		calendar = calendar.reverse(); // reverse to have the most recent events first
	
		$.each(calendar, function() {
			// get calendar date
			itemDate = new Date(this.LocalizedInfo.start_date);
			// reset hour
			itemDate.setHours(0);
			
			if(itemDate >= today) {
				var date = this.LocalizedInfo.start_date,
					event_name = this.desc,
					myregexp = /^[A-Za-z]{3}/,
					match = myregexp.exec(date),
					myregexp_year = /[0-9]{4}$/,
					match_year = myregexp_year.exec(date);
				
				if (match != null) {
					result = match[0];
				};
				
				if (match_year != null) {
					result_year = match_year[0];
				};
				
				if(currentMonth != result) {
					if(currentMonth == '') {
						currentMonth = result;							
						markup += '<div class="events-month"><table class="events-table"><thead><tr class="ui-bar-a"><td colspan="2">' + currentMonth + ' ' + result_year + '</td></tr></thead><tbody>';
					} else {
						currentMonth = result;
						markup += '</tbody></table></div><div class="events-month"><table class="events-table"><thead><tr class="ui-bar-a"><td colspan="2">' + currentMonth + ' ' + result_year + '</td></tr></thead><tbody>';	
					}
				}
				
				markup += '<tr class="ui-btn-up-c">';
				markup += '<td>' + date + ', ';
				if(this.LocalizedInfo.start_time) {
					markup += this.LocalizedInfo.start_time;
				} else {
					markup += 'All Day';
				}
				markup += '</td><td>' + event_name + '</td>';						
				markup += '</tr>';
			};
		});
	}
	
	if(!markup) {
		markup = '<table class="events-table"><thead><tr><td class="ui-bar-d">No upcoming events </td></tr></thead></table>';
	};
	
	$(markup).appendTo($('.events-months-container', params.$container));
	
	params.$container.removeClass('panel-loading');
};