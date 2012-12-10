/*
 * Finfore.net Utils
 *
 * Polyfills
 * External APIs
 *
 */
 
/*** POLYFILLS and other utils ***/

/* localStorage */
window.Storage = window.localStorage;

// Feature test
var storage = function() {
	try {
		localStorage.setItem('testLocalStorage', 'testLocalStorage');
		return true;
	} catch(e) {
		return false;
	}
}();

// Polyfill
if(!storage) (function () {
	var Storage = function (type) {
	  function createCookie(name, value, days) {
		var date, expires;

		if (days) {
		  date = new Date();
		  date.setTime(date.getTime()+(days*24*60*60*1000));
		  expires = "; expires="+date.toGMTString();
		} else {
		  expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/";
	  }

	  function readCookie(name) {
		var nameEQ = name + "=",
			ca = document.cookie.split(';'),
			i, c;

		for (i=0; i < ca.length; i++) {
		  c = ca[i];
		  while (c.charAt(0)==' ') {
			c = c.substring(1,c.length);
		  }

		  if (c.indexOf(nameEQ) == 0) {
			return c.substring(nameEQ.length,c.length);
		  }
		}
		return null;
	  }
	  
	  function setData(data) {
		data = JSON.stringify(data);
		if (type == 'session') {
		  window.name = data;
		} else {
		  createCookie('localStorage', data, 365);
		}
	  }
	  
	  function clearData() {
		if (type == 'session') {
		  window.name = '';
		} else {
		  createCookie('localStorage', '', 365);
		}
	  }
	  
	  function getData() {
		var data = type == 'session' ? window.name : readCookie('localStorage');
		return data ? JSON.parse(data) : {};
	  }


	  // initialise if there's already data
	  var data = getData();

	  return {
		length: 0,
		clear: function () {
		  data = {};
		  this.length = 0;
		  clearData();
		},
		getItem: function (key) {
		  return data[key] === undefined ? null : data[key];
		},
		key: function (i) {
		  // not perfect, but works
		  var ctr = 0;
		  for (var k in data) {
			if (ctr == i) return k;
			else ctr++;
		  }
		  return null;
		},
		removeItem: function (key) {
		  delete data[key];
		  this.length--;
		  setData(data);
		},
		setItem: function (key, value) {
		  data[key] = value+''; // forces the value to a string
		  this.length++;
		  setData(data);
		}
	  };
	};

	window.Storage = new Storage('local');
	window.sessionStorage = new Storage('session');
})();

/* JSON */
(function(){
if('JSON'in window && JSON.stringify && JSON.parse){return;}
if(!this.JSON){this.JSON={};}(function(){function f(n){return n<10?'0'+n:n;}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}if(typeof rep==='function'){value=rep.call(holder,key,value);}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}return str('',{'':value});};}if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}return reviver.call(holder,key,value);}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}throw new SyntaxError('JSON.parse');};}}());
})();


/* Mini LIBS
 * Small helper libs, that don't need to be place in separate JSs
 */

/* Better empty() function to be used instead of jQuery's empty() */
function empty(element) {
	
	if(!element) return false;
	
	var i;
	for (i = element.childNodes.length - 1; i >= 0; i--) {
		element.removeChild(element.childNodes[i]);
	};
};

/* Convert links to anchors */
$.extend({
	linkUrl: function(str) {
		if(str) {
			var regexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
			return str.replace(regexp, '<a href="$1" target="_blank">$1</a>');
		};
	}
});

/* URL Encoder */
$.extend({
    URLEncode: function (c) {
        if(!c) return false;
		
		var o = '';
        var x = 0;
        c = c.toString();
        var r = /(^[a-zA-Z0-9_.]*)/;
        while (x < c.length) {
            var m = r.exec(c.substr(x));
            if (m != null && m.length > 1 && m[1] != '') {
                o += m[1];
                x += m[1].length;
            } else {
                if (c[x] == ' ') o += '+';
                else {
                    var d = c.charCodeAt(x);
                    var h = d.toString(16);
                    o += '%' + (h.length < 2 ? '0' : '') + h.toUpperCase();
                }
                x++;
            }
        }
        return o;
    },
    URLDecode: function (s) {
        var o = s;
        var binVal, t;
        var r = /(%[^%]{2})/;
        while ((m = r.exec(o)) != null && m.length > 1 && m[1] != '') {
            b = parseInt(m[1].substr(1), 16);
            t = String.fromCharCode(b);
            o = o.replace(m[1], t);
        }
        return o;
    }
});

// base64 Encoder
$.extend({
	encode64: function(input) {
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="; 

		var utf8_encode = function (string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
	 
			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
	 
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
	 
			}
	 
			return utftext;
		};
		
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			keyStr.charAt(enc1) + keyStr.charAt(enc2) +
			keyStr.charAt(enc3) + keyStr.charAt(enc4);

		}

		return output;
	}
});

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
