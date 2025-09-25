
/*
#{ js return { len                 : function(s)       { if(s==undefined) { throw('len(nil)') }   return s.length }  } #}


#{ lua return {
	len = function(s)
		if s==nil then
			throw('len(nil)')
		elseif type(s) == 'table' then
			return s.__n
		end
		return #s
	end
	}
#}
*/

#####
#{ js return { createInt8Array         : function(n, init) { var r = new Int8Array        (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createUint8Array        : function(n, init) { var r = new Uint8Array       (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createUint8ClampedArray : function(n, init) { var r = new Uint8ClampedArray(n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createInt16Array        : function(n, init) { var r = new Int16Array       (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createUint16Array       : function(n, init) { var r = new Uint16Array      (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createInt32Array        : function(n, init) { var r = new Int32Array       (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createUint32Array       : function(n, init) { var r = new Uint32Array      (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createFloat32Array      : function(n, init) { var r = new Float32Array     (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { createFloat64Array      : function(n, init) { var r = new Float64Array     (n); if(init != undefined) for(var i=0; i<n; i++) r[i] = init; return r }  } #}   #####
#{ js return { resize              : function(s, leng) { s.length = leng }                        } #}   #####
#{ js return { toLower             : function(s)       { return s.toLowerCase() }                 } #}   #####
#{ js return { toUpper             : function(s)       { return s.toUpperCase() }                 } #}   #####
#{ js return { charCodeAt          : function(s, i)    { if(typeof s != 'string') { throw('charCodeAt expected string, was '+(typeof s)) } return s.charCodeAt(i) }                 } #}   #####
//#{ js return { push                : function(a, v, i) { if(!a.push && !a.splice) { throw("cannot push "+(v)+" to "+(a) ) } if(i != undefined) a.splice(i,0,v); else a.push(v) }   } #}   #####
#{ js return { pop                 : function(a, i, n) { if(!a.length) { return undefined } if(i != undefined) return a.splice(i,n||1)[0]; return a.pop(a) }       } #}   #####
#{ js return { arrayConcatToString : function(a, v)    { return a.join(v || '') }                 } #}   #####
// core #{ js return { split               : function(s, by)   { return s.split(by) }                     } #}   #####

#{ js return { getURLQueryString   : function()        { return location.search === '' ? '' : location.search.substring(1) }                 } #}   #####
#{ js return { setURLQueryString   : function(str)     { location.search = str }                 } #}   #####
#{ js return { getURLFragment      : function()        { return location.hash === '' ? '' : location.hash.substring(1) }                 } #}   #####
#{ js return { setURLFragment      : function(str)     { location.hash = str }                    } #}   #####
#{ js return { setURLRelative      : function(relDir)  { location.pathname = location.pathname + relDir }   } #}   #####

// time in seconds since 1970/01/01 
#{ js return { getTime             : function(s)       { return (new Date()).getTime() / 1000 }   } #} 

#{ js return { getSystemDPI             : function(s)       { return (window.devicePixelRatio || 1) }   } #} 
#{ js return { getPageWidth             : function(s)       { return (window.innerWidth || 1920) }   } #} 
#{ js return { getPageHeight            : function(s)       { return (window.innerHeight || 1080) }   } #} 

#####

#{ js return { uriToTable          : function (queryString) {
	
			var result = {}, re = /([^&=]+)=([^&]*)/g, m;
			
			while (m = re.exec(queryString)) {
				result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
			}
			
			return result;
		}
	}
#}

#####

#{ js return { tableToUri          : function (t) {
			var out = []
			for(var k in t) {
				if(k !== '__id__' && t[k] != undefined) {
					out.push(encodeURIComponent(k) + '=' + encodeURIComponent(t[k]))
				}
			}
			return out.join('&');
		}
	}
#}

#####

#{ js return { domGet : function(name) { return document.getElementById('###' + name) } } #}

#####

#{ js return { getThreeJs : function() { return THREE } } #}

#####

