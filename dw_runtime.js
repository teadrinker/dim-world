
// Dim World Environment, ALPHA Version
// Martin 'teadrinker' Eklund, 2014
// http://teadrinker.net

dw_g_createRuntime = function(prefix, dnativeGlobal) {
	var prefix = prefix || 'dw_ds_'
	dnativeGlobal = dnativeGlobal || self

	var globalMeta = { hard : { orderId : 1, meta : { connections : [] }, functionCallCount : {} } }

	var newRuntime = { prefix : prefix, globalMeta : globalMeta }

	// globalMeta should have orderId / meta connections /  functionCallCount
	var globalEnum = {}
	var enumGlobals = function(f ) { for(var k in globalEnum) f(k) }
	var getGlobal = function(k   ) { return dnativeGlobal[prefix + k] }
	var setGlobal = function(k, v) { /*dw_g_trace('sg '+k+' '+(v.toString().substr(0,10))) ; */ dnativeGlobal[prefix + k] = v ; globalEnum[k] = true }
	newRuntime.getGlobal = getGlobal
	newRuntime.setGlobal = setGlobal
	newRuntime.enumGlobals = enumGlobals

	var registerGlobals = function(o, meta) {
		if(typeof o == 'object') {
			for(var k in o) {
				newRuntime.setGlobal(k, o[k], meta)					
			}
		}
	}	
		
	var dbgFuncTraceEnable = prefix + 'tracingFunctionsEnabled'
	var dbgProfileEnable = prefix + 'profilingFunctionsEnabled'
	var dbgProfileInfo = prefix + 'profilingInfo'
	var dbgCurrentLine = -1
	var dbgStack = []
	var dbgFuncHistoryN = 4096
	var dbgFuncHistory = new Array(dbgFuncHistoryN)
	var dbgFuncHistoryIndex = 0
	var dbgFuncB = function(ttfId, line, funcName) {
		if(globalMeta[ttfId]){
			var curCount = globalMeta[ttfId].functionCallCount[funcName]
			if(curCount == undefined){
				globalMeta[ttfId].functionCallCount[funcName] = 0
			} else {
				globalMeta[ttfId].functionCallCount[funcName] = curCount + 1
			}			
		}// else {
		//	throw('sill '+(ttfId || 'nil'))  happens when deployed
	//	}
		dbgStack.push({ttfId : ttfId, line : dbgCurrentLine, name : funcName})
		dbgCurrentLine = line
		if(dbgStack.length > 2000) {
			throw("dw stack overflow")
		}
		dbgFuncHistory[dbgFuncHistoryIndex] = [dbgStack.length, funcName, line, ttfId] 
		dbgFuncHistoryIndex = (dbgFuncHistoryIndex + 1) % dbgFuncHistoryN
		if(dnativeGlobal[dbgFuncTraceEnable]) {
			var str = ''
			for(var i=0;i<dbgStack.length;i++) { str = str + ' ' }
			dw_g_trace(str+funcName+' '+line+' '+ttfId)
		}
		if(dnativeGlobal[dbgProfileEnable]) {
			var profInfo = dnativeGlobal[dbgProfileInfo]
			if(!profInfo || !profInfo.funcInfo) { alert('dbgFuncB internal profiling error: !profInfo || !profInfo.funcInfo missing') }
			var ttf = profInfo.funcInfo[ttfId] ; if(!(typeof ttf     === 'object')) { ttf = {} ; profInfo.funcInfo[ttfId] = ttf }
			var fnc = ttf[funcName]            ; if(!(typeof fnc     === 'object')) { fnc = {} ; ttf[funcName] = fnc }
			if(!fnc.t1) { // recursion check
				fnc.t1 = dw_g_perfTime()
			}
		}
	}
	var dbgFuncE = function(return_value, ttfId, line, funcName) {
		if(dnativeGlobal[dbgProfileEnable]) {
			var profInfo = dnativeGlobal[dbgProfileInfo]
			if(!profInfo || !profInfo.funcInfo) { alert('dbgFuncE internal profiling error: !profInfo || !profInfo.funcInfo missing') }
			var ttf = profInfo.funcInfo[ttfId] ; if(!(typeof ttf     === 'object')) { ttf = {} ; profInfo.funcInfo[ttfId] = ttf }
			var fnc = ttf[funcName]            ; if(!(typeof fnc     === 'object')) { fnc = {} ; ttf[funcName] = fnc }
			if(fnc.t1) { 
				var pEvents = fnc.events       ; if(!(typeof pEvents === 'object')) { pEvents = [] ; fnc.events = pEvents }
				pEvents.push({t1: fnc.t1, t2: dw_g_perfTime(), id: profInfo.currentFrameId})
				fnc.t1 = undefined
			} else {
				// TODO debug, this happens sometimes
			//	alert('dbgFuncE internal profiling error, ttfId:' + ttfId + '   ' + funcName + ', line:' + line + ', len:' + dbgStack.length) 				
			}		
		}
		var item = dbgStack.pop()
		if(ttfId != item.ttfId)   { 
			alert('dbgFuncE internal debug error, ttfId:' + ttfId + ' != ' + item.ttfId + '   ' + item.name + ', line:' + item.line + ', len:' + dbgStack.length) 
			}
		if(funcName != item.name) { 
			alert('dbgFuncE internal debug error, name:' + funcName + ' != ' + item.name + '   line:' + item.line + ', len:' + dbgStack.length)
			}
		dbgCurrentLine = item.line
		return return_value
	}
	var dbgLine = function(ttfId, line) {
		dbgCurrentLine = line
		// how connect to actual source? 
		// if source is generated, point to textToFunc?
		//
		// maybe best is to let line always be related to nearest function,
		// and each function can have an user defined id connecting to the debugger
		
	}
	var getStackInfo = function(s) {
		var msg = ''
		if(s) {
			for(var i = 0; i < s.length; i++) {
				var info = s[i]
				msg += info.ttfId + '  ' + info.name + '  ' + info.line + '\n'
			}
		}
		return msg
	}
	var getStackHistory = function(n) {
		var msg = ''
		for(var i = 0; i < n; i++) {
			var data = dbgFuncHistory[(dbgFuncHistoryIndex + dbgFuncHistoryN - n + i) % dbgFuncHistoryN]
			if(data) {
				for(var j = 0; j < data[0]; j++) { msg += ' ' }
				msg += data[1] + '  ' + data[2] + '  ' + data[3] + '\n'
			}
		}
		return msg
	}
	var dbgAssert = function(statement, cmp, shouldBe, ra, rb, line) {
		if(typeof cmp == 'number') { line = cmp ; cmp = '=='; shouldBe = true; ra = false; rb = true } // c style
		alert("Assert! at line "+line+" ("+(dbgStack.length?dbgStack[dbgStack.length-1].name:"<no stack>")+") \n"+statement+' '+cmp+' '+shouldBe+'\n'+JSON.stringify(ra)+' '+cmp+' '+JSON.stringify(rb)+'\n\n'+getStackInfo(dbgStack))
		dnativeGlobal[dbgFuncTraceEnable] = false
		debugger		
	}

	

	var dbgTryCall = function(func, ttfId, ls, le, name) {
		ttfId = ttfId || 'hard'
		ls = ls == undefined ? -1 : ls
		le = le == undefined ? -1 : le
		name = name || 'tryCall'
		var stackPos = dbgStack.length

//		return { ret : func.apply(null) }

		dbgFuncB(ttfId, ls, name)
		try {
			return dbgFuncE( { ret : func.apply(null) }, ttfId, le, name)
		} catch(err) { 
//			alert('catch trycall catch '+err);
			dnativeGlobal[dbgFuncTraceEnable] = false
			var relStack = dbgStack.splice(stackPos, dbgStack.length - stackPos)
			var longErr = err + '\n\n'+ getStackInfo(relStack) + '\n\n' + getStackHistory(30) // maybe not a good idea?
			return { error : longErr, shortError : err, stackInfo : relStack}
		}	
	}	
	
	var dbgThrow = function(t) { throw(t) }
	
	var runUnparsed = function(func, ttfId, ls, le, name) {
		ttfId = ttfId || 'hard'
		ls = ls == undefined ? -1 : ls
		le = le == undefined ? -1 : le
		name = name || 'tryCall'
		var r = dbgTryCall(func, ttfId, ls, le, name)
		if(r.error) {
			throw("runUnparsed() Error: "+r.error)
		}
		registerGlobals(r.ret, {ttfId:ttfId, ls:ls, le:le, name:name})
	}	
	
	var globs = {}

	globs.tryCall = dbgTryCall
	globs.throw = dbgThrow
	globs.runUnparsed = runUnparsed

	globs[/*dbgfb*/'__fb'] = dbgFuncB
	globs[/*dbgfe*/'__fe'] = dbgFuncE
	globs[/*dbgl*/ '__l']  = dbgLine	
	globs.dbgAssert = dbgAssert

	globs.createRuntime = dnativeGlobal.dw_g_createRuntime

	globs.getGlobal = getGlobal
	globs.setGlobal = setGlobal
	globs.enumGlobals = enumGlobals
	globs.registerGlobals = registerGlobals
	globs.globalMeta = globalMeta
	registerGlobals(globs)

	// complete interface
	newRuntime.registerGlobals = registerGlobals
	newRuntime.remove = function() { for(var name in globalEnum) { delete dnativeGlobal[prefix + name] } }

	return newRuntime
}





