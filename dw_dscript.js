
// Dim World Environment, ALPHA Version
// Martin 'teadrinker' Eklund, 2012-2015
// http://teadrinker.net

/*




RAMDOM NOTES:

 * support a more relaxed forms of code-block brackets (or bad idea?):  
   if a { b() }  // current syntax
   if a: b()     // single line,               ':' ... '\n'
   if a          // whitespace indent based,  validExpressionEnd..'\n'..while(moreThanThisLineIndent) { ... '\n' } 
	 b()

Issues:
 * defining recursive functions need to be done in two steps (just set to nil first to create in namespace)
 * simple forward declaration is not possible, you have to assign to something (rare problem)

 * continue / break does not work for syntax [TestFor*2, TestFor*3]
	for k,v in obj       { if k == 'sill' { break } }
	forKV(obj, func k, v { if k == 'sill' { return 'break' } })  // workaround

 * auto-global-by-naming (like gContext, gIO):
	currently, you still have to set them to nil, otherwise it breaks the compiled build
	Non-compiled version should also complain if missing! 

 * Parser fails if semicolon after return [Test2e]
 * Parser accepts code after return (will fail in lua) [Test2f, Test2g]
 * cannot use reversed if form "do() if doIt" as last statement (maybe related to auto-return impl)

 * assignment is not allowed inside expressions (by design, won't be fixed)



C++/GLSL notes

 * semicolon issues:
  - missing ; on last row (need linefeed for semicolon insertion)
  - missing ; before block-end on  "for i * len {}"
  - missing ; before block-end on if/else if

 * "for i = 1,10,0.25" always uses int as type for looping variable  (also "for * 10")

 * how to handle float arrays?   try to align with js floatArray32 
   create a c++ wrapped buffer, with overloaded [] 

   class floatAr {
	private: std::shared_ptr<std::vector<float>> fArray;
	private: float* fLocalPtr; 
	public: floatAr(const floatAr& that) : fArray(that.fArray) {}
	public: inline operator [] (int index) { return fLocalPtr[index]; }   
   };
   
 * support 1.f to denote floats ?

   note that you can already do global or local override using:   #{push useFloat #}  /  #{pop useFloat #}

   js has some kind of new wrapper for floats:

	 Math.fround(1)  (only firefox so far...)

	 So I guess Math.fround(a + b) will both make sure returning value is float32 trunced,
	 and enable optimization if used in a pure float32 context...

  * type inference float vs double problem

	toFloat = func float x { x }

	a = 1

	b = toFloat(2) 

	#{ push useFloat #}
	c = 3 
	#{ pop useFloat #}

	d = c + 1
	e = 1 + c  // float vs double problem



*/