#{ js 

	var keysNeedInit = true
	var keyCodeToName = function(keyCode) {
		if(keyCode >= 48 && keyCode <= 57) return ''+(keyCode-48)
		if(keyCode >= 65 && keyCode <= 90) return String.fromCharCode(keyCode).toLowerCase()
		switch(keyCode) {
		 case 8   : return "back"
		 case 9   : return "tab"
		 case 13  : return "enter"
		 case 16  : return "shift"
		 case 17  : return "control" // ctrl? 
		 case 18  : return "alt"  
		 case 19  : return "break"
		 case 20  : return "caps lock"
		 case 27  : return "escape"
		 case 33  : return "page up"      
		 case 34  : return "page down"
		 case 35  : return "end"
		 case 36  : return "home"
		 case 37  : return "left"
		 case 38  : return "up"
		 case 39  : return "right"
		 case 40  : return "down"
		 case 45  : return "insert"
		 case 46  : return "delete"
		 case 91  : return "left window"
		 case 92  : return "right window"
		 case 93  : return "select key"
		 case 96  : return "numpad 0"
		 case 97  : return "numpad 1"
		 case 98  : return "numpad 2"
		 case 99  : return "numpad 3"
		 case 100 : return "numpad 4"
		 case 101 : return "numpad 5"
		 case 102 : return "numpad 6"
		 case 103 : return "numpad 7"
		 case 104 : return "numpad 8"
		 case 105 : return "numpad 9"
		 case 106 : return "multiply"
		 case 107 : return "add"
		 case 109 : return "subtract"
		 case 110 : return "decimal point"
		 case 111 : return "divide"
		 case 112 : return "f1"
		 case 113 : return "f2"
		 case 114 : return "f3"
		 case 115 : return "f4"
		 case 116 : return "f5"
		 case 117 : return "f6"
		 case 118 : return "f7"
		 case 119 : return "f8"
		 case 120 : return "f9"
		 case 121 : return "f10"
		 case 122 : return "f11"
		 case 123 : return "f12"
		 case 144 : return "num lock"
		 case 145 : return "scroll lock"
		 case 186 : return ";"
		 case 187 : return "="
		 case 188 : return ","
		 case 189 : return "-"
		 case 190 : return "."
		 case 191 : return "/"
		 case 192 : return "`"
		 case 219 : return "["
		 case 220 : return "\\"
		 case 221 : return "]"
		 case 222 : return "'"
		}
		return '_other'
	}
	var keyState = {
	}
	var keyListener = function() {}
	var keyInit = function() {
		window.addEventListener('keyup',   function(event) { var name = keyCodeToName(event.keyCode); keyState[name] = 0; keyListener(name, 0) }, false);
		window.addEventListener('keydown', function(event) { var name = keyCodeToName(event.keyCode); keyState[name] = 1; keyListener(name, 1) }, false);	
	}
	var keyDown = function(name) {
		if(keysNeedInit) { keysNeedInit = false; keyInit() }
		return keyState[name.toLowerCase()] == 1 ? true : false
	}
	var setKeyListener = function(callback) { 
		if(keysNeedInit) { keysNeedInit = false; keyInit() }
		keyListener = callback
	}

	return { 
		keyDown : keyDown,
		setKeyListener : setKeyListener,
	}
#}

#####

