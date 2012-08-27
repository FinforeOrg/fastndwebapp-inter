/*
 * Finfore.net 
 * Desktop Component
 * 
 */

// Desktop
finfore.desktop = function() {
	// DOM nodes
	var nodes = {
			$page: [],
			tabs: {
				tabIndex: 0
			}
		};
	
	// determine if a fixed height class has been set for the pannel content wrapper
	var fixedHeight = false;
	
	// TABS
		// single-tab-selector width
	var tabWidth = 200,
		// total tabBar width
		navBarWidth = 0,
		// the maximum width the nav bar can have
		maxNavBarWidth = $(document).width() - 150,
		// navBar X position, used to determine scrolled position
		maxNavBarX = 0,
		// navBar left position, used to scroll to selected tab
		tabScrollLeft = 0;
	
	// Tabs Object
	var tabs = {
		scroll: {}
	};
	
	/* Blank State Notice Functionality */
	var initBlankState = function() {
		var $blankStateOverlay = $('#blank-state-overlay');		
		var $blankStatePage = $('#blank-state')
		
		$('.ui-header', nodes.$page).css('z-index', 'auto');
		$('[data-role=button]', $blankStatePage).button();
		
		$('form input[type=checkbox]', $blankStatePage).change(function() {
			if($(this).is(':checked')) {
				Storage.setItem('blankState', false);
			} else {
				Storage.setItem('blankState', true);
			};
		});
		
		$('#blank-state-close-btn', $blankStatePage).click(function() {
			$blankStatePage.remove();
			$blankStateOverlay.remove();			
			$('.ui-header', nodes.$page).css('z-index', '2');
		});
	};
	
	/*
	 * Add Tab
	 */
	tabs.add = function(options) {
			// tab selector button
		var $tabSelector,		
			// is it's not 'main' or 'portfolio', it's a company tab
			isCompany = (options.id !== 'main' && options.id !== 'portfolio');

		// tab view/content
		var $tabView = $($.View('//webapp/views/tab-view.tmpl', { tab: options }));
		nodes.$desktopContent.append($tabView);
		
		// if it's a company tab, create a collapsible with a listview
		if(isCompany) {
			$tabSelector = $('<div data-role="collapsible" data-collapsed="true" class="collapsible-company" data-theme="b" data-company-id="' + options.id + '"><h3>' + options.title + '</h3><ul></ul></div>');
			nodes.$tabletTabs.append($tabSelector);
			$tabSelector.collapsible();
			
			if(!finfore.data.user.is_public) {
				var $deleteCompany = $('<span class="ui-icon ui-icon-shadow ui-icon-delete tab-close-button"></span>');
				$tabSelector.append($deleteCompany);
			}
			
			// refresh the tab selector iScroll when expading or collapsing the company tab selector
			if(touchSupport) {
				$tabSelector.bind('collapse expand', function() {
					nodes.tabletTabsScroller.refresh();
				});
			}
			
			// when expanding the list, also select tab
			$tabSelector.bind('expand', function() {
				tabs.select($tabSelector);
			});
			
			$('.tab-close-button', $tabSelector).bind('click', finfore.companies.remove);
			
			$('ul', $tabSelector).listview();
		} else {
		// if it's not a company tab, create a listview
			$tabSelector = $('<ul data-role="listview" data-inset="true" class="panel-list"><li data-role="list-divider">' + options.title + '</li></ul>');
			nodes.$tabletTabs.append($tabSelector);
			$tabSelector.listview();
		}
	
		if(touchSupport) {
			// create iScroll for tab content
			var tabScroller = new iScroll(options.id, {
				vScroll: false,
				snap: '.panel',
				useTransition: true,
				lockDirection: true
			});
			
			// create refreshScroll function to be able to quickly refresh iScroll when adding new panels
			$tabView.bind('refreshScroll', function() {
				tabScroller.refresh();
				// return iScroll object
				return tabScroller;
			});
			
			// refresh tab selector iScroll to account for new added tab
			nodes.tabletTabsScroller.refresh();
		}
		
		// add $tabView and $tabSelector to each other's $.data, to set a relationship between the tab content and selector			
		$.data($tabView[0], 'selector', $tabSelector);
		$.data($tabSelector[0], 'tabView', $tabView);
		
		// return the tab selector button
		return $tabSelector;
	};
	
	/*
	 * Select Tab
	 */
	tabs.select = function($tab, $panel) {
		// TabView
		var $tabView = $.data($tab[0], 'tabView');
		
		$('.active-tab', nodes.$page).removeClass('active-tab');
		$tabView.addClass('active-tab');
		
		if(touchSupport) {
			
			var tabScroller;
			$tabView.trigger('refreshScroll');
			$tabView.bind('refreshScroll', function(e) {
				// after the event is trigger, get the returned object (the iscroll object)
				tabScroller = e.result;
				
				if($panel) {
					// scroll to column
					tabScroller.scrollToElement($panel[0], 100);
				};
			});
			
			$tabView.find('.panel').trigger('refreshScroll');
			
			// scroll to tab selector button
			nodes.tabletTabsScroller.scrollToElement($tab[0], 100);
			
		} else {
			
			if($panel) {
				// scroll to column
				$tabView.animate({
					scrollLeft: $panel.position().left
				}, 500);
			}
			
			// scroll to tab selector button
			nodes.$tabletTabsContainer.animate({
				scrollTop: $tab.position().top
			}, 200);
		}

		// load column on show
		tabs.loadColumns($tabView);
		
	};
	
	// load column content
	tabs.loadColumns = function($tabView) {
	
		var $panels = $('.panel', $tabView),
			$panel,
			isLoaded;
		
		$panels.each(function() {
			$panel = $(this);
			isLoaded = $panel.hasClass('column-loaded');
				
			if(!isLoaded) {
				$panel.trigger('refresh', [true]);
				$panel.addClass('column-loaded');
			};
		});
		
	};
	
	/* 
	 * Remove Tab
	 */
	tabs.remove = function($tab) {
		
		var companyId = $tab.attr('data-company-id'),
			$tabView = $('#' + companyId);
		
		// select first tab
		var $mainTabs = $('ul:first', nodes.$tabletTabs);
		tabs.select($mainTabs);
		
		// remove tab nodes
		$tab.remove();
		$tabView.remove();
		
	};
	
	/*
	 * Initialize Desktop Tabs
	 */
	tabs.init = function() {
		$('a:first', nodes.$tabletTabs).trigger('click');
	};
	
	/* 
	 * Panels
	 */	
	var panels = {};
	panels.create = function(data) {
		var feedAccountId = (data.options.feed_account) ? data.options.feed_account._id : '';
		var $panel = $('<div class="' + data.type + ' panel" id="' + feedAccountId + '"></div>');
		var $tab = data.tab;
		
		// add panel dom node to data store
		data.options.$node = $panel;
		$.data($panel[0], 'data', data.options);
		
		// add module type to dom storage
		$.data($panel[0], 'type', data.type);	
		
		// add tab to data store
		data.options.$tab = $('.tab-scroller', data.tab);
		$panel.appendTo(data.options.$tab);
		
		// Tablet
		var $panels = $('.panel', data.options.$tab);
		var panelWidth = $panel.first().width();
		var cssWidth = $panels.length * parseInt(panelWidth);			
		data.options.$tab.width(cssWidth);
		
		var panelTitle;
		if(data.options.feed_account) {
			panelTitle = data.options.feed_account.name;
		};
		
		var $tabSelectorList = $.data(data.tab[0], 'selector');
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
			
			$tabSelectorList = $('ul', $tabSelectorList);
		};
		
		if(data.options.portfolio) {
			panelTitle = data.options.portfolio.title;
			
			if(data.type === 'agenda') panelTitle += ' Agenda';
			if(data.type === 'portfolio') panelTitle += ' Stocks';
			if(data.type === 'feed') panelTitle += ' News';			
		}
					
		var $panelSelector = $('<li><a>' + panelTitle + '</a></li>');
		$tabSelectorList.append($panelSelector);
		$tabSelectorList.listview('refresh');
		
		var $tabSelector;
		if(data.options.company) {
			$tabSelector = $tabSelectorList.parents('.ui-collapsible:first');
		} else {
			$tabSelector = $tabSelectorList;
		}
		$panelSelector.click(function() {				
			tabs.select($tabSelector, $panel);
		});
		
		if(touchSupport) {
			setTimeout(function() {				
				data.tab.trigger('refreshScroll');
				nodes.tabletTabsScroller.refresh();
			}, 100);
		}
		
		$panel.bind('init', function() {
			var $panelContent = $panel.find('[data-role=content]');
			
			if(!fixedHeight) {
				var panelHeight = nodes.$desktopContent.height() - 43;					
				var lastSheet = document.styleSheets[document.styleSheets.length - 1];
				lastSheet.insertRule('.panel-content-wrap { height: ' + panelHeight + 'px !important; }', lastSheet.cssRules.length);
				fixedHeight = true;
			};
			
			$panelContent.wrap('<div class="panel-content-wrap"></div>');				
			var $panelWrap = $panel.find('.panel-content-wrap');				
		
			if(touchSupport) {
				var panelScroll = new iScroll($panelWrap[0], {
					hScroll: false,
					hideScrollbar: true,
					lockDirection: true
				});
				
				var refreshTimeout;
				
				$panelContent[0].addEventListener('DOMSubtreeModified',function(e) {					
					if(refreshTimeout) clearTimeout(refreshTimeout);
					refreshTimeout = setTimeout(function() {
						panelScroll.refresh();
					}, 1500);
				}, false);
			}
			
			$panel.bind('refreshScroll', function() {
				if(touchSupport) panelScroll.refresh();
			});
			
			if(!touchSupport) {
				if(!finfore.data.user.is_public) {
					panels.sliders($panel);
				};
				
				panels.controlgroup(data);
			}
		});
		
		finfore.modules[data.type].init($panel, data.options);
		
		// if column is created in current tab, load it
		if(data.options.$tab.parent('.tab').hasClass('active-tab')) {
			// load column on show
			tabs.loadColumns(data.options.$tab);
		};
	
	};
	panels.remove = function(data) {
		// Remove DOM node
		data.options.panel.$node.remove();
	};
	
	/*
	 * Panel Controlgroup
	 */
	panels.controlgroup = function(data) {
		var $heading = $('[data-role=header]:first', data.options.$node);
		var mainTab = (data.tab.attr('id') == 'main');
		
		if(finfore.data.user.is_public) mainTab = false;
		
		var template = $.View('//webapp/views/panel.controlgroup.tmpl', {
			editable: mainTab
		});
		$heading.append(template);
		
		// refresh controlgroup
		$heading.trigger('create');

		// bind panel manage event
		data.options.$node.bind('manage', function() {
			finfore.manage.init({
				target: {
					type: $.data(data.options.$node[0], 'type'),
					data: $.data(data.options.$node[0], 'data')
				}
			});
		});
		
	};
	
	/* 
	 * Panel Sliders
	 */
	panels.sliders = function($container){
		var $footer = $('<div class="panel-slider-controls"></div>');
		var $sliderLeft = $('<button data-role="button" data-icon="arrow-l" data-iconpos="notext" data-theme="d">Slide Panel Left</button>');
		var $sliderRight = $('<button data-role="button" data-icon="arrow-r" data-iconpos="notext" data-theme="d">Slide Panel Right</button>');		
		$footer.append($sliderLeft, $sliderRight);
		
		$sliderLeft.button();
		$sliderRight.button();
		
		$sliderLeft.click(slidePanel);
		$sliderRight.click(slidePanel);
		
		$footer.appendTo($container);
	};
	
	var slidePanel = function() {
		var $panel = $(this).parents('.panel').first();
		var $nextPanel = $panel.next('.panel');
		var $prevPanel = $panel.prev('.panel');
		var panelWidth = $panel.width();
		var right = ($(this).attr('data-icon')==='arrow-r');		
		
		if(right) {		
			if($nextPanel.length) {
				$nextPanel.animate({
					'left': '-=' + panelWidth
				}, 300, function() {
					$nextPanel.css('left', 'auto');
				});
				
				$panel.css('z-index', '99')
					  .animate({
							left: '+=' + panelWidth
						}, 300, function() {
							$panel.css({
								'left': 'auto',							
								'z-index': '0'
							});
							$panel.insertAfter($nextPanel);
							
							// save reordered columns
							panels.sort({},{
								item: $panel
							});
							
						});
			};
		} else {
			if($prevPanel.length) {
				$prevPanel.animate({
					'left': '+=' + panelWidth
				}, 300, function() {
					$prevPanel.css('left', 'auto');
				});
				
				$panel.css('z-index', '99')
					  .animate({
							left: '-=' + panelWidth
						}, 300, function() {
							$panel.css({
								'left': 'auto',							
								'z-index': '0'
							});
							$panel.insertBefore($prevPanel);
							
							// save reordered columns
							panels.sort({},{
								item: $panel
							});
							
						});
			};
		};		
		
		return false;
	};
	
	/* Panel Sorting */
	panels.sort = function(event, ui) {
		
		// get new company index and id
		var $panel = ui.item.parent().find('.panel'),
			columns = [],
			index;
		
		// creat the feed_accounts object with each column's index
		$panel.each(function(i, n) {
			columnId = $.data(n, 'data').feed_account._id;
			index = $(n).index();
			
			columns.push({
				_id: columnId,
				position: index
			});
			
		});
		
		// save data to web service
		WebService.updateColumns({
			columns: columns
		});
		
	};
	
	/* Public account selector */
	var initPublicAccountSelector = function() {		
		nodes.$publicSelectors = $('#public-account-selectors');
		nodes.$publicAccountSelectorPageBtn = $('#public-account-selector-btn', nodes.$publicSelectors);	
		nodes.$publicAccountSelectorForm = $('#public-account-box-form', nodes.$publicSelectors);	
		
		/* Tablet */
		nodes.$publicPage = $('#public-account-selector');
		nodes.$publicPage.page();
		
		nodes.$professionSelector = $('#profession', nodes.$publicPage);
		nodes.$geoSelector = $('#geographic', nodes.$publicPage);
		nodes.$industrySelector = $('#industry', nodes.$publicPage);
		
		$('.public-account-selector-btn', nodes.$publicPage).click(function() {
			var ids = nodes.$industrySelector.val() + ',' + nodes.$geoSelector.val() + ',' + nodes.$professionSelector.val();
			
			finfore.publicLogin({
				ids: ids
			}, function(response){
				window.location.reload();
			});
			
			return false;
		});
		
		nodes.$publicAccountSelectorPageBtn.click(function() {
			$.mobile.changePage(nodes.$publicPage, {
				transition: 'slidedown'
			});
			return false;
		});
		
		/* Desktop */
		
		nodes.$professionSelectorInline = $('#profession', nodes.$publicSelectors);
		nodes.$geoSelectorInline = $('#geographic', nodes.$publicSelectors);
		nodes.$industrySelectorInline = $('#industry', nodes.$publicSelectors);	
			
		var selectPublicAccount = function() {			
			var ids = nodes.$industrySelectorInline.val() + ',' + nodes.$geoSelectorInline.val() + ',' + nodes.$professionSelectorInline.val();
			
			finfore.publicLogin({
				ids: ids
			}, function(response) {
				window.location.reload();
			});
			
			return false;
		};
		
		nodes.$publicAccountSelectorForm.submit(selectPublicAccount);
		
	};	
		
	/* Blank State Notice Functionality */
	var initBlankState = function() {
		var $blankStateOverlay = $('#blank-state-overlay');		
		var $blankStatePage = $('#blank-state')
		
		$('.ui-header', nodes.$page).css('z-index', 'auto');
		$('[data-role=button]', $blankStatePage).button();
		
		$('form input[type=checkbox]', $blankStatePage).change(function() {
			if($(this).is(':checked')) {
				Storage.setItem('blankState', false);
			} else {
				Storage.setItem('blankState', true);
			};
		});
		
		$('#blank-state-close-btn', $blankStatePage).click(function() {
			$blankStatePage.remove();
			$blankStateOverlay.remove();			
			$('.ui-header', nodes.$page).css('z-index', '2');
		});
	};
	
	/* Bind Controlgroup Events */
	var bindControlgroupEvents = function() {
		var $mainTab = $('#main');
		
		finfore.$body.delegate('.panel-refresh', 'click', function() {
			var $panel = $(this).parents('.panel:first');
			$panel.trigger('refresh');
		});
		
		$mainTab.delegate('.panel-manage', 'click', function() {
			var $panel = $(this).parents('.panel:first');
			$panel.trigger('manage');
		});
				
		$mainTab.delegate('.panel-remove', 'click', function() {		
			var $panel = $(this).parents('.panel:first');
			var category = $.data($panel[0], 'type');			
			var $managePage = $('#manage-page');			
			
			if(!$managePage.length) {
				finfore.manage.init({
					silentInit: true
				});
				
				$managePage = $('#manage-page');
			}
			
			// get module management tab				
			var $tabPanel = $('#management-tab-' + category, $managePage);
			
			// get panel from management tab
			var $mTabs = $('.mtabs-container', $tabPanel);			
			var $tabs = $('.mtab', $mTabs),
				panelData = $.data($panel[0], 'data'),
				tabData, $selectedInput;				
			
			$tabs.each(function() {
				$selectedInput = $(this);
				tabData = $.data($selectedInput[0], 'data');
				if(panelData === tabData) {
					$selectedInput.attr('checked', 'checked').trigger('change');
					return false;
				}
			});
			
			finfore.manage.panels.remove({
				$node: $selectedInput,
				category: category
			});
			
		});		
		
	};
	
	// enable management button	
	var enableManagement = function() {
		$('#manage-button', nodes.$page).removeClass('disabled');
	};
	
	// ticker
	var ticker = {		
		$node: '',
		$ghost: $('<marquee scrollamount="2"></marquee>'),
		updateNews: function(item) {
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
				$itemMarkup = '<a href="' + url + '" target="_blank" class="twitter-update" title="' + item.text + '">' + item.text + '</a>';
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
				$itemMarkup = '<a href="http://www.google.com/finance?q=' + symbol + '" target="_blank" class="prices-update" title="' + item.name + '">' + itemText + '</a>';				
			} else {
				// feed
				var title = item.title || '';
				
				$itemMarkup = '<a href="' + item.link + '" target="_blank" class="feed-update" title="' + item.title + '">' + title + '</a>';
			}
			
			empty(ticker.$node[0]);
		
			ticker.$ghost.removeData();
			ticker.$ghost.append($itemMarkup);
			
			ticker.$ghost.clone().appendTo(ticker.$node);			
		}
	};
	ticker.updatePrices = ticker.updateNews;
	
	// tablet update all iscrolls
	var tabletOrientationRefresh = function() {
		// bind iscroll refresh events to both orientationchange and resize for max compatibility
		$(window).bind('orientationchange resize', function(event) {		
			// insert new css rule for fixed panel height
			var panelHeight = nodes.$desktopContent.height() - 43;
			var lastSheet = document.styleSheets[document.styleSheets.length - 1];
			lastSheet.insertRule('.panel-content-wrap { height: ' + panelHeight + 'px !important; }', lastSheet.cssRules.length);			
			
			// get all panels
			var $activeTab = $('.active-tab', nodes.$page);
			var $activePanels = $('.panel', $activeTab);
			
			// refresh iScroll on active tab and panels
			$activeTab.trigger('refreshScroll');
			$activePanels.trigger('refreshScroll');
			
			nodes.tabletTabsScroller.refresh();
		});		
	};
	
	// init desktop
	var init = function() {
	
		var template = $.View('//webapp/views/desktop.tmpl', {
				user: finfore.data.user,
				focus: finfore.data.focus,
				blankState: finfore.data.blankState,
				selectedFocus: finfore.data.selectedFocus
			});
		$(template).appendTo(finfore.$body);		
		
		// get #desktop page, and changePage
		nodes.$page = $('#desktop');

		nodes.$mobileAddCompany = $('.mobile-addcompany');

		$.mobile.changePage(nodes.$page, {
			changeHash: false
		});		
		
		
		// If the user is logged-in
		if(finfore.data.user) {
			nodes.$tabBar = $('#tab-bar');
			nodes.$tabList = $('ul', nodes.$tabBar);
			nodes.$desktopContent = $('#desktop-content');
		
			nodes.$tabletTabsContainer = $('.tablet-tab-selector', nodes.$page);
			
			if(touchSupport) {
				nodes.tabletTabsScroller = new iScroll('tablet-tabs', {
					hScroll: false,
					hScrollbar: false,
					vScrollbar: false,
					useTransition:true
				});
				
				tabletOrientationRefresh();
			}
			
			nodes.$tabletTabs = $('.tablet-tab-list', nodes.$tabletTabsContainer);
			
			tabs.init();
			
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
			
			// ticker nodes
			ticker.$node = $('.scrolling-ticker', nodes.$page);
						
			// ticker hover events
			ticker.$node.delegate('marquee', 'mouseover', function () {
				$('marquee', ticker.$node)[0].stop();
			});
			ticker.$node.delegate('marquee', 'mouseout', function() {
				$('marquee', ticker.$node)[0].start();
			});			
			
			// The user is logged-in into Registered Account
			if(!finfore.data.user.is_public) {
				finfore.$body.addClass('registered-user');
			
				// makes tabs and panels sortable				
				if(!finfore.data.user.is_public) {
				
					// Make panels in Main tab sortable, and remember their position
					nodes.$panelsSortable = $("#main .tab-scroller");
					nodes.$panelsSortable.sortable({
						helper: 'clone',		
						handle: '[data-role="header"]',
						delay: 400,
						stop: panels.sort
					});					

				};				
				
				// bind user actions
				$('.logout-button', nodes.$page).bind('click', function() {			
					Storage.removeItem('user');
					Storage.removeItem('updateProfile');
					
					window.location.reload();
					return false;
				});		
				
				$('#manage-button', nodes.$page).click(function() {					
					finfore.manage.init();				
					return false;
				});
								
				$('#profile-button', nodes.$page).bind('click', function() {					
					finfore.profile.init();
					return false;
				});
				
				$('.help-button', nodes.$page).bind('click', function() {					
					finfore.help.init();					
					return false;
				});
				
				$('.add-company-button', nodes.$page).click(finfore.addcompany.init);
			};
			
			finfore.populate();
			
			setTimeout(function() {
				tabs.select($mainTabBtn);
			}, 10);
		
		};
		
		// User is not logged-in or Public Account
		if(!finfore.data.user || finfore.data.user.is_public) {
			// bind login button
			$('#login-button').click(function() {
				finfore.login.init();
				return false;
			});
			
			// signup button
			$('#signup-button').click(function() {					
				finfore.signup.init();				
				return false;
			});
			
			// find company button
			$('#find-company-button').click(function() {
				finfore.addcompany.init();
				return false;
			});
			
			initPublicAccountSelector();
		};		
	
		// init blank state notice
		if(finfore.data.blankState) {
			initBlankState();
		}
		
		bindControlgroupEvents();
		
		// update profile focus details for social sign-in accounts
		if(finfore.data.updateProfile) finfore.profile.init();
		
		// Really, REALLY ugly fix for iOS+iScroll4 double click issues
		if(touchSupport) {
			var debounce = false;
			nodes.$desktopContent.delegate('a[target="_blank"]', 'click', function() {
				if(!debounce) {
					debounce = true;
					setTimeout(function() {
						debounce = false;
					}, 500);
					return true;		
				} else {
					return false;
				}
			}); 
		};

		// bind vclick event to the form, because iScroll was preventing tap-ing the input
		var $filterInput = $('input', nodes.$mobileAddCompany.siblings('form'));
		
		if(touchSupport) {
			nodes.$mobileAddCompany.siblings('form').bind('vclick', function() {
				$filterInput.focus();
			});
		}
		
		// facebook-like inline company search autocomplete
		WebService.getCompanies({
			success: function (companies) {
				// Sort companies alphabeticaly
				companies.sort(finfore.addcompany.abSorting);

				finfore.addcompany.allCompanies = companies;

				var template = $.View('//webapp/views/addcompanymobile.tmpl', {
					companies: companies
				});

				nodes.$mobileAddCompany.html(template);

				$('li', nodes.$mobileAddCompany).on('click', finfore.addcompany.saveCompany);

				nodes.$mobileAddCompany.listview('refresh');
				
				// unbind jquery mobile fitlers
				$filterInput.unbind('keyup change');
				
				var list = nodes.$mobileAddCompany,
					listview = list.data( "listview" ),
					filterThread,
					$bodyHeight = parseInt($('body').height()) - 190;
					
				list.css({
					'max-height': $bodyHeight + 'px',
					'overflow-y': 'auto'
				});
				
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
						
							//change theme color for list items
							list.find('.ui-body-c').removeClass('ui-body-c').addClass('ui-body-a');

							//filtervalue is empty, hide list
							list.addClass( "hide-mobile-companies");
							
							//filtervalue is empty => show all
							listItems.toggleClass( "ui-screen-hidden", false );

						}
					
						// refresh iscroll
						if(touchSupport) {
							// refresh tab selector iScroll to account for new added tab
							nodes.tabletTabsScroller.refresh();
						}
					
					}, 1000);
					
				});

				// trigger keyup, in case text was entered before the items were loaded
				$filterInput.trigger('keyup');
			}
		});

		
	};

	return {
		init: init,
		nodes: nodes,
		tabs: tabs,
		panels: panels,
		ticker: ticker,
		
		enableManagement: enableManagement
	}
}();