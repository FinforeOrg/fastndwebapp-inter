/*
 * Finfore.net Utils
 *
 * Polyfills
 * External APIs
 *
 */
 
/*** APIs ***/

/* Web Service API */
var WebService = {
	
	connectError: '<strong>Could not connect to FastND web service. </strong><br>Please try again in a few minutes. <br> Sorry for the delay in accessing our service. If the problem persists, please contact us.',
	
	// authentification
	auth: function(param) {
		$.mobile.showPageLoadingMsg();
		
		var requestParams = {
			user_session: {
				login: param.username,
				password: param.password
			}
		};
		
		$.ajax({
			url: finforeBaseUrl + '/user_sessions.json',
			type: 'POST',
			data: requestParams,
			success: function(response) {
				
				// run callback if present
				if(param.complete) param.complete(response);
			},
			error: function(error) {
				$().toastmessage('showErrorToast', '<strong>Invalid Username or Password</strong><br /> Please try again. ');
			},
			complete: function() {
				$.mobile.hidePageLoadingMsg();
			}
		});
		
	},
	
	// get focus areas
	focus: function(param) {

		var sortFocus = function(a, b) {
			var titleA = a.title.toLowerCase(),
				titleB = b.title.toLowerCase()
			
			if (titleA < titleB) //sort string ascending
				return -1 
			
			if (titleA > titleB)
				return 1
			
			return 0 //default return value (no sorting)
		};
		
		$.ajax({
			url: finforeBaseUrl + '/category_focus.json',
			type: 'GET',
			success: function(response) {
				
				// sort focuses ascending based on title
				response[0].profiles.sort(sortFocus);
				response[1].profiles.sort(sortFocus);
				response[2].profiles.sort(sortFocus);
			
				if(param.complete) param.complete(response);
				
			},
			error: function(error) {
			
				$().toastmessage('showToast', {
					text: WebService.connectError,
					sticky: true,
					position: 'top-right',
					type: 'error'
				});
				
				Loader.hide();
				
			}
		});
		
	},
	
	// update existing user object
	updateUser: function(param) {
	
		// show the loader
		Loader.show();
	
		$.ajax({
			url: finforeBaseUrl + '/users/' + finfore.data.user._id + '.json',
			type: 'PUT',
			data: {
				user: param.data
			},
			success: function(user) {
				finfore.data.user = user;
			
				// store received data
				finfore.storeData({
					user: user
				});
				
				if(param.complete) param.complete(user);
			},
			error: function() {
				
				$().toastmessage('showToast', {
					text: 'There was a problem updating your profile. Please try again later. ',
					type: 'error',
					sticky: true
				});	
				
			},
			complete: function() {
				Loader.hide();
			}
		});
		
	
	},
	
	// refresh existing user object
	refreshUser: function(param) {
	
		// show the loader
		Loader.show();
	
		$.ajax({
			url: finforeBaseUrl + '/users/' + finfore.data.user._id + '.json',
			type: 'GET',
			success: function(response) {
				finfore.data.user = response;
				
				// store received data
				finfore.storeData({
					user: response
				});
				
				if(param.complete) param.complete(response);
			},
			error: function() {
				
				$().toastmessage('showToast', {
					text: WebService.connectError,
					sticky: true,
					position: 'top-right',
					type: 'error'
				});
				
			},
			complete: function() {
				Loader.hide();
			}
		});
	
	},
	
	// update multiple companies data
	updateCompanies: function(param) {
	
		$.ajax({
			url: finforeBaseUrl + '/users/' + finfore.data.user._id + '.json',
			type: 'PUT',
			data: {
				user: {
					user_company_tabs_attributes: param.userCompanyTabs
				}
			},
			success: function(response) {
				
				if(param.complete) param.complete();
				
			}
		});
	
	},
	
	// update multiple columns data
	updateColumns: function(param) {
	
		$.ajax({
			url: finforeBaseUrl + '/users/' + finfore.data.user._id + '.json',
			type: 'PUT',
			data: {
				user: {
					feed_accounts_attributes: param.columns
				}
			},
			success: function(response) {
				if(param.complete) param.complete();
			}
		});
	
	},
	
	// get a feed_account object
	getColumn: function(param) {
		
		
		
	}
	
	/*
	 * MANAGEMENT
	 */

};

