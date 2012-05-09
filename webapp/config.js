/*
 * FastND Configs
 * 
 * Loaded separately, not compressed.
 */

var finforeBaseUrl = 'http://inter.fastnd.com', // web service url
	finforeAppUrl = window.location.href, // web app url
	finforeNative = false;
	
finforeAppUrl = finforeAppUrl.replace(finforeAppUrl.replace(/^.*[\\\/]/, ''), ''); // remove file.html from path

// Make sure there's a trailing slash
if(finforeAppUrl.charAt(finforeAppUrl.length - 1) != '/') finforeAppUrl += '/';