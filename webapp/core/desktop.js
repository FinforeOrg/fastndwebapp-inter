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
		
	// TABLET variables	
		// if the screen width is lower than 1024, we consider it a tablet
	var tablet = (document.documentElement.clientWidth <= 1024),
		// determine if a fixed height class has been set for the pannel content wrapper
		fixedHeight = false;
		
	finfore.tablet = tablet;
	
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
	
	/*
	 * Add Tab
	 */
	tabs.add = function(options) {
			// tab selector button
		var $tabSelector,		
			// is it's not 'main' or 'portfolio', it's a company tab
			isCompany = (options.id !== 'main' && options.id !== 'portfolio');

		// tab view/content, the same for both desktop and tablet
		var $tabView = $($.View('//webapp/views/tab-view.tmpl', { tab: options }));
		nodes.$desktopContent.append($tabView);
		
		// Tablet
		if(tablet) {
			// if it's a company tab, create a collapsible with a listview
			if(isCompany) {
				$tabSelector = $('<div data-role="collapsible" data-collapsed="true" class="collapsible-company" data-theme="b"><h3>' + options.title + '</h3><ul></ul></div>');
				nodes.$tabletTabs.append($tabSelector);
				$tabSelector.collapsible();
				
				// refresh the tab selector iScroll when expading or collapsing the company tab selector
				$tabSelector.bind('collapse expand', function() {
					nodes.tabletTabsScroller.refresh();
				});
				
				// when expanding the list, also select tab
				$tabSelector.bind('expand', function() {
					tabs.select($tabSelector);
				});
				
				$('ul', $tabSelector).listview();
			} else {
			// if it's not a company tab, create a listview
				$tabSelector = $('<ul data-role="listview" data-inset="true" class="panel-list"><li data-role="list-divider">' + options.title + '</li></ul>');
				nodes.$tabletTabs.append($tabSelector);
				$tabSelector.listview();
			}
		
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
		
		} else {
		// Desktop
			
			// create tab selector from tab-button template
			$tabSelector = $($.View('//webapp/views/tab-button.tmpl', { tab: options }));
			$('ul', nodes.$tabBar).append($tabSelector);
		
			// increase navBarWidth with new tab
			navBarWidth += tabWidth;
			$('ul', nodes.$tabBar).width(navBarWidth);
			
			// increase the total tabIndex
			var tabIndex = nodes.tabs.tabIndex;
			nodes.tabs.tabIndex++;
		
			// if adding new tabs, generate button markup. else just call navBar plugin
			if(nodes.$tabBar.hasClass('ui-navbar')) {
				$('a', $tabSelector).buttonMarkup({
					corners: false, 
					shadow:	false
				});
			} else {
				nodes.$tabBar.navbar();
			}

			// attach company-tab remove event
			$('.tab-close-button', $tabSelector).click(finfore.companies.remove);
			
			// attach tab selector click event
			$tabSelector.click(function() {
				// trigger click event from tab-quickselector
				$('#tab-list-selector-menu li').eq(tabIndex).trigger('click');
				return false;
			});
			
			// create the tab <option> for the tab-quickselector
			var $tabOption = $($.View('//webapp/views/tab-option.tmpl', { tab: options }));		
			// set the $tabSelector as $.data to establish a relation between the option and the tab selector button
			$tabOption.data('target', $tabSelector);			
			nodes.$tabListSelector.append($tabOption);
			
			// Refresh the <select> menu with the new tab <option>
			nodes.$tabListSelector.selectmenu('refresh');
			
			// Refresh the tabs to see if scrollers are needed for the nav-bar
			tabs.refresh();
		};
		
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
		
		if(!tablet) {		
			$('.ui-btn-active', nodes.$tabBar).removeClass('ui-btn-active');
			$('a', $tab).addClass('ui-btn-active');
			
			var targetX = $tab.position().left;
			var x = targetX + nodes.$tabList.position().left;
			var x2 = x + $tab.outerWidth();
			
			if(x < 0) {
				tabScrollLeft = 0 - targetX;
				nodes.$tabList.css({
					left: tabScrollLeft
				});
			} else if(x > (maxNavBarWidth - 200)) {
				tabScrollLeft = (maxNavBarWidth-200) - targetX;
				nodes.$tabList.css({
					left: tabScrollLeft
				});
			}
		}
		
		$('.active-tab', nodes.$page).removeClass('active-tab');
		$tabView.addClass('active-tab');
		
		if(tablet) {
			var tabScroller;
			$tabView.trigger('refreshScroll');
			$tabView.bind('refreshScroll', function(e) {
				// after the event is trigger, get the returned object (the iscroll object)
				tabScroller = e.result;
				
				if($panel) {
					tabScroller.scrollToElement($panel[0], 100);
				};
			});
			
			$tabView.find('.panel').trigger('refreshScroll');
			
			// scroll to tab
			nodes.tabletTabsScroller.scrollToElement($tab[0], 100);
		};

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
		
		var companyId = $('a', $tab).attr('href').substr(1),
			$tabView = $('#' + companyId),
			$prevTab = $tab.prev('li'),
			prevCompanyId = $('a', $prevTab).attr('href').substr(1),
			$prevTabView = $('#' + prevCompanyId + '-tab');		
		
		// select previous (or next) tab
		if($('a', $tab).hasClass('ui-btn-active')) {
			tabs.select($prevTab);
		};
		
		// remove tab nodes
		$tab.remove();
		$tabView.remove();
		
		// remove tab button from tab selector
		$('option[value=' + companyId + '-tab]', nodes.$tabListSelector).remove();
		// Refresh the <select> menu with the tab removed
		nodes.$tabListSelector.selectmenu('refresh');
		
		navBarWidth -= tabWidth;
		nodes.$tabList.width(navBarWidth);
		tabs.refresh();	
				
		if(parseInt(nodes.$tabList.css('left')) != 0) {
			var left = parseInt(nodes.$tabList.css('left')) + tabWidth;
			nodes.$tabList.css({
				left: left
			});
		};
	};
	
	/*
	 * Initialize Desktop Tabs
	 */
	tabs.init = function() {
		if(tablet) {
			$('a:first', nodes.$tabletTabs).trigger('click');
		} else {
			$('a:first', nodes.$tabBar).trigger('click');
			
			nodes.$tabListSelector = $('#tab-list-selector');
			nodes.$tabListSelector.change(function() {
				var $tabTarget = $(this).find('option:selected').data('target');
				tabs.select($tabTarget);
			});
			
			$('#tab-list-selector-button').attr('data-tooltip', 'Tab List').removeAttr('title').addClass('tooltip-top');

			tabs.scroll.init();
		};
	};
	
	/* Sort Tabs */
	tabs.sort = function(e, ui) {
		
		// get new company index and id
		var index,
			companyId = $(ui.item).attr('data-company-id'),
			$li = ui.item.parent().find('li'),
			companyTabs = [];
		
		// only if a tab other than main or the portfolio has been moved
		if(companyId !== 'main' && companyId !== 'portfolio') {
		
			// creat the user_company_tabs object with each company's index
			$li.each(function(i, n) {
				companyId = $(n).attr('data-company-id');
				
				if(companyId !== 'main' && companyId !== 'portfolio') {
				
					index = $(n).index();
					
					companyTabs.push({
						_id: companyId,
						position: index
					});
					
				};
				
			});
			
			// save data to web service
			WebService.updateCompanies({
				userCompanyTabs: companyTabs
			});
			
		};
		
	};
	
	/* Scroll Tabs */
	var $tabScrollRight;
	var $tabScrollLeft;
	tabs.scroll.init = function() {
		$tabScrollRight = $('#tab-scroll-right');
		$tabScrollLeft = $('#tab-scroll-left');
		
		nodes.$tabBar.css('max-width', maxNavBarWidth);
		nodes.$tabList = $('ul', nodes.$tabBar);
		
		var scrollTabsRight = function() {
			if (tabScrollLeft <= (maxNavBarX + 200)) {
				tabScrollLeft = maxNavBarX;
			} else {
				tabScrollLeft -= 200;
			};
			
			nodes.$tabList.css({
				left: tabScrollLeft
			});
			
			return false;
		};
		$tabScrollRight.click(scrollTabsRight);
		
		var scrollTabsLeft = function() {
			if (tabScrollLeft >= -200) {
				tabScrollLeft = 0;
			} else {
				tabScrollLeft = tabScrollLeft + 200;
			};
			
			nodes.$tabList.css({
				left: tabScrollLeft
			});
			
			return false;
		};
		$tabScrollLeft.click(scrollTabsLeft);		
	};

	tabs.refresh = function() {
		maxNavBarX = nodes.$tabBar.width() - navBarWidth;
		
		if(maxNavBarX < 0) {
			nodes.$tabBar.removeClass('no-scroll');
			$tabScrollLeft.show();
			$tabScrollRight.show();
		} else {
			nodes.$tabBar.addClass('no-scroll');
			if($tabScrollLeft) $tabScrollLeft.hide();
			if($tabScrollRight) $tabScrollRight.hide();
						
			nodes.$tabList.css({
				left: '0px'
			});
		};
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
		
		if(tablet) {
			
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
			
			setTimeout(function() {				
				data.tab.trigger('refreshScroll');
				nodes.tabletTabsScroller.refresh();
			}, 100);
			
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
				
				$panel.bind('refreshScroll', function() {
					panelScroll.refresh();
				});
			});
		
		} else {
		
			// Desktop
			$panel.bind('init', function() {
				if(!finfore.data.user.is_public) {
					panels.sliders($panel);
				};
				panels.controlgroup(data);
			});
			
		};
		
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
		nodes.$publicAccountSelectorBtn = $('button', nodes.$publicSelectors);	
		
		if(tablet) {
		
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
			
			nodes.$publicAccountSelectorBtn.click(function() {
				$.mobile.changePage(nodes.$publicPage, {
					transition: 'slidedown'
				});
				return false;
			});
		
		} else {
		
			nodes.$professionSelector = $('#profession', nodes.$publicSelectors);
			nodes.$geoSelector = $('#geographic', nodes.$publicSelectors);
			nodes.$industrySelector = $('#industry', nodes.$publicSelectors);	
			
			var selectPublicAccount = function() {			
				var ids = nodes.$industrySelector.val() + ',' + nodes.$geoSelector.val() + ',' + nodes.$professionSelector.val();
				
				finfore.publicLogin({
					ids: ids
				}, function(response){
					window.location.reload();
				});
			};
			
			nodes.$publicAccountSelectorBtn.click(selectPublicAccount);
		
		}
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
				selectedFocus: finfore.data.selectedFocus,
				tablet: tablet
			});
		$(template).appendTo(finfore.$body);		
		
		// get #desktop page, and changePage
		nodes.$page = $('#desktop');		
		$.mobile.changePage(nodes.$page, {
			changeHash: false
		});		
		
		
		// If the user is logged-in
		if(finfore.data.user) {
			nodes.$tabBar = $('#tab-bar');
			nodes.$tabList = $('ul', nodes.$tabBar);
			nodes.$desktopContent = $('#desktop-content');
		
			// Tablet Functionality
			if(tablet) {
				nodes.$tabletTabsContainer = $('.tablet-tab-selector', nodes.$page);
				nodes.tabletTabsScroller = new iScroll('tablet-tabs', {
					hScroll: false,
					hScrollbar: false,
					vScrollbar: false,
					useTransition:true
				});
				nodes.$tabletTabs = $('.tablet-tab-list', nodes.$tabletTabsContainer);
				
				tabletOrientationRefresh();
			};
			
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
				if(!finfore.data.user.is_public && !tablet) {
					// Make panels in Main tab sortable, and remember their position
					nodes.$panelsSortable = $("#main .tab-scroller");
					nodes.$panelsSortable.sortable({
						helper: 'clone',		
						handle: '[data-role="header"]',
						stop: panels.sort
					});					
				
					// make tabs sortable
					nodes.$tabsSortable = $('ul:first-child', nodes.$tabBar);
					nodes.$tabsSortable.sortable({
						containment: 'parent',
						revert: true,
						tolerance: 'pointer',
						stop: tabs.sort
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
		
		if(!tablet) {
			// bind events to page resize
			$(window).bind('resize', function() {
				// recalculate the maximum width the nav bar can have, based on the document width
				maxNavBarWidth = $(document).width() - 150;				
				nodes.$tabBar.css('max-width', maxNavBarWidth);				
				
				// refresh existing tabs for proper scrolling
				tabs.refresh();
			});
			
			bindControlgroupEvents();
		};
		
		// update profile focus details for social sign-in accounts
		if(finfore.data.updateProfile) finfore.profile.init();
		
		// Really, REALLY ugly fix for iOS+iScroll4 double click issues
		if(finfore.tablet) {
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