// io lib

createIOLib = function() {

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
						var v = data[k]
						if(typeof v != 'string') { func('wrong type for '+k) ; return }
						datastr += k + '=' + encodeURIComponent(v)							
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
		funcs['later'] = function(fnc, id) { if(id !== undefined) { laterl[id] = ()=>{} } laterl.push(fnc) ; return laterl.length - 1 }
		funcs['cancelLater'] = function(id) { laterl[id] = ()=>{} }
		funcs['flushLater'] = function() {
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
		funcs['join'] = function(str, by) { return str.join(by||'') } 
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

}

createIOLib()





dw_g_boot = function(prefix) {

	var G = function(name)    { return window.self[(prefix+name)] }
	var S = function(name, v) { return window.self[(prefix+name)] = v }

	//S('profilingInfo', { currentFrameId : 1, frames : [], numFramesToTriggerSwap : 120, funcInfo : {}, currentFrame :    { id : 1, t1 : dw_g_perfTime() }   })
	//S('profilingEnabled', true)
	//S('profilingFunctionsEnabled', true)

	var precompiled = !(window.dw_g_app_main === undefined)

	try {
		document.getElementById(prefix + 'html_root').innerHTML = 
			"<div id=\"" +prefix+ "canvas_area\" style=\"background-color:#000;width:100%;height:100%;border:0;margin:0;padding:0;\" ></div>" +
			"<div id=\"" +prefix+ "html_extra\" ></div>"+
			"<div id=\"" +prefix+ "text_input\" ></div>";

		var runtime = dw_g_createRuntime(prefix, window)
		runtime.registerGlobals(dw_g_createIoLib(runtime.prefix).data)
		if(!(window.dw_g_createDScript === undefined)) { dw_g_createDScript(runtime) }

	} catch(err) {
		alert('error booting: '+err)
	}

	if(!precompiled) {
	//	var luaText = ''
			
		G('http')('std/devboot.txt', undefined, function(err, str) {
			var r = G('textToFunc')(str)
			if(r.func) {
				try {
					r.func()
				} catch(err) {
					alert('Boot error exe: ' + err)
				}
			} else {
				alert('Boot error : ' + r.error)			
			}
			
		})
	}
	
	var requestAnimFrame = (function() {
		  return window.requestAnimationFrame ||
		         window.webkitRequestAnimationFrame ||
		         window.mozRequestAnimationFrame ||
		         window.oRequestAnimationFrame ||
		         window.msRequestAnimationFrame ||
		         function(callback, element) {
		           window.setTimeout(callback, 1000/60);
		         };
		})()	

	var consoleVersion
	var updateDebugConsole = function(size) {
			var ver = G('getDebugConsoleVersion')()
			if(! (ver === consoleVersion) ) {
				consoleVersion = ver
				document.getElementById(prefix+'html_extra').innerHTML = G('getDebugConsole')(size)
				// ugly stuff
				var o=document.getElementById("consoleScrollToTop")    ; if(o) o.scrollTop = 0;
				var o=document.getElementById("consoleScrollToBottom") ; if(o) o.scrollTop = o.scrollHeight;
			}
	}
	var frameId = 1
	var failedConsecutiveFrames = 0
	var dwUpdate
	dwUpdate = function() {
		var res = G('tryCall')(function() {
//		try {

			if(failedConsecutiveFrames < 16) { 
				requestAnimFrame(dwUpdate, document.getElementById(prefix+'canvas_area_canvas'))
			}

			var profile = G('profilingEnabled'), t2, t3, t4, t5, wasDrawn = false;
			if(profile) { t2 = dw_g_perfTime() }

			if(G('currentFilledWindowCanvas')) { G('currentFilledWindowCanvas').handleRescale() }

			if(G('guiIdle')    != undefined) { G('guiIdle')() }			
			if(G('flushLater') != undefined) { G('flushLater')() }

			if(profile) { t3 = dw_g_perfTime() }

			if(G('__wantDraw') == true) {
				wasDrawn = true
				if(G('guiDraw')    != undefined) { G('guiDraw')() }
				if(G('flushLater') != undefined) { G('flushLater')() }

				S('__wantDraw', false)
			}

			if(profile) { t4 = dw_g_perfTime() }

			if(wasDrawn && G('drawDebugDisplay')) { G('drawDebugDisplay') } 

			updateDebugConsole(70)

			if(profile) {
				var profInfo = G('profilingInfo')
				var fr = profInfo.currentFrame
				var tmpTime = dw_g_perfTime()
				fr.t2 = t2  ;  fr.t3 = t3  ;  fr.t4 = t4  ;  fr.t5 = tmpTime
				profInfo.frames.push(fr)
				if(profInfo.frames.length >= profInfo.numFramesToTriggerSwap) {
					var funcInfo, frames = profInfo.frames
					if(G('profilingFunctionsEnabled')) {
						funcInfo = profInfo.funcInfo
						profInfo.funcInfo = {}
					}
					profInfo.frames = []
					var statsFunc = G('profilingSwap')
					if(statsFunc) { statsFunc(frames, funcInfo) }
				}
				frameId++;
				profInfo.currentFrame = { t0 : tmpTime, t1 : dw_g_perfTime(), id : frameId }
			}


			failedConsecutiveFrames = 0
//		} catch(err) {
		}, undefined, -1, -1, 'dwUpdate')
		if(res.error) {
			failedConsecutiveFrames++
			if(failedConsecutiveFrames > 8) { S('gDebugConsoleSize', 'big') }
			G('print')('dwUpdate exception: '+res.error)
			updateDebugConsole(failedConsecutiveFrames <= 8 ? 70 : undefined)
		}
	}
	dwUpdate()

	if(precompiled) {
		dw_g_app_main()	
	}
}