/* Internal Loader */
var Loader = {
	$body: $('body'),
	
	show: function() {
		this.$body.addClass('ui-loading');
	},
	
	hide: function() {
		this.$body.removeClass('ui-loading');
	}
};

/* Feed API */
var feedReader = {},
	callbackCounter = -1;

feedReader.get = function(params) {
	var yqlUrl = 'http://query.yahooapis.com/v1/public/yql',
		q = 'select channel.title, channel.item.title, channel.item.link, channel.item.enclosure, channel.item.description, channel.item.date, channel.item.pubDate from xml where url in(';
	
	// set sources
	$.each(params.sources, function(i, n) {
		if(i !== 0) q += ',';
		q += '"' + n + '"';
	});

	q += ') | unique(field="channel.item.link") | sort(field="channel.item.date", descending="true") | sort(field="channel.item.pubDate", descending="true")  | truncate(count=' + params.limit + ')';
	
	/* using a specific jsonp callback named function we can take advantage of
	 * both the browser's and yql's caching mechanisms.
	 */
	 
	// generated callback name
	var callbackName = 'feedReaderCallback';
	
	if(params.callbackId) {
		// unique column id for caching
		callbackName += params.callbackId;
	} else {
		// use number instead of id
		callbackCounter++;
		callbackName += callbackCounter;
	}
	
	// generated callback
	window[callbackName] = function(response) {
		feedReaderCallback(response, params); // call real callback with params
		delete window[callbackName]; // cleanup
	};
	
	// Manual jsonp call, to try and fix mobile issues
	var requestUrl = yqlUrl + '?q=' + $.URLEncode(q) + '&format=json&diagnostics=false&_maxage=300&callback=' + callbackName;

	// Fixes for RETARDED server-side redirection of mobile user-agents, that block certain RSS on mobile
	// make request through php proxy with desktop firefox user agent
	if( (finfore.smallScreen || finfore.tablet) && !params.podcast ) {
		requestUrl = finforeAppUrl + 'mobileProxy.php?url=' + $.URLEncode(requestUrl) + '&mode=native&user_agent=' + $.URLEncode('Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0');
	};
	
	// manual jsonp call
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = requestUrl;
	document.body.appendChild(script);
};

// required to keep the request url the same every time, cache
function feedReaderCallback(response, params) {
	var entries = [],
		description = '',
		date = new Date();
	
	if(response.query && response.query.results && response.query.results.rss) {
		if(!$.isArray(response.query.results.rss)) {
			response.query.results.rss = [response.query.results.rss];
		}
		
		entries = $.map(response.query.results.rss, function(e, i) {
			if(!e.channel.item) return null; // remove the item if non-existent
			
			if(e.channel.item.description) {
				description = e.channel.item.description.replace(/(<([^>]+)>)/ig, '').substring(0, 200) + '..';
			} else if(e.channel.item.summary) {
				description = e.channel.item.summary.replace(/(<([^>]+)>)/ig, '').substring(0, 200) + '..'
			};
			
			try {
				return {
					title: '' || e.channel.item.title.replace(/(<([^>]+)>)/ig, ''),
					link: '' || e.channel.item.link,
					description: '' || description,
					pubDate: (e.channel.item.pubDate) ? new Date(e.channel.item.pubDate) : new Date(e.channel.item.date),
					source: '' || e.channel.title,
					enclosure: '' || e.channel.item.enclosure
				}
			} catch(e) {
				return null;
			}
		});
	};
	
	params.complete(entries);
};
 