#{ js 

	var prefix = '###'
	var textInputId=0
	return { createTextInput       : function(values, onChange) {
		textInputId = textInputId + 1
		var rect = values.rect
		if(!rect) { throw('createTextInput : rect is not optional') }
		var id = prefix + 'text_input_' + textInputId
		var el = document.createElement('div')
		el.style.position = 'absolute'
		el.style.width = '0px'
		el.style.height = '0px'
		var lastRect = [-1,-1,-1,-1]
		var lastText
		var lastSelStart 	
		var lastSelEnd  	

		if (!document.querySelector('link[href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200&display=swap"]')) {
			const link = document.createElement('link');
			link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200&display=swap';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
			document.body.classList.add('jetbrains-mono');
		}

		el.innerHTML = '<textarea id="' +id+ '" spellcheck="false" style="font-family: \'JetBrains Mono\', monospace;font-size:16px;width:0px;height:0px" wrap="off" rows="13" cols="50" name="expr" '
					  +'oninput="'   +id+ '_CheckForChange()" '
					  +'onkeyup="'   +id+ '_CheckForChange()" '
					  +'onkeydown="' +id+ '_CheckForChange()" '
					  +'onmouseup="' +id+ '_CheckForChange(1)" ></textarea>'
		document.getElementById(prefix+'text_input').appendChild(el)
		var tarea = document.getElementById(id)
		var pad = 10
		var setRect


		var equal = (a,b) => { return Math.abs(a-b) < 0.000001}


		var check = function(rectCheck) {
			if(rectCheck) {
				var taW = parseInt(tarea.style.width) + pad*2
				var taH = parseInt(tarea.style.height) + pad*2
				if(!equal(taW, lastRect[2]) || !equal(taH, lastRect[3])) {
					setRect([	parseInt(el.style.left),
								parseInt(el.style.top),
								taW,
								taH ])
				}					
				/*
				if(parseInt(tarea.style.width)!=lastRect[2] || parseInt(tarea.style.width)!=lastRect[3]) {
					setRect([	parseInt(el.style.left),
								parseInt(el.style.top),
								parseInt(tarea.style.width),
								parseInt(tarea.style.height) ])
				}
				*/
			} else {
				if(tarea.value != lastText) {
					lastText = tarea.value
					onChange('text', tarea.value);
				}
//				if(lastSelStart != tarea.selectionStart) {
//					lastSelStart = tarea.selectionStart
//					onChange('selectionStart', tarea.selectionStart)
//				} 
//				if(lastSelEnd != tarea.selectionEnd) {
//					lastSelEnd = tarea.selectionEnd
//					onChange('selectionEnd', tarea.selectionEnd)
//				} 
			}
		}
		window[id+'_CheckForChange'] = check
		tarea.style.border = 0	
		tarea.style.backgroundColor = 'transparent'	
		tarea.style.overflow = 'auto'
		// tarea.style.zIndex = '0'	
		// tarea.style.position = 'absolute'
		var setText = function(t) {
			var sel = document.activeElement == tarea && [tarea.value, tarea.selectionStart, tarea.selectionEnd]
			tarea.value = t
			if(sel){
				var oldStrAfterSelection = sel[0].substring(sel[2])
				var newSel2 = t.length - oldStrAfterSelection.length
				if(oldStrAfterSelection == t.substring(newSel2)) {
					tarea.selectionStart = newSel2 - (sel[2] - sel[1])
					tarea.selectionEnd = newSel2
				} else {
					tarea.selectionStart = sel[1]
					tarea.selectionEnd = sel[2]
				}
			}
			check()
		}	
		setRect = function(rect) {
			if(rect == undefined) { // what is this? delete by setting undefined rect? weird
				window[id+'_CheckForChange'] = undefined
				document.getElementById(prefix+'text_input').removeChild(el)
				return
			}
			if((rect[0]!=lastRect[0] || rect[1]!=lastRect[1] || rect[2]!=lastRect[2] || rect[3]!=lastRect[3])) {
				lastRect = rect.slice(0)
				el.style.left = rect[0]+'px'
				el.style.top = rect[1]+'px'
				el.style.width = rect[2]+'px'
				el.style.height = rect[3]+'px'
				tarea.style.padding = pad+'px'
				tarea.style.width = (rect[2]-pad*2)+'px'
				tarea.style.height = (rect[3]-pad*2)+'px'	
				onChange('rect', lastRect);
			}				
		}
		var lastColor;    
		var setColor          = function(c) { if(c != lastColor)    { onChange('color',          c) }  tarea.style.color = c }

//		setting selectionStart / selectionEnd in chrome, sets the focus of that edit component, but not in FF, in IE one need to use another API
//  
//		var setSelectionStart = function(i) { if(i != lastSelStart) { onChange('selectionStart', i) }  tarea.selectionStart = i }
//		var setSelectionEnd   = function(i) { if(i != lastSelEnd)   { onChange('selectionEnd',   i) }  tarea.selectionEnd = i }
	//	tarea.value = values.text || ''
		setText(values.text || '')
		setRect(rect)
		setColor(values.color || '#FFFFFF')
//		setSelectionStart(values.selectionStart || 0)
//		setSelectionEnd(values.selectionEnd || 0)
		return { 
			setText : setText,
			setRect : setRect,
			setColor : setColor,
//			setSelectionStart : setSelectionStart,
//			setSelectionEnd : setSelectionEnd,
//			getText : function(t) { return tarea.value },  minimize: only design for onChange
		}		
	
/*	
	getId = function(){
      var id = 1;
      return function(){
        id++;
      }
    }();	        
	
	var box = document.getElementById("divCreateTextbox");
        var curr = 'txt' + getId();
        var inp = document.createElement('input');

        inp.type = 'text';
        inp.name = 'textfield';
        inp.setAttribute("maxlength",'10');
        inp.setAttribute("id",curr);

        box.appendChild(inp);

        inp.setAttribute('onkeyup','moveOnMax(this)');
        box.appendChild(document.createElement("br"));
        inp.focus();	
		
	
		var el = document.createElement('textarea')
		el.name = "post";
		el.maxLength = "5000";
		el.cols = "80";
		el.rows = "40";
		el.style.position = 'absolute'
		var setRect = function(rect) {
			el.style.left = rect[0]+'px'
			el.style.top = rect[1]+'px'
			el.style.width = rect[2]+'px'
			el.style.height = rect[3]+'px'
		}
		setRect(rect)
		var root = document.getElementById(prefix+'text_input')
		if(root) { root.appendChild(el); }		
		
		var update = function() { alert('dd')}
		el.setAttribute('onkeyup', 'alert(sss)')
*/
		
		/*
		createTextInputM = func defText, defRect, defColor, defSelBegin, defSelEnd {
			text     = m.create(defText or '')
			rect     = m.create(defRect or [100,100,400,20])
			color    = m.create(defColor or '#FFFFFF')
			selStart = m.create(defSelBegin or -1)
			selEnd   = m.create(defSelEnd or -1)		
			textIn = createTextInput( func whatChanged, data {
				if whatChanged == 'text'  { set(text,data) }
				if whatChanged == 'rect'  { set(rect,data) }
				if whatChanged == 'color' { set(color,data) }
				if whatChanged == 'selectionStart' { set(selectionStart,data) }
				if whatChanged == 'selectionEnd' { set(selectionEnd,data) }
			})
			m.hook(rect, func { textIn.setRect(get(rect)) } )
			m.hook(curText, func { textIn.setText(get(curText)) } )
			m.hook(selBegin, func { textIn.setSelection(get(selBegin), get(selEnd)) } )
			m.hook(selEnd  , func { textIn.setSelection(get(selBegin), get(selEnd)) } )
			return { text = curText, selectionBegin = selBegin, selectionEnd = selBegin }
		}
		
		modelWrap = func rd, createFunc {
			model = {}
			interface = createFunc(values, func whatChanged, data {
				m = model[whatChanged]
				if m and rd.compatible(m) { rd.set(m, data) }
				else { model[whatChanged] = data}
			}
			for name, func in interface {
				attr = substring(name, 3)
				t = substring(name, 0, 3)
				if t == 'set' {
					model[name] = rd.create( model[name] or 
											 values[m] or 
											 (interface['get'..attr] and interface['get'..attr]()) or
											 throw('missing defaultvalue for '..attr) )
				}
			}
		}

		*/
		}
	}
