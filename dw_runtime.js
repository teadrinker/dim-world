
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
	var enumGlobals = function(f ) { for(var k in globalEnum) { if(k !== '__id__') { f(k) } } }
	var getGlobal = function(k   ) { return dnativeGlobal[prefix + k] }
	var setGlobal = function(k, v) { /*dw_g_trace('sg '+k+' '+(v.toString().substr(0,10))) ; */ dnativeGlobal[prefix + k] = v ; globalEnum[k] = true }
	newRuntime.getGlobal = getGlobal
	newRuntime.setGlobal = setGlobal
	newRuntime.enumGlobals = enumGlobals

	var registerGlobals = function(o, meta) {
		if(typeof o == 'object') {
			for(var k in o) {
				if(k !== '__id__') {
					newRuntime.setGlobal(k, o[k], meta)					
				}
			}
		}
	}	
		
	// for debugging purposes only, override toString to get Object Id
//	Object.prototype.__defineGetter__('__id__', function () {
//	    var gid = 0;
//	    return function(){
//	        var id = gid++;
//	        this.__proto__ = {
//	             __proto__: this.__proto__,
//	             get __id__(){ return id }
//	        };
//	        return id;
//	    }
//	}.call() );
//
//	Object.prototype.toString = function () {
//	    return '[Object ' + this.__id__ + ']';
//	};

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

	globs.createRuntime = dw_g_createRuntime

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

/*

move dw_boot here?

*/


