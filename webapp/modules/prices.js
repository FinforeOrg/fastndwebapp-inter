/*
 * FinFore.net 
 * Feed Module
 *
 */
 
// Define module
finfore.modules.prices = function() {
	// Prices Module Management
	var management = function($container) {
		var category = 'prices';
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];
		
		// get and render Prices Managemenet template
		var template = $.View('//webapp/views/module.prices.management.tmpl', {
			panels: finfore.data.panels.main.prices
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
				category: 'chart',
				count: suggestedCount
			});
			return false;
		};
		
		var loadMoreAll = function() {
			allCount++;
			finfore.manage.updateFeedInfos({
				$node: $presetAll,
				type: category,
				category: 'all,chart',
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
		var feedNumber;
					
		var multiplier = feedNumber;
				
		if(!options.company) {
			var feed_info_ids = $.map(options.feed_account.user_feeds, function (element) { return element.feed_info_id; });
		};
		var dataNumber = 10;
		var multiplier = dataNumber;
	
		var createPriceMarkup = function(tickers) {
			var i = 0;
			var ticker_data = '';
			var currentCompanyTicker;
			
			if(options.company) {
				// Current company ticker
				var tickers = options.company.feed_info.company_competitor.company_ticker + ',';
				currentCompanyTicker = options.company.feed_info.company_competitor.company_ticker;				
				
				// Competitors tickers
				tickers += options.company.feed_info.company_competitor.competitor_ticker;
				ticker_data = tickers;
			
			} else {
				
				// aditional conditional to check if any price tickers are set
				if(options.feed_account.user_feeds[0]) {
				
					var tickers = options.feed_account.user_feeds[0].feed_info.price_tickers;
					$.each(tickers, function(i, e) {
						ticker_data += e.ticker + ',';
					});
					
				};
				
			}
			
			/* If ticker_data is still empty, there was an error with the web service,
			 * so we won't go any further.
			 */
			if(!ticker_data) {
				return false;
				
				// remove loading indicator when request is finished
				$container.removeClass('panel-loading');
			};
			
			// remove all spaces (if they exist, because of web service error) from tickers				
			ticker_data = ticker_data.replace(/\s/g, '');
			
			// TODO: use YQL
			
			$.ajax({
				url: 'http://www.google.com/finance/info?infotype=infoquoteall&q=' + ticker_data,
				dataType: 'jsonp',
				success: function(stocks) {					
					var markup = '';					
					var stocksList = [];
					
					$.each(stocks, function(i, n) {
						var symbol = n.e + ':' + n.t,
							company = n.name,
							anchor = '<a href="http://www.google.com/finance?q=' + symbol + '" target="_blank">';
						
						// convert string floats
						n.c = parseFloat(n.c);
						n.cp = parseFloat(n.cp);
						
						// update ticker
						if(!(options.company && finfore.smallScreen)) {
							if(Math.abs(n.cp) > finfore.ticker.priceBridge) {
								finfore.ticker.updatePrices(n);
							};
						};
						
						var price = n.l,
						chg = n.c,
						pct_chg = n.cp;

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
						
						stocksList.push({
							stock: symbol,
							price: price * 1
						});
					});					
					
					$(markup).appendTo($('tbody', $container));

					if(options.company) {
						// Remove the first item, as it is the company itself.
						stocksList.shift();
						
						if(FlashDetect.installed) {
							var $stockChart = $('<embed height="340" menu="false" flashvars="displayVolume=true&amp;displayDividends=true&amp;displaySplits=true&amp;displayExtendedHours=true&amp;defaultZoomDays=true&amp;hasVolume=true&amp;hasExtendedHours=true&amp;defaultZoomDays=5&amp;q=' + currentCompanyTicker + '&amp;lcId=1302290366141&amp;compareTo=' + stocksList[0].stock + '%3B' + stocksList[1].stock + '%3B&amp;single_viewpoints=name%3AMainViewPoint%2Cheight%3A202%2CtopMargin%3A0%3A%3Aname%3ABottomViewPoint%2Cheight%3A45%2CtopMargin%3A0%2Cdisplay%3Avisible&amp;single_layers=vp%3AMainViewPoint%2Cname%3ADateLinesLayer%2Carity%3AUnique%2CtickPosition%3A0%2Ctype%3Asimple%2ChasText%3Atrue%3A%3Avp%3AMainViewPoint%2Cname%3APriceLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ALineChartLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3AAHLineChartLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ALastDayLineLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ABottomBarLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3AIndependentObjectsLayer%2Carity%3AUnique%2Ctype%3Asimple%2CrenderObj%3Adividend%2Cpositioning%3Abottom%2CavoidObj%3Asplit%3A%3Avp%3AMainViewPoint%2Cname%3AIndependentObjectsLayer%2Carity%3AUnique%2Ctype%3Asimple%2CrenderObj%3Asplit%2Cpositioning%3Abottom%2CavoidObj%3Adividend%3A%3Avp%3ABottomViewPoint%2Cname%3AVolumeScaleLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3ABottomViewPoint%2Cname%3AECNVolume%2Carity%3AUnique%2Ctype%3Aindicator%3A%3Avp%3ABottomViewPoint%2Cname%3AVolume%2Carity%3AUnique%2Ctype%3Aindicator%3A%3Avp%3ABottomViewPoint%2Cname%3ADateLinesLayer%2Carity%3AUnique%2CtickPosition%3A1%2Ctype%3Asimple&amp;compare_viewpoints=name%3AMainViewPoint%2Cheight%3A247%2CtopMargin%3A15&amp;compare_layers=vp%3AMainViewPoint%2Cname%3APercentLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3ADateLinesLayer%2Carity%3AUnique%2Ctype%3Asimple%2CtickPosition%3A0%3A%3Avp%3AMainViewPoint%2Cname%3ABottomBarLayer%2Carity%3AUnique%2Ctype%3Asimple%3A%3Avp%3AMainViewPoint%2Cname%3APercentLineChartLayer%2Carity%3AMultiple%2Ctype%3Asimple&amp;u=http://www.google.com/finance/getprices&amp;fieldSeparator=%2C&amp;objectSeparator=%3A%3A&amp;sparklineType=dynamic&amp;hasDefaultZoomSetting=true&amp;verticalScaling=maximized&amp;hasVerticalScaleSetting=true&amp;snapping=false&amp;minZoomDays=1&amp;infoTextAlign=left&amp;infoTextTopPadding=17&amp;disableExternalInterface=true" width="100%" base="http://www.google.com/finance/" wmode="opaque" type="application/x-shockwave-flash" src="http://www.google.com/finance/chart9.swf"></embed>');
						} else {							
							var $stockChart = $('<img src="http://www.google.com/finance/chart?q=' + currentCompanyTicker + '&cht=o&p=5d" class="image-stocks-chart">');
						}
						$stockChart.prependTo($container.find('[data-role=content]'));
					};					
				
				},
				complete: function() {
					// remove loading indicator when request is finished
					$container.removeClass('panel-loading');
				}
			});	
		};
	
		var loadData = function(event,params) {			
			$container.addClass('panel-loading');
			var markup = '';
			var tickers = [];
			var ticker_data = '';
			
			createPriceMarkup();
		};
		
		var refresh = function(event, params) {
			dataNumber = 10;
			multiplier = dataNumber;
			
			// empty table content
			$('.ui-content table tbody', $container).empty();
			
			// remove charts, both flash and img based
			$('.ui-content > embed, .ui-content > img', $container).remove();
			
			loadData();
		};
		
		var build = function() {
			var contentHeight = $(document).height() - 220;
			if(options.company) {
				var title = "Prices";				
			} else {				
				var title = options.feed_account.name;				
			}
			
			if(!$container || !$container.length) {
				sandbox.debug('No container set for Module! Module *Feed* will not initalize!' , 'warn');
				return;
			};
			
			var moduleContent = $.View('//webapp/views/module.prices.tmpl', {});
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