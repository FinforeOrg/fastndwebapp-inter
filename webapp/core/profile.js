/*
 * Finfore.net 
 * Profile Settings
 *
 */
finfore.profile = function() {
	var $container, $closeAccountBtn;
	
	var updateProfile = function() {
		// custom validation
		var $geoFocus = $('#user_geographic', $container),
		$profFocus = $('#user_profession', $container),
		$indFocus = $('#user_industry', $container);
		
		var validation = ($geoFocus.val() && $profFocus.val() && $indFocus.val());
		if(!validation) {
			$().toastmessage('showToast', {
				text: 'Please select at least one interest in each focus area selector. ',
				sticky: true,
				position: 'top-right',
				type: 'error'
			});
			return false;
		};
		
		// show the loader
		Loader.show();
		
		var params = $(this).serializeObject();
		params.id = finfore.data.user._id;
		
		WebService.updateUser({
			data: params,
			complete: function() {
				
				$.mobile.changePage(finfore.desktop.nodes.$page, {
					transition: 'slidedown'
				});
				
				// if the user updated his profile for the first time, reload the page
				// and remove the updateProfile object from localStorage
				if(finfore.data.updateProfile) {
					Storage.removeItem('updateProfile');
					window.location.reload();
				}
				
				// show a success message
				$().toastmessage('showSuccessToast', 'Successfully updated your profile. ');
			}
		});
		
		return false;
	};
	
	var init = function() {
		if(!$container) {	
			var template = $.View('//webapp/views/profile.tmpl', {
				user: finfore.data.user,
				updateProfile: finfore.data.updateProfile,
				focus: finfore.data.focus,
				selectedFocus: finfore.data.selectedFocus,
				smallScreen: finfore.smallScreen,
				panels: finfore.data.panels,
				portfolios: finfore.data.portfolios
			});
			
			$(template).appendTo(finfore.$body);
				
			$container = $('#profile-page');
			$closeAccountBtn = $('#close-account-btn');
			
			// bind submit event to save form data
			$('form', $container).submit(updateProfile);
			
			/* Social Networking Connect Buttons */			
			var $twitterAuthBtn = $('.twitter-profile-connect', $container),
				$linkedinAuthBtn = $('.linkedin-profile-connect', $container),
				$googleAuthBtn = $('.google-profile-connect', $container);
			
			$twitterAuthBtn.click(finfore.signup.authorizeService);
			$linkedinAuthBtn.click(finfore.signup.authorizeService);			
			$googleAuthBtn.click(finfore.signup.authorizeService);
		}
		
		$.mobile.changePage($container);
	};

	return {
		init: init
	}
}();