#}

#####

/*  flushlater is used by wrapper and should never be stripped, moving to io_simple


#{ js
	var laterl = []
	var reentryblock = false
	return {
		later      : function(fnc) { laterl.push(fnc) },
		flushLater : function(v) {
			if(reentryblock) { return }  // firefox alerts can cause reentry
			reentryblock = true
			for(var i = 0; i < laterl.length ; i++) { 
				laterl[i]();
				if(i>1000000) {
					throw('flushLater overflow limit!')
				}
			}
			reentryblock = false
			laterl = []
		},
	}
#}


*/

#####

	// createGuiContextWithRenderer

#{ js 


	var prefix = '###'
	var G = function(name)    { return window.self[(prefix+name)] }
	var S = function(name, v) { return window.self[(prefix+name)] = v }	
	var createFilledWindowCanvas = function(options) {

		options = options || {} // copy options?
		
		var dprX
		var dprY
		var qW, qH
	    var prevIW
	    var prevIH
	    var prevDpr
		var forceNext = false
		
		var createOrUpdateCanvas = function(canvasW, canvasH, pageW, pageH) {
			var canvasElement = document.getElementById(options.htmlId + "_canvas")
//			if(canvasElement == undefined) {
				document.getElementById(options.htmlId).innerHTML = "<canvas id=\"" + options.htmlId + 
					"_canvas\" style=\"width:"+pageW+"px;height:"+pageH+"px;margin:0;margin:0;border:0\" width=\""+
					canvasW+"px\" height=\""+canvasH+"px\" style=\"background-color:#333333;\" >no canvas support!<\/canvas>"
				var canvasElement = document.getElementById(options.htmlId + "_canvas")				
//			} else {
//			     canvasElement.width = canvasW;
//			     canvasElement.height = canvasH;
//			}
			if(options.onChangeSize) {
				options.onChangeSize(canvasElement, canvasW, canvasH, pageW, pageH, dprX, dprY)
			}
		}
		
		var setCanvasQuality = function(w,h) {
			w = w || 1
			h = h || w
			qW = w
			qH = h
			forceNext = true
		}	
		
		var handleRescale = function() {
			var dpr = (window.devicePixelRatio || 1)
			dprX = qW * dpr
			dprY = qH * dpr
			var w = Math.floor(window.innerWidth * dprX)
			var h = Math.floor(window.innerHeight * dprY)
			if( forceNext || ! (prevIW == w && prevIH == h && prevDpr == dpr) ) {
				forceNext = false
				prevIW = w
				prevIH = h
				prevDpr = dpr
				createOrUpdateCanvas(w, h, window.innerWidth, window.innerHeight)
			}
		}
		
		setCanvasQuality(options.canvasQualityW, options.canvasQualityH)
		handleRescale()
		
		return {
			handleRescale : handleRescale,
			setCanvasQuality : setCanvasQuality,
			getPageToCanvasScalingFactors : function() { return [dprX, dprY] },
		}
	}


	var mdiMouseButtons = {}
	var mdiMouseMove = false

	// Minimal Drag Input
	var mdiBindInput = function(	element,		// html element

						posChange,		// posChange(id, data, diff)     
										//	 * id for inputtype, numbers for touch fingers, "mouse0", "mouse1" etc for mousebuttons
										//	 * data currently only holds position data (x and y), but can be expanded
										//   * diff gives relative change since last event
										
						statusChange,	// (optional) statusChange(id, data, status)
										//	 * id   (see above)
										//	 * data (see above)
										//   * status (bool) tells if the input was added/removed
										
						getPageOffset	// (optional) getPageOffset(element) { ... return {x: ... , y: ... } }
										//   if you need more precise positioning 
										
										
						) {
					
		statusChange = statusChange || function() { }
		getPageOffset = getPageOffset || function(obj) {
				var xpos = 0, ypos = 0
				if (obj.nodeName == "TR") { // TR is not reliable. Need to get TD.
					obj = obj.getElementsByTagName("td")[0]
				}
				while (obj) {
					xpos += obj.offsetLeft
					ypos += obj.offsetTop
					obj = obj.offsetParent
				}
				return {x:xpos, y:ypos}
			}
		
		var prevMPos
		var preventDefault = function(e) {
			if(e.preventDefault) e.preventDefault(); else e.returnValue = false
		}
		var getMousePos = function(e) { return {x:e.clientX + (window.scrollX || window.document.body.scrollLeft),  
												y:e.clientY + (window.scrollY || window.document.body.scrollTop) } }
		var offset = function(pos,isMouse) { var o = getPageOffset(element); if(isMouse) { var t = getScroll(); o.x+=t.x; o.y+=t.y } return {x:pos.x - o.x, y:pos.y - o.y} }
		
		var mousemove = function(e) {
			var k, v, mp = getMousePos(e)
			for(k in mdiMouseButtons) {
				if(k !== '__id__') {
					v = mdiMouseButtons[k]
					if(v) {
						posChange(k, offset({x:mp.x, y:mp.y}), {x:mp.x - prevMPos[0], y:mp.y - prevMPos[1]})
					}					
				}
			}
			prevMPos = [mp.x, mp.y]
			preventDefault(e)
	//		e.preventDefault();
	//		e.stopPropagation();	  
	//		return false
		}
		
		var mouseup = function(e) {
			var k, i = 0, mp = getMousePos(e)
			var id = 'mouse' + (e.button || '0')
			if(mdiMouseButtons[id]) {
				statusChange(id, offset({x:mp.x, y:mp.y}), false)
				mdiMouseButtons[id] = undefined
			}
			for(k in mdiMouseButtons) { if(k !== '__id__' && mdiMouseButtons[k]) { i++; break } }
			if(i == 0) {
				document.removeEventListener('mousemove', mousemove, false)
				document.removeEventListener('mouseup', mouseup, false)
				mdiMouseMove = false
			}
			preventDefault(e)
	//		e.preventDefault();
	//		e.stopPropagation();	  
	//		return false
		}

		var mdiMouseButtons = {}
		var mousedown = function(e) {
			var id = 'mouse' + (e.button || '0'), mp = getMousePos(e)
			if(mdiMouseButtons[id]) {
				statusChange(id, offset({x:mp.x, y:mp.y}), false)  // mouseup was lost, this happens in chrome (rightdown -> leftdown -> rightrelease)
			}
			mdiMouseButtons[id] = true
			statusChange(id, offset({x:mp.x, y:mp.y}), true)
			if(!mdiMouseMove) {
				prevMPos = [mp.x, mp.y]
				document.addEventListener('mousemove', mousemove, false)	// we want "mousecapture" as default, this is why we need this global stuff
				document.addEventListener('mouseup', mouseup, false)
				mdiMouseMove = true
			}	
			preventDefault(e)
	//		e.preventDefault();
	//		e.stopPropagation();	  
	//		return false
		}
		element.addEventListener('mousedown', mousedown, false);
		
		window.oncontextmenu = function () { return false; }  
		
		var activeFingers = {}
		var touchUpdate = function(e) {
			processed = {}
			for(var i = 0; i < e.targetTouches.length; i++) { var v = e.targetTouches[i]
				var id = v.identifier
				if(!activeFingers[id]) {
					activeFingers[id] = {x: v.pageX, y: v.pageY}
					statusChange(id, offset(activeFingers[id]), true)			
				} else {
					if(!(activeFingers[id].x == v.pageX && activeFingers[id].y == v.pageY)) {
						var p = {x: v.pageX, y: v.pageY}
						posChange(id, offset(p), {x: p.x - activeFingers[id].x, y: p.y - activeFingers[id].y})
						activeFingers[id] = p
					}
				}
				processed[id] = 1
			}
			for(var id in activeFingers) { var v = activeFingers[id]
				if(id !== '__id__' && v && !processed[id]) {
					statusChange(id, offset(activeFingers[id]), false) // end
					activeFingers[id] = undefined
				}
			}
			preventDefault(e)
		}
		element.addEventListener('touchstart', touchUpdate, false);
		element.addEventListener('touchmove', touchUpdate, false);
		element.addEventListener('touchend', touchUpdate, false);
		
	}

	var canvasQuality = 1
	var pageToCanvasX = 1
	var pageToCanvasY = 1

	var dwWrapInput = dw_g_createCallbackWrapper(prefix, 'inputWrap')

	var inputHandler = function(id, pos, a3) {
		
		if(G('inputHandler') != undefined) {
			pos = {x:pos.x * pageToCanvasX, y:pos.y * pageToCanvasY}
			if(a3.x) a3 = {x:a3.x * pageToCanvasX, y:a3.y * pageToCanvasY}
			
			dwWrapInput(function() {
				G('inputHandler')(id, pos, a3)				
			})	
		}	
	}

	var curW = 0, curH = 0
	var createGuiContextWithRenderer = function(renderer, opt) { 
		if(G('currentFilledWindowCanvas') != undefined) {
			throw('createGuiContext() only one per window and dw prefix allowed!')
		}
		var onResize = undefined
		var winCanvas = createFilledWindowCanvas( {
			canvasQualityW : canvasQuality,
			canvasQualityH : canvasQuality,
			htmlId : prefix+"canvas_area",
			onChangeSize : function(canvas, canvasW, canvasH, pageW, pageH, dprX, dprY) {
					curW = canvasW ; curH = canvasH
					mdiBindInput(canvas, inputHandler, inputHandler)
					renderer.setTargetCanvas(canvas, curW, curH)
					if(onResize) {
						onResize(curW, curH, pageW, pageH, dprX, dprY)
					}

			//		if(opt && opt.onResize) {
			//			opt.onResize(curW, curH)
			//		}

			//		if(G('setContext') != undefined) {
			//			G('setContext')(canvas.getContext("2d"))
			//		}

	//				g_ctx = canvas.getContext("2d")
					pageToCanvasX = dprX
					pageToCanvasY = dprY
	//				pageSizeW = pageW * dprX
	//				pageSizeH = pageH * dprY
	//				pageSizeMax = Math.max(pageSizeW, pageSizeH)
	//				
	//				geoPixelApp.setDisplaySize(geoPixelApp, canvasW, canvasH)
	//				wantRepaint()
				},
			})
		S('currentFilledWindowCanvas', winCanvas)		
		
		return {
					getPixelWidth    : function() { return curW },
					getPixelHeight   : function() { return curH },
					onResize         : function(onResizeCallback) { onResize = onResizeCallback },
					setCanvasQuality : winCanvas.setCanvasQuality,
					setTargetCanvas  : renderer.setTargetCanvas,
					getBasicDraw     : renderer.getBasicDraw ? renderer.getBasicDraw : function()  { return undefined },
//					getGL            : renderer.getGL        ? renderer.getGL        : function()  { return undefined },
					useGL            : renderer.useGL        ? renderer.useGL        : function()  { return undefined },
					remove           : function() { 
							if(renderer.remove()) { renderer.remove() }
							document.getElementById(options.htmlId).innerHTML = ''
						}
				}
	}


