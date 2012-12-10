/*
 * Finfore.net 
 * Help Dialog
 *
 */
finfore.help = function() {
	var $container, nodes = {};
	
	var sendHelpMessage = function() {
		var params = nodes.$form.serialize();
		var sendMessageUrl = finforeBaseUrl + "/users/contact_admin";
		params += '&auth_token=' + finfore.data.user.single_access_token;
		
		// form validation
		var validation = (nodes.$subjectField.val() && nodes.$messageField.val() && nodes.$nameField.val() && nodes.$emailField.val());
		if(!validation) {
			$().toastmessage('showToast', {
				text: 'Please fill in all the available fields. ',
				sticky: true,
				position: 'top-right',
				type: 'error'
			});
			return false;
		};
		
		$.mobile.showPageLoadingMsg();
		
		$.ajax({
			url: sendMessageUrl,
			type: 'POST',
			data: params,
			complete: function() {
				// show a success message
				$().toastmessage('showSuccessToast', 'Successfully sent message. ');
				
				$.mobile.changePage(finfore.desktop.nodes.$page, {
					transition: 'slidedown'
				});
				
				// hide the loader and change the page
				$.mobile.hidePageLoadingMsg();
			}
		});	
		
		return false;
	};
	
	var init = function() {
		if(!$container) {
			var template = $.View('//webapp/views/help.tmpl', {});
			$(template).appendTo(finfore.$body);
			
			$container = $('.help-page');
			nodes.$form = $('form', $container);
			nodes.$subjectField = $('#subject', nodes.$form);
			nodes.$messageField = $('#message', nodes.$form);
			nodes.$nameField = $('#name', nodes.$form);
			nodes.$emailField = $('#email', nodes.$form);
			
			// bind submit event to save form data
			nodes.$form.submit(sendHelpMessage);
			
			$.mobile.changePage($container, {
				transition: 'slidedown'
			});
		} else {
			$.mobile.changePage($container, {
				transition: 'slidedown'
			});
		}
	};

	return {
		init: init
	}
}();