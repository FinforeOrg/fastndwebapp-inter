/*
 * Finfore.net
 * Add Company Component
 * 
 */

finfore.addcompany = function() {
	var $page,
		$content,
		allCompanies;
	
	var saveCompany = function() {
		var companyIndex = parseInt($(this).attr('data-index')),
			companyId = allCompanies[companyIndex]._id,
			companyExists = false,
			$callbackPage = (finfore.smallScreen) ? finfore.desktop.nodes.$companiesPage : finfore.desktop.nodes.$page,
			tabSelector;
		
		// check if company already exists
		$.each(finfore.data.companies, function(i, n) {
			if(n.feed_info_id == companyId) {
				var $tab = $('#' + n._id, $callbackPage);
				
				tabSelector = $tab;
				if(!finfore.smallScreen) tabSelector = $.data($tab[0], 'selector');
				finfore.desktop.tabs.select(tabSelector);
				
				companyExists = true;
				
				return false;
			}
		});
		
		// close add company dialog
		$.mobile.changePage($callbackPage, {
			transition: 'slidedown',
			reverse: true
		});
		
		// if company isn't added already
		if(!companyExists) {
		
			if(finfore.data.user.is_public) {
				
				finfore.companies.add([{
					feed_info: allCompanies[companyIndex],
					_id: allCompanies[companyIndex]._id
				}], true);
			
			} else {
			
				Loader.show();
				
				$.ajax({
					url: finforeBaseUrl + '/user_company_tabs.json',
					type: 'POST',
					data: {
						user_company_tab: {
							feed_info_id: companyId,
							follower: '0',
							is_aggregate: true
						}
					},
					success: function(company) {
						finfore.companies.add([company], true);
						
						Loader.hide();
					}
				});
				
			}
			
		};
		
	};
	
	// alphabeticly sort array
	var abSorting = function(a, b) {
		var companyA = a.title.toLowerCase(),
			companyB = b.title.toLowerCase()
		//sort string ascending
		if(companyA < companyB) {
			return -1;
		};
		if(companyA > companyB) {
			return 1;
		};
		return 0;
	};
	
	var init = function() {
		Loader.show();
		$page = $('#add-company-page');
		
		if(!$page.length) {
			$.ajax({
				url: finforeBaseUrl + '/feed_infos.json',
				type: 'GET',			
				data: {
					category: 'all_companies'
				},
				success: function(companies) {
					if(!$page.length) {
						
						// Sort companies alphabeticaly
						companies.sort(abSorting);
						
						allCompanies = companies;
						
						var template = $.View('//webapp/views/addcompany.tmpl', {
							companies: companies
						});
						$(template).appendTo(finfore.$body);
						
						$page = $('#add-company-page');					
						$content = $('[data-role=content]', $page);
					};
					
					$('ul li', $content).click(saveCompany);
					
					$.mobile.changePage($page, {
						transition: 'slidedown'
					});
					
					Loader.hide();
				}
			});
		} else {
			$.mobile.changePage($page, {
				transition: 'slidedown'
			});
			
			Loader.hide();
		};
		
	};

	return {
		init: init
	}
}();