(function() {
'use strict';

// ------------------------------- TOKENIZE ------------------------------- 

var parseUntil = function(p,func) {
	var r,i,len=p[0].length;
	for(i=p[1];i<len;i++) {
		if(func(p[0].charCodeAt(i)))
			break;
	}
	r=p[0].substring(p[1],i);
	p[1]=i;
	return r;
}

var isWhite = function(t)			{ return t==32 || t==10 || t==13 || t==9; }

//var isSingleCharToken = function(t)	{ return t==32 || t==10 || t==13 || t==9        || t==40 || t==41 || t==91 || t==93 || t==123 || t==125 || t==60 || t==62 || t==34 || t==39; } // space \n \r \t ( ) [ ] { } < > " ' 
var isDigit = function(t)			{ return t>=48 && t<=57; } // - 0-9
//var isDigitOrMinus = function(t)	{ return t==45 || t>=48 && t<=57; } // - 0-9
var isSymbol = function(t)		{ return isDigit(t) || t>=65 && t<=90 || t>=97 && t<=122 || t==95; } // 0-9 A-Z a-z _

var parseSingleChar = function(p)		{ p[1]++; return p[0][p[1]-1]; } 
var parseNumber = function(p)		{
	var r=''
	// Will the special case of minus parsing just before a number be a problem??
	//
	//  if parsing tables of numbers, getting the minus together with the number is great
	//  however in a language, -10 will be different from - 10, which seems to be just white space change
	//
	//  update, this turns into horror in the parser, precedence might move this one way or the other, 
	//  can't be burned into the literal

	if(p[0].charCodeAt(p[1])==45) // -
		r += parseSingleChar(p)
	
	r += parseUntil(p,function(t){return !isDigit(t); }) 
	var	c=p[0].charCodeAt(p[1]), 
		c2=p[0].charCodeAt(p[1]+1) // might access outside
	if(c==46 && !(isDigit(c2) || c2==69 || c2==101))  // a dot that is not followed by 0-9 | e | E      "The clock was 12. All was dark", should not parse the . as a part of the number 
		return r
	if(c==46) {  // .
		r += parseSingleChar(p)
		r += parseUntil(p,function(t){return !isDigit(t); })
		c=p[0].charCodeAt(p[1]) 
	}
	if(c==69 || c==101) {  //  e | E 
		c2=p[0].charCodeAt(p[1]+1)
		r += parseSingleChar(p) 
		if(c2==43 || c2==45)  // (+ | -)
			r += parseSingleChar(p) 
		r += parseUntil(p,function(t){return !isDigit(t); })
	}
	return r
} 
var parseSymbol = function(p)		{ return parseUntil(p,function(t){return !isSymbol(t); }); } 
//var parseNonSymbol = function(p)	{ return parseUntil(p,function(t){return isWhite(t) || isSymbol(t) || isSingleCharToken(t); }); } 

//var parseToTokensi = function(p) { p.join(''); }
var parseToTokens = function(p) {
	var c, r=new Array, len=p[0].length;
	while(p[1] < len) {													var i=p[1];
		c = p[0].charCodeAt(p[1]);
//		if (isDigitOrMinus(c))		r.push(parseNumber(p));
		if (isDigit(c))				r.push(parseNumber(p));
		else if (isSymbol(c))		r.push(parseSymbol(p));
		else						r.push(parseSingleChar(p));  		if(p[1]==i) { throw ("parseToTokens() stuck!"); return r; }
	}
	return r;
} 








/*
	var tokens = [
		// End of source.
		"END",

		// Operators and punctuators.  Some pair-wise order matters, e.g. (+, -)
		// and (UNARY_PLUS, UNARY_MINUS).
		"\n", ";",
		",",
		"=",
		"?", ":", "CONDITIONAL",
		"||",
		"&&",
		"|",
		"^",
		"&",
		"==", "!=", "===", "!==",
		"<", "<=", ">=", ">",
		"<<", ">>", ">>>",
		"+", "-",
		"*", "/", "%",
		"!", "~", "UNARY_PLUS", "UNARY_MINUS",
		"++", "--",
		".",
		"[", "]",
		"{", "}",
		"(", ")",

		// Nonterminal tree node type codes.
		"SCRIPT", "BLOCK", "LABEL", "FOR_IN", "CALL", "NEW_WITH_ARGS", "INDEX",
		"ARRAY_INIT", "OBJECT_INIT", "PROPERTY_INIT", "GETTER", "SETTER",
		"GROUP", "LIST", "LET_BLOCK", "ARRAY_COMP", "GENERATOR", "COMP_TAIL",

		// Terminals.
		"IDENTIFIER", "NUMBER", "STRING", "REGEXP",

		// Keywords.
		"break",
		"case", "catch", "const", "continue",
		"debugger", "default", "delete", "do",
		"else", "export",
		"false", "finally", "for", "function",
		"if", "import", "in", "instanceof",
		"let", "module",
		"new", "null",
		"return",
		"switch",
		"this", "throw", "true", "try", "typeof",
		"var", "void",
		"yield",
		"while", "with",
	];

	var statementStartTokens = [
		"break",
		"const", "continue",
		"debugger", "do",
		"for",
		"if",
		"return",
		"switch",
		"throw", "try",
		"var",
		"yield",
		"while", "with",
	];

	// Whitespace characters (see ECMA-262 7.2)
	var whitespaceChars = [
		// normal whitespace:
		"\u0009", "\u000B", "\u000C", "\u0020", "\u00A0", "\uFEFF", 

		// high-Unicode whitespace:
		"\u1680", "\u180E",
		"\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006",
		"\u2007", "\u2008", "\u2009", "\u200A",
		"\u202F", "\u205F", "\u3000"
	];
*/


var prepareTokenArrayForScriptParsing = function(ar) {
	var t, t2, r = [], i
	for(i=0; i<ar.length - 1; i++) {
		t  = ar[i]
		t2 = ar[i+1]
		if     (t == '/' && t2 == '*' ) { r.push('/*'); i++ }
		else if(t == '*' && t2 == '/' ) { r.push('*/'); i++ }
		else if(t == '/' && t2 == '/' ) { r.push('//'); i++ }
		else if(t == '!' && t2 == '=' ) { r.push('!='); i++ }
		else if(t == '=' && t2 == '=' ) { r.push('=='); i++ }
		else if(t == '>' && t2 == '=' ) { r.push('>='); i++ }
		else if(t == '<' && t2 == '=' ) { r.push('<='); i++ }
		else if(t == '.' && t2 == '.' ) { r.push('..'); i++ }
		else if(t == '#' && t2 == '{' ) { r.push('#{'); i++ }
		else if(t == '#' && t2 == '}' ) { r.push('#}'); i++ }
		else if(t == '?' && t2 == ':' ) { r.push('?:'); i++ }
//		else if(t == '<' && t2 == '<' ) { r.push('<<'); i++ }
//		else if(t == '>' && t2 == '>' ) { r.push('>>'); i++ }
		else //if(t != ' ' && t != '\t' )
			r.push(t)
	}
	t = ar[i]
	//if(t != ' ' && t != '\t' )
		r.push(t)
	return r
}

/*
var deepcopy = function(srcInstance) {
  if(typeof(srcInstance) != 'object' || srcInstance == null)
	return srcInstance;
  var newInstance = srcInstance.constructor();
  for(var i in srcInstance)
	newInstance[i] = deepcopy(srcInstance[i]);
  return newInstance;
}
*/
var extend = function(d) {
	for(var a = 1 ; a < arguments.length; a++) {
		var o = arguments[a]
		for(var i in o) {
			d[i] = o[i]
		}
	}
	return d
}

var doTrace = 0
var times = 0
var traceStr = ''
var traceReset = function(s) { traceStr = '' }
var trace = function(s) { if(doTrace==2) alert(s); if(doTrace) { dw_g_trace(s.toString()); traceStr += s + '\n'}  }
//var tthrow = function(s) { out(' !!! '+s); }
var tthrow = function(s) { debugger ; throw(s); }
var teval = function(s) { try{ return eval(s); } catch(e) { return e} }


var createTokIterator = function(ar) { // token iterator and parser of whitespace and comments
	var ws
	var pos					= 0
	var wsp					= 0
	var curLine				= 0
	var parsedNewLine		= false
	var arrayOfTokens		= prepareTokenArrayForScriptParsing(ar)
	var metaComments		= []
	var commentBackend		= ['//', '/*', '*/']

	var injection			
	var injPos				= 0

	var stringToTok			= function( s)	{ return s }
	var resetPos			= function() { pos = 0; curLine = 0 }
	var setCommentBackend	= function( c)	{ commentBackend = c }
//		get					= function()	{ return arrayOfTokens[pos++] }
	var parse				= function()	{ 
		if(ws == undefined) {
			var startOfLineComment = '//'
			var startOfComment = '/*'
			var endOfComment = '*/'
			ws = ''
			while( arrayOfTokens[pos] ) {
				if(arrayOfTokens[pos] == startOfLineComment) {
					var posAndEnd = [pos,0]
					ws += commentBackend[0]
					pos += 1
					while( arrayOfTokens[pos] && arrayOfTokens[pos] != '\n' ) {
						ws += arrayOfTokens[pos]
						pos += 1
					}			
					if(arrayOfTokens[pos]) {
						ws += '\n'
						curLine++
						parsedNewLine = true
						posAndEnd[1] = pos
						metaComments.push(posAndEnd)
						pos += 1
					}
				} else if(arrayOfTokens[pos] == startOfComment) {
					var posAndEnd = [pos,0]
					ws += commentBackend[1]
					pos += 1
					while( arrayOfTokens[pos] && arrayOfTokens[pos] != endOfComment ) {
						if(arrayOfTokens[pos] == '\n') { curLine++ }
						ws += arrayOfTokens[pos]
						pos += 1
					}
					ws += commentBackend[2]
					pos += 1
					posAndEnd[1] = pos
					metaComments.push(posAndEnd)
				} else if(  isWhite(arrayOfTokens[pos].charCodeAt(0))  ) {
					if(arrayOfTokens[pos] == '\n') { curLine++ ; parsedNewLine = true }
					ws += arrayOfTokens[pos]
					pos += 1
				} else {
					break;
				}
			}				
		}
	}
	var injectTokens        = function(t)	 	{ if(injection) { injection.splice(injPos); } else { injection = t; injPos = 0 } }
	var getStringForError	= function()		{ var r = ''; for(var i = Math.max(0,pos - 20); i < pos + 1;  i++) { if(arrayOfTokens[i]) r += arrayOfTokens[i] } return r }
	var peekLineFeed		= function()		{ if(injection) return false;             parse() ; return parsedNewLine }
	var peek				= function()		{ if(injection) return injection[injPos]; parse() ; return arrayOfTokens[pos] }
	var peekWS				= function()		{ if(injection) return '';                parse() ; return ws }
	//var rawPeek				= function(offset)  {           return arrayOfTokens[pos + offset] }
	var proceed				= function(onlyWS)	{ if(injection) { if(!onlyWS) injPos++; if(injPos<injection.length) { return '' } else { injection = undefined; return '' } } 
													parse() ; if(!onlyWS) { pos += 1; parsedNewLine = false } wsp = pos ; var curws = ws; ws = undefined; return curws }
	var simpleGet			= function()		{ if(injection) { var tmp = injection[injPos]; injPos++; if(injPos<injection.length) { return tmp } else { injection = undefined } } 
													if(arrayOfTokens[pos] == '\n') { curLine++ } ; pos += 1; wsp = pos ; return arrayOfTokens[pos - 1] }

	var parseQuotedString   = function()		{
		var _backslash = '\\'
		var endToken = simpleGet()
		var vt = endToken
		var t
		while(true) {
			t = simpleGet()
			if(t == undefined) {
				tthrow('Missing end of quote '+endToken)
			} else if(t === _backslash) {	// here we might want to do some better escaping (now just assuming lua and js are the same)
				vt += t + simpleGet()
			} else if(t === endToken) {
				break
			} else {
				vt += t
			}
		}
		vt += endToken
		return vt
	}
	return {
		peek				: peek,
		peekWS				: peekWS,
		proceed				: proceed,
		peekLineFeed		: peekLineFeed,
		injectTokens		: injectTokens,
		simpleGet			: simpleGet,
		parseQuotedString	: parseQuotedString,
		resetPos			: resetPos,
		stringToTok			: stringToTok,
		setCommentBackend	: setCommentBackend,
		getStringForError	: getStringForError,
//		getTokenPos			: function()  { return pos },
		getTokenPos			: function()  { return wsp },
		setTokenPos			: function(p) { pos = p ; wsp = pos ; ws = undefined },
		getLine				: function()  { return curLine },
		getCommentsRanges	: function()  { return metaComments },
		getTokenRange		: function(p1, p2) { return arrayOfTokens.slice(p1, p2).join('') }		
	}
}



var dbgfb = '__fb'
var dbgfe = '__fe'
var dbgl = '__l'

var stringReplaceChar = function(str, index, newChar) {
  return str.slice(0, index) + newChar + str.slice(index + 1);
}

	// http://www.javascriptkit.com/jsref/precedence_operators.shtml
	
var createParserContext = function(config) {
		
	var it	
	var prefix	
	var parse
	var parseInternal
	
	var tthrow = function(s) { if(doTrace) out(s); throw traceStr + s + "  " + it.getStringForError() }
	
	var nameSpace = {}
	var backends  = {}
	var backend	  // current backend
	var opt       = false		

	// improve definitions?
	// _forkv:["", false, "forK(", ", function(", true, "){ ",   "var ",  "})"],  
	// {pre:"for(var ", insertMainVarAfterPre:true, _in_:" in ", blockstart:") {"  ...    usePrefix:true}
	//
	// _forkv impl could need improvement for better lua and php impl since they have native key/value iteration


	var backendBase = {
		deps : [],
		depsA : {},
	}

	backends.js = extend({}, backendBase, {
		trackTypes   		  : true,	
		llTypes : { number : 'number', string : 'string', bool : 'bool'},
		llTypeNativeOpPassAll: {
			'number' : true,
			'string' : true,
			'bool' : true,
		},
		llTypeNativeOp: { },
		hardTypes : {
				complex : { template : ['[','0.0',',','0.0',']'] },
				vec2    : { template : ['[','0.0',',','0.0',']'] },
				vec3    : { template : ['[','0.0',',','0.0',',','0.0',']'] },
				vec4    : { template : ['[','0.0',',','0.0',',','0.0',',','0.0',']'] },
		},					

//					semicolonInsertion  : true,
		closureAsClass : true,
		_this : '_This',

		_new:["!NAME!(", ")"],
		_symbolWrap:["", ""],
		_parseWrap:["(() => {", "\n})"],  //  \n is needed because expression can end with line comment
	
		_if:["if(", ") {"], 
		_elseif:["} else if(", ") {"], 
		_else:"} else {", 
		_endif:"} ",
							
		_while:["while(", ") {", "} "],
		
		_forkv:["", false, "forK(", ", (", true, ") => { ",   "var ",  "})"],  
		_forv:"forV(",  

		_forstep:["for(var ", ", __e_", ", __s_", "; ",       "__e_", ";) { ", " + __s_", "} "],

		_func:["((", ") => {", " return ", "})"],
		
		or:" || ",
		and:" && ",
		
		andif:" ? ",
		orelse:" : ",

		concat:" + ",
		
		notequals:" !== ",
		equals:" === ",
		not:" ! ",

//		_listsize:["", ".length"],					
		_listliteral: ["[]", "[", "]"],  
		_tableliteral:["{", " : ", "}"], 
		
		_nil:"undefined",	
		_localvar : "var ",
		
		_comments : ["//", "/*", "*/"],
		
		_true : 'true',
		_false : 'false',
		})

/*

 % should translate to mod on glsl but not js! 

T radians(T degrees) degrees to radians
T degrees(T radians) radians to degrees
T atan(T y, T x) 
T exp2(T x) 2x
T log2(T x) log2

T mix(T x, T y, T a)
T step(T edge, T x)
T smoothstep(float edge0,

float length(T x) length of vector
float distance(T p0, T p1) distance between points
float dot(T x, T y) dot product
vec3 cross(vec3 x, vec3 y) cross product
T normalize(T x) normalize vector to length 1
T faceforward(T N, T I, T Nref) returns N if dot(Nref, I) < 0, else -N
T reflect(T I, T N) reflection direction I - 2 * dot(N,I) * N
T refract(T I, T N, float eta) refraction vector

bvec lessThan(T x, T y) x < y
bvec lessThanEqual(T x, T y) x <= y
bvec greaterThan(T x, T y) x > y
bvec greaterThanEqual(T x, T y) x >= y
bvec equal(T x, T y)
bvec equal(bvec x, bvec y)
x == y
bvec notEqual(T x, T y)
bvec notEqual(bvec x, bvec y)
x!= y
bool any(bvec x) true if any component of x is true
bool all(bvec x) true if all components of x are true
bvec not(bvec x) logical complement of x

*/
	var mapToObj = function(array, accessToken) { return array.reduce(function(a,b) { a[b[accessToken]] = b; return a; }, {}) }

	backends.js.deps = [
		{ name : 'sign'                , retType : 'number', outCode : "self.###sign   = Math.sign" },
		{ name : 'abs'                 , retType : 'number', outCode : "self.###abs    = Math.abs" },
		{ name : 'sin'                 , retType : 'number', outCode : "self.###sin    = Math.sin" },
		{ name : 'cos'                 , retType : 'number', outCode : "self.###cos    = Math.cos" },
		{ name : 'asin'                , retType : 'number', outCode : "self.###asin   = Math.asin" },
		{ name : 'acos'                , retType : 'number', outCode : "self.###acos   = Math.acos" },
		{ name : 'tan'                 , retType : 'number', outCode : "self.###tan    = Math.tan" },
		{ name : 'atan'                , retType : 'number', outCode : "self.###atan   = Math.atan" },
		{ name : 'atan2'               , retType : 'number', outCode : "self.###atan2  = Math.atan2" },
		{ name : 'pow'                 , retType : 'number', outCode : "self.###pow    = Math.pow" },
		{ name : 'sqrt'                , retType : 'number', outCode : "self.###sqrt   = Math.sqrt" },
		{ name : 'log'                 , retType : 'number', outCode : "self.###log    = Math.log" },
		{ name : 'exp'                 , retType : 'number', outCode : "self.###exp    = Math.exp" },
		{ name : 'floor'               , retType : 'number', outCode : "self.###floor  = Math.floor" },
		{ name : 'ceil'                , retType : 'number', outCode : "self.###ceil   = Math.ceil"  },
		{ name : 'random'              , retType : 'number', outCode : "self.###random = Math.random"},
		{ name : 'fract'               , retType : 'number', outCode : "self.###fract  = function(x)  { return x - Math.floor(x) }" },	
		{ name : 'toJSON'              , retType : 'string', outCode : "self.###toJSON = JSON.stringify" },
		{ name : 'fromJSON'            , retType : undefined,outCode : "self.###fromJSON  = JSON.parse" },
		{ name : 'min'                 , retType : 'number', outCode : 'self.###min = function(a, b) { return a < b ? a : b }' },
		{ name : 'max'                 , retType : 'number', outCode : 'self.###max = function(a, b) { return a > b ? a : b }' },
		{ name : 'clamp'               , retType : 'number', outCode : 'self.###clamp = function(v,mi,ma) { if(mi==undefined) mi=0; if(ma==undefined) ma=1; return (v<mi)?(mi):(  (v>ma)?ma:v  )}' },		
		{ name : 'complex__inv'        , retType : 'complex', outCode : "self.###complex__inv         = function(a)   { var m = 1/(a[0]*a[0]+a[1]*a[1]);  return  [a[0]*m,  - a[1]*m]  }",                                     },
		{ name : 'complex__exp'        , retType : 'complex', outCode : "self.###complex__exp         = function(a)   { var r = ###exp(a[0]);  return  [r*###cos(a[1]), r*###sin(a[1])] }", deps : ["exp", "sin", "cos"],                        },
		{ name : 'complex__log'        , retType : 'complex', outCode : "self.###complex__log         = function(a)   { return [###log(###sqrt(a[0]*a[0]+a[1]*a[1])), ###atan2(a[1], a[0])]}", deps : ["log", "sqrt", "atan2"],              },
		{ name : 'complex_complex__add', retType : 'complex', outCode : "self.###complex_complex__add = function(a,b) { return [a[0]+b[0],  a[1]+b[1]]} ",                                     },
		{ name : 'complex_complex__mul', retType : 'complex', outCode : "self.###complex_complex__mul = function(a,b) { return [a[0]*b[0]-a[1]*b[1],  a[0]*b[1]+a[1]*b[0]]} ",                                     },
		{ name : 'complex_complex__sub', retType : 'complex', outCode : "self.###complex_complex__sub = function(a,b) { return [a[0]-b[0],  a[1]-b[1]]} ",                                     },
		{ name : 'complex_complex__div', retType : 'complex', outCode : "self.###complex_complex__div = function(a,b) { return ###complex_complex__mul(a,  ###complex__inv(b))} ", deps : ["complex_complex__mul","complex__inv"], },
		{ name : 'complex_complex__pow', retType : 'complex', outCode : "self.###complex_complex__pow = function(a,b) { return ###complex__exp(###complex_complex__mul(###complex__log(a), b))} ", deps : ["complex__exp","complex_complex__mul","complex__log"],                                    },
		{ name : 'number_to_complex'   , retType : 'complex', outCode : "self.###number_to_complex    = function(a)   { return [a, 0] } " ,                                     },
		{ name : 'double_to_complex'   , retType : 'complex', outCode : "self.###double_to_complex    = function(a)   { return [a, 0] } ",                                     },
		{ name : 'float_to_complex'    , retType : 'complex', outCode : "self.###float_to_complex     = function(a)   { return [a, 0] } ",                                     },
	]
	backends.js.depsA = mapToObj(backends.js.deps, 'name')


	var mustBeImplByBackend = ['exp','sqrt','sin','cos']
	var internalLib = mustBeImplByBackend.map(function(name) { 
		return { name : name, code : 'api '+name+' = func x { 0 }'} 
	//	return { name : name, code : 'api '+name+' = func x { throw("missing impl of '+name+'"); return 0 }'} // hehe no throw does not exist yet 
	})


// GLSL complex_complex__mul fails cos it thinks it needs complex_complex__mul!   fixed??

	internalLib = internalLib.concat([
		{ name : 'abs',               	code : 'api abs  = func x { x<0?-x:x }' },
		{ name : 'sign',                code : 'api sign = func x { x>0?1:(x<0?-1:0) }' },
		{ name : 'cosh',                code : 'api cosh = func x { exp(x)+exp(-x)*0.5 }' },
		{ name : 'sinh',                code : 'api sinh = func x { exp(x)-exp(-x)*0.5 }' },
		{ name : 'complex_complex__mul',code : "api complex_complex__mul = func complex a, complex b { complex(a[0]*b[0]-a[1]*b[1],  a[0]*b[1]+a[1]*b[0]) } ",                                     },
		{ name : 'complex__sqr',        code : 'api complex__sqr = func complex a { a*a }' },
		{ name : 'complex__neg',        code : 'api complex__neg = func complex a { complex(-a[0], -a[1]) }' },
		{ name : 'complex__abs',        code : 'api complex__abs = func complex a { sqrt(a[0]*a[0] + a[1]*a[1]) }' },
		{ name : 'vec2__abs',           code : 'api vec2__abs = func complex a { sqrt(a[0]*a[0] + a[1]*a[1]) }' },
		{ name : 'vec3__abs',           code : 'api vec3__abs = func complex a { sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]) }' },
		{ name : 'vec4__abs',           code : 'api vec4__abs = func complex a { sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2] + a[3]*a[3]) }' },
		{ name : 'complex__sin',        code : 'api complex__sin = func complex a { complex(sin(a[0])*cosh(a[1]), cos(a[0])*sinh(a[1])) }' },
		{ name : 'complex__cos',        code : 'api complex__cos = func complex a { complex(cos(a[0])*cosh(a[1]), sin(a[0])*sinh(a[1])) }' },
		{ name : 'complex__conj',       code : 'api complex__conj = func complex a { complex(a[0], -a[1]) }' },
		{ name : 'inversesqrt',         code : 'api inversesqrt = func x { 1/sqrt(x) }' },
	])
	var internalLibA = mapToObj(internalLib, 'name')

  /*
#{ js return { random     : function()        { return Math.random()     } } #}   #####
#{ js return { floor      : function(x)       { return Math.floor(x)     } } #}   #####
#{ js return { fract      : function(x)       { return x - Math.floor(x) } } #}   #####

#{ js return { sin        : function(x)       { return Math.sin(x)       } } #} 


//#{ stdfunc sin js function(x) { return Math.sin(x) } #}
//#{ stdfunc sin c 
//    static float ###sin(float x) { return sinf(x); }  
//    static double ###sin(double x) { return sin(x); }  
//#}

#####
  
  
#{ js return { abs        : function(x)       { return Math.abs(x)       } } #}   #####
#{ js return { cos        : function(x)       { return Math.cos(x)       } } #}   #####
#{ js return { asin       : function(x)       { return Math.asin(x)      } } #}   #####
#{ js return { acos       : function(x)       { return Math.acos(x)      } } #}   #####
#{ js return { atan       : function(x)       { return Math.atan(x)      } } #}   #####
#{ js return { atan2      : function(y, x)    { return Math.atan2(y, x)  } } #}   #####
#{ js return { tan        : function(x)       { return Math.tan(x)       } } #}   #####
#{ js return { pow        : function(a, b)    { return Math.pow(a,b)     } } #}   #####
#{ js return { sqrt       : function(a, b)    { return Math.sqrt(a,b)    } } #}   #####
#{ js return { log        : function(a, b)    { return Math.log(a,b)     } } #}   #####
#{ js return { exp        : function(a, b)    { return Math.exp(a,b)     } } #}   #####

#{ js return { toJSON     : function(o)       { return JSON.stringify(o) } } #}   #####
#{ js return { fromJSON   : function(str)     { return JSON.parse(str
)   } } #}   #####
  
  */
  
  
//    complex_inv : { deps:["complex"],                         code: "complex complex_inv(complex a) { float m = 1.f/(a[0]*a[0]+a[1]*a[1]);  return a * vec2(m,-m);     }" },
 //   complex_exp : { deps:["complex", "sin", "cos"],           code: "complex complex_exp(complex a) { float r = exp(a[0]); return complex(r*cos(a[1]), r*sin(a[1]));   }" },
//    complex_log : { deps:["complex", "log", "sqrt", "atan2"], code: "complex complex_log(complex a) { return complex(log(sqrt(a[0]*a[0]+a[1]*a[1])),atan2(a[1],a[0])); }" },
//complex  complex_complex_mul (float a,float b ) {  return vec2(a[0.f]*b[0.f]-a[1.f]*b[1.f],  a[0.f]*b[1.f]+a[1.f]*b[0.f]);; } 
//complex_complex_div(a,b) = complex_complex_mul(a, complex_inv(b))
//complex_complex_pow(a,b) = complex_exp(complex_complex_mul(complex_log(a),b))
//complex  number_to_complex (float a ) {  return vec2(a, 0.);; } 
//complex  double_to_complex (float a ) {  return vec2(a, 0.);; } 
 // }	





	backends.lua = extend({}, backendBase, {
		closureAsClass : true,
	
		_new:["!NAME!(", ")"],
		_symbolWrap:["", ""],
		_parseWrap:["", ""],

		_if:[" if ", " then "], 
		_elseif:[" elseif ", " then "], 
		_else:" else ", 
		_endif:" end ",
									
		_while:[" while ", " do ", " end "],

//					_iter:["for ", " in __pairs(", ") do ", " end "], 

		_forkv:["for ", true,  " in pairs(", ") do ", false, "", "local ", " end "],

		_forstep:["local ",   "; local __e_", "; local __s_", "; while ", "__e_", " do ",  " + __s_", " end "],

		_func:[" (function(", ") ", " return ", " end) "],
		
		or:" or ",
		and:" and ",
		
		concat:" .. ",
		
		equals:" == ",
		notequals:" ~= ",
		not:" not ",
		
//		_listsize:["", ".__n"],					
		_listliteral:["{__n=0}", "{[0]=  ", "}", "  ,__n="],
		_tableliteral:["{", " = ", "}"],
							
		_nil:"nil",	
		_localvar : "local ",
		
		_comments : ["--", "--[[", "]]"],
		
		_true : 'true',
		_false : 'false',
		
	})
	 

// php and c++ will never be fully compatible since they do not support first class functions, and
// in order for php and c++ to be somewhat useful, even for a minimal snippet-scope level, we need:
// - types, c++ obviously, but also php needs special handling, use $ with all variables -but not functions
// - function conversion,  f = func a float, { a * 2 }  -->   <typeof return> f(float a) { return a * 2 }
// - function dependencies,  php need functions to declare all dependencies at after the function header 
// - semicolon insertion

		
	backends.php = extend({}, backendBase, {	
			// globals dependencies need to be defined for each function

		_new:["(new !NAME!(", "))"],
		_indexDot : ['["', '"]'],

		_symbolWrap:["$", ""],
		_parseWrap:["", ""],  //  \n is needed because expression can end with line comment
	
		_if:["if(", ") {"], 
		_elseif:["} else if(", ") {"], 
		_else:"} else {", 
		_endif:"} ",
							
		_while:["while(", ") {", "} "],

			_forkv:["", false, "foreach(", " as ", true, " => __notused){ ",   "",  "}"], 
			_forkv_dontUsePrefix:true,  

		_forstep:["for(", ", $__e_", ", $__s_", "; ",       "$__e_", ";) { ", " + $__s_", "} "], 

		_func:["function(", ") {", " return ", "} "],
		
		andif:" ? ",
		orelse:" : ",

		or:" || ",
		and:" && ",
		
		concat:" + ",
		
		notequals:" != ",
		equals:" == ",
		not:" ! ",

//		_listsize:["", ".length"],					
		_listliteral: ["[]", "[", "]"],  // before PHP 5.4, you need to use array() instead of []. 
		_tableliteral:["[", " => ", "]"], 
		
		_nil:"undefined",	
		_localvar : "",
		
		_comments : ["//", "/*", "*/"],
		
		_true : 'true',
		_false : 'false',						
	})






	backends.cpp = extend({}, backendBase, {

		llTypeNativeOpPassAll: {
			'float' : true,
			'double' : true,
			'string' : true,
			'bool' : true,
		},
		llTypeNativeOp: { },

		needToMoveFunctions   : true,
		notClassesAsObjects   : true,

		trackTypes   		  : true,
		usesCStyleTypeDefs    : true,

		semicolonInsertion    : true,
		needMemberDeclaration : true,
		funcNeedsTypes        : true,
		doubleQuoteForString  : true,
		dontParseGlobalScopeAsFunc : true,

		llTypes : { number : 'double', string : 'std::string', bool : 'bool'},

		_new:['std::shared_ptr<!NAME!_cppc>(new !NAME!_cppc(', '))'],
		_indexDot : ['->', ''],

		_symbolWrap:["", ""],
		_parseWrap:["", ""],  //  \n is needed because expression can end with line comment
	
		_if:["if(", ") {"], 
		_elseif:["} else if(", ") {"], 
		_else:"} else {", 
		_endif:"} ",
							
		_while:["while(", ") {", "} "],

		_forkv:["", false, "forK(", ", function(", true, "){ ",   "var ",  "})"], 

		_forstep:["for(int ", ", __e_", ", __s_", "; ",       "__e_", ";) { ", " + __s_", "} "],

		_func:[" !NAME! (",               ") {", " return ", "; } "],
		_class:["class !NAME!_cppc { public: !NAME!_cppc::!NAME!_cppc(",  ") {", " return ", "; }\n", 
				 "};\ntypedef std::shared_ptr<!NAME!_cppc> !NAME!;\n"],
		
		or:" || ",
		and:" && ",
		
		andif:" ? ",
		orelse:" : ",

		concat:" + ",
		
		notequals:" != ",
		equals:" == ",
		not:" ! ",

//		_listsize:["", ".length"],					
		_listliteral: ["[]", "[", "]"],  
		_tableliteral:["{", " : ", "}"], 
		
		_nil:"NULL",	
		_localvar : "void ",
		
		_comments : ["//", "/*", "*/"],
		
		_true : 'true',
		_false : 'false',

		floatSuffix : 'f',
		doubleSuffix : '',
	})






	////  GLSL  ////

	// NOTE: very unfinished!

	backends.glsl = extend({}, backends.cpp, {
		floatSuffix : '',
		doubleSuffix : 'lf',
	})

	backends.glsl.deps = [
		{ name : 'complex'             ,  dontAddToNameSpace:true,         code: "#define complex vec2" },
		{ name : 'complex__inv'        , retType : 'complex', deps : ["complex"],                                                          outCode: "complex ###complex__inv(complex a) { float m = 1.f/(a[0]*a[0]+a[1]*a[1]);  return a * vec2(m,-m);     }" },
		{ name : 'complex__exp'        , retType : 'complex', deps : ["complex", "sin", "cos"],                                            outCode: "complex ###complex__exp(complex a) { float r = exp(a[0]); return complex(r*cos(a[1]), r*sin(a[1]));   }" },
		{ name : 'complex__log'        , retType : 'complex', deps : ["complex", "log", "sqrt", "atan2"],                                  outCode: "complex ###complex__log(complex a) { return complex(log(sqrt(a[0]*a[0]+a[1]*a[1])),atan2(a[1],a[0])); }" },
		{ name : 'complex_complex__mul', retType : 'complex', deps : ["complex"],                                                          outCode: "complex ###complex_complex__mul (complex a,complex b ) {  return vec2(a[0.f]*b[0.f]-a[1.f]*b[1.f],  a[0.f]*b[1.f]+a[1.f]*b[0.f]);; }" },
		{ name : 'complex_complex__div', retType : 'complex', deps : ["complex", "complex_complex__mul", "complex__inv"],                  outCode: "complex ###complex_complex__div(complex a, complex b) { return complex_complex__mul(a, complex__inv(b))" },
		{ name : 'complex_complex__pow', retType : 'complex', deps : ["complex", "complex_complex__mul", "complex__exp", "complex__log"],  outCode: "complex ###complex_complex__pow(complex a, complex b) { return complex__exp(complex_complex__mul(complex__log(a),b))" },
		{ name : 'number_to_complex'   , retType : 'complex', deps : ["complex"],                                                          outCode: "complex ###number_to_complex (float a) { return vec2(a, 0.); } " },
		{ name : 'double_to_complex'   , retType : 'complex', deps : ["complex"],                                                          outCode: "complex ###double_to_complex (float a) { return vec2(a, 0.); } " },
		{ name : 'float_to_complex'    , retType : 'complex', deps : ["complex"],                                                          outCode: "complex ###float_to_complex  (float a) { return vec2(a, 0.); }" },  		
	]
	backends.glsl.depsA = mapToObj(backends.glsl.deps, 'name')

	backends.glsl.llTypes = { number : 'float', string : 'string', bool : 'bool'}

	backends.glsl.hardTypes = {
		complex : {
			template : ['vec2(','0.0',',','0.0',')'],
			//vllType : 'vec2', do not use vllType
		},
	}

	backends.glsl.llTypeNativeOp = {
		float_vec2__mul : 'vec2',  vec2_float__mul : 'vec2',
		double_vec2__mul : 'vec2', vec2_double__mul : 'vec2',
		vec2_vec2__add : 'vec2',
		vec2_vec2__sub : 'vec2',
		vec2_vec2__mul : 'vec2',
		vec2_vec2__div : 'vec2',

		float_vec3__mul : 'vec3',  vec3_float__mul : 'vec3',
		double_vec3__mul : 'vec3', vec3_double__mul : 'vec3',
		vec3_vec3__add : 'vec3',
		vec3_vec3__sub : 'vec3',
		vec3_vec3__mul : 'vec3',
		vec3_vec3__div : 'vec3',

		float_vec4__mul : 'vec4',  vec4_float__mul : 'vec4',
		double_vec4__mul : 'vec4', vec4_double__mul : 'vec4',
		vec4_vec4__add : 'vec4',
		vec4_vec4__sub : 'vec4',
		vec4_vec4__mul : 'vec4',
		vec4_vec4__div : 'vec4',

//    complex_float_add : 'complex', float_complex_add : 'complex',
		complex_complex__add : 'complex',
		complex_complex__sub : 'complex',
	}






	var getDSType = function(v) { // duplicated in dw_io_simple.js
		var t = typeof v;
		if(t == 'object') { return v.splice ? 'array' : 'table'; } // fix  what is the correct way?
		if(t == 'undefined') { return 'nil' }
		if(t == 'function') { return 'func' }
		if(t == 'boolean') { return 'bool' }
		return t
	}
							
	var _curlyB		
	var _curlyE		
	var _parenthesesB
	var _parenthesesE
	var _squareB	
	var _squareE	
	var _lessThan	
	var _moreThan	
	var _lessEqual	
	var _moreEqual	
	var _equals		
	var _notequals	
	var _concat		
	var _add		
	var _sub	
	var _new	
	var _mul		
	var _div    
	var _pow    
	var _mod
	var _not		
	var _and		
	var _or			
	var _andif		
	var _orelse			
	var _fallback	
	var _assignment	
	var _dot		
	var _colon		
	var _comma		
	var _semicolon	
	var _linefeed	
	var _in			
	var _if			
	var _else		
	//		var _elseif		
	var _for		
	var _while		
	var _break		
	var _continue	
	//		var _iter		
	var _func   
	var _class
	var _expose
	var _return		
	var _nil		
	//	var _backslash	
	var _quote		
	var _dquote		
	var _global
	var _api
	var _true
	var _false
	var _passB
	var _passE

	var ops = { }
	
	var initTokens = function() {
		_curlyB			= it.stringToTok( '{')
		_curlyE			= it.stringToTok( '}')
		_parenthesesB	= it.stringToTok( '(')
		_parenthesesE	= it.stringToTok( ')')
		_squareB		= it.stringToTok( '[')
		_squareE		= it.stringToTok( ']')
		_lessThan		= it.stringToTok( '<')
		_moreThan		= it.stringToTok( '>')
		_lessEqual		= it.stringToTok( '<=')
		_moreEqual		= it.stringToTok( '>=')
		_equals			= it.stringToTok( '==')
		_notequals		= it.stringToTok( '!=')
		_concat			= it.stringToTok( '..') // concat should also work on arrays / tables etc
		_add			= it.stringToTok( '+')
		_sub			= it.stringToTok( '-')
		_new			= it.stringToTok( 'new')
		_mul			= it.stringToTok( '*')
		_div			= it.stringToTok( '/')
		_pow			= it.stringToTok( '^')
		_mod			= it.stringToTok( '%')
		_not			= it.stringToTok( 'not')
		_and			= it.stringToTok( 'and')
		_or				= it.stringToTok( 'or')
		_andif			= it.stringToTok( '?')
		_orelse			= it.stringToTok( ':')
		_fallback		= it.stringToTok( '?:')
		_assignment		= it.stringToTok( '=')
		_dot			= it.stringToTok( '.')
		_colon			= it.stringToTok( ':')
		_comma			= it.stringToTok( ',')	// in javascript ',' extends the current statement, the result of (1,2,3,4) is 4, in lua (1,2) will case error, and local a = 1,2 will assign 1 to a
		_semicolon		= it.stringToTok( ';')	// statement separator, invalid inside an expression, like (1;2)
		_linefeed		= it.stringToTok( '\n')
		_in				= it.stringToTok( 'in')
		_if				= it.stringToTok( 'if')
		_else			= it.stringToTok( 'else')
	//	_elseif			= it.stringToTok( 'elseif')
		_for			= it.stringToTok( 'for')
		_while			= it.stringToTok( 'while')
		_break			= it.stringToTok( 'break')
		_continue		= it.stringToTok( 'continue')
	//	_iter			= it.stringToTok( 'iter')
		_func			= it.stringToTok( 'func')
		_class			= it.stringToTok( 'class')
		_expose			= it.stringToTok( 'expose')
		_return			= it.stringToTok( 'return')
		_nil			= it.stringToTok( 'nil')
	//	_backslash		= it.stringToTok( '\\')
		_quote			= it.stringToTok( "'")
		_dquote			= it.stringToTok( '"')			
		_global			= it.stringToTok( 'global')			
		_api			= it.stringToTok( 'api')			
		_true			= it.stringToTok( 'true')			
		_false			= it.stringToTok( 'false')			
		_passB			= it.stringToTok( '#{')			
		_passE			= it.stringToTok( '#}')		

		ops[_and       ] = { prec : 5  , valueFunc : function(a,b) { return a && b }, universalOp : _and       , internalName : 'and'      }
		ops[_or        ] = { prec : 5  , valueFunc : function(a,b) { return a || b }, universalOp : _or        , internalName : 'or'       }
		ops[_andif     ] = { prec : 5  , valueFunc : function(a,b) { return a && b }, universalOp : _andif     , internalName : 'andif'    , internalName2 : 'and'}
		ops[_orelse    ] = { prec : 5  , valueFunc : function(a,b) { return a || b }, universalOp : _orelse    , internalName : 'orelse'   , internalName2 : 'or' }
		ops[_fallback  ] = { prec : 5  , valueFunc : function(a,b) { return a || b }, universalOp : _fallback  , internalName : 'fallback' , internalName2 : 'or' }
		ops[_lessThan  ] = { prec : 6  , valueFunc : function(a,b) { return a <  b }, universalOp : _lessThan  , internalName : 'lessThan' }
		ops[_moreThan  ] = { prec : 6  , valueFunc : function(a,b) { return a >  b }, universalOp : _moreThan  , internalName : 'moreThan' }
		ops[_lessEqual ] = { prec : 6  , valueFunc : function(a,b) { return a <= b }, universalOp : _lessEqual , internalName : 'lessEqual'}
		ops[_moreEqual ] = { prec : 6  , valueFunc : function(a,b) { return a >= b }, universalOp : _moreEqual , internalName : 'moreEqual'}
		ops[_equals    ] = { prec : 6  , valueFunc : function(a,b) { return a == b }, universalOp : _equals    , internalName : 'equals'   }
		ops[_notequals ] = { prec : 6  , valueFunc : function(a,b) { return a != b }, universalOp : _notequals , internalName : 'notequals'}
		ops[_concat    ] = { prec : 7  , valueFunc : function(a,b) { return a +  b }, universalOp : _concat    , internalName : 'concat'   , globalFuncName : 'concat'}
		ops[_add       ] = { prec : 8  , valueFunc : function(a,b) { return a +  b }, universalOp : _add       , internalName : 'add'      }
		ops[_sub       ] = { prec : 8  , valueFunc : function(a,b) { return a -  b }, universalOp : _sub       , internalName : 'sub'      }
		ops[_mod       ] = { prec : 9  , valueFunc : function(a,b) { return a %  b }, universalOp : _mod       , internalName : 'mod'      }
		ops[_mul       ] = { prec : 10 , valueFunc : function(a,b) { return a *  b }, universalOp : _mul       , internalName : 'mul'      }
		ops[_div       ] = { prec : 10 , valueFunc : function(a,b) { return a /  b }, universalOp : _div       , internalName : 'div'      }     
		ops[_pow       ] = { prec : 11 , valueFunc : function(a,b) { return Math.pow(a,b) }, universalOp : _pow, internalName : 'pow'      , globalFuncName : 'pow'}     
	}
  	var          functionCallPrec = 15
			

	var resolveTypes = function(baseName, argTypes, argCode) {
		var retr = {}
		if(argTypes.length === 2) {
			var t1 = argTypes[0] 
			var t2 = argTypes[1] 
			var needMoreTypeResolve = false
			do {
				if(t1 === t2 && backend.llTypeNativeOpPassAll[t1]) {
					retr.llType = t1
					break; // make more rigorous?
				}
				if(t1 !== t2 && backend.llTypeNativeOpPassAll[t1] && backend.llTypeNativeOpPassAll[t2]) {
					retr.llType = undefined
					break;
				}
				if(typeof t1 === 'string' && typeof t2 === 'string') { // check that the types are not functions
					var funcname = t1+'_'+t2+'__'+baseName
					if(backend.llTypeNativeOp[funcname]) {
						retr.llType = backend.llTypeNativeOp[funcname]
						break;
					}
					var ns = nameSpace[funcname]
					if(ns && typeof ns.llType === 'object') {
						retr.useFunc = ns.dnativeName || funcname
						if(ns.llType === undefined) { tthrow('resolveTypes() missing llType of '+funcname) }
						if(typeof ns.llType.funcMetaData !== 'object') { tthrow('resolveTypes() missing funcMetaData') }
						if(ns.llType.funcMetaData.returnType === undefined) { tthrow('resolveTypes() missing returntype of '+funcname+' / '+ns.llType.funcMetaData.name) }
						retr.llType = ns.llType.funcMetaData.returnType
						break;
					} else {
						funcname = t1+'_'+t1+'__'+baseName
						var transformName = t2+'_to_'+t1
						if((nameSpace[funcname] || backend.llTypeNativeOpPassAll[t1] || backend.llTypeNativeOp[funcname]) && nameSpace[transformName]) {
							transformName = nameSpace[transformName].dnativeName || transformName
							argCode[1] = transformName+'(' + argCode[1] + ')'
							t2 = t1
							meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : transformName })
							needMoreTypeResolve = true
						} else {
							funcname = t2+'_'+t2+'__'+baseName
							var transformName = t1+'_to_'+t2
							if((nameSpace[funcname] || backend.llTypeNativeOpPassAll[t1] || backend.llTypeNativeOp[funcname]) && nameSpace[transformName]) {
								transformName = nameSpace[transformName].dnativeName || transformName
								argCode[0] = transformName+ '(' +  argCode[0]  + ')'
								t1 = t2 
								meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : transformName })
								needMoreTypeResolve = true
							} else {
								tthrow("type error "+currentConfig.backend+", resolving "+baseName+"  for  "+t1+"("+argCode[0]+")  vs  "+t2+"("+argCode[1]+")")
							}                   
						}
					} 	
				} 
			} while(needMoreTypeResolve);
		} else {
			var prefx = ''
			if(argTypes.length > 0) {
				for(var i = 0; i < argTypes.length; i++) {
					prefx += argTypes[i] === undefined ? 'any' : argTypes[i]
					prefx += '_'
				}
				prefx += '_'
			}
			var funcname = prefx + baseName
			var ns = nameSpace[funcname] 
			if(ns) {
				retr.useFunc = ns.dnativeName || funcname
				if(ns.llType === undefined) { tthrow('resolveTypes() missing llType of '+funcname) }
				if(typeof ns.llType.funcMetaData !== 'object') { tthrow('resolveTypes() missing funcMetaData') }
				//if(ns.llType.funcMetaData.returnType === undefined) { tthrow('resolveTypes() missing returntype of '+funcname+' / '+ns.llType.funcMetaData.name) }				
				retr.llType = ns.llType.funcMetaData.returnType
			}			
		}
		if(retr.useFunc)
			return retr
	}


	var nextIsAssignment  = function()  {
		return it.peek() === _assignment // add support for += etc  (any operator followed by assignment)
	}
	
	var parseExpr

	var meta
	var ttfId

	var configNeedsRealize = true;
	var currentConfig = { }
	var setConfig = function(c) {
		if(!c.prefix) { throw('prefix have to be specified') }
		c = c || {}
		/*copy*/ currentConfig = {}; for(var i in c) { currentConfig[i] = c[i] }
		if(!currentConfig.backend) { currentConfig.backend = 'js'}
		configNeedsRealize = true
	}
	setConfig(config)
	
	var configRealize = function() {
		if(!configNeedsRealize) {
			return
		}

		nameSpace = {}

		var prevBackend = backend
		
		backend = backends[currentConfig.backend]
		prefix = currentConfig.prefix
		
		if(prevBackend) {
		  for(var depName in prevBackend.depsA) {
			var depSpec = prevBackend.depsA[depName]
			if(!depSpec.dontAddToNameSpace) {
			  //if(!nameSpace[depName]) throw('expected '+depName+' in namespace')
			  //if( nameSpace[depName].pushed) throw('unexpected pushed namespace item for '+depName)
			  //if(!nameSpace[depName].isDependency) throw('expected '+depName+' to be dependency')
			  nameSpace[depName] = undefined
			}
		  }
		}

		for(var i = 0; i < backend.deps.length; i++) {
			var depSpec = backend.deps[i]
			var depName = depSpec.name
			if(!depSpec.dontAddToNameSpace) {
				//if(nameSpace[depName] !== undefined) throw('expected '+depName+' in namespace to be undefined'+nameSpace[depName])
				nameSpace[depName] = {
						dnativeName : prefix + depName,
						global : true,
						api : true,
						isDependency : true,
						llType : {t:'func', funcMetaData: {returnType : depSpec.retType } } }
		//		var dnativeCode = depSpec.outCode.split("###").join(prefix) 
		//		eval(dnativeCode)
			}
		}
		
		for(var i = 0; i < internalLib.length; i++) {
			var depSpec = internalLib[i]
			var depName = depSpec.name
			if(!backend.depsA[depName]) {
			var r = parseInternal(depSpec.code)
				if(r.error) { throw('internal Lib Error in '+depSpec.name+':  '+r.error) }
//				if(depName === 'complex__abs') {
//					debugger
//				}
//				depSpec.outCode = parseInternal(depSpec.code).dnative
			}
		}
		
		configNeedsRealize = false
	}
	
