/*
 * Finfore.net 
 * Mobile Desktop Component
 * 
 */

// Define Desktop
finfore.desktop = function() {
	var nodes = {
		$page: [],
		tabs: {
			tabIndex: 0
		},
		$firstColumn: []
	};
	
	var switchedToFirstColumn = false;
	
	// private utility method for main and portfolio dividers
	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	// refresh loaded columns
	var refreshLoadedColumns = function() {
		var $loadedColumns = $('.column-loaded', finfore.$body),
			$refreshIcon = $('.refresh-logo', $(this));
		
		// rotate logo
		$refreshIcon.addClass('refresh-logo-rotate');
		
		// trigger refresh on loaded columns
		$loadedColumns.trigger('refresh');
		
		// stop logo rotation in 2s
		setTimeout(function() {
			$refreshIcon.removeClass('refresh-logo-rotate');
		}, 2000);
	};
	
	var tabs = {};
	/*
	 * Add Tab
	 */
	tabs.add = function(options) {
		var isCompany = (options.id !== 'main' && options.id !== 'portfolio'),
			$tab,
			tabMarkup;
		
		if(isCompany) {
			// companies
			tabMarkup = '<li class="company-item"><div data-role="collapsible" data-collapsed="true" data-theme="b" id="' + options.id + '" class="collapsible-company"><h3>' + options.title + '</h3><ul data-role="listview" data-split-icon="arrow-r" data-split-theme="a" class="split-selector"></ul></div></li>';
		} else {
			// main/portfolio
			tabMarkup = '<li data-role="list-divider" id="' + options.id + '">' + capitaliseFirstLetter(options.id) + '</li>';
		};
		
		$tab = $(tabMarkup);
		
		nodes.$mobileMenu.append($tab);
		
		// Enhance controls
		nodes.$menuPage.trigger('create');
		nodes.$mobileMenu.listview();
		
		return $(tabMarkup);
	};
	
	tabs.select = function($tab, $panel) {
		
		setTimeout(function() {
			$('html,body').animate({
				scrollTop: $tab.offset().top
			}, 1000);
		}, 500);
			
		$tab.trigger('expand');
	};
	
	/* 
	 * Panels
	 */	
	var panels = {};
	panels.create = function(data) {
		var $panel = $('<div class="' + data.type + ' panel" data-role="page"></div>'),
			$tab = data.tab,
			$columnContainer = nodes.$mainColumns; // default to main columns container
		
		// add panel dom node to data store
		data.options.$node = $panel;
		$.data($panel[0], 'data', data.options);
		
		// add module type to dom storage
		$.data($panel[0], 'type', data.type);		
		
		var panelTitle;
		if(data.options.feed_account) {
			panelTitle = data.options.feed_account.name;
		};
		
		if(data.options.company) {
			panelTitle = data.options.company.feed_info.title;

			if(data.type === 'feed') {
				panelTitle = 'Company News';
				if(data.options.bingsearch) panelTitle = 'Additional News';
				if(data.options.blogsearch) panelTitle = 'News From Blogs';
			}
			
			if(data.type === 'podcast') panelTitle = 'Podcasts';
			
			if(data.type === 'prices') panelTitle = 'Prices';
			
			if(data.type === 'agenda' && !data.options.competitor) panelTitle = 'Calendar';
			if(data.type === 'agenda' && data.options.competitor) panelTitle = 'Competitors Calendar';
			
			if(data.type === 'twitter' && !data.options.competitor) panelTitle = 'Breaking News';
			if(data.type === 'twitter' && data.options.competitor) panelTitle = 'Competitors News';
			
			if(data.type === 'blinkx') panelTitle = 'Broadcast News';
			
			$tab = $('ul', $tab);
		};
		
		if(data.options.portfolio) {
			panelTitle = '<span class="trunc-title">' + data.options.portfolio.title + '</span>';
			
			if(data.type === 'agenda') panelTitle += ' Calendar';
			if(data.type === 'portfolio') panelTitle += ' Prices';
			if(data.type === 'feed') panelTitle += ' News';			
		}
		
		var $mobilePanelSelector = $('<li><a>' + panelTitle + '</a><a class="mobile-column-select"></a></li>');
		
		$mobilePanelSelector.find('.mobile-column-select').bind('click', function() {			
			$.mobile.changePage($panel, {
				transition: 'slide'
			});
		});
		
		// apend column selector
		
		// refresh listview
		if(data.options.company) {
			$tab.append($mobilePanelSelector);
			$tab.listview('refresh');
		} else {
			// append after last added column selector
			// to maintain order from API
			var $lastColumnSelector = $tab.nextUntil('li[data-role=list-divider]').not('.company-item').last();
			
			if($lastColumnSelector.length) {
				$lastColumnSelector.after($mobilePanelSelector);
			} else {
				$tab.after($mobilePanelSelector);
			}
			
			nodes.$mobileMenu.listview('refresh');
		}
		
		/* Append Company panels in different containers for each category (main/stocks/companies).
		 * We do this to be able to swipe between columns only from a certain category.
		 */
	
		// change container only if company or portfolio
		if(data.options.company) {
			$columnContainer = nodes.$companiesColumns;
		} else if(data.options.portfolio) {
			$columnContainer = nodes.$stocksColumns;
		};
		
		$panel.appendTo($columnContainer);
		finfore.modules[data.type].init($panel, data.options);
		
		// switch to first column
		if(!switchedToFirstColumn) {
			nodes.$firstColumn = $panel;
			$.mobile.changePage($panel);
			switchedToFirstColumn = true;
		}
	};
	
	/* 
	 * Panel Remove
	 */
	panels.remove = function(data) {
		// Remove DOM node		
		data.options.panel.$node.remove();
	};
	
	/*
	 * Next/Previous Panel Functionality
	 */
	panels.next = function($panel) {		
		var $nextPanel = $panel.nextAll('.panel:first');
		if($nextPanel.length) {
			$.mobile.changePage($nextPanel, {
				transition: 'slide'
			});
		}
	};
	panels.previous = function($panel) {		
		var $nextPanel = $panel.prevAll('.panel:first');
		if($nextPanel.length) {
			$.mobile.changePage($nextPanel, {
				transition: 'slide',
				reverse: true
			});
		}
	};
	
	/* 
	 * News ticker
	 */
	var ticker = {		
		updateNews: function(item) {
			// if a public account is logged-in, return
			if(finfore.data.user.is_public) return false;
			
			var $itemMarkup;
			
			if(item.screen_name) {				
				var url = 'http://twitter.com/' + item.from_user;				
				
				// find links in tweet to use as url
				if(item.text) {
					var urlPattern = /(HTTP:\/\/|HTTPS:\/\/)([a-zA-Z0-9.\/&?_=!*,\(\)+-]+)/i;
					var urlMatch = item.text.match(urlPattern);
					if(urlMatch) url = urlMatch[0];					
				}
				
				// handle twitter
				$itemMarkup = '<a href="' + url + '" target="_blank" title="' + item.text + '" class="twitter-update" data-role="button" data-icon="twitter-update">' + item.text + '</a>';
			} else if (item.elt || item.lt) {
				// prices
				var symbol = item.e + ':' + item.t;
				var priceChange = '';
				var chg = item.cp;
				if(chg < 0) {
					priceChange = '-';
				} else if(chg > 0) {
					priceChange = '+';
				}
				var itemText = symbol + ': ' + item.l + ' ' + priceChange + ' ' + Math.abs(chg) + '%';
				$itemMarkup = '<a href="http://www.google.com/finance?q=' + symbol + '" target="_blank" title="' + item.name + '" data-icon="prices-update" data-role="button">' + itemText + '</a>';
			} else {
				// feed
				var title = item.title || '';
				
				$itemMarkup = '<a href="' + item.link + '" target="_blank" title="' + item.title + '" data-icon="feed-update" data-role="button">' + title + '</a>';
			}			
			
			ticker.$node.append($itemMarkup);			
			$('[data-role=button]:last', ticker.$node).button();			
		}
	};
	ticker.updatePrices = ticker.updateNews;
	
	var init = function() {
		var template = $.View('//webapp/views/desktop.mobile.tmpl', {
				user: finfore.data.user,
				focus: finfore.data.focus,
				blankState: finfore.data.blankState,
				selectedFocus: finfore.data.selectedFocus
			});
		
		finfore.$body.append(template);
		
		// main nodes
		$.extend(nodes, {
			$menuPage: $('.menu-page'),
			
			$mainColumns: $('.main-columns'),
			$companiesColumns: $('.companies-columns'),
			$stocksColumns: $('.stocks-columns'),
			
			$mobileAddCompany: $('.mobile-addcompany')
		});
		
		// get sub-nodes, to be able to use contexts
		$.extend(nodes, {
			$alertsBtn: $('.alerts-button', nodes.$menuPage),
			$profileBtn: $('.profile-button', nodes.$menuPage),
			$mobileMenu: $('.mobile-menu', nodes.$menuPage)
		});
		
		// get and render companies
		WebService.getCompanies({
			success: function(companies) {
				
				// Sort companies alphabeticaly
				companies.sort(finfore.addcompany.abSorting);
				
				finfore.addcompany.allCompanies = companies;
				
				var template = $.View('//webapp/views/addcompanymobile.tmpl', {
					companies: companies
				});

				nodes.$mobileAddCompany.html(template);
				
				$('li', nodes.$mobileAddCompany).on('click', finfore.addcompany.saveCompany);
				
				nodes.$mobileAddCompany.listview('refresh');
				
				var $filterInput = $('input', nodes.$mobileAddCompany.siblings('form'));
				
				// unbind jquery mobile fitlers
				$filterInput.unbind('keyup change');
				
				var list = nodes.$mobileAddCompany,
					listview = list.data( "listview" ),
					filterThread;
				
				// rewrite jquery mobile filters
				$filterInput.bind('keyup change', function() {
					
					var val = this.value.toLowerCase(),
						listItems = null,
						lastval = $filterInput.jqmData( "lastval" ) + "",
						childItems = false,
						itemtext = "",
						item;
					
					/* In case there was a previously set filter, stop it.
					 * This makes only the latest version of the val to count,
					 * and prevents performance issues when typing multiple letters
					 * at an interval smaller than 1s.
					 */
					if(filterThread) clearTimeout(filterThread);
					
					// delay filter execution by 1s, from the last keyup, to not block the ui
					filterThread = setTimeout(function() {
							
						// Change val as lastval for next execution
						$filterInput.jqmData( "lastval" , val );
						if ( val.length < lastval.length || val.indexOf(lastval) !== 0 ) {

							// Removed chars or pasted something totally different, check all items
							listItems = list.children();
						} else {

							// Only chars added, not removed, only use visible subset
							listItems = list.children( ":not(.ui-screen-hidden)" );
						}

						if ( val.length > 2 ) {
						
							list.removeClass( "hide-mobile-companies");

							// This handles hiding regular rows without the text we search for
							// and any list dividers without regular rows shown under it

							for ( var i = listItems.length - 1; i >= 0; i-- ) {
								item = $( listItems[ i ] );
								itemtext = item.jqmData( "filtertext" ) || item.text();

								if ( listview.options.filterCallback( itemtext, val ) ) {

									//mark to be hidden
									item.toggleClass( "ui-filter-hidequeue" , true );
								} else {

									// There's a shown item in the bucket
									childItems = true;
								}
							}

							// Show items, not marked to be hidden
							listItems
								.filter( ":not(.ui-filter-hidequeue)" )
								.toggleClass( "ui-screen-hidden", false );

							// Hide items, marked to be hidden
							listItems
								.filter( ".ui-filter-hidequeue" )
								.toggleClass( "ui-screen-hidden", true )
								.toggleClass( "ui-filter-hidequeue", false );

						} else {

							//filtervalue is empty, hide list
							list.addClass( "hide-mobile-companies");
							
							//filtervalue is empty => show all
							listItems.toggleClass( "ui-screen-hidden", false );
						}
					
					}, 1000);
					
				});
				
				// trigger keyup, in case text was entered before the items were loaded
				$filterInput.trigger('keyup');
				
			}
		});
		
		// init menu
		nodes.$menuPage.page();
		
		// reder markup
		finfore.$body.trigger('create');
		
		// If the user is logged-in
		if(finfore.data.user) {
				
			// Add Main tab
			var $mainTabBtn = tabs.add({
				id: 'main',
				title: 'Main',
				closable: false
			});
			nodes.tabs.$main = $('#main');
			
			// Add Portfolio tab
			tabs.add({
				id: 'portfolio',
				title: 'Portfolio',
				closable: false
			});
			nodes.tabs.$portfolio = $('#portfolio');
			
			// add tab loaders
			nodes.tabs.$main.add(nodes.tabs.$portfolio);
			
			finfore.populate();
			
			// Panel Next/Previous events
			$(document).delegate('.panel', 'swipeleft', function() {
				panels.next($(this));
			});
			
			$(document).delegate('.panel', 'swiperight', function() {
				panels.previous($(this));
			});
			
			// load column on show
			$(document).delegate('.panel', 'pagebeforeshow', function() {
				var $panel = $(this),
					isLoaded = $panel.hasClass('column-loaded');
					
				if(!isLoaded) {
					$panel.trigger('refresh', [true]);
					$panel.addClass('column-loaded');
				};
			});
		
			// next prev buttons
			$(document).delegate('.panel-next', 'click', function() {
				var $panel = $(this).parents('.panel:first');
				panels.next($panel);
			});
			
			$(document).delegate('.panel-previous', 'click', function() {
				var $panel = $(this).parents('.panel:first');
				panels.previous($panel);
			});			
			
			
			if(finfore.data.user.is_public) {
				// Sign-in button
				$('.signin-button').click(finfore.login.init);
				
			} else {
				// Updates Page
				ticker.$page = $('#mobile-updates');
				ticker.$node = $('.mobile-update-list', ticker.$page);
				
				// header logout
				finfore.$body.delegate('.logout-button', 'click', function() {
					Storage.removeItem('user');
					Storage.removeItem('updateProfile');
					
					window.location.reload();
					return false;
				});
				
			};

			nodes.$alertsBtn.bind('click', function() {
				$.mobile.changePage(ticker.$page);
			});
			
			nodes.$profileBtn.bind('click', function() {
				finfore.profile.init();
				return false;
			});
			
			// press the menu button
			finfore.$body.delegate('.mobile-menu-button', 'click', function(event, ui) {
				finfore.$body.toggleClass('show-menu');
			});
			
			// when changeing page
			finfore.$body.delegate('[data-role]', 'pagebeforeshow', function(event, ui) {
				// remove show-menu class
				finfore.$body.removeClass('show-menu');
			});
			
			/* Hide menu when pressing any .mobile-column-select button from menu-page.
			 * We need this because pageshow/pagebeforeshow doesn't trigger if a page is already visible/changedTo.
			 */
			nodes.$menuPage.delegate('.mobile-column-select', 'click', function(event, ui) {
				finfore.$body.removeClass('show-menu');
			});
			
			/* Hide menu when clicking on the visible content area */
			finfore.$body.delegate('.mobile-content-overlay', 'click', function(event, ui) {
				finfore.$body.removeClass('show-menu');
			});
			
			// refresh columns button
			$('.refresh-columns-button', nodes.$menuPage).bind('click', refreshLoadedColumns);
		
			$('.public-account-btn', nodes.$menuPage).click(function() {
				// silent init login
				finfore.login.init({
					silentInit: true
				});
				
				// mobe to public account selector page
				$.mobile.changePage(finfore.login.nodes.$publicPage, {
					transition: 'slide'
				});
				return false;
			});
		
		};
		
	};

	return {
		init: init,
		nodes: nodes,
		tabs: tabs,
		panels: panels,
		ticker: ticker
	}
}();