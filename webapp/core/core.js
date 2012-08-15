/*
 * Finfore.net 
 * Application Core
 *
 */

// Detect mobile
if(smallScreen) {
	$('html').addClass('small-screen');
} else {
	var smallScreen = false;
};

// Detect Touch
var touchSupport = !!('ontouchstart' in window);
if(touchSupport) {
	$('html').addClass('touch');
}

var finfore = function() {
	var url = {
		// login
		login: finforeBaseUrl + '/user_sessions.json',
		publicLogin: finforeBaseUrl + '/user_sessions/public_login.json',
		publicProfiles: finforeBaseUrl + '/category_focus.json',
		
		// portfolios
		portfolioOverviews: finforeBaseUrl + '/portfolios/overviews.json',
		portfolioList: finforeBaseUrl + '/portfolios/list.json',
		
		// feed accounts
		feedAccounts: finforeBaseUrl + '/feed_accounts.json',
		
		// companies
		companyTabs: finforeBaseUrl + '/user_company_tabs.json'		
	};
	
	// User Details
	var user = Storage.getItem('user');
	if(user) {
		user = JSON.parse(user);
		
		// failsafe
		if(user.error || !user._id) user = false;
	}
	
	// Update profile
	var updateProfile = Storage.getItem('updateProfile');
	if(updateProfile) updateProfile = (updateProfile == 'true');
	
	// blank object to attach modules to
	var modules = {};
	
	// if the screen width is larger than 1024, we consider it a desktop
	var largeScreen = (document.documentElement.clientWidth > 1024);
	
	// determine if blank state will be displayed
	var blankState = (Storage.getItem('blankState')) ? false : true;
	
	/* Data Store */
	var data = {
		user: user,
		companies: [],
		panels: {
			main: {},
			portfolio: {},
			companies: {}
		},
		portfolios: [],
		feedInfos: {},
		ticker: {
			news: [],
			prices: []
		},
		selectedFocus: {
			geographic: [],
			professional: [],
			industrial: []
		},
		blankState: blankState,
		updateProfile: updateProfile
	};

	var ajaxDefaults = function() {
		/* set auth params to all requests, required by the web service
		 * this avoids duplication of these params on all requests
		 */
		$.ajaxSetup({
			dataType: 'json',
			data: {
				auth_token: finfore.data.user.single_access_token,
				auth_secret: finfore.data.user.persistence_token
			}
		});
	};
	
	/* Data Storage */
	var storeData = function(options) {
		
		if(options.user) {
			finfore.data.user = options.user;
			Storage.setItem('user', JSON.stringify(options.user));
			
			ajaxDefaults();
		};
		
		if(options.focus) {
			options.focus.storageDate = new Date();
			Storage.setItem('focus', JSON.stringify(options.focus));
		};
		
		if(options.selectedFocus) {
			Storage.setItem('selectedFocus', JSON.stringify(options.selectedFocus));
		};
		
	};
	
	// sort and store selected focuses from user
	var getSelectedFocuses = function() {
		
		/* Try to get stored selected focus areas.
		 * We store selected focus areas only for public profiles.
		 */
		var selectedFocus = Storage.getItem('selectedFocus');
		
		/* If the selected focus areas are stored, and the user is public,
		 * parse and use the stored focuses.
		 *
		 * Else use the selected focus areas in the User object.
		 */
		if(selectedFocus && finfore.data.user.is_public) {
			selectedFocus = JSON.parse(selectedFocus);
		} else {
			selectedFocus = finfore.data.user.profiles;
		};
		
		if(!selectedFocus) selectedFocus = [];		
		
		// parse and place selected focus areas into data.selectedFocus
		$.each(selectedFocus, function() {
			var profileCategory = this.profile_category.title;
			switch(profileCategory) {
				// geographic
				case 'Geography':
					finfore.data.selectedFocus.geographic.push(this);
					break;
				// professional
				case 'Profession':
					finfore.data.selectedFocus.professional.push(this);
					break;
				// industrial
				case 'Industry':
					finfore.data.selectedFocus.industrial.push(this);
					break;
			}
		});
		
		
	};
	
	/* Public low-lever Public account sign-in */
	var publicLogin = function(params, success) {
		if($.mobile.showPageLoadingMsg) $.mobile.showPageLoadingMsg();
		
		$.ajax({
			url: url.publicLogin,
			type: 'POST',
			data: {
				pids: params.ids
			},
			success: function(response) {
				
				if(response.user) {
					
					// remove already stored selected focuses
					Storage.removeItem('selectedFocus');
					
					var user = $.extend({}, response.user);
					
					/* If public profile, replace all associated focus areas, with the 3 (max) matched. */
					
					finfore.storeData({
						user: user
					});
					
					finfore.storeData({
						selectedFocus: response.selecteds
					});
					
				} else {
				
					$().toastmessage('showErrorToast', '<strong>Sorry, currently no public account is available for your areas of interest.</strong><br /> Please try later.');
					
					Loader.hide();
					
					return false;
				};		
				
				if(success) success(user);
			},
			error: function(error) {			
				$().toastmessage('showErrorToast', '<strong>Sorry, currently no public account is available for your areas of interest.</strong><br /> Please try later.');
			}
		});
		
	};
	
	/* Grab Focus Areas */
	var grabFocus = function(callback) {
		Loader.show();
		
		// check if focus is in localstorage
		var focus = Storage.getItem('focus'),
			now = new Date(),
			fromStorage = false;
		
		if(focus) {
			/* If the focus areas are in localStorage, we check the date when they were stored.
			 * If they're stored earlier than 1h, we get them from localStorage
			 * else we get them from the web service again.
			 */
			focus = JSON.parse(focus);
			
			// transform string in date
			focus.storageDate = new Date(focus.storageDate);
			
			// when were the focuses stored, in seconds
			var seconds = parseInt((now - focus.storageDate) / 1000);
			
			// if younger than 1 hour
			if(seconds < 3600) {
				// comment to disable caching
				fromStorage = true;
			}
		};
		
		if(fromStorage) {
		
			finfore.data.focus = focus;
			callback();
			
		} else {
		
			WebService.focus({
				complete: function(focuses) {
				
					finfore.data.focus = {};
					
					// add focuses to data store
					$.each(focuses, function(i, n) {
						if(n.title == 'Profession') {
							finfore.data.focus.professional = n;
						} else if(n.title == 'Geography') {
							finfore.data.focus.geographic = n;
						} else if(n.title == 'Industry') {
							finfore.data.focus.industrial = n;
						}
					});
					
					// store data in localstorage
					finfore.storeData({
						focus: finfore.data.focus
					});
					
					callback();
				
				}
			});
			
		};
		
	};
	
	/* Ticker */
	var ticker = {
		date: new Date(),
		shortDate: new Date(),
		priceBridge: 2,
		updateNews: function(item) {			
			// add to data store
			finfore.data.ticker.news.push(item);
			// updateNews in desktop			
			finfore.desktop.ticker.updateNews(item);
		},
		updatePrices: function(item) {
			finfore.data.ticker.prices.push(item);
			
			finfore.desktop.ticker.updatePrices(item);
		},
		// clean older entries and update dates
		cleanTicker: function() {
			// update dates
			ticker.date = new Date();
			ticker.shortDate = new Date();
		
			ticker.date.setMinutes(ticker.date.getMinutes() - 15);
			ticker.shortDate.setMinutes(ticker.shortDate.getMinutes() - 15);
			
			// check dates on stored items, and remove if necessarry
			var tempNews = data.ticker.news.slice(0);
			$.each(data.ticker.news, function(i,n) {
				if(n.from_user) {
					// handle Wwitter
					var tweetDate = new Date(n.created_at);
					if(tweetDate <= ticker.shortDate) {
						tempNews.splice(i, 1);
					};
				} else {
					// handle Feed
					if(new Date(n.publishedDate) <= ticker.date) {
						tempNews.splice(i, 1);
					};
				}
			});	
			data.ticker.news = tempNews.slice(0);
			
			// clean up ticker dom			
			empty(finfore.desktop.ticker.$node[0]);
			
			$.each(data.ticker.news, function(n,i) {
				finfore.desktop.ticker.updateNews(n);
			});
		
		}
	};
	
	// set ticker dates
	ticker.date.setMinutes(ticker.date.getMinutes() - 15);
	ticker.shortDate.setMinutes(ticker.shortDate.getMinutes() - 15);
	
	// update the ticker every 15 minutes	
	var dateUpdater = window.setInterval(ticker.cleanTicker, 15 * 60 * 1000);	
	
	// Array sort in acending Order, comparing the position attr in objects
	// Used to sort columns and companies
	var sortPosition = function(obj1, obj2) {	  
		if (obj1.position > obj2.position) return 1;
		if (obj1.position < obj2.position) return -1;
		return 0;
	};
		
	/* Populate Default tabs and create Company tabs */
	var populate = function() {
		var getPortfolios = [], getPanels;

		// create panels for the Main and Portfolio tabs
		var createMainPanels = function(feed_accounts) {
			
			// Column sorter based on feed_account.position on each feed_account
			// if the position attribute is not set, we set it to 999
			$.each(feed_accounts, function(i, n) {
				if(n.position == null) n.position = 999;
			});
			
			// sort columns ascending
			feed_accounts.sort(sortPosition);
			
			$.each(feed_accounts, function() {
				var feed_account = this,
					category = feed_account.category;
				
				if(category == 'portfolio') {
				
					/* Portfolios */
					getPortfolios.push(portfolios.create(feed_account));
					
				} else {
				
					/* Other columns */
					if(category == 'rss') {
						category = 'feed'
					} else if(category == 'chart') {
						category = 'prices';
					} else if(category == 'gmail' || category == 'facebook') {
						// if gmail or facebook, stop, since we don't have a gmail module yet
						return;
					}

					// don't create the panel, this will also exclude the feed_account
					// from being added to the data store
					if(!(category == 'keyword' && !feed_account.keyword_column)) {

						panels.create({
							type: category,
							tab: finfore.desktop.nodes.tabs.$main, 
							options: {
								feed_account: feed_account
								}
						});
						
					};
					
				};
				
				
			});
			
			// when the portfolios are done loading, enable management
			$.when(getPortfolios).then(function() {
				if(!smallScreen) {
					finfore.desktop.enableManagement();
				};
				
				Loader.hide();
			});
		
		};
		
		createMainPanels(finfore.data.user.feed_accounts);
		
		/* Company sorter based on comapny.position.
		 * Works the same way the column sorter works.
		 */
		
		// if the position attribute is not set, we set it to 999
		$.each(finfore.data.user.user_company_tabs, function(i, n) {
			if(n.position == null) n.position = 999;
		});
		
		// sort columns ascending
		finfore.data.user.user_company_tabs.sort(sortPosition);
	
		companies.add(finfore.data.user.user_company_tabs);
		
	};
	
	// core portfolios
	var portfolios = {
		// grab portfolio list and fire create panels
		create: function(panel) {
			finfore.data.portfolios.push({
				feed_account: panel
			});

			var index = finfore.data.portfolios.length - 1;
			
			return $.ajax({
				url: url.portfolioList,
				data: {
					feed_account_id: panel._id
				},
				success: function(portfolio) {
					portfolios.createPanels(portfolio, index);
				}
			});
		
		},
		// create all panels for a portfolio account
		createPanels: function(portfolio, index) {
			// authorization error
			if(portfolio.rss.chanel.error) {
				$().toastmessage('showErrorToast', 'Can\'t sign-in into your Google Portfolios account. <br>Please make sure the details are correct. ');
			};
		
			// if there's no portfolio list
			if(!portfolio.rss.chanel.item) {
				finfore.data.portfolios[0].list = [];
				return false;
			}
			
			if(!$.isArray(portfolio.rss.chanel.item)) {
				portfolio.rss.chanel.item = [portfolio.rss.chanel.item];
			}
			
			finfore.data.portfolios[index].list = portfolio.rss.chanel.item;
			
			$.each(finfore.data.portfolios[index].list, function() {
				var element = this;
				var myregexp = /[0-9]*$/;
				
				var match = myregexp.exec(this.id);				
				if (match != null) {
					this.id_bare = match[0];		
				}
				
				// give the browser some time to breathe
				setTimeout(function() {
					
					$.ajax({
						url: url.portfolioOverviews,
						type: 'GET',						
						data: {
							feed_account_id: finfore.data.portfolios[index].feed_account._id,
							portfolio_id: element.id_bare
						},
						success: function(overview) {
							// Add the overview to the data store
							element.overview = overview;
							
							finfore.panels.create({
								type: 'portfolio', 
								tab: finfore.desktop.nodes.tabs.$portfolio, 
								options: {
									panel: finfore.data.portfolios[index],
									portfolio: element
									}
							});														
							
							finfore.panels.create({
								type: 'agenda',
								tab: finfore.desktop.nodes.tabs.$portfolio, 
								options: {
									panel: finfore.data.portfolios[index],
									portfolio: element
									}
							});
								
							finfore.panels.create({
								type: 'feed',
								tab: finfore.desktop.nodes.tabs.$portfolio, 
								options: {
									panel: finfore.data.portfolios[index],
									portfolio: element
									}
							});
					
						}
					});
					
				}, 50);
			
			});			
			
		},
		// remove all panels asocieted to a portfolio account
		remove: function(panel) {
			var feedAccountId = panel.feed_account._id;
			$.each(finfore.data.panels.portfolio, function() {
				$.each(this, function() {
					if(this.panel.feed_account._id === feedAccountId) {
						finfore.desktop.panels.remove({							
							options: {
								panel: this
							}
						});
					};
				});
			});
		}
	};

	/* Panels */
	var panels = {
		// Create panel
		create: function(panel) {
			// Create data structure
			if(panel.options.company) {
				if(!finfore.data.panels.companies[panel.options.company.feed_info.id]) finfore.data.panels.companies[panel.options.company.feed_info.id] = {};
				if(!finfore.data.panels.companies[panel.options.company.feed_info.id][panel.type]) finfore.data.panels.companies[panel.options.company.feed_info.id][panel.type] = [];				
				
				finfore.data.panels.companies[panel.options.company.feed_info.id][panel.type].push(panel.options);
			} else if(panel.options.portfolio) {
				if(!finfore.data.panels.portfolio[panel.type]) finfore.data.panels.portfolio[panel.type] = [];
				
				finfore.data.panels.portfolio[panel.type].push(panel.options);
			} else {
				if(!finfore.data.panels.main[panel.type]) finfore.data.panels.main[panel.type] = [];
				
				finfore.data.panels.main[panel.type].push(panel.options);
			}
			
			setTimeout(function() {
				// Create panel DOM
				finfore.desktop.panels.create(panel);
			}, 50);
		},
		
		// Remove panel
		remove: function(panel) {
			// remove the element from the data store
			//var index = finfore.data.panels.main[panel.type].indexOf(panel.options.panel);
			finfore.data.panels.main[panel.type].splice(panel.options.index, 1);			
			
			// remove the dom node
			finfore.desktop.panels.remove(panel);
		}
	
	};
	
	/* Companies */
	var companies = {
		// Add Company
		add: function(companiesList, switchTab) {

			// update data
			finfore.data.companies = finfore.data.companies.concat(companiesList);			

			// create companies
			$.each(companiesList, function() {
				
				var	company = this,
					companyID = this._id,
					tabTitle = this.feed_info.title;
				
				finfore.desktop.tabs.add({
					id: companyID,
					title: tabTitle,
					closable: !finfore.data.user.is_public
					});
				
				var $tabView = $('#' + companyID),
					$tab;
					
				// use timeouts to make sure the columns are rendered in this order
				setTimeout(function() {
					// prices
					finfore.panels.create({
						type: 'prices',
						tab: $tabView,
						options: {
							company: company
							}
					});
				}, 10);
				
				setTimeout(function() {
					// company news
					finfore.panels.create({
						type: 'feed',
						tab: $tabView,
						options: {
							company: company
							}
					});
				}, 10);
				
				setTimeout(function() {
					// news from blogs
					finfore.panels.create({
						type: 'feed',
						tab: $tabView,
						options: {
							company: company,
							blogsearch: true
							}
					});
				}, 10);
				
				setTimeout(function() {
					// breaking news
					finfore.panels.create({
						type: 'twitter',
						tab: $tabView,
						options: {
							company: company
							}
					});
				}, 10);
				
				setTimeout(function() {
					// additional news
					finfore.panels.create({
						type: 'feed',
						tab: $tabView,
						options: {
							company: company,
							bingsearch: true
							}
					});
				}, 10);
				
				setTimeout(function() {
					// calendar
					finfore.panels.create({
						type: 'agenda',
						tab: $tabView,
						options: {
							company: company
							}
					});
				}, 10);
				
				setTimeout(function() {
					// competitors calendar
					finfore.panels.create({
						type: 'agenda',
						tab: $tabView,
						options: {
							company: company,
							competitor: true
							}
					});
				}, 10);
				
				setTimeout(function() {
					// competitor news
					finfore.panels.create({
						type: 'twitter',
						tab: $tabView,
						options: {
							company: company,
							competitor: true
							}
					});
				}, 10);
				
				setTimeout(function() {
					// broadcast news
					finfore.panels.create({
						type: 'blinkx',
						tab: $tabView,
						options: {
							company: company
							}
					});
				}, 10);
				
				// switch to newly added company
				// used by add-company
				if(switchTab) {
					if(largeScreen) {
						$tab = $('li:last', finfore.desktop.nodes.$tabList);
					} else {
						$tab = $('.collapsible-company:last', finfore.desktop.nodes.$tabletTabs);
					}
					
					// wait for the panels to be created
					setTimeout(function() {
						
						// Tablet binds the desktop.tabs.select event
						// to the expand event.
						// So we can just trigger expand.
						
						$tab.trigger('expand');
						
					}, 100);
					
				};
				
			});
		},
		// Remove Company
		remove: function() {
			var $tab = $(this).parents('div:first');
			var companyId = $tab.attr('data-company-id');
			var companyName = $(this).parents('h3:first').text();
			
			var form = '<h2>Are you sure you sure you want to remove <em>' + companyName + '</em>?</h2>';
			$.prompt(form, {
				callback: function(confirm, m, f) {
					
					if(confirm) {
						$.ajax({
							url: finforeBaseUrl + '/user_company_tabs/' + companyId + '.json',
							type: 'DELETE',
							data: {
								feed_account_id: companyId
							},
							success: function() {

								// remove company from internal data store
								$.each(finfore.data.companies, function(i, n) {
									if(n._id == companyId) {
										finfore.data.companies.splice(i, 1);
										
										return false;
									}
								});

							}
						});
						
						finfore.desktop.tabs.remove($tab);
					};
				
				},
				buttons: { Cancel: false, 'Remove Column': true }
			});
			
			return false;
		}
	};
	
	// security mesure for when you are logged-in as public user
	var secureApp = function() {
		// neutralize components
		finfore.manage = {};
		finfore.profile = {};
	};
	
	// init desktop
	var initDesktop = function(response) {
		// store selected focuses
		getSelectedFocuses();

		// init desktop
		finfore.desktop.init();
		
		// security measures for public users
		if(finfore.data.user.is_public) secureApp();
	};
	
	/* Init Core */
	var init = function() {
		// Set $.ajax defaults
		$.ajaxSetup({
			dataType: 'json'
		});
		
		// if a user is logged in
		if(user) ajaxDefaults();
		
		// get focus areas
		grabFocus(function() {
			
			if(user) {
			
				// refresh user object
				WebService.refreshUser({
					complete: initDesktop
				});
				
			} else {
			
				/* Get the _id of the 'USA & Canada' focus area,
				 * so that we can select it first, even if it's not first (alphabetically)
				 */
				var geographicId;
				$.each(finfore.data.focus.geographic.profiles, function() {
					if(this.title == 'USA & Canada') {
						geographicId = this._id;
					}
				});
			
				// get first focus' ids
				var ids = finfore.data.focus.industrial.profiles[0]._id + ',' + geographicId + ',' + finfore.data.focus.professional.profiles[0]._id;

				// log-in public account
				finfore.publicLogin({
					ids: ids
				}, initDesktop);
				
			}
		});
		
		if(finfore.data.user && !finfore.data.user.is_public) finfore.data.blankState = false;
		
		/* native apps
		 * Use childBrowser phoneGap plugin to open all _blank urls
		 */
		if(finforeNative) {
			
			$(document).on('click', 'a[target="_blank"]', function(event) {
				window.plugins.childBrowser.showWebPage($(this).attr('href'), { showLocationBar: true });
				
				return false;
			});
			
			// when resuming the app (from minimized in the background)
			document.addEventListener('resume', function() {
				var $loadedColumns = $('.panel.column-loaded');
				
				$loadedColumns.each(function() {
					$(this).trigger('refresh');
				});
			}, false);
			
		};
		
		
	};
	
	return {
		init: init,
		
		panels: panels,
		portfolios: portfolios,
		modules: modules,
		companies: companies,
		ticker: ticker,
		
		nodes: {},
		url: url,
		
		// data store
		data: data,
		storeData: storeData,
		
		//populate
		populate: populate,
		
		smallScreen: smallScreen,
		$body: $('body'),
		
		publicLogin: publicLogin
	}
}();

