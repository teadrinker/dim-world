
// Dim World Environment, ALPHA Version
// Martin 'teadrinker' Eklund, 2014
// http://teadrinker.net


dw_g_boot = function(prefix) {

	var G = function(name)    { return window.self[(prefix+name)] }
	var S = function(name, v) { return window.self[(prefix+name)] = v }
	
	S('profilingInfo', { currentFrameId : 1, frames : [], numFramesToTriggerSwap : 120, funcInfo : {}, currentFrame :    { id : 1, t1 : dw_g_perfTime() }   })
//	S('profilingEnabled', true)
//	S('profilingFunctionsEnabled', true)

	function getQueryString() {
		var result = {}, queryString = location.search.substring(1),
		re = /([^&=]+)=([^&]*)/g, m;
		
		while (m = re.exec(queryString)) {
			result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		}
		
		return result;
	}
	var query = getQueryString()
	var canvasQuality = parseFloat(query["scale"]) || 1


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
	var fullscreenCanvas
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
				profInfo.currentFrame = frameId		
				profInfo.currentFrame = { t0 : tmpTime, t1 : dw_g_perfTime(), id : frameId }
			}


			failedConsecutiveFrames = 0
//		} catch(err) {
		})
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