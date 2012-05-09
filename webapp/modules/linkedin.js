/*
 * FinFore.net 
 * LinkedIn Module
 *
 */
 
// Define module
finfore.modules.linkedin = function() {
	// LinkedIn Module Management
	var management = function($container) {
		var category = 'linkedin';
		if(!finfore.data.panels.main[category]) finfore.data.panels.main[category] = [];		
	
		// get and render Twitter Managemenet template
		var template = $.View('//webapp/views/module.linkedin.management.tmpl', {
			panels: finfore.data.panels.main.linkedin
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

	};
	
	var init = function($container, options) {			
		var $updatesList, $connectButton;
		
		var refresh = function() {
			$container.addClass('panel-loading');
			empty($updatesList[0]);
			
			// get updates
			$.ajax({
				url: finforeBaseUrl + '/linkedins/network_status.json',				
				dataType: 'json',
				data: {
					tid: options.feed_account.feed_token._id,
					count: 25
				},
				success: function(updates) {
					var markup = '',
						user, userUrl, connection, comment, connectionUrl, pictureUrl, timestamp,
						contentTitle, contentUrl,
						time = new Date();
					
					if(updates && updates.length) {
						$.each(updates, function(i, n) {
							
							/* Check if user is private
							 * If the user is private, we won't get any data.
							 */
							if(n.updateContent.person.id != 'private') {
							
								timestamp = n.timestamp;
								time.setTime(timestamp * 1);
								
								markup += '<li class="ui-li ui-btn-up-c">';
							
								user = n.updateContent.person.firstName + ' ' + n.updateContent.person.lastName;
								userUrl = n.updateContent.person.apiStandardProfileRequest.url;
								pictureUrl = n.updateContent.person.pictureUrl;
							
								if(pictureUrl) {
									markup += '<a href="' + userUrl + '" target="_blank"><img src="' + pictureUrl + '" width="80" height="80" /></a>';
								};
								
								// connection
								if(n.updateContent.person.connections) {						
									
									connection = n.updateContent.person.connections.person.firstName + ' ' + n.updateContent.person.connections.person.lastName;
									connectionUrl = n.updateContent.person.connections.person.apiStandardProfileRequest.url;
									
									markup += '<p><a href="' + userUrl + '" target="_blank" class="user">' + user + '</a> connected with <a href="' + connectionUrl + '" class="connection" target="_blank">' + connection + '</a></p>';
									
								} else if (n.updateContent.person.currentShare) {
									
									// comment
									if(n.updateContent.person.currentShare.comment) {
										comment = $.linkUrl(n.updateContent.person.currentShare.comment);

										markup += '<p><a href="' + userUrl + '" target="_blank" class="user">' + user + '</a> ' + comment + '</p>';
									};
									
									// comment content
									if(n.updateContent.person.currentShare.content) {
										contentTitle = n.updateContent.person.currentShare.content.title;
										contentUrl = n.updateContent.person.currentShare.content.submittedUrl;
										
										markup += '<p><a href="' + contentUrl + '" target="_blank" class="user">' + contentTitle + '</a></p>';
									};
									
								};
								
								markup += '<time>' + time.toUTCString() + '</time>';
								markup += '</li>';
							
							};
							
						});
					} else {
						markup = '<li class="ui-li ui-btn-up-d">No LinkedIn events</li>';
					}
					
					$(markup).appendTo($updatesList);
					$container.removeClass('panel-loading');
				}
			});
		};
		
		var build = function() {
			var autorefresh,
				connected = (!options.feed_account.feed_token || !options.feed_account.feed_token.token);
			
			var moduleContent = $.View('//webapp/views/module.linkedin.tmpl', {
				connected: !connected
			});
			var template = $.View('//webapp/views/module.tmpl', {
				title: options.feed_account.name,				
				smallScreen: finfore.smallScreen,
				content: moduleContent
			});				
			$(template).appendTo($container);
			
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
			
			$updatesList = $('[data-role=content] ul', $container);		
			$connectButton = $('.linkedin-connect-button', $container);
			// if a token is not set
			if(connected) {
				//var authUrl = options.feed_account.feed_token.url_oauth;
				var authUrl = finforeBaseUrl + '/feed_accounts/linkedin/auth?feed_account_id=' + options.feed_account._id + '&callback=' + finforeAppUrl + 'authorize.html';
				
				$connectButton.click(function() {
					$connectButton.hide();
					$container.addClass('panel-loading');
												
					var authWindow = window.open(authUrl, 'linkedinAuthWindow', 'resizable=yes,scrollbars=yes,status=yes');
					
					/* Because we can't use the onunload event properly on the popup,
					 * we have to check the token from the server at an interval with an ajax call.
					 * If the call returns a proper feed, the account has been authorized,
					 * else we keep repeating the call.
					 */					
					var checkAuth = function() {
						$.ajax({
							url: finforeBaseUrl + '/feed_tokens.json',
							type: 'POST',
							data: {
								auth_token: finfore.data.user.single_access_token,
								feed_token: {
									feed_account_id: options.feed_account.id,
									user_id: options.feed_account.user_id
								}
							},
							success: function(token) {								
								if(token.feed_token && token.feed_token.token) {											
									options.feed_account.feed_token = token.feed_token;										
									
									empty($container[0]);
									$container.removeClass('panel-loading');
									$container.removeData();
									
									build();
								} else {
									// If the popup is still open, Check the token again after 10sec									
									if(!authWindow.closed) {									
										setTimeout(checkAuth, 10000);
									} else {
										$connectButton.show();
										$container.removeClass('panel-loading');
									}

								}
							}
						});
					};					
					checkAuth();
					
					return false;
				});
			} else {
				
				if(!finfore.smallScreen) {
					var autorefresh = setInterval(refresh, 300000);
				};
				
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