//		var handleValueOperand = function(a, b, func)  {
//			if(type(a) == 'number' && type(b) == 'number') {
//				return func(a,b)
//			} else if(	(a === b) {
//				return a			
//			} else if(	(a === any && b === anyOrNil) ||
//						(b === any && a === anyOrNil)) { 
//				return anyOrNil
//			}
//		}

	var traverseDepsRec
	var traverseDepsRec = function(out, deps) {
		for(var i = 0; i < deps.length; i++) {
			var dep = deps[i]
			var depSpec = backend.depsA[dep] || internalLibA[dep]
			if(!depSpec) { throw('Missing internal dependency specification! '+dep) }
			if(depSpec.deps) traverseDepsRec(out, depSpec.deps)
			out.outCode.push(depSpec.outCode)
		}
	}
	var generateCodeForDependencies = function(deps) {
		var completeDeps = { outCode : [], done : {} }
		traverseDepsRec(completeDeps, deps)
		return completeDeps.outCode.join('\n').split('###').join(prefix)
	} 
  
	var generateCodeForInternalLib = function() {
		var deps = backend.deps.map(function(dep) { return dep.name })
		for(var name in internalLibA) { if(!backend.depsA[name]) deps.push(name) }
		return generateCodeForDependencies(deps)
	}

	var separateEndWs = [false]
	var separateEndWsData = ''
	var codeAtSpecialPointStack = []
	var pushSpecialCodePoint = function() { codeAtSpecialPointStack.push('') }
	var popSpecialCodePoint = function()  { codeAtSpecialPointStack.pop() }
	var addCodeAtSpecialPoint = function(code) { // add a function inside a class or at global scope
		codeAtSpecialPointStack[codeAtSpecialPointStack.length - 1] += code
	}
	var getCodeForSpecialPoint = function() { return codeAtSpecialPointStack[codeAtSpecialPointStack.length - 1] }

	var currentClassStack = []
	var getCurrentClassName = function() { if(currentClassStack.length == 0) return '_outerscope'; return currentClassStack[currentClassStack.length - 1] }


	var parseFunctionParams = function() {
		var r, out = { argCode : [], argSeparator : [], llTypes : [] }
		if(it.peek() !== _parenthesesE) {
			while(true) {
				if(it.peek() === undefined) { tthrow('functioncall, Missing end of parameterlist') }
				r = parseExpr(1)
				out.argCode.push(r.out)
				if(backend.trackTypes) {
					out.llTypes.push(r.llType)
				}
				r = parseCommaSeparator(_parenthesesE)
				if(r) {
					out.argSeparator.push(r)
				}
				else { break }
			}
		}
		return out
	}

	var handleAssignment = function( obj, key, dbgKey, specialDecl)  {
//			if(obj==undefined) tthrow('handleAssignment missing obj (key='+tostring(key))
//			if(key==undefined) tthrow('handleAssignment missing key')

		//if(key ==='complex_complex__mul') {
		//	debugger
		//}

		var r
		var ws = it.proceed();
		r = parseExpr(1, specialDecl == 'expose' ? specialDecl : undefined, true, dbgKey);
		var tmpws = it.proceed(true)
		if(!r.wrapCode) {
			r.out += backend.semicolonInsertion && tmpws.indexOf('\n') != -1 ? ';' + tmpws : tmpws
		} else {
			r.wrapCode[1] += tmpws
		}

		if(typeof obj === 'object' && key !== undefined) {
			obj[key] = r.value			
			trace('ParseExpr() set in nameSpace or obj: ' + key + ' = ' + r)
		}

		if(backend.needToMoveFunctions && r.typ == 'func') {
			addCodeAtSpecialPoint(	currentClassStack.length == 0 ? r.out :
				(specialDecl == 'expose' ? "public:  " : "private: ") + r.out)
			r.codeWasMoved = true
		}
		if(backend.notClassesAsObjects && r.typ == 'class') {
			addCodeAtSpecialPoint(	currentClassStack.length == 0 ? r.out :
				(specialDecl == 'expose' ? "public:  " : "private: ") + r.out)
			r.codeWasMoved = true
		}
		r.ws = ws
		return r // ws + " = " + r.out 
	}

	var lastDbgLine
	var dbgCurName = []

	var dbgFunctions = {}
	var genUniqueFuncName = function(txt) {
		var o = dbgFunctions[txt]
		if(o) {
			o.id++
			return txt + '_' + o.id
		}
		dbgFunctions[txt] = {id : 1}
		return txt
	}
	
	var dbgReturnWrap = function(expr, funcEnd) {
		if(!currentConfig.release) {
			lastDbgLine = it.getLine()
			if(dbgCurName.length == 0) {
				tthrow('dbgReturnWrap out of sync during parse at line '+lastDbgLine+', expr:'+expr)
			}
			expr = prefix + dbgfe + '(' + (expr == '' ? backend._nil : expr) + ',"' + ttfId + '",' + lastDbgLine + ',"' + dbgCurName[dbgCurName.length - 1] + '");'
			if(funcEnd) {
//				expr += backend._comments[1] + 'E' + backend._comments[2]
				dbgCurName.length--
			}
		}
		return expr
	}
	
	var getDbgFuncStart = function(recentAssignmentVar) {
		if(!currentConfig.release) {
			lastDbgLine = it.getLine()
			dbgCurName.push(genUniqueFuncName((recentAssignmentVar || ('F' + lastDbgLine)),ttfId))
			return prefix + dbgfb + '("' + ttfId + '",' + lastDbgLine + ',"' + dbgCurName[dbgCurName.length-1] + '");'
		}				
		return ''
	}
	
	var traceEnable = {}
	var enableTrace = function(which, state) { traceEnable[which] = state }
	var isTraceEnabled = function(which) { return traceEnable[which] ? true : false }