return {
	createGuiContextWithRenderer : createGuiContextWithRenderer
}

#}


#####

#{ js 
	return {
		createCanvasRenderer : function() {
			var g_fill_enable=0
			var g_fill_alpha=1
			var g_stroke_enable=1
			var g_stroke_alpha=1
			var g_ctx = undefined
			var g_w = 0
			var g_h = 0

			var endpath = function()			{ if(g_fill_enable) g_ctx.fill(); if(g_stroke_enable) { g_ctx.globalAlpha=g_stroke_alpha; g_ctx.stroke(); g_ctx.globalAlpha=g_fill_alpha; } }

			var canvasImpl = {		
//				clear		    : function(c,a)			{ var tmp=g_ctx.fillStyle; g_ctx.fillStyle=c; g_ctx.globalAlpha=a; g_ctx.fillRect(0,0,g_w,g_h); g_ctx.fillStyle=tmp; g_ctx.globalAlpha=g_fill_alpha},
				getWidth 	    : function()			{ return g_w },
				getHeight 	    : function()			{ return g_h },
				beginPath	    : function()			{ g_ctx.beginPath()},
				moveTo		    : function(x,y)			{ g_ctx.moveTo(x,y)},
				lineTo		    : function(x,y)			{ g_ctx.lineTo(x,y)},
				endPath		    : endpath,
				fillRect	    : function(x,y,w,h)		{ g_ctx.fillRect(x,y,w,h)},
				fillEnable	    : function(b)			{ g_fill_enable=b},
				fillColor	    : function(c)			{ g_ctx.fillStyle=c},
				fillAlpha	    : function(a)			{ g_ctx.globalAlpha=a; g_fill_alpha=a},
				strokeEnable    : function(b)			{ g_stroke_enable=b},
				strokeColor	    : function(c)			{ g_ctx.strokeStyle=c},
				strokeAlpha	    : function(a)			{ g_stroke_alpha=a},
				strokeWidth	    : function(w)			{ g_ctx.lineWidth=w},
				setTransform	: function(a,b,c,d,e,f)		{ g_ctx.setTransform(a,b,c,d,e,f) },
		//		transformPush	: function(a,b,c,d,e,f)		{ g_ctx.save() ; g_ctx.transform(a,b,c,d,e,f) },
		//		transformPop	: function()		{ g_ctx.restore() }, // problem: will also pop colors n stuff
				circle	: function(x,y,r)		{ 
				      g_ctx.beginPath()
				      g_ctx.arc(x, y, r, 0, 6.283185307179585, false)
				      endpath()
				 },

				drawImage	: function(i, a,b, c,d, e,f, g,h)	{   
					if(c == undefined) {
						// drawImage i x y                    > drawImage i     0   0   i.w  i.h      x   y   i.w  i.h      "drawImageXY"
						g_ctx.drawImage(i._im,	i.x, i.y, i.w, i.h,    a, b, i.w, i.h)
						
					} else if (e == undefined) {                                                     
						// drawImage i x y w h                > drawImage i     0   0   i.w  i.h      x   y   w    h        "drawImageScaled"
						g_ctx.drawImage(i._im,	i.x, i.y, iw, ih,    a, b, c, d)
						
		//			} else if (g == undefined) {                                                     
						// drawImage i ix iy iw ih x y        > drawImage i     ix  iy  iw   ih       x   y   iw   ih        "drawImagePart"
						
					} else {                                                                         
						// drawImage i ix iy iw ih x y w h    > drawImage i     ix  iy  iw   ih       x   y   w    h        "drawImageScaledPart"
						g_ctx.drawImage(i._im,	a + i.x,
												b + i.y,   c, d,    e, f, g, h)
					}
				},
			}
			
			return {
				setTargetCanvas : function(canvas, w, h) { g_ctx = canvas.getContext("2d") ; g_w = w ; g_h = h },
				getBasicDraw    : function()  { return canvasImpl }
			}
		}
	}
