/*
 * Finfore.net 
 * Signup Component
 *
 */

finfore.signup = function() {
	var $page, $pageContent, $page1, $page2;
	var $signinButton, $twitterAuthBtn, $linkedInAuthBtn, $googleAuthBtn, $facebookAuthBtn, $finishBtn;
	
	var showLoader = function(hide) {
		if (hide) {
			$pageContent.removeClass('signup-loading');		
		} else {
			$pageContent.addClass('signup-loading');
		}		
	};
	
	var showPageTwo = function(response) {
		// log user in
		finfore.data.user = response;
		Storage.setItem('user', JSON.stringify(finfore.data.user));
		
		// show the second page
		$page1.hide();
		$page2.show();
		
		// hide loader
		$.mobile.hidePageLoadingMsg();
	};
	
	var register = function() {
		$.mobile.showPageLoadingMsg();	
		
		var params = $(this).serialize();		
		var signup_url = finforeBaseUrl + '/users.json';		
		
		$.ajax({
			url: signup_url,
			type: 'POST',
			data: params,
			error: function(xhr) {
					// hide loader
					$.mobile.hidePageLoadingMsg();
					
					try {
						var response = JSON.parse(xhr.responseText);
					} catch(e) {
						// in case the JSON parser brakes
						$().toastmessage('showToast', {
							text: 'There was a problem registering your user. Please try again later.',
							type: 'error',
							sticky: true
						});	
						return false;
					}
					
					// parse error messages
					var errorField;
					for(prop in response) {
						errorField = prop;
						
						if(errorField == 'email_work') errorField = 'Your email';						
						if(errorField == 'password') errorField = 'Your password';
						
						// don't show error notice if related to 'login' or 'password_confirmation'
						if(errorField !== 'password_confirmation' && errorField !== 'login') {
							var errorMessage = '<strong>' + errorField + '</strong> ' + response[prop][0];
							$().toastmessage('showToast', {
								text: errorMessage,
								sticky: true,
								type: 'error'
							});
						}
					};	

			},
			success: showPageTwo
		});
				
		return false;
	};
	
	var authorizeService = function() {
		var $button = $(this);		
		var type = $(this).attr('data-type');
		
		var authWindow = window.open(finforeBaseUrl + '/feed_accounts/' + type + '/auth?auth_token=' + finfore.data.user.single_access_token + '&auth_secret=' + finfore.data.user.persistence_token + '&callback=' + finforeAppUrl + 'authorize.html', '_blank', 'resizable=yes,scrollbars=yes,status=yes');
		
		window.addEventListener('message', authorized = function(e) {
			//if (e.origin !== finforeAppUrl) return;
			var feedAccountId = e.data;
			
			$button.hide();
			
			window.removeEventListener('message', authorized);
		}, false);

	};	
	
	var init = function() {
		if(!$('#signup-page').length) {
		
			var template = $.View('//webapp/views/signup.tmpl', {
				focus: finfore.data.focus,
				finforeBaseUrl: finforeBaseUrl,
				finforeAppUrl: finforeAppUrl,
				smallScreen: finfore.smallScreen
			});
			$(template).appendTo(finfore.$body);
			
			$page = $('#signup-page');
			$pageContent = $('[data-role=content]', $page);
			$page1 = $('#signup-page1', $pageContent);
			$page2 = $('#signup-page2', $pageContent);
			
			// get authorize buttons
			$twitterAuthBtn = $('.twitter-connect-button', $page);
			$linkedinAuthBtn = $('.linkedin-connect-button', $page);
			$googleAuthBtn = $('.google-connect-button', $page);
			
			// finish button
			$finishBtn = $('#finish-btn');
			
			$twitterAuthBtn.click(authorizeService);			
			$linkedinAuthBtn.click(authorizeService);			
			$googleAuthBtn.click(authorizeService);
			
			$finishBtn.click(function() {
				// reload the page to finish the signup
				window.location.reload();
			});
			
			$.mobile.changePage($page, {
				transition: 'slidedown'
			});	
			
			$pageContent.find('form').submit(register);
			
			/* native apps
			 * Use childBrowser phoneGap plugin, for social sign-in
			 */
			if(finforeNative) {
				$('.social-signin a', $page).bind('click', function() {
					window.plugins.childBrowser.showWebPage($(this).attr('href'), { showLocationBar: false });
					
					return false;
				});
				
				/* If the URL is socialcallback.html, open it in the main view
				 * (it's not possible to open it in ChildBrowser)
				 * Close the ChildBrowser afterwards.
				 */
				window.plugins.childBrowser.onLocationChange = function (url) {
					if(url.indexOf(finforeAppUrl + 'socialcallback.html') == 0) {
						window.location.href = url;
						window.plugins.childBrowser.close();
					}
				};
			};
			
		} else {
			$.mobile.changePage($('#signup-page'), {
				transition: 'slidedown'
			});		
		};
		
	};

	return {
		init: init,
		authorizeService: authorizeService
	}
}();