//	traceEnable[0] = true
//	traceEnable['spine'] = true
//	traceEnable['THREEjs'] = true
	
	var parseBlock = function(prec, scopeType, scopeEndByLineFeed) {
		var t, r, v = undefined, inFunctionScope = scopeType == 'func'
		var vt = ''
		
/*		t = it.peek()
		if(block) {
			if(t === _curlyB) {
				vt += it.proceed();	
			} else if(t === _linefeed) {
				
			}
		}
*/		
		while(true) {
			trace('parseBlock loop start')
			t = it.peek()
			
			// for analysis-evaluation:
			// - if any if/ifelse are (static) true, optimize away all elseifs after it (if first remove entire if)
			// - if/ifelse that are (static) false can be optimized away
			// - if any if is unknown, subtree evaluation must register all state changes as NaN
			// 
			// function definition need to revert all state changes inside nameSpaceBlockEnd
			
			if(t === _passB) {					// parser bypass
				/*vt += */it.proceed()
				t = it.peek()
				if(t === 'push' || t === 'pop') {
					it.proceed()
					var confName = '__parser_'+it.peek()
					var confObj, wasPopped
					if(t === 'push') {
						pushToNameSpace(confName)
						it.proceed()
						t = it.peek()
						if(!(t === _passE)) {
							var tmpr = parseExpr(1)
							nameSpace[confName].value = tmpr.value
							nameSpace[confName].dnativeName = tmpr.value
						} else {
							nameSpace[confName].value = true						
							nameSpace[confName].dnativeName = 'true'
						}
					} else {
						popFromNameSpace(confName)
						wasPopped = true
						it.proceed()
					}
					confObj = nameSpace[confName]

					if(confName === '__parser_useFloat' && backend.trackTypes) { // updateParserInternal(param, val) 
						backend.llTypes.number = confObj && confObj.value ? 'float' : 'double'
					} 

					if(confName === '__parser_trace') { 
						traceEnable[confObj.value] = !wasPopped ? true : false
					} 

					if(it.peek() != _passE) {
						tthrow('#{ push/pop error!')
					} else {
						it.proceed()
					}

				} else if(t === 'stdfunc') {
				//	var fname = 
				} else {
					var useCode = t === currentConfig.backend

					/*vt += */it.proceed()
					var ls = it.getLine()

	//				vt += prefix + 'registerGlobals( '+ prefix + 'tryCall(' + backend._func[0] + backend._func[1] // skip stack for this wrapper func, we still have tryCall
					if(useCode) {
						vt += prefix + 'runUnparsed( '+ backend._func[0] + backend._func[1] // skip stack for this wrapper func, we still have tryCall
					}
					var dnativeCode = ''
					while(true) {
						t = it.simpleGet()
						if(t === _passE) { break; }
						if(t === undefined) { tthrow('parseBlock() did not found ending of dnative scope') }
						dnativeCode += t
					}
					if(useCode) {
						dnativeCode = dnativeCode.split("###").join(prefix) 
						if(!currentConfig.release) {
		//						vt += dnativeCode + backend._func[3] + ', "' +ttfId+ '", ' +ls+ ', ' +it.getLine()+ ', "' +genUniqueFuncName(currentConfig.backend+'F_'+dnativeCode.substring(10,16))+ '").ret) ;'
							vt += dnativeCode + backend._func[3] + ', "' +ttfId+ '", ' +ls+ ', ' +it.getLine()+ ', "' +genUniqueFuncName(currentConfig.backend+'F_')+ '") ;'
						} else {
		//						vt += dnativeCode + backend._func[3] + ').ret) ;'
							vt += dnativeCode + backend._func[3] + ') ;'
						}
					}					
				}

			} else if(t === _if) {				// if
				var parseIfParcial = function() {
					var r, vt = ''
					if(!(it.peek() === _curlyB)) { tthrow("parseBlock if: missing start of block, found "+it.peek()) }
					vt += it.proceed();
					r = parseBlock(1);
					vt += r.out
					if(!(it.peek() === _curlyE)) { tthrow("parseBlock if: missing end of block, found "+it.peek()) }
					vt += it.proceed();
					return vt 
				}		
				vt += it.proceed()
				vt += backend._if[0]
				r = parseExpr(1)
				vt += r.out
				vt += backend._if[1]					
				vt += parseIfParcial()
				while(it.peek() == _else) {
					vt += it.proceed()
					if(it.peek() == _if) {		// else if
						vt += it.proceed();
						vt += backend._elseif[0]
						r = parseExpr(1)	
						vt += r.out
						vt += backend._elseif[1]
						vt += parseIfParcial()
					} else {
						vt += backend._else		// else
						vt += parseIfParcial()
						if(it.peek() == _else) {
							tthrow("found another else after last else!")
						}
					}
				}
				vt += backend._endif
	
			} else if(t === _expose || t === _global || t === _api) {
				vt += it.proceed();		
//				var name = prefix + it.peek()
				r = parseExpr(1, t);
				vt += r.out
				
			} else if(t === _return && !(scopeType === 'class')) {
				vt += backend._func[2]     // " return " lua does not allow statements after return,  ??  
				//vt += it.proceed()   cannot do this here, because a linefeed will skip the code generated by dbgReturnWrap
				var ws = it.proceed()
				var retTypes = getCurrentReturnTypeArray()
				if(it.peek() === _curlyE || it.peek() === _semicolon) {
					retTypes.push(undefined)
					vt += dbgReturnWrap(backend._nil, inFunctionScope)
				} else {
					var tmpr = parseExpr(1)
					retTypes.push(tmpr.llType)					
					vt += dbgReturnWrap(tmpr.out, inFunctionScope)
				}
				vt += ws	
				if(inFunctionScope) {
					break;
				} else {
	//				tthrow("nooooo")
				}
			} else if(t === _while) {
				vt += it.proceed();
				vt += backend._while[0]
				r = parseExpr(1);
				vt += r.out
				if(!(it.peek() === _curlyB)) { tthrow("parseBlock while: missing start of block, found "+it.peek()) }
				vt += it.proceed();
				vt += backend._while[1]
				r = parseBlock(1);
				vt += r.out
				if(!(it.peek() === _curlyE)) { tthrow("parseBlock while: missing end of block, found "+it.peek()) }
				vt += it.proceed();
				vt += backend._while[2]						
			} else if(t === _for) {
				vt += it.proceed()
				if(it.peek() == _curlyB) {
					throw('removed feature: for {}, use while true {}')
/*					vt += it.proceed()
					vt += backend._while[0]
					vt += 'true'	// no backend needed
					vt += backend._while[1]
					nameSpaceBlockBegin()
					r = parseBlock(1)
					vt += r.out	
					if(!(it.peek() === _curlyE)) { tthrow("parseBlock for: missing end of block, found " + it.peek()) }
					vt += it.proceed()
					vt += backend._while[2]	
*/									
				} else { // _forstep or _forkv
					var noVariable = it.peek() == '*'
					var mainVarName = noVariable ? 't'+it.getTokenPos() : it.peek()
					var mainVarNameWrapped = backend._symbolWrap[0] + mainVarName + backend._symbolWrap[1]
					if(!noVariable) { vt += it.proceed() }
					var isForTimes = noVariable || it.peek() === _mul 
					if(isForTimes || it.peek() === _assignment) {  // _forstep

						// for * 3 {}        iterate 3 times
						// for i * 3 {}      iterate i = 0, 1, 2
						vt += it.proceed()
						vt += backend._forstep[0] // "for(var "
						vt += mainVarNameWrapped
						nameSpaceBlockBegin()
						if(isForTimes) {
							if(!noVariable) { pushToNameSpace(mainVarName) }
							r = parseExpr(1)
							if(it.peek() === _comma) {
								vt += it.proceed()	
								var ofs = parseExpr(1)
								//    " = startval, __e_i = (numberOfIterations) + i"
								vt += " = " + ofs.out + backend._forstep[1] + mainVarName + " = (" + r.out + ") + " + mainVarNameWrapped
							} else {
								//    " = 0, __e_i = numberOfIterations"
								vt += " = 0" + backend._forstep[1] + mainVarName + " = " + r.out
							}
						} else {
							vt += " = "
							r = parseExpr(1)
							vt += r.out
							if(!(it.peek() === _comma)) { tthrow("parseBlock for: missing comma, found " + it.peek()) }
							vt += it.proceed()	
							pushToNameSpace(mainVarName)
							vt += backend._forstep[1] + mainVarName // ", __e_"		 idea: end and step variables could be exposed in namespace, might be useful, see dwnotes
							vt += " = "
							r = parseExpr(1)
							vt += r.out
						}
						var stepStr
						if(!isForTimes && it.peek() === _comma) {
							stepStr = backend._forstep[6] + mainVarName
							vt += it.proceed()								
							vt += backend._forstep[2] + mainVarName // ", __s_"
							vt += " = "
							r = parseExpr(1)
							vt += r.out
						} else {	
							stepStr = ' + 1'
						}
						vt += backend._forstep[3] + mainVarNameWrapped // "; "
						vt += isForTimes ? ' < ' : ' <= ' // no backend needed
						vt += backend._forstep[4] + mainVarName // "__e_"
						vt += backend._forstep[5] // ";) { "
						
						if(!(it.peek() === _curlyB)) { tthrow("parseBlock for: missing start of block, found " + it.peek()) }
						vt += it.proceed()							
						r = parseBlock(1)
						vt += r.out	
						if(!(it.peek() === _curlyE)) { tthrow("parseBlock for: missing end of block, found " + it.peek()) }
						vt += it.proceed()
						vt += "; " + mainVarNameWrapped + " = " + mainVarNameWrapped + stepStr
						vt += backend._forstep[7]							

	//					_forstep:["for(var ",   ", __e_",    ", __s_",     "; ",          " < __e_",    ";) { ",    " + __s_",   "} "],  // note: this causes errors when doing closures inside loops, js backend now uses function based approach instead
	//					_forstep:["local ",     "; __e_",    "; __s_",     "; while ",    " < __e_",    " do ",     " + __s_",   "} "],
					} else { // _forkv

						// for v in tableOrArray {}
						// for k,v in tableOrArray {}
						var valName
						if(it.peek() == _comma) {
							vt += it.proceed()
							valName = it.peek()
							vt += it.proceed()
						} 
						var objVarName
						if(it.peek() == _comma) { // why?
							vt += it.proceed()
							objVarName = it.peek()
							vt += it.proceed()
						} 
						if(it.peek() != _in) {
							tthrow("parseBlock for: expected 'in', found " + it.peek())
						}
						vt += it.proceed()
						r = parseExpr(1) // parse 
						nameSpaceBlockBegin()
						pushToNameSpace(mainVarName)
						if(valName) {
							pushToNameSpace(valName)
							if(!objVarName) { objVarName = '__o_' + mainVarName }
							else { pushToNameSpace(objVarName) }
							vt += backend._forkv[6] + objVarName + ' = '
							vt += r.out
							vt += '; '
						}

						vt += backend._forkv[0] // "for(var "         for(var k in __o_k) {
						if(backend._forkv[1]) {
							vt += mainVarName
						} else {
							if(!backend._forkv_dontUsePrefix) {
								vt += prefix
							}
						}
						vt += !valName && backend._forv || backend._forkv[2] // " in "  "forK("
//						vt += backend._forkv[2] // " in "  "forK("
						vt += valName ? objVarName : r.out		// or for(var k in the.expression.parsed.in.r.out) {
						vt += backend._forkv[3] // ") { "
						if(backend._forkv[4]) {
							vt += mainVarName
						}
						vt += backend._forkv[5] // ""
						if(!(it.peek() === _curlyB)) { tthrow("parseBlock for: missing start of block, found " + it.peek()) }
						vt += it.proceed()							
						if(valName) {
							vt += backend._forkv[6] + valName + " = " + objVarName + "[" + mainVarName + "]; "  //  var v = __o_k[k]
						}	
						r = parseBlock(1)
						vt += r.out	
						if(!(it.peek() === _curlyE)) { tthrow("parseBlock for: missing end of block, found " + it.peek()) }
						vt += it.proceed()
						vt += backend._forkv[7]	
					}
				}
				nameSpaceBlockEnd()
//					} else if (t === _nil) {
//						trace('ParseExpr() nil')
//						vt += it.proceed()
//						vt += backend._nil
//						v = undefined							
			} else if(t === _break || t === _continue) { 
				vt += it.proceed();
				vt += t + ';'  // todo fix?

			} else if(t === _curlyE || t === undefined) {
				if(inFunctionScope) {
//					retTypes = retTypes || []
//					retTypes.push(undefined)										
					vt += ';' + dbgReturnWrap('', true)	//  '\n'	is needed for the case with ending with line comment //							
				}
				break;
			} else if(t === _semicolon) {
				do {
					vt += '; '
					vt += it.proceed()
					t = it.peek()
				} while(t === _semicolon)			
			} else {

				// check for function definition syntax  "myFunc(a,b) = " and "myFunc2(a,b) { "
				var foundFuncDef = false
				if(isSymbol(t.charCodeAt(0))) {
					var oldpos = it.getTokenPos()
					it.proceed();
					if(it.peek() == _parenthesesB) {
						it.proceed();				
						var t2 = it.peek()
						while(t2 === _comma || isSymbol(t2.charCodeAt(0))) {
							it.proceed();				
							t2 = it.peek()
						}
						if(t2 === _parenthesesE) {
							it.proceed();				
							t2 = it.peek()
							if(t2 === _assignment || t2 === _curlyB) {
								foundFuncDef = true
							}
						}
					}
					it.setTokenPos(oldpos)
					if(foundFuncDef) {
						vt += it.proceed()
						it.injectTokens([t, '=', '__dscript__statementFuncDef'])
						r = parseExpr(1, undefined, true)
						nameSpace[t].funcMetaData = r.funcMetaData
						vt += r.out
					} else {
					}
				}

				// parse expression, standard/common case
				if(!foundFuncDef) {
					vt += it.proceed(true) // flush whitespace, this is needed because of return insertion below
					r = parseExpr(1, undefined, true)
					var tmpws = it.peekWS()
					if(backend.semicolonInsertion && tmpws.indexOf('\n') != -1) {
						r.out += ';'
					}
					if(!scopeEndByLineFeed) {
						r.out += it.proceed(true)
					}
					v = r.value

					if(inFunctionScope && (it.peek() === _curlyE || it.peek() === undefined || (scopeEndByLineFeed && tmpws.indexOf('\n') != -1))) { 
						var retTypes = getCurrentReturnTypeArray()
						if(!r.skipAutoReturn) { // add " return " before last statement in function unless it is an assignment (not valid in lua)
							vt += backend._func[2]  
							retTypes.push(r.llType)					
							if(r.flat) { vt =  dbgReturnWrap(r.out, true) }
							else {       vt += dbgReturnWrap(r.out, true) }		
						} else {
							if(r.flat) { tthrow('unexpected r.flat?') }
							vt += r.out + ';' + dbgReturnWrap('', true)
						}
						break;
					} else {
						if(r.flat) { vt =  r.out } 
						else {       vt += r.out }				
					}

				}

			}
//			t = it.peek()
//				if(t === _comma) {
//					vt += ', '
//					vt += it.proceed()
//				}
		}

		if(scopeType === 'class' && backend.closureAsClass) {
			var interfaceRefName = nameSpace['this'].dnativeName || 'this'
//			vt += ';' + interfaceRefName + ' = ' + backend._tableliteral[0] + backend._tableliteral[2] + ';'
			vt += ';'
			currentScopeForEach(function(name) {
				if(nameSpace[name].exposed) {
					vt += interfaceRefName + '.' + name + ' = ' + name + ' ; ' // no backend needed for . =
				}
			})
			vt += backend._func[2]  // return
			vt += dbgReturnWrap(interfaceRefName, true)
/*			
			vt += backend._func[2]  // return
			var returnInterface = backend._tableliteral[0]
			currentScopeForEach(function(name) {
				if(nameSpace[name].exposed) {
					returnInterface += name + backend._tableliteral[1] + name + ', ' // no backend needed for comma
				}
			})
			returnInterface += backend._tableliteral[2]
			vt += dbgReturnWrap(returnInterface, true)
*/			
		}
		
		if(!scopeEndByLineFeed) {
			vt += it.proceed(true) // flush whitespace
		}
		return { value:v, out:vt }
	}
	
	var assertVar = function(s) { }
	
	var nameSpaceStack = []
	var nameSpaceFuncStack = []
	
	var pushToNameSpace	= function(name, typ) {
		var tmp = nameSpace[name]
		nameSpace[name] = { value : undefined, pushed : tmp, llType : typ }
		nameSpaceStack[nameSpaceStack.length - 1].tokens.push(name)
	}

	var nameSpaceBlockBegin	=function(name, isFunctionOrClass) {
		var o = {tokens : [], name : name, isFunctionOrClass : isFunctionOrClass}
		nameSpaceStack.push(o)
		if(isFunctionOrClass) {
			o.retTypes = []
			nameSpaceFuncStack.push(o)
		}
	}

	var getCurrentReturnTypeArray = function() { 
		return nameSpaceFuncStack.length < 1 ? [] : nameSpaceFuncStack[nameSpaceFuncStack.length-1].retTypes		
	}

	var getCurrentFunctionOrClassName = function() {
		return nameSpaceFuncStack.length < 1 ? '' : nameSpaceFuncStack[nameSpaceFuncStack.length-1].name
	}

	var currentScopeForEach = function(f) {
		var curScope = nameSpaceStack[nameSpaceStack.length - 1].tokens
		for(var i = 0; i < curScope.length; i++) {
			if(!(curScope[i] === undefined)) {
				f(curScope[i])
			}
		}
	}

	var popFromNameSpace = function( name, dontlookup) {
		var tmp = nameSpace[name]
		if(tmp) {
			nameSpace[name] = tmp.pushed
			if(tmp.pushed) { delete tmp.pushed } // ease gc 
			if(!dontlookup) {
				var curScope = nameSpaceStack[nameSpaceStack.length - 1].tokens
				for(var i = 0; i < curScope.length; i++) {
					if(curScope[i] === name) {
						curScope[i] = undefined
					}
				}
			}
			return tmp
		} else {
			tthrow('popFromNameSpace() no such symbol: ' + name)
		}
	}		
	
	var nameSpaceBlockEnd	=function() {
		if(nameSpaceStack.length == 0) { tthrow('unexpected nameSpaceBlockEnd') }
		var o = nameSpaceStack.pop()
		if(o.isFunctionOrClass) { nameSpaceFuncStack.pop() }
		var argumentNames = o.tokens
		for(var i = 0; i < argumentNames.length; i++) {
			if(argumentNames[i] != undefined) {
				popFromNameSpace(argumentNames[i], true)				
			}
		}			
	}
	
	var parseCommaSeparator = function(term) {
		if(it.peek() === term)			{ return
		} else if(it.peek() === _comma)	{ return it.proceed()     + ', ' // no backend needed
		} else if(it.peekLineFeed())	{ return it.proceed(true) + ', ' // no backend needed
		} else {
			tthrow('parseCommaSeparator fail at ' + it.peek() + ', looking for ' + term)
		}
	}
	
	var hardTypes = {
		complex : {  			   dims: 2, template : ['complex(','0.0',',','0.0',')'], },

		vec2 : {				   dims: 2, template : ['vec2(','0.0',',','0.0',')'], },
		vec3 : {				   dims: 3, template : ['vec3(','0.0',',','0.0',',','0.0',')'], },
		vec4 : {				   dims: 4, template : ['vec4(','0.0',',','0.0',',','0.0',',','0.0',')'], },

		mat2 : { isMatrix : true,  dims: 2, template : ['vec2(','0.0',',','0.0',')'], },
		mat3 : { isMatrix : true,  dims: 3, template : ['vec3(','0.0',',','0.0',',','0.0',')'], },
		mat4 : { isMatrix : true,  dims: 4, template : ['vec4(','0.0',',','0.0',',','0.0',',','0.0',')'], },
	}

	var parseExpr = function(prec, specialDecl, skipWhiteFlush, recentAssignmentVar) {
		var t, r, v, vt='', retr = {}, skipAutoReturn//, didAssignment
		var globalDecl = specialDecl === 'global' || specialDecl === 'api'
		
		trace('parseExpr('+prec+') start')

	
		t = it.peek()

// this breaks generateSortPrioBetween, debug later...
//		var line = it.getLine()
//		if(!currentConfig.release && lastDbgLine != line) {
//			vt += prefix + dbgl + '("' + ttfId + '",' + line + ')' + backend._or + ' '
//			lastDbgLine = line
//		}

		if(typeof hardTypes[t] === 'object') {
			
			var hardType = hardTypes[t]
			vt += it.proceed();
			if(!(it.peek() === _parenthesesB)) { tthrow('missing parantheses after hard type '+t) }
			vt += it.proceed();
			var codeTemplate = backend.hardTypes && backend.hardTypes[t] && backend.hardTypes[t].template || hardType.template

			vt += codeTemplate[0]
			for(var i = 0; i < codeTemplate.length - 1; i += 2) {
				if(it.peek() === _parenthesesE) {
					if(i != 0) { vt += codeTemplate[i] } //ugly code, commas are in the template but also eaten by parseCommaSeparator
					vt += codeTemplate[i+1]
				} else {
					r = parseExpr(1)					
					vt += r.out			
					r = parseCommaSeparator(_parenthesesE)
					if(r) { vt += r }
				}
			}
			if(!(it.peek() === _parenthesesE)) { tthrow('missing end parantheses after hard type '+t) }
			vt += it.proceed();
			vt += codeTemplate[codeTemplate.length - 1]

			if(backend.trackTypes) { retr.llType = t }

		} else if(t === _squareB) {
																					trace('ParseExpr list'    );
			v = []
			vt += it.proceed();
			if(it.peek() === _squareE) {
				vt += it.proceed();
				vt = backend._listliteral[0]  // []
			} else {
				vt = backend._listliteral[1]
				var cnt = 0
				while(true) {
					cnt++
					if(it.peek() == undefined) { tthrow('Missing end of list literal') }
					r = parseExpr(1)
					v.push(r.value);
					vt += r.out
					r = parseCommaSeparator(_squareE)
					if(r) { vt += r }
					else { break }
				}
				vt += it.proceed()
				if(backend._listliteral[3]) {
					vt += backend._listliteral[3] + cnt
				}
				vt += backend._listliteral[2]
			}
		}
		else if	(t === _curlyB)		
		{
																					trace('ParseExpr table'   );
			v = {}
			vt += it.proceed();
			vt = backend._tableliteral[0]
			while(true) {
				if(it.peek() === _curlyE) {
					vt += it.proceed();
					vt += vt = backend._tableliteral[2]
					break
				}			
				t = it.peek()
				if(t == undefined) { tthrow('Missing end of table literal') }
				var isBool = undefined
				if(t === _add || t === _sub) {
					isBool = t === _add ? true : false
					it.proceed()
					t = it.peek()
					if(t == undefined) { tthrow('Missing end of table literal after bool') }
				}
				var key = t 	// do some kind of verification?  numbers need square brackets in Lua,  js only supports strings (numbers will be inserted as strings)
				if(t === _quote || t === _dquote) {
					vt += it.proceed(true)
					var key = it.parseQuotedString()
					if(currentConfig.backend == 'lua') {
						vt += '[' + key + ']'
					} else {
						vt += key
					}
//						key = backslashUnescape(key.substring(1,key.length - 1))
				} else {
					vt += it.proceed()
					vt += key
				}
				if(isBool == undefined) {
					if(!(it.peek() === _assignment || it.peek() === _colon)) { tthrow('Expected "=" in table') }
					vt += it.proceed()
					vt += backend._tableliteral[1]
					r = parseExpr(1, undefined, undefined, key);
					v[key] = r.value
					vt += r.out
				} else {
					vt += backend._tableliteral[1]
					vt += isBool ? backend._true : backend._false
				}
				r = parseCommaSeparator(_curlyE)
				if(r) { vt += r }
			}								
		}
		else if	(t === _quote || t === _dquote)
		{
																					trace('ParseExpr quote'   );
			vt += it.proceed(true);
			var thestr = it.parseQuotedString()
			t = it.peek()
			var doMultiline = false
			if((t === _quote || t === _dquote) && !it.peekLineFeed()) {
				if(t === _quote && thestr == "''" || t === _dquote && thestr == '""') {
					doMultiline = it.proceed(true) == '' ? true : false
				} 

				if(!doMultiline) {
					tthrow('Double string detected, check your quotes')
				}
			}
			if(backend.trackTypes) { retr.llType = backend.llTypes.string }

			if(!doMultiline) {
				if(backend.doubleQuoteForString && thestr.charAt(0) == "'") {
					thestr = '"' + (thestr.substring(1,thestr.length-1).split('"').join('\\"')) + '"'
				}
				vt += thestr					
			} else {
				it.proceed()
				var endQuote = t
				var quoteCount = 0
				var content = []
				while(true)
				{
					t = it.simpleGet()
					if(t == undefined) {
						tthrow('Missing end of multiline quote')
					} else if(t === endQuote) {	
						quoteCount = quoteCount + 1
						if(quoteCount == 3) {
							break
						}
					} else {
						quoteCount = 0
					}
					content.push(t)
				}
				content.pop() ; content.pop() 
				content = content.join('')
				content = content.split('"').join('\\"') // escape double quotes
//				if(backend._multiLineStringConcat) {
//					content = content.split('\n').join('\\n\"' + (backend._multiLineStringConcat || backend._concat) + '\n"')	
//				} else {
					content = content.split('\r\n').join('\\n') // yay, windows linebreak, thanks
					content = content.split('\n').join('\\n')
//				}
				vt += '"' + content + '"'
			}

			v = thestr.substring(1,thestr.length-1) // fix escape?  currently only used for  #{ push trace 'traceId' #}

//			vt += it.proceed();
//			var endToken = t
//			vt += t
//			
//			while(true)
//			{
//				t = it.simpleGet()
//				if(t == undefined) {
//					tthrow('Missing end of quote')
//				} else if(t === _backslash) {	// here we might want to do some better escaping (now just assuming lua and js are the same)
//					vt += t + it.simpleGet()
//				} else if(t === endToken) {
//					break
//				} else {
//					vt += t
//				}
//			}
//			vt += t
			
		}
		else if (t === _not)			{ trace('ParseExpr not '    ); vt += it.proceed(); r = parseExpr(10); v = !r.value; vt = backend.not + r.out }
		else if	(t === _sub)			{ trace('ParseExpr unary - '); vt += it.proceed(); r = parseExpr(10); v = -r.value; vt = ' - ' + r.out }
		else if	(t === _new) 			{
			trace('ParseExpr new '    )

			vt += it.proceed()
			var classT = it.peek()
			if(nameSpace[classT] === undefined) { tthrow('new, not found in namespace '+classT) }

			meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : classT })

			v = undefined
			vt += backend._new[0].split('!NAME!').join((nameSpace[classT].dnativeName || classT))
			vt += it.proceed()
			if(backend.trackTypes) { retr.llType = classT }

			if(it.peek() == _parenthesesB) {
				vt += it.proceed()
				while(true) {
					if(it.peek() == _parenthesesE) { break }					
					if(it.peek() == undefined) { tthrow('new, Missing end of constructor parameterlist') }
					r = parseExpr(1)
					vt += r.out
					r = parseCommaSeparator(_parenthesesE)
					if(r) { vt += r }
					else { break }
				}
				vt += it.proceed()
			}		
			vt += backend._new[1]

		} else if	(t === _func || t === _class || t === '__dscript__statementFuncDef') {
			trace('ParseExpr() '+t); 
			var isClass = t === _class
			var backend_wrap = isClass && backend._class ? backend._class : backend._func
			var isStatementDef = t === '__dscript__statementFuncDef'
			var funcMetaData = {args:[], name:recentAssignmentVar}
			if(backend.needToMoveFunctions) {
				vt += backend_wrap[0].split('!NAME!').join(recentAssignmentVar)
			} else {
				vt += backend_wrap[0]
			}
			vt += it.proceed()
			t = it.peek()
			if(isClass) {
				currentClassStack.push(recentAssignmentVar)
				pushSpecialCodePoint()
			}
			retr.typ = isClass ? 'class' : 'func'
			nameSpaceBlockBegin(recentAssignmentVar, true)
			if(isStatementDef) {
				if(it.peek() === _parenthesesB) {
					vt += it.proceed()
					t = it.peek()
				} else {
					tthrow('ParseExpr statement func: expected beginning paranthesis')
				}
			}
			var argsTerminator = isStatementDef ? _parenthesesE : _curlyB
			while(t != argsTerminator) {
				if(t == undefined) tthrow('ParseExpr func: unexpected end, expected function parameters');
				vt += it.proceed();

				var nextIsBlockStart = it.peek() == argsTerminator
				var nextIsComma = it.peek() == _comma
				var llType = backend.funcNeedsTypes ? backend.llTypes.number : undefined
				var tmpws = ''
				if(!nextIsBlockStart && !nextIsComma) {
					// t is optional type info
					if(backend.funcNeedsTypes) {
						llType = backend.llTypes[t] ? backend.llTypes[t] : t
					}
					t = it.peek()
					tmpws = it.proceed();
					nextIsBlockStart = it.peek() == argsTerminator
					nextIsComma = it.peek() == _comma
				}
				if(backend.funcNeedsTypes) {
					vt += llType + ' ';
				}
				vt += tmpws;
				
				pushToNameSpace(t, llType)
				funcMetaData.args.push({name:t, type:llType})
				vt += t
				trace('ParseExpr() func arg ' + t); 
				
				if(nextIsBlockStart) {
					break
				}
				
				if(!nextIsComma) tthrow('ParseExpr func: expected comma')
				vt += it.proceed()
				vt += ','
				
				t = it.peek()
			}
			if(argsTerminator === _parenthesesE) {
				vt += it.proceed();
			}
			var isOneLiner = isStatementDef && it.peek() == _assignment
			vt += it.proceed();
			
			trace('ParseExpr() func bodystart'); 
			vt += backend_wrap[1] + getDbgFuncStart(recentAssignmentVar)

			if(isClass) {
				pushToNameSpace('this', recentAssignmentVar)
				if(backend._this) { nameSpace['this'].dnativeName = backend._this }
				if(backend.closureAsClass) {
					vt += ';' + backend._localvar + (nameSpace['this'].dnativeName || 'this') + ' = ' + backend._tableliteral[0] + backend._tableliteral[2] + ';'					
				}
			}
			
			r = parseBlock(1, retr.typ, isOneLiner); 

			if(!isClass) {
				var rty = getCurrentReturnTypeArray()
				if(rty) {
					if(backend.funcNeedsTypes) {
						for(var i = 1; i < rty.length; i++) { if(rty[i] != rty[0]) { tthrow('ParseExpr func, backend does not support multiple return types') } }						
					}
					if(rty[0] == undefined) {
						if(backend.funcNeedsTypes) vt = backend._localvar + vt   // void
					} else {
						if(backend.funcNeedsTypes) {
							if(typeof rty[0] === 'object') {
								vt = rty[0].t + ' ' + vt
							} else {
								vt = rty[0] + ' ' + vt
							}
						}
						funcMetaData.returnType = rty[0]
					}
				} else {
					if(backend.funcNeedsTypes) vt = backend._localvar + vt       // void
				}
			}

//			if(recentAssignmentVar === 'complex_complex__mul') {
//				debugger
//			}
			
			if(!isOneLiner) {
				if(it.peek() != _curlyE) tthrow('ParseExpr func: expected } at end of function')
				vt += it.proceed()				
			}
			
			vt += r.out
			
			vt += backend_wrap[3]

			if(isOneLiner) {
				vt += it.proceed(true)												
			}

			nameSpaceBlockEnd()
			if(isClass) {
				vt += getCodeForSpecialPoint()				
				if(backend_wrap[4]) {
				  vt += backend_wrap[4].split('!NAME!').join(recentAssignmentVar)
				} 
				popSpecialCodePoint()
				currentClassStack.pop()
				if(backend.trackTypes) { retr.llType = {t:recentAssignmentVar, funcMetaData:funcMetaData, isStatementDef:isStatementDef } }
			} else {
				if(backend.trackTypes) { retr.llType = {t:'func', funcMetaData:funcMetaData, isStatementDef:isStatementDef } }				
			}

//					v = r.value; 
			trace('ParseExpr() func end '+vt); 
		} else if (t === _parenthesesB) {
			trace('ParseExpr() ')
			vt += it.proceed()
			r = parseExpr(1)
			v = r.value	
			if(backend.trackTypes) { retr.llType = r.llType }
			t=it.peek()
			vt += it.proceed()
			if(!(t === _parenthesesE))
				tthrow("parseExpr() Expected ')' found "+t);
			vt = '(' + r.out + ')'

			// make table driven??
		} else if (t === _nil  ) { trace('ParseExpr() nil'  ); vt += it.proceed(); vt += backend._nil;   v = undefined;
		} else if (t === _true ) { trace('ParseExpr() true' ); vt += it.proceed(); vt += backend._true;  v = true;
		} else if (t === _false) { trace('ParseExpr() false'); vt += it.proceed(); vt += backend._false; v = false;
		} else {
			vt = '' ; lastDbgLine = undefined // not very elegant 
			vt += it.proceed();
			v = parseFloat(t)
			if(isNaN(v)) {
				trace('ParseExpr() found symbol ' + t)
				var nextIsAssign = nextIsAssignment()
				var handleAssert = false
				var handleTrace = false
				var localVar = ''
				var createdVar = false
				if(t.charAt(0) == 'g' && t.charCodeAt(1) <= 90 && t.charCodeAt(1) >= 65) {
					globalDecl = true
				}
				if(nameSpace[t]) {
					if(globalDecl) {
						if(!nameSpace[t].global) {
							tthrow('Already defined as non-global : ' + t)
						}
					}
					if(nameSpace[t].global) {
						if(nameSpace[t].api && specialDecl != 'api' && nextIsAssign) {
							// api are const, so they cannot be overwritten, instead we push a local var, do we want a warning for this?
							trace('ParseExpr create local (shadowing api func) in nameSpace: ' +  t)
							pushToNameSpace(t)
							createdVar = true
							localVar = backend._localvar
						} else {
							meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : t, write : nextIsAssign })					
						}
					}
					v = nameSpace[t].value
					if(backend.trackTypes) { retr.llType = nameSpace[t].llType }
					trace('ParseExpr exist nameSpace ' +  t + ' = ' + v)
				} else {
					if(nextIsAssign || globalDecl) {
						if(!globalDecl) {
							trace('ParseExpr create in nameSpace: ' +  t)
							pushToNameSpace(t)
							createdVar = true
							localVar = backend._localvar
						} else {
							trace('ParseExpr global in nameSpace: ' +  t)
							createdVar = true
							nameSpace[t] = { value : undefined, global : true, dnativeName : prefix + t }
							if(specialDecl == 'api') { nameSpace[t].api = true }
							meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name :t, write : nextIsAssign })
						}
					} else {
						if(     t == 'assert') { handleAssert = true ; skipAutoReturn = true }
						else if(t == 'trace')  { handleTrace = true  ; skipAutoReturn = true }
						else {
							meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name :t, missing : true })
							tthrow('ParseExpr unknown symbol ' + t)
						}
					}						
				}

				if(handleAssert) {
					if(it.peek() != '(') { throw('assert expected (') }
					var assertCode = ''
					assertCode += it.proceed()
					r = parseExpr(1);
					if(!(it.peek() == ')' || it.peek() == ',')) { throw('assert expected ) or ,    found '+it.peek()) }						
					if(it.peek() == ',') {
						assertCode += it.proceed()
						assertCode += backend._localvar + '__ASSERTA = ' + r.out + ' ; '
						assertCode += it.proceed(true)
						var op = it.parseQuotedString()
						op = op.substring(1,op.length-1)
						var opn = (op === _equals ? backend.equals : (op === _notequals ? backend.notequals : op ) )
						if(it.peek() != ',') { throw('assert expected , (three parameters or one)') }		
						assertCode += it.proceed()
						var r2 = parseExpr(1)
						assertCode += backend._localvar + '__ASSERTB = ' + r2.out + ' ; '
						assertCode += backend._if[0] + backend.not + '(__ASSERTA ' + opn + ' __ASSERTB)' + backend._if[1] // no backend needed ()
						assertCode += prefix + 'dbgAssert(' + JSON.stringify(r.out) + ', "' + opn + '", ' + JSON.stringify(r2.out) + ', ' + '__ASSERTA'  + ', ' + '__ASSERTB'
					} else {
						assertCode += backend._if[0] + backend.not + '(' + r.out + ')' + backend._if[1] // no backend needed ()
						assertCode += prefix + 'dbgAssert(' + JSON.stringify(r.out)
					}
					if(it.peek() != ')') { throw('assert expected ), found ' + it.peek()) }							
					assertCode += ', ' + it.getLine() + ')' + it.proceed()
					assertCode += backend._endif

					if(!currentConfig.release) {
						vt += assertCode
					}

				} else if(handleTrace) {
					if(it.peek() != '(') { throw('trace expected (') }
					vt += it.proceed()
					var traceId = it.peek()
					vt += it.proceed()
					if(it.peek() != ',') { throw('trace expected ,   found '+it.peek()) }						
					vt += it.proceed()
					r = parseExpr(1);
					if(!currentConfig.release && traceEnable[traceId]) {
						vt += 'dw_g_trace(\'' + traceId + '  \'+(' + r.out + '))'
					}
					if(it.peek() != ')') { throw('trace expected ), found ' + it.peek()) }							
					vt += it.proceed()

				} else {
					var symbolName = backend._symbolWrap[0] + (nameSpace[t].dnativeName || t) + backend._symbolWrap[1]
					if(nextIsAssign) {
						var tmp = handleAssignment( nameSpace[t], 'value', t, specialDecl)

						skipAutoReturn = true
						if(createdVar) {
							if(backend.trackTypes) {
								if(tmp.llType)                  { nameSpace[t].llType = tmp.llType }
								else if(tmp.value != undefined) { nameSpace[t].llType = backend.llTypes[getDSType(tmp.value)] }

								if(backend.usesCStyleTypeDefs) {
									var llt = nameSpace[t].llType
									if(typeof llt === 'object') {
										localVar = llt.t + ' '
									} else {
										localVar = llt + ' '
									}
								}
							}
							if(specialDecl === 'expose') { nameSpace[t].exposed = true }
						}

						if(!tmp.codeWasMoved) {
							if(createdVar) {
								if(backend.needMemberDeclaration && currentClassStack.length != 0 && getCurrentFunctionOrClassName() == getCurrentClassName()) {

									// add member to class
									addCodeAtSpecialPoint((specialDecl === 'expose' ? "public:  " : "private: ") + localVar + symbolName + (backend.semicolonInsertion ? ';\n' : '\n'))
									vt += symbolName + tmp.ws + ' = ' + tmp.out									
								} else {
									vt += localVar + symbolName + tmp.ws + ' = ' + tmp.out									
								}									
							} else {
								vt += symbolName + tmp.ws + ' = ' + tmp.out																		
							}
							if(tmp.wrapCode) {
								vt = tmp.wrapCode[0] + vt + tmp.wrapCode[1]
							}
						} else {
							vt = '' // added function or class elsewhere,  we still need to update the namespace with metadata!
						}
					} else {
						if(backend.trackTypes) {
							var didFuncCall = false
							if(typeof retr.llType === 'object') { // is this a function?
								if(it.peek() !== _parenthesesB && retr.llType.isStatementDef) {
									// auto-invoke default param symbols
									var toks = ['(']
									var args = retr.llType.funcMetaData.args
									if(args) {
										for(var i=0; i<args.length; i++) {
											toks.push(args[i].name)
											if(i != args.length-1) {
												toks.push(',')
											}
										}										
									}
									toks.push(')')
									it.injectTokens(toks)
								} else if(it.peek() === _parenthesesB) { // is this a function call
									didFuncCall = true
									
									vt += it.proceed()
									var fparams = parseFunctionParams()	// nameSpace[t].llType.funcMetaData ??

									var tr = resolveTypes(t, fparams.llTypes, fparams.argCode)
									if(tr) {
										vt += tr.useFunc
										retr.llType = tr.llType
									} else {
										vt += symbolName
										retr.llType = nameSpace[t].llType.funcMetaData.returnType
									}

									vt += '('
									for(var i = 0; i < fparams.argCode.length; i++) {
										vt += fparams.argCode[i]
										if(fparams.argSeparator[i]) {
											vt += fparams.argSeparator[i]
										}
									}	
									vt += it.proceed()
									vt += ')'

								}
							} 
							if(!didFuncCall) {
								vt += symbolName
								retr.llType = nameSpace[t].llType
							}
						} else {				
							vt += symbolName
						}
					}
				}
			} else {
				trace('ParseExpr() found number ' + t)
				if(backend.trackTypes) {
					retr.llType = backend.llTypes.number
					if(backend.usesCStyleTypeDefs) {
						if(t.indexOf('.') == -1) {
							t += '.' + (retr.llType == 'float' ? backend.floatSuffix : backend.doubleSuffix)
						} else if(retr.llType == 'float') {
							t += backend.floatSuffix
						}
					}
				}
				vt += t
			}
		}
		
		
		
		
		
		while(true) {
			t = it.peek()
			trace('parseExpr while() peek=' + t)
			
			if(t == undefined || it.peekLineFeed()) { break }
			
			else if	(prec <= 10 && t === _squareB || t === _dot)	{ trace('parseExpr access');
				vt += it.proceed();
				var obj, key
				if(t === _squareB) {
					vt += '['		// no backend needed
					r = parseExpr(1);
					if(v && r.value != undefined) {obj = v; key = r.value; v = v[key]; }
					else v = undefined
					vt += r.out + ']'
					if(!(it.peek() === _squareE)) { tthrow('access expected ]') }
					vt += it.proceed()

					if(backend.trackTypes && backend.llTypes && hardTypes[retr.llType]) {
						var hardType = hardTypes[retr.llType]
						retr.llType = hardType.isMatrix ? 'vec'+hardType.dims : backend.llTypes.number
					}

				} else {
					t = it.peek()
					assertVar(t)
					if(backend.trackTypes && hardTypes[retr.llType]) {
						var hardType = hardTypes[retr.llType]
						// xyzw rgba stpq   
						var whichSet =     {x:0,y:0,z:0,w:0,   r:1,g:1,b:1,a:1, i:1,    s:2,t:2,p:2,q:2} 
						var charToIndex = [{x:0,y:1,z:2,w:3}, {r:0,g:1,b:2,a:3, i:-1}, {s:0,t:1,p:2,q:3}]
						var charToI = charToIndex[whichSet[t[0]]]
						for(var i = 0; i < t.length; i++) {
							var index = charToI[t[i]]
							if(index === undefined)    { tthrow('Error Access '+vt+'.'+t+' no such member in hardType '+retr.llType) }
							if(index >= hardType.dims) { tthrow('Error Access '+vt+'.'+t+' hardType '+retr.llType+' only have '+hardType.dims+' dimensions') }
							if(index === -1) {
								if(retr.llType !== 'complex') { tthrow('Error Access '+vt+'.'+t+', i only allowed for complex type') }
								t = stringReplaceChar(t,i,'g')  // support swizzling for real/imaginary ('r','i') by converting 'i' to 'g'
							}
						}

						if(currentConfig.backend === 'glsl') { // swizzling supported!
							vt += '.' + t
						} else {
							if(t.length === 1) {
								vt += '['+charToI[t[0]]+']'
							} else {
								var identity = hardType.dims === t.length
								var fname = ''
								for(var i = 0; i < t.length; i++) {
									var index = charToI[t[i]]
									fname = fname + index  
									if(identity && index !== i) {
										identity = false
									}
								}
								if(!identity) {
									fname = 'sw2_to_'+fname
									vt = fname+'('+vt+')'
									meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : fname })
								}
							}
						}

						retr.llType = t.length === 1 ? backend.llTypes.number : 'vec' + t.length

						//  myvector.x
						//  myvector[0]
  
						//  myvector.xyx   1*16 2*4 1*1
						//  access(myvector,[0,1,0])
						//  access(myvector,25)

//						"vec2_to_010 = func a { [a[0], a[1], a[0]] }"

//						access(v, id) {	
//							return global_arrays[str].map(function(x) { return myvector[x] })
//							return global_arrays[id](v)
//						}

						//  fn(myvecotr,"xyx") -> fn2(myvecotr,[0,1,0]) ->[x[0],x[1],x[0]]
						//  sw2_to_0     x  r  s
						//  sw2_to_1     y  g  s
						//  sw2_to_00    xx rr ss
						// (sw2_to_01)   xy rg st  identity! no action 
						//  sw2_to_10    yx gr ts
						//  sw2_to_11    yy gg tt
						//  sw2_to_000   xxx rrr sss
						//  sw2_to_001    
						//  sw2_to_010
						//  sw2_to_011
						//  sw2_to_100  
						//  sw2_to_101    
						//  sw2_to_110
						//  sw2_to_111


					} else {
						if(backend._indexDot) {
							vt += backend._indexDot[0] + t + backend._indexDot[1]
						} else {
							vt += '.' + t	// no backend needed
						}						
					}
					vt += it.proceed()
					if(v) {obj = v; key = t; v = v[key]; }
					else v = undefined
				}
				
				if(nextIsAssignment()) {
					//didAssignment = true
					skipAutoReturn = true
					var assig = handleAssignment( obj, key, ''+key)
					vt += assig.ws + ' = ' + assig.out 
					if(assig.wrapCode) {
						vt = assig.wrapCode[0] + vt + assig.wrapCode[1]
					}
				}
			}
			
			else if	(prec < functionCallPrec && t === _parenthesesB)	{ trace('parseExpr call');
				vt += it.proceed();

				var funcMetaData = retr.llType && retr.llType.funcMetaData

				if(funcMetaData) {
					//resolveTypes(funcMetaData.name, fparams.llTypes, fparams.argCode)
					retr.llType = funcMetaData.returnType
				}
					
				var fparams = parseFunctionParams()				
				vt += '('
				for(var i = 0; i < fparams.argCode.length; i++) {
					vt += fparams.argCode[i]
					if(fparams.argSeparator[i]) {
						vt += fparams.argSeparator[i]
					}
				}	
				vt += it.proceed()
				vt += ')'
			}
			
			else if	(prec < 2 && t === _assignment) {
				tthrow('assignment not allowed here') 
			

			} else if (prec <= 2 && t === _if  ) {
				trace('ParseExpr() if'  );
				var tmpws = it.proceed() 
				separateEndWs.push(true)
				var expr = parseExpr(1)
				separateEndWs.pop()			
				if(recentAssignmentVar) {
					retr.wrapCode = [backend._if[0] + expr.out + backend._if[1] + tmpws, backend._endif + separateEndWsData]
					if(backend.semicolonInsertion) { vt += ';' } 
				}
				else {
					vt = backend._if[0] + expr.out + backend._if[1] + tmpws + vt + (backend.semicolonInsertion ? ';' : '') + backend._endif + separateEndWsData
				}
				v = undefined;
			}

			else if(ops[t] && prec < ops[t].prec) {
				var op = ops[t]
				trace('parseExpr ' + op.universalOp)
				vt += it.proceed()
				r = parseExpr(op.prec, false, true)
				var useFunc = op.globalFuncName ? prefix + op.globalFuncName : undefined
				var argCode = [vt, r.out]
				if(backend.trackTypes) {
					var tr = resolveTypes(op.internalName, [retr.llType, r.llType], argCode)
					if(tr) {
						useFunc = tr.useFunc
						retr.llType = tr.llType
					}
				}
				if(useFunc) { 
					meta.connections.push({token : it.getTokenPos(), line : it.getLine(), name : useFunc })
					vt = useFunc + '(' + argCode[0] + ', ' + argCode[1] + ')'
				} else {
					vt += (backend[op.internalName] || backend[op.internalName2] || op.universalOp) + r.out				
				}
				v = op.valueFunc(v, r.value)
			}
/*
			else if	(prec < 5 && t === _and)		{ trace('parseExpr and'); vt += it.proceed(); r = parseExpr(5); v = v && r.value; vt += backend._and + r.out }
			else if	(prec < 5 && t === _or)			{ trace('parseExpr or '); vt += it.proceed(); r = parseExpr(5); v = v || r.value; vt += backend._or + r.out }

			else if	(prec < 5 && t === _andif)		{ trace('parseExpr and'); vt += it.proceed(); r = parseExpr(5); v = v && r.value; vt += (backend._andif    || backend._and) + r.out }
			else if	(prec < 5 && t === _orelse)		{ trace('parseExpr or '); vt += it.proceed(); r = parseExpr(5); v = v || r.value; vt += (backend._orelse   || backend._or) + r.out }
			else if	(prec < 5 && t === _fallback)	{ trace('parseExpr ?: '); vt += it.proceed(); r = parseExpr(5); v = v || r.value; vt += (backend._fallback || backend._or) + r.out }
			
			else if	(prec < 6 && t === _lessThan)	{ trace('parseExpr <'  ); vt += it.proceed(); r = parseExpr(6); v = v <  r.value; vt += ' < ' + r.out }
			else if	(prec < 6 && t === _moreThan)	{ trace('parseExpr >'  ); vt += it.proceed(); r = parseExpr(6); v = v >  r.value; vt += ' > ' + r.out }
			else if	(prec < 6 && t === _lessEqual)	{ trace('parseExpr <=' ); vt += it.proceed(); r = parseExpr(6); v = v <= r.value; vt += ' <= ' + r.out }
			else if	(prec < 6 && t === _moreEqual)	{ trace('parseExpr >=' ); vt += it.proceed(); r = parseExpr(6); v = v >= r.value; vt += ' >= ' + r.out }
			else if	(prec < 6 && t === _equals)		{ trace('parseExpr ==' ); vt += it.proceed(); r = parseExpr(6); v = v == r.value; vt += backend._equals + r.out }
			else if	(prec < 6 && t === _notequals)	{ trace('parseExpr !=' ); vt += it.proceed(); r = parseExpr(6); v = v != r.value; vt += backend._notequals + r.out }
			
//					else if	(prec < 7 && t === _concat)		{ trace('parseExpr ..' ); vt += it.proceed(); r = parseExpr(7); v += r.value; vt += backend._concat + r.out }
			else if	(prec < 7 && t === _concat)		{ trace('parseExpr ..' ); vt += it.proceed(); r = parseExpr(7,false,true); v += r.value; vt = prefix + 'concat(' + vt + ', ' + r.out + ')'  }

//					else if	(prec < 8 && t === _add)		{ trace('parseExpr add'); vt += it.proceed(); r = parseExpr(8,false,true); v += r.value; vt = ' (( '+vt+' + '+r.out+' )) ' }
			else if	(prec < 8 && t === _add)		{ trace('parseExpr add'); vt += it.proceed(); r = parseExpr(8); v += r.value; vt += ' + ' + r.out }
			else if	(prec < 8 && t === _sub)		{ trace('parseExpr sub'); vt += it.proceed(); r = parseExpr(8); v -= r.value; vt += ' - ' + r.out }
//					else if	(prec < 8 && t[0] == '-')		{ trace('parseExpr special sub');             r = parseExpr(8); v += r.value; vt += ' '   + r.out } // special case to handle '1 -1'

			else if	(prec < 9 && t === _mod)		{ trace('parseExpr %'  ); vt += it.proceed(); r = parseExpr(9); v %= r.value; vt += ' % ' + r.out }

//					else if	(prec < 9 && t === _mul)		{ trace('parseExpr *'  ); vt += it.proceed(); r = parseExpr(9,false,true); v *= r.value; vt = ' ('+vt+'*'+r.out+') ' }
			else if	(prec < 10 && t === _mul)		{ trace('parseExpr *'  ); vt += it.proceed(); r = parseExpr(10); v *= r.value; vt += ' * ' + r.out }
			else if	(prec < 10 && t === _div)		{ trace('parseExpr /'  ); vt += it.proceed(); r = parseExpr(10); v /= r.value; vt += ' / ' + r.out }
*/
			
			else if	(t === _comma)					{ trace('parseExpr comma'); /*vt += it.proceed(); expectMore = true; prec = 0; vt += ',';*/ break; }
			else if	(t === _semicolon)				{ trace('parseExpr semic'); /*vt += it.proceed(); expectMore = true; prec = 0; vt += ';';*/ break; }
			else if	(t === _curlyB)					{ trace('parseExpr curlyBrace begin'); /*vt += it.proceed(); expectMore = true; prec = 0; vt += ';';*/ break; }
			else if	(t === _curlyE)					{ trace('parseExpr curlyBrace end'); /*vt += it.proceed(); expectMore = true; prec = 0; vt += ';';*/ break; }
			else
				break

		}

		if(!skipWhiteFlush) {
			var tmpws = it.proceed(true)
			var detectedEndOfExpr = tmpws.indexOf('\n') != -1
			if(detectedEndOfExpr && separateEndWs[separateEndWs.length-1]) {
				separateEndWsData = tmpws
			} else {
				vt += backend.semicolonInsertion && detectedEndOfExpr ? ';' + tmpws : tmpws
			}
		}

		var opt = (opt && !isNaN(v))
		var outstr = opt ? v : vt

	
		trace('parseExpr() end ' + v + ' ' + outstr)

		retr.value = v 
		retr.out = outstr
		retr.flat = opt
//		if(didAssignment) { retr.assign = true }
		if(skipAutoReturn) { retr.skipAutoReturn = true }
		return retr
	}
/*		
 var v;
 skipW(p);
 switch(p[0][p[1]]) {
  case undefined: throw "Unexpected end of string";
  case '-': p[1]++; v = evaluate(p, 3); v = -v; break;
  case '(': p[1]++; v = evaluate(p, 0); if (p[0][p[1]] != ')') throw "Expected ')'"; p[1]++; break;
  default: v = parseNr(p); break;
 }
 skipW(p); 
 var loop,r;
 do {
  loop = 0;
  switch (p[0][p[1]]) {
   case '+': if (prec < 1) { p[1]++; r = evaluate(p, 1); v += r; loop = 1; } break;
   case '-': if (prec < 1) { p[1]++; r = evaluate(p, 1); v -= r; loop = 1; } break;
   case '*': if (prec < 2) { p[1]++; r = evaluate(p, 2); v *= r; loop = 1; } break;
   case '/': if (prec < 2) { p[1]++; r = evaluate(p, 2); v /= r; loop = 1; } break;
  }
 } while (loop);
 skipW(p);
 return v;
 */
	
	var parseInternal
	var parse = function(text, ttfId_) {
		ttfId = ttfId_ || 'test'
		configRealize()		
		return parseInternal(text)
	}
	parseInternal = function(text) {
		trace("parse")
		opt = currentConfig.optimize
		var tokens = parseToTokens([text,0])
		it = createTokIterator(tokens)
		meta = { connections : [], deps : [] }
		initTokens()								// TODO opt: createTokIterator + initTokens should not be needed unless backend has changed
		it.setCommentBackend(backend._comments)
		it.resetPos()
		traceReset()

		var retf = function() {
			// undo writing globals to namespace?
		}
		
		var r
		var dbgInit
		var func_list = ''
		try { // tryCall
			if(nameSpaceStack.length != 0) { retf(); return { error: "parse() nameSpaceStack.length != 0" } }
			nameSpaceBlockBegin()
			pushSpecialCodePoint()
			
			dbgInit = getDbgFuncStart('INIT_' + ttfId) // need to be here since it pushes the name to dbgCurName
			r = parseBlock(1, backend.dontParseGlobalScopeAsFunc ? undefined : 'func')
			if(it.peek() != undefined) {
				tthrow('parse() did not expect ' + it.peek())
			} 

			func_list = getCodeForSpecialPoint()
			popSpecialCodePoint()
			nameSpaceBlockEnd()
			if(nameSpaceStack.length != 0) { retf(); return { error: "parse() nameSpaceStack.length != 0" } }
		} catch(err) {
			while(nameSpaceStack.length != 0) {
				nameSpaceBlockEnd()
			}
			dbgCurName = []
			retf(); 
			return { error: err }
		}
		retf(); 
		meta.comments = it.getCommentsRanges()
		return { dnative : backend._parseWrap[0] + func_list + dbgInit + r.out + backend._parseWrap[1], meta : meta }
	}
	
	var registerGlobal = function(name, dnativeName, metaData) {
		configRealize()
		if( nameSpace[name] && (typeof nameSpace[name] == 'object') ) { // since we have toString as a global, it clashes here with the prototyped function of object
			alert('registerGlobal() already registered:' + name + ' as ' +(nameSpace[name] && nameSpace[name].dnativeName))
		}
		nameSpace[name] = metaData || { t : 'function' }
		nameSpace[name].dnativeName = dnativeName
		nameSpace[name].global = true
	}
	
	return {
		parse : parse,
		setConfig : setConfig,
		registerGlobal : registerGlobal,
		generateCodeForDependencies : generateCodeForDependencies,
		generateCodeForInternalLib : generateCodeForInternalLib,
		enableTrace : enableTrace,
		isTraceEnabled : isTraceEnabled
	}
}









/*

  Dimwold glue

  todo? - the gain of overriding of setGlobal to update metadata does not seem to justify the complexity. 

*/
var createDScript
createDScript = function(runtime, release) {
	var prefix = runtime.prefix

	var parserContext = createParserContext({prefix : prefix, release : release})

	var ttfOrderCounter = 1
	var globalMeta = runtime.globalMeta

	var textToFunc = function (text, ttfId) {
		if(!ttfId) {
			ttfId = 'textToFunc'+(ttfOrderCounter + 1)
		}
		var r = parserContext.parse(text, ttfId)
		if(!r.dnative) {
			return r
		}
//		var missing = []
//		var globalConnections = r.meta.connections
//		for(var i = 0; i < globalConnections.length; i++) {
//			if(!globalConnections[i].write && runtime.getGlobal(globalConnections[i].name) === undefined) {
//				missing.push(globalConnections[i].name)
//			}
//		}
//		if(missing.length > 0) {
//			parserContext.generateCodeForDependencies(missing)
//		}
		ttfOrderCounter = ttfOrderCounter + 1
		r.orderId = ttfOrderCounter  // globalMeta should have orderId / meta connections /  functionCallCount
		r.functionCallCount = {}
		r.dscript = text
		globalMeta[ttfId] = r
		var r2 = dw_g_dnativeTextToFunc(r.dnative)
		if(r2.error) { r.error = r2.error
		} else { r.func = r2.func}
		return r
	}

	// test compilation backend and create a ttfId for dscript itself
	var res = textToFunc('//dscript', 'dscript') 
	if(res.error) { throw('createDScript() error '+res.error) }
	globalMeta.dscript.meta.connections.push({line : 0, name : "textToFunc", token : 0, write : true})
	globalMeta.dscript.meta.connections.push({line : 0, name : "createDScript", token : 0, write : true})
	
	var oldSetGlobal = runtime.setGlobal
	var newSetGlobal = function(k, v, meta) {
		oldSetGlobal(k, v)

		if(meta) {
			if(globalMeta[meta.ttfId] == undefined) {
				// this (only?) happens when dscript is deployed with iolib funcs compiled into dw_app_main.js
				ttfOrderCounter = ttfOrderCounter + 1
				globalMeta[meta.ttfId] = { orderId : ttfOrderCounter, meta : { connections : [] }, functionCallCount : {} }
			}
			globalMeta[meta.ttfId].meta.connections.push({line : meta.ls, name : k, write : true, fromSetGlobal : true })
		}

		parserContext.registerGlobal(k, prefix + k)	// add future globals to parserContext
	}
	oldSetGlobal('setGlobal', newSetGlobal)  // replace old func with new
	runtime.setGlobal = newSetGlobal         // replace old func with new


	// add current globals to parserContext  (including the function setGlobal we just replaced (using the old function))
	runtime.enumGlobals(function(name) { parserContext.registerGlobal(name, prefix + name) })

	var globs = {}
	globs.textToFunc = textToFunc          // this is how the parser can do parsing in its own context
	globs.createDScript = createDScript
//	globs.toDNative = parserContext.parse  // this is how the parser can do parsing in its own context
//	globs.setParserConfig = parserContext.config
	globs.parserContext = parserContext
	globs.gParserContext = parserContext
	runtime.registerGlobals(globs)

	var libcode = parserContext.generateCodeForInternalLib()
	dw_g_dnativeTextToFunc(libcode)

	
	return parserContext
}




  // Global Writes:
  self.dw_g_createDScriptParser = createParserContext
  self.dw_g_createDScript = createDScript


})()