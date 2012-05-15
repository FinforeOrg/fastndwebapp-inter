/*
 * Finfore.net 
 * Login Component
 *
 */
finfore.login = function() {
	var $loginContainer, 
		$signinButton,
		nodes = {};
	
	var loadDesktop = function() {
		var $form = $(this),
			username = $('#login', $form).val(),
			password = $('#password', $form).val();
		
		WebService.auth({
			username: username,
			password: password,
			complete: function(user) {
				
				finfore.storeData({
					user: user
				});
				
				window.location.reload();
			}
		});
		
		return false;
	};
	
	var requestPassword = function() {
		var form = '<p><label>Type your email address in the field bellow and we will send you a message with your password: <br><input type="text" id="email" name="email" value="" class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c" placeholder="Email.."></label></p>';
		
		$.prompt(form, {
			callback: function(confirm, m, f) {
				
				if(confirm && f.email) {
					$.ajax({
						url: finforeBaseUrl + '/users/forgot_password.json',
						type: 'GET',
						data: {
							email: f.email
						},
						success: function(response) {				
							if(response.status == 'SUCCESS') {
								$().toastmessage('showSuccessToast', 'A message containing your password has been sent to your email address. ');
							} else {
								$().toastmessage('showErrorToast', 'We couldn\'t find your email address in our database. Please try again. ');
							}
						},
						error: function() {
							$().toastmessage('showErrorToast', 'We couldn\'t send you your password. Please try again later. ');
						}
					});
				};
			
			},
			buttons: { Cancel: false, 'Send Request': true }
		});
			
	};
	
	var init = function() {
		
		if(!$('#login-page').length) {
		
			var template = $.View('//webapp/views/login.tmpl', {
				user: finfore.data.user,
				focus: finfore.data.focus,
				selectedFocus: finfore.data.selectedFocus,
				smallScreen: finfore.smallScreen,
				finforeBaseUrl: finforeBaseUrl,
				finforeAppUrl: finforeAppUrl
			});			

			if($.mobile.hidePageLoadingMsg) $.mobile.hidePageLoadingMsg();
			
			finfore.$body.append(template);
			$loginContainer = $('#login-page');			
			
			$('#signup-button', $loginContainer).click(finfore.signup.init);
			
			if(finfore.smallScreen) {				
				$.mobile.changePage($loginContainer, {
					changeHash: false
				});
			} else {
				$.mobile.changePage($loginContainer, {
					transition: 'slidedown'
				});
			};			
			
			$loginContainer.find('form').bind('submit', loadDesktop);
			
			$('.forgot-password', $loginContainer).click(requestPassword);
			
			if(smallScreen) {
				nodes.$publicPage = $('#public-account-selector');
				nodes.$publicPage.page();
				
				nodes.$professionSelector = $('#profession', nodes.$publicPage);
				nodes.$geoSelector = $('#geographic', nodes.$publicPage);
				nodes.$industrySelector = $('#industry', nodes.$publicPage);
				
				$('.public-account-selector-btn').click(function() {
					var ids = nodes.$industrySelector.val() + ',' + nodes.$geoSelector.val() + ',' + nodes.$professionSelector.val();
					
					finfore.publicLogin({
						ids: ids
					}, function(response){
						
						// store received data
						finfore.storeData({
							user: response
						});
					
						window.location.reload();
					});
				});
				
				$('.public-account-btn').click(function() {
					$.mobile.changePage(nodes.$publicPage, {
						transition: 'slide'
					});
					return false;
				});
			};
			
			/* native apps
			 * Use childBrowser phoneGap plugin, for social sign-in
			 */
			if(finforeNative) {
				$('.social-signin a', $loginContainer).bind('click', function() {
					window.plugins.childBrowser.showWebPage($(this).attr('href'), { showLocationBar: false });
					
					return false;
				});
				
				/* If the URL is socialcallback.html, open it in the main view
				 * (it's not possible to open it in ChildBrowser)
				 * Close the ChildBrowser afterwards.
				 */
				window.plugins.childBrowser.onLocationChange = function (url) {
					if(url.indexOf(finforeAppUrl + 'socialcallback.html') == 0) {
						var localSocialCallback = url.replace(finforeAppUrl, finforeNativeUrl);
						// open local socialcallback.html with params in main webview
						window.location.href = localSocialCallback;
						
						window.plugins.childBrowser.close();
					}
				};
			};
			
		} else {
		
			$loginContainer = $('#login-page');
			$.mobile.changePage($loginContainer, {
				transition: 'slidedown'
			});
			
		}		
	};

	return {
		init: init
	}
}();