#}

#####

#{ js 
	return {
		createOpenGLRenderer : function() {
			var w=0,h=0,gl, list 
			return {
				setTargetCanvas : function(canvas, w_, h_) {
					w = w_
					h = h_
					gl = WebGLUtils.setupWebGL(canvas, {antialias:false})
					if(list) list(gl, w, h)
				},
				useGL : function(listen) { list = listen ; listen(gl, w, h)}
			}
		}
	}
#}

#####  api createGuiContext   = func opt { createGuiContextWithRenderer(createCanvasRenderer(), opt) }
#####  api createGuiContextGL = func opt { createGuiContextWithRenderer(createOpenGLRenderer(), opt) }

#####


global tryCallWithReport = func f {
	r = tryCall(f)
	if r.error {
		msg = r.error + '\n\n'
		if(r.stackInfo) {
			for _, info in r.stackInfo {
				msg = msg .. info.ttfId .. '  ' .. info.name .. '  ' .. info.line .. '\n'
			}
		}
		alert(msg)
	}
	r
}

#####

global getStackInfo = func r {
	msg = ''
	if r.error and r.stackInfo {
		for _, info in r.stackInfo {
			msg = msg .. info.ttfId .. '  ' .. info.name .. '  ' .. info.line .. '\n'
		}
	}
	msg
}

#####


testExceptions = true
successfullCount = 0
failedCount = 0

global unitTest = func testName, codeAsText, expectedToBe, outputOnFail {
	if not testExceptions and expectedToBe == 'PARSE_FAIL' {
		return
	}
	a = nil
	if type(codeAsText) == 'string' {
		a = textToFunc(codeAsText, testName)
	} else if type(codeAsText) == 'func' {
		a = { func = codeAsText }
		codeAsText = "(not available for funcs)"
	} else {
		gDebugConsoleSize = 'big'
		print('unitTest() argument error, wrong type, use text or func')
		return
	}
	dnativeText = a.dnative
	if a.error {
		if expectedToBe == 'PARSE_FAIL' {
			a = 'PARSE_FAIL'
		} else {
			gDebugConsoleSize = 'big'
			print('unitTest error ttf: ' .. testName .. '  ' .. a.error .. '\n')	
			if outputOnFail { print('\n' .. (outputOnFail)) }

//			print('\ndnative : ' .. dnativeText .. '\n\n')	
			failedCount = failedCount + 1;
			return nil
		}
	} else {
//		a = tryCallWithReport(a.func)
		a = tryCall(a.func)
		if a.error {
			gDebugConsoleSize = 'big'
			print('unitTest error exe: ' .. testName .. '  ' .. a.error .. '\n\n' .. getStackInfo(a) .. '\n\n' .. codeAsText .. '\n')	
			if outputOnFail { print('\n' .. (outputOnFail)) }			
			failedCount = failedCount + 1
			return nil
		} else {
//			debug(codeAsText .. "    // " .. testName .. ' ' .. (expectedToBe or 'nil'));   //  .. '// ' .. (expectedToBe or 'nil')
			a = a.ret
		}
	}
	if a != expectedToBe { 
		gDebugConsoleSize = 'big'
		print(testName .. ': result expected to be: \n' .. expectedToBe  .. ' but was: \n' .. a .. '\ndnative : ' .. dnativeText .. '\n\n')
		if outputOnFail { print('\n' .. (outputOnFail)) }			
		failedCount = failedCount + 1
	} else {
		successfullCount = successfullCount + 1
	}
}
					
global unitTestReport = func { 
	print('' .. successfullCount .. ' passed')
	if failedCount != 0 {
		print('' .. failedCount .. ' failed')
	}
}

#####


#{ js
	return { 		
		dbSync : function(ctxId, timeDiff, data, f) {
			return ###http('dbSync.php', { sendData : "ctxId="+ctxId+"&timeDiff="+timeDiff+"&data="+encodeURIComponent(data)}, f)
//			return http('dbSync.php', { sendData : {ctxId:ctxId, timeDiff:timeDiff, data:data}, f)
		}
	}

#}


#####

