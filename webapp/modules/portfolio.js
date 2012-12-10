/*
 * FinFore.net
 * Portfolio Module
 * 
 */
 
// Define module
finfore.modules.portfolio = function() {
	// Portfolios Module Management
	var management = function($container) {		
		var category = 'portfolio';
		
		// get and render Twitter Managemenet template
		var template = $.View('//webapp/views/module.portfolio.management.tmpl', {
			portfolios: finfore.data.portfolios
		});
		$(template).appendTo($container);
		
		// panel management
		var $panelContainer = $('.mtabs-container', $container);		
		
		finfore.manage.bindPanelData({
			$container: $panelContainer,
			category: category
		});			
		
		$('.edit-portfolio', $container).click(function() {
			finfore.manage.panels.edit({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});				
		});
		
		$('.add-portfolio', $container).click(function() {			
			finfore.manage.panels.create({
				$node: $panelContainer,
				category: category
			});
		});
		
		$('.remove-portfolio', $container).click(function() {			
			finfore.manage.panels.remove({
				$node: $('.mtab:checked', $panelContainer),
				category: category
			});			
		});			

	};
	
	var init = function($container, options) {		
		var feedNumber;

		var multiplier = feedNumber;		
				
		var dataNumber = 10;
		var multiplier = dataNumber;		
		
		var loadData = function(event,params){
			
			$container.addClass('panel-loading');
			var markup='';
			var tickers = new Array();
			var ticker_data = '';
			
			if(options.portfolio.overview.rss.chanel.item) {
				var i = 0;						
				var ticker_data = '';
				
				if($.isArray(options.portfolio.overview.rss.chanel.item)) {
					$.each(options.portfolio.overview.rss.chanel.item, function(i, n) {
						if(this.google_ticker) {							
							ticker_data += n.google_ticker + ',';
						}
					});
				} else {
					ticker_data = options.portfolio.overview.rss.chanel.item.google_ticker;
				}				
				
				// remove all spaces (if they exist, because of web service error) from tickers
				ticker_data = ticker_data.replace(/\s/g, '');
				
				$.ajax({
					url: 'http://www.google.com/finance/info?infotype=infoquoteall&q=' + ticker_data,
					dataType: 'jsonp',
					success: function(stocks) {
						var markup = '';
						
						$.each(stocks, function(i, n) {
							var symbol = n.e + ':' + n.t,
								company = n.name,
								anchor = '<a href="http://www.google.com/finance?q=' + symbol + '" target="_blank">';
							
							var price = n.l,
							chg = parseFloat(n.c),
							pct_chg = parseFloat(n.cp);

							if(company) {
								company = anchor + company + '</a>';
							
								if(!finfore.smallScreen) {
									price = anchor + price + '</a>';
									chg = anchor + chg + '</a>';
									pct_chg = anchor + pct_chg + '</a>';
								};
								
								markup += '<tr class="ui-btn-up-c">';
								markup += '<td>' + company + '</td>';
								markup += '<td>' + price + '</td>';
								
								if(chg < 0) {
									markup += '<td class="negative nowrap">' + chg + '</a></td>';
								} else {
									markup += '<td class="nowrap">' + chg + '</a></td>';
								}
								
								if(pct_chg < 0) {
									markup += '<td class="negative nowrap">' + pct_chg + '</a></td>';
								}
								else {
									markup += '<td class="nowrap">' + pct_chg + '</a></td>';
								}
								
								markup += '</tr>';
							};
						});
						
						$(markup).appendTo($('tbody', $container));								
						$container.removeClass('panel-loading');							
					},
					complete: function() {
						$container.removeClass('panel-loading');
					}
				});
			} else {
				$container.remove();
			}

		};
	
		var refresh = function(event, params) {	
			dataNumber = 10;
			multiplier = dataNumber;
			
			empty($('[data-role=content] tbody', $container)[0]);
			
			loadData();
			  
		};
		
		var build = function() {			
			//var connected = (!options.panel.feed_account.feed_token || !options.panel.feed_account.feed_token.token);
			
			var moduleContent = $.View('//webapp/views/module.portfolio.tmpl', {});
			var template = $.View('//webapp/views/module.tmpl', {
				title: options.portfolio.title,
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
		init: init,
		management: management
	}
}();