/* Mods for jQuery Mobile
 * Overrides jQ Mobile's Navigation model, disabling it.
 */
var lastActivePage;
finfore.$body.delegate('[data-role=dialog]', 'pageshow', function(event, ui) {
	if(ui.prevPage.attr('data-role') == 'page') lastActivePage = ui.prevPage;
});

/* Override the _create method in the $.mobile.dialog widget,
 * to be able to change the the event for the close button.
 * The _create method binds the action of the close button.
 */
$.mobile.dialog.prototype._create = function() {
	var self = this,
		$el = this.element,
		headerCloseButton = $( "<a data-" + $.mobile.ns + "icon='delete' data-" + $.mobile.ns + "iconpos='notext'>"+ this.options.closeBtnText + "</a>" );

	$el.addClass( "ui-overlay-" + this.options.overlayTheme );

	// Class the markup for dialog styling
	// Set aria role
	$el.attr( "role", "dialog" )
		.addClass( "ui-dialog" )
		.find( ":jqmData(role='header')" )
		.addClass( "ui-corner-top ui-overlay-shadow" )
			.prepend( headerCloseButton )
		.end()
		.find( ":jqmData(role='content'),:jqmData(role='footer')" )
			.addClass( "ui-overlay-shadow" )
			.last()
			.addClass( "ui-corner-bottom" );

	// this must be an anonymous function so that select menu dialogs can replace
	// the close method. This is a change from previously just defining data-rel=back
	// on the button and letting nav handle it
	
	// FASTND CHANGE
	headerCloseButton.bind('vclick', function() {
		$.mobile.changePage(lastActivePage, {
			changeHash: false,
			reverse: true,
			transition: 'slidedown'
		});
		
		return false;
	});

	/* bind events
		- clicks and submits should use the closing transition that the dialog opened with
		  unless a data-transition is specified on the link/form
		- if the click was on the close button, or the link has a data-rel="back" it'll go back in history naturally
	*/
	$el.bind( "vclick submit", function( event ) {
		var $target = $( event.target ).closest( event.type === "vclick" ? "a" : "form" ),
			active;

		if ( $target.length && !$target.jqmData( "transition" ) ) {

			active = $.mobile.urlHistory.getActive() || {};

			$target.attr( "data-" + $.mobile.ns + "transition", ( active.transition || $.mobile.defaultDialogTransition ) )
				.attr( "data-" + $.mobile.ns + "direction", "reverse" );
		}
	})
	.bind( "pagehide", function() {
		$( this ).find( "." + $.mobile.activeBtnClass ).removeClass( $.mobile.activeBtnClass );
	});
};

/* Override jQuery Mobile document.title auto-change
 */
var currentTitle = document.title;
finfore.$body.delegate('div[data-role=page], div[data-role=dialog]', 'pagebeforeshow', function(event, ui) {
	document.title = currentTitle;
});
