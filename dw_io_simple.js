
// Dim World Environment, ALPHA Version
// Martin 'teadrinker' Eklund, 2014
// http://teadrinker.net
	
(function() {

var dnativeGlobal = self

var perfTime = function() { return dnativeGlobal.performance.now()/1000 }

var traceLines = []
var sysTrace = function(s) {
	if(dnativeGlobal.document === undefined) {
		postMessage({msg:'trace',data:s});
	} else {
		if(dnativeGlobal.console && dnativeGlobal.console.log) {
			dnativeGlobal.console.log(s)
		}
		s.split('\n').map(function(x) {
			traceLines.push(x) 
		})		
	}
}

var createCallbackWrapper = function(prefix, name, skipFlush) {
	var _profilingEnabled = prefix+'profilingEnabled'
	var _profilingInfo = prefix+'profilingInfo'
	var _flushLater = prefix+'flushLater'
	var _tryCall = prefix+'tryCall'

	return function(f) {
		var profile = dnativeGlobal[_profilingEnabled], t1
		if(profile) { t1 = perfTime() }

		var r = dnativeGlobal[_tryCall]( skipFlush ? f : function() { f() ; dnativeGlobal[_flushLater]() }, 'hard', -1, -1, name)

		if(r.error) {
			if(!dnativeGlobal[prefix + 'print']) { throw("superexception! dwCallback no print! "+r.error) }
			dnativeGlobal[prefix + 'print']('dwCallback '+name+' exception: '+r.error)
			dnativeGlobal[prefix + 'gDebugConsoleSize'] = 'big'
		}
		if(profile) {
			var profInfo = dnativeGlobal[_profilingInfo]
			profInfo.currentFrame.events = profInfo.currentFrame.events || []
			profInfo.currentFrame.events.push({ name: name, t1: t1, t2: perfTime()})
		}	
		return r.ret
	}
}

var js_createIoLib = function(prefix) {

	var createIoLib = undefined; // need closure to return "ourself"
	createIoLib = function(prefix) {
		var funcs = {}

		funcs['createIoLib'] = createIoLib

		var wrapHttpResponse = createCallbackWrapper(prefix, 'httpResponseWrap', true)

		funcs['http'] = function(url,options,func)
			{
				options = options || {}
				var data = options.sendData
				if(typeof data == 'object') {
					var datastr = ''
					for(var k in data) {
						if(k !== '__id__') {
							var v = data[k]
							if(typeof v != 'string') { func('wrong type for '+k) ; return }
							datastr += k + '=' + encodeURIComponent(v)							
						}
					}
					data = datastr
				}
				var f=func, re=new XMLHttpRequest()
				re.onreadystatechange = function() {
						wrapHttpResponse(function() {
							if(re.readyState==4) {
								f(re.status == 200 ? undefined : re.status + ' ' + url, re.responseText, re)
							}
						})
					}
				if(re.timeout) { re.timeout = options.timeout || 5000 } // if timeout is set in ie, everything fails
				re.ontimeout = function() { f('timeout', 'ERROR timeout', re) }
				re.open(data!=undefined?"POST":"GET",url + "?_cache_kill=" + (new Date().getTime()), true)
				if(data!=undefined) {
					re.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
					re.setRequestHeader("Content-length", data.length)
					re.setRequestHeader("Connection", "close")
				}
				re.send(data!=undefined?data:null)
				return { remove : function() { re.onreadystatechange = function(){} ; f('abort', 'ERROR abort', re) ; re.abort() } }
			}

		funcs['getDebugConsoleVersion'] = function() { return dnativeGlobal[prefix+'gDebugConsoleSize'] === undefined ? -100 : traceLines.length }
		funcs['getDebugConsole'] = function(lineCount) {
			if(dnativeGlobal[prefix+'debug_console_show_all'] == -1) {
				traceLines.length = 0
				dnativeGlobal[prefix+'debug_console_show_all'] = true
			}
			lineCount = dnativeGlobal[prefix+'debug_console_show_all'] ? traceLines.length : (lineCount ? lineCount : traceLines.length)
			var consSize = dnativeGlobal[prefix+'gDebugConsoleSize']
			if(consSize === undefined) { return "" }
			var w = consSize == 'big' ? "85%" : "30%"
			var str = "" 
			str += "<div id='"+(dnativeGlobal[prefix+'debug_console_top']?'consoleScrollToTop':'consoleScrollToBottom')+"' style='width:" + w + "; padding:8px; background-color:#282828; position:fixed; right:5px; top:5px; bottom:5px; overflow:auto'>";
			var headAndFoot = ''
			headAndFoot += "<a href=\"javascript:"+prefix+"debug_console_show_all=-1;"+prefix+"print('')\"'>Clear</a>";
			headAndFoot += " / <a href=\"javascript:"+prefix+"print('\\n')\"'>Empty Line</a>";
			headAndFoot += " / <a href=\"javascript:location = location.protocol + '//' + location.host + '/' + location.pathname + '/' + location.search + '&deploy=1' + location.hash \">Build</a>";
			str += headAndFoot
			if(!dnativeGlobal[prefix+'debug_console_show_all'] && lineCount < traceLines.length) {
				str += " / <a href=\"javascript:"+prefix+"debug_console_show_all=true;"+prefix+"print('')\"'>Show All</a>";
			}
			str += "<pre>";
			for(var i = 0;i < lineCount; i++) {
				var id = traceLines.length - lineCount + i
				if(id >= 0 && id < traceLines.length) {
					str += traceLines[id]  + '\n'
				}
			}
			str+="</pre> <br />";
			if(traceLines.length > 1) {
				str += headAndFoot
			}
			if(!dnativeGlobal[prefix+'debug_console_show_all'] && lineCount < traceLines.length) {
				str += " / <a href=\"javascript:"+prefix+"debug_console_show_all=true;"+prefix+"print('')\"'>Show All</a>";
				str += " / <a href=\"javascript:"+prefix+"debug_console_show_all=true;"+prefix+"debug_console_top=true;"+prefix+"print('')\"'>Top</a>";
			}
			str+="<br />";
		//	str+="<textarea style=\"width:100%;height:50%;\" id=\"textout\"><\/textarea>";
			str+="</div>";
			return str
		}


		var laterl = []
		var reentryblock = false
		funcs['later'] = function(fnc) { laterl.push(fnc) }
		funcs['flushLater'] = function(v) {
			if(reentryblock) { sysTrace("Warning flushLater() re-entry, skipping...") ; return }  // firefox alerts can cause reentry
			reentryblock = true
			for(var i = 0; i < laterl.length ; i++) { 
				laterl[i]();
				if(i>400000) {
					reentryblock = false
					laterl = []
					throw('flushLater overflow limit!')
				}
			}
			reentryblock = false
			laterl = []
		}


		funcs['print'] = sysTrace

		funcs['alert'] = function(str) { alert(str === undefined ? "<nil>" : ( str == "" ? "<empty string>" : str.toString())) }
		funcs['split'] = function(str, by) { return str.split(by) } // strings by token:   split("into these four words", " ")   return ["into", "these" ...
		funcs['push'] = function(a, v, i)	{ if(i != undefined) a.splice(i,0,v); else a.push(v) } 
		
		var isArray = Array.isArray || function(obj) { return Object.prototype.toString.call(obj) === '[object Array]' }

		funcs['len']  = function(o) {
			if(isArray(o) || typeof o === 'string' ) {
				return o.length
			} else if(typeof o === 'object') {
				var cnt = 0;
				for(k in o) {
					if(o.hasOwnProperty(k) && o[k] !== undefined) {
					 	cnt++;	
					}
				}
				return cnt;
			} 
		}

		var forK = function(o, f) {
	//		itf = o.foreach  // || foreachFuncs[type(o)]  // skip iterator overriding for now
	//		if(itf) { itf(o, f) }
	//		else {

//			if(typeof o == 'object' && o.splice) {  // fix  what is the correct way?
			if(isArray(o)) {  // fix  what is the correct way?
				for(var i = 0, leng = o.length; i < leng; i++) {
					if(f(i) == 'break') {
						return i
					}				
				}
			} else {
				for(var k in o) {
					if(k != '__id__') {
						if(o[k] == undefined) {
						//	delete o[k]  // this breaks some javascript objects (removed to enable tracing of three.js objects) 
						} else { 
							if(f(k) == 'break') {
								return k
							}
						}
					}
				} 			
			}

		}
		funcs['forK'] = forK
		funcs['forV' ] = function(o, f) { return forK(o, function(k) { return f(   o[k]) } ) }

		funcs['concat'] = function(a,b) { if(typeof a === 'string') return a + b ; return a.concat(b) }
		funcs['type']  = function(v) {
			var t = typeof v;
//			if(t == 'object') { return v.splice ? 'array' : 'table'; } // fix  what is the correct way?
			if(t == 'object') { return isArray(v) ? 'array' : 'table'; } 
			if(t == 'undefined') { return 'nil' }
			if(t == 'function') { return 'func' }
			if(t == 'boolean') { return 'bool' }
			return t
		}
		
		return { data : funcs } 
	}
	
	return createIoLib(prefix)
}

var js_textToFunc = function(text) {  // similar to lua loadstring()
	try {
		return { func : eval.apply(null,[text]) }
	} catch(err) {
		return { error: 'during ttf init dw_dnative_textToFunc() ' + err + '\n' + text }
	}
}


	// set js globals
	dw_g_createIoLib			= js_createIoLib
	dw_g_createCallbackWrapper	= createCallbackWrapper
	dw_g_dnativeTextToFunc      = js_textToFunc
	dw_g_perfTime				= perfTime
	dw_g_trace					= sysTrace

})()
