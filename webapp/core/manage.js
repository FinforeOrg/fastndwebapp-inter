/*
 * Finfore.net 
 * Content Management
 *
 */

finfore.manage = function() {
	var $container,
		$signinButton,
		managementQueue = 0,
		$managementTabs,
		$managementTabsList;
	
	// update Feed Infos
	var updateFeedInfos = function(options) {
		// add loading class
		$(options.$node).addClass('loading-content');
		
		// make ajax call to get feed_infos
		$.ajax({ 
			url: finforeBaseUrl + '/feed_infos.json',
			type: 'GET',
			dataType: 'text',
			data: {
				category: options.category,
				per_page: 50,
				page: options.count
			},
			success: function(feed_infos) {
				// manually loose convert from text to json, to bypass json errors with special chars
				feed_infos = eval(feed_infos);
				
				finfore.data.feedInfos[options.category] = feed_infos;
				
				var template = $.View('//webapp/views/manage.feed-infos.tmpl', {
					feeds: feed_infos,
					name: options.category,
					type: options.type
				});
				
				$('.list-view', options.$node).append(template);
				$(options.$node).removeClass('loading-content');
				
				$('.list-view label', options.$node).draggable({
					revert: "invalid",
					helper: "clone",
					cursor: "move"					
				});
			}
		});		
	};
	
	// error and success notice messages
	var messages = {		
		// panels
		saveColumn: 'Successfully saved new column. ',
		errorSaveColumn: 'Couldn\'t save new column. ',
		updateColumn: 'Successfully updated the column. ',
		errorUpdateColumn: 'Couldn\'t update column. Please try again later.',
		deleteColumn: 'Successfully removed column. ',
		errorDeleteColumn: 'Couldn\'t remove column. ',
		
		// sources
		saveSource: 'Successfully saved new source. ',
		errorSaveSource: 'Couldn\'t save new source. ',
		deleteSource: 'Successfully removed source. ',
		errorDeleteSource: 'Couldn\'t removed source. ',
		
		// twitter
		errorGetFriends: 'Your authorization token has expired. Please revalidate your account. ',
		saveUser: 'Successfully added new user. ',
		errorSaveUser: 'Couldn\'t add new user. ',
		deleteUser: 'Successfully unfollowed user. ',
		errorDeleteUser: 'Couldn\'t unfollow user. '
	};
	
	// bind panels dom nodes to their data stores
	var bindPanelData = function(params) {
		// bind panel data
		var $panels = $(params.$container).find('> input[data-index]');		
		$.each($panels, function(n, i) {
			var $this = $(this);
			var index = parseInt($this.attr('data-index'));			
			
			if(params.category == 'portfolio') {
				$.data($this[0], 'data', finfore.data.portfolios[index]);
			} else {
				$.data($this[0], 'data', finfore.data.panels.main[params.category][index]);
			}
			
			$this.removeAttr('data-index');
			
			if(params.category == 'twitter') {				
				twitter.getFriends({
					$node: $this,
					category: 'twitter'
				});
			} else {				
				// bind sources data
				var $tabContent = $this.next().next();
				bindSourcesData({
					$container: $tabContent,
					category: params.category,
					index: index
				});
			};
			
		});
				
	};
	
	// bind sources dom nodes to their data stores
	var bindSourcesData = function(params) {
		var $sources = $('input[data-index]', params.$container);
		$.each($sources, function(n, i) {
			var $this = $(this);
			var sourceIndex = parseInt($this.attr('data-index'));
			if(params.category == 'portfolio') {
				$.data($this[0], 'data', finfore.data.portfolios[params.index].list[sourceIndex]);
			} else {
				$.data($this[0], 'data', finfore.data.panels.main[params.category][params.index].feed_account.user_feeds[sourceIndex]);
			}
			
			$this.removeAttr('data-index');
		});
	};
	
	/* Panel management */
	var panels = {
		create: function(params) {
			var index, panel, form;
			
			if(params.category == 'twitter' || params.category == 'linkedin' || params.category == 'portfolio') {
				if(params.category == 'portfolio') {
					index = finfore.data.portfolios.length;
				} else {
					index = finfore.data.panels.main[params.category].length;				
				}
				
				var callbackUrl = finforeAppUrl + 'authorize.html',
					category = (params.category == 'portfolio') ? 'google' : params.category + '';
				
				var authWindow = window.open(finforeBaseUrl + '/feed_accounts/' + category + '/auth?auth_token=' + finfore.data.user.single_access_token + '&auth_secret=' + finfore.data.user.persistence_token + '&callback=' + callbackUrl, '_blank', 'resizable=yes,scrollbars=yes,status=yes');
				
				window.addEventListener('message', authorized = function(e) {
					panels.authorizeListner(e, params, index);
				}, false);
				
			} else {
				
				index = finfore.data.panels.main[params.category].length;
				panel = finfore.data.panels.main[params.category][index];
				form = '<h2>Create Column</h2><label>Title <br><input type="text" id="columnTitle" name="columnTitle" value="" class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c" placeholder="Column name.."></label>';				
				
				
				function createConfirm(confirm, m, f) {
					if(confirm && f.columnTitle) {
						$.mobile.showPageLoadingMsg();
						
						// default update params
						var feedAccountParams = {
							name: f.columnTitle
						};
						
						// category
						feedAccountParams.category = params.category;
						if(params.category == 'feed') feedAccountParams.category = 'rss';
						if(params.category == 'prices') feedAccountParams.category = 'chart';
						
						if(params.category == 'keyword') {
							feedAccountParams.keyword_column_attributes = {
								is_aggregate: false,
								follower: 0,
								keyword: f.columnTitle
							};							  
						}
						
						$.ajax({
							url: finforeBaseUrl + '/feed_accounts.json',
							type: 'POST',
							data: {
								feed_account: feedAccountParams,
								dependency: 'false'
							},
							success: function(panel) {

								panel = {
									feed_account: panel
								};
							
								if(params.category == 'keyword') {
									panel.feed_account.keyword_column = feedAccountParams.keyword_column_attributes;
								};
								
								panels.createSuccess(params, index, panel);
							},
							error: function() {
								$().toastmessage('showErrorToast', messages.errorSaveColumn);
							},
							complete: function() {
								$.mobile.hidePageLoadingMsg();
							}
						});
					}
				}
				
				$.prompt(form, {
					callback: createConfirm,
					buttons: { Cancel: false, 'Create Column': true }
				});
			}
		},
		createSuccess: function(params, index, panel) {
			$().toastmessage('showSuccessToast', messages.saveColumn);
			
			panel = panel.feed_account;
			panel.user_feeds = [];
			
			var template = $.View('//webapp/views/manage.panels.tmpl', {
				panel: panel,
				index: index,
				category: params.category
			});			
			params.$node.append(template);
			params.$node.trigger('create');
			
			// select new panel
			var $newInput = $('input:last', params.$node);
			$newInput.attr('checked', 'checked').trigger('change');
		
			// refresh controlgroup
			var $tabContainer = $newInput.next().next();
			$tabContainer.find("[data-role=controlgroup] a").button();
			$tabContainer.find("[data-role=controlgroup]").controlgroup();

			// make new panel sources content droppable
			var $presetTabs = params.$node.parents('.management-tab-panel').find('.preset-tabs');
			$('.mtab-content:last', params.$node).droppable({
				activeClass: "ui-state-highlight",
				drop: function(e, ui) {				
					finfore.manage.sources.addPreset({
						$node: $newInput,
						$presets: $presetTabs,
						category: params.category
					});	
				}
			});
			
			// create tab in data-store and desktop
			if(params.category === 'portfolio') {
				finfore.portfolios.create(panel);
			} else {				
				finfore.panels.create({
					type: params.category,
					tab: finfore.desktop.nodes.tabs.$main, 
					options: {
						feed_account: panel
						}
				});				
			};
			
			bindPanelData({
				$container: params.$node,
				category: params.category
				});
		
		},
		authorizeListner: function(e, params, index) {
			if(finforeAppUrl.indexOf(e.origin) == -1) return;
			var feedAccountId = e.data;
			
			$.mobile.showPageLoadingMsg();							
			$.ajax({
				url: finforeBaseUrl + '/feed_accounts/' + feedAccountId + '.json',
				type: 'GET',
				success: function(panel) {
					panel = {
						feed_account: panel
					};
					panels.createSuccess(params, index, panel);
				},
				complete: function() {
					$.mobile.hidePageLoadingMsg();
				}
			});
			
			window.removeEventListener('message', authorized);			
		},
		revalidate: function(params) {
			var index, panel, feedAccountId;
			
			if(params.category == 'twitter' || params.category == 'linkedin') {
				index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
				panel = finfore.data.panels.main[params.category][index];
				feedAccountId = panel.feed_account._id;				
				
				var authWindow = window.open(finforeBaseUrl + '/feed_accounts/' + params.category + '/auth?auth_token=' + finfore.data.user.single_access_token + '&auth_secret=' + finfore.data.user.persistence_token + '&feed_account_id=' + feedAccountId + '&callback=' + finforeAppUrl + 'authorize.html', '_blank', 'resizable=yes,scrollbars=yes,status=yes');
				
				window.addEventListener('message', authorized = function(e) {
					panels.authorizeListner(e, params, index);
				}, false);
			}
		},
		edit: function(params) {
			var index, panel;
			
			if(params.category === 'portfolio') {
				index = finfore.data.portfolios.indexOf($.data(params.$node[0], 'data'));
				panel = finfore.data.portfolios[index];
			} else {
				index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
				panel = finfore.data.panels.main[params.category][index];				
			}
			
			var form = '<h2>Edit Column Title</h2><label>Title <br><input type="text" id="columnTitle" name="columnTitle" value="' + panel.feed_account.name + '" class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c"></label>';			
	
			function editConfirm(confirm, m, f) {
				if(confirm && f.columnTitle) {
					// default update params					
					var feedAccountParams = {
						_id: panel.feed_account._id,
						name: f.columnTitle
					};
					
					$.ajax({
						url: finforeBaseUrl + '/feed_accounts/' + feedAccountParams._id + '.json',
						type: 'PUT',
						data: {
							feed_account: feedAccountParams
						},
						success: function(response) {
							$().toastmessage('showSuccessToast', messages.updateColumn);
							
							// update data-store							
							panel.feed_account = response.feed_account;
						},
						error: function(response) {
							$().toastmessage('showErrorToast', messages.errorUpdateColumn);
						}
					});
					
					
					var newTitle;
					if(params.category === 'portfolio') {
						newTitle = f.columnUsername;
					} else {
						newTitle = f.columnTitle;
					}					
					
					// update panel title
					$('.ui-header .ui-title', params.$node).text(newTitle);
					
					// update manage titles
					$('.mtab-title > span', params.$node.next().next()).text(newTitle);					
					params.$node.next().text(newTitle);					
					
				}
			}
			
			$.prompt(form, {
				callback: editConfirm,
				buttons: { Cancel: false, 'Update Column': true }
			});
		},
		remove: function(params) {	
			var index, form, panel;
			
			if(params.category === 'portfolio') {
				index = finfore.data.portfolios.indexOf($.data(params.$node[0], 'data'));
				panel = finfore.data.portfolios[index];
				
			} else {
				
				index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
				panel = finfore.data.panels.main[params.category][index];
				
			};
			
			form = '<h2>Are you sure you sure you want to remove <em>' + panel.feed_account.name + '</em>?</h2>';

			
			function removeconfirm(confirm, m) {
				
				if(confirm) {
					$.ajax({
						url: finforeBaseUrl + '/feed_accounts/' + panel.feed_account._id + '.json',
						type: 'DELETE',
						success: function(response) {
							$().toastmessage('showSuccessToast', messages.deleteColumn);
						},
						error: function(response) {
							$().toastmessage('showErrorToast', messages.errorDeleteColumn);
						}
					});
					
					// select previous dom node
					params.$node.prevAll('input:first').attr('checked', 'checked').trigger('change');
					
					// remove management dom nodes
					params.$node.next().remove().end()
								.next().remove().end()
								.remove();
					
					// remove data store
					if(params.category === 'portfolio') {
						finfore.portfolios.remove(panel);
					} else {
						finfore.panels.remove({
							type: params.category,
							tab: finfore.desktop.nodes.tabs.$main,
							options: {
								panel: panel,
								index: index
							}
						});
					}
				}
			};
			
			$.prompt(form, {
				callback: removeconfirm,
				buttons: { Cancel: false, Remove: true }
			});			
			
		}
	};
	
	/* Source management */
	var sources = {
		addCustom: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
			var feedAccountID = finfore.data.panels.main[params.category][index].feed_account._id;
			
			if(params.category === 'twitter') {
				var form = '<h2>Add Custom User</h2><input type="text" id="sourceTitle" name="sourceTitle" value="twitter" placeholder="Title of your source.." class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c" style="display: none"><label>Twitter Username <br> <input type="text" id="sourceURL" name="sourceURL" value="" placeholder="Username.." class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c"></label>';
			} else {
				var form = '<h2>Add Custom Source</h2><label>Source Title <br> <input type="text" id="sourceTitle" name="sourceTitle" value="" placeholder="Title of your source.." class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c"></label><label>Source URL <br> <input type="url" id="sourceURL" name="sourceURL" value="" placeholder="URL of your source.." class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c"></label>';
			}
			
			function addCustomConfirm(confirm, m, f) {
				if(confirm && f.sourceTitle && f.sourceURL) {
					// show loading message
					$.mobile.showPageLoadingMsg();
					
					var category_type = params.category;
					if(params.category == 'feed') category_type = 'rss';
					if(params.category == 'prices') category_type = 'chart';
					
					$.ajax({
						url: finforeBaseUrl + '/feed_accounts/' + feedAccountID + '.json',
						type: 'PUT',
						data: {
							feed_account: {
								_id: feedAccountID,
								user_feeds_attributes: [{
									feed_info_attributes: {
										category: category_type,
										title: f.sourceTitle,
										address: f.sourceURL
									}
								}]
							}
						},
						success: function(feed_account) {
							
							// update data store
							finfore.data.panels.main[params.category][index].feed_account = feed_account;
							
							var sourceIndex = feed_account.user_feeds.length - 1;
							
							/*
							// update data store
							finfore.data.panels.main[params.category][index].feed_account.user_feeds.push(response.user_feed);
							// add title to data store
							var sourceIndex = finfore.data.panels.main[params.category][index].feed_account.user_feeds.length - 1;
							finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex].title = f.sourceTitle;
							*/
								
							// add management node
							var template = $.View('//webapp/views/manage.source.tmpl', {
								feed_account_id: feed_account._id,
								source: finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex],
								index: sourceIndex,
								category: params.category
							});
							params.$node.nextAll('div:first').find('.list-view').append(template);
							
							// refresh column
							finfore.data.panels.main[params.category][index].$node.trigger('reinit');
							
							// update data store on sources
							bindSourcesData({
								$container: params.$node.parent(),
								category: params.category,
								index: index
							});
							
							// hde loading message							
							$.mobile.hidePageLoadingMsg();
							
							// show success message
							$().toastmessage('showSuccessToast', messages.saveSource);
						},
						error: function(response) {
							$().toastmessage('showErrorToast', messages.errorSaveSource);
						}
					});
					
				}
			}
			
			$.prompt(form, {
				callback: addCustomConfirm,
				buttons: { Cancel: false, 'Save Source': true }
			});		
		},
		remove: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
			
			var $selectedSource = $('input:checked', params.$node.next().next());
			var sourceIndex = finfore.data.panels.main[params.category][index].feed_account.user_feeds.indexOf($.data($selectedSource[0], 'data'));
			
			var sourceTitle = finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex].feed_info.title;
			if(!sourceTitle) sourceTitle = finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex].name;
			var form = '<h2>Are you sure you sure you want to remove the <em>' + sourceTitle + '</em> source?</h2>';
			
			function removeSourceConfirm(confirm, m) {
				if(confirm) {
					var sourceId = $selectedSource.attr('data-id');
					$.ajax({
						url: finforeBaseUrl + '/user_feeds/' + sourceId + '.json',
						type: 'DELETE',
						data: {
							feed_account_id: finfore.data.panels.main[params.category][index].feed_account._id
						},
						success: function(data) {
							$().toastmessage('showSuccessToast', messages.deleteSource);
						},
						error: function() {
							$().toastmessage('showErrorToast', messages.errorDeleteSource);
						}
					});
					
					// select previous dom node
					$selectedSource.prevAll('input:first').attr('checked', 'checked').trigger('change');
					
					// remove management dom nodes
					$selectedSource.next().remove().end().remove();
										
					// remove data store					
					finfore.data.panels.main[params.category][index].feed_account.user_feeds.splice(sourceIndex, 1);
					
					// reinit panel					
					finfore.data.panels.main[params.category][index].$node.trigger('reinit');
				}
			}
			
			$.prompt(form, {
				callback: removeSourceConfirm,
				buttons: { Cancel: false, 'Remove Source': true }
			});			
		},
		addPreset: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));			
			var feedAccountID = finfore.data.panels.main[params.category][index].feed_account._id;			
			
			var $selectedPresetSource = $('.preset-source:checked', params.$presets);
			var sourceTitle = $selectedPresetSource.next('label').text();
			var sourceAddress = '';
			if($selectedPresetSource.attr('data-address')) sourceAddress = $selectedPresetSource.attr('data-address');
			
			// show loading message
			$.mobile.showPageLoadingMsg();
			
			var category_type = params.category;
			if(params.category == 'feed') category_type = 'rss';
			if(params.category == 'prices') category_type = 'chart';
			
			var feedInfoId = $selectedPresetSource.val();
			
			$.ajax({
				//url: finforeBaseUrl + '/users/' + finfore.data.user._id + '.json',
				url: finforeBaseUrl + '/feed_accounts/' + feedAccountID + '.json',
				type: 'PUT',
				data: {
					feed_account: {
						_id: feedAccountID,
						user_feeds_attributes: [{
							/*
							feed_info_attributes: {
								title: sourceTitle,
								category: category_type
							},
							*/
							
							feed_info_id: feedInfoId
						}]
					}
				},
				success: function(feed_account) {
					
					// update data store
					finfore.data.panels.main[params.category][index].feed_account = feed_account;
					
					/*
					finfore.data.panels.main[params.category][index].feed_account.user_feeds.push(response.user_feed);
					// add title to data store
					var sourceIndex = finfore.data.panels.main[params.category][index].feed_account.user_feeds.length - 1;
					finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex].feed_info.title = sourceTitle;
					*/
					
					var sourceIndex = feed_account.user_feeds.length - 1;
						
					// add management node
					var template = $.View('//webapp/views/manage.source.tmpl', {
						feed_account_id: feed_account._id,
						source: finfore.data.panels.main[params.category][index].feed_account.user_feeds[sourceIndex],
						index: sourceIndex,
						category: params.category
					});
					params.$node.nextAll('div:first').find('.list-view').append(template);
					
					// refresh column
					finfore.data.panels.main[params.category][index].$node.trigger('reinit');
					
					// update data store on sources
					bindSourcesData({
						$container: params.$node.parent(),
						category: params.category,
						index: index
					});
					
					// remove preset source from dom
					$selectedPresetSource.next().remove().end().remove();
					
					// show loading message
					$.mobile.hidePageLoadingMsg();
										
					$().toastmessage('showSuccessToast', messages.saveSource);
				},
				error: function() {					
					$().toastmessage('showErrorToast', messages.errorSaveSource);					
				}
			});
						
		}
	};
	
	/* Twitter Users Management */
	var twitter = {
		getFriends: function(params) {			
			var data = $.data(params.$node[0], 'data');
			var $tab = params.$node.next().next();
			var index = finfore.data.panels.main['twitter'].indexOf(data);			
			
			// add loading class
			$tab.addClass('loading-content');
			
			// get friends list
			$.ajax({
				url: finforeBaseUrl + '/tweetfores/friends.json',
				type: 'GET',
				data: {
					feed_account_id: data.feed_account._id
				},
				success: function(friends) {
					// empty list, in case there was an error before
					$tab.find('.list-view').empty();
					
					// check for errors
					if(friends.error) {
						var $errorNotice = '<div class="auth-error">' + messages.errorGetFriends + '<a data-role="button" data-icon="refresh" data-inline="true" data-theme="b" class="revalidate-account">Revalidate Account</a></div>';
						$tab.find('.list-view').append($errorNotice);
						
						$tab.find('.list-view a').button().bind('click', function() {
							panels.revalidate(params);
						});
						
						return false;
					}
					
					// set friends in data store
					data.friends = [];
					data.friends = $.map(friends, function (element) {
						return {
							_id: element.id,
							name: element.screen_name,
							feed_info: {
								title: element.screen_name
							},
							feed_account_id: data.feed_account._id
							}
						});
					
					// generate friend nodes
					$.each(data.friends, function(i, n) {
						var template = $.View('//webapp/views/manage.source.tmpl', {
							feed_account_id: data.feed_account._id,
							source: finfore.data.panels.main['twitter'][index].friends[i],
							index: i,
							category: 'twitter'
						});
						$tab.find('.list-view').append(template);
						
						// set data on friend (similar to bindSourcesData)
						var $friend = $tab.find('.list-view input:last');
						$.data($friend[0], 'data', finfore.data.panels.main['twitter'][index].friends[i]);
					});
					
				},
				complete: function() {
					$tab.removeClass('loading-content');
				}
			});
		},
		addCustom: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
			var feedAccountID = finfore.data.panels.main[params.category][index].feed_account._id;
			
			var form = '<h2>Follow Twitter User</h2><label>Username <br> <input type="text" id="sourceUsername" name="sourceUsername" value="" placeholder="Username.." class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-c"></label>';
			
			function addUserConfirm(confirm, m, f) {
				if(confirm && f.sourceUsername) {
					// show loading message
					$.mobile.showPageLoadingMsg();
					
					f.sourceUsername = $.trim(f.sourceUsername);			
							
					// add user to friends
					$.ajax({
						url: finforeBaseUrl + '/tweetfores/friend_add.json',
						type: 'POST',
						data: {
							feed_account_id: feedAccountID,
							friend_id: f.sourceUsername
						},
						success: function(data) {									
							var friend = {
								_id: data.id,
								name: data.screen_name,
								feed_account_id: feedAccountID
							};
							
							// update data store
							finfore.data.panels.main['twitter'][index].friends.push(friend);
							
							var $tab = params.$node.nextAll('div:first');
							var sourceIndex = finfore.data.panels.main['twitter'][index].friends.length - 1;
							
							// add management node
							var template = $.View('//webapp/views/manage.source.tmpl', {
								feed_account_id: feedAccountID,
								source: finfore.data.panels.main['twitter'][index].friends[sourceIndex],
								index: sourceIndex,
								category: 'twitter'
							});
							$tab.find('.list-view').append(template);
							
							// refresh column
							finfore.data.panels.main['twitter'][index].$node.trigger('reinit');
							
							// update data store on user
							var $friend = $tab.find('.list-view input:last');
							$.data($friend[0], 'data', finfore.data.panels.main['twitter'][index].friends[sourceIndex]);
							
							// hde loading message
							$.mobile.hidePageLoadingMsg();
							
							// show success message
							$().toastmessage('showSuccessToast', messages.saveUser);
						},
						error: function(response) {
							$().toastmessage('showErrorToast', messages.errorSaveUser);
						}
					});
					
				}
			}
			
			$.prompt(form, {
				callback: addUserConfirm,
				buttons: { Cancel: false, 'Follow User': true }
			});		
		},
		remove: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));
			var feedAccountID = finfore.data.panels.main[params.category][index].feed_account._id;
			
			var $selectedSource = $('input:checked', params.$node.next().next());
			var sourceIndex = finfore.data.panels.main[params.category][index].friends.indexOf($.data($selectedSource[0], 'data'));
			
			var sourceTitle = finfore.data.panels.main[params.category][index].friends[sourceIndex].name;			
			var twitterUserId = finfore.data.panels.main[params.category][index].friends[sourceIndex]._id;			
			var form = '<h2>Are you sure you sure you want to stop following <em>' + sourceTitle + '</em>?</h2>';
			
			function removeUserConfirm(confirm, m) {
				if(confirm) {
					var sourceId = $selectedSource.attr('data-id');
					$.ajax({
						url: finforeBaseUrl + '/tweetfores/friend_remove.json',
						type: 'POST',
						data: {
							feed_account_id: feedAccountID,
							friend_id: twitterUserId
						},
						success: function(data) {
							$().toastmessage('showSuccessToast', messages.deleteUser);
						},
						error: function() {
							$().toastmessage('showErrorToast', messages.errorDeleteUser);
						}
					});
					
					// select previous dom node
					$selectedSource.prevAll('input:first').attr('checked', 'checked').trigger('change');
					
					// remove management dom nodes
					$selectedSource.next().remove().end().remove();
										
					// remove data store					
					finfore.data.panels.main[params.category][index].friends.splice(sourceIndex, 1);
					
					// reinit panel					
					finfore.data.panels.main[params.category][index].$node.trigger('reinit');
				}
			}
			
			$.prompt(form, {
				callback: removeUserConfirm,
				buttons: { Cancel: false, 'Unfollow': true }
			});			
		},
		addPreset: function(params) {
			var index = finfore.data.panels.main[params.category].indexOf($.data(params.$node[0], 'data'));			
			var feedAccountID = finfore.data.panels.main[params.category][index].feed_account._id;
			
			var $selectedPresetSource = $('.preset-source:checked', params.$presets);			
			var sourceAddress = $.trim($selectedPresetSource.attr('data-address'));
			
			// show loading message
			$.mobile.showPageLoadingMsg();
			
			// add user to friends
			$.ajax({
				url: finforeBaseUrl + '/tweetfores/friend_add.json',
				type: 'POST',
				data: {
					feed_account_id: feedAccountID,
					friend_id: sourceAddress
				},
				success: function(data) {									
					var friend = {
						id: data._id,
						name: data.screen_name,
						feed_account_id: feedAccountID
					};
					
					// update data store
					finfore.data.panels.main['twitter'][index].friends.push(friend);
					
					var $tab = params.$node.nextAll('div:first');
					var sourceIndex = finfore.data.panels.main['twitter'][index].friends.length - 1;
					
					// add management node
					var template = $.View('//webapp/views/manage.source.tmpl', {
						feed_account_id: feedAccountID,
						source: finfore.data.panels.main['twitter'][index].friends[sourceIndex],
						index: sourceIndex,
						category: 'twitter'
					});
					$tab.find('.list-view').append(template);
					
					// refresh column
					finfore.data.panels.main['twitter'][index].$node.trigger('reinit');
					
					// update data store on user
					var $friend = $tab.find('.list-view input:last');
					$.data($friend[0], 'data', finfore.data.panels.main['twitter'][index].friends[sourceIndex]);							
					
					// show success message
					$().toastmessage('showSuccessToast', messages.saveUser);
				},
				error: function(response) {
					$().toastmessage('showErrorToast', messages.errorSaveUser);
				},
				complete: function() {							
					$.mobile.hidePageLoadingMsg();
				}
			});
		
		}
	};
	
	var createManagementTabs = function() {	
		$.each(finfore.modules, function(key, value) {
			var moduleName = key;
			var $moduleContainer = $('#management-tab-' + key);				
			
			if(finfore.modules[moduleName].management) {
				finfore.modules[moduleName].management($moduleContainer);
			};
		});
		$managementTabs = $('#management-tabs');
		$managementTabsList = $('#management-tabs > ul');
		
		$('a', $managementTabsList).click(function() {
			var $this = $(this),
				$target = $($this.attr('href'), $managementTabs);
			
			$('.management-tab-active', $managementTabsList).removeClass('management-tab-active');
			$this.addClass('management-tab-active');
			
			$('.management-tab-panel-active', $managementTabs).hide().removeClass('management-tab-panel-active');
			$target.show().addClass('management-tab-panel-active');
			
			return false;
		});
		
		$('a:first', $managementTabsList).trigger('click');		
	};
	
	var init = function(options) {
		Loader.show();
		
		if(!options) options = {};
		
		if(!$container) {	
			var template = $.View('//webapp/views/manage.tmpl', {
				modules: finfore.modules
			});
			$(template).appendTo(finfore.$body);				
			$container = $('#manage-page');					
						
			createManagementTabs(options);
			
			/* tab functionality
			 * had to use js because of nasty webkit bug with double sibling selector
			 */
			$container.delegate('.mtab, .preset-tab-radio', 'change', function() {
				var $inputContainer = $(this).parent();				
				
				$('.visible-tab', $inputContainer).removeClass('visible-tab');
				$(this).next().next().addClass('visible-tab');
			});
			
			// make preset sources draggable
			$('.preset-tabs', $container).delegate('label', 'click', function() {
				$(this).prev('input').prop('checked', true).trigger('change');
			});
			
			// make preset sources draggable
			$('.preset-tabs', $container).delegate('label', 'mousedown', function() {
				$(this).trigger('click');
			});
		};
		
		// auto-select module management tab and panel
		if(options.target && options.target.type) {
			// select module management tab			
			$('a[href="#management-tab-' + options.target.type + '"]', $managementTabsList).trigger('click');
			
			var $tabPanel = $('#management-tab-' + options.target.type, $container);
			
			// select panel from management tab
			var $mTabs = $('.mtabs-container', $tabPanel);
			if(options.target.data) {
				var $tabs = $('.mtab', $mTabs),
					tabData;
				
				$tabs.each(function() {
					var $this = $(this);
					tabData = $.data($this[0], 'data');
					if(options.target.data === tabData) {
						$this.prop('checked', true).trigger('change');
						return false;
					}
				});
			};
		};
		
		// changePage
		if(!options.silentInit) {
			$.mobile.changePage($container, {
				transition: 'slidedown'
			});
		};
				
		Loader.hide();
		
	};

	return {
		init: init,
		panels: panels,
		bindPanelData: bindPanelData,
		sources: sources,
		twitter: twitter,
		messages: messages,
		updateFeedInfos: updateFeedInfos
	}
}();