#{ js
	var dwGetImageWrap = dw_g_createCallbackWrapper('###', 'getImageResponse', true)
	var cacheImg = {}
	return {
		getImage : function(loc, options, func, fragmentInfo) { // fragmentInfo can be { rects: [{x,y,w,h}] }  /  { hStrip : <count> }  /  { vStrip : <count> } 
			if(cacheImg[loc]) {
			 	if(cacheImg[loc].loaded) {
			 		func(undefined, cacheImg[loc].fragHandles)
				} else {
					cacheImg[loc].funcs.push(func)		
				}				
			} else {
				var im = new Image()
				cacheImg[loc] = { loaded : false, funcs : [func], image:im, fragHandles: undefined, frag : fragmentInfo }
				im.onerror = im.onabort = function() { 
					dwGetImageWrap(function() {
						for(var i in cacheImg[loc].funcs) { if(i !== '__id__') {							
							cacheImg[loc].funcs[i]("aborted", undefined )
						}}
						cacheImg[loc] = undefined						
					})
				}
				im.onload = function() {
					dwGetImageWrap(function() {
						cacheImg[loc].loaded = true		
						var h
						if(fragmentInfo == undefined)  { h = {_im : im, x : 0, y : 0, w : im.width, h : im.height}
						} else if(fragmentInfo.rects)  { h = []; var r = fragmentInfo.rects ; for(i = 0; i < r.length; i++) { h.push({_im:im, x:r[i].x, y:r[i].y, w:r[i].w, h:r[i].h}) } 
						} else if(fragmentInfo.hStrip) { h = []; var fw = Math.floor(im.width  / fragmentInfo.hStrip); for(i = 0; i < fragmentInfo.hStrip; i++) { h.push({_im : im, x : i * fw, y : 0, w : fw, h : im.height}) }
						} else if(fragmentInfo.vStrip) { h = []; var fh = Math.floor(im.height / fragmentInfo.vStrip); for(i = 0; i < fragmentInfo.vStrip; i++) { h.push({_im : im, x : 0, y : i * fh, w : im.width, h : fh}) }
						} else { throw('fragmentInfo invalid parameter') }
						
						cacheImg[loc].fragHandles = h
						for(var i in cacheImg[loc].funcs) { if(i !== '__id__') {	
							cacheImg[loc].funcs[i](undefined, cacheImg[loc].fragHandles )
						}}	
					})			 
				}
				im.src = loc
			}	
		}
	}
#}	

#####

#{ js

return {
	initRawSoundOutStream : function(channels, sr, getSamplesCallback, failCallback) {
		var buflo = 256 //Math.max(32, Math.floor(latency * sr))
		var bufhi = buflo * 4 // these values doesn't do anything?
		// new XAudioServer(int channels, double sampleRate, int bufferLow, int bufferHigh, function underRunCallback, double volume, function failureCallback);
		return new XAudioServer(channels, sr, buflo, bufhi, getSamplesCallback, 1, failCallback);
	}
}

#}


#####

#{ js return { domNull : null } #}

#####

api glTextureFromSpec = func gl, spec {
  w = spec.w ?: 256
  h = spec.h ?: 256
  out = { w = w, h = h }
  useFloat = spec.type == 'float' or spec.type == 'float4'

  if spec.hasFramebuffer {
    out.glFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.glFrameBuffer);        
  }

  out.glTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, out.glTexture);
  if useFloat or spec.noFilter {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // only nearest seem to work with float
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);        
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if not spec.useMipmaps {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);          
    }
  }

  if useFloat {
      float_texture_ext = gl.getExtension('OES_texture_float'); // calling this makes this extension available in the context
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, domNull)
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, domNull);
  }

  if spec.hasDepthBuffer {
     out.glDepthBuf = gl.createRenderbuffer();
     gl.bindRenderbuffer(gl.RENDERBUFFER, out.glDepthBuf);
     gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, out.glDepthBuf);
  }

  if spec.hasFramebuffer {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, out.glTexture, 0);
  }

    gl.bindTexture(gl.TEXTURE_2D, domNull);
    gl.bindRenderbuffer(gl.RENDERBUFFER, domNull);
    gl.bindFramebuffer(gl.FRAMEBUFFER, domNull);     

    out.remove = func {
    	if out.glTexture     { gl.deleteTexture      (out.glTexture)     }
    	if out.glDepthBuf    { gl.deleteRenderbuffer (out.glDepthBuf)    }
    	if out.glFrameBuffer { gl.deleteFramebuffer  (out.glFrameBuffer) }
    }
    return out  
}


#####

createGLShader = func isVertexShader {
	return func gl, spec {
		shader = gl.createShader(isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		gl.shaderSource(shader, spec.source);
		gl.compileShader(shader);
		compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if not compiled {
			err ='createGLShader()' .. gl.getShaderInfoLog(shader) .. '\n\n' .. spec.source
			gl.deleteShader(shader)
			throw(err)
		}
		out = { glShader = shader }
		out.remove = func { if out.glShader { gl.deleteShader(out.glShader) } }
		return out
	}
}

api glVertexShaderFromSpec = createGLShader(true)
api glPixelShaderFromSpec  = createGLShader(false)


#####

/*
function createDomImage(w, h) {
 var canvas = document.createElement('canvas');
 canvas.width = w;
 canvas.height = h;
 return 
}
*/
#{ js

return { 
   imageToBase64 : function (img) {
	 var canvas = document.createElement('canvas');
	 var w = img.naturalWidth
	 var h = img.naturalHeight
	 canvas.width = w;
	 canvas.height = h;
	//  document.body.appendChild(canvas);
	// return canvas.getContext("2d")
	 var ctx = canvas.getContext("2d")
	// ctx.clearRect(0, 0, w, h);
	// ctx.fillRect(10,10,20,20)
	 ctx.drawImage(img, 0, 0, w, h);
	 return canvas.toDataURL().slice(22);
	}
}

#}


#####

api flProgramFromSpec = func gl, spec {

}