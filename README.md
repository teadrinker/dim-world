![dimworld logo](dim-world-logo.jpg)

# Dim World - Experimental App Framework

2010-2014, I tried to build a web based application framework.
The idea was to do as much as possible in client-side js, and
then have a very thin php backend (~300 lines)

The whole endevor was centered around dscript, an experimental transpiler.
The only project developed using this framework was [Spine](https://github.com/teadrinker/spine) which was also abandoned.

I'm releasing this along with Spine, since it's still seems to work (put folder in xampp htdocs/dw), and
I used it make some fixes and changes making the Spine presentation for [LIVE 2025](https://liveprog.org/)  

# dscript

Dscript is a crude transcompiler (text in, text out).
It generates code using a "backend", which is essentially
a collection of code-snippets. Think automated cut'n paste.

The existing backends are **js, lua, php, cpp and glsl**, but I only
really tested the js one, so don't expect the others to work.

If this seems interesting, you should probably
check out a more mature transpiler like fusion:

* https://fusion-lang.org/	
* https://github.com/fusionlanguage/fut

#### Syntax:
	dscript                 javascript output (white space was adjusted)
	
	n = 1                   var n = 1
	
	global n = 1            ds001_n = 1
	
	xx = nil                var xx = undefined
	
	o = {a = 3}             var o = {a : 3}
	
	o = {a : 3}             var o = {a : 3}
	
	a() = 2                 var a = () => { return 2 } 
	
	b(x,y) = 2*x            var b = (x,y) => { return 2*x } 
	
	b(x,y) { 2*x }          var b = (x,y) => { return 2*x } 
	
	func x,y { 2*x }        (x,y) => { return 2*x }
	
	if a == 2 { }           if(a === 2) { }
	
	a and b or b != c       a && b || b !== c
	
	while false { }         while( false ) { } 
	
	for i * 10  { }         for(var i= 0, __e_i=10        ; i< __e_i;) { ;i=i+1} 
	
	for i = -6,6,2 { }      for(var i=-6, __e_i=6, __s_i=2; i<=__e_i;) { ;i=i+__s_i}
	
	for v in [ 3 ] { }      ds001_forV( [ 3 ] , (v) => {  }) // v will be 3
	
	for v in {a:3} { }      ds001_forV( {a:3} , (v) => {  }) // v will be 3

	for k, v in {a:3} { }   ds001_forK( {a:3} , (k, v) => {  }) // k will be 'a', v will be 3

you can iterate over both keys and values using:

	for k,v in {a:3} { }    // k == 'a', v == 3
	for k,v in [3]   { }    // k ==  0 , v == 3

Looping over an array will give you keys with a number
type (unlike javascript which gives you strings)


#### More nice things: 

 * Transforms comments and keeps whitespace,
   -the transcompiled code looks similar to original code.

 * JSON can be pasted in and used as is (like js)

 * It is ok to omit commas when defining
   multi-line literals for arrays and objects

		myObj = {
			name : 'Turing'
			table : [
				{ val1 : 'a', val2 : 'b' }
				{ val1 : 'c', val2 : 'd' }
			]
			profession : 'computer scientist'
		}

 * It is fine to use = instead of : when defining
   object-literals (unifying key / variable definition)

		myObj = {
		  name = 'Turing'
		}

 * Multi-line string literals using triple quotes

		htmlpage = '''
		<html>
		  <body>
			Hello World! 
		  </body>
		</html>'''

 * C-Style assert() that is stripped when building release.
   There is also an assert with 3 arguments, when triggered,
   it will show you the value which caused the assert.

		assert(someVariable, '>', 1000)

 * C-style tracing, with configurable meta types.
   Stripped when building release so you can leave
   development tracing in the code.

		trace(gui,'Trace something gui-related...')

 * Function hooks, automatically generate extra calls
   for every function begin / function end, useful for 
   debugging and monitoring. (Also stripped on release) 
   I use this to store a (limited) call log in memory, and
   on exception/error, I display this log.

		adder = func a,b {
			return a + b
		}

   will generate something like:

		var adder = function(a,b) { dwds___fb("parseCallId",1,"adder");
			return dwds___fe( a + b
		,"parseCallId",3,"adder");}




### Unfinished / Experimental Type Support

Dscript tracks names, types and metadata (such as global
read and write dependencies) along the way and keeps a 
namespace state in the parser context. Using the C++/GLSL
backend, it will try to infer types. It also support the
maths type complex and the GLSL-inspired vec2/vec3/vec4 
through a kind of operator-overloading by naming-convention:

#### Examples:

		   vec2(1,2) * vec2(3,4)
	
	js:    vec2_vec2__mul([1, 2] ,  [3, 4]) 
	
	GLSL:  vec2(1.0, 2.0) * vec2(3.0, 4.0); 
	
	
		   vec3(1,2,3) * 4     
	
	js:    vec3_vec3__mul([1, 2, 3] , number_to_vec3( 4))
	
	GLSL:  vec3(1.0, 2.0, 3.0) * 4.0;
	
	
		   4 * complex(5,6)
	
	js:    complex_complex__mul(number_to_complex(4 ),  [5, 6])
	
	GLSL:  complex_complex__mul(float_to_complex(4.0 ),  vec2(5.0, 6.0));


### Standard Library Philosophy
To make the overall code simpler and more portable,
global functions are preferred over member functions
for all basic types. (defined in dw_io_simple.js)

	len(myArray)
	push(myArray, 'newValue')
	type(o) // will return the type as a string
			// The names of the types are:
			//
			//     nil number bool string
			//       array table func

Global variables are stored in the javascript context,
but they are prefixed, so you can have multiple Dscript
contexts in the same js-context without collisions.

Plain closures are preferred for higher level contructs
There is nothing similar to the js object model, however there
is a class construction, which basically works like a closure:

	myClass = class arg {
		  privateVar1 = this
		  privateVar2 = 'example'
		  privateFunc(x) = arg + x
		  expose publicFunc = func { privateFunc(2) }
	}

	instance = new myClass(3)
	instance.publicFunc()


compiles to

	var myClass  = function(  arg ) {;var _This = {};
		var privateVar1  =  _This    
		var privateVar2  =  'example'
		var privateFunc = function(x ) {  return arg + x} 
		var publicFunc  = function(  ) {  return privateFunc(2) } 
	;_This.publicFunc = publicFunc ;  return _This} 
	
	var instance  =  myClass( 3)
	instance.publicFunc()


but, in C++:

	class myClass_cppc { public: myClass_cppc::myClass_cppc(  double arg ) {
		  privateVar1  =  this;
		  privateVar2  =  "example";
		  ; }
	  private: myClass privateVar1;
	  private: std::string privateVar2;
	  private: double  privateFunc (double x ) {  return arg + x;; } 
		  public:  double  publicFunc (  ) {  return privateFunc(2.0) ; } ;
	};
	  typedef std::shared_ptr<myClass_cppc> myClass;

	  myClass instance  =  std::shared_ptr<myClass_cppc>(new myClass_cppc( 3.0));
	instance->publicFunc()


Note that this fails to compile in a c++ compiler.
Still, a good example of how it works, and the deplorable state of the functionality...

