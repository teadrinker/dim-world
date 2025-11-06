

(function() {
'use strict';

	var testExceptions = true
	var browserDebugToolsIsOpen =  window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200
	if(browserDebugToolsIsOpen) {
		self.console.log("browser debug tools is open, skipping tests with exceptions")
		testExceptions = false
	}

	function createDSTester(options) {
		var successfullCount = 0
		var failedCount = 0		
		var outputOnFail = true
		var print = function(str) { self.console.log(str) }

		var prefix = 'dst_'
		var parser = self.dw_g_createDScriptParser({release : true, prefix: prefix})
		parser.registerGlobal('foo', prefix + 'foo')
		var runtest = function(testName, codeAsText, expectedToBe) {
			var a = parser.parse(codeAsText, testName)
			var dnativeText = a.dnative
			if (a.error) {
				if (expectedToBe == 'PARSE_FAIL') {
					a = 'PARSE_FAIL'
				} else {
					print('unitTest error ttf: ' + testName + '  ' + a.error + '\n')	
					if (outputOnFail) { print('\n' + (outputOnFail)) }

					failedCount = failedCount + 1;
					return nil
				}
			} else {
				try {
					a = self.eval(dnativeText)
				} catch(e) {
					a = { error: 'js-compile error: '+e }
				}
				if(!a.error) {
					try {
						a = { ret: a() }
					} catch(e) {
						a = { error: 'js-call error: '+e }
					}
				}

				if (a.error) {
					print('unitTest error exe: ' + testName + '  ' + a.error + '\n\n' + '\n\n' + codeAsText + '\n')	
					if (outputOnFail) { print('\n' + (outputOnFail)) }			
					failedCount = failedCount + 1
					return nil
				} else {
					a = a.ret
				}
			}
			if (a != expectedToBe) { 
				print(testName + ': result expected to be: \n' + expectedToBe  + ' but was: \n' + a + '\ndnative : ' + dnativeText + '\n\n')
				if (outputOnFail) { print('\n' + (outputOnFail)) }			
				failedCount = failedCount + 1
			} else {
				successfullCount = successfullCount + 1
			}

		}

		return {
			run:runtest,
			report:function() {
				print('' + successfullCount + ' passed')
				if (failedCount != 0) {
					print('' + failedCount + ' failed')
				}				
			},
		}
	}

	var test = createDSTester()
	var nil = undefined

	if(testExceptions) {
		test.run('TestBrace',     '}',   'PARSE_FAIL')
		test.run('TestAccess',    'undefined_access',   'PARSE_FAIL')
	}
	test.run('Test00',        'a = 1+2*3 == 30 + 10; a', false)
	test.run('Test0',         '1-2*2', -3)
	test.run('Test1',         '1 -2*(2+ 1*3) * 23 +2 -3*3', -236)
	test.run('Test2',         'a = 10; a = a * 2; a + 1', 21)
	test.run('Test2b',        'a = 10; if(a == 5) { return }     a', 10)
	test.run('Test2c',        'a = 10; if(a == 5) { return 2 }   a', 10)
	test.run('Test2d',        'a = 10; if(a == 5) { return 2; }  a', 10)
			//test.run('Test2e',        'a = 10; if(a == 5) { return ; } a', 10)                        // FIX! this should be ok!
			//test.run('Test2f',        'a = 10; if(a == 5) { return ; lax = 1} a', 'PARSE_FAIL')       // FIX! code after return is not ok!
			//test.run('Test2g',        'a = 10; if(a == 5) { return 2; lax = 1} a', 'PARSE_FAIL')		// FIX! code after return is not ok!
	test.run('Test2h',        'a = 10; if (a == 5 and a==3) or\n a == 10 or\n a == 20 { return 2 } a', 2) 
	test.run('Test3',         'a = 10; a = 20 + a ; a', 30)
	test.run('Test5',         'a = 10; a = 1 + a; a', 11)
	test.run('Test6',         'a = 10; if (a == 10) { beer=2 } a = a + 1; beer', 2)  // should this really work ?
	test.run('Test7a',        'xxx = func { 34 } ; xxx() + 1', 35)
	test.run('Test7b',        'xxx = func { return 34 } ; xxx() + 1', 35)
	test.run('Test8',         'yyy = func x,y,z { return x * y + z - 1 }; yyy(2,3,4)', 9)
	test.run('Test9',         'while not 4{ xx = 3}', nil)
	test.run('TestIf1',       'if -2 { bb=2;aa=23+2*3 } else if bb == 4 { bb=33} else { bb = 3 }',  nil)
	if(testExceptions) {
		test.run('TestIf2',       'if -2 { bb=2;aa=23+2*3 } else if bb == 4 { bb=33} else { bb = 3 } else {}',  'PARSE_FAIL')
		test.run('TestIf3',       'if -2 { bb=2;aa=23+2*3 } elseif bb == 4 { }',  'PARSE_FAIL')
	}
	test.run('TestIf4',       'a = 1 ; foo(a+2*10) if false or false ; a',  1)
	test.run('TestIf5',       'a = 1   ; a    = 4 if true ; a   ',  4)
	test.run('TestIf6',       'a = [1] ; a[0] = 4 if true ; a[0]',  4)
	test.run('TestIf7',       "a = 1 ;\n a = a + 2 if a != 3 ; nil",  nil)
	test.run('TestIf8',       "a = 1 ;\n a = a + 2 if a != 3",  nil)
			// test.run('TestIf9',       "(func a { a() if a }) ; nil",  nil)
	test.run('TestIf10',       "curPath = '' ;\n curPath = curPath..'/' if curPath != '' ; nil",  nil)
	test.run('TestStringLit', 'xx = "si\\"ll\'"; zz=\'"Glass"\\\'"\'', nil)
	test.run('Test12',        'aa = 1; xx = [4,10,[[22]],aa*202+(32)]; xx[2][0][0]', 22)
	test.run('Test13',        'xx = {x = 2, y = {xx=2,list=[22,2,3]}} ; xx["x"]', 2)
	test.run('Test13b',       'xx = {\' x\' = 2, " y " = {xx=2,list=[22,2,3]}} ; xx[" x"]', 2)
	test.run('Test13c',       'xx = {     +boolFlag, r=4} ; xx.boolFlag', true)
	test.run('Test13d',       'xx = {s=3, -boolFlag     } ; xx.boolFlag', false)
	test.run('Test14',        'f = func x,y { return [[1-x+y],4,5,43,3] } ; ret = f(2,1,4,"dd"); ret[2]', 5)
	test.run('Test15',        'a=[[6]]; a[0][0] = 2; a[0][0]', 2)
	test.run('Test16',        'a=func x,y { return [[6]] }(); a[0][0] = 2; a[0][0]', 2)

	test.run('Test17',        'emFu = func { } ; emFu()', nil)
	test.run('Test18',        'fuFu = func { xxx = func { return 34 } ; xxx() + 1 } ; fuFu()', 35)
	test.run('Test19',        'emFu2 = func { ; } ; emFu2()', nil)
	test.run('Test20',        'ifFu = func { if(nil) { emFu = 1 } } ; ifFu()', nil)
	test.run('Test21',        'elFu = func { if(nil) { emFu = 1 } else { emFu = 2 } } ; elFu()', nil)
	test.run('Test22',        'asFu = func { a = 1+2*3 == 30 + 10; a } ; asFu()', false)

	test.run('TestFor',        'r = 10; for i *  3 { r = r + i } ; r', 13) 
	test.run('TestFor2',       'r = 10; for i * -3 { r = r + i } ; r', 10) 
	test.run('TestFor3',       'r = 10; for i * 4, -2 { r = r + i } ; r', 8) 
	test.run('TestFor3',       'r = 10; for * 5 { r = r + 1 } ; r', 15) 
	test.run('TestFor4',       'r = 10; for * 3 { for * 3 { r = r + 1 }} ; r', 19) 

	//test.run('TestForV',       'r = 1; for v    in {a=2, b=3} { r = r + v     } ; r', 6)
	//test.run('TestForKV',      't = 1; for k, v in {a=2, b=3} { t = t + v     } ; t', 6)
	//test.run('TestForV2',      'r = 1; for v    in [2,3]      { r = r + v     } ; r', 6)
	//test.run('TestForKV2',     't = 1; for k, v in [2,3]      { t = t + k + v } ; t', 7)
	//test.run('TestForStep',    'sum = 0 ; t = ""; for k = 0, 10, 2 { sum = sum + 1; t = t .. k } t .. sum', '02468106')

			//  test.run('TestForStep2',   'sum = 0 ; t = ""; for k = 0,-10,-2 { sum = sum + 1; t = t .. k } t .. sum', '0-2-4-6-8-106')  // not implemented in any sensible way yet
			                                // would be nice if directioncheck could be skipped (for compile-time-constant step case)
			                                 // solve non-compile-time-constant step by always iterating forward, and then multiply with sign inside loop
			                                                                          
			//  test.run('TestForK2',      'i = 5; for k in {a=2, b=3}   { break; i = 10 } ; i', 5)
			//  test.run('TestForKV2',     'i = 5; for k,v in {a=2, b=3} { break; i = 10 } ; i', 5)
			//  test.run('TestForStep2',   'i = 5; for k = 0,10          { break; i = 10 } ; i', 5)
			//  test.run('TestForK3',      'i = 5; for k in {a=2, b=3}   { continue; i = 10 } ; i', 5)
			//  test.run('TestForKV3',     'i = 5; for k,v in {a=2, b=3} { continue; i = 10 } ; i', 5)
			//  test.run('TestForStep3',   'i = 5; for k = 0,10          { continue; i = 10 } ; i', 5)
			//  test.run('TestForK3',      'i = 5; for k in {a=2, b=3}   { return; i = 10 } ; i', 5)
			//  test.run('TestForKV3',     'i = 5; for k,v in {a=2, b=3} { return; i = 10 } ; i', 5)
			//  test.run('TestForStep3',   'i = 5; for k = 0,10          { return; i = 10 } ; i', 5)
	test.run('TestComment1a',  '// d\n', nil)
	test.run('TestComment1b',  '// d', nil)
	test.run('TestComment2',   'test = [2,4,6,7,8]; // single line\n test[/* multi \nline */ 2]', 6)
	//test.run('TestComment3',   'test = [2,4,6,7,8]; // single line\n test[/* multi \nline * / 2]', 6)  // FIX! this breaks the parser, missing end of comment not detected?
	test.run('Test21',         '6 or nil', 6)
	test.run('Test22',         '{} ; nil', nil)
	test.run('Test23access',   'xx = [22,33]; xx[0 + 1 and false or 4 / 2   and  func { 4 }() - 3]', 33)
	//test.run('NilIteration',   't = {a=2, b=3} ; for k, v in t { t[k] = nil } ; n = 0 ; for k, v in t { n = n + 1 } ; n', 0)  // forkv should never iterate nil for tables
	test.run('skipCommaArray1','t = [2\n3] ; t[1]', 3)
	test.run('skipCommaArray2','t = [2,\n3] ; t[1]', 3)
	test.run('skipCommaArray3','t = [2\n,3] ; t[1]', 3)
	test.run('skipCommaArray4','t = [\n2\n3\n] ; t[1]', 3)
	test.run('skipCommaTable1','t = {a=2\nb=3} ; t.b', 3)
	test.run('skipCommaTable2','t = {a=2,\nb=3} ; t.b', 3)
	test.run('skipCommaTable3','t = {a=2\n,b=3} ; t.b', 3)
	test.run('skipCommaTable4','t = {\na=2\nb=3\n} ; t.b', 3)
	//test.run('skipCommaFunc1', 't = [] ; push(t\n3) ; t[0]', 3)
	//test.run('skipCommaFunc2', 't = [] ; push(t,\n3) ; t[0]', 3)
	//test.run('skipCommaFunc3', 't = [] ; push(t\n,3) ; t[0]', 3)
	//test.run('skipCommaFunc4', 't = [] ; push(\nt\n3\n) ; t[0]', 3)

			//  test.run('classnew', "c = class { expose hello = func { 'world' }   } ; instance = new c; instance.hello()", 'world')   this should work
	test.run('classnew', "c = class { expose hello = func { 'world' } ; } ; instance = new c; instance.hello()", 'world')
	test.run('classnew', "c = class { expose hello = func { 'world' } ; } ; instance = new c(); instance.hello()", 'world')
	test.run('classnew', "c = class { expose hello = func { 'world' } ; } ; instance = new c(2); instance.hello()", 'world')

	if(testExceptions) {
		test.run('DoubleQuote', "xxx = 'hej''san'; 4", 'PARSE_FAIL') 							// this should not pass through the parserContext.parse() without error!!!
	}

			//test.run('reach', 'if (true) { reach=1 } ; reach', 'PARSE_FAIL')	// this should give parsing error,  all scopes need nameSpaceBlockBegin/End for Lua compatibility
	test.report()

})()
