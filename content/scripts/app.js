var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____3162 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____3162)) {
    return or__3548__auto____3162
  }else {
    var or__3548__auto____3163 = p["_"];
    if(cljs.core.truth_(or__3548__auto____3163)) {
      return or__3548__auto____3163
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__3227 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3164 = this$;
      if(cljs.core.truth_(and__3546__auto____3164)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3164
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____3165 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3165)) {
          return or__3548__auto____3165
        }else {
          var or__3548__auto____3166 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3166)) {
            return or__3548__auto____3166
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__3228 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3167 = this$;
      if(cljs.core.truth_(and__3546__auto____3167)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3167
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____3168 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3168)) {
          return or__3548__auto____3168
        }else {
          var or__3548__auto____3169 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3169)) {
            return or__3548__auto____3169
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3229 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3170 = this$;
      if(cljs.core.truth_(and__3546__auto____3170)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3170
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____3171 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3171)) {
          return or__3548__auto____3171
        }else {
          var or__3548__auto____3172 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3172)) {
            return or__3548__auto____3172
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__3230 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3173 = this$;
      if(cljs.core.truth_(and__3546__auto____3173)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3173
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____3174 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3174)) {
          return or__3548__auto____3174
        }else {
          var or__3548__auto____3175 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3175)) {
            return or__3548__auto____3175
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__3231 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3176 = this$;
      if(cljs.core.truth_(and__3546__auto____3176)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3176
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____3177 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3177)) {
          return or__3548__auto____3177
        }else {
          var or__3548__auto____3178 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3178)) {
            return or__3548__auto____3178
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__3232 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3179 = this$;
      if(cljs.core.truth_(and__3546__auto____3179)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3179
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____3180 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3180)) {
          return or__3548__auto____3180
        }else {
          var or__3548__auto____3181 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3181)) {
            return or__3548__auto____3181
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__3233 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3182 = this$;
      if(cljs.core.truth_(and__3546__auto____3182)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3182
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____3183 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3183)) {
          return or__3548__auto____3183
        }else {
          var or__3548__auto____3184 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3184)) {
            return or__3548__auto____3184
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__3234 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3185 = this$;
      if(cljs.core.truth_(and__3546__auto____3185)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3185
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____3186 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3186)) {
          return or__3548__auto____3186
        }else {
          var or__3548__auto____3187 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3187)) {
            return or__3548__auto____3187
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__3235 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3188 = this$;
      if(cljs.core.truth_(and__3546__auto____3188)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3188
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____3189 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3189)) {
          return or__3548__auto____3189
        }else {
          var or__3548__auto____3190 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3190)) {
            return or__3548__auto____3190
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__3236 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3191 = this$;
      if(cljs.core.truth_(and__3546__auto____3191)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3191
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____3192 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3192)) {
          return or__3548__auto____3192
        }else {
          var or__3548__auto____3193 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3193)) {
            return or__3548__auto____3193
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__3237 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3194 = this$;
      if(cljs.core.truth_(and__3546__auto____3194)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3194
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____3195 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3195)) {
          return or__3548__auto____3195
        }else {
          var or__3548__auto____3196 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3196)) {
            return or__3548__auto____3196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__3238 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3197 = this$;
      if(cljs.core.truth_(and__3546__auto____3197)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3197
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____3198 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3198)) {
          return or__3548__auto____3198
        }else {
          var or__3548__auto____3199 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3199)) {
            return or__3548__auto____3199
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__3239 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3200 = this$;
      if(cljs.core.truth_(and__3546__auto____3200)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3200
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____3201 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3201)) {
          return or__3548__auto____3201
        }else {
          var or__3548__auto____3202 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3202)) {
            return or__3548__auto____3202
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__3240 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3203 = this$;
      if(cljs.core.truth_(and__3546__auto____3203)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3203
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____3204 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3204)) {
          return or__3548__auto____3204
        }else {
          var or__3548__auto____3205 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3205)) {
            return or__3548__auto____3205
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__3241 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3206 = this$;
      if(cljs.core.truth_(and__3546__auto____3206)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3206
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____3207 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3207)) {
          return or__3548__auto____3207
        }else {
          var or__3548__auto____3208 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3208)) {
            return or__3548__auto____3208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__3242 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3209 = this$;
      if(cljs.core.truth_(and__3546__auto____3209)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3209
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____3210 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3210)) {
          return or__3548__auto____3210
        }else {
          var or__3548__auto____3211 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3211)) {
            return or__3548__auto____3211
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__3243 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3212 = this$;
      if(cljs.core.truth_(and__3546__auto____3212)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3212
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____3213 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3213)) {
          return or__3548__auto____3213
        }else {
          var or__3548__auto____3214 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3214)) {
            return or__3548__auto____3214
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__3244 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3215 = this$;
      if(cljs.core.truth_(and__3546__auto____3215)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3215
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____3216 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3216)) {
          return or__3548__auto____3216
        }else {
          var or__3548__auto____3217 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3217)) {
            return or__3548__auto____3217
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__3245 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3218 = this$;
      if(cljs.core.truth_(and__3546__auto____3218)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3218
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____3219 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3219)) {
          return or__3548__auto____3219
        }else {
          var or__3548__auto____3220 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3220)) {
            return or__3548__auto____3220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__3246 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3221 = this$;
      if(cljs.core.truth_(and__3546__auto____3221)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3221
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____3222 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3222)) {
          return or__3548__auto____3222
        }else {
          var or__3548__auto____3223 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3223)) {
            return or__3548__auto____3223
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__3247 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3224 = this$;
      if(cljs.core.truth_(and__3546__auto____3224)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3224
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____3225 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3225)) {
          return or__3548__auto____3225
        }else {
          var or__3548__auto____3226 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3226)) {
            return or__3548__auto____3226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__3227.call(this, this$);
      case 2:
        return _invoke__3228.call(this, this$, a);
      case 3:
        return _invoke__3229.call(this, this$, a, b);
      case 4:
        return _invoke__3230.call(this, this$, a, b, c);
      case 5:
        return _invoke__3231.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__3232.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__3233.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__3234.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__3235.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__3236.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__3237.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__3238.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__3239.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__3240.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__3241.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__3242.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__3243.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__3244.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__3245.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__3246.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__3247.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3249 = coll;
    if(cljs.core.truth_(and__3546__auto____3249)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____3249
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____3250 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3250)) {
        return or__3548__auto____3250
      }else {
        var or__3548__auto____3251 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____3251)) {
          return or__3548__auto____3251
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3252 = coll;
    if(cljs.core.truth_(and__3546__auto____3252)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____3252
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____3253 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3253)) {
        return or__3548__auto____3253
      }else {
        var or__3548__auto____3254 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____3254)) {
          return or__3548__auto____3254
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3255 = coll;
    if(cljs.core.truth_(and__3546__auto____3255)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____3255
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____3256 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3256)) {
        return or__3548__auto____3256
      }else {
        var or__3548__auto____3257 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____3257)) {
          return or__3548__auto____3257
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__3264 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3258 = coll;
      if(cljs.core.truth_(and__3546__auto____3258)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3258
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____3259 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3259)) {
          return or__3548__auto____3259
        }else {
          var or__3548__auto____3260 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3260)) {
            return or__3548__auto____3260
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3265 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3261 = coll;
      if(cljs.core.truth_(and__3546__auto____3261)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3261
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____3262 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3262)) {
          return or__3548__auto____3262
        }else {
          var or__3548__auto____3263 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3263)) {
            return or__3548__auto____3263
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__3264.call(this, coll, n);
      case 3:
        return _nth__3265.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3267 = coll;
    if(cljs.core.truth_(and__3546__auto____3267)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____3267
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____3268 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3268)) {
        return or__3548__auto____3268
      }else {
        var or__3548__auto____3269 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____3269)) {
          return or__3548__auto____3269
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3270 = coll;
    if(cljs.core.truth_(and__3546__auto____3270)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____3270
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____3271 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3271)) {
        return or__3548__auto____3271
      }else {
        var or__3548__auto____3272 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____3272)) {
          return or__3548__auto____3272
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__3279 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3273 = o;
      if(cljs.core.truth_(and__3546__auto____3273)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3273
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____3274 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3274)) {
          return or__3548__auto____3274
        }else {
          var or__3548__auto____3275 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3275)) {
            return or__3548__auto____3275
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3280 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3276 = o;
      if(cljs.core.truth_(and__3546__auto____3276)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3276
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____3277 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3277)) {
          return or__3548__auto____3277
        }else {
          var or__3548__auto____3278 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3278)) {
            return or__3548__auto____3278
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__3279.call(this, o, k);
      case 3:
        return _lookup__3280.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3282 = coll;
    if(cljs.core.truth_(and__3546__auto____3282)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____3282
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____3283 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3283)) {
        return or__3548__auto____3283
      }else {
        var or__3548__auto____3284 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3284)) {
          return or__3548__auto____3284
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3285 = coll;
    if(cljs.core.truth_(and__3546__auto____3285)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____3285
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____3286 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3286)) {
        return or__3548__auto____3286
      }else {
        var or__3548__auto____3287 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____3287)) {
          return or__3548__auto____3287
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3288 = coll;
    if(cljs.core.truth_(and__3546__auto____3288)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____3288
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____3289 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3289)) {
        return or__3548__auto____3289
      }else {
        var or__3548__auto____3290 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____3290)) {
          return or__3548__auto____3290
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3291 = coll;
    if(cljs.core.truth_(and__3546__auto____3291)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____3291
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____3292 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3292)) {
        return or__3548__auto____3292
      }else {
        var or__3548__auto____3293 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____3293)) {
          return or__3548__auto____3293
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3294 = coll;
    if(cljs.core.truth_(and__3546__auto____3294)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____3294
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____3295 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3295)) {
        return or__3548__auto____3295
      }else {
        var or__3548__auto____3296 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____3296)) {
          return or__3548__auto____3296
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3297 = coll;
    if(cljs.core.truth_(and__3546__auto____3297)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____3297
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____3298 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3298)) {
        return or__3548__auto____3298
      }else {
        var or__3548__auto____3299 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____3299)) {
          return or__3548__auto____3299
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3300 = coll;
    if(cljs.core.truth_(and__3546__auto____3300)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____3300
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____3301 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3301)) {
        return or__3548__auto____3301
      }else {
        var or__3548__auto____3302 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____3302)) {
          return or__3548__auto____3302
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3303 = o;
    if(cljs.core.truth_(and__3546__auto____3303)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____3303
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____3304 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3304)) {
        return or__3548__auto____3304
      }else {
        var or__3548__auto____3305 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____3305)) {
          return or__3548__auto____3305
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3306 = o;
    if(cljs.core.truth_(and__3546__auto____3306)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____3306
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____3307 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3307)) {
        return or__3548__auto____3307
      }else {
        var or__3548__auto____3308 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____3308)) {
          return or__3548__auto____3308
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3309 = o;
    if(cljs.core.truth_(and__3546__auto____3309)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____3309
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____3310 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3310)) {
        return or__3548__auto____3310
      }else {
        var or__3548__auto____3311 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____3311)) {
          return or__3548__auto____3311
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3312 = o;
    if(cljs.core.truth_(and__3546__auto____3312)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____3312
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____3313 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3313)) {
        return or__3548__auto____3313
      }else {
        var or__3548__auto____3314 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____3314)) {
          return or__3548__auto____3314
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__3321 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3315 = coll;
      if(cljs.core.truth_(and__3546__auto____3315)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3315
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____3316 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3316)) {
          return or__3548__auto____3316
        }else {
          var or__3548__auto____3317 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3317)) {
            return or__3548__auto____3317
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3322 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3318 = coll;
      if(cljs.core.truth_(and__3546__auto____3318)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3318
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____3319 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3319)) {
          return or__3548__auto____3319
        }else {
          var or__3548__auto____3320 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3320)) {
            return or__3548__auto____3320
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__3321.call(this, coll, f);
      case 3:
        return _reduce__3322.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3324 = o;
    if(cljs.core.truth_(and__3546__auto____3324)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____3324
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____3325 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3325)) {
        return or__3548__auto____3325
      }else {
        var or__3548__auto____3326 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____3326)) {
          return or__3548__auto____3326
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3327 = o;
    if(cljs.core.truth_(and__3546__auto____3327)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____3327
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____3328 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3328)) {
        return or__3548__auto____3328
      }else {
        var or__3548__auto____3329 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____3329)) {
          return or__3548__auto____3329
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3330 = o;
    if(cljs.core.truth_(and__3546__auto____3330)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____3330
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____3331 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3331)) {
        return or__3548__auto____3331
      }else {
        var or__3548__auto____3332 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____3332)) {
          return or__3548__auto____3332
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3333 = o;
    if(cljs.core.truth_(and__3546__auto____3333)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____3333
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____3334 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3334)) {
        return or__3548__auto____3334
      }else {
        var or__3548__auto____3335 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____3335)) {
          return or__3548__auto____3335
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3336 = d;
    if(cljs.core.truth_(and__3546__auto____3336)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____3336
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____3337 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____3337)) {
        return or__3548__auto____3337
      }else {
        var or__3548__auto____3338 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3338)) {
          return or__3548__auto____3338
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3339 = this$;
    if(cljs.core.truth_(and__3546__auto____3339)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____3339
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____3340 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3340)) {
        return or__3548__auto____3340
      }else {
        var or__3548__auto____3341 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____3341)) {
          return or__3548__auto____3341
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3342 = this$;
    if(cljs.core.truth_(and__3546__auto____3342)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____3342
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____3343 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3343)) {
        return or__3548__auto____3343
      }else {
        var or__3548__auto____3344 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3344)) {
          return or__3548__auto____3344
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3345 = this$;
    if(cljs.core.truth_(and__3546__auto____3345)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____3345
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____3346 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3346)) {
        return or__3548__auto____3346
      }else {
        var or__3548__auto____3347 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3347)) {
          return or__3548__auto____3347
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3348 = null;
  var G__3348__3349 = function(o, k) {
    return null
  };
  var G__3348__3350 = function(o, k, not_found) {
    return not_found
  };
  G__3348 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3348__3349.call(this, o, k);
      case 3:
        return G__3348__3350.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3348
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3352 = null;
  var G__3352__3353 = function(_, f) {
    return f.call(null)
  };
  var G__3352__3354 = function(_, f, start) {
    return start
  };
  G__3352 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3352__3353.call(this, _, f);
      case 3:
        return G__3352__3354.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3352
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3356 = null;
  var G__3356__3357 = function(_, n) {
    return null
  };
  var G__3356__3358 = function(_, n, not_found) {
    return not_found
  };
  G__3356 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3356__3357.call(this, _, n);
      case 3:
        return G__3356__3358.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3356
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__3366 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__3360 = cljs.core._nth.call(null, cicoll, 0);
      var n__3361 = 1;
      while(true) {
        if(cljs.core.truth_(n__3361 < cljs.core._count.call(null, cicoll))) {
          var G__3370 = f.call(null, val__3360, cljs.core._nth.call(null, cicoll, n__3361));
          var G__3371 = n__3361 + 1;
          val__3360 = G__3370;
          n__3361 = G__3371;
          continue
        }else {
          return val__3360
        }
        break
      }
    }
  };
  var ci_reduce__3367 = function(cicoll, f, val) {
    var val__3362 = val;
    var n__3363 = 0;
    while(true) {
      if(cljs.core.truth_(n__3363 < cljs.core._count.call(null, cicoll))) {
        var G__3372 = f.call(null, val__3362, cljs.core._nth.call(null, cicoll, n__3363));
        var G__3373 = n__3363 + 1;
        val__3362 = G__3372;
        n__3363 = G__3373;
        continue
      }else {
        return val__3362
      }
      break
    }
  };
  var ci_reduce__3368 = function(cicoll, f, val, idx) {
    var val__3364 = val;
    var n__3365 = idx;
    while(true) {
      if(cljs.core.truth_(n__3365 < cljs.core._count.call(null, cicoll))) {
        var G__3374 = f.call(null, val__3364, cljs.core._nth.call(null, cicoll, n__3365));
        var G__3375 = n__3365 + 1;
        val__3364 = G__3374;
        n__3365 = G__3375;
        continue
      }else {
        return val__3364
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__3366.call(this, cicoll, f);
      case 3:
        return ci_reduce__3367.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__3368.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3376 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3389 = null;
  var G__3389__3390 = function(_, f) {
    var this__3377 = this;
    return cljs.core.ci_reduce.call(null, this__3377.a, f, this__3377.a[this__3377.i], this__3377.i + 1)
  };
  var G__3389__3391 = function(_, f, start) {
    var this__3378 = this;
    return cljs.core.ci_reduce.call(null, this__3378.a, f, start, this__3378.i)
  };
  G__3389 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3389__3390.call(this, _, f);
      case 3:
        return G__3389__3391.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3389
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3379 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3380 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3393 = null;
  var G__3393__3394 = function(coll, n) {
    var this__3381 = this;
    var i__3382 = n + this__3381.i;
    if(cljs.core.truth_(i__3382 < this__3381.a.length)) {
      return this__3381.a[i__3382]
    }else {
      return null
    }
  };
  var G__3393__3395 = function(coll, n, not_found) {
    var this__3383 = this;
    var i__3384 = n + this__3383.i;
    if(cljs.core.truth_(i__3384 < this__3383.a.length)) {
      return this__3383.a[i__3384]
    }else {
      return not_found
    }
  };
  G__3393 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3393__3394.call(this, coll, n);
      case 3:
        return G__3393__3395.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3393
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3385 = this;
  return this__3385.a.length - this__3385.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3386 = this;
  return this__3386.a[this__3386.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3387 = this;
  if(cljs.core.truth_(this__3387.i + 1 < this__3387.a.length)) {
    return new cljs.core.IndexedSeq(this__3387.a, this__3387.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3388 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3397 = null;
  var G__3397__3398 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3397__3399 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3397 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3397__3398.call(this, array, f);
      case 3:
        return G__3397__3399.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3397
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3401 = null;
  var G__3401__3402 = function(array, k) {
    return array[k]
  };
  var G__3401__3403 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3401 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3401__3402.call(this, array, k);
      case 3:
        return G__3401__3403.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3401
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3405 = null;
  var G__3405__3406 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3405__3407 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3405 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3405__3406.call(this, array, n);
      case 3:
        return G__3405__3407.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3405
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____3409 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____3409)) {
    var s__3410 = temp__3698__auto____3409;
    return cljs.core._first.call(null, s__3410)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3411 = cljs.core.next.call(null, s);
      s = G__3411;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3412 = cljs.core.seq.call(null, x);
  var n__3413 = 0;
  while(true) {
    if(cljs.core.truth_(s__3412)) {
      var G__3414 = cljs.core.next.call(null, s__3412);
      var G__3415 = n__3413 + 1;
      s__3412 = G__3414;
      n__3413 = G__3415;
      continue
    }else {
      return n__3413
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3416 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3417 = function() {
    var G__3419__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3420 = conj.call(null, coll, x);
          var G__3421 = cljs.core.first.call(null, xs);
          var G__3422 = cljs.core.next.call(null, xs);
          coll = G__3420;
          x = G__3421;
          xs = G__3422;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3419 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3419__delegate.call(this, coll, x, xs)
    };
    G__3419.cljs$lang$maxFixedArity = 2;
    G__3419.cljs$lang$applyTo = function(arglist__3423) {
      var coll = cljs.core.first(arglist__3423);
      var x = cljs.core.first(cljs.core.next(arglist__3423));
      var xs = cljs.core.rest(cljs.core.next(arglist__3423));
      return G__3419__delegate.call(this, coll, x, xs)
    };
    return G__3419
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3416.call(this, coll, x);
      default:
        return conj__3417.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3417.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3424 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3425 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3424.call(this, coll, n);
      case 3:
        return nth__3425.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3427 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3428 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3427.call(this, o, k);
      case 3:
        return get__3428.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3431 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3432 = function() {
    var G__3434__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3430 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3435 = ret__3430;
          var G__3436 = cljs.core.first.call(null, kvs);
          var G__3437 = cljs.core.second.call(null, kvs);
          var G__3438 = cljs.core.nnext.call(null, kvs);
          coll = G__3435;
          k = G__3436;
          v = G__3437;
          kvs = G__3438;
          continue
        }else {
          return ret__3430
        }
        break
      }
    };
    var G__3434 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3434__delegate.call(this, coll, k, v, kvs)
    };
    G__3434.cljs$lang$maxFixedArity = 3;
    G__3434.cljs$lang$applyTo = function(arglist__3439) {
      var coll = cljs.core.first(arglist__3439);
      var k = cljs.core.first(cljs.core.next(arglist__3439));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3439)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3439)));
      return G__3434__delegate.call(this, coll, k, v, kvs)
    };
    return G__3434
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3431.call(this, coll, k, v);
      default:
        return assoc__3432.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3432.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3441 = function(coll) {
    return coll
  };
  var dissoc__3442 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3443 = function() {
    var G__3445__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3440 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3446 = ret__3440;
          var G__3447 = cljs.core.first.call(null, ks);
          var G__3448 = cljs.core.next.call(null, ks);
          coll = G__3446;
          k = G__3447;
          ks = G__3448;
          continue
        }else {
          return ret__3440
        }
        break
      }
    };
    var G__3445 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3445__delegate.call(this, coll, k, ks)
    };
    G__3445.cljs$lang$maxFixedArity = 2;
    G__3445.cljs$lang$applyTo = function(arglist__3449) {
      var coll = cljs.core.first(arglist__3449);
      var k = cljs.core.first(cljs.core.next(arglist__3449));
      var ks = cljs.core.rest(cljs.core.next(arglist__3449));
      return G__3445__delegate.call(this, coll, k, ks)
    };
    return G__3445
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3441.call(this, coll);
      case 2:
        return dissoc__3442.call(this, coll, k);
      default:
        return dissoc__3443.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3443.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____3450 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3451 = x__451__auto____3450;
      if(cljs.core.truth_(and__3546__auto____3451)) {
        var and__3546__auto____3452 = x__451__auto____3450.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____3452)) {
          return cljs.core.not.call(null, x__451__auto____3450.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____3452
        }
      }else {
        return and__3546__auto____3451
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____3450)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3454 = function(coll) {
    return coll
  };
  var disj__3455 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3456 = function() {
    var G__3458__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3453 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3459 = ret__3453;
          var G__3460 = cljs.core.first.call(null, ks);
          var G__3461 = cljs.core.next.call(null, ks);
          coll = G__3459;
          k = G__3460;
          ks = G__3461;
          continue
        }else {
          return ret__3453
        }
        break
      }
    };
    var G__3458 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3458__delegate.call(this, coll, k, ks)
    };
    G__3458.cljs$lang$maxFixedArity = 2;
    G__3458.cljs$lang$applyTo = function(arglist__3462) {
      var coll = cljs.core.first(arglist__3462);
      var k = cljs.core.first(cljs.core.next(arglist__3462));
      var ks = cljs.core.rest(cljs.core.next(arglist__3462));
      return G__3458__delegate.call(this, coll, k, ks)
    };
    return G__3458
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3454.call(this, coll);
      case 2:
        return disj__3455.call(this, coll, k);
      default:
        return disj__3456.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3456.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3463 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3464 = x__451__auto____3463;
      if(cljs.core.truth_(and__3546__auto____3464)) {
        var and__3546__auto____3465 = x__451__auto____3463.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____3465)) {
          return cljs.core.not.call(null, x__451__auto____3463.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____3465
        }
      }else {
        return and__3546__auto____3464
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____3463)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3466 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3467 = x__451__auto____3466;
      if(cljs.core.truth_(and__3546__auto____3467)) {
        var and__3546__auto____3468 = x__451__auto____3466.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____3468)) {
          return cljs.core.not.call(null, x__451__auto____3466.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____3468
        }
      }else {
        return and__3546__auto____3467
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____3466)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____3469 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3470 = x__451__auto____3469;
    if(cljs.core.truth_(and__3546__auto____3470)) {
      var and__3546__auto____3471 = x__451__auto____3469.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____3471)) {
        return cljs.core.not.call(null, x__451__auto____3469.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____3471
      }
    }else {
      return and__3546__auto____3470
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____3469)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____3472 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3473 = x__451__auto____3472;
    if(cljs.core.truth_(and__3546__auto____3473)) {
      var and__3546__auto____3474 = x__451__auto____3472.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____3474)) {
        return cljs.core.not.call(null, x__451__auto____3472.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____3474
      }
    }else {
      return and__3546__auto____3473
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____3472)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____3475 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3476 = x__451__auto____3475;
    if(cljs.core.truth_(and__3546__auto____3476)) {
      var and__3546__auto____3477 = x__451__auto____3475.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____3477)) {
        return cljs.core.not.call(null, x__451__auto____3475.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____3477
      }
    }else {
      return and__3546__auto____3476
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____3475)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3478 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3479 = x__451__auto____3478;
      if(cljs.core.truth_(and__3546__auto____3479)) {
        var and__3546__auto____3480 = x__451__auto____3478.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____3480)) {
          return cljs.core.not.call(null, x__451__auto____3478.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____3480
        }
      }else {
        return and__3546__auto____3479
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____3478)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____3481 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3482 = x__451__auto____3481;
    if(cljs.core.truth_(and__3546__auto____3482)) {
      var and__3546__auto____3483 = x__451__auto____3481.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____3483)) {
        return cljs.core.not.call(null, x__451__auto____3481.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____3483
      }
    }else {
      return and__3546__auto____3482
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____3481)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3484 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3484.push(key)
  });
  return keys__3484
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__451__auto____3485 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3486 = x__451__auto____3485;
      if(cljs.core.truth_(and__3546__auto____3486)) {
        var and__3546__auto____3487 = x__451__auto____3485.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____3487)) {
          return cljs.core.not.call(null, x__451__auto____3485.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____3487
        }
      }else {
        return and__3546__auto____3486
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____3485)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____3488 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3488)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____3489 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____3489)) {
        return or__3548__auto____3489
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____3488
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____3490 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3490)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____3490
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____3491 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3491)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____3491
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____3492 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____3492)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____3492
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3493 = coll;
    if(cljs.core.truth_(and__3546__auto____3493)) {
      var and__3546__auto____3494 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____3494)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____3494
      }
    }else {
      return and__3546__auto____3493
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3499 = function(x) {
    return true
  };
  var distinct_QMARK___3500 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3501 = function() {
    var G__3503__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3495 = cljs.core.set([y, x]);
        var xs__3496 = more;
        while(true) {
          var x__3497 = cljs.core.first.call(null, xs__3496);
          var etc__3498 = cljs.core.next.call(null, xs__3496);
          if(cljs.core.truth_(xs__3496)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3495, x__3497))) {
              return false
            }else {
              var G__3504 = cljs.core.conj.call(null, s__3495, x__3497);
              var G__3505 = etc__3498;
              s__3495 = G__3504;
              xs__3496 = G__3505;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3503 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3503__delegate.call(this, x, y, more)
    };
    G__3503.cljs$lang$maxFixedArity = 2;
    G__3503.cljs$lang$applyTo = function(arglist__3506) {
      var x = cljs.core.first(arglist__3506);
      var y = cljs.core.first(cljs.core.next(arglist__3506));
      var more = cljs.core.rest(cljs.core.next(arglist__3506));
      return G__3503__delegate.call(this, x, y, more)
    };
    return G__3503
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3499.call(this, x);
      case 2:
        return distinct_QMARK___3500.call(this, x, y);
      default:
        return distinct_QMARK___3501.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3501.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3507 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3507))) {
        return r__3507
      }else {
        if(cljs.core.truth_(r__3507)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3509 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3510 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3508 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3508, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3508)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3509.call(this, comp);
      case 2:
        return sort__3510.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3512 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3513 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3512.call(this, keyfn, comp);
      case 3:
        return sort_by__3513.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3515 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3516 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3515.call(this, f, val);
      case 3:
        return reduce__3516.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3522 = function(f, coll) {
    var temp__3695__auto____3518 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____3518)) {
      var s__3519 = temp__3695__auto____3518;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3519), cljs.core.next.call(null, s__3519))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3523 = function(f, val, coll) {
    var val__3520 = val;
    var coll__3521 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3521)) {
        var G__3525 = f.call(null, val__3520, cljs.core.first.call(null, coll__3521));
        var G__3526 = cljs.core.next.call(null, coll__3521);
        val__3520 = G__3525;
        coll__3521 = G__3526;
        continue
      }else {
        return val__3520
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3522.call(this, f, val);
      case 3:
        return seq_reduce__3523.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3527 = null;
  var G__3527__3528 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3527__3529 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3527 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3527__3528.call(this, coll, f);
      case 3:
        return G__3527__3529.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3527
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3531 = function() {
    return 0
  };
  var _PLUS___3532 = function(x) {
    return x
  };
  var _PLUS___3533 = function(x, y) {
    return x + y
  };
  var _PLUS___3534 = function() {
    var G__3536__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3536 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3536__delegate.call(this, x, y, more)
    };
    G__3536.cljs$lang$maxFixedArity = 2;
    G__3536.cljs$lang$applyTo = function(arglist__3537) {
      var x = cljs.core.first(arglist__3537);
      var y = cljs.core.first(cljs.core.next(arglist__3537));
      var more = cljs.core.rest(cljs.core.next(arglist__3537));
      return G__3536__delegate.call(this, x, y, more)
    };
    return G__3536
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3531.call(this);
      case 1:
        return _PLUS___3532.call(this, x);
      case 2:
        return _PLUS___3533.call(this, x, y);
      default:
        return _PLUS___3534.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3534.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3538 = function(x) {
    return-x
  };
  var ___3539 = function(x, y) {
    return x - y
  };
  var ___3540 = function() {
    var G__3542__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3542 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3542__delegate.call(this, x, y, more)
    };
    G__3542.cljs$lang$maxFixedArity = 2;
    G__3542.cljs$lang$applyTo = function(arglist__3543) {
      var x = cljs.core.first(arglist__3543);
      var y = cljs.core.first(cljs.core.next(arglist__3543));
      var more = cljs.core.rest(cljs.core.next(arglist__3543));
      return G__3542__delegate.call(this, x, y, more)
    };
    return G__3542
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3538.call(this, x);
      case 2:
        return ___3539.call(this, x, y);
      default:
        return ___3540.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3540.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3544 = function() {
    return 1
  };
  var _STAR___3545 = function(x) {
    return x
  };
  var _STAR___3546 = function(x, y) {
    return x * y
  };
  var _STAR___3547 = function() {
    var G__3549__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3549 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3549__delegate.call(this, x, y, more)
    };
    G__3549.cljs$lang$maxFixedArity = 2;
    G__3549.cljs$lang$applyTo = function(arglist__3550) {
      var x = cljs.core.first(arglist__3550);
      var y = cljs.core.first(cljs.core.next(arglist__3550));
      var more = cljs.core.rest(cljs.core.next(arglist__3550));
      return G__3549__delegate.call(this, x, y, more)
    };
    return G__3549
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3544.call(this);
      case 1:
        return _STAR___3545.call(this, x);
      case 2:
        return _STAR___3546.call(this, x, y);
      default:
        return _STAR___3547.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3547.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3551 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___3552 = function(x, y) {
    return x / y
  };
  var _SLASH___3553 = function() {
    var G__3555__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3555 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3555__delegate.call(this, x, y, more)
    };
    G__3555.cljs$lang$maxFixedArity = 2;
    G__3555.cljs$lang$applyTo = function(arglist__3556) {
      var x = cljs.core.first(arglist__3556);
      var y = cljs.core.first(cljs.core.next(arglist__3556));
      var more = cljs.core.rest(cljs.core.next(arglist__3556));
      return G__3555__delegate.call(this, x, y, more)
    };
    return G__3555
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3551.call(this, x);
      case 2:
        return _SLASH___3552.call(this, x, y);
      default:
        return _SLASH___3553.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3553.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3557 = function(x) {
    return true
  };
  var _LT___3558 = function(x, y) {
    return x < y
  };
  var _LT___3559 = function() {
    var G__3561__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3562 = y;
            var G__3563 = cljs.core.first.call(null, more);
            var G__3564 = cljs.core.next.call(null, more);
            x = G__3562;
            y = G__3563;
            more = G__3564;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3561 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3561__delegate.call(this, x, y, more)
    };
    G__3561.cljs$lang$maxFixedArity = 2;
    G__3561.cljs$lang$applyTo = function(arglist__3565) {
      var x = cljs.core.first(arglist__3565);
      var y = cljs.core.first(cljs.core.next(arglist__3565));
      var more = cljs.core.rest(cljs.core.next(arglist__3565));
      return G__3561__delegate.call(this, x, y, more)
    };
    return G__3561
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3557.call(this, x);
      case 2:
        return _LT___3558.call(this, x, y);
      default:
        return _LT___3559.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3559.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3566 = function(x) {
    return true
  };
  var _LT__EQ___3567 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3568 = function() {
    var G__3570__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3571 = y;
            var G__3572 = cljs.core.first.call(null, more);
            var G__3573 = cljs.core.next.call(null, more);
            x = G__3571;
            y = G__3572;
            more = G__3573;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3570 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3570__delegate.call(this, x, y, more)
    };
    G__3570.cljs$lang$maxFixedArity = 2;
    G__3570.cljs$lang$applyTo = function(arglist__3574) {
      var x = cljs.core.first(arglist__3574);
      var y = cljs.core.first(cljs.core.next(arglist__3574));
      var more = cljs.core.rest(cljs.core.next(arglist__3574));
      return G__3570__delegate.call(this, x, y, more)
    };
    return G__3570
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3566.call(this, x);
      case 2:
        return _LT__EQ___3567.call(this, x, y);
      default:
        return _LT__EQ___3568.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3568.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3575 = function(x) {
    return true
  };
  var _GT___3576 = function(x, y) {
    return x > y
  };
  var _GT___3577 = function() {
    var G__3579__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3580 = y;
            var G__3581 = cljs.core.first.call(null, more);
            var G__3582 = cljs.core.next.call(null, more);
            x = G__3580;
            y = G__3581;
            more = G__3582;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3579 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3579__delegate.call(this, x, y, more)
    };
    G__3579.cljs$lang$maxFixedArity = 2;
    G__3579.cljs$lang$applyTo = function(arglist__3583) {
      var x = cljs.core.first(arglist__3583);
      var y = cljs.core.first(cljs.core.next(arglist__3583));
      var more = cljs.core.rest(cljs.core.next(arglist__3583));
      return G__3579__delegate.call(this, x, y, more)
    };
    return G__3579
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3575.call(this, x);
      case 2:
        return _GT___3576.call(this, x, y);
      default:
        return _GT___3577.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3577.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3584 = function(x) {
    return true
  };
  var _GT__EQ___3585 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3586 = function() {
    var G__3588__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3589 = y;
            var G__3590 = cljs.core.first.call(null, more);
            var G__3591 = cljs.core.next.call(null, more);
            x = G__3589;
            y = G__3590;
            more = G__3591;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3588 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3588__delegate.call(this, x, y, more)
    };
    G__3588.cljs$lang$maxFixedArity = 2;
    G__3588.cljs$lang$applyTo = function(arglist__3592) {
      var x = cljs.core.first(arglist__3592);
      var y = cljs.core.first(cljs.core.next(arglist__3592));
      var more = cljs.core.rest(cljs.core.next(arglist__3592));
      return G__3588__delegate.call(this, x, y, more)
    };
    return G__3588
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3584.call(this, x);
      case 2:
        return _GT__EQ___3585.call(this, x, y);
      default:
        return _GT__EQ___3586.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3586.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3593 = function(x) {
    return x
  };
  var max__3594 = function(x, y) {
    return x > y ? x : y
  };
  var max__3595 = function() {
    var G__3597__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3597 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3597__delegate.call(this, x, y, more)
    };
    G__3597.cljs$lang$maxFixedArity = 2;
    G__3597.cljs$lang$applyTo = function(arglist__3598) {
      var x = cljs.core.first(arglist__3598);
      var y = cljs.core.first(cljs.core.next(arglist__3598));
      var more = cljs.core.rest(cljs.core.next(arglist__3598));
      return G__3597__delegate.call(this, x, y, more)
    };
    return G__3597
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3593.call(this, x);
      case 2:
        return max__3594.call(this, x, y);
      default:
        return max__3595.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3595.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3599 = function(x) {
    return x
  };
  var min__3600 = function(x, y) {
    return x < y ? x : y
  };
  var min__3601 = function() {
    var G__3603__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3603 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3603__delegate.call(this, x, y, more)
    };
    G__3603.cljs$lang$maxFixedArity = 2;
    G__3603.cljs$lang$applyTo = function(arglist__3604) {
      var x = cljs.core.first(arglist__3604);
      var y = cljs.core.first(cljs.core.next(arglist__3604));
      var more = cljs.core.rest(cljs.core.next(arglist__3604));
      return G__3603__delegate.call(this, x, y, more)
    };
    return G__3603
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3599.call(this, x);
      case 2:
        return min__3600.call(this, x, y);
      default:
        return min__3601.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3601.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3605 = n % d;
  return cljs.core.fix.call(null, (n - rem__3605) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3606 = cljs.core.quot.call(null, n, d);
  return n - d * q__3606
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3607 = function() {
    return Math.random.call(null)
  };
  var rand__3608 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3607.call(this);
      case 1:
        return rand__3608.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3610 = function(x) {
    return true
  };
  var _EQ__EQ___3611 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3612 = function() {
    var G__3614__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3615 = y;
            var G__3616 = cljs.core.first.call(null, more);
            var G__3617 = cljs.core.next.call(null, more);
            x = G__3615;
            y = G__3616;
            more = G__3617;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3614 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3614__delegate.call(this, x, y, more)
    };
    G__3614.cljs$lang$maxFixedArity = 2;
    G__3614.cljs$lang$applyTo = function(arglist__3618) {
      var x = cljs.core.first(arglist__3618);
      var y = cljs.core.first(cljs.core.next(arglist__3618));
      var more = cljs.core.rest(cljs.core.next(arglist__3618));
      return G__3614__delegate.call(this, x, y, more)
    };
    return G__3614
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3610.call(this, x);
      case 2:
        return _EQ__EQ___3611.call(this, x, y);
      default:
        return _EQ__EQ___3612.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3612.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3619 = n;
  var xs__3620 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3621 = xs__3620;
      if(cljs.core.truth_(and__3546__auto____3621)) {
        return n__3619 > 0
      }else {
        return and__3546__auto____3621
      }
    }())) {
      var G__3622 = n__3619 - 1;
      var G__3623 = cljs.core.next.call(null, xs__3620);
      n__3619 = G__3622;
      xs__3620 = G__3623;
      continue
    }else {
      return xs__3620
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3628 = null;
  var G__3628__3629 = function(coll, n) {
    var temp__3695__auto____3624 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3624)) {
      var xs__3625 = temp__3695__auto____3624;
      return cljs.core.first.call(null, xs__3625)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3628__3630 = function(coll, n, not_found) {
    var temp__3695__auto____3626 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3626)) {
      var xs__3627 = temp__3695__auto____3626;
      return cljs.core.first.call(null, xs__3627)
    }else {
      return not_found
    }
  };
  G__3628 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3628__3629.call(this, coll, n);
      case 3:
        return G__3628__3630.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3628
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3632 = function() {
    return""
  };
  var str_STAR___3633 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3634 = function() {
    var G__3636__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3637 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3638 = cljs.core.next.call(null, more);
            sb = G__3637;
            more = G__3638;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3636 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3636__delegate.call(this, x, ys)
    };
    G__3636.cljs$lang$maxFixedArity = 1;
    G__3636.cljs$lang$applyTo = function(arglist__3639) {
      var x = cljs.core.first(arglist__3639);
      var ys = cljs.core.rest(arglist__3639);
      return G__3636__delegate.call(this, x, ys)
    };
    return G__3636
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3632.call(this);
      case 1:
        return str_STAR___3633.call(this, x);
      default:
        return str_STAR___3634.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3634.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3640 = function() {
    return""
  };
  var str__3641 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3642 = function() {
    var G__3644__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3645 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__3646 = cljs.core.next.call(null, more);
            sb = G__3645;
            more = G__3646;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__3644 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3644__delegate.call(this, x, ys)
    };
    G__3644.cljs$lang$maxFixedArity = 1;
    G__3644.cljs$lang$applyTo = function(arglist__3647) {
      var x = cljs.core.first(arglist__3647);
      var ys = cljs.core.rest(arglist__3647);
      return G__3644__delegate.call(this, x, ys)
    };
    return G__3644
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3640.call(this);
      case 1:
        return str__3641.call(this, x);
      default:
        return str__3642.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3642.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3648 = function(s, start) {
    return s.substring(start)
  };
  var subs__3649 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3648.call(this, s, start);
      case 3:
        return subs__3649.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3651 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3652 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3651.call(this, ns);
      case 2:
        return symbol__3652.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3654 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3655 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3654.call(this, ns);
      case 2:
        return keyword__3655.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3657 = cljs.core.seq.call(null, x);
    var ys__3658 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__3657 === null)) {
        return ys__3658 === null
      }else {
        if(cljs.core.truth_(ys__3658 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3657), cljs.core.first.call(null, ys__3658)))) {
            var G__3659 = cljs.core.next.call(null, xs__3657);
            var G__3660 = cljs.core.next.call(null, ys__3658);
            xs__3657 = G__3659;
            ys__3658 = G__3660;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3661_SHARP_, p2__3662_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3661_SHARP_, cljs.core.hash.call(null, p2__3662_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3663__3664 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3663__3664)) {
    var G__3666__3668 = cljs.core.first.call(null, G__3663__3664);
    var vec__3667__3669 = G__3666__3668;
    var key_name__3670 = cljs.core.nth.call(null, vec__3667__3669, 0, null);
    var f__3671 = cljs.core.nth.call(null, vec__3667__3669, 1, null);
    var G__3663__3672 = G__3663__3664;
    var G__3666__3673 = G__3666__3668;
    var G__3663__3674 = G__3663__3672;
    while(true) {
      var vec__3675__3676 = G__3666__3673;
      var key_name__3677 = cljs.core.nth.call(null, vec__3675__3676, 0, null);
      var f__3678 = cljs.core.nth.call(null, vec__3675__3676, 1, null);
      var G__3663__3679 = G__3663__3674;
      var str_name__3680 = cljs.core.name.call(null, key_name__3677);
      obj[str_name__3680] = f__3678;
      var temp__3698__auto____3681 = cljs.core.next.call(null, G__3663__3679);
      if(cljs.core.truth_(temp__3698__auto____3681)) {
        var G__3663__3682 = temp__3698__auto____3681;
        var G__3683 = cljs.core.first.call(null, G__3663__3682);
        var G__3684 = G__3663__3682;
        G__3666__3673 = G__3683;
        G__3663__3674 = G__3684;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3685 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3686 = this;
  return new cljs.core.List(this__3686.meta, o, coll, this__3686.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3687 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3688 = this;
  return this__3688.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3689 = this;
  return this__3689.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3690 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3691 = this;
  return this__3691.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3692 = this;
  return this__3692.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3693 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3694 = this;
  return new cljs.core.List(meta, this__3694.first, this__3694.rest, this__3694.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3695 = this;
  return this__3695.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3696 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3697 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3698 = this;
  return new cljs.core.List(this__3698.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3699 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3700 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3701 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3702 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3703 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3704 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3705 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3706 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3707 = this;
  return this__3707.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3708 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3709) {
    var items = cljs.core.seq(arglist__3709);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3710 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3711 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3712 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3713 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3713.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3714 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3715 = this;
  return this__3715.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3716 = this;
  if(cljs.core.truth_(this__3716.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__3716.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3717 = this;
  return this__3717.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3718 = this;
  return new cljs.core.Cons(meta, this__3718.first, this__3718.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3719 = null;
  var G__3719__3720 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3719__3721 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3719 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3719__3720.call(this, string, f);
      case 3:
        return G__3719__3721.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3719
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3723 = null;
  var G__3723__3724 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3723__3725 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3723 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3723__3724.call(this, string, k);
      case 3:
        return G__3723__3725.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3723
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3727 = null;
  var G__3727__3728 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3727__3729 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3727 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3727__3728.call(this, string, n);
      case 3:
        return G__3727__3729.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3727
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3737 = null;
  var G__3737__3738 = function(tsym3731, coll) {
    var tsym3731__3733 = this;
    var this$__3734 = tsym3731__3733;
    return cljs.core.get.call(null, coll, this$__3734.toString())
  };
  var G__3737__3739 = function(tsym3732, coll, not_found) {
    var tsym3732__3735 = this;
    var this$__3736 = tsym3732__3735;
    return cljs.core.get.call(null, coll, this$__3736.toString(), not_found)
  };
  G__3737 = function(tsym3732, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3737__3738.call(this, tsym3732, coll);
      case 3:
        return G__3737__3739.call(this, tsym3732, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3737
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3741 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3741
  }else {
    lazy_seq.x = x__3741.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3742 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3743 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3744 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3745 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3745.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3746 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3747 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3748 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3749 = this;
  return this__3749.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3750 = this;
  return new cljs.core.LazySeq(meta, this__3750.realized, this__3750.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__3751 = [];
  var s__3752 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3752))) {
      ary__3751.push(cljs.core.first.call(null, s__3752));
      var G__3753 = cljs.core.next.call(null, s__3752);
      s__3752 = G__3753;
      continue
    }else {
      return ary__3751
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3754 = s;
  var i__3755 = n;
  var sum__3756 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3757 = i__3755 > 0;
      if(cljs.core.truth_(and__3546__auto____3757)) {
        return cljs.core.seq.call(null, s__3754)
      }else {
        return and__3546__auto____3757
      }
    }())) {
      var G__3758 = cljs.core.next.call(null, s__3754);
      var G__3759 = i__3755 - 1;
      var G__3760 = sum__3756 + 1;
      s__3754 = G__3758;
      i__3755 = G__3759;
      sum__3756 = G__3760;
      continue
    }else {
      return sum__3756
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3764 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3765 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3766 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3761 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3761)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3761), concat.call(null, cljs.core.rest.call(null, s__3761), y))
      }else {
        return y
      }
    })
  };
  var concat__3767 = function() {
    var G__3769__delegate = function(x, y, zs) {
      var cat__3763 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3762 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3762)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3762), cat.call(null, cljs.core.rest.call(null, xys__3762), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3763.call(null, concat.call(null, x, y), zs)
    };
    var G__3769 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3769__delegate.call(this, x, y, zs)
    };
    G__3769.cljs$lang$maxFixedArity = 2;
    G__3769.cljs$lang$applyTo = function(arglist__3770) {
      var x = cljs.core.first(arglist__3770);
      var y = cljs.core.first(cljs.core.next(arglist__3770));
      var zs = cljs.core.rest(cljs.core.next(arglist__3770));
      return G__3769__delegate.call(this, x, y, zs)
    };
    return G__3769
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3764.call(this);
      case 1:
        return concat__3765.call(this, x);
      case 2:
        return concat__3766.call(this, x, y);
      default:
        return concat__3767.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3767.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3771 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3772 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3773 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3774 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3775 = function() {
    var G__3777__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3777 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3777__delegate.call(this, a, b, c, d, more)
    };
    G__3777.cljs$lang$maxFixedArity = 4;
    G__3777.cljs$lang$applyTo = function(arglist__3778) {
      var a = cljs.core.first(arglist__3778);
      var b = cljs.core.first(cljs.core.next(arglist__3778));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3778)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3778))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3778))));
      return G__3777__delegate.call(this, a, b, c, d, more)
    };
    return G__3777
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3771.call(this, a);
      case 2:
        return list_STAR___3772.call(this, a, b);
      case 3:
        return list_STAR___3773.call(this, a, b, c);
      case 4:
        return list_STAR___3774.call(this, a, b, c, d);
      default:
        return list_STAR___3775.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3775.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3788 = function(f, args) {
    var fixed_arity__3779 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3779 + 1) <= fixed_arity__3779)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3789 = function(f, x, args) {
    var arglist__3780 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3781 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3780, fixed_arity__3781) <= fixed_arity__3781)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3780))
      }else {
        return f.cljs$lang$applyTo(arglist__3780)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3780))
    }
  };
  var apply__3790 = function(f, x, y, args) {
    var arglist__3782 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3783 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3782, fixed_arity__3783) <= fixed_arity__3783)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3782))
      }else {
        return f.cljs$lang$applyTo(arglist__3782)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3782))
    }
  };
  var apply__3791 = function(f, x, y, z, args) {
    var arglist__3784 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3785 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3784, fixed_arity__3785) <= fixed_arity__3785)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3784))
      }else {
        return f.cljs$lang$applyTo(arglist__3784)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3784))
    }
  };
  var apply__3792 = function() {
    var G__3794__delegate = function(f, a, b, c, d, args) {
      var arglist__3786 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3787 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3786, fixed_arity__3787) <= fixed_arity__3787)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3786))
        }else {
          return f.cljs$lang$applyTo(arglist__3786)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3786))
      }
    };
    var G__3794 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3794__delegate.call(this, f, a, b, c, d, args)
    };
    G__3794.cljs$lang$maxFixedArity = 5;
    G__3794.cljs$lang$applyTo = function(arglist__3795) {
      var f = cljs.core.first(arglist__3795);
      var a = cljs.core.first(cljs.core.next(arglist__3795));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3795)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3795))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3795)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3795)))));
      return G__3794__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3794
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3788.call(this, f, a);
      case 3:
        return apply__3789.call(this, f, a, b);
      case 4:
        return apply__3790.call(this, f, a, b, c);
      case 5:
        return apply__3791.call(this, f, a, b, c, d);
      default:
        return apply__3792.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3792.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3796) {
    var obj = cljs.core.first(arglist__3796);
    var f = cljs.core.first(cljs.core.next(arglist__3796));
    var args = cljs.core.rest(cljs.core.next(arglist__3796));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3797 = function(x) {
    return false
  };
  var not_EQ___3798 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3799 = function() {
    var G__3801__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3801 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3801__delegate.call(this, x, y, more)
    };
    G__3801.cljs$lang$maxFixedArity = 2;
    G__3801.cljs$lang$applyTo = function(arglist__3802) {
      var x = cljs.core.first(arglist__3802);
      var y = cljs.core.first(cljs.core.next(arglist__3802));
      var more = cljs.core.rest(cljs.core.next(arglist__3802));
      return G__3801__delegate.call(this, x, y, more)
    };
    return G__3801
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3797.call(this, x);
      case 2:
        return not_EQ___3798.call(this, x, y);
      default:
        return not_EQ___3799.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3799.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3803 = pred;
        var G__3804 = cljs.core.next.call(null, coll);
        pred = G__3803;
        coll = G__3804;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____3805 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____3805)) {
        return or__3548__auto____3805
      }else {
        var G__3806 = pred;
        var G__3807 = cljs.core.next.call(null, coll);
        pred = G__3806;
        coll = G__3807;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3808 = null;
    var G__3808__3809 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3808__3810 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3808__3811 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3808__3812 = function() {
      var G__3814__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3814 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3814__delegate.call(this, x, y, zs)
      };
      G__3814.cljs$lang$maxFixedArity = 2;
      G__3814.cljs$lang$applyTo = function(arglist__3815) {
        var x = cljs.core.first(arglist__3815);
        var y = cljs.core.first(cljs.core.next(arglist__3815));
        var zs = cljs.core.rest(cljs.core.next(arglist__3815));
        return G__3814__delegate.call(this, x, y, zs)
      };
      return G__3814
    }();
    G__3808 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3808__3809.call(this);
        case 1:
          return G__3808__3810.call(this, x);
        case 2:
          return G__3808__3811.call(this, x, y);
        default:
          return G__3808__3812.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3808.cljs$lang$maxFixedArity = 2;
    G__3808.cljs$lang$applyTo = G__3808__3812.cljs$lang$applyTo;
    return G__3808
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3816__delegate = function(args) {
      return x
    };
    var G__3816 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3816__delegate.call(this, args)
    };
    G__3816.cljs$lang$maxFixedArity = 0;
    G__3816.cljs$lang$applyTo = function(arglist__3817) {
      var args = cljs.core.seq(arglist__3817);
      return G__3816__delegate.call(this, args)
    };
    return G__3816
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3821 = function() {
    return cljs.core.identity
  };
  var comp__3822 = function(f) {
    return f
  };
  var comp__3823 = function(f, g) {
    return function() {
      var G__3827 = null;
      var G__3827__3828 = function() {
        return f.call(null, g.call(null))
      };
      var G__3827__3829 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3827__3830 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3827__3831 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3827__3832 = function() {
        var G__3834__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3834 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3834__delegate.call(this, x, y, z, args)
        };
        G__3834.cljs$lang$maxFixedArity = 3;
        G__3834.cljs$lang$applyTo = function(arglist__3835) {
          var x = cljs.core.first(arglist__3835);
          var y = cljs.core.first(cljs.core.next(arglist__3835));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3835)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3835)));
          return G__3834__delegate.call(this, x, y, z, args)
        };
        return G__3834
      }();
      G__3827 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3827__3828.call(this);
          case 1:
            return G__3827__3829.call(this, x);
          case 2:
            return G__3827__3830.call(this, x, y);
          case 3:
            return G__3827__3831.call(this, x, y, z);
          default:
            return G__3827__3832.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3827.cljs$lang$maxFixedArity = 3;
      G__3827.cljs$lang$applyTo = G__3827__3832.cljs$lang$applyTo;
      return G__3827
    }()
  };
  var comp__3824 = function(f, g, h) {
    return function() {
      var G__3836 = null;
      var G__3836__3837 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3836__3838 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3836__3839 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3836__3840 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3836__3841 = function() {
        var G__3843__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3843 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3843__delegate.call(this, x, y, z, args)
        };
        G__3843.cljs$lang$maxFixedArity = 3;
        G__3843.cljs$lang$applyTo = function(arglist__3844) {
          var x = cljs.core.first(arglist__3844);
          var y = cljs.core.first(cljs.core.next(arglist__3844));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3844)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3844)));
          return G__3843__delegate.call(this, x, y, z, args)
        };
        return G__3843
      }();
      G__3836 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3836__3837.call(this);
          case 1:
            return G__3836__3838.call(this, x);
          case 2:
            return G__3836__3839.call(this, x, y);
          case 3:
            return G__3836__3840.call(this, x, y, z);
          default:
            return G__3836__3841.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3836.cljs$lang$maxFixedArity = 3;
      G__3836.cljs$lang$applyTo = G__3836__3841.cljs$lang$applyTo;
      return G__3836
    }()
  };
  var comp__3825 = function() {
    var G__3845__delegate = function(f1, f2, f3, fs) {
      var fs__3818 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3846__delegate = function(args) {
          var ret__3819 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3818), args);
          var fs__3820 = cljs.core.next.call(null, fs__3818);
          while(true) {
            if(cljs.core.truth_(fs__3820)) {
              var G__3847 = cljs.core.first.call(null, fs__3820).call(null, ret__3819);
              var G__3848 = cljs.core.next.call(null, fs__3820);
              ret__3819 = G__3847;
              fs__3820 = G__3848;
              continue
            }else {
              return ret__3819
            }
            break
          }
        };
        var G__3846 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3846__delegate.call(this, args)
        };
        G__3846.cljs$lang$maxFixedArity = 0;
        G__3846.cljs$lang$applyTo = function(arglist__3849) {
          var args = cljs.core.seq(arglist__3849);
          return G__3846__delegate.call(this, args)
        };
        return G__3846
      }()
    };
    var G__3845 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3845__delegate.call(this, f1, f2, f3, fs)
    };
    G__3845.cljs$lang$maxFixedArity = 3;
    G__3845.cljs$lang$applyTo = function(arglist__3850) {
      var f1 = cljs.core.first(arglist__3850);
      var f2 = cljs.core.first(cljs.core.next(arglist__3850));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3850)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3850)));
      return G__3845__delegate.call(this, f1, f2, f3, fs)
    };
    return G__3845
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3821.call(this);
      case 1:
        return comp__3822.call(this, f1);
      case 2:
        return comp__3823.call(this, f1, f2);
      case 3:
        return comp__3824.call(this, f1, f2, f3);
      default:
        return comp__3825.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3825.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__3851 = function(f, arg1) {
    return function() {
      var G__3856__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3856 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3856__delegate.call(this, args)
      };
      G__3856.cljs$lang$maxFixedArity = 0;
      G__3856.cljs$lang$applyTo = function(arglist__3857) {
        var args = cljs.core.seq(arglist__3857);
        return G__3856__delegate.call(this, args)
      };
      return G__3856
    }()
  };
  var partial__3852 = function(f, arg1, arg2) {
    return function() {
      var G__3858__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3858 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3858__delegate.call(this, args)
      };
      G__3858.cljs$lang$maxFixedArity = 0;
      G__3858.cljs$lang$applyTo = function(arglist__3859) {
        var args = cljs.core.seq(arglist__3859);
        return G__3858__delegate.call(this, args)
      };
      return G__3858
    }()
  };
  var partial__3853 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3860__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3860 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3860__delegate.call(this, args)
      };
      G__3860.cljs$lang$maxFixedArity = 0;
      G__3860.cljs$lang$applyTo = function(arglist__3861) {
        var args = cljs.core.seq(arglist__3861);
        return G__3860__delegate.call(this, args)
      };
      return G__3860
    }()
  };
  var partial__3854 = function() {
    var G__3862__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3863__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3863 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3863__delegate.call(this, args)
        };
        G__3863.cljs$lang$maxFixedArity = 0;
        G__3863.cljs$lang$applyTo = function(arglist__3864) {
          var args = cljs.core.seq(arglist__3864);
          return G__3863__delegate.call(this, args)
        };
        return G__3863
      }()
    };
    var G__3862 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3862__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3862.cljs$lang$maxFixedArity = 4;
    G__3862.cljs$lang$applyTo = function(arglist__3865) {
      var f = cljs.core.first(arglist__3865);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3865));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3865)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3865))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3865))));
      return G__3862__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__3862
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__3851.call(this, f, arg1);
      case 3:
        return partial__3852.call(this, f, arg1, arg2);
      case 4:
        return partial__3853.call(this, f, arg1, arg2, arg3);
      default:
        return partial__3854.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__3854.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__3866 = function(f, x) {
    return function() {
      var G__3870 = null;
      var G__3870__3871 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__3870__3872 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__3870__3873 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__3870__3874 = function() {
        var G__3876__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__3876 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3876__delegate.call(this, a, b, c, ds)
        };
        G__3876.cljs$lang$maxFixedArity = 3;
        G__3876.cljs$lang$applyTo = function(arglist__3877) {
          var a = cljs.core.first(arglist__3877);
          var b = cljs.core.first(cljs.core.next(arglist__3877));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3877)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3877)));
          return G__3876__delegate.call(this, a, b, c, ds)
        };
        return G__3876
      }();
      G__3870 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3870__3871.call(this, a);
          case 2:
            return G__3870__3872.call(this, a, b);
          case 3:
            return G__3870__3873.call(this, a, b, c);
          default:
            return G__3870__3874.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3870.cljs$lang$maxFixedArity = 3;
      G__3870.cljs$lang$applyTo = G__3870__3874.cljs$lang$applyTo;
      return G__3870
    }()
  };
  var fnil__3867 = function(f, x, y) {
    return function() {
      var G__3878 = null;
      var G__3878__3879 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3878__3880 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__3878__3881 = function() {
        var G__3883__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__3883 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3883__delegate.call(this, a, b, c, ds)
        };
        G__3883.cljs$lang$maxFixedArity = 3;
        G__3883.cljs$lang$applyTo = function(arglist__3884) {
          var a = cljs.core.first(arglist__3884);
          var b = cljs.core.first(cljs.core.next(arglist__3884));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3884)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3884)));
          return G__3883__delegate.call(this, a, b, c, ds)
        };
        return G__3883
      }();
      G__3878 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3878__3879.call(this, a, b);
          case 3:
            return G__3878__3880.call(this, a, b, c);
          default:
            return G__3878__3881.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3878.cljs$lang$maxFixedArity = 3;
      G__3878.cljs$lang$applyTo = G__3878__3881.cljs$lang$applyTo;
      return G__3878
    }()
  };
  var fnil__3868 = function(f, x, y, z) {
    return function() {
      var G__3885 = null;
      var G__3885__3886 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3885__3887 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__3885__3888 = function() {
        var G__3890__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__3890 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3890__delegate.call(this, a, b, c, ds)
        };
        G__3890.cljs$lang$maxFixedArity = 3;
        G__3890.cljs$lang$applyTo = function(arglist__3891) {
          var a = cljs.core.first(arglist__3891);
          var b = cljs.core.first(cljs.core.next(arglist__3891));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3891)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3891)));
          return G__3890__delegate.call(this, a, b, c, ds)
        };
        return G__3890
      }();
      G__3885 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3885__3886.call(this, a, b);
          case 3:
            return G__3885__3887.call(this, a, b, c);
          default:
            return G__3885__3888.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3885.cljs$lang$maxFixedArity = 3;
      G__3885.cljs$lang$applyTo = G__3885__3888.cljs$lang$applyTo;
      return G__3885
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__3866.call(this, f, x);
      case 3:
        return fnil__3867.call(this, f, x, y);
      case 4:
        return fnil__3868.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__3894 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3892 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3892)) {
        var s__3893 = temp__3698__auto____3892;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__3893)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__3893)))
      }else {
        return null
      }
    })
  };
  return mapi__3894.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3895 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3895)) {
      var s__3896 = temp__3698__auto____3895;
      var x__3897 = f.call(null, cljs.core.first.call(null, s__3896));
      if(cljs.core.truth_(x__3897 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__3896))
      }else {
        return cljs.core.cons.call(null, x__3897, keep.call(null, f, cljs.core.rest.call(null, s__3896)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__3907 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3904 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3904)) {
        var s__3905 = temp__3698__auto____3904;
        var x__3906 = f.call(null, idx, cljs.core.first.call(null, s__3905));
        if(cljs.core.truth_(x__3906 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3905))
        }else {
          return cljs.core.cons.call(null, x__3906, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3905)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__3907.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__3952 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__3957 = function() {
        return true
      };
      var ep1__3958 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__3959 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3914 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3914)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____3914
          }
        }())
      };
      var ep1__3960 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3915 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3915)) {
            var and__3546__auto____3916 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3916)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____3916
            }
          }else {
            return and__3546__auto____3915
          }
        }())
      };
      var ep1__3961 = function() {
        var G__3963__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3917 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3917)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____3917
            }
          }())
        };
        var G__3963 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3963__delegate.call(this, x, y, z, args)
        };
        G__3963.cljs$lang$maxFixedArity = 3;
        G__3963.cljs$lang$applyTo = function(arglist__3964) {
          var x = cljs.core.first(arglist__3964);
          var y = cljs.core.first(cljs.core.next(arglist__3964));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3964)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3964)));
          return G__3963__delegate.call(this, x, y, z, args)
        };
        return G__3963
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__3957.call(this);
          case 1:
            return ep1__3958.call(this, x);
          case 2:
            return ep1__3959.call(this, x, y);
          case 3:
            return ep1__3960.call(this, x, y, z);
          default:
            return ep1__3961.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__3961.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__3953 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__3965 = function() {
        return true
      };
      var ep2__3966 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3918 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3918)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____3918
          }
        }())
      };
      var ep2__3967 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3919 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3919)) {
            var and__3546__auto____3920 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3920)) {
              var and__3546__auto____3921 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3921)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____3921
              }
            }else {
              return and__3546__auto____3920
            }
          }else {
            return and__3546__auto____3919
          }
        }())
      };
      var ep2__3968 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3922 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3922)) {
            var and__3546__auto____3923 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3923)) {
              var and__3546__auto____3924 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____3924)) {
                var and__3546__auto____3925 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____3925)) {
                  var and__3546__auto____3926 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3926)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____3926
                  }
                }else {
                  return and__3546__auto____3925
                }
              }else {
                return and__3546__auto____3924
              }
            }else {
              return and__3546__auto____3923
            }
          }else {
            return and__3546__auto____3922
          }
        }())
      };
      var ep2__3969 = function() {
        var G__3971__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3927 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3927)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3898_SHARP_) {
                var and__3546__auto____3928 = p1.call(null, p1__3898_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3928)) {
                  return p2.call(null, p1__3898_SHARP_)
                }else {
                  return and__3546__auto____3928
                }
              }, args)
            }else {
              return and__3546__auto____3927
            }
          }())
        };
        var G__3971 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3971__delegate.call(this, x, y, z, args)
        };
        G__3971.cljs$lang$maxFixedArity = 3;
        G__3971.cljs$lang$applyTo = function(arglist__3972) {
          var x = cljs.core.first(arglist__3972);
          var y = cljs.core.first(cljs.core.next(arglist__3972));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3972)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3972)));
          return G__3971__delegate.call(this, x, y, z, args)
        };
        return G__3971
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__3965.call(this);
          case 1:
            return ep2__3966.call(this, x);
          case 2:
            return ep2__3967.call(this, x, y);
          case 3:
            return ep2__3968.call(this, x, y, z);
          default:
            return ep2__3969.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__3969.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__3954 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__3973 = function() {
        return true
      };
      var ep3__3974 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3929 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3929)) {
            var and__3546__auto____3930 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3930)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____3930
            }
          }else {
            return and__3546__auto____3929
          }
        }())
      };
      var ep3__3975 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3931 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3931)) {
            var and__3546__auto____3932 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3932)) {
              var and__3546__auto____3933 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3933)) {
                var and__3546__auto____3934 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3934)) {
                  var and__3546__auto____3935 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3935)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____3935
                  }
                }else {
                  return and__3546__auto____3934
                }
              }else {
                return and__3546__auto____3933
              }
            }else {
              return and__3546__auto____3932
            }
          }else {
            return and__3546__auto____3931
          }
        }())
      };
      var ep3__3976 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3936 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3936)) {
            var and__3546__auto____3937 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3937)) {
              var and__3546__auto____3938 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3938)) {
                var and__3546__auto____3939 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3939)) {
                  var and__3546__auto____3940 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3940)) {
                    var and__3546__auto____3941 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____3941)) {
                      var and__3546__auto____3942 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____3942)) {
                        var and__3546__auto____3943 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____3943)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____3943
                        }
                      }else {
                        return and__3546__auto____3942
                      }
                    }else {
                      return and__3546__auto____3941
                    }
                  }else {
                    return and__3546__auto____3940
                  }
                }else {
                  return and__3546__auto____3939
                }
              }else {
                return and__3546__auto____3938
              }
            }else {
              return and__3546__auto____3937
            }
          }else {
            return and__3546__auto____3936
          }
        }())
      };
      var ep3__3977 = function() {
        var G__3979__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3944 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3944)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3899_SHARP_) {
                var and__3546__auto____3945 = p1.call(null, p1__3899_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3945)) {
                  var and__3546__auto____3946 = p2.call(null, p1__3899_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____3946)) {
                    return p3.call(null, p1__3899_SHARP_)
                  }else {
                    return and__3546__auto____3946
                  }
                }else {
                  return and__3546__auto____3945
                }
              }, args)
            }else {
              return and__3546__auto____3944
            }
          }())
        };
        var G__3979 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3979__delegate.call(this, x, y, z, args)
        };
        G__3979.cljs$lang$maxFixedArity = 3;
        G__3979.cljs$lang$applyTo = function(arglist__3980) {
          var x = cljs.core.first(arglist__3980);
          var y = cljs.core.first(cljs.core.next(arglist__3980));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3980)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3980)));
          return G__3979__delegate.call(this, x, y, z, args)
        };
        return G__3979
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__3973.call(this);
          case 1:
            return ep3__3974.call(this, x);
          case 2:
            return ep3__3975.call(this, x, y);
          case 3:
            return ep3__3976.call(this, x, y, z);
          default:
            return ep3__3977.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__3977.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__3955 = function() {
    var G__3981__delegate = function(p1, p2, p3, ps) {
      var ps__3947 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__3982 = function() {
          return true
        };
        var epn__3983 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3900_SHARP_) {
            return p1__3900_SHARP_.call(null, x)
          }, ps__3947)
        };
        var epn__3984 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3901_SHARP_) {
            var and__3546__auto____3948 = p1__3901_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3948)) {
              return p1__3901_SHARP_.call(null, y)
            }else {
              return and__3546__auto____3948
            }
          }, ps__3947)
        };
        var epn__3985 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3902_SHARP_) {
            var and__3546__auto____3949 = p1__3902_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3949)) {
              var and__3546__auto____3950 = p1__3902_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____3950)) {
                return p1__3902_SHARP_.call(null, z)
              }else {
                return and__3546__auto____3950
              }
            }else {
              return and__3546__auto____3949
            }
          }, ps__3947)
        };
        var epn__3986 = function() {
          var G__3988__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____3951 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____3951)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3903_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3903_SHARP_, args)
                }, ps__3947)
              }else {
                return and__3546__auto____3951
              }
            }())
          };
          var G__3988 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3988__delegate.call(this, x, y, z, args)
          };
          G__3988.cljs$lang$maxFixedArity = 3;
          G__3988.cljs$lang$applyTo = function(arglist__3989) {
            var x = cljs.core.first(arglist__3989);
            var y = cljs.core.first(cljs.core.next(arglist__3989));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3989)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3989)));
            return G__3988__delegate.call(this, x, y, z, args)
          };
          return G__3988
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__3982.call(this);
            case 1:
              return epn__3983.call(this, x);
            case 2:
              return epn__3984.call(this, x, y);
            case 3:
              return epn__3985.call(this, x, y, z);
            default:
              return epn__3986.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__3986.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__3981 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3981__delegate.call(this, p1, p2, p3, ps)
    };
    G__3981.cljs$lang$maxFixedArity = 3;
    G__3981.cljs$lang$applyTo = function(arglist__3990) {
      var p1 = cljs.core.first(arglist__3990);
      var p2 = cljs.core.first(cljs.core.next(arglist__3990));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3990)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3990)));
      return G__3981__delegate.call(this, p1, p2, p3, ps)
    };
    return G__3981
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__3952.call(this, p1);
      case 2:
        return every_pred__3953.call(this, p1, p2);
      case 3:
        return every_pred__3954.call(this, p1, p2, p3);
      default:
        return every_pred__3955.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__3955.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__4030 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__4035 = function() {
        return null
      };
      var sp1__4036 = function(x) {
        return p.call(null, x)
      };
      var sp1__4037 = function(x, y) {
        var or__3548__auto____3992 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3992)) {
          return or__3548__auto____3992
        }else {
          return p.call(null, y)
        }
      };
      var sp1__4038 = function(x, y, z) {
        var or__3548__auto____3993 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3993)) {
          return or__3548__auto____3993
        }else {
          var or__3548__auto____3994 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3994)) {
            return or__3548__auto____3994
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4039 = function() {
        var G__4041__delegate = function(x, y, z, args) {
          var or__3548__auto____3995 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____3995)) {
            return or__3548__auto____3995
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__4041 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4041__delegate.call(this, x, y, z, args)
        };
        G__4041.cljs$lang$maxFixedArity = 3;
        G__4041.cljs$lang$applyTo = function(arglist__4042) {
          var x = cljs.core.first(arglist__4042);
          var y = cljs.core.first(cljs.core.next(arglist__4042));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4042)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4042)));
          return G__4041__delegate.call(this, x, y, z, args)
        };
        return G__4041
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__4035.call(this);
          case 1:
            return sp1__4036.call(this, x);
          case 2:
            return sp1__4037.call(this, x, y);
          case 3:
            return sp1__4038.call(this, x, y, z);
          default:
            return sp1__4039.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4039.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__4031 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__4043 = function() {
        return null
      };
      var sp2__4044 = function(x) {
        var or__3548__auto____3996 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3996)) {
          return or__3548__auto____3996
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__4045 = function(x, y) {
        var or__3548__auto____3997 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____3997)) {
          return or__3548__auto____3997
        }else {
          var or__3548__auto____3998 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____3998)) {
            return or__3548__auto____3998
          }else {
            var or__3548__auto____3999 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____3999)) {
              return or__3548__auto____3999
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__4046 = function(x, y, z) {
        var or__3548__auto____4000 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4000)) {
          return or__3548__auto____4000
        }else {
          var or__3548__auto____4001 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4001)) {
            return or__3548__auto____4001
          }else {
            var or__3548__auto____4002 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____4002)) {
              return or__3548__auto____4002
            }else {
              var or__3548__auto____4003 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____4003)) {
                return or__3548__auto____4003
              }else {
                var or__3548__auto____4004 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4004)) {
                  return or__3548__auto____4004
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4047 = function() {
        var G__4049__delegate = function(x, y, z, args) {
          var or__3548__auto____4005 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4005)) {
            return or__3548__auto____4005
          }else {
            return cljs.core.some.call(null, function(p1__3908_SHARP_) {
              var or__3548__auto____4006 = p1.call(null, p1__3908_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4006)) {
                return or__3548__auto____4006
              }else {
                return p2.call(null, p1__3908_SHARP_)
              }
            }, args)
          }
        };
        var G__4049 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4049__delegate.call(this, x, y, z, args)
        };
        G__4049.cljs$lang$maxFixedArity = 3;
        G__4049.cljs$lang$applyTo = function(arglist__4050) {
          var x = cljs.core.first(arglist__4050);
          var y = cljs.core.first(cljs.core.next(arglist__4050));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4050)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4050)));
          return G__4049__delegate.call(this, x, y, z, args)
        };
        return G__4049
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__4043.call(this);
          case 1:
            return sp2__4044.call(this, x);
          case 2:
            return sp2__4045.call(this, x, y);
          case 3:
            return sp2__4046.call(this, x, y, z);
          default:
            return sp2__4047.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4047.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__4032 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__4051 = function() {
        return null
      };
      var sp3__4052 = function(x) {
        var or__3548__auto____4007 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4007)) {
          return or__3548__auto____4007
        }else {
          var or__3548__auto____4008 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4008)) {
            return or__3548__auto____4008
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__4053 = function(x, y) {
        var or__3548__auto____4009 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4009)) {
          return or__3548__auto____4009
        }else {
          var or__3548__auto____4010 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4010)) {
            return or__3548__auto____4010
          }else {
            var or__3548__auto____4011 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4011)) {
              return or__3548__auto____4011
            }else {
              var or__3548__auto____4012 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4012)) {
                return or__3548__auto____4012
              }else {
                var or__3548__auto____4013 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4013)) {
                  return or__3548__auto____4013
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__4054 = function(x, y, z) {
        var or__3548__auto____4014 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4014)) {
          return or__3548__auto____4014
        }else {
          var or__3548__auto____4015 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4015)) {
            return or__3548__auto____4015
          }else {
            var or__3548__auto____4016 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4016)) {
              return or__3548__auto____4016
            }else {
              var or__3548__auto____4017 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4017)) {
                return or__3548__auto____4017
              }else {
                var or__3548__auto____4018 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4018)) {
                  return or__3548__auto____4018
                }else {
                  var or__3548__auto____4019 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____4019)) {
                    return or__3548__auto____4019
                  }else {
                    var or__3548__auto____4020 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____4020)) {
                      return or__3548__auto____4020
                    }else {
                      var or__3548__auto____4021 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____4021)) {
                        return or__3548__auto____4021
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4055 = function() {
        var G__4057__delegate = function(x, y, z, args) {
          var or__3548__auto____4022 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4022)) {
            return or__3548__auto____4022
          }else {
            return cljs.core.some.call(null, function(p1__3909_SHARP_) {
              var or__3548__auto____4023 = p1.call(null, p1__3909_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4023)) {
                return or__3548__auto____4023
              }else {
                var or__3548__auto____4024 = p2.call(null, p1__3909_SHARP_);
                if(cljs.core.truth_(or__3548__auto____4024)) {
                  return or__3548__auto____4024
                }else {
                  return p3.call(null, p1__3909_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__4057 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4057__delegate.call(this, x, y, z, args)
        };
        G__4057.cljs$lang$maxFixedArity = 3;
        G__4057.cljs$lang$applyTo = function(arglist__4058) {
          var x = cljs.core.first(arglist__4058);
          var y = cljs.core.first(cljs.core.next(arglist__4058));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4058)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4058)));
          return G__4057__delegate.call(this, x, y, z, args)
        };
        return G__4057
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__4051.call(this);
          case 1:
            return sp3__4052.call(this, x);
          case 2:
            return sp3__4053.call(this, x, y);
          case 3:
            return sp3__4054.call(this, x, y, z);
          default:
            return sp3__4055.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4055.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__4033 = function() {
    var G__4059__delegate = function(p1, p2, p3, ps) {
      var ps__4025 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__4060 = function() {
          return null
        };
        var spn__4061 = function(x) {
          return cljs.core.some.call(null, function(p1__3910_SHARP_) {
            return p1__3910_SHARP_.call(null, x)
          }, ps__4025)
        };
        var spn__4062 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3911_SHARP_) {
            var or__3548__auto____4026 = p1__3911_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4026)) {
              return or__3548__auto____4026
            }else {
              return p1__3911_SHARP_.call(null, y)
            }
          }, ps__4025)
        };
        var spn__4063 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3912_SHARP_) {
            var or__3548__auto____4027 = p1__3912_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4027)) {
              return or__3548__auto____4027
            }else {
              var or__3548__auto____4028 = p1__3912_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4028)) {
                return or__3548__auto____4028
              }else {
                return p1__3912_SHARP_.call(null, z)
              }
            }
          }, ps__4025)
        };
        var spn__4064 = function() {
          var G__4066__delegate = function(x, y, z, args) {
            var or__3548__auto____4029 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____4029)) {
              return or__3548__auto____4029
            }else {
              return cljs.core.some.call(null, function(p1__3913_SHARP_) {
                return cljs.core.some.call(null, p1__3913_SHARP_, args)
              }, ps__4025)
            }
          };
          var G__4066 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4066__delegate.call(this, x, y, z, args)
          };
          G__4066.cljs$lang$maxFixedArity = 3;
          G__4066.cljs$lang$applyTo = function(arglist__4067) {
            var x = cljs.core.first(arglist__4067);
            var y = cljs.core.first(cljs.core.next(arglist__4067));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4067)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4067)));
            return G__4066__delegate.call(this, x, y, z, args)
          };
          return G__4066
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__4060.call(this);
            case 1:
              return spn__4061.call(this, x);
            case 2:
              return spn__4062.call(this, x, y);
            case 3:
              return spn__4063.call(this, x, y, z);
            default:
              return spn__4064.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4064.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__4059 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4059__delegate.call(this, p1, p2, p3, ps)
    };
    G__4059.cljs$lang$maxFixedArity = 3;
    G__4059.cljs$lang$applyTo = function(arglist__4068) {
      var p1 = cljs.core.first(arglist__4068);
      var p2 = cljs.core.first(cljs.core.next(arglist__4068));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4068)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4068)));
      return G__4059__delegate.call(this, p1, p2, p3, ps)
    };
    return G__4059
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__4030.call(this, p1);
      case 2:
        return some_fn__4031.call(this, p1, p2);
      case 3:
        return some_fn__4032.call(this, p1, p2, p3);
      default:
        return some_fn__4033.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4033.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__4081 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4069 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4069)) {
        var s__4070 = temp__3698__auto____4069;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__4070)), map.call(null, f, cljs.core.rest.call(null, s__4070)))
      }else {
        return null
      }
    })
  };
  var map__4082 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4071 = cljs.core.seq.call(null, c1);
      var s2__4072 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4073 = s1__4071;
        if(cljs.core.truth_(and__3546__auto____4073)) {
          return s2__4072
        }else {
          return and__3546__auto____4073
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4071), cljs.core.first.call(null, s2__4072)), map.call(null, f, cljs.core.rest.call(null, s1__4071), cljs.core.rest.call(null, s2__4072)))
      }else {
        return null
      }
    })
  };
  var map__4083 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4074 = cljs.core.seq.call(null, c1);
      var s2__4075 = cljs.core.seq.call(null, c2);
      var s3__4076 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4077 = s1__4074;
        if(cljs.core.truth_(and__3546__auto____4077)) {
          var and__3546__auto____4078 = s2__4075;
          if(cljs.core.truth_(and__3546__auto____4078)) {
            return s3__4076
          }else {
            return and__3546__auto____4078
          }
        }else {
          return and__3546__auto____4077
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4074), cljs.core.first.call(null, s2__4075), cljs.core.first.call(null, s3__4076)), map.call(null, f, cljs.core.rest.call(null, s1__4074), cljs.core.rest.call(null, s2__4075), cljs.core.rest.call(null, s3__4076)))
      }else {
        return null
      }
    })
  };
  var map__4084 = function() {
    var G__4086__delegate = function(f, c1, c2, c3, colls) {
      var step__4080 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__4079 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4079))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__4079), step.call(null, map.call(null, cljs.core.rest, ss__4079)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__3991_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3991_SHARP_)
      }, step__4080.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__4086 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4086__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4086.cljs$lang$maxFixedArity = 4;
    G__4086.cljs$lang$applyTo = function(arglist__4087) {
      var f = cljs.core.first(arglist__4087);
      var c1 = cljs.core.first(cljs.core.next(arglist__4087));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4087)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4087))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4087))));
      return G__4086__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__4086
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__4081.call(this, f, c1);
      case 3:
        return map__4082.call(this, f, c1, c2);
      case 4:
        return map__4083.call(this, f, c1, c2, c3);
      default:
        return map__4084.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__4084.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____4088 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4088)) {
        var s__4089 = temp__3698__auto____4088;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4089), take.call(null, n - 1, cljs.core.rest.call(null, s__4089)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__4092 = function(n, coll) {
    while(true) {
      var s__4090 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4091 = n > 0;
        if(cljs.core.truth_(and__3546__auto____4091)) {
          return s__4090
        }else {
          return and__3546__auto____4091
        }
      }())) {
        var G__4093 = n - 1;
        var G__4094 = cljs.core.rest.call(null, s__4090);
        n = G__4093;
        coll = G__4094;
        continue
      }else {
        return s__4090
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4092.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__4095 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__4096 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__4095.call(this, n);
      case 2:
        return drop_last__4096.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__4098 = cljs.core.seq.call(null, coll);
  var lead__4099 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__4099)) {
      var G__4100 = cljs.core.next.call(null, s__4098);
      var G__4101 = cljs.core.next.call(null, lead__4099);
      s__4098 = G__4100;
      lead__4099 = G__4101;
      continue
    }else {
      return s__4098
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__4104 = function(pred, coll) {
    while(true) {
      var s__4102 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4103 = s__4102;
        if(cljs.core.truth_(and__3546__auto____4103)) {
          return pred.call(null, cljs.core.first.call(null, s__4102))
        }else {
          return and__3546__auto____4103
        }
      }())) {
        var G__4105 = pred;
        var G__4106 = cljs.core.rest.call(null, s__4102);
        pred = G__4105;
        coll = G__4106;
        continue
      }else {
        return s__4102
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4104.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4107 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4107)) {
      var s__4108 = temp__3698__auto____4107;
      return cljs.core.concat.call(null, s__4108, cycle.call(null, s__4108))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__4109 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__4110 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__4109.call(this, n);
      case 2:
        return repeat__4110.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__4112 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__4113 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__4112.call(this, n);
      case 2:
        return repeatedly__4113.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__4119 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4115 = cljs.core.seq.call(null, c1);
      var s2__4116 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4117 = s1__4115;
        if(cljs.core.truth_(and__3546__auto____4117)) {
          return s2__4116
        }else {
          return and__3546__auto____4117
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__4115), cljs.core.cons.call(null, cljs.core.first.call(null, s2__4116), interleave.call(null, cljs.core.rest.call(null, s1__4115), cljs.core.rest.call(null, s2__4116))))
      }else {
        return null
      }
    })
  };
  var interleave__4120 = function() {
    var G__4122__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__4118 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4118))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__4118), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__4118)))
        }else {
          return null
        }
      })
    };
    var G__4122 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4122__delegate.call(this, c1, c2, colls)
    };
    G__4122.cljs$lang$maxFixedArity = 2;
    G__4122.cljs$lang$applyTo = function(arglist__4123) {
      var c1 = cljs.core.first(arglist__4123);
      var c2 = cljs.core.first(cljs.core.next(arglist__4123));
      var colls = cljs.core.rest(cljs.core.next(arglist__4123));
      return G__4122__delegate.call(this, c1, c2, colls)
    };
    return G__4122
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__4119.call(this, c1, c2);
      default:
        return interleave__4120.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__4120.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__4126 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4124 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4124)) {
        var coll__4125 = temp__3695__auto____4124;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__4125), cat.call(null, cljs.core.rest.call(null, coll__4125), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__4126.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__4127 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__4128 = function() {
    var G__4130__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__4130 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4130__delegate.call(this, f, coll, colls)
    };
    G__4130.cljs$lang$maxFixedArity = 2;
    G__4130.cljs$lang$applyTo = function(arglist__4131) {
      var f = cljs.core.first(arglist__4131);
      var coll = cljs.core.first(cljs.core.next(arglist__4131));
      var colls = cljs.core.rest(cljs.core.next(arglist__4131));
      return G__4130__delegate.call(this, f, coll, colls)
    };
    return G__4130
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__4127.call(this, f, coll);
      default:
        return mapcat__4128.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__4128.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4132 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4132)) {
      var s__4133 = temp__3698__auto____4132;
      var f__4134 = cljs.core.first.call(null, s__4133);
      var r__4135 = cljs.core.rest.call(null, s__4133);
      if(cljs.core.truth_(pred.call(null, f__4134))) {
        return cljs.core.cons.call(null, f__4134, filter.call(null, pred, r__4135))
      }else {
        return filter.call(null, pred, r__4135)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__4137 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__4137.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__4136_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__4136_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__4144 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__4145 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4138 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4138)) {
        var s__4139 = temp__3698__auto____4138;
        var p__4140 = cljs.core.take.call(null, n, s__4139);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4140)))) {
          return cljs.core.cons.call(null, p__4140, partition.call(null, n, step, cljs.core.drop.call(null, step, s__4139)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4146 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4141 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4141)) {
        var s__4142 = temp__3698__auto____4141;
        var p__4143 = cljs.core.take.call(null, n, s__4142);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4143)))) {
          return cljs.core.cons.call(null, p__4143, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__4142)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__4143, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__4144.call(this, n, step);
      case 3:
        return partition__4145.call(this, n, step, pad);
      case 4:
        return partition__4146.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__4152 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__4153 = function(m, ks, not_found) {
    var sentinel__4148 = cljs.core.lookup_sentinel;
    var m__4149 = m;
    var ks__4150 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__4150)) {
        var m__4151 = cljs.core.get.call(null, m__4149, cljs.core.first.call(null, ks__4150), sentinel__4148);
        if(cljs.core.truth_(sentinel__4148 === m__4151)) {
          return not_found
        }else {
          var G__4155 = sentinel__4148;
          var G__4156 = m__4151;
          var G__4157 = cljs.core.next.call(null, ks__4150);
          sentinel__4148 = G__4155;
          m__4149 = G__4156;
          ks__4150 = G__4157;
          continue
        }
      }else {
        return m__4149
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__4152.call(this, m, ks);
      case 3:
        return get_in__4153.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4158, v) {
  var vec__4159__4160 = p__4158;
  var k__4161 = cljs.core.nth.call(null, vec__4159__4160, 0, null);
  var ks__4162 = cljs.core.nthnext.call(null, vec__4159__4160, 1);
  if(cljs.core.truth_(ks__4162)) {
    return cljs.core.assoc.call(null, m, k__4161, assoc_in.call(null, cljs.core.get.call(null, m, k__4161), ks__4162, v))
  }else {
    return cljs.core.assoc.call(null, m, k__4161, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__4163, f, args) {
    var vec__4164__4165 = p__4163;
    var k__4166 = cljs.core.nth.call(null, vec__4164__4165, 0, null);
    var ks__4167 = cljs.core.nthnext.call(null, vec__4164__4165, 1);
    if(cljs.core.truth_(ks__4167)) {
      return cljs.core.assoc.call(null, m, k__4166, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__4166), ks__4167, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__4166, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__4166), args))
    }
  };
  var update_in = function(m, p__4163, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__4163, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__4168) {
    var m = cljs.core.first(arglist__4168);
    var p__4163 = cljs.core.first(cljs.core.next(arglist__4168));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4168)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4168)));
    return update_in__delegate.call(this, m, p__4163, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4169 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4202 = null;
  var G__4202__4203 = function(coll, k) {
    var this__4170 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4202__4204 = function(coll, k, not_found) {
    var this__4171 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4202 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4202__4203.call(this, coll, k);
      case 3:
        return G__4202__4204.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4202
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4172 = this;
  var new_array__4173 = cljs.core.aclone.call(null, this__4172.array);
  new_array__4173[k] = v;
  return new cljs.core.Vector(this__4172.meta, new_array__4173)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__4206 = null;
  var G__4206__4207 = function(tsym4174, k) {
    var this__4176 = this;
    var tsym4174__4177 = this;
    var coll__4178 = tsym4174__4177;
    return cljs.core._lookup.call(null, coll__4178, k)
  };
  var G__4206__4208 = function(tsym4175, k, not_found) {
    var this__4179 = this;
    var tsym4175__4180 = this;
    var coll__4181 = tsym4175__4180;
    return cljs.core._lookup.call(null, coll__4181, k, not_found)
  };
  G__4206 = function(tsym4175, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4206__4207.call(this, tsym4175, k);
      case 3:
        return G__4206__4208.call(this, tsym4175, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4206
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4182 = this;
  var new_array__4183 = cljs.core.aclone.call(null, this__4182.array);
  new_array__4183.push(o);
  return new cljs.core.Vector(this__4182.meta, new_array__4183)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4210 = null;
  var G__4210__4211 = function(v, f) {
    var this__4184 = this;
    return cljs.core.ci_reduce.call(null, this__4184.array, f)
  };
  var G__4210__4212 = function(v, f, start) {
    var this__4185 = this;
    return cljs.core.ci_reduce.call(null, this__4185.array, f, start)
  };
  G__4210 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4210__4211.call(this, v, f);
      case 3:
        return G__4210__4212.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4210
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4186 = this;
  if(cljs.core.truth_(this__4186.array.length > 0)) {
    var vector_seq__4187 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4186.array.length)) {
          return cljs.core.cons.call(null, this__4186.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4187.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4188 = this;
  return this__4188.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4189 = this;
  var count__4190 = this__4189.array.length;
  if(cljs.core.truth_(count__4190 > 0)) {
    return this__4189.array[count__4190 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4191 = this;
  if(cljs.core.truth_(this__4191.array.length > 0)) {
    var new_array__4192 = cljs.core.aclone.call(null, this__4191.array);
    new_array__4192.pop();
    return new cljs.core.Vector(this__4191.meta, new_array__4192)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4193 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4194 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4195 = this;
  return new cljs.core.Vector(meta, this__4195.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4196 = this;
  return this__4196.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4214 = null;
  var G__4214__4215 = function(coll, n) {
    var this__4197 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4198 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4198)) {
        return n < this__4197.array.length
      }else {
        return and__3546__auto____4198
      }
    }())) {
      return this__4197.array[n]
    }else {
      return null
    }
  };
  var G__4214__4216 = function(coll, n, not_found) {
    var this__4199 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4200 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4200)) {
        return n < this__4199.array.length
      }else {
        return and__3546__auto____4200
      }
    }())) {
      return this__4199.array[n]
    }else {
      return not_found
    }
  };
  G__4214 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4214__4215.call(this, coll, n);
      case 3:
        return G__4214__4216.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4214
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4201 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4201.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4218) {
    var args = cljs.core.seq(arglist__4218);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.tail_off = function tail_off(pv) {
  var cnt__4219 = pv.cnt;
  if(cljs.core.truth_(cnt__4219 < 32)) {
    return 0
  }else {
    return cnt__4219 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__4220 = level;
  var ret__4221 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__4220))) {
      return ret__4221
    }else {
      var embed__4222 = ret__4221;
      var r__4223 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___4224 = r__4223[0] = embed__4222;
      var G__4225 = ll__4220 - 5;
      var G__4226 = r__4223;
      ll__4220 = G__4225;
      ret__4221 = G__4226;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__4227 = cljs.core.aclone.call(null, parent);
  var subidx__4228 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__4227[subidx__4228] = tailnode;
    return ret__4227
  }else {
    var temp__3695__auto____4229 = parent[subidx__4228];
    if(cljs.core.truth_(temp__3695__auto____4229)) {
      var child__4230 = temp__3695__auto____4229;
      var node_to_insert__4231 = push_tail.call(null, pv, level - 5, child__4230, tailnode);
      var ___4232 = ret__4227[subidx__4228] = node_to_insert__4231;
      return ret__4227
    }else {
      var node_to_insert__4233 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___4234 = ret__4227[subidx__4228] = node_to_insert__4233;
      return ret__4227
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4235 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____4235)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____4235
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__4236 = pv.root;
      var level__4237 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__4237 > 0)) {
          var G__4238 = node__4236[i >> level__4237 & 31];
          var G__4239 = level__4237 - 5;
          node__4236 = G__4238;
          level__4237 = G__4239;
          continue
        }else {
          return node__4236
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__4240 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__4240[i & 31] = val;
    return ret__4240
  }else {
    var subidx__4241 = i >> level & 31;
    var ___4242 = ret__4240[subidx__4241] = do_assoc.call(null, pv, level - 5, node[subidx__4241], i, val);
    return ret__4240
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__4243 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__4244 = pop_tail.call(null, pv, level - 5, node[subidx__4243]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____4245 = new_child__4244 === null;
      if(cljs.core.truth_(and__3546__auto____4245)) {
        return subidx__4243 === 0
      }else {
        return and__3546__auto____4245
      }
    }())) {
      return null
    }else {
      var ret__4246 = cljs.core.aclone.call(null, node);
      var ___4247 = ret__4246[subidx__4243] = new_child__4244;
      return ret__4246
    }
  }else {
    if(cljs.core.truth_(subidx__4243 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__4248 = cljs.core.aclone.call(null, node);
        var ___4249 = ret__4248[subidx__4243] = null;
        return ret__4248
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail
};
cljs.core.PersistentVector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4250 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4290 = null;
  var G__4290__4291 = function(coll, k) {
    var this__4251 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4290__4292 = function(coll, k, not_found) {
    var this__4252 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4290 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4290__4291.call(this, coll, k);
      case 3:
        return G__4290__4292.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4290
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4253 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4254 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____4254)) {
      return k < this__4253.cnt
    }else {
      return and__3546__auto____4254
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__4255 = cljs.core.aclone.call(null, this__4253.tail);
      new_tail__4255[k & 31] = v;
      return new cljs.core.PersistentVector(this__4253.meta, this__4253.cnt, this__4253.shift, this__4253.root, new_tail__4255)
    }else {
      return new cljs.core.PersistentVector(this__4253.meta, this__4253.cnt, this__4253.shift, cljs.core.do_assoc.call(null, coll, this__4253.shift, this__4253.root, k, v), this__4253.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__4253.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__4253.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__4294 = null;
  var G__4294__4295 = function(tsym4256, k) {
    var this__4258 = this;
    var tsym4256__4259 = this;
    var coll__4260 = tsym4256__4259;
    return cljs.core._lookup.call(null, coll__4260, k)
  };
  var G__4294__4296 = function(tsym4257, k, not_found) {
    var this__4261 = this;
    var tsym4257__4262 = this;
    var coll__4263 = tsym4257__4262;
    return cljs.core._lookup.call(null, coll__4263, k, not_found)
  };
  G__4294 = function(tsym4257, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4294__4295.call(this, tsym4257, k);
      case 3:
        return G__4294__4296.call(this, tsym4257, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4294
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4264 = this;
  if(cljs.core.truth_(this__4264.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__4265 = cljs.core.aclone.call(null, this__4264.tail);
    new_tail__4265.push(o);
    return new cljs.core.PersistentVector(this__4264.meta, this__4264.cnt + 1, this__4264.shift, this__4264.root, new_tail__4265)
  }else {
    var root_overflow_QMARK___4266 = this__4264.cnt >> 5 > 1 << this__4264.shift;
    var new_shift__4267 = cljs.core.truth_(root_overflow_QMARK___4266) ? this__4264.shift + 5 : this__4264.shift;
    var new_root__4269 = cljs.core.truth_(root_overflow_QMARK___4266) ? function() {
      var n_r__4268 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__4268[0] = this__4264.root;
      n_r__4268[1] = cljs.core.new_path.call(null, this__4264.shift, this__4264.tail);
      return n_r__4268
    }() : cljs.core.push_tail.call(null, coll, this__4264.shift, this__4264.root, this__4264.tail);
    return new cljs.core.PersistentVector(this__4264.meta, this__4264.cnt + 1, new_shift__4267, new_root__4269, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4298 = null;
  var G__4298__4299 = function(v, f) {
    var this__4270 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__4298__4300 = function(v, f, start) {
    var this__4271 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__4298 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4298__4299.call(this, v, f);
      case 3:
        return G__4298__4300.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4298
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4272 = this;
  if(cljs.core.truth_(this__4272.cnt > 0)) {
    var vector_seq__4273 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4272.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4273.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4274 = this;
  return this__4274.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4275 = this;
  if(cljs.core.truth_(this__4275.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__4275.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4276 = this;
  if(cljs.core.truth_(this__4276.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__4276.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__4276.meta)
    }else {
      if(cljs.core.truth_(1 < this__4276.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__4276.meta, this__4276.cnt - 1, this__4276.shift, this__4276.root, cljs.core.aclone.call(null, this__4276.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__4277 = cljs.core.array_for.call(null, coll, this__4276.cnt - 2);
          var nr__4278 = cljs.core.pop_tail.call(null, this__4276.shift, this__4276.root);
          var new_root__4279 = cljs.core.truth_(nr__4278 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__4278;
          var cnt_1__4280 = this__4276.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4281 = 5 < this__4276.shift;
            if(cljs.core.truth_(and__3546__auto____4281)) {
              return new_root__4279[1] === null
            }else {
              return and__3546__auto____4281
            }
          }())) {
            return new cljs.core.PersistentVector(this__4276.meta, cnt_1__4280, this__4276.shift - 5, new_root__4279[0], new_tail__4277)
          }else {
            return new cljs.core.PersistentVector(this__4276.meta, cnt_1__4280, this__4276.shift, new_root__4279, new_tail__4277)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4282 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4283 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4284 = this;
  return new cljs.core.PersistentVector(meta, this__4284.cnt, this__4284.shift, this__4284.root, this__4284.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4285 = this;
  return this__4285.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4302 = null;
  var G__4302__4303 = function(coll, n) {
    var this__4286 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__4302__4304 = function(coll, n, not_found) {
    var this__4287 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4288 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4288)) {
        return n < this__4287.cnt
      }else {
        return and__3546__auto____4288
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__4302 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4302__4303.call(this, coll, n);
      case 3:
        return G__4302__4304.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4302
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4289 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__4289.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = new Array(32);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, []);
cljs.core.PersistentVector.fromArray = function(xs) {
  return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4306 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4334 = null;
  var G__4334__4335 = function(coll, k) {
    var this__4307 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4334__4336 = function(coll, k, not_found) {
    var this__4308 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4334 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4334__4335.call(this, coll, k);
      case 3:
        return G__4334__4336.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4334
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__4309 = this;
  var v_pos__4310 = this__4309.start + key;
  return new cljs.core.Subvec(this__4309.meta, cljs.core._assoc.call(null, this__4309.v, v_pos__4310, val), this__4309.start, this__4309.end > v_pos__4310 + 1 ? this__4309.end : v_pos__4310 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__4338 = null;
  var G__4338__4339 = function(tsym4311, k) {
    var this__4313 = this;
    var tsym4311__4314 = this;
    var coll__4315 = tsym4311__4314;
    return cljs.core._lookup.call(null, coll__4315, k)
  };
  var G__4338__4340 = function(tsym4312, k, not_found) {
    var this__4316 = this;
    var tsym4312__4317 = this;
    var coll__4318 = tsym4312__4317;
    return cljs.core._lookup.call(null, coll__4318, k, not_found)
  };
  G__4338 = function(tsym4312, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4338__4339.call(this, tsym4312, k);
      case 3:
        return G__4338__4340.call(this, tsym4312, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4338
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4319 = this;
  return new cljs.core.Subvec(this__4319.meta, cljs.core._assoc_n.call(null, this__4319.v, this__4319.end, o), this__4319.start, this__4319.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4342 = null;
  var G__4342__4343 = function(coll, f) {
    var this__4320 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__4342__4344 = function(coll, f, start) {
    var this__4321 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__4342 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4342__4343.call(this, coll, f);
      case 3:
        return G__4342__4344.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4342
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4322 = this;
  var subvec_seq__4323 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__4322.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__4322.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__4323.call(null, this__4322.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4324 = this;
  return this__4324.end - this__4324.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4325 = this;
  return cljs.core._nth.call(null, this__4325.v, this__4325.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4326 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__4326.start, this__4326.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__4326.meta, this__4326.v, this__4326.start, this__4326.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4327 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4328 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4329 = this;
  return new cljs.core.Subvec(meta, this__4329.v, this__4329.start, this__4329.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4330 = this;
  return this__4330.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4346 = null;
  var G__4346__4347 = function(coll, n) {
    var this__4331 = this;
    return cljs.core._nth.call(null, this__4331.v, this__4331.start + n)
  };
  var G__4346__4348 = function(coll, n, not_found) {
    var this__4332 = this;
    return cljs.core._nth.call(null, this__4332.v, this__4332.start + n, not_found)
  };
  G__4346 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4346__4347.call(this, coll, n);
      case 3:
        return G__4346__4348.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4346
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4333 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4333.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__4350 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__4351 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__4350.call(this, v, start);
      case 3:
        return subvec__4351.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4353 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4354 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4355 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4356 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4356.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4357 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4358 = this;
  return cljs.core._first.call(null, this__4358.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4359 = this;
  var temp__3695__auto____4360 = cljs.core.next.call(null, this__4359.front);
  if(cljs.core.truth_(temp__3695__auto____4360)) {
    var f1__4361 = temp__3695__auto____4360;
    return new cljs.core.PersistentQueueSeq(this__4359.meta, f1__4361, this__4359.rear)
  }else {
    if(cljs.core.truth_(this__4359.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__4359.meta, this__4359.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4362 = this;
  return this__4362.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4363 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__4363.front, this__4363.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4364 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4365 = this;
  if(cljs.core.truth_(this__4365.front)) {
    return new cljs.core.PersistentQueue(this__4365.meta, this__4365.count + 1, this__4365.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____4366 = this__4365.rear;
      if(cljs.core.truth_(or__3548__auto____4366)) {
        return or__3548__auto____4366
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__4365.meta, this__4365.count + 1, cljs.core.conj.call(null, this__4365.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4367 = this;
  var rear__4368 = cljs.core.seq.call(null, this__4367.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____4369 = this__4367.front;
    if(cljs.core.truth_(or__3548__auto____4369)) {
      return or__3548__auto____4369
    }else {
      return rear__4368
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__4367.front, cljs.core.seq.call(null, rear__4368))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4370 = this;
  return this__4370.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4371 = this;
  return cljs.core._first.call(null, this__4371.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4372 = this;
  if(cljs.core.truth_(this__4372.front)) {
    var temp__3695__auto____4373 = cljs.core.next.call(null, this__4372.front);
    if(cljs.core.truth_(temp__3695__auto____4373)) {
      var f1__4374 = temp__3695__auto____4373;
      return new cljs.core.PersistentQueue(this__4372.meta, this__4372.count - 1, f1__4374, this__4372.rear)
    }else {
      return new cljs.core.PersistentQueue(this__4372.meta, this__4372.count - 1, cljs.core.seq.call(null, this__4372.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4375 = this;
  return cljs.core.first.call(null, this__4375.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4376 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4377 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4378 = this;
  return new cljs.core.PersistentQueue(meta, this__4378.count, this__4378.front, this__4378.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4379 = this;
  return this__4379.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4380 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4381 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__4382 = array.length;
  var i__4383 = 0;
  while(true) {
    if(cljs.core.truth_(i__4383 < len__4382)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__4383]))) {
        return i__4383
      }else {
        var G__4384 = i__4383 + incr;
        i__4383 = G__4384;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___4386 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4387 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4385 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____4385)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____4385
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___4386.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4387.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__4390 = cljs.core.hash.call(null, a);
  var b__4391 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__4390 < b__4391)) {
    return-1
  }else {
    if(cljs.core.truth_(a__4390 > b__4391)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4392 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4419 = null;
  var G__4419__4420 = function(coll, k) {
    var this__4393 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4419__4421 = function(coll, k, not_found) {
    var this__4394 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4394.strobj, this__4394.strobj[k], not_found)
  };
  G__4419 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4419__4420.call(this, coll, k);
      case 3:
        return G__4419__4421.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4419
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4395 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__4396 = goog.object.clone.call(null, this__4395.strobj);
    var overwrite_QMARK___4397 = new_strobj__4396.hasOwnProperty(k);
    new_strobj__4396[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___4397)) {
      return new cljs.core.ObjMap(this__4395.meta, this__4395.keys, new_strobj__4396)
    }else {
      var new_keys__4398 = cljs.core.aclone.call(null, this__4395.keys);
      new_keys__4398.push(k);
      return new cljs.core.ObjMap(this__4395.meta, new_keys__4398, new_strobj__4396)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__4395.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4399 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4399.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__4423 = null;
  var G__4423__4424 = function(tsym4400, k) {
    var this__4402 = this;
    var tsym4400__4403 = this;
    var coll__4404 = tsym4400__4403;
    return cljs.core._lookup.call(null, coll__4404, k)
  };
  var G__4423__4425 = function(tsym4401, k, not_found) {
    var this__4405 = this;
    var tsym4401__4406 = this;
    var coll__4407 = tsym4401__4406;
    return cljs.core._lookup.call(null, coll__4407, k, not_found)
  };
  G__4423 = function(tsym4401, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4423__4424.call(this, tsym4401, k);
      case 3:
        return G__4423__4425.call(this, tsym4401, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4423
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4408 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4409 = this;
  if(cljs.core.truth_(this__4409.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__4389_SHARP_) {
      return cljs.core.vector.call(null, p1__4389_SHARP_, this__4409.strobj[p1__4389_SHARP_])
    }, this__4409.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4410 = this;
  return this__4410.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4411 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4412 = this;
  return new cljs.core.ObjMap(meta, this__4412.keys, this__4412.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4413 = this;
  return this__4413.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4414 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__4414.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4415 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4416 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____4416)) {
      return this__4415.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____4416
    }
  }())) {
    var new_keys__4417 = cljs.core.aclone.call(null, this__4415.keys);
    var new_strobj__4418 = goog.object.clone.call(null, this__4415.strobj);
    new_keys__4417.splice(cljs.core.scan_array.call(null, 1, k, new_keys__4417), 1);
    cljs.core.js_delete.call(null, new_strobj__4418, k);
    return new cljs.core.ObjMap(this__4415.meta, new_keys__4417, new_strobj__4418)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4428 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4466 = null;
  var G__4466__4467 = function(coll, k) {
    var this__4429 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4466__4468 = function(coll, k, not_found) {
    var this__4430 = this;
    var bucket__4431 = this__4430.hashobj[cljs.core.hash.call(null, k)];
    var i__4432 = cljs.core.truth_(bucket__4431) ? cljs.core.scan_array.call(null, 2, k, bucket__4431) : null;
    if(cljs.core.truth_(i__4432)) {
      return bucket__4431[i__4432 + 1]
    }else {
      return not_found
    }
  };
  G__4466 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4466__4467.call(this, coll, k);
      case 3:
        return G__4466__4468.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4466
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4433 = this;
  var h__4434 = cljs.core.hash.call(null, k);
  var bucket__4435 = this__4433.hashobj[h__4434];
  if(cljs.core.truth_(bucket__4435)) {
    var new_bucket__4436 = cljs.core.aclone.call(null, bucket__4435);
    var new_hashobj__4437 = goog.object.clone.call(null, this__4433.hashobj);
    new_hashobj__4437[h__4434] = new_bucket__4436;
    var temp__3695__auto____4438 = cljs.core.scan_array.call(null, 2, k, new_bucket__4436);
    if(cljs.core.truth_(temp__3695__auto____4438)) {
      var i__4439 = temp__3695__auto____4438;
      new_bucket__4436[i__4439 + 1] = v;
      return new cljs.core.HashMap(this__4433.meta, this__4433.count, new_hashobj__4437)
    }else {
      new_bucket__4436.push(k, v);
      return new cljs.core.HashMap(this__4433.meta, this__4433.count + 1, new_hashobj__4437)
    }
  }else {
    var new_hashobj__4440 = goog.object.clone.call(null, this__4433.hashobj);
    new_hashobj__4440[h__4434] = [k, v];
    return new cljs.core.HashMap(this__4433.meta, this__4433.count + 1, new_hashobj__4440)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4441 = this;
  var bucket__4442 = this__4441.hashobj[cljs.core.hash.call(null, k)];
  var i__4443 = cljs.core.truth_(bucket__4442) ? cljs.core.scan_array.call(null, 2, k, bucket__4442) : null;
  if(cljs.core.truth_(i__4443)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__4470 = null;
  var G__4470__4471 = function(tsym4444, k) {
    var this__4446 = this;
    var tsym4444__4447 = this;
    var coll__4448 = tsym4444__4447;
    return cljs.core._lookup.call(null, coll__4448, k)
  };
  var G__4470__4472 = function(tsym4445, k, not_found) {
    var this__4449 = this;
    var tsym4445__4450 = this;
    var coll__4451 = tsym4445__4450;
    return cljs.core._lookup.call(null, coll__4451, k, not_found)
  };
  G__4470 = function(tsym4445, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4470__4471.call(this, tsym4445, k);
      case 3:
        return G__4470__4472.call(this, tsym4445, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4470
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4452 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4453 = this;
  if(cljs.core.truth_(this__4453.count > 0)) {
    var hashes__4454 = cljs.core.js_keys.call(null, this__4453.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__4427_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__4453.hashobj[p1__4427_SHARP_]))
    }, hashes__4454)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4455 = this;
  return this__4455.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4456 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4457 = this;
  return new cljs.core.HashMap(meta, this__4457.count, this__4457.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4458 = this;
  return this__4458.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4459 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__4459.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4460 = this;
  var h__4461 = cljs.core.hash.call(null, k);
  var bucket__4462 = this__4460.hashobj[h__4461];
  var i__4463 = cljs.core.truth_(bucket__4462) ? cljs.core.scan_array.call(null, 2, k, bucket__4462) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__4463))) {
    return coll
  }else {
    var new_hashobj__4464 = goog.object.clone.call(null, this__4460.hashobj);
    if(cljs.core.truth_(3 > bucket__4462.length)) {
      cljs.core.js_delete.call(null, new_hashobj__4464, h__4461)
    }else {
      var new_bucket__4465 = cljs.core.aclone.call(null, bucket__4462);
      new_bucket__4465.splice(i__4463, 2);
      new_hashobj__4464[h__4461] = new_bucket__4465
    }
    return new cljs.core.HashMap(this__4460.meta, this__4460.count - 1, new_hashobj__4464)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__4474 = ks.length;
  var i__4475 = 0;
  var out__4476 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__4475 < len__4474)) {
      var G__4477 = i__4475 + 1;
      var G__4478 = cljs.core.assoc.call(null, out__4476, ks[i__4475], vs[i__4475]);
      i__4475 = G__4477;
      out__4476 = G__4478;
      continue
    }else {
      return out__4476
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__4479 = cljs.core.seq.call(null, keyvals);
    var out__4480 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__4479)) {
        var G__4481 = cljs.core.nnext.call(null, in$__4479);
        var G__4482 = cljs.core.assoc.call(null, out__4480, cljs.core.first.call(null, in$__4479), cljs.core.second.call(null, in$__4479));
        in$__4479 = G__4481;
        out__4480 = G__4482;
        continue
      }else {
        return out__4480
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4483) {
    var keyvals = cljs.core.seq(arglist__4483);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4484_SHARP_, p2__4485_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____4486 = p1__4484_SHARP_;
          if(cljs.core.truth_(or__3548__auto____4486)) {
            return or__3548__auto____4486
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__4485_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4487) {
    var maps = cljs.core.seq(arglist__4487);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__4490 = function(m, e) {
        var k__4488 = cljs.core.first.call(null, e);
        var v__4489 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__4488))) {
          return cljs.core.assoc.call(null, m, k__4488, f.call(null, cljs.core.get.call(null, m, k__4488), v__4489))
        }else {
          return cljs.core.assoc.call(null, m, k__4488, v__4489)
        }
      };
      var merge2__4492 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__4490, function() {
          var or__3548__auto____4491 = m1;
          if(cljs.core.truth_(or__3548__auto____4491)) {
            return or__3548__auto____4491
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__4492, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4493) {
    var f = cljs.core.first(arglist__4493);
    var maps = cljs.core.rest(arglist__4493);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__4495 = cljs.core.ObjMap.fromObject([], {});
  var keys__4496 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__4496)) {
      var key__4497 = cljs.core.first.call(null, keys__4496);
      var entry__4498 = cljs.core.get.call(null, map, key__4497, "\ufdd0'user/not-found");
      var G__4499 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__4498, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__4495, key__4497, entry__4498) : ret__4495;
      var G__4500 = cljs.core.next.call(null, keys__4496);
      ret__4495 = G__4499;
      keys__4496 = G__4500;
      continue
    }else {
      return ret__4495
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4501 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4522 = null;
  var G__4522__4523 = function(coll, v) {
    var this__4502 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4522__4524 = function(coll, v, not_found) {
    var this__4503 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__4503.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4522 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4522__4523.call(this, coll, v);
      case 3:
        return G__4522__4524.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4522
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__4526 = null;
  var G__4526__4527 = function(tsym4504, k) {
    var this__4506 = this;
    var tsym4504__4507 = this;
    var coll__4508 = tsym4504__4507;
    return cljs.core._lookup.call(null, coll__4508, k)
  };
  var G__4526__4528 = function(tsym4505, k, not_found) {
    var this__4509 = this;
    var tsym4505__4510 = this;
    var coll__4511 = tsym4505__4510;
    return cljs.core._lookup.call(null, coll__4511, k, not_found)
  };
  G__4526 = function(tsym4505, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4526__4527.call(this, tsym4505, k);
      case 3:
        return G__4526__4528.call(this, tsym4505, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4526
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4512 = this;
  return new cljs.core.Set(this__4512.meta, cljs.core.assoc.call(null, this__4512.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4513 = this;
  return cljs.core.keys.call(null, this__4513.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__4514 = this;
  return new cljs.core.Set(this__4514.meta, cljs.core.dissoc.call(null, this__4514.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4515 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4516 = this;
  var and__3546__auto____4517 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____4517)) {
    var and__3546__auto____4518 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____4518)) {
      return cljs.core.every_QMARK_.call(null, function(p1__4494_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4494_SHARP_)
      }, other)
    }else {
      return and__3546__auto____4518
    }
  }else {
    return and__3546__auto____4517
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4519 = this;
  return new cljs.core.Set(meta, this__4519.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4520 = this;
  return this__4520.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4521 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4521.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__4531 = cljs.core.seq.call(null, coll);
  var out__4532 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4531)))) {
      var G__4533 = cljs.core.rest.call(null, in$__4531);
      var G__4534 = cljs.core.conj.call(null, out__4532, cljs.core.first.call(null, in$__4531));
      in$__4531 = G__4533;
      out__4532 = G__4534;
      continue
    }else {
      return out__4532
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4535 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____4536 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____4536)) {
        var e__4537 = temp__3695__auto____4536;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4537))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4535, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4530_SHARP_) {
      var temp__3695__auto____4538 = cljs.core.find.call(null, smap, p1__4530_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____4538)) {
        var e__4539 = temp__3695__auto____4538;
        return cljs.core.second.call(null, e__4539)
      }else {
        return p1__4530_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4547 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4540, seen) {
        while(true) {
          var vec__4541__4542 = p__4540;
          var f__4543 = cljs.core.nth.call(null, vec__4541__4542, 0, null);
          var xs__4544 = vec__4541__4542;
          var temp__3698__auto____4545 = cljs.core.seq.call(null, xs__4544);
          if(cljs.core.truth_(temp__3698__auto____4545)) {
            var s__4546 = temp__3698__auto____4545;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4543))) {
              var G__4548 = cljs.core.rest.call(null, s__4546);
              var G__4549 = seen;
              p__4540 = G__4548;
              seen = G__4549;
              continue
            }else {
              return cljs.core.cons.call(null, f__4543, step.call(null, cljs.core.rest.call(null, s__4546), cljs.core.conj.call(null, seen, f__4543)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4547.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4550 = cljs.core.PersistentVector.fromArray([]);
  var s__4551 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4551))) {
      var G__4552 = cljs.core.conj.call(null, ret__4550, cljs.core.first.call(null, s__4551));
      var G__4553 = cljs.core.next.call(null, s__4551);
      ret__4550 = G__4552;
      s__4551 = G__4553;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4550)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____4554 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____4554)) {
        return or__3548__auto____4554
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4555 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4555 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4555 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____4556 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____4556)) {
      return or__3548__auto____4556
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4557 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4557 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4557)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4560 = cljs.core.ObjMap.fromObject([], {});
  var ks__4561 = cljs.core.seq.call(null, keys);
  var vs__4562 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4563 = ks__4561;
      if(cljs.core.truth_(and__3546__auto____4563)) {
        return vs__4562
      }else {
        return and__3546__auto____4563
      }
    }())) {
      var G__4564 = cljs.core.assoc.call(null, map__4560, cljs.core.first.call(null, ks__4561), cljs.core.first.call(null, vs__4562));
      var G__4565 = cljs.core.next.call(null, ks__4561);
      var G__4566 = cljs.core.next.call(null, vs__4562);
      map__4560 = G__4564;
      ks__4561 = G__4565;
      vs__4562 = G__4566;
      continue
    }else {
      return map__4560
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4569 = function(k, x) {
    return x
  };
  var max_key__4570 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4571 = function() {
    var G__4573__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4558_SHARP_, p2__4559_SHARP_) {
        return max_key.call(null, k, p1__4558_SHARP_, p2__4559_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4573 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4573__delegate.call(this, k, x, y, more)
    };
    G__4573.cljs$lang$maxFixedArity = 3;
    G__4573.cljs$lang$applyTo = function(arglist__4574) {
      var k = cljs.core.first(arglist__4574);
      var x = cljs.core.first(cljs.core.next(arglist__4574));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4574)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4574)));
      return G__4573__delegate.call(this, k, x, y, more)
    };
    return G__4573
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4569.call(this, k, x);
      case 3:
        return max_key__4570.call(this, k, x, y);
      default:
        return max_key__4571.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4571.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4575 = function(k, x) {
    return x
  };
  var min_key__4576 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4577 = function() {
    var G__4579__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4567_SHARP_, p2__4568_SHARP_) {
        return min_key.call(null, k, p1__4567_SHARP_, p2__4568_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4579 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4579__delegate.call(this, k, x, y, more)
    };
    G__4579.cljs$lang$maxFixedArity = 3;
    G__4579.cljs$lang$applyTo = function(arglist__4580) {
      var k = cljs.core.first(arglist__4580);
      var x = cljs.core.first(cljs.core.next(arglist__4580));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4580)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4580)));
      return G__4579__delegate.call(this, k, x, y, more)
    };
    return G__4579
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4575.call(this, k, x);
      case 3:
        return min_key__4576.call(this, k, x, y);
      default:
        return min_key__4577.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4577.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4583 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4584 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4581 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4581)) {
        var s__4582 = temp__3698__auto____4581;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4582), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4582)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4583.call(this, n, step);
      case 3:
        return partition_all__4584.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4586 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4586)) {
      var s__4587 = temp__3698__auto____4586;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4587)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4587), take_while.call(null, pred, cljs.core.rest.call(null, s__4587)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4588 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4589 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4605 = null;
  var G__4605__4606 = function(rng, f) {
    var this__4590 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4605__4607 = function(rng, f, s) {
    var this__4591 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4605 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4605__4606.call(this, rng, f);
      case 3:
        return G__4605__4607.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4605
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4592 = this;
  var comp__4593 = cljs.core.truth_(this__4592.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4593.call(null, this__4592.start, this__4592.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4594 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4594.end - this__4594.start) / this__4594.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4595 = this;
  return this__4595.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4596 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4596.meta, this__4596.start + this__4596.step, this__4596.end, this__4596.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4597 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4598 = this;
  return new cljs.core.Range(meta, this__4598.start, this__4598.end, this__4598.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4599 = this;
  return this__4599.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4609 = null;
  var G__4609__4610 = function(rng, n) {
    var this__4600 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4600.start + n * this__4600.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4601 = this__4600.start > this__4600.end;
        if(cljs.core.truth_(and__3546__auto____4601)) {
          return cljs.core._EQ_.call(null, this__4600.step, 0)
        }else {
          return and__3546__auto____4601
        }
      }())) {
        return this__4600.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4609__4611 = function(rng, n, not_found) {
    var this__4602 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4602.start + n * this__4602.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4603 = this__4602.start > this__4602.end;
        if(cljs.core.truth_(and__3546__auto____4603)) {
          return cljs.core._EQ_.call(null, this__4602.step, 0)
        }else {
          return and__3546__auto____4603
        }
      }())) {
        return this__4602.start
      }else {
        return not_found
      }
    }
  };
  G__4609 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4609__4610.call(this, rng, n);
      case 3:
        return G__4609__4611.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4609
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4604 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4604.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__4613 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4614 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4615 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4616 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4613.call(this);
      case 1:
        return range__4614.call(this, start);
      case 2:
        return range__4615.call(this, start, end);
      case 3:
        return range__4616.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4618 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4618)) {
      var s__4619 = temp__3698__auto____4618;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4619), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4619)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4621 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4621)) {
      var s__4622 = temp__3698__auto____4621;
      var fst__4623 = cljs.core.first.call(null, s__4622);
      var fv__4624 = f.call(null, fst__4623);
      var run__4625 = cljs.core.cons.call(null, fst__4623, cljs.core.take_while.call(null, function(p1__4620_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4624, f.call(null, p1__4620_SHARP_))
      }, cljs.core.next.call(null, s__4622)));
      return cljs.core.cons.call(null, run__4625, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4625), s__4622))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4640 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4636 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4636)) {
        var s__4637 = temp__3695__auto____4636;
        return reductions.call(null, f, cljs.core.first.call(null, s__4637), cljs.core.rest.call(null, s__4637))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4641 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4638 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4638)) {
        var s__4639 = temp__3698__auto____4638;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4639)), cljs.core.rest.call(null, s__4639))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4640.call(this, f, init);
      case 3:
        return reductions__4641.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4644 = function(f) {
    return function() {
      var G__4649 = null;
      var G__4649__4650 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4649__4651 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4649__4652 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4649__4653 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4649__4654 = function() {
        var G__4656__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4656 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4656__delegate.call(this, x, y, z, args)
        };
        G__4656.cljs$lang$maxFixedArity = 3;
        G__4656.cljs$lang$applyTo = function(arglist__4657) {
          var x = cljs.core.first(arglist__4657);
          var y = cljs.core.first(cljs.core.next(arglist__4657));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4657)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4657)));
          return G__4656__delegate.call(this, x, y, z, args)
        };
        return G__4656
      }();
      G__4649 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4649__4650.call(this);
          case 1:
            return G__4649__4651.call(this, x);
          case 2:
            return G__4649__4652.call(this, x, y);
          case 3:
            return G__4649__4653.call(this, x, y, z);
          default:
            return G__4649__4654.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4649.cljs$lang$maxFixedArity = 3;
      G__4649.cljs$lang$applyTo = G__4649__4654.cljs$lang$applyTo;
      return G__4649
    }()
  };
  var juxt__4645 = function(f, g) {
    return function() {
      var G__4658 = null;
      var G__4658__4659 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4658__4660 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4658__4661 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4658__4662 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4658__4663 = function() {
        var G__4665__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4665 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4665__delegate.call(this, x, y, z, args)
        };
        G__4665.cljs$lang$maxFixedArity = 3;
        G__4665.cljs$lang$applyTo = function(arglist__4666) {
          var x = cljs.core.first(arglist__4666);
          var y = cljs.core.first(cljs.core.next(arglist__4666));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4666)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4666)));
          return G__4665__delegate.call(this, x, y, z, args)
        };
        return G__4665
      }();
      G__4658 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4658__4659.call(this);
          case 1:
            return G__4658__4660.call(this, x);
          case 2:
            return G__4658__4661.call(this, x, y);
          case 3:
            return G__4658__4662.call(this, x, y, z);
          default:
            return G__4658__4663.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4658.cljs$lang$maxFixedArity = 3;
      G__4658.cljs$lang$applyTo = G__4658__4663.cljs$lang$applyTo;
      return G__4658
    }()
  };
  var juxt__4646 = function(f, g, h) {
    return function() {
      var G__4667 = null;
      var G__4667__4668 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4667__4669 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4667__4670 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4667__4671 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4667__4672 = function() {
        var G__4674__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4674 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4674__delegate.call(this, x, y, z, args)
        };
        G__4674.cljs$lang$maxFixedArity = 3;
        G__4674.cljs$lang$applyTo = function(arglist__4675) {
          var x = cljs.core.first(arglist__4675);
          var y = cljs.core.first(cljs.core.next(arglist__4675));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4675)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4675)));
          return G__4674__delegate.call(this, x, y, z, args)
        };
        return G__4674
      }();
      G__4667 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4667__4668.call(this);
          case 1:
            return G__4667__4669.call(this, x);
          case 2:
            return G__4667__4670.call(this, x, y);
          case 3:
            return G__4667__4671.call(this, x, y, z);
          default:
            return G__4667__4672.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4667.cljs$lang$maxFixedArity = 3;
      G__4667.cljs$lang$applyTo = G__4667__4672.cljs$lang$applyTo;
      return G__4667
    }()
  };
  var juxt__4647 = function() {
    var G__4676__delegate = function(f, g, h, fs) {
      var fs__4643 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4677 = null;
        var G__4677__4678 = function() {
          return cljs.core.reduce.call(null, function(p1__4626_SHARP_, p2__4627_SHARP_) {
            return cljs.core.conj.call(null, p1__4626_SHARP_, p2__4627_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__4643)
        };
        var G__4677__4679 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4628_SHARP_, p2__4629_SHARP_) {
            return cljs.core.conj.call(null, p1__4628_SHARP_, p2__4629_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__4643)
        };
        var G__4677__4680 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4630_SHARP_, p2__4631_SHARP_) {
            return cljs.core.conj.call(null, p1__4630_SHARP_, p2__4631_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__4643)
        };
        var G__4677__4681 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4632_SHARP_, p2__4633_SHARP_) {
            return cljs.core.conj.call(null, p1__4632_SHARP_, p2__4633_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__4643)
        };
        var G__4677__4682 = function() {
          var G__4684__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4634_SHARP_, p2__4635_SHARP_) {
              return cljs.core.conj.call(null, p1__4634_SHARP_, cljs.core.apply.call(null, p2__4635_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__4643)
          };
          var G__4684 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4684__delegate.call(this, x, y, z, args)
          };
          G__4684.cljs$lang$maxFixedArity = 3;
          G__4684.cljs$lang$applyTo = function(arglist__4685) {
            var x = cljs.core.first(arglist__4685);
            var y = cljs.core.first(cljs.core.next(arglist__4685));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4685)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4685)));
            return G__4684__delegate.call(this, x, y, z, args)
          };
          return G__4684
        }();
        G__4677 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4677__4678.call(this);
            case 1:
              return G__4677__4679.call(this, x);
            case 2:
              return G__4677__4680.call(this, x, y);
            case 3:
              return G__4677__4681.call(this, x, y, z);
            default:
              return G__4677__4682.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4677.cljs$lang$maxFixedArity = 3;
        G__4677.cljs$lang$applyTo = G__4677__4682.cljs$lang$applyTo;
        return G__4677
      }()
    };
    var G__4676 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4676__delegate.call(this, f, g, h, fs)
    };
    G__4676.cljs$lang$maxFixedArity = 3;
    G__4676.cljs$lang$applyTo = function(arglist__4686) {
      var f = cljs.core.first(arglist__4686);
      var g = cljs.core.first(cljs.core.next(arglist__4686));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4686)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4686)));
      return G__4676__delegate.call(this, f, g, h, fs)
    };
    return G__4676
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4644.call(this, f);
      case 2:
        return juxt__4645.call(this, f, g);
      case 3:
        return juxt__4646.call(this, f, g, h);
      default:
        return juxt__4647.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4647.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4688 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4691 = cljs.core.next.call(null, coll);
        coll = G__4691;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4689 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4687 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____4687)) {
          return n > 0
        }else {
          return and__3546__auto____4687
        }
      }())) {
        var G__4692 = n - 1;
        var G__4693 = cljs.core.next.call(null, coll);
        n = G__4692;
        coll = G__4693;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4688.call(this, n);
      case 2:
        return dorun__4689.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4694 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4695 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4694.call(this, n);
      case 2:
        return doall__4695.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4697 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4697), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4697), 1))) {
      return cljs.core.first.call(null, matches__4697)
    }else {
      return cljs.core.vec.call(null, matches__4697)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4698 = re.exec(s);
  if(cljs.core.truth_(matches__4698 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4698), 1))) {
      return cljs.core.first.call(null, matches__4698)
    }else {
      return cljs.core.vec.call(null, matches__4698)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4699 = cljs.core.re_find.call(null, re, s);
  var match_idx__4700 = s.search(re);
  var match_str__4701 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4699)) ? cljs.core.first.call(null, match_data__4699) : match_data__4699;
  var post_match__4702 = cljs.core.subs.call(null, s, match_idx__4700 + cljs.core.count.call(null, match_str__4701));
  if(cljs.core.truth_(match_data__4699)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4699, re_seq.call(null, re, post_match__4702))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__4704__4705 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___4706 = cljs.core.nth.call(null, vec__4704__4705, 0, null);
  var flags__4707 = cljs.core.nth.call(null, vec__4704__4705, 1, null);
  var pattern__4708 = cljs.core.nth.call(null, vec__4704__4705, 2, null);
  return new RegExp(pattern__4708, flags__4707)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__4703_SHARP_) {
    return print_one.call(null, p1__4703_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____4709 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____4709)) {
            var and__3546__auto____4713 = function() {
              var x__451__auto____4710 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____4711 = x__451__auto____4710;
                if(cljs.core.truth_(and__3546__auto____4711)) {
                  var and__3546__auto____4712 = x__451__auto____4710.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____4712)) {
                    return cljs.core.not.call(null, x__451__auto____4710.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____4712
                  }
                }else {
                  return and__3546__auto____4711
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____4710)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____4713)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____4713
            }
          }else {
            return and__3546__auto____4709
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____4714 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4715 = x__451__auto____4714;
            if(cljs.core.truth_(and__3546__auto____4715)) {
              var and__3546__auto____4716 = x__451__auto____4714.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____4716)) {
                return cljs.core.not.call(null, x__451__auto____4714.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____4716
              }
            }else {
              return and__3546__auto____4715
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____4714)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__4717 = cljs.core.first.call(null, objs);
  var sb__4718 = new goog.string.StringBuffer;
  var G__4719__4720 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4719__4720)) {
    var obj__4721 = cljs.core.first.call(null, G__4719__4720);
    var G__4719__4722 = G__4719__4720;
    while(true) {
      if(cljs.core.truth_(obj__4721 === first_obj__4717)) {
      }else {
        sb__4718.append(" ")
      }
      var G__4723__4724 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4721, opts));
      if(cljs.core.truth_(G__4723__4724)) {
        var string__4725 = cljs.core.first.call(null, G__4723__4724);
        var G__4723__4726 = G__4723__4724;
        while(true) {
          sb__4718.append(string__4725);
          var temp__3698__auto____4727 = cljs.core.next.call(null, G__4723__4726);
          if(cljs.core.truth_(temp__3698__auto____4727)) {
            var G__4723__4728 = temp__3698__auto____4727;
            var G__4731 = cljs.core.first.call(null, G__4723__4728);
            var G__4732 = G__4723__4728;
            string__4725 = G__4731;
            G__4723__4726 = G__4732;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4729 = cljs.core.next.call(null, G__4719__4722);
      if(cljs.core.truth_(temp__3698__auto____4729)) {
        var G__4719__4730 = temp__3698__auto____4729;
        var G__4733 = cljs.core.first.call(null, G__4719__4730);
        var G__4734 = G__4719__4730;
        obj__4721 = G__4733;
        G__4719__4722 = G__4734;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__4718)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4735 = cljs.core.first.call(null, objs);
  var G__4736__4737 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4736__4737)) {
    var obj__4738 = cljs.core.first.call(null, G__4736__4737);
    var G__4736__4739 = G__4736__4737;
    while(true) {
      if(cljs.core.truth_(obj__4738 === first_obj__4735)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4740__4741 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4738, opts));
      if(cljs.core.truth_(G__4740__4741)) {
        var string__4742 = cljs.core.first.call(null, G__4740__4741);
        var G__4740__4743 = G__4740__4741;
        while(true) {
          cljs.core.string_print.call(null, string__4742);
          var temp__3698__auto____4744 = cljs.core.next.call(null, G__4740__4743);
          if(cljs.core.truth_(temp__3698__auto____4744)) {
            var G__4740__4745 = temp__3698__auto____4744;
            var G__4748 = cljs.core.first.call(null, G__4740__4745);
            var G__4749 = G__4740__4745;
            string__4742 = G__4748;
            G__4740__4743 = G__4749;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4746 = cljs.core.next.call(null, G__4736__4739);
      if(cljs.core.truth_(temp__3698__auto____4746)) {
        var G__4736__4747 = temp__3698__auto____4746;
        var G__4750 = cljs.core.first.call(null, G__4736__4747);
        var G__4751 = G__4736__4747;
        obj__4738 = G__4750;
        G__4736__4739 = G__4751;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4752) {
    var objs = cljs.core.seq(arglist__4752);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4753) {
    var objs = cljs.core.seq(arglist__4753);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4754) {
    var objs = cljs.core.seq(arglist__4754);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4755) {
    var objs = cljs.core.seq(arglist__4755);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4756) {
    var objs = cljs.core.seq(arglist__4756);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4757 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4757, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____4758 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____4758)) {
        var nspc__4759 = temp__3698__auto____4758;
        return cljs.core.str.call(null, nspc__4759, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____4760 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____4760)) {
          var nspc__4761 = temp__3698__auto____4760;
          return cljs.core.str.call(null, nspc__4761, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4762 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4762, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4763 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4764 = this;
  var G__4765__4766 = cljs.core.seq.call(null, this__4764.watches);
  if(cljs.core.truth_(G__4765__4766)) {
    var G__4768__4770 = cljs.core.first.call(null, G__4765__4766);
    var vec__4769__4771 = G__4768__4770;
    var key__4772 = cljs.core.nth.call(null, vec__4769__4771, 0, null);
    var f__4773 = cljs.core.nth.call(null, vec__4769__4771, 1, null);
    var G__4765__4774 = G__4765__4766;
    var G__4768__4775 = G__4768__4770;
    var G__4765__4776 = G__4765__4774;
    while(true) {
      var vec__4777__4778 = G__4768__4775;
      var key__4779 = cljs.core.nth.call(null, vec__4777__4778, 0, null);
      var f__4780 = cljs.core.nth.call(null, vec__4777__4778, 1, null);
      var G__4765__4781 = G__4765__4776;
      f__4780.call(null, key__4779, this$, oldval, newval);
      var temp__3698__auto____4782 = cljs.core.next.call(null, G__4765__4781);
      if(cljs.core.truth_(temp__3698__auto____4782)) {
        var G__4765__4783 = temp__3698__auto____4782;
        var G__4790 = cljs.core.first.call(null, G__4765__4783);
        var G__4791 = G__4765__4783;
        G__4768__4775 = G__4790;
        G__4765__4776 = G__4791;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4784 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4784.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4785 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4785.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4786 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4786.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4787 = this;
  return this__4787.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4788 = this;
  return this__4788.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4789 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__4798 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4799 = function() {
    var G__4801__delegate = function(x, p__4792) {
      var map__4793__4794 = p__4792;
      var map__4793__4795 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4793__4794)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4793__4794) : map__4793__4794;
      var validator__4796 = cljs.core.get.call(null, map__4793__4795, "\ufdd0'validator");
      var meta__4797 = cljs.core.get.call(null, map__4793__4795, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4797, validator__4796, null)
    };
    var G__4801 = function(x, var_args) {
      var p__4792 = null;
      if(goog.isDef(var_args)) {
        p__4792 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4801__delegate.call(this, x, p__4792)
    };
    G__4801.cljs$lang$maxFixedArity = 1;
    G__4801.cljs$lang$applyTo = function(arglist__4802) {
      var x = cljs.core.first(arglist__4802);
      var p__4792 = cljs.core.rest(arglist__4802);
      return G__4801__delegate.call(this, x, p__4792)
    };
    return G__4801
  }();
  atom = function(x, var_args) {
    var p__4792 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4798.call(this, x);
      default:
        return atom__4799.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4799.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____4803 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____4803)) {
    var validate__4804 = temp__3698__auto____4803;
    if(cljs.core.truth_(validate__4804.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3257)))));
    }
  }else {
  }
  var old_value__4805 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4805, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4806 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4807 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4808 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4809 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4810 = function() {
    var G__4812__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4812 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4812__delegate.call(this, a, f, x, y, z, more)
    };
    G__4812.cljs$lang$maxFixedArity = 5;
    G__4812.cljs$lang$applyTo = function(arglist__4813) {
      var a = cljs.core.first(arglist__4813);
      var f = cljs.core.first(cljs.core.next(arglist__4813));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4813)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4813))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4813)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4813)))));
      return G__4812__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4812
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4806.call(this, a, f);
      case 3:
        return swap_BANG___4807.call(this, a, f, x);
      case 4:
        return swap_BANG___4808.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4809.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4810.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4810.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4814) {
    var iref = cljs.core.first(arglist__4814);
    var f = cljs.core.first(cljs.core.next(arglist__4814));
    var args = cljs.core.rest(cljs.core.next(arglist__4814));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4815 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4816 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4815.call(this);
      case 1:
        return gensym__4816.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4818 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__4818.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4819 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__4819.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__4819.state, this__4819.f)
  }
  return cljs.core.deref.call(null, this__4819.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__4820) {
    var body = cljs.core.seq(arglist__4820);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4821__4822 = options;
    var map__4821__4823 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4821__4822)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4821__4822) : map__4821__4822;
    var keywordize_keys__4824 = cljs.core.get.call(null, map__4821__4823, "\ufdd0'keywordize-keys");
    var keyfn__4825 = cljs.core.truth_(keywordize_keys__4824) ? cljs.core.keyword : cljs.core.str;
    var f__4831 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__515__auto____4830 = function iter__4826(s__4827) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4827__4828 = s__4827;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4827__4828))) {
                        var k__4829 = cljs.core.first.call(null, s__4827__4828);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__4825.call(null, k__4829), thisfn.call(null, x[k__4829])]), iter__4826.call(null, cljs.core.rest.call(null, s__4827__4828)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__515__auto____4830.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4831.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4832) {
    var x = cljs.core.first(arglist__4832);
    var options = cljs.core.rest(arglist__4832);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4833 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4837__delegate = function(args) {
      var temp__3695__auto____4834 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4833), args);
      if(cljs.core.truth_(temp__3695__auto____4834)) {
        var v__4835 = temp__3695__auto____4834;
        return v__4835
      }else {
        var ret__4836 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4833, cljs.core.assoc, args, ret__4836);
        return ret__4836
      }
    };
    var G__4837 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4837__delegate.call(this, args)
    };
    G__4837.cljs$lang$maxFixedArity = 0;
    G__4837.cljs$lang$applyTo = function(arglist__4838) {
      var args = cljs.core.seq(arglist__4838);
      return G__4837__delegate.call(this, args)
    };
    return G__4837
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4840 = function(f) {
    while(true) {
      var ret__4839 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4839))) {
        var G__4843 = ret__4839;
        f = G__4843;
        continue
      }else {
        return ret__4839
      }
      break
    }
  };
  var trampoline__4841 = function() {
    var G__4844__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4844 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4844__delegate.call(this, f, args)
    };
    G__4844.cljs$lang$maxFixedArity = 1;
    G__4844.cljs$lang$applyTo = function(arglist__4845) {
      var f = cljs.core.first(arglist__4845);
      var args = cljs.core.rest(arglist__4845);
      return G__4844__delegate.call(this, f, args)
    };
    return G__4844
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4840.call(this, f);
      default:
        return trampoline__4841.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4841.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4846 = function() {
    return rand.call(null, 1)
  };
  var rand__4847 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4846.call(this);
      case 1:
        return rand__4847.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4849 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4849, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4849, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4858 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4859 = function(h, child, parent) {
    var or__3548__auto____4850 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____4850)) {
      return or__3548__auto____4850
    }else {
      var or__3548__auto____4851 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____4851)) {
        return or__3548__auto____4851
      }else {
        var and__3546__auto____4852 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____4852)) {
          var and__3546__auto____4853 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____4853)) {
            var and__3546__auto____4854 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____4854)) {
              var ret__4855 = true;
              var i__4856 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____4857 = cljs.core.not.call(null, ret__4855);
                  if(cljs.core.truth_(or__3548__auto____4857)) {
                    return or__3548__auto____4857
                  }else {
                    return cljs.core._EQ_.call(null, i__4856, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4855
                }else {
                  var G__4861 = isa_QMARK_.call(null, h, child.call(null, i__4856), parent.call(null, i__4856));
                  var G__4862 = i__4856 + 1;
                  ret__4855 = G__4861;
                  i__4856 = G__4862;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____4854
            }
          }else {
            return and__3546__auto____4853
          }
        }else {
          return and__3546__auto____4852
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4858.call(this, h, child);
      case 3:
        return isa_QMARK___4859.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4863 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4864 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4863.call(this, h);
      case 2:
        return parents__4864.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4866 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4867 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4866.call(this, h);
      case 2:
        return ancestors__4867.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4869 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4870 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4869.call(this, h);
      case 2:
        return descendants__4870.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4880 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3549)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4881 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3553)))));
    }
    var tp__4875 = "\ufdd0'parents".call(null, h);
    var td__4876 = "\ufdd0'descendants".call(null, h);
    var ta__4877 = "\ufdd0'ancestors".call(null, h);
    var tf__4878 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____4879 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4875.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4877.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4877.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4875, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4878.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4876, parent, ta__4877), "\ufdd0'descendants":tf__4878.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4877, tag, td__4876)})
    }();
    if(cljs.core.truth_(or__3548__auto____4879)) {
      return or__3548__auto____4879
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4880.call(this, h, tag);
      case 3:
        return derive__4881.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4887 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4888 = function(h, tag, parent) {
    var parentMap__4883 = "\ufdd0'parents".call(null, h);
    var childsParents__4884 = cljs.core.truth_(parentMap__4883.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4883.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4885 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4884)) ? cljs.core.assoc.call(null, parentMap__4883, tag, childsParents__4884) : cljs.core.dissoc.call(null, parentMap__4883, tag);
    var deriv_seq__4886 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4872_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4872_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4872_SHARP_), cljs.core.second.call(null, p1__4872_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4885)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4883.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4873_SHARP_, p2__4874_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4873_SHARP_, p2__4874_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4886))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4887.call(this, h, tag);
      case 3:
        return underive__4888.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4890 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____4892 = cljs.core.truth_(function() {
    var and__3546__auto____4891 = xprefs__4890;
    if(cljs.core.truth_(and__3546__auto____4891)) {
      return xprefs__4890.call(null, y)
    }else {
      return and__3546__auto____4891
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____4892)) {
    return or__3548__auto____4892
  }else {
    var or__3548__auto____4894 = function() {
      var ps__4893 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4893) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4893), prefer_table))) {
          }else {
          }
          var G__4897 = cljs.core.rest.call(null, ps__4893);
          ps__4893 = G__4897;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____4894)) {
      return or__3548__auto____4894
    }else {
      var or__3548__auto____4896 = function() {
        var ps__4895 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4895) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4895), y, prefer_table))) {
            }else {
            }
            var G__4898 = cljs.core.rest.call(null, ps__4895);
            ps__4895 = G__4898;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____4896)) {
        return or__3548__auto____4896
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____4899 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____4899)) {
    return or__3548__auto____4899
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4908 = cljs.core.reduce.call(null, function(be, p__4900) {
    var vec__4901__4902 = p__4900;
    var k__4903 = cljs.core.nth.call(null, vec__4901__4902, 0, null);
    var ___4904 = cljs.core.nth.call(null, vec__4901__4902, 1, null);
    var e__4905 = vec__4901__4902;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4903))) {
      var be2__4907 = cljs.core.truth_(function() {
        var or__3548__auto____4906 = be === null;
        if(cljs.core.truth_(or__3548__auto____4906)) {
          return or__3548__auto____4906
        }else {
          return cljs.core.dominates.call(null, k__4903, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4905 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4907), k__4903, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4903, " and ", cljs.core.first.call(null, be2__4907), ", and neither is preferred"));
      }
      return be2__4907
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4908)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4908));
      return cljs.core.second.call(null, best_entry__4908)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4909 = mf;
    if(cljs.core.truth_(and__3546__auto____4909)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____4909
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____4910 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4910)) {
        return or__3548__auto____4910
      }else {
        var or__3548__auto____4911 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____4911)) {
          return or__3548__auto____4911
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4912 = mf;
    if(cljs.core.truth_(and__3546__auto____4912)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____4912
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____4913 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4913)) {
        return or__3548__auto____4913
      }else {
        var or__3548__auto____4914 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____4914)) {
          return or__3548__auto____4914
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4915 = mf;
    if(cljs.core.truth_(and__3546__auto____4915)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____4915
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4916 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4916)) {
        return or__3548__auto____4916
      }else {
        var or__3548__auto____4917 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____4917)) {
          return or__3548__auto____4917
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4918 = mf;
    if(cljs.core.truth_(and__3546__auto____4918)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____4918
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____4919 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4919)) {
        return or__3548__auto____4919
      }else {
        var or__3548__auto____4920 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____4920)) {
          return or__3548__auto____4920
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4921 = mf;
    if(cljs.core.truth_(and__3546__auto____4921)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____4921
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4922 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4922)) {
        return or__3548__auto____4922
      }else {
        var or__3548__auto____4923 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____4923)) {
          return or__3548__auto____4923
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4924 = mf;
    if(cljs.core.truth_(and__3546__auto____4924)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____4924
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____4925 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4925)) {
        return or__3548__auto____4925
      }else {
        var or__3548__auto____4926 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____4926)) {
          return or__3548__auto____4926
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4927 = mf;
    if(cljs.core.truth_(and__3546__auto____4927)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____4927
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____4928 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4928)) {
        return or__3548__auto____4928
      }else {
        var or__3548__auto____4929 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____4929)) {
          return or__3548__auto____4929
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4930 = mf;
    if(cljs.core.truth_(and__3546__auto____4930)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____4930
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____4931 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4931)) {
        return or__3548__auto____4931
      }else {
        var or__3548__auto____4932 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____4932)) {
          return or__3548__auto____4932
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__4933 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__4934 = cljs.core._get_method.call(null, mf, dispatch_val__4933);
  if(cljs.core.truth_(target_fn__4934)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__4933));
  }
  return cljs.core.apply.call(null, target_fn__4934, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4935 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__4936 = this;
  cljs.core.swap_BANG_.call(null, this__4936.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4936.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4936.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4936.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__4937 = this;
  cljs.core.swap_BANG_.call(null, this__4937.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__4937.method_cache, this__4937.method_table, this__4937.cached_hierarchy, this__4937.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__4938 = this;
  cljs.core.swap_BANG_.call(null, this__4938.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__4938.method_cache, this__4938.method_table, this__4938.cached_hierarchy, this__4938.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__4939 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__4939.cached_hierarchy), cljs.core.deref.call(null, this__4939.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__4939.method_cache, this__4939.method_table, this__4939.cached_hierarchy, this__4939.hierarchy)
  }
  var temp__3695__auto____4940 = cljs.core.deref.call(null, this__4939.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____4940)) {
    var target_fn__4941 = temp__3695__auto____4940;
    return target_fn__4941
  }else {
    var temp__3695__auto____4942 = cljs.core.find_and_cache_best_method.call(null, this__4939.name, dispatch_val, this__4939.hierarchy, this__4939.method_table, this__4939.prefer_table, this__4939.method_cache, this__4939.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____4942)) {
      var target_fn__4943 = temp__3695__auto____4942;
      return target_fn__4943
    }else {
      return cljs.core.deref.call(null, this__4939.method_table).call(null, this__4939.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__4944 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__4944.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__4944.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__4944.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__4944.method_cache, this__4944.method_table, this__4944.cached_hierarchy, this__4944.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__4945 = this;
  return cljs.core.deref.call(null, this__4945.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__4946 = this;
  return cljs.core.deref.call(null, this__4946.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__4947 = this;
  return cljs.core.do_dispatch.call(null, mf, this__4947.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__4948__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__4948 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4948__delegate.call(this, _, args)
  };
  G__4948.cljs$lang$maxFixedArity = 1;
  G__4948.cljs$lang$applyTo = function(arglist__4949) {
    var _ = cljs.core.first(arglist__4949);
    var args = cljs.core.rest(arglist__4949);
    return G__4948__delegate.call(this, _, args)
  };
  return G__4948
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("helloapp.app");
goog.require("cljs.core");
alert.call(null, "Hello!");
