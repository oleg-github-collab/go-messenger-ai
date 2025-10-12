var HMS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to2, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to2, key) && key !== except)
          __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to2;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/ua-parser-js/src/ua-parser.js
  var require_ua_parser = __commonJS({
    "node_modules/ua-parser-js/src/ua-parser.js"(exports, module) {
      (function(window2, undefined2) {
        "use strict";
        var LIBVERSION = "1.0.41", EMPTY = "", UNKNOWN = "?", FUNC_TYPE = "function", UNDEF_TYPE = "undefined", OBJ_TYPE = "object", STR_TYPE = "string", MAJOR = "major", MODEL = "model", NAME = "name", TYPE = "type", VENDOR = "vendor", VERSION = "version", ARCHITECTURE = "architecture", CONSOLE = "console", MOBILE = "mobile", TABLET = "tablet", SMARTTV = "smarttv", WEARABLE = "wearable", EMBEDDED = "embedded", UA_MAX_LENGTH = 500;
        var AMAZON = "Amazon", APPLE = "Apple", ASUS = "ASUS", BLACKBERRY = "BlackBerry", BROWSER = "Browser", CHROME = "Chrome", EDGE = "Edge", FIREFOX = "Firefox", GOOGLE = "Google", HONOR = "Honor", HUAWEI = "Huawei", LENOVO = "Lenovo", LG = "LG", MICROSOFT = "Microsoft", MOTOROLA = "Motorola", NVIDIA = "Nvidia", ONEPLUS = "OnePlus", OPERA = "Opera", OPPO = "OPPO", SAMSUNG = "Samsung", SHARP = "Sharp", SONY = "Sony", XIAOMI = "Xiaomi", ZEBRA = "Zebra", FACEBOOK = "Facebook", CHROMIUM_OS = "Chromium OS", MAC_OS = "Mac OS", SUFFIX_BROWSER = " Browser";
        var extend = function(regexes2, extensions) {
          var mergedRegexes = {};
          for (var i2 in regexes2) {
            if (extensions[i2] && extensions[i2].length % 2 === 0) {
              mergedRegexes[i2] = extensions[i2].concat(regexes2[i2]);
            } else {
              mergedRegexes[i2] = regexes2[i2];
            }
          }
          return mergedRegexes;
        }, enumerize = function(arr) {
          var enums = {};
          for (var i2 = 0; i2 < arr.length; i2++) {
            enums[arr[i2].toUpperCase()] = arr[i2];
          }
          return enums;
        }, has = function(str1, str2) {
          return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
        }, lowerize = function(str) {
          return str.toLowerCase();
        }, majorize = function(version) {
          return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split(".")[0] : undefined2;
        }, trim = function(str, len) {
          if (typeof str === STR_TYPE) {
            str = str.replace(/^\s\s*/, EMPTY);
            return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
          }
        };
        var rgxMapper = function(ua2, arrays) {
          var i2 = 0, j3, k3, p2, q3, matches, match;
          while (i2 < arrays.length && !matches) {
            var regex = arrays[i2], props = arrays[i2 + 1];
            j3 = k3 = 0;
            while (j3 < regex.length && !matches) {
              if (!regex[j3]) {
                break;
              }
              matches = regex[j3++].exec(ua2);
              if (!!matches) {
                for (p2 = 0; p2 < props.length; p2++) {
                  match = matches[++k3];
                  q3 = props[p2];
                  if (typeof q3 === OBJ_TYPE && q3.length > 0) {
                    if (q3.length === 2) {
                      if (typeof q3[1] == FUNC_TYPE) {
                        this[q3[0]] = q3[1].call(this, match);
                      } else {
                        this[q3[0]] = q3[1];
                      }
                    } else if (q3.length === 3) {
                      if (typeof q3[1] === FUNC_TYPE && !(q3[1].exec && q3[1].test)) {
                        this[q3[0]] = match ? q3[1].call(this, match, q3[2]) : undefined2;
                      } else {
                        this[q3[0]] = match ? match.replace(q3[1], q3[2]) : undefined2;
                      }
                    } else if (q3.length === 4) {
                      this[q3[0]] = match ? q3[3].call(this, match.replace(q3[1], q3[2])) : undefined2;
                    }
                  } else {
                    this[q3] = match ? match : undefined2;
                  }
                }
              }
            }
            i2 += 2;
          }
        }, strMapper = function(str, map) {
          for (var i2 in map) {
            if (typeof map[i2] === OBJ_TYPE && map[i2].length > 0) {
              for (var j3 = 0; j3 < map[i2].length; j3++) {
                if (has(map[i2][j3], str)) {
                  return i2 === UNKNOWN ? undefined2 : i2;
                }
              }
            } else if (has(map[i2], str)) {
              return i2 === UNKNOWN ? undefined2 : i2;
            }
          }
          return map.hasOwnProperty("*") ? map["*"] : str;
        };
        var oldSafariMap = {
          "1.0": "/8",
          "1.2": "/1",
          "1.3": "/3",
          "2.0": "/412",
          "2.0.2": "/416",
          "2.0.3": "/417",
          "2.0.4": "/419",
          "?": "/"
        }, windowsVersionMap = {
          "ME": "4.90",
          "NT 3.11": "NT3.51",
          "NT 4.0": "NT4.0",
          "2000": "NT 5.0",
          "XP": ["NT 5.1", "NT 5.2"],
          "Vista": "NT 6.0",
          "7": "NT 6.1",
          "8": "NT 6.2",
          "8.1": "NT 6.3",
          "10": ["NT 6.4", "NT 10.0"],
          "RT": "ARM"
        };
        var regexes = {
          browser: [
            [
              /\b(?:crmo|crios)\/([\w\.]+)/i
              // Chrome for Android/iOS
            ],
            [VERSION, [NAME, "Chrome"]],
            [
              /edg(?:e|ios|a)?\/([\w\.]+)/i
              // Microsoft Edge
            ],
            [VERSION, [NAME, "Edge"]],
            [
              // Presto based
              /(opera mini)\/([-\w\.]+)/i,
              // Opera Mini
              /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
              // Opera Mobi/Tablet
              /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i
              // Opera
            ],
            [NAME, VERSION],
            [
              /opios[\/ ]+([\w\.]+)/i
              // Opera mini on iphone >= 8.0
            ],
            [VERSION, [NAME, OPERA + " Mini"]],
            [
              /\bop(?:rg)?x\/([\w\.]+)/i
              // Opera GX
            ],
            [VERSION, [NAME, OPERA + " GX"]],
            [
              /\bopr\/([\w\.]+)/i
              // Opera Webkit
            ],
            [VERSION, [NAME, OPERA]],
            [
              // Mixed
              /\bb[ai]*d(?:uhd|[ub]*[aekoprswx]{5,6})[\/ ]?([\w\.]+)/i
              // Baidu
            ],
            [VERSION, [NAME, "Baidu"]],
            [
              /\b(?:mxbrowser|mxios|myie2)\/?([-\w\.]*)\b/i
              // Maxthon
            ],
            [VERSION, [NAME, "Maxthon"]],
            [
              /(kindle)\/([\w\.]+)/i,
              // Kindle
              /(lunascape|maxthon|netfront|jasmine|blazer|sleipnir)[\/ ]?([\w\.]*)/i,
              // Lunascape/Maxthon/Netfront/Jasmine/Blazer/Sleipnir
              // Trident based
              /(avant|iemobile|slim(?:browser|boat|jet))[\/ ]?([\d\.]*)/i,
              // Avant/IEMobile/SlimBrowser/SlimBoat/Slimjet
              /(?:ms|\()(ie) ([\w\.]+)/i,
              // Internet Explorer
              // Blink/Webkit/KHTML based                                         // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
              /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|duckduckgo|klar|helio|(?=comodo_)?dragon)\/([-\w\.]+)/i,
              // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ//Vivaldi/DuckDuckGo/Klar/Helio/Dragon
              /(heytap|ovi|115)browser\/([\d\.]+)/i,
              // HeyTap/Ovi/115
              /(weibo)__([\d\.]+)/i
              // Weibo
            ],
            [NAME, VERSION],
            [
              /quark(?:pc)?\/([-\w\.]+)/i
              // Quark
            ],
            [VERSION, [NAME, "Quark"]],
            [
              /\bddg\/([\w\.]+)/i
              // DuckDuckGo
            ],
            [VERSION, [NAME, "DuckDuckGo"]],
            [
              /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i
              // UCBrowser
            ],
            [VERSION, [NAME, "UC" + BROWSER]],
            [
              /microm.+\bqbcore\/([\w\.]+)/i,
              // WeChat Desktop for Windows Built-in Browser
              /\bqbcore\/([\w\.]+).+microm/i,
              /micromessenger\/([\w\.]+)/i
              // WeChat
            ],
            [VERSION, [NAME, "WeChat"]],
            [
              /konqueror\/([\w\.]+)/i
              // Konqueror
            ],
            [VERSION, [NAME, "Konqueror"]],
            [
              /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i
              // IE11
            ],
            [VERSION, [NAME, "IE"]],
            [
              /ya(?:search)?browser\/([\w\.]+)/i
              // Yandex
            ],
            [VERSION, [NAME, "Yandex"]],
            [
              /slbrowser\/([\w\.]+)/i
              // Smart Lenovo Browser
            ],
            [VERSION, [NAME, "Smart Lenovo " + BROWSER]],
            [
              /(avast|avg)\/([\w\.]+)/i
              // Avast/AVG Secure Browser
            ],
            [[NAME, /(.+)/, "$1 Secure " + BROWSER], VERSION],
            [
              /\bfocus\/([\w\.]+)/i
              // Firefox Focus
            ],
            [VERSION, [NAME, FIREFOX + " Focus"]],
            [
              /\bopt\/([\w\.]+)/i
              // Opera Touch
            ],
            [VERSION, [NAME, OPERA + " Touch"]],
            [
              /coc_coc\w+\/([\w\.]+)/i
              // Coc Coc Browser
            ],
            [VERSION, [NAME, "Coc Coc"]],
            [
              /dolfin\/([\w\.]+)/i
              // Dolphin
            ],
            [VERSION, [NAME, "Dolphin"]],
            [
              /coast\/([\w\.]+)/i
              // Opera Coast
            ],
            [VERSION, [NAME, OPERA + " Coast"]],
            [
              /miuibrowser\/([\w\.]+)/i
              // MIUI Browser
            ],
            [VERSION, [NAME, "MIUI" + SUFFIX_BROWSER]],
            [
              /fxios\/([\w\.-]+)/i
              // Firefox for iOS
            ],
            [VERSION, [NAME, FIREFOX]],
            [
              /\bqihoobrowser\/?([\w\.]*)/i
              // 360
            ],
            [VERSION, [NAME, "360"]],
            [
              /\b(qq)\/([\w\.]+)/i
              // QQ
            ],
            [[NAME, /(.+)/, "$1Browser"], VERSION],
            [
              /(oculus|sailfish|huawei|vivo|pico)browser\/([\w\.]+)/i
            ],
            [[NAME, /(.+)/, "$1" + SUFFIX_BROWSER], VERSION],
            [
              // Oculus/Sailfish/HuaweiBrowser/VivoBrowser/PicoBrowser
              /samsungbrowser\/([\w\.]+)/i
              // Samsung Internet
            ],
            [VERSION, [NAME, SAMSUNG + " Internet"]],
            [
              /metasr[\/ ]?([\d\.]+)/i
              // Sogou Explorer
            ],
            [VERSION, [NAME, "Sogou Explorer"]],
            [
              /(sogou)mo\w+\/([\d\.]+)/i
              // Sogou Mobile
            ],
            [[NAME, "Sogou Mobile"], VERSION],
            [
              /(electron)\/([\w\.]+) safari/i,
              // Electron-based App
              /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
              // Tesla
              /m?(qqbrowser|2345(?=browser|chrome|explorer))\w*[\/ ]?v?([\w\.]+)/i
              // QQ/2345
            ],
            [NAME, VERSION],
            [
              /(lbbrowser|rekonq)/i,
              // LieBao Browser/Rekonq
              /\[(linkedin)app\]/i
              // LinkedIn App for iOS & Android
            ],
            [NAME],
            [
              /ome\/([\w\.]+) \w* ?(iron) saf/i,
              // Iron
              /ome\/([\w\.]+).+qihu (360)[es]e/i
              // 360
            ],
            [VERSION, NAME],
            [
              // WebView
              /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i
              // Facebook App for iOS & Android
            ],
            [[NAME, FACEBOOK], VERSION],
            [
              /(Klarna)\/([\w\.]+)/i,
              // Klarna Shopping Browser for iOS & Android
              /(kakao(?:talk|story))[\/ ]([\w\.]+)/i,
              // Kakao App
              /(naver)\(.*?(\d+\.[\w\.]+).*\)/i,
              // Naver InApp
              /(daum)apps[\/ ]([\w\.]+)/i,
              // Daum App
              /safari (line)\/([\w\.]+)/i,
              // Line App for iOS
              /\b(line)\/([\w\.]+)\/iab/i,
              // Line App for Android
              /(alipay)client\/([\w\.]+)/i,
              // Alipay
              /(twitter)(?:and| f.+e\/([\w\.]+))/i,
              // Twitter
              /(chromium|instagram|snapchat)[\/ ]([-\w\.]+)/i
              // Chromium/Instagram/Snapchat
            ],
            [NAME, VERSION],
            [
              /\bgsa\/([\w\.]+) .*safari\//i
              // Google Search Appliance on iOS
            ],
            [VERSION, [NAME, "GSA"]],
            [
              /musical_ly(?:.+app_?version\/|_)([\w\.]+)/i
              // TikTok
            ],
            [VERSION, [NAME, "TikTok"]],
            [
              /headlesschrome(?:\/([\w\.]+)| )/i
              // Chrome Headless
            ],
            [VERSION, [NAME, CHROME + " Headless"]],
            [
              / wv\).+(chrome)\/([\w\.]+)/i
              // Chrome WebView
            ],
            [[NAME, CHROME + " WebView"], VERSION],
            [
              /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i
              // Android Browser
            ],
            [VERSION, [NAME, "Android " + BROWSER]],
            [
              /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i
              // Chrome/OmniWeb/Arora/Tizen/Nokia
            ],
            [NAME, VERSION],
            [
              /version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i
              // Mobile Safari
            ],
            [VERSION, [NAME, "Mobile Safari"]],
            [
              /version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i
              // Safari & Safari Mobile
            ],
            [VERSION, NAME],
            [
              /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i
              // Safari < 3.0
            ],
            [NAME, [VERSION, strMapper, oldSafariMap]],
            [
              /(webkit|khtml)\/([\w\.]+)/i
            ],
            [NAME, VERSION],
            [
              // Gecko based
              /(navigator|netscape\d?)\/([-\w\.]+)/i
              // Netscape
            ],
            [[NAME, "Netscape"], VERSION],
            [
              /(wolvic|librewolf)\/([\w\.]+)/i
              // Wolvic/LibreWolf
            ],
            [NAME, VERSION],
            [
              /mobile vr; rv:([\w\.]+)\).+firefox/i
              // Firefox Reality
            ],
            [VERSION, [NAME, FIREFOX + " Reality"]],
            [
              /ekiohf.+(flow)\/([\w\.]+)/i,
              // Flow
              /(swiftfox)/i,
              // Swiftfox
              /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror)[\/ ]?([\w\.\+]+)/i,
              // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
              /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
              // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
              /(firefox)\/([\w\.]+)/i,
              // Other Firefox-based
              /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
              // Mozilla
              // Other
              /(amaya|dillo|doris|icab|ladybird|lynx|mosaic|netsurf|obigo|polaris|w3m|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
              // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Obigo/Mosaic/Go/ICE/UP.Browser/Ladybird
              /\b(links) \(([\w\.]+)/i
              // Links
            ],
            [NAME, [VERSION, /_/g, "."]],
            [
              /(cobalt)\/([\w\.]+)/i
              // Cobalt
            ],
            [NAME, [VERSION, /master.|lts./, ""]]
          ],
          cpu: [
            [
              /\b((amd|x|x86[-_]?|wow|win)64)\b/i
              // AMD64 (x64)
            ],
            [[ARCHITECTURE, "amd64"]],
            [
              /(ia32(?=;))/i,
              // IA32 (quicktime)
              /\b((i[346]|x)86)(pc)?\b/i
              // IA32 (x86)
            ],
            [[ARCHITECTURE, "ia32"]],
            [
              /\b(aarch64|arm(v?[89]e?l?|_?64))\b/i
              // ARM64
            ],
            [[ARCHITECTURE, "arm64"]],
            [
              /\b(arm(v[67])?ht?n?[fl]p?)\b/i
              // ARMHF
            ],
            [[ARCHITECTURE, "armhf"]],
            [
              // PocketPC mistakenly identified as PowerPC
              /( (ce|mobile); ppc;|\/[\w\.]+arm\b)/i
            ],
            [[ARCHITECTURE, "arm"]],
            [
              /((ppc|powerpc)(64)?)( mac|;|\))/i
              // PowerPC
            ],
            [[ARCHITECTURE, /ower/, EMPTY, lowerize]],
            [
              / sun4\w[;\)]/i
              // SPARC
            ],
            [[ARCHITECTURE, "sparc"]],
            [
              /\b(avr32|ia64(?=;)|68k(?=\))|\barm(?=v([1-7]|[5-7]1)l?|;|eabi)|(irix|mips|sparc)(64)?\b|pa-risc)/i
              // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ],
            [[ARCHITECTURE, lowerize]]
          ],
          device: [
            [
              //////////////////////////
              // MOBILES & TABLETS
              /////////////////////////
              // Samsung
              /\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
            ],
            [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]],
            [
              /\b((?:s[cgp]h|gt|sm)-(?![lr])\w+|sc[g-]?[\d]+a?|galaxy nexus)/i,
              /samsung[- ]((?!sm-[lr])[-\w]+)/i,
              /sec-(sgh\w+)/i
            ],
            [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]],
            [
              // Apple
              /(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i
              // iPod/iPhone
            ],
            [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]],
            [
              /\((ipad);[-\w\),; ]+apple/i,
              // iPad
              /applecoremedia\/[\w\.]+ \((ipad)/i,
              /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
            ],
            [MODEL, [VENDOR, APPLE], [TYPE, TABLET]],
            [
              /(macintosh);/i
            ],
            [MODEL, [VENDOR, APPLE]],
            [
              // Sharp
              /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
            ],
            [MODEL, [VENDOR, SHARP], [TYPE, MOBILE]],
            [
              // Honor
              /\b((?:brt|eln|hey2?|gdi|jdn)-a?[lnw]09|(?:ag[rm]3?|jdn2|kob2)-a?[lw]0[09]hn)(?: bui|\)|;)/i
            ],
            [MODEL, [VENDOR, HONOR], [TYPE, TABLET]],
            [
              /honor([-\w ]+)[;\)]/i
            ],
            [MODEL, [VENDOR, HONOR], [TYPE, MOBILE]],
            [
              // Huawei
              /\b((?:ag[rs][2356]?k?|bah[234]?|bg[2o]|bt[kv]|cmr|cpn|db[ry]2?|jdn2|got|kob2?k?|mon|pce|scm|sht?|[tw]gr|vrd)-[ad]?[lw][0125][09]b?|605hw|bg2-u03|(?:gem|fdr|m2|ple|t1)-[7a]0[1-4][lu]|t1-a2[13][lw]|mediapad[\w\. ]*(?= bui|\)))\b(?!.+d\/s)/i
            ],
            [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]],
            [
              /(?:huawei)([-\w ]+)[;\)]/i,
              /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i
            ],
            [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]],
            [
              // Xiaomi
              /oid[^\)]+; (2[\dbc]{4}(182|283|rp\w{2})[cgl]|m2105k81a?c)(?: bui|\))/i,
              /\b((?:red)?mi[-_ ]?pad[\w- ]*)(?: bui|\))/i
              // Mi Pad tablets
            ],
            [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, TABLET]],
            [
              /\b(poco[\w ]+|m2\d{3}j\d\d[a-z]{2})(?: bui|\))/i,
              // Xiaomi POCO
              /\b; (\w+) build\/hm\1/i,
              // Xiaomi Hongmi 'numeric' models
              /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
              // Xiaomi Hongmi
              /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
              // Xiaomi Redmi
              /oid[^\)]+; (m?[12][0-389][01]\w{3,6}[c-y])( bui|; wv|\))/i,
              // Xiaomi Redmi 'numeric' models
              /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite|pro)?)(?: bui|\))/i,
              // Xiaomi Mi
              / ([\w ]+) miui\/v?\d/i
            ],
            [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, MOBILE]],
            [
              // OPPO
              /; (\w+) bui.+ oppo/i,
              /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i
            ],
            [MODEL, [VENDOR, OPPO], [TYPE, MOBILE]],
            [
              /\b(opd2(\d{3}a?))(?: bui|\))/i
            ],
            [MODEL, [VENDOR, strMapper, { "OnePlus": ["304", "403", "203"], "*": OPPO }], [TYPE, TABLET]],
            [
              // Vivo
              /vivo (\w+)(?: bui|\))/i,
              /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
            ],
            [MODEL, [VENDOR, "Vivo"], [TYPE, MOBILE]],
            [
              // Realme
              /\b(rmx[1-3]\d{3})(?: bui|;|\))/i
            ],
            [MODEL, [VENDOR, "Realme"], [TYPE, MOBILE]],
            [
              // Motorola
              /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
              /\bmot(?:orola)?[- ](\w*)/i,
              /((?:moto(?! 360)[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
            ],
            [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]],
            [
              /\b(mz60\d|xoom[2 ]{0,2}) build\//i
            ],
            [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]],
            [
              // LG
              /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
            ],
            [MODEL, [VENDOR, LG], [TYPE, TABLET]],
            [
              /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
              /\blg[-e;\/ ]+((?!browser|netcast|android tv|watch)\w+)/i,
              /\blg-?([\d\w]+) bui/i
            ],
            [MODEL, [VENDOR, LG], [TYPE, MOBILE]],
            [
              // Lenovo
              /(ideatab[-\w ]+|602lv|d-42a|a101lv|a2109a|a3500-hv|s[56]000|pb-6505[my]|tb-?x?\d{3,4}(?:f[cu]|xu|[av])|yt\d?-[jx]?\d+[lfmx])( bui|;|\)|\/)/i,
              /lenovo ?(b[68]0[08]0-?[hf]?|tab(?:[\w- ]+?)|tb[\w-]{6,7})( bui|;|\)|\/)/i
            ],
            [MODEL, [VENDOR, LENOVO], [TYPE, TABLET]],
            [
              // Nokia
              /(nokia) (t[12][01])/i
            ],
            [VENDOR, MODEL, [TYPE, TABLET]],
            [
              /(?:maemo|nokia).*(n900|lumia \d+|rm-\d+)/i,
              /nokia[-_ ]?(([-\w\. ]*))/i
            ],
            [[MODEL, /_/g, " "], [TYPE, MOBILE], [VENDOR, "Nokia"]],
            [
              // Google
              /(pixel (c|tablet))\b/i
              // Google Pixel C/Tablet
            ],
            [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]],
            [
              /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i
              // Google Pixel
            ],
            [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]],
            [
              // Sony
              /droid.+; (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
            ],
            [MODEL, [VENDOR, SONY], [TYPE, MOBILE]],
            [
              /sony tablet [ps]/i,
              /\b(?:sony)?sgp\w+(?: bui|\))/i
            ],
            [[MODEL, "Xperia Tablet"], [VENDOR, SONY], [TYPE, TABLET]],
            [
              // OnePlus
              / (kb2005|in20[12]5|be20[12][59])\b/i,
              /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
            ],
            [MODEL, [VENDOR, ONEPLUS], [TYPE, MOBILE]],
            [
              // Amazon
              /(alexa)webm/i,
              /(kf[a-z]{2}wi|aeo(?!bc)\w\w)( bui|\))/i,
              // Kindle Fire without Silk / Echo Show
              /(kf[a-z]+)( bui|\)).+silk\//i
              // Kindle Fire HD
            ],
            [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]],
            [
              /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i
              // Fire Phone
            ],
            [[MODEL, /(.+)/g, "Fire Phone $1"], [VENDOR, AMAZON], [TYPE, MOBILE]],
            [
              // BlackBerry
              /(playbook);[-\w\),; ]+(rim)/i
              // BlackBerry PlayBook
            ],
            [MODEL, VENDOR, [TYPE, TABLET]],
            [
              /\b((?:bb[a-f]|st[hv])100-\d)/i,
              /\(bb10; (\w+)/i
              // BlackBerry 10
            ],
            [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]],
            [
              // Asus
              /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
            ],
            [MODEL, [VENDOR, ASUS], [TYPE, TABLET]],
            [
              / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
            ],
            [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]],
            [
              // HTC
              /(nexus 9)/i
              // HTC Nexus 9
            ],
            [MODEL, [VENDOR, "HTC"], [TYPE, TABLET]],
            [
              /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
              // HTC
              // ZTE
              /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
              /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i
              // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
            ],
            [VENDOR, [MODEL, /_/g, " "], [TYPE, MOBILE]],
            [
              // TCL
              /droid [\w\.]+; ((?:8[14]9[16]|9(?:0(?:48|60|8[01])|1(?:3[27]|66)|2(?:6[69]|9[56])|466))[gqswx])\w*(\)| bui)/i
            ],
            [MODEL, [VENDOR, "TCL"], [TYPE, TABLET]],
            [
              // itel
              /(itel) ((\w+))/i
            ],
            [[VENDOR, lowerize], MODEL, [TYPE, strMapper, { "tablet": ["p10001l", "w7001"], "*": "mobile" }]],
            [
              // Acer
              /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
            ],
            [MODEL, [VENDOR, "Acer"], [TYPE, TABLET]],
            [
              // Meizu
              /droid.+; (m[1-5] note) bui/i,
              /\bmz-([-\w]{2,})/i
            ],
            [MODEL, [VENDOR, "Meizu"], [TYPE, MOBILE]],
            [
              // Ulefone
              /; ((?:power )?armor(?:[\w ]{0,8}))(?: bui|\))/i
            ],
            [MODEL, [VENDOR, "Ulefone"], [TYPE, MOBILE]],
            [
              // Energizer
              /; (energy ?\w+)(?: bui|\))/i,
              /; energizer ([\w ]+)(?: bui|\))/i
            ],
            [MODEL, [VENDOR, "Energizer"], [TYPE, MOBILE]],
            [
              // Cat
              /; cat (b35);/i,
              /; (b15q?|s22 flip|s48c|s62 pro)(?: bui|\))/i
            ],
            [MODEL, [VENDOR, "Cat"], [TYPE, MOBILE]],
            [
              // Smartfren
              /((?:new )?andromax[\w- ]+)(?: bui|\))/i
            ],
            [MODEL, [VENDOR, "Smartfren"], [TYPE, MOBILE]],
            [
              // Nothing
              /droid.+; (a(?:015|06[35]|142p?))/i
            ],
            [MODEL, [VENDOR, "Nothing"], [TYPE, MOBILE]],
            [
              // Archos
              /; (x67 5g|tikeasy \w+|ac[1789]\d\w+)( b|\))/i,
              /archos ?(5|gamepad2?|([\w ]*[t1789]|hello) ?\d+[\w ]*)( b|\))/i
            ],
            [MODEL, [VENDOR, "Archos"], [TYPE, TABLET]],
            [
              /archos ([\w ]+)( b|\))/i,
              /; (ac[3-6]\d\w{2,8})( b|\))/i
            ],
            [MODEL, [VENDOR, "Archos"], [TYPE, MOBILE]],
            [
              // MIXED
              /(imo) (tab \w+)/i,
              // IMO
              /(infinix) (x1101b?)/i
              // Infinix XPad
            ],
            [VENDOR, MODEL, [TYPE, TABLET]],
            [
              /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus(?! zenw)|dell|jolla|meizu|motorola|polytron|infinix|tecno|micromax|advan)[-_ ]?([-\w]*)/i,
              // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron/Infinix/Tecno/Micromax/Advan
              /; (hmd|imo) ([\w ]+?)(?: bui|\))/i,
              // HMD/IMO
              /(hp) ([\w ]+\w)/i,
              // HP iPAQ
              /(microsoft); (lumia[\w ]+)/i,
              // Microsoft Lumia
              /(lenovo)[-_ ]?([-\w ]+?)(?: bui|\)|\/)/i,
              // Lenovo
              /(oppo) ?([\w ]+) bui/i
              // OPPO
            ],
            [VENDOR, MODEL, [TYPE, MOBILE]],
            [
              /(kobo)\s(ereader|touch)/i,
              // Kobo
              /(hp).+(touchpad(?!.+tablet)|tablet)/i,
              // HP TouchPad
              /(kindle)\/([\w\.]+)/i,
              // Kindle
              /(nook)[\w ]+build\/(\w+)/i,
              // Nook
              /(dell) (strea[kpr\d ]*[\dko])/i,
              // Dell Streak
              /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
              // Le Pan Tablets
              /(trinity)[- ]*(t\d{3}) bui/i,
              // Trinity Tablets
              /(gigaset)[- ]+(q\w{1,9}) bui/i,
              // Gigaset Tablets
              /(vodafone) ([\w ]+)(?:\)| bui)/i
              // Vodafone
            ],
            [VENDOR, MODEL, [TYPE, TABLET]],
            [
              /(surface duo)/i
              // Surface Duo
            ],
            [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]],
            [
              /droid [\d\.]+; (fp\du?)(?: b|\))/i
              // Fairphone
            ],
            [MODEL, [VENDOR, "Fairphone"], [TYPE, MOBILE]],
            [
              /(u304aa)/i
              // AT&T
            ],
            [MODEL, [VENDOR, "AT&T"], [TYPE, MOBILE]],
            [
              /\bsie-(\w*)/i
              // Siemens
            ],
            [MODEL, [VENDOR, "Siemens"], [TYPE, MOBILE]],
            [
              /\b(rct\w+) b/i
              // RCA Tablets
            ],
            [MODEL, [VENDOR, "RCA"], [TYPE, TABLET]],
            [
              /\b(venue[\d ]{2,7}) b/i
              // Dell Venue Tablets
            ],
            [MODEL, [VENDOR, "Dell"], [TYPE, TABLET]],
            [
              /\b(q(?:mv|ta)\w+) b/i
              // Verizon Tablet
            ],
            [MODEL, [VENDOR, "Verizon"], [TYPE, TABLET]],
            [
              /\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i
              // Barnes & Noble Tablet
            ],
            [MODEL, [VENDOR, "Barnes & Noble"], [TYPE, TABLET]],
            [
              /\b(tm\d{3}\w+) b/i
            ],
            [MODEL, [VENDOR, "NuVision"], [TYPE, TABLET]],
            [
              /\b(k88) b/i
              // ZTE K Series Tablet
            ],
            [MODEL, [VENDOR, "ZTE"], [TYPE, TABLET]],
            [
              /\b(nx\d{3}j) b/i
              // ZTE Nubia
            ],
            [MODEL, [VENDOR, "ZTE"], [TYPE, MOBILE]],
            [
              /\b(gen\d{3}) b.+49h/i
              // Swiss GEN Mobile
            ],
            [MODEL, [VENDOR, "Swiss"], [TYPE, MOBILE]],
            [
              /\b(zur\d{3}) b/i
              // Swiss ZUR Tablet
            ],
            [MODEL, [VENDOR, "Swiss"], [TYPE, TABLET]],
            [
              /\b((zeki)?tb.*\b) b/i
              // Zeki Tablets
            ],
            [MODEL, [VENDOR, "Zeki"], [TYPE, TABLET]],
            [
              /\b([yr]\d{2}) b/i,
              /\b(dragon[- ]+touch |dt)(\w{5}) b/i
              // Dragon Touch Tablet
            ],
            [[VENDOR, "Dragon Touch"], MODEL, [TYPE, TABLET]],
            [
              /\b(ns-?\w{0,9}) b/i
              // Insignia Tablets
            ],
            [MODEL, [VENDOR, "Insignia"], [TYPE, TABLET]],
            [
              /\b((nxa|next)-?\w{0,9}) b/i
              // NextBook Tablets
            ],
            [MODEL, [VENDOR, "NextBook"], [TYPE, TABLET]],
            [
              /\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i
              // Voice Xtreme Phones
            ],
            [[VENDOR, "Voice"], MODEL, [TYPE, MOBILE]],
            [
              /\b(lvtel\-)?(v1[12]) b/i
              // LvTel Phones
            ],
            [[VENDOR, "LvTel"], MODEL, [TYPE, MOBILE]],
            [
              /\b(ph-1) /i
              // Essential PH-1
            ],
            [MODEL, [VENDOR, "Essential"], [TYPE, MOBILE]],
            [
              /\b(v(100md|700na|7011|917g).*\b) b/i
              // Envizen Tablets
            ],
            [MODEL, [VENDOR, "Envizen"], [TYPE, TABLET]],
            [
              /\b(trio[-\w\. ]+) b/i
              // MachSpeed Tablets
            ],
            [MODEL, [VENDOR, "MachSpeed"], [TYPE, TABLET]],
            [
              /\btu_(1491) b/i
              // Rotor Tablets
            ],
            [MODEL, [VENDOR, "Rotor"], [TYPE, TABLET]],
            [
              /((?:tegranote|shield t(?!.+d tv))[\w- ]*?)(?: b|\))/i
              // Nvidia Tablets
            ],
            [MODEL, [VENDOR, NVIDIA], [TYPE, TABLET]],
            [
              /(sprint) (\w+)/i
              // Sprint Phones
            ],
            [VENDOR, MODEL, [TYPE, MOBILE]],
            [
              /(kin\.[onetw]{3})/i
              // Microsoft Kin
            ],
            [[MODEL, /\./g, " "], [VENDOR, MICROSOFT], [TYPE, MOBILE]],
            [
              /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i
              // Zebra
            ],
            [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]],
            [
              /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
            ],
            [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]],
            [
              ///////////////////
              // SMARTTVS
              ///////////////////
              /smart-tv.+(samsung)/i
              // Samsung
            ],
            [VENDOR, [TYPE, SMARTTV]],
            [
              /hbbtv.+maple;(\d+)/i
            ],
            [[MODEL, /^/, "SmartTV"], [VENDOR, SAMSUNG], [TYPE, SMARTTV]],
            [
              /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i
              // LG SmartTV
            ],
            [[VENDOR, LG], [TYPE, SMARTTV]],
            [
              /(apple) ?tv/i
              // Apple TV
            ],
            [VENDOR, [MODEL, APPLE + " TV"], [TYPE, SMARTTV]],
            [
              /crkey/i
              // Google Chromecast
            ],
            [[MODEL, CHROME + "cast"], [VENDOR, GOOGLE], [TYPE, SMARTTV]],
            [
              /droid.+aft(\w+)( bui|\))/i
              // Fire TV
            ],
            [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]],
            [
              /(shield \w+ tv)/i
              // Nvidia Shield TV
            ],
            [MODEL, [VENDOR, NVIDIA], [TYPE, SMARTTV]],
            [
              /\(dtv[\);].+(aquos)/i,
              /(aquos-tv[\w ]+)\)/i
              // Sharp
            ],
            [MODEL, [VENDOR, SHARP], [TYPE, SMARTTV]],
            [
              /(bravia[\w ]+)( bui|\))/i
              // Sony
            ],
            [MODEL, [VENDOR, SONY], [TYPE, SMARTTV]],
            [
              /(mi(tv|box)-?\w+) bui/i
              // Xiaomi
            ],
            [MODEL, [VENDOR, XIAOMI], [TYPE, SMARTTV]],
            [
              /Hbbtv.*(technisat) (.*);/i
              // TechniSAT
            ],
            [VENDOR, MODEL, [TYPE, SMARTTV]],
            [
              /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,
              // Roku
              /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i
              // HbbTV devices
            ],
            [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]],
            [
              // SmartTV from Unidentified Vendors
              /droid.+; ([\w- ]+) (?:android tv|smart[- ]?tv)/i
            ],
            [MODEL, [TYPE, SMARTTV]],
            [
              /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i
            ],
            [[TYPE, SMARTTV]],
            [
              ///////////////////
              // CONSOLES
              ///////////////////
              /(ouya)/i,
              // Ouya
              /(nintendo) ([wids3utch]+)/i
              // Nintendo
            ],
            [VENDOR, MODEL, [TYPE, CONSOLE]],
            [
              /droid.+; (shield)( bui|\))/i
              // Nvidia Portable
            ],
            [MODEL, [VENDOR, NVIDIA], [TYPE, CONSOLE]],
            [
              /(playstation \w+)/i
              // Playstation
            ],
            [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]],
            [
              /\b(xbox(?: one)?(?!; xbox))[\); ]/i
              // Microsoft Xbox
            ],
            [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]],
            [
              ///////////////////
              // WEARABLES
              ///////////////////
              /\b(sm-[lr]\d\d[0156][fnuw]?s?|gear live)\b/i
              // Samsung Galaxy Watch
            ],
            [MODEL, [VENDOR, SAMSUNG], [TYPE, WEARABLE]],
            [
              /((pebble))app/i,
              // Pebble
              /(asus|google|lg|oppo) ((pixel |zen)?watch[\w ]*)( bui|\))/i
              // Asus ZenWatch / LG Watch / Pixel Watch
            ],
            [VENDOR, MODEL, [TYPE, WEARABLE]],
            [
              /(ow(?:19|20)?we?[1-3]{1,3})/i
              // Oppo Watch
            ],
            [MODEL, [VENDOR, OPPO], [TYPE, WEARABLE]],
            [
              /(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i
              // Apple Watch
            ],
            [MODEL, [VENDOR, APPLE], [TYPE, WEARABLE]],
            [
              /(opwwe\d{3})/i
              // OnePlus Watch
            ],
            [MODEL, [VENDOR, ONEPLUS], [TYPE, WEARABLE]],
            [
              /(moto 360)/i
              // Motorola 360
            ],
            [MODEL, [VENDOR, MOTOROLA], [TYPE, WEARABLE]],
            [
              /(smartwatch 3)/i
              // Sony SmartWatch
            ],
            [MODEL, [VENDOR, SONY], [TYPE, WEARABLE]],
            [
              /(g watch r)/i
              // LG G Watch R
            ],
            [MODEL, [VENDOR, LG], [TYPE, WEARABLE]],
            [
              /droid.+; (wt63?0{2,3})\)/i
            ],
            [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]],
            [
              ///////////////////
              // XR
              ///////////////////
              /droid.+; (glass) \d/i
              // Google Glass
            ],
            [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]],
            [
              /(pico) (4|neo3(?: link|pro)?)/i
              // Pico
            ],
            [VENDOR, MODEL, [TYPE, WEARABLE]],
            [
              /; (quest( \d| pro)?)/i
              // Oculus Quest
            ],
            [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]],
            [
              ///////////////////
              // EMBEDDED
              ///////////////////
              /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i
              // Tesla
            ],
            [VENDOR, [TYPE, EMBEDDED]],
            [
              /(aeobc)\b/i
              // Echo Dot
            ],
            [MODEL, [VENDOR, AMAZON], [TYPE, EMBEDDED]],
            [
              /(homepod).+mac os/i
              // Apple HomePod
            ],
            [MODEL, [VENDOR, APPLE], [TYPE, EMBEDDED]],
            [
              /windows iot/i
            ],
            [[TYPE, EMBEDDED]],
            [
              ////////////////////
              // MIXED (GENERIC)
              ///////////////////
              /droid .+?; ([^;]+?)(?: bui|; wv\)|\) applew).+? mobile safari/i
              // Android Phones from Unidentified Vendors
            ],
            [MODEL, [TYPE, MOBILE]],
            [
              /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i
              // Android Tablets from Unidentified Vendors
            ],
            [MODEL, [TYPE, TABLET]],
            [
              /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i
              // Unidentifiable Tablet
            ],
            [[TYPE, TABLET]],
            [
              /(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i
              // Unidentifiable Mobile
            ],
            [[TYPE, MOBILE]],
            [
              /droid .+?; ([\w\. -]+)( bui|\))/i
              // Generic Android Device
            ],
            [MODEL, [VENDOR, "Generic"]]
          ],
          engine: [
            [
              /windows.+ edge\/([\w\.]+)/i
              // EdgeHTML
            ],
            [VERSION, [NAME, EDGE + "HTML"]],
            [
              /(arkweb)\/([\w\.]+)/i
              // ArkWeb
            ],
            [NAME, VERSION],
            [
              /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i
              // Blink
            ],
            [VERSION, [NAME, "Blink"]],
            [
              /(presto)\/([\w\.]+)/i,
              // Presto
              /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna|servo)\/([\w\.]+)/i,
              // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna/Servo
              /ekioh(flow)\/([\w\.]+)/i,
              // Flow
              /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
              // KHTML/Tasman/Links
              /(icab)[\/ ]([23]\.[\d\.]+)/i,
              // iCab
              /\b(libweb)/i
              // LibWeb
            ],
            [NAME, VERSION],
            [
              /ladybird\//i
            ],
            [[NAME, "LibWeb"]],
            [
              /rv\:([\w\.]{1,9})\b.+(gecko)/i
              // Gecko
            ],
            [VERSION, NAME]
          ],
          os: [
            [
              // Windows
              /microsoft (windows) (vista|xp)/i
              // Windows (iTunes)
            ],
            [NAME, VERSION],
            [
              /(windows (?:phone(?: os)?|mobile|iot))[\/ ]?([\d\.\w ]*)/i
              // Windows Phone
            ],
            [NAME, [VERSION, strMapper, windowsVersionMap]],
            [
              /windows nt 6\.2; (arm)/i,
              // Windows RT
              /windows[\/ ]([ntce\d\. ]+\w)(?!.+xbox)/i,
              /(?:win(?=3|9|n)|win 9x )([nt\d\.]+)/i
            ],
            [[VERSION, strMapper, windowsVersionMap], [NAME, "Windows"]],
            [
              // iOS/macOS
              /[adehimnop]{4,7}\b(?:.*os ([\w]+) like mac|; opera)/i,
              // iOS
              /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
              /cfnetwork\/.+darwin/i
            ],
            [[VERSION, /_/g, "."], [NAME, "iOS"]],
            [
              /(mac os x) ?([\w\. ]*)/i,
              /(macintosh|mac_powerpc\b)(?!.+haiku)/i
              // Mac OS
            ],
            [[NAME, MAC_OS], [VERSION, /_/g, "."]],
            [
              // Mobile OSes
              /droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i
              // Android-x86/HarmonyOS
            ],
            [VERSION, NAME],
            [
              /(ubuntu) ([\w\.]+) like android/i
              // Ubuntu Touch
            ],
            [[NAME, /(.+)/, "$1 Touch"], VERSION],
            [
              // Android/Blackberry/WebOS/QNX/Bada/RIM/KaiOS/Maemo/MeeGo/S40/Sailfish OS/OpenHarmony/Tizen
              /(android|bada|blackberry|kaios|maemo|meego|openharmony|qnx|rim tablet os|sailfish|series40|symbian|tizen|webos)\w*[-\/; ]?([\d\.]*)/i
            ],
            [NAME, VERSION],
            [
              /\(bb(10);/i
              // BlackBerry 10
            ],
            [VERSION, [NAME, BLACKBERRY]],
            [
              /(?:symbian ?os|symbos|s60(?=;)|series ?60)[-\/ ]?([\w\.]*)/i
              // Symbian
            ],
            [VERSION, [NAME, "Symbian"]],
            [
              /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i
              // Firefox OS
            ],
            [VERSION, [NAME, FIREFOX + " OS"]],
            [
              /web0s;.+rt(tv)/i,
              /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i
              // WebOS
            ],
            [VERSION, [NAME, "webOS"]],
            [
              /watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i
              // watchOS
            ],
            [VERSION, [NAME, "watchOS"]],
            [
              // Google Chromecast
              /crkey\/([\d\.]+)/i
              // Google Chromecast
            ],
            [VERSION, [NAME, CHROME + "cast"]],
            [
              /(cros) [\w]+(?:\)| ([\w\.]+)\b)/i
              // Chromium OS
            ],
            [[NAME, CHROMIUM_OS], VERSION],
            [
              // Smart TVs
              /panasonic;(viera)/i,
              // Panasonic Viera
              /(netrange)mmh/i,
              // Netrange
              /(nettv)\/(\d+\.[\w\.]+)/i,
              // NetTV
              // Console
              /(nintendo|playstation) ([wids345portablevuch]+)/i,
              // Nintendo/Playstation
              /(xbox); +xbox ([^\);]+)/i,
              // Microsoft Xbox (360, One, X, S, Series X, Series S)
              // Other
              /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
              // Joli/Palm
              /(mint)[\/\(\) ]?(\w*)/i,
              // Mint
              /(mageia|vectorlinux)[; ]/i,
              // Mageia/VectorLinux
              /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
              // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
              /(hurd|linux)(?: arm\w*| x86\w*| ?)([\w\.]*)/i,
              // Hurd/Linux
              /(gnu) ?([\w\.]*)/i,
              // GNU
              /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
              // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
              /(haiku) (\w+)/i
              // Haiku
            ],
            [NAME, VERSION],
            [
              /(sunos) ?([\w\.\d]*)/i
              // Solaris
            ],
            [[NAME, "Solaris"], VERSION],
            [
              /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
              // Solaris
              /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
              // AIX
              /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i,
              // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX/SerenityOS
              /(unix) ?([\w\.]*)/i
              // UNIX
            ],
            [NAME, VERSION]
          ]
        };
        var UAParser = function(ua2, extensions) {
          if (typeof ua2 === OBJ_TYPE) {
            extensions = ua2;
            ua2 = undefined2;
          }
          if (!(this instanceof UAParser)) {
            return new UAParser(ua2, extensions).getResult();
          }
          var _navigator = typeof window2 !== UNDEF_TYPE && window2.navigator ? window2.navigator : undefined2;
          var _ua = ua2 || (_navigator && _navigator.userAgent ? _navigator.userAgent : EMPTY);
          var _uach = _navigator && _navigator.userAgentData ? _navigator.userAgentData : undefined2;
          var _rgxmap = extensions ? extend(regexes, extensions) : regexes;
          var _isSelfNav = _navigator && _navigator.userAgent == _ua;
          this.getBrowser = function() {
            var _browser = {};
            _browser[NAME] = undefined2;
            _browser[VERSION] = undefined2;
            rgxMapper.call(_browser, _ua, _rgxmap.browser);
            _browser[MAJOR] = majorize(_browser[VERSION]);
            if (_isSelfNav && _navigator && _navigator.brave && typeof _navigator.brave.isBrave == FUNC_TYPE) {
              _browser[NAME] = "Brave";
            }
            return _browser;
          };
          this.getCPU = function() {
            var _cpu = {};
            _cpu[ARCHITECTURE] = undefined2;
            rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
            return _cpu;
          };
          this.getDevice = function() {
            var _device = {};
            _device[VENDOR] = undefined2;
            _device[MODEL] = undefined2;
            _device[TYPE] = undefined2;
            rgxMapper.call(_device, _ua, _rgxmap.device);
            if (_isSelfNav && !_device[TYPE] && _uach && _uach.mobile) {
              _device[TYPE] = MOBILE;
            }
            if (_isSelfNav && _device[MODEL] == "Macintosh" && _navigator && typeof _navigator.standalone !== UNDEF_TYPE && _navigator.maxTouchPoints && _navigator.maxTouchPoints > 2) {
              _device[MODEL] = "iPad";
              _device[TYPE] = TABLET;
            }
            return _device;
          };
          this.getEngine = function() {
            var _engine = {};
            _engine[NAME] = undefined2;
            _engine[VERSION] = undefined2;
            rgxMapper.call(_engine, _ua, _rgxmap.engine);
            return _engine;
          };
          this.getOS = function() {
            var _os = {};
            _os[NAME] = undefined2;
            _os[VERSION] = undefined2;
            rgxMapper.call(_os, _ua, _rgxmap.os);
            if (_isSelfNav && !_os[NAME] && _uach && _uach.platform && _uach.platform != "Unknown") {
              _os[NAME] = _uach.platform.replace(/chrome os/i, CHROMIUM_OS).replace(/macos/i, MAC_OS);
            }
            return _os;
          };
          this.getResult = function() {
            return {
              ua: this.getUA(),
              browser: this.getBrowser(),
              engine: this.getEngine(),
              os: this.getOS(),
              device: this.getDevice(),
              cpu: this.getCPU()
            };
          };
          this.getUA = function() {
            return _ua;
          };
          this.setUA = function(ua3) {
            _ua = typeof ua3 === STR_TYPE && ua3.length > UA_MAX_LENGTH ? trim(ua3, UA_MAX_LENGTH) : ua3;
            return this;
          };
          this.setUA(_ua);
          return this;
        };
        UAParser.VERSION = LIBVERSION;
        UAParser.BROWSER = enumerize([NAME, VERSION, MAJOR]);
        UAParser.CPU = enumerize([ARCHITECTURE]);
        UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
        UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]);
        if (typeof exports !== UNDEF_TYPE) {
          if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
          }
          exports.UAParser = UAParser;
        } else {
          if (typeof define === FUNC_TYPE && define.amd) {
            define(function() {
              return UAParser;
            });
          } else if (typeof window2 !== UNDEF_TYPE) {
            window2.UAParser = UAParser;
          }
        }
        var $ = typeof window2 !== UNDEF_TYPE && (window2.jQuery || window2.Zepto);
        if ($ && !$.ua) {
          var parser = new UAParser();
          $.ua = parser.getResult();
          $.ua.get = function() {
            return parser.getUA();
          };
          $.ua.set = function(ua2) {
            parser.setUA(ua2);
            var result = parser.getResult();
            for (var prop in result) {
              $.ua[prop] = result[prop];
            }
          };
        }
      })(typeof window === "object" ? window : exports);
    }
  });

  // node_modules/lodash.isequal/index.js
  var require_lodash = __commonJS({
    "node_modules/lodash.isequal/index.js"(exports, module) {
      var LARGE_ARRAY_SIZE = 200;
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      var COMPARE_PARTIAL_FLAG = 1;
      var COMPARE_UNORDERED_FLAG = 2;
      var MAX_SAFE_INTEGER = 9007199254740991;
      var argsTag = "[object Arguments]";
      var arrayTag = "[object Array]";
      var asyncTag = "[object AsyncFunction]";
      var boolTag = "[object Boolean]";
      var dateTag = "[object Date]";
      var errorTag = "[object Error]";
      var funcTag = "[object Function]";
      var genTag = "[object GeneratorFunction]";
      var mapTag = "[object Map]";
      var numberTag = "[object Number]";
      var nullTag = "[object Null]";
      var objectTag = "[object Object]";
      var promiseTag = "[object Promise]";
      var proxyTag = "[object Proxy]";
      var regexpTag = "[object RegExp]";
      var setTag = "[object Set]";
      var stringTag = "[object String]";
      var symbolTag = "[object Symbol]";
      var undefinedTag = "[object Undefined]";
      var weakMapTag = "[object WeakMap]";
      var arrayBufferTag = "[object ArrayBuffer]";
      var dataViewTag = "[object DataView]";
      var float32Tag = "[object Float32Array]";
      var float64Tag = "[object Float64Array]";
      var int8Tag = "[object Int8Array]";
      var int16Tag = "[object Int16Array]";
      var int32Tag = "[object Int32Array]";
      var uint8Tag = "[object Uint8Array]";
      var uint8ClampedTag = "[object Uint8ClampedArray]";
      var uint16Tag = "[object Uint16Array]";
      var uint32Tag = "[object Uint32Array]";
      var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var reIsUint = /^(?:0|[1-9]\d*)$/;
      var typedArrayTags = {};
      typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
      typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
      var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = freeGlobal || freeSelf || Function("return this")();
      var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
      var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var freeProcess = moduleExports && freeGlobal.process;
      var nodeUtil = (function() {
        try {
          return freeProcess && freeProcess.binding && freeProcess.binding("util");
        } catch (e) {
        }
      })();
      var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
      function arrayFilter(array, predicate) {
        var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
        while (++index < length) {
          var value = array[index];
          if (predicate(value, index, array)) {
            result[resIndex++] = value;
          }
        }
        return result;
      }
      function arrayPush(array, values) {
        var index = -1, length = values.length, offset = array.length;
        while (++index < length) {
          array[offset + index] = values[index];
        }
        return array;
      }
      function arraySome(array, predicate) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (predicate(array[index], index, array)) {
            return true;
          }
        }
        return false;
      }
      function baseTimes(n2, iteratee) {
        var index = -1, result = Array(n2);
        while (++index < n2) {
          result[index] = iteratee(index);
        }
        return result;
      }
      function baseUnary(func) {
        return function(value) {
          return func(value);
        };
      }
      function cacheHas(cache, key) {
        return cache.has(key);
      }
      function getValue(object, key) {
        return object == null ? void 0 : object[key];
      }
      function mapToArray(map) {
        var index = -1, result = Array(map.size);
        map.forEach(function(value, key) {
          result[++index] = [key, value];
        });
        return result;
      }
      function overArg(func, transform) {
        return function(arg) {
          return func(transform(arg));
        };
      }
      function setToArray(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = value;
        });
        return result;
      }
      var arrayProto = Array.prototype;
      var funcProto = Function.prototype;
      var objectProto = Object.prototype;
      var coreJsData = root["__core-js_shared__"];
      var funcToString = funcProto.toString;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var maskSrcKey = (function() {
        var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      })();
      var nativeObjectToString = objectProto.toString;
      var reIsNative = RegExp(
        "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      );
      var Buffer2 = moduleExports ? root.Buffer : void 0;
      var Symbol2 = root.Symbol;
      var Uint8Array2 = root.Uint8Array;
      var propertyIsEnumerable = objectProto.propertyIsEnumerable;
      var splice = arrayProto.splice;
      var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
      var nativeGetSymbols = Object.getOwnPropertySymbols;
      var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
      var nativeKeys = overArg(Object.keys, Object);
      var DataView = getNative(root, "DataView");
      var Map2 = getNative(root, "Map");
      var Promise2 = getNative(root, "Promise");
      var Set2 = getNative(root, "Set");
      var WeakMap2 = getNative(root, "WeakMap");
      var nativeCreate = getNative(Object, "create");
      var dataViewCtorString = toSource(DataView);
      var mapCtorString = toSource(Map2);
      var promiseCtorString = toSource(Promise2);
      var setCtorString = toSource(Set2);
      var weakMapCtorString = toSource(WeakMap2);
      var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
      var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
      function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function hashClear() {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
        this.size = 0;
      }
      function hashDelete(key) {
        var result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result;
      }
      function hashGet(key) {
        var data = this.__data__;
        if (nativeCreate) {
          var result = data[key];
          return result === HASH_UNDEFINED ? void 0 : result;
        }
        return hasOwnProperty.call(data, key) ? data[key] : void 0;
      }
      function hashHas(key) {
        var data = this.__data__;
        return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
      }
      function hashSet(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
        return this;
      }
      Hash.prototype.clear = hashClear;
      Hash.prototype["delete"] = hashDelete;
      Hash.prototype.get = hashGet;
      Hash.prototype.has = hashHas;
      Hash.prototype.set = hashSet;
      function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
      }
      function listCacheDelete(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
          data.pop();
        } else {
          splice.call(data, index, 1);
        }
        --this.size;
        return true;
      }
      function listCacheGet(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        return index < 0 ? void 0 : data[index][1];
      }
      function listCacheHas(key) {
        return assocIndexOf(this.__data__, key) > -1;
      }
      function listCacheSet(key, value) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          ++this.size;
          data.push([key, value]);
        } else {
          data[index][1] = value;
        }
        return this;
      }
      ListCache.prototype.clear = listCacheClear;
      ListCache.prototype["delete"] = listCacheDelete;
      ListCache.prototype.get = listCacheGet;
      ListCache.prototype.has = listCacheHas;
      ListCache.prototype.set = listCacheSet;
      function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
          "hash": new Hash(),
          "map": new (Map2 || ListCache)(),
          "string": new Hash()
        };
      }
      function mapCacheDelete(key) {
        var result = getMapData(this, key)["delete"](key);
        this.size -= result ? 1 : 0;
        return result;
      }
      function mapCacheGet(key) {
        return getMapData(this, key).get(key);
      }
      function mapCacheHas(key) {
        return getMapData(this, key).has(key);
      }
      function mapCacheSet(key, value) {
        var data = getMapData(this, key), size = data.size;
        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this;
      }
      MapCache.prototype.clear = mapCacheClear;
      MapCache.prototype["delete"] = mapCacheDelete;
      MapCache.prototype.get = mapCacheGet;
      MapCache.prototype.has = mapCacheHas;
      MapCache.prototype.set = mapCacheSet;
      function SetCache(values) {
        var index = -1, length = values == null ? 0 : values.length;
        this.__data__ = new MapCache();
        while (++index < length) {
          this.add(values[index]);
        }
      }
      function setCacheAdd(value) {
        this.__data__.set(value, HASH_UNDEFINED);
        return this;
      }
      function setCacheHas(value) {
        return this.__data__.has(value);
      }
      SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
      SetCache.prototype.has = setCacheHas;
      function Stack(entries) {
        var data = this.__data__ = new ListCache(entries);
        this.size = data.size;
      }
      function stackClear() {
        this.__data__ = new ListCache();
        this.size = 0;
      }
      function stackDelete(key) {
        var data = this.__data__, result = data["delete"](key);
        this.size = data.size;
        return result;
      }
      function stackGet(key) {
        return this.__data__.get(key);
      }
      function stackHas(key) {
        return this.__data__.has(key);
      }
      function stackSet(key, value) {
        var data = this.__data__;
        if (data instanceof ListCache) {
          var pairs = data.__data__;
          if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
            pairs.push([key, value]);
            this.size = ++data.size;
            return this;
          }
          data = this.__data__ = new MapCache(pairs);
        }
        data.set(key, value);
        this.size = data.size;
        return this;
      }
      Stack.prototype.clear = stackClear;
      Stack.prototype["delete"] = stackDelete;
      Stack.prototype.get = stackGet;
      Stack.prototype.has = stackHas;
      Stack.prototype.set = stackSet;
      function arrayLikeKeys(value, inherited) {
        var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
        for (var key in value) {
          if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
          (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
          isIndex(key, length)))) {
            result.push(key);
          }
        }
        return result;
      }
      function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
          if (eq(array[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      function baseGetAllKeys(object, keysFunc, symbolsFunc) {
        var result = keysFunc(object);
        return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
      }
      function baseGetTag(value) {
        if (value == null) {
          return value === void 0 ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
      }
      function baseIsArguments(value) {
        return isObjectLike(value) && baseGetTag(value) == argsTag;
      }
      function baseIsEqual(value, other, bitmask, customizer, stack) {
        if (value === other) {
          return true;
        }
        if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
          return value !== value && other !== other;
        }
        return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
      }
      function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
        var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
        objTag = objTag == argsTag ? objectTag : objTag;
        othTag = othTag == argsTag ? objectTag : othTag;
        var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
        if (isSameTag && isBuffer(object)) {
          if (!isBuffer(other)) {
            return false;
          }
          objIsArr = true;
          objIsObj = false;
        }
        if (isSameTag && !objIsObj) {
          stack || (stack = new Stack());
          return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
        }
        if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
          var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
          if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
            stack || (stack = new Stack());
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
          }
        }
        if (!isSameTag) {
          return false;
        }
        stack || (stack = new Stack());
        return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
      }
      function baseIsNative(value) {
        if (!isObject2(value) || isMasked(value)) {
          return false;
        }
        var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
        return pattern.test(toSource(value));
      }
      function baseIsTypedArray(value) {
        return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
      }
      function baseKeys(object) {
        if (!isPrototype(object)) {
          return nativeKeys(object);
        }
        var result = [];
        for (var key in Object(object)) {
          if (hasOwnProperty.call(object, key) && key != "constructor") {
            result.push(key);
          }
        }
        return result;
      }
      function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
        if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
          return false;
        }
        var stacked = stack.get(array);
        if (stacked && stack.get(other)) {
          return stacked == other;
        }
        var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
        stack.set(array, other);
        stack.set(other, array);
        while (++index < arrLength) {
          var arrValue = array[index], othValue = other[index];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
          }
          if (compared !== void 0) {
            if (compared) {
              continue;
            }
            result = false;
            break;
          }
          if (seen) {
            if (!arraySome(other, function(othValue2, othIndex) {
              if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
              result = false;
              break;
            }
          } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
            result = false;
            break;
          }
        }
        stack["delete"](array);
        stack["delete"](other);
        return result;
      }
      function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
        switch (tag) {
          case dataViewTag:
            if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
              return false;
            }
            object = object.buffer;
            other = other.buffer;
          case arrayBufferTag:
            if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
              return false;
            }
            return true;
          case boolTag:
          case dateTag:
          case numberTag:
            return eq(+object, +other);
          case errorTag:
            return object.name == other.name && object.message == other.message;
          case regexpTag:
          case stringTag:
            return object == other + "";
          case mapTag:
            var convert = mapToArray;
          case setTag:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
            convert || (convert = setToArray);
            if (object.size != other.size && !isPartial) {
              return false;
            }
            var stacked = stack.get(object);
            if (stacked) {
              return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG;
            stack.set(object, other);
            var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
            stack["delete"](object);
            return result;
          case symbolTag:
            if (symbolValueOf) {
              return symbolValueOf.call(object) == symbolValueOf.call(other);
            }
        }
        return false;
      }
      function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
        if (objLength != othLength && !isPartial) {
          return false;
        }
        var index = objLength;
        while (index--) {
          var key = objProps[index];
          if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
            return false;
          }
        }
        var stacked = stack.get(object);
        if (stacked && stack.get(other)) {
          return stacked == other;
        }
        var result = true;
        stack.set(object, other);
        stack.set(other, object);
        var skipCtor = isPartial;
        while (++index < objLength) {
          key = objProps[index];
          var objValue = object[key], othValue = other[key];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
          }
          if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
            result = false;
            break;
          }
          skipCtor || (skipCtor = key == "constructor");
        }
        if (result && !skipCtor) {
          var objCtor = object.constructor, othCtor = other.constructor;
          if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
            result = false;
          }
        }
        stack["delete"](object);
        stack["delete"](other);
        return result;
      }
      function getAllKeys(object) {
        return baseGetAllKeys(object, keys, getSymbols);
      }
      function getMapData(map, key) {
        var data = map.__data__;
        return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      function getNative(object, key) {
        var value = getValue(object, key);
        return baseIsNative(value) ? value : void 0;
      }
      function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
          value[symToStringTag] = void 0;
          var unmasked = true;
        } catch (e) {
        }
        var result = nativeObjectToString.call(value);
        if (unmasked) {
          if (isOwn) {
            value[symToStringTag] = tag;
          } else {
            delete value[symToStringTag];
          }
        }
        return result;
      }
      var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
        if (object == null) {
          return [];
        }
        object = Object(object);
        return arrayFilter(nativeGetSymbols(object), function(symbol) {
          return propertyIsEnumerable.call(object, symbol);
        });
      };
      var getTag = baseGetTag;
      if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
        getTag = function(value) {
          var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
          if (ctorString) {
            switch (ctorString) {
              case dataViewCtorString:
                return dataViewTag;
              case mapCtorString:
                return mapTag;
              case promiseCtorString:
                return promiseTag;
              case setCtorString:
                return setTag;
              case weakMapCtorString:
                return weakMapTag;
            }
          }
          return result;
        };
      }
      function isIndex(value, length) {
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
      }
      function isKeyable(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
      }
      function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
      }
      function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
      }
      function objectToString(value) {
        return nativeObjectToString.call(value);
      }
      function toSource(func) {
        if (func != null) {
          try {
            return funcToString.call(func);
          } catch (e) {
          }
          try {
            return func + "";
          } catch (e) {
          }
        }
        return "";
      }
      function eq(value, other) {
        return value === other || value !== value && other !== other;
      }
      var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
        return arguments;
      })()) ? baseIsArguments : function(value) {
        return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
      };
      var isArray = Array.isArray;
      function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
      }
      var isBuffer = nativeIsBuffer || stubFalse;
      function isEqual(value, other) {
        return baseIsEqual(value, other);
      }
      function isFunction(value) {
        if (!isObject2(value)) {
          return false;
        }
        var tag = baseGetTag(value);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
      }
      function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
      }
      function isObject2(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      function isObjectLike(value) {
        return value != null && typeof value == "object";
      }
      var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
      function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
      }
      function stubArray() {
        return [];
      }
      function stubFalse() {
        return false;
      }
      module.exports = isEqual;
    }
  });

  // node_modules/sdp/sdp.js
  var require_sdp = __commonJS({
    "node_modules/sdp/sdp.js"(exports, module) {
      "use strict";
      var SDPUtils2 = {};
      SDPUtils2.generateIdentifier = function() {
        return Math.random().toString(36).substring(2, 12);
      };
      SDPUtils2.localCName = SDPUtils2.generateIdentifier();
      SDPUtils2.splitLines = function(blob) {
        return blob.trim().split("\n").map((line) => line.trim());
      };
      SDPUtils2.splitSections = function(blob) {
        const parts = blob.split("\nm=");
        return parts.map((part, index) => (index > 0 ? "m=" + part : part).trim() + "\r\n");
      };
      SDPUtils2.getDescription = function(blob) {
        const sections = SDPUtils2.splitSections(blob);
        return sections && sections[0];
      };
      SDPUtils2.getMediaSections = function(blob) {
        const sections = SDPUtils2.splitSections(blob);
        sections.shift();
        return sections;
      };
      SDPUtils2.matchPrefix = function(blob, prefix) {
        return SDPUtils2.splitLines(blob).filter((line) => line.indexOf(prefix) === 0);
      };
      SDPUtils2.parseCandidate = function(line) {
        let parts;
        if (line.indexOf("a=candidate:") === 0) {
          parts = line.substring(12).split(" ");
        } else {
          parts = line.substring(10).split(" ");
        }
        const candidate = {
          foundation: parts[0],
          component: { 1: "rtp", 2: "rtcp" }[parts[1]] || parts[1],
          protocol: parts[2].toLowerCase(),
          priority: parseInt(parts[3], 10),
          ip: parts[4],
          address: parts[4],
          // address is an alias for ip.
          port: parseInt(parts[5], 10),
          // skip parts[6] == 'typ'
          type: parts[7]
        };
        for (let i2 = 8; i2 < parts.length; i2 += 2) {
          switch (parts[i2]) {
            case "raddr":
              candidate.relatedAddress = parts[i2 + 1];
              break;
            case "rport":
              candidate.relatedPort = parseInt(parts[i2 + 1], 10);
              break;
            case "tcptype":
              candidate.tcpType = parts[i2 + 1];
              break;
            case "ufrag":
              candidate.ufrag = parts[i2 + 1];
              candidate.usernameFragment = parts[i2 + 1];
              break;
            default:
              if (candidate[parts[i2]] === void 0) {
                candidate[parts[i2]] = parts[i2 + 1];
              }
              break;
          }
        }
        return candidate;
      };
      SDPUtils2.writeCandidate = function(candidate) {
        const sdp2 = [];
        sdp2.push(candidate.foundation);
        const component = candidate.component;
        if (component === "rtp") {
          sdp2.push(1);
        } else if (component === "rtcp") {
          sdp2.push(2);
        } else {
          sdp2.push(component);
        }
        sdp2.push(candidate.protocol.toUpperCase());
        sdp2.push(candidate.priority);
        sdp2.push(candidate.address || candidate.ip);
        sdp2.push(candidate.port);
        const type = candidate.type;
        sdp2.push("typ");
        sdp2.push(type);
        if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
          sdp2.push("raddr");
          sdp2.push(candidate.relatedAddress);
          sdp2.push("rport");
          sdp2.push(candidate.relatedPort);
        }
        if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
          sdp2.push("tcptype");
          sdp2.push(candidate.tcpType);
        }
        if (candidate.usernameFragment || candidate.ufrag) {
          sdp2.push("ufrag");
          sdp2.push(candidate.usernameFragment || candidate.ufrag);
        }
        return "candidate:" + sdp2.join(" ");
      };
      SDPUtils2.parseIceOptions = function(line) {
        return line.substring(14).split(" ");
      };
      SDPUtils2.parseRtpMap = function(line) {
        let parts = line.substring(9).split(" ");
        const parsed = {
          payloadType: parseInt(parts.shift(), 10)
          // was: id
        };
        parts = parts[0].split("/");
        parsed.name = parts[0];
        parsed.clockRate = parseInt(parts[1], 10);
        parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
        parsed.numChannels = parsed.channels;
        return parsed;
      };
      SDPUtils2.writeRtpMap = function(codec) {
        let pt2 = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt2 = codec.preferredPayloadType;
        }
        const channels = codec.channels || codec.numChannels || 1;
        return "a=rtpmap:" + pt2 + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
      };
      SDPUtils2.parseExtmap = function(line) {
        const parts = line.substring(9).split(" ");
        return {
          id: parseInt(parts[0], 10),
          direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
          uri: parts[1],
          attributes: parts.slice(2).join(" ")
        };
      };
      SDPUtils2.writeExtmap = function(headerExtension) {
        return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + (headerExtension.attributes ? " " + headerExtension.attributes : "") + "\r\n";
      };
      SDPUtils2.parseFmtp = function(line) {
        const parsed = {};
        let kv;
        const parts = line.substring(line.indexOf(" ") + 1).split(";");
        for (let j3 = 0; j3 < parts.length; j3++) {
          kv = parts[j3].trim().split("=");
          parsed[kv[0].trim()] = kv[1];
        }
        return parsed;
      };
      SDPUtils2.writeFmtp = function(codec) {
        let line = "";
        let pt2 = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt2 = codec.preferredPayloadType;
        }
        if (codec.parameters && Object.keys(codec.parameters).length) {
          const params = [];
          Object.keys(codec.parameters).forEach((param) => {
            if (codec.parameters[param] !== void 0) {
              params.push(param + "=" + codec.parameters[param]);
            } else {
              params.push(param);
            }
          });
          line += "a=fmtp:" + pt2 + " " + params.join(";") + "\r\n";
        }
        return line;
      };
      SDPUtils2.parseRtcpFb = function(line) {
        const parts = line.substring(line.indexOf(" ") + 1).split(" ");
        return {
          type: parts.shift(),
          parameter: parts.join(" ")
        };
      };
      SDPUtils2.writeRtcpFb = function(codec) {
        let lines = "";
        let pt2 = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt2 = codec.preferredPayloadType;
        }
        if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
          codec.rtcpFeedback.forEach((fb) => {
            lines += "a=rtcp-fb:" + pt2 + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
          });
        }
        return lines;
      };
      SDPUtils2.parseSsrcMedia = function(line) {
        const sp = line.indexOf(" ");
        const parts = {
          ssrc: parseInt(line.substring(7, sp), 10)
        };
        const colon = line.indexOf(":", sp);
        if (colon > -1) {
          parts.attribute = line.substring(sp + 1, colon);
          parts.value = line.substring(colon + 1);
        } else {
          parts.attribute = line.substring(sp + 1);
        }
        return parts;
      };
      SDPUtils2.parseSsrcGroup = function(line) {
        const parts = line.substring(13).split(" ");
        return {
          semantics: parts.shift(),
          ssrcs: parts.map((ssrc) => parseInt(ssrc, 10))
        };
      };
      SDPUtils2.getMid = function(mediaSection) {
        const mid = SDPUtils2.matchPrefix(mediaSection, "a=mid:")[0];
        if (mid) {
          return mid.substring(6);
        }
      };
      SDPUtils2.parseFingerprint = function(line) {
        const parts = line.substring(14).split(" ");
        return {
          algorithm: parts[0].toLowerCase(),
          // algorithm is case-sensitive in Edge.
          value: parts[1].toUpperCase()
          // the definition is upper-case in RFC 4572.
        };
      };
      SDPUtils2.getDtlsParameters = function(mediaSection, sessionpart) {
        const lines = SDPUtils2.matchPrefix(
          mediaSection + sessionpart,
          "a=fingerprint:"
        );
        return {
          role: "auto",
          fingerprints: lines.map(SDPUtils2.parseFingerprint)
        };
      };
      SDPUtils2.writeDtlsParameters = function(params, setupType) {
        let sdp2 = "a=setup:" + setupType + "\r\n";
        params.fingerprints.forEach((fp) => {
          sdp2 += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
        });
        return sdp2;
      };
      SDPUtils2.parseCryptoLine = function(line) {
        const parts = line.substring(9).split(" ");
        return {
          tag: parseInt(parts[0], 10),
          cryptoSuite: parts[1],
          keyParams: parts[2],
          sessionParams: parts.slice(3)
        };
      };
      SDPUtils2.writeCryptoLine = function(parameters) {
        return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (typeof parameters.keyParams === "object" ? SDPUtils2.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
      };
      SDPUtils2.parseCryptoKeyParams = function(keyParams) {
        if (keyParams.indexOf("inline:") !== 0) {
          return null;
        }
        const parts = keyParams.substring(7).split("|");
        return {
          keyMethod: "inline",
          keySalt: parts[0],
          lifeTime: parts[1],
          mkiValue: parts[2] ? parts[2].split(":")[0] : void 0,
          mkiLength: parts[2] ? parts[2].split(":")[1] : void 0
        };
      };
      SDPUtils2.writeCryptoKeyParams = function(keyParams) {
        return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
      };
      SDPUtils2.getCryptoParameters = function(mediaSection, sessionpart) {
        const lines = SDPUtils2.matchPrefix(
          mediaSection + sessionpart,
          "a=crypto:"
        );
        return lines.map(SDPUtils2.parseCryptoLine);
      };
      SDPUtils2.getIceParameters = function(mediaSection, sessionpart) {
        const ufrag = SDPUtils2.matchPrefix(
          mediaSection + sessionpart,
          "a=ice-ufrag:"
        )[0];
        const pwd = SDPUtils2.matchPrefix(
          mediaSection + sessionpart,
          "a=ice-pwd:"
        )[0];
        if (!(ufrag && pwd)) {
          return null;
        }
        return {
          usernameFragment: ufrag.substring(12),
          password: pwd.substring(10)
        };
      };
      SDPUtils2.writeIceParameters = function(params) {
        let sdp2 = "a=ice-ufrag:" + params.usernameFragment + "\r\na=ice-pwd:" + params.password + "\r\n";
        if (params.iceLite) {
          sdp2 += "a=ice-lite\r\n";
        }
        return sdp2;
      };
      SDPUtils2.parseRtpParameters = function(mediaSection) {
        const description = {
          codecs: [],
          headerExtensions: [],
          fecMechanisms: [],
          rtcp: []
        };
        const lines = SDPUtils2.splitLines(mediaSection);
        const mline = lines[0].split(" ");
        description.profile = mline[2];
        for (let i2 = 3; i2 < mline.length; i2++) {
          const pt2 = mline[i2];
          const rtpmapline = SDPUtils2.matchPrefix(
            mediaSection,
            "a=rtpmap:" + pt2 + " "
          )[0];
          if (rtpmapline) {
            const codec = SDPUtils2.parseRtpMap(rtpmapline);
            const fmtps = SDPUtils2.matchPrefix(
              mediaSection,
              "a=fmtp:" + pt2 + " "
            );
            codec.parameters = fmtps.length ? SDPUtils2.parseFmtp(fmtps[0]) : {};
            codec.rtcpFeedback = SDPUtils2.matchPrefix(
              mediaSection,
              "a=rtcp-fb:" + pt2 + " "
            ).map(SDPUtils2.parseRtcpFb);
            description.codecs.push(codec);
            switch (codec.name.toUpperCase()) {
              case "RED":
              case "ULPFEC":
                description.fecMechanisms.push(codec.name.toUpperCase());
                break;
              default:
                break;
            }
          }
        }
        SDPUtils2.matchPrefix(mediaSection, "a=extmap:").forEach((line) => {
          description.headerExtensions.push(SDPUtils2.parseExtmap(line));
        });
        const wildcardRtcpFb = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-fb:* ").map(SDPUtils2.parseRtcpFb);
        description.codecs.forEach((codec) => {
          wildcardRtcpFb.forEach((fb) => {
            const duplicate = codec.rtcpFeedback.find((existingFeedback) => {
              return existingFeedback.type === fb.type && existingFeedback.parameter === fb.parameter;
            });
            if (!duplicate) {
              codec.rtcpFeedback.push(fb);
            }
          });
        });
        return description;
      };
      SDPUtils2.writeRtpDescription = function(kind, caps) {
        let sdp2 = "";
        sdp2 += "m=" + kind + " ";
        sdp2 += caps.codecs.length > 0 ? "9" : "0";
        sdp2 += " " + (caps.profile || "UDP/TLS/RTP/SAVPF") + " ";
        sdp2 += caps.codecs.map((codec) => {
          if (codec.preferredPayloadType !== void 0) {
            return codec.preferredPayloadType;
          }
          return codec.payloadType;
        }).join(" ") + "\r\n";
        sdp2 += "c=IN IP4 0.0.0.0\r\n";
        sdp2 += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
        caps.codecs.forEach((codec) => {
          sdp2 += SDPUtils2.writeRtpMap(codec);
          sdp2 += SDPUtils2.writeFmtp(codec);
          sdp2 += SDPUtils2.writeRtcpFb(codec);
        });
        let maxptime = 0;
        caps.codecs.forEach((codec) => {
          if (codec.maxptime > maxptime) {
            maxptime = codec.maxptime;
          }
        });
        if (maxptime > 0) {
          sdp2 += "a=maxptime:" + maxptime + "\r\n";
        }
        if (caps.headerExtensions) {
          caps.headerExtensions.forEach((extension) => {
            sdp2 += SDPUtils2.writeExtmap(extension);
          });
        }
        return sdp2;
      };
      SDPUtils2.parseRtpEncodingParameters = function(mediaSection) {
        const encodingParameters = [];
        const description = SDPUtils2.parseRtpParameters(mediaSection);
        const hasRed = description.fecMechanisms.indexOf("RED") !== -1;
        const hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
        const ssrcs = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((parts) => parts.attribute === "cname");
        const primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
        let secondarySsrc;
        const flows = SDPUtils2.matchPrefix(mediaSection, "a=ssrc-group:FID").map((line) => {
          const parts = line.substring(17).split(" ");
          return parts.map((part) => parseInt(part, 10));
        });
        if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
          secondarySsrc = flows[0][1];
        }
        description.codecs.forEach((codec) => {
          if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
            let encParam = {
              ssrc: primarySsrc,
              codecPayloadType: parseInt(codec.parameters.apt, 10)
            };
            if (primarySsrc && secondarySsrc) {
              encParam.rtx = { ssrc: secondarySsrc };
            }
            encodingParameters.push(encParam);
            if (hasRed) {
              encParam = JSON.parse(JSON.stringify(encParam));
              encParam.fec = {
                ssrc: primarySsrc,
                mechanism: hasUlpfec ? "red+ulpfec" : "red"
              };
              encodingParameters.push(encParam);
            }
          }
        });
        if (encodingParameters.length === 0 && primarySsrc) {
          encodingParameters.push({
            ssrc: primarySsrc
          });
        }
        let bandwidth = SDPUtils2.matchPrefix(mediaSection, "b=");
        if (bandwidth.length) {
          if (bandwidth[0].indexOf("b=TIAS:") === 0) {
            bandwidth = parseInt(bandwidth[0].substring(7), 10);
          } else if (bandwidth[0].indexOf("b=AS:") === 0) {
            bandwidth = parseInt(bandwidth[0].substring(5), 10) * 1e3 * 0.95 - 50 * 40 * 8;
          } else {
            bandwidth = void 0;
          }
          encodingParameters.forEach((params) => {
            params.maxBitrate = bandwidth;
          });
        }
        return encodingParameters;
      };
      SDPUtils2.parseRtcpParameters = function(mediaSection) {
        const rtcpParameters = {};
        const remoteSsrc = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((obj) => obj.attribute === "cname")[0];
        if (remoteSsrc) {
          rtcpParameters.cname = remoteSsrc.value;
          rtcpParameters.ssrc = remoteSsrc.ssrc;
        }
        const rsize = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-rsize");
        rtcpParameters.reducedSize = rsize.length > 0;
        rtcpParameters.compound = rsize.length === 0;
        const mux = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-mux");
        rtcpParameters.mux = mux.length > 0;
        return rtcpParameters;
      };
      SDPUtils2.writeRtcpParameters = function(rtcpParameters) {
        let sdp2 = "";
        if (rtcpParameters.reducedSize) {
          sdp2 += "a=rtcp-rsize\r\n";
        }
        if (rtcpParameters.mux) {
          sdp2 += "a=rtcp-mux\r\n";
        }
        if (rtcpParameters.ssrc !== void 0 && rtcpParameters.cname) {
          sdp2 += "a=ssrc:" + rtcpParameters.ssrc + " cname:" + rtcpParameters.cname + "\r\n";
        }
        return sdp2;
      };
      SDPUtils2.parseMsid = function(mediaSection) {
        let parts;
        const spec = SDPUtils2.matchPrefix(mediaSection, "a=msid:");
        if (spec.length === 1) {
          parts = spec[0].substring(7).split(" ");
          return { stream: parts[0], track: parts[1] };
        }
        const planB = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((msidParts) => msidParts.attribute === "msid");
        if (planB.length > 0) {
          parts = planB[0].value.split(" ");
          return { stream: parts[0], track: parts[1] };
        }
      };
      SDPUtils2.parseSctpDescription = function(mediaSection) {
        const mline = SDPUtils2.parseMLine(mediaSection);
        const maxSizeLine = SDPUtils2.matchPrefix(mediaSection, "a=max-message-size:");
        let maxMessageSize;
        if (maxSizeLine.length > 0) {
          maxMessageSize = parseInt(maxSizeLine[0].substring(19), 10);
        }
        if (isNaN(maxMessageSize)) {
          maxMessageSize = 65536;
        }
        const sctpPort = SDPUtils2.matchPrefix(mediaSection, "a=sctp-port:");
        if (sctpPort.length > 0) {
          return {
            port: parseInt(sctpPort[0].substring(12), 10),
            protocol: mline.fmt,
            maxMessageSize
          };
        }
        const sctpMapLines = SDPUtils2.matchPrefix(mediaSection, "a=sctpmap:");
        if (sctpMapLines.length > 0) {
          const parts = sctpMapLines[0].substring(10).split(" ");
          return {
            port: parseInt(parts[0], 10),
            protocol: parts[1],
            maxMessageSize
          };
        }
      };
      SDPUtils2.writeSctpDescription = function(media, sctp) {
        let output = [];
        if (media.protocol !== "DTLS/SCTP") {
          output = [
            "m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n",
            "c=IN IP4 0.0.0.0\r\n",
            "a=sctp-port:" + sctp.port + "\r\n"
          ];
        } else {
          output = [
            "m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n",
            "c=IN IP4 0.0.0.0\r\n",
            "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"
          ];
        }
        if (sctp.maxMessageSize !== void 0) {
          output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
        }
        return output.join("");
      };
      SDPUtils2.generateSessionId = function() {
        return Math.random().toString().substr(2, 22);
      };
      SDPUtils2.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
        let sessionId;
        const version = sessVer !== void 0 ? sessVer : 2;
        if (sessId) {
          sessionId = sessId;
        } else {
          sessionId = SDPUtils2.generateSessionId();
        }
        const user = sessUser || "thisisadapterortc";
        return "v=0\r\no=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
      };
      SDPUtils2.getDirection = function(mediaSection, sessionpart) {
        const lines = SDPUtils2.splitLines(mediaSection);
        for (let i2 = 0; i2 < lines.length; i2++) {
          switch (lines[i2]) {
            case "a=sendrecv":
            case "a=sendonly":
            case "a=recvonly":
            case "a=inactive":
              return lines[i2].substring(2);
            default:
          }
        }
        if (sessionpart) {
          return SDPUtils2.getDirection(sessionpart);
        }
        return "sendrecv";
      };
      SDPUtils2.getKind = function(mediaSection) {
        const lines = SDPUtils2.splitLines(mediaSection);
        const mline = lines[0].split(" ");
        return mline[0].substring(2);
      };
      SDPUtils2.isRejected = function(mediaSection) {
        return mediaSection.split(" ", 2)[1] === "0";
      };
      SDPUtils2.parseMLine = function(mediaSection) {
        const lines = SDPUtils2.splitLines(mediaSection);
        const parts = lines[0].substring(2).split(" ");
        return {
          kind: parts[0],
          port: parseInt(parts[1], 10),
          protocol: parts[2],
          fmt: parts.slice(3).join(" ")
        };
      };
      SDPUtils2.parseOLine = function(mediaSection) {
        const line = SDPUtils2.matchPrefix(mediaSection, "o=")[0];
        const parts = line.substring(2).split(" ");
        return {
          username: parts[0],
          sessionId: parts[1],
          sessionVersion: parseInt(parts[2], 10),
          netType: parts[3],
          addressType: parts[4],
          address: parts[5]
        };
      };
      SDPUtils2.isValidSDP = function(blob) {
        if (typeof blob !== "string" || blob.length === 0) {
          return false;
        }
        const lines = SDPUtils2.splitLines(blob);
        for (let i2 = 0; i2 < lines.length; i2++) {
          if (lines[i2].length < 2 || lines[i2].charAt(1) !== "=") {
            return false;
          }
        }
        return true;
      };
      if (typeof module === "object") {
        module.exports = SDPUtils2;
      }
    }
  });

  // node_modules/eventemitter2/lib/eventemitter2.js
  var require_eventemitter2 = __commonJS({
    "node_modules/eventemitter2/lib/eventemitter2.js"(exports, module) {
      !(function(undefined2) {
        var hasOwnProperty = Object.hasOwnProperty;
        var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        };
        var defaultMaxListeners = 10;
        var nextTickSupported = typeof process == "object" && typeof process.nextTick == "function";
        var symbolsSupported = typeof Symbol === "function";
        var reflectSupported = typeof Reflect === "object";
        var setImmediateSupported = typeof setImmediate === "function";
        var _setImmediate = setImmediateSupported ? setImmediate : setTimeout;
        var ownKeys = symbolsSupported ? reflectSupported && typeof Reflect.ownKeys === "function" ? Reflect.ownKeys : function(obj) {
          var arr = Object.getOwnPropertyNames(obj);
          arr.push.apply(arr, Object.getOwnPropertySymbols(obj));
          return arr;
        } : Object.keys;
        function init() {
          this._events = {};
          if (this._conf) {
            configure.call(this, this._conf);
          }
        }
        function configure(conf) {
          if (conf) {
            this._conf = conf;
            conf.delimiter && (this.delimiter = conf.delimiter);
            if (conf.maxListeners !== undefined2) {
              this._maxListeners = conf.maxListeners;
            }
            conf.wildcard && (this.wildcard = conf.wildcard);
            conf.newListener && (this._newListener = conf.newListener);
            conf.removeListener && (this._removeListener = conf.removeListener);
            conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);
            conf.ignoreErrors && (this.ignoreErrors = conf.ignoreErrors);
            if (this.wildcard) {
              this.listenerTree = {};
            }
          }
        }
        function logPossibleMemoryLeak(count, eventName) {
          var errorMsg = "(node) warning: possible EventEmitter memory leak detected. " + count + " listeners added. Use emitter.setMaxListeners() to increase limit.";
          if (this.verboseMemoryLeak) {
            errorMsg += " Event name: " + eventName + ".";
          }
          if (typeof process !== "undefined" && process.emitWarning) {
            var e = new Error(errorMsg);
            e.name = "MaxListenersExceededWarning";
            e.emitter = this;
            e.count = count;
            process.emitWarning(e);
          } else {
            console.error(errorMsg);
            if (console.trace) {
              console.trace();
            }
          }
        }
        var toArray = function(a10, b3, c3) {
          var n2 = arguments.length;
          switch (n2) {
            case 0:
              return [];
            case 1:
              return [a10];
            case 2:
              return [a10, b3];
            case 3:
              return [a10, b3, c3];
            default:
              var arr = new Array(n2);
              while (n2--) {
                arr[n2] = arguments[n2];
              }
              return arr;
          }
        };
        function toObject(keys, values) {
          var obj = {};
          var key;
          var len = keys.length;
          var valuesCount = values ? values.length : 0;
          for (var i2 = 0; i2 < len; i2++) {
            key = keys[i2];
            obj[key] = i2 < valuesCount ? values[i2] : undefined2;
          }
          return obj;
        }
        function TargetObserver(emitter, target, options) {
          this._emitter = emitter;
          this._target = target;
          this._listeners = {};
          this._listenersCount = 0;
          var on3, off;
          if (options.on || options.off) {
            on3 = options.on;
            off = options.off;
          }
          if (target.addEventListener) {
            on3 = target.addEventListener;
            off = target.removeEventListener;
          } else if (target.addListener) {
            on3 = target.addListener;
            off = target.removeListener;
          } else if (target.on) {
            on3 = target.on;
            off = target.off;
          }
          if (!on3 && !off) {
            throw Error("target does not implement any known event API");
          }
          if (typeof on3 !== "function") {
            throw TypeError("on method must be a function");
          }
          if (typeof off !== "function") {
            throw TypeError("off method must be a function");
          }
          this._on = on3;
          this._off = off;
          var _observers = emitter._observers;
          if (_observers) {
            _observers.push(this);
          } else {
            emitter._observers = [this];
          }
        }
        Object.assign(TargetObserver.prototype, {
          subscribe: function(event, localEvent, reducer) {
            var observer = this;
            var target = this._target;
            var emitter = this._emitter;
            var listeners = this._listeners;
            var handler = function() {
              var args = toArray.apply(null, arguments);
              var eventObj = {
                data: args,
                name: localEvent,
                original: event
              };
              if (reducer) {
                var result = reducer.call(target, eventObj);
                if (result !== false) {
                  emitter.emit.apply(emitter, [eventObj.name].concat(args));
                }
                return;
              }
              emitter.emit.apply(emitter, [localEvent].concat(args));
            };
            if (listeners[event]) {
              throw Error("Event '" + event + "' is already listening");
            }
            this._listenersCount++;
            if (emitter._newListener && emitter._removeListener && !observer._onNewListener) {
              this._onNewListener = function(_event) {
                if (_event === localEvent && listeners[event] === null) {
                  listeners[event] = handler;
                  observer._on.call(target, event, handler);
                }
              };
              emitter.on("newListener", this._onNewListener);
              this._onRemoveListener = function(_event) {
                if (_event === localEvent && !emitter.hasListeners(_event) && listeners[event]) {
                  listeners[event] = null;
                  observer._off.call(target, event, handler);
                }
              };
              listeners[event] = null;
              emitter.on("removeListener", this._onRemoveListener);
            } else {
              listeners[event] = handler;
              observer._on.call(target, event, handler);
            }
          },
          unsubscribe: function(event) {
            var observer = this;
            var listeners = this._listeners;
            var emitter = this._emitter;
            var handler;
            var events;
            var off = this._off;
            var target = this._target;
            var i2;
            if (event && typeof event !== "string") {
              throw TypeError("event must be a string");
            }
            function clearRefs() {
              if (observer._onNewListener) {
                emitter.off("newListener", observer._onNewListener);
                emitter.off("removeListener", observer._onRemoveListener);
                observer._onNewListener = null;
                observer._onRemoveListener = null;
              }
              var index = findTargetIndex.call(emitter, observer);
              emitter._observers.splice(index, 1);
            }
            if (event) {
              handler = listeners[event];
              if (!handler) return;
              off.call(target, event, handler);
              delete listeners[event];
              if (!--this._listenersCount) {
                clearRefs();
              }
            } else {
              events = ownKeys(listeners);
              i2 = events.length;
              while (i2-- > 0) {
                event = events[i2];
                off.call(target, event, listeners[event]);
              }
              this._listeners = {};
              this._listenersCount = 0;
              clearRefs();
            }
          }
        });
        function resolveOptions(options, schema, reducers, allowUnknown) {
          var computedOptions = Object.assign({}, schema);
          if (!options) return computedOptions;
          if (typeof options !== "object") {
            throw TypeError("options must be an object");
          }
          var keys = Object.keys(options);
          var length = keys.length;
          var option, value;
          var reducer;
          function reject(reason) {
            throw Error('Invalid "' + option + '" option value' + (reason ? ". Reason: " + reason : ""));
          }
          for (var i2 = 0; i2 < length; i2++) {
            option = keys[i2];
            if (!allowUnknown && !hasOwnProperty.call(schema, option)) {
              throw Error('Unknown "' + option + '" option');
            }
            value = options[option];
            if (value !== undefined2) {
              reducer = reducers[option];
              computedOptions[option] = reducer ? reducer(value, reject) : value;
            }
          }
          return computedOptions;
        }
        function constructorReducer(value, reject) {
          if (typeof value !== "function" || !value.hasOwnProperty("prototype")) {
            reject("value must be a constructor");
          }
          return value;
        }
        function makeTypeReducer(types) {
          var message = "value must be type of " + types.join("|");
          var len = types.length;
          var firstType = types[0];
          var secondType = types[1];
          if (len === 1) {
            return function(v2, reject) {
              if (typeof v2 === firstType) {
                return v2;
              }
              reject(message);
            };
          }
          if (len === 2) {
            return function(v2, reject) {
              var kind = typeof v2;
              if (kind === firstType || kind === secondType) return v2;
              reject(message);
            };
          }
          return function(v2, reject) {
            var kind = typeof v2;
            var i2 = len;
            while (i2-- > 0) {
              if (kind === types[i2]) return v2;
            }
            reject(message);
          };
        }
        var functionReducer = makeTypeReducer(["function"]);
        var objectFunctionReducer = makeTypeReducer(["object", "function"]);
        function makeCancelablePromise(Promise2, executor, options) {
          var isCancelable;
          var callbacks;
          var timer = 0;
          var subscriptionClosed;
          var promise = new Promise2(function(resolve, reject, onCancel) {
            options = resolveOptions(options, {
              timeout: 0,
              overload: false
            }, {
              timeout: function(value, reject2) {
                value *= 1;
                if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
                  reject2("timeout must be a positive number");
                }
                return value;
              }
            });
            isCancelable = !options.overload && typeof Promise2.prototype.cancel === "function" && typeof onCancel === "function";
            function cleanup() {
              if (callbacks) {
                callbacks = null;
              }
              if (timer) {
                clearTimeout(timer);
                timer = 0;
              }
            }
            var _resolve = function(value) {
              cleanup();
              resolve(value);
            };
            var _reject = function(err) {
              cleanup();
              reject(err);
            };
            if (isCancelable) {
              executor(_resolve, _reject, onCancel);
            } else {
              callbacks = [function(reason) {
                _reject(reason || Error("canceled"));
              }];
              executor(_resolve, _reject, function(cb) {
                if (subscriptionClosed) {
                  throw Error("Unable to subscribe on cancel event asynchronously");
                }
                if (typeof cb !== "function") {
                  throw TypeError("onCancel callback must be a function");
                }
                callbacks.push(cb);
              });
              subscriptionClosed = true;
            }
            if (options.timeout > 0) {
              timer = setTimeout(function() {
                var reason = Error("timeout");
                reason.code = "ETIMEDOUT";
                timer = 0;
                promise.cancel(reason);
                reject(reason);
              }, options.timeout);
            }
          });
          if (!isCancelable) {
            promise.cancel = function(reason) {
              if (!callbacks) {
                return;
              }
              var length = callbacks.length;
              for (var i2 = 1; i2 < length; i2++) {
                callbacks[i2](reason);
              }
              callbacks[0](reason);
              callbacks = null;
            };
          }
          return promise;
        }
        function findTargetIndex(observer) {
          var observers = this._observers;
          if (!observers) {
            return -1;
          }
          var len = observers.length;
          for (var i2 = 0; i2 < len; i2++) {
            if (observers[i2]._target === observer) return i2;
          }
          return -1;
        }
        function searchListenerTree(handlers, type, tree, i2, typeLength) {
          if (!tree) {
            return null;
          }
          if (i2 === 0) {
            var kind = typeof type;
            if (kind === "string") {
              var ns2, n2, l3 = 0, j3 = 0, delimiter = this.delimiter, dl = delimiter.length;
              if ((n2 = type.indexOf(delimiter)) !== -1) {
                ns2 = new Array(5);
                do {
                  ns2[l3++] = type.slice(j3, n2);
                  j3 = n2 + dl;
                } while ((n2 = type.indexOf(delimiter, j3)) !== -1);
                ns2[l3++] = type.slice(j3);
                type = ns2;
                typeLength = l3;
              } else {
                type = [type];
                typeLength = 1;
              }
            } else if (kind === "object") {
              typeLength = type.length;
            } else {
              type = [type];
              typeLength = 1;
            }
          }
          var listeners = null, branch, xTree, xxTree, isolatedBranch, endReached, currentType = type[i2], nextType = type[i2 + 1], branches, _listeners;
          if (i2 === typeLength) {
            if (tree._listeners) {
              if (typeof tree._listeners === "function") {
                handlers && handlers.push(tree._listeners);
                listeners = [tree];
              } else {
                handlers && handlers.push.apply(handlers, tree._listeners);
                listeners = [tree];
              }
            }
          } else {
            if (currentType === "*") {
              branches = ownKeys(tree);
              n2 = branches.length;
              while (n2-- > 0) {
                branch = branches[n2];
                if (branch !== "_listeners") {
                  _listeners = searchListenerTree(handlers, type, tree[branch], i2 + 1, typeLength);
                  if (_listeners) {
                    if (listeners) {
                      listeners.push.apply(listeners, _listeners);
                    } else {
                      listeners = _listeners;
                    }
                  }
                }
              }
              return listeners;
            } else if (currentType === "**") {
              endReached = i2 + 1 === typeLength || i2 + 2 === typeLength && nextType === "*";
              if (endReached && tree._listeners) {
                listeners = searchListenerTree(handlers, type, tree, typeLength, typeLength);
              }
              branches = ownKeys(tree);
              n2 = branches.length;
              while (n2-- > 0) {
                branch = branches[n2];
                if (branch !== "_listeners") {
                  if (branch === "*" || branch === "**") {
                    if (tree[branch]._listeners && !endReached) {
                      _listeners = searchListenerTree(handlers, type, tree[branch], typeLength, typeLength);
                      if (_listeners) {
                        if (listeners) {
                          listeners.push.apply(listeners, _listeners);
                        } else {
                          listeners = _listeners;
                        }
                      }
                    }
                    _listeners = searchListenerTree(handlers, type, tree[branch], i2, typeLength);
                  } else if (branch === nextType) {
                    _listeners = searchListenerTree(handlers, type, tree[branch], i2 + 2, typeLength);
                  } else {
                    _listeners = searchListenerTree(handlers, type, tree[branch], i2, typeLength);
                  }
                  if (_listeners) {
                    if (listeners) {
                      listeners.push.apply(listeners, _listeners);
                    } else {
                      listeners = _listeners;
                    }
                  }
                }
              }
              return listeners;
            } else if (tree[currentType]) {
              listeners = searchListenerTree(handlers, type, tree[currentType], i2 + 1, typeLength);
            }
          }
          xTree = tree["*"];
          if (xTree) {
            searchListenerTree(handlers, type, xTree, i2 + 1, typeLength);
          }
          xxTree = tree["**"];
          if (xxTree) {
            if (i2 < typeLength) {
              if (xxTree._listeners) {
                searchListenerTree(handlers, type, xxTree, typeLength, typeLength);
              }
              branches = ownKeys(xxTree);
              n2 = branches.length;
              while (n2-- > 0) {
                branch = branches[n2];
                if (branch !== "_listeners") {
                  if (branch === nextType) {
                    searchListenerTree(handlers, type, xxTree[branch], i2 + 2, typeLength);
                  } else if (branch === currentType) {
                    searchListenerTree(handlers, type, xxTree[branch], i2 + 1, typeLength);
                  } else {
                    isolatedBranch = {};
                    isolatedBranch[branch] = xxTree[branch];
                    searchListenerTree(handlers, type, { "**": isolatedBranch }, i2 + 1, typeLength);
                  }
                }
              }
            } else if (xxTree._listeners) {
              searchListenerTree(handlers, type, xxTree, typeLength, typeLength);
            } else if (xxTree["*"] && xxTree["*"]._listeners) {
              searchListenerTree(handlers, type, xxTree["*"], typeLength, typeLength);
            }
          }
          return listeners;
        }
        function growListenerTree(type, listener, prepend) {
          var len = 0, j3 = 0, i2, delimiter = this.delimiter, dl = delimiter.length, ns2;
          if (typeof type === "string") {
            if ((i2 = type.indexOf(delimiter)) !== -1) {
              ns2 = new Array(5);
              do {
                ns2[len++] = type.slice(j3, i2);
                j3 = i2 + dl;
              } while ((i2 = type.indexOf(delimiter, j3)) !== -1);
              ns2[len++] = type.slice(j3);
            } else {
              ns2 = [type];
              len = 1;
            }
          } else {
            ns2 = type;
            len = type.length;
          }
          if (len > 1) {
            for (i2 = 0; i2 + 1 < len; i2++) {
              if (ns2[i2] === "**" && ns2[i2 + 1] === "**") {
                return;
              }
            }
          }
          var tree = this.listenerTree, name;
          for (i2 = 0; i2 < len; i2++) {
            name = ns2[i2];
            tree = tree[name] || (tree[name] = {});
            if (i2 === len - 1) {
              if (!tree._listeners) {
                tree._listeners = listener;
              } else {
                if (typeof tree._listeners === "function") {
                  tree._listeners = [tree._listeners];
                }
                if (prepend) {
                  tree._listeners.unshift(listener);
                } else {
                  tree._listeners.push(listener);
                }
                if (!tree._listeners.warned && this._maxListeners > 0 && tree._listeners.length > this._maxListeners) {
                  tree._listeners.warned = true;
                  logPossibleMemoryLeak.call(this, tree._listeners.length, name);
                }
              }
              return true;
            }
          }
          return true;
        }
        function collectTreeEvents(tree, events, root, asArray) {
          var branches = ownKeys(tree);
          var i2 = branches.length;
          var branch, branchName, path;
          var hasListeners = tree["_listeners"];
          var isArrayPath;
          while (i2-- > 0) {
            branchName = branches[i2];
            branch = tree[branchName];
            if (branchName === "_listeners") {
              path = root;
            } else {
              path = root ? root.concat(branchName) : [branchName];
            }
            isArrayPath = asArray || typeof branchName === "symbol";
            hasListeners && events.push(isArrayPath ? path : path.join(this.delimiter));
            if (typeof branch === "object") {
              collectTreeEvents.call(this, branch, events, path, isArrayPath);
            }
          }
          return events;
        }
        function recursivelyGarbageCollect(root) {
          var keys = ownKeys(root);
          var i2 = keys.length;
          var obj, key, flag;
          while (i2-- > 0) {
            key = keys[i2];
            obj = root[key];
            if (obj) {
              flag = true;
              if (key !== "_listeners" && !recursivelyGarbageCollect(obj)) {
                delete root[key];
              }
            }
          }
          return flag;
        }
        function Listener(emitter, event, listener) {
          this.emitter = emitter;
          this.event = event;
          this.listener = listener;
        }
        Listener.prototype.off = function() {
          this.emitter.off(this.event, this.listener);
          return this;
        };
        function setupListener(event, listener, options) {
          if (options === true) {
            promisify = true;
          } else if (options === false) {
            async = true;
          } else {
            if (!options || typeof options !== "object") {
              throw TypeError("options should be an object or true");
            }
            var async = options.async;
            var promisify = options.promisify;
            var nextTick = options.nextTick;
            var objectify = options.objectify;
          }
          if (async || nextTick || promisify) {
            var _listener = listener;
            var _origin = listener._origin || listener;
            if (nextTick && !nextTickSupported) {
              throw Error("process.nextTick is not supported");
            }
            if (promisify === undefined2) {
              promisify = listener.constructor.name === "AsyncFunction";
            }
            listener = function() {
              var args = arguments;
              var context = this;
              var event2 = this.event;
              return promisify ? nextTick ? Promise.resolve() : new Promise(function(resolve) {
                _setImmediate(resolve);
              }).then(function() {
                context.event = event2;
                return _listener.apply(context, args);
              }) : (nextTick ? process.nextTick : _setImmediate)(function() {
                context.event = event2;
                _listener.apply(context, args);
              });
            };
            listener._async = true;
            listener._origin = _origin;
          }
          return [listener, objectify ? new Listener(this, event, listener) : this];
        }
        function EventEmitter(conf) {
          this._events = {};
          this._newListener = false;
          this._removeListener = false;
          this.verboseMemoryLeak = false;
          configure.call(this, conf);
        }
        EventEmitter.EventEmitter2 = EventEmitter;
        EventEmitter.prototype.listenTo = function(target, events, options) {
          if (typeof target !== "object") {
            throw TypeError("target musts be an object");
          }
          var emitter = this;
          options = resolveOptions(options, {
            on: undefined2,
            off: undefined2,
            reducers: undefined2
          }, {
            on: functionReducer,
            off: functionReducer,
            reducers: objectFunctionReducer
          });
          function listen(events2) {
            if (typeof events2 !== "object") {
              throw TypeError("events must be an object");
            }
            var reducers = options.reducers;
            var index = findTargetIndex.call(emitter, target);
            var observer;
            if (index === -1) {
              observer = new TargetObserver(emitter, target, options);
            } else {
              observer = emitter._observers[index];
            }
            var keys = ownKeys(events2);
            var len = keys.length;
            var event;
            var isSingleReducer = typeof reducers === "function";
            for (var i2 = 0; i2 < len; i2++) {
              event = keys[i2];
              observer.subscribe(
                event,
                events2[event] || event,
                isSingleReducer ? reducers : reducers && reducers[event]
              );
            }
          }
          isArray(events) ? listen(toObject(events)) : typeof events === "string" ? listen(toObject(events.split(/\s+/))) : listen(events);
          return this;
        };
        EventEmitter.prototype.stopListeningTo = function(target, event) {
          var observers = this._observers;
          if (!observers) {
            return false;
          }
          var i2 = observers.length;
          var observer;
          var matched = false;
          if (target && typeof target !== "object") {
            throw TypeError("target should be an object");
          }
          while (i2-- > 0) {
            observer = observers[i2];
            if (!target || observer._target === target) {
              observer.unsubscribe(event);
              matched = true;
            }
          }
          return matched;
        };
        EventEmitter.prototype.delimiter = ".";
        EventEmitter.prototype.setMaxListeners = function(n2) {
          if (n2 !== undefined2) {
            this._maxListeners = n2;
            if (!this._conf) this._conf = {};
            this._conf.maxListeners = n2;
          }
        };
        EventEmitter.prototype.getMaxListeners = function() {
          return this._maxListeners;
        };
        EventEmitter.prototype.event = "";
        EventEmitter.prototype.once = function(event, fn2, options) {
          return this._once(event, fn2, false, options);
        };
        EventEmitter.prototype.prependOnceListener = function(event, fn2, options) {
          return this._once(event, fn2, true, options);
        };
        EventEmitter.prototype._once = function(event, fn2, prepend, options) {
          return this._many(event, 1, fn2, prepend, options);
        };
        EventEmitter.prototype.many = function(event, ttl, fn2, options) {
          return this._many(event, ttl, fn2, false, options);
        };
        EventEmitter.prototype.prependMany = function(event, ttl, fn2, options) {
          return this._many(event, ttl, fn2, true, options);
        };
        EventEmitter.prototype._many = function(event, ttl, fn2, prepend, options) {
          var self2 = this;
          if (typeof fn2 !== "function") {
            throw new Error("many only accepts instances of Function");
          }
          function listener() {
            if (--ttl === 0) {
              self2.off(event, listener);
            }
            return fn2.apply(this, arguments);
          }
          listener._origin = fn2;
          return this._on(event, listener, prepend, options);
        };
        EventEmitter.prototype.emit = function() {
          if (!this._events && !this._all) {
            return false;
          }
          this._events || init.call(this);
          var type = arguments[0], ns2, wildcard = this.wildcard;
          var args, l3, i2, j3, containsSymbol;
          if (type === "newListener" && !this._newListener) {
            if (!this._events.newListener) {
              return false;
            }
          }
          if (wildcard) {
            ns2 = type;
            if (type !== "newListener" && type !== "removeListener") {
              if (typeof type === "object") {
                l3 = type.length;
                if (symbolsSupported) {
                  for (i2 = 0; i2 < l3; i2++) {
                    if (typeof type[i2] === "symbol") {
                      containsSymbol = true;
                      break;
                    }
                  }
                }
                if (!containsSymbol) {
                  type = type.join(this.delimiter);
                }
              }
            }
          }
          var al = arguments.length;
          var handler;
          if (this._all && this._all.length) {
            handler = this._all.slice();
            for (i2 = 0, l3 = handler.length; i2 < l3; i2++) {
              this.event = type;
              switch (al) {
                case 1:
                  handler[i2].call(this, type);
                  break;
                case 2:
                  handler[i2].call(this, type, arguments[1]);
                  break;
                case 3:
                  handler[i2].call(this, type, arguments[1], arguments[2]);
                  break;
                default:
                  handler[i2].apply(this, arguments);
              }
            }
          }
          if (wildcard) {
            handler = [];
            searchListenerTree.call(this, handler, ns2, this.listenerTree, 0, l3);
          } else {
            handler = this._events[type];
            if (typeof handler === "function") {
              this.event = type;
              switch (al) {
                case 1:
                  handler.call(this);
                  break;
                case 2:
                  handler.call(this, arguments[1]);
                  break;
                case 3:
                  handler.call(this, arguments[1], arguments[2]);
                  break;
                default:
                  args = new Array(al - 1);
                  for (j3 = 1; j3 < al; j3++) args[j3 - 1] = arguments[j3];
                  handler.apply(this, args);
              }
              return true;
            } else if (handler) {
              handler = handler.slice();
            }
          }
          if (handler && handler.length) {
            if (al > 3) {
              args = new Array(al - 1);
              for (j3 = 1; j3 < al; j3++) args[j3 - 1] = arguments[j3];
            }
            for (i2 = 0, l3 = handler.length; i2 < l3; i2++) {
              this.event = type;
              switch (al) {
                case 1:
                  handler[i2].call(this);
                  break;
                case 2:
                  handler[i2].call(this, arguments[1]);
                  break;
                case 3:
                  handler[i2].call(this, arguments[1], arguments[2]);
                  break;
                default:
                  handler[i2].apply(this, args);
              }
            }
            return true;
          } else if (!this.ignoreErrors && !this._all && type === "error") {
            if (arguments[1] instanceof Error) {
              throw arguments[1];
            } else {
              throw new Error("Uncaught, unspecified 'error' event.");
            }
          }
          return !!this._all;
        };
        EventEmitter.prototype.emitAsync = function() {
          if (!this._events && !this._all) {
            return false;
          }
          this._events || init.call(this);
          var type = arguments[0], wildcard = this.wildcard, ns2, containsSymbol;
          var args, l3, i2, j3;
          if (type === "newListener" && !this._newListener) {
            if (!this._events.newListener) {
              return Promise.resolve([false]);
            }
          }
          if (wildcard) {
            ns2 = type;
            if (type !== "newListener" && type !== "removeListener") {
              if (typeof type === "object") {
                l3 = type.length;
                if (symbolsSupported) {
                  for (i2 = 0; i2 < l3; i2++) {
                    if (typeof type[i2] === "symbol") {
                      containsSymbol = true;
                      break;
                    }
                  }
                }
                if (!containsSymbol) {
                  type = type.join(this.delimiter);
                }
              }
            }
          }
          var promises = [];
          var al = arguments.length;
          var handler;
          if (this._all) {
            for (i2 = 0, l3 = this._all.length; i2 < l3; i2++) {
              this.event = type;
              switch (al) {
                case 1:
                  promises.push(this._all[i2].call(this, type));
                  break;
                case 2:
                  promises.push(this._all[i2].call(this, type, arguments[1]));
                  break;
                case 3:
                  promises.push(this._all[i2].call(this, type, arguments[1], arguments[2]));
                  break;
                default:
                  promises.push(this._all[i2].apply(this, arguments));
              }
            }
          }
          if (wildcard) {
            handler = [];
            searchListenerTree.call(this, handler, ns2, this.listenerTree, 0);
          } else {
            handler = this._events[type];
          }
          if (typeof handler === "function") {
            this.event = type;
            switch (al) {
              case 1:
                promises.push(handler.call(this));
                break;
              case 2:
                promises.push(handler.call(this, arguments[1]));
                break;
              case 3:
                promises.push(handler.call(this, arguments[1], arguments[2]));
                break;
              default:
                args = new Array(al - 1);
                for (j3 = 1; j3 < al; j3++) args[j3 - 1] = arguments[j3];
                promises.push(handler.apply(this, args));
            }
          } else if (handler && handler.length) {
            handler = handler.slice();
            if (al > 3) {
              args = new Array(al - 1);
              for (j3 = 1; j3 < al; j3++) args[j3 - 1] = arguments[j3];
            }
            for (i2 = 0, l3 = handler.length; i2 < l3; i2++) {
              this.event = type;
              switch (al) {
                case 1:
                  promises.push(handler[i2].call(this));
                  break;
                case 2:
                  promises.push(handler[i2].call(this, arguments[1]));
                  break;
                case 3:
                  promises.push(handler[i2].call(this, arguments[1], arguments[2]));
                  break;
                default:
                  promises.push(handler[i2].apply(this, args));
              }
            }
          } else if (!this.ignoreErrors && !this._all && type === "error") {
            if (arguments[1] instanceof Error) {
              return Promise.reject(arguments[1]);
            } else {
              return Promise.reject("Uncaught, unspecified 'error' event.");
            }
          }
          return Promise.all(promises);
        };
        EventEmitter.prototype.on = function(type, listener, options) {
          return this._on(type, listener, false, options);
        };
        EventEmitter.prototype.prependListener = function(type, listener, options) {
          return this._on(type, listener, true, options);
        };
        EventEmitter.prototype.onAny = function(fn2) {
          return this._onAny(fn2, false);
        };
        EventEmitter.prototype.prependAny = function(fn2) {
          return this._onAny(fn2, true);
        };
        EventEmitter.prototype.addListener = EventEmitter.prototype.on;
        EventEmitter.prototype._onAny = function(fn2, prepend) {
          if (typeof fn2 !== "function") {
            throw new Error("onAny only accepts instances of Function");
          }
          if (!this._all) {
            this._all = [];
          }
          if (prepend) {
            this._all.unshift(fn2);
          } else {
            this._all.push(fn2);
          }
          return this;
        };
        EventEmitter.prototype._on = function(type, listener, prepend, options) {
          if (typeof type === "function") {
            this._onAny(type, listener);
            return this;
          }
          if (typeof listener !== "function") {
            throw new Error("on only accepts instances of Function");
          }
          this._events || init.call(this);
          var returnValue = this, temp;
          if (options !== undefined2) {
            temp = setupListener.call(this, type, listener, options);
            listener = temp[0];
            returnValue = temp[1];
          }
          if (this._newListener) {
            this.emit("newListener", type, listener);
          }
          if (this.wildcard) {
            growListenerTree.call(this, type, listener, prepend);
            return returnValue;
          }
          if (!this._events[type]) {
            this._events[type] = listener;
          } else {
            if (typeof this._events[type] === "function") {
              this._events[type] = [this._events[type]];
            }
            if (prepend) {
              this._events[type].unshift(listener);
            } else {
              this._events[type].push(listener);
            }
            if (!this._events[type].warned && this._maxListeners > 0 && this._events[type].length > this._maxListeners) {
              this._events[type].warned = true;
              logPossibleMemoryLeak.call(this, this._events[type].length, type);
            }
          }
          return returnValue;
        };
        EventEmitter.prototype.off = function(type, listener) {
          if (typeof listener !== "function") {
            throw new Error("removeListener only takes instances of Function");
          }
          var handlers, leafs = [];
          if (this.wildcard) {
            var ns2 = typeof type === "string" ? type.split(this.delimiter) : type.slice();
            leafs = searchListenerTree.call(this, null, ns2, this.listenerTree, 0);
            if (!leafs) return this;
          } else {
            if (!this._events[type]) return this;
            handlers = this._events[type];
            leafs.push({ _listeners: handlers });
          }
          for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
            var leaf = leafs[iLeaf];
            handlers = leaf._listeners;
            if (isArray(handlers)) {
              var position = -1;
              for (var i2 = 0, length = handlers.length; i2 < length; i2++) {
                if (handlers[i2] === listener || handlers[i2].listener && handlers[i2].listener === listener || handlers[i2]._origin && handlers[i2]._origin === listener) {
                  position = i2;
                  break;
                }
              }
              if (position < 0) {
                continue;
              }
              if (this.wildcard) {
                leaf._listeners.splice(position, 1);
              } else {
                this._events[type].splice(position, 1);
              }
              if (handlers.length === 0) {
                if (this.wildcard) {
                  delete leaf._listeners;
                } else {
                  delete this._events[type];
                }
              }
              if (this._removeListener)
                this.emit("removeListener", type, listener);
              return this;
            } else if (handlers === listener || handlers.listener && handlers.listener === listener || handlers._origin && handlers._origin === listener) {
              if (this.wildcard) {
                delete leaf._listeners;
              } else {
                delete this._events[type];
              }
              if (this._removeListener)
                this.emit("removeListener", type, listener);
            }
          }
          this.listenerTree && recursivelyGarbageCollect(this.listenerTree);
          return this;
        };
        EventEmitter.prototype.offAny = function(fn2) {
          var i2 = 0, l3 = 0, fns;
          if (fn2 && this._all && this._all.length > 0) {
            fns = this._all;
            for (i2 = 0, l3 = fns.length; i2 < l3; i2++) {
              if (fn2 === fns[i2]) {
                fns.splice(i2, 1);
                if (this._removeListener)
                  this.emit("removeListenerAny", fn2);
                return this;
              }
            }
          } else {
            fns = this._all;
            if (this._removeListener) {
              for (i2 = 0, l3 = fns.length; i2 < l3; i2++)
                this.emit("removeListenerAny", fns[i2]);
            }
            this._all = [];
          }
          return this;
        };
        EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
        EventEmitter.prototype.removeAllListeners = function(type) {
          if (type === undefined2) {
            !this._events || init.call(this);
            return this;
          }
          if (this.wildcard) {
            var leafs = searchListenerTree.call(this, null, type, this.listenerTree, 0), leaf, i2;
            if (!leafs) return this;
            for (i2 = 0; i2 < leafs.length; i2++) {
              leaf = leafs[i2];
              leaf._listeners = null;
            }
            this.listenerTree && recursivelyGarbageCollect(this.listenerTree);
          } else if (this._events) {
            this._events[type] = null;
          }
          return this;
        };
        EventEmitter.prototype.listeners = function(type) {
          var _events = this._events;
          var keys, listeners, allListeners;
          var i2;
          var listenerTree;
          if (type === undefined2) {
            if (this.wildcard) {
              throw Error("event name required for wildcard emitter");
            }
            if (!_events) {
              return [];
            }
            keys = ownKeys(_events);
            i2 = keys.length;
            allListeners = [];
            while (i2-- > 0) {
              listeners = _events[keys[i2]];
              if (typeof listeners === "function") {
                allListeners.push(listeners);
              } else {
                allListeners.push.apply(allListeners, listeners);
              }
            }
            return allListeners;
          } else {
            if (this.wildcard) {
              listenerTree = this.listenerTree;
              if (!listenerTree) return [];
              var handlers = [];
              var ns2 = typeof type === "string" ? type.split(this.delimiter) : type.slice();
              searchListenerTree.call(this, handlers, ns2, listenerTree, 0);
              return handlers;
            }
            if (!_events) {
              return [];
            }
            listeners = _events[type];
            if (!listeners) {
              return [];
            }
            return typeof listeners === "function" ? [listeners] : listeners;
          }
        };
        EventEmitter.prototype.eventNames = function(nsAsArray) {
          var _events = this._events;
          return this.wildcard ? collectTreeEvents.call(this, this.listenerTree, [], null, nsAsArray) : _events ? ownKeys(_events) : [];
        };
        EventEmitter.prototype.listenerCount = function(type) {
          return this.listeners(type).length;
        };
        EventEmitter.prototype.hasListeners = function(type) {
          if (this.wildcard) {
            var handlers = [];
            var ns2 = typeof type === "string" ? type.split(this.delimiter) : type.slice();
            searchListenerTree.call(this, handlers, ns2, this.listenerTree, 0);
            return handlers.length > 0;
          }
          var _events = this._events;
          var _all = this._all;
          return !!(_all && _all.length || _events && (type === undefined2 ? ownKeys(_events).length : _events[type]));
        };
        EventEmitter.prototype.listenersAny = function() {
          if (this._all) {
            return this._all;
          } else {
            return [];
          }
        };
        EventEmitter.prototype.waitFor = function(event, options) {
          var self2 = this;
          var type = typeof options;
          if (type === "number") {
            options = { timeout: options };
          } else if (type === "function") {
            options = { filter: options };
          }
          options = resolveOptions(options, {
            timeout: 0,
            filter: undefined2,
            handleError: false,
            Promise,
            overload: false
          }, {
            filter: functionReducer,
            Promise: constructorReducer
          });
          return makeCancelablePromise(options.Promise, function(resolve, reject, onCancel) {
            function listener() {
              var filter = options.filter;
              if (filter && !filter.apply(self2, arguments)) {
                return;
              }
              self2.off(event, listener);
              if (options.handleError) {
                var err = arguments[0];
                err ? reject(err) : resolve(toArray.apply(null, arguments).slice(1));
              } else {
                resolve(toArray.apply(null, arguments));
              }
            }
            onCancel(function() {
              self2.off(event, listener);
            });
            self2._on(event, listener, false);
          }, {
            timeout: options.timeout,
            overload: options.overload
          });
        };
        function once(emitter, name, options) {
          options = resolveOptions(options, {
            Promise,
            timeout: 0,
            overload: false
          }, {
            Promise: constructorReducer
          });
          var _Promise = options.Promise;
          return makeCancelablePromise(_Promise, function(resolve, reject, onCancel) {
            var handler;
            if (typeof emitter.addEventListener === "function") {
              handler = function() {
                resolve(toArray.apply(null, arguments));
              };
              onCancel(function() {
                emitter.removeEventListener(name, handler);
              });
              emitter.addEventListener(
                name,
                handler,
                { once: true }
              );
              return;
            }
            var eventListener = function() {
              errorListener && emitter.removeListener("error", errorListener);
              resolve(toArray.apply(null, arguments));
            };
            var errorListener;
            if (name !== "error") {
              errorListener = function(err) {
                emitter.removeListener(name, eventListener);
                reject(err);
              };
              emitter.once("error", errorListener);
            }
            onCancel(function() {
              errorListener && emitter.removeListener("error", errorListener);
              emitter.removeListener(name, eventListener);
            });
            emitter.once(name, eventListener);
          }, {
            timeout: options.timeout,
            overload: options.overload
          });
        }
        var prototype = EventEmitter.prototype;
        Object.defineProperties(EventEmitter, {
          defaultMaxListeners: {
            get: function() {
              return prototype._maxListeners;
            },
            set: function(n2) {
              if (typeof n2 !== "number" || n2 < 0 || Number.isNaN(n2)) {
                throw TypeError("n must be a non-negative number");
              }
              prototype._maxListeners = n2;
            },
            enumerable: true
          },
          once: {
            value: once,
            writable: true,
            configurable: true
          }
        });
        Object.defineProperties(prototype, {
          _maxListeners: {
            value: defaultMaxListeners,
            writable: true,
            configurable: true
          },
          _observers: { value: null, writable: true, configurable: true }
        });
        if (typeof define === "function" && define.amd) {
          define(function() {
            return EventEmitter;
          });
        } else if (typeof exports === "object") {
          module.exports = EventEmitter;
        } else {
          var _global = new Function("", "return this")();
          _global.EventEmitter2 = EventEmitter;
        }
      })();
    }
  });

  // node_modules/sdp-transform/lib/grammar.js
  var require_grammar = __commonJS({
    "node_modules/sdp-transform/lib/grammar.js"(exports, module) {
      var grammar = module.exports = {
        v: [{
          name: "version",
          reg: /^(\d*)$/
        }],
        o: [{
          // o=- 20518 0 IN IP4 203.0.113.1
          // NB: sessionId will be a String in most cases because it is huge
          name: "origin",
          reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
          names: ["username", "sessionId", "sessionVersion", "netType", "ipVer", "address"],
          format: "%s %s %d %s IP%d %s"
        }],
        // default parsing of these only (though some of these feel outdated)
        s: [{ name: "name" }],
        i: [{ name: "description" }],
        u: [{ name: "uri" }],
        e: [{ name: "email" }],
        p: [{ name: "phone" }],
        z: [{ name: "timezones" }],
        // TODO: this one can actually be parsed properly...
        r: [{ name: "repeats" }],
        // TODO: this one can also be parsed properly
        // k: [{}], // outdated thing ignored
        t: [{
          // t=0 0
          name: "timing",
          reg: /^(\d*) (\d*)/,
          names: ["start", "stop"],
          format: "%d %d"
        }],
        c: [{
          // c=IN IP4 10.47.197.26
          name: "connection",
          reg: /^IN IP(\d) (\S*)/,
          names: ["version", "ip"],
          format: "IN IP%d %s"
        }],
        b: [{
          // b=AS:4000
          push: "bandwidth",
          reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
          names: ["type", "limit"],
          format: "%s:%s"
        }],
        m: [{
          // m=video 51744 RTP/AVP 126 97 98 34 31
          // NB: special - pushes to session
          // TODO: rtp/fmtp should be filtered by the payloads found here?
          reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
          names: ["type", "port", "protocol", "payloads"],
          format: "%s %d %s %s"
        }],
        a: [
          {
            // a=rtpmap:110 opus/48000/2
            push: "rtp",
            reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
            names: ["payload", "codec", "rate", "encoding"],
            format: function(o2) {
              return o2.encoding ? "rtpmap:%d %s/%s/%s" : o2.rate ? "rtpmap:%d %s/%s" : "rtpmap:%d %s";
            }
          },
          {
            // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
            // a=fmtp:111 minptime=10; useinbandfec=1
            push: "fmtp",
            reg: /^fmtp:(\d*) ([\S| ]*)/,
            names: ["payload", "config"],
            format: "fmtp:%d %s"
          },
          {
            // a=control:streamid=0
            name: "control",
            reg: /^control:(.*)/,
            format: "control:%s"
          },
          {
            // a=rtcp:65179 IN IP4 193.84.77.194
            name: "rtcp",
            reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
            names: ["port", "netType", "ipVer", "address"],
            format: function(o2) {
              return o2.address != null ? "rtcp:%d %s IP%d %s" : "rtcp:%d";
            }
          },
          {
            // a=rtcp-fb:98 trr-int 100
            push: "rtcpFbTrrInt",
            reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
            names: ["payload", "value"],
            format: "rtcp-fb:%s trr-int %d"
          },
          {
            // a=rtcp-fb:98 nack rpsi
            push: "rtcpFb",
            reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
            names: ["payload", "type", "subtype"],
            format: function(o2) {
              return o2.subtype != null ? "rtcp-fb:%s %s %s" : "rtcp-fb:%s %s";
            }
          },
          {
            // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
            // a=extmap:1/recvonly URI-gps-string
            // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
            push: "ext",
            reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
            names: ["value", "direction", "encrypt-uri", "uri", "config"],
            format: function(o2) {
              return "extmap:%d" + (o2.direction ? "/%s" : "%v") + (o2["encrypt-uri"] ? " %s" : "%v") + " %s" + (o2.config ? " %s" : "");
            }
          },
          {
            // a=extmap-allow-mixed
            name: "extmapAllowMixed",
            reg: /^(extmap-allow-mixed)/
          },
          {
            // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
            push: "crypto",
            reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
            names: ["id", "suite", "config", "sessionConfig"],
            format: function(o2) {
              return o2.sessionConfig != null ? "crypto:%d %s %s %s" : "crypto:%d %s %s";
            }
          },
          {
            // a=setup:actpass
            name: "setup",
            reg: /^setup:(\w*)/,
            format: "setup:%s"
          },
          {
            // a=connection:new
            name: "connectionType",
            reg: /^connection:(new|existing)/,
            format: "connection:%s"
          },
          {
            // a=mid:1
            name: "mid",
            reg: /^mid:([^\s]*)/,
            format: "mid:%s"
          },
          {
            // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
            name: "msid",
            reg: /^msid:(.*)/,
            format: "msid:%s"
          },
          {
            // a=ptime:20
            name: "ptime",
            reg: /^ptime:(\d*(?:\.\d*)*)/,
            format: "ptime:%d"
          },
          {
            // a=maxptime:60
            name: "maxptime",
            reg: /^maxptime:(\d*(?:\.\d*)*)/,
            format: "maxptime:%d"
          },
          {
            // a=sendrecv
            name: "direction",
            reg: /^(sendrecv|recvonly|sendonly|inactive)/
          },
          {
            // a=ice-lite
            name: "icelite",
            reg: /^(ice-lite)/
          },
          {
            // a=ice-ufrag:F7gI
            name: "iceUfrag",
            reg: /^ice-ufrag:(\S*)/,
            format: "ice-ufrag:%s"
          },
          {
            // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
            name: "icePwd",
            reg: /^ice-pwd:(\S*)/,
            format: "ice-pwd:%s"
          },
          {
            // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
            name: "fingerprint",
            reg: /^fingerprint:(\S*) (\S*)/,
            names: ["type", "hash"],
            format: "fingerprint:%s %s"
          },
          {
            // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
            // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
            // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
            push: "candidates",
            reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
            names: ["foundation", "component", "transport", "priority", "ip", "port", "type", "raddr", "rport", "tcptype", "generation", "network-id", "network-cost"],
            format: function(o2) {
              var str = "candidate:%s %d %s %d %s %d typ %s";
              str += o2.raddr != null ? " raddr %s rport %d" : "%v%v";
              str += o2.tcptype != null ? " tcptype %s" : "%v";
              if (o2.generation != null) {
                str += " generation %d";
              }
              str += o2["network-id"] != null ? " network-id %d" : "%v";
              str += o2["network-cost"] != null ? " network-cost %d" : "%v";
              return str;
            }
          },
          {
            // a=end-of-candidates (keep after the candidates line for readability)
            name: "endOfCandidates",
            reg: /^(end-of-candidates)/
          },
          {
            // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
            name: "remoteCandidates",
            reg: /^remote-candidates:(.*)/,
            format: "remote-candidates:%s"
          },
          {
            // a=ice-options:google-ice
            name: "iceOptions",
            reg: /^ice-options:(\S*)/,
            format: "ice-options:%s"
          },
          {
            // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
            push: "ssrcs",
            reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
            names: ["id", "attribute", "value"],
            format: function(o2) {
              var str = "ssrc:%d";
              if (o2.attribute != null) {
                str += " %s";
                if (o2.value != null) {
                  str += ":%s";
                }
              }
              return str;
            }
          },
          {
            // a=ssrc-group:FEC 1 2
            // a=ssrc-group:FEC-FR 3004364195 1080772241
            push: "ssrcGroups",
            // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
            reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
            names: ["semantics", "ssrcs"],
            format: "ssrc-group:%s %s"
          },
          {
            // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
            name: "msidSemantic",
            reg: /^msid-semantic:\s?(\w*) (\S*)/,
            names: ["semantic", "token"],
            format: "msid-semantic: %s %s"
            // space after ':' is not accidental
          },
          {
            // a=group:BUNDLE audio video
            push: "groups",
            reg: /^group:(\w*) (.*)/,
            names: ["type", "mids"],
            format: "group:%s %s"
          },
          {
            // a=rtcp-mux
            name: "rtcpMux",
            reg: /^(rtcp-mux)/
          },
          {
            // a=rtcp-rsize
            name: "rtcpRsize",
            reg: /^(rtcp-rsize)/
          },
          {
            // a=sctpmap:5000 webrtc-datachannel 1024
            name: "sctpmap",
            reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
            names: ["sctpmapNumber", "app", "maxMessageSize"],
            format: function(o2) {
              return o2.maxMessageSize != null ? "sctpmap:%s %s %s" : "sctpmap:%s %s";
            }
          },
          {
            // a=x-google-flag:conference
            name: "xGoogleFlag",
            reg: /^x-google-flag:([^\s]*)/,
            format: "x-google-flag:%s"
          },
          {
            // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
            push: "rids",
            reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
            names: ["id", "direction", "params"],
            format: function(o2) {
              return o2.params ? "rid:%s %s %s" : "rid:%s %s";
            }
          },
          {
            // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
            // a=imageattr:* send [x=800,y=640] recv *
            // a=imageattr:100 recv [x=320,y=240]
            push: "imageattrs",
            reg: new RegExp(
              // a=imageattr:97
              "^imageattr:(\\d+|\\*)[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?"
            ),
            names: ["pt", "dir1", "attrs1", "dir2", "attrs2"],
            format: function(o2) {
              return "imageattr:%s %s %s" + (o2.dir2 ? " %s %s" : "");
            }
          },
          {
            // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
            // a=simulcast:recv 1;4,5 send 6;7
            name: "simulcast",
            reg: new RegExp(
              // a=simulcast:
              "^simulcast:(send|recv) ([a-zA-Z0-9\\-_~;,]+)(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?$"
            ),
            names: ["dir1", "list1", "dir2", "list2"],
            format: function(o2) {
              return "simulcast:%s %s" + (o2.dir2 ? " %s %s" : "");
            }
          },
          {
            // old simulcast draft 03 (implemented by Firefox)
            //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
            // a=simulcast: recv pt=97;98 send pt=97
            // a=simulcast: send rid=5;6;7 paused=6,7
            name: "simulcast_03",
            reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
            names: ["value"],
            format: "simulcast: %s"
          },
          {
            // a=framerate:25
            // a=framerate:29.97
            name: "framerate",
            reg: /^framerate:(\d+(?:$|\.\d+))/,
            format: "framerate:%s"
          },
          {
            // RFC4570
            // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
            name: "sourceFilter",
            reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
            names: ["filterMode", "netType", "addressTypes", "destAddress", "srcList"],
            format: "source-filter: %s %s %s %s %s"
          },
          {
            // a=bundle-only
            name: "bundleOnly",
            reg: /^(bundle-only)/
          },
          {
            // a=label:1
            name: "label",
            reg: /^label:(.+)/,
            format: "label:%s"
          },
          {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
            name: "sctpPort",
            reg: /^sctp-port:(\d+)$/,
            format: "sctp-port:%s"
          },
          {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
            name: "maxMessageSize",
            reg: /^max-message-size:(\d+)$/,
            format: "max-message-size:%s"
          },
          {
            // RFC7273
            // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
            push: "tsRefClocks",
            reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
            names: ["clksrc", "clksrcExt"],
            format: function(o2) {
              return "ts-refclk:%s" + (o2.clksrcExt != null ? "=%s" : "");
            }
          },
          {
            // RFC7273
            // a=mediaclk:direct=963214424
            name: "mediaClk",
            reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
            names: ["id", "mediaClockName", "mediaClockValue", "rateNumerator", "rateDenominator"],
            format: function(o2) {
              var str = "mediaclk:";
              str += o2.id != null ? "id=%s %s" : "%v%s";
              str += o2.mediaClockValue != null ? "=%s" : "";
              str += o2.rateNumerator != null ? " rate=%s" : "";
              str += o2.rateDenominator != null ? "/%s" : "";
              return str;
            }
          },
          {
            // a=keywds:keywords
            name: "keywords",
            reg: /^keywds:(.+)$/,
            format: "keywds:%s"
          },
          {
            // a=content:main
            name: "content",
            reg: /^content:(.+)/,
            format: "content:%s"
          },
          // BFCP https://tools.ietf.org/html/rfc4583
          {
            // a=floorctrl:c-s
            name: "bfcpFloorCtrl",
            reg: /^floorctrl:(c-only|s-only|c-s)/,
            format: "floorctrl:%s"
          },
          {
            // a=confid:1
            name: "bfcpConfId",
            reg: /^confid:(\d+)/,
            format: "confid:%s"
          },
          {
            // a=userid:1
            name: "bfcpUserId",
            reg: /^userid:(\d+)/,
            format: "userid:%s"
          },
          {
            // a=floorid:1
            name: "bfcpFloorId",
            reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
            names: ["id", "mStream"],
            format: "floorid:%s mstrm:%s"
          },
          {
            // any a= that we don't understand is kept verbatim on media.invalid
            push: "invalid",
            names: ["value"]
          }
        ]
      };
      Object.keys(grammar).forEach(function(key) {
        var objs = grammar[key];
        objs.forEach(function(obj) {
          if (!obj.reg) {
            obj.reg = /(.*)/;
          }
          if (!obj.format) {
            obj.format = "%s";
          }
        });
      });
    }
  });

  // node_modules/sdp-transform/lib/parser.js
  var require_parser = __commonJS({
    "node_modules/sdp-transform/lib/parser.js"(exports) {
      var toIntIfInt = function(v2) {
        return String(Number(v2)) === v2 ? Number(v2) : v2;
      };
      var attachProperties = function(match, location, names, rawName) {
        if (rawName && !names) {
          location[rawName] = toIntIfInt(match[1]);
        } else {
          for (var i2 = 0; i2 < names.length; i2 += 1) {
            if (match[i2 + 1] != null) {
              location[names[i2]] = toIntIfInt(match[i2 + 1]);
            }
          }
        }
      };
      var parseReg = function(obj, location, content) {
        var needsBlank = obj.name && obj.names;
        if (obj.push && !location[obj.push]) {
          location[obj.push] = [];
        } else if (needsBlank && !location[obj.name]) {
          location[obj.name] = {};
        }
        var keyLocation = obj.push ? {} : (
          // blank object that will be pushed
          needsBlank ? location[obj.name] : location
        );
        attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);
        if (obj.push) {
          location[obj.push].push(keyLocation);
        }
      };
      var grammar = require_grammar();
      var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
      exports.parse = function(sdp2) {
        var session = {}, media = [], location = session;
        sdp2.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function(l3) {
          var type = l3[0];
          var content = l3.slice(2);
          if (type === "m") {
            media.push({ rtp: [], fmtp: [] });
            location = media[media.length - 1];
          }
          for (var j3 = 0; j3 < (grammar[type] || []).length; j3 += 1) {
            var obj = grammar[type][j3];
            if (obj.reg.test(content)) {
              return parseReg(obj, location, content);
            }
          }
        });
        session.media = media;
        return session;
      };
      var paramReducer = function(acc, expr) {
        var s2 = expr.split(/=(.+)/, 2);
        if (s2.length === 2) {
          acc[s2[0]] = toIntIfInt(s2[1]);
        } else if (s2.length === 1 && expr.length > 1) {
          acc[s2[0]] = void 0;
        }
        return acc;
      };
      exports.parseParams = function(str) {
        return str.split(/;\s?/).reduce(paramReducer, {});
      };
      exports.parseFmtpConfig = exports.parseParams;
      exports.parsePayloads = function(str) {
        return str.toString().split(" ").map(Number);
      };
      exports.parseRemoteCandidates = function(str) {
        var candidates = [];
        var parts = str.split(" ").map(toIntIfInt);
        for (var i2 = 0; i2 < parts.length; i2 += 3) {
          candidates.push({
            component: parts[i2],
            ip: parts[i2 + 1],
            port: parts[i2 + 2]
          });
        }
        return candidates;
      };
      exports.parseImageAttributes = function(str) {
        return str.split(" ").map(function(item) {
          return item.substring(1, item.length - 1).split(",").reduce(paramReducer, {});
        });
      };
      exports.parseSimulcastStreamList = function(str) {
        return str.split(";").map(function(stream) {
          return stream.split(",").map(function(format) {
            var scid, paused = false;
            if (format[0] !== "~") {
              scid = toIntIfInt(format);
            } else {
              scid = toIntIfInt(format.substring(1, format.length));
              paused = true;
            }
            return {
              scid,
              paused
            };
          });
        });
      };
    }
  });

  // node_modules/sdp-transform/lib/writer.js
  var require_writer = __commonJS({
    "node_modules/sdp-transform/lib/writer.js"(exports, module) {
      var grammar = require_grammar();
      var formatRegExp = /%[sdv%]/g;
      var format = function(formatStr) {
        var i2 = 1;
        var args = arguments;
        var len = args.length;
        return formatStr.replace(formatRegExp, function(x3) {
          if (i2 >= len) {
            return x3;
          }
          var arg = args[i2];
          i2 += 1;
          switch (x3) {
            case "%%":
              return "%";
            case "%s":
              return String(arg);
            case "%d":
              return Number(arg);
            case "%v":
              return "";
          }
        });
      };
      var makeLine = function(type, obj, location) {
        var str = obj.format instanceof Function ? obj.format(obj.push ? location : location[obj.name]) : obj.format;
        var args = [type + "=" + str];
        if (obj.names) {
          for (var i2 = 0; i2 < obj.names.length; i2 += 1) {
            var n2 = obj.names[i2];
            if (obj.name) {
              args.push(location[obj.name][n2]);
            } else {
              args.push(location[obj.names[i2]]);
            }
          }
        } else {
          args.push(location[obj.name]);
        }
        return format.apply(null, args);
      };
      var defaultOuterOrder = [
        "v",
        "o",
        "s",
        "i",
        "u",
        "e",
        "p",
        "c",
        "b",
        "t",
        "r",
        "z",
        "a"
      ];
      var defaultInnerOrder = ["i", "c", "b", "a"];
      module.exports = function(session, opts) {
        opts = opts || {};
        if (session.version == null) {
          session.version = 0;
        }
        if (session.name == null) {
          session.name = " ";
        }
        session.media.forEach(function(mLine) {
          if (mLine.payloads == null) {
            mLine.payloads = "";
          }
        });
        var outerOrder = opts.outerOrder || defaultOuterOrder;
        var innerOrder = opts.innerOrder || defaultInnerOrder;
        var sdp2 = [];
        outerOrder.forEach(function(type) {
          grammar[type].forEach(function(obj) {
            if (obj.name in session && session[obj.name] != null) {
              sdp2.push(makeLine(type, obj, session));
            } else if (obj.push in session && session[obj.push] != null) {
              session[obj.push].forEach(function(el) {
                sdp2.push(makeLine(type, obj, el));
              });
            }
          });
        });
        session.media.forEach(function(mLine) {
          sdp2.push(makeLine("m", grammar.m[0], mLine));
          innerOrder.forEach(function(type) {
            grammar[type].forEach(function(obj) {
              if (obj.name in mLine && mLine[obj.name] != null) {
                sdp2.push(makeLine(type, obj, mLine));
              } else if (obj.push in mLine && mLine[obj.push] != null) {
                mLine[obj.push].forEach(function(el) {
                  sdp2.push(makeLine(type, obj, el));
                });
              }
            });
          });
        });
        return sdp2.join("\r\n") + "\r\n";
      };
    }
  });

  // node_modules/sdp-transform/lib/index.js
  var require_lib = __commonJS({
    "node_modules/sdp-transform/lib/index.js"(exports) {
      var parser = require_parser();
      var writer = require_writer();
      var grammar = require_grammar();
      exports.grammar = grammar;
      exports.write = writer;
      exports.parse = parser.parse;
      exports.parseParams = parser.parseParams;
      exports.parseFmtpConfig = parser.parseFmtpConfig;
      exports.parsePayloads = parser.parsePayloads;
      exports.parseRemoteCandidates = parser.parseRemoteCandidates;
      exports.parseImageAttributes = parser.parseImageAttributes;
      exports.parseSimulcastStreamList = parser.parseSimulcastStreamList;
    }
  });

  // node_modules/reselect/es/index.js
  function defaultEqualityCheck(a10, b3) {
    return a10 === b3;
  }
  function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
      return false;
    }
    var length = prev.length;
    for (var i2 = 0; i2 < length; i2++) {
      if (!equalityCheck(prev[i2], next[i2])) {
        return false;
      }
    }
    return true;
  }
  function defaultMemoize(func) {
    var equalityCheck = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultEqualityCheck;
    var lastArgs = null;
    var lastResult = null;
    return function() {
      if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
        lastResult = func.apply(null, arguments);
      }
      lastArgs = arguments;
      return lastResult;
    };
  }
  function getDependencies(funcs) {
    var dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs;
    if (!dependencies.every(function(dep) {
      return typeof dep === "function";
    })) {
      var dependencyTypes = dependencies.map(function(dep) {
        return typeof dep;
      }).join(", ");
      throw new Error("Selector creators expect all input-selectors to be functions, " + ("instead received the following types: [" + dependencyTypes + "]"));
    }
    return dependencies;
  }
  function createSelectorCreator(memoize) {
    for (var _len = arguments.length, memoizeOptions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      memoizeOptions[_key - 1] = arguments[_key];
    }
    return function() {
      for (var _len2 = arguments.length, funcs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        funcs[_key2] = arguments[_key2];
      }
      var recomputations = 0;
      var resultFunc = funcs.pop();
      var dependencies = getDependencies(funcs);
      var memoizedResultFunc = memoize.apply(void 0, [function() {
        recomputations++;
        return resultFunc.apply(null, arguments);
      }].concat(memoizeOptions));
      var selector = memoize(function() {
        var params = [];
        var length = dependencies.length;
        for (var i2 = 0; i2 < length; i2++) {
          params.push(dependencies[i2].apply(null, arguments));
        }
        return memoizedResultFunc.apply(null, params);
      });
      selector.resultFunc = resultFunc;
      selector.dependencies = dependencies;
      selector.recomputations = function() {
        return recomputations;
      };
      selector.resetRecomputations = function() {
        return recomputations = 0;
      };
      return selector;
    };
  }
  var createSelector = createSelectorCreator(defaultMemoize);

  // node_modules/@100mslive/hms-video-store/dist/index.js
  var import_ua_parser_js = __toESM(require_ua_parser());

  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== "undefined" && typeof msCrypto.getRandomValues === "function" && msCrypto.getRandomValues.bind(msCrypto);
      if (!getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/regex.js
  var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

  // node_modules/uuid/dist/esm-browser/validate.js
  function validate(uuid) {
    return typeof uuid === "string" && regex_default.test(uuid);
  }
  var validate_default = validate;

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (i2 = 0; i2 < 256; ++i2) {
    byteToHex.push((i2 + 256).toString(16).substr(1));
  }
  var i2;
  function stringify(arr) {
    var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    if (!validate_default(uuid)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
  }
  var stringify_default = stringify;

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    options = options || {};
    var rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (var i2 = 0; i2 < 16; ++i2) {
        buf[offset + i2] = rnds[i2];
      }
      return buf;
    }
    return stringify_default(rnds);
  }
  var v4_default = v4;

  // node_modules/@100mslive/hms-video-store/dist/index.js
  var import_lodash = __toESM(require_lodash());

  // node_modules/webrtc-adapter/src/js/utils.js
  var logDisabled_ = true;
  var deprecationWarnings_ = true;
  function extractVersion(uastring, expr, pos) {
    const match = uastring.match(expr);
    return match && match.length >= pos && parseFloat(match[pos], 10);
  }
  function wrapPeerConnectionEvent(window2, eventNameToWrap, wrapper) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    const proto = window2.RTCPeerConnection.prototype;
    const nativeAddEventListener = proto.addEventListener;
    proto.addEventListener = function(nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap) {
        return nativeAddEventListener.apply(this, arguments);
      }
      const wrappedCallback = (e) => {
        const modifiedEvent = wrapper(e);
        if (modifiedEvent) {
          if (cb.handleEvent) {
            cb.handleEvent(modifiedEvent);
          } else {
            cb(modifiedEvent);
          }
        }
      };
      this._eventMap = this._eventMap || {};
      if (!this._eventMap[eventNameToWrap]) {
        this._eventMap[eventNameToWrap] = /* @__PURE__ */ new Map();
      }
      this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
      return nativeAddEventListener.apply(this, [
        nativeEventName,
        wrappedCallback
      ]);
    };
    const nativeRemoveEventListener = proto.removeEventListener;
    proto.removeEventListener = function(nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) {
        return nativeRemoveEventListener.apply(this, arguments);
      }
      if (!this._eventMap[eventNameToWrap].has(cb)) {
        return nativeRemoveEventListener.apply(this, arguments);
      }
      const unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
      this._eventMap[eventNameToWrap].delete(cb);
      if (this._eventMap[eventNameToWrap].size === 0) {
        delete this._eventMap[eventNameToWrap];
      }
      if (Object.keys(this._eventMap).length === 0) {
        delete this._eventMap;
      }
      return nativeRemoveEventListener.apply(this, [
        nativeEventName,
        unwrappedCb
      ]);
    };
    Object.defineProperty(proto, "on" + eventNameToWrap, {
      get() {
        return this["_on" + eventNameToWrap];
      },
      set(cb) {
        if (this["_on" + eventNameToWrap]) {
          this.removeEventListener(
            eventNameToWrap,
            this["_on" + eventNameToWrap]
          );
          delete this["_on" + eventNameToWrap];
        }
        if (cb) {
          this.addEventListener(
            eventNameToWrap,
            this["_on" + eventNameToWrap] = cb
          );
        }
      },
      enumerable: true,
      configurable: true
    });
  }
  function disableLog(bool) {
    if (typeof bool !== "boolean") {
      return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
    }
    logDisabled_ = bool;
    return bool ? "adapter.js logging disabled" : "adapter.js logging enabled";
  }
  function disableWarnings(bool) {
    if (typeof bool !== "boolean") {
      return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
    }
    deprecationWarnings_ = !bool;
    return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
  }
  function log() {
    if (typeof window === "object") {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== "undefined" && typeof console.log === "function") {
        console.log.apply(console, arguments);
      }
    }
  }
  function deprecated(oldMethod, newMethod) {
    if (!deprecationWarnings_) {
      return;
    }
    console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
  }
  function detectBrowser(window2) {
    const result = { browser: null, version: null };
    if (typeof window2 === "undefined" || !window2.navigator || !window2.navigator.userAgent) {
      result.browser = "Not a browser.";
      return result;
    }
    const { navigator: navigator2 } = window2;
    if (navigator2.mozGetUserMedia) {
      result.browser = "firefox";
      result.version = parseInt(extractVersion(
        navigator2.userAgent,
        /Firefox\/(\d+)\./,
        1
      ));
    } else if (navigator2.webkitGetUserMedia || window2.isSecureContext === false && window2.webkitRTCPeerConnection) {
      result.browser = "chrome";
      result.version = parseInt(extractVersion(
        navigator2.userAgent,
        /Chrom(e|ium)\/(\d+)\./,
        2
      ));
    } else if (window2.RTCPeerConnection && navigator2.userAgent.match(/AppleWebKit\/(\d+)\./)) {
      result.browser = "safari";
      result.version = parseInt(extractVersion(
        navigator2.userAgent,
        /AppleWebKit\/(\d+)\./,
        1
      ));
      result.supportsUnifiedPlan = window2.RTCRtpTransceiver && "currentDirection" in window2.RTCRtpTransceiver.prototype;
      result._safariVersion = extractVersion(
        navigator2.userAgent,
        /Version\/(\d+(\.?\d+))/,
        1
      );
    } else {
      result.browser = "Not a supported browser.";
      return result;
    }
    return result;
  }
  function isObject(val) {
    return Object.prototype.toString.call(val) === "[object Object]";
  }
  function compactObject(data) {
    if (!isObject(data)) {
      return data;
    }
    return Object.keys(data).reduce(function(accumulator, key) {
      const isObj = isObject(data[key]);
      const value = isObj ? compactObject(data[key]) : data[key];
      const isEmptyObject = isObj && !Object.keys(value).length;
      if (value === void 0 || isEmptyObject) {
        return accumulator;
      }
      return Object.assign(accumulator, { [key]: value });
    }, {});
  }
  function walkStats(stats, base, resultSet) {
    if (!base || resultSet.has(base.id)) {
      return;
    }
    resultSet.set(base.id, base);
    Object.keys(base).forEach((name) => {
      if (name.endsWith("Id")) {
        walkStats(stats, stats.get(base[name]), resultSet);
      } else if (name.endsWith("Ids")) {
        base[name].forEach((id) => {
          walkStats(stats, stats.get(id), resultSet);
        });
      }
    });
  }
  function filterStats(result, track, outbound) {
    const streamStatsType = outbound ? "outbound-rtp" : "inbound-rtp";
    const filteredResult = /* @__PURE__ */ new Map();
    if (track === null) {
      return filteredResult;
    }
    const trackStats = [];
    result.forEach((value) => {
      if (value.type === "track" && value.trackIdentifier === track.id) {
        trackStats.push(value);
      }
    });
    trackStats.forEach((trackStat) => {
      result.forEach((stats) => {
        if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
          walkStats(result, stats, filteredResult);
        }
      });
    });
    return filteredResult;
  }

  // node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
  var chrome_shim_exports = {};
  __export(chrome_shim_exports, {
    fixNegotiationNeeded: () => fixNegotiationNeeded,
    shimAddTrackRemoveTrack: () => shimAddTrackRemoveTrack,
    shimAddTrackRemoveTrackWithNative: () => shimAddTrackRemoveTrackWithNative,
    shimGetDisplayMedia: () => shimGetDisplayMedia,
    shimGetSendersWithDtmf: () => shimGetSendersWithDtmf,
    shimGetStats: () => shimGetStats,
    shimGetUserMedia: () => shimGetUserMedia,
    shimMediaStream: () => shimMediaStream,
    shimOnTrack: () => shimOnTrack,
    shimPeerConnection: () => shimPeerConnection,
    shimSenderReceiverGetStats: () => shimSenderReceiverGetStats
  });

  // node_modules/webrtc-adapter/src/js/chrome/getusermedia.js
  var logging = log;
  function shimGetUserMedia(window2, browserDetails) {
    const navigator2 = window2 && window2.navigator;
    if (!navigator2.mediaDevices) {
      return;
    }
    const constraintsToChrome_ = function(c3) {
      if (typeof c3 !== "object" || c3.mandatory || c3.optional) {
        return c3;
      }
      const cc = {};
      Object.keys(c3).forEach((key) => {
        if (key === "require" || key === "advanced" || key === "mediaSource") {
          return;
        }
        const r2 = typeof c3[key] === "object" ? c3[key] : { ideal: c3[key] };
        if (r2.exact !== void 0 && typeof r2.exact === "number") {
          r2.min = r2.max = r2.exact;
        }
        const oldname_ = function(prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }
          return name === "deviceId" ? "sourceId" : name;
        };
        if (r2.ideal !== void 0) {
          cc.optional = cc.optional || [];
          let oc = {};
          if (typeof r2.ideal === "number") {
            oc[oldname_("min", key)] = r2.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname_("max", key)] = r2.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname_("", key)] = r2.ideal;
            cc.optional.push(oc);
          }
        }
        if (r2.exact !== void 0 && typeof r2.exact !== "number") {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname_("", key)] = r2.exact;
        } else {
          ["min", "max"].forEach((mix) => {
            if (r2[mix] !== void 0) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname_(mix, key)] = r2[mix];
            }
          });
        }
      });
      if (c3.advanced) {
        cc.optional = (cc.optional || []).concat(c3.advanced);
      }
      return cc;
    };
    const shimConstraints_ = function(constraints, func) {
      if (browserDetails.version >= 61) {
        return func(constraints);
      }
      constraints = JSON.parse(JSON.stringify(constraints));
      if (constraints && typeof constraints.audio === "object") {
        const remap = function(obj, a10, b3) {
          if (a10 in obj && !(b3 in obj)) {
            obj[b3] = obj[a10];
            delete obj[a10];
          }
        };
        constraints = JSON.parse(JSON.stringify(constraints));
        remap(constraints.audio, "autoGainControl", "googAutoGainControl");
        remap(constraints.audio, "noiseSuppression", "googNoiseSuppression");
        constraints.audio = constraintsToChrome_(constraints.audio);
      }
      if (constraints && typeof constraints.video === "object") {
        let face = constraints.video.facingMode;
        face = face && (typeof face === "object" ? face : { ideal: face });
        const getSupportedFacingModeLies = browserDetails.version < 66;
        if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && !(navigator2.mediaDevices.getSupportedConstraints && navigator2.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
          delete constraints.video.facingMode;
          let matches;
          if (face.exact === "environment" || face.ideal === "environment") {
            matches = ["back", "rear"];
          } else if (face.exact === "user" || face.ideal === "user") {
            matches = ["front"];
          }
          if (matches) {
            return navigator2.mediaDevices.enumerateDevices().then((devices) => {
              devices = devices.filter((d2) => d2.kind === "videoinput");
              let dev = devices.find((d2) => matches.some((match) => d2.label.toLowerCase().includes(match)));
              if (!dev && devices.length && matches.includes("back")) {
                dev = devices[devices.length - 1];
              }
              if (dev) {
                constraints.video.deviceId = face.exact ? { exact: dev.deviceId } : { ideal: dev.deviceId };
              }
              constraints.video = constraintsToChrome_(constraints.video);
              logging("chrome: " + JSON.stringify(constraints));
              return func(constraints);
            });
          }
        }
        constraints.video = constraintsToChrome_(constraints.video);
      }
      logging("chrome: " + JSON.stringify(constraints));
      return func(constraints);
    };
    const shimError_ = function(e) {
      if (browserDetails.version >= 64) {
        return e;
      }
      return {
        name: {
          PermissionDeniedError: "NotAllowedError",
          PermissionDismissedError: "NotAllowedError",
          InvalidStateError: "NotAllowedError",
          DevicesNotFoundError: "NotFoundError",
          ConstraintNotSatisfiedError: "OverconstrainedError",
          TrackStartError: "NotReadableError",
          MediaDeviceFailedDueToShutdown: "NotAllowedError",
          MediaDeviceKillSwitchOn: "NotAllowedError",
          TabCaptureError: "AbortError",
          ScreenCaptureError: "AbortError",
          DeviceCaptureError: "AbortError"
        }[e.name] || e.name,
        message: e.message,
        constraint: e.constraint || e.constraintName,
        toString() {
          return this.name + (this.message && ": ") + this.message;
        }
      };
    };
    const getUserMedia_ = function(constraints, onSuccess, onError) {
      shimConstraints_(constraints, (c3) => {
        navigator2.webkitGetUserMedia(c3, onSuccess, (e) => {
          if (onError) {
            onError(shimError_(e));
          }
        });
      });
    };
    navigator2.getUserMedia = getUserMedia_.bind(navigator2);
    if (navigator2.mediaDevices.getUserMedia) {
      const origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
      navigator2.mediaDevices.getUserMedia = function(cs2) {
        return shimConstraints_(cs2, (c3) => origGetUserMedia(c3).then((stream) => {
          if (c3.audio && !stream.getAudioTracks().length || c3.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            throw new DOMException("", "NotFoundError");
          }
          return stream;
        }, (e) => Promise.reject(shimError_(e))));
      };
    }
  }

  // node_modules/webrtc-adapter/src/js/chrome/getdisplaymedia.js
  function shimGetDisplayMedia(window2, getSourceId) {
    if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
      return;
    }
    if (!window2.navigator.mediaDevices) {
      return;
    }
    if (typeof getSourceId !== "function") {
      console.error("shimGetDisplayMedia: getSourceId argument is not a function");
      return;
    }
    window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
      return getSourceId(constraints).then((sourceId) => {
        const widthSpecified = constraints.video && constraints.video.width;
        const heightSpecified = constraints.video && constraints.video.height;
        const frameRateSpecified = constraints.video && constraints.video.frameRate;
        constraints.video = {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            maxFrameRate: frameRateSpecified || 3
          }
        };
        if (widthSpecified) {
          constraints.video.mandatory.maxWidth = widthSpecified;
        }
        if (heightSpecified) {
          constraints.video.mandatory.maxHeight = heightSpecified;
        }
        return window2.navigator.mediaDevices.getUserMedia(constraints);
      });
    };
  }

  // node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
  function shimMediaStream(window2) {
    window2.MediaStream = window2.MediaStream || window2.webkitMediaStream;
  }
  function shimOnTrack(window2) {
    if (typeof window2 === "object" && window2.RTCPeerConnection && !("ontrack" in window2.RTCPeerConnection.prototype)) {
      Object.defineProperty(window2.RTCPeerConnection.prototype, "ontrack", {
        get() {
          return this._ontrack;
        },
        set(f2) {
          if (this._ontrack) {
            this.removeEventListener("track", this._ontrack);
          }
          this.addEventListener("track", this._ontrack = f2);
        },
        enumerable: true,
        configurable: true
      });
      const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
      window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
        if (!this._ontrackpoly) {
          this._ontrackpoly = (e) => {
            e.stream.addEventListener("addtrack", (te) => {
              let receiver;
              if (window2.RTCPeerConnection.prototype.getReceivers) {
                receiver = this.getReceivers().find((r2) => r2.track && r2.track.id === te.track.id);
              } else {
                receiver = { track: te.track };
              }
              const event = new Event("track");
              event.track = te.track;
              event.receiver = receiver;
              event.transceiver = { receiver };
              event.streams = [e.stream];
              this.dispatchEvent(event);
            });
            e.stream.getTracks().forEach((track) => {
              let receiver;
              if (window2.RTCPeerConnection.prototype.getReceivers) {
                receiver = this.getReceivers().find((r2) => r2.track && r2.track.id === track.id);
              } else {
                receiver = { track };
              }
              const event = new Event("track");
              event.track = track;
              event.receiver = receiver;
              event.transceiver = { receiver };
              event.streams = [e.stream];
              this.dispatchEvent(event);
            });
          };
          this.addEventListener("addstream", this._ontrackpoly);
        }
        return origSetRemoteDescription.apply(this, arguments);
      };
    } else {
      wrapPeerConnectionEvent(window2, "track", (e) => {
        if (!e.transceiver) {
          Object.defineProperty(
            e,
            "transceiver",
            { value: { receiver: e.receiver } }
          );
        }
        return e;
      });
    }
  }
  function shimGetSendersWithDtmf(window2) {
    if (typeof window2 === "object" && window2.RTCPeerConnection && !("getSenders" in window2.RTCPeerConnection.prototype) && "createDTMFSender" in window2.RTCPeerConnection.prototype) {
      const shimSenderWithDtmf = function(pc, track) {
        return {
          track,
          get dtmf() {
            if (this._dtmf === void 0) {
              if (track.kind === "audio") {
                this._dtmf = pc.createDTMFSender(track);
              } else {
                this._dtmf = null;
              }
            }
            return this._dtmf;
          },
          _pc: pc
        };
      };
      if (!window2.RTCPeerConnection.prototype.getSenders) {
        window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
          this._senders = this._senders || [];
          return this._senders.slice();
        };
        const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
        window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
          let sender = origAddTrack.apply(this, arguments);
          if (!sender) {
            sender = shimSenderWithDtmf(this, track);
            this._senders.push(sender);
          }
          return sender;
        };
        const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
        window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
          origRemoveTrack.apply(this, arguments);
          const idx = this._senders.indexOf(sender);
          if (idx !== -1) {
            this._senders.splice(idx, 1);
          }
        };
      }
      const origAddStream = window2.RTCPeerConnection.prototype.addStream;
      window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
        this._senders = this._senders || [];
        origAddStream.apply(this, [stream]);
        stream.getTracks().forEach((track) => {
          this._senders.push(shimSenderWithDtmf(this, track));
        });
      };
      const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
      window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
        this._senders = this._senders || [];
        origRemoveStream.apply(this, [stream]);
        stream.getTracks().forEach((track) => {
          const sender = this._senders.find((s2) => s2.track === track);
          if (sender) {
            this._senders.splice(this._senders.indexOf(sender), 1);
          }
        });
      };
    } else if (typeof window2 === "object" && window2.RTCPeerConnection && "getSenders" in window2.RTCPeerConnection.prototype && "createDTMFSender" in window2.RTCPeerConnection.prototype && window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
      const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
      Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
        get() {
          if (this._dtmf === void 0) {
            if (this.track.kind === "audio") {
              this._dtmf = this._pc.createDTMFSender(this.track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        }
      });
    }
  }
  function shimGetStats(window2) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    const origGetStats = window2.RTCPeerConnection.prototype.getStats;
    window2.RTCPeerConnection.prototype.getStats = function getStats() {
      const [selector, onSucc, onErr] = arguments;
      if (arguments.length > 0 && typeof selector === "function") {
        return origGetStats.apply(this, arguments);
      }
      if (origGetStats.length === 0 && (arguments.length === 0 || typeof selector !== "function")) {
        return origGetStats.apply(this, []);
      }
      const fixChromeStats_ = function(response) {
        const standardReport = {};
        const reports = response.result();
        reports.forEach((report) => {
          const standardStats = {
            id: report.id,
            timestamp: report.timestamp,
            type: {
              localcandidate: "local-candidate",
              remotecandidate: "remote-candidate"
            }[report.type] || report.type
          };
          report.names().forEach((name) => {
            standardStats[name] = report.stat(name);
          });
          standardReport[standardStats.id] = standardStats;
        });
        return standardReport;
      };
      const makeMapStats = function(stats) {
        return new Map(Object.keys(stats).map((key) => [key, stats[key]]));
      };
      if (arguments.length >= 2) {
        const successCallbackWrapper_ = function(response) {
          onSucc(makeMapStats(fixChromeStats_(response)));
        };
        return origGetStats.apply(this, [
          successCallbackWrapper_,
          selector
        ]);
      }
      return new Promise((resolve, reject) => {
        origGetStats.apply(this, [
          function(response) {
            resolve(makeMapStats(fixChromeStats_(response)));
          },
          reject
        ]);
      }).then(onSucc, onErr);
    };
  }
  function shimSenderReceiverGetStats(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender && window2.RTCRtpReceiver)) {
      return;
    }
    if (!("getStats" in window2.RTCRtpSender.prototype)) {
      const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
      if (origGetSenders) {
        window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
          const senders = origGetSenders.apply(this, []);
          senders.forEach((sender) => sender._pc = this);
          return senders;
        };
      }
      const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
      if (origAddTrack) {
        window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
          const sender = origAddTrack.apply(this, arguments);
          sender._pc = this;
          return sender;
        };
      }
      window2.RTCRtpSender.prototype.getStats = function getStats() {
        const sender = this;
        return this._pc.getStats().then((result) => (
          /* Note: this will include stats of all senders that
           *   send a track with the same id as sender.track as
           *   it is not possible to identify the RTCRtpSender.
           */
          filterStats(result, sender.track, true)
        ));
      };
    }
    if (!("getStats" in window2.RTCRtpReceiver.prototype)) {
      const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
      if (origGetReceivers) {
        window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
          const receivers = origGetReceivers.apply(this, []);
          receivers.forEach((receiver) => receiver._pc = this);
          return receivers;
        };
      }
      wrapPeerConnectionEvent(window2, "track", (e) => {
        e.receiver._pc = e.srcElement;
        return e;
      });
      window2.RTCRtpReceiver.prototype.getStats = function getStats() {
        const receiver = this;
        return this._pc.getStats().then((result) => filterStats(result, receiver.track, false));
      };
    }
    if (!("getStats" in window2.RTCRtpSender.prototype && "getStats" in window2.RTCRtpReceiver.prototype)) {
      return;
    }
    const origGetStats = window2.RTCPeerConnection.prototype.getStats;
    window2.RTCPeerConnection.prototype.getStats = function getStats() {
      if (arguments.length > 0 && arguments[0] instanceof window2.MediaStreamTrack) {
        const track = arguments[0];
        let sender;
        let receiver;
        let err;
        this.getSenders().forEach((s2) => {
          if (s2.track === track) {
            if (sender) {
              err = true;
            } else {
              sender = s2;
            }
          }
        });
        this.getReceivers().forEach((r2) => {
          if (r2.track === track) {
            if (receiver) {
              err = true;
            } else {
              receiver = r2;
            }
          }
          return r2.track === track;
        });
        if (err || sender && receiver) {
          return Promise.reject(new DOMException(
            "There are more than one sender or receiver for the track.",
            "InvalidAccessError"
          ));
        } else if (sender) {
          return sender.getStats();
        } else if (receiver) {
          return receiver.getStats();
        }
        return Promise.reject(new DOMException(
          "There is no sender or receiver for the track.",
          "InvalidAccessError"
        ));
      }
      return origGetStats.apply(this, arguments);
    };
  }
  function shimAddTrackRemoveTrackWithNative(window2) {
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      return Object.keys(this._shimmedLocalStreams).map((streamId) => this._shimmedLocalStreams[streamId][0]);
    };
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
      if (!stream) {
        return origAddTrack.apply(this, arguments);
      }
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      const sender = origAddTrack.apply(this, arguments);
      if (!this._shimmedLocalStreams[stream.id]) {
        this._shimmedLocalStreams[stream.id] = [stream, sender];
      } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
        this._shimmedLocalStreams[stream.id].push(sender);
      }
      return sender;
    };
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      stream.getTracks().forEach((track) => {
        const alreadyExists = this.getSenders().find((s2) => s2.track === track);
        if (alreadyExists) {
          throw new DOMException(
            "Track already exists.",
            "InvalidAccessError"
          );
        }
      });
      const existingSenders = this.getSenders();
      origAddStream.apply(this, arguments);
      const newSenders = this.getSenders().filter((newSender) => existingSenders.indexOf(newSender) === -1);
      this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      delete this._shimmedLocalStreams[stream.id];
      return origRemoveStream.apply(this, arguments);
    };
    const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
    window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      if (sender) {
        Object.keys(this._shimmedLocalStreams).forEach((streamId) => {
          const idx = this._shimmedLocalStreams[streamId].indexOf(sender);
          if (idx !== -1) {
            this._shimmedLocalStreams[streamId].splice(idx, 1);
          }
          if (this._shimmedLocalStreams[streamId].length === 1) {
            delete this._shimmedLocalStreams[streamId];
          }
        });
      }
      return origRemoveTrack.apply(this, arguments);
    };
  }
  function shimAddTrackRemoveTrack(window2, browserDetails) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    if (window2.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
      return shimAddTrackRemoveTrackWithNative(window2);
    }
    const origGetLocalStreams = window2.RTCPeerConnection.prototype.getLocalStreams;
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      const nativeStreams = origGetLocalStreams.apply(this);
      this._reverseStreams = this._reverseStreams || {};
      return nativeStreams.map((stream) => this._reverseStreams[stream.id]);
    };
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      stream.getTracks().forEach((track) => {
        const alreadyExists = this.getSenders().find((s2) => s2.track === track);
        if (alreadyExists) {
          throw new DOMException(
            "Track already exists.",
            "InvalidAccessError"
          );
        }
      });
      if (!this._reverseStreams[stream.id]) {
        const newStream = new window2.MediaStream(stream.getTracks());
        this._streams[stream.id] = newStream;
        this._reverseStreams[newStream.id] = stream;
        stream = newStream;
      }
      origAddStream.apply(this, [stream]);
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
      delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
      delete this._streams[stream.id];
    };
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
      if (this.signalingState === "closed") {
        throw new DOMException(
          "The RTCPeerConnection's signalingState is 'closed'.",
          "InvalidStateError"
        );
      }
      const streams = [].slice.call(arguments, 1);
      if (streams.length !== 1 || !streams[0].getTracks().find((t2) => t2 === track)) {
        throw new DOMException(
          "The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.",
          "NotSupportedError"
        );
      }
      const alreadyExists = this.getSenders().find((s2) => s2.track === track);
      if (alreadyExists) {
        throw new DOMException(
          "Track already exists.",
          "InvalidAccessError"
        );
      }
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      const oldStream = this._streams[stream.id];
      if (oldStream) {
        oldStream.addTrack(track);
        Promise.resolve().then(() => {
          this.dispatchEvent(new Event("negotiationneeded"));
        });
      } else {
        const newStream = new window2.MediaStream([track]);
        this._streams[stream.id] = newStream;
        this._reverseStreams[newStream.id] = stream;
        this.addStream(newStream);
      }
      return this.getSenders().find((s2) => s2.track === track);
    };
    function replaceInternalStreamId(pc, description) {
      let sdp2 = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach((internalId) => {
        const externalStream = pc._reverseStreams[internalId];
        const internalStream = pc._streams[externalStream.id];
        sdp2 = sdp2.replace(
          new RegExp(internalStream.id, "g"),
          externalStream.id
        );
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp2
      });
    }
    function replaceExternalStreamId(pc, description) {
      let sdp2 = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach((internalId) => {
        const externalStream = pc._reverseStreams[internalId];
        const internalStream = pc._streams[externalStream.id];
        sdp2 = sdp2.replace(
          new RegExp(externalStream.id, "g"),
          internalStream.id
        );
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp2
      });
    }
    ["createOffer", "createAnswer"].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = { [method]() {
        const args = arguments;
        const isLegacyCall = arguments.length && typeof arguments[0] === "function";
        if (isLegacyCall) {
          return nativeMethod.apply(this, [
            (description) => {
              const desc = replaceInternalStreamId(this, description);
              args[0].apply(null, [desc]);
            },
            (err) => {
              if (args[1]) {
                args[1].apply(null, err);
              }
            },
            arguments[2]
          ]);
        }
        return nativeMethod.apply(this, arguments).then((description) => replaceInternalStreamId(this, description));
      } };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
    const origSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
    window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
      if (!arguments.length || !arguments[0].type) {
        return origSetLocalDescription.apply(this, arguments);
      }
      arguments[0] = replaceExternalStreamId(this, arguments[0]);
      return origSetLocalDescription.apply(this, arguments);
    };
    const origLocalDescription = Object.getOwnPropertyDescriptor(
      window2.RTCPeerConnection.prototype,
      "localDescription"
    );
    Object.defineProperty(
      window2.RTCPeerConnection.prototype,
      "localDescription",
      {
        get() {
          const description = origLocalDescription.get.apply(this);
          if (description.type === "") {
            return description;
          }
          return replaceInternalStreamId(this, description);
        }
      }
    );
    window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
      if (this.signalingState === "closed") {
        throw new DOMException(
          "The RTCPeerConnection's signalingState is 'closed'.",
          "InvalidStateError"
        );
      }
      if (!sender._pc) {
        throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.", "TypeError");
      }
      const isLocal = sender._pc === this;
      if (!isLocal) {
        throw new DOMException(
          "Sender was not created by this connection.",
          "InvalidAccessError"
        );
      }
      this._streams = this._streams || {};
      let stream;
      Object.keys(this._streams).forEach((streamid) => {
        const hasTrack = this._streams[streamid].getTracks().find((track) => sender.track === track);
        if (hasTrack) {
          stream = this._streams[streamid];
        }
      });
      if (stream) {
        if (stream.getTracks().length === 1) {
          this.removeStream(this._reverseStreams[stream.id]);
        } else {
          stream.removeTrack(sender.track);
        }
        this.dispatchEvent(new Event("negotiationneeded"));
      }
    };
  }
  function shimPeerConnection(window2, browserDetails) {
    if (!window2.RTCPeerConnection && window2.webkitRTCPeerConnection) {
      window2.RTCPeerConnection = window2.webkitRTCPeerConnection;
    }
    if (!window2.RTCPeerConnection) {
      return;
    }
    if (browserDetails.version < 53) {
      ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
        const nativeMethod = window2.RTCPeerConnection.prototype[method];
        const methodObj = { [method]() {
          arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        } };
        window2.RTCPeerConnection.prototype[method] = methodObj[method];
      });
    }
  }
  function fixNegotiationNeeded(window2, browserDetails) {
    wrapPeerConnectionEvent(window2, "negotiationneeded", (e) => {
      const pc = e.target;
      if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === "plan-b") {
        if (pc.signalingState !== "stable") {
          return;
        }
      }
      return e;
    });
  }

  // node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
  var firefox_shim_exports = {};
  __export(firefox_shim_exports, {
    shimAddTransceiver: () => shimAddTransceiver,
    shimCreateAnswer: () => shimCreateAnswer,
    shimCreateOffer: () => shimCreateOffer,
    shimGetDisplayMedia: () => shimGetDisplayMedia2,
    shimGetParameters: () => shimGetParameters,
    shimGetUserMedia: () => shimGetUserMedia2,
    shimOnTrack: () => shimOnTrack2,
    shimPeerConnection: () => shimPeerConnection2,
    shimRTCDataChannel: () => shimRTCDataChannel,
    shimReceiverGetStats: () => shimReceiverGetStats,
    shimRemoveStream: () => shimRemoveStream,
    shimSenderGetStats: () => shimSenderGetStats
  });

  // node_modules/webrtc-adapter/src/js/firefox/getusermedia.js
  function shimGetUserMedia2(window2, browserDetails) {
    const navigator2 = window2 && window2.navigator;
    const MediaStreamTrack = window2 && window2.MediaStreamTrack;
    navigator2.getUserMedia = function(constraints, onSuccess, onError) {
      deprecated(
        "navigator.getUserMedia",
        "navigator.mediaDevices.getUserMedia"
      );
      navigator2.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    };
    if (!(browserDetails.version > 55 && "autoGainControl" in navigator2.mediaDevices.getSupportedConstraints())) {
      const remap = function(obj, a10, b3) {
        if (a10 in obj && !(b3 in obj)) {
          obj[b3] = obj[a10];
          delete obj[a10];
        }
      };
      const nativeGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
      navigator2.mediaDevices.getUserMedia = function(c3) {
        if (typeof c3 === "object" && typeof c3.audio === "object") {
          c3 = JSON.parse(JSON.stringify(c3));
          remap(c3.audio, "autoGainControl", "mozAutoGainControl");
          remap(c3.audio, "noiseSuppression", "mozNoiseSuppression");
        }
        return nativeGetUserMedia(c3);
      };
      if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
        const nativeGetSettings = MediaStreamTrack.prototype.getSettings;
        MediaStreamTrack.prototype.getSettings = function() {
          const obj = nativeGetSettings.apply(this, arguments);
          remap(obj, "mozAutoGainControl", "autoGainControl");
          remap(obj, "mozNoiseSuppression", "noiseSuppression");
          return obj;
        };
      }
      if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
        const nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
        MediaStreamTrack.prototype.applyConstraints = function(c3) {
          if (this.kind === "audio" && typeof c3 === "object") {
            c3 = JSON.parse(JSON.stringify(c3));
            remap(c3, "autoGainControl", "mozAutoGainControl");
            remap(c3, "noiseSuppression", "mozNoiseSuppression");
          }
          return nativeApplyConstraints.apply(this, [c3]);
        };
      }
    }
  }

  // node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js
  function shimGetDisplayMedia2(window2, preferredMediaSource) {
    if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
      return;
    }
    if (!window2.navigator.mediaDevices) {
      return;
    }
    window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
      if (!(constraints && constraints.video)) {
        const err = new DOMException("getDisplayMedia without video constraints is undefined");
        err.name = "NotFoundError";
        err.code = 8;
        return Promise.reject(err);
      }
      if (constraints.video === true) {
        constraints.video = { mediaSource: preferredMediaSource };
      } else {
        constraints.video.mediaSource = preferredMediaSource;
      }
      return window2.navigator.mediaDevices.getUserMedia(constraints);
    };
  }

  // node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
  function shimOnTrack2(window2) {
    if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
      Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
        get() {
          return { receiver: this.receiver };
        }
      });
    }
  }
  function shimPeerConnection2(window2, browserDetails) {
    if (typeof window2 !== "object" || !(window2.RTCPeerConnection || window2.mozRTCPeerConnection)) {
      return;
    }
    if (!window2.RTCPeerConnection && window2.mozRTCPeerConnection) {
      window2.RTCPeerConnection = window2.mozRTCPeerConnection;
    }
    if (browserDetails.version < 53) {
      ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
        const nativeMethod = window2.RTCPeerConnection.prototype[method];
        const methodObj = { [method]() {
          arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        } };
        window2.RTCPeerConnection.prototype[method] = methodObj[method];
      });
    }
    const modernStatsTypes = {
      inboundrtp: "inbound-rtp",
      outboundrtp: "outbound-rtp",
      candidatepair: "candidate-pair",
      localcandidate: "local-candidate",
      remotecandidate: "remote-candidate"
    };
    const nativeGetStats = window2.RTCPeerConnection.prototype.getStats;
    window2.RTCPeerConnection.prototype.getStats = function getStats() {
      const [selector, onSucc, onErr] = arguments;
      return nativeGetStats.apply(this, [selector || null]).then((stats) => {
        if (browserDetails.version < 53 && !onSucc) {
          try {
            stats.forEach((stat) => {
              stat.type = modernStatsTypes[stat.type] || stat.type;
            });
          } catch (e) {
            if (e.name !== "TypeError") {
              throw e;
            }
            stats.forEach((stat, i2) => {
              stats.set(i2, Object.assign({}, stat, {
                type: modernStatsTypes[stat.type] || stat.type
              }));
            });
          }
        }
        return stats;
      }).then(onSucc, onErr);
    };
  }
  function shimSenderGetStats(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
      return;
    }
    if (window2.RTCRtpSender && "getStats" in window2.RTCRtpSender.prototype) {
      return;
    }
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
    }
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window2.RTCRtpSender.prototype.getStats = function getStats() {
      return this.track ? this._pc.getStats(this.track) : Promise.resolve(/* @__PURE__ */ new Map());
    };
  }
  function shimReceiverGetStats(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
      return;
    }
    if (window2.RTCRtpSender && "getStats" in window2.RTCRtpReceiver.prototype) {
      return;
    }
    const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        const receivers = origGetReceivers.apply(this, []);
        receivers.forEach((receiver) => receiver._pc = this);
        return receivers;
      };
    }
    wrapPeerConnectionEvent(window2, "track", (e) => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window2.RTCRtpReceiver.prototype.getStats = function getStats() {
      return this._pc.getStats(this.track);
    };
  }
  function shimRemoveStream(window2) {
    if (!window2.RTCPeerConnection || "removeStream" in window2.RTCPeerConnection.prototype) {
      return;
    }
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      deprecated("removeStream", "removeTrack");
      this.getSenders().forEach((sender) => {
        if (sender.track && stream.getTracks().includes(sender.track)) {
          this.removeTrack(sender);
        }
      });
    };
  }
  function shimRTCDataChannel(window2) {
    if (window2.DataChannel && !window2.RTCDataChannel) {
      window2.RTCDataChannel = window2.DataChannel;
    }
  }
  function shimAddTransceiver(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
      return;
    }
    const origAddTransceiver = window2.RTCPeerConnection.prototype.addTransceiver;
    if (origAddTransceiver) {
      window2.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
        this.setParametersPromises = [];
        let sendEncodings = arguments[1] && arguments[1].sendEncodings;
        if (sendEncodings === void 0) {
          sendEncodings = [];
        }
        sendEncodings = [...sendEncodings];
        const shouldPerformCheck = sendEncodings.length > 0;
        if (shouldPerformCheck) {
          sendEncodings.forEach((encodingParam) => {
            if ("rid" in encodingParam) {
              const ridRegex = /^[a-z0-9]{0,16}$/i;
              if (!ridRegex.test(encodingParam.rid)) {
                throw new TypeError("Invalid RID value provided.");
              }
            }
            if ("scaleResolutionDownBy" in encodingParam) {
              if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1)) {
                throw new RangeError("scale_resolution_down_by must be >= 1.0");
              }
            }
            if ("maxFramerate" in encodingParam) {
              if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
                throw new RangeError("max_framerate must be >= 0.0");
              }
            }
          });
        }
        const transceiver = origAddTransceiver.apply(this, arguments);
        if (shouldPerformCheck) {
          const { sender } = transceiver;
          const params = sender.getParameters();
          if (!("encodings" in params) || // Avoid being fooled by patched getParameters() below.
          params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
            params.encodings = sendEncodings;
            sender.sendEncodings = sendEncodings;
            this.setParametersPromises.push(
              sender.setParameters(params).then(() => {
                delete sender.sendEncodings;
              }).catch(() => {
                delete sender.sendEncodings;
              })
            );
          }
        }
        return transceiver;
      };
    }
  }
  function shimGetParameters(window2) {
    if (!(typeof window2 === "object" && window2.RTCRtpSender)) {
      return;
    }
    const origGetParameters = window2.RTCRtpSender.prototype.getParameters;
    if (origGetParameters) {
      window2.RTCRtpSender.prototype.getParameters = function getParameters() {
        const params = origGetParameters.apply(this, arguments);
        if (!("encodings" in params)) {
          params.encodings = [].concat(this.sendEncodings || [{}]);
        }
        return params;
      };
    }
  }
  function shimCreateOffer(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
      return;
    }
    const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
    window2.RTCPeerConnection.prototype.createOffer = function createOffer() {
      if (this.setParametersPromises && this.setParametersPromises.length) {
        return Promise.all(this.setParametersPromises).then(() => {
          return origCreateOffer.apply(this, arguments);
        }).finally(() => {
          this.setParametersPromises = [];
        });
      }
      return origCreateOffer.apply(this, arguments);
    };
  }
  function shimCreateAnswer(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
      return;
    }
    const origCreateAnswer = window2.RTCPeerConnection.prototype.createAnswer;
    window2.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
      if (this.setParametersPromises && this.setParametersPromises.length) {
        return Promise.all(this.setParametersPromises).then(() => {
          return origCreateAnswer.apply(this, arguments);
        }).finally(() => {
          this.setParametersPromises = [];
        });
      }
      return origCreateAnswer.apply(this, arguments);
    };
  }

  // node_modules/webrtc-adapter/src/js/safari/safari_shim.js
  var safari_shim_exports = {};
  __export(safari_shim_exports, {
    shimAudioContext: () => shimAudioContext,
    shimCallbacksAPI: () => shimCallbacksAPI,
    shimConstraints: () => shimConstraints,
    shimCreateOfferLegacy: () => shimCreateOfferLegacy,
    shimGetUserMedia: () => shimGetUserMedia3,
    shimLocalStreamsAPI: () => shimLocalStreamsAPI,
    shimRTCIceServerUrls: () => shimRTCIceServerUrls,
    shimRemoteStreamsAPI: () => shimRemoteStreamsAPI,
    shimTrackEventTransceiver: () => shimTrackEventTransceiver
  });
  function shimLocalStreamsAPI(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
      return;
    }
    if (!("getLocalStreams" in window2.RTCPeerConnection.prototype)) {
      window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        return this._localStreams;
      };
    }
    if (!("addStream" in window2.RTCPeerConnection.prototype)) {
      const _addTrack = window2.RTCPeerConnection.prototype.addTrack;
      window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        if (!this._localStreams.includes(stream)) {
          this._localStreams.push(stream);
        }
        stream.getAudioTracks().forEach((track) => _addTrack.call(
          this,
          track,
          stream
        ));
        stream.getVideoTracks().forEach((track) => _addTrack.call(
          this,
          track,
          stream
        ));
      };
      window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, ...streams) {
        if (streams) {
          streams.forEach((stream) => {
            if (!this._localStreams) {
              this._localStreams = [stream];
            } else if (!this._localStreams.includes(stream)) {
              this._localStreams.push(stream);
            }
          });
        }
        return _addTrack.apply(this, arguments);
      };
    }
    if (!("removeStream" in window2.RTCPeerConnection.prototype)) {
      window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        const index = this._localStreams.indexOf(stream);
        if (index === -1) {
          return;
        }
        this._localStreams.splice(index, 1);
        const tracks = stream.getTracks();
        this.getSenders().forEach((sender) => {
          if (tracks.includes(sender.track)) {
            this.removeTrack(sender);
          }
        });
      };
    }
  }
  function shimRemoteStreamsAPI(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
      return;
    }
    if (!("getRemoteStreams" in window2.RTCPeerConnection.prototype)) {
      window2.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
        return this._remoteStreams ? this._remoteStreams : [];
      };
    }
    if (!("onaddstream" in window2.RTCPeerConnection.prototype)) {
      Object.defineProperty(window2.RTCPeerConnection.prototype, "onaddstream", {
        get() {
          return this._onaddstream;
        },
        set(f2) {
          if (this._onaddstream) {
            this.removeEventListener("addstream", this._onaddstream);
            this.removeEventListener("track", this._onaddstreampoly);
          }
          this.addEventListener("addstream", this._onaddstream = f2);
          this.addEventListener("track", this._onaddstreampoly = (e) => {
            e.streams.forEach((stream) => {
              if (!this._remoteStreams) {
                this._remoteStreams = [];
              }
              if (this._remoteStreams.includes(stream)) {
                return;
              }
              this._remoteStreams.push(stream);
              const event = new Event("addstream");
              event.stream = stream;
              this.dispatchEvent(event);
            });
          });
        }
      });
      const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
      window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
        const pc = this;
        if (!this._onaddstreampoly) {
          this.addEventListener("track", this._onaddstreampoly = function(e) {
            e.streams.forEach((stream) => {
              if (!pc._remoteStreams) {
                pc._remoteStreams = [];
              }
              if (pc._remoteStreams.indexOf(stream) >= 0) {
                return;
              }
              pc._remoteStreams.push(stream);
              const event = new Event("addstream");
              event.stream = stream;
              pc.dispatchEvent(event);
            });
          });
        }
        return origSetRemoteDescription.apply(pc, arguments);
      };
    }
  }
  function shimCallbacksAPI(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
      return;
    }
    const prototype = window2.RTCPeerConnection.prototype;
    const origCreateOffer = prototype.createOffer;
    const origCreateAnswer = prototype.createAnswer;
    const setLocalDescription = prototype.setLocalDescription;
    const setRemoteDescription = prototype.setRemoteDescription;
    const addIceCandidate = prototype.addIceCandidate;
    prototype.createOffer = function createOffer(successCallback, failureCallback) {
      const options = arguments.length >= 2 ? arguments[2] : arguments[0];
      const promise = origCreateOffer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
      const options = arguments.length >= 2 ? arguments[2] : arguments[0];
      const promise = origCreateAnswer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    let withCallback = function(description, successCallback, failureCallback) {
      const promise = setLocalDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setLocalDescription = withCallback;
    withCallback = function(description, successCallback, failureCallback) {
      const promise = setRemoteDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setRemoteDescription = withCallback;
    withCallback = function(candidate, successCallback, failureCallback) {
      const promise = addIceCandidate.apply(this, [candidate]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.addIceCandidate = withCallback;
  }
  function shimGetUserMedia3(window2) {
    const navigator2 = window2 && window2.navigator;
    if (navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
      const mediaDevices = navigator2.mediaDevices;
      const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
      navigator2.mediaDevices.getUserMedia = (constraints) => {
        return _getUserMedia(shimConstraints(constraints));
      };
    }
    if (!navigator2.getUserMedia && navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
      navigator2.getUserMedia = function getUserMedia(constraints, cb, errcb) {
        navigator2.mediaDevices.getUserMedia(constraints).then(cb, errcb);
      }.bind(navigator2);
    }
  }
  function shimConstraints(constraints) {
    if (constraints && constraints.video !== void 0) {
      return Object.assign(
        {},
        constraints,
        { video: compactObject(constraints.video) }
      );
    }
    return constraints;
  }
  function shimRTCIceServerUrls(window2) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    const OrigPeerConnection = window2.RTCPeerConnection;
    window2.RTCPeerConnection = function RTCPeerConnection2(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        const newIceServers = [];
        for (let i2 = 0; i2 < pcConfig.iceServers.length; i2++) {
          let server = pcConfig.iceServers[i2];
          if (server.urls === void 0 && server.url) {
            deprecated("RTCIceServer.url", "RTCIceServer.urls");
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            delete server.url;
            newIceServers.push(server);
          } else {
            newIceServers.push(pcConfig.iceServers[i2]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
    window2.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
    if ("generateCertificate" in OrigPeerConnection) {
      Object.defineProperty(window2.RTCPeerConnection, "generateCertificate", {
        get() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }
  }
  function shimTrackEventTransceiver(window2) {
    if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
      Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
        get() {
          return { receiver: this.receiver };
        }
      });
    }
  }
  function shimCreateOfferLegacy(window2) {
    const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
    window2.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
      if (offerOptions) {
        if (typeof offerOptions.offerToReceiveAudio !== "undefined") {
          offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
        }
        const audioTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "audio");
        if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
          if (audioTransceiver.direction === "sendrecv") {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection("sendonly");
            } else {
              audioTransceiver.direction = "sendonly";
            }
          } else if (audioTransceiver.direction === "recvonly") {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection("inactive");
            } else {
              audioTransceiver.direction = "inactive";
            }
          }
        } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
          this.addTransceiver("audio", { direction: "recvonly" });
        }
        if (typeof offerOptions.offerToReceiveVideo !== "undefined") {
          offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
        }
        const videoTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "video");
        if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
          if (videoTransceiver.direction === "sendrecv") {
            if (videoTransceiver.setDirection) {
              videoTransceiver.setDirection("sendonly");
            } else {
              videoTransceiver.direction = "sendonly";
            }
          } else if (videoTransceiver.direction === "recvonly") {
            if (videoTransceiver.setDirection) {
              videoTransceiver.setDirection("inactive");
            } else {
              videoTransceiver.direction = "inactive";
            }
          }
        } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
          this.addTransceiver("video", { direction: "recvonly" });
        }
      }
      return origCreateOffer.apply(this, arguments);
    };
  }
  function shimAudioContext(window2) {
    if (typeof window2 !== "object" || window2.AudioContext) {
      return;
    }
    window2.AudioContext = window2.webkitAudioContext;
  }

  // node_modules/webrtc-adapter/src/js/common_shim.js
  var common_shim_exports = {};
  __export(common_shim_exports, {
    removeExtmapAllowMixed: () => removeExtmapAllowMixed,
    shimAddIceCandidateNullOrEmpty: () => shimAddIceCandidateNullOrEmpty,
    shimConnectionState: () => shimConnectionState,
    shimMaxMessageSize: () => shimMaxMessageSize,
    shimParameterlessSetLocalDescription: () => shimParameterlessSetLocalDescription,
    shimRTCIceCandidate: () => shimRTCIceCandidate,
    shimRTCIceCandidateRelayProtocol: () => shimRTCIceCandidateRelayProtocol,
    shimSendThrowTypeError: () => shimSendThrowTypeError
  });
  var import_sdp = __toESM(require_sdp());
  function shimRTCIceCandidate(window2) {
    if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "foundation" in window2.RTCIceCandidate.prototype) {
      return;
    }
    const NativeRTCIceCandidate = window2.RTCIceCandidate;
    window2.RTCIceCandidate = function RTCIceCandidate(args) {
      if (typeof args === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
        args = JSON.parse(JSON.stringify(args));
        args.candidate = args.candidate.substring(2);
      }
      if (args.candidate && args.candidate.length) {
        const nativeCandidate = new NativeRTCIceCandidate(args);
        const parsedCandidate = import_sdp.default.parseCandidate(args.candidate);
        for (const key in parsedCandidate) {
          if (!(key in nativeCandidate)) {
            Object.defineProperty(
              nativeCandidate,
              key,
              { value: parsedCandidate[key] }
            );
          }
        }
        nativeCandidate.toJSON = function toJSON() {
          return {
            candidate: nativeCandidate.candidate,
            sdpMid: nativeCandidate.sdpMid,
            sdpMLineIndex: nativeCandidate.sdpMLineIndex,
            usernameFragment: nativeCandidate.usernameFragment
          };
        };
        return nativeCandidate;
      }
      return new NativeRTCIceCandidate(args);
    };
    window2.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;
    wrapPeerConnectionEvent(window2, "icecandidate", (e) => {
      if (e.candidate) {
        Object.defineProperty(e, "candidate", {
          value: new window2.RTCIceCandidate(e.candidate),
          writable: "false"
        });
      }
      return e;
    });
  }
  function shimRTCIceCandidateRelayProtocol(window2) {
    if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "relayProtocol" in window2.RTCIceCandidate.prototype) {
      return;
    }
    wrapPeerConnectionEvent(window2, "icecandidate", (e) => {
      if (e.candidate) {
        const parsedCandidate = import_sdp.default.parseCandidate(e.candidate.candidate);
        if (parsedCandidate.type === "relay") {
          e.candidate.relayProtocol = {
            0: "tls",
            1: "tcp",
            2: "udp"
          }[parsedCandidate.priority >> 24];
        }
      }
      return e;
    });
  }
  function shimMaxMessageSize(window2, browserDetails) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    if (!("sctp" in window2.RTCPeerConnection.prototype)) {
      Object.defineProperty(window2.RTCPeerConnection.prototype, "sctp", {
        get() {
          return typeof this._sctp === "undefined" ? null : this._sctp;
        }
      });
    }
    const sctpInDescription = function(description) {
      if (!description || !description.sdp) {
        return false;
      }
      const sections = import_sdp.default.splitSections(description.sdp);
      sections.shift();
      return sections.some((mediaSection) => {
        const mLine = import_sdp.default.parseMLine(mediaSection);
        return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
      });
    };
    const getRemoteFirefoxVersion = function(description) {
      const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
      if (match === null || match.length < 2) {
        return -1;
      }
      const version = parseInt(match[1], 10);
      return version !== version ? -1 : version;
    };
    const getCanSendMaxMessageSize = function(remoteIsFirefox) {
      let canSendMaxMessageSize = 65536;
      if (browserDetails.browser === "firefox") {
        if (browserDetails.version < 57) {
          if (remoteIsFirefox === -1) {
            canSendMaxMessageSize = 16384;
          } else {
            canSendMaxMessageSize = 2147483637;
          }
        } else if (browserDetails.version < 60) {
          canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
        } else {
          canSendMaxMessageSize = 2147483637;
        }
      }
      return canSendMaxMessageSize;
    };
    const getMaxMessageSize = function(description, remoteIsFirefox) {
      let maxMessageSize = 65536;
      if (browserDetails.browser === "firefox" && browserDetails.version === 57) {
        maxMessageSize = 65535;
      }
      const match = import_sdp.default.matchPrefix(
        description.sdp,
        "a=max-message-size:"
      );
      if (match.length > 0) {
        maxMessageSize = parseInt(match[0].substring(19), 10);
      } else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1) {
        maxMessageSize = 2147483637;
      }
      return maxMessageSize;
    };
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      this._sctp = null;
      if (browserDetails.browser === "chrome" && browserDetails.version >= 76) {
        const { sdpSemantics } = this.getConfiguration();
        if (sdpSemantics === "plan-b") {
          Object.defineProperty(this, "sctp", {
            get() {
              return typeof this._sctp === "undefined" ? null : this._sctp;
            },
            enumerable: true,
            configurable: true
          });
        }
      }
      if (sctpInDescription(arguments[0])) {
        const isFirefox = getRemoteFirefoxVersion(arguments[0]);
        const canSendMMS = getCanSendMaxMessageSize(isFirefox);
        const remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
        let maxMessageSize;
        if (canSendMMS === 0 && remoteMMS === 0) {
          maxMessageSize = Number.POSITIVE_INFINITY;
        } else if (canSendMMS === 0 || remoteMMS === 0) {
          maxMessageSize = Math.max(canSendMMS, remoteMMS);
        } else {
          maxMessageSize = Math.min(canSendMMS, remoteMMS);
        }
        const sctp = {};
        Object.defineProperty(sctp, "maxMessageSize", {
          get() {
            return maxMessageSize;
          }
        });
        this._sctp = sctp;
      }
      return origSetRemoteDescription.apply(this, arguments);
    };
  }
  function shimSendThrowTypeError(window2) {
    if (!(window2.RTCPeerConnection && "createDataChannel" in window2.RTCPeerConnection.prototype)) {
      return;
    }
    function wrapDcSend(dc, pc) {
      const origDataChannelSend = dc.send;
      dc.send = function send() {
        const data = arguments[0];
        const length = data.length || data.size || data.byteLength;
        if (dc.readyState === "open" && pc.sctp && length > pc.sctp.maxMessageSize) {
          throw new TypeError("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)");
        }
        return origDataChannelSend.apply(dc, arguments);
      };
    }
    const origCreateDataChannel = window2.RTCPeerConnection.prototype.createDataChannel;
    window2.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
      const dataChannel = origCreateDataChannel.apply(this, arguments);
      wrapDcSend(dataChannel, this);
      return dataChannel;
    };
    wrapPeerConnectionEvent(window2, "datachannel", (e) => {
      wrapDcSend(e.channel, e.target);
      return e;
    });
  }
  function shimConnectionState(window2) {
    if (!window2.RTCPeerConnection || "connectionState" in window2.RTCPeerConnection.prototype) {
      return;
    }
    const proto = window2.RTCPeerConnection.prototype;
    Object.defineProperty(proto, "connectionState", {
      get() {
        return {
          completed: "connected",
          checking: "connecting"
        }[this.iceConnectionState] || this.iceConnectionState;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(proto, "onconnectionstatechange", {
      get() {
        return this._onconnectionstatechange || null;
      },
      set(cb) {
        if (this._onconnectionstatechange) {
          this.removeEventListener(
            "connectionstatechange",
            this._onconnectionstatechange
          );
          delete this._onconnectionstatechange;
        }
        if (cb) {
          this.addEventListener(
            "connectionstatechange",
            this._onconnectionstatechange = cb
          );
        }
      },
      enumerable: true,
      configurable: true
    });
    ["setLocalDescription", "setRemoteDescription"].forEach((method) => {
      const origMethod = proto[method];
      proto[method] = function() {
        if (!this._connectionstatechangepoly) {
          this._connectionstatechangepoly = (e) => {
            const pc = e.target;
            if (pc._lastConnectionState !== pc.connectionState) {
              pc._lastConnectionState = pc.connectionState;
              const newEvent = new Event("connectionstatechange", e);
              pc.dispatchEvent(newEvent);
            }
            return e;
          };
          this.addEventListener(
            "iceconnectionstatechange",
            this._connectionstatechangepoly
          );
        }
        return origMethod.apply(this, arguments);
      };
    });
  }
  function removeExtmapAllowMixed(window2, browserDetails) {
    if (!window2.RTCPeerConnection) {
      return;
    }
    if (browserDetails.browser === "chrome" && browserDetails.version >= 71) {
      return;
    }
    if (browserDetails.browser === "safari" && browserDetails._safariVersion >= 13.1) {
      return;
    }
    const nativeSRD = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
      if (desc && desc.sdp && desc.sdp.indexOf("\na=extmap-allow-mixed") !== -1) {
        const sdp2 = desc.sdp.split("\n").filter((line) => {
          return line.trim() !== "a=extmap-allow-mixed";
        }).join("\n");
        if (window2.RTCSessionDescription && desc instanceof window2.RTCSessionDescription) {
          arguments[0] = new window2.RTCSessionDescription({
            type: desc.type,
            sdp: sdp2
          });
        } else {
          desc.sdp = sdp2;
        }
      }
      return nativeSRD.apply(this, arguments);
    };
  }
  function shimAddIceCandidateNullOrEmpty(window2, browserDetails) {
    if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
      return;
    }
    const nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
    if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
      return;
    }
    window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      if ((browserDetails.browser === "chrome" && browserDetails.version < 78 || browserDetails.browser === "firefox" && browserDetails.version < 68 || browserDetails.browser === "safari") && arguments[0] && arguments[0].candidate === "") {
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  }
  function shimParameterlessSetLocalDescription(window2, browserDetails) {
    if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
      return;
    }
    const nativeSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
    if (!nativeSetLocalDescription || nativeSetLocalDescription.length === 0) {
      return;
    }
    window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
      let desc = arguments[0] || {};
      if (typeof desc !== "object" || desc.type && desc.sdp) {
        return nativeSetLocalDescription.apply(this, arguments);
      }
      desc = { type: desc.type, sdp: desc.sdp };
      if (!desc.type) {
        switch (this.signalingState) {
          case "stable":
          case "have-local-offer":
          case "have-remote-pranswer":
            desc.type = "offer";
            break;
          default:
            desc.type = "answer";
            break;
        }
      }
      if (desc.sdp || desc.type !== "offer" && desc.type !== "answer") {
        return nativeSetLocalDescription.apply(this, [desc]);
      }
      const func = desc.type === "offer" ? this.createOffer : this.createAnswer;
      return func.apply(this).then((d2) => nativeSetLocalDescription.apply(this, [d2]));
    };
  }

  // node_modules/webrtc-adapter/src/js/adapter_factory.js
  var sdp = __toESM(require_sdp());
  function adapterFactory({ window: window2 } = {}, options = {
    shimChrome: true,
    shimFirefox: true,
    shimSafari: true
  }) {
    const logging2 = log;
    const browserDetails = detectBrowser(window2);
    const adapter2 = {
      browserDetails,
      commonShim: common_shim_exports,
      extractVersion,
      disableLog,
      disableWarnings,
      // Expose sdp as a convenience. For production apps include directly.
      sdp
    };
    switch (browserDetails.browser) {
      case "chrome":
        if (!chrome_shim_exports || !shimPeerConnection || !options.shimChrome) {
          logging2("Chrome shim is not included in this adapter release.");
          return adapter2;
        }
        if (browserDetails.version === null) {
          logging2("Chrome shim can not determine version, not shimming.");
          return adapter2;
        }
        logging2("adapter.js shimming chrome.");
        adapter2.browserShim = chrome_shim_exports;
        shimAddIceCandidateNullOrEmpty(window2, browserDetails);
        shimParameterlessSetLocalDescription(window2, browserDetails);
        shimGetUserMedia(window2, browserDetails);
        shimMediaStream(window2, browserDetails);
        shimPeerConnection(window2, browserDetails);
        shimOnTrack(window2, browserDetails);
        shimAddTrackRemoveTrack(window2, browserDetails);
        shimGetSendersWithDtmf(window2, browserDetails);
        shimGetStats(window2, browserDetails);
        shimSenderReceiverGetStats(window2, browserDetails);
        fixNegotiationNeeded(window2, browserDetails);
        shimRTCIceCandidate(window2, browserDetails);
        shimRTCIceCandidateRelayProtocol(window2, browserDetails);
        shimConnectionState(window2, browserDetails);
        shimMaxMessageSize(window2, browserDetails);
        shimSendThrowTypeError(window2, browserDetails);
        removeExtmapAllowMixed(window2, browserDetails);
        break;
      case "firefox":
        if (!firefox_shim_exports || !shimPeerConnection2 || !options.shimFirefox) {
          logging2("Firefox shim is not included in this adapter release.");
          return adapter2;
        }
        logging2("adapter.js shimming firefox.");
        adapter2.browserShim = firefox_shim_exports;
        shimAddIceCandidateNullOrEmpty(window2, browserDetails);
        shimParameterlessSetLocalDescription(window2, browserDetails);
        shimGetUserMedia2(window2, browserDetails);
        shimPeerConnection2(window2, browserDetails);
        shimOnTrack2(window2, browserDetails);
        shimRemoveStream(window2, browserDetails);
        shimSenderGetStats(window2, browserDetails);
        shimReceiverGetStats(window2, browserDetails);
        shimRTCDataChannel(window2, browserDetails);
        shimAddTransceiver(window2, browserDetails);
        shimGetParameters(window2, browserDetails);
        shimCreateOffer(window2, browserDetails);
        shimCreateAnswer(window2, browserDetails);
        shimRTCIceCandidate(window2, browserDetails);
        shimConnectionState(window2, browserDetails);
        shimMaxMessageSize(window2, browserDetails);
        shimSendThrowTypeError(window2, browserDetails);
        break;
      case "safari":
        if (!safari_shim_exports || !options.shimSafari) {
          logging2("Safari shim is not included in this adapter release.");
          return adapter2;
        }
        logging2("adapter.js shimming safari.");
        adapter2.browserShim = safari_shim_exports;
        shimAddIceCandidateNullOrEmpty(window2, browserDetails);
        shimParameterlessSetLocalDescription(window2, browserDetails);
        shimRTCIceServerUrls(window2, browserDetails);
        shimCreateOfferLegacy(window2, browserDetails);
        shimCallbacksAPI(window2, browserDetails);
        shimLocalStreamsAPI(window2, browserDetails);
        shimRemoteStreamsAPI(window2, browserDetails);
        shimTrackEventTransceiver(window2, browserDetails);
        shimGetUserMedia3(window2, browserDetails);
        shimAudioContext(window2, browserDetails);
        shimRTCIceCandidate(window2, browserDetails);
        shimRTCIceCandidateRelayProtocol(window2, browserDetails);
        shimMaxMessageSize(window2, browserDetails);
        shimSendThrowTypeError(window2, browserDetails);
        removeExtmapAllowMixed(window2, browserDetails);
        break;
      default:
        logging2("Unsupported browser!");
        break;
    }
    return adapter2;
  }

  // node_modules/webrtc-adapter/src/js/adapter_core.js
  var adapter = adapterFactory({ window: typeof window === "undefined" ? void 0 : window });
  var adapter_core_default = adapter;

  // node_modules/@100mslive/hms-video-store/dist/index.js
  var import_lodash2 = __toESM(require_lodash());
  var import_eventemitter2 = __toESM(require_eventemitter2());

  // node_modules/immer/dist/immer.esm.mjs
  function n(n2) {
    for (var r2 = arguments.length, t2 = Array(r2 > 1 ? r2 - 1 : 0), e = 1; e < r2; e++) t2[e - 1] = arguments[e];
    if (true) {
      var i2 = Y[n2], o2 = i2 ? "function" == typeof i2 ? i2.apply(null, t2) : i2 : "unknown error nr: " + n2;
      throw Error("[Immer] " + o2);
    }
    throw Error("[Immer] minified error nr: " + n2 + (t2.length ? " " + t2.map((function(n3) {
      return "'" + n3 + "'";
    })).join(",") : "") + ". Find the full error at: https://bit.ly/3cXEKWf");
  }
  function r(n2) {
    return !!n2 && !!n2[Q];
  }
  function t(n2) {
    var r2;
    return !!n2 && ((function(n3) {
      if (!n3 || "object" != typeof n3) return false;
      var r3 = Object.getPrototypeOf(n3);
      if (null === r3) return true;
      var t2 = Object.hasOwnProperty.call(r3, "constructor") && r3.constructor;
      return t2 === Object || "function" == typeof t2 && Function.toString.call(t2) === Z;
    })(n2) || Array.isArray(n2) || !!n2[L] || !!(null === (r2 = n2.constructor) || void 0 === r2 ? void 0 : r2[L]) || s(n2) || v(n2));
  }
  function i(n2, r2, t2) {
    void 0 === t2 && (t2 = false), 0 === o(n2) ? (t2 ? Object.keys : nn)(n2).forEach((function(e) {
      t2 && "symbol" == typeof e || r2(e, n2[e], n2);
    })) : n2.forEach((function(t3, e) {
      return r2(e, t3, n2);
    }));
  }
  function o(n2) {
    var r2 = n2[Q];
    return r2 ? r2.i > 3 ? r2.i - 4 : r2.i : Array.isArray(n2) ? 1 : s(n2) ? 2 : v(n2) ? 3 : 0;
  }
  function u(n2, r2) {
    return 2 === o(n2) ? n2.has(r2) : Object.prototype.hasOwnProperty.call(n2, r2);
  }
  function a(n2, r2) {
    return 2 === o(n2) ? n2.get(r2) : n2[r2];
  }
  function f(n2, r2, t2) {
    var e = o(n2);
    2 === e ? n2.set(r2, t2) : 3 === e ? n2.add(t2) : n2[r2] = t2;
  }
  function c(n2, r2) {
    return n2 === r2 ? 0 !== n2 || 1 / n2 == 1 / r2 : n2 != n2 && r2 != r2;
  }
  function s(n2) {
    return X && n2 instanceof Map;
  }
  function v(n2) {
    return q && n2 instanceof Set;
  }
  function p(n2) {
    return n2.o || n2.t;
  }
  function l(n2) {
    if (Array.isArray(n2)) return Array.prototype.slice.call(n2);
    var r2 = rn(n2);
    delete r2[Q];
    for (var t2 = nn(r2), e = 0; e < t2.length; e++) {
      var i2 = t2[e], o2 = r2[i2];
      false === o2.writable && (o2.writable = true, o2.configurable = true), (o2.get || o2.set) && (r2[i2] = { configurable: true, writable: true, enumerable: o2.enumerable, value: n2[i2] });
    }
    return Object.create(Object.getPrototypeOf(n2), r2);
  }
  function d(n2, e) {
    return void 0 === e && (e = false), y(n2) || r(n2) || !t(n2) || (o(n2) > 1 && (n2.set = n2.add = n2.clear = n2.delete = h), Object.freeze(n2), e && i(n2, (function(n3, r2) {
      return d(r2, true);
    }), true)), n2;
  }
  function h() {
    n(2);
  }
  function y(n2) {
    return null == n2 || "object" != typeof n2 || Object.isFrozen(n2);
  }
  function b(r2) {
    var t2 = tn[r2];
    return t2 || n(18, r2), t2;
  }
  function _() {
    return U || n(0), U;
  }
  function j(n2, r2) {
    r2 && (b("Patches"), n2.u = [], n2.s = [], n2.v = r2);
  }
  function g(n2) {
    O(n2), n2.p.forEach(S), n2.p = null;
  }
  function O(n2) {
    n2 === U && (U = n2.l);
  }
  function w(n2) {
    return U = { p: [], l: U, h: n2, m: true, _: 0 };
  }
  function S(n2) {
    var r2 = n2[Q];
    0 === r2.i || 1 === r2.i ? r2.j() : r2.g = true;
  }
  function P(r2, e) {
    e._ = e.p.length;
    var i2 = e.p[0], o2 = void 0 !== r2 && r2 !== i2;
    return e.h.O || b("ES5").S(e, r2, o2), o2 ? (i2[Q].P && (g(e), n(4)), t(r2) && (r2 = M(e, r2), e.l || x(e, r2)), e.u && b("Patches").M(i2[Q].t, r2, e.u, e.s)) : r2 = M(e, i2, []), g(e), e.u && e.v(e.u, e.s), r2 !== H ? r2 : void 0;
  }
  function M(n2, r2, t2) {
    if (y(r2)) return r2;
    var e = r2[Q];
    if (!e) return i(r2, (function(i2, o3) {
      return A(n2, e, r2, i2, o3, t2);
    }), true), r2;
    if (e.A !== n2) return r2;
    if (!e.P) return x(n2, e.t, true), e.t;
    if (!e.I) {
      e.I = true, e.A._--;
      var o2 = 4 === e.i || 5 === e.i ? e.o = l(e.k) : e.o, u2 = o2, a10 = false;
      3 === e.i && (u2 = new Set(o2), o2.clear(), a10 = true), i(u2, (function(r3, i2) {
        return A(n2, e, o2, r3, i2, t2, a10);
      })), x(n2, o2, false), t2 && n2.u && b("Patches").N(e, t2, n2.u, n2.s);
    }
    return e.o;
  }
  function A(e, i2, o2, a10, c3, s2, v2) {
    if (c3 === o2 && n(5), r(c3)) {
      var p2 = M(e, c3, s2 && i2 && 3 !== i2.i && !u(i2.R, a10) ? s2.concat(a10) : void 0);
      if (f(o2, a10, p2), !r(p2)) return;
      e.m = false;
    } else v2 && o2.add(c3);
    if (t(c3) && !y(c3)) {
      if (!e.h.D && e._ < 1) return;
      M(e, c3), i2 && i2.A.l || x(e, c3);
    }
  }
  function x(n2, r2, t2) {
    void 0 === t2 && (t2 = false), !n2.l && n2.h.D && n2.m && d(r2, t2);
  }
  function z(n2, r2) {
    var t2 = n2[Q];
    return (t2 ? p(t2) : n2)[r2];
  }
  function I(n2, r2) {
    if (r2 in n2) for (var t2 = Object.getPrototypeOf(n2); t2; ) {
      var e = Object.getOwnPropertyDescriptor(t2, r2);
      if (e) return e;
      t2 = Object.getPrototypeOf(t2);
    }
  }
  function k(n2) {
    n2.P || (n2.P = true, n2.l && k(n2.l));
  }
  function E(n2) {
    n2.o || (n2.o = l(n2.t));
  }
  function N(n2, r2, t2) {
    var e = s(r2) ? b("MapSet").F(r2, t2) : v(r2) ? b("MapSet").T(r2, t2) : n2.O ? (function(n3, r3) {
      var t3 = Array.isArray(n3), e2 = { i: t3 ? 1 : 0, A: r3 ? r3.A : _(), P: false, I: false, R: {}, l: r3, t: n3, k: null, o: null, j: null, C: false }, i2 = e2, o2 = en;
      t3 && (i2 = [e2], o2 = on);
      var u2 = Proxy.revocable(i2, o2), a10 = u2.revoke, f2 = u2.proxy;
      return e2.k = f2, e2.j = a10, f2;
    })(r2, t2) : b("ES5").J(r2, t2);
    return (t2 ? t2.A : _()).p.push(e), e;
  }
  function R(e) {
    return r(e) || n(22, e), (function n2(r2) {
      if (!t(r2)) return r2;
      var e2, u2 = r2[Q], c3 = o(r2);
      if (u2) {
        if (!u2.P && (u2.i < 4 || !b("ES5").K(u2))) return u2.t;
        u2.I = true, e2 = D(r2, c3), u2.I = false;
      } else e2 = D(r2, c3);
      return i(e2, (function(r3, t2) {
        u2 && a(u2.t, r3) === t2 || f(e2, r3, n2(t2));
      })), 3 === c3 ? new Set(e2) : e2;
    })(e);
  }
  function D(n2, r2) {
    switch (r2) {
      case 2:
        return new Map(n2);
      case 3:
        return Array.from(n2);
    }
    return l(n2);
  }
  var G;
  var U;
  var W = "undefined" != typeof Symbol && "symbol" == typeof Symbol("x");
  var X = "undefined" != typeof Map;
  var q = "undefined" != typeof Set;
  var B = "undefined" != typeof Proxy && void 0 !== Proxy.revocable && "undefined" != typeof Reflect;
  var H = W ? Symbol.for("immer-nothing") : ((G = {})["immer-nothing"] = true, G);
  var L = W ? Symbol.for("immer-draftable") : "__$immer_draftable";
  var Q = W ? Symbol.for("immer-state") : "__$immer_state";
  var Y = { 0: "Illegal state", 1: "Immer drafts cannot have computed properties", 2: "This object has been frozen and should not be mutated", 3: function(n2) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + n2;
  }, 4: "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.", 5: "Immer forbids circular references", 6: "The first or second argument to `produce` must be a function", 7: "The third argument to `produce` must be a function or undefined", 8: "First argument to `createDraft` must be a plain object, an array, or an immerable object", 9: "First argument to `finishDraft` must be a draft returned by `createDraft`", 10: "The given draft is already finalized", 11: "Object.defineProperty() cannot be used on an Immer draft", 12: "Object.setPrototypeOf() cannot be used on an Immer draft", 13: "Immer only supports deleting array indices", 14: "Immer only supports setting array indices and the 'length' property", 15: function(n2) {
    return "Cannot apply patch, path doesn't resolve: " + n2;
  }, 16: 'Sets cannot have "replace" patches.', 17: function(n2) {
    return "Unsupported patch operation: " + n2;
  }, 18: function(n2) {
    return "The plugin for '" + n2 + "' has not been loaded into Immer. To enable the plugin, import and call `enable" + n2 + "()` when initializing your application.";
  }, 20: "Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available", 21: function(n2) {
    return "produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '" + n2 + "'";
  }, 22: function(n2) {
    return "'current' expects a draft, got: " + n2;
  }, 23: function(n2) {
    return "'original' expects a draft, got: " + n2;
  }, 24: "Patching reserved attributes like __proto__, prototype and constructor is not allowed" };
  var Z = "" + Object.prototype.constructor;
  var nn = "undefined" != typeof Reflect && Reflect.ownKeys ? Reflect.ownKeys : void 0 !== Object.getOwnPropertySymbols ? function(n2) {
    return Object.getOwnPropertyNames(n2).concat(Object.getOwnPropertySymbols(n2));
  } : Object.getOwnPropertyNames;
  var rn = Object.getOwnPropertyDescriptors || function(n2) {
    var r2 = {};
    return nn(n2).forEach((function(t2) {
      r2[t2] = Object.getOwnPropertyDescriptor(n2, t2);
    })), r2;
  };
  var tn = {};
  var en = { get: function(n2, r2) {
    if (r2 === Q) return n2;
    var e = p(n2);
    if (!u(e, r2)) return (function(n3, r3, t2) {
      var e2, i3 = I(r3, t2);
      return i3 ? "value" in i3 ? i3.value : null === (e2 = i3.get) || void 0 === e2 ? void 0 : e2.call(n3.k) : void 0;
    })(n2, e, r2);
    var i2 = e[r2];
    return n2.I || !t(i2) ? i2 : i2 === z(n2.t, r2) ? (E(n2), n2.o[r2] = N(n2.A.h, i2, n2)) : i2;
  }, has: function(n2, r2) {
    return r2 in p(n2);
  }, ownKeys: function(n2) {
    return Reflect.ownKeys(p(n2));
  }, set: function(n2, r2, t2) {
    var e = I(p(n2), r2);
    if (null == e ? void 0 : e.set) return e.set.call(n2.k, t2), true;
    if (!n2.P) {
      var i2 = z(p(n2), r2), o2 = null == i2 ? void 0 : i2[Q];
      if (o2 && o2.t === t2) return n2.o[r2] = t2, n2.R[r2] = false, true;
      if (c(t2, i2) && (void 0 !== t2 || u(n2.t, r2))) return true;
      E(n2), k(n2);
    }
    return n2.o[r2] === t2 && (void 0 !== t2 || r2 in n2.o) || Number.isNaN(t2) && Number.isNaN(n2.o[r2]) || (n2.o[r2] = t2, n2.R[r2] = true), true;
  }, deleteProperty: function(n2, r2) {
    return void 0 !== z(n2.t, r2) || r2 in n2.t ? (n2.R[r2] = false, E(n2), k(n2)) : delete n2.R[r2], n2.o && delete n2.o[r2], true;
  }, getOwnPropertyDescriptor: function(n2, r2) {
    var t2 = p(n2), e = Reflect.getOwnPropertyDescriptor(t2, r2);
    return e ? { writable: true, configurable: 1 !== n2.i || "length" !== r2, enumerable: e.enumerable, value: t2[r2] } : e;
  }, defineProperty: function() {
    n(11);
  }, getPrototypeOf: function(n2) {
    return Object.getPrototypeOf(n2.t);
  }, setPrototypeOf: function() {
    n(12);
  } };
  var on = {};
  i(en, (function(n2, r2) {
    on[n2] = function() {
      return arguments[0] = arguments[0][0], r2.apply(this, arguments);
    };
  })), on.deleteProperty = function(r2, t2) {
    return isNaN(parseInt(t2)) && n(13), on.set.call(this, r2, t2, void 0);
  }, on.set = function(r2, t2, e) {
    return "length" !== t2 && isNaN(parseInt(t2)) && n(14), en.set.call(this, r2[0], t2, e, r2[0]);
  };
  var un = (function() {
    function e(r2) {
      var e2 = this;
      this.O = B, this.D = true, this.produce = function(r3, i3, o2) {
        if ("function" == typeof r3 && "function" != typeof i3) {
          var u2 = i3;
          i3 = r3;
          var a10 = e2;
          return function(n2) {
            var r4 = this;
            void 0 === n2 && (n2 = u2);
            for (var t2 = arguments.length, e3 = Array(t2 > 1 ? t2 - 1 : 0), o3 = 1; o3 < t2; o3++) e3[o3 - 1] = arguments[o3];
            return a10.produce(n2, (function(n3) {
              var t3;
              return (t3 = i3).call.apply(t3, [r4, n3].concat(e3));
            }));
          };
        }
        var f2;
        if ("function" != typeof i3 && n(6), void 0 !== o2 && "function" != typeof o2 && n(7), t(r3)) {
          var c3 = w(e2), s2 = N(e2, r3, void 0), v2 = true;
          try {
            f2 = i3(s2), v2 = false;
          } finally {
            v2 ? g(c3) : O(c3);
          }
          return "undefined" != typeof Promise && f2 instanceof Promise ? f2.then((function(n2) {
            return j(c3, o2), P(n2, c3);
          }), (function(n2) {
            throw g(c3), n2;
          })) : (j(c3, o2), P(f2, c3));
        }
        if (!r3 || "object" != typeof r3) {
          if (void 0 === (f2 = i3(r3)) && (f2 = r3), f2 === H && (f2 = void 0), e2.D && d(f2, true), o2) {
            var p2 = [], l3 = [];
            b("Patches").M(r3, f2, p2, l3), o2(p2, l3);
          }
          return f2;
        }
        n(21, r3);
      }, this.produceWithPatches = function(n2, r3) {
        if ("function" == typeof n2) return function(r4) {
          for (var t3 = arguments.length, i4 = Array(t3 > 1 ? t3 - 1 : 0), o3 = 1; o3 < t3; o3++) i4[o3 - 1] = arguments[o3];
          return e2.produceWithPatches(r4, (function(r5) {
            return n2.apply(void 0, [r5].concat(i4));
          }));
        };
        var t2, i3, o2 = e2.produce(n2, r3, (function(n3, r4) {
          t2 = n3, i3 = r4;
        }));
        return "undefined" != typeof Promise && o2 instanceof Promise ? o2.then((function(n3) {
          return [n3, t2, i3];
        })) : [o2, t2, i3];
      }, "boolean" == typeof (null == r2 ? void 0 : r2.useProxies) && this.setUseProxies(r2.useProxies), "boolean" == typeof (null == r2 ? void 0 : r2.autoFreeze) && this.setAutoFreeze(r2.autoFreeze);
    }
    var i2 = e.prototype;
    return i2.createDraft = function(e2) {
      t(e2) || n(8), r(e2) && (e2 = R(e2));
      var i3 = w(this), o2 = N(this, e2, void 0);
      return o2[Q].C = true, O(i3), o2;
    }, i2.finishDraft = function(r2, t2) {
      var e2 = r2 && r2[Q];
      e2 && e2.C || n(9), e2.I && n(10);
      var i3 = e2.A;
      return j(i3, t2), P(void 0, i3);
    }, i2.setAutoFreeze = function(n2) {
      this.D = n2;
    }, i2.setUseProxies = function(r2) {
      r2 && !B && n(20), this.O = r2;
    }, i2.applyPatches = function(n2, t2) {
      var e2;
      for (e2 = t2.length - 1; e2 >= 0; e2--) {
        var i3 = t2[e2];
        if (0 === i3.path.length && "replace" === i3.op) {
          n2 = i3.value;
          break;
        }
      }
      e2 > -1 && (t2 = t2.slice(e2 + 1));
      var o2 = b("Patches").$;
      return r(n2) ? o2(n2, t2) : this.produce(n2, (function(n3) {
        return o2(n3, t2);
      }));
    }, e;
  })();
  var an = new un();
  var fn = an.produce;
  var cn = an.produceWithPatches.bind(an);
  var sn = an.setAutoFreeze.bind(an);
  var vn = an.setUseProxies.bind(an);
  var pn = an.applyPatches.bind(an);
  var ln = an.createDraft.bind(an);
  var dn = an.finishDraft.bind(an);

  // node_modules/zustand/esm/shallow.js
  function shallow(objA, objB) {
    if (Object.is(objA, objB)) {
      return true;
    }
    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
      return false;
    }
    const keysA = Object.keys(objA);
    if (keysA.length !== Object.keys(objB).length) {
      return false;
    }
    for (let i2 = 0; i2 < keysA.length; i2++) {
      if (!Object.prototype.hasOwnProperty.call(objB, keysA[i2]) || !Object.is(objA[keysA[i2]], objB[keysA[i2]])) {
        return false;
      }
    }
    return true;
  }
  var shallow_default = shallow;

  // node_modules/zustand/esm/vanilla.js
  function create(createState) {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (nextState !== state) {
        const previousState = state;
        state = replace ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const subscribeWithSelector = (listener, selector = getState, equalityFn = Object.is) => {
      let currentSlice = selector(state);
      function listenerToAdd() {
        const nextSlice = selector(state);
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice;
          listener(currentSlice = nextSlice, previousSlice);
        }
      }
      listeners.add(listenerToAdd);
      return () => listeners.delete(listenerToAdd);
    };
    const subscribe = (listener, selector, equalityFn) => {
      if (selector || equalityFn) {
        return subscribeWithSelector(listener, selector, equalityFn);
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const destroy = () => listeners.clear();
    const api = { setState, getState, subscribe, destroy };
    state = createState(setState, getState, api);
    return api;
  }
  var vanilla_default = create;

  // node_modules/@100mslive/hms-video-store/dist/index.js
  var import_eventemitter22 = __toESM(require_eventemitter2());
  var import_eventemitter23 = __toESM(require_eventemitter2());
  var Yt = __toESM(require_lib());
  var import_eventemitter24 = __toESM(require_eventemitter2());
  var co = Object.defineProperty;
  var lo = Object.defineProperties;
  var uo = Object.getOwnPropertyDescriptors;
  var ai = Object.getOwnPropertySymbols;
  var po = Object.getPrototypeOf;
  var gs = Object.prototype.hasOwnProperty;
  var Ts = Object.prototype.propertyIsEnumerable;
  var ho = Reflect.get;
  var Ss = (a10, e, t2) => e in a10 ? co(a10, e, { enumerable: true, configurable: true, writable: true, value: t2 }) : a10[e] = t2;
  var m = (a10, e) => {
    for (var t2 in e || (e = {})) gs.call(e, t2) && Ss(a10, t2, e[t2]);
    if (ai) for (var t2 of ai(e)) Ts.call(e, t2) && Ss(a10, t2, e[t2]);
    return a10;
  };
  var M2 = (a10, e) => lo(a10, uo(e));
  var kr = (a10, e) => {
    var t2 = {};
    for (var i2 in a10) gs.call(a10, i2) && e.indexOf(i2) < 0 && (t2[i2] = a10[i2]);
    if (a10 != null && ai) for (var i2 of ai(a10)) e.indexOf(i2) < 0 && Ts.call(a10, i2) && (t2[i2] = a10[i2]);
    return t2;
  };
  var mo = (a10, e) => () => (e || a10((e = { exports: {} }).exports, e), e.exports);
  var ne = (a10, e, t2) => ho(po(a10), t2, e);
  var c2 = (a10, e, t2) => new Promise((i2, r2) => {
    var s2 = (d2) => {
      try {
        n2(t2.next(d2));
      } catch (u2) {
        r2(u2);
      }
    }, o2 = (d2) => {
      try {
        n2(t2.throw(d2));
      } catch (u2) {
        r2(u2);
      }
    }, n2 = (d2) => d2.done ? i2(d2.value) : Promise.resolve(d2.value).then(s2, o2);
    n2((t2 = t2.apply(a10, e)).next());
  });
  var Ir = mo((Jc, Eo) => {
    Eo.exports = { version: "0.12.39", license: "MIT", repository: { type: "git", url: "https://github.com/100mslive/web-sdks.git", directory: "packages/hms-video-store" }, main: "dist/index.cjs.js", module: "dist/index.js", typings: "dist/index.d.ts", files: ["dist", "src"], engines: { node: ">=12" }, exports: { ".": { require: "./dist/index.cjs.js", import: "./dist/index.js", default: "./dist/index.js" } }, sideEffects: false, scripts: { prestart: "rm -rf dist && yarn types:build", start: 'concurrently "yarn dev" "yarn types"', dev: "node ../../scripts/dev", "build:only": "node ../../scripts/build", build: "yarn build:only && yarn types:build", types: "tsc -w", "types:build": "tsc -p tsconfig.json", format: "prettier --write src/**/*.ts", test: "jest --maxWorkers=1", "test:watch": "jest --watch", "test:coverage": "jest --coverage", lint: "eslint -c ../../.eslintrc .", "lint:fix": "yarn lint --fix", prepare: "yarn build", size: "size-limit", analyze: "size-limit --why", docs: "rm -rf ./docs && typedoc && rm -f ./docs/README.md && mkdir ./docs/home &&mv ./docs/modules.md ./docs/home/content.md && node ../../scripts/docs-store && npx prettier --write './docs/**/*'" }, name: "@100mslive/hms-video-store", author: "100ms", dependencies: { eventemitter2: "^6.4.9", immer: "^9.0.6", "lodash.isequal": "^4.5.0", reselect: "4.0.0", "sdp-transform": "^2.14.1", "ua-parser-js": "^1.0.1", uuid: "^8.3.2", "webrtc-adapter": "^8.0.0", zustand: "3.5.7" }, devDependencies: { "@types/dom-screen-wake-lock": "^1.0.1", "@types/lodash.isequal": "^4.5.8", "@types/sdp-transform": "^2.4.4", "@types/ua-parser-js": "^0.7.36", "@types/uuid": "^8.3.0", "jest-canvas-mock": "^2.3.1", "jsdom-worker": "^0.3.0", tslib: "^2.2.0" }, description: "@100mslive Core SDK which abstracts the complexities of webRTC while providing a reactive store for data management with a unidirectional data flow", keywords: ["video", "webrtc", "conferencing", "100ms"], gitHead: "42f8cd96ebaaca99872c8dae510b747e6ccd02fb" };
  });
  var Er = ((n2) => (n2.Disconnected = "Disconnected", n2.Preview = "Preview", n2.Connecting = "Connecting", n2.Connected = "Connected", n2.Reconnecting = "Reconnecting", n2.Disconnecting = "Disconnecting", n2.Failed = "Failed", n2))(Er || {});
  var oi = () => ({ room: { id: "", isConnected: false, name: "", peers: [], localPeer: "", roomState: "Disconnected", recording: { browser: { running: false }, server: { running: false }, hls: { running: false } }, rtmp: { running: false }, hls: { running: false, variants: [] }, sessionId: "" }, peers: {}, tracks: {}, playlist: { audio: { list: {}, selection: { id: "", hasPrevious: false, hasNext: false }, progress: 0, volume: 0, currentTime: 0, playbackRate: 1 }, video: { list: {}, selection: { id: "", hasPrevious: false, hasNext: false }, progress: 0, volume: 0, currentTime: 0, playbackRate: 1 } }, messages: { byID: {}, allIDs: [] }, speakers: {}, connectionQualities: {}, settings: { audioInputDeviceId: "", audioOutputDeviceId: "", videoInputDeviceId: "" }, devices: { audioInput: [], audioOutput: [], videoInput: [] }, roles: {}, roleChangeRequests: [], errors: [], sessionStore: {}, templateAppData: {}, polls: {}, whiteboards: {}, hideLocalPeer: false });
  var ni = () => ({ peerStats: {}, remoteTrackStats: {}, localTrackStats: {}, localPeer: { id: "" } });
  var So = ((e) => (e.CHAT = "chat", e))(So || {});
  var fs = ((t2) => (t2.INFO = "info", t2.ERROR = "error", t2))(fs || {});
  var Pr = ((w2) => (w2.PEER_JOINED = "PEER_JOINED", w2.PEER_LEFT = "PEER_LEFT", w2.PEER_LIST = "PEER_LIST", w2.NEW_MESSAGE = "NEW_MESSAGE", w2.ERROR = "ERROR", w2.RECONNECTING = "RECONNECTING", w2.RECONNECTED = "RECONNECTED", w2.TRACK_ADDED = "TRACK_ADDED", w2.TRACK_REMOVED = "TRACK_REMOVED", w2.TRACK_MUTED = "TRACK_MUTED", w2.TRACK_UNMUTED = "TRACK_UNMUTED", w2.TRACK_DEGRADED = "TRACK_DEGRADED", w2.TRACK_RESTORED = "TRACK_RESTORED", w2.TRACK_DESCRIPTION_CHANGED = "TRACK_DESCRIPTION_CHANGED", w2.ROLE_UPDATED = "ROLE_UPDATED", w2.CHANGE_TRACK_STATE_REQUEST = "CHANGE_TRACK_STATE_REQUEST", w2.CHANGE_MULTI_TRACK_STATE_REQUEST = "CHANGE_MULTI_TRACK_STATE_REQUEST", w2.ROOM_ENDED = "ROOM_ENDED", w2.REMOVED_FROM_ROOM = "REMOVED_FROM_ROOM", w2.DEVICE_CHANGE_UPDATE = "DEVICE_CHANGE_UPDATE", w2.PLAYLIST_TRACK_ENDED = "PLAYLIST_TRACK_ENDED", w2.NAME_UPDATED = "NAME_UPDATED", w2.METADATA_UPDATED = "METADATA_UPDATED", w2.POLL_CREATED = "POLL_CREATED", w2.POLL_STARTED = "POLL_STARTED", w2.POLL_STOPPED = "POLL_STOPPED", w2.POLL_VOTES_UPDATED = "POLL_VOTES_UPDATED", w2.POLLS_LIST = "POLLS_LIST", w2.HAND_RAISE_CHANGED = "HAND_RAISE_CHANGED", w2.TRANSCRIPTION_STATE_UPDATED = "TRANSCRIPTION_STATE_UPDATED", w2))(Pr || {});
  var vs = ((t2) => (t2.audio = "audio", t2.video = "video", t2))(vs || {});
  function Fe(a10, e) {
    let t2, i2;
    if (e) for (let r2 of e.auxiliaryTracks) {
      let s2 = a10[r2];
      go(s2) && (i2 = gt(s2) ? s2 : i2, t2 = Tt(s2) ? s2 : t2);
    }
    return { video: t2, audio: i2 };
  }
  function gt(a10) {
    return a10 && a10.type === "audio";
  }
  function Tt(a10) {
    return a10 && a10.type === "video";
  }
  function go(a10) {
    return a10 && a10.source === "screen";
  }
  function ci(a10) {
    return a10 && a10.source === "audioplaylist";
  }
  function ft(a10) {
    return a10 && a10.source === "videoplaylist";
  }
  function Ms(a10) {
    return a10 ? !!(a10 != null && a10.degraded) : false;
  }
  function ze(a10, e) {
    return e && a10.tracks[e] ? a10.tracks[e].enabled : false;
  }
  function ys(a10, e) {
    return e && a10.tracks[e] ? a10.tracks[e].displayEnabled : false;
  }
  function vt(a10) {
    var r2;
    let e = false, t2 = false, i2 = false;
    return (r2 = a10 == null ? void 0 : a10.publishParams) != null && r2.allowed && (e = a10.publishParams.allowed.includes("video"), t2 = a10.publishParams.allowed.includes("audio"), i2 = a10.publishParams.allowed.includes("screen")), { video: e, audio: t2, screen: i2 };
  }
  var ks = ((d2) => (d2[d2.VERBOSE = 0] = "VERBOSE", d2[d2.DEBUG = 1] = "DEBUG", d2[d2.INFO = 2] = "INFO", d2[d2.WARN = 3] = "WARN", d2[d2.TIME = 4] = "TIME", d2[d2.TIMEEND = 5] = "TIMEEND", d2[d2.ERROR = 6] = "ERROR", d2[d2.NONE = 7] = "NONE", d2))(ks || {});
  var To = typeof window != "undefined" && typeof window.expect != "undefined";
  var l2 = class {
    static v(e, ...t2) {
      this.log(0, e, ...t2);
    }
    static d(e, ...t2) {
      this.log(1, e, ...t2);
    }
    static i(e, ...t2) {
      this.log(2, e, ...t2);
    }
    static w(e, ...t2) {
      this.log(3, e, ...t2);
    }
    static e(e, ...t2) {
      this.log(6, e, ...t2);
    }
    static time(e) {
      this.log(4, "[HMSPerformanceTiming]", e);
    }
    static timeEnd(e) {
      this.log(5, "[HMSPerformanceTiming]", e, e);
    }
    static cleanup() {
      performance.clearMarks(), performance.clearMeasures();
    }
    static log(e, t2, ...i2) {
      if (!(this.level.valueOf() > e.valueOf())) switch (e) {
        case 0: {
          console.log(t2, ...i2);
          break;
        }
        case 1: {
          console.debug(t2, ...i2);
          break;
        }
        case 2: {
          console.info(t2, ...i2);
          break;
        }
        case 3: {
          console.warn(t2, ...i2);
          break;
        }
        case 6: {
          console.error(t2, ...i2);
          break;
        }
        case 4: {
          performance.mark(i2[0]);
          break;
        }
        case 5: {
          let r2 = i2[0];
          try {
            let s2 = performance.measure(r2, r2);
            this.log(1, t2, r2, s2 == null ? void 0 : s2.duration), performance.clearMarks(r2), performance.clearMeasures(r2);
          } catch (s2) {
            this.log(1, t2, r2, s2);
          }
          break;
        }
      }
    }
  };
  l2.level = To ? 7 : 0;
  var Ye = class {
    constructor(e) {
      this.tracks = new Array();
      this.nativeStream = e, this.id = e.id;
    }
    updateId(e) {
      this.id = e;
    }
  };
  var fe = new import_ua_parser_js.UAParser();
  var U2 = typeof window != "undefined";
  var Es;
  var Ge = typeof window == "undefined" && !((Es = fe.getBrowser().name) != null && Es.toLowerCase().includes("electron"));
  var vo = () => !Ge;
  var Tc = vo();
  var Mt = () => fe.getDevice().type === "mobile";
  var Rs = () => typeof document != "undefined" && document.hidden;
  var Hs = () => {
    var a10;
    return ((a10 = fe.getOS().name) == null ? void 0 : a10.toLowerCase()) === "ios";
  };
  var Ps;
  var bs;
  var Cs = (bs = (Ps = fe.getBrowser()) == null ? void 0 : Ps.name) == null ? void 0 : bs.toLowerCase().includes("safari");
  var As;
  var Is;
  var di = ((Is = (As = fe.getBrowser()) == null ? void 0 : As.name) == null ? void 0 : Is.toLowerCase()) === "firefox";
  var Ls = ((i2) => (i2.CUSTOM = "CUSTOM", i2.LOCAL = "LOCAL", i2.HMS = "HMS", i2))(Ls || {});
  function Mo() {
    if (U2 && window) {
      let a10 = window.location.hostname;
      return a10 === "localhost" || a10 === "127.0.0.1" ? "LOCAL" : a10.includes("app.100ms.live") ? "HMS" : "CUSTOM";
    }
    return "CUSTOM";
  }
  var Xe = Mo();
  var k2 = { WebSocketConnectionErrors: { FAILED_TO_CONNECT: 1e3, WEBSOCKET_CONNECTION_LOST: 1003, ABNORMAL_CLOSE: 1006 }, APIErrors: { SERVER_ERRORS: 2e3, INIT_CONFIG_NOT_AVAILABLE: 2002, ENDPOINT_UNREACHABLE: 2003, INVALID_TOKEN_FORMAT: 2004 }, TracksErrors: { GENERIC_TRACK: 3e3, CANT_ACCESS_CAPTURE_DEVICE: 3001, DEVICE_NOT_AVAILABLE: 3002, DEVICE_IN_USE: 3003, DEVICE_LOST_MIDWAY: 3004, NOTHING_TO_RETURN: 3005, INVALID_VIDEO_SETTINGS: 3006, CODEC_CHANGE_NOT_PERMITTED: 3007, AUTOPLAY_ERROR: 3008, OVER_CONSTRAINED: 3009, NO_AUDIO_DETECTED: 3010, SYSTEM_DENIED_PERMISSION: 3011, CURRENT_TAB_NOT_SHARED: 3012, AUDIO_PLAYBACK_ERROR: 3013, SELECTED_DEVICE_MISSING: 3014, NO_DATA: 3015 }, WebrtcErrors: { CREATE_OFFER_FAILED: 4001, CREATE_ANSWER_FAILED: 4002, SET_LOCAL_DESCRIPTION_FAILED: 4003, SET_REMOTE_DESCRIPTION_FAILED: 4004, ICE_FAILURE: 4005, ICE_DISCONNECTED: 4006, STATS_FAILED: 4007 }, WebsocketMethodErrors: { SERVER_ERRORS: 5e3, ALREADY_JOINED: 5001, CANNOT_JOIN_PREVIEW_IN_PROGRESS: 5002 }, GenericErrors: { NOT_CONNECTED: 6e3, SIGNALLING: 6001, UNKNOWN: 6002, NOT_READY: 6003, JSON_PARSING_FAILED: 6004, TRACK_METADATA_MISSING: 6005, RTC_TRACK_MISSING: 6006, PEER_METADATA_MISSING: 6007, INVALID_ROLE: 6008, PREVIEW_IN_PROGRESS: 6009, MISSING_MEDIADEVICES: 6010, MISSING_RTCPEERCONNECTION: 6011, LOCAL_STORAGE_ACCESS_DENIED: 6012, VALIDATION_FAILED: 6013 }, PlaylistErrors: { NO_ENTRY_TO_PLAY: 8001, NO_ENTRY_IS_PLAYING: 8002 } };
  var E2 = class a2 extends Error {
    constructor(t2, i2, r2, s2, o2, n2 = false) {
      super(s2);
      this.code = t2;
      this.name = i2;
      this.message = s2;
      this.description = o2;
      this.isTerminal = n2;
      Object.setPrototypeOf(this, a2.prototype), this.action = r2.toString();
    }
    toAnalyticsProperties() {
      return { error_name: this.name, error_code: this.code, error_message: this.message, error_description: this.description, action: this.action, is_terminal: this.isTerminal };
    }
    addNativeError(t2) {
      this.nativeError = t2;
    }
    toString() {
      var t2;
      return `{
        code: ${this.code};
        name: ${this.name};
        action: ${this.action};
        message: ${this.message};
        description: ${this.description};
        isTerminal: ${this.isTerminal};
        nativeError: ${(t2 = this.nativeError) == null ? void 0 : t2.message};
      }`;
    }
  };
  var W2 = class extends E2 {
    constructor(t2, i2, r2, s2, o2, n2) {
      super(t2, i2, r2, s2, o2, false);
      this.code = t2;
      this.name = i2;
      this.message = s2;
      this.description = o2;
      this.trackType = n2;
    }
    toAnalyticsProperties() {
      return M2(m({}, super.toAnalyticsProperties()), { track_type: this.trackType });
    }
    toString() {
      var t2;
      return `{
        code: ${this.code};
        name: ${this.name};
        action: ${this.action};
        message: ${this.message};
        description: ${this.description};
        isTerminal: ${this.isTerminal};
        nativeError: ${(t2 = this.nativeError) == null ? void 0 : t2.message};
        trackType: ${this.trackType};
      }`;
    }
  };
  var Ds = ((r2) => (r2.AUDIO = "audio", r2.VIDEO = "video", r2.AUDIO_VIDEO = "audio, video", r2.SCREEN = "screen", r2))(Ds || {});
  function br(a10) {
    switch (a10) {
      case "join":
        return "JOIN";
      case "offer":
        return "PUBLISH";
      case "answer":
        return "SUBSCRIBE";
      case "track-update":
        return "TRACK";
      default:
        return "NONE";
    }
  }
  var yo = ["join", "offer", "answer", "trickle", "on-error", "JOIN"];
  var S2 = { WebSocketConnectionErrors: { FailedToConnect(a10, e = "") {
    return new E2(k2.WebSocketConnectionErrors.FAILED_TO_CONNECT, "WebsocketFailedToConnect", a10, `[WS]: ${e}`, `[WS]: ${e}`);
  }, WebSocketConnectionLost(a10, e = "") {
    return new E2(k2.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST, "WebSocketConnectionLost", a10, "Network connection lost", e);
  }, AbnormalClose(a10, e = "") {
    return new E2(k2.WebSocketConnectionErrors.ABNORMAL_CLOSE, "WebSocketAbnormalClose", a10, "Websocket closed abnormally", e);
  } }, APIErrors: { ServerErrors(a10, e, t2 = "", i2 = true) {
    return new E2(a10, "ServerErrors", e, `[${e}]: Server error ${t2}`, t2, i2);
  }, EndpointUnreachable(a10, e = "") {
    return new E2(k2.APIErrors.ENDPOINT_UNREACHABLE, "EndpointUnreachable", a10, `Endpoint is not reachable - ${e}`, e);
  }, InvalidTokenFormat(a10, e = "") {
    return new E2(k2.APIErrors.INVALID_TOKEN_FORMAT, "InvalidTokenFormat", a10, `Token is not in proper JWT format - ${e}`, e, true);
  }, InitConfigNotAvailable(a10, e = "") {
    return new E2(k2.APIErrors.INIT_CONFIG_NOT_AVAILABLE, "InitError", a10, `[INIT]: ${e}`, `[INIT]: ${e}`);
  } }, TracksErrors: { GenericTrack(a10, e = "") {
    return new W2(k2.TracksErrors.GENERIC_TRACK, "GenericTrack", a10, `[TRACK]: ${e}`, `[TRACK]: ${e}`, "audio, video");
  }, CantAccessCaptureDevice(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE, "CantAccessCaptureDevice", a10, `User denied permission to access capture device - ${e}`, t2, e);
  }, DeviceNotAvailable(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.DEVICE_NOT_AVAILABLE, "DeviceNotAvailable", a10, `[TRACK]: Capture device is no longer available - ${e}`, t2, e);
  }, DeviceInUse(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.DEVICE_IN_USE, "DeviceInUse", a10, `[TRACK]: Capture device is in use by another application - ${e}`, t2, e);
  }, DeviceLostMidway(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.DEVICE_LOST_MIDWAY, "DeviceLostMidway", a10, `Lost access to capture device midway - ${e}`, t2, e);
  }, NothingToReturn(a10, e = "", t2 = "There is no media to return. Please select either video or audio or both.") {
    return new W2(k2.TracksErrors.NOTHING_TO_RETURN, "NothingToReturn", a10, t2, e, "audio, video");
  }, InvalidVideoSettings(a10, e = "") {
    return new W2(k2.TracksErrors.INVALID_VIDEO_SETTINGS, "InvalidVideoSettings", a10, "Cannot enable simulcast when no video settings are provided", e, "video");
  }, AutoplayBlocked(a10, e = "") {
    return new W2(k2.TracksErrors.AUTOPLAY_ERROR, "AutoplayBlocked", a10, "Autoplay blocked because the user didn't interact with the document first", e, "audio");
  }, CodecChangeNotPermitted(a10, e = "") {
    return new W2(k2.TracksErrors.CODEC_CHANGE_NOT_PERMITTED, "CodecChangeNotPermitted", a10, "Codec can't be changed mid call.", e, "audio, video");
  }, OverConstrained(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.OVER_CONSTRAINED, "OverConstrained", a10, `[TRACK]: Requested constraints cannot be satisfied with the device hardware - ${e}`, t2, e);
  }, NoAudioDetected(a10, e = "Please check the mic or use another audio input") {
    return new W2(k2.TracksErrors.NO_AUDIO_DETECTED, "NoAudioDetected", a10, "No audio input detected from microphone", e, "audio");
  }, SystemDeniedPermission(a10, e, t2 = "") {
    return new W2(k2.TracksErrors.SYSTEM_DENIED_PERMISSION, "SystemDeniedPermission", a10, `Operating System denied permission to access capture device - ${e}`, t2, e);
  }, CurrentTabNotShared() {
    return new W2(k2.TracksErrors.CURRENT_TAB_NOT_SHARED, "CurrentTabNotShared", "TRACK", "The app requires you to share the current tab", "You must screen share the current tab in order to proceed", "screen");
  }, AudioPlaybackError(a10) {
    return new W2(k2.TracksErrors.AUDIO_PLAYBACK_ERROR, "Audio playback error", "TRACK", a10, a10, "audio");
  }, SelectedDeviceMissing(a10) {
    return new W2(k2.TracksErrors.SELECTED_DEVICE_MISSING, "SelectedDeviceMissing", "TRACK", `Could not detect selected ${a10} device`, `Please check connection to the ${a10} device`, a10);
  }, NoDataInTrack(a10) {
    return new W2(k2.TracksErrors.NO_DATA, "Track does not have any data", "TRACK", a10, "This could possibily due to another application taking priority over the access to camera or microphone or due to an incoming call", "audio, video");
  } }, WebrtcErrors: { CreateOfferFailed(a10, e = "") {
    return new E2(k2.WebrtcErrors.CREATE_OFFER_FAILED, "CreateOfferFailed", a10, `[${a10.toString()}]: Failed to create offer. `, e);
  }, CreateAnswerFailed(a10, e = "") {
    return new E2(k2.WebrtcErrors.CREATE_ANSWER_FAILED, "CreateAnswerFailed", a10, `[${a10.toString()}]: Failed to create answer. `, e);
  }, SetLocalDescriptionFailed(a10, e = "") {
    return new E2(k2.WebrtcErrors.SET_LOCAL_DESCRIPTION_FAILED, "SetLocalDescriptionFailed", a10, `[${a10.toString()}]: Failed to set offer. `, e);
  }, SetRemoteDescriptionFailed(a10, e = "") {
    return new E2(k2.WebrtcErrors.SET_REMOTE_DESCRIPTION_FAILED, "SetRemoteDescriptionFailed", a10, `[${a10.toString()}]: Failed to set answer. `, e, true);
  }, ICEFailure(a10, e = "", t2 = false) {
    return new E2(k2.WebrtcErrors.ICE_FAILURE, "ICEFailure", a10, `[${a10.toString()}]: Ice connection state FAILED`, e, t2);
  }, ICEDisconnected(a10, e = "") {
    return new E2(k2.WebrtcErrors.ICE_DISCONNECTED, "ICEDisconnected", a10, `[${a10.toString()}]: Ice connection state DISCONNECTED`, e);
  }, StatsFailed(a10, e = "") {
    return new E2(k2.WebrtcErrors.STATS_FAILED, "StatsFailed", a10, `Failed to WebRTC get stats - ${e}`, e);
  } }, WebsocketMethodErrors: { ServerErrors(a10, e, t2) {
    return new E2(a10, "ServerErrors", e, t2, t2, yo.includes(e));
  }, AlreadyJoined(a10, e = "") {
    return new E2(k2.WebsocketMethodErrors.ALREADY_JOINED, "AlreadyJoined", a10, "[JOIN]: You have already joined this room.", e);
  }, CannotJoinPreviewInProgress(a10, e = "") {
    return new E2(k2.WebsocketMethodErrors.CANNOT_JOIN_PREVIEW_IN_PROGRESS, "CannotJoinPreviewInProgress", a10, "[JOIN]: Cannot join if preview is in progress", e);
  } }, GenericErrors: { NotConnected(a10, e = "") {
    return new E2(k2.GenericErrors.NOT_CONNECTED, "NotConnected", a10, "Client is not connected", e);
  }, Signalling(a10, e) {
    return new E2(k2.GenericErrors.SIGNALLING, "Signalling", a10, `Unknown signalling error: ${a10.toString()} ${e} `, e);
  }, Unknown(a10, e) {
    return new E2(k2.GenericErrors.UNKNOWN, "Unknown", a10, `Unknown exception: ${e}`, e);
  }, NotReady(a10, e = "") {
    return new E2(k2.GenericErrors.NOT_READY, "NotReady", a10, e, e);
  }, JsonParsingFailed(a10, e, t2 = "") {
    return new E2(k2.GenericErrors.JSON_PARSING_FAILED, "JsonParsingFailed", a10, `Failed to parse JSON message - ${e}`, t2);
  }, TrackMetadataMissing(a10, e = "") {
    return new E2(k2.GenericErrors.TRACK_METADATA_MISSING, "TrackMetadataMissing", a10, "Track Metadata Missing", e);
  }, RTCTrackMissing(a10, e = "") {
    return new E2(k2.GenericErrors.RTC_TRACK_MISSING, "RTCTrackMissing", a10, "RTC Track missing", e);
  }, PeerMetadataMissing(a10, e = "") {
    return new E2(k2.GenericErrors.PEER_METADATA_MISSING, "PeerMetadataMissing", a10, "Peer Metadata Missing", e);
  }, ValidationFailed(a10, e) {
    return new E2(k2.GenericErrors.VALIDATION_FAILED, "ValidationFailed", "VALIDATION", a10, e ? JSON.stringify(e) : "");
  }, InvalidRole(a10, e) {
    return new E2(k2.GenericErrors.INVALID_ROLE, "InvalidRole", a10, "Invalid role. Join with valid role", e, true);
  }, PreviewAlreadyInProgress(a10, e = "") {
    return new E2(k2.GenericErrors.PREVIEW_IN_PROGRESS, "PreviewAlreadyInProgress", a10, "[Preview]: Cannot join if preview is in progress", e);
  }, LocalStorageAccessDenied(a10 = "Access to localStorage has been denied") {
    return new E2(k2.GenericErrors.LOCAL_STORAGE_ACCESS_DENIED, "LocalStorageAccessDenied", "NONE", "LocalStorageAccessDenied", a10);
  }, MissingMediaDevices() {
    return new E2(k2.GenericErrors.MISSING_MEDIADEVICES, "MissingMediaDevices", "JOIN", "navigator.mediaDevices is undefined. 100ms SDK won't work on this website as WebRTC is not supported on HTTP endpoints(missing navigator.mediaDevices). Please ensure you're using the SDK either on localhost or a valid HTTPS endpoint.", "", true);
  }, MissingRTCPeerConnection() {
    return new E2(k2.GenericErrors.MISSING_RTCPEERCONNECTION, "MissingRTCPeerConnection", "JOIN", "RTCPeerConnection which is a core requirement for WebRTC call was not found, this could be due to an unsupported browser or browser extensions blocking WebRTC", "", true);
  } }, MediaPluginErrors: { PlatformNotSupported(a10, e = "") {
    return new E2(7001, "PlatformNotSupported", a10, "Check HMS Docs to see the list of supported platforms", e);
  }, InitFailed(a10, e = "") {
    return new E2(7002, "InitFailed", a10, "Plugin init failed", e);
  }, ProcessingFailed(a10, e = "") {
    return new E2(7003, "ProcessingFailed", a10, "Plugin processing failed", e);
  }, AddAlreadyInProgress(a10, e = "") {
    return new E2(7004, "AddAlreadyInProgress", a10, "Plugin add already in progress", e);
  }, DeviceNotSupported(a10, e = "") {
    return new E2(7005, "DeviceNotSupported", a10, "Check HMS Docs to see the list of supported devices", e);
  } }, PlaylistErrors: { NoEntryToPlay(a10, e) {
    return new E2(k2.PlaylistErrors.NO_ENTRY_TO_PLAY, "NoEntryToPlay", a10, "Reached end of playlist", e);
  }, NoEntryPlaying(a10, e) {
    return new E2(k2.PlaylistErrors.NO_ENTRY_IS_PLAYING, "NoEntryIsPlaying", a10, "No entry is playing at this time", e);
  } } };
  var Ar = class {
    constructor() {
      this.valuesMap = /* @__PURE__ */ new Map();
    }
    getItem(e) {
      return this.valuesMap.has(e) ? String(this.valuesMap.get(e)) : null;
    }
    setItem(e, t2) {
      this.valuesMap.set(e, t2);
    }
    removeItem(e) {
      this.valuesMap.delete(e);
    }
    clear() {
      this.valuesMap.clear();
    }
    key(e) {
      if (arguments.length === 0) throw new TypeError("Failed to execute 'key' on 'Storage': 1 argument required, but only 0 present.");
      return Array.from(this.valuesMap.keys())[e];
    }
    get length() {
      return this.valuesMap.size;
    }
  };
  var ws = () => {
    try {
      U2 && !localStorage && (window.localStorage = new Ar());
    } catch (a10) {
      l2.e("Error initialising localStorage", S2.GenericErrors.LocalStorageAccessDenied());
    }
  };
  var ve = class {
    constructor(e) {
      this.key = e;
      this.storage = null;
    }
    getStorage() {
      try {
        return U2 && !this.storage && (ws(), this.storage = window.localStorage), this.storage;
      } catch (e) {
        return l2.e("Error initialising localStorage", S2.GenericErrors.LocalStorageAccessDenied()), null;
      }
    }
    get() {
      var i2;
      let e = (i2 = this.getStorage()) == null ? void 0 : i2.getItem(this.key);
      return e ? JSON.parse(e) : void 0;
    }
    set(e) {
      var i2;
      let t2 = JSON.stringify(e);
      (i2 = this.getStorage()) == null || i2.setItem(this.key, t2);
    }
    clear() {
      var e;
      (e = this.getStorage()) == null || e.removeItem(this.key);
    }
  };
  var li = () => {
    let a10, e = new ve("hms-analytics-deviceId"), t2 = e.get();
    return t2 ? a10 = t2 : (a10 = v4_default(), e.set(a10)), a10;
  };
  var _s = "[VALIDATIONS]";
  function he(a10) {
    return a10 != null;
  }
  var yt = () => {
    if (!he(RTCPeerConnection)) {
      let a10 = S2.GenericErrors.MissingRTCPeerConnection();
      throw l2.e(_s, a10), a10;
    }
  };
  var kt = () => {
    if (!he(navigator.mediaDevices)) {
      let a10 = S2.GenericErrors.MissingMediaDevices();
      throw l2.e(_s, a10), a10;
    }
  };
  var Ns = (a10) => {
    if (!a10.getPublishParams()) throw S2.GenericErrors.NotConnected("VALIDATION", "call addTrack after preview or join is successful");
  };
  var Os = Ir().version;
  function Et(a10 = "prod", e) {
    let t2 = "web", i2 = Xe !== "LOCAL" && a10 === "prod" ? "prod" : "debug";
    if (Ge) return xs({ os: "web_nodejs", os_version: process.version, sdk: t2, sdk_version: Os, env: i2, domain: Xe, is_prebuilt: !!(e != null && e.isPrebuilt), framework: "node", framework_version: process.version, framework_sdk_version: e == null ? void 0 : e.sdkVersion });
    let r2 = fe.getOS(), s2 = fe.getDevice(), o2 = fe.getBrowser(), n2 = Rr(`web_${r2.name}`), d2 = r2.version || "", u2 = Rr(`${o2.name}_${o2.version}`), p2 = u2;
    return s2.type && (p2 = `${Rr(`${s2.vendor}_${s2.type}`)}/${u2}`), xs({ os: n2, os_version: d2, sdk: t2, sdk_version: Os, device_model: p2, env: i2, domain: Xe, is_prebuilt: !!(e != null && e.isPrebuilt), framework: e == null ? void 0 : e.type, framework_version: e == null ? void 0 : e.version, framework_sdk_version: e == null ? void 0 : e.sdkVersion });
  }
  function Rr(a10) {
    return a10.replace(/ /g, "_");
  }
  var xs = (a10, e = ",") => Object.keys(a10).filter((t2) => he(a10[t2])).map((t2) => `${t2}:${a10[t2]}`).join(e);
  var C = class {
    constructor({ name: e, level: t2, properties: i2, includesPII: r2, timestamp: s2 }) {
      this.metadata = { peer: {}, userAgent: Et() };
      this.name = e, this.level = t2, this.includesPII = r2 || false, this.properties = i2 || {}, this.timestamp = s2 || (/* @__PURE__ */ new Date()).getTime(), this.event_id = v4_default(), this.device_id = li();
    }
    toSignalParams() {
      return { name: this.name, info: M2(m({}, this.properties), { timestamp: this.timestamp, domain: Xe }), timestamp: (/* @__PURE__ */ new Date()).getTime() };
    }
  };
  var y2 = class {
    static connect(e, t2, i2 = /* @__PURE__ */ new Date(), r2 = /* @__PURE__ */ new Date(), s2) {
      let o2 = this.eventNameFor("connect", e === void 0), n2 = e ? 2 : 1, d2 = this.getPropertiesWithError(M2(m({}, t2), { [this.KEY_REQUESTED_AT]: i2 == null ? void 0 : i2.getTime(), [this.KEY_RESPONDED_AT]: r2 == null ? void 0 : r2.getTime(), endpoint: s2 }), e);
      return new C({ name: o2, level: n2, properties: d2 });
    }
    static disconnect(e, t2) {
      let i2 = "disconnected", r2 = e ? 2 : 1, s2 = this.getPropertiesWithError(t2, e);
      return new C({ name: i2, level: r2, properties: s2 });
    }
    static preview(i2) {
      var r2 = i2, { error: e } = r2, t2 = kr(r2, ["error"]);
      let s2 = this.eventNameFor("preview", e === void 0), o2 = e ? 2 : 1, n2 = this.getPropertiesWithError(t2, e);
      return new C({ name: s2, level: o2, properties: n2 });
    }
    static join(i2) {
      var r2 = i2, { error: e } = r2, t2 = kr(r2, ["error"]);
      let s2 = this.eventNameFor("join", e === void 0), o2 = e ? 2 : 1, n2 = this.getPropertiesWithError(M2(m({}, t2), { is_preview_called: !!t2.is_preview_called }), e);
      return new C({ name: s2, level: o2, properties: n2 });
    }
    static publish({ devices: e, settings: t2, error: i2 }) {
      let r2 = this.eventNameFor("publish", i2 === void 0), s2 = i2 ? 2 : 1, o2 = this.getPropertiesWithError({ devices: e, audio: t2 == null ? void 0 : t2.audio, video: t2 == null ? void 0 : t2.video }, i2);
      return new C({ name: r2, level: s2, properties: o2 });
    }
    static hlsPlayerError(e) {
      return new C({ name: "hlsPlayerError", level: 2, properties: this.getErrorProperties(e) });
    }
    static subscribeFail(e) {
      let t2 = this.eventNameFor("subscribe", false), i2 = 2, r2 = this.getErrorProperties(e);
      return new C({ name: t2, level: i2, properties: r2 });
    }
    static leave() {
      return new C({ name: "leave", level: 1 });
    }
    static autoplayError() {
      return new C({ name: "autoplayError", level: 2 });
    }
    static audioPlaybackError(e) {
      return new C({ name: "audioPlaybackError", level: 2, properties: this.getErrorProperties(e) });
    }
    static audioRecovered(e) {
      return new C({ name: "audioRecovered", level: 1, properties: { message: e } });
    }
    static permissionChange(e, t2) {
      return new C({ name: "permissionChanged", level: 1, properties: { message: `Perrmission for ${e} changed to ${t2}` } });
    }
    static deviceChange({ isUserSelection: e, selection: t2, type: i2, devices: r2, error: s2 }) {
      let o2 = this.eventNameFor(s2 ? "publish" : `device.${i2}`, s2 === void 0), n2 = s2 ? 2 : 1, d2 = this.getPropertiesWithError({ selection: t2, devices: r2, isUserSelection: e }, s2);
      return new C({ name: o2, level: n2, properties: d2 });
    }
    static performance(e) {
      let t2 = "perf.stats", i2 = 1, r2 = e.toAnalyticsProperties();
      return new C({ name: t2, level: i2, properties: r2 });
    }
    static rtcStats(e) {
      let t2 = "rtc.stats", i2 = 1, r2 = e.toAnalyticsProperties();
      return new C({ name: t2, level: i2, properties: r2 });
    }
    static rtcStatsFailed(e) {
      let t2 = "rtc.stats.failed", i2 = 2;
      return new C({ name: t2, level: i2, properties: this.getErrorProperties(e) });
    }
    static degradationStats(e, t2) {
      let i2 = "video.degradation.stats", r2 = 1, s2 = { degradedAt: e.degradedAt, trackId: e.trackId };
      if (!t2 && e.degradedAt instanceof Date) {
        let o2 = /* @__PURE__ */ new Date(), n2 = o2.valueOf() - e.degradedAt.valueOf();
        s2 = M2(m({}, s2), { duration: n2, restoredAt: o2 });
      }
      return new C({ name: i2, level: r2, properties: s2 });
    }
    static audioDetectionFail(e, t2) {
      let i2 = this.getPropertiesWithError({ device: t2 }, e), r2 = 2, s2 = "audiopresence.failed";
      return new C({ name: s2, level: r2, properties: i2 });
    }
    static previewNetworkQuality(e) {
      return new C({ name: "perf.networkquality.preview", level: e.error ? 2 : 1, properties: e });
    }
    static publishStats(e) {
      return new C({ name: "publisher.stats", level: 1, properties: e });
    }
    static subscribeStats(e) {
      return new C({ name: "subscriber.stats", level: 1, properties: e });
    }
    static getKrispUsage(e) {
      return new C({ name: "krisp.usage", level: 1, properties: { duration: e } });
    }
    static krispStart() {
      return new C({ name: "krisp.start", level: 1 });
    }
    static krispStop() {
      return new C({ name: "krisp.stop", level: 1 });
    }
    static interruption({ started: e, type: t2, reason: i2, deviceInfo: r2 }) {
      return new C({ name: `${e ? "interruption.start" : "interruption.stop"}`, level: 1, properties: m({ reason: i2, type: t2 }, r2) });
    }
    static eventNameFor(e, t2) {
      return `${e}.${t2 ? "success" : "failed"}`;
    }
    static getPropertiesWithError(e, t2) {
      let i2 = this.getErrorProperties(t2);
      return e = m(m({}, i2), e), e;
    }
    static getErrorProperties(e) {
      return e ? e instanceof E2 ? e.toAnalyticsProperties() : { error_name: e.name, error_message: e.message, error_description: e.cause } : {};
    }
  };
  y2.KEY_REQUESTED_AT = "requested_at", y2.KEY_RESPONDED_AT = "responded_at";
  var ui = (a10) => a10 ? `{
    trackId: ${a10.id};
    kind: ${a10.kind};
    enabled: ${a10.enabled};
    muted: ${a10.muted};
    readyState: ${a10.readyState};
  }` : "";
  var De = class {
    constructor(e, t2, i2) {
      this.logIdentifier = "";
      this.isTrackNotPublishing = () => this.nativeTrack.readyState === "ended" || this.nativeTrack.muted;
      this.stream = e, this.nativeTrack = t2, this.source = i2;
    }
    get enabled() {
      return this.nativeTrack.enabled;
    }
    get trackId() {
      return this.firstTrackId || this.sdpTrackId || this.nativeTrack.id;
    }
    getMediaTrackSettings() {
      return this.nativeTrack.getSettings();
    }
    setEnabled(e) {
      return c2(this, null, function* () {
        this.nativeTrack.enabled = e;
      });
    }
    setSdpTrackId(e) {
      this.sdpTrackId = e;
    }
    setFirstTrackId(e) {
      this.firstTrackId = e;
    }
    sendInterruptionEvent({ started: e, reason: t2 }) {
      return y2.interruption({ started: e, type: this.type, reason: t2, deviceInfo: { deviceId: this.nativeTrack.getSettings().deviceId, groupId: this.nativeTrack.getSettings().groupId } });
    }
    cleanup() {
      var e;
      l2.d("[HMSTrack]", "Stopping track", this.toString()), (e = this.nativeTrack) == null || e.stop();
    }
    toString() {
      var e;
      return `{
      streamId: ${this.stream.id};
      peerId: ${this.peerId};
      trackId: ${this.trackId};
      mid: ${((e = this.transceiver) == null ? void 0 : e.mid) || "-"};
      logIdentifier: ${this.logIdentifier};
      source: ${this.source};
      enabled: ${this.enabled};
      nativeTrack: ${ui(this.nativeTrack)};
    }`;
    }
  };
  var we = class extends De {
    constructor(t2, i2, r2) {
      super(t2, i2, r2);
      this.type = "audio";
      this.audioElement = null;
      if (i2.kind !== "audio") throw new Error("Expected 'track' kind = 'audio'");
    }
    getVolume() {
      return this.audioElement ? Math.floor(this.audioElement.volume * 100) : null;
    }
    setVolume(t2) {
      return c2(this, null, function* () {
        if (t2 < 0 || t2 > 100) throw Error("Please pass a valid number between 0-100");
        yield this.subscribeToAudio(t2 === 0 ? false : this.enabled), this.audioElement && (this.audioElement.volume = t2 / 100);
      });
    }
    setAudioElement(t2) {
      l2.d("[HMSAudioTrack]", this.logIdentifier, "adding audio element", `${this}`, t2), this.audioElement = t2;
    }
    getAudioElement() {
      return this.audioElement;
    }
    getOutputDevice() {
      return this.outputDevice;
    }
    cleanup() {
      super.cleanup(), this.audioElement && (this.audioElement.srcObject = null, this.audioElement.remove(), this.audioElement = null);
    }
    setOutputDevice(t2) {
      return c2(this, null, function* () {
        var i2;
        if (!t2) {
          l2.d("[HMSAudioTrack]", this.logIdentifier, "device is null", `${this}`);
          return;
        }
        if (!this.audioElement) {
          l2.d("[HMSAudioTrack]", this.logIdentifier, "no audio element to set output", `${this}`), this.outputDevice = t2;
          return;
        }
        try {
          typeof this.audioElement.setSinkId == "function" && (di || (yield (i2 = this.audioElement) == null ? void 0 : i2.setSinkId(t2.deviceId)), this.outputDevice = t2);
        } catch (r2) {
          l2.d("[HMSAudioTrack]", "error in setSinkId", r2);
        }
      });
    }
    subscribeToAudio(t2) {
      return c2(this, null, function* () {
        this.stream instanceof be && (yield this.stream.setAudio(t2, this.trackId, this.logIdentifier));
      });
    }
  };
  var Hr = class {
    constructor() {
      this.storage = new ve("hms-device-selection");
      this.remember = false;
      this.TAG = "[HMSDeviceStorage]";
    }
    setDevices(e) {
      this.devices = e;
    }
    rememberDevices(e) {
      this.remember = e;
    }
    updateSelection(e, { deviceId: t2, groupId: i2 }) {
      if (!this.devices || !this.remember) return;
      let r2 = this.devices[e].find((o2) => this.isSame({ deviceId: t2, groupId: i2 }, o2));
      if (!r2) {
        l2.w(this.TAG, `Could not find device with deviceId: ${t2}, groupId: ${i2}`);
        return;
      }
      let s2 = this.storage.get() || {};
      s2[e] = r2, this.storage.set(s2);
    }
    getSelection() {
      if (this.remember) return this.storage.get();
    }
    cleanup() {
      this.remember = false, this.devices = void 0;
    }
    isSame(e, t2) {
      return e.deviceId === t2.deviceId && (e.groupId === t2.groupId || !e.groupId);
    }
  };
  var X2 = new Hr();
  var Cr = ((t2) => (t2.TRANSFORM = "TRANSFORM", t2.ANALYZE = "ANALYZE", t2))(Cr || {});
  var Lr = ((t2) => (t2.PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED", t2.DEVICE_NOT_SUPPORTED = "DEVICE_NOT_SUPPORTED", t2))(Lr || {});
  var me = class {
    static failure(e, t2) {
      let i2 = "mediaPlugin.failed", r2 = 2, s2 = m({ plugin_name: e }, t2.toAnalyticsProperties());
      return new C({ name: i2, level: r2, properties: s2 });
    }
    static audioPluginFailure(e, t2, i2) {
      let r2 = "mediaPlugin.failed", s2 = 2, o2 = m({ plugin_name: e, sampleRate: t2 }, i2.toAnalyticsProperties());
      return new C({ name: r2, level: s2, properties: o2 });
    }
    static audioPluginStats({ pluginName: e, duration: t2, loadTime: i2, sampleRate: r2 }) {
      let s2 = "mediaPlugin.stats", o2 = 1, n2 = { plugin_name: e, duration: t2, load_time: i2, sampleRate: r2 };
      return new C({ name: s2, level: o2, properties: n2 });
    }
    static added(e, t2) {
      let i2 = "mediaPlugin.added", r2 = 1, s2 = { plugin_name: e, added_at: t2 };
      return new C({ name: i2, level: r2, properties: s2 });
    }
    static stats({ pluginName: e, duration: t2, loadTime: i2, avgPreProcessingTime: r2, avgProcessingTime: s2, inputFrameRate: o2, pluginFrameRate: n2 }) {
      let d2 = "mediaPlugin.stats", u2 = 1, p2 = { plugin_name: e, duration: t2, load_time: i2, avg_preprocessing_time: r2, avg_processing_time: s2, input_frame_rate: o2, plugin_frame_rate: n2 };
      return new C({ name: d2, level: u2, properties: p2 });
    }
  };
  var pi = class {
    constructor(e) {
      this.eventBus = e;
      this.TAG = "[AudioPluginsAnalytics]";
      this.initTime = {}, this.addedTimestamps = {}, this.pluginAdded = {}, this.pluginSampleRate = {};
    }
    added(e, t2) {
      this.pluginAdded[e] = true, this.addedTimestamps[e] = Date.now(), this.initTime[e] = 0, this.pluginSampleRate[e] = t2, this.eventBus.analytics.publish(me.added(e, this.addedTimestamps[e]));
    }
    removed(e) {
      if (this.pluginAdded[e]) {
        let t2 = { pluginName: e, duration: Math.floor((Date.now() - this.addedTimestamps[e]) / 1e3), loadTime: this.initTime[e], sampleRate: this.pluginSampleRate[e] };
        this.eventBus.analytics.publish(me.audioPluginStats(t2)), this.clean(e);
      }
    }
    failure(e, t2) {
      this.pluginAdded[e] && (this.eventBus.analytics.publish(me.audioPluginFailure(e, this.pluginSampleRate[e], t2)), this.clean(e));
    }
    initWithTime(e, t2) {
      return c2(this, null, function* () {
        if (this.initTime[e]) {
          l2.i(this.TAG, `Plugin Already loaded ${e}, time it took: ${this.initTime[e]}`);
          return;
        }
        let i2;
        try {
          i2 = yield this.timeInMs(t2), l2.i(this.TAG, `Time taken for Plugin ${e} initialization : ${i2}`);
        } catch (r2) {
          let s2 = S2.MediaPluginErrors.InitFailed("AUDIO_PLUGINS", `failed during initialization of plugin${r2.message || r2}`);
          throw l2.e(this.TAG, s2), this.failure(e, s2), s2;
        }
        i2 && (this.initTime[e] = i2);
      });
    }
    timeInMs(e) {
      return c2(this, null, function* () {
        let t2 = Date.now();
        return yield e(), Math.floor(Date.now() - t2);
      });
    }
    clean(e) {
      delete this.addedTimestamps[e], delete this.initTime[e], delete this.pluginAdded[e], delete this.pluginSampleRate[e];
    }
  };
  var Pt = class {
    constructor(e, t2, i2) {
      this.eventBus = t2;
      this.TAG = "[AudioPluginsManager]";
      this.pluginAddInProgress = false;
      this.hmsTrack = e, this.pluginsMap = /* @__PURE__ */ new Map(), this.analytics = new pi(t2), this.audioContext = ce.getAudioContext(), this.room = i2;
    }
    getPlugins() {
      return Array.from(this.pluginsMap.keys());
    }
    addPlugin(e) {
      return c2(this, null, function* () {
        var i2, r2;
        let t2 = (i2 = e.getName) == null ? void 0 : i2.call(e);
        if (!t2) {
          l2.w("no name provided by the plugin");
          return;
        }
        if (this.pluginAddInProgress) {
          let s2 = S2.MediaPluginErrors.AddAlreadyInProgress("AUDIO_PLUGINS", "Add Plugin is already in Progress");
          throw this.analytics.added(t2, this.audioContext.sampleRate), this.analytics.failure(t2, s2), l2.w("can't add another plugin when previous add is in progress"), s2;
        }
        switch (e.getName()) {
          case "HMSKrispPlugin": {
            if (!((r2 = this.room) != null && r2.isNoiseCancellationEnabled)) {
              let s2 = "Krisp Noise Cancellation is not enabled for this room";
              if (this.pluginsMap.size === 0) throw Error(s2);
              l2.w(this.TAG, s2);
              return;
            }
            this.eventBus.analytics.publish(y2.krispStart());
            break;
          }
          default:
        }
        this.pluginAddInProgress = true;
        try {
          yield this.addPluginInternal(e);
        } finally {
          this.pluginAddInProgress = false;
        }
      });
    }
    addPluginInternal(e) {
      return c2(this, null, function* () {
        var i2, r2;
        let t2 = (i2 = e.getName) == null ? void 0 : i2.call(e);
        if (this.pluginsMap.get(t2)) {
          l2.w(this.TAG, `plugin - ${t2} already added.`);
          return;
        }
        yield this.validateAndThrow(t2, e), (r2 = e.setEventBus) == null || r2.call(e, this.eventBus);
        try {
          this.pluginsMap.size === 0 ? yield this.initAudioNodes() : this.prevAudioNode && this.prevAudioNode.disconnect(), this.analytics.added(t2, this.audioContext.sampleRate), yield this.analytics.initWithTime(t2, () => c2(this, null, function* () {
            return e.init();
          })), this.pluginsMap.set(t2, e), yield this.processPlugin(e), yield this.connectToDestination(), yield this.updateProcessedTrack();
        } catch (s2) {
          throw l2.e(this.TAG, "failed to add plugin", s2), s2;
        }
      });
    }
    validatePlugin(e) {
      return e.checkSupport(this.audioContext);
    }
    validateAndThrow(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.validatePlugin(t2);
        if (i2.isSupported) l2.i(this.TAG, `plugin is supported,- ${t2.getName()}`);
        else if (this.analytics.added(e, this.audioContext.sampleRate), i2.errType === "PLATFORM_NOT_SUPPORTED") {
          let r2 = S2.MediaPluginErrors.PlatformNotSupported("AUDIO_PLUGINS", "platform not supported, see docs");
          throw this.analytics.failure(e, r2), yield this.cleanup(), r2;
        } else if (i2.errType === "DEVICE_NOT_SUPPORTED") {
          let r2 = S2.MediaPluginErrors.DeviceNotSupported("AUDIO_PLUGINS", "audio device not supported, see docs");
          throw this.analytics.failure(e, r2), yield this.cleanup(), r2;
        }
      });
    }
    removePlugin(e) {
      return c2(this, null, function* () {
        switch (e.getName()) {
          case "HMSKrispPlugin": {
            this.eventBus.analytics.publish(y2.krispStop());
            break;
          }
          default:
            break;
        }
        yield this.removePluginInternal(e), this.pluginsMap.size === 0 ? (yield this.cleanup(), l2.i(this.TAG, "No plugins left, stopping plugins loop"), yield this.hmsTrack.setProcessedTrack(void 0)) : yield this.reprocessPlugins();
      });
    }
    cleanup() {
      return c2(this, null, function* () {
        var e, t2, i2;
        for (let r2 of this.pluginsMap.values()) yield this.removePluginInternal(r2);
        yield this.hmsTrack.setProcessedTrack(void 0), (e = this.sourceNode) == null || e.disconnect(), (t2 = this.prevAudioNode) == null || t2.disconnect(), (i2 = this.outputTrack) == null || i2.stop(), this.sourceNode = void 0, this.destinationNode = void 0, this.prevAudioNode = void 0, this.outputTrack = void 0;
      });
    }
    closeContext() {
      return c2(this, null, function* () {
        this.audioContext = void 0;
      });
    }
    reprocessPlugins() {
      return c2(this, null, function* () {
        if (this.pluginsMap.size === 0 || !this.sourceNode) return;
        let e = Array.from(this.pluginsMap.values());
        yield this.cleanup(), yield this.initAudioNodes();
        for (let t2 of e) yield this.addPlugin(t2);
        yield this.updateProcessedTrack();
      });
    }
    initAudioNodes() {
      return c2(this, null, function* () {
        if (this.audioContext) {
          let e = new MediaStream([this.hmsTrack.nativeTrack]);
          this.sourceNode = this.audioContext.createMediaStreamSource(e), this.destinationNode || (this.destinationNode = this.audioContext.createMediaStreamDestination(), this.outputTrack = this.destinationNode.stream.getAudioTracks()[0]);
        }
      });
    }
    updateProcessedTrack() {
      return c2(this, null, function* () {
        try {
          yield this.hmsTrack.setProcessedTrack(this.outputTrack);
        } catch (e) {
          throw l2.e(this.TAG, "error in setting processed track", e), e;
        }
      });
    }
    processPlugin(e) {
      return c2(this, null, function* () {
        try {
          let t2 = yield e.processAudioTrack(this.audioContext, this.prevAudioNode || this.sourceNode);
          this.prevAudioNode && this.prevAudioNode.connect(t2), this.prevAudioNode = t2;
        } catch (t2) {
          let i2 = e.getName();
          l2.e(this.TAG, `error in processing plugin ${i2}`, t2), yield this.removePluginInternal(e);
        }
      });
    }
    connectToDestination() {
      return c2(this, null, function* () {
        try {
          this.prevAudioNode && this.destinationNode && this.prevAudioNode.context === this.destinationNode.context && this.prevAudioNode.connect(this.destinationNode);
        } catch (e) {
          l2.e(this.TAG, "error in connecting to destination node", e);
        }
      });
    }
    removePluginInternal(e) {
      return c2(this, null, function* () {
        var i2;
        let t2 = (i2 = e.getName) == null ? void 0 : i2.call(e);
        if (!this.pluginsMap.get(t2)) {
          l2.w(this.TAG, `plugin - ${t2} not found to remove.`);
          return;
        }
        l2.i(this.TAG, `removing plugin ${t2}`), this.pluginsMap.delete(t2), e.stop(), this.analytics.removed(t2);
      });
    }
  };
  var bo = ["init_response_time", "ws_connect_time", "on_policy_change_time", "local_audio_track_time", "local_video_track_time", "peer_list_time", "room_state_time", "join_response_time"];
  var hi = class {
    constructor() {
      this.eventPerformanceMeasures = {};
    }
    start(e) {
      try {
        typeof performance != "undefined" && performance.mark && performance.mark(e);
      } catch (t2) {
        l2.w("[AnalyticsTimer]", `Error marking performance for event ${e}`, { error: t2 });
      }
    }
    end(e) {
      var t2;
      try {
        typeof performance != "undefined" && performance.measure && (this.eventPerformanceMeasures[e] = performance.measure(e, e), l2.d("[HMSPerformanceTiming]", e, (t2 = this.eventPerformanceMeasures[e]) == null ? void 0 : t2.duration));
      } catch (i2) {
        l2.w("[AnalyticsTimer]", `Error in measuring performance for event ${e}`, { error: i2 });
      }
    }
    getTimeTaken(e) {
      var t2;
      return (t2 = this.eventPerformanceMeasures[e]) == null ? void 0 : t2.duration;
    }
    getTimes(...e) {
      return [...bo, ...e].reduce((t2, i2) => M2(m({}, t2), { [i2]: this.getTimeTaken(i2) }), {});
    }
    cleanup() {
      this.eventPerformanceMeasures = {};
    }
  };
  function Ao(a10, e) {
    let t2 = a10.toLowerCase(), i2 = S2.TracksErrors.GenericTrack("TRACK", a10);
    return t2.includes("device not found") ? i2 = S2.TracksErrors.DeviceNotAvailable("TRACK", e, a10) : t2.includes("permission denied") && (i2 = S2.TracksErrors.CantAccessCaptureDevice("TRACK", e, a10)), i2;
  }
  function Io(a10, e = "") {
    if (adapter_core_default.browserDetails.browser === "chrome" && a10.name === "NotAllowedError" && a10.message.includes("denied by system")) return S2.TracksErrors.SystemDeniedPermission("TRACK", e, a10.message);
    if (adapter_core_default.browserDetails.browser === "firefox" && a10.name === "NotFoundError") {
      let i2 = S2.TracksErrors.SystemDeniedPermission("TRACK", e, a10.message);
      return i2.description = `Capture device is either blocked at Operating System level or not available - ${e}`, i2;
    }
    switch (a10.name) {
      case "OverconstrainedError":
        return S2.TracksErrors.OverConstrained("TRACK", e, a10.constraint);
      case "NotAllowedError":
        return S2.TracksErrors.CantAccessCaptureDevice("TRACK", e, a10.message);
      case "NotFoundError":
        return S2.TracksErrors.DeviceNotAvailable("TRACK", e, a10.message);
      case "NotReadableError":
        return S2.TracksErrors.DeviceInUse("TRACK", e, a10.message);
      case "TypeError":
        return S2.TracksErrors.NothingToReturn("TRACK", a10.message);
      default:
        return Ao(a10.message, e);
    }
  }
  function _e(a10, e) {
    let t2 = Io(a10, e);
    return t2.addNativeError(a10), t2;
  }
  var Dr = ((t2) => (t2.SIP = "sip", t2.REGULAR = "regular", t2))(Dr || {});
  var Bs = ((n2) => (n2.NONE = "none", n2.INITIALISED = "initialised", n2.STARTED = "started", n2.PAUSED = "paused", n2.RESUMED = "resumed", n2.STOPPED = "stopped", n2.FAILED = "failed", n2))(Bs || {});
  var Vs = ((t2) => (t2.DVR = "dvr", t2.NO_DVR = "no-dvr", t2))(Vs || {});
  var Fs = ((i2) => (i2.REGULAR = "regular", i2.SCREEN = "screen", i2.COMPOSITE = "composite", i2))(Fs || {});
  var Gs = ((r2) => (r2.INITIALISED = "initialised", r2.STARTED = "started", r2.STOPPED = "stopped", r2.FAILED = "failed", r2))(Gs || {});
  var Ws = ((e) => (e.CAPTION = "caption", e))(Ws || {});
  var We = { f: "high", h: "medium", q: "low" };
  var wr = ((t2) => (t2.VOICE = "voice", t2.MUSIC = "music", t2))(wr || {});
  var $s = ((i2) => (i2.videoInput = "videoInput", i2.audioInput = "audioInput", i2.audioOutput = "audioOutput", i2))($s || {});
  var J = class {
    constructor() {
      this._volume = 1;
      this._codec = "opus";
      this._maxBitrate = 32;
      this._deviceId = "default";
      this._audioMode = "voice";
      this._advanced = [{ autoGainControl: { exact: true } }, { noiseSuppression: { exact: true } }, { highpassFilter: { exact: true } }, { audioMirroring: { exact: true } }];
    }
    volume(e) {
      if (!(0 <= e && e <= 1)) throw Error("volume can only be in range [0.0, 1.0]");
      return this._volume = e, this;
    }
    codec(e) {
      return this._codec = e, this;
    }
    maxBitrate(e) {
      if (e && e <= 0) throw Error("maxBitrate should be >= 1");
      return this._maxBitrate = this._audioMode === "music" ? 320 : e, this;
    }
    deviceId(e) {
      return this._deviceId = e, this;
    }
    audioMode(e = "voice") {
      return this._audioMode = e, this._audioMode === "music" ? this._maxBitrate = 320 : this._maxBitrate = 32, this;
    }
    advanced(e) {
      return this._advanced = e, this;
    }
    build() {
      return new $e(this._volume, this._codec, this._maxBitrate, this._deviceId, this._advanced, this._audioMode);
    }
  };
  var $e = class {
    constructor(e, t2, i2, r2, s2, o2) {
      this.volume = e, this.codec = t2, this.maxBitrate = i2, this.deviceId = r2, this.advanced = s2, this.audioMode = o2, this.audioMode === "music" ? this.maxBitrate = 320 : this.maxBitrate = 32;
    }
    toConstraints() {
      return { deviceId: this.deviceId === "default" ? this.deviceId : { exact: this.deviceId }, advanced: this.audioMode === "music" ? [] : this.advanced };
    }
    toAnalyticsProperties() {
      return { audio_bitrate: this.maxBitrate, audio_codec: this.codec };
    }
  };
  var q2 = class {
    constructor() {
      this._width = 320;
      this._height = 180;
      this._codec = "vp8";
      this._maxFramerate = 30;
      this._maxBitrate = 150;
      this._advanced = [];
    }
    setWidth(e) {
      return this._width = e, this;
    }
    setHeight(e) {
      return this._height = e, this;
    }
    codec(e) {
      return this._codec = e, this;
    }
    maxFramerate(e) {
      if (e && e <= 0) throw Error("maxFramerate should be >= 1");
      return this._maxFramerate = e, this;
    }
    maxBitrate(e, t2 = true) {
      if (typeof e == "number" && e <= 0) throw Error("maxBitrate should be >= 1");
      return this._maxBitrate = e, !this._maxBitrate && t2 && (this._maxBitrate = 15e4), this;
    }
    deviceId(e) {
      return this._deviceId = e, this;
    }
    advanced(e) {
      return this._advanced = e, this;
    }
    facingMode(e) {
      return this._facingMode = e, this;
    }
    build() {
      return new Ke(this._width, this._height, this._codec, this._maxFramerate, this._deviceId, this._advanced, this._maxBitrate, this._facingMode);
    }
  };
  var Ke = class {
    constructor(e, t2, i2, r2, s2, o2, n2, d2) {
      this.width = e, this.height = t2, this.codec = i2, this.maxFramerate = r2, this.maxBitrate = n2, this.deviceId = s2, this.advanced = o2, this.facingMode = d2;
    }
    toConstraints(e) {
      let t2 = "ideal";
      e && (t2 = "max");
      let i2 = this.improviseConstraintsAspect();
      return { width: { [t2]: i2.width }, height: { [t2]: i2.height }, frameRate: this.maxFramerate, deviceId: this.deviceId === "default" ? this.deviceId : { exact: this.deviceId }, facingMode: this.facingMode };
    }
    toAnalyticsProperties() {
      return { width: this.width, height: this.height, video_bitrate: this.maxBitrate, framerate: this.maxFramerate, video_codec: this.codec, facingMode: this.facingMode };
    }
    improviseConstraintsAspect() {
      return Mt() && this.height && this.width && this.height > this.width ? { width: this.height, height: this.width } : { width: this.width, height: this.height };
    }
  };
  var Ne = class {
    constructor() {
      this._video = new q2().build();
      this._audio = new J().build();
      this._screen = new q2().build();
      this._simulcast = false;
    }
    video(e) {
      return this._video = e, this;
    }
    audio(e) {
      return this._audio = e, this;
    }
    screen(e) {
      return this._screen = e, this;
    }
    simulcast(e) {
      return this._simulcast = e, this;
    }
    build() {
      if (this._audio === null && this._video === null) throw S2.TracksErrors.NothingToReturn("TRACK");
      if (this._video === null && this._simulcast) throw S2.TracksErrors.InvalidVideoSettings("TRACK", "Cannot enable simulcast when no video settings are provided");
      return new Ze(this._video, this._audio, this._simulcast, this._screen || void 0);
    }
  };
  var Ze = class {
    constructor(e, t2, i2, r2 = null) {
      this.video = e, this.audio = t2, this.simulcast = i2, this.screen = r2;
    }
    toAnalyticsProperties() {
      let e = { audio_enabled: this.audio !== null, video_enabled: this.video !== null };
      return this.audio && (e = m(m({}, this.audio.toAnalyticsProperties()), e)), this.video && (e = m(m({}, this.video.toAnalyticsProperties()), e)), e;
    }
  };
  var Ro = 32e3;
  var ce = { audioContext: null, getAudioContext() {
    return this.audioContext || (this.audioContext = di ? new AudioContext() : new AudioContext({ sampleRate: Ro })), this.audioContext;
  }, resumeContext() {
    return c2(this, null, function* () {
      try {
        return yield this.getAudioContext().resume();
      } catch (a10) {
        l2.e("AudioContext", a10);
      }
    });
  } };
  var _r = ((r2) => (r2.SPEAKERPHONE = "SPEAKERPHONE", r2.WIRED = "WIRED", r2.BLUETOOTH = "BLUETOOTH", r2.EARPIECE = "EARPIECE", r2))(_r || {});
  var Nr = (a10) => {
    if (!a10) return l2.w("[DeviceManager]:", "No device label provided"), "SPEAKERPHONE";
    let e = a10.toLowerCase();
    return e.includes("speakerphone") ? "SPEAKERPHONE" : e.includes("wired") ? "WIRED" : /airpods|buds|wireless|bluetooth/gi.test(e) ? "BLUETOOTH" : e.includes("earpiece") ? "EARPIECE" : "SPEAKERPHONE";
  };
  var Or = { isAudioMuted: false, isVideoMuted: false, audioInputDeviceId: "default", audioOutputDeviceId: "default", videoDeviceId: "default", audioMode: "voice" };
  var Me;
  var mi;
  var Se = class a3 {
    constructor(e, t2, i2, r2, s2) {
      this.store = e;
      this.observer = t2;
      this.deviceManager = i2;
      this.eventBus = r2;
      this.analyticsTimer = s2;
      this.TAG = "[LocalTrackManager]";
      this.setScreenCaptureHandleConfig();
    }
    getTracksToPublish() {
      return c2(this, arguments, function* (e = Or) {
        let t2 = this.getAVTrackSettings(e);
        if (!t2) return [];
        let i2 = !!t2.audio, r2 = !!t2.video, s2 = [], { videoTrack: o2, audioTrack: n2 } = yield this.updateCurrentLocalTrackSettings(t2), d2 = (o2 == null ? void 0 : o2.stream) || (n2 == null ? void 0 : n2.stream), u2 = !!(o2 && this.store.getTrackById(o2.trackId)), p2 = !!(n2 && this.store.getTrackById(n2.trackId));
        if (u2 && p2) return [];
        let h2 = { audio: i2 && !n2 && (e.isAudioMuted ? "empty" : true), video: r2 && !o2 && (e.isVideoMuted ? "empty" : true) };
        h2.audio && this.analyticsTimer.start("local_audio_track_time"), h2.video && this.analyticsTimer.start("local_video_track_time");
        try {
          l2.d(this.TAG, "Init Local Tracks", { fetchTrackOptions: h2 }), s2 = yield this.getLocalTracks(h2, t2, d2);
        } catch (T) {
          s2 = yield this.retryGetLocalTracks(T, t2, h2, d2);
        }
        return h2.audio && this.analyticsTimer.end("local_audio_track_time"), h2.video && this.analyticsTimer.end("local_video_track_time"), o2 && r2 && !u2 && s2.push(o2), n2 && i2 && !p2 && s2.push(n2), s2;
      });
    }
    getLocalTracks() {
      return c2(this, arguments, function* (e = { audio: true, video: true }, t2, i2) {
        try {
          let r2 = yield this.getNativeLocalTracks(e, t2);
          return this.createHMSLocalTracks(r2, t2, i2);
        } catch (r2) {
          throw this.eventBus.analytics.publish(y2.publish({ devices: this.deviceManager.getDevices(), error: r2, settings: t2 })), r2;
        }
      });
    }
    getNativeLocalTracks() {
      return c2(this, arguments, function* (e = { audio: false, video: false }, t2) {
        let i2 = new Ze(e.video === true ? t2.video : null, e.audio === true ? t2.audio : null, t2.simulcast), r2 = [];
        return (i2.audio || i2.video) && r2.push(...yield this.getAVTracks(i2)), r2.push(...this.getEmptyTracks(e)), r2;
      });
    }
    optimizeScreenShareConstraint(e, t2) {
      return c2(this, null, function* () {
        var s2, o2, n2;
        if (typeof t2.video == "boolean" || !((s2 = t2.video) != null && s2.width) || !((o2 = t2.video) != null && o2.height)) return;
        let i2 = this.store.getPublishParams();
        if (!i2 || !((n2 = i2.allowed) != null && n2.includes("screen"))) return;
        let r2 = document.createElement("video");
        r2.srcObject = e, r2.addEventListener("loadedmetadata", () => c2(this, null, function* () {
          let { videoWidth: d2, videoHeight: u2 } = r2, p2 = i2.screen, h2 = p2.width * p2.height, T = d2 / u2, g2 = p2.width / p2.height;
          if (T > g2) {
            let f2 = t2.video, P2 = T / g2, v2 = Math.sqrt(P2);
            d2 * u2 > h2 ? (f2.width = d2 / v2, f2.height = u2 / v2) : (f2.height = u2 * v2, f2.width = d2 * v2), yield e.getVideoTracks()[0].applyConstraints(f2);
          }
        }));
      });
    }
    getLocalScreen(e, t2 = false) {
      return c2(this, null, function* () {
        var T;
        let i2 = yield this.getOrDefaultScreenshareConfig(e), r2 = this.getScreenshareSettings(i2.videoOnly), s2 = { video: M2(m({}, r2 == null ? void 0 : r2.video.toConstraints(true)), { displaySurface: i2.displaySurface }), preferCurrentTab: i2.preferCurrentTab, selfBrowserSurface: i2.selfBrowserSurface, surfaceSwitching: i2.surfaceSwitching, systemAudio: i2.systemAudio };
        if (r2 != null && r2.audio) {
          let g2 = (T = r2 == null ? void 0 : r2.audio) == null ? void 0 : T.toConstraints();
          delete g2.advanced, s2.audio = M2(m({}, g2), { autoGainControl: false, noiseSuppression: false, googAutoGainControl: false, echoCancellation: false });
        } else e != null && e.forceCurrentTab && e.preferCurrentTab && e.cropElement && (s2.audio = { echoCancellation: true, noiseSuppression: true });
        let o2;
        try {
          l2.d("retrieving screenshare with ", { config: i2 }, { constraints: s2 }), o2 = yield navigator.mediaDevices.getDisplayMedia(s2), t2 && (yield this.optimizeScreenShareConstraint(o2, s2));
        } catch (g2) {
          l2.w(this.TAG, "error in getting screenshare - ", g2);
          let f2 = _e(g2, "screen");
          throw this.eventBus.analytics.publish(y2.publish({ error: f2, devices: this.deviceManager.getDevices(), settings: new Ze(r2 == null ? void 0 : r2.video, r2 == null ? void 0 : r2.audio, false) })), f2;
        }
        let n2 = [], d2 = new ge(o2), u2 = o2.getVideoTracks()[0], p2 = new G2(d2, u2, "screen", this.eventBus, r2 == null ? void 0 : r2.video, this.store.getRoom());
        p2.setSimulcastDefinitons(this.store.getSimulcastDefinitionsForPeer(this.store.getLocalPeer(), "screen"));
        try {
          let g2 = this.validateCurrentTabCapture(p2, i2.forceCurrentTab);
          p2.isCurrentTab = g2, yield p2.cropTo(i2.cropTarget);
        } catch (g2) {
          throw o2.getTracks().forEach((f2) => f2.stop()), g2;
        }
        n2.push(p2);
        let h2 = o2.getAudioTracks()[0];
        if (h2) {
          let g2 = new de(d2, h2, "screen", this.eventBus, r2 == null ? void 0 : r2.audio, this.store.getRoom());
          n2.push(g2);
        }
        return l2.v(this.TAG, "getLocalScreen", n2), n2;
      });
    }
    setScreenCaptureHandleConfig(e) {
      var t2;
      !((t2 = navigator.mediaDevices) != null && t2.setCaptureHandleConfig) || this.isInIframe() || (e = e || {}, Object.assign(e, { handle: v4_default(), exposeOrigin: false, permittedOrigins: [window.location.origin] }), l2.d("setting capture handle - ", e.handle), navigator.mediaDevices.setCaptureHandleConfig(e), this.captureHandleIdentifier = e.handle);
    }
    validateCurrentTabCapture(e, t2) {
      let i2 = e.getCaptureHandle(), r2 = !!(this.captureHandleIdentifier && (i2 == null ? void 0 : i2.handle) === this.captureHandleIdentifier);
      if (t2 && !r2) throw l2.e(this.TAG, "current tab was not shared with forceCurrentTab as true"), S2.TracksErrors.CurrentTabNotShared();
      return r2;
    }
    requestPermissions() {
      return c2(this, null, function* () {
        try {
          (yield navigator.mediaDevices.getUserMedia({ audio: true, video: true })).getTracks().forEach((t2) => t2.stop());
        } catch (e) {
          l2.e(this.TAG, e);
        }
      });
    }
    static getEmptyVideoTrack(e) {
      var n2, d2, u2;
      let t2 = ((n2 = e == null ? void 0 : e.getSettings()) == null ? void 0 : n2.width) || 320, i2 = ((d2 = e == null ? void 0 : e.getSettings()) == null ? void 0 : d2.height) || 240, r2 = 1;
      Me || (Me = document.createElement("canvas"), Me.width = t2, Me.height = i2, (u2 = Me.getContext("2d")) == null || u2.fillRect(0, 0, t2, i2)), mi || (mi = setInterval(() => {
        let p2 = Me == null ? void 0 : Me.getContext("2d");
        p2 && p2.fillRect(0, 0, 1, 1);
      }, 1e3 / r2));
      let o2 = Me.captureStream(r2).getVideoTracks()[0];
      return o2.enabled = false, o2;
    }
    static getEmptyAudioTrack() {
      let e = ce.getAudioContext(), t2 = e.createOscillator(), i2 = e.createMediaStreamDestination();
      t2.connect(i2), t2.start();
      let r2 = i2.stream.getAudioTracks()[0];
      return r2.enabled = false, r2;
    }
    static cleanup() {
      clearInterval(mi), mi = void 0, Me = void 0;
    }
    getAVTracks(e) {
      return c2(this, null, function* () {
        try {
          let t2 = yield navigator.mediaDevices.getUserMedia({ audio: e.audio ? e.audio.toConstraints() : false, video: e.video ? e.video.toConstraints() : false });
          return t2.getVideoTracks().concat(t2.getAudioTracks());
        } catch (t2) {
          yield this.deviceManager.init();
          let i2 = !!(!this.deviceManager.hasWebcamPermission && e.video), r2 = !!(!this.deviceManager.hasMicrophonePermission && e.audio), s2 = this.getErrorType(i2, r2);
          throw _e(t2, s2);
        }
      });
    }
    getAVTrackSettings(e) {
      let t2 = this.getAudioSettings(e), i2 = this.getVideoSettings(e);
      return !t2 && !i2 ? null : new Ne().video(i2).audio(t2).build();
    }
    isInIframe() {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }
    retryGetLocalTracks(e, t2, i2, r2) {
      return c2(this, null, function* () {
        if (e instanceof E2 && e.action === "TRACK") {
          this.observer.onFailure(e);
          let s2 = e.code === k2.TracksErrors.OVER_CONSTRAINED, o2 = e.message.includes("audio"), n2 = e.message.includes("video");
          if (s2) {
            let d2 = new Ne().video(new Ke()).audio(new $e()).build();
            l2.w(this.TAG, "Fetch AV Tracks failed with overconstrained error", { fetchTrackOptions: i2 }, { error: e });
            try {
              return yield this.getLocalTracks(i2, d2, r2);
            } catch (u2) {
              let p2 = u2 instanceof E2 ? u2.nativeError : u2, h2 = u2;
              if ((p2 == null ? void 0 : p2.name) === "OverconstrainedError") {
                let T = S2.TracksErrors.GenericTrack("TRACK", "Overconstrained error after dropping all constraints");
                T.addNativeError(p2), h2 = T;
              }
              return yield this.retryGetLocalTracks(h2, t2, i2, r2);
            }
          }
          i2.audio = o2 ? "empty" : i2.audio, i2.video = n2 ? "empty" : i2.video, l2.w(this.TAG, "Fetch AV Tracks failed", { fetchTrackOptions: i2 }, e);
          try {
            return yield this.getLocalTracks(i2, t2, r2);
          } catch (d2) {
            return l2.w(this.TAG, "Fetch empty tacks failed", d2), i2.audio = i2.audio && "empty", i2.video = i2.video && "empty", this.observer.onFailure(d2), yield this.getLocalTracks(i2, t2, r2);
          }
        } else return l2.w(this.TAG, "Fetch AV Tracks failed - unknown exception", e), this.observer.onFailure(e), [];
      });
    }
    getErrorType(e, t2) {
      return e && t2 ? "audio, video" : e ? "video" : t2 ? "audio" : "audio, video";
    }
    getEmptyTracks(e) {
      let t2 = [];
      return e.audio === "empty" && t2.push(a3.getEmptyAudioTrack()), e.video === "empty" && t2.push(a3.getEmptyVideoTrack()), t2;
    }
    updateCurrentLocalTrackSettings(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getLocalPeerTracks(), i2 = t2.find((n2) => n2.type === "video" && n2.source === "regular"), r2 = t2.find((n2) => n2.type === "audio" && n2.source === "regular"), s2 = t2.find((n2) => n2.type === "video" && n2.source === "screen");
        e != null && e.video && (yield i2 == null ? void 0 : i2.setSettings(e.video)), e != null && e.audio && (yield r2 == null ? void 0 : r2.setSettings(e.audio));
        let o2 = this.getScreenshareSettings(true);
        return o2 != null && o2.video && (yield s2 == null ? void 0 : s2.setSettings(o2 == null ? void 0 : o2.video)), { videoTrack: i2, audioTrack: r2 };
      });
    }
    getAudioSettings(e) {
      var o2;
      let t2 = this.store.getPublishParams();
      if (!t2 || !((o2 = t2.allowed) != null && o2.includes("audio"))) return null;
      let i2 = this.store.getLocalPeer(), r2 = i2 == null ? void 0 : i2.audioTrack, s2 = (r2 == null ? void 0 : r2.settings.deviceId) || e.audioInputDeviceId;
      return new J().codec(t2.audio.codec).maxBitrate(t2.audio.bitRate).deviceId(s2 || Or.audioInputDeviceId).build();
    }
    getVideoSettings(e) {
      var n2;
      let t2 = this.store.getPublishParams();
      if (!t2 || !((n2 = t2.allowed) != null && n2.includes("video"))) return null;
      let i2 = this.store.getLocalPeer(), r2 = i2 == null ? void 0 : i2.videoTrack, s2 = (r2 == null ? void 0 : r2.settings.deviceId) || e.videoDeviceId, o2 = t2.video;
      return new q2().codec(o2.codec).maxBitrate(o2.bitRate).maxFramerate(o2.frameRate).setWidth(o2.width).setHeight(o2.height).deviceId(s2 || Or.videoDeviceId).build();
    }
    getScreenshareSettings(e = false) {
      var r2;
      let t2 = this.store.getPublishParams();
      if (!t2 || !((r2 = t2.allowed) != null && r2.includes("screen"))) return null;
      let i2 = t2.screen;
      return { video: new q2().maxBitrate(i2.bitRate, false).codec(i2.codec).maxFramerate(i2.frameRate).setWidth(i2.width).setHeight(i2.height).build(), audio: e ? void 0 : new J().build() };
    }
    getOrDefaultScreenshareConfig(e) {
      return c2(this, null, function* () {
        var i2;
        let t2 = Object.assign({ videoOnly: false, audioOnly: false, forceCurrentTab: false, preferCurrentTab: false, selfBrowserSurface: "exclude", surfaceSwitching: "include", systemAudio: "exclude", displaySurface: "monitor" }, e || {});
        return t2.forceCurrentTab && (t2.videoOnly = true, t2.preferCurrentTab = true, t2.selfBrowserSurface = "include", t2.surfaceSwitching = "exclude"), t2.preferCurrentTab && (t2.selfBrowserSurface = "include", t2.displaySurface = void 0), t2.cropElement && ((i2 = window.CropTarget) != null && i2.fromElement) && (t2.cropTarget = yield window.CropTarget.fromElement(t2.cropElement)), t2;
      });
    }
    createHMSLocalTracks(e, t2, i2) {
      let r2 = e.find((n2) => n2.kind === "video"), s2 = e.find((n2) => n2.kind === "audio");
      i2 ? e.forEach((n2) => i2 == null ? void 0 : i2.nativeStream.addTrack(n2)) : i2 = new ge(new MediaStream(e));
      let o2 = [];
      if (s2 && (t2 != null && t2.audio)) {
        let n2 = new de(i2, s2, "regular", this.eventBus, t2.audio, this.store.getRoom());
        o2.push(n2);
      }
      if (r2 && (t2 != null && t2.video)) {
        let n2 = new G2(i2, r2, "regular", this.eventBus, t2.video, this.store.getRoom());
        n2.setSimulcastDefinitons(this.store.getSimulcastDefinitionsForPeer(this.store.getLocalPeer(), "regular")), o2.push(n2);
      }
      return o2;
    }
  };
  function Ur(a10) {
    return c2(this, null, function* () {
      try {
        let e = a10 ? a10.toConstraints() : false;
        return (yield navigator.mediaDevices.getUserMedia({ audio: e })).getAudioTracks()[0];
      } catch (e) {
        throw _e(e, "audio");
      }
    });
  }
  function Br(a10) {
    return c2(this, null, function* () {
      try {
        let e = a10 ? a10.toConstraints() : false;
        return (yield navigator.mediaDevices.getUserMedia({ video: e })).getVideoTracks()[0];
      } catch (e) {
        throw _e(e, "video");
      }
    });
  }
  function ye(a10) {
    return "canvas" in a10 || a10.label === "MediaStreamAudioDestinationNode" || a10.label === "";
  }
  var Si = (a10, e) => {
    if (!navigator.permissions) {
      l2.d("Permissions API not supported");
      return;
    }
    navigator.permissions.query({ name: a10 }).then((t2) => {
      e(t2.state), t2.onchange = () => {
        l2.d(`${a10} permission changed`, t2.state), e(t2.state);
      };
    }).catch((t2) => {
      l2.e(`${a10} not supported`, t2.message);
    });
  };
  var Oe = class {
    constructor(e = 1 / 0) {
      this.capacity = e;
      this.storage = [];
    }
    size() {
      return this.storage.length;
    }
    toList() {
      return this.storage.slice(0);
    }
    enqueue(e) {
      this.size() === this.capacity && this.dequeue(), this.storage.push(e);
    }
    dequeue() {
      return this.storage.shift();
    }
    aggregate(e) {
      return e(this.storage);
    }
  };
  var qs = `(function workerSetup() {
  function ticker() {
    self.postMessage('tick');
  }
  self.onmessage = function (event) {
    const [data, time] = event.data;
    switch (data) {
      case 'start':
        setTimeout(ticker, time);
        break;
      default:
        break;
    }
  };
})()`;
  function Q2(a10) {
    if (a10 < 0) throw Error("`ms` should be a positive integer");
    return new Promise((e) => {
      setTimeout(e, a10);
    });
  }
  function xe(a10) {
    if (a10 < 0) throw Error("`ms` should be a positive integer");
    if (typeof Worker == "undefined") return Q2(a10);
    let e = new Worker(URL.createObjectURL(new Blob([qs], { type: "application/javascript" })));
    return e.postMessage(["start", a10]), new Promise((t2) => {
      e.onmessage = (i2) => {
        i2.data === "tick" && (t2(), e.terminate());
      };
    });
  }
  function js() {
    if (typeof Worker == "undefined") return { sleep: (e) => Q2(e) };
    let a10 = new Worker(URL.createObjectURL(new Blob([qs], { type: "application/javascript" })));
    return { sleep: (e) => (a10.postMessage(["start", e]), new Promise((t2) => {
      a10.onmessage = (i2) => {
        i2.data === "tick" && t2();
      };
    })) };
  }
  function gi(a10, e = 300) {
    let t2;
    return function(...i2) {
      clearTimeout(t2), t2 = void 0;
      let r2 = this;
      t2 = setTimeout(() => {
        a10.apply(r2, i2);
      }, e);
    };
  }
  var Co = 35;
  var Lo = 5;
  var Ti = class {
    constructor(e, t2, i2) {
      this.track = e;
      this.audioLevelEvent = t2;
      this.silenceEvent = i2;
      this.TAG = "[TrackAudioLevelMonitor]";
      this.audioLevel = 0;
      this.isMonitored = false;
      this.interval = 100;
      this.historyInterval = 700;
      this.history = new Oe(this.historyInterval / this.interval);
      this.detectSilence = () => c2(this, null, function* () {
        let i3 = 0;
        for (; this.isMonitored; ) {
          if (this.track.enabled) if (this.isSilentThisInstant()) {
            if (i3++, i3 > 50) {
              this.silenceEvent.publish({ track: this.track });
              break;
            }
          } else break;
          yield Q2(20);
        }
      });
      try {
        let r2 = new MediaStream([this.track.nativeTrack]);
        this.analyserNode = this.createAnalyserNodeForStream(r2);
        let s2 = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(s2);
      } catch (r2) {
        l2.w(this.TAG, "Unable to initialize AudioContext", r2);
      }
    }
    start() {
      this.stop(), this.isMonitored = true, l2.d(this.TAG, "Starting track Monitor", `${this.track}`), this.loop().then(() => l2.d(this.TAG, "Stopping track Monitor", `${this.track}`));
    }
    stop() {
      if (!this.analyserNode) {
        l2.d(this.TAG, "AudioContext not initialized");
        return;
      }
      this.sendAudioLevel(0), this.isMonitored = false;
    }
    loop() {
      return c2(this, null, function* () {
        for (; this.isMonitored; ) this.sendAudioLevel(this.getMaxAudioLevelOverPeriod()), yield Q2(this.interval);
      });
    }
    sendAudioLevel(e = 0) {
      if (e = e > Co ? e : 0, Math.abs(this.audioLevel - e) > Lo) {
        this.audioLevel = e;
        let i2 = { track: this.track, audioLevel: this.audioLevel };
        this.audioLevelEvent.publish(i2);
      }
    }
    getMaxAudioLevelOverPeriod() {
      if (!this.analyserNode) {
        l2.d(this.TAG, "AudioContext not initialized");
        return;
      }
      let e = this.calculateAudioLevel();
      return e !== void 0 && this.history.enqueue(e), this.history.aggregate((t2) => Math.max(...t2));
    }
    calculateAudioLevel() {
      if (!this.analyserNode || !this.dataArray) {
        l2.d(this.TAG, "AudioContext not initialized");
        return;
      }
      this.analyserNode.getByteTimeDomainData(this.dataArray);
      let e = 9e-3, t2 = e;
      for (let s2 of this.dataArray) t2 = Math.max(t2, (s2 - 128) / 128);
      let i2 = (Math.log(e) - Math.log(t2)) / Math.log(e);
      return Math.ceil(Math.min(Math.max(i2 * 100, 0), 100));
    }
    isSilentThisInstant() {
      if (!this.analyserNode || !this.dataArray) {
        l2.d(this.TAG, "AudioContext not initialized");
        return;
      }
      return this.analyserNode.getByteTimeDomainData(this.dataArray), this.dataArray.every((e) => e === 128 || e === 0);
    }
    createAnalyserNodeForStream(e) {
      let t2 = ce.getAudioContext(), i2 = t2.createMediaStreamSource(e), r2 = t2.createAnalyser();
      return r2.fftSize = 2048, i2.connect(r2), r2;
    }
  };
  function Js(a10, e) {
    return function(i2) {
      return !(0, import_lodash.default)(a10[i2], e[i2]);
    };
  }
  var de = class a4 extends we {
    constructor(t2, i2, r2, s2, o2 = new J().build(), n2) {
      super(t2, i2, r2);
      this.eventBus = s2;
      this.room = n2;
      this.TAG = "[HMSLocalAudioTrack]";
      this.tracksCreated = /* @__PURE__ */ new Set();
      this.isPublished = false;
      this.handleVisibilityChange = () => c2(this, null, function* () {
        if (!this.shouldReacquireTrack()) {
          l2.d(this.TAG, `visibiltiy: ${document.visibilityState}`, `${this}`);
          return;
        }
        if (document.visibilityState === "hidden") this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: true, reason: "visibility-change" }));
        else {
          if (this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: false, reason: "visibility-change" })), this.permissionState && this.permissionState !== "granted") {
            l2.d(this.TAG, "On visibile not replacing track as permission is not granted");
            return;
          }
          l2.d(this.TAG, "On visibile replacing track as it is not publishing");
          try {
            yield this.replaceTrackWith(this.settings);
          } catch (t3) {
            this.eventBus.error.publish(t3);
          }
        }
      });
      this.trackPermissions = () => {
        Si("microphone", (t3) => {
          this.permissionState = t3, this.eventBus.analytics.publish(y2.permissionChange(this.type, t3)), t3 === "denied" && this.eventBus.localAudioEnabled.publish({ enabled: false, track: this });
        });
      };
      this.handleTrackMute = () => {
        l2.d(this.TAG, "muted natively");
        let t3 = document.visibilityState === "hidden" ? "visibility-change" : "incoming-call";
        this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: true, reason: t3 })), this.eventBus.localAudioEnabled.publish({ enabled: false, track: this });
      };
      this.handleTrackUnmute = () => c2(this, null, function* () {
        l2.d(this.TAG, "unmuted natively");
        let t3 = document.visibilityState === "hidden" ? "visibility-change" : "incoming-call";
        this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: false, reason: t3 }));
        try {
          yield this.setEnabled(this.enabled, true), this.eventBus.localAudioUnmutedNatively.publish();
        } catch (i3) {
          this.eventBus.error.publish(i3);
        }
      });
      this.replaceSenderTrack = () => c2(this, null, function* () {
        if (!this.transceiver || this.transceiver.direction !== "sendonly") {
          l2.d(this.TAG, `transceiver for ${this.trackId} not available or not connected yet`);
          return;
        }
        yield this.transceiver.sender.replaceTrack(this.processedTrack || this.nativeTrack);
      });
      this.shouldReacquireTrack = () => ye(this.nativeTrack) || this.isTrackNotPublishing();
      this.handleSettingsChange = (t3) => c2(this, null, function* () {
        let i3 = this.stream, r3 = Js(t3, this.settings);
        (r3("maxBitrate") || r3("audioMode")) && t3.maxBitrate && (yield i3.setMaxBitrateAndFramerate(this, t3)), (r3("advanced") || r3("audioMode")) && (yield this.replaceTrackWith(t3));
      });
      this.handleDeviceChange = (t3, i3 = false) => c2(this, null, function* () {
        if (Js(t3, this.settings)("deviceId")) {
          this.manuallySelectedDeviceId = i3 ? this.manuallySelectedDeviceId : t3.deviceId, l2.d(this.TAG, "device change", "manual selection:", this.manuallySelectedDeviceId, "new device:", t3.deviceId), yield this.replaceTrackWith(t3);
          let s3 = this.nativeTrack.getSettings().groupId;
          !i3 && t3.deviceId && (X2.updateSelection("audioInput", { deviceId: t3.deviceId, groupId: s3 }), this.eventBus.deviceChange.publish({ isUserSelection: true, type: "audioInput", selection: { deviceId: t3.deviceId, groupId: s3 } }));
        }
      });
      t2.tracks.push(this), this.addTrackEventListeners(i2), this.trackPermissions(), this.settings = o2, o2.deviceId !== i2.getSettings().deviceId && !ye(i2) && (this.settings = this.buildNewSettings({ deviceId: i2.getSettings().deviceId })), this.pluginsManager = new Pt(this, s2, n2), this.setFirstTrackId(i2.id), r2 === "regular" && document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
    clone(t2) {
      let i2 = this.nativeTrack.clone();
      t2.nativeStream.addTrack(i2);
      let r2 = new a4(t2, i2, this.source, this.eventBus, this.settings, this.room);
      return r2.peerId = this.peerId, this.pluginsManager.pluginsMap.size > 0 && this.pluginsManager.pluginsMap.forEach((s2) => {
        r2.addPlugin(s2).catch((o2) => l2.e(this.TAG, "Plugin add failed while migrating", s2, o2));
      }), r2;
    }
    getManuallySelectedDeviceId() {
      return this.manuallySelectedDeviceId;
    }
    resetManuallySelectedDeviceId() {
      this.manuallySelectedDeviceId = void 0;
    }
    updateTrack(t2) {
      return c2(this, null, function* () {
        t2.enabled = this.enabled, yield this.stream.replaceStreamTrack(this.nativeTrack, t2), this.nativeTrack = t2, yield this.replaceSenderTrack(), !!this.audioLevelMonitor && this.initAudioLevelMonitor();
      });
    }
    replaceTrackWith(t2) {
      return c2(this, null, function* () {
        let i2 = this.nativeTrack;
        i2 == null || i2.stop(), this.removeTrackEventListeners(i2), this.tracksCreated.forEach((r2) => r2.stop()), this.tracksCreated.clear();
        try {
          let r2 = yield Ur(t2);
          this.addTrackEventListeners(r2), this.tracksCreated.add(r2), l2.d(this.TAG, "replaceTrack, Previous track stopped", i2, "newTrack", r2), yield this.updateTrack(r2);
        } catch (r2) {
          let s2 = r2;
          if (s2.code === k2.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE || s2.code === k2.TracksErrors.SYSTEM_DENIED_PERMISSION) {
            let n2 = yield Se.getEmptyAudioTrack();
            throw this.addTrackEventListeners(n2), this.tracksCreated.add(n2), yield this.updateTrack(n2), s2;
          }
          let o2 = yield Ur(this.settings);
          throw this.addTrackEventListeners(o2), this.tracksCreated.add(o2), yield this.updateTrack(o2), this.isPublished && this.eventBus.analytics.publish(y2.publish({ error: r2 })), r2;
        }
        try {
          yield this.pluginsManager.reprocessPlugins();
        } catch (r2) {
          this.eventBus.audioPluginFailed.publish(r2);
        }
      });
    }
    setEnabled(t2, i2 = false) {
      return c2(this, null, function* () {
        t2 === this.enabled && !i2 || (t2 && this.shouldReacquireTrack() && (yield this.replaceTrackWith(this.settings)), yield ne(a4.prototype, this, "setEnabled").call(this, t2), t2 && (this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId })), this.eventBus.localAudioEnabled.publish({ enabled: t2, track: this }));
      });
    }
    isPublishedTrackId(t2) {
      return this.publishedTrackId === t2;
    }
    setSettings(t2, i2 = false) {
      return c2(this, null, function* () {
        let r2 = this.buildNewSettings(t2);
        if (ye(this.nativeTrack)) {
          this.settings = r2;
          return;
        }
        yield this.handleDeviceChange(r2, i2), yield this.handleSettingsChange(r2), this.settings = r2;
      });
    }
    getPlugins() {
      return this.pluginsManager.getPlugins();
    }
    addPlugin(t2) {
      return c2(this, null, function* () {
        return this.pluginsManager.addPlugin(t2);
      });
    }
    removePlugin(t2) {
      return c2(this, null, function* () {
        return this.pluginsManager.removePlugin(t2);
      });
    }
    validatePlugin(t2) {
      return this.pluginsManager.validatePlugin(t2);
    }
    setProcessedTrack(t2) {
      return c2(this, null, function* () {
        t2 ? t2 !== this.processedTrack && (this.processedTrack = t2) : this.processedTrack = void 0, yield this.replaceSenderTrack();
      });
    }
    initAudioLevelMonitor() {
      this.audioLevelMonitor && this.destroyAudioLevelMonitor(), l2.d(this.TAG, "Monitor Audio Level for", this, this.getMediaTrackSettings().deviceId), this.audioLevelMonitor = new Ti(this, this.eventBus.trackAudioLevelUpdate, this.eventBus.localAudioSilence), this.audioLevelMonitor.start(), this.audioLevelMonitor.detectSilence();
    }
    destroyAudioLevelMonitor() {
      var t2;
      (t2 = this.audioLevelMonitor) == null || t2.stop(), this.audioLevelMonitor = void 0;
    }
    cleanup() {
      return c2(this, null, function* () {
        var t2;
        ne(a4.prototype, this, "cleanup").call(this), yield this.pluginsManager.cleanup(), yield this.pluginsManager.closeContext(), this.transceiver = void 0, (t2 = this.processedTrack) == null || t2.stop(), this.tracksCreated.forEach((i2) => i2.stop()), this.tracksCreated.clear(), this.isPublished = false, this.destroyAudioLevelMonitor(), document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      });
    }
    getTrackIDBeingSent() {
      return this.processedTrack ? this.processedTrack.id : this.nativeTrack.id;
    }
    getTrackBeingSent() {
      return this.processedTrack || this.nativeTrack;
    }
    addTrackEventListeners(t2) {
      t2.addEventListener("mute", this.handleTrackMute), t2.addEventListener("unmute", this.handleTrackUnmute);
    }
    removeTrackEventListeners(t2) {
      t2.removeEventListener("mute", this.handleTrackMute), t2.removeEventListener("unmute", this.handleTrackUnmute);
    }
    buildNewSettings(t2) {
      let { volume: i2, codec: r2, maxBitrate: s2, deviceId: o2, advanced: n2, audioMode: d2 } = m(m({}, this.settings), t2);
      return new $e(i2, r2, s2, o2, n2, d2);
    }
  };
  var ie = class a5 extends we {
    setEnabled(e) {
      return c2(this, null, function* () {
        e !== this.enabled && (yield ne(a5.prototype, this, "setEnabled").call(this, e), yield this.subscribeToAudio(e));
      });
    }
  };
  var et = class extends De {
    constructor(t2, i2, r2) {
      super(t2, i2, r2);
      this.type = "video";
      this.sinkCount = 0;
      this.handleTrackUnmute = () => {
        this.getSinks().forEach((t3) => this.reTriggerPlay({ videoElement: t3 }));
      };
      this.reTriggerPlay = ({ videoElement: t3 }) => {
        setTimeout(() => {
          t3.play().catch((i3) => {
            l2.w("[HMSVideoTrack]", "failed to play", i3.message);
          });
        }, 0);
      };
      if (i2.kind !== "video") throw new Error("Expected 'track' kind = 'video'");
    }
    setVideoHandler(t2) {
      this.videoHandler = t2;
    }
    hasSinks() {
      return this.sinkCount > 0;
    }
    getSinks() {
      return this.videoHandler.getVideoElements() || [];
    }
    attach(t2) {
      this.videoHandler.addVideoElement(t2);
    }
    detach(t2) {
      this.videoHandler.removeVideoElement(t2);
    }
    addSink(t2) {
      this.addSinkInternal(t2, this.nativeTrack);
    }
    removeSink(t2) {
      t2.srcObject !== null && (t2.srcObject = null, this.reduceSinkCount());
    }
    cleanup() {
      super.cleanup(), this.videoHandler.cleanup();
    }
    addSinkInternal(t2, i2) {
      let r2 = t2.srcObject;
      if (r2 !== null && r2 instanceof MediaStream) {
        let o2 = r2.getVideoTracks()[0];
        if ((o2 == null ? void 0 : o2.id) === i2.id) {
          if (!o2.muted && o2.readyState === "live") return;
          this.reduceSinkCount();
        } else this.reduceSinkCount();
      }
      this.addPropertiesToElement(t2);
      let s2 = new MediaStream([i2]);
      t2.srcObject = s2, this.reTriggerPlay({ videoElement: t2 }), this.sinkCount++;
    }
    reduceSinkCount() {
      this.sinkCount > 0 && this.sinkCount--;
    }
    addPropertiesToElement(t2) {
      Cs || (t2.autoplay = true), t2.playsInline = true, t2.muted = true, t2.controls = false;
    }
  };
  var bt = { none: -1, low: 0, medium: 1, high: 2 };
  var wo = 0.5;
  var Qs = (a10, e) => {
    let t2 = "high", i2 = e.width > e.height ? "width" : "height", r2 = [...a10].sort((o2, n2) => bt[o2.layer] - bt[n2.layer]), s2 = e[i2] * ((window == null ? void 0 : window.devicePixelRatio) || 1);
    for (let o2 = 0; o2 < r2.length; o2++) {
      let { resolution: n2, layer: d2 } = r2[o2], u2 = n2[i2];
      if (s2 <= u2) {
        t2 = d2;
        break;
      } else {
        let p2 = r2[o2 + 1], h2 = p2 ? p2.resolution[i2] : Number.POSITIVE_INFINITY;
        if ((s2 - u2) / (h2 - u2) < wo) {
          t2 = d2;
          break;
        }
      }
    }
    return t2;
  };
  var Vr = class {
    constructor() {
      this.TAG = "[HMSIntersectionObserverWrapper]";
      this.listeners = /* @__PURE__ */ new WeakMap();
      this.observe = (e, t2) => {
        var i2;
        this.createObserver(), this.unobserve(e), (i2 = this.intersectionObserver) == null || i2.observe(e), this.listeners.set(e, t2);
      };
      this.unobserve = (e) => {
        var t2;
        (t2 = this.intersectionObserver) == null || t2.unobserve(e), this.listeners.delete(e);
      };
      this.createObserver = () => {
        this.isSupported() && !this.intersectionObserver && (this.intersectionObserver = new IntersectionObserver(this.handleIntersection));
      };
      this.handleIntersection = (e) => {
        var t2;
        for (let i2 of e) (t2 = this.listeners.get(i2.target)) == null || t2(i2);
      };
      this.createObserver();
    }
    isSupported() {
      let e = U2 && typeof window.IntersectionObserver != "undefined";
      return e || l2.w(this.TAG, "IntersectionObserver is not supported, fallback will be used instead"), e;
    }
  };
  var zs = new Vr();
  var Fr = class {
    constructor() {
      this.TAG = "[HMSResizeObserverWrapper]";
      this.listeners = /* @__PURE__ */ new WeakMap();
      this.observe = (e, t2, i2 = { box: "border-box" }) => {
        var r2;
        this.createObserver(), this.unobserve(e), (r2 = this.resizeObserver) == null || r2.observe(e, i2), this.listeners.set(e, t2);
      };
      this.unobserve = (e) => {
        var t2;
        (t2 = this.resizeObserver) == null || t2.unobserve(e), this.listeners.delete(e);
      };
      this.createObserver = () => {
        this.isSupported() && !this.resizeObserver && (this.resizeObserver = new ResizeObserver(gi(this.handleResize, 300)));
      };
      this.handleResize = (e) => {
        var t2;
        for (let i2 of e) (t2 = this.listeners.get(i2.target)) == null || t2(i2);
      };
      this.createObserver();
    }
    isSupported() {
      let e = U2 && typeof window.ResizeObserver != "undefined";
      return e || l2.w(this.TAG, "Resize Observer is not supported"), e;
    }
  };
  var Ys = new Fr();
  var tt = class {
    constructor(e) {
      this.track = e;
      this.TAG = "[VideoElementManager]";
      this.videoElements = /* @__PURE__ */ new Set();
      this.entries = /* @__PURE__ */ new WeakMap();
      this.handleIntersection = (e2) => c2(this, null, function* () {
        let t2 = getComputedStyle(e2.target).visibility === "visible";
        this.track.enabled && (e2.isIntersecting && t2 || !document.contains(e2.target)) ? (l2.d(this.TAG, "add sink intersection", `${this.track}`, this.id), this.entries.set(e2.target, e2.boundingClientRect), yield this.selectMaxLayer(), yield this.track.addSink(e2.target)) : (l2.d(this.TAG, "remove sink intersection", `${this.track}`, this.id), yield this.track.removeSink(e2.target));
      });
      this.handleResize = (e2) => c2(this, null, function* () {
        !this.track.enabled || !(this.track instanceof O2) || (this.entries.set(e2.target, e2.contentRect), yield this.selectMaxLayer());
      });
      this.cleanup = () => {
        this.videoElements.forEach((e2) => {
          var t2, i2;
          e2.srcObject = null, (t2 = this.resizeObserver) == null || t2.unobserve(e2), (i2 = this.intersectionObserver) == null || i2.unobserve(e2);
        }), this.videoElements.clear(), this.resizeObserver = void 0, this.intersectionObserver = void 0;
      };
      this.init(), this.id = v4_default();
    }
    updateSinks(e = false) {
      for (let t2 of this.videoElements) this.track.enabled ? this.track.addSink(t2, e) : this.track.removeSink(t2, e);
    }
    addVideoElement(e) {
      return c2(this, null, function* () {
        var t2;
        this.videoElements.has(e) || (this.init(), l2.d(this.TAG, `Adding video element for ${this.track}`, this.id), this.videoElements.add(e), this.videoElements.size >= 10 && l2.w(this.TAG, `${this.track}`, `the track is added to ${this.videoElements.size} video elements, while this may be intentional, it's likely that there is a bug leading to unnecessary creation of video elements in the UI`), (t2 = this.intersectionObserver) != null && t2.isSupported() ? this.intersectionObserver.observe(e, this.handleIntersection) : U2 && (this.isElementInViewport(e) ? this.track.addSink(e) : this.track.removeSink(e)), this.resizeObserver ? this.resizeObserver.observe(e, this.handleResize) : this.track instanceof O2 && (yield this.track.setPreferredLayer(this.track.getPreferredLayer())));
      });
    }
    removeVideoElement(e) {
      var t2, i2;
      this.track.removeSink(e), this.videoElements.delete(e), this.entries.delete(e), (t2 = this.resizeObserver) == null || t2.unobserve(e), (i2 = this.intersectionObserver) == null || i2.unobserve(e), l2.d(this.TAG, `Removing video element for ${this.track}`);
    }
    getVideoElements() {
      return Array.from(this.videoElements);
    }
    init() {
      U2 && (this.resizeObserver = Ys, this.intersectionObserver = zs);
    }
    isElementInViewport(e) {
      let t2 = e.offsetTop, i2 = e.offsetLeft, r2 = e.offsetWidth, s2 = e.offsetHeight, { hidden: o2 } = e, { opacity: n2, display: d2 } = getComputedStyle(e);
      for (; e.offsetParent; ) e = e.offsetParent, t2 += e.offsetTop, i2 += e.offsetLeft;
      return t2 < window.pageYOffset + window.innerHeight && i2 < window.pageXOffset + window.innerWidth && t2 + s2 > window.pageYOffset && i2 + r2 > window.pageXOffset && !o2 && (n2 !== "" ? parseFloat(n2) > 0 : true) && d2 !== "none";
    }
    selectMaxLayer() {
      return c2(this, null, function* () {
        if (!(this.track instanceof O2) || this.videoElements.size === 0) return;
        let e;
        for (let t2 of this.videoElements) {
          let i2 = this.entries.get(t2);
          if (!i2) continue;
          let { width: r2, height: s2 } = i2;
          if (r2 === 0 || s2 === 0) continue;
          let o2 = Qs(this.track.getSimulcastDefinitions(), { width: r2, height: s2 });
          e ? e = bt[o2] > bt[e] ? o2 : e : e = o2;
        }
        e && (l2.d(this.TAG, `selecting max layer ${e} for the track`, `${this.track}`), yield this.track.setPreferredLayer(e));
      });
    }
  };
  var Gr = ((t2) => (t2.TRANSFORM = "TRANSFORM", t2.ANALYZE = "ANALYZE", t2))(Gr || {});
  var Wr = ((t2) => (t2["2D"] = "2d", t2.WEBGL = "webgl", t2.WEBGL2 = "webgl2", t2))(Wr || {});
  var At = class {
    constructor() {
      this.total = 0;
      this.count = 0;
    }
    add(e) {
      this.count++, this.total += e;
    }
    getAvg() {
      return Math.floor(this.total / this.count);
    }
    reset() {
      this.total = 0, this.count = 0;
    }
  };
  var it = class {
    constructor(e) {
      this.eventBus = e;
      this.TAG = "[VideoPluginsAnalytics]";
      this.initTime = {}, this.preProcessingAvgs = new At(), this.addedTimestamps = {}, this.processingAvgs = {}, this.pluginAdded = {}, this.pluginInputFrameRate = {}, this.pluginFrameRate = {};
    }
    added(e, t2, i2) {
      this.pluginAdded[e] = true, this.addedTimestamps[e] = Date.now(), this.initTime[e] = 0, this.processingAvgs[e] = new At(), t2 && (this.pluginInputFrameRate[e] = t2, this.pluginFrameRate[e] = i2 || t2), this.eventBus.analytics.publish(me.added(e, this.addedTimestamps[e]));
    }
    removed(e) {
      var t2;
      if (this.pluginAdded[e]) {
        let i2 = { pluginName: e, duration: Math.floor((Date.now() - this.addedTimestamps[e]) / 1e3), loadTime: this.initTime[e], avgPreProcessingTime: this.preProcessingAvgs.getAvg(), avgProcessingTime: (t2 = this.processingAvgs[e]) == null ? void 0 : t2.getAvg(), inputFrameRate: this.pluginInputFrameRate[e], pluginFrameRate: this.pluginFrameRate[e] };
        this.eventBus.analytics.publish(me.stats(i2)), this.clean(e);
      }
    }
    failure(e, t2) {
      this.pluginAdded[e] && (this.eventBus.analytics.publish(me.failure(e, t2)), this.clean(e));
    }
    initWithTime(e, t2) {
      return c2(this, null, function* () {
        if (this.initTime[e]) {
          l2.i(this.TAG, `Plugin Already loaded ${e}, time it took: ${this.initTime[e]}`);
          return;
        }
        let i2;
        try {
          i2 = yield this.timeInMs(t2), l2.i(this.TAG, `Time taken for Plugin ${e} initialization : ${i2}`);
        } catch (r2) {
          let s2 = S2.MediaPluginErrors.InitFailed("VIDEO_PLUGINS", `failed during initialization of plugin${r2.message || r2}`);
          throw l2.e(this.TAG, s2), this.failure(e, s2), s2;
        }
        i2 && (this.initTime[e] = i2);
      });
    }
    preProcessWithTime(e) {
      return c2(this, null, function* () {
        let t2 = yield this.timeInMs(e);
        this.preProcessingAvgs.add(t2);
      });
    }
    processWithTime(e, t2) {
      return c2(this, null, function* () {
        var r2;
        let i2;
        try {
          i2 = yield this.timeInMs(t2);
        } catch (s2) {
          let o2 = S2.MediaPluginErrors.ProcessingFailed("VIDEO_PLUGINS", `Failed during processing of plugin${s2.message || s2}`);
          throw l2.e(this.TAG, o2), this.failure(e, o2), o2;
        }
        i2 && ((r2 = this.processingAvgs[e]) == null || r2.add(i2));
      });
    }
    timeInMs(e) {
      return c2(this, null, function* () {
        let t2 = Date.now();
        return yield e(), Math.floor(Date.now() - t2);
      });
    }
    clean(e) {
      delete this.addedTimestamps[e], delete this.initTime[e], delete this.processingAvgs[e], delete this.pluginAdded[e], delete this.pluginInputFrameRate[e], delete this.pluginFrameRate[e];
    }
  };
  var Xs = 24;
  var No = 320;
  var Oo = 240;
  var It = class {
    constructor(e, t2) {
      this.TAG = "[VideoPluginsManager]";
      this.pluginsLoopRunning = false;
      this.pluginsLoopState = "paused";
      this.pluginAddInProgress = false;
      this.reusableWorker = js();
      this.hmsTrack = e, this.pluginsMap = /* @__PURE__ */ new Map(), this.pluginNumFramesToSkip = {}, this.pluginNumFramesSkipped = {}, this.analytics = new it(t2), this.canvases = new Array();
    }
    getPlugins() {
      return Array.from(this.pluginsMap.keys());
    }
    addPlugin(e, t2) {
      return c2(this, null, function* () {
        var i2;
        if (this.pluginAddInProgress) {
          let r2 = (i2 = e.getName) == null ? void 0 : i2.call(e);
          if (!r2 || r2 === "") {
            l2.w("no name provided by the plugin");
            return;
          }
          let s2 = S2.MediaPluginErrors.AddAlreadyInProgress("VIDEO_PLUGINS", "Add Plugin is already in Progress");
          throw this.analytics.failure(r2, s2), l2.w("can't add another plugin when previous add is in progress"), s2;
        }
        this.pluginAddInProgress = true;
        try {
          yield this.addPluginInternal(e, t2);
        } finally {
          this.pluginAddInProgress = false;
        }
      });
    }
    addPluginInternal(e, t2) {
      return c2(this, null, function* () {
        var o2, n2;
        let i2 = (o2 = e.getName) == null ? void 0 : o2.call(e);
        if (!i2 || i2 === "") {
          l2.w("no name provided by the plugin");
          return;
        }
        if (this.pluginsMap.has(i2)) {
          l2.w(this.TAG, `plugin - ${e.getName()} already added.`);
          return;
        }
        let r2 = this.hmsTrack.getMediaTrackSettings().frameRate || Xs, s2 = 0;
        t2 && t2 > 0 ? (l2.i(this.TAG, `adding plugin ${e.getName()} with framerate ${t2}`), t2 < r2 && (s2 = Math.ceil(r2 / t2) - 1), this.analytics.added(i2, r2, t2)) : (l2.i(this.TAG, `adding plugin ${e.getName()}`), this.analytics.added(i2, r2)), l2.i(this.TAG, "numFrames to skip processing", s2), this.pluginNumFramesToSkip[i2] = s2, this.pluginNumFramesSkipped[i2] = s2, this.validateAndThrow(i2, e);
        try {
          if (yield this.analytics.initWithTime(i2, () => c2(this, null, function* () {
            return yield e.init();
          })), this.pluginsMap.set(i2, e), this.pluginsMap.size + 1 > this.canvases.length) for (let d2 = this.canvases.length; d2 <= this.pluginsMap.size; d2++) this.canvases[d2] = document.createElement("canvas");
          yield this.startPluginsLoop((n2 = e.getContextType) == null ? void 0 : n2.call(e));
        } catch (d2) {
          throw l2.e(this.TAG, "failed to add plugin", d2), yield this.removePlugin(e), d2;
        }
      });
    }
    validatePlugin(e) {
      return e.checkSupport();
    }
    validateAndThrow(e, t2) {
      let i2 = this.validatePlugin(t2);
      if (i2.isSupported) l2.i(this.TAG, `plugin is supported,- ${t2.getName()}`);
      else {
        let r2;
        switch (i2.errType) {
          case "PLATFORM_NOT_SUPPORTED":
            throw r2 = S2.MediaPluginErrors.PlatformNotSupported("VIDEO_PLUGINS", "platform not supported, see docs"), this.analytics.failure(e, r2), r2;
          case "DEVICE_NOT_SUPPORTED":
            throw r2 = S2.MediaPluginErrors.DeviceNotSupported("VIDEO_PLUGINS", "video device not supported, see docs"), this.analytics.failure(e, r2), r2;
        }
      }
    }
    removePlugin(e) {
      return c2(this, null, function* () {
        let t2 = e.getName();
        if (!this.pluginsMap.get(t2)) {
          l2.w(this.TAG, `plugin - ${t2} not found to remove.`);
          return;
        }
        l2.i(this.TAG, `removing plugin ${t2}`), this.removePluginEntry(t2), this.pluginsMap.size === 0 && (l2.i(this.TAG, "No plugins left, stopping plugins loop"), yield this.stopPluginsLoop()), e.stop(), this.analytics.removed(t2);
      });
    }
    removePluginEntry(e) {
      this.pluginsMap.delete(e), this.pluginNumFramesToSkip[e] && delete this.pluginNumFramesToSkip[e], this.pluginNumFramesSkipped[e] && delete this.pluginNumFramesSkipped[e];
    }
    waitForRestart() {
      return c2(this, null, function* () {
        if (!(!this.pluginsLoopRunning || this.pluginsLoopState === "running")) for (; this.pluginsLoopState === "paused"; ) yield xe(100);
      });
    }
    cleanup() {
      return c2(this, null, function* () {
        var e;
        for (let t2 of this.pluginsMap.values()) yield this.removePlugin(t2);
        (e = this.outputTrack) == null || e.stop();
      });
    }
    initElementsAndStream(e) {
      this.inputCanvas || (this.inputCanvas = document.createElement("canvas")), this.outputCanvas = document.createElement("canvas"), this.inputVideo || (this.inputVideo = document.createElement("video")), this.inputCanvas.getContext("2d"), this.outputCanvas.getContext(e || "2d");
      let t2 = this.outputCanvas.captureStream();
      this.outputTrack = t2.getVideoTracks()[0];
    }
    startPluginsLoop(e) {
      return c2(this, null, function* () {
        if (!this.pluginsLoopRunning) {
          this.initElementsAndStream(e), this.pluginsLoopRunning = true;
          try {
            yield this.hmsTrack.setProcessedTrack(this.outputTrack);
          } catch (t2) {
            throw this.pluginsLoopRunning = false, l2.e(this.TAG, "error in setting processed track", t2), t2;
          }
          this.pluginsLoop().then(() => {
            l2.d(this.TAG, "processLoop stopped");
          });
        }
      });
    }
    stopPluginsLoop() {
      return c2(this, null, function* () {
        var e;
        this.pluginsLoopRunning = false, yield this.hmsTrack.setProcessedTrack(void 0), this.resetCanvases(), (e = this.outputTrack) == null || e.stop(), this.inputVideo && (this.inputVideo.srcObject = null, this.inputVideo = void 0);
      });
    }
    pluginsLoop() {
      return c2(this, null, function* () {
        for (; this.pluginsLoopRunning; ) {
          let e = this.hmsTrack.getMediaTrackSettings().frameRate || Xs, t2 = Math.floor(1e3 / e);
          if (!this.hmsTrack.enabled || this.hmsTrack.nativeTrack.readyState === "ended") {
            this.pluginsLoopState === "running" && this.resetCanvases(), this.pluginsLoopState = "paused", yield this.reusableWorker.sleep(t2);
            continue;
          }
          let i2 = 0;
          try {
            yield this.analytics.preProcessWithTime(() => c2(this, null, function* () {
              return yield this.doPreProcessing();
            }));
            let r2 = Date.now();
            yield this.processFramesThroughPlugins(), i2 = Math.floor(Date.now() - r2), i2 > t2 && (i2 = t2);
          } catch (r2) {
            l2.e(this.TAG, "error in plugins loop", r2);
          }
          this.pluginsLoopState = "running", yield this.reusableWorker.sleep(t2 - i2);
        }
      });
    }
    doPreProcessing() {
      return c2(this, null, function* () {
        yield this.addTrackToVideo(), yield this.updateInputCanvas();
      });
    }
    processFramesThroughPlugins() {
      return c2(this, null, function* () {
        this.canvases[0] = this.inputCanvas;
        let e = 0;
        for (let t2 of this.pluginsMap.values()) {
          let i2 = t2.getName();
          if (t2) {
            try {
              let r2 = this.checkIfSkipRequired(i2);
              if (t2.getPluginType() === "TRANSFORM") {
                let s2 = (o2, n2) => c2(this, null, function* () {
                  try {
                    yield t2.processVideoFrame(o2, n2, r2);
                  } catch (d2) {
                    l2.e(this.TAG, `error in processing plugin ${i2}`, d2);
                  }
                });
                if (r2) e === this.pluginsMap.size - 1 ? yield s2(this.canvases[e], this.outputCanvas) : yield s2(this.canvases[e], this.canvases[e + 1]);
                else {
                  let o2 = this.canvases[e], n2 = this.canvases[e + 1];
                  e === this.pluginsMap.size - 1 ? yield this.analytics.processWithTime(i2, () => c2(this, null, function* () {
                    return s2(o2, this.outputCanvas);
                  })) : yield this.analytics.processWithTime(i2, () => c2(this, null, function* () {
                    return s2(o2, n2);
                  }));
                }
              } else t2.getPluginType() === "ANALYZE" && !r2 && (yield this.analytics.processWithTime(i2, () => c2(this, null, function* () {
                return yield t2.processVideoFrame(this.inputCanvas);
              })));
            } catch (r2) {
              l2.e(this.TAG, `error in processing plugin ${i2}`, r2), yield this.removePlugin(t2);
            }
            e++;
          }
        }
      });
    }
    addTrackToVideo() {
      return c2(this, null, function* () {
        var t2;
        if (!this.inputVideo) return;
        let e = this.inputVideo.srcObject;
        e !== null && e instanceof MediaStream && ((t2 = e.getVideoTracks()[0]) == null ? void 0 : t2.id) === this.hmsTrack.nativeTrack.id || (this.inputVideo.pause(), this.inputVideo.srcObject = new MediaStream([this.hmsTrack.nativeTrack]), this.inputVideo.muted = true, this.inputVideo.playsInline = true, yield this.inputVideo.play());
      });
    }
    updateInputCanvas() {
      return c2(this, null, function* () {
        if (!this.inputCanvas || !this.inputVideo) return;
        let { width: e = No, height: t2 = Oo } = this.hmsTrack.getMediaTrackSettings();
        this.inputCanvas.height !== t2 && (this.inputCanvas.height = t2), this.inputCanvas.width !== e && (this.inputCanvas.width = e), this.inputCanvas.getContext("2d").drawImage(this.inputVideo, 0, 0, e, t2);
      });
    }
    resetCanvases() {
      if (!this.outputCanvas || !this.inputCanvas) return;
      let e = this.inputCanvas.getContext("2d");
      e && (e.fillStyle = "rgb(0, 0, 0)", e.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height)), this.canvases = [];
    }
    checkIfSkipRequired(e) {
      let t2 = false;
      return this.pluginNumFramesSkipped[e] < this.pluginNumFramesToSkip[e] ? (this.pluginNumFramesSkipped[e]++, t2 = true) : (t2 = false, this.pluginNumFramesSkipped[e] = 0), t2;
    }
  };
  var fi = class {
    constructor(e, t2) {
      this.TAG = "[MediaStreamPluginsManager]";
      this.plugins = /* @__PURE__ */ new Set(), this.analytics = new it(e), this.room = t2;
    }
    addPlugins(e) {
      e.forEach((t2) => {
        var i2;
        switch (t2.getName()) {
          case "HMSEffectsPlugin":
            if (!((i2 = this.room) != null && i2.isEffectsEnabled)) {
              let r2 = "Effects Virtual Background is not enabled for this room";
              if (this.plugins.size === 0) throw Error(r2);
              l2.w(this.TAG, r2);
              return;
            }
            break;
          default:
        }
        this.plugins.add(t2);
      });
    }
    removePlugins(e) {
      e.forEach((t2) => {
        t2.stop(), this.analytics.removed(t2.getName()), this.plugins.delete(t2);
      });
    }
    applyPlugins(e) {
      let t2 = e;
      for (let i2 of this.plugins) {
        let r2 = i2.getName();
        try {
          t2 = i2.apply(t2), this.analytics.added(r2);
        } catch (s2) {
          this.analytics.failure(r2, s2), l2.e("Could not apply plugin", s2, r2);
        }
      }
      return t2;
    }
    getPlugins() {
      return Array.from(this.plugins).map((e) => e.getName());
    }
    cleanup() {
      return c2(this, null, function* () {
        this.removePlugins(Array.from(this.plugins));
      });
    }
  };
  function Zs(a10, e) {
    return function(i2) {
      return !(0, import_lodash2.default)(a10[i2], e[i2]);
    };
  }
  var G2 = class a6 extends et {
    constructor(t2, i2, r2, s2, o2 = new q2().build(), n2) {
      super(t2, i2, r2);
      this.eventBus = s2;
      this.room = n2;
      this._layerDefinitions = [];
      this.TAG = "[HMSLocalVideoTrack]";
      this.enabledStateBeforeBackground = false;
      this.isCurrentTab = false;
      this.isPublished = false;
      this.replaceSenderTrack = (t3) => c2(this, null, function* () {
        if (!this.transceiver || this.transceiver.direction !== "sendonly") {
          l2.d(this.TAG, `transceiver for ${this.trackId} not available or not connected yet`);
          return;
        }
        yield this.transceiver.sender.replaceTrack(t3);
      });
      this.buildNewSettings = (t3) => {
        let { width: i3, height: r3, codec: s3, maxFramerate: o3, maxBitrate: n3, deviceId: d2, advanced: u2, facingMode: p2 } = m(m({}, this.settings), t3);
        return new Ke(i3, r3, s3, o3, d2, u2, n3, p2);
      };
      this.handleSettingsChange = (t3) => c2(this, null, function* () {
        let i3 = this.stream, r3 = Zs(t3, this.settings);
        if (r3("maxBitrate") && t3.maxBitrate && (yield i3.setMaxBitrateAndFramerate(this)), r3("width") || r3("height") || r3("advanced")) if (this.source === "video") {
          let s3 = yield this.replaceTrackWith(t3);
          yield this.replaceSender(s3, this.enabled), this.nativeTrack = s3, yield this.processPlugins(), this.videoHandler.updateSinks();
        } else yield this.nativeTrack.applyConstraints(t3.toConstraints());
      });
      this.handleDeviceChange = (t3, i3 = false) => c2(this, null, function* () {
        if (Zs(t3, this.settings)("deviceId") && this.source === "regular") {
          if (this.enabled) {
            delete t3.facingMode;
            let o3 = yield this.replaceTrackWith(t3);
            yield this.replaceSender(o3, this.enabled), this.nativeTrack = o3, yield this.processPlugins(), this.videoHandler.updateSinks();
          }
          let s3 = this.nativeTrack.getSettings().groupId;
          !i3 && t3.deviceId && (X2.updateSelection("videoInput", { deviceId: t3.deviceId, groupId: s3 }), this.eventBus.deviceChange.publish({ isUserSelection: true, type: "video", selection: { deviceId: t3.deviceId, groupId: s3 } }));
        }
      });
      this.trackPermissions = () => {
        Si("camera", (t3) => {
          this.eventBus.analytics.publish(y2.permissionChange(this.type, t3)), t3 === "denied" && this.eventBus.localVideoEnabled.publish({ enabled: false, track: this });
        });
      };
      this.handleTrackMute = () => {
        l2.d(this.TAG, "muted natively", document.visibilityState);
        let t3 = document.visibilityState === "hidden" ? "visibility-change" : "incoming-call";
        this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: true, reason: t3 })), this.eventBus.localVideoEnabled.publish({ enabled: false, track: this });
      };
      this.handleTrackUnmuteNatively = () => c2(this, null, function* () {
        l2.d(this.TAG, "unmuted natively");
        let t3 = document.visibilityState === "hidden" ? "visibility-change" : "incoming-call";
        this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: false, reason: t3 })), this.handleTrackUnmute(), this.eventBus.localVideoEnabled.publish({ enabled: this.enabled, track: this }), this.eventBus.localVideoUnmutedNatively.publish(), yield this.setEnabled(this.enabled);
      });
      this.removeOrReplaceProcessedTrack = (t3) => c2(this, null, function* () {
        t3 ? t3 !== this.processedTrack && (this.processedTrack = t3) : this.processedTrack = void 0, yield this.replaceSenderTrack(this.processedTrack || this.nativeTrack);
      });
      this.handleVisibilityChange = () => c2(this, null, function* () {
        if (document.visibilityState === "hidden") this.enabledStateBeforeBackground = this.enabled, this.enabled && (yield this.setEnabled(false)), this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: true, reason: "visibility-change" }));
        else {
          if (this.eventBus.analytics.publish(this.sendInterruptionEvent({ started: false, reason: "visibility-change" })), this.permissionState && this.permissionState !== "granted") {
            l2.d(this.TAG, "On visibile not replacing track as permission is not granted");
            return;
          }
          if (l2.d(this.TAG, "visibility visible, restoring track state", this.enabledStateBeforeBackground), this.enabledStateBeforeBackground) try {
            yield this.setEnabled(true);
          } catch (t3) {
            this.eventBus.error.publish(t3);
          }
        }
      });
      this.addTrackEventListeners(i2), this.trackPermissions(), t2.tracks.push(this), this.setVideoHandler(new tt(this)), this.settings = o2, o2.deviceId !== i2.getSettings().deviceId && i2.enabled && (this.settings = this.buildNewSettings({ deviceId: i2.getSettings().deviceId })), this.pluginsManager = new It(this, s2), this.mediaStreamPluginsManager = new fi(s2, n2), this.setFirstTrackId(this.trackId), this.eventBus.localAudioUnmutedNatively.subscribe(this.handleTrackUnmute), U2 && r2 === "regular" && Mt() && document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
    clone(t2) {
      let i2 = this.nativeTrack.clone();
      t2.nativeStream.addTrack(i2);
      let r2 = new a6(t2, i2, this.source, this.eventBus, this.settings, this.room);
      return r2.peerId = this.peerId, this.pluginsManager.pluginsMap.size > 0 && this.pluginsManager.pluginsMap.forEach((s2) => {
        r2.addPlugin(s2).catch((o2) => l2.e(this.TAG, "Plugin add failed while migrating", s2, o2));
      }), this.mediaStreamPluginsManager.plugins.size > 0 && r2.addStreamPlugins(Array.from(this.mediaStreamPluginsManager.plugins)), r2;
    }
    setSimulcastDefinitons(t2) {
      this._layerDefinitions = t2;
    }
    getSimulcastDefinitions() {
      return this._layerDefinitions;
    }
    setEnabled(t2) {
      return c2(this, null, function* () {
        var i2;
        if (t2 !== this.enabled) {
          if (this.source === "regular") {
            let r2;
            t2 ? r2 = yield this.replaceTrackWith(this.settings) : r2 = yield this.replaceTrackWithBlank(), yield this.replaceSender(r2, t2), (i2 = this.nativeTrack) == null || i2.stop(), this.nativeTrack = r2, yield ne(a6.prototype, this, "setEnabled").call(this, t2), t2 && (yield this.pluginsManager.waitForRestart(), yield this.processPlugins(), this.settings = this.buildNewSettings({ deviceId: r2.getSettings().deviceId })), this.videoHandler.updateSinks();
          }
          this.eventBus.localVideoEnabled.publish({ enabled: t2, track: this });
        }
      });
    }
    processPlugins() {
      return c2(this, null, function* () {
        try {
          if (this.pluginsManager.getPlugins().length > 0) return;
          if (this.mediaStreamPluginsManager.getPlugins().length > 0) {
            let r2 = this.mediaStreamPluginsManager.applyPlugins(new MediaStream([this.nativeTrack])).getVideoTracks()[0];
            yield this.setProcessedTrack(r2);
          } else yield this.setProcessedTrack();
          this.videoHandler.updateSinks();
        } catch (t2) {
          console.error("error in processing plugin(s)", t2);
        }
      });
    }
    addStreamPlugins(t2) {
      return c2(this, null, function* () {
        if (this.pluginsManager.getPlugins().length > 0) throw Error("Plugins of type HMSMediaStreamPlugin and HMSVideoPlugin cannot be used together");
        this.mediaStreamPluginsManager.addPlugins(t2), yield this.processPlugins();
      });
    }
    removeStreamPlugins(t2) {
      return c2(this, null, function* () {
        this.mediaStreamPluginsManager.removePlugins(t2), yield this.processPlugins();
      });
    }
    isPublishedTrackId(t2) {
      return this.publishedTrackId === t2;
    }
    addSink(t2) {
      this.addSinkInternal(t2, this.processedTrack || this.nativeTrack);
    }
    setSettings(t2, i2 = false) {
      return c2(this, null, function* () {
        let r2 = this.buildNewSettings(t2);
        if (yield this.handleDeviceChange(r2, i2), !this.enabled || ye(this.nativeTrack)) {
          this.settings = r2;
          return;
        } else yield this.pluginsManager.waitForRestart();
        yield this.handleSettingsChange(r2), this.settings = r2;
      });
    }
    getPlugins() {
      return this.mediaStreamPluginsManager.getPlugins().length > 0 ? this.mediaStreamPluginsManager.getPlugins() : this.pluginsManager.getPlugins();
    }
    addPlugin(t2, i2) {
      return c2(this, null, function* () {
        if (this.mediaStreamPluginsManager.getPlugins().length > 0) throw Error("Plugins of type HMSVideoPlugin and HMSMediaStreamPlugin cannot be used together");
        return this.pluginsManager.addPlugin(t2, i2);
      });
    }
    removePlugin(t2) {
      return c2(this, null, function* () {
        return this.pluginsManager.removePlugin(t2);
      });
    }
    validatePlugin(t2) {
      return this.pluginsManager.validatePlugin(t2);
    }
    cleanup() {
      return c2(this, null, function* () {
        var t2;
        this.eventBus.localAudioUnmutedNatively.unsubscribe(this.handleTrackUnmute), this.removeTrackEventListeners(this.nativeTrack), yield this.mediaStreamPluginsManager.cleanup(), yield this.pluginsManager.cleanup(), ne(a6.prototype, this, "cleanup").call(this), this.transceiver = void 0, (t2 = this.processedTrack) == null || t2.stop(), this.isPublished = false, U2 && Mt() && document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      });
    }
    cropTo(t2) {
      return c2(this, null, function* () {
        if (t2 && this.source === "screen") try {
          this.nativeTrack.cropTo && (yield this.nativeTrack.cropTo(t2));
        } catch (i2) {
          throw l2.e(this.TAG, "failed to crop screenshare capture - ", i2), S2.TracksErrors.GenericTrack("TRACK", "failed to crop screenshare capture");
        }
      });
    }
    getCaptureHandle() {
      if (this.nativeTrack.getCaptureHandle) return this.nativeTrack.getCaptureHandle();
    }
    setProcessedTrack(t2) {
      return c2(this, null, function* () {
        if (!this.nativeTrack.enabled) {
          this.processedTrack = t2;
          return;
        }
        yield this.removeOrReplaceProcessedTrack(t2), this.videoHandler.updateSinks();
      });
    }
    getTrackIDBeingSent() {
      return this.getTrackBeingSent().id;
    }
    getTrackBeingSent() {
      return this.enabled ? this.processedTrack || this.nativeTrack : this.nativeTrack;
    }
    switchCamera() {
      return c2(this, null, function* () {
        var s2;
        let t2 = this.getMediaTrackSettings().facingMode;
        if (!t2 || this.source !== "regular") {
          l2.d(this.TAG, "facingMode not supported");
          return;
        }
        let i2 = t2 === "environment" ? "user" : "environment";
        (s2 = this.nativeTrack) == null || s2.stop();
        let r2 = yield this.replaceTrackWith(this.buildNewSettings({ facingMode: i2, deviceId: void 0 }));
        yield this.replaceSender(r2, this.enabled), this.nativeTrack = r2, yield this.processPlugins(), this.videoHandler.updateSinks(), this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId, facingMode: i2 }), X2.updateSelection("videoInput", { deviceId: this.settings.deviceId, groupId: this.nativeTrack.getSettings().groupId });
      });
    }
    replaceTrackWith(t2) {
      return c2(this, null, function* () {
        let i2 = this.nativeTrack;
        this.removeTrackEventListeners(i2), i2 == null || i2.stop();
        try {
          let r2 = yield Br(t2);
          return this.addTrackEventListeners(r2), l2.d(this.TAG, "replaceTrack, Previous track stopped", i2, "newTrack", r2), this.settings.deviceId === "default" && (this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId })), r2;
        } catch (r2) {
          let s2 = r2;
          if (s2.code === k2.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE || s2.code === k2.TracksErrors.SYSTEM_DENIED_PERMISSION) {
            let n2 = yield this.replaceTrackWithBlank();
            throw this.addTrackEventListeners(n2), yield this.replaceSender(n2, this.enabled), this.nativeTrack = n2, this.videoHandler.updateSinks(), s2;
          }
          let o2 = yield Br(this.settings);
          throw this.addTrackEventListeners(o2), yield this.replaceSender(o2, this.enabled), this.nativeTrack = o2, yield this.processPlugins(), this.videoHandler.updateSinks(), this.isPublished && this.eventBus.analytics.publish(y2.publish({ error: s2 })), s2;
        }
      });
    }
    replaceTrackWithBlank() {
      return c2(this, null, function* () {
        let t2 = this.nativeTrack, i2 = Se.getEmptyVideoTrack(t2);
        return this.removeTrackEventListeners(t2), this.addTrackEventListeners(i2), t2 == null || t2.stop(), l2.d(this.TAG, "replaceTrackWithBlank, Previous track stopped", t2, "newTrack", i2), i2;
      });
    }
    replaceSender(t2, i2) {
      return c2(this, null, function* () {
        i2 ? yield this.replaceSenderTrack(this.processedTrack || t2) : yield this.replaceSenderTrack(t2), this.stream.replaceStreamTrack(this.nativeTrack, t2);
      });
    }
    addTrackEventListeners(t2) {
      t2.addEventListener("mute", this.handleTrackMute), t2.addEventListener("unmute", this.handleTrackUnmuteNatively);
    }
    removeTrackEventListeners(t2) {
      t2.removeEventListener("mute", this.handleTrackMute), t2.removeEventListener("unmute", this.handleTrackUnmuteNatively);
    }
  };
  var rt = "renegotiation-callback-id";
  var vi = "ion-sfu";
  var st = "SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID";
  var ea = "https://event.100ms.live/v2/client/report";
  var ta = "https://event-nonprod.100ms.live/v2/client/report";
  var Rt = Math.pow(2, 31) - 1;
  var V = { DEVICE_CHANGE: "device-change", LOCAL_AUDIO_ENABLED: "local-audio-enabled", LOCAL_VIDEO_ENABLED: "local-video-enabled", LOCAL_VIDEO_UNMUTED_NATIVELY: "local-video-unmuted-natively", LOCAL_AUDIO_UNMUTED_NATIVELY: "local-audio-unmuted-natively", STATS_UPDATE: "stats-update", RTC_STATS_UPDATE: "rtc-stats-update", TRACK_DEGRADED: "track-degraded", TRACK_RESTORED: "track-restored", TRACK_AUDIO_LEVEL_UPDATE: "track-audio-level-update", LOCAL_AUDIO_SILENCE: "local-audio-silence", ANALYTICS: "analytics", AUDIO_PLUGIN_FAILED: "audio-plugin-failed", POLICY_CHANGE: "policy-change", LOCAL_ROLE_UPDATE: "local-role-update", AUDIO_TRACK_UPDATE: "audio-track-update", AUDIO_TRACK_ADDED: "audio-track-added", AUDIO_TRACK_REMOVED: "audio-track-removed", AUTOPLAY_ERROR: "autoplay-error", LEAVE: "leave", ERROR: "error" };
  var ia = "2.5";
  var ra = "20250115";
  var Ae = "_handraise";
  var $r = 1e3;
  var Kr = 64;
  var sa = "https://whiteboard.100ms.live";
  var aa = "https://whiteboard-qa.100ms.live";
  var O2 = class a7 extends et {
    constructor(t2, i2, r2, s2) {
      super(t2, i2, r2);
      this._degraded = false;
      this._degradedAt = null;
      this._layerDefinitions = [];
      this.history = new qr();
      this.preferredLayer = "high";
      this.disableNoneLayerRequest = false;
      this.disableNoneLayerRequest = !!s2, this.setVideoHandler(new tt(this));
    }
    setTrackId(t2) {
      this.bizTrackId = t2;
    }
    get trackId() {
      return this.bizTrackId || super.trackId;
    }
    get degraded() {
      return this._degraded;
    }
    get degradedAt() {
      return this._degradedAt;
    }
    setEnabled(t2) {
      return c2(this, null, function* () {
        t2 !== this.enabled && (ne(a7.prototype, this, "setEnabled").call(this, t2), this.videoHandler.updateSinks(true));
      });
    }
    setPreferredLayer(t2) {
      return c2(this, null, function* () {
        if (t2 === "none") {
          l2.w("layer none will be ignored");
          return;
        }
        if (this.preferredLayer = t2, !!this.shouldSendVideoLayer(t2, "preferLayer")) {
          if (!this.hasSinks()) {
            l2.d(`[Remote Track] ${this.logIdentifier}
        streamId=${this.stream.id} 
        trackId=${this.trackId}
        saving ${t2}, source=${this.source}
        Track does not have any sink`);
            return;
          }
          yield this.requestLayer(t2, "preferLayer"), this.pushInHistory(`uiPreferLayer-${t2}`);
        }
      });
    }
    getSimulcastLayer() {
      return this.stream.getSimulcastLayer();
    }
    getLayer() {
      return this.stream.getVideoLayer();
    }
    getPreferredLayer() {
      return this.preferredLayer;
    }
    getPreferredLayerDefinition() {
      return this._layerDefinitions.find((t2) => t2.layer === this.preferredLayer);
    }
    replaceTrack(t2) {
      this.nativeTrack = t2.nativeTrack, t2.transceiver && (this.transceiver = t2.transceiver, this.stream.updateId(t2.stream.id)), this.videoHandler.updateSinks();
    }
    addSink(t2, i2 = true) {
      return c2(this, null, function* () {
        ye(this.nativeTrack) ? yield this.requestLayer(this.preferredLayer, "addSink") : (ne(a7.prototype, this, "addSink").call(this, t2), i2 && (yield this.updateLayer("addSink"))), this.pushInHistory("uiSetLayer-high");
      });
    }
    removeSink(t2, i2 = true) {
      return c2(this, null, function* () {
        ne(a7.prototype, this, "removeSink").call(this, t2), i2 && (yield this.updateLayer("removeSink")), this._degraded = false, this.pushInHistory("uiSetLayer-none");
      });
    }
    getSimulcastDefinitions() {
      return [...this._layerDefinitions];
    }
    setSimulcastDefinitons(t2) {
      this._layerDefinitions = t2;
    }
    setLayerFromServer(t2) {
      this._degraded = this.getDegradationValue(t2), this._degradedAt = this._degraded ? /* @__PURE__ */ new Date() : this._degradedAt;
      let i2 = t2.current_layer;
      return l2.d(`[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id} 
      trackId=${this.trackId}
      layer update from sfu
      currLayer=${t2.current_layer}
      preferredLayer=${t2.expected_layer}
      sub_degraded=${t2.subscriber_degraded}
      pub_degraded=${t2.publisher_degraded}
      isDegraded=${this._degraded}`), this.stream.setVideoLayerLocally(i2, this.logIdentifier, "setLayerFromServer"), this.pushInHistory(`sfuLayerUpdate-${i2}`), this._degraded;
    }
    getDegradationValue(t2) {
      return this.enabled && (t2.publisher_degraded || t2.subscriber_degraded) && t2.current_layer === "none";
    }
    updateLayer(t2) {
      return c2(this, null, function* () {
        let i2 = this.preferredLayer;
        this.enabled && this.hasSinks() ? i2 = this.preferredLayer : this.disableNoneLayerRequest || (i2 = "none"), this.shouldSendVideoLayer(i2, t2) && (yield this.requestLayer(i2, t2));
      });
    }
    pushInHistory(t2) {
    }
    requestLayer(t2, i2) {
      return c2(this, null, function* () {
        try {
          let r2 = yield this.stream.setVideoLayer(t2, this.trackId, this.logIdentifier, i2);
          return l2.d(`[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id}
      trackId=${this.trackId}
      Requested layer ${t2}, source=${i2}`), r2;
        } catch (r2) {
          throw l2.d(`[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id}
      trackId=${this.trackId}
      Failed to set layer ${t2}, source=${i2}
      error=${r2.message}`), r2;
        }
      });
    }
    shouldSendVideoLayer(t2, i2) {
      let r2 = this.getLayer();
      return this.degraded && t2 === "none" ? true : r2 === t2 ? (l2.d(`[Remote Track] ${this.logIdentifier}`, `Not sending update, already on layer ${t2}, source=${i2}`), false) : true;
    }
  };
  var qr = class {
    constructor() {
      this.history = [];
    }
    push(e) {
      e.time = (/* @__PURE__ */ new Date()).toISOString().split("T")[1], this.history.push(e);
    }
  };
  var ge = class extends Ye {
    constructor() {
      super(...arguments);
      this.TAG = "[HMSLocalStream]";
      this.connection = null;
    }
    setConnection(t2) {
      this.connection = t2;
    }
    addTransceiver(t2, i2) {
      let r2 = this.connection.addTransceiver(t2.getTrackBeingSent(), { streams: [this.nativeStream], direction: "sendonly", sendEncodings: this.getTrackEncodings(t2, i2) });
      return this.setPreferredCodec(r2, t2.nativeTrack.kind), t2.transceiver = r2, r2;
    }
    setMaxBitrateAndFramerate(t2, i2) {
      return c2(this, null, function* () {
        var r2;
        yield (r2 = this.connection) == null ? void 0 : r2.setMaxBitrateAndFramerate(t2, i2);
      });
    }
    setPreferredCodec(t2, i2) {
    }
    replaceStreamTrack(t2, i2) {
      this.nativeStream.addTrack(i2), this.nativeStream.removeTrack(t2);
    }
    removeSender(t2) {
      var s2, o2;
      if (!this.connection || this.connection.connectionState === "closed") {
        l2.d(this.TAG, "publish connection is not initialised or closed");
        return;
      }
      let i2 = (s2 = t2.transceiver) == null ? void 0 : s2.sender;
      if (!i2) {
        l2.w(this.TAG, `No sender found for trackId=${t2.trackId}`);
        return;
      }
      (o2 = this.connection) == null || o2.removeTrack(i2);
      let r2 = this.tracks.indexOf(t2);
      r2 !== -1 ? this.tracks.splice(r2, 1) : l2.w(this.TAG, `Cannot find ${t2.trackId} in locally stored tracks`);
    }
    getTrackEncodings(t2, i2) {
      let r2 = [];
      if (t2 instanceof G2) if (i2.length > 0) l2.d(this.TAG, "Simulcast enabled with layers", i2), r2.push(...i2);
      else {
        let s2 = { active: this.nativeStream.active };
        t2.settings.maxBitrate && !Ge && (s2.maxBitrate = t2.settings.maxBitrate), r2.push(s2);
      }
      return r2;
    }
  };
  var be = class extends Ye {
    constructor(t2, i2) {
      super(t2);
      this.audio = true;
      this.video = "none";
      this.connection = i2;
    }
    setAudio(t2, i2, r2) {
      return c2(this, null, function* () {
        this.audio !== t2 && (this.audio = t2, l2.d(`[Remote stream] ${r2 || ""} 
    streamId=${this.id}
    trackId=${i2}
    subscribing audio - ${this.audio}`), yield this.connection.sendOverApiDataChannelWithResponse({ params: { subscribed: this.audio, track_id: i2 }, method: "prefer-audio-track-state" }));
      });
    }
    setVideoLayerLocally(t2, i2, r2) {
      this.video = t2, l2.d(`[Remote stream] ${i2}
    streamId=${this.id}
    source: ${r2}
    Setting layer field to=${t2}`);
    }
    setVideoLayer(t2, i2, r2, s2) {
      return l2.d(`[Remote stream] ${r2} 
      streamId=${this.id}
      trackId=${i2} 
      source: ${s2} request ${t2} layer`), this.setVideoLayerLocally(t2, r2, s2), this.connection.sendOverApiDataChannelWithResponse({ params: { max_spatial_layer: this.video, track_id: i2 }, method: "prefer-video-track-state" });
    }
    getSimulcastLayer() {
      return this.video;
    }
    getVideoLayer() {
      return this.video;
    }
    isAudioSubscribed() {
      return this.audio;
    }
  };
  var oa = (a10, e, t2, i2) => c2(void 0, null, function* () {
    var o2;
    let r2, s2 = {};
    if ((o2 = e.transceiver) != null && o2.sender.track) {
      try {
        r2 = yield e.transceiver.sender.getStats();
        let n2 = {}, d2 = {}, u2 = {};
        r2 == null || r2.forEach((p2) => {
          switch (p2.type) {
            case "outbound-rtp":
              d2[p2.id] = p2;
              break;
            case "remote-inbound-rtp":
              u2[p2.ssrc] = p2;
              break;
            case "codec":
              n2[p2.id] = p2.mimeType;
              break;
            default:
              break;
          }
        }), Object.keys(m({}, d2)).forEach((p2) => {
          var v2, R2;
          let h2 = (v2 = d2[p2]) == null ? void 0 : v2.codecId, T = h2 ? n2[h2] : void 0, g2;
          T && (g2 = T.substring(T.indexOf("/") + 1));
          let f2 = M2(m({}, d2[p2]), { rid: (R2 = d2[p2]) == null ? void 0 : R2.rid }), P2 = u2[f2.ssrc];
          s2[p2] = M2(m({}, f2), { bitrate: Ht("bytesSent", f2, i2 == null ? void 0 : i2[p2]), packetsLost: P2 == null ? void 0 : P2.packetsLost, jitter: P2 == null ? void 0 : P2.jitter, roundTripTime: P2 == null ? void 0 : P2.roundTripTime, totalRoundTripTime: P2 == null ? void 0 : P2.totalRoundTripTime, peerName: t2, peerID: e.peerId, enabled: e.enabled, codec: g2 });
        });
      } catch (n2) {
        a10.analytics.publish(y2.rtcStatsFailed(S2.WebrtcErrors.StatsFailed("TRACK", `Error getting local track stats ${e.trackId} - ${n2.message}`))), l2.w("[HMSWebrtcStats]", "Error in getting local track stats", e, n2, n2.name);
      }
      return s2;
    }
  });
  var na = (a10, e, t2, i2) => c2(void 0, null, function* () {
    var d2;
    let r2;
    try {
      r2 = yield (d2 = e.transceiver) == null ? void 0 : d2.receiver.getStats();
    } catch (u2) {
      a10.analytics.publish(y2.rtcStatsFailed(S2.WebrtcErrors.StatsFailed("TRACK", `Error getting remote track stats ${e.trackId} - ${u2.message}`))), l2.w("[HMSWebrtcStats]", "Error in getting remote track stats", e, u2);
    }
    let s2 = Uo(r2), o2 = Ht("bytesReceived", s2, i2), n2 = jr("packetsLost", s2, i2);
    return s2 != null && s2.remote && Object.assign(s2.remote, { packetsLostRate: jr("packetsLost", s2.remote, i2 == null ? void 0 : i2.remote) }), s2 && M2(m({}, s2), { bitrate: o2, packetsLostRate: n2, peerID: e.peerId, enabled: e.enabled, peerName: t2, codec: s2.codec });
  });
  var Uo = (a10) => {
    let e, t2, i2 = {};
    a10 == null || a10.forEach((o2) => {
      switch (o2.type) {
        case "inbound-rtp":
          e = o2;
          break;
        case "outbound-rtp":
          e = o2;
          break;
        case "remote-inbound-rtp":
          t2 = o2;
          break;
        case "codec":
          i2[o2.id] = o2.mimeType;
          break;
        default:
          break;
      }
    });
    let r2 = e != null && e.codecId ? i2[e.codecId] : void 0, s2;
    return r2 && (s2 = r2.substring(r2.indexOf("/") + 1)), e && Object.assign(e, { remote: t2, codec: s2 });
  };
  var Jr = (a10, e, t2) => {
    let i2 = Bo(e), r2 = Ht(a10 === "publish" ? "bytesSent" : "bytesReceived", i2, t2 && t2[a10]);
    return i2 && Object.assign(i2, { bitrate: r2 });
  };
  var Bo = (a10) => {
    let e;
    return a10 == null || a10.forEach((t2) => {
      t2.type === "transport" && (e = a10 == null ? void 0 : a10.get(t2.selectedCandidatePairId));
    }), e || a10 == null || a10.forEach((t2) => {
      t2.type === "candidate-pair" && t2.selected && (e = t2);
    }), e;
  };
  var ca = (a10) => {
    let e = { packetsLost: 0, jitter: 0 };
    return a10 == null || a10.forEach((t2) => {
      t2.packetsLost && (e.packetsLost += t2.packetsLost), t2.jitter > e.jitter && (e.jitter = t2.jitter);
    }), e;
  };
  var da = (a10, e) => Array.from(new Set(a10.concat(e)));
  var Ht = (a10, e, t2) => jr(a10, e, t2) * 8;
  var jr = (a10, e, t2) => {
    let i2 = e && e[a10], r2 = t2 ? t2[a10] : null;
    return [e, t2, he(i2), he(r2)].every((o2) => !!o2) ? Qr(i2, r2, e == null ? void 0 : e.timestamp, t2 == null ? void 0 : t2.timestamp) * 1e3 : 0;
  };
  var Qr = (a10, e, t2, i2) => he(a10) && he(e) && t2 && i2 ? (a10 - e) / (t2 - i2) : 0;
  var Mi = class {
    constructor(e, t2, i2, r2) {
      this.store = e;
      this.eventBus = t2;
      this.publishConnection = i2;
      this.subscribeConnection = r2;
      this.TAG = "[HMSWebrtcStats]";
      this.peerStats = {};
      this.remoteTrackStats = {};
      this.localTrackStats = {};
      this.getLocalPeerStats = () => this.peerStats[this.localPeerID];
      this.getRemoteTrackStats = (e2) => this.remoteTrackStats[e2];
      this.getAllRemoteTracksStats = () => this.remoteTrackStats;
      this.getLocalTrackStats = () => this.localTrackStats;
      this.updateStats = () => c2(this, null, function* () {
        yield this.updateLocalPeerStats(), yield this.updateLocalTrackStats(), yield this.updateRemoteTrackStats();
      });
      this.updateLocalPeerStats = () => c2(this, null, function* () {
        var p2, h2, T, g2;
        let e2 = this.getLocalPeerStats(), t3;
        try {
          t3 = yield (p2 = this.publishConnection) == null ? void 0 : p2.getStats();
        } catch (f2) {
          this.eventBus.analytics.publish(y2.rtcStatsFailed(S2.WebrtcErrors.StatsFailed("PUBLISH", f2.message))), l2.w(this.TAG, "Error in getting publish stats", f2);
        }
        let i3 = t3 && Jr("publish", t3, e2), r3;
        try {
          r3 = yield (h2 = this.subscribeConnection) == null ? void 0 : h2.getStats();
        } catch (f2) {
          this.eventBus.analytics.publish(y2.rtcStatsFailed(S2.WebrtcErrors.StatsFailed("SUBSCRIBE", f2.message))), l2.w(this.TAG, "Error in getting subscribe stats", f2);
        }
        let s3 = r3 && Jr("subscribe", r3, e2), { packetsLost: o2, jitter: n2 } = ca(r3), d2 = Qr(o2, (T = e2 == null ? void 0 : e2.subscribe) == null ? void 0 : T.packetsLost, s3 == null ? void 0 : s3.timestamp, (g2 = e2 == null ? void 0 : e2.subscribe) == null ? void 0 : g2.timestamp), u2 = s3 && Object.assign(s3, { packetsLostRate: d2, jitter: n2, packetsLost: o2 });
        this.peerStats[this.localPeerID] = { publish: i3, subscribe: u2 };
      });
      this.updateRemoteTrackStats = () => c2(this, null, function* () {
        var i3;
        let e2 = Array.from(this.store.getTracksMap().values()).filter((r3) => r3 instanceof O2 || r3 instanceof ie), t3 = e2.map((r3) => r3.trackId);
        Object.keys(this.remoteTrackStats).forEach((r3) => {
          t3.includes(r3) || delete this.remoteTrackStats[r3];
        });
        for (let r3 of e2) {
          let s3 = r3.peerId && ((i3 = this.store.getPeerById(r3.peerId)) == null ? void 0 : i3.name), o2 = this.getRemoteTrackStats(r3.trackId), n2 = yield na(this.eventBus, r3, s3, o2);
          n2 && (this.remoteTrackStats[r3.trackId] = n2);
        }
      });
      this.updateLocalTrackStats = () => c2(this, null, function* () {
        var i3;
        let e2 = this.store.getLocalPeerTracks().reduce((r3, s3) => (r3[s3.getTrackIDBeingSent()] = s3, r3), {}), t3 = da(Object.keys(this.localTrackStats), Object.keys(e2));
        for (let r3 of t3) {
          let s3 = e2[r3];
          if (s3) {
            let o2 = (i3 = this.store.getLocalPeer()) == null ? void 0 : i3.name, n2 = yield oa(this.eventBus, s3, o2, this.localTrackStats[r3]);
            n2 && (this.localTrackStats[r3] = n2);
          } else delete this.localTrackStats[r3];
        }
      });
      var s2;
      this.localPeerID = (s2 = this.store.getLocalPeer()) == null ? void 0 : s2.peerId;
    }
    setPeerConnections({ publish: e, subscribe: t2 }) {
      this.publishConnection = e, this.subscribeConnection = t2;
    }
    getPublishPeerConnection() {
      return this.publishConnection;
    }
    getSubscribePeerConnection() {
      return this.subscribeConnection;
    }
  };
  var yi = class {
    constructor(e, t2) {
      this.store = e;
      this.eventBus = t2;
      this.TAG = "[HMSWebrtcInternals]";
      this.interval = 1e3;
      this.isMonitored = false;
      this.handleStatsUpdate = () => c2(this, null, function* () {
        var e2;
        yield (e2 = this.hmsStats) == null ? void 0 : e2.updateStats(), this.hmsStats && this.eventBus.statsUpdate.publish(this.hmsStats);
      });
    }
    getCurrentStats() {
      return this.hmsStats;
    }
    getPublishPeerConnection() {
      var e;
      return (e = this.hmsStats) == null ? void 0 : e.getPublishPeerConnection();
    }
    getSubscribePeerConnection() {
      var e;
      return (e = this.hmsStats) == null ? void 0 : e.getSubscribePeerConnection();
    }
    onStatsChange(e) {
      return this.eventBus.statsUpdate.subscribe(e), () => {
        this.eventBus.statsUpdate.unsubscribe(e);
      };
    }
    setPeerConnections({ publish: e, subscribe: t2 }) {
      this.hmsStats ? this.hmsStats.setPeerConnections({ publish: e, subscribe: t2 }) : this.hmsStats = new Mi(this.store, this.eventBus, e, t2);
    }
    start() {
      return c2(this, null, function* () {
        if (this.isMonitored) {
          l2.d(this.TAG, "Already started");
          return;
        }
        this.stop(), this.isMonitored = true, l2.d(this.TAG, "Starting Webrtc Stats Monitor"), this.startLoop().then(() => l2.d(this.TAG, "Stopping Webrtc Stats Monitor")).catch((e) => {
          this.eventBus.analytics.publish(y2.rtcStatsFailed(S2.WebrtcErrors.StatsFailed("PUBLISH", e.message))), l2.e(this.TAG, e.message);
        });
      });
    }
    stop() {
      this.isMonitored = false;
    }
    startLoop() {
      return c2(this, null, function* () {
        for (; this.isMonitored; ) yield this.handleStatsUpdate(), yield Q2(this.interval);
      });
    }
    cleanup() {
      this.stop(), this.eventBus.statsUpdate.removeAllListeners();
    }
  };
  var at = class {
    constructor({ peerId: e, name: t2, isLocal: i2, customerUserId: r2, metadata: s2, role: o2, joinedAt: n2, groups: d2, realtime: u2, type: p2 }) {
      this.customerUserId = "";
      this.metadata = "";
      this.auxiliaryTracks = [];
      this.name = t2, this.peerId = e, this.isLocal = i2, this.customerUserId = r2, this.metadata = s2, this.joinedAt = n2, this.groups = d2, this.realtime = u2, this.type = p2, o2 && (this.role = o2);
    }
    get isHandRaised() {
      var e;
      return !!((e = this.groups) != null && e.includes(Ae));
    }
    updateRole(e) {
      this.role = e;
    }
    updateName(e) {
      this.name = e;
    }
    updateNetworkQuality(e) {
      this.networkQuality = e;
    }
    updateMetadata(e) {
      this.metadata = e;
    }
    updateGroups(e) {
      this.groups = e;
    }
    toString() {
      var e, t2, i2, r2;
      return `{
      name: ${this.name};
      role: ${(e = this.role) == null ? void 0 : e.name};
      peerId: ${this.peerId};
      customerUserId: ${this.customerUserId};
      ${this.audioTrack ? `audioTrack: ${(t2 = this.audioTrack) == null ? void 0 : t2.trackId};` : ""}
      ${this.videoTrack ? `videoTrack: ${(i2 = this.videoTrack) == null ? void 0 : i2.trackId};` : ""}
      groups: ${(r2 = this.groups) == null ? void 0 : r2.join()}
    }`;
    }
  };
  var ot = class {
  };
  ot.makePeerId = () => v4_default();
  var qe = class extends at {
    constructor(t2) {
      super(M2(m({}, t2), { peerId: ot.makePeerId(), isLocal: true }));
      this.isLocal = true;
      this.auxiliaryTracks = [];
      this.asRole = t2.asRole;
    }
    isInPreview() {
      return !!this.asRole;
    }
    toString() {
      var t2, i2, r2;
      return `{
      name: ${this.name};
      role: ${(t2 = this.role) == null ? void 0 : t2.name};
      peerId: ${this.peerId};
      customerUserId: ${this.customerUserId};
      ${this.asRole ? `asRole: ${this.asRole.name};` : ""}
      ${this.audioTrack ? `audioTrack: ${(i2 = this.audioTrack) == null ? void 0 : i2.trackId};` : ""}
      ${this.videoTrack ? `videoTrack: ${(r2 = this.videoTrack) == null ? void 0 : r2.trackId};` : ""}
    }`;
    }
  };
  var Ct = class extends at {
    constructor(t2) {
      super(M2(m({}, t2), { isLocal: false }));
      this.isLocal = false;
      this.auxiliaryTracks = [];
      this.fromRoomState = false;
      this.fromRoomState = !!t2.fromRoomState;
    }
  };
  var ke = (a10, e) => new Ct({ peerId: a10.peer_id, name: a10.info.name, role: e.getPolicyForRole(a10.role), customerUserId: a10.info.user_id, metadata: a10.info.data, groups: a10.groups, type: a10.info.type });
  var ki = class {
    constructor(e, t2, i2) {
      this.transport = e;
      this.store = t2;
      this.options = i2;
      this.isEnd = false;
      this.iterator = null;
      this.total = 0;
      this.defaultPaginationLimit = 10;
    }
    validateConnection() {
      if (!this.transport || !this.store) throw Error("Use usePaginatedParticipants or hmsActions.getPeerListIterator after preview or join has happened");
    }
    hasNext() {
      return !this.isEnd;
    }
    getTotal() {
      return this.total;
    }
    findPeers() {
      return c2(this, null, function* () {
        var t2;
        this.validateConnection();
        let e = yield this.transport.signal.findPeers(M2(m({}, this.options || {}), { limit: ((t2 = this.options) == null ? void 0 : t2.limit) || this.defaultPaginationLimit }));
        return this.updateState(e), this.processPeers(e.peers);
      });
    }
    next() {
      return c2(this, null, function* () {
        var t2;
        this.validateConnection();
        let e;
        return !this.iterator && !this.isEnd ? yield this.findPeers() : this.iterator ? (e = yield this.transport.signal.peerIterNext({ iterator: this.iterator, limit: ((t2 = this.options) == null ? void 0 : t2.limit) || this.defaultPaginationLimit }), this.updateState(e), this.processPeers(e.peers)) : [];
      });
    }
    processPeers(e) {
      let t2 = [];
      return e.forEach((i2) => {
        let r2 = ke(i2, this.store);
        t2.push(r2);
      }), t2;
    }
    updateState(e) {
      this.isEnd = e.eof, this.total = e.total, e.iterator && (this.iterator = e.iterator);
    }
  };
  var nt = class {
    constructor(e) {
      this.TAG = "[AudioContextManager]";
      this.audioContext = new AudioContext(), this.source = this.audioContext.createMediaElementSource(e), this.source.connect(this.audioContext.destination);
    }
    resumeContext() {
      return c2(this, null, function* () {
        this.audioContext.state === "suspended" && (yield this.audioContext.resume(), l2.d(this.TAG, "AudioContext is resumed"));
      });
    }
    getAudioTrack() {
      return this.destinationNode && this.source.disconnect(this.destinationNode), this.destinationNode = this.audioContext.createMediaStreamDestination(), this.source.connect(this.destinationNode), this.destinationNode.stream.getAudioTracks()[0];
    }
    cleanup() {
      this.audioContext.state !== "closed" && this.audioContext.close().catch((e) => {
        l2.d(this.TAG, "AudioContext close error", e.message);
      });
    }
  };
  var Ue = class extends import_eventemitter2.EventEmitter2 {
    on(e, t2) {
      return super.on(e, t2);
    }
    off(e, t2) {
      return super.off(e, t2);
    }
    emit(e, t2) {
      return super.emit(e, t2);
    }
    listeners(e) {
      return super.listeners(e);
    }
  };
  var Ei = class extends Ue {
    constructor() {
      super(...arguments);
      this.audioElement = null;
      this.TAG = "[PlaylistAudioManager]";
      this.seeked = false;
    }
    play(t2) {
      return c2(this, null, function* () {
        return this.audioElement = this.getAudioElement(), new Promise((i2, r2) => {
          this.audioElement = this.getAudioElement(), this.audioElement.src = t2, this.seeked = false, this.audioElement.onerror = () => {
            let s2 = `Error loading ${t2}`;
            l2.e(this.TAG, s2), this.stop(), r2(s2);
          }, this.audioElement.oncanplaythrough = () => c2(this, null, function* () {
            try {
              if (!this.audioElement) return;
              if (this.audioContextManager.resumeContext(), this.track) this.seeked ? this.seeked = false : (yield this.audioElement.play(), i2([this.track]));
              else {
                yield this.audioElement.play();
                let s2 = this.audioContextManager.getAudioTrack();
                this.track = s2, i2([s2]);
              }
            } catch (s2) {
              l2.e(this.TAG, "Error playing audio", t2, s2.message), r2(s2);
            }
          }), this.audioElement.onseeked = () => {
            this.seeked = true;
          };
        });
      });
    }
    getTracks() {
      return this.track ? [this.track.id] : [];
    }
    getElement() {
      return this.audioElement || (this.audioElement = this.getAudioElement()), this.audioElement;
    }
    stop() {
      var t2, i2, r2;
      (t2 = this.audioElement) == null || t2.pause(), (i2 = this.audioElement) == null || i2.removeAttribute("src"), this.audioElement = null, (r2 = this.audioContextManager) == null || r2.cleanup(), this.track = void 0;
    }
    getAudioElement() {
      if (this.audioElement) return this.audioElement;
      let t2 = document.createElement("audio");
      return t2.crossOrigin = "anonymous", t2.addEventListener("timeupdate", (i2) => this.emit("progress", i2)), t2.addEventListener("ended", () => {
        this.emit("ended", null);
      }), this.audioContextManager = new nt(t2), t2;
    }
  };
  var Pi = class extends Ue {
    constructor() {
      super(...arguments);
      this.TAG = "[PlaylistVideoManager]";
      this.videoElement = null;
      this.canvasContext = null;
      this.tracks = [];
      this.DEFAUL_FPS = 24;
      this.seeked = false;
      this.drawImage = () => {
        var t2, i2, r2;
        this.videoElement && !this.videoElement.paused && !this.videoElement.ended && ((r2 = this.canvasContext) == null || r2.drawImage(this.videoElement, 0, 0, (t2 = this.canvas) == null ? void 0 : t2.width, (i2 = this.canvas) == null ? void 0 : i2.height), this.timer = setTimeout(() => {
          this.drawImage();
        }, 1e3 / this.DEFAUL_FPS));
      };
    }
    play(t2) {
      return this.videoElement = this.getVideoElement(), this.createCanvas(), new Promise((i2, r2) => {
        this.videoElement = this.getVideoElement(), this.videoElement.src = t2, this.seeked = false, this.videoElement.onerror = () => {
          let s2 = `Error loading ${t2}`;
          l2.e(this.TAG, s2), this.stop(), r2(s2);
        }, this.videoElement.oncanplaythrough = () => c2(this, null, function* () {
          var s2, o2, n2;
          try {
            if (!this.videoElement) return;
            if (this.canvas.width = this.videoElement.videoWidth, this.canvas.height = this.videoElement.videoHeight, this.tracks.length === 0) {
              this.clearCanvasAndTracks();
              let d2 = this.canvas.captureStream();
              if (!d2) {
                l2.e(this.TAG, "Browser does not support captureStream");
                return;
              }
              this.videoElement.onplay = this.drawImage, yield this.audioContextManager.resumeContext(), yield this.videoElement.play();
              let u2 = this.audioContextManager.getAudioTrack();
              d2.addTrack(u2), d2.getTracks().forEach((p2) => {
                this.tracks.push(p2);
              }), i2(this.tracks);
            } else this.seeked ? (this.seeked = false, (n2 = this.canvasContext) == null || n2.drawImage(this.videoElement, 0, 0, (s2 = this.canvas) == null ? void 0 : s2.width, (o2 = this.canvas) == null ? void 0 : o2.height)) : (yield this.videoElement.play(), i2(this.tracks));
          } catch (d2) {
            l2.e(this.TAG, "Error playing video", t2, d2.message), r2(d2);
          }
        }), this.videoElement.onseeked = () => {
          this.seeked = true;
        };
      });
    }
    getTracks() {
      return this.tracks.map((t2) => t2.id);
    }
    getElement() {
      return this.videoElement || (this.videoElement = this.getVideoElement()), this.videoElement;
    }
    stop() {
      var t2, i2, r2;
      (t2 = this.videoElement) == null || t2.pause(), (i2 = this.videoElement) == null || i2.removeAttribute("src"), this.videoElement = null, (r2 = this.audioContextManager) == null || r2.cleanup(), this.clearCanvasAndTracks();
    }
    clearCanvasAndTracks() {
      var t2;
      this.tracks = [], (t2 = this.canvasContext) == null || t2.clearRect(0, 0, this.canvas.width, this.canvas.height), clearTimeout(this.timer);
    }
    getVideoElement() {
      if (this.videoElement) return this.videoElement;
      let t2 = document.createElement("video");
      return t2.crossOrigin = "anonymous", t2.addEventListener("timeupdate", (i2) => this.emit("progress", i2)), t2.addEventListener("ended", () => {
        this.emit("ended", null);
      }), this.audioContextManager = new nt(t2), t2;
    }
    createCanvas() {
      this.canvas || (this.canvas = document.createElement("canvas"), this.canvasContext = this.canvas.getContext("2d"));
    }
  };
  var bi = { audio: { list: [], currentIndex: -1, isAutoplayOn: true }, video: { list: [], currentIndex: -1, isAutoplayOn: true } };
  var Lt = class extends Ue {
    constructor(t2, i2) {
      super();
      this.sdk = t2;
      this.eventBus = i2;
      this.state = { audio: m({}, bi.audio), video: m({}, bi.video) };
      this.TAG = "[PlaylistManager]";
      this.handlePausePlaylist = (r2) => c2(this, [r2], function* ({ enabled: t3, track: i3 }) {
        var o2;
        if (t3) return;
        let s2;
        i3.source === "audioplaylist" && (s2 = "audio"), i3.source === "videoplaylist" && (s2 = "video"), s2 && ((o2 = this.getElement(s2)) == null || o2.pause());
      });
      this.addTrack = (t3, i3) => c2(this, null, function* () {
        yield this.sdk.addTrack(t3, i3), l2.d(this.TAG, "Playlist track added", ui(t3));
      });
      this.removeTrack = (t3) => c2(this, null, function* () {
        yield this.sdk.removeTrack(t3, true), l2.d(this.TAG, "Playlist track removed", t3);
      });
      this.audioManager = new Ei(), this.videoManager = new Pi(), this.addListeners();
    }
    getList(t2 = "audio") {
      return this.state[t2].list;
    }
    setList(t2) {
      if (!t2 || t2.length === 0) {
        l2.w(this.TAG, "Please pass in a list of HMSPlaylistItem's");
        return;
      }
      t2.forEach((i2) => {
        this.state[i2.type].list.find((r2) => r2.id === i2.id) || this.state[i2.type].list.push(i2);
      });
    }
    clearList(t2) {
      return c2(this, null, function* () {
        this.isPlaying(t2) && (yield this.stop(t2)), this.state[t2].list = [];
      });
    }
    removeItem(t2, i2) {
      return c2(this, null, function* () {
        let { list: r2, currentIndex: s2 } = this.state[i2], o2 = r2.findIndex((n2) => t2 === n2.id);
        return o2 > -1 ? (s2 === o2 && this.isPlaying(i2) && (yield this.stop(i2)), r2.splice(o2, 1), true) : false;
      });
    }
    seek(t2, i2 = "audio") {
      let { currentIndex: r2 } = this.state[i2];
      if (r2 === -1) throw S2.PlaylistErrors.NoEntryToPlay("PLAYLIST", "No item is currently playing");
      let s2 = this.getElement(i2);
      if (s2) {
        let o2 = Math.max(s2.currentTime + t2, 0);
        s2.currentTime = Math.min(o2, s2.duration);
      }
    }
    seekTo(t2, i2 = "audio") {
      let { currentIndex: r2 } = this.state[i2];
      if (r2 === -1) throw S2.PlaylistErrors.NoEntryToPlay("PLAYLIST", "No item is currently playing");
      if (t2 < 0) throw Error("value cannot be negative");
      let s2 = this.getElement(i2);
      s2 && (s2.currentTime = Math.min(t2, s2.duration));
    }
    setVolume(t2, i2 = "audio") {
      if (t2 < 0 || t2 > 100) throw Error("Please pass a valid number between 0-100");
      let r2 = this.getElement(i2);
      r2 && (r2.volume = t2 * 0.01);
    }
    getVolume(t2 = "audio") {
      let i2 = this.getElement(t2);
      return i2 ? Math.floor(i2.volume * 100) : 0;
    }
    getCurrentTime(t2 = "audio") {
      let i2 = this.getElement(t2);
      return (i2 == null ? void 0 : i2.currentTime) || 0;
    }
    getCurrentIndex(t2 = "audio") {
      return this.state[t2].currentIndex;
    }
    getCurrentProgress(t2 = "audio") {
      var n2;
      let { list: i2, currentIndex: r2 } = this.state[t2], s2 = (n2 = i2[r2]) == null ? void 0 : n2.url, o2 = this.getElement(t2);
      return !s2 || !o2 ? 0 : Math.floor(100 * (o2.currentTime / o2.duration));
    }
    getCurrentSelection(t2 = "audio") {
      let { list: i2, currentIndex: r2 } = this.state[t2];
      if (r2 !== -1) return i2[r2];
    }
    isPlaying(t2 = "audio") {
      let i2 = this.getElement(t2);
      return !!i2 && !i2.paused;
    }
    setIsAutoplayOn(t2 = "audio", i2) {
      this.state[t2].isAutoplayOn = i2;
    }
    getPlaybackRate(t2 = "audio") {
      let i2 = this.getElement(t2);
      return i2 ? i2.playbackRate : 1;
    }
    setPlaybackRate(t2 = "audio", i2) {
      if (i2 < 0.25 || i2 > 2) throw Error("Please pass a value between 0.25 and 2.0");
      let r2 = this.getElement(t2);
      r2 && (r2.playbackRate = i2);
    }
    setEnabled(s2, o2) {
      return c2(this, arguments, function* (t2, { id: i2, type: r2 = "audio" }) {
        let d2 = this.state[r2].list.findIndex((p2) => p2.id === i2);
        if (!i2 || d2 === -1) {
          l2.w(this.TAG, "Pass a valid id");
          return;
        }
        let u2 = this.state[r2].list[d2].url;
        t2 ? yield this.play(u2, r2) : yield this.pause(u2, r2), this.state[r2].currentIndex = d2, this.setDuration(r2);
      });
    }
    playNext() {
      return c2(this, arguments, function* (t2 = "audio") {
        let { list: i2, currentIndex: r2 } = this.state[t2];
        if (r2 >= i2.length - 1) throw S2.PlaylistErrors.NoEntryToPlay("PLAYLIST", "Reached end of playlist");
        yield this.play(i2[r2 + 1].url, t2), this.state[t2].currentIndex = r2 + 1, this.setDuration(t2);
      });
    }
    playPrevious() {
      return c2(this, arguments, function* (t2 = "audio") {
        let { list: i2, currentIndex: r2 } = this.state[t2];
        if (r2 <= 0) throw S2.PlaylistErrors.NoEntryToPlay("PLAYLIST", "Reached start of playlist");
        yield this.play(i2[r2 - 1].url, t2), this.state[t2].currentIndex = r2 - 1, this.setDuration(t2);
      });
    }
    stop() {
      return c2(this, arguments, function* (t2 = "audio") {
        var r2;
        let i2 = t2 === "audio" ? this.audioManager : this.videoManager;
        (r2 = i2.getElement()) == null || r2.pause(), yield this.removeTracks(t2), i2.stop(), this.state[t2].currentIndex = -1;
      });
    }
    cleanup() {
      this.state = { audio: m({}, bi.audio), video: m({}, bi.video) }, this.eventBus.localAudioEnabled.unsubscribe(this.handlePausePlaylist), this.eventBus.localVideoEnabled.unsubscribe(this.handlePausePlaylist), this.audioManager.stop(), this.videoManager.stop();
    }
    onProgress(t2) {
      this.videoManager.on("progress", () => {
        try {
          t2({ type: "video", progress: this.getCurrentProgress("video") });
        } catch (i2) {
          l2.e(this.TAG, "Error in onProgress callback");
        }
      }), this.audioManager.on("progress", () => {
        try {
          t2({ type: "audio", progress: this.getCurrentProgress("audio") });
        } catch (i2) {
          l2.e(this.TAG, "Error in onProgress callback");
        }
      });
    }
    onNewTrackStart(t2) {
      this.on("newTrackStart", t2);
    }
    onPlaylistEnded(t2) {
      this.on("playlistEnded", t2);
    }
    onCurrentTrackEnded(t2) {
      this.on("currentTrackEnded", t2);
    }
    getElement(t2 = "audio") {
      return t2 === "audio" ? this.audioManager.getElement() : this.videoManager.getElement();
    }
    removeTracks() {
      return c2(this, arguments, function* (t2 = "audio") {
        let r2 = (t2 === "audio" ? this.audioManager : this.videoManager).getTracks();
        for (let s2 of r2) yield this.removeTrack(s2);
      });
    }
    play(r2) {
      return c2(this, arguments, function* (t2, i2 = "audio") {
        let s2 = i2 === "audio" ? this.audioManager : this.videoManager, o2 = s2.getElement();
        if (this.isItemCurrentlyPlaying(t2, i2)) {
          l2.w(this.TAG, `The ${i2} is currently playing`);
          return;
        }
        if (o2 != null && o2.src.includes(t2)) yield o2.play();
        else {
          o2 == null || o2.pause();
          let n2 = yield s2.play(t2);
          for (let d2 of n2) yield this.addTrack(d2, i2 === "audio" ? "audioplaylist" : "videoplaylist");
        }
      });
    }
    isItemCurrentlyPlaying(t2, i2) {
      let r2 = this.getElement(i2);
      return !!(r2 && !r2.paused && r2.src.includes(t2));
    }
    setDuration(t2 = "audio") {
      let i2 = this.getElement(t2), { list: r2, currentIndex: s2 } = this.state[t2];
      r2[s2] && (r2[s2].duration = (i2 == null ? void 0 : i2.duration) || 0), this.emit("newTrackStart", r2[s2]);
    }
    pause(r2) {
      return c2(this, arguments, function* (t2, i2 = "audio") {
        let s2 = this.getElement(i2);
        s2 && !s2.paused && s2.src.includes(t2) ? (s2.pause(), l2.d(this.TAG, "paused url", t2)) : l2.w(this.TAG, "The passed in url is not currently playing");
      });
    }
    addListeners() {
      this.audioManager.on("ended", () => this.handleEnded("audio")), this.videoManager.on("ended", () => this.handleEnded("video")), this.eventBus.localAudioEnabled.subscribe(this.handlePausePlaylist), this.eventBus.localVideoEnabled.subscribe(this.handlePausePlaylist);
    }
    handleEnded() {
      return c2(this, arguments, function* (t2 = "audio") {
        let { list: i2, currentIndex: r2, isAutoplayOn: s2 } = this.state[t2];
        r2 === i2.length - 1 ? (yield this.stop(t2), this.emit("playlistEnded", t2)) : s2 ? this.playNext(t2) : yield this.pause(i2[r2].url, t2), this.emit("currentTrackEnded", i2[r2]);
      });
    }
  };
  var F = (a10) => a10.room;
  var Go = (a10) => a10.errors;
  var Mm = createSelector(Go, (a10) => a10.length === 0 ? null : a10.at(-1));
  var ym = createSelector(F, (a10) => a10.id);
  var z2 = (a10) => a10.peers;
  var Ai = (a10) => a10.messages.byID;
  var la = (a10) => a10.messages.allIDs;
  var N2 = (a10) => a10.tracks;
  var ua = (a10) => a10.settings;
  var zr = (a10) => a10.appData;
  var Wo = (a10) => a10.speakers;
  var Be = createSelector([F], (a10) => a10 && a10.isConnected);
  var Pm = createSelector([Be, F], (a10, e) => a10 ? e.peerCount !== void 0 ? e.peerCount || 1 : e.peers.length : Math.max(e.peerCount !== void 0 ? e.peerCount : e.peers.length - 1, 0));
  var $o = (a10) => a10.hideLocalPeer;
  var Ee = createSelector([F, z2, $o], (a10, e, t2) => t2 ? a10.peers.filter((i2) => a10.localPeer !== i2).map((i2) => e[i2]) : a10.peers.map((i2) => e[i2]));
  var Ko = createSelector(N2, (a10) => Object.values(a10));
  var re = createSelector(F, z2, (a10, e) => e[a10.localPeer]);
  var Ie = createSelector(F, (a10) => a10.localPeer);
  var bm = createSelector(re, (a10) => a10 == null ? void 0 : a10.name);
  var Am = createSelector(re, (a10) => a10 == null ? void 0 : a10.roleName);
  var le = createSelector(re, (a10) => a10 == null ? void 0 : a10.audioTrack);
  var Z2 = createSelector(re, (a10) => a10 == null ? void 0 : a10.videoTrack);
  var qo = createSelector(re, (a10) => a10 == null ? void 0 : a10.auxiliaryTracks);
  var pa = createSelector([le, Z2, qo], (a10, e, t2) => {
    let i2 = t2 ? [...t2] : [];
    return a10 && i2.unshift(a10), e && i2.unshift(e), i2;
  });
  var Im = createSelector(Ee, (a10) => a10.filter((e) => !e.isLocal));
  var Rm = createSelector(z2, Wo, (a10, e) => {
    let t2 = Object.entries(e).sort((i2, r2) => {
      var n2, d2;
      let s2 = ((n2 = i2[1]) == null ? void 0 : n2.audioLevel) || 0;
      return (((d2 = r2[1]) == null ? void 0 : d2.audioLevel) || 0) > s2 ? 1 : -1;
    });
    if (t2.length > 0 && t2[0][1].audioLevel && t2[0][1].audioLevel > 0) {
      let i2 = t2[0][1].peerID;
      if (i2 in a10) return a10[i2];
    }
    return null;
  });
  var Yr = (a10) => {
    let e = re(a10);
    return ze(a10, e == null ? void 0 : e.videoTrack);
  };
  var ha = (a10) => {
    let e = re(a10);
    return ys(a10, e == null ? void 0 : e.videoTrack);
  };
  var Xr = createSelector(re, N2, (a10, e) => {
    let { video: t2, audio: i2 } = Fe(e, a10);
    return !!(t2 || i2);
  });
  var jo = createSelector(z2, N2, (a10, e) => {
    let t2;
    for (let i2 in a10) {
      let r2 = a10[i2], { video: s2, audio: o2 } = Fe(e, r2);
      if (s2) return r2;
      o2 && !t2 && (t2 = r2);
    }
    return t2;
  });
  var Cm = createSelector(jo, (a10) => !!a10);
  var Lm = createSelector(z2, N2, (a10, e) => {
    for (let t2 in a10) {
      let i2 = a10[t2], { audio: r2, video: s2 } = Fe(e, i2);
      if (!s2 && r2) return i2;
    }
  });
  var Dm = createSelector(z2, N2, (a10, e) => {
    let t2 = [], i2 = [];
    for (let r2 in a10) {
      let s2 = a10[r2], { video: o2, audio: n2 } = Fe(e, s2);
      o2 ? t2.push(s2) : n2 && i2.push(s2);
    }
    return t2.concat(i2);
  });
  var wm = createSelector(z2, N2, (a10, e) => {
    for (let t2 in e) {
      let i2 = e[t2];
      if (ft(i2) && Tt(i2) && i2.peerId) return a10[i2.peerId];
    }
  });
  var _m = createSelector(z2, N2, (a10, e) => {
    for (let t2 in e) {
      let i2 = e[t2];
      if (ci(i2) && i2.peerId) return a10[i2.peerId];
    }
  });
  var Nm = createSelector(Ko, (a10) => a10.filter(Ms));
  var Om = createSelector(la, (a10) => a10.length);
  var xm = createSelector(Ai, (a10) => Object.values(a10).filter((e) => !e.read).length);
  var Dt = createSelector(la, Ai, (a10, e) => {
    let t2 = [];
    return a10.forEach((i2) => {
      t2.push(e[i2]);
    }), t2;
  });
  var Jo = createSelector(Dt, (a10) => a10.filter((e) => {
    var t2;
    return !e.recipientPeer && !(e.recipientRoles && ((t2 = e.recipientRoles) == null ? void 0 : t2.length) > 0);
  }));
  var Um = createSelector(Jo, (a10) => a10.filter((e) => !e.read).length);
  var se = createSelector([F], (a10) => a10 && a10.roomState);
  var ma = createSelector(se, (a10) => a10 === "Preview");
  var Bm = createSelector(F, (a10) => a10.roomState !== "Disconnected");
  var Vm = createSelector(F, (a10) => !a10.transcriptions || a10.transcriptions.length <= 0 ? false : a10.transcriptions.some((e) => e.mode === "caption" && e.state === "started"));
  var Pe = (a10) => a10.roles;
  var Fm = createSelector([Pe], (a10) => Object.keys(a10));
  var ct = createSelector([re, Pe], (a10, e) => a10 != null && a10.roleName ? e[a10.roleName] : null);
  var Qo = (a10) => {
    var e;
    return (e = a10.preview) == null ? void 0 : e.asRole;
  };
  var Sa = createSelector([Qo, Pe], (a10, e) => a10 ? e[a10] : null);
  var Gm = createSelector([ct], (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribeParams) != null && e.subscribeToRoles ? a10.subscribeParams.subscribeToRoles.length > 0 : false;
  });
  var ga = createSelector(ct, (a10) => a10 == null ? void 0 : a10.permissions);
  var Wm = createSelector(F, (a10) => a10.recording);
  var $m = createSelector(F, (a10) => a10.rtmp);
  var Km = createSelector(F, (a10) => a10.hls);
  var qm = createSelector(F, (a10) => a10.transcriptions);
  var jm = createSelector(F, (a10) => a10.sessionId);
  var Jm = createSelector(F, (a10) => a10.startedAt);
  var Qm = createSelector(F, (a10) => !!a10.isLargeRoom);
  var zm = createSelector(F, (a10) => !!a10.isEffectsEnabled);
  var Ym = createSelector(F, (a10) => !!a10.isVBEnabled);
  var Xm = createSelector(F, (a10) => a10.effectsKey);
  var Ta = (a10) => a10.polls;
  var iS = createSelector(Ee, (a10) => a10.filter((e) => e.isHandRaised));
  var zo = (a10) => a10.whiteboards;
  var rS = createSelector(zo, (a10) => Object.values(a10)[0]);
  var va = (a10 = "audio") => (e) => e.playlist[a10].list;
  var Zr = (a10 = "audio") => (e) => e.playlist[a10].selection;
  var Ma = (a10 = "audio") => (e) => e.playlist[a10].progress;
  var ya = (a10 = "audio") => (e) => e.playlist[a10].currentTime;
  var ka = (a10 = "audio") => (e) => e.playlist[a10].playbackRate;
  var Ea = (a10 = "audio") => (e) => e.playlist[a10].volume;
  var Pa = (a10 = "audio") => createSelector(va(a10), (e) => Object.values(e));
  var ba = (a10 = "audio") => createSelector(va(a10), Zr(a10), (e, t2) => {
    if (t2.id) return e[t2.id];
  });
  var Aa = { selection: Zr("audio"), progress: Ma("audio"), currentTime: ya("audio"), playbackRate: ka("audio"), volume: Ea("audio"), list: Pa("audio"), selectedItem: ba("audio") };
  var Ia = { selection: Zr("video"), progress: Ma("video"), currentTime: ya("video"), playbackRate: ka("video"), volume: Ea("video"), list: Pa("video"), selectedItem: ba("video") };
  function H2(a10) {
    return (e) => (t2) => a10(t2, e);
  }
  var wt = "HMS-Store:";
  var b2 = class {
    static v(e, ...t2) {
      this.log(0, e, ...t2);
    }
    static d(...e) {
      this.log(1, ...e);
    }
    static i(...e) {
      this.log(2, ...e);
    }
    static w(...e) {
      this.log(3, ...e);
    }
    static e(...e) {
      this.log(6, ...e);
    }
    static time(e) {
      this.log(4, "[HMSPerformanceTiming]", e);
    }
    static timeEnd(e) {
      this.log(5, "[HMSPerformanceTiming]", e, e);
    }
    static cleanup() {
      performance.clearMarks(), performance.clearMeasures();
    }
    static log(e, ...t2) {
      if (!(this.level.valueOf() > e.valueOf())) switch (e) {
        case 0: {
          console.log(wt, ...t2);
          break;
        }
        case 1: {
          console.debug(wt, ...t2);
          break;
        }
        case 2: {
          console.info(wt, ...t2);
          break;
        }
        case 3: {
          console.warn(wt, ...t2);
          break;
        }
        case 6: {
          console.error(wt, ...t2);
          break;
        }
        case 4: {
          performance.mark(t2[1]);
          break;
        }
        case 5: {
          let i2 = t2[0], r2 = t2[1];
          try {
            let s2 = performance.measure(r2, r2);
            this.log(1, i2, r2, s2 == null ? void 0 : s2.duration), performance.clearMarks(r2), performance.clearMeasures(r2);
          } catch (s2) {
            this.log(1, i2, r2, s2);
          }
          break;
        }
      }
    }
  };
  b2.level = 0;
  var es = (a10, e) => e;
  var _t = (a10, e) => e;
  var Ra = (a10, e) => e;
  var Yo = (a10, e) => e;
  var Xo = (a10, e) => e;
  var Y2 = createSelector([z2, es], (a10, e) => e ? a10[e] : null);
  var ts = createSelector([N2, _t], (a10, e) => e ? a10[e] : null);
  var Zo = createSelector([N2, _t], (a10, e) => {
    if (!e) return null;
    let t2 = a10[e];
    return (t2 == null ? void 0 : t2.type) === "video" ? t2 : null;
  });
  var en2 = createSelector([N2, _t], (a10, e) => {
    if (!e) return null;
    let t2 = a10[e];
    return (t2 == null ? void 0 : t2.type) === "audio" ? t2 : null;
  });
  var tn2 = createSelector([N2, _t], (a10, e) => {
    if (!e) return null;
    let t2 = a10[e];
    return (t2 == null ? void 0 : t2.type) === "audio" && (t2 == null ? void 0 : t2.source) === "screen" ? t2 : null;
  });
  var rn2 = createSelector([N2, _t], (a10, e) => {
    if (!e) return null;
    let t2 = a10[e];
    return (t2 == null ? void 0 : t2.type) === "video" && (t2 == null ? void 0 : t2.source) === "screen" ? t2 : null;
  });
  var sn2 = createSelector([Ta, Xo], (a10, e) => e ? a10[e] : null);
  var ee = H2(Y2);
  var mS = H2(createSelector([zr, Yo], (a10, e) => {
    if (a10) return e ? a10[e] : a10;
  }));
  var TS = H2(createSelector(Y2, (a10) => a10 == null ? void 0 : a10.name));
  var fS = H2(createSelector(Y2, (a10) => a10 == null ? void 0 : a10.type));
  var Ii = H2(ts);
  var Ha = H2(Zo);
  var vS = H2(en2);
  var MS = H2(tn2);
  var yS = H2(rn2);
  var an2 = H2((a10, e) => {
    let t2 = Y2(a10, e);
    if (t2 && t2.videoTrack && t2.videoTrack !== "") return a10.tracks[t2.videoTrack];
  });
  var on2 = H2((a10, e) => {
    let t2 = Y2(a10, e);
    if (t2 && t2.audioTrack && t2.audioTrack !== "") return a10.tracks[t2.audioTrack];
  });
  var ES = H2((a10, e) => {
    let t2 = Y2(a10, e);
    return (t2 == null ? void 0 : t2.auxiliaryTracks.map((i2) => a10.tracks[i2])) || [];
  });
  var Ca = (a10, e) => e ? a10.speakers[e] : null;
  var PS = H2(createSelector(Ca, (a10) => (a10 == null ? void 0 : a10.audioLevel) || 0));
  var nn2 = (a10, e) => {
    let t2 = on2(e)(a10);
    return Ca(a10, t2 == null ? void 0 : t2.id);
  };
  var bS = H2(createSelector(nn2, (a10) => (a10 == null ? void 0 : a10.audioLevel) || 0));
  var AS = H2((a10, e) => {
    if (e) return a10.connectionQualities[e];
  });
  var IS = H2((a10, e) => {
    let t2 = Y2(a10, e);
    if (t2) {
      let i2 = t2 == null ? void 0 : t2.auxiliaryTracks.find((r2) => gt(a10.tracks[r2]));
      return i2 ? a10.tracks[i2] : void 0;
    }
  });
  var RS = H2(createSelector(N2, Y2, (a10, e) => {
    let t2 = e == null ? void 0 : e.auxiliaryTracks.find((i2) => {
      let r2 = a10[i2];
      return ft(r2) && Tt(r2);
    });
    return t2 ? a10[t2] : void 0;
  }));
  var HS = H2(createSelector(N2, Y2, (a10, e) => {
    let t2 = e == null ? void 0 : e.auxiliaryTracks.find((i2) => {
      let r2 = a10[i2];
      return ft(r2) && gt(r2);
    });
    return t2 ? a10[t2] : void 0;
  }));
  var CS = H2(createSelector(N2, Y2, (a10, e) => {
    let t2 = e == null ? void 0 : e.auxiliaryTracks.find((i2) => {
      let r2 = a10[i2];
      return ci(r2) && gt(r2);
    });
    return t2 ? a10[t2] : void 0;
  }));
  var La = H2(createSelector(N2, Y2, (a10, e) => Fe(a10, e)));
  var Da = (a10) => createSelector(La(a10), (e) => e.audio);
  var DS = H2((a10, e) => {
    let t2 = Y2(a10, e);
    return ze(a10, t2 == null ? void 0 : t2.audioTrack);
  });
  var wS = H2((a10, e) => {
    let t2 = Y2(a10, e);
    return ze(a10, t2 == null ? void 0 : t2.videoTrack);
  });
  var wa = H2((a10, e) => {
    if (e && a10.tracks[e]) return a10.tracks[e].volume === 0;
  });
  var _S = H2((a10, e) => {
    let t2 = Y2(a10, e);
    return wa(t2 == null ? void 0 : t2.audioTrack)(a10);
  });
  var NS = H2((a10, e) => {
    let t2 = Da(e)(a10);
    return wa(t2 == null ? void 0 : t2.id)(a10);
  });
  var _a = H2((a10, e) => {
    let t2 = ts(a10, e);
    if (t2) {
      if (t2.type !== "audio") {
        b2.w("Please pass audio track here");
        return;
      }
      return t2.volume;
    }
  });
  var OS = H2((a10, e) => {
    let t2 = Y2(a10, e);
    return _a(t2 == null ? void 0 : t2.audioTrack)(a10);
  });
  var xS = H2((a10, e) => {
    let t2 = Da(e)(a10);
    return _a(t2 == null ? void 0 : t2.id)(a10);
  });
  var US = H2((a10, e) => {
    let t2 = ts(a10, e);
    if (t2) {
      if (t2.type !== "video") {
        b2.w("Please pass video track here");
        return;
      }
      return t2.layer;
    }
  });
  var Na = createSelector([Dt, Ie, es], (a10, e, t2) => {
    if (t2) return a10.filter((i2) => {
      var r2;
      return !i2.recipientPeer && !((r2 = i2.recipientRoles) != null && r2.length) || i2.sender && ![e, t2].includes(i2.sender) ? false : [e, t2].includes(i2.recipientPeer);
    });
  });
  var Oa = createSelector([Dt, Ra], (a10, e) => {
    if (e) return a10.filter((t2) => {
      var i2, r2;
      return (i2 = t2.recipientRoles) != null && i2.length ? (r2 = t2.recipientRoles) == null ? void 0 : r2.includes(e) : false;
    });
  });
  var cn2 = createSelector(Dt, (a10) => a10.filter((e) => {
    var t2;
    return !e.recipientPeer && !((t2 = e.recipientRoles) != null && t2.length);
  }));
  var dn2 = createSelector([Oa, Ra], (a10) => a10 ? a10.filter((e) => !e.read).length : 0);
  var ln2 = createSelector([Na, es], (a10) => a10 ? a10.filter((e) => !e.read).length : 0);
  var BS = createSelector(cn2, (a10) => a10.filter((e) => !e.read).length);
  var VS = H2(Na);
  var FS = H2(Oa);
  var GS = H2(dn2);
  var WS = H2(ln2);
  var xa = H2(sn2);
  var tg = createSelector([z2, N2], (a10, e) => Object.values(a10).map((i2) => {
    var r2;
    return { peer: i2, isAudioEnabled: i2.audioTrack ? (r2 = e[i2.audioTrack]) == null ? void 0 : r2.enabled : false };
  }));
  var un2 = (a10) => a10.roleChangeRequests[0] || null;
  var ig = createSelector([un2, z2, Pe], (a10, e, t2) => a10 ? { requestedBy: a10.requestedBy ? e[a10.requestedBy] : void 0, role: t2[a10.roleName], token: a10.token } : null);
  var rg = createSelector([ct], (a10) => vt(a10));
  var sg = createSelector([Sa], (a10) => vt(a10));
  var hn = createSelector([Z2, N2], (a10, e) => {
    let t2 = null;
    return a10 && (t2 = e[a10]), (t2 == null ? void 0 : t2.plugins) || [];
  });
  var mn = createSelector([le, N2], (a10, e) => {
    let t2 = null;
    return a10 && (t2 = e[a10]), (t2 == null ? void 0 : t2.plugins) || [];
  });
  var Hi = { 0: "PEER_JOINED", 1: "PEER_LEFT", 8: "ROLE_UPDATED", 10: "NAME_UPDATED", 11: "METADATA_UPDATED", 12: "HAND_RAISE_CHANGED" };
  var Nt = { 0: "TRACK_ADDED", 1: "TRACK_REMOVED", 2: "TRACK_MUTED", 3: "TRACK_UNMUTED", 5: "TRACK_DEGRADED", 6: "TRACK_RESTORED", 4: "TRACK_DESCRIPTION_CHANGED" };
  var Ci = { 0: "POLL_CREATED", 1: "POLL_STARTED", 2: "POLL_STOPPED", 4: "POLL_VOTES_UPDATED", 3: "POLLS_LIST" };
  var Ua = { TRANSCRIPTION_STATE_UPDATED: "TRANSCRIPTION_STATE_UPDATED" };
  var is = "hmsNotification";
  var Li = class {
    constructor(e) {
      this.id = 0;
      this.onNotification = (e2, t2) => {
        let i2 = (r2) => {
          if (t2) {
            let s2;
            if (Array.isArray(t2) ? s2 = t2.includes(r2.type) : s2 = t2 === r2.type, !s2) return;
          }
          e2(r2);
        };
        return this.eventEmitter.addListener(is, i2), () => {
          this.eventEmitter.removeListener(is, i2);
        };
      };
      this.store = e, this.eventEmitter = new import_eventemitter22.EventEmitter2({ maxListeners: Object.keys(Pr).length });
    }
    sendPlaylistTrackEnded(e) {
      let t2 = this.createNotification("PLAYLIST_TRACK_ENDED", e, "info");
      this.emitEvent(t2);
    }
    sendDeviceChange(e) {
      var i2;
      let t2 = this.createNotification("DEVICE_CHANGE_UPDATE", e, e.error ? "error" : "info", `Selected ${e.type} device - ${(i2 = e.selection) == null ? void 0 : i2.label}`);
      this.emitEvent(t2);
    }
    sendLeaveRoom(e) {
      var r2;
      let t2 = (r2 = e.requestedBy) == null ? void 0 : r2.name, i2 = this.createNotification(e.roomEnded || !t2 ? "ROOM_ENDED" : "REMOVED_FROM_ROOM", e, "info", `${e.roomEnded ? "Room ended" : "Removed from room"} ${t2 ? `by ${t2}` : ""}`);
      this.emitEvent(i2);
    }
    sendPeerList(e) {
      if (e.length === 0) return;
      let t2 = this.createNotification("PEER_LIST", e, "info");
      this.emitEvent(t2);
    }
    sendPeerUpdate(e, t2) {
      let i2 = this.store.getState(ee(t2 == null ? void 0 : t2.id)) || t2, r2 = Hi[e];
      if (r2 && i2) {
        let s2 = this.createNotification(r2, i2, "info");
        this.emitEvent(s2);
      }
    }
    sendTrackUpdate(e, t2) {
      let i2 = this.store.getState(Ii(t2)), r2 = Nt[e];
      if (r2) {
        let s2 = this.createNotification(r2, i2, "info");
        this.emitEvent(s2);
      }
    }
    sendMessageReceived(e) {
      let t2 = this.createNotification("NEW_MESSAGE", e, "info");
      this.emitEvent(t2);
    }
    sendError(e) {
      let t2 = this.createNotification("ERROR", e, "error");
      this.emitEvent(t2);
    }
    sendReconnecting(e) {
      let t2 = this.createNotification("RECONNECTING", e, "error");
      this.emitEvent(t2);
    }
    sendReconnected() {
      let e = this.createNotification("RECONNECTED", null, "info");
      this.emitEvent(e);
    }
    sendChangeTrackStateRequest(e) {
      let t2 = this.createNotification("CHANGE_TRACK_STATE_REQUEST", e, "info");
      this.emitEvent(t2);
    }
    sendChangeMultiTrackStateRequest(e) {
      let t2 = this.createNotification("CHANGE_MULTI_TRACK_STATE_REQUEST", e, "info");
      this.emitEvent(t2);
    }
    sendPollUpdate(e, t2) {
      let i2 = Ci[e], r2 = this.store.getState(xa(t2));
      if (i2) {
        let s2 = this.createNotification(i2, r2, "info");
        this.emitEvent(s2);
      }
    }
    sendTranscriptionUpdate(e) {
      let t2 = this.createNotification(Ua.TRANSCRIPTION_STATE_UPDATED, e, "info");
      this.emitEvent(t2);
    }
    emitEvent(e) {
      this.eventEmitter.emit(is, e);
    }
    createNotification(e, t2, i2, r2 = "") {
      return this.id++, { id: this.id, type: e, message: r2, data: t2, severity: i2 };
    }
  };
  var Di = class {
    constructor(e) {
      this.queuedUpdates = {};
      this.timers = {};
      this.DEFAULT_INTERVAL_MS = 50;
      this.store = e;
    }
    setState(e, t2, i2 = this.DEFAULT_INTERVAL_MS) {
      this.queuedUpdates[t2] = this.queuedUpdates[t2] || [], this.queuedUpdates[t2].push(e), !this.timers[t2] && (window ? this.timers[t2] = window.setTimeout(() => this.setStateBatched(t2), i2) : this.setStateBatched(t2));
    }
    setStateBatched(e) {
      var t2;
      if (((t2 = this.queuedUpdates[e]) == null ? void 0 : t2.length) > 0) {
        let i2 = (r2) => {
          this.queuedUpdates[e].forEach((s2) => {
            try {
              s2(r2);
            } catch (o2) {
              b2.w("failed to update store", o2);
            }
          });
        };
        console.time(`timed-${e}`), this.store.namedSetState(i2, e), console.timeEnd(`timed-${e}`);
      }
      delete this.queuedUpdates[e], window && this.timers[e] && (window.clearTimeout(this.timers[e]), delete this.timers[e]);
    }
  };
  function Ba(a10) {
    return a10 instanceof ie || a10 instanceof O2;
  }
  var Va = (a10, e) => {
    let t2 = Ot(Object.keys(a10), Object.keys(e));
    for (let i2 of t2) {
      let r2 = a10[i2], s2 = e[i2];
      je(r2, s2) ? (ae(r2.auxiliaryTracks, s2.auxiliaryTracks) && (s2.auxiliaryTracks = r2.auxiliaryTracks), r2.groups && ae(r2.groups, s2.groups) && (s2.groups = r2.groups), Object.assign(r2, s2)) : as(r2, s2) ? delete a10[i2] : wi(r2, s2) && (a10[i2] = s2);
    }
  };
  var Fa = (a10, e) => {
    let t2 = Ot(Object.keys(a10), Object.keys(e));
    for (let i2 of t2) {
      let r2 = a10[i2], s2 = e[i2];
      je(r2, s2) ? (ss(r2, s2), Object.assign(r2, s2)) : as(r2, s2) ? delete a10[i2] : wi(r2, s2) && (a10[i2] = s2);
    }
  };
  var Ga = (a10, e) => {
    let t2 = Ot(Object.keys(a10), Object.keys(e));
    for (let i2 of t2) {
      let r2 = a10[i2], s2 = e[i2];
      je(r2, s2) ? (r2.questions && ae(r2.questions, s2.questions) && (s2.questions = r2.questions), Object.assign(r2, s2)) : wi(r2, s2) && (a10[i2] = s2);
    }
  };
  var rs = (a10, e) => {
    let t2 = Ot(Object.keys(a10), Object.keys(e));
    for (let i2 of t2) {
      let r2 = a10[i2], s2 = e[i2];
      je(r2, s2) ? Object.assign(r2, s2) : as(r2, s2) ? delete a10[i2] : wi(r2, s2) && (a10[i2] = s2);
    }
  };
  var Wa = (a10, e, t2) => {
    let i2 = t2.reduce((s2, o2) => (s2[o2.firstTrackId] = Object.values(e[o2.getTrackIDBeingSent()] || {}).sort((n2, d2) => !n2.rid || !d2.rid ? 0 : n2.rid < d2.rid ? -1 : 1), s2), {}), r2 = Ot(Object.keys(a10), Object.keys(i2));
    for (let s2 of r2) {
      if (!i2[s2]) {
        delete a10[s2];
        continue;
      }
      a10[s2] = i2[s2];
    }
  };
  var ss = (a10, e) => {
    a10.plugins && ae(a10.plugins, e.plugins) && (e.plugins = a10.plugins), a10.type === "video" && a10.layerDefinitions && ae(a10.layerDefinitions, e.layerDefinitions) && (e.layerDefinitions = a10.layerDefinitions);
  };
  var je = (a10, e) => a10 && e;
  var as = (a10, e) => a10 && !e;
  var wi = (a10, e) => !a10 && e;
  var ae = (a10, e) => {
    if (a10 === e || a10.length === 0 && (e == null ? void 0 : e.length) === 0) return true;
    if (!a10 || !e || a10.length !== e.length) return false;
    for (let t2 = 0; t2 < a10.length; t2++) if (a10[t2] !== e[t2]) return false;
    return true;
  };
  var Ot = (a10, e) => {
    let t2 = /* @__PURE__ */ new Set();
    for (let i2 of a10) t2.add(i2);
    for (let i2 of e) t2.add(i2);
    return Array.from(t2);
  };
  var _2 = class a8 {
    static convertPeer(e) {
      var t2, i2, r2;
      return { id: e.peerId, name: e.name, roleName: (t2 = e.role) == null ? void 0 : t2.name, isLocal: e.isLocal, videoTrack: (i2 = e.videoTrack) == null ? void 0 : i2.trackId, audioTrack: (r2 = e.audioTrack) == null ? void 0 : r2.trackId, auxiliaryTracks: e.auxiliaryTracks.map((s2) => s2.trackId), customerUserId: e.customerUserId, metadata: e.metadata, joinedAt: e.joinedAt, groups: e.groups, isHandRaised: e.isHandRaised, type: e.type };
    }
    static convertTrack(e, t2) {
      let i2 = { id: e.trackId, source: e.source, type: e.type, enabled: e.enabled, displayEnabled: e.enabled, peerId: e.peerId || t2 };
      return this.enrichTrack(i2, e), i2;
    }
    static enrichTrack(e, t2) {
      let i2 = t2.getMediaTrackSettings();
      t2 instanceof ie && (e.volume = t2.getVolume() || 0), a8.updateDeviceID(e, t2), a8.enrichLocalTrack(e, t2), e.type === "video" && (e.source === "screen" ? (e.displaySurface = i2.displaySurface, a8.enrichScreenTrack(e, t2)) : e.source === "regular" && (e.facingMode = i2.facingMode), e.height = i2.height, e.width = i2.width, a8.enrichVideoTrack(e, t2)), a8.enrichPluginsDetails(e, t2);
    }
    static enrichLocalTrack(e, t2) {
      (t2 instanceof G2 || t2 instanceof de) && (e.isPublished = t2.isPublished);
    }
    static updateDeviceID(e, t2) {
      var i2;
      t2 instanceof G2 || t2 instanceof de ? e.deviceID = t2.settings.deviceId : e.deviceID = (i2 = t2.getMediaTrackSettings()) == null ? void 0 : i2.deviceId;
    }
    static enrichVideoTrack(e, t2) {
      t2 instanceof O2 && (e.layer = t2.getLayer(), e.preferredLayer = t2.getPreferredLayer(), e.degraded = t2.degraded), (t2 instanceof O2 || t2 instanceof G2) && (ae(t2.getSimulcastDefinitions(), e.layerDefinitions) || (e.layerDefinitions = t2.getSimulcastDefinitions()));
    }
    static enrichScreenTrack(e, t2) {
      var i2, r2;
      if (t2 instanceof G2) {
        let s2 = (i2 = t2.getCaptureHandle) == null ? void 0 : i2.call(t2);
        (s2 == null ? void 0 : s2.handle) !== ((r2 = e.captureHandle) == null ? void 0 : r2.handle) && (e.captureHandle = s2), t2.isCurrentTab && (e.displaySurface = "selfBrowser");
      }
    }
    static enrichPluginsDetails(e, t2) {
      (t2 instanceof G2 || t2 instanceof de) && (ae(t2.getPlugins(), e.plugins) || (e.plugins = t2.getPlugins()));
    }
    static convertRoom(e, t2) {
      let { recording: i2, rtmp: r2, hls: s2, transcriptions: o2 } = a8.convertRecordingStreamingState(e.recording, e.rtmp, e.hls, e.transcriptions);
      return { id: e.id, name: e.name, localPeer: t2, recording: i2, rtmp: r2, hls: s2, transcriptions: o2, sessionId: e.sessionId, startedAt: e.startedAt, joinedAt: e.joinedAt, peerCount: e.peerCount, isLargeRoom: e.large_room_optimization, isEffectsEnabled: e.isEffectsEnabled, disableNoneLayerRequest: e.disableNoneLayerRequest, isVBEnabled: e.isVBEnabled, effectsKey: e.effectsKey, isHipaaEnabled: e.isHipaaEnabled, isNoiseCancellationEnabled: e.isNoiseCancellationEnabled };
    }
    static convertMessage(e, t2) {
      var i2, r2, s2, o2;
      return { sender: (i2 = e.peer) == null ? void 0 : i2.peer_id, senderName: (r2 = e.peer) == null ? void 0 : r2.info.name, senderRole: (s2 = e.peer) == null ? void 0 : s2.role, senderUserId: (o2 = e.peer) == null ? void 0 : o2.info.user_id, recipientPeer: e.private ? t2 : void 0, recipientRoles: e.roles, time: new Date(e.timestamp), type: e.info.type, message: e.info.message, id: e.message_id };
    }
    static convertRoles(e) {
      let t2 = {};
      return e && e.forEach((i2) => {
        t2[i2.name] = i2;
      }), t2;
    }
    static convertRoleChangeRequest(e) {
      var t2;
      return { requestedBy: (t2 = e.requestedBy) == null ? void 0 : t2.peerId, roleName: e.role.name, token: e.token };
    }
    static convertException(e) {
      let t2 = "trackType" in e, i2 = { code: e.code, action: e.action, name: e.name, message: e.message, description: e.description, isTerminal: e.isTerminal, nativeError: e.nativeError, timestamp: /* @__PURE__ */ new Date() };
      return t2 && (i2.trackType = e == null ? void 0 : e.trackType), i2;
    }
    static convertDeviceChangeUpdate(e) {
      let t2 = { devices: e.devices, selection: e.selection, type: e.type };
      return e.error && (t2.error = this.convertException(e.error)), t2;
    }
    static convertPlaylist(e) {
      let t2 = this.getConvertedPlaylistType(e, "audio"), i2 = this.getConvertedPlaylistType(e, "video");
      return { audio: t2, video: i2 };
    }
    static convertPlaylistItem(e, t2) {
      let i2 = t2.type, r2 = e.getCurrentSelection(i2), s2 = e.isPlaying(i2), o2 = t2.url === (r2 == null ? void 0 : r2.url);
      return M2(m({}, t2), { type: t2.type, selected: o2, playing: o2 && s2 });
    }
    static getConvertedPlaylistType(e, t2) {
      let i2 = {}, r2 = e.getCurrentSelection(t2), s2 = e.getCurrentProgress(t2), o2 = e.getVolume(t2), n2 = e.getList(t2), d2 = e.getCurrentIndex(t2);
      return e.getList(t2).forEach((u2) => {
        i2[u2.id] = a8.convertPlaylistItem(e, u2);
      }), { list: i2, selection: { id: r2 == null ? void 0 : r2.id, hasPrevious: d2 > 0, hasNext: d2 < n2.length - 1 }, progress: s2, volume: o2, currentTime: e.getCurrentTime(t2), playbackRate: e.getPlaybackRate(t2) };
    }
    static convertRecordingStreamingState(e, t2, i2, r2) {
      var s2;
      return { recording: { browser: m({ running: false }, e == null ? void 0 : e.browser), server: m({ running: false }, e == null ? void 0 : e.server), hls: m({ running: false }, e == null ? void 0 : e.hls) }, rtmp: m({ running: false }, t2), hls: { variants: ((s2 = i2 == null ? void 0 : i2.variants) == null ? void 0 : s2.map((o2) => o2)) || [], running: !!(i2 != null && i2.running), error: i2 == null ? void 0 : i2.error }, transcriptions: r2 || [] };
    }
  };
  var xt = class {
    constructor(e, t2, i2, r2) {
      this.playlistManager = e;
      this.syncPlaylistState = i2;
      this.store = r2;
      this.type = t2;
    }
    play(e) {
      return c2(this, null, function* () {
        if (!e) {
          b2.w("Please pass id to play");
          return;
        }
        yield this.playlistManager.setEnabled(true, { id: e, type: this.type });
      });
    }
    pause() {
      return c2(this, null, function* () {
        let e = this.type === "audio" ? Aa : Ia, t2 = this.store.getState(e.selection);
        if (!t2.id) {
          b2.w("No item is currently playing to pause");
          return;
        }
        yield this.playlistManager.setEnabled(false, { id: t2.id, type: this.type });
      });
    }
    playNext() {
      return c2(this, null, function* () {
        yield this.playlistManager.playNext(this.type);
      });
    }
    playPrevious() {
      return c2(this, null, function* () {
        yield this.playlistManager.playPrevious(this.type);
      });
    }
    seek(e) {
      this.playlistManager.seek(e, this.type), this.syncPlaylistState(`seekOn${this.type}Playlist`);
    }
    seekTo(e) {
      this.playlistManager.seekTo(e, this.type), this.syncPlaylistState(`seekToOn${this.type}Playlist`);
    }
    setVolume(e) {
      this.playlistManager.setVolume(e, this.type), this.syncPlaylistState(`setVolumeOn${this.type}Playlist`);
    }
    setList(e) {
      this.playlistManager.setList(e), this.syncPlaylistState(`setListOn${this.type}Playlist`);
    }
    stop() {
      return c2(this, null, function* () {
        yield this.playlistManager.stop(this.type), this.syncPlaylistState(`stop${this.type}Playlist`);
      });
    }
    setIsAutoplayOn(e) {
      this.playlistManager.setIsAutoplayOn(this.type, e);
    }
    setPlaybackRate(e) {
      this.playlistManager.setPlaybackRate(this.type, e), this.syncPlaylistState(`set${this.type}PlaybackRate`);
    }
    removeItem(e) {
      return c2(this, null, function* () {
        let t2 = yield this.playlistManager.removeItem(e, this.type);
        return t2 && this.syncPlaylistState(`remove${this.type}PlaylistItem`), t2;
      });
    }
    clearList() {
      return c2(this, null, function* () {
        yield this.playlistManager.clearList(this.type), this.syncPlaylistState(`clear${this.type}Playlist`);
      });
    }
  };
  var _i = class {
    constructor(e, t2) {
      this.sdk = e;
      this.setLocally = t2;
    }
    get sdkSessionStore() {
      return this.sdk.getSessionStore();
    }
    set(e, t2) {
      return c2(this, null, function* () {
        let { value: i2 } = yield this.sdkSessionStore.set(String(e), t2);
        this.setLocally({ key: e, value: i2 });
      });
    }
    observe(e) {
      return c2(this, null, function* () {
        let t2 = Array.isArray(e) ? e.map((i2) => String(i2)) : [String(e)];
        yield this.sdkSessionStore.observe(t2);
      });
    }
    unobserve(e) {
      return c2(this, null, function* () {
        let t2 = Array.isArray(e) ? e.map((i2) => String(i2)) : [String(e)];
        yield this.sdkSessionStore.unobserve(t2);
      });
    }
  };
  var Ni = class {
    constructor(e, t2) {
      this.TAG = "[BeamSpeakerLabelsLogger]";
      this.intervalMs = 100, this.shouldMonitor = false, this.hasStarted = false, this.unsubs = [], this.analysers = {}, this.store = e, this.actions = t2;
    }
    start() {
      return c2(this, null, function* () {
        if (this.hasStarted) return;
        this.hasStarted = true, b2.d("starting audio level monitor for remote peers", this.store);
        let e = this.store.getState(Be);
        b2.d("starting audio levels is connected to room", e), e && (yield this.monitorAudioLevels());
        let t2 = this.store.subscribe(this.monitorAudioLevels.bind(this), Be);
        this.unsubs.push(t2);
      });
    }
    stop() {
      return c2(this, null, function* () {
        this.hasStarted && (this.hasStarted = false, this.shouldMonitor = false, this.unsubs.forEach((e) => e()), b2.d("stopped audio level monitor for remote peers"));
      });
    }
    monitorAudioLevels() {
      return c2(this, null, function* () {
        if (!this.store.getState(Be)) {
          this.shouldMonitor && (b2.i("room no longer connected, stopping audio level monitoring for remote"), this.shouldMonitor = false);
          return;
        }
        if (this.shouldMonitor) return;
        b2.i("monitoring audio levels"), this.shouldMonitor = true;
        let t2 = () => {
          this.shouldMonitor ? (this.logAllPeersAudioLevels(), setTimeout(t2, this.intervalMs)) : b2.i("stopped monitoring audio levels");
        };
        setTimeout(t2, 1e3);
      });
    }
    logAllPeersAudioLevels() {
      return c2(this, null, function* () {
        var r2;
        if (!window.__triggerBeamEvent__) return;
        let e = this.store.getState(Ee), t2 = e.filter((s2) => !!s2.audioTrack);
        b2.d(this.TAG, "Peers Without audio track", e.filter((s2) => !s2.audioTrack).map((s2) => s2.id).join(","));
        let i2 = [];
        for (let s2 of t2) {
          let o2 = this.actions.getTrackById(s2.audioTrack || ""), n2 = (r2 = o2 == null ? void 0 : o2.stream) == null ? void 0 : r2.nativeStream;
          if (s2.joinedAt && n2) {
            let d2 = yield this.getAudioLevel(s2, n2);
            b2.d(this.TAG, s2.id, d2), d2.level > 0 && i2.push(d2);
          }
        }
        if (i2.length > 0) {
          let s2 = { event: "app-audio-level", data: i2 };
          b2.d("logging audio levels", JSON.stringify(i2)), window.__triggerBeamEvent__(JSON.stringify(s2));
        }
      });
    }
    getAudioLevel(e, t2) {
      return c2(this, null, function* () {
        this.analysers[t2.id] || (this.analysers[t2.id] = this.createAnalyserNode(t2));
        let i2 = this.analysers[t2.id], r2 = this.calculateAudioLevel(i2);
        return { peerId: e.id, peerName: e.name, level: r2 };
      });
    }
    createAnalyserNode(e) {
      this.audioContext || (this.audioContext = new AudioContext());
      let t2 = this.audioContext.createAnalyser();
      return this.audioContext.createMediaStreamSource(e).connect(t2), t2;
    }
    calculateAudioLevel(e) {
      let t2 = new Uint8Array(e.fftSize);
      e.getByteTimeDomainData(t2);
      let i2 = 9e-3, r2 = i2;
      for (let n2 of t2) r2 = Math.max(r2, (n2 - 128) / 128);
      let s2 = (Math.log(i2) - Math.log(r2)) / Math.log(i2);
      return Math.ceil(Math.min(Math.max(s2 * 100, 0), 100));
    }
  };
  var $a = 2e4;
  var Ka = 1e4;
  var dt = { name: "diagnostics-role", priority: 1, publishParams: { allowed: ["audio", "video"], audio: { bitRate: 32, codec: "opus" }, video: { bitRate: 100, codec: "vp8", frameRate: 30, height: 720, width: 1280 }, screen: { bitRate: 100, codec: "vp8", frameRate: 10, height: 1080, width: 1920 } }, subscribeParams: { subscribeToRoles: [], maxSubsBitRate: 3200 }, permissions: { browserRecording: false, changeRole: false, endRoom: false, hlsStreaming: false, mute: false, pollRead: false, pollWrite: false, removeOthers: false, rtmpStreaming: false, unmute: false } };
  var qa = "https://100ms.live/test-audio.wav";
  var Oi = class {
    constructor() {
      this.networkScores = [];
      this.lastPushedAt = 0;
    }
    pushScore(e) {
      !e || e < 0 || (this.networkScores.length === 0 ? (this.networkScores.push(e), this.lastPushedAt = Date.now()) : this.addPendingCQSTillNow());
    }
    addPendingCQSTillNow() {
      if (this.networkScores.length > 0) {
        let e = (Date.now() - this.lastPushedAt) / 1e3;
        for (; e > 0; ) this.networkScores.push(this.networkScores[this.networkScores.length - 1]), e -= 1;
        this.lastPushedAt = Date.now();
      }
    }
    getCQS() {
      return this.networkScores.reduce((e, t2) => e + t2, 0) / this.networkScores.length;
    }
  };
  var gn = (a10) => !!a10 && !isNaN(a10);
  var oe = (a10) => a10[a10.length - 1];
  var Ve = (a10, e) => {
    let t2 = a10.filter((i2) => gn(e(i2)));
    return t2.reduce((i2, r2) => i2 + (e(r2) || 0), 0) / t2.length;
  };
  var xi = class {
    constructor(e) {
      this.sdk = e;
      this.peerStatsList = [];
      this.localAudioTrackStatsList = [];
      this.localVideoTrackStatsList = [];
      this.remoteAudioTrackStatsList = [];
      this.remoteVideoTrackStatsList = [];
    }
    handleStatsUpdate(e) {
      return c2(this, null, function* () {
        var n2, d2, u2, p2, h2, T, g2, f2;
        let t2 = e.getLocalPeerStats();
        t2 && this.peerStatsList.push(t2);
        let i2 = (u2 = (d2 = (n2 = this.sdk.getLocalPeer()) == null ? void 0 : n2.audioTrack) == null ? void 0 : d2.nativeTrack) == null ? void 0 : u2.id, r2 = (T = (h2 = (p2 = this.sdk.getLocalPeer()) == null ? void 0 : p2.videoTrack) == null ? void 0 : h2.nativeTrack) == null ? void 0 : T.id, s2 = e.getLocalTrackStats();
        s2 && (i2 && this.localAudioTrackStatsList.push(s2[i2]), r2 && this.localVideoTrackStatsList.push(s2[r2]));
        let o2 = yield (f2 = (g2 = this.sdk.getWebrtcInternals()) == null ? void 0 : g2.getSubscribePeerConnection()) == null ? void 0 : f2.getStats();
        o2 == null || o2.forEach((P2) => {
          if (P2.type === "inbound-rtp") {
            let v2 = P2.kind === "audio" ? this.remoteAudioTrackStatsList : this.remoteVideoTrackStatsList, R2 = Ht("bytesReceived", P2, oe(v2));
            v2.push(M2(m({}, P2), { bitrate: R2 }));
          }
        });
      });
    }
    buildReport() {
      var P2, v2, R2, $, ue, Te, pe, St, hs, ms;
      let e = (P2 = oe(this.peerStatsList)) == null ? void 0 : P2.publish, t2 = (v2 = oe(this.peerStatsList)) == null ? void 0 : v2.subscribe, i2 = e != null && e.responsesReceived ? ((e == null ? void 0 : e.totalRoundTripTime) || 0) / e.responsesReceived : 0, r2 = t2 != null && t2.responsesReceived ? ((t2 == null ? void 0 : t2.totalRoundTripTime) || 0) / t2.responsesReceived : 0, s2 = Number(((i2 + r2) / 2 * 1e3).toFixed(2)), o2 = ((R2 = oe(this.remoteAudioTrackStatsList)) == null ? void 0 : R2.packetsReceived) || 0, n2 = (($ = oe(this.remoteVideoTrackStatsList)) == null ? void 0 : $.packetsReceived) || 0, d2 = this.localAudioTrackStatsList.map((B2) => B2 ? Ve(Object.values(B2), (te) => te.bitrate) : 0), u2 = this.localVideoTrackStatsList.map((B2) => B2 ? Ve(Object.values(B2), (te) => te.bitrate) : 0), p2 = ((ue = oe(this.remoteAudioTrackStatsList)) == null ? void 0 : ue.jitter) || 0, h2 = ((Te = oe(this.remoteVideoTrackStatsList)) == null ? void 0 : Te.jitter) || 0, T = Math.max(p2, h2), g2 = oe(this.localAudioTrackStatsList), f2 = oe(this.localVideoTrackStatsList);
      return { combined: { roundTripTime: s2, packetsReceived: o2 + n2, packetsLost: (t2 == null ? void 0 : t2.packetsLost) || 0, bytesSent: (e == null ? void 0 : e.bytesSent) || 0, bytesReceived: (t2 == null ? void 0 : t2.bytesReceived) || 0, bitrateSent: Ve(this.peerStatsList, (B2) => {
        var te;
        return (te = B2.publish) == null ? void 0 : te.bitrate;
      }), bitrateReceived: Ve(this.peerStatsList, (B2) => {
        var te;
        return (te = B2.subscribe) == null ? void 0 : te.bitrate;
      }), jitter: T }, audio: { roundTripTime: s2, packetsReceived: o2, packetsLost: ((pe = oe(this.remoteAudioTrackStatsList)) == null ? void 0 : pe.packetsLost) || 0, bytesReceived: ((St = oe(this.remoteAudioTrackStatsList)) == null ? void 0 : St.bytesReceived) || 0, bitrateSent: Ve(d2, (B2) => B2), bitrateReceived: Ve(this.remoteAudioTrackStatsList, (B2) => B2.bitrate), bytesSent: g2 ? Object.values(g2).reduce((B2, te) => B2 + (te.bytesSent || 0), 0) : 0, jitter: p2 }, video: { roundTripTime: s2, packetsLost: ((hs = oe(this.remoteVideoTrackStatsList)) == null ? void 0 : hs.packetsLost) || 0, bytesReceived: ((ms = oe(this.remoteVideoTrackStatsList)) == null ? void 0 : ms.bytesReceived) || 0, packetsReceived: n2, bitrateSent: Ve(u2, (B2) => B2), bitrateReceived: Ve(this.remoteVideoTrackStatsList, (B2) => B2.bitrate), bytesSent: f2 ? Object.values(f2).reduce((B2, te) => B2 + (te.bytesSent || 0), 0) : 0, jitter: h2 } };
    }
  };
  var Tn = ((n2) => (n2[n2.STARTING = 0] = "STARTING", n2[n2.INIT_FETCHED = 1] = "INIT_FETCHED", n2[n2.SIGNAL_CONNECTED = 2] = "SIGNAL_CONNECTED", n2[n2.ICE_ESTABLISHED = 3] = "ICE_ESTABLISHED", n2[n2.MEDIA_CAPTURED = 4] = "MEDIA_CAPTURED", n2[n2.MEDIA_PUBLISHED = 5] = "MEDIA_PUBLISHED", n2[n2.COMPLETED = 6] = "COMPLETED", n2))(Tn || {});
  var ja;
  var Ja;
  var Ui = class {
    constructor(e, t2, i2, r2, s2 = $a) {
      this.sdk = e;
      this.sdkListener = t2;
      this.progressCallback = i2;
      this.completionCallback = r2;
      this.connectivityDuration = s2;
      this.wsConnected = false;
      this.initConnected = false;
      this.isPublishICEConnected = false;
      this.isSubscribeICEConnected = false;
      this.gatheredPublishICECandidates = [];
      this.gatheredSubscribeICECandidates = [];
      this.errors = [];
      this.isAudioTrackCaptured = false;
      this.isVideoTrackCaptured = false;
      this.isAudioTrackPublished = false;
      this.isVideoTrackPublished = false;
      this.cqsCalculator = new Oi();
      this.timestamp = Date.now();
      this.onRoomUpdate = this.sdkListener.onRoomUpdate.bind(this.sdkListener);
      this.onPeerUpdate = this.sdkListener.onPeerUpdate.bind(this.sdkListener);
      this.onMessageReceived = this.sdkListener.onMessageReceived.bind(this.sdkListener);
      this.onReconnected = this.sdkListener.onReconnected.bind(this.sdkListener);
      this.onRoleChangeRequest = this.sdkListener.onRoleChangeRequest.bind(this.sdkListener);
      this.onRoleUpdate = this.sdkListener.onRoleUpdate.bind(this.sdkListener);
      this.onChangeTrackStateRequest = this.sdkListener.onChangeTrackStateRequest.bind(this.sdkListener);
      this.onChangeMultiTrackStateRequest = this.sdkListener.onChangeMultiTrackStateRequest.bind(this.sdkListener);
      this.onRemovedFromRoom = this.sdkListener.onRemovedFromRoom.bind(this.sdkListener);
      this.onNetworkQuality = (ja = this.sdkListener.onNetworkQuality) == null ? void 0 : ja.bind(this.sdkListener);
      this.onPreview = this.sdkListener.onPreview.bind(this.sdkListener);
      this.onDeviceChange = (Ja = this.sdkListener.onDeviceChange) == null ? void 0 : Ja.bind(this.sdkListener);
      this.onSessionStoreUpdate = this.sdkListener.onSessionStoreUpdate.bind(this.sdkListener);
      this.onPollsUpdate = this.sdkListener.onPollsUpdate.bind(this.sdkListener);
      this.onWhiteboardUpdate = this.sdkListener.onWhiteboardUpdate.bind(this.sdkListener);
      this.handleConnectionQualityUpdate = (e2) => {
        let t3 = e2.find((i3) => {
          var r3, s3;
          return i3.peerID === ((s3 = (r3 = this.sdk) == null ? void 0 : r3.store.getLocalPeer()) == null ? void 0 : s3.peerId);
        });
        this.cqsCalculator.pushScore(t3 == null ? void 0 : t3.downlinkQuality);
      };
      this.statsCollector = new xi(e), this.state = 0;
    }
    get state() {
      return this._state;
    }
    set state(e) {
      var t2;
      e === void 0 || this._state !== void 0 && e < this._state || (this._state = e, (t2 = this.progressCallback) == null || t2.call(this, e));
    }
    onICESuccess(e) {
      e ? this.isPublishICEConnected = true : this.isSubscribeICEConnected = true, this.isPublishICEConnected && this.isSubscribeICEConnected && (this.state = 3);
    }
    onSelectedICECandidatePairChange(e, t2) {
      t2 ? this.selectedPublishICECandidate = e : this.selectedSubscribeICECandidate = e;
    }
    onICECandidate(e, t2) {
      t2 ? this.gatheredPublishICECandidates.push(e) : this.gatheredSubscribeICECandidates.push(e);
    }
    onMediaPublished(e) {
      switch (e.type) {
        case "audio":
          this.isAudioTrackPublished = true;
          break;
        case "video":
          this.isVideoTrackPublished = true;
          break;
        default:
          break;
      }
      this.isVideoTrackPublished && this.isAudioTrackPublished && (this.state = 5);
    }
    onInitSuccess(e) {
      this.websocketURL = e, this.initConnected = true, this.state = 1;
    }
    onSignallingSuccess() {
      this.wsConnected = true, this.state = 2;
    }
    onJoin(e) {
      var t2, i2;
      this.sdkListener.onJoin(e), (t2 = this.sdk.getWebrtcInternals()) == null || t2.onStatsChange((r2) => this.statsCollector.handleStatsUpdate(r2)), (i2 = this.sdk.getWebrtcInternals()) == null || i2.start(), this.cleanupTimer = window.setTimeout(() => {
        this.cleanupAndReport();
      }, this.connectivityDuration);
    }
    onError(e) {
      this.sdkListener.onError(e), this.errors.push(e), e != null && e.isTerminal && this.cleanupAndReport();
    }
    onTrackUpdate(e, t2, i2) {
      if (this.sdkListener.onTrackUpdate(e, t2, i2), i2.isLocal && e === 0) {
        switch (t2.type) {
          case "audio":
            this.isAudioTrackCaptured = true;
            break;
          case "video":
            this.isVideoTrackCaptured = true;
            break;
          default:
            break;
        }
        this.isVideoTrackCaptured && this.isAudioTrackCaptured && (this.state = 4);
      }
    }
    onReconnecting(e) {
      this.sdkListener.onReconnecting(e), this.cqsCalculator.addPendingCQSTillNow();
    }
    cleanupAndReport() {
      var e;
      clearTimeout(this.cleanupTimer), this.cleanupTimer = void 0, this.state === 5 && (this.state = 6), (e = this.completionCallback) == null || e.call(this, this.buildReport()), this.sdk.leave();
    }
    buildReport() {
      this.cqsCalculator.addPendingCQSTillNow();
      let e = this.cqsCalculator.getCQS(), t2 = this.statsCollector.buildReport();
      return { testTimestamp: this.timestamp, connectivityState: this.state, errors: this.errors, signallingReport: { isConnected: this.wsConnected, isInitConnected: this.initConnected, websocketUrl: this.websocketURL }, mediaServerReport: { stats: t2, connectionQualityScore: e, isPublishICEConnected: this.isPublishICEConnected, isSubscribeICEConnected: this.isSubscribeICEConnected, publishICECandidatePairSelected: this.selectedPublishICECandidate, subscribeICECandidatePairSelected: this.selectedSubscribeICECandidate, publishIceCandidatesGathered: this.gatheredPublishICECandidates, subscribeIceCandidatesGathered: this.gatheredSubscribeICECandidates } };
    }
  };
  var Je = class {
    constructor(e) {
      this.recording = { server: { running: false }, browser: { running: false }, hls: { running: false } };
      this.rtmp = { running: false };
      this.hls = { running: false, variants: [] };
      this.transcriptions = [];
      this.id = e;
    }
  };
  var Bi = (a10, e, t2) => c2(void 0, null, function* () {
    let r2 = Error("something went wrong during fetch");
    for (let s2 = 0; s2 < 4; s2++) try {
      let o2 = yield fetch(a10, e), n2 = yield o2.clone().json();
      if (t2 && t2.length && !o2.ok && t2.includes(n2.code)) throw S2.APIErrors.ServerErrors(n2.code, "GET_TOKEN", n2.message, false);
      return o2;
    } catch (o2) {
      r2 = o2;
    }
    throw ["Failed to fetch", "NetworkError"].some((s2) => r2.message.includes(s2)) ? S2.APIErrors.EndpointUnreachable("GET_TOKEN", r2.message) : r2;
  });
  var Ut = class {
    constructor(e, t2) {
      this.sdk = e;
      this.sdkListener = t2;
      this.recordedAudio = qa;
      this.sdk.setIsDiagnostics(true), this.initSdkWithLocalPeer();
    }
    get localPeer() {
      var e;
      return (e = this.sdk) == null ? void 0 : e.store.getLocalPeer();
    }
    checkBrowserSupport() {
      kt(), yt();
    }
    requestPermission(e) {
      return c2(this, null, function* () {
        try {
          let t2 = yield navigator.mediaDevices.getUserMedia(e);
          return t2.getTracks().forEach((i2) => i2.stop()), yield this.sdk.deviceManager.init(true), { audio: t2.getAudioTracks().length > 0, video: t2.getVideoTracks().length > 0 };
        } catch (t2) {
          throw _e(t2, this.sdk.localTrackManager.getErrorType(!!e.video, !!e.audio));
        }
      });
    }
    startCameraCheck(e) {
      return c2(this, null, function* () {
        var s2, o2, n2, d2;
        if (this.initSdkWithLocalPeer(), !this.localPeer) throw new Error("Local peer not found");
        this.sdk.store.setSimulcastEnabled(false), this.localPeer.role = M2(m({}, dt), { publishParams: M2(m({}, dt.publishParams), { allowed: ["video"] }) });
        let t2 = new Ne().video(new q2().deviceId(e || "default").build()).build(), i2 = yield (s2 = this.sdk) == null ? void 0 : s2.localTrackManager.getLocalTracks({ audio: false, video: true }, t2), r2 = i2 == null ? void 0 : i2.find((u2) => u2.type === "video");
        if (!r2) throw new Error("No video track found");
        (o2 = this.sdk) == null || o2.deviceManager.init(true), this.localPeer.videoTrack = r2, (d2 = (n2 = this.sdk) == null ? void 0 : n2.listener) == null || d2.onPeerUpdate(9, [this.localPeer]);
      });
    }
    stopCameraCheck() {
      var e, t2;
      (t2 = (e = this.localPeer) == null ? void 0 : e.videoTrack) == null || t2.cleanup(), this.localPeer && (this.localPeer.videoTrack = void 0);
    }
    startMicCheck(s2) {
      return c2(this, arguments, function* ({ inputDevice: e, onError: t2, onStop: i2, time: r2 = Ka }) {
        var u2, p2, h2, T;
        this.initSdkWithLocalPeer((g2) => {
          this.stopMicCheck(), t2 == null || t2(g2);
        });
        let o2 = yield this.getLocalAudioTrack(e);
        if ((u2 = this.sdk) == null || u2.deviceManager.init(true), !this.localPeer) throw new Error("Local peer not found");
        if (!o2) throw new Error("No audio track found");
        this.localPeer.audioTrack = o2, (p2 = this.sdk) == null || p2.initPreviewTrackAudioLevelMonitor(), (T = (h2 = this.sdk) == null ? void 0 : h2.listener) == null || T.onPeerUpdate(9, [this.localPeer]), this.mediaRecorder = new MediaRecorder(o2.stream.nativeStream);
        let n2 = [];
        this.mediaRecorder.ondataavailable = function(g2) {
          n2.push(g2.data);
        }, this.mediaRecorder.onstop = () => {
          var f2, P2;
          let g2 = new Blob(n2, { type: (f2 = this.mediaRecorder) == null ? void 0 : f2.mimeType });
          this.recordedAudio = URL.createObjectURL(g2), (P2 = this.onStopMicCheck) == null || P2.call(this);
        }, this.mediaRecorder.start();
        let d2 = setTimeout(() => {
          this.stopMicCheck();
        }, r2);
        this.onStopMicCheck = () => {
          clearTimeout(d2), i2 == null || i2();
        };
      });
    }
    stopMicCheck() {
      var e, t2, i2;
      (e = this.mediaRecorder) == null || e.stop(), (i2 = (t2 = this.localPeer) == null ? void 0 : t2.audioTrack) == null || i2.cleanup(), this.localPeer && (this.localPeer.audioTrack = void 0);
    }
    getRecordedAudio() {
      return this.recordedAudio;
    }
    startConnectivityCheck(e, t2, i2, r2) {
      return c2(this, null, function* () {
        if (!this.sdk) throw new Error("SDK not found");
        this.connectivityCheck = new Ui(this.sdk, this.sdkListener, e, t2, r2);
        let s2 = yield this.getAuthToken(i2);
        yield this.sdk.leave(), yield this.sdk.join({ authToken: s2, userName: "diagnostics-test" }, this.connectivityCheck), this.sdk.addConnectionQualityListener({ onConnectionQualityUpdate: (o2) => {
          var n2;
          (n2 = this.connectivityCheck) == null || n2.handleConnectionQualityUpdate(o2);
        } });
      });
    }
    stopConnectivityCheck() {
      return c2(this, null, function* () {
        var e;
        return (e = this.connectivityCheck) == null ? void 0 : e.cleanupAndReport();
      });
    }
    initSdkWithLocalPeer(e) {
      var r2, s2, o2;
      this.sdkListener && ((r2 = this.sdk) == null || r2.initStoreAndManagers(M2(m({}, this.sdkListener), { onError: (n2) => {
        e == null || e(n2), this.sdkListener.onError(n2);
      } })));
      let t2 = new qe({ name: "diagnostics-peer", role: dt, type: "regular" });
      (s2 = this.sdk) == null || s2.store.addPeer(t2);
      let i2 = new Je("diagnostics-room");
      this.sdk.store.setRoom(i2), this.sdkListener.onRoomUpdate("ROOM_PEER_COUNT_UPDATED", i2), (o2 = this.sdk) == null || o2.deviceManager.init(true);
    }
    getAuthToken(e) {
      return c2(this, null, function* () {
        let t2 = new URL("https://api.100ms.live/v2/diagnostics/token");
        e && t2.searchParams.append("region", e);
        let i2 = yield Bi(t2.toString(), { method: "GET" }, [429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511]), r2 = yield i2.json();
        if (!i2.ok) throw S2.APIErrors.ServerErrors(r2.code, "GET_TOKEN", r2.message, false);
        let { token: s2 } = r2;
        if (!s2) throw Error(r2.message);
        return s2;
      });
    }
    getLocalAudioTrack(e) {
      return c2(this, null, function* () {
        var r2;
        if (!this.localPeer) return;
        this.localPeer.role = M2(m({}, dt), { publishParams: M2(m({}, dt.publishParams), { allowed: ["audio"] }) });
        let t2 = new Ne().audio(new J().deviceId(e || "default").build()).build(), i2 = yield (r2 = this.sdk) == null ? void 0 : r2.localTrackManager.getLocalTracks({ audio: true, video: false }, t2);
        return i2 == null ? void 0 : i2.find((s2) => s2.type === "audio");
      });
    }
  };
  var Vi = class {
    constructor(e, t2, i2) {
      this.isRoomJoinCalled = false;
      this.ignoredMessageTypes = [];
      this.setProgress = ({ type: e2, progress: t3 }) => {
        this.setState((i3) => {
          i3.playlist[e2].progress = t3, i3.playlist[e2].currentTime = this.sdk.getPlaylistManager().getCurrentTime(e2);
        }, "playlistProgress");
      };
      this.syncPlaylistState = (e2) => {
        this.setState((t3) => {
          Object.assign(t3.playlist, _2.convertPlaylist(this.sdk.getPlaylistManager()));
        }, e2);
      };
      this.sendPeerUpdateNotification = (e2, t3) => {
        let i3 = this.store.getState(ee(t3.peerId)), r2 = Hi[e2] || "peerUpdate";
        if (e2 === 8) this.syncRoomState(r2), this.updateMidCallPreviewRoomState(e2, t3);
        else if ([0, 1].includes(e2)) this.syncRoomState(r2), i3 || (i3 = this.store.getState(ee(t3.peerId)));
        else if ([12, 13, 14].includes(e2)) this.syncRoomState(r2), i3 || (i3 = this.store.getState(ee(t3.peerId)));
        else {
          let s2 = _2.convertPeer(t3);
          this.setState((o2) => {
            let n2 = o2.peers[s2.id];
            je(n2, s2) && (ae(n2.auxiliaryTracks, s2.auxiliaryTracks) && (n2.auxiliaryTracks = s2.auxiliaryTracks), Object.assign(n2, s2)), i3 = s2;
          }, r2);
        }
        this.hmsNotifications.sendPeerUpdate(e2, i3);
      };
      this.getSDKHMSPeer = (e2) => this.sdk.getPeerMap()[e2];
      this.setState = (e2, t3) => this.store.namedSetState(e2, t3);
      this.store = e, this.sdk = t2, this.hmsNotifications = i2, this.sessionStore = new _i(this.sdk, this.setSessionStoreValueLocally.bind(this)), this.actionBatcher = new Di(e);
    }
    submitSessionFeedback(e, t2) {
      return this.sdk.submitSessionFeedback(e, t2);
    }
    getLocalTrack(e) {
      return this.sdk.store.getLocalPeerTracks().find((t2) => t2.trackId === e);
    }
    get interactivityCenter() {
      return this.sdk.getInteractivityCenter();
    }
    setPlaylistSettings(e) {
      this.sdk.updatePlaylistSettings(e);
    }
    refreshDevices() {
      return c2(this, null, function* () {
        yield this.sdk.refreshDevices();
      });
    }
    unblockAudio() {
      return c2(this, null, function* () {
        yield this.sdk.getAudioOutput().unblockAutoplay();
      });
    }
    setVolume(e, t2) {
      return c2(this, null, function* () {
        t2 ? yield this.setTrackVolume(e, t2) : (yield this.sdk.getAudioOutput().setVolume(e), this.syncRoomState("setOutputVolume"));
      });
    }
    setAudioOutputDevice(e) {
      return c2(this, null, function* () {
        (yield this.sdk.getAudioOutput().setDevice(e)) && this.setState((i2) => {
          i2.settings.audioOutputDeviceId = e;
        }, "setAudioOutputDevice");
      });
    }
    setPreferredLayer(e, t2) {
      return c2(this, null, function* () {
        var r2;
        let i2 = this.getTrackById(e);
        if (i2) if (i2 instanceof O2) {
          if (t2 === "none") {
            b2.d("layer none will be ignored");
            return;
          }
          if (((r2 = this.store.getState(Ha(e))) == null ? void 0 : r2.preferredLayer) === t2) {
            b2.d(`preferred layer is already ${t2}`);
            return;
          }
          this.setState((o2) => {
            let n2 = o2.tracks[e];
            n2 && (n2.preferredLayer = t2);
          }, "setPreferredLayer"), yield i2.setPreferredLayer(t2);
        } else b2.d(`track ${e} is not a remote video track`);
        else this.logPossibleInconsistency(`track ${e} not present, unable to set preffer layer`);
      });
    }
    getNativeTrackById(e) {
      var t2;
      return (t2 = this.sdk.store.getTrackById(e)) == null ? void 0 : t2.nativeTrack;
    }
    getTrackById(e) {
      return this.sdk.store.getTrackById(e);
    }
    getAuthTokenByRoomCode(e, t2) {
      return this.sdk.getAuthTokenByRoomCode(e, t2);
    }
    preview(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getState(se);
        if (t2 === "Preview" || t2 === "Connecting") {
          this.logPossibleInconsistency("attempting to call preview while room is in preview/connecting");
          return;
        }
        try {
          t2 !== "Connected" && this.setState((i2) => {
            i2.room.roomState = "Connecting";
          }, "connecting"), yield this.sdkPreviewWithListeners(e);
        } catch (i2) {
          throw b2.e("Cannot show preview. Failed to connect to room - ", i2), i2;
        }
      });
    }
    cancelMidCallPreview() {
      return c2(this, null, function* () {
        return this.sdk.cancelMidCallPreview();
      });
    }
    join(e) {
      return c2(this, null, function* () {
        if (this.isRoomJoinCalled) {
          this.logPossibleInconsistency("room join is called again");
          return;
        }
        try {
          this.isRoomJoinCalled = true, this.setState((t2) => {
            t2.room.roomState = "Connecting";
          }, "join"), yield this.sdkJoinWithListeners(e);
        } catch (t2) {
          throw this.isRoomJoinCalled = false, b2.e("Failed to connect to room - ", t2), t2;
        }
      });
    }
    leave() {
      return c2(this, null, function* () {
        let e = this.store.getState(Be), t2 = true;
        e || (t2 = false, this.logPossibleInconsistency("room leave is called when no room is connected"));
        let i2 = this.store.getState(se);
        return this.setState((r2) => {
          r2.room.roomState = "Disconnecting";
        }, "leaving"), this.sdk.leave(t2).then(() => {
          this.resetState("leave"), this.beamSpeakerLabelsLogger && this.beamSpeakerLabelsLogger.stop().catch(b2.e), b2.i("left room");
        }).catch((r2) => {
          b2.e("error in leaving room - ", r2), this.setState((s2) => {
            s2.room.roomState = i2;
          }, "revertLeave");
        });
      });
    }
    setScreenShareEnabled(e, t2) {
      return c2(this, null, function* () {
        typeof t2 == "boolean" && (t2 = { audioOnly: t2 });
        try {
          e ? yield this.startScreenShare(t2) : yield this.stopScreenShare();
        } catch (i2) {
          throw this.hmsNotifications.sendError(_2.convertException(i2)), i2;
        }
      });
    }
    addTrack(e, t2 = "regular") {
      return c2(this, null, function* () {
        yield this.sdk.addTrack(e, t2), this.syncRoomState("addTrack");
      });
    }
    removeTrack(e) {
      return c2(this, null, function* () {
        yield this.sdk.removeTrack(e), this.syncRoomState("removeTrack");
      });
    }
    setLocalAudioEnabled(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getState(le);
        t2 && (yield this.setEnabledTrack(t2, e));
      });
    }
    setLocalVideoEnabled(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getState(Z2);
        t2 && (yield this.setEnabledTrack(t2, e));
      });
    }
    setEnabledTrack(e, t2) {
      return c2(this, null, function* () {
        var s2;
        if (((s2 = this.store.getState().tracks[e]) == null ? void 0 : s2.enabled) === t2) {
          this.logPossibleInconsistency(`local track[${e}] enabled state - ${t2}`);
          return;
        }
        this.setState((o2) => {
          o2.tracks[e] ? o2.tracks[e].displayEnabled = t2 : this.logPossibleInconsistency("track id not found for setEnabled");
        }, "displayEnabled");
        try {
          yield this.setEnabledSDKTrack(e, t2), this.syncRoomState("setEnabled");
        } catch (o2) {
          throw this.setState((n2) => {
            n2.tracks[e].displayEnabled = !t2;
          }, "rollbackDisplayEnabled"), this.hmsNotifications.sendError(_2.convertException(o2)), o2;
        }
        let r2 = t2 ? 3 : 2;
        this.hmsNotifications.sendTrackUpdate(r2, e);
      });
    }
    autoSelectAudioOutput(e) {
      return c2(this, null, function* () {
        yield this.sdk.autoSelectAudioOutput(e);
      });
    }
    setAudioSettings(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getState(le);
        t2 && (yield this.setSDKLocalAudioTrackSettings(t2, e), this.syncRoomState("setAudioSettings"));
      });
    }
    setVideoSettings(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getState(Z2);
        t2 && (yield this.setSDKLocalVideoTrackSettings(t2, e), this.syncRoomState("setVideoSettings"));
      });
    }
    switchCamera() {
      return c2(this, null, function* () {
        let e = this.store.getState(Z2);
        if (e) {
          let t2 = this.sdk.store.getLocalPeerTracks().find((i2) => i2.trackId === e);
          t2 && (yield t2.switchCamera(), this.syncRoomState("switchCamera"));
        }
      });
    }
    sendMessage(e) {
      this.sendBroadcastMessage(e);
    }
    sendBroadcastMessage(e, t2) {
      return c2(this, null, function* () {
        let { message_id: i2, timestamp: r2 } = yield this.sdk.sendBroadcastMessage(e, t2);
        this.updateMessageInStore({ message: e, type: t2, id: i2, time: r2 });
      });
    }
    sendGroupMessage(e, t2, i2) {
      return c2(this, null, function* () {
        let r2 = this.store.getState(Pe), s2 = t2.map((d2) => r2[d2]), { message_id: o2, timestamp: n2 } = yield this.sdk.sendGroupMessage(e, s2, i2);
        this.updateMessageInStore({ message: e, recipientRoles: t2, type: i2, id: o2, time: n2 });
      });
    }
    sendDirectMessage(e, t2, i2) {
      return c2(this, null, function* () {
        let { message_id: r2, timestamp: s2 } = yield this.sdk.sendDirectMessage(e, t2, i2);
        this.updateMessageInStore({ message: e, recipientPeer: t2, type: i2, id: r2, time: s2 });
      });
    }
    updateMessageInStore(e) {
      var s2;
      if (!e.message) throw b2.w("sendMessage", "Failed to send message", e), Error(`sendMessage Failed - ${JSON.stringify(e)}`);
      if (!!e.type && this.ignoredMessageTypes.includes(e.type)) return;
      let i2 = this.sdk.getLocalPeer(), r2 = { read: true, id: e.id, time: new Date(e.time), message: e.message, type: e.type || "chat", recipientPeer: e.recipientPeer, recipientRoles: e.recipientRoles, senderName: i2 == null ? void 0 : i2.name, sender: i2 == null ? void 0 : i2.peerId, senderRole: (s2 = i2 == null ? void 0 : i2.role) == null ? void 0 : s2.name, ignored: false };
      this.setState((o2) => {
        o2.messages.byID[r2.id] = r2, o2.messages.allIDs.push(r2.id);
      }, "newMessage");
    }
    setMessageRead(e, t2) {
      this.setState((i2) => {
        t2 ? i2.messages.byID[t2] ? i2.messages.byID[t2].read = e : this.logPossibleInconsistency("no message with id is found") : i2.messages.allIDs.forEach((r2) => {
          i2.messages.byID[r2].read = e;
        });
      }, "setMessageRead");
    }
    attachVideo(e, t2) {
      return c2(this, null, function* () {
        if (this.localAndVideoUnmuting(e)) return new Promise((i2) => {
          let r2 = this.store.subscribe((s2) => c2(this, null, function* () {
            s2 && (yield this.attachVideoInternal(e, t2), r2(), i2());
          }), Yr);
        });
        yield this.attachVideoInternal(e, t2);
      });
    }
    detachVideo(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getTrackById(e);
        (i2 == null ? void 0 : i2.type) === "video" ? yield this.sdk.detachVideo(i2, t2) : (t2 && (t2.srcObject = null), b2.d("possible inconsistency detected - no video track found to remove sink"));
      });
    }
    addPluginToVideoTrack(e, t2) {
      return c2(this, null, function* () {
        return this.addRemoveVideoPlugin(e, "add", t2);
      });
    }
    addPluginsToVideoStream(e) {
      return c2(this, null, function* () {
        return this.addRemoveMediaStreamVideoPlugins(e, "add");
      });
    }
    removePluginsFromVideoStream(e) {
      return c2(this, null, function* () {
        return this.addRemoveMediaStreamVideoPlugins(e, "remove");
      });
    }
    addPluginToAudioTrack(e) {
      return c2(this, null, function* () {
        return this.addRemoveAudioPlugin(e, "add");
      });
    }
    validateVideoPluginSupport(e) {
      let t2 = {};
      if (t2.isSupported = false, !e) return b2.w("no plugin passed in for checking support"), t2.errMsg = "no plugin passed in for checking support", t2;
      let i2 = this.store.getState(Z2);
      if (!i2) return b2.w("video Track not added to local peer yet"), t2.errMsg = "call this function only after local peer has video track", t2;
      let r2 = this.getTrackById(i2);
      return r2 ? t2 = r2.validatePlugin(e) : (b2.w(`track ${i2} not present, unable to validate plugin`), t2.errMsg = `track ${i2} not present, unable to validate plugin`), t2;
    }
    validateAudioPluginSupport(e) {
      let t2 = {};
      if (t2.isSupported = false, !e) return b2.w('no plugin passed in for checking support"'), t2.errMsg = 'no plugin passed in for checking support"', t2;
      let i2 = this.store.getState(le);
      if (!i2) return b2.w("audio track not added to local peer yet"), t2.errMsg = "call this function only after local peer has audio track", t2;
      let r2 = this.getTrackById(i2);
      return r2 ? t2 = r2.validatePlugin(e) : (b2.w(`track ${i2} not present, unable to validate plugin`), t2.errMsg = `track ${i2} not present, unable to validate plugin`), t2;
    }
    removePluginFromVideoTrack(e) {
      return c2(this, null, function* () {
        return this.addRemoveVideoPlugin(e, "remove");
      });
    }
    removePluginFromAudioTrack(e) {
      return c2(this, null, function* () {
        return this.addRemoveAudioPlugin(e, "remove");
      });
    }
    changeRole(e, t2, i2 = false) {
      return c2(this, null, function* () {
        yield this.sdk.changeRoleOfPeer(e, t2, i2);
      });
    }
    changeRoleOfPeer(e, t2, i2 = false) {
      return c2(this, null, function* () {
        yield this.sdk.changeRoleOfPeer(e, t2, i2);
      });
    }
    changeRoleOfPeersWithRoles(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.sdk.getRoles().filter((r2) => e.includes(r2.name));
        yield this.sdk.changeRoleOfPeersWithRoles(i2, t2);
      });
    }
    acceptChangeRole(e) {
      return c2(this, null, function* () {
        let t2 = e.requestedBy ? this.getSDKHMSPeer(e.requestedBy.id) : void 0;
        t2 || b2.w(`peer for which role change is requested no longer available - ${e.requestedBy}`);
        let i2 = { requestedBy: t2, role: e.role, token: e.token };
        yield this.sdk.acceptChangeRole(i2), this.removeRoleChangeRequest(e);
      });
    }
    raiseLocalPeerHand() {
      return c2(this, null, function* () {
        yield this.sdk.raiseLocalPeerHand();
      });
    }
    lowerLocalPeerHand() {
      return c2(this, null, function* () {
        yield this.sdk.lowerLocalPeerHand();
      });
    }
    raiseRemotePeerHand(e) {
      return c2(this, null, function* () {
        yield this.sdk.raiseRemotePeerHand(e);
      });
    }
    lowerRemotePeerHand(e) {
      return c2(this, null, function* () {
        yield this.sdk.lowerRemotePeerHand(e);
      });
    }
    getPeer(e) {
      return c2(this, null, function* () {
        let t2 = yield this.sdk.getPeer(e);
        if (t2) return _2.convertPeer(t2);
      });
    }
    findPeerByName(e) {
      return c2(this, null, function* () {
        let { offset: t2, peers: i2, eof: r2 } = yield this.sdk.findPeerByName(e);
        return { offset: t2, eof: r2, peers: i2.map((s2) => _2.convertPeer(s2)) };
      });
    }
    getPeerListIterator(e) {
      let t2 = this.sdk.getPeerListIterator(e);
      return { hasNext: () => t2.hasNext(), next: () => c2(this, null, function* () {
        return (yield t2.next()).map((r2) => _2.convertPeer(r2));
      }), findPeers: () => c2(this, null, function* () {
        return (yield t2.findPeers()).map((r2) => _2.convertPeer(r2));
      }), getTotal: () => t2.getTotal() };
    }
    initAppData(e) {
      this.setState((t2) => {
        t2.appData = e;
      }, "initAppData");
    }
    setAppData(e, t2, i2) {
      let r2 = (t2 == null ? void 0 : t2.constructor.name) === "Object";
      this.setState((s2) => {
        if (s2.appData) i2 && r2 ? Object.assign(s2.appData[e], t2) : s2.appData[e] = t2;
        else {
          let o2 = { [e]: t2 };
          s2.appData = o2;
        }
      }, `setAppData-${e}`);
    }
    rejectChangeRole(e) {
      this.removeRoleChangeRequest(e);
    }
    endRoom(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.store.getState(ga);
        if (!(i2 != null && i2.endRoom)) {
          b2.w("You are not allowed to perform this action - endRoom");
          return;
        }
        let r2 = this.store.getState(se);
        this.setState((s2) => {
          s2.room.roomState = "Disconnecting";
        }, "endingRoom");
        try {
          yield this.sdk.endRoom(e, t2), this.resetState("endRoom");
        } catch (s2) {
          b2.e("error in ending room - ", s2), this.setState((o2) => {
            o2.room.roomState = r2;
          }, "revertEndRoom");
        }
      });
    }
    removePeer(e, t2) {
      return c2(this, null, function* () {
        var r2;
        let i2 = (r2 = this.sdk.getLocalPeer()) == null ? void 0 : r2.peerId;
        e !== i2 && (yield this.sdk.removePeer(e, t2));
      });
    }
    startRTMPOrRecording(e) {
      return c2(this, null, function* () {
        yield this.sdk.startRTMPOrRecording(e);
      });
    }
    stopRTMPAndRecording() {
      return c2(this, null, function* () {
        yield this.sdk.stopRTMPAndRecording();
      });
    }
    startHLSStreaming(e) {
      return c2(this, null, function* () {
        yield this.sdk.startHLSStreaming(e);
      });
    }
    stopHLSStreaming(e) {
      return c2(this, null, function* () {
        yield this.sdk.stopHLSStreaming(e);
      });
    }
    startTranscription(e) {
      return c2(this, null, function* () {
        yield this.sdk.startTranscription(e);
      });
    }
    stopTranscription(e) {
      return c2(this, null, function* () {
        yield this.sdk.stopTranscription(e);
      });
    }
    sendHLSTimedMetadata(e) {
      return c2(this, null, function* () {
        yield this.sdk.sendHLSTimedMetadata(e);
      });
    }
    changeName(e) {
      return c2(this, null, function* () {
        yield this.sdk.changeName(e);
      });
    }
    changeMetadata(e) {
      return c2(this, null, function* () {
        typeof e != "string" && (e = JSON.stringify(e)), yield this.sdk.changeMetadata(e);
      });
    }
    setSessionMetadata(e) {
      return c2(this, null, function* () {
        yield this.sdk.setSessionMetadata(e), this.setState((t2) => {
          t2.sessionMetadata = e;
        }, "setSessionMetadata"), this.setSessionStoreValueLocally({ key: "default", value: e }, "setSessionMetadata");
      });
    }
    populateSessionMetadata() {
      return c2(this, null, function* () {
        let e = yield this.sdk.getSessionMetadata();
        this.setState((t2) => {
          t2.sessionMetadata = e;
        }, "populateSessionMetadata"), this.setSessionStoreValueLocally({ key: "default", value: e }, "populateSessionmetadata");
      });
    }
    setRemoteTrackEnabled(e, t2) {
      return c2(this, null, function* () {
        if (typeof e == "string") {
          let i2 = this.getTrackById(e);
          i2 && Ba(i2) ? yield this.sdk.changeTrackState(i2, t2) : this.logPossibleInconsistency(`No remote track with ID ${e} found for change track state`);
        } else Array.isArray(e) && e.forEach((i2) => this.setRemoteTrackEnabled(i2, t2));
      });
    }
    setRemoteTracksEnabled(e) {
      return c2(this, null, function* () {
        let t2 = { enabled: e.enabled, type: e.type, source: e.source };
        if (e.roles) {
          let i2 = this.store.getState(Pe);
          t2.roles = e.roles.map((r2) => i2[r2]);
        }
        yield this.sdk.changeMultiTrackState(t2);
      });
    }
    setLogLevel(e) {
      b2.level = e, this.sdk.setLogLevel(e);
    }
    setFrameworkInfo(e) {
      this.sdk.setFrameworkInfo(e);
    }
    ignoreMessageTypes(e, t2 = false) {
      if (t2) this.ignoredMessageTypes = e;
      else for (let i2 of e) this.ignoredMessageTypes.includes(i2) || this.ignoredMessageTypes.push(i2);
    }
    enableBeamSpeakerLabelsLogging() {
      return c2(this, null, function* () {
        this.beamSpeakerLabelsLogger || (b2.i("enabling beam speaker labels logging"), this.beamSpeakerLabelsLogger = new Ni(this.store, this), yield this.beamSpeakerLabelsLogger.start());
      });
    }
    initDiagnostics() {
      let e = new Ut(this.sdk, { onJoin: this.onJoin.bind(this), onPreview: this.onPreview.bind(this), onRoomUpdate: this.onRoomUpdate.bind(this), onPeerUpdate: this.onPeerUpdate.bind(this), onTrackUpdate: this.onTrackUpdate.bind(this), onMessageReceived: this.onMessageReceived.bind(this), onError: this.onError.bind(this), onReconnected: this.onReconnected.bind(this), onReconnecting: this.onReconnecting.bind(this), onRoleChangeRequest: this.onRoleChangeRequest.bind(this), onRoleUpdate: this.onRoleUpdate.bind(this), onDeviceChange: this.onDeviceChange.bind(this), onChangeTrackStateRequest: this.onChangeTrackStateRequest.bind(this), onChangeMultiTrackStateRequest: this.onChangeMultiTrackStateRequest.bind(this), onRemovedFromRoom: this.onRemovedFromRoom.bind(this), onNetworkQuality: this.onNetworkQuality.bind(this), onSessionStoreUpdate: this.onSessionStoreUpdate.bind(this), onPollsUpdate: this.onPollsUpdate.bind(this), onWhiteboardUpdate: this.onWhiteboardUpdate.bind(this) });
      return this.sdk.addAudioListener({ onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this) }), this.sdk.addConnectionQualityListener({ onConnectionQualityUpdate: this.onConnectionQualityUpdate.bind(this) }), e;
    }
    resetState(e = "resetState") {
      this.isRoomJoinCalled = false, b2.cleanup(), this.setState((t2) => {
        Object.assign(t2, oi());
      }, e);
    }
    getDebugInfo() {
      return this.sdk.getDebugInfo();
    }
    sdkJoinWithListeners(e) {
      return c2(this, null, function* () {
        yield this.sdk.join(e, { onJoin: this.onJoin.bind(this), onPreview: this.onPreview.bind(this), onRoomUpdate: this.onRoomUpdate.bind(this), onPeerUpdate: this.onPeerUpdate.bind(this), onTrackUpdate: this.onTrackUpdate.bind(this), onMessageReceived: this.onMessageReceived.bind(this), onError: this.onError.bind(this), onReconnected: this.onReconnected.bind(this), onReconnecting: this.onReconnecting.bind(this), onRoleChangeRequest: this.onRoleChangeRequest.bind(this), onRoleUpdate: this.onRoleUpdate.bind(this), onDeviceChange: this.onDeviceChange.bind(this), onChangeTrackStateRequest: this.onChangeTrackStateRequest.bind(this), onChangeMultiTrackStateRequest: this.onChangeMultiTrackStateRequest.bind(this), onRemovedFromRoom: this.onRemovedFromRoom.bind(this), onNetworkQuality: this.onNetworkQuality.bind(this), onSessionStoreUpdate: this.onSessionStoreUpdate.bind(this), onPollsUpdate: this.onPollsUpdate.bind(this), onWhiteboardUpdate: this.onWhiteboardUpdate.bind(this), onSFUMigration: this.onSFUMigration.bind(this) }), this.sdk.addAudioListener({ onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this) }), this.sdk.addConnectionQualityListener({ onConnectionQualityUpdate: this.onConnectionQualityUpdate.bind(this) });
      });
    }
    onSFUMigration() {
      this.syncRoomState("SFUMigration");
    }
    onRemovedFromRoom(e) {
      var r2;
      let t2 = this.store.getState(ee((r2 = e.requestedBy) == null ? void 0 : r2.peerId));
      this.hmsNotifications.sendLeaveRoom(M2(m({}, e), { requestedBy: t2 || void 0 }));
      let i2 = e.roomEnded || !t2 ? "roomEnded" : "removedFromRoom";
      b2.i(`resetting state after peer removed ${i2}`, e), this.resetState(i2);
    }
    onDeviceChange(e) {
      let t2 = e.devices;
      if (!t2) return;
      let i2 = this.store.getState(re);
      if (this.setState((r2) => {
        ae(r2.devices.audioInput, t2.audioInput) || (r2.devices.audioInput = t2.audioInput), ae(r2.devices.videoInput, t2.videoInput) || (r2.devices.videoInput = t2.videoInput), ae(r2.devices.audioOutput, t2.audioOutput) || (r2.devices.audioOutput = t2.audioOutput);
        let s2 = this.sdk.getLocalPeer();
        i2 != null && i2.id && s2 && Object.assign(r2.settings, this.getMediaSettings(s2));
      }, "deviceChange"), e.selection && !e.internal) {
        let r2 = _2.convertDeviceChangeUpdate(e);
        this.hmsNotifications.sendDeviceChange(r2);
      }
    }
    sdkPreviewWithListeners(e) {
      return c2(this, null, function* () {
        yield this.sdk.preview(e, { onPreview: this.onPreview.bind(this), onError: this.onError.bind(this), onReconnected: this.onReconnected.bind(this), onReconnecting: this.onReconnecting.bind(this), onDeviceChange: this.onDeviceChange.bind(this), onRoomUpdate: this.onRoomUpdate.bind(this), onPeerUpdate: this.onPeerUpdate.bind(this), onNetworkQuality: this.onNetworkQuality.bind(this), onTrackUpdate: this.onTrackUpdate.bind(this) }), this.sdk.addAudioListener({ onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this) });
      });
    }
    onNetworkQuality(e) {
      this.setState((t2) => {
        var r2;
        let i2 = t2.room.localPeer || ((r2 = this.sdk.getLocalPeer()) == null ? void 0 : r2.peerId);
        i2 && (t2.connectionQualities[i2] = { peerID: i2, downlinkQuality: e });
      }, "ConnectionQuality");
    }
    onSessionStoreUpdate(e) {
      this.setSessionStoreValueLocally(e, "sessionStoreUpdate");
    }
    onPollsUpdate(e, t2) {
      let i2 = Ci[e];
      this.setState((r2) => {
        let s2 = t2.reduce((o2, n2) => {
          var d2;
          return o2[n2.id] = M2(m({}, n2), { questions: (d2 = n2.questions) == null ? void 0 : d2.map((u2) => {
            var p2, h2;
            return M2(m({}, u2), { answer: u2.answer ? m({}, u2.answer) : void 0, options: (p2 = u2.options) == null ? void 0 : p2.map((T) => m({}, T)), responses: (h2 = u2.responses) == null ? void 0 : h2.map((T) => m({}, T)) });
          }) }), o2;
        }, {});
        Ga(r2.polls, s2);
      }, i2), t2.forEach((r2) => this.hmsNotifications.sendPollUpdate(e, r2.id));
    }
    onWhiteboardUpdate(e) {
      this.setState((t2) => {
        t2.whiteboards[e.id] = e;
      }, "whiteboardUpdate");
    }
    startScreenShare(e) {
      return c2(this, null, function* () {
        this.store.getState(Xr) ? this.logPossibleInconsistency("start screenshare is called while it's on") : (yield this.sdk.startScreenShare(() => this.syncRoomState("screenshareStopped"), e), this.syncRoomState("startScreenShare"));
      });
    }
    stopScreenShare() {
      return c2(this, null, function* () {
        this.store.getState(Xr) ? (yield this.sdk.stopScreenShare(), this.syncRoomState("stopScreenShare")) : this.logPossibleInconsistency("stop screenshare is called while it's not on");
      });
    }
    attachVideoInternal(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getTrackById(e);
        i2 || (i2 = this.getLocalTrack(e)), i2 && i2.type === "video" ? yield this.sdk.attachVideo(i2, t2) : this.logPossibleInconsistency("no video track found to add sink");
      });
    }
    syncRoomState(e) {
      e = `${e}_fullSync`, b2.time(`store-sync-${e}`);
      let t2 = {}, i2 = [], r2 = {}, s2 = {}, o2 = {}, n2, d2 = this.sdk.getPeers();
      for (let g2 of d2) {
        let f2 = _2.convertPeer(g2);
        t2[f2.id] = f2, i2.push(f2.id), o2[f2.id] = { peerID: f2.id, downlinkQuality: g2.networkQuality || -1 };
        let P2 = [g2.audioTrack, g2.videoTrack, ...g2.auxiliaryTracks];
        for (let v2 of P2) {
          if (!v2) continue;
          let R2 = _2.convertTrack(v2);
          r2[R2.id] = R2;
        }
        if (g2.isLocal) {
          let v2 = g2;
          n2 = this.getPreviewFields(v2), Object.assign(s2, this.getMediaSettings(v2));
        }
      }
      let u2 = this.sdk.getRecordingState(), p2 = this.sdk.getRTMPState(), h2 = this.sdk.getHLSState(), T = this.sdk.getTranscriptionState();
      this.setState((g2) => {
        var v2;
        g2.room.peers = i2;
        let f2 = g2.peers, P2 = g2.tracks;
        Va(f2, t2), Fa(P2, r2), Object.assign(g2.settings, s2), g2.room.isConnected && Object.assign(g2.connectionQualities, o2), (v2 = g2.preview) != null && v2.localPeer && (n2 != null && n2.localPeer) ? Object.assign(g2.preview, n2) : g2.preview = n2, Object.assign(g2.roles, _2.convertRoles(this.sdk.getRoles())), Object.assign(g2.playlist, _2.convertPlaylist(this.sdk.getPlaylistManager())), Object.assign(g2.room, _2.convertRecordingStreamingState(u2, p2, h2, T)), Object.assign(g2.templateAppData, this.sdk.getTemplateAppData());
      }, e), b2.timeEnd(`store-sync-${e}`);
    }
    onPreview(e) {
      this.setState((t2) => {
        var i2;
        Object.assign(t2.room, _2.convertRoom(e, (i2 = this.sdk.getLocalPeer()) == null ? void 0 : i2.peerId)), t2.room.roomState = "Preview";
      }, "previewStart"), this.syncRoomState("previewSync");
    }
    onJoin(e) {
      let t2 = this.sdk.getPlaylistManager();
      this.audioPlaylist = new xt(t2, "audio", this.syncPlaylistState.bind(this), this.store), this.videoPlaylist = new xt(t2, "video", this.syncRoomState.bind(this), this.store), this.syncRoomState("joinSync"), this.setState((i2) => {
        var r2;
        Object.assign(i2.room, _2.convertRoom(e, (r2 = this.sdk.getLocalPeer()) == null ? void 0 : r2.peerId)), i2.room.isConnected = true, i2.room.roomState = "Connected";
      }, "joined"), t2.onProgress(this.setProgress), t2.onNewTrackStart((i2) => {
        this.syncPlaylistState(`${i2.type}PlaylistUpdate`);
      }), t2.onPlaylistEnded((i2) => {
        this.syncPlaylistState(`${i2}PlaylistEnded`);
      }), t2.onCurrentTrackEnded((i2) => {
        this.hmsNotifications.sendPlaylistTrackEnded(_2.convertPlaylistItem(t2, i2)), this.syncPlaylistState(`${i2.type}PlaylistItemEnded`);
      });
    }
    onRoomUpdate(e, t2) {
      this.setState((i2) => {
        var r2;
        Object.assign(i2.room, _2.convertRoom(t2, (r2 = this.sdk.getLocalPeer()) == null ? void 0 : r2.peerId));
      }, e), e === "TRANSCRIPTION_STATE_UPDATED" && this.hmsNotifications.sendTranscriptionUpdate(t2.transcriptions);
    }
    onPeerUpdate(e, t2) {
      if (![4, 5].includes(e)) {
        if (Array.isArray(t2)) {
          let i2 = this.store.getState(z2), r2 = t2.filter((o2) => !i2[o2.peerId]);
          if (this.syncRoomState("peersJoined"), this.store.getState(Be)) {
            let o2 = [];
            for (let n2 of t2) {
              let d2 = this.store.getState(ee(n2.peerId));
              d2 && o2.push(d2);
            }
            this.hmsNotifications.sendPeerList(o2);
          } else r2.forEach((o2) => {
            let n2 = this.store.getState(ee(o2.peerId));
            n2 && this.hmsNotifications.sendPeerUpdate(0, n2);
          });
          return;
        }
        this.sendPeerUpdateNotification(e, t2);
      }
    }
    onTrackUpdate(e, t2, i2) {
      if (e === 1) this.hmsNotifications.sendTrackUpdate(e, t2.trackId), this.handleTrackRemove(t2, i2);
      else if ([0, 1].includes(e)) {
        let r2 = Nt[e];
        this.syncRoomState(r2), this.hmsNotifications.sendTrackUpdate(e, t2.trackId);
      } else {
        let r2 = Nt[e] || "trackUpdate", s2 = _2.convertTrack(t2);
        this.setState((o2) => {
          let n2 = o2.tracks[s2.id];
          je(n2, s2) && (ss(n2, s2), Object.assign(n2, s2));
        }, r2), this.hmsNotifications.sendTrackUpdate(e, t2.trackId);
      }
    }
    onMessageReceived(e) {
      let t2 = _2.convertMessage(e, this.store.getState(Ie));
      t2.read = false, t2.ignored = this.ignoredMessageTypes.includes(t2.type), t2.type === "hms_transcript" && (t2.ignored = true), this.putMessageInStore(t2), this.hmsNotifications.sendMessageReceived(t2);
    }
    putMessageInStore(e) {
      e.ignored || this.actionBatcher.setState((t2) => {
        t2.messages.byID[e.id] = e, t2.messages.allIDs.push(e.id);
      }, "newMessage", 150);
    }
    onAudioLevelUpdate(e) {
      this.setState((t2) => {
        let i2 = {};
        e.forEach((s2) => {
          if (!s2.track || !s2.peer) return;
          let o2 = s2.track.trackId;
          i2[o2] = s2.audioLevel, t2.speakers[o2] || (t2.speakers[o2] = { audioLevel: s2.audioLevel, peerID: s2.peer.peerId, trackID: o2 });
        });
        let r2 = Object.entries(t2.speakers);
        for (let [s2, o2] of r2) o2.audioLevel = i2[s2] || 0, o2.audioLevel === 0 && delete t2.speakers[s2];
      }, "audioLevel");
    }
    onConnectionQualityUpdate(e) {
      this.setState((t2) => {
        e.forEach((i2) => {
          let r2 = i2.peerID;
          r2 && (t2.connectionQualities[r2] ? Object.assign(t2.connectionQualities[r2], i2) : t2.connectionQualities[r2] = i2);
        });
      }, "connectionQuality");
    }
    onChangeTrackStateRequest(e) {
      var s2;
      let t2 = this.store.getState(ee((s2 = e.requestedBy) == null ? void 0 : s2.peerId)), i2 = this.getStoreLocalTrackIDfromSDKTrack(e.track), r2 = this.store.getState(Ii(i2));
      if (!r2) return this.logPossibleInconsistency(`Not found track for which track state change was requested, ${e.track}`);
      e.enabled || this.syncRoomState("changeTrackStateRequest"), this.hmsNotifications.sendChangeTrackStateRequest({ requestedBy: t2 || void 0, track: r2, enabled: e.enabled });
    }
    onChangeMultiTrackStateRequest(e) {
      var s2;
      let t2 = this.store.getState(ee((s2 = e.requestedBy) == null ? void 0 : s2.peerId));
      e.enabled || this.syncRoomState("changeMultiTrackStateRequest");
      let i2 = [], r2 = this.store.getState(N2);
      for (let o2 of e.tracks) {
        let n2 = this.getStoreLocalTrackIDfromSDKTrack(o2);
        n2 && r2[n2] && i2.push(r2[n2]);
      }
      this.hmsNotifications.sendChangeMultiTrackStateRequest({ requestedBy: t2 || void 0, tracks: i2, enabled: e.enabled, type: e.type, source: e.source });
    }
    onReconnected() {
      this.syncRoomState("reconnectedSync"), this.hmsNotifications.sendReconnected(), this.setState((e) => {
        e.room.roomState = e.room.isConnected ? "Connected" : "Preview";
      }, "reconnected");
    }
    onReconnecting(e) {
      let t2 = _2.convertException(e);
      b2.e("Reconnection: received error from sdk", t2), this.hmsNotifications.sendReconnecting(t2), this.setState((i2) => {
        i2.room.roomState = "Reconnecting", i2.errors.push(t2);
      }, "reconnecting");
    }
    onError(e) {
      let t2 = _2.convertException(e);
      t2.isTerminal ? (this.leave().then(() => b2.e("error from SDK, left room.")), this.setState((i2) => {
        i2.room.roomState = "Failed", i2.errors.push(t2);
      }, "errorTerminal")) : this.store.getState().errors.length < 50 && this.setState((r2) => {
        r2.errors.push(t2);
      }, "error"), this.syncRoomState("errorSync"), this.hmsNotifications.sendError(t2), b2.e("received error from sdk", t2 instanceof E2 ? `${t2}` : t2);
    }
    handleTrackRemove(e, t2) {
      this.setState((i2) => {
        let r2 = i2.peers[t2.peerId], s2 = i2.tracks, o2 = e.trackId;
        if (r2) if (o2 === r2.audioTrack) delete r2.audioTrack;
        else if (o2 === r2.videoTrack) delete r2.videoTrack;
        else {
          let n2 = r2.auxiliaryTracks.indexOf(o2);
          n2 > -1 && r2.auxiliaryTracks.splice(n2, 1);
        }
        delete s2[o2];
      }, "trackRemoved");
    }
    setEnabledSDKTrack(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getLocalTrack(e);
        i2 ? yield i2.setEnabled(t2) : this.logPossibleInconsistency(`track ${e} not present, unable to enabled/disable`);
      });
    }
    setSDKLocalVideoTrackSettings(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getLocalTrack(e);
        i2 ? yield i2.setSettings(t2) : this.logPossibleInconsistency(`local track ${e} not present, unable to set settings`);
      });
    }
    setSDKLocalAudioTrackSettings(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getLocalTrack(e);
        i2 ? yield i2.setSettings(t2) : this.logPossibleInconsistency(`local track ${e} not present, unable to set settings`);
      });
    }
    getMediaSettings(e) {
      var s2;
      let t2 = this.store.getState(ua), i2 = e.audioTrack, r2 = e.videoTrack;
      return { audioInputDeviceId: (i2 == null ? void 0 : i2.settings.deviceId) || t2.audioInputDeviceId, videoInputDeviceId: (r2 == null ? void 0 : r2.settings.deviceId) || t2.videoInputDeviceId, audioOutputDeviceId: (s2 = this.sdk.getAudioOutput().getDevice()) == null ? void 0 : s2.deviceId, audioMode: (i2 == null ? void 0 : i2.settings.audioMode) || "voice" };
    }
    getPreviewFields(e) {
      var i2, r2;
      if (!e.isInPreview()) return;
      let t2 = _2.convertPeer(e);
      return { localPeer: t2.id, audioTrack: t2.audioTrack, videoTrack: t2.videoTrack, asRole: ((i2 = e.asRole) == null ? void 0 : i2.name) || ((r2 = e.role) == null ? void 0 : r2.name) };
    }
    setTrackVolume(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.getTrackById(t2);
        i2 ? i2 instanceof we ? (yield i2.setVolume(e), this.setState((r2) => {
          let s2 = r2.tracks[t2];
          s2 && s2.type === "audio" && (s2.volume = e);
        }, "trackVolume")) : b2.w(`track ${t2} is not an audio track`) : this.logPossibleInconsistency(`track ${t2} not present, unable to set volume`);
      });
    }
    localAndVideoUnmuting(e) {
      let t2 = this.store.getState(re);
      if ((t2 == null ? void 0 : t2.videoTrack) !== e) return false;
      let i2 = this.store.getState(ha), r2 = this.store.getState(Yr);
      return i2 && !r2;
    }
    logPossibleInconsistency(e) {
      b2.w("possible inconsistency detected - ", e);
    }
    addRemoveVideoPlugin(e, t2, i2) {
      return c2(this, null, function* () {
        if (!e) {
          b2.w("Invalid plugin received in store");
          return;
        }
        let r2 = this.store.getState(Z2);
        if (r2) {
          let s2 = this.getLocalTrack(r2);
          s2 ? (t2 === "add" ? yield s2.addPlugin(e, i2) : t2 === "remove" && (yield s2.removePlugin(e)), this.syncRoomState(`${t2}VideoPlugin`)) : this.logPossibleInconsistency(`track ${r2} not present, unable to ${t2} plugin`);
        }
      });
    }
    addRemoveMediaStreamVideoPlugins(e, t2) {
      return c2(this, null, function* () {
        if (e.length === 0) {
          b2.w("Invalid plugin received in store");
          return;
        }
        let i2 = this.store.getState(Z2);
        if (i2) {
          let r2 = this.getLocalTrack(i2);
          r2 ? (t2 === "add" ? yield r2.addStreamPlugins(e) : t2 === "remove" && (yield r2.removeStreamPlugins(e)), this.syncRoomState(`${t2}MediaStreamPlugin`)) : this.logPossibleInconsistency(`track ${i2} not present, unable to ${t2} plugin`);
        }
      });
    }
    addRemoveAudioPlugin(e, t2) {
      return c2(this, null, function* () {
        try {
          if (!e) {
            b2.w("Invalid plugin received in store");
            return;
          }
          let i2 = this.store.getState(le);
          if (i2) {
            let r2 = this.getLocalTrack(i2);
            r2 ? (t2 === "add" ? yield r2.addPlugin(e) : t2 === "remove" && (yield r2.removePlugin(e)), this.syncRoomState(`${t2}AudioPlugin`)) : this.logPossibleInconsistency(`track ${i2} not present, unable to ${t2} plugin`);
          }
        } catch (i2) {
          console.error(i2);
        }
      });
    }
    onRoleChangeRequest(e) {
      this.setState((t2) => {
        t2.roleChangeRequests.length === 0 && t2.roleChangeRequests.push(_2.convertRoleChangeRequest(e));
      }, "roleChangeRequest");
    }
    removeRoleChangeRequest(e) {
      this.setState((t2) => {
        let i2 = t2.roleChangeRequests.findIndex((r2) => r2.token === e.token);
        i2 !== -1 && t2.roleChangeRequests.splice(i2, 1);
      }, "removeRoleChangeRequest");
    }
    onRoleUpdate() {
      this.syncRoomState("roleUpdate");
    }
    getStoreLocalTrackIDfromSDKTrack(e) {
      return this.store.getState(pa).find((i2) => {
        var r2;
        return ((r2 = this.getTrackById(i2)) == null ? void 0 : r2.trackId) === e.trackId;
      });
    }
    updateMidCallPreviewRoomState(e, t2) {
      t2.isLocal && e === 8 && this.store.getState(ma) && this.setState((i2) => {
        i2.room.roomState = "Connected";
      }, "midCallPreviewCompleted");
    }
    setSessionStoreValueLocally(e, t2 = "setSessionStore") {
      let i2 = Array.isArray(e) ? e : [e];
      this.setState((r2) => {
        i2.forEach((s2) => {
          r2.sessionStore[s2.key] = s2.value;
        });
      }, t2);
    }
    hasActiveElements(e) {
      let t2 = Object.keys(this.store.getState().whiteboards).length > 0, i2 = Object.keys(this.store.getState().polls).length > 0, r2 = Object.keys(this.store.getState().peers).length > 0, s2 = e.getState().remoteTrackStats;
      return r2 && (t2 || i2 || Object.values(s2).some((o2) => o2 && typeof o2.bitrate == "number" && o2.bitrate > 0));
    }
  };
  var Fi = (a10) => U2 ? `${a10} ${document.title}` : a10;
  var Gi = class {
    constructor(e, t2) {
      this.eventBus = e;
      this.listener = t2;
      this.TAG = "[NetworkTestManager]";
      this.controller = new AbortController();
      this.start = (e2) => c2(this, null, function* () {
        var u2;
        if (!e2) return;
        let { url: t3, timeout: i2, scoreMap: r2 } = e2, s2 = this.controller.signal, o2 = Date.now(), n2 = 0, d2 = Q2(i2).then(() => {
          this.controller.abort();
        });
        try {
          let h2 = (u2 = (yield fetch(`${t3}?${Date.now()}`, { signal: s2 })).body) == null ? void 0 : u2.getReader();
          if (!h2) throw Error("unable to process request");
          let T = () => c2(this, null, function* () {
            if (h2) try {
              let g2 = false;
              for (; !g2; ) {
                let { value: f2, done: P2 } = yield h2.read();
                g2 = P2, f2 && (n2 += f2.byteLength, this.sendScore({ scoreMap: r2, downloadedSize: n2, startTime: o2 }));
              }
            } catch (g2) {
              g2.name !== "AbortError" && l2.d(this.TAG, g2);
            }
          });
          return Promise.race([T(), d2]).then(() => {
            this.sendScore({ scoreMap: r2, downloadedSize: n2, startTime: o2, finished: true });
          }).catch((g2) => {
            l2.d(this.TAG, g2), this.updateScoreToListener(0), this.eventBus.analytics.publish(y2.previewNetworkQuality({ error: g2.message }));
          });
        } catch (p2) {
          p2.name !== "AbortError" ? (l2.d(this.TAG, p2), this.updateScoreToListener(0), this.eventBus.analytics.publish(y2.previewNetworkQuality({ error: p2.message }))) : l2.d(this.TAG, p2);
        }
      });
      this.stop = () => {
        this.controller.signal.aborted || this.controller.abort();
      };
      this.sendScore = ({ scoreMap: e2, downloadedSize: t3, startTime: i2, finished: r2 = false }) => {
        let s2 = (Date.now() - i2) / 1e3, n2 = t3 / 1024 / s2 * 8, d2 = -1;
        for (let u2 in e2) {
          let p2 = e2[u2];
          n2 >= p2.low && (!p2.high || n2 <= p2.high) && (d2 = Number(u2));
        }
        this.updateScoreToListener(d2), r2 && this.eventBus.analytics.publish(y2.previewNetworkQuality({ score: d2, downLink: n2.toFixed(2) }));
      };
    }
    updateScoreToListener(e) {
      var t2, i2;
      e !== this.score && (this.score = e, (i2 = (t2 = this.listener) == null ? void 0 : t2.onNetworkQuality) == null || i2.call(t2, e));
    }
  };
  var Bt = class {
    constructor(e, t2, i2, r2, s2, o2) {
      this.store = e;
      this.transport = t2;
      this.deviceManager = i2;
      this.publish = r2;
      this.removeAuxiliaryTrack = s2;
      this.listener = o2;
      this.handleLocalPeerRoleUpdate = (i3) => c2(this, [i3], function* ({ oldRole: e2, newRole: t3 }) {
        var s3;
        let r3 = this.store.getLocalPeer();
        r3 && (yield this.diffRolesAndPublishTracks({ oldRole: e2, newRole: t3 }), (s3 = this.listener) == null || s3.onPeerUpdate(8, r3));
      });
      this.diffRolesAndPublishTracks = (i3) => c2(this, [i3], function* ({ oldRole: e2, newRole: t3 }) {
        var g2, f2, P2, v2, R2, $;
        let r3 = new Set(e2.publishParams.allowed), s3 = new Set(t3.publishParams.allowed), o3 = this.removeTrack(r3, s3, "video"), n2 = this.removeTrack(r3, s3, "audio"), d2 = this.removeTrack(r3, s3, "screen"), u2 = this.hasSimulcastDifference((g2 = e2.publishParams.simulcast) == null ? void 0 : g2.video, (f2 = t3.publishParams.simulcast) == null ? void 0 : f2.video), p2 = this.hasSimulcastDifference((P2 = e2.publishParams.simulcast) == null ? void 0 : P2.screen, (v2 = t3.publishParams.simulcast) == null ? void 0 : v2.screen), h2 = ($ = (R2 = this.store.getLocalPeer()) == null ? void 0 : R2.videoTrack) == null ? void 0 : $.enabled;
        yield this.removeAudioTrack(n2), yield this.removeVideoTracks(o3 || u2), yield this.removeScreenTracks(d2 || p2);
        let T = this.getSettings();
        u2 && (T.isVideoMuted = !h2), yield this.publish(T), yield this.syncDevices(T, t3);
      });
    }
    syncDevices(e, t2) {
      return c2(this, null, function* () {
        (!e.isAudioMuted || !e.isVideoMuted) && t2.publishParams.allowed.length > 0 && (yield this.deviceManager.init(true));
      });
    }
    removeVideoTracks(e) {
      return c2(this, null, function* () {
        var i2;
        if (!e) return;
        let t2 = this.store.getLocalPeer();
        t2 != null && t2.videoTrack && (t2.videoTrack.isPublished ? yield this.transport.unpublish([t2.videoTrack]) : yield t2.videoTrack.cleanup(), (i2 = this.listener) == null || i2.onTrackUpdate(1, t2.videoTrack, t2), t2.videoTrack = void 0), yield this.removeAuxTracks((r2) => r2.source !== "screen" && r2.type === "video");
      });
    }
    removeAudioTrack(e) {
      return c2(this, null, function* () {
        var i2;
        if (!e) return;
        let t2 = this.store.getLocalPeer();
        t2 != null && t2.audioTrack && (t2.audioTrack.isPublished ? yield this.transport.unpublish([t2.audioTrack]) : yield t2.audioTrack.cleanup(), (i2 = this.listener) == null || i2.onTrackUpdate(1, t2.audioTrack, t2), t2.audioTrack = void 0), yield this.removeAuxTracks((r2) => r2.source !== "screen" && r2.type === "audio");
      });
    }
    removeScreenTracks(e) {
      return c2(this, null, function* () {
        e && (yield this.removeAuxTracks((t2) => t2.source === "screen"));
      });
    }
    removeAuxTracks(e) {
      return c2(this, null, function* () {
        let t2 = this.store.getLocalPeer();
        if (t2 != null && t2.auxiliaryTracks) {
          let i2 = [...t2.auxiliaryTracks];
          for (let r2 of i2) e(r2) && (yield this.removeAuxiliaryTrack(r2.trackId));
        }
      });
    }
    removeTrack(e, t2, i2) {
      return e.has(i2) && !t2.has(i2);
    }
    hasSimulcastDifference(e, t2) {
      var i2, r2, s2;
      return !e && !t2 ? false : ((i2 = e == null ? void 0 : e.layers) == null ? void 0 : i2.length) !== ((r2 = t2 == null ? void 0 : t2.layers) == null ? void 0 : r2.length) ? true : !!((s2 = e == null ? void 0 : e.layers) != null && s2.some((o2) => {
        var d2;
        let n2 = (d2 = t2 == null ? void 0 : t2.layers) == null ? void 0 : d2.find((u2) => u2.rid === o2.rid);
        return (n2 == null ? void 0 : n2.maxBitrate) !== o2.maxBitrate || (n2 == null ? void 0 : n2.maxFramerate) !== o2.maxFramerate;
      }));
    }
    getSettings() {
      let { isAudioMuted: e, isVideoMuted: t2 } = this.getMutedStatus(), { audioInputDeviceId: i2, audioOutputDeviceId: r2 } = this.getAudioDeviceSettings(), s2 = this.getVideoInputDeviceId();
      return { isAudioMuted: e, isVideoMuted: t2, audioInputDeviceId: i2, audioOutputDeviceId: r2, videoDeviceId: s2 };
    }
    getMutedStatus() {
      var t2, i2, r2;
      let e = (t2 = this.store.getConfig()) == null ? void 0 : t2.settings;
      return { isAudioMuted: (i2 = e == null ? void 0 : e.isAudioMuted) != null ? i2 : true, isVideoMuted: (r2 = e == null ? void 0 : e.isVideoMuted) != null ? r2 : true };
    }
    getAudioDeviceSettings() {
      var r2, s2, o2;
      let e = (r2 = this.store.getConfig()) == null ? void 0 : r2.settings, t2 = ((s2 = this.deviceManager.currentSelection.audioInput) == null ? void 0 : s2.deviceId) || (e == null ? void 0 : e.audioInputDeviceId) || "default", i2 = ((o2 = this.deviceManager.currentSelection.audioOutput) == null ? void 0 : o2.deviceId) || (e == null ? void 0 : e.audioOutputDeviceId) || "default";
      return { audioInputDeviceId: t2, audioOutputDeviceId: i2 };
    }
    getVideoInputDeviceId() {
      var t2, i2;
      let e = (t2 = this.store.getConfig()) == null ? void 0 : t2.settings;
      return ((i2 = this.deviceManager.currentSelection.videoInput) == null ? void 0 : i2.deviceId) || (e == null ? void 0 : e.videoDeviceId) || "default";
    }
  };
  var os = class {
    constructor() {
      this.TAG = "[HTTPAnalyticsTransport]";
      this.failedEvents = new ve("client-events");
      this.isConnected = true;
      this.env = null;
      this.websocketURL = "";
    }
    setEnv(e) {
      this.env = e, this.flushFailedEvents();
    }
    setWebsocketEndpoint(e) {
      this.websocketURL = e;
    }
    sendEvent(e) {
      if (!this.env) {
        this.addEventToStorage(e);
        return;
      }
      let t2 = { event: e.name, payload: e.properties, event_id: String(e.timestamp), peer: e.metadata.peer, timestamp: e.timestamp, device_id: e.device_id, cluster: { websocket_url: this.websocketURL } }, i2 = this.env === "prod" ? ea : ta;
      fetch(i2, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${e.metadata.token}`, user_agent_v2: e.metadata.userAgent }, body: JSON.stringify(t2) }).then((r2) => {
        if (r2.status === 401) {
          this.removeFromStorage(e);
          return;
        }
        if (r2.status !== 200) throw Error(r2.statusText);
        this.removeFromStorage(e);
      }).catch((r2) => {
        l2.v(this.TAG, "Failed to send event", r2, e), this.addEventToStorage(e);
      });
    }
    flushFailedEvents() {
      let e = this.failedEvents.get();
      e == null || e.forEach((t2) => this.sendEvent(t2));
    }
    addEventToStorage(e) {
      let t2 = this.failedEvents.get() || [];
      t2.find((i2) => i2.timestamp === e.timestamp) || (t2.length === 100 && t2.shift(), t2.push(e), this.failedEvents.set(t2));
    }
    removeFromStorage(e) {
      let t2 = this.failedEvents.get() || [], i2 = t2.findIndex((r2) => r2.timestamp === e.timestamp);
      i2 > -1 && (t2.splice(i2, 1), this.failedEvents.set(t2));
    }
  };
  var He = new os();
  var Vt = class {
    constructor(e) {
      this.type = e.type, this.source = e.source || "regular", this.description = "", e instanceof De ? (this.mute = !e.enabled, this.track_id = e.publishedTrackId, this.stream_id = e.stream.id) : (this.mute = e.mute, this.track_id = e.track_id, this.stream_id = e.stream_id);
    }
  };
  var Ft = class {
    constructor() {
      this.TAG = "[Store]:";
      this.knownRoles = {};
      this.peers = {};
      this.tracks = /* @__PURE__ */ new Map();
      this.peerTrackStates = {};
      this.speakers = [];
      this.roleDetailsArrived = false;
      this.env = "prod";
      this.simulcastEnabled = false;
      this.userAgent = Et(this.env);
      this.polls = /* @__PURE__ */ new Map();
      this.whiteboards = /* @__PURE__ */ new Map();
      this.addPermissionToRole = (e, t2, i2, r2) => {
        var o2;
        if (!this.knownRoles[e]) {
          l2.d(this.TAG, `role ${e} is not present in given roles`, this.knownRoles);
          return;
        }
        let s2 = this.knownRoles[e].permissions;
        t2 === "transcriptions" && r2 ? s2[t2] = M2(m({}, s2[t2]), { [r2]: [i2] }) : t2 === "whiteboard" && (s2[t2] || (s2[t2] = []), (o2 = s2[t2]) == null || o2.push(i2));
      };
      this.addWhiteboardPluginToRole = (e) => {
        var i2, r2, s2;
        let t2 = e == null ? void 0 : e.permissions;
        (i2 = t2 == null ? void 0 : t2.admin) == null || i2.forEach((o2) => this.addPermissionToRole(o2, "whiteboard", "admin")), (r2 = t2 == null ? void 0 : t2.reader) == null || r2.forEach((o2) => this.addPermissionToRole(o2, "whiteboard", "read")), (s2 = t2 == null ? void 0 : t2.writer) == null || s2.forEach((o2) => this.addPermissionToRole(o2, "whiteboard", "write"));
      };
      this.addTranscriptionsPluginToRole = (e = []) => {
        var t2, i2;
        for (let r2 of e) (i2 = (t2 = r2.permissions) == null ? void 0 : t2.admin) == null || i2.forEach((s2) => this.addPermissionToRole(s2, "transcriptions", "admin", r2.mode));
      };
      this.handleNoiseCancellationPlugin = (e) => {
        this.room && (this.room.isNoiseCancellationEnabled = !!(e != null && e.enabled) && !!this.room.isNoiseCancellationEnabled);
      };
    }
    getConfig() {
      return this.config;
    }
    setSimulcastEnabled(e) {
      this.simulcastEnabled = e;
    }
    removeRemoteTracks() {
      this.tracks.forEach((e) => {
        (e instanceof ie || e instanceof O2) && (this.removeTrack(e), delete this.peerTrackStates[e.trackId]);
      });
    }
    getEnv() {
      return this.env;
    }
    getPublishParams() {
      let e = this.getLocalPeer(), t2 = (e == null ? void 0 : e.asRole) || (e == null ? void 0 : e.role);
      return t2 == null ? void 0 : t2.publishParams;
    }
    getRoom() {
      return this.room;
    }
    getPolicyForRole(e) {
      return this.knownRoles[e];
    }
    getKnownRoles() {
      return this.knownRoles;
    }
    getTemplateAppData() {
      return this.templateAppData;
    }
    getLocalPeer() {
      if (this.localPeerId && this.peers[this.localPeerId]) return this.peers[this.localPeerId];
    }
    getRemotePeers() {
      return Object.values(this.peers).filter((e) => !e.isLocal);
    }
    getPeers() {
      return Object.values(this.peers);
    }
    getPeerMap() {
      return this.peers;
    }
    getPeerById(e) {
      if (this.peers[e]) return this.peers[e];
    }
    getTracksMap() {
      return this.tracks;
    }
    getTracks() {
      return Array.from(this.tracks.values());
    }
    getVideoTracks() {
      return this.getTracks().filter((e) => e.type === "video");
    }
    getRemoteVideoTracks() {
      return this.getTracks().filter((e) => e instanceof O2);
    }
    getAudioTracks() {
      return this.getTracks().filter((e) => e.type === "audio");
    }
    getPeerTracks(e) {
      let t2 = e ? this.peers[e] : void 0, i2 = [];
      return t2 != null && t2.videoTrack && i2.push(t2.videoTrack), t2 != null && t2.audioTrack && i2.push(t2.audioTrack), i2.concat((t2 == null ? void 0 : t2.auxiliaryTracks) || []);
    }
    getLocalPeerTracks() {
      return this.getPeerTracks(this.localPeerId);
    }
    hasTrack(e) {
      return this.tracks.has(e);
    }
    getTrackById(e) {
      var r2, s2;
      let t2 = Array.from(this.tracks.values()).find((o2) => o2.trackId === e);
      if (t2) return t2;
      let i2 = this.getLocalPeer();
      if (i2) {
        if ((r2 = i2.audioTrack) != null && r2.isPublishedTrackId(e)) return i2.audioTrack;
        if ((s2 = i2.videoTrack) != null && s2.isPublishedTrackId(e)) return i2.videoTrack;
      }
    }
    getPeerByTrackId(e) {
      let t2 = Array.from(this.tracks.values()).find((i2) => i2.trackId === e);
      return t2 != null && t2.peerId ? this.peers[t2.peerId] : void 0;
    }
    getSpeakers() {
      return this.speakers;
    }
    getSpeakerPeers() {
      return this.speakers.map((e) => e.peer);
    }
    getUserAgent() {
      return this.userAgent;
    }
    createAndSetUserAgent(e) {
      this.userAgent = Et(this.env, e);
    }
    setRoom(e) {
      this.room = e;
    }
    setKnownRoles(e) {
      var i2, r2;
      if (this.knownRoles = e.known_roles, this.addPluginsToRoles(e.plugins), this.roleDetailsArrived = true, this.templateAppData = e.app_data, !this.simulcastEnabled) return;
      let t2 = (i2 = this.knownRoles[e.name]) == null ? void 0 : i2.publishParams;
      this.videoLayers = this.convertSimulcastLayers((r2 = t2.simulcast) == null ? void 0 : r2.video), this.updatePeersPolicy();
    }
    hasRoleDetailsArrived() {
      return this.roleDetailsArrived;
    }
    setConfig(e) {
      var t2, i2, r2;
      if (X2.rememberDevices(!!e.rememberDeviceSelection), e.rememberDeviceSelection) {
        let s2 = X2.getSelection();
        s2 && (e.settings || (e.settings = {}), (t2 = s2.audioInput) != null && t2.deviceId && (e.settings.audioInputDeviceId = e.settings.audioInputDeviceId || s2.audioInput.deviceId), (i2 = s2.audioOutput) != null && i2.deviceId && (e.settings.audioOutputDeviceId = e.settings.audioOutputDeviceId || s2.audioOutput.deviceId), (r2 = s2.videoInput) != null && r2.deviceId && (e.settings.videoDeviceId = e.settings.videoDeviceId || s2.videoInput.deviceId));
      }
      e.autoManageVideo = e.autoManageVideo !== false, e.autoManageWakeLock = e.autoManageWakeLock !== false, this.config = e, this.setEnv();
    }
    addPeer(e) {
      this.peers[e.peerId] = e, e.isLocal && (this.localPeerId = e.peerId);
    }
    addTrack(e) {
      this.tracks.set(e, e);
    }
    getTrackState(e) {
      return this.peerTrackStates[e];
    }
    setTrackState(e) {
      this.peerTrackStates[e.trackInfo.track_id] = e;
    }
    removeTrackState(e) {
      delete this.peerTrackStates[e];
    }
    removePeer(e) {
      this.localPeerId === e && (this.localPeerId = void 0), delete this.peers[e];
    }
    removeTrack(e) {
      this.tracks.delete(e);
    }
    updateSpeakers(e) {
      this.speakers = e;
    }
    updateAudioOutputVolume(e) {
      return c2(this, null, function* () {
        for (let t2 of this.getAudioTracks()) yield t2.setVolume(e);
      });
    }
    updateAudioOutputDevice(e) {
      return c2(this, null, function* () {
        let t2 = [];
        this.getAudioTracks().forEach((i2) => {
          i2 instanceof ie && t2.push(i2.setOutputDevice(e));
        }), yield Promise.all(t2);
      });
    }
    getSimulcastLayers(e) {
      var t2;
      return !this.simulcastEnabled || !["screen", "regular"].includes(e) ? [] : e === "screen" ? [] : ((t2 = this.videoLayers) == null ? void 0 : t2.layers) || [];
    }
    convertSimulcastLayers(e) {
      if (e) return M2(m({}, e), { layers: (e.layers || []).map((t2) => M2(m({}, t2), { maxBitrate: t2.maxBitrate * 1e3 })) });
    }
    getSimulcastDefinitionsForPeer(e, t2) {
      var n2, d2, u2;
      if ([!e || !e.role, t2 === "screen", !this.simulcastEnabled].some((p2) => !!p2)) return [];
      let i2 = this.getPolicyForRole(e.role.name).publishParams, r2, s2, o2;
      return t2 === "regular" ? (r2 = (n2 = i2.simulcast) == null ? void 0 : n2.video, s2 = i2.video.width, o2 = i2.video.height) : t2 === "screen" && (r2 = (d2 = i2.simulcast) == null ? void 0 : d2.screen, s2 = i2.screen.width, o2 = i2.screen.height), ((u2 = r2 == null ? void 0 : r2.layers) == null ? void 0 : u2.map((p2) => {
        let h2 = We[p2.rid], T = { width: Math.floor(s2 / p2.scaleResolutionDownBy), height: Math.floor(o2 / p2.scaleResolutionDownBy) };
        return { layer: h2, resolution: T };
      })) || [];
    }
    setPoll(e) {
      this.polls.set(e.id, e);
    }
    getPoll(e) {
      return this.polls.get(e);
    }
    setWhiteboard(e) {
      this.whiteboards.set(e.id, e);
    }
    getWhiteboards() {
      return this.whiteboards;
    }
    getWhiteboard(e) {
      return e ? this.whiteboards.get(e) : this.whiteboards.values().next().value;
    }
    getErrorListener() {
      return this.errorListener;
    }
    cleanup() {
      let e = this.getTracks();
      for (let t2 of e) t2.cleanup();
      this.room = void 0, this.config = void 0, this.localPeerId = void 0, this.roleDetailsArrived = false;
    }
    setErrorListener(e) {
      this.errorListener = e;
    }
    updatePeersPolicy() {
      this.getPeers().forEach((e) => {
        var t2;
        if (!e.role) {
          (t2 = this.errorListener) == null || t2.onError(S2.GenericErrors.InvalidRole("VALIDATION", ""));
          return;
        }
        e.role = this.getPolicyForRole(e.role.name);
      });
    }
    addPluginsToRoles(e) {
      e && Object.keys(e).forEach((t2) => {
        let i2 = t2;
        switch (i2) {
          case "whiteboard": {
            this.addWhiteboardPluginToRole(e[i2]);
            break;
          }
          case "transcriptions": {
            this.addTranscriptionsPluginToRole(e[i2]);
            break;
          }
          case "noiseCancellation": {
            this.handleNoiseCancellationPlugin(e[i2]);
            break;
          }
          default:
            break;
        }
      });
    }
    setEnv() {
      var r2;
      let t2 = ((r2 = this.config) == null ? void 0 : r2.initEndpoint).split("https://")[1], i2 = "prod";
      t2.startsWith("prod") ? i2 = "prod" : t2.startsWith("qa") ? i2 = "qa" : t2.startsWith("dev") && (i2 = "dev"), this.env = i2, He.setEnv(i2);
    }
  };
  var Wi = class {
    constructor() {
      this.TAG = "[WakeLockManager]";
      this.wakeLock = null;
      this.acquireLock = () => c2(this, null, function* () {
        yield this.requestWakeLock(), document == null || document.addEventListener("visibilitychange", this.visibilityHandler);
      });
      this.cleanup = () => c2(this, null, function* () {
        if (this.wakeLock && !this.wakeLock.released) try {
          yield this.wakeLock.release(), l2.d(this.TAG, "Wake lock released");
        } catch (e) {
          let t2 = e;
          l2.w(this.TAG, "Error while releasing wake lock", `name=${t2.name}, message=${t2.message}`);
        }
        document == null || document.removeEventListener("visibilitychange", this.visibilityHandler), this.wakeLock = null;
      });
      this.visibilityHandler = () => c2(this, null, function* () {
        (document == null ? void 0 : document.visibilityState) === "visible" && (!this.wakeLock || this.wakeLock.released) && (l2.d(this.TAG, "Re-acquiring wake lock due to visibility change"), yield this.requestWakeLock());
      });
      this.requestWakeLock = () => c2(this, null, function* () {
        try {
          if (!("wakeLock" in navigator)) {
            l2.d(this.TAG, "Wake lock feature not supported");
            return;
          }
          this.wakeLock = yield navigator.wakeLock.request("screen"), l2.d(this.TAG, "Wake lock acquired");
        } catch (e) {
          let t2 = e;
          l2.w(this.TAG, "Error acquiring wake lock", `name=${t2.name}, message=${t2.message}`);
        }
      });
    }
  };
  var $i = class {
    constructor(e) {
      this.store = e;
      this.bufferSize = 100;
      this.TAG = "[AnalyticsEventsService]";
      this.transport = null;
      this.pendingEvents = [];
      this.level = 1;
    }
    setTransport(e) {
      this.transport = e;
    }
    reset() {
      this.transport = null, this.pendingEvents = [];
    }
    queue(e) {
      if (e.level >= this.level && (this.pendingEvents.push(e), this.pendingEvents.length > this.bufferSize)) {
        let t2 = this.pendingEvents.shift();
        l2.d(this.TAG, "Max buffer size reached", "Removed event to accommodate new events", t2);
      }
      return this;
    }
    flushFailedClientEvents() {
      He.flushFailedEvents();
    }
    flush() {
      var e;
      try {
        for (; this.pendingEvents.length > 0; ) {
          let t2 = this.pendingEvents.shift();
          t2 && (t2.metadata.peer.peer_id = (e = this.store.getLocalPeer()) == null ? void 0 : e.peerId, t2.metadata.userAgent = this.store.getUserAgent(), this.transport && this.transport.transportProvider.isConnected ? this.transport.sendEvent(t2) : this.sendClientEventOnHTTP(t2));
        }
      } catch (t2) {
        l2.w(this.TAG, "Flush Failed", t2);
      }
    }
    sendClientEventOnHTTP(e) {
      var r2, s2, o2, n2;
      let t2 = this.store.getRoom(), i2 = this.store.getLocalPeer();
      e.metadata.token = (r2 = this.store.getConfig()) == null ? void 0 : r2.authToken, e.metadata.peer = { session_id: t2 == null ? void 0 : t2.sessionId, room_id: t2 == null ? void 0 : t2.id, room_name: t2 == null ? void 0 : t2.name, template_id: t2 == null ? void 0 : t2.templateId, joined_at: (s2 = t2 == null ? void 0 : t2.joinedAt) == null ? void 0 : s2.getTime(), session_started_at: (o2 = t2 == null ? void 0 : t2.startedAt) == null ? void 0 : o2.getTime(), role: (n2 = i2 == null ? void 0 : i2.role) == null ? void 0 : n2.name, user_name: i2 == null ? void 0 : i2.name, user_data: i2 == null ? void 0 : i2.metadata, peer_id: i2 == null ? void 0 : i2.peerId }, He.sendEvent(e);
    }
  };
  var Qa = { autoplayFailed: void 0, initialized: false, autoplayCheckPromise: void 0 };
  var Gt = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.deviceManager = t2;
      this.eventBus = i2;
      this.autoPausedTracks = /* @__PURE__ */ new Set();
      this.TAG = "[AudioSinkManager]:";
      this.volume = 100;
      this.state = m({}, Qa);
      this.handleAudioPaused = (e2) => c2(this, null, function* () {
        l2.d(this.TAG, "Audio Paused", e2.target.id);
        let t3 = this.store.getTrackById(e2.target.id);
        t3 && this.autoPausedTracks.add(t3);
      });
      this.handleTrackUpdate = ({ track: e2 }) => {
        l2.d(this.TAG, "Track updated", `${e2}`);
      };
      this.handleTrackAdd = (r2) => c2(this, [r2], function* ({ track: e2, peer: t3, callListener: i3 = true }) {
        var o2, n2;
        let s2 = document.createElement("audio");
        s2.style.display = "none", s2.id = e2.trackId, s2.addEventListener("pause", this.handleAudioPaused), s2.onerror = () => c2(this, null, function* () {
          var u2, p2;
          l2.e(this.TAG, "error on audio element", s2.error);
          let d2 = S2.TracksErrors.AudioPlaybackError(`Audio playback error for track - ${e2.trackId} code - ${(u2 = s2 == null ? void 0 : s2.error) == null ? void 0 : u2.code}`);
          this.eventBus.analytics.publish(y2.audioPlaybackError(d2)), ((p2 = s2 == null ? void 0 : s2.error) == null ? void 0 : p2.code) === MediaError.MEDIA_ERR_DECODE && (this.removeAudioElement(s2, e2), yield Q2(500), yield this.handleTrackAdd({ track: e2, peer: t3, callListener: false }), this.state.autoplayFailed || this.eventBus.analytics.publish(y2.audioRecovered("Audio recovered after media decode error")));
        }), e2.setAudioElement(s2), yield e2.setVolume(this.volume), l2.d(this.TAG, "Audio track added", `${e2}`), this.init(), (o2 = this.audioSink) == null || o2.append(s2), this.outputDevice && (yield e2.setOutputDevice(this.outputDevice)), s2.srcObject = new MediaStream([e2.nativeTrack]), i3 && ((n2 = this.listener) == null || n2.onTrackUpdate(0, e2, t3)), yield this.handleAutoplayError(e2);
      });
      this.handleAutoplayError = (e2) => c2(this, null, function* () {
        if (this.state.autoplayFailed === void 0 && (this.state.autoplayCheckPromise || (this.state.autoplayCheckPromise = new Promise((t3) => {
          this.playAudioFor(e2).then(t3);
        })), yield this.state.autoplayCheckPromise), this.state.autoplayFailed) {
          this.autoPausedTracks.add(e2);
          return;
        }
        yield this.playAudioFor(e2);
      });
      this.handleAudioDeviceChange = (e2) => c2(this, null, function* () {
        e2.isUserSelection || e2.error || !e2.selection || e2.type === "video" || (yield this.unpauseAudioTracks());
      });
      this.handleTrackRemove = (e2) => {
        this.autoPausedTracks.delete(e2);
        let t3 = document.getElementById(e2.trackId);
        t3 && this.removeAudioElement(t3, e2), this.audioSink && this.audioSink.childElementCount === 0 && (this.state.autoplayCheckPromise = void 0, this.state.autoplayFailed = void 0), l2.d(this.TAG, "Audio track removed", `${e2}`);
      };
      this.unpauseAudioTracks = () => c2(this, null, function* () {
        let e2 = [];
        this.autoPausedTracks.forEach((t3) => {
          e2.push(this.playAudioFor(t3));
        }), yield Promise.all(e2);
      });
      this.removeAudioElement = (e2, t3) => {
        e2 && (l2.d(this.TAG, "removing audio element", `${t3}`), e2.removeEventListener("pause", this.handleAudioPaused), e2.srcObject = null, e2.remove(), t3.setAudioElement(null));
      };
      this.eventBus.audioTrackAdded.subscribe(this.handleTrackAdd), this.eventBus.audioTrackRemoved.subscribe(this.handleTrackRemove), this.eventBus.audioTrackUpdate.subscribe(this.handleTrackUpdate), this.eventBus.deviceChange.subscribe(this.handleAudioDeviceChange), this.eventBus.localVideoUnmutedNatively.subscribe(this.unpauseAudioTracks), this.eventBus.localAudioUnmutedNatively.subscribe(this.unpauseAudioTracks);
    }
    setListener(e) {
      this.listener = e;
    }
    get outputDevice() {
      return this.deviceManager.outputDevice;
    }
    getVolume() {
      return this.volume;
    }
    setVolume(e) {
      return c2(this, null, function* () {
        yield this.store.updateAudioOutputVolume(e), this.volume = e;
      });
    }
    unblockAutoplay() {
      return c2(this, null, function* () {
        this.autoPausedTracks.size > 0 && (yield this.unpauseAudioTracks()), yield ce.resumeContext();
      });
    }
    init(e) {
      if (this.state.initialized || this.audioSink) return;
      this.state.initialized = true;
      let t2 = document.createElement("div");
      t2.id = `HMS-SDK-audio-sink-${v4_default()}`, (e && document.getElementById(e) || document.body).append(t2), this.audioSink = t2, l2.d(this.TAG, "audio sink created", this.audioSink);
    }
    cleanup() {
      var e;
      (e = this.audioSink) == null || e.remove(), this.audioSink = void 0, this.eventBus.audioTrackAdded.unsubscribe(this.handleTrackAdd), this.eventBus.audioTrackRemoved.unsubscribe(this.handleTrackRemove), this.eventBus.audioTrackUpdate.unsubscribe(this.handleTrackUpdate), this.eventBus.deviceChange.unsubscribe(this.handleAudioDeviceChange), this.eventBus.localVideoUnmutedNatively.unsubscribe(this.unpauseAudioTracks), this.eventBus.localAudioUnmutedNatively.unsubscribe(this.unpauseAudioTracks), this.autoPausedTracks = /* @__PURE__ */ new Set(), this.state = m({}, Qa);
    }
    playAudioFor(e) {
      return c2(this, null, function* () {
        let t2 = e.getAudioElement();
        if (!t2) {
          l2.w(this.TAG, "No audio element found on track", e.trackId);
          return;
        }
        try {
          yield t2.play(), this.state.autoplayFailed = false, this.autoPausedTracks.delete(e), l2.d(this.TAG, "Played track", `${e}`);
        } catch (i2) {
          this.autoPausedTracks.add(e), l2.w(this.TAG, "Failed to play track", `${e}`, i2);
          let r2 = i2;
          if (!this.state.autoplayFailed && r2.name === "NotAllowedError") {
            this.state.autoplayFailed = true;
            let s2 = S2.TracksErrors.AutoplayBlocked("AUTOPLAY", "");
            s2.addNativeError(r2), this.eventBus.analytics.publish(y2.autoplayError()), this.eventBus.autoplayError.publish(s2);
          }
        }
      });
    }
  };
  var Ki = class {
    constructor(e) {
      this.eventBus = e;
      this.pluginUsage = /* @__PURE__ */ new Map();
      this.pluginLastAddedAt = /* @__PURE__ */ new Map();
      this.getPluginUsage = (e2) => {
        if (this.pluginUsage.has(e2) || this.pluginUsage.set(e2, 0), this.pluginLastAddedAt.has(e2)) {
          let i2 = this.pluginLastAddedAt.get(e2) || 0, r2 = i2 ? Date.now() - i2 : 0;
          this.pluginUsage.set(e2, (this.pluginUsage.get(e2) || 0) + r2), this.pluginLastAddedAt.delete(e2);
        }
        return this.pluginUsage.get(e2);
      };
      this.updatePluginUsageData = (e2) => {
        var i2;
        let t2 = ((i2 = e2.properties) == null ? void 0 : i2.plugin_name) || "";
        switch (e2.name) {
          case "mediaPlugin.toggled.on":
          case "mediaPlugin.added": {
            let r2 = e2.properties.added_at || Date.now();
            this.pluginLastAddedAt.set(t2, r2);
            break;
          }
          case "mediaPlugin.toggled.off":
          case "mediaPlugin.stats": {
            if (this.pluginLastAddedAt.has(t2)) {
              let r2 = e2.properties.duration || (Date.now() - (this.pluginLastAddedAt.get(t2) || 0)) / 1e3;
              this.pluginUsage.set(t2, (this.pluginUsage.get(t2) || 0) + Math.max(r2, 0) * 1e3), this.pluginLastAddedAt.delete(t2);
            }
            break;
          }
          default:
        }
      };
      this.cleanup = () => {
        this.pluginLastAddedAt.clear(), this.pluginUsage.clear();
      };
      this.eventBus.analytics.subscribe((t2) => this.updatePluginUsageData(t2));
    }
  };
  var Wt = class {
    constructor(e, t2) {
      this.store = e;
      this.eventBus = t2;
      this.audioInput = [];
      this.audioOutput = [];
      this.videoInput = [];
      this.hasWebcamPermission = false;
      this.hasMicrophonePermission = false;
      this.currentSelection = { audioInput: void 0, videoInput: void 0, audioOutput: void 0 };
      this.TAG = "[Device Manager]:";
      this.initialized = false;
      this.videoInputChanged = false;
      this.audioInputChanged = false;
      this.earpieceSelected = false;
      this.timer = null;
      this.updateOutputDevice = (e2, t3) => c2(this, null, function* () {
        let i3 = this.audioOutput.find((r2) => r2.deviceId === e2);
        return i3 && (this.outputDevice = i3, yield this.store.updateAudioOutputDevice(i3), this.eventBus.analytics.publish(y2.deviceChange({ isUserSelection: t3, selection: { audioOutput: i3 }, devices: this.getDevices(), type: "audioOutput" })), X2.updateSelection("audioOutput", { deviceId: i3.deviceId, groupId: i3.groupId })), i3;
      });
      this.getCurrentSelection = () => {
        var o2, n2;
        let e2 = this.store.getLocalPeer(), t3 = this.createIdentifier((o2 = e2 == null ? void 0 : e2.audioTrack) == null ? void 0 : o2.getMediaTrackSettings()), i3 = this.createIdentifier((n2 = e2 == null ? void 0 : e2.videoTrack) == null ? void 0 : n2.getMediaTrackSettings()), r2 = this.audioInput.find((d2) => this.createIdentifier(d2) === t3), s2 = this.videoInput.find((d2) => this.createIdentifier(d2) === i3);
        return { audioInput: r2, videoInput: s2, audioOutput: this.outputDevice };
      };
      this.computeChange = (e2, t3) => e2.length !== t3.length ? true : t3.some((i3) => !e2.includes(this.createIdentifier(i3)));
      this.enumerateDevices = () => c2(this, null, function* () {
        try {
          let e2 = yield navigator.mediaDevices.enumerateDevices(), t3 = this.videoInput.map(this.createIdentifier), i3 = this.audioInput.map(this.createIdentifier);
          this.audioInput = [], this.audioOutput = [], this.videoInput = [], e2.forEach((r2) => {
            r2.kind === "audioinput" && r2.label ? (this.hasMicrophonePermission = true, this.audioInput.push(r2)) : r2.kind === "audiooutput" ? this.audioOutput.push(r2) : r2.kind === "videoinput" && r2.label && (this.hasWebcamPermission = true, this.videoInput.push(r2));
          }), this.videoInputChanged = this.computeChange(t3, this.videoInput), this.audioInputChanged = this.computeChange(i3, this.audioInput), X2.setDevices({ videoInput: [...this.videoInput], audioInput: [...this.audioInput], audioOutput: [...this.audioOutput] }), this.logDevices("Enumerate Devices");
        } catch (e2) {
          l2.e(this.TAG, "Failed enumerating devices", e2);
        }
      });
      this.updateToActualDefaultDevice = () => c2(this, null, function* () {
        var r2, s2, o2, n2, d2;
        let e2 = this.store.getLocalPeer();
        if (!((s2 = (r2 = this.store.getConfig()) == null ? void 0 : r2.settings) == null ? void 0 : s2.videoDeviceId) && (e2 != null && e2.videoTrack) && (yield e2.videoTrack.setSettings({ deviceId: (o2 = this.videoInput[0]) == null ? void 0 : o2.deviceId }, true)), !((d2 = (n2 = this.store.getConfig()) == null ? void 0 : n2.settings) == null ? void 0 : d2.audioInputDeviceId) && (e2 != null && e2.audioTrack)) {
          let u2 = () => {
            var T;
            let h2 = this.audioInput.find((g2) => !g2.label.toLowerCase().includes("iphone"));
            return Hs() && h2 ? h2 == null ? void 0 : h2.deviceId : (T = this.getNewAudioInputDevice()) == null ? void 0 : T.deviceId;
          };
          u2() && (yield e2.audioTrack.setSettings({ deviceId: u2() }, true));
        }
      });
      this.handleDeviceChange = gi(() => c2(this, null, function* () {
        yield this.enumerateDevices(), this.logDevices("After Device Change");
        let e2 = this.store.getLocalPeer();
        yield this.setOutputDevice(true), yield this.handleAudioInputDeviceChange(e2 == null ? void 0 : e2.audioTrack), yield this.handleVideoInputDeviceChange(e2 == null ? void 0 : e2.videoTrack), this.eventBus.analytics.publish(y2.deviceChange({ selection: this.getCurrentSelection(), type: "change", devices: this.getDevices() }));
      }), 500).bind(this);
      this.handleAudioInputDeviceChange = (e2) => c2(this, null, function* () {
        if (!e2) {
          l2.d(this.TAG, "No Audio track on local peer");
          return;
        }
        if (!this.audioInputChanged) {
          l2.d(this.TAG, "No Change in AudioInput Device");
          return;
        }
        let t3 = this.getNewAudioInputDevice();
        if (!t3 || !t3.deviceId) {
          this.eventBus.analytics.publish(y2.deviceChange({ selection: { audioInput: t3 }, error: S2.TracksErrors.SelectedDeviceMissing("audio"), devices: this.getDevices(), type: "audioInput" })), l2.e(this.TAG, "Audio device not found");
          return;
        }
        let { settings: i3 } = e2, r2 = new J().codec(i3.codec).maxBitrate(i3.maxBitrate).deviceId(t3.deviceId).audioMode(i3.audioMode).build();
        try {
          yield e2.setSettings(r2, true), this.eventBus.deviceChange.publish({ devices: this.getDevices(), selection: t3, type: "audioInput" }), this.logDevices("Audio Device Change Success");
        } catch (s2) {
          l2.e(this.TAG, "[Audio Device Change]", s2), this.eventBus.analytics.publish(y2.deviceChange({ selection: { audioInput: t3 }, devices: this.getDevices(), type: "audioInput", error: s2 })), this.eventBus.deviceChange.publish({ error: s2, selection: t3, type: "audioInput", devices: this.getDevices() });
        }
      });
      this.handleVideoInputDeviceChange = (e2) => c2(this, null, function* () {
        if (!e2) {
          l2.d(this.TAG, "No video track on local peer");
          return;
        }
        if (!this.videoInputChanged) {
          l2.d(this.TAG, "No Change in VideoInput Device");
          return;
        }
        let t3 = this.videoInput[0];
        if (!t3 || !t3.deviceId) {
          this.eventBus.analytics.publish(y2.deviceChange({ selection: { videoInput: t3 }, error: S2.TracksErrors.SelectedDeviceMissing("video"), devices: this.getDevices(), type: "video" })), l2.e(this.TAG, "Video device not found");
          return;
        }
        let { settings: i3 } = e2, r2 = new q2().codec(i3.codec).maxBitrate(i3.maxBitrate).maxFramerate(i3.maxFramerate).setWidth(i3.width).setHeight(i3.height).deviceId(t3.deviceId).build();
        try {
          yield e2.setSettings(r2, true), this.eventBus.deviceChange.publish({ devices: this.getDevices(), selection: t3, type: "video" }), this.logDevices("Video Device Change Success");
        } catch (s2) {
          l2.e(this.TAG, "[Video Device Change]", s2), this.eventBus.analytics.publish(y2.deviceChange({ selection: { videoInput: t3 }, devices: this.getDevices(), type: "video", error: s2 })), this.eventBus.deviceChange.publish({ error: s2, type: "video", selection: t3, devices: this.getDevices() });
        }
      });
      this.startPollingForDevices = () => c2(this, null, function* () {
        let { earpiece: e2 } = this.categorizeAudioInputDevices();
        e2 && (this.timer = setTimeout(() => {
          c2(this, null, function* () {
            yield this.enumerateDevices(), yield this.autoSelectAudioOutput(), this.startPollingForDevices();
          });
        }, 5e3));
      });
      this.autoSelectAudioOutput = (e2) => c2(this, null, function* () {
        var u2, p2;
        let { bluetoothDevice: t3, earpiece: i3, speakerPhone: r2, wired: s2 } = this.categorizeAudioInputDevices(), o2 = (u2 = this.store.getLocalPeer()) == null ? void 0 : u2.audioTrack;
        if (!o2 || !i3) return;
        let n2 = this.getManuallySelectedAudioDevice(), d2 = (n2 == null ? void 0 : n2.deviceId) || (t3 == null ? void 0 : t3.deviceId) || (s2 == null ? void 0 : s2.deviceId) || (r2 == null ? void 0 : r2.deviceId);
        if (!(!e2 && o2.settings.deviceId === d2 && this.earpieceSelected)) try {
          (!this.earpieceSelected || e2) && ((t3 == null ? void 0 : t3.deviceId) === d2 ? this.earpieceSelected = true : (l2.d(this.TAG, "selecting earpiece"), yield o2.setSettings({ deviceId: i3 == null ? void 0 : i3.deviceId }, true), e2 && (yield Q2(e2)), this.earpieceSelected = true)), yield o2.setSettings({ deviceId: d2 }, true);
          let h2 = (p2 = this.audioInput.find((T) => T.deviceId === d2)) == null ? void 0 : p2.groupId;
          this.eventBus.deviceChange.publish({ isUserSelection: false, type: "audioInput", selection: { deviceId: d2, groupId: h2 }, devices: this.getDevices(), internal: true });
        } catch (h2) {
          this.eventBus.error.publish(h2);
        }
      });
      let i2 = ({ enabled: r2, track: s2 }) => r2 && s2.source === "regular";
      this.eventBus.localVideoEnabled.waitFor(i2).then(() => {
        this.videoInput.length === 0 && this.init(true);
      }), this.eventBus.localAudioEnabled.waitFor(i2).then(() => {
        this.audioInput.length === 0 && this.init(true);
      }), this.eventBus.deviceChange.subscribe(({ type: r2, isUserSelection: s2, selection: o2 }) => {
        if (s2) {
          let n2 = r2 === "video" ? "videoInput" : r2, d2 = this[n2].find((u2) => this.createIdentifier(u2) === this.createIdentifier(o2));
          this.eventBus.analytics.publish(y2.deviceChange({ selection: { [n2]: d2 }, devices: this.getDevices(), type: r2, isUserSelection: s2 }));
        }
      });
    }
    init(e = false, t2 = true) {
      return c2(this, null, function* () {
        this.initialized && !e || (!this.initialized && navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange), this.initialized = true, yield this.enumerateDevices(), e || (yield this.updateToActualDefaultDevice(), this.startPollingForDevices()), yield this.autoSelectAudioOutput(), this.logDevices("Init"), yield this.setOutputDevice(), this.eventBus.deviceChange.publish({ devices: this.getDevices() }), t2 && this.eventBus.analytics.publish(y2.deviceChange({ selection: this.getCurrentSelection(), type: "list", devices: this.getDevices() })));
      });
    }
    getDevices() {
      return { audioInput: this.audioInput, audioOutput: this.audioOutput, videoInput: this.videoInput };
    }
    cleanup() {
      this.timer && (clearTimeout(this.timer), this.timer = null), this.initialized = false, this.earpieceSelected = false, this.audioInput = [], this.audioOutput = [], this.videoInput = [], this.outputDevice = void 0, navigator.mediaDevices.removeEventListener("devicechange", this.handleDeviceChange);
    }
    createIdentifier(e) {
      return e ? `${e.deviceId}${e.groupId}` : "";
    }
    getNewAudioInputDevice() {
      var i2, r2;
      let e = this.getManuallySelectedAudioDevice();
      if (e) return e;
      (r2 = (i2 = this.store.getLocalPeer()) == null ? void 0 : i2.audioTrack) == null || r2.resetManuallySelectedDeviceId();
      let t2 = this.audioInput.find((s2) => s2.deviceId === "default");
      return t2 ? this.audioInput.find((o2) => o2.deviceId !== "default" && t2.label.includes(o2.label)) : this.audioInput[0];
    }
    setOutputDevice(e = false) {
      return c2(this, null, function* () {
        let t2 = this.getNewAudioInputDevice(), i2 = this.createIdentifier(this.outputDevice);
        this.outputDevice = this.getAudioOutputDeviceMatchingInput(t2), this.outputDevice || (this.outputDevice = this.audioOutput.find((r2) => this.createIdentifier(r2) === i2), this.outputDevice || (this.outputDevice = this.audioOutput.find((r2) => r2.deviceId === "default") || this.audioOutput[0])), yield this.store.updateAudioOutputDevice(this.outputDevice), e && i2 !== this.createIdentifier(this.outputDevice) && (this.eventBus.analytics.publish(y2.deviceChange({ selection: { audioOutput: this.outputDevice }, devices: this.getDevices(), type: "audioOutput" })), this.eventBus.deviceChange.publish({ selection: this.outputDevice, type: "audioOutput", devices: this.getDevices() }));
      });
    }
    getManuallySelectedAudioDevice() {
      let e = this.store.getLocalPeer(), t2 = e == null ? void 0 : e.audioTrack;
      return this.audioInput.find((i2) => i2.deviceId === (t2 == null ? void 0 : t2.getManuallySelectedDeviceId()));
    }
    categorizeAudioInputDevices() {
      let e = null, t2 = null, i2 = null, r2 = null;
      for (let s2 of this.audioInput) {
        let o2 = Nr(s2.label);
        o2 === "SPEAKERPHONE" ? t2 = s2 : o2 === "WIRED" ? i2 = s2 : o2 === "BLUETOOTH" ? e = s2 : o2 === "EARPIECE" && (r2 = s2);
      }
      return { bluetoothDevice: e, speakerPhone: t2, wired: i2, earpiece: r2 };
    }
    getAudioOutputDeviceMatchingInput(e) {
      var o2, n2;
      let t2 = ((n2 = (o2 = this.store.getConfig()) == null ? void 0 : o2.settings) == null ? void 0 : n2.speakerAutoSelectionBlacklist) || [];
      if (t2 === "all" || !e) return;
      let i2 = e.label.toLowerCase() || "";
      if (t2.some((d2) => i2.includes(d2.toLowerCase()))) return;
      let r2 = this.audioOutput.find((d2) => e.deviceId !== "default" && d2.label === e.label);
      if (r2) return r2;
      let s2 = this.audioOutput.find((d2) => d2.groupId === e.groupId);
      if (s2 && this.audioOutput[0].deviceId === "default" && s2.groupId === this.audioOutput[0].groupId) return s2;
    }
    logDevices(e = "") {
      l2.d(this.TAG, e, JSON.stringify({ videoInput: [...this.videoInput], audioInput: [...this.audioInput], audioOutput: [...this.audioOutput], selected: this.getCurrentSelection() }, null, 4));
    }
  };
  var qi = class {
    constructor(e, t2) {
      this.deviceManager = e;
      this.audioSinkManager = t2;
    }
    getVolume() {
      return this.audioSinkManager.getVolume();
    }
    setVolume(e) {
      if (e < 0 || e > 100) throw Error("Please pass a valid number between 0-100");
      this.audioSinkManager.setVolume(e);
    }
    getDevice() {
      return this.deviceManager.outputDevice;
    }
    setDevice(e) {
      return this.deviceManager.updateOutputDevice(e, true);
    }
    unblockAutoplay() {
      return c2(this, null, function* () {
        yield this.audioSinkManager.unblockAutoplay(), yield ce.resumeContext();
      });
    }
  };
  var $t = class {
    static handleError(e) {
      if (e.status === 404) throw S2.APIErrors.EndpointUnreachable("FEEDBACK", e.statusText);
      if (e.status >= 400) throw S2.APIErrors.ServerErrors(e.status, "FEEDBACK", e == null ? void 0 : e.statusText);
    }
    static sendFeedback(s2) {
      return c2(this, arguments, function* ({ token: e, eventEndpoint: t2 = "https://event.100ms.live", info: i2, feedback: r2 }) {
        l2.d(this.TAG, `sendFeedback: feedbackEndpoint=${t2} peerId=${i2.peer.peer_id} session=${i2.peer.session_id} `);
        let o2 = new URL("v2/client/feedback", t2), n2 = M2(m({}, i2), { payload: r2 });
        try {
          let d2 = yield fetch(o2, { headers: { Authorization: `Bearer ${e}` }, body: JSON.stringify(n2), method: "POST" });
          try {
            this.handleError(d2);
            return;
          } catch (u2) {
            throw l2.e(this.TAG, "error", u2.message, d2.status), u2 instanceof E2 ? u2 : S2.APIErrors.ServerErrors(d2.status, "FEEDBACK", u2.message);
          }
        } catch (d2) {
          let u2 = d2;
          throw ["Failed to fetch", "NetworkError", "ECONNRESET"].some((p2) => u2.message.includes(p2)) ? S2.APIErrors.EndpointUnreachable("FEEDBACK", u2.message) : u2;
        }
      });
    }
  };
  $t.TAG = "[FeedbackService]";
  var x2 = class {
    constructor(e, t2) {
      this.eventName = e;
      this.eventEmitter = t2;
      this.publish = (e2) => {
        this.eventEmitter.emit(this.eventName, e2);
      };
      this.subscribe = (e2) => {
        this.eventEmitter.on(this.eventName, e2);
      };
      this.subscribeOnce = (e2) => {
        this.eventEmitter.once(this.eventName, e2);
      };
      this.unsubscribe = (e2) => {
        this.eventEmitter.off(this.eventName, e2);
      };
      this.waitFor = (e2) => this.eventEmitter.waitFor(this.eventName, { filter: e2 });
      this.removeAllListeners = () => {
        this.eventEmitter.removeAllListeners(this.eventName);
      };
    }
  };
  var Kt = class {
    constructor() {
      this.eventEmitter = new import_eventemitter23.EventEmitter2();
      this.analytics = new x2(V.ANALYTICS, this.eventEmitter);
      this.deviceChange = new x2(V.DEVICE_CHANGE, this.eventEmitter);
      this.localAudioEnabled = new x2(V.LOCAL_AUDIO_ENABLED, this.eventEmitter);
      this.localVideoEnabled = new x2(V.LOCAL_VIDEO_ENABLED, this.eventEmitter);
      this.localVideoUnmutedNatively = new x2(V.LOCAL_VIDEO_UNMUTED_NATIVELY, this.eventEmitter);
      this.localAudioUnmutedNatively = new x2(V.LOCAL_AUDIO_UNMUTED_NATIVELY, this.eventEmitter);
      this.statsUpdate = new x2(V.STATS_UPDATE, this.eventEmitter);
      this.trackDegraded = new x2(V.TRACK_DEGRADED, this.eventEmitter);
      this.trackRestored = new x2(V.TRACK_RESTORED, this.eventEmitter);
      this.trackAudioLevelUpdate = new x2(V.TRACK_AUDIO_LEVEL_UPDATE, this.eventEmitter);
      this.audioPluginFailed = new x2(V.AUDIO_PLUGIN_FAILED, this.eventEmitter);
      this.localAudioSilence = new x2(V.LOCAL_AUDIO_SILENCE, this.eventEmitter);
      this.policyChange = new x2(V.POLICY_CHANGE, this.eventEmitter);
      this.localRoleUpdate = new x2(V.LOCAL_ROLE_UPDATE, this.eventEmitter);
      this.audioTrackUpdate = new x2(V.AUDIO_TRACK_UPDATE, this.eventEmitter);
      this.audioTrackAdded = new x2(V.AUDIO_TRACK_ADDED, this.eventEmitter);
      this.audioTrackRemoved = new x2(V.AUDIO_TRACK_REMOVED, this.eventEmitter);
      this.autoplayError = new x2(V.AUTOPLAY_ERROR, this.eventEmitter);
      this.leave = new x2(V.LEAVE, this.eventEmitter);
      this.error = new x2(V.ERROR, this.eventEmitter);
    }
  };
  var ji = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.listener = t2;
      this.audioListener = i2;
    }
    handleActiveSpeakers(e) {
      var s2, o2, n2;
      let t2 = e["speaker-list"], i2 = t2.map((d2) => ({ audioLevel: d2.level, peer: this.store.getPeerById(d2.peer_id), track: this.store.getTrackById(d2.track_id) }));
      (s2 = this.audioListener) == null || s2.onAudioLevelUpdate(i2), this.store.updateSpeakers(i2);
      let r2 = t2[0];
      if (r2) {
        let d2 = this.store.getPeerById(r2.peer_id);
        (o2 = this.listener) == null || o2.onPeerUpdate(4, d2);
      } else (n2 = this.listener) == null || n2.onPeerUpdate(5, null);
    }
  };
  var Ji = class {
    constructor(e) {
      this.listener = e;
      this.TAG = "[BroadcastManager]";
    }
    handleNotification(e, t2) {
      e === "on-broadcast" && this.handleBroadcast(t2);
    }
    handleBroadcast(e) {
      var t2, i2;
      l2.d(this.TAG, `Received Message from sender=${(t2 = e == null ? void 0 : e.peer) == null ? void 0 : t2.peer_id}: ${e}`), (i2 = this.listener) == null || i2.onMessageReceived(e);
    }
  };
  var Qi = class {
    constructor(e, t2) {
      this.store = e;
      this.listener = t2;
    }
    handleQualityUpdate(e) {
      var r2;
      let i2 = e.peers.map((s2) => {
        let o2 = this.store.getPeerById(s2.peer_id);
        return o2 && o2.updateNetworkQuality(s2.downlink_score), { peerID: s2.peer_id, downlinkQuality: s2.downlink_score };
      });
      (r2 = this.listener) == null || r2.onConnectionQualityUpdate(i2);
    }
  };
  var lt = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.eventBus = t2;
      this.listener = i2;
      this.TAG = "[TrackManager]";
      this.tracksToProcess = /* @__PURE__ */ new Map();
      this.handleTrackAdd = (e2) => {
        l2.d(this.TAG, "ONTRACKADD", `${e2}`), this.tracksToProcess.set(e2.trackId, e2), this.processPendingTracks();
      };
      this.handleTrackRemovedPermanently = (e2) => {
        l2.d(this.TAG, "ONTRACKREMOVE permanently", e2), Object.keys(e2.tracks).forEach((i3) => {
          var n2;
          let r2 = this.store.getTrackState(i3);
          if (!r2) return;
          let s2 = this.store.getTrackById(i3);
          if (!s2) {
            l2.d(this.TAG, "Track not found in store");
            return;
          }
          s2.type === "audio" && this.eventBus.audioTrackRemoved.publish(s2), this.store.removeTrack(s2);
          let o2 = this.store.getPeerById(r2.peerId);
          o2 && (this.removePeerTracks(o2, s2), (n2 = this.listener) == null || n2.onTrackUpdate(1, s2, o2));
        });
      };
      this.handleTrackLayerUpdate = (e2) => {
        for (let t3 in e2.tracks) {
          let i3 = e2.tracks[t3], r2 = this.store.getTrackById(t3);
          !r2 || !this.store.getPeerByTrackId(t3) || r2 instanceof O2 && this.setLayer(r2, i3);
        }
      };
      this.handleTrackUpdate = (e2, t3 = true) => {
        var s2, o2;
        let i3 = this.store.getPeerById(e2.peer.peer_id), r2 = e2.peer;
        if (!i3 && !r2) {
          l2.d(this.TAG, "Track Update ignored - Peer not added to store");
          return;
        }
        i3 || (i3 = ke(r2, this.store), this.store.addPeer(i3));
        for (let n2 in e2.tracks) {
          let d2 = Object.assign({}, (s2 = this.store.getTrackState(n2)) == null ? void 0 : s2.trackInfo), u2 = e2.tracks[n2], p2 = this.store.getTrackById(n2);
          if (this.store.setTrackState({ peerId: e2.peer.peer_id, trackInfo: m(m({}, d2), u2) }), !p2 || this.tracksToProcess.has(n2)) this.processTrackInfo(u2, e2.peer.peer_id, t3), this.processPendingTracks();
          else {
            p2.setEnabled(!u2.mute);
            let h2 = this.processTrackUpdate(p2, d2, u2);
            h2 && ((o2 = this.listener) == null || o2.onTrackUpdate(h2, p2, i3));
          }
        }
      };
      this.processTrackInfo = (e2, t3, i3) => {
      };
      this.processPendingTracks = () => {
        new Map(this.tracksToProcess).forEach((t3) => {
          var s2;
          let i3 = this.store.getTrackState(t3.trackId);
          if (!i3) {
            l2.d(this.TAG, "TrackState not added to store", `peerId - ${t3.peerId}`, `trackId -${t3.trackId}`);
            return;
          }
          let r2 = this.store.getPeerById(i3.peerId);
          if (!r2) {
            l2.d(this.TAG, "Peer not added to store, peerId", i3.peerId);
            return;
          }
          t3.source = i3.trackInfo.source, t3.peerId = r2.peerId, t3.logIdentifier = r2.name, t3.setEnabled(!i3.trackInfo.mute), this.addAudioTrack(r2, t3), this.addVideoTrack(r2, t3), t3.type === "audio" ? this.eventBus.audioTrackAdded.publish({ track: t3, peer: r2 }) : (s2 = this.listener) == null || s2.onTrackUpdate(0, t3, r2), this.tracksToProcess.delete(t3.trackId);
        });
      };
    }
    handleTrackMetadataAdd(e) {
      l2.d(this.TAG, "TRACK_METADATA_ADD", JSON.stringify(e, null, 2));
      for (let t2 in e.tracks) {
        let i2 = e.tracks[t2];
        this.store.setTrackState({ peerId: e.peer.peer_id, trackInfo: i2 });
      }
      this.processPendingTracks();
    }
    handleTrackRemove(e, t2 = true) {
      var s2;
      l2.d(this.TAG, "ONTRACKREMOVE", `${e}`);
      let i2 = this.store.getTrackState(e.trackId);
      if (!i2) return;
      if (!this.store.hasTrack(e)) {
        l2.d(this.TAG, "Track not found in store");
        return;
      }
      if (t2) {
        this.store.removeTrack(e);
        let o2 = this.store.getPeerById(i2.peerId);
        if (!o2) return;
        this.removePeerTracks(o2, e), (s2 = this.listener) == null || s2.onTrackUpdate(1, e, o2), e.type === "audio" && this.eventBus.audioTrackRemoved.publish(e);
      }
    }
    setLayer(e, t2) {
      var s2, o2;
      let i2 = this.store.getPeerByTrackId(e.trackId);
      if (!i2) return;
      e.setLayerFromServer(t2) ? (s2 = this.listener) == null || s2.onTrackUpdate(5, e, i2) : (o2 = this.listener) == null || o2.onTrackUpdate(6, e, i2);
    }
    removePeerTracks(e, t2) {
      let i2 = e.auxiliaryTracks.indexOf(t2);
      i2 > -1 ? (e.auxiliaryTracks.splice(i2, 1), l2.d(this.TAG, "auxiliary track removed", `${t2}`)) : t2.type === "audio" && e.audioTrack === t2 ? (e.audioTrack = void 0, l2.d(this.TAG, "audio track removed", `${t2}`)) : t2.type === "video" && e.videoTrack === t2 && (e.videoTrack = void 0, l2.d(this.TAG, "video track removed", `${t2}`));
    }
    addAudioTrack(e, t2) {
      var i2;
      t2.type === "audio" && (t2.source === "regular" && (!e.audioTrack || ((i2 = e.audioTrack) == null ? void 0 : i2.trackId) === t2.trackId) ? e.audioTrack = t2 : e.auxiliaryTracks.push(t2), this.store.addTrack(t2), l2.d(this.TAG, "audio track added", `${t2}`));
    }
    addVideoTrack(e, t2) {
      if (t2.type !== "video") return;
      let i2 = t2, r2 = this.store.getSimulcastDefinitionsForPeer(e, i2.source);
      if (i2.setSimulcastDefinitons(r2), this.addAsPrimaryVideoTrack(e, i2)) e.videoTrack ? e.videoTrack.replaceTrack(i2) : e.videoTrack = i2, this.store.addTrack(e.videoTrack);
      else {
        let s2 = e.auxiliaryTracks.findIndex((o2) => o2.trackId === i2.trackId);
        s2 === -1 ? (e.auxiliaryTracks.push(i2), this.store.addTrack(i2)) : (e.auxiliaryTracks[s2].replaceTrack(i2), this.store.addTrack(e.auxiliaryTracks[s2]));
      }
      l2.d(this.TAG, "video track added", `${t2}`);
    }
    addAsPrimaryVideoTrack(e, t2) {
      var i2;
      return t2.source === "regular" && (!e.videoTrack || ((i2 = e.videoTrack) == null ? void 0 : i2.trackId) === t2.trackId);
    }
    processTrackUpdate(e, t2, i2) {
      let r2;
      return t2.mute !== i2.mute ? (r2 = i2.mute ? 2 : 3, e.type === "audio" && this.eventBus.audioTrackUpdate.publish({ track: e, enabled: !i2.mute })) : t2.description !== i2.description && (r2 = 4), r2;
    }
  };
  var zi = class extends lt {
    constructor(t2, i2, r2, s2) {
      super(t2, i2, s2);
      this.transport = r2;
      this.TAG = "[OnDemandTrackManager]";
      this.processTrackInfo = (t3, i3, r3 = true) => {
        var u2, p2;
        if (t3.type !== "video") return;
        let s3 = this.store.getPeerById(i3);
        if (!s3 || !this.isPeerRoleSubscribed(i3)) {
          l2.d(this.TAG, `no peer in store for peerId: ${i3}`);
          return;
        }
        let o2 = new be(new MediaStream(), this.transport.getSubscribeConnection()), n2 = Se.getEmptyVideoTrack();
        n2.enabled = !t3.mute;
        let d2 = new O2(o2, n2, t3.source, (u2 = this.store.getRoom()) == null ? void 0 : u2.disableNoneLayerRequest);
        d2.setTrackId(t3.track_id), d2.peerId = s3.peerId, d2.logIdentifier = s3.name, this.addVideoTrack(s3, d2), r3 && ((p2 = this.listener) == null || p2.onTrackUpdate(0, s3.videoTrack, s3));
      };
    }
    handleTrackMetadataAdd(t2) {
      super.handleTrackMetadataAdd(t2);
      for (let i2 in t2.tracks) t2.tracks[i2].type === "video" && this.processTrackInfo(t2.tracks[i2], t2.peer.peer_id);
    }
    handleTrackRemove(t2) {
      let i2 = t2.type === "video" && t2.source === "regular";
      super.handleTrackRemove(t2, !i2), i2 && this.processTrackInfo({ track_id: t2.trackId, mute: !t2.enabled, type: t2.type, source: t2.source, stream_id: t2.stream.id }, t2.peerId, false);
    }
    addAsPrimaryVideoTrack(t2, i2) {
      return i2.source !== "regular" ? false : !t2.videoTrack || t2.videoTrack.trackId === i2.trackId ? true : t2.videoTrack.enabled && ye(t2.videoTrack.nativeTrack);
    }
    isPeerRoleSubscribed(t2) {
      var s2, o2, n2, d2;
      if (!t2) return true;
      let i2 = this.store.getLocalPeer(), r2 = this.store.getPeerById(t2);
      return r2 && ((d2 = (o2 = (s2 = i2 == null ? void 0 : i2.role) == null ? void 0 : s2.subscribeParams) == null ? void 0 : o2.subscribeToRoles) == null ? void 0 : d2.includes((n2 = r2.role) == null ? void 0 : n2.name));
    }
  };
  var Yi = class {
    constructor(e, t2, i2, r2) {
      this.store = e;
      this.peerManager = t2;
      this.trackManager = i2;
      this.listener = r2;
      this.TAG = "[PeerListManager]";
      this.handleInitialPeerList = (e2) => {
        let t3 = Object.values(e2.peers);
        this.peerManager.handlePeerList(t3);
      };
      this.handleReconnectPeerList = (e2) => {
        this.handleRepeatedPeerList(e2.peers);
      };
      this.handlePreviewRoomState = (e2) => {
        if (!this.store.hasRoleDetailsArrived()) return;
        let t3 = e2.peers;
        if (t3 == null) {
          e2.peer_count === 0 && this.handleRepeatedPeerList({});
          return;
        }
        Object.keys(t3).forEach((i3) => {
          t3[i3].tracks = {}, t3[i3].is_from_room_state = true;
        }), this.handleRepeatedPeerList(t3);
      };
      this.handleRepeatedPeerList = (e2) => {
        let t3 = this.store.getRemotePeers(), i3 = Object.values(e2), r3 = t3.filter((o2) => !e2[o2.peerId]);
        r3.length > 0 && l2.d(this.TAG, `${r3}`), r3.forEach((o2) => {
          var d2;
          let n2 = { peer_id: o2.peerId, role: ((d2 = o2.role) == null ? void 0 : d2.name) || "", info: { name: o2.name, data: o2.metadata || "", user_id: o2.customerUserId || "", type: o2.type }, tracks: {}, groups: [], realtime: o2.realtime };
          this.peerManager.handlePeerLeave(n2);
        });
        let s2 = [];
        i3.forEach((o2) => {
          let n2 = this.store.getPeerById(o2.peer_id), d2 = Object.values(o2.tracks);
          n2 && (this.store.getPeerTracks(n2.peerId).forEach((p2) => {
            var h2;
            o2.tracks[p2.trackId] || (this.removePeerTrack(n2, p2.trackId), (h2 = this.listener) == null || h2.onTrackUpdate(1, p2, n2));
          }), d2.forEach((p2) => {
            this.store.getTrackById(p2.track_id) || this.store.setTrackState({ peerId: n2.peerId, trackInfo: p2 });
          }), this.trackManager.handleTrackUpdate({ peer: o2, tracks: o2.tracks }, false), this.peerManager.handlePeerUpdate(o2)), s2.push(o2);
        }), s2.length > 0 && this.peerManager.handlePeerList(s2);
      };
    }
    handleNotification(e, t2, i2) {
      if (e === "peer-list") {
        let r2 = t2;
        i2 ? (l2.d(this.TAG, "RECONNECT_PEER_LIST event", JSON.stringify(r2, null, 2)), this.handleReconnectPeerList(r2)) : (l2.d(this.TAG, "PEER_LIST event", JSON.stringify(r2, null, 2)), this.handleInitialPeerList(r2));
      } else if (e === "room-state") {
        let r2 = t2;
        this.handlePreviewRoomState(r2);
      }
    }
    removePeerTrack(e, t2) {
      var i2, r2;
      if (l2.d(this.TAG, `removing track - ${t2} from ${e}`), ((i2 = e.audioTrack) == null ? void 0 : i2.trackId) === t2) e.audioTrack = void 0;
      else if (((r2 = e.videoTrack) == null ? void 0 : r2.trackId) === t2) e.videoTrack = void 0;
      else {
        let s2 = e.auxiliaryTracks.findIndex((o2) => o2.trackId === t2);
        s2 >= 0 && e.auxiliaryTracks.splice(s2, 1);
      }
    }
  };
  var L2 = (a10) => a10 ? new Date(a10) : void 0;
  var Xi = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.trackManager = t2;
      this.listener = i2;
      this.TAG = "[PeerManager]";
      this.handlePeerList = (e2) => {
        var r2, s2;
        if (e2.length === 0) {
          (r2 = this.listener) == null || r2.onPeerUpdate(9, []);
          return;
        }
        let t3 = [], i3 = new Set(e2.map((o2) => o2.peer_id));
        this.store.getRemotePeers().forEach(({ peerId: o2, fromRoomState: n2 }) => {
          !i3.has(o2) && n2 && this.store.removePeer(o2);
        });
        for (let o2 of e2) t3.push(this.makePeer(o2));
        (s2 = this.listener) == null || s2.onPeerUpdate(9, t3), this.trackManager.processPendingTracks();
      };
      this.handlePeerJoin = (e2) => {
        var i3;
        let t3 = this.makePeer(e2);
        (i3 = this.listener) == null || i3.onPeerUpdate(0, t3), this.trackManager.processPendingTracks();
      };
      this.handlePeerLeave = (e2) => {
        var i3, r2, s2, o2;
        let t3 = this.store.getPeerById(e2.peer_id);
        this.store.removePeer(e2.peer_id), l2.d(this.TAG, "PEER_LEAVE", e2.peer_id, `remainingPeers=${this.store.getPeers().length}`), t3 && (t3.audioTrack && ((i3 = this.listener) == null || i3.onTrackUpdate(1, t3.audioTrack, t3)), t3.videoTrack && ((r2 = this.listener) == null || r2.onTrackUpdate(1, t3.videoTrack, t3)), (s2 = t3.auxiliaryTracks) == null || s2.forEach((n2) => {
          var d2;
          (d2 = this.listener) == null || d2.onTrackUpdate(1, n2, t3);
        }), (o2 = this.listener) == null || o2.onPeerUpdate(1, t3));
      };
    }
    handleNotification(e, t2) {
      switch (e) {
        case "on-peer-join": {
          let i2 = t2;
          this.handlePeerJoin(i2);
          break;
        }
        case "on-peer-leave": {
          let i2 = t2;
          this.handlePeerLeave(i2);
          break;
        }
        case "on-peer-update":
          this.handlePeerUpdate(t2);
          break;
        default:
          break;
      }
    }
    handlePeerUpdate(e) {
      var s2, o2, n2, d2, u2;
      let t2 = this.store.getPeerById(e.peer_id);
      if (!t2 && e.realtime) {
        t2 = this.makePeer(e), (s2 = this.listener) == null || s2.onPeerUpdate(t2.isHandRaised ? 12 : 14, t2);
        return;
      }
      if (t2 && !t2.isLocal && !e.realtime) {
        this.store.removePeer(t2.peerId), (o2 = this.listener) == null || o2.onPeerUpdate(13, t2);
        return;
      }
      if (!t2) {
        l2.d(this.TAG, `peer ${e.peer_id} not found`);
        return;
      }
      if (t2.role && t2.role.name !== e.role) {
        let p2 = this.store.getPolicyForRole(e.role);
        t2.updateRole(p2), this.updateSimulcastLayersForPeer(t2), (n2 = this.listener) == null || n2.onPeerUpdate(8, t2);
      }
      let i2 = t2.isHandRaised;
      t2.updateGroups(e.groups);
      let r2 = (d2 = e.groups) == null ? void 0 : d2.includes(Ae);
      i2 !== r2 && ((u2 = this.listener) == null || u2.onPeerUpdate(12, t2)), this.handlePeerInfoUpdate(m({ peer: t2 }, e.info));
    }
    handlePeerInfoUpdate({ peer: e, name: t2, data: i2 }) {
      var r2, s2;
      e && (t2 && e.name !== t2 && (e.updateName(t2), (r2 = this.listener) == null || r2.onPeerUpdate(10, e)), i2 && e.metadata !== i2 && (e.updateMetadata(i2), (s2 = this.listener) == null || s2.onPeerUpdate(11, e)));
    }
    makePeer(e) {
      let t2 = this.store.getPeerById(e.peer_id);
      t2 || (t2 = ke(e, this.store), t2.realtime = e.realtime, t2.joinedAt = L2(e.joined_at), t2.fromRoomState = !!e.is_from_room_state, this.store.addPeer(t2), l2.d(this.TAG, "adding to the peerList", `${t2}`));
      for (let i2 in e.tracks) {
        let r2 = e.tracks[i2];
        this.store.setTrackState({ peerId: e.peer_id, trackInfo: r2 }), r2.type === "video" && this.trackManager.processTrackInfo(r2, e.peer_id, false);
      }
      return t2;
    }
    updateSimulcastLayersForPeer(e) {
      this.store.getPeerTracks(e.peerId).forEach((t2) => {
        if (t2.type === "video" && ["regular", "screen"].includes(t2.source)) {
          let i2 = t2, r2 = this.store.getSimulcastDefinitionsForPeer(e, i2.source);
          i2.setSimulcastDefinitons(r2);
        }
      });
    }
  };
  var Zi = class {
    constructor(e, t2) {
      this.store = e;
      this.eventBus = t2;
    }
    handlePolicyChange(e) {
      let t2 = this.store.getLocalPeer();
      if (t2 && !t2.role) {
        let r2 = e.known_roles[e.name];
        t2.updateRole(r2);
      }
      this.store.setKnownRoles(e);
      let i2 = this.store.getRoom();
      i2 ? i2.templateId = e.template_id : l2.w("[PolicyChangeManager]", "on policy change - room not present"), this.updateLocalPeerRole(e), this.eventBus.policyChange.publish(e);
    }
    updateLocalPeerRole(e) {
      var i2;
      let t2 = this.store.getLocalPeer();
      if (t2 != null && t2.role && t2.role.name !== e.name) {
        let r2 = this.store.getPolicyForRole(e.name), s2 = t2.role;
        t2.updateRole(r2), r2.name === ((i2 = t2.asRole) == null ? void 0 : i2.name) && delete t2.asRole, this.eventBus.localRoleUpdate.publish({ oldRole: s2, newRole: r2 });
      }
    }
  };
  var ns = ((f2) => (f2.FLAG_SERVER_SUB_DEGRADATION = "subscribeDegradation", f2.FLAG_SERVER_SIMULCAST = "simulcast", f2.FLAG_NON_WEBRTC_DISABLE_OFFER = "nonWebRTCDisableOffer", f2.FLAG_PUBLISH_STATS = "publishStats", f2.FLAG_SUBSCRIBE_STATS = "subscribeStats", f2.FLAG_ON_DEMAND_TRACKS = "onDemandTracks", f2.FLAG_DISABLE_VIDEO_TRACK_AUTO_UNSUBSCRIBE = "disableVideoTrackAutoUnsubscribe", f2.FLAG_WHITEBOARD_ENABLED = "whiteboardEnabled", f2.FLAG_EFFECTS_SDK_ENABLED = "effectsSDKEnabled", f2.FLAG_VB_ENABLED = "vb", f2.FLAG_HIPAA_ENABLED = "hipaa", f2.FLAG_NOISE_CANCELLATION = "noiseCancellation", f2.FLAG_SCALE_SCREENSHARE_BASED_ON_PIXELS = "scaleScreenshareBasedOnPixels", f2.FLAG_DISABLE_NONE_LAYER_REQUEST = "disableNoneLayerRequest", f2))(ns || {});
  var qt = (a10, e, t2) => {
    let i2 = t2 === "qa" ? aa : sa, r2 = new URL(i2);
    return r2.searchParams.set("endpoint", `https://${e}`), r2.searchParams.set("token", a10), r2.toString();
  };
  var er = class {
    constructor(e, t2, i2) {
      this.transport = e;
      this.store = t2;
      this.listener = i2;
      this.TAG = "[HMSWhiteboardInteractivityCenter]";
    }
    get isEnabled() {
      return this.transport.isFlagEnabled("whiteboardEnabled");
    }
    open(e) {
      return c2(this, null, function* () {
        var o2;
        if (!this.isEnabled) return l2.w(this.TAG, "Whiteboard is not enabled for customer");
        let t2 = this.store.getWhiteboard(e == null ? void 0 : e.id), i2 = t2 == null ? void 0 : t2.id;
        if (t2 || (i2 = (yield this.transport.signal.createWhiteboard(this.getCreateOptionsWithDefaults(e))).id), !i2) throw new Error(`Whiteboard ID: ${i2} not found`);
        let r2 = yield this.transport.signal.getWhiteboard({ id: i2 }), s2 = M2(m({}, t2), { title: e == null ? void 0 : e.title, attributes: e == null ? void 0 : e.attributes, id: r2.id, url: qt(r2.token, r2.addr, this.store.getEnv()), token: r2.token, addr: r2.addr, owner: r2.owner, permissions: r2.permissions || [], open: true });
        this.store.setWhiteboard(s2), (o2 = this.listener) == null || o2.onWhiteboardUpdate(s2);
      });
    }
    close(e) {
      return c2(this, null, function* () {
        var r2;
        if (!this.isEnabled) return l2.w(this.TAG, "Whiteboard is not enabled for customer");
        let t2 = this.store.getWhiteboard(e);
        if (!t2) throw new Error(`Whiteboard ID: ${e} not found`);
        let i2 = { id: t2.id, title: t2.title, open: false };
        this.store.setWhiteboard(i2), (r2 = this.listener) == null || r2.onWhiteboardUpdate(i2);
      });
    }
    setListener(e) {
      this.listener = e;
    }
    handleLocalRoleUpdate() {
      return c2(this, null, function* () {
        var t2, i2, r2;
        let e = this.store.getWhiteboards();
        for (let s2 of e.values()) if (s2.url) {
          let o2 = yield this.transport.signal.getWhiteboard({ id: s2.id }), n2 = this.store.getLocalPeer(), u2 = (n2 == null ? void 0 : n2.customerUserId) === o2.owner ? (i2 = (t2 = n2.role) == null ? void 0 : t2.permissions.whiteboard) == null ? void 0 : i2.includes("admin") : o2.permissions.length > 0, p2 = M2(m({}, s2), { id: o2.id, url: qt(o2.token, o2.addr, this.store.getEnv()), token: o2.token, addr: o2.addr, owner: o2.owner, permissions: o2.permissions, open: u2 });
          this.store.setWhiteboard(p2), (r2 = this.listener) == null || r2.onWhiteboardUpdate(p2);
        }
      });
    }
    getCreateOptionsWithDefaults(e) {
      var o2;
      let t2 = Object.values(this.store.getKnownRoles()), i2 = [], r2 = [], s2 = [];
      return t2.forEach((n2) => {
        var d2, u2, p2;
        (d2 = n2.permissions.whiteboard) != null && d2.includes("read") && i2.push(n2.name), (u2 = n2.permissions.whiteboard) != null && u2.includes("write") && r2.push(n2.name), (p2 = n2.permissions.whiteboard) != null && p2.includes("admin") && s2.push(n2.name);
      }), { title: (e == null ? void 0 : e.title) || `${(o2 = this.store.getRoom()) == null ? void 0 : o2.id} Whiteboard`, reader: (e == null ? void 0 : e.reader) || i2, writer: (e == null ? void 0 : e.writer) || r2, admin: (e == null ? void 0 : e.admin) || s2 };
    }
  };
  var jt = class {
    constructor(e, t2, i2) {
      this.transport = e;
      this.store = t2;
      this.listener = i2;
      this.whiteboard = new er(e, t2, i2);
    }
    setListener(e) {
      this.listener = e, this.whiteboard.setListener(e);
    }
    createPoll(e) {
      return c2(this, null, function* () {
        var o2, n2;
        let t2 = { customerID: "userid", peerID: "peerid", userName: "username" }, { poll_id: i2 } = yield this.transport.signal.setPollInfo(M2(m({}, e), { mode: e.mode ? t2[e.mode] : void 0, poll_id: e.id, vote: e.rolesThatCanVote, responses: e.rolesThatCanViewResponses }));
        e.id || (e.id = i2), Array.isArray(e.questions) && (yield this.addQuestionsToPoll(e.id, e.questions));
        let r2 = yield this.transport.signal.getPollQuestions({ poll_id: e.id, index: 0, count: 50 }), s2 = tr(M2(m({}, e), { poll_id: e.id, state: "created", created_by: (o2 = this.store.getLocalPeer()) == null ? void 0 : o2.peerId }));
        s2.questions = r2.questions.map(({ question: d2, options: u2, answer: p2 }) => M2(m({}, d2), { options: u2, answer: p2 })), (n2 = this.listener) == null || n2.onPollsUpdate(0, [s2]);
      });
    }
    startPoll(e) {
      return c2(this, null, function* () {
        typeof e == "string" ? yield this.transport.signal.startPoll({ poll_id: e }) : (yield this.createPoll(e), yield this.transport.signal.startPoll({ poll_id: e.id }));
      });
    }
    addQuestionsToPoll(e, t2) {
      return c2(this, null, function* () {
        t2.length > 0 && (yield this.transport.signal.setPollQuestions({ poll_id: e, questions: t2.map((i2, r2) => this.createQuestionSetParams(i2, r2)) }));
      });
    }
    stopPoll(e) {
      return c2(this, null, function* () {
        yield this.transport.signal.stopPoll({ poll_id: e });
      });
    }
    addResponsesToPoll(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.store.getPoll(e);
        if (!i2) throw new Error("Invalid poll ID - Poll not found");
        let r2 = t2.map((s2) => {
          var n2, d2;
          let o2 = this.getQuestionInPoll(i2, s2.questionIndex);
          return o2.type === "single-choice" ? (s2.option = s2.option || ((n2 = s2.options) == null ? void 0 : n2[0]) || -1, delete s2.text, delete s2.options) : o2.type === "multiple-choice" ? ((d2 = s2.options) == null || d2.sort(), delete s2.text, delete s2.option) : (delete s2.option, delete s2.options), s2.skipped && (delete s2.option, delete s2.options, delete s2.text), m({ duration: 0, type: o2.type, question: s2.questionIndex }, s2);
        });
        yield this.transport.signal.setPollResponses({ poll_id: e, responses: r2 });
      });
    }
    fetchLeaderboard(e, t2, i2) {
      return c2(this, null, function* () {
        var p2, h2;
        let r2 = this.store.getPoll(e);
        if (!r2) throw new Error("Invalid poll ID - Poll not found");
        let s2 = (h2 = (p2 = this.store.getLocalPeer()) == null ? void 0 : p2.role) == null ? void 0 : h2.permissions, o2 = !!(s2 != null && s2.pollRead || s2 != null && s2.pollWrite);
        if (r2.anonymous || r2.state !== "stopped" || !o2) return { entries: [], hasNext: false };
        let n2 = yield this.transport.signal.fetchPollLeaderboard({ poll_id: r2.id, count: i2, offset: t2 }), d2 = { avgScore: n2.avg_score, avgTime: n2.avg_time, votedUsers: n2.voted_users, totalUsers: n2.total_users, correctUsers: n2.correct_users };
        return { entries: n2.questions.map((T) => ({ position: T.position, totalResponses: T.total_responses, correctResponses: T.correct_responses, duration: T.duration, peer: T.peer, score: T.score })), hasNext: !n2.last, summary: d2 };
      });
    }
    getPollResponses(e, t2) {
      return c2(this, null, function* () {
        var s2, o2;
        let i2 = yield this.transport.signal.getPollResponses({ poll_id: e.id, index: 0, count: 50, self: t2 }), r2 = JSON.parse(JSON.stringify(e));
        (s2 = i2.responses) == null || s2.forEach(({ response: n2, peer: d2, final: u2 }) => {
          var h2, T;
          let p2 = (h2 = e == null ? void 0 : e.questions) == null ? void 0 : h2.find((g2) => g2.index === n2.question);
          if (p2) {
            let g2 = { id: n2.response_id, questionIndex: n2.question, option: n2.option, options: n2.options, text: n2.text, responseFinal: u2, peer: { peerid: d2.peerid, userHash: d2.hash, userid: d2.userid, username: d2.username }, skipped: n2.skipped, type: n2.type, update: n2.update }, f2 = p2.responses && !t2 ? [...p2.responses] : [];
            (T = r2.questions) != null && T[n2.question - 1] && (r2.questions[n2.question - 1].responses = [...f2, g2]);
          }
        }), this.store.setPoll(r2), (o2 = this.listener) == null || o2.onPollsUpdate(4, [r2]);
      });
    }
    getPolls() {
      return c2(this, null, function* () {
        var s2, o2, n2;
        let e = yield this.transport.signal.getPollsList({ count: 50, state: "started" }), t2 = [], i2 = (o2 = (s2 = this.store.getLocalPeer()) == null ? void 0 : s2.role) == null ? void 0 : o2.permissions.pollWrite, r2 = [...e.polls];
        if (i2) {
          let d2 = yield this.transport.signal.getPollsList({ count: 50, state: "created" }), u2 = yield this.transport.signal.getPollsList({ count: 50, state: "stopped" });
          r2 = [...d2.polls, ...r2, ...u2.polls];
        }
        for (let d2 of r2) {
          let u2 = yield this.transport.signal.getPollQuestions({ poll_id: d2.poll_id, index: 0, count: 50 }), p2 = tr(d2), h2 = this.store.getPoll(d2.poll_id);
          p2.questions = u2.questions.map(({ question: T, options: g2, answer: f2 }, P2) => {
            var v2, R2;
            return M2(m({}, T), { options: g2, answer: f2, responses: (R2 = (v2 = h2 == null ? void 0 : h2.questions) == null ? void 0 : v2[P2]) == null ? void 0 : R2.responses });
          }), t2.push(p2), this.store.setPoll(p2);
        }
        return (n2 = this.listener) == null || n2.onPollsUpdate(3, t2), t2;
      });
    }
    createQuestionSetParams(e, t2) {
      var o2, n2;
      if (e.index) {
        let d2 = (o2 = e.options) == null ? void 0 : o2.map((u2, p2) => M2(m({}, u2), { index: p2 + 1 }));
        return { question: M2(m({}, e), { index: t2 + 1 }), options: d2, answer: e.answer };
      }
      let i2 = M2(m({}, e), { index: t2 + 1 }), r2, s2 = e.answer || { hidden: false };
      return Array.isArray(e.options) && ["single-choice", "multiple-choice"].includes(e.type) ? (r2 = (n2 = e.options) == null ? void 0 : n2.map((d2, u2) => ({ index: u2 + 1, text: d2.text, weight: d2.weight })), e.type === "single-choice" ? s2.option = e.options.findIndex((d2) => d2.isCorrectAnswer) + 1 || void 0 : s2.options = e.options.map((d2, u2) => d2.isCorrectAnswer ? u2 + 1 : void 0).filter((d2) => !!d2)) : (s2 == null || delete s2.options, s2 == null || delete s2.option), { question: i2, options: r2, answer: s2 };
    }
    getQuestionInPoll(e, t2) {
      var r2;
      let i2 = (r2 = e == null ? void 0 : e.questions) == null ? void 0 : r2.find((s2) => s2.index === t2);
      if (!i2) throw new Error("Invalid question index - Question not found in poll");
      return i2;
    }
  };
  var tr = (a10) => {
    let e = { userid: "customerID", peerid: "peerID", username: "userName" };
    return { id: a10.poll_id, title: a10.title, startedBy: a10.started_by, createdBy: a10.created_by, anonymous: a10.anonymous, type: a10.type, duration: a10.duration, locked: a10.locked, mode: a10.mode ? e[a10.mode] : void 0, visibility: a10.visibility, rolesThatCanVote: a10.vote || [], rolesThatCanViewResponses: a10.responses || [], state: a10.state, stoppedBy: a10.stopped_by, startedAt: L2(a10.started_at), stoppedAt: L2(a10.stopped_at), createdAt: L2(a10.created_at) };
  };
  var ir = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.transport = t2;
      this.listener = i2;
    }
    handleNotification(e, t2) {
      switch (e) {
        case "on-poll-start": {
          this.handlePollStart(t2);
          break;
        }
        case "on-poll-stop": {
          this.handlePollStop(t2);
          break;
        }
        case "on-poll-stats":
          this.handlePollStats(t2);
          break;
        default:
          break;
      }
    }
    handlePollStart(e) {
      return c2(this, null, function* () {
        var i2, r2;
        let t2 = [];
        for (let s2 of e.polls) {
          let o2 = this.store.getPoll(s2.poll_id);
          if (o2 && o2.state === "started") {
            (i2 = this.listener) == null || i2.onPollsUpdate(1, [o2]);
            return;
          }
          let n2 = yield this.transport.signal.getPollQuestions({ poll_id: s2.poll_id, index: 0, count: 50 }), d2 = tr(s2);
          d2.questions = n2.questions.map(({ question: u2, options: p2, answer: h2 }) => M2(m({}, u2), { options: p2, answer: h2 })), yield this.updatePollResponses(d2, true), t2.push(d2), this.store.setPoll(d2);
        }
        (r2 = this.listener) == null || r2.onPollsUpdate(1, t2);
      });
    }
    handlePollStop(e) {
      return c2(this, null, function* () {
        var i2;
        let t2 = [];
        for (let r2 of e.polls) {
          let s2 = this.store.getPoll(r2.poll_id);
          if (s2) {
            s2.state = "stopped", s2.stoppedAt = L2(r2.stopped_at), s2.stoppedBy = r2.stopped_by;
            let o2 = yield this.transport.signal.getPollResult({ poll_id: r2.poll_id });
            this.updatePollResult(s2, o2), t2.push(s2);
          }
        }
        t2.length > 0 && ((i2 = this.listener) == null || i2.onPollsUpdate(2, t2));
      });
    }
    handlePollStats(e) {
      return c2(this, null, function* () {
        var i2;
        let t2 = [];
        for (let r2 of e.polls) {
          let s2 = this.store.getPoll(r2.poll_id);
          if (!s2) return;
          this.updatePollResult(s2, r2), t2.push(s2);
        }
        t2.length > 0 && ((i2 = this.listener) == null || i2.onPollsUpdate(4, t2));
      });
    }
    updatePollResult(e, t2) {
      var i2;
      e.result = m({}, e.result), e.result.totalUsers = t2.user_count, e.result.maxUsers = t2.max_user, e.result.totalResponses = t2.total_response, (i2 = t2.questions) == null || i2.forEach((r2) => {
        var o2, n2;
        let s2 = (o2 = e.questions) == null ? void 0 : o2.find((d2) => d2.index === r2.question);
        s2 && (s2.result = m({}, s2.result), s2.result.correctResponses = r2.correct, s2.result.skippedCount = r2.skipped, s2.result.totalResponses = r2.total, (n2 = r2.options) == null || n2.forEach((d2, u2) => {
          var h2;
          let p2 = (h2 = s2.options) == null ? void 0 : h2[u2];
          p2 && p2.voteCount !== d2 && (p2.voteCount = d2);
        }));
      });
    }
    updatePollResponses(e, t2) {
      return c2(this, null, function* () {
        var r2;
        (r2 = (yield this.transport.signal.getPollResponses({ poll_id: e.id, index: 0, count: 50, self: t2 })).responses) == null || r2.forEach(({ response: s2, peer: o2, final: n2 }) => {
          var p2;
          let d2 = (p2 = e == null ? void 0 : e.questions) == null ? void 0 : p2.find((h2) => h2.index === s2.question);
          if (!d2) return;
          let u2 = { id: s2.response_id, questionIndex: s2.question, option: s2.option, options: s2.options, text: s2.text, responseFinal: n2, peer: { peerid: o2.peerid, userHash: o2.hash, userid: o2.userid, username: o2.username }, skipped: s2.skipped, type: s2.type, update: s2.update };
          Array.isArray(d2.responses) && d2.responses.length > 0 ? d2.responses.find(({ id: h2 }) => h2 === u2.id) || d2.responses.push(u2) : d2.responses = [u2];
        });
      });
    }
  };
  var rr = class {
    constructor(e, t2) {
      this.store = e;
      this.listener = t2;
    }
    handleNotification(e, t2) {
      switch (e) {
        case "on-role-change-request":
          this.handleRoleChangeRequest(t2);
          break;
        case "on-track-update-request":
          this.handleTrackUpdateRequest(t2);
          break;
        case "on-change-track-mute-state-request":
          this.handleChangeTrackStateRequest(t2);
          break;
        default:
          return;
      }
    }
    handleRoleChangeRequest(e) {
      var i2;
      let t2 = { requestedBy: e.requested_by ? this.store.getPeerById(e.requested_by) : void 0, role: this.store.getPolicyForRole(e.role), token: e.token };
      (i2 = this.listener) == null || i2.onRoleChangeRequest(t2);
    }
    handleTrackUpdateRequest(e) {
      let { requested_by: t2, track_id: i2, mute: r2 } = e, s2 = t2 ? this.store.getPeerById(t2) : void 0, o2 = this.store.getLocalPeerTracks().find((d2) => d2.publishedTrackId === i2);
      if (!o2) return;
      let n2 = () => {
        var d2;
        (d2 = this.listener) == null || d2.onChangeTrackStateRequest({ requestedBy: s2, track: o2, enabled: !r2 });
      };
      if (r2) {
        if (o2.enabled === !r2) return;
        o2.setEnabled(!r2).then(n2);
      } else n2();
    }
    handleChangeTrackStateRequest(e) {
      var u2;
      let { type: t2, source: i2, value: r2, requested_by: s2 } = e, o2 = s2 ? this.store.getPeerById(s2) : void 0, n2 = !r2, d2 = this.getTracksToBeUpdated({ type: t2, source: i2, enabled: n2 });
      if (d2.length !== 0) if (n2) (u2 = this.listener) == null || u2.onChangeMultiTrackStateRequest({ requestedBy: o2, tracks: d2, type: t2, source: i2, enabled: true });
      else {
        let p2 = [];
        for (let h2 of d2) p2.push(h2.setEnabled(false));
        Promise.all(p2).then(() => {
          var h2;
          (h2 = this.listener) == null || h2.onChangeMultiTrackStateRequest({ requestedBy: o2, tracks: d2, enabled: false });
        });
      }
    }
    getTracksToBeUpdated({ type: e, source: t2, enabled: i2 }) {
      let s2 = this.store.getLocalPeerTracks();
      return e && (s2 = s2.filter((o2) => o2.type === e)), t2 && (s2 = s2.filter((o2) => o2.source === t2)), s2.filter((o2) => o2.enabled !== i2);
    }
  };
  var sr = class {
    constructor(e, t2) {
      this.store = e;
      this.listener = t2;
      this.TAG = "[RoomUpdateManager]";
    }
    handleNotification(e, t2) {
      switch (e) {
        case "peer-list":
          this.onRoomState(t2.room);
          break;
        case "on-rtmp-update":
          this.updateRTMPStatus(t2);
          break;
        case "on-record-update":
          this.updateRecordingStatus(t2);
          break;
        case "room-state":
          this.handlePreviewRoomState(t2);
          break;
        case "room-info":
          this.handleRoomInfo(t2);
          break;
        case "session-info":
          this.handleSessionInfo(t2);
          break;
        case "on-hls-update":
          this.updateHLSStatus(t2);
          break;
        case "on-transcription-update":
          this.handleTranscriptionStatus([t2]);
          break;
        default:
          break;
      }
    }
    handleRoomInfo(e) {
      let t2 = this.store.getRoom();
      if (!t2) {
        l2.w(this.TAG, "on session info - room not present");
        return;
      }
      t2.description = e.description, t2.large_room_optimization = e.large_room_optimization, t2.max_size = e.max_size, t2.name = e.name;
    }
    handleSessionInfo(e) {
      var i2;
      let t2 = this.store.getRoom();
      if (!t2) {
        l2.w(this.TAG, "on session info - room not present");
        return;
      }
      t2.sessionId = e.session_id, t2.peerCount !== e.peer_count && (t2.peerCount = e.peer_count, (i2 = this.listener) == null || i2.onRoomUpdate("ROOM_PEER_COUNT_UPDATED", t2));
    }
    handlePreviewRoomState(e) {
      let { room: t2 } = e;
      this.onRoomState(t2);
    }
    onRoomState(e) {
      var u2, p2, h2, T;
      let { recording: t2, streaming: i2, transcriptions: r2, session_id: s2, started_at: o2, name: n2 } = e, d2 = this.store.getRoom();
      if (!d2) {
        l2.w(this.TAG, "on room state - room not present");
        return;
      }
      d2.name = n2, d2.rtmp.running = this.isStreamingRunning((u2 = i2 == null ? void 0 : i2.rtmp) == null ? void 0 : u2.state), d2.rtmp.startedAt = L2((p2 = i2 == null ? void 0 : i2.rtmp) == null ? void 0 : p2.started_at), d2.rtmp.state = (h2 = i2 == null ? void 0 : i2.rtmp) == null ? void 0 : h2.state, d2.recording.server = this.getPeerListSFURecording(t2), d2.recording.browser = this.getPeerListBrowserRecording(t2), d2.recording.hls = this.getPeerListHLSRecording(t2), d2.hls = this.convertHls(i2 == null ? void 0 : i2.hls), d2.transcriptions = this.addTranscriptionDetail(r2), d2.sessionId = s2, d2.startedAt = L2(o2), (T = this.listener) == null || T.onRoomUpdate("RECORDING_STATE_UPDATED", d2);
    }
    addTranscriptionDetail(e) {
      return e ? e.map((t2) => ({ state: t2.state, mode: t2.mode, initialised_at: L2(t2.initialised_at), started_at: L2(t2.started_at), stopped_at: L2(t2.stopped_at), updated_at: L2(t2.updated_at), error: this.toSdkError(t2 == null ? void 0 : t2.error) })) : [];
    }
    isRecordingRunning(e) {
      return e ? !["none", "paused", "stopped", "failed"].includes(e) : false;
    }
    isStreamingRunning(e) {
      return e ? !["none", "stopped", "failed"].includes(e) : false;
    }
    initHLS(e) {
      let t2 = this.store.getRoom(), i2 = { running: true, variants: [] };
      return t2 ? (e != null && e.variants && e.variants.forEach((r2, s2) => {
        var o2, n2, d2;
        r2.state !== "initialised" ? i2.variants.push({ meetingURL: r2 == null ? void 0 : r2.meetingURL, url: r2 == null ? void 0 : r2.url, metadata: r2 == null ? void 0 : r2.metadata, playlist_type: r2 == null ? void 0 : r2.playlist_type, startedAt: L2((o2 = e == null ? void 0 : e.variants) == null ? void 0 : o2[s2].started_at), initialisedAt: L2((n2 = e == null ? void 0 : e.variants) == null ? void 0 : n2[s2].initialised_at), state: r2.state, stream_type: r2 == null ? void 0 : r2.stream_type }) : i2.variants.push({ initialisedAt: L2((d2 = e == null ? void 0 : e.variants) == null ? void 0 : d2[s2].initialised_at), url: "" });
      }), i2) : (l2.w(this.TAG, "on hls - room not present"), i2);
    }
    updateHLSStatus(e) {
      var r2;
      let t2 = this.store.getRoom(), i2 = e.variants && e.variants.length > 0 ? e.variants.some((s2) => this.isStreamingRunning(s2.state)) : false;
      if (!t2) {
        l2.w(this.TAG, "on hls - room not present");
        return;
      }
      e.enabled = i2, t2.hls = this.convertHls(e), (r2 = this.listener) == null || r2.onRoomUpdate("HLS_STREAMING_STATE_UPDATED", t2);
    }
    handleTranscriptionStatus(e) {
      var i2;
      let t2 = this.store.getRoom();
      if (!t2) {
        l2.w(this.TAG, "on transcription - room not present");
        return;
      }
      t2.transcriptions = this.addTranscriptionDetail(e) || [], (i2 = this.listener) == null || i2.onRoomUpdate("TRANSCRIPTION_STATE_UPDATED", t2);
    }
    convertHls(e) {
      var r2;
      if (e != null && e.variants && e.variants.length > 0 ? e.variants.some((s2) => s2.state === "initialised") : false) return this.initHLS(e);
      let i2 = { running: !!(e != null && e.enabled), variants: [], error: this.toSdkError(e == null ? void 0 : e.error) };
      return (r2 = e == null ? void 0 : e.variants) == null || r2.forEach((s2) => {
        i2.variants.push({ meetingURL: s2 == null ? void 0 : s2.meeting_url, url: s2 == null ? void 0 : s2.url, metadata: s2 == null ? void 0 : s2.metadata, playlist_type: s2 == null ? void 0 : s2.playlist_type, startedAt: L2(s2 == null ? void 0 : s2.started_at), initialisedAt: L2(s2 == null ? void 0 : s2.initialised_at), state: s2.state, stream_type: s2 == null ? void 0 : s2.stream_type });
      }), i2;
    }
    getHLSRecording(e) {
      var r2, s2;
      let t2 = { running: false }, i2 = this.isRecordingRunning(e == null ? void 0 : e.state);
      return (i2 || (e == null ? void 0 : e.state) === "paused") && (t2 = { running: i2, singleFilePerLayer: !!((r2 = e == null ? void 0 : e.hls_recording) != null && r2.single_file_per_layer), hlsVod: !!((s2 = e == null ? void 0 : e.hls_recording) != null && s2.hls_vod), startedAt: L2(e == null ? void 0 : e.started_at), initialisedAt: L2(e == null ? void 0 : e.initialised_at), state: e == null ? void 0 : e.state, error: this.toSdkError(e == null ? void 0 : e.error) }), t2;
    }
    getPeerListHLSRecording(e) {
      var r2, s2;
      let t2 = e == null ? void 0 : e.hls;
      return { running: this.isRecordingRunning(t2 == null ? void 0 : t2.state), startedAt: L2(t2 == null ? void 0 : t2.started_at), initialisedAt: L2(t2 == null ? void 0 : t2.initialised_at), state: t2 == null ? void 0 : t2.state, singleFilePerLayer: (r2 = t2 == null ? void 0 : t2.config) == null ? void 0 : r2.single_file_per_layer, hlsVod: (s2 = t2 == null ? void 0 : t2.config) == null ? void 0 : s2.hls_vod };
    }
    getPeerListBrowserRecording(e) {
      let t2 = e == null ? void 0 : e.browser;
      return { running: this.isRecordingRunning(t2 == null ? void 0 : t2.state), startedAt: L2(t2 == null ? void 0 : t2.started_at), state: t2 == null ? void 0 : t2.state };
    }
    getPeerListSFURecording(e) {
      let t2 = e == null ? void 0 : e.sfu;
      return { running: this.isRecordingRunning(t2 == null ? void 0 : t2.state), startedAt: L2(t2 == null ? void 0 : t2.started_at), state: t2 == null ? void 0 : t2.state };
    }
    updateRecordingStatus(e) {
      var s2;
      let t2 = this.store.getRoom(), i2 = this.isRecordingRunning(e.state);
      if (!t2) {
        l2.w(this.TAG, `set recording status running=${i2} - room not present`);
        return;
      }
      let r2;
      e.type === "sfu" ? (t2.recording.server = { running: i2, startedAt: i2 ? L2(e.started_at) : void 0, error: this.toSdkError(e.error), state: e.state }, r2 = "SERVER_RECORDING_STATE_UPDATED") : e.type === "HLS" ? (t2.recording.hls = this.getHLSRecording(e), r2 = "RECORDING_STATE_UPDATED") : (t2.recording.browser = { running: i2, startedAt: i2 ? L2(e.started_at) : void 0, error: this.toSdkError(e.error), state: e == null ? void 0 : e.state }, r2 = "BROWSER_RECORDING_STATE_UPDATED"), (s2 = this.listener) == null || s2.onRoomUpdate(r2, t2);
    }
    updateRTMPStatus(e) {
      var r2, s2;
      let t2 = this.store.getRoom(), i2 = this.isStreamingRunning(e.state);
      if (!t2) {
        l2.w(this.TAG, "on policy change - room not present");
        return;
      }
      if (!i2) {
        t2.rtmp = { running: i2, state: e.state, error: this.toSdkError(e.error) }, (r2 = this.listener) == null || r2.onRoomUpdate("RTMP_STREAMING_STATE_UPDATED", t2);
        return;
      }
      t2.rtmp = { running: i2, startedAt: i2 ? L2(e.started_at) : void 0, state: e.state, error: this.toSdkError(e.error) }, (s2 = this.listener) == null || s2.onRoomUpdate("RTMP_STREAMING_STATE_UPDATED", t2);
    }
    toSdkError(e) {
      if (!(e != null && e.code)) return;
      let t2 = e.message || "error in streaming/recording", i2 = new E2(e.code, "ServerErrors", "NONE", t2, t2);
      return l2.e(this.TAG, "error in streaming/recording", i2), i2;
    }
  };
  var ar = class {
    constructor(e, t2) {
      this.store = e;
      this.listener = t2;
    }
    handleNotification(e, t2) {
      e === "on-metadata-change" && this.handleMetadataChange(t2);
    }
    handleMetadataChange(e) {
      var i2;
      let t2 = e.values.map((r2) => ({ key: r2.key, value: r2.data, updatedAt: L2(r2.updated_at), updatedBy: r2.updated_by ? this.store.getPeerById(r2.updated_by) : void 0 }));
      (i2 = this.listener) == null || i2.onSessionStoreUpdate(t2);
    }
  };
  var or = class {
    constructor(e, t2, i2) {
      this.store = e;
      this.transport = t2;
      this.listener = i2;
    }
    handleNotification(e, t2) {
      switch (e) {
        case "on-whiteboard-update": {
          this.handleWhiteboardUpdate(t2);
          break;
        }
        default:
          break;
      }
    }
    handleWhiteboardUpdate(e) {
      return c2(this, null, function* () {
        var n2;
        let t2 = this.store.getLocalPeer(), i2 = this.store.getWhiteboard(e.id), r2 = e.owner === (t2 == null ? void 0 : t2.peerId) || e.owner === (t2 == null ? void 0 : t2.customerUserId), s2 = e.state === "open", o2 = { id: e.id, title: e.title, attributes: e.attributes };
        if (o2.open = r2 ? i2 == null ? void 0 : i2.open : s2, o2.owner = o2.open ? e.owner : void 0, o2.open) if (r2) o2.url = i2 == null ? void 0 : i2.url, o2.token = i2 == null ? void 0 : i2.token, o2.addr = i2 == null ? void 0 : i2.addr, o2.permissions = i2 == null ? void 0 : i2.permissions;
        else {
          let d2 = yield this.transport.signal.getWhiteboard({ id: e.id });
          o2.url = qt(d2.token, d2.addr, this.store.getEnv()), o2.token = d2.token, o2.addr = d2.addr, o2.permissions = d2.permissions, o2.open = d2.permissions.length > 0;
        }
        this.store.setWhiteboard(o2), (n2 = this.listener) == null || n2.onWhiteboardUpdate(o2);
      });
    }
  };
  var nr = class {
    constructor(e, t2, i2, r2, s2, o2) {
      this.store = e;
      this.transport = i2;
      this.listener = r2;
      this.audioListener = s2;
      this.connectionQualityListener = o2;
      this.TAG = "[HMSNotificationManager]";
      this.hasConsistentRoomStateArrived = false;
      this.ignoreNotification = (e2) => {
        if (e2 === "peer-list") this.hasConsistentRoomStateArrived = true;
        else if (e2 === "room-state") return this.hasConsistentRoomStateArrived;
        return false;
      };
      this.handleTrackAdd = (e2) => {
        this.trackManager.handleTrackAdd(e2);
      };
      this.handleTrackRemove = (e2) => {
        this.trackManager.handleTrackRemove(e2);
      };
      this.updateLocalPeer = ({ name: e2, metadata: t3 }) => {
        let i3 = this.store.getLocalPeer();
        this.peerManager.handlePeerInfoUpdate({ peer: i3, name: e2, data: t3 });
      };
      let n2 = this.transport.isFlagEnabled("onDemandTracks");
      this.trackManager = n2 ? new zi(this.store, t2, this.transport, this.listener) : new lt(this.store, t2, this.listener), this.peerManager = new Xi(this.store, this.trackManager, this.listener), this.peerListManager = new Yi(this.store, this.peerManager, this.trackManager, this.listener), this.broadcastManager = new Ji(this.listener), this.policyChangeManager = new Zi(this.store, t2), this.requestManager = new rr(this.store, this.listener), this.activeSpeakerManager = new ji(this.store, this.listener, this.audioListener), this.connectionQualityManager = new Qi(this.store, this.connectionQualityListener), this.roomUpdateManager = new sr(this.store, this.listener), this.sessionMetadataManager = new ar(this.store, this.listener), this.pollsManager = new ir(this.store, this.transport, this.listener), this.whiteboardManager = new or(this.store, this.transport, this.listener);
    }
    setListener(e) {
      this.listener = e, this.trackManager.listener = e, this.peerManager.listener = e, this.peerListManager.listener = e, this.broadcastManager.listener = e, this.requestManager.listener = e, this.activeSpeakerManager.listener = e, this.roomUpdateManager.listener = e, this.sessionMetadataManager.listener = e, this.pollsManager.listener = e, this.whiteboardManager.listener = e;
    }
    setAudioListener(e) {
      this.audioListener = e, this.activeSpeakerManager.audioListener = e;
    }
    setConnectionQualityListener(e) {
      this.connectionQualityListener = e, this.connectionQualityManager.listener = e;
    }
    handleNotification(e, t2 = false) {
      var s2, o2;
      let i2 = e.method, r2 = e.params;
      ["active-speakers", "sfu-stats", "on-connection-quality-update", void 0].includes(i2) || l2.d(this.TAG, `Received notification - ${i2}`, { notification: r2 }), i2 === "sfu-stats" && (s2 = window.HMS) != null && s2.ON_SFU_STATS && typeof ((o2 = window.HMS) == null ? void 0 : o2.ON_SFU_STATS) == "function" && window.HMS.ON_SFU_STATS(e.params), !this.ignoreNotification(i2) && (this.roomUpdateManager.handleNotification(i2, r2), this.peerManager.handleNotification(i2, r2), this.requestManager.handleNotification(i2, r2), this.peerListManager.handleNotification(i2, r2, t2), this.broadcastManager.handleNotification(i2, r2), this.sessionMetadataManager.handleNotification(i2, r2), this.pollsManager.handleNotification(i2, r2), this.whiteboardManager.handleNotification(i2, r2), this.handleIsolatedMethods(i2, r2));
    }
    handleIsolatedMethods(e, t2) {
      switch (e) {
        case "on-track-add": {
          this.trackManager.handleTrackMetadataAdd(t2);
          break;
        }
        case "on-track-update": {
          this.trackManager.handleTrackUpdate(t2);
          break;
        }
        case "on-track-remove": {
          if (!t2.peer) {
            l2.d(this.TAG, `Ignoring sfu notification - ${e}`, { notification: t2 });
            return;
          }
          this.trackManager.handleTrackRemovedPermanently(t2);
          break;
        }
        case "on-track-layer-update": {
          this.trackManager.handleTrackLayerUpdate(t2);
          break;
        }
        case "active-speakers":
          this.activeSpeakerManager.handleActiveSpeakers(t2);
          break;
        case "on-connection-quality-update":
          this.connectionQualityManager.handleQualityUpdate(t2);
          break;
        case "on-policy-change":
          this.policyChangeManager.handlePolicyChange(t2);
          break;
        case "node-info":
          this.transport.setSFUNodeId(t2.sfu_node_id);
          break;
        default:
          break;
      }
    }
  };
  var cr = class {
    constructor(e) {
      this.transport = e;
      this.observedKeys = /* @__PURE__ */ new Set();
    }
    get(e) {
      return c2(this, null, function* () {
        let { data: t2, updated_at: i2 } = yield this.transport.signal.getSessionMetadata(e);
        return { value: t2, updatedAt: L2(i2) };
      });
    }
    set(e, t2) {
      return c2(this, null, function* () {
        let { data: i2, updated_at: r2 } = yield this.transport.signal.setSessionMetadata({ key: e, data: t2 }), s2 = L2(r2);
        return { value: i2, updatedAt: s2 };
      });
    }
    observe(e) {
      return c2(this, null, function* () {
        let t2 = new Set(this.observedKeys);
        if (e.forEach((i2) => this.observedKeys.add(i2)), this.observedKeys.size !== t2.size) try {
          yield this.transport.signal.listenMetadataChange(Array.from(this.observedKeys));
        } catch (i2) {
          throw this.observedKeys = t2, i2;
        }
      });
    }
    unobserve(e) {
      return c2(this, null, function* () {
        let t2 = new Set(this.observedKeys);
        if (this.observedKeys = new Set([...this.observedKeys].filter((i2) => !e.includes(i2))), this.observedKeys.size !== t2.size) try {
          yield this.transport.signal.listenMetadataChange(Array.from(this.observedKeys));
        } catch (i2) {
          throw this.observedKeys = t2, i2;
        }
      });
    }
  };
  var dr = class {
    constructor(e, t2, i2 = "", r2 = "", s2 = "https://prod-init.100ms.live/init", o2 = false, n2) {
      this.authToken = e;
      this.peerId = t2;
      this.peerName = i2;
      this.data = r2;
      this.endpoint = s2;
      this.autoSubscribeVideo = o2;
      this.iceServers = n2;
    }
  };
  var j2 = ((s2) => (s2[s2.ConnectFailed = 0] = "ConnectFailed", s2[s2.SignalDisconnect = 1] = "SignalDisconnect", s2[s2.JoinWSMessageFailed = 2] = "JoinWSMessageFailed", s2[s2.PublishIceConnectionFailed = 3] = "PublishIceConnectionFailed", s2[s2.SubscribeIceConnectionFailed = 4] = "SubscribeIceConnectionFailed", s2))(j2 || {});
  var za = { 0: [], 1: [], 2: [1], 3: [1], 4: [1] };
  var lr = ((n2) => (n2.Disconnected = "Disconnected", n2.Connecting = "Connecting", n2.Joined = "Joined", n2.Preview = "Preview", n2.Failed = "Failed", n2.Reconnecting = "Reconnecting", n2.Leaving = "Leaving", n2))(lr || {});
  var ur = class {
    constructor(e) {
      this.promise = new Promise((t2, i2) => {
        this.resolve = t2, this.reject = i2, e(t2, i2);
      });
    }
  };
  var pr = class {
    constructor(e, t2) {
      this.onStateChange = e;
      this.sendEvent = t2;
      this.TAG = "[RetryScheduler]";
      this.inProgress = /* @__PURE__ */ new Map();
      this.retryTaskIds = [];
    }
    schedule(n2) {
      return c2(this, arguments, function* ({ category: e, error: t2, task: i2, originalState: r2, maxRetryTime: s2 = 6e4, changeState: o2 = true }) {
        yield this.scheduleTask({ category: e, error: t2, changeState: o2, task: i2, originalState: r2, maxRetryTime: s2, failedAt: Date.now() });
      });
    }
    reset() {
      this.retryTaskIds.forEach((e) => clearTimeout(e)), this.retryTaskIds = [], this.inProgress.clear();
    }
    isTaskInProgress(e) {
      return !!this.inProgress.get(e);
    }
    scheduleTask(u2) {
      return c2(this, arguments, function* ({ category: e, error: t2, changeState: i2, task: r2, originalState: s2, failedAt: o2, maxRetryTime: n2 = 6e4, failedRetryCount: d2 = 0 }) {
        if (l2.d(this.TAG, "schedule: ", { category: j2[e], error: t2 }), d2 === 0) {
          let v2 = this.inProgress.get(e);
          if (v2) {
            l2.d(this.TAG, `schedule: Already a task for ${j2[e]} scheduled, waiting for its completion`), yield v2.promise;
            return;
          }
          let R2 = new ur(($, ue) => {
          });
          this.inProgress.set(e, R2), this.sendEvent(t2, e);
        }
        let p2 = false, h2 = za[e];
        for (let v2 in h2) {
          let R2 = h2[parseInt(v2)];
          try {
            let $ = this.inProgress.get(R2);
            $ && (l2.d(this.TAG, `schedule: Suspending retry task of ${j2[e]}, waiting for ${j2[R2]} to recover`), yield $.promise, l2.d(this.TAG, `schedule: Resuming retry task ${j2[e]} as it's dependency ${j2[R2]} is recovered`));
          } catch ($) {
            l2.d(this.TAG, `schedule: Stopping retry task of ${j2[e]} as it's dependency ${j2[R2]} failed to recover`), p2 = true;
            break;
          }
        }
        let T = (v2) => {
          if (this.inProgress.delete(e), this.sendEvent(v2, e), this.reset(), i2) this.onStateChange("Failed", v2);
          else throw v2;
        }, g2 = Date.now() - o2;
        if (g2 >= n2 || p2) return t2.description += `. [${j2[e]}] Could not recover after ${g2} milliseconds`, p2 && (t2.description += ` Could not recover all of it's required dependencies - [${h2.map((v2) => j2[v2]).toString()}]`), t2.isTerminal = true, T(t2);
        i2 && this.onStateChange("Reconnecting", t2);
        let f2 = this.getDelayForRetryCount(e);
        l2.d(this.TAG, `schedule: [${j2[e]}] [failedRetryCount=${d2}] Scheduling retry task in ${f2}ms`);
        let P2;
        try {
          P2 = yield this.setTimeoutPromise(r2, f2);
        } catch (v2) {
          P2 = false;
          let R2 = v2;
          if (R2.isTerminal) return l2.e(this.TAG, `[${j2[e]}] Un-caught terminal exception ${R2.name} in retry-task`, v2), T(R2);
          l2.w(this.TAG, `[${j2[e]}] Un-caught exception ${R2.name} in retry-task, initiating retry`, v2);
        }
        if (P2) {
          let v2 = this.inProgress.get(e);
          this.inProgress.delete(e), v2 == null || v2.resolve(d2), i2 && this.inProgress.size === 0 && this.onStateChange(s2), l2.d(this.TAG, `schedule: [${j2[e]}] [failedRetryCount=${d2}] Recovered \u267B\uFE0F after ${g2}ms`);
        } else yield this.scheduleTask({ category: e, error: t2, changeState: i2, task: r2, originalState: s2, maxRetryTime: n2, failedAt: o2, failedRetryCount: d2 + 1 });
      });
    }
    getDelayForRetryCount(e) {
      let t2 = e === 2 ? Math.random() * 2 : Math.random(), i2 = 0;
      return e === 2 ? i2 = 2 + t2 : e === 1 && (i2 = 1), i2 * 1e3;
    }
    setTimeoutPromise(e, t2) {
      return c2(this, null, function* () {
        return new Promise((i2, r2) => {
          let s2 = window.setTimeout(() => c2(this, null, function* () {
            try {
              let o2 = yield e();
              o2 && this.retryTaskIds.splice(this.retryTaskIds.indexOf(s2), 1), i2(o2);
            } catch (o2) {
              r2(o2);
            }
          }), t2);
          this.retryTaskIds.push(s2);
        });
      });
    }
  };
  var hr = class extends Oe {
    constructor() {
      super(100);
      this.localStorage = new ve("hms-analytics");
      this.localStorage.clear(), this.initLocalStorageQueue();
    }
    enqueue(t2) {
      super.enqueue(t2), this.localStorage.set(this.storage);
    }
    dequeue() {
      let t2 = super.dequeue();
      return this.localStorage.set(this.storage), t2;
    }
    initLocalStorageQueue() {
      var t2;
      (t2 = this.localStorage.get()) == null || t2.forEach((i2) => {
        let r2 = new C(i2);
        super.enqueue(r2);
      });
    }
  };
  var mr = class {
    constructor() {
      this.TAG = "[AnalyticsTransport]";
      this.eventCount = 0;
      this.lastResetTime = Date.now();
      this.MAX_EVENTS_PER_MINUTE = 200;
      this.RESET_INTERVAL_MS = 6e4;
    }
    checkRateLimit() {
      let e = Date.now();
      if (e - this.lastResetTime >= this.RESET_INTERVAL_MS && (this.eventCount = 0, this.lastResetTime = e), this.eventCount >= this.MAX_EVENTS_PER_MINUTE) throw new Error("Too many events being sent, please check the implementation.");
      this.eventCount++;
    }
    sendEvent(e) {
      try {
        this.checkRateLimit();
      } catch (t2) {
        throw l2.w(this.TAG, "Rate limit exceeded", t2), t2;
      }
      try {
        this.sendSingleEvent(e), this.flushFailedEvents();
      } catch (t2) {
        l2.w(this.TAG, "sendEvent failed", t2);
      }
    }
    flushFailedEvents(e) {
      var t2;
      try {
        for (l2.d(this.TAG, "Flushing failed events", this.failedEvents); this.failedEvents.size() > 0; ) {
          let i2 = this.failedEvents.dequeue();
          i2 && (((t2 = i2.metadata) == null ? void 0 : t2.peer.peer_id) === e || !i2.metadata.peer.peer_id ? this.sendSingleEvent(i2) : He.sendEvent(i2));
        }
      } catch (i2) {
        l2.w(this.TAG, "flushFailedEvents failed", i2);
      }
    }
    sendSingleEvent(e) {
      try {
        this.transportProvider.sendEvent(e), l2.d(this.TAG, "Sent event", e.name, e);
      } catch (t2) {
        throw l2.w(this.TAG, `${this.transportProvider.TAG}.sendEvent failed, adding to local storage events`, { event: e, error: t2 }), this.failedEvents.enqueue(e), t2;
      }
    }
  };
  var Sr = class extends mr {
    constructor(t2) {
      super();
      this.transportProvider = t2;
      this.failedEvents = new hr();
    }
  };
  var ut = class {
    constructor(e, t2, i2, r2) {
      this.store = e;
      this.eventBus = t2;
      this.sampleWindowSize = i2;
      this.pushInterval = r2;
      this.shouldSendEvent = false;
      this.sequenceNum = 1;
      this.stop = () => {
        this.shouldSendEvent && this.sendEvent(), this.eventBus.statsUpdate.unsubscribe(this.handleStatsUpdate.bind(this)), this.shouldSendEvent = false;
      };
      this.start();
    }
    start() {
      this.shouldSendEvent || (this.stop(), this.shouldSendEvent = true, this.eventBus.statsUpdate.subscribe(this.handleStatsUpdate.bind(this)), this.startLoop().catch((e) => l2.e("[StatsAnalytics]", e.message)));
    }
    startLoop() {
      return c2(this, null, function* () {
        for (; this.shouldSendEvent; ) yield Q2(this.pushInterval * 1e3), this.sendEvent();
      });
    }
    sendEvent() {
      this.trackAnalytics.forEach((e) => {
        e.clearSamples();
      });
    }
    cleanTrackAnalyticsAndCreateSample(e) {
      this.trackAnalytics.forEach((t2) => {
        !this.store.hasTrack(t2.track) && !(t2.samples.length > 0) && this.trackAnalytics.delete(t2.track_id);
      }), e && this.trackAnalytics.forEach((t2) => {
        t2.createSample();
      });
    }
  };
  var pt = class {
    constructor({ track: e, ssrc: t2, rid: i2, kind: r2, sampleWindowSize: s2 }) {
      this.samples = [];
      this.tempStats = [];
      this.track = e, this.ssrc = t2, this.rid = i2, this.kind = r2, this.track_id = this.track.trackId, this.source = this.track.source, this.sampleWindowSize = s2;
    }
    pushTempStat(e) {
      this.tempStats.push(e);
    }
    createSample() {
      this.tempStats.length !== 0 && (this.samples.push(this.collateSample()), this.prevLatestStat = this.getLatestStat(), this.tempStats.length = 0);
    }
    clearSamples() {
      this.samples.length = 0;
    }
    getLatestStat() {
      return this.tempStats[this.tempStats.length - 1];
    }
    getFirstStat() {
      return this.tempStats[0];
    }
    calculateSum(e) {
      if (typeof this.getLatestStat()[e] == "number") return this.tempStats.reduce((i2, r2) => i2 + (r2[e] || 0), 0);
    }
    calculateAverage(e, t2 = true) {
      let i2 = this.calculateSum(e), r2 = i2 !== void 0 ? i2 / this.tempStats.length : void 0;
      return r2 ? t2 ? Math.round(r2) : r2 : void 0;
    }
    calculateDifferenceForSample(e) {
      var r2;
      let t2 = Number((r2 = this.prevLatestStat) == null ? void 0 : r2[e]) || 0;
      return (Number(this.getLatestStat()[e]) || 0) - t2;
    }
    calculateDifferenceAverage(e, t2 = true) {
      let i2 = this.calculateDifferenceForSample(e) / this.tempStats.length;
      return t2 ? Math.round(i2) : i2;
    }
    calculateInstancesOfHigh(e, t2) {
      if (typeof this.getLatestStat()[e] == "number") return this.tempStats.reduce((r2, s2) => r2 + ((s2[e] || 0) > t2 ? 1 : 0), 0);
    }
  };
  var gr = (a10, e) => a10 && e && (a10.frameWidth !== e.frameWidth || a10.frameHeight !== e.frameHeight);
  var Tr = (a10, e) => a10 && e && a10.enabled !== e.enabled;
  var Jt = (a10) => Object.entries(a10).filter(([, e]) => e !== void 0).reduce((e, [t2, i2]) => (e[t2] = i2, e), {});
  var Qt = class extends ut {
    constructor() {
      super(...arguments);
      this.trackAnalytics = /* @__PURE__ */ new Map();
    }
    toAnalytics() {
      var r2, s2;
      let t2 = [], i2 = [];
      return this.trackAnalytics.forEach((o2) => {
        o2.track.type === "audio" ? t2.push(o2.toAnalytics()) : o2.track.type === "video" && i2.push(o2.toAnalytics());
      }), { audio: t2, video: i2, joined_at: (s2 = (r2 = this.store.getRoom()) == null ? void 0 : r2.joinedAt) == null ? void 0 : s2.getTime(), sequence_num: this.sequenceNum++, max_window_sec: 30 };
    }
    sendEvent() {
      this.eventBus.analytics.publish(y2.publishStats(this.toAnalytics())), super.sendEvent();
    }
    handleStatsUpdate(t2) {
      let i2 = false, r2 = t2.getLocalTrackStats();
      Object.keys(r2).forEach((s2) => {
        let o2 = r2[s2], n2 = this.store.getLocalPeerTracks().find((d2) => d2.getTrackIDBeingSent() === s2);
        Object.keys(o2).forEach((d2) => {
          var g2, f2, P2;
          let u2 = o2[d2];
          if (!n2) return;
          let p2 = this.getTrackIdentifier(n2.trackId, u2), h2 = M2(m({}, u2), { availableOutgoingBitrate: (f2 = (g2 = t2.getLocalPeerStats()) == null ? void 0 : g2.publish) == null ? void 0 : f2.availableOutgoingBitrate });
          if (p2 && this.trackAnalytics.has(p2)) (P2 = this.trackAnalytics.get(p2)) == null || P2.pushTempStat(h2);
          else if (n2) {
            let v2 = new cs({ track: n2, sampleWindowSize: this.sampleWindowSize, rid: u2.rid, ssrc: u2.ssrc.toString(), kind: u2.kind });
            v2.pushTempStat(h2), this.trackAnalytics.set(this.getTrackIdentifier(n2.trackId, u2), v2);
          }
          let T = this.trackAnalytics.get(p2);
          T != null && T.shouldCreateSample() && (i2 = true);
        });
      }), this.cleanTrackAnalyticsAndCreateSample(i2);
    }
    getTrackIdentifier(t2, i2) {
      return i2.rid ? `${t2}:${i2.rid}` : t2;
    }
  };
  var cs = class extends pt {
    constructor() {
      super(...arguments);
      this.samples = [];
      this.collateSample = () => {
        let t2 = this.getLatestStat(), i2 = t2.qualityLimitationDurations, r2 = i2 && { bandwidth_sec: i2.bandwidth, cpu_sec: i2.cpu, other_sec: i2.other }, s2 = t2.frameHeight ? { height_px: this.getLatestStat().frameHeight, width_px: this.getLatestStat().frameWidth } : void 0, o2 = this.calculateAverage("jitter", false), n2 = o2 ? Math.round(o2 * 1e3) : void 0, d2 = this.calculateAverage("roundTripTime", false), u2 = d2 ? Math.round(d2 * 1e3) : void 0;
        return Jt({ timestamp: Date.now(), avg_available_outgoing_bitrate_bps: this.calculateAverage("availableOutgoingBitrate"), avg_bitrate_bps: this.calculateAverage("bitrate"), avg_fps: this.calculateAverage("framesPerSecond"), total_packets_lost: this.getLatestStat().packetsLost, total_packets_sent: this.getLatestStat().packetsSent, total_packet_sent_delay_sec: parseFloat(this.calculateDifferenceForSample("totalPacketSendDelay").toFixed(4)), total_fir_count: this.calculateDifferenceForSample("firCount"), total_pli_count: this.calculateDifferenceForSample("pliCount"), total_nack_count: this.calculateDifferenceForSample("nackCount"), avg_jitter_ms: n2, avg_round_trip_time_ms: u2, total_quality_limitation: r2, resolution: s2 });
      };
      this.shouldCreateSample = () => {
        let t2 = this.tempStats.length, i2 = this.tempStats[t2 - 1], r2 = this.tempStats[t2 - 2];
        return t2 === 30 || Tr(i2, r2) || i2.kind === "video" && gr(i2, r2);
      };
      this.toAnalytics = () => ({ track_id: this.track_id, ssrc: this.ssrc, source: this.source, rid: this.rid, samples: this.samples });
    }
  };
  var zt = class extends ut {
    constructor() {
      super(...arguments);
      this.trackAnalytics = /* @__PURE__ */ new Map();
    }
    toAnalytics() {
      var r2, s2;
      let t2 = [], i2 = [];
      return this.trackAnalytics.forEach((o2) => {
        o2.track.type === "audio" ? t2.push(o2.toAnalytics()) : o2.track.type === "video" && i2.push(o2.toAnalytics());
      }), { audio: t2, video: i2, joined_at: (s2 = (r2 = this.store.getRoom()) == null ? void 0 : r2.joinedAt) == null ? void 0 : s2.getTime(), sequence_num: this.sequenceNum++, max_window_sec: 10 };
    }
    sendEvent() {
      this.eventBus.analytics.publish(y2.subscribeStats(this.toAnalytics())), super.sendEvent();
    }
    handleStatsUpdate(t2) {
      let i2 = t2.getAllRemoteTracksStats(), r2 = false;
      Object.keys(i2).forEach((s2) => {
        var f2, P2;
        let o2 = this.store.getTrackById(s2), n2 = i2[s2], d2 = (f2 = this.trackAnalytics.get(s2)) == null ? void 0 : f2.getLatestStat(), p2 = ((v2, R2) => {
          let $ = (R2 == null ? void 0 : R2.jitterBufferDelay) || 0, ue = (R2 == null ? void 0 : R2.jitterBufferEmittedCount) || 0, Te = ((v2 == null ? void 0 : v2.jitterBufferDelay) || 0) - $, pe = ((v2 == null ? void 0 : v2.jitterBufferEmittedCount) || 0) - ue;
          return pe > 0 ? Te * 1e3 / pe : (R2 == null ? void 0 : R2.calculatedJitterBufferDelay) || 0;
        })(n2, d2), h2 = this.calculateAvSyncForStat(n2, t2), T = M2(m({}, n2), { calculatedJitterBufferDelay: p2, avSync: h2 });
        if (n2.kind === "video") {
          let v2 = o2.getPreferredLayerDefinition();
          T.expectedFrameHeight = v2 == null ? void 0 : v2.resolution.height, T.expectedFrameWidth = v2 == null ? void 0 : v2.resolution.width;
        }
        if (this.trackAnalytics.has(s2)) (P2 = this.trackAnalytics.get(s2)) == null || P2.pushTempStat(T);
        else if (o2) {
          let v2 = new ls({ track: o2, sampleWindowSize: this.sampleWindowSize, ssrc: n2.ssrc.toString(), kind: n2.kind });
          v2.pushTempStat(T), this.trackAnalytics.set(s2, v2);
        }
        let g2 = this.trackAnalytics.get(s2);
        g2 != null && g2.shouldCreateSample() && (r2 = true);
      }), this.cleanTrackAnalyticsAndCreateSample(r2);
    }
    calculateAvSyncForStat(t2, i2) {
      if (!t2.peerID || !t2.estimatedPlayoutTimestamp || t2.kind !== "video") return;
      let r2 = this.store.getPeerById(t2.peerID), s2 = r2 == null ? void 0 : r2.audioTrack, o2 = r2 == null ? void 0 : r2.videoTrack;
      if (!(s2 && o2 && s2.enabled && o2.enabled)) return Rt;
      let d2 = i2.getRemoteTrackStats(s2.trackId);
      if (!d2) return Rt;
      if (d2.estimatedPlayoutTimestamp) return d2.estimatedPlayoutTimestamp - t2.estimatedPlayoutTimestamp;
    }
  };
  var ls = class extends pt {
    constructor() {
      super(...arguments);
      this.samples = [];
      this.collateSample = () => {
        let t2 = this.getLatestStat(), i2 = this.getFirstStat(), r2 = { timestamp: Date.now(), total_pli_count: this.calculateDifferenceForSample("pliCount"), total_nack_count: this.calculateDifferenceForSample("nackCount"), avg_jitter_buffer_delay: this.calculateAverage("calculatedJitterBufferDelay", false) };
        if (t2.kind === "video") return Jt(M2(m({}, r2), { avg_av_sync_ms: this.calculateAvgAvSyncForSample(), avg_frames_received_per_sec: this.calculateDifferenceAverage("framesReceived"), avg_frames_dropped_per_sec: this.calculateDifferenceAverage("framesDropped"), avg_frames_decoded_per_sec: this.calculateDifferenceAverage("framesDecoded"), frame_width: this.calculateAverage("frameWidth"), frame_height: this.calculateAverage("frameHeight"), expected_frame_width: this.calculateAverage("expectedFrameWidth"), expected_frame_height: this.calculateAverage("expectedFrameHeight"), pause_count: this.calculateDifferenceForSample("pauseCount"), pause_duration_seconds: this.calculateDifferenceForSample("totalPausesDuration"), freeze_count: this.calculateDifferenceForSample("freezeCount"), freeze_duration_seconds: this.calculateDifferenceForSample("totalFreezesDuration") }));
        {
          let s2 = (t2.concealedSamples || 0) - (t2.silentConcealedSamples || 0) - ((i2.concealedSamples || 0) - (i2.silentConcealedSamples || 0));
          return Jt(M2(m({}, r2), { audio_level: this.calculateInstancesOfHigh("audioLevel", 0.05), audio_concealed_samples: s2, audio_total_samples_received: this.calculateDifferenceForSample("totalSamplesReceived"), audio_concealment_events: this.calculateDifferenceForSample("concealmentEvents"), fec_packets_discarded: this.calculateDifferenceForSample("fecPacketsDiscarded"), fec_packets_received: this.calculateDifferenceForSample("fecPacketsReceived"), total_samples_duration: this.calculateDifferenceForSample("totalSamplesDuration"), total_packets_received: this.calculateDifferenceForSample("packetsReceived"), total_packets_lost: this.calculateDifferenceForSample("packetsLost") }));
        }
      };
      this.shouldCreateSample = () => {
        let t2 = this.tempStats.length, i2 = this.tempStats[t2 - 1], r2 = this.tempStats[t2 - 2];
        return t2 === 10 || Tr(i2, r2) || i2.kind === "video" && gr(i2, r2);
      };
      this.toAnalytics = () => ({ track_id: this.track_id, ssrc: this.ssrc, source: this.source, rid: this.rid, samples: this.samples });
    }
    calculateAvgAvSyncForSample() {
      let i2 = this.tempStats.map((r2) => r2.avSync).filter((r2) => r2 !== void 0 && r2 !== Rt);
      return i2.length === 0 ? Rt : i2.reduce((r2, s2) => r2 + s2, 0) / i2.length;
    }
  };
  var ht = ((t2) => (t2[t2.Publish = 0] = "Publish", t2[t2.Subscribe = 1] = "Subscribe", t2))(ht || {});
  function Ya(a10, e) {
    var r2;
    let t2 = Yt.parse(a10.sdp);
    if (!((r2 = t2.origin) != null && r2.username.startsWith("mozilla"))) return a10;
    let i2 = e ? Array.from(e.values()) : [];
    return t2.media.forEach((s2) => {
      var d2, u2, p2;
      let o2 = (d2 = s2.msid) == null ? void 0 : d2.split(" ")[0], n2 = (u2 = i2.find((h2) => h2.type === s2.type && h2.stream_id === o2)) == null ? void 0 : u2.track_id;
      n2 && (s2.msid = (p2 = s2.msid) == null ? void 0 : p2.replace(/\s(.+)/, ` ${n2}`));
    }), { type: a10.type, sdp: Yt.write(t2) };
  }
  function Xa(a10, e) {
    var s2;
    if (!(a10 != null && a10.sdp) || !e) return;
    let i2 = Yt.parse(a10.sdp).media.find((o2) => he(o2.mid) && parseInt(o2.mid) === parseInt(e));
    return (s2 = i2 == null ? void 0 : i2.msid) == null ? void 0 : s2.split(" ")[1];
  }
  function Za(a10) {
    return a10.sdp.includes("usedtx=1") ? a10 : { type: a10.type, sdp: a10.sdp.replace("useinbandfec=1", "useinbandfec=1;usedtx=1") };
  }
  var Ce = "[HMSConnection]";
  var Qe = class {
    constructor(e, t2) {
      this.candidates = new Array();
      this.role = e, this.signal = t2;
    }
    get iceConnectionState() {
      return this.nativeConnection.iceConnectionState;
    }
    get connectionState() {
      return this.nativeConnection.connectionState;
    }
    get action() {
      return this.role === 0 ? "PUBLISH" : "SUBSCRIBE";
    }
    setSfuNodeId(e) {
      this.sfuNodeId = e;
    }
    addTransceiver(e, t2) {
      return this.nativeConnection.addTransceiver(e, t2);
    }
    createOffer(e, t2) {
      return c2(this, null, function* () {
        try {
          let i2 = yield this.nativeConnection.createOffer(t2);
          return l2.d(Ce, `[role=${this.role}] createOffer offer=${JSON.stringify(i2, null, 1)}`), Za(Ya(i2, e));
        } catch (i2) {
          throw S2.WebrtcErrors.CreateOfferFailed(this.action, i2.message);
        }
      });
    }
    createAnswer(e = void 0) {
      return c2(this, null, function* () {
        try {
          let t2 = yield this.nativeConnection.createAnswer(e);
          return l2.d(Ce, `[role=${this.role}] createAnswer answer=${JSON.stringify(t2, null, 1)}`), t2;
        } catch (t2) {
          throw S2.WebrtcErrors.CreateAnswerFailed(this.action, t2.message);
        }
      });
    }
    setLocalDescription(e) {
      return c2(this, null, function* () {
        try {
          l2.d(Ce, `[role=${this.role}] setLocalDescription description=${JSON.stringify(e, null, 1)}`), yield this.nativeConnection.setLocalDescription(e);
        } catch (t2) {
          throw S2.WebrtcErrors.SetLocalDescriptionFailed(this.action, t2.message);
        }
      });
    }
    setRemoteDescription(e) {
      return c2(this, null, function* () {
        try {
          l2.d(Ce, `[role=${this.role}] setRemoteDescription description=${JSON.stringify(e, null, 1)}`), yield this.nativeConnection.setRemoteDescription(e);
        } catch (t2) {
          throw S2.WebrtcErrors.SetRemoteDescriptionFailed(this.action, t2.message);
        }
      });
    }
    addIceCandidate(e) {
      return c2(this, null, function* () {
        if (this.nativeConnection.signalingState === "closed") {
          l2.d(Ce, `[role=${this.role}] addIceCandidate signalling state closed`);
          return;
        }
        l2.d(Ce, `[role=${this.role}] addIceCandidate candidate=${JSON.stringify(e, null, 1)}`), yield this.nativeConnection.addIceCandidate(e);
      });
    }
    get remoteDescription() {
      return this.nativeConnection.remoteDescription;
    }
    getSenders() {
      return this.nativeConnection.getSenders();
    }
    handleSelectedIceCandidatePairs() {
      try {
        (this.role === 0 ? this.getSenders() : this.getReceivers()).forEach((t2) => {
          var r2;
          let i2 = (r2 = t2.track) == null ? void 0 : r2.kind;
          if (t2.transport) {
            let s2 = t2.transport.iceTransport, o2 = () => {
              typeof s2.getSelectedCandidatePair == "function" && (this.selectedCandidatePair = s2.getSelectedCandidatePair(), this.selectedCandidatePair && (this.observer.onSelectedCandidatePairChange(this.selectedCandidatePair), l2.d(Ce, `${ht[this.role]} connection`, `selected ${i2 || "unknown"} candidate pair`, JSON.stringify(this.selectedCandidatePair, null, 2))));
            };
            typeof s2.onselectedcandidatepairchange == "function" && (s2.onselectedcandidatepairchange = o2), o2();
          }
        });
      } catch (e) {
        l2.w(Ce, `Error in logging selected ice candidate pair for ${ht[this.role]} connection`, e);
      }
    }
    removeTrack(e) {
      this.nativeConnection.signalingState !== "closed" && this.nativeConnection.removeTrack(e);
    }
    setMaxBitrateAndFramerate(e, t2) {
      return c2(this, null, function* () {
        let i2 = (t2 == null ? void 0 : t2.maxBitrate) || e.settings.maxBitrate, r2 = e instanceof G2 && e.settings.maxFramerate, s2 = this.getSenders().find((o2) => {
          var n2;
          return ((n2 = o2 == null ? void 0 : o2.track) == null ? void 0 : n2.id) === e.getTrackIDBeingSent();
        });
        if (s2) {
          let o2 = s2.getParameters();
          o2.encodings.length === 1 && (i2 && (o2.encodings[0].maxBitrate = i2 * 1e3), r2 && (o2.encodings[0].maxFramerate = r2)), yield s2.setParameters(o2);
        } else l2.w(Ce, `no sender found to setMaxBitrate for track - ${e.trackId}, sentTrackId - ${e.getTrackIDBeingSent()}`);
      });
    }
    getStats() {
      return c2(this, null, function* () {
        return yield this.nativeConnection.getStats();
      });
    }
    close() {
      this.nativeConnection.close();
    }
    getReceivers() {
      return this.nativeConnection.getReceivers();
    }
  };
  var Xt = class extends Qe {
    constructor(t2, i2, r2) {
      super(0, t2);
      this.TAG = "[HMSPublishConnection]";
      this.observer = r2, this.nativeConnection = new RTCPeerConnection(i2), this.channel = this.nativeConnection.createDataChannel(vi, { protocol: "SCTP" }), this.channel.onerror = (s2) => l2.e(this.TAG, `publish data channel onerror ${s2}`, s2), this.nativeConnection.onicecandidate = ({ candidate: s2 }) => {
        s2 && (this.observer.onIceCandidate(s2), t2.trickle(this.role, s2));
      }, this.nativeConnection.oniceconnectionstatechange = () => {
        this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
      }, this.nativeConnection.onconnectionstatechange = () => {
        this.observer.onConnectionStateChange(this.nativeConnection.connectionState), this.nativeConnection.sctp && (this.nativeConnection.sctp.transport.onstatechange = () => {
          var s2;
          this.observer.onDTLSTransportStateChange((s2 = this.nativeConnection.sctp) == null ? void 0 : s2.transport.state);
        }, this.nativeConnection.sctp.transport.onerror = (s2) => {
          var o2;
          this.observer.onDTLSTransportError(new Error((o2 = s2 == null ? void 0 : s2.error) == null ? void 0 : o2.errorDetail) || "DTLS Transport failed");
        });
      };
    }
    close() {
      super.close(), this.channel.close();
    }
    initAfterJoin() {
      this.nativeConnection.onnegotiationneeded = () => c2(this, null, function* () {
        l2.d(this.TAG, "onnegotiationneeded"), yield this.observer.onRenegotiationNeeded();
      });
    }
  };
  var Zt = class {
    constructor(e, t2, i2 = "") {
      this.TAG = "[HMSDataChannel]";
      this.nativeChannel = e, this.observer = t2, this.metadata = i2, e.onmessage = (r2) => {
        this.observer.onMessage(r2.data);
      };
    }
    get id() {
      return this.nativeChannel.id;
    }
    get label() {
      return this.nativeChannel.label;
    }
    get readyState() {
      return this.nativeChannel.readyState;
    }
    send(e) {
      l2.d(this.TAG, `[${this.metadata}] Sending [size=${e.length}] message=${e}`), this.nativeChannel.send(e);
    }
    close() {
      this.nativeChannel.close();
    }
  };
  var ei = class extends Qe {
    constructor(t2, i2, r2, s2) {
      super(1, t2);
      this.isFlagEnabled = r2;
      this.TAG = "[HMSSubscribeConnection]";
      this.remoteStreams = /* @__PURE__ */ new Map();
      this.MAX_RETRIES = 3;
      this.pendingMessageQueue = [];
      this.eventEmitter = new import_eventemitter24.default({ maxListeners: 60 });
      this.handlePendingApiMessages = () => {
        this.eventEmitter.emit("open", true), this.pendingMessageQueue.length > 0 && (l2.d(this.TAG, "Found pending message queue, sending messages"), this.pendingMessageQueue.forEach((t3) => this.sendOverApiDataChannel(t3)), this.pendingMessageQueue.length = 0);
      };
      this.sendMessage = (t3, i3) => c2(this, null, function* () {
        var s3;
        ((s3 = this.apiChannel) == null ? void 0 : s3.readyState) !== "open" && (yield this.eventEmitter.waitFor("open"));
        let r3;
        for (let o2 = 0; o2 < this.MAX_RETRIES; o2++) {
          this.apiChannel.send(t3), r3 = yield this.waitForResponse(i3);
          let n2 = r3.error;
          if (n2) {
            if (n2.code === 404) {
              l2.d(this.TAG, `Track not found ${i3}`, { request: t3, try: o2 + 1, error: n2 });
              break;
            }
            if (l2.d(this.TAG, `Failed sending ${i3}`, { request: t3, try: o2 + 1, error: n2 }), !(n2.code / 100 === 5 || n2.code === 429)) throw Error(`code=${n2.code}, message=${n2.message}`);
            let u2 = (2 + Math.random() * 2) * 1e3;
            yield xe(u2);
          } else break;
        }
        return r3;
      });
      this.waitForResponse = (t3) => c2(this, null, function* () {
        let i3 = yield this.eventEmitter.waitFor("message", function(s3) {
          return s3.includes(t3);
        }), r3 = JSON.parse(i3[0]);
        return l2.d(this.TAG, `response for ${t3} -`, JSON.stringify(r3, null, 2)), r3;
      });
      this.observer = s2, this.nativeConnection = new RTCPeerConnection(i2), this.initNativeConnectionCallbacks();
    }
    initNativeConnectionCallbacks() {
      this.nativeConnection.oniceconnectionstatechange = () => {
        this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
      }, this.nativeConnection.onconnectionstatechange = () => {
        this.observer.onConnectionStateChange(this.nativeConnection.connectionState);
      }, this.nativeConnection.ondatachannel = (t2) => {
        t2.channel.label === vi && (this.apiChannel = new Zt(t2.channel, { onMessage: (i2) => {
          this.eventEmitter.emit("message", i2), this.observer.onApiChannelMessage(i2);
        } }, `role=${this.role}`), t2.channel.onopen = this.handlePendingApiMessages);
      }, this.nativeConnection.onicecandidate = (t2) => {
        t2.candidate !== null && (this.observer.onIceCandidate(t2.candidate), this.signal.trickle(this.role, t2.candidate));
      }, this.nativeConnection.ontrack = (t2) => {
        var p2;
        let i2 = t2.streams[0], r2 = i2.id;
        if (!this.remoteStreams.has(r2)) {
          let h2 = new be(i2, this);
          this.remoteStreams.set(r2, h2);
        }
        i2.addEventListener("removetrack", (h2) => {
          if (h2.track.id !== t2.track.id) return;
          let T = s2.tracks.findIndex((g2) => {
            var f2;
            return g2.nativeTrack.id === h2.track.id && t2.transceiver.mid === ((f2 = g2.transceiver) == null ? void 0 : f2.mid);
          });
          if (T >= 0) {
            let g2 = s2.tracks[T];
            this.observer.onTrackRemove(g2), s2.tracks.splice(T, 1), s2.tracks.length === 0 && this.remoteStreams.delete(r2);
          }
        });
        let s2 = this.remoteStreams.get(r2), o2 = t2.track.kind === "audio", n2 = o2 ? ie : O2, d2 = o2 ? new n2(s2, t2.track) : new n2(s2, t2.track, void 0, this.isFlagEnabled("disableNoneLayerRequest"));
        t2.track.kind === "video" && s2.setVideoLayerLocally("none", "addTrack", "subscribeConnection"), d2.transceiver = t2.transceiver;
        let u2 = Xa(this.remoteDescription, (p2 = t2.transceiver) == null ? void 0 : p2.mid);
        u2 && d2.setSdpTrackId(u2), s2.tracks.push(d2), this.observer.onTrackAdd(d2);
      };
    }
    sendOverApiDataChannel(t2) {
      this.apiChannel && this.apiChannel.readyState === "open" ? this.apiChannel.send(t2) : (l2.w(this.TAG, `API Data channel not ${this.apiChannel ? "open" : "present"}, queueing`, t2), this.pendingMessageQueue.push(t2));
    }
    sendOverApiDataChannelWithResponse(t2, i2) {
      return c2(this, null, function* () {
        let r2 = v4_default();
        if (t2.method === "prefer-video-track-state" && this.isFlagEnabled("disableVideoTrackAutoUnsubscribe") && t2.params.max_spatial_layer === "none") return l2.d(this.TAG, "video auto unsubscribe is disabled, request is ignored"), { id: r2 };
        let s2 = JSON.stringify(m({ id: i2 || r2, jsonrpc: "2.0" }, t2));
        return this.sendMessage(s2, r2);
      });
    }
    close() {
      var t2;
      super.close(), (t2 = this.apiChannel) == null || t2.close();
    }
  };
  var eo = (a10, e) => !e || e.length === 0 ? a10 : e.map((i2) => ({ urls: i2.urls, credentialType: "password", credential: i2.password, username: i2.userName }));
  var vr = "[InitService]";
  var ti = class {
    static handleError(e, t2) {
      switch (e.status) {
        case 404:
          throw S2.APIErrors.EndpointUnreachable("INIT", t2.message || e.statusText);
        case 200:
          break;
        default:
          throw S2.APIErrors.ServerErrors(t2.code || e.status, "INIT", t2.message || (e == null ? void 0 : e.statusText));
      }
    }
    static fetchInitConfig(n2) {
      return c2(this, arguments, function* ({ token: e, peerId: t2, userAgent: i2, initEndpoint: r2 = "https://prod-init.100ms.live", region: s2 = "", iceServers: o2 }) {
        l2.d(vr, `fetchInitConfig: initEndpoint=${r2} token=${e} peerId=${t2} region=${s2} `);
        let d2 = bn(r2, t2, i2, s2);
        try {
          let u2 = yield fetch(d2, { headers: { Authorization: `Bearer ${e}` } });
          try {
            let p2 = yield u2.clone().json();
            return this.handleError(u2, p2), l2.d(vr, `config is ${JSON.stringify(p2, null, 2)}`), An(p2, o2);
          } catch (p2) {
            let h2 = yield u2.text();
            throw l2.e(vr, "json error", p2.message, h2), p2 instanceof E2 ? p2 : S2.APIErrors.ServerErrors(u2.status, "INIT", p2.message);
          }
        } catch (u2) {
          let p2 = u2;
          throw ["Failed to fetch", "NetworkError", "ECONNRESET"].some((h2) => p2.message.includes(h2)) ? S2.APIErrors.EndpointUnreachable("INIT", p2.message) : p2;
        }
      });
    }
  };
  function bn(a10, e, t2, i2) {
    try {
      let r2 = new URL("/init", a10);
      return i2 && i2.trim().length > 0 && r2.searchParams.set("region", i2.trim()), r2.searchParams.set("peer_id", e), r2.searchParams.set("user_agent_v2", t2), r2.toString();
    } catch (r2) {
      let s2 = r2;
      throw l2.e(vr, s2.name, s2.message), s2;
    }
  }
  function An(a10, e) {
    var t2;
    return M2(m({}, a10), { rtcConfiguration: M2(m({}, a10.rtcConfiguration), { iceServers: eo((t2 = a10.rtcConfiguration) == null ? void 0 : t2.ice_servers, e) }) });
  }
  var ii = class {
    constructor(e) {
      this.TAG = "[SIGNAL]: ";
      this.pongResponseTimes = new Oe(5);
      this.isJoinCompleted = false;
      this.pendingTrickle = [];
      this.socket = null;
      this.callbacks = /* @__PURE__ */ new Map();
      this._isConnected = false;
      this.id = 0;
      this.onCloseHandler = () => {
      };
      this.resolvePingOnAnyResponse = () => {
        this.callbacks.forEach((e2, t2) => {
          var i2;
          ((i2 = e2.metadata) == null ? void 0 : i2.method) === "ping" && (e2.resolve({ timestamp: Date.now() }), this.callbacks.delete(t2));
        });
      };
      this.offlineListener = () => {
        l2.d(this.TAG, "Window network offline"), this.setIsConnected(false, "Window network offline");
      };
      this.onlineListener = () => {
        l2.d(this.TAG, "Window network online"), this.observer.onNetworkOnline();
      };
      this.observer = e, window.addEventListener("offline", this.offlineListener), window.addEventListener("online", this.onlineListener), this.onMessageHandler = this.onMessageHandler.bind(this);
    }
    get isConnected() {
      return this._isConnected;
    }
    setSfuNodeId(e) {
      this.sfuNodeId = e;
    }
    setIsConnected(e, t2 = "") {
      l2.d(this.TAG, `isConnected set id: ${this.id}, oldValue: ${this._isConnected}, newValue: ${e}`), this._isConnected !== e && (this._isConnected && !e ? (this._isConnected = e, this.rejectPendingCalls(t2), this.observer.onOffline(t2)) : !this._isConnected && e && (this._isConnected = e, this.observer.onOnline()));
    }
    getPongResponseTimes() {
      return this.pongResponseTimes.toList();
    }
    internalCall(e, t2) {
      return c2(this, null, function* () {
        var s2;
        let i2 = v4_default(), r2 = { method: e, params: t2, id: i2, jsonrpc: "2.0" };
        (s2 = this.socket) == null || s2.send(JSON.stringify(r2));
        try {
          return yield new Promise((n2, d2) => {
            this.callbacks.set(i2, { resolve: n2, reject: d2, metadata: { method: e } });
          });
        } catch (o2) {
          if (o2 instanceof E2) throw o2;
          let n2 = o2;
          throw S2.WebsocketMethodErrors.ServerErrors(Number(n2.code), br(e), n2.message);
        }
      });
    }
    notify(e, t2) {
      var r2, s2;
      let i2 = { method: e, params: t2 };
      ((r2 = this.socket) == null ? void 0 : r2.readyState) === WebSocket.OPEN && ((s2 = this.socket) == null || s2.send(JSON.stringify(i2)));
    }
    open(e) {
      return new Promise((t2, i2) => {
        let r2 = false;
        this.socket && (this.socket.close(), this.socket.removeEventListener("close", this.onCloseHandler), this.socket.removeEventListener("message", this.onMessageHandler)), this.socket = new WebSocket(e);
        let s2 = () => {
          l2.e(this.TAG, "Error from websocket"), r2 = true, i2(S2.WebSocketConnectionErrors.FailedToConnect("JOIN", "Error opening websocket connection"));
        };
        this.onCloseHandler = (n2) => {
          l2.w(`Websocket closed code=${n2.code}`), r2 ? this.setIsConnected(false, `code: ${n2.code}${n2.code !== 1e3 ? ", unexpected websocket close" : ""}`) : (r2 = true, i2(S2.WebSocketConnectionErrors.AbnormalClose("JOIN", `Error opening websocket connection - websocket closed unexpectedly with code=${n2.code}`)));
        }, this.socket.addEventListener("error", s2);
        let o2 = () => {
          var n2, d2;
          r2 = true, t2(), this.setIsConnected(true), this.id++, (n2 = this.socket) == null || n2.removeEventListener("open", o2), (d2 = this.socket) == null || d2.removeEventListener("error", s2), this.pingPongLoop(this.id);
        };
        this.socket.addEventListener("open", o2), this.socket.addEventListener("close", this.onCloseHandler), this.socket.addEventListener("message", this.onMessageHandler);
      });
    }
    close() {
      return c2(this, null, function* () {
        window.removeEventListener("offline", this.offlineListener), window.removeEventListener("online", this.onlineListener), this.socket ? (this.socket.close(1e3, "Normal Close"), this.setIsConnected(false, "code: 1000, normal websocket close"), this.socket.removeEventListener("close", this.onCloseHandler), this.socket.removeEventListener("message", this.onMessageHandler)) : this.setIsConnected(false, "websocket not connected yet");
      });
    }
    join(e, t2, i2, r2, s2, o2, n2) {
      return c2(this, null, function* () {
        if (!this.isConnected) throw S2.WebSocketConnectionErrors.WebSocketConnectionLost("JOIN", "Failed to send join over WS connection");
        let d2 = { name: e, disableVidAutoSub: i2, data: t2, offer: n2, server_sub_degrade: r2, simulcast: s2, onDemandTracks: o2 }, u2 = yield this.internalCall("join", d2);
        return this.isJoinCompleted = true, this.pendingTrickle.forEach(({ target: p2, candidate: h2 }) => this.trickle(p2, h2)), this.pendingTrickle.length = 0, l2.d(this.TAG, `join: response=${JSON.stringify(u2, null, 1)}`), u2;
      });
    }
    trickle(e, t2) {
      this.isJoinCompleted ? this.notify("trickle", { target: e, candidate: t2, sfu_node_id: this.sfuNodeId }) : this.pendingTrickle.push({ target: e, candidate: t2 });
    }
    offer(e, t2) {
      return c2(this, null, function* () {
        return yield this.call("offer", { desc: e, tracks: Object.fromEntries(t2), sfu_node_id: this.sfuNodeId });
      });
    }
    answer(e) {
      this.notify("answer", { desc: e, sfu_node_id: this.sfuNodeId });
    }
    trackUpdate(e) {
      this.notify("track-update", { tracks: Object.fromEntries(e) });
    }
    broadcast(e) {
      return c2(this, null, function* () {
        return yield this.call("broadcast", e);
      });
    }
    leave(e) {
      this.notify("leave", { client_reason: e });
    }
    endRoom(e, t2) {
      return c2(this, null, function* () {
        yield this.call("end-room", { lock: e, reason: t2 });
      });
    }
    sendEvent(e) {
      if (!this.isConnected) throw Error(`${this.TAG} not connected. Could not send event ${e}`);
      this.notify("analytics", e.toSignalParams());
    }
    ping(e) {
      let t2 = Date.now(), i2 = new Promise((s2) => {
        setTimeout(() => {
          s2(Date.now() - t2);
        }, e + 1);
      }), r2 = this.internalCall("ping", { timestamp: t2 }).then(() => Date.now() - t2).catch(() => Date.now() - t2);
      return Promise.race([i2, r2]);
    }
    requestRoleChange(e) {
      return c2(this, null, function* () {
        yield this.call("role-change-request", e);
      });
    }
    requestBulkRoleChange(e) {
      return c2(this, null, function* () {
        yield this.call("role-change-request", e);
      });
    }
    acceptRoleChangeRequest(e) {
      return c2(this, null, function* () {
        yield this.call("role-change", e);
      });
    }
    requestTrackStateChange(e) {
      return c2(this, null, function* () {
        yield this.call("track-update-request", e);
      });
    }
    requestMultiTrackStateChange(e) {
      return c2(this, null, function* () {
        yield this.call("change-track-mute-state-request", e);
      });
    }
    removePeer(e) {
      return c2(this, null, function* () {
        yield this.call("peer-leave-request", e);
      });
    }
    startRTMPOrRecording(e) {
      return c2(this, null, function* () {
        yield this.call("rtmp-start", m({}, e));
      });
    }
    stopRTMPAndRecording() {
      return c2(this, null, function* () {
        yield this.call("rtmp-stop", {});
      });
    }
    startHLSStreaming(e) {
      return c2(this, null, function* () {
        yield this.call("hls-start", m({}, e));
      });
    }
    stopHLSStreaming(e) {
      return c2(this, null, function* () {
        yield this.call("hls-stop", m({}, e));
      });
    }
    startTranscription(e) {
      return c2(this, null, function* () {
        yield this.call("transcription-start", m({}, e));
      });
    }
    stopTranscription(e) {
      return c2(this, null, function* () {
        yield this.call("transcription-stop", m({}, e));
      });
    }
    sendHLSTimedMetadata(e) {
      return c2(this, null, function* () {
        yield this.call("hls-timed-metadata", m({}, e));
      });
    }
    updatePeer(e) {
      return c2(this, null, function* () {
        yield this.call("peer-update", m({}, e));
      });
    }
    getPeer(e) {
      return c2(this, null, function* () {
        return yield this.call("get-peer", m({}, e));
      });
    }
    joinGroup(e) {
      return c2(this, null, function* () {
        return yield this.call("group-join", { name: e });
      });
    }
    leaveGroup(e) {
      return c2(this, null, function* () {
        return yield this.call("group-leave", { name: e });
      });
    }
    addToGroup(e, t2) {
      return c2(this, null, function* () {
        yield this.call("group-add", { name: t2, peer_id: e });
      });
    }
    removeFromGroup(e, t2) {
      return c2(this, null, function* () {
        yield this.call("group-remove", { name: t2, peer_id: e });
      });
    }
    peerIterNext(e) {
      return c2(this, null, function* () {
        return yield this.call("peer-iter-next", e);
      });
    }
    findPeers(e) {
      return c2(this, null, function* () {
        return yield this.call("find-peer", e);
      });
    }
    findPeerByName(e) {
      return c2(this, null, function* () {
        return yield this.call("peer-name-search", e);
      });
    }
    setSessionMetadata(e) {
      if (!this.isConnected) throw S2.WebSocketConnectionErrors.WebSocketConnectionLost("RECONNECT_SIGNAL", "Failed to set session store value due to network disconnection");
      return this.call("set-metadata", m({}, e));
    }
    listenMetadataChange(e) {
      if (!this.isConnected) throw S2.WebSocketConnectionErrors.WebSocketConnectionLost("RECONNECT_SIGNAL", "Failed to observe session store key due to network disconnection");
      return this.call("listen-metadata-change", { keys: e });
    }
    getSessionMetadata(e) {
      if (!this.isConnected) throw S2.WebSocketConnectionErrors.WebSocketConnectionLost("RECONNECT_SIGNAL", "Failed to set session store value due to network disconnection");
      return this.call("get-metadata", { key: e });
    }
    setPollInfo(e) {
      return this.call("poll-info-set", m({}, e));
    }
    getPollInfo(e) {
      return this.call("poll-info-get", m({}, e));
    }
    setPollQuestions(e) {
      return this.call("poll-questions-set", m({}, e));
    }
    startPoll(e) {
      return this.call("poll-start", m({}, e));
    }
    stopPoll(e) {
      return this.call("poll-stop", m({}, e));
    }
    getPollQuestions(e) {
      return this.call("poll-questions-get", m({}, e));
    }
    setPollResponses(e) {
      return this.call("poll-response", m({}, e));
    }
    getPollResponses(e) {
      return this.call("poll-responses", m({}, e));
    }
    getPollsList(e) {
      return this.call("poll-list", m({}, e));
    }
    getPollResult(e) {
      return this.call("poll-result", m({}, e));
    }
    createWhiteboard(e) {
      return this.validateConnection(), this.call("whiteboard-create", m({}, e));
    }
    getWhiteboard(e) {
      return this.validateConnection(), this.call("whiteboard-get", m({}, e));
    }
    fetchPollLeaderboard(e) {
      return this.call("poll-leaderboard", m({}, e));
    }
    validateConnection() {
      if (!this.isConnected) throw S2.WebSocketConnectionErrors.WebSocketConnectionLost("RECONNECT_SIGNAL", "Failed to send message due to network disconnection");
    }
    onMessageHandler(e) {
      let t2 = e.data, i2 = JSON.parse(t2);
      if (this.resolvePingOnAnyResponse(), i2.id) this.handleResponseWithId(i2);
      else if (i2.method) this.handleResponseWithMethod(i2);
      else throw Error(`WebSocket message has no 'method' or 'id' field, message=${i2}`);
    }
    handleResponseWithId(e) {
      let t2 = e, i2 = t2.id;
      if (this.callbacks.has(i2)) {
        let r2 = this.callbacks.get(i2);
        this.callbacks.delete(i2), t2.result ? r2.resolve(t2.result) : r2.reject(t2.error);
      } else this.observer.onNotification(t2);
    }
    handleResponseWithMethod(e) {
      switch (e.method) {
        case "offer":
          this.observer.onOffer(e.params);
          break;
        case "trickle":
          this.observer.onTrickle(e.params);
          break;
        case "on-error":
          this.observer.onServerError(S2.WebsocketMethodErrors.ServerErrors(Number(e.params.code), "on-error", e.params.message));
          break;
        case "on-warning":
          l2.w(this.TAG, e.params);
          break;
        default:
          this.observer.onNotification(e);
          break;
      }
    }
    rejectPendingCalls(e = "") {
      this.callbacks.forEach((t2, i2) => {
        var r2, s2, o2, n2;
        ((r2 = t2.metadata) == null ? void 0 : r2.method) !== "ping" && (l2.e(this.TAG, `rejecting pending callback ${(s2 = t2.metadata) == null ? void 0 : s2.method}, id=${i2}`), t2.reject(S2.WebSocketConnectionErrors.WebSocketConnectionLost((o2 = t2.metadata) != null && o2.method ? br((n2 = t2.metadata) == null ? void 0 : n2.method) : "RECONNECT_SIGNAL", e)), this.callbacks.delete(i2));
      });
    }
    pingPongLoop(e) {
      return c2(this, null, function* () {
        var i2, r2;
        let t2 = ((i2 = window.HMS) == null ? void 0 : i2.PING_TIMEOUT) || 12e3;
        if (this.isConnected) {
          let s2 = yield this.ping(t2);
          this.pongResponseTimes.enqueue(s2), s2 > t2 ? (l2.d(this.TAG, `Pong timeout ${e}, pageHidden=${Rs()}`), this.id === e && this.setIsConnected(false, "ping pong failure")) : setTimeout(() => this.pingPongLoop(e), ((r2 = window.HMS) == null ? void 0 : r2.PING_INTERVAL) || 3e3);
        }
      });
    }
    call(e, t2) {
      return c2(this, null, function* () {
        let r2 = S2.WebsocketMethodErrors.ServerErrors(500, e, `Default ${e} error`), s2;
        for (s2 = 1; s2 <= 3; s2++) try {
          return this.validateConnection(), l2.d(this.TAG, `Try number ${s2} sending ${e}`, t2), yield this.internalCall(e, t2);
        } catch (o2) {
          if (r2 = o2, l2.e(this.TAG, `Failed sending ${e} try: ${s2}`, { method: e, params: t2, error: r2 }), !(parseInt(`${r2.code / 100}`) === 5 || r2.code === 429 || r2.code === 1003)) break;
          let d2 = (2 + Math.random() * 2) * 1e3;
          yield xe(d2);
        }
        throw l2.e(`Sending ${e} over WS failed after ${Math.min(s2, 3)} retries`, { method: e, params: t2, error: r2 }), r2;
      });
    }
  };
  var to = () => {
    if (!U2 || typeof navigator.connection == "undefined") return;
    let a10 = navigator.connection;
    return { downlink: a10.downlink, downlinkMax: a10.downlinkMax, effectiveType: a10.effectiveType, rtt: a10.rtt, saveData: a10.saveData, type: a10.type };
  };
  var I2 = "[HMSTransport]:";
  var ri = class {
    constructor(e, t2, i2, r2, s2, o2, n2) {
      this.observer = e;
      this.deviceManager = t2;
      this.store = i2;
      this.eventBus = r2;
      this.analyticsEventsService = s2;
      this.analyticsTimer = o2;
      this.pluginUsageTracker = n2;
      this.state = "Disconnected";
      this.trackStates = /* @__PURE__ */ new Map();
      this.publishConnection = null;
      this.subscribeConnection = null;
      this.maxSubscribeBitrate = 0;
      this.joinRetryCount = 0;
      this.publishDisconnectTimer = 0;
      this.onScreenshareStop = () => {
      };
      this.screenStream = /* @__PURE__ */ new Set();
      this.callbacks = /* @__PURE__ */ new Map();
      this.setListener = (e2) => {
        this.listener = e2;
      };
      this.setOnScreenshareStop = (e2) => {
        this.onScreenshareStop = e2;
      };
      this.signalObserver = { onOffer: (e2) => c2(this, null, function* () {
        try {
          if (!this.subscribeConnection) return;
          if (e2.sfu_node_id && this.subscribeConnection.sfuNodeId && this.subscribeConnection.sfuNodeId !== e2.sfu_node_id) {
            l2.d(I2, "ignoring old offer");
            return;
          }
          yield this.subscribeConnection.setRemoteDescription(e2), l2.d(I2, `[SUBSCRIBE] Adding ${this.subscribeConnection.candidates.length} ice-candidates`, this.subscribeConnection.candidates);
          for (let i3 of this.subscribeConnection.candidates) yield this.subscribeConnection.addIceCandidate(i3);
          this.subscribeConnection.candidates.length = 0;
          let t3 = yield this.subscribeConnection.createAnswer();
          yield this.subscribeConnection.setLocalDescription(t3), this.signal.answer(t3), l2.d(I2, "[role=SUBSCRIBE] onOffer renegotiation DONE \u2705");
        } catch (t3) {
          l2.d(I2, "[role=SUBSCRIBE] onOffer renegotiation FAILED \u274C", t3), this.state = "Failed";
          let i3;
          t3 instanceof E2 ? i3 = t3 : i3 = S2.GenericErrors.Unknown("SUBSCRIBE", t3.message), this.observer.onFailure(i3), this.eventBus.analytics.publish(y2.subscribeFail(i3));
        }
      }), onTrickle: (e2) => c2(this, null, function* () {
        let t3 = e2.target === 0 ? this.publishConnection : this.subscribeConnection;
        t3 != null && t3.remoteDescription ? yield t3.addIceCandidate(e2.candidate) : t3 == null || t3.candidates.push(e2.candidate);
      }), onNotification: (e2) => this.observer.onNotification(e2), onServerError: (e2) => c2(this, null, function* () {
        yield this.observer.onStateChange("Failed", e2);
      }), onFailure: (e2) => {
        this.joinParameters && this.retryScheduler.schedule({ category: 1, error: e2, task: this.retrySignalDisconnectTask, originalState: this.state });
      }, onOffline: (e2) => c2(this, null, function* () {
        l2.d(I2, "socket offline", lr[this.state]);
        try {
          this.state !== "Leaving" && this.joinParameters && this.retryScheduler.schedule({ category: 1, error: S2.WebSocketConnectionErrors.WebSocketConnectionLost("RECONNECT_SIGNAL", e2), task: this.retrySignalDisconnectTask, originalState: this.state });
        } catch (t3) {
          console.error(t3);
        }
      }), onOnline: () => {
        var e2;
        l2.d(I2, "socket online", lr[this.state]), this.analyticsSignalTransport.flushFailedEvents((e2 = this.store.getLocalPeer()) == null ? void 0 : e2.peerId);
      }, onNetworkOnline: () => {
        this.analyticsEventsService.flushFailedClientEvents();
      } };
      this.signal = new ii(this.signalObserver);
      this.analyticsSignalTransport = new Sr(this.signal);
      this.publishDtlsStateTimer = 0;
      this.lastPublishDtlsState = "new";
      this.handleLocalRoleUpdate = (i3) => c2(this, [i3], function* ({ oldRole: e2, newRole: t3 }) {
        !this.doesRoleNeedWebRTC(e2) && this.doesRoleNeedWebRTC(t3) && (l2.d(I2, "Local peer role updated to webrtc role, creating PeerConnections and performing inital publish negotiation \u23F3"), this.createPeerConnections(), yield this.negotiateOnFirstPublish());
      });
      this.retryPublishIceFailedTask = () => c2(this, null, function* () {
        if (this.publishConnection) {
          let e2 = new Promise((t3, i3) => {
            this.callbacks.set(rt, { promise: { resolve: t3, reject: i3 }, action: "RESTART_ICE", extra: {} });
          });
          yield this.performPublishRenegotiation({ iceRestart: this.publishConnection.connectionState !== "connected" }), yield e2;
        }
        return true;
      });
      this.retrySubscribeIceFailedTask = () => c2(this, null, function* () {
        if (this.subscribeConnection && this.subscribeConnection.connectionState !== "connected") {
          let e2 = new Promise((i3, r3) => {
            this.callbacks.set(st, { promise: { resolve: i3, reject: r3 }, action: "RESTART_ICE", extra: {} });
          }), t3 = new Promise((i3) => {
            setTimeout(i3, 6e4, false);
          });
          return Promise.race([e2, t3]);
        }
        return true;
      });
      this.retrySignalDisconnectTask = () => c2(this, null, function* () {
        var t3;
        l2.d(I2, "retrySignalDisconnectTask", { signalConnected: this.signal.isConnected }), this.signal.isConnected || (yield this.internalConnect(this.joinParameters.authToken, this.joinParameters.endpoint, this.joinParameters.peerId, this.joinParameters.iceServers));
        let e2 = (t3 = this.store.getRoom()) != null && t3.joinedAt ? this.signal.isConnected && (yield this.retryPublishIceFailedTask()) : this.signal.isConnected;
        return this.signal.trackUpdate(this.trackStates), e2;
      });
      this.webrtcInternals = new yi(this.store, this.eventBus);
      let d2 = (u2, p2) => c2(this, null, function* () {
        u2 !== this.state && (this.state = u2, yield this.observer.onStateChange(this.state, p2));
      });
      this.retryScheduler = new pr(d2, this.sendErrorAnalyticsEvent.bind(this)), this.eventBus.statsUpdate.subscribe((u2) => {
        var h2, T;
        let p2 = ((T = (h2 = u2.getLocalPeerStats()) == null ? void 0 : h2.subscribe) == null ? void 0 : T.bitrate) || 0;
        this.maxSubscribeBitrate = Math.max(this.maxSubscribeBitrate, p2);
      }), this.eventBus.localAudioEnabled.subscribe(({ track: u2, enabled: p2 }) => this.trackUpdate(u2, p2)), this.eventBus.localVideoEnabled.subscribe(({ track: u2, enabled: p2 }) => this.trackUpdate(u2, p2));
    }
    getWebsocketEndpoint() {
      if (this.initConfig) return this.initConfig.endpoint;
    }
    getWebrtcInternals() {
      return this.webrtcInternals;
    }
    isFlagEnabled(e) {
      var r2;
      let t2 = (r2 = this.initConfig) == null ? void 0 : r2.config;
      return ((t2 == null ? void 0 : t2.enabledFlags) || []).includes(e);
    }
    setConnectivityListener(e) {
      this.connectivityListener = e;
    }
    preview(e, t2, i2, r2, s2 = false, o2) {
      return c2(this, null, function* () {
        let n2 = yield this.connect(e, t2, i2, r2, s2, o2);
        return this.state = "Preview", this.observer.onStateChange(this.state), n2;
      });
    }
    join(e, t2, i2, r2, s2 = false, o2) {
      return c2(this, null, function* () {
        l2.d(I2, "join: started \u23F0");
        try {
          (!this.signal.isConnected || !this.initConfig) && (yield this.connect(e, r2, t2, i2, s2, o2)), this.validateNotDisconnected("connect"), this.initConfig && (yield this.waitForLocalRoleAvailability(), yield this.createConnectionsAndNegotiateJoin(i2, s2), this.initStatsAnalytics(), l2.d(I2, "\u2705 join: Negotiated over PUBLISH connection"));
        } catch (n2) {
          l2.e(I2, `join: failed \u274C [token=${e}]`, n2), this.state = "Failed";
          let d2 = n2;
          throw d2.isTerminal = d2.isTerminal || d2.code === 500, yield this.observer.onStateChange(this.state, d2), d2;
        }
        l2.d(I2, "\u2705 join: successful"), this.state = "Joined", this.observer.onStateChange(this.state);
      });
    }
    connect(e, t2, i2, r2, s2 = false, o2) {
      return c2(this, null, function* () {
        this.setTransportStateForConnect(), this.joinParameters = new dr(e, i2, r2.name, r2.metaData, t2, s2, o2);
        try {
          return yield this.internalConnect(e, t2, i2, o2);
        } catch (n2) {
          if (n2 instanceof E2 && ([k2.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST, k2.WebSocketConnectionErrors.FAILED_TO_CONNECT, k2.WebSocketConnectionErrors.ABNORMAL_CLOSE, k2.APIErrors.ENDPOINT_UNREACHABLE].includes(n2.code) || n2.code.toString().startsWith("5") || n2.code.toString().startsWith("429"))) {
            let u2 = () => c2(this, null, function* () {
              return yield this.internalConnect(e, t2, i2, o2), !!(this.initConfig && this.initConfig.endpoint);
            });
            yield this.retryScheduler.schedule({ category: 0, error: n2, task: u2, originalState: this.state, changeState: false });
          } else throw n2;
        }
      });
    }
    leave(i2) {
      return c2(this, arguments, function* (e, t2 = "user request") {
        var r2, s2, o2;
        this.retryScheduler.reset(), this.joinParameters = void 0, l2.d(I2, "leaving in transport");
        try {
          let n2 = this.pluginUsageTracker.getPluginUsage("HMSKrispPlugin");
          if (n2 && this.eventBus.analytics.publish(y2.getKrispUsage(n2)), this.state = "Leaving", (r2 = this.publishStatsAnalytics) == null || r2.stop(), (s2 = this.subscribeStatsAnalytics) == null || s2.stop(), (o2 = this.webrtcInternals) == null || o2.cleanup(), this.clearPeerConnections(), e) try {
            this.signal.leave(t2), l2.d(I2, "signal leave done");
          } catch (d2) {
            l2.w(I2, "failed to send leave on websocket to server", d2);
          }
          this.analyticsEventsService.flushFailedClientEvents(), this.analyticsEventsService.reset(), yield this.signal.close();
        } catch (n2) {
          this.eventBus.analytics.publish(y2.disconnect(n2)), l2.e(I2, "leave: FAILED \u274C", n2);
        } finally {
          this.state = "Disconnected", this.observer.onStateChange(this.state);
        }
      });
    }
    publish(e) {
      return c2(this, null, function* () {
        var t2;
        for (let i2 of e) try {
          yield this.publishTrack(i2), (t2 = this.connectivityListener) == null || t2.onMediaPublished(i2);
        } catch (r2) {
          this.eventBus.analytics.publish(y2.publish({ devices: this.deviceManager.getDevices(), error: r2 }));
        }
      });
    }
    unpublish(e) {
      return c2(this, null, function* () {
        for (let t2 of e) yield this.unpublishTrack(t2);
      });
    }
    setSFUNodeId(e) {
      var t2, i2;
      this.signal.setSfuNodeId(e), this.sfuNodeId ? e && this.sfuNodeId !== e && (this.sfuNodeId = e, this.handleSFUMigration()) : (this.sfuNodeId = e, (t2 = this.publishConnection) == null || t2.setSfuNodeId(e), (i2 = this.subscribeConnection) == null || i2.setSfuNodeId(e));
    }
    handleSFUMigration() {
      return c2(this, null, function* () {
        var s2, o2;
        l2.time("sfu migration"), this.clearPeerConnections();
        let e = this.store.getPeerMap();
        this.store.removeRemoteTracks();
        for (let n2 in e) {
          let d2 = e[n2];
          d2.isLocal || (d2.audioTrack = void 0, d2.videoTrack = void 0, d2.auxiliaryTracks = []);
        }
        let t2 = this.store.getLocalPeer();
        if (!t2) return;
        this.createPeerConnections(), this.trackStates.clear(), yield this.negotiateOnFirstPublish();
        let i2 = /* @__PURE__ */ new Map();
        if (t2.audioTrack) {
          let n2 = t2.audioTrack.stream;
          i2.get(n2.id) || i2.set(n2.id, new ge(new MediaStream()));
          let d2 = t2.audioTrack.clone(i2.get(n2.id));
          this.store.removeTrack(t2.audioTrack), t2.audioTrack.cleanup(), yield this.publishTrack(d2), t2.audioTrack = d2;
        }
        if (t2.videoTrack) {
          let n2 = t2.videoTrack.stream;
          i2.get(n2.id) || i2.set(n2.id, new ge(new MediaStream())), this.store.removeTrack(t2.videoTrack);
          let d2 = t2.videoTrack.clone(i2.get(n2.id));
          t2.videoTrack.cleanup(), yield this.publishTrack(d2), t2.videoTrack = d2;
        }
        let r2 = [];
        for (; t2.auxiliaryTracks.length > 0; ) {
          let n2 = t2.auxiliaryTracks.shift();
          if (n2) {
            let d2 = n2.stream;
            i2.get(d2.id) || i2.set(d2.id, new ge(n2.source === "screen" ? d2.nativeStream.clone() : new MediaStream())), this.store.removeTrack(n2);
            let u2 = n2.clone(i2.get(d2.id));
            u2.type === "video" && u2.source === "screen" && (this.screenStream.add(d2.nativeStream), this.screenStream.add(u2.stream.nativeStream), u2.nativeTrack.addEventListener("ended", this.onScreenshareStop)), n2.cleanup(), yield this.publishTrack(u2), r2.push(u2);
          }
        }
        t2.auxiliaryTracks = r2, i2.clear(), (o2 = (s2 = this.listener) == null ? void 0 : s2.onSFUMigration) == null || o2.call(s2), l2.timeEnd("sfu migration");
      });
    }
    trackUpdate(e, t2) {
      var s2;
      let r2 = Array.from(this.trackStates.values()).find((o2) => e.type === o2.type && e.source === o2.source);
      if (r2) {
        let o2 = new Vt(M2(m({}, r2), { mute: !t2 }));
        this.trackStates.set(r2.track_id, o2), l2.d(I2, "Track Update", this.trackStates, e), this.signal.trackUpdate(/* @__PURE__ */ new Map([[r2.track_id, o2]]));
        let n2 = this.store.getLocalPeer();
        n2 && t2 === e.enabled && ((s2 = this.listener) == null || s2.onTrackUpdate(t2 ? 3 : 2, e, n2));
      }
    }
    publishTrack(e) {
      return c2(this, null, function* () {
        e.publishedTrackId = e.getTrackIDBeingSent(), l2.d(I2, `\u23F3 publishTrack: trackId=${e.trackId}, toPublishTrackId=${e.publishedTrackId}`, `${e}`), this.trackStates.set(e.publishedTrackId, new Vt(e));
        let t2 = new Promise((s2, o2) => {
          this.callbacks.set(rt, { promise: { resolve: s2, reject: o2 }, action: "PUBLISH", extra: {} });
        }), i2 = e.stream;
        i2.setConnection(this.publishConnection);
        let r2 = this.store.getSimulcastLayers(e.source);
        i2.addTransceiver(e, r2), l2.time(`publish-${e.trackId}-${e.type}`), yield t2, l2.timeEnd(`publish-${e.trackId}-${e.type}`), this.store.addTrack(e), yield i2.setMaxBitrateAndFramerate(e).then(() => {
          l2.d(I2, `Setting maxBitrate=${e.settings.maxBitrate} kpbs${e instanceof G2 ? ` and maxFramerate=${e.settings.maxFramerate}` : ""} for ${e.source} ${e.type} ${e.trackId}`);
        }).catch((s2) => l2.w(I2, "Failed setting maxBitrate and maxFramerate", s2)), e.isPublished = true, l2.d(I2, `\u2705 publishTrack: trackId=${e.trackId}`, `${e}`, this.callbacks);
      });
    }
    unpublishTrack(e) {
      return c2(this, null, function* () {
        if (l2.d(I2, `\u23F3 unpublishTrack: trackId=${e.trackId}`, `${e}`), e.publishedTrackId && this.trackStates.has(e.publishedTrackId)) this.trackStates.delete(e.publishedTrackId);
        else {
          let s2 = Array.from(this.trackStates.values()).find((o2) => e.type === o2.type && e.source === o2.source);
          s2 && this.trackStates.delete(s2.track_id);
        }
        let t2 = new Promise((r2, s2) => {
          this.callbacks.set(rt, { promise: { resolve: r2, reject: s2 }, action: "UNPUBLISH", extra: {} });
        });
        e.stream.removeSender(e), yield t2, yield e.cleanup(), e.source === "screen" && this.screenStream && this.screenStream.forEach((r2) => {
          r2.getTracks().forEach((s2) => {
            s2.stop();
          }), this.screenStream.delete(r2);
        }), this.store.removeTrack(e), l2.d(I2, `\u2705 unpublishTrack: trackId=${e.trackId}`, this.callbacks);
      });
    }
    clearPeerConnections() {
      return c2(this, null, function* () {
        var e, t2;
        clearTimeout(this.publishDtlsStateTimer), this.publishDtlsStateTimer = 0, clearTimeout(this.publishDisconnectTimer), this.publishDisconnectTimer = 0, this.lastPublishDtlsState = "new", (e = this.publishConnection) == null || e.close(), (t2 = this.subscribeConnection) == null || t2.close(), this.publishConnection = null, this.subscribeConnection = null;
      });
    }
    waitForLocalRoleAvailability() {
      if (!this.store.hasRoleDetailsArrived()) return new Promise((e) => {
        this.eventBus.policyChange.subscribeOnce(() => e());
      });
    }
    createConnectionsAndNegotiateJoin(e, t2 = false) {
      return c2(this, null, function* () {
        let i2 = this.doesLocalPeerNeedWebRTC();
        i2 && this.createPeerConnections(), this.analyticsTimer.start("join_response_time"), yield this.negotiateJoinWithRetry({ name: e.name, data: e.metaData, autoSubscribeVideo: t2, isWebRTC: i2 }), this.analyticsTimer.end("join_response_time");
      });
    }
    createPeerConnections() {
      var t2, i2, r2;
      let e = (s2, o2, n2 = false) => {
        (["disconnected", "failed"].includes(o2) ? l2.w.bind(l2) : l2.d.bind(l2))(I2, `${ht[s2]} ${n2 ? "ice" : ""} connection state change: ${o2}`);
      };
      if (this.initConfig) {
        let s2 = { onRenegotiationNeeded: () => c2(this, null, function* () {
          yield this.performPublishRenegotiation();
        }), onDTLSTransportStateChange: (n2) => {
          var p2, h2, T;
          if ((n2 === "failed" ? l2.w.bind(l2) : l2.d.bind(l2))(I2, `Publisher on dtls transport state change: ${n2}`), !n2 || this.lastPublishDtlsState === n2 || (this.lastPublishDtlsState = n2, this.publishDtlsStateTimer !== 0 && (clearTimeout(this.publishDtlsStateTimer), this.publishDtlsStateTimer = 0), n2 !== "connecting" && n2 !== "failed")) return;
          let u2 = (T = (h2 = (p2 = this.initConfig) == null ? void 0 : p2.config) == null ? void 0 : h2.dtlsStateTimeouts) == null ? void 0 : T[n2];
          !u2 || u2 <= 0 || (this.publishDtlsStateTimer = window.setTimeout(() => {
            var f2;
            let g2 = (f2 = this.publishConnection) == null ? void 0 : f2.nativeConnection.connectionState;
            if (g2 && n2 && g2 === n2) {
              let P2 = S2.WebrtcErrors.ICEFailure("PUBLISH", `DTLS transport state ${n2} timeout:${u2}ms`, true);
              this.eventBus.analytics.publish(y2.disconnect(P2)), this.observer.onFailure(P2);
            }
          }, u2));
        }, onDTLSTransportError: (n2) => {
          l2.e(I2, `onDTLSTransportError ${n2.name} ${n2.message}`, n2), this.eventBus.analytics.publish(y2.disconnect(n2));
        }, onIceConnectionChange: (n2) => c2(this, null, function* () {
          e(0, n2, true);
        }), onConnectionStateChange: (n2) => c2(this, null, function* () {
          var d2, u2, p2, h2, T, g2, f2, P2;
          e(0, n2, false), n2 !== "new" && (n2 === "connected" ? ((d2 = this.connectivityListener) == null || d2.onICESuccess(true), (u2 = this.publishConnection) == null || u2.handleSelectedIceCandidatePairs()) : n2 === "failed" ? yield this.handleIceConnectionFailure(0, S2.WebrtcErrors.ICEFailure("PUBLISH", `local candidate - ${(T = (h2 = (p2 = this.publishConnection) == null ? void 0 : p2.selectedCandidatePair) == null ? void 0 : h2.local) == null ? void 0 : T.candidate}; remote candidate - ${(P2 = (f2 = (g2 = this.publishConnection) == null ? void 0 : g2.selectedCandidatePair) == null ? void 0 : f2.remote) == null ? void 0 : P2.candidate}`)) : this.publishDisconnectTimer = window.setTimeout(() => {
            var v2, R2, $, ue, Te, pe, St;
            ((v2 = this.publishConnection) == null ? void 0 : v2.connectionState) !== "connected" && this.handleIceConnectionFailure(0, S2.WebrtcErrors.ICEDisconnected("PUBLISH", `local candidate - ${(ue = ($ = (R2 = this.publishConnection) == null ? void 0 : R2.selectedCandidatePair) == null ? void 0 : $.local) == null ? void 0 : ue.candidate}; remote candidate - ${(St = (pe = (Te = this.publishConnection) == null ? void 0 : Te.selectedCandidatePair) == null ? void 0 : pe.remote) == null ? void 0 : St.candidate}`));
          }, 5e3));
        }), onIceCandidate: (n2) => {
          var d2;
          (d2 = this.connectivityListener) == null || d2.onICECandidate(n2, true);
        }, onSelectedCandidatePairChange: (n2) => {
          var d2;
          (d2 = this.connectivityListener) == null || d2.onSelectedICECandidatePairChange(n2, true);
        } }, o2 = { onApiChannelMessage: (n2) => {
          this.observer.onNotification(JSON.parse(n2));
        }, onTrackAdd: (n2) => {
          l2.d(I2, "[Subscribe] onTrackAdd", `${n2}`), this.observer.onTrackAdd(n2);
        }, onTrackRemove: (n2) => {
          l2.d(I2, "[Subscribe] onTrackRemove", `${n2}`), this.observer.onTrackRemove(n2);
        }, onIceConnectionChange: (n2) => c2(this, null, function* () {
          var d2;
          if (e(1, n2, true), n2 === "connected") {
            let u2 = this.callbacks.get(st);
            this.callbacks.delete(st), (d2 = this.connectivityListener) == null || d2.onICESuccess(false), u2 && u2.promise.resolve(true);
          }
        }), onConnectionStateChange: (n2) => c2(this, null, function* () {
          var d2, u2, p2, h2, T, g2, f2;
          if (e(1, n2, false), n2 === "failed") yield this.handleIceConnectionFailure(1, S2.WebrtcErrors.ICEFailure("SUBSCRIBE", `local candidate - ${(p2 = (u2 = (d2 = this.subscribeConnection) == null ? void 0 : d2.selectedCandidatePair) == null ? void 0 : u2.local) == null ? void 0 : p2.candidate}; remote candidate - ${(g2 = (T = (h2 = this.subscribeConnection) == null ? void 0 : h2.selectedCandidatePair) == null ? void 0 : T.remote) == null ? void 0 : g2.candidate}`));
          else if (n2 === "disconnected") setTimeout(() => {
            var P2, v2, R2, $, ue, Te, pe;
            ((P2 = this.subscribeConnection) == null ? void 0 : P2.connectionState) === "disconnected" && this.handleIceConnectionFailure(1, S2.WebrtcErrors.ICEDisconnected("SUBSCRIBE", `local candidate - ${($ = (R2 = (v2 = this.subscribeConnection) == null ? void 0 : v2.selectedCandidatePair) == null ? void 0 : R2.local) == null ? void 0 : $.candidate}; remote candidate - ${(pe = (Te = (ue = this.subscribeConnection) == null ? void 0 : ue.selectedCandidatePair) == null ? void 0 : Te.remote) == null ? void 0 : pe.candidate}`));
          }, 5e3);
          else if (n2 === "connected") {
            (f2 = this.subscribeConnection) == null || f2.handleSelectedIceCandidatePairs();
            let P2 = this.callbacks.get(st);
            this.callbacks.delete(st), P2 && P2.promise.resolve(true);
          }
        }), onIceCandidate: (n2) => {
          var d2;
          (d2 = this.connectivityListener) == null || d2.onICECandidate(n2, false);
        }, onSelectedCandidatePairChange: (n2) => {
          var d2;
          (d2 = this.connectivityListener) == null || d2.onSelectedICECandidatePairChange(n2, false);
        } };
        this.publishConnection || (this.publishConnection = new Xt(this.signal, this.initConfig.rtcConfiguration, s2)), this.subscribeConnection || (this.subscribeConnection = new ei(this.signal, this.initConfig.rtcConfiguration, this.isFlagEnabled.bind(this), o2));
      }
      (r2 = this.webrtcInternals) == null || r2.setPeerConnections({ publish: (t2 = this.publishConnection) == null ? void 0 : t2.nativeConnection, subscribe: (i2 = this.subscribeConnection) == null ? void 0 : i2.nativeConnection });
    }
    negotiateJoinWithRetry(s2) {
      return c2(this, arguments, function* ({ name: e, data: t2, autoSubscribeVideo: i2, isWebRTC: r2 = true }) {
        try {
          yield this.negotiateJoin({ name: e, data: t2, autoSubscribeVideo: i2, isWebRTC: r2 });
        } catch (o2) {
          l2.e(I2, "Join negotiation failed \u274C", o2);
          let n2 = o2 instanceof E2 ? o2 : S2.WebsocketMethodErrors.ServerErrors(500, "JOIN", `Websocket join error - ${o2.message}`), d2 = parseInt(`${n2.code / 100}`) === 5 || [k2.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST, 429].includes(n2.code);
          if (n2.code === 410 && (n2.isTerminal = true), d2) {
            this.joinRetryCount = 0, n2.isTerminal = false;
            let u2 = () => c2(this, null, function* () {
              return this.joinRetryCount++, yield this.negotiateJoin({ name: e, data: t2, autoSubscribeVideo: i2, isWebRTC: r2 });
            });
            yield this.retryScheduler.schedule({ category: 2, error: n2, task: u2, originalState: "Joined", changeState: false });
          } else throw o2;
        }
      });
    }
    negotiateJoin(s2) {
      return c2(this, arguments, function* ({ name: e, data: t2, autoSubscribeVideo: i2, isWebRTC: r2 = true }) {
        return r2 ? yield this.negotiateJoinWebRTC({ name: e, data: t2, autoSubscribeVideo: i2 }) : yield this.negotiateJoinNonWebRTC({ name: e, data: t2, autoSubscribeVideo: i2 });
      });
    }
    negotiateJoinWebRTC(r2) {
      return c2(this, arguments, function* ({ name: e, data: t2, autoSubscribeVideo: i2 }) {
        if (l2.d(I2, "\u23F3 join: Negotiating over PUBLISH connection"), !this.publishConnection) return l2.e(I2, "Publish peer connection not found, cannot negotiate"), false;
        let s2 = yield this.publishConnection.createOffer();
        yield this.publishConnection.setLocalDescription(s2);
        let o2 = this.isFlagEnabled("subscribeDegradation"), n2 = this.isFlagEnabled("simulcast"), d2 = this.isFlagEnabled("onDemandTracks"), u2 = yield this.signal.join(e, t2, !i2, o2, n2, d2, s2);
        this.setSFUNodeId(u2 == null ? void 0 : u2.sfu_node_id), yield this.publishConnection.setRemoteDescription(u2);
        for (let p2 of this.publishConnection.candidates) yield this.publishConnection.addIceCandidate(p2);
        return this.publishConnection.initAfterJoin(), !!u2;
      });
    }
    negotiateJoinNonWebRTC(r2) {
      return c2(this, arguments, function* ({ name: e, data: t2, autoSubscribeVideo: i2 }) {
        l2.d(I2, "\u23F3 join: Negotiating Non-WebRTC");
        let s2 = this.isFlagEnabled("subscribeDegradation"), o2 = this.isFlagEnabled("simulcast"), n2 = this.isFlagEnabled("onDemandTracks"), d2 = yield this.signal.join(e, t2, !i2, s2, o2, n2);
        return this.setSFUNodeId(d2 == null ? void 0 : d2.sfu_node_id), !!d2;
      });
    }
    negotiateOnFirstPublish() {
      return c2(this, null, function* () {
        if (l2.d(I2, "\u23F3 Negotiating offer over PUBLISH connection"), !this.publishConnection) return l2.e(I2, "Publish peer connection not found, cannot negotiate"), false;
        try {
          let e = yield this.publishConnection.createOffer(this.trackStates);
          yield this.publishConnection.setLocalDescription(e);
          let t2 = yield this.signal.offer(e, this.trackStates);
          yield this.publishConnection.setRemoteDescription(t2);
          for (let i2 of this.publishConnection.candidates) yield this.publishConnection.addIceCandidate(i2);
          return this.publishConnection.initAfterJoin(), !!t2;
        } catch (e) {
          if (e instanceof E2 && e.code === 421) return true;
          throw e;
        }
      });
    }
    performPublishRenegotiation(e) {
      return c2(this, null, function* () {
        l2.d(I2, "\u23F3 [role=PUBLISH] onRenegotiationNeeded START", this.trackStates);
        let t2 = this.callbacks.get(rt);
        if (!t2) {
          l2.w(I2, "no callback found for renegotiation");
          return;
        }
        if (!this.publishConnection) {
          l2.e(I2, "Publish peer connection not found, cannot renegotiate");
          return;
        }
        try {
          let i2 = yield this.publishConnection.createOffer(this.trackStates, e);
          yield this.publishConnection.setLocalDescription(i2), l2.time("renegotiation-offer-exchange");
          let r2 = yield this.signal.offer(i2, this.trackStates);
          this.callbacks.delete(rt), l2.timeEnd("renegotiation-offer-exchange"), yield this.publishConnection.setRemoteDescription(r2), t2.promise.resolve(true), l2.d(I2, "[role=PUBLISH] onRenegotiationNeeded DONE \u2705");
        } catch (i2) {
          let r2;
          i2 instanceof E2 ? r2 = i2 : r2 = S2.GenericErrors.Unknown("PUBLISH", i2.message), r2.code === 421 ? t2.promise.resolve(true) : t2.promise.reject(r2), l2.d(I2, "[role=PUBLISH] onRenegotiationNeeded FAILED \u274C");
        }
      });
    }
    handleIceConnectionFailure(e, t2) {
      return c2(this, null, function* () {
        this.retryScheduler.isTaskInProgress(0 ? 3 : 4) || (e === 0 ? this.retryScheduler.schedule({ category: 3, error: t2, task: this.retryPublishIceFailedTask, originalState: "Joined" }) : this.retryScheduler.schedule({ category: 4, error: t2, task: this.retrySubscribeIceFailedTask, originalState: "Joined" }));
      });
    }
    internalConnect(e, t2, i2, r2) {
      return c2(this, null, function* () {
        var o2, n2, d2;
        l2.d(I2, "connect: started \u23F0");
        let s2 = /* @__PURE__ */ new Date();
        try {
          this.analyticsTimer.start("init_response_time"), this.initConfig = yield ti.fetchInitConfig({ token: e, peerId: i2, userAgent: this.store.getUserAgent(), initEndpoint: t2, iceServers: r2 }), (o2 = this.connectivityListener) == null || o2.onInitSuccess(this.initConfig.endpoint);
          let u2 = this.store.getRoom();
          return u2 && (u2.effectsKey = (n2 = this.initConfig.config.vb) == null ? void 0 : n2.effectsKey, u2.isEffectsEnabled = this.isFlagEnabled("effectsSDKEnabled"), u2.disableNoneLayerRequest = this.isFlagEnabled("disableNoneLayerRequest"), u2.isVBEnabled = this.isFlagEnabled("vb"), u2.isHipaaEnabled = this.isFlagEnabled("hipaa"), u2.isNoiseCancellationEnabled = this.isFlagEnabled("noiseCancellation")), this.analyticsTimer.end("init_response_time"), He.setWebsocketEndpoint(this.initConfig.endpoint), this.validateNotDisconnected("post init"), yield this.openSignal(e, i2), this.observer.onConnected(), (d2 = this.connectivityListener) == null || d2.onSignallingSuccess(), this.store.setSimulcastEnabled(this.isFlagEnabled("simulcast")), l2.d(I2, "Adding Analytics Transport: JsonRpcSignal"), this.analyticsEventsService.setTransport(this.analyticsSignalTransport), this.analyticsEventsService.flush(), this.initConfig;
        } catch (u2) {
          throw this.state !== "Reconnecting" && this.eventBus.analytics.publish(y2.connect(u2, this.getAdditionalAnalyticsProperties(), s2, /* @__PURE__ */ new Date(), t2)), l2.e(I2, "\u274C internal connect: failed", u2), u2;
        }
      });
    }
    validateNotDisconnected(e) {
      if (this.state === "Disconnected") throw l2.w(I2, "aborting join as transport state is disconnected"), S2.GenericErrors.ValidationFailed(`leave called before join could complete - stage=${e}`);
    }
    openSignal(e, t2) {
      return c2(this, null, function* () {
        if (!this.initConfig) throw S2.APIErrors.InitConfigNotAvailable("INIT", "Init Config not found");
        l2.d(I2, "\u23F3 internal connect: connecting to ws endpoint", this.initConfig.endpoint);
        let i2 = new URL(this.initConfig.endpoint);
        i2.searchParams.set("peer", t2), i2.searchParams.set("token", e), i2.searchParams.set("user_agent_v2", this.store.getUserAgent()), i2.searchParams.set("protocol_version", ia), i2.searchParams.set("protocol_spec", ra), this.endpoint = i2.toString(), this.analyticsTimer.start("ws_connect_time"), yield this.signal.open(this.endpoint), this.analyticsTimer.end("ws_connect_time"), this.analyticsTimer.start("on_policy_change_time"), this.analyticsTimer.start("room_state_time"), l2.d(I2, "\u2705 internal connect: connected to ws endpoint");
      });
    }
    initStatsAnalytics() {
      var e, t2;
      this.isFlagEnabled("publishStats") && (this.publishStatsAnalytics = new Qt(this.store, this.eventBus, this.getValueFromInitConfig("publishStats", "maxSampleWindowSize", 30), this.getValueFromInitConfig("publishStats", "maxSamplePushInterval", 300)), (e = this.getWebrtcInternals()) == null || e.start()), this.isFlagEnabled("subscribeStats") && (this.subscribeStatsAnalytics = new zt(this.store, this.eventBus, this.getValueFromInitConfig("subscribeStats", "maxSampleWindowSize", 10), this.getValueFromInitConfig("subscribeStats", "maxSamplePushInterval", 60)), (t2 = this.getWebrtcInternals()) == null || t2.start());
    }
    getValueFromInitConfig(e, t2, i2) {
      var r2, s2;
      return ((s2 = (r2 = this.initConfig) == null ? void 0 : r2.config[e]) == null ? void 0 : s2[t2]) || i2;
    }
    doesRoleNeedWebRTC(e) {
      var r2, s2;
      if (!this.isFlagEnabled("nonWebRTCDisableOffer")) return true;
      let t2 = !!(e.publishParams.allowed && ((r2 = e.publishParams.allowed) == null ? void 0 : r2.length) > 0), i2 = !!(e.subscribeParams.subscribeToRoles && ((s2 = e.subscribeParams.subscribeToRoles) == null ? void 0 : s2.length) > 0);
      return t2 || i2;
    }
    doesLocalPeerNeedWebRTC() {
      var t2;
      let e = (t2 = this.store.getLocalPeer()) == null ? void 0 : t2.role;
      return e ? this.doesRoleNeedWebRTC(e) : true;
    }
    setTransportStateForConnect() {
      if (this.state === "Failed" && (this.state = "Disconnected"), this.state !== "Disconnected" && this.state !== "Reconnecting") throw S2.WebsocketMethodErrors.AlreadyJoined("JOIN", `Cannot join a meeting in ${this.state} state`);
      this.state === "Disconnected" && (this.state = "Connecting", this.observer.onStateChange(this.state));
    }
    sendErrorAnalyticsEvent(e, t2) {
      let i2 = this.getAdditionalAnalyticsProperties(), r2;
      switch (t2) {
        case 0:
          r2 = y2.connect(e, i2);
          break;
        case 1:
          r2 = y2.disconnect(e, i2);
          break;
        case 2:
          r2 = y2.join({ error: e, time: this.analyticsTimer.getTimeTaken("join_time"), init_response_time: this.analyticsTimer.getTimeTaken("init_response_time"), ws_connect_time: this.analyticsTimer.getTimeTaken("ws_connect_time"), on_policy_change_time: this.analyticsTimer.getTimeTaken("on_policy_change_time"), local_audio_track_time: this.analyticsTimer.getTimeTaken("local_audio_track_time"), local_video_track_time: this.analyticsTimer.getTimeTaken("local_video_track_time"), retries_join: this.joinRetryCount });
          break;
        case 3:
          r2 = y2.publish({ error: e });
          break;
        case 4:
          r2 = y2.subscribeFail(e);
          break;
      }
      this.eventBus.analytics.publish(r2);
    }
    getSubscribeConnection() {
      return this.subscribeConnection;
    }
    getAdditionalAnalyticsProperties() {
      var o2, n2, d2, u2, p2, h2, T, g2;
      let e = to(), t2 = typeof document != "undefined" && document.hidden, i2 = this.store.getRemoteVideoTracks().filter((f2) => f2.degraded).length, r2 = (u2 = (d2 = (n2 = (o2 = this.getWebrtcInternals()) == null ? void 0 : o2.getCurrentStats()) == null ? void 0 : n2.getLocalPeerStats()) == null ? void 0 : d2.publish) == null ? void 0 : u2.bitrate, s2 = (g2 = (T = (h2 = (p2 = this.getWebrtcInternals()) == null ? void 0 : p2.getCurrentStats()) == null ? void 0 : h2.getLocalPeerStats()) == null ? void 0 : T.subscribe) == null ? void 0 : g2.bitrate;
      return { network_info: e, document_hidden: t2, num_degraded_tracks: i2, bitrate: { publish: r2, subscribe: s2 }, max_sub_bitrate: this.maxSubscribeBitrate, recent_pong_response_times: this.signal.getPongResponseTimes(), transport_state: this.state };
    }
  };
  function Mr(a10) {
    if (!a10 || a10.length === 0) throw S2.APIErrors.InvalidTokenFormat("INIT", "Token cannot be an empty string or undefined or null");
    let e = a10.split(".");
    if (e.length !== 3) throw S2.APIErrors.InvalidTokenFormat("INIT", "Expected 3 '.' separate fields - header, payload and signature respectively");
    let t2 = atob(e[1]);
    try {
      let i2 = JSON.parse(t2);
      return { roomId: i2.room_id, userId: i2.user_id, role: i2.role };
    } catch (i2) {
      throw S2.APIErrors.InvalidTokenFormat("INIT", `couldn't parse to json - ${i2.message}`);
    }
  }
  var ro = { published: false, isInitialised: false, isReconnecting: false, isPreviewInProgress: false, isPreviewCalled: false, isJoinInProgress: false, deviceManagersInitialised: false };
  var yr = class {
    constructor() {
      this.TAG = "[HMSSdk]:";
      this.transportState = "Disconnected";
      this.analyticsTimer = new hi();
      this.sdkState = m({}, ro);
      this.isDiagnostics = false;
      this.playlistSettings = { video: { bitrate: $r }, audio: { bitrate: Kr } };
      this.handleAutoplayError = (e) => {
        var t2, i2;
        (i2 = (t2 = this.errorListener) == null ? void 0 : t2.onError) == null || i2.call(t2, e);
      };
      this.observer = { onNotification: (e) => {
        var t2;
        if (e.method === "on-peer-leave-request") {
          this.handlePeerLeaveRequest(e.params);
          return;
        }
        switch (e.method) {
          case "on-policy-change":
            this.analyticsTimer.end("on_policy_change_time");
            break;
          case "peer-list":
            this.analyticsTimer.end("peer_list_time"), this.sendJoinAnalyticsEvent(this.sdkState.isPreviewCalled);
            break;
          case "room-state":
            this.analyticsTimer.end("room_state_time");
            break;
          default:
        }
        (t2 = this.notificationManager) == null || t2.handleNotification(e, this.sdkState.isReconnecting);
      }, onConnected: () => {
        this.initNotificationManager();
      }, onTrackAdd: (e) => {
        var t2;
        (t2 = this.notificationManager) == null || t2.handleTrackAdd(e);
      }, onTrackRemove: (e) => {
        var t2;
        (t2 = this.notificationManager) == null || t2.handleTrackRemove(e);
      }, onFailure: (e) => {
        var t2;
        (t2 = this.errorListener) == null || t2.onError(e);
      }, onStateChange: (e, t2) => c2(this, null, function* () {
        var r2, s2;
        let i2 = (o2) => c2(this, null, function* () {
          var n2, d2;
          yield this.internalLeave(true, o2), !this.sdkState.isPreviewInProgress && !this.sdkState.isJoinInProgress && ((d2 = (n2 = this.errorListener) == null ? void 0 : n2.onError) == null || d2.call(n2, o2)), this.sdkState.isReconnecting = false;
        });
        switch (e) {
          case "Preview":
          case "Joined":
            this.initNotificationManager(), this.transportState === "Reconnecting" && ((r2 = this.listener) == null || r2.onReconnected());
            break;
          case "Failed":
            yield i2(t2);
            break;
          case "Reconnecting":
            this.sdkState.isReconnecting = true, (s2 = this.listener) == null || s2.onReconnecting(t2);
            break;
        }
        this.transportState = e, l2.d(this.TAG, "Transport State Change", this.transportState);
      }) };
      this.handlePeerLeaveRequest = (e) => {
        var r2;
        let t2 = e.requested_by ? this.store.getPeerById(e.requested_by) : void 0, i2 = { roomEnded: e.room_end, reason: e.reason, requestedBy: t2 };
        (r2 = this.listener) == null || r2.onRemovedFromRoom(i2), this.internalLeave(false);
      };
      this.handlePreviewError = (e) => {
        var t2;
        this.analyticsTimer.end("preview_time"), e && ((t2 = this.errorListener) == null || t2.onError(e)), this.sendPreviewAnalyticsEvent(e), this.sdkState.isPreviewInProgress = false;
      };
      this.handleDeviceChange = (e) => {
        var i2, r2;
        if (e.isUserSelection) return;
        l2.d(this.TAG, "Device Change event", e), (r2 = (i2 = this.deviceChangeListener) == null ? void 0 : i2.onDeviceChange) == null || r2.call(i2, e), (() => {
          var s2, o2, n2, d2;
          if (e.error && e.type) {
            let u2 = e.type.includes("audio") ? (s2 = this.localPeer) == null ? void 0 : s2.audioTrack : (o2 = this.localPeer) == null ? void 0 : o2.videoTrack;
            (n2 = this.errorListener) == null || n2.onError(e.error), [k2.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE, k2.TracksErrors.DEVICE_IN_USE, k2.TracksErrors.DEVICE_NOT_AVAILABLE].includes(e.error.code) && u2 && (u2.setEnabled(false), (d2 = this.listener) == null || d2.onTrackUpdate(2, u2, this.localPeer));
          }
        })();
      };
      this.handleAudioPluginError = (e) => {
        var t2;
        l2.e(this.TAG, "Audio Plugin Error event", e), (t2 = this.errorListener) == null || t2.onError(e);
      };
      this.handleError = (e) => {
        var t2;
        l2.e(this.TAG, e), (t2 = this.errorListener) == null || t2.onError(e);
      };
      this.handleLocalRoleUpdate = (i2) => c2(this, [i2], function* ({ oldRole: e, newRole: t2 }) {
        var r2;
        this.deviceManager.currentSelection = this.deviceManager.getCurrentSelection(), yield this.transport.handleLocalRoleUpdate({ oldRole: e, newRole: t2 }), yield (r2 = this.roleChangeManager) == null ? void 0 : r2.handleLocalPeerRoleUpdate({ oldRole: e, newRole: t2 }), yield this.interactivityCenter.whiteboard.handleLocalRoleUpdate();
      });
      this.unpauseRemoteVideoTracks = () => {
        this.store.getRemoteVideoTracks().forEach((e) => e.handleTrackUnmute());
      };
      this.sendAudioPresenceFailed = () => {
        var t2;
        let e = S2.TracksErrors.NoAudioDetected("PREVIEW");
        l2.w(this.TAG, "Audio Presence Failure", this.transportState, e), this.isDiagnostics && ((t2 = this.listener) == null || t2.onError(e));
      };
      this.sendJoinAnalyticsEvent = (e = false, t2) => {
        this.eventBus.analytics.publish(y2.join(M2(m({ error: t2 }, this.analyticsTimer.getTimes()), { time: this.analyticsTimer.getTimeTaken("join_time"), is_preview_called: e, retries_join: this.transport.joinRetryCount })));
      };
      this.sendPreviewAnalyticsEvent = (e) => {
        this.eventBus.analytics.publish(y2.preview(M2(m({ error: e }, this.analyticsTimer.getTimes()), { time: this.analyticsTimer.getTimeTaken("preview_time") })));
      };
      this.sendAnalyticsEvent = (e) => {
        this.isDiagnostics || this.analyticsEventsService.queue(e).flush();
      };
    }
    setSessionPeerInfo(e, t2) {
      var r2, s2, o2, n2;
      let i2 = this.store.getRoom();
      if (!t2 || !i2) {
        l2.e(this.TAG, "setSessionPeerInfo> Local peer or room is undefined");
        return;
      }
      this.sessionPeerInfo = { peer: { peer_id: t2.peerId, role: (r2 = t2.role) == null ? void 0 : r2.name, joined_at: ((s2 = t2.joinedAt) == null ? void 0 : s2.valueOf()) || 0, room_name: i2.name, session_started_at: ((o2 = i2.startedAt) == null ? void 0 : o2.valueOf()) || 0, user_data: t2.customerUserId, user_name: t2.name, template_id: i2.templateId, session_id: i2.sessionId, token: (n2 = this.store.getConfig()) == null ? void 0 : n2.authToken }, agent: this.store.getUserAgent(), device_id: li(), cluster: { websocket_url: e }, timestamp: Date.now() };
    }
    initNotificationManager() {
      this.notificationManager || (this.notificationManager = new nr(this.store, this.eventBus, this.transport, this.listener, this.audioListener));
    }
    initStoreAndManagers(e) {
      var t2, i2;
      if (this.listener = e, this.errorListener = e, this.deviceChangeListener = e, (t2 = this.store) == null || t2.setErrorListener(this.errorListener), this.sdkState.isInitialised) {
        (i2 = this.notificationManager) == null || i2.setListener(this.listener), this.audioSinkManager.setListener(this.listener), this.interactivityCenter.setListener(this.listener), this.transport.setListener(this.listener);
        return;
      }
      this.sdkState.isInitialised = true, this.store = new Ft(), this.store.setErrorListener(this.errorListener), this.eventBus = new Kt(), this.pluginUsageTracker = new Ki(this.eventBus), this.wakeLockManager = new Wi(), this.networkTestManager = new Gi(this.eventBus, this.listener), this.playlistManager = new Lt(this, this.eventBus), this.deviceManager = new Wt(this.store, this.eventBus), this.audioSinkManager = new Gt(this.store, this.deviceManager, this.eventBus), this.audioOutput = new qi(this.deviceManager, this.audioSinkManager), this.audioSinkManager.setListener(this.listener), this.eventBus.autoplayError.subscribe(this.handleAutoplayError), this.localTrackManager = new Se(this.store, this.observer, this.deviceManager, this.eventBus, this.analyticsTimer), this.analyticsEventsService = new $i(this.store), this.transport = new ri(this.observer, this.deviceManager, this.store, this.eventBus, this.analyticsEventsService, this.analyticsTimer, this.pluginUsageTracker), "onInitSuccess" in e && this.transport.setConnectivityListener(e), this.sessionStore = new cr(this.transport), this.interactivityCenter = new jt(this.transport, this.store, this.listener), this.eventBus.analytics.subscribe(this.sendAnalyticsEvent), this.eventBus.deviceChange.subscribe(this.handleDeviceChange), this.eventBus.localVideoUnmutedNatively.subscribe(this.unpauseRemoteVideoTracks), this.eventBus.localAudioUnmutedNatively.subscribe(this.unpauseRemoteVideoTracks), this.eventBus.audioPluginFailed.subscribe(this.handleAudioPluginError), this.eventBus.error.subscribe(this.handleError);
    }
    validateJoined(e) {
      if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", `Not connected - ${e}`);
    }
    sendHLSAnalytics(e) {
      this.sendAnalyticsEvent(y2.hlsPlayerError(e));
    }
    refreshDevices() {
      return c2(this, null, function* () {
        this.validateJoined("refreshDevices"), yield this.deviceManager.init(true);
      });
    }
    getWebrtcInternals() {
      var e;
      return (e = this.transport) == null ? void 0 : e.getWebrtcInternals();
    }
    getDebugInfo() {
      var r2;
      if (!this.transport) throw l2.e(this.TAG, "Transport is not defined"), new Error("getDebugInfo can only be called after join");
      let e = this.transport.getWebsocketEndpoint(), t2 = Object.values(ns).filter((s2) => this.transport.isFlagEnabled(s2)), i2 = (r2 = this.store.getConfig()) == null ? void 0 : r2.initEndpoint;
      return { websocketURL: e, enabledFlags: t2, initEndpoint: i2 };
    }
    getSessionStore() {
      return this.sessionStore;
    }
    getPlaylistManager() {
      return this.playlistManager;
    }
    getRecordingState() {
      var e;
      return (e = this.store.getRoom()) == null ? void 0 : e.recording;
    }
    getRTMPState() {
      var e;
      return (e = this.store.getRoom()) == null ? void 0 : e.rtmp;
    }
    getHLSState() {
      var e;
      return (e = this.store.getRoom()) == null ? void 0 : e.hls;
    }
    getTranscriptionState() {
      var e;
      return (e = this.store.getRoom()) == null ? void 0 : e.transcriptions;
    }
    getTemplateAppData() {
      return this.store.getTemplateAppData();
    }
    getInteractivityCenter() {
      return this.interactivityCenter;
    }
    getPeerListIterator(e) {
      return new ki(this.transport, this.store, e);
    }
    updatePlaylistSettings(e) {
      e.video && Object.assign(this.playlistSettings.video, e.video), e.audio && Object.assign(this.playlistSettings.audio, e.audio);
    }
    get localPeer() {
      var e;
      return (e = this.store) == null ? void 0 : e.getLocalPeer();
    }
    preview(e, t2) {
      return c2(this, null, function* () {
        if (kt(), yt(), this.sdkState.isPreviewInProgress) return Promise.reject(S2.GenericErrors.PreviewAlreadyInProgress("PREVIEW", "Preview already called"));
        if (["Joined", "Reconnecting"].includes(this.transportState)) return this.midCallPreview(e.asRole, e.settings);
        this.analyticsTimer.start("preview_time"), this.setUpPreview(e, t2);
        let i2 = false, r2 = false, s2 = setTimeout(() => {
          var o2, n2;
          (!i2 || !r2) && ((n2 = (o2 = this.listener) == null ? void 0 : o2.onNetworkQuality) == null || n2.call(o2, -1));
        }, 3e3);
        return new Promise((o2, n2) => {
          let d2 = () => c2(this, null, function* () {
            var h2;
            if (this.localPeer) {
              let T = e.asRole && this.store.getPolicyForRole(e.asRole);
              this.localPeer.asRole = T || this.localPeer.role;
            }
            let u2 = yield this.localTrackManager.getTracksToPublish(e.settings);
            u2.forEach((T) => {
              var g2;
              if (this.setLocalPeerTrack(T), T.isTrackNotPublishing()) {
                let f2 = S2.TracksErrors.NoDataInTrack(`${T.type} track has no data. muted: ${T.nativeTrack.muted}, readyState: ${T.nativeTrack.readyState}`);
                l2.e(this.TAG, f2), this.sendAnalyticsEvent(y2.publish({ devices: this.deviceManager.getDevices(), error: f2 })), (g2 = this.listener) == null || g2.onError(f2);
              }
            }), (h2 = this.localPeer) != null && h2.audioTrack && this.initPreviewTrackAudioLevelMonitor(), yield this.initDeviceManagers(), this.sdkState.isPreviewInProgress = false, this.analyticsTimer.end("preview_time");
            let p2 = this.store.getRoom();
            p2 && t2.onPreview(p2, u2), this.sendPreviewAnalyticsEvent(), o2();
          });
          this.eventBus.policyChange.subscribeOnce(d2), this.eventBus.leave.subscribeOnce(this.handlePreviewError), this.eventBus.leave.subscribeOnce((u2) => n2(u2)), this.transport.preview(e.authToken, e.initEndpoint, this.localPeer.peerId, { name: e.userName, metaData: e.metaData || "" }, e.autoVideoSubscribe, e.iceServers).then((u2) => {
            var p2;
            i2 = true, clearTimeout(s2), u2 && e.captureNetworkQualityInPreview && this.networkTestManager.start((p2 = u2.config) == null ? void 0 : p2.networkHealth).then(() => {
              r2 = true;
            });
          }).catch((u2) => {
            this.handlePreviewError(u2), n2(u2);
          });
        });
      });
    }
    midCallPreview(e, t2) {
      return c2(this, null, function* () {
        var s2, o2;
        if (!this.localPeer || this.transportState !== "Joined") throw S2.GenericErrors.NotConnected("VALIDATION", "Not connected - midCallPreview");
        let i2 = e && this.store.getPolicyForRole(e);
        if (!i2) throw S2.GenericErrors.InvalidRole("PREVIEW", `role ${e} does not exist in policy`);
        this.localPeer.asRole = i2;
        let r2 = yield this.localTrackManager.getTracksToPublish(t2);
        r2.forEach((n2) => this.setLocalPeerTrack(n2)), (s2 = this.localPeer) != null && s2.audioTrack && this.initPreviewTrackAudioLevelMonitor(), yield this.initDeviceManagers(), (o2 = this.listener) == null || o2.onPreview(this.store.getRoom(), r2);
      });
    }
    cancelMidCallPreview() {
      return c2(this, null, function* () {
        var e, t2, i2;
        if ((!this.localPeer || !this.localPeer.isInPreview()) && l2.w(this.TAG, "Cannot cancel mid call preview as preview is not in progress"), (e = this.localPeer) != null && e.asRole && this.localPeer.role) {
          let r2 = this.localPeer.asRole, s2 = this.localPeer.role;
          delete this.localPeer.asRole, yield (t2 = this.roleChangeManager) == null ? void 0 : t2.diffRolesAndPublishTracks({ oldRole: r2, newRole: s2 }), (i2 = this.listener) == null || i2.onPeerUpdate(8, this.localPeer);
        }
      });
    }
    join(e, t2) {
      return c2(this, null, function* () {
        var d2, u2, p2, h2, T, g2, f2, P2;
        if (kt(), yt(), this.sdkState.isPreviewInProgress) throw S2.GenericErrors.NotReady("JOIN", "Preview is in progress, can't join");
        (u2 = (d2 = this.eventBus) == null ? void 0 : d2.leave) == null || u2.unsubscribe(this.handlePreviewError), this.analyticsTimer.start("join_time"), this.sdkState.isJoinInProgress = true;
        let { roomId: i2, userId: r2, role: s2 } = Mr(e.authToken), o2 = ((h2 = (p2 = this.localPeer) == null ? void 0 : p2.asRole) == null ? void 0 : h2.name) || ((g2 = (T = this.localPeer) == null ? void 0 : T.role) == null ? void 0 : g2.name);
        (f2 = this.networkTestManager) == null || f2.stop(), this.commonSetup(e, i2, t2), this.removeDevicesFromConfig(e), this.store.setConfig(e), this.store.createAndSetUserAgent(this.frameworkInfo), ce.resumeContext();
        let n2 = this.store.getConfig();
        n2 != null && n2.autoManageWakeLock && this.wakeLockManager.acquireLock(), this.localPeer ? (this.localPeer.name = e.userName, this.localPeer.role = this.store.getPolicyForRole(s2), this.localPeer.customerUserId = r2, this.localPeer.metadata = e.metaData, delete this.localPeer.asRole) : this.createAndAddLocalPeerToStore(e, s2, r2), this.roleChangeManager = new Bt(this.store, this.transport, this.deviceManager, this.getAndPublishTracks.bind(this), this.removeTrack.bind(this), this.listener), this.eventBus.localRoleUpdate.subscribe(this.handleLocalRoleUpdate), l2.d(this.TAG, `\u23F3 Joining room ${i2}`), l2.time(`join-room-${i2}`);
        try {
          yield this.transport.join(e.authToken, this.localPeer.peerId, { name: e.userName, metaData: e.metaData }, e.initEndpoint, e.autoVideoSubscribe, e.iceServers), l2.d(this.TAG, `\u2705 Joined room ${i2}`), this.analyticsTimer.start("peer_list_time"), yield this.notifyJoin(), this.sdkState.isJoinInProgress = false, yield this.publish(e.settings, o2);
        } catch (v2) {
          throw this.analyticsTimer.end("join_time"), this.sdkState.isJoinInProgress = false, (P2 = this.listener) == null || P2.onError(v2), this.sendJoinAnalyticsEvent(this.sdkState.isPreviewCalled, v2), l2.e(this.TAG, "Unable to join room", v2), v2;
        }
        l2.timeEnd(`join-room-${i2}`);
      });
    }
    stringifyMetadata(e) {
      e.metaData && typeof e.metaData != "string" ? e.metaData = JSON.stringify(e.metaData) : e.metaData || (e.metaData = "");
    }
    cleanup() {
      var e, t2, i2;
      this.cleanDeviceManagers(), this.eventBus.analytics.unsubscribe(this.sendAnalyticsEvent), this.eventBus.localVideoUnmutedNatively.unsubscribe(this.unpauseRemoteVideoTracks), this.eventBus.localAudioUnmutedNatively.unsubscribe(this.unpauseRemoteVideoTracks), this.eventBus.error.unsubscribe(this.handleError), this.analyticsTimer.cleanup(), X2.cleanup(), this.playlistManager.cleanup(), (e = this.wakeLockManager) == null || e.cleanup(), Se.cleanup(), this.notificationManager = void 0, l2.cleanup(), this.sdkState = m({}, ro), this.localPeer && ((t2 = this.localPeer.audioTrack) == null || t2.cleanup(), this.localPeer.audioTrack = void 0, (i2 = this.localPeer.videoTrack) == null || i2.cleanup(), this.localPeer.videoTrack = void 0), this.store.cleanup(), this.listener = void 0, this.roleChangeManager && this.eventBus.localRoleUpdate.unsubscribe(this.handleLocalRoleUpdate);
    }
    leave(e) {
      return this.internalLeave(e);
    }
    internalLeave(e = true, t2) {
      return c2(this, null, function* () {
        var r2, s2, o2, n2;
        let i2 = (r2 = this.store) == null ? void 0 : r2.getRoom();
        if (i2) {
          for (; (this.sdkState.isPreviewInProgress || this.sdkState.isJoinInProgress) && !(t2 != null && t2.isTerminal); ) yield xe(100);
          let d2 = i2.id;
          this.setSessionPeerInfo(this.transport.getWebsocketEndpoint() || "", this.localPeer), (s2 = this.networkTestManager) == null || s2.stop(), this.eventBus.leave.publish(t2);
          let u2 = (o2 = this.localPeer) == null ? void 0 : o2.peerId;
          l2.d(this.TAG, `\u23F3 Leaving room ${d2}, peerId=${u2}`), yield (n2 = this.transport) == null ? void 0 : n2.leave(e, t2 ? "sdk request" : "user request"), this.cleanup(), l2.d(this.TAG, `\u2705 Left room ${d2}, peerId=${u2}`);
        }
      });
    }
    getAuthTokenByRoomCode(e, t2) {
      return c2(this, null, function* () {
        let i2 = (t2 || {}).endpoint || "https://auth.100ms.live/v2/token";
        this.analyticsTimer.start("GET_TOKEN");
        let r2 = yield Bi(i2, { method: "POST", body: JSON.stringify({ code: e.roomCode, user_id: e.userId }) }, [429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511]), s2 = yield r2.json();
        if (this.analyticsTimer.end("GET_TOKEN"), !r2.ok) throw S2.APIErrors.ServerErrors(s2.code, "GET_TOKEN", s2.message, false);
        let { token: o2 } = s2;
        if (!o2) throw Error(s2.message);
        return o2;
      });
    }
    getLocalPeer() {
      return this.store.getLocalPeer();
    }
    getPeers() {
      return this.store.getPeers();
    }
    getPeerMap() {
      return this.store.getPeerMap();
    }
    getAudioOutput() {
      return this.audioOutput;
    }
    sendMessage(e, t2) {
      this.sendMessageInternal({ message: t2, type: e });
    }
    sendBroadcastMessage(e, t2) {
      return c2(this, null, function* () {
        return yield this.sendMessageInternal({ message: e, type: t2 });
      });
    }
    sendGroupMessage(e, t2, i2) {
      return c2(this, null, function* () {
        let r2 = this.store.getKnownRoles();
        if ((t2.filter((o2) => r2[o2.name]) || []).length === 0) throw S2.GenericErrors.ValidationFailed("No valid role is present", t2);
        return yield this.sendMessageInternal({ message: e, recipientRoles: t2, type: i2 });
      });
    }
    sendDirectMessage(e, t2, i2) {
      return c2(this, null, function* () {
        var o2, n2;
        if (((o2 = this.localPeer) == null ? void 0 : o2.peerId) === t2) throw S2.GenericErrors.ValidationFailed("Cannot send message to self");
        let r2 = !!((n2 = this.store.getRoom()) != null && n2.large_room_optimization), s2 = this.store.getPeerById(t2);
        if (!s2) if (r2) {
          let d2 = yield this.transport.signal.getPeer({ peer_id: t2 });
          if (!d2) throw S2.GenericErrors.ValidationFailed("Invalid peer - peer not present in the room", t2);
          s2 = ke(d2, this.store);
        } else throw S2.GenericErrors.ValidationFailed("Invalid peer - peer not present in the room", t2);
        return yield this.sendMessageInternal({ message: e, recipientPeer: s2, type: i2 });
      });
    }
    submitSessionFeedback(e, t2) {
      return c2(this, null, function* () {
        if (!this.sessionPeerInfo) throw l2.e(this.TAG, "submitSessionFeedback> session is undefined"), new Error("session is undefined");
        let i2 = this.sessionPeerInfo.peer.token;
        if (!i2) throw l2.e(this.TAG, "submitSessionFeedback> token is undefined"), new Error("Internal error, token is not present");
        try {
          yield $t.sendFeedback({ token: i2, info: this.sessionPeerInfo, feedback: e, eventEndpoint: t2 }), l2.i(this.TAG, "submitSessionFeedback> submitted feedback"), this.sessionPeerInfo = void 0;
        } catch (r2) {
          throw l2.e(this.TAG, "submitSessionFeedback> error occured ", r2), new Error("Unable to submit feedback");
        }
      });
    }
    getPeer(e) {
      return c2(this, null, function* () {
        let t2 = yield this.transport.signal.getPeer({ peer_id: e });
        if (t2) return ke(t2, this.store);
      });
    }
    findPeerByName(r2) {
      return c2(this, arguments, function* ({ query: e, limit: t2 = 10, offset: i2 }) {
        let { peers: s2, offset: o2, eof: n2 } = yield this.transport.signal.findPeerByName({ query: e == null ? void 0 : e.toLowerCase(), limit: t2, offset: i2 });
        return s2.length > 0 ? { offset: o2, eof: n2, peers: s2.map((d2) => ke({ peer_id: d2.peer_id, role: d2.role, groups: [], info: { name: d2.name, data: "", user_id: "", type: d2.type } }, this.store)) } : { offset: o2, peers: [] };
      });
    }
    sendMessageInternal(s2) {
      return c2(this, arguments, function* ({ recipientRoles: e, recipientPeer: t2, type: i2 = "chat", message: r2 }) {
        if (r2.replace(/\u200b/g, " ").trim() === "") throw l2.w(this.TAG, "sendMessage", "Ignoring empty message send"), S2.GenericErrors.ValidationFailed("Empty message not allowed");
        let o2 = { info: { message: r2, type: i2 } };
        return e != null && e.length && (o2.roles = e.map((n2) => n2.name)), t2 != null && t2.peerId && (o2.peer_id = t2.peerId), l2.d(this.TAG, "Sending Message: ", o2), yield this.transport.signal.broadcast(o2);
      });
    }
    startScreenShare(e, t2) {
      return c2(this, null, function* () {
        var n2, d2, u2;
        let i2 = this.store.getPublishParams();
        if (!i2) return;
        let { allowed: r2 } = i2;
        if (!(r2 && r2.includes("screen"))) {
          l2.e(this.TAG, `Role ${(n2 = this.localPeer) == null ? void 0 : n2.role} cannot share screen`);
          return;
        }
        if ((u2 = (d2 = this.localPeer) == null ? void 0 : d2.auxiliaryTracks) != null && u2.find((p2) => p2.source === "screen")) throw Error("Cannot share multiple screens");
        let o2 = yield this.getScreenshareTracks(e, t2);
        if (!this.localPeer) {
          l2.d(this.TAG, "Screenshared when not connected"), o2.forEach((p2) => {
            p2.cleanup();
          });
          return;
        }
        this.transport.setOnScreenshareStop(() => {
          this.stopEndedScreenshare(e);
        }), yield this.transport.publish(o2), o2.forEach((p2) => {
          var h2, T, g2;
          p2.peerId = (h2 = this.localPeer) == null ? void 0 : h2.peerId, (T = this.localPeer) == null || T.auxiliaryTracks.push(p2), (g2 = this.listener) == null || g2.onTrackUpdate(0, p2, this.localPeer);
        });
      });
    }
    stopEndedScreenshare(e) {
      return c2(this, null, function* () {
        l2.d(this.TAG, "\u2705 Screenshare ended natively"), yield this.stopScreenShare(), e();
      });
    }
    stopScreenShare() {
      return c2(this, null, function* () {
        var t2;
        l2.d(this.TAG, "\u2705 Screenshare ended from app");
        let e = (t2 = this.localPeer) == null ? void 0 : t2.auxiliaryTracks.filter((i2) => i2.source === "screen");
        if (e) for (let i2 of e) yield this.removeTrack(i2.trackId);
      });
    }
    addTrack(e, t2 = "regular") {
      return c2(this, null, function* () {
        var u2, p2, h2, T;
        if (!e) {
          l2.w(this.TAG, "Please pass a valid MediaStreamTrack");
          return;
        }
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot addTrack");
        if (this.localPeer.auxiliaryTracks.find((g2) => g2.trackId === e.id)) return;
        let r2 = e.kind, s2 = new MediaStream([e]), o2 = new ge(s2), n2 = r2 === "audio" ? de : G2, d2 = new n2(o2, e, t2, this.eventBus);
        yield this.applySettings(d2), yield this.setPlaylistSettings({ track: e, hmsTrack: d2, source: t2 }), yield (u2 = this.transport) == null ? void 0 : u2.publish([d2]), d2.peerId = (p2 = this.localPeer) == null ? void 0 : p2.peerId, (h2 = this.localPeer) == null || h2.auxiliaryTracks.push(d2), (T = this.listener) == null || T.onTrackUpdate(0, d2, this.localPeer);
      });
    }
    removeTrack(e, t2 = false) {
      return c2(this, null, function* () {
        var r2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot removeTrack");
        let i2 = this.localPeer.auxiliaryTracks.findIndex((s2) => s2.trackId === e);
        if (i2 > -1) {
          let s2 = this.localPeer.auxiliaryTracks[i2];
          s2.isPublished ? yield this.transport.unpublish([s2]) : yield s2.cleanup(), t2 || this.stopPlaylist(s2), this.localPeer.auxiliaryTracks.splice(i2, 1), (r2 = this.listener) == null || r2.onTrackUpdate(1, s2, this.localPeer);
        } else l2.w(this.TAG, `No track found for ${e}`);
      });
    }
    setAnalyticsLevel(e) {
      this.analyticsEventsService.level = e;
    }
    setLogLevel(e) {
      l2.level = e;
    }
    autoSelectAudioOutput(e) {
      var t2;
      (t2 = this.deviceManager) == null || t2.autoSelectAudioOutput(e);
    }
    addAudioListener(e) {
      var t2;
      this.audioListener = e, (t2 = this.notificationManager) == null || t2.setAudioListener(e);
    }
    addConnectionQualityListener(e) {
      var t2;
      (t2 = this.notificationManager) == null || t2.setConnectionQualityListener(e);
    }
    setIsDiagnostics(e) {
      this.isDiagnostics = e;
    }
    changeRole(e, t2, i2 = false) {
      return c2(this, null, function* () {
        var r2;
        yield (r2 = this.transport) == null ? void 0 : r2.signal.requestRoleChange({ requested_for: e, role: t2, force: i2 });
      });
    }
    changeRoleOfPeer(e, t2, i2 = false) {
      return c2(this, null, function* () {
        var r2;
        yield (r2 = this.transport) == null ? void 0 : r2.signal.requestRoleChange({ requested_for: e, role: t2, force: i2 });
      });
    }
    changeRoleOfPeersWithRoles(e, t2) {
      return c2(this, null, function* () {
        var i2;
        e.length <= 0 || !t2 || (yield (i2 = this.transport) == null ? void 0 : i2.signal.requestBulkRoleChange({ roles: e.map((r2) => r2.name), role: t2, force: true }));
      });
    }
    acceptChangeRole(e) {
      return c2(this, null, function* () {
        var t2, i2;
        yield (i2 = this.transport) == null ? void 0 : i2.signal.acceptRoleChangeRequest({ requested_by: (t2 = e.requestedBy) == null ? void 0 : t2.peerId, role: e.role.name, token: e.token });
      });
    }
    endRoom(e, t2) {
      return c2(this, null, function* () {
        var i2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot end room");
        yield (i2 = this.transport) == null ? void 0 : i2.signal.endRoom(e, t2), yield this.leave();
      });
    }
    removePeer(e, t2) {
      return c2(this, null, function* () {
        var i2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot remove peer");
        yield (i2 = this.transport) == null ? void 0 : i2.signal.removePeer({ requested_for: e, reason: t2 });
      });
    }
    startRTMPOrRecording(e) {
      return c2(this, null, function* () {
        var i2, r2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot start streaming or recording");
        let t2 = { meeting_url: e.meetingURL, record: e.record };
        (i2 = e.rtmpURLs) != null && i2.length && (t2.rtmp_urls = e.rtmpURLs), e.resolution && (t2.resolution = e.resolution), yield (r2 = this.transport) == null ? void 0 : r2.signal.startRTMPOrRecording(t2);
      });
    }
    stopRTMPAndRecording() {
      return c2(this, null, function* () {
        var e;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot stop streaming or recording");
        yield (e = this.transport) == null ? void 0 : e.signal.stopRTMPAndRecording();
      });
    }
    startHLSStreaming(e) {
      return c2(this, null, function* () {
        var i2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot start HLS streaming");
        let t2 = {};
        e && e.variants && e.variants.length > 0 && (t2.variants = e.variants.map((r2) => {
          let s2 = { meeting_url: r2.meetingURL };
          return r2.metadata && (s2.metadata = r2.metadata), s2;
        })), e != null && e.recording && (t2.hls_recording = { single_file_per_layer: e.recording.singleFilePerLayer, hls_vod: e.recording.hlsVod }), yield (i2 = this.transport) == null ? void 0 : i2.signal.startHLSStreaming(t2);
      });
    }
    stopHLSStreaming(e) {
      return c2(this, null, function* () {
        var t2, i2, r2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot stop HLS streaming");
        if (e) {
          let s2 = { variants: (t2 = e == null ? void 0 : e.variants) == null ? void 0 : t2.map((o2) => {
            let n2 = { meeting_url: o2.meetingURL };
            return o2.metadata && (n2.metadata = o2.metadata), n2;
          }), stop_reason: e.stop_reason };
          yield (i2 = this.transport) == null ? void 0 : i2.signal.stopHLSStreaming(s2);
        } else yield (r2 = this.transport) == null ? void 0 : r2.signal.stopHLSStreaming();
      });
    }
    startTranscription(e) {
      return c2(this, null, function* () {
        var i2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot start transcriptions");
        let t2 = { mode: e.mode };
        yield (i2 = this.transport) == null ? void 0 : i2.signal.startTranscription(t2);
      });
    }
    stopTranscription(e) {
      return c2(this, null, function* () {
        var i2;
        if (!this.localPeer) throw S2.GenericErrors.NotConnected("VALIDATION", "No local peer present, cannot stop transcriptions");
        if (!e) throw S2.GenericErrors.Signalling("VALIDATION", "No mode is passed to stop the transcription");
        let t2 = { mode: e.mode };
        yield (i2 = this.transport) == null ? void 0 : i2.signal.stopTranscription(t2);
      });
    }
    sendHLSTimedMetadata(e) {
      return c2(this, null, function* () {
        var t2;
        if (this.validateJoined("sendHLSTimedMetadata"), e.length > 0) {
          let i2 = { metadata_objs: e };
          yield (t2 = this.transport) == null ? void 0 : t2.signal.sendHLSTimedMetadata(i2);
        }
      });
    }
    changeName(e) {
      return c2(this, null, function* () {
        var i2, r2;
        this.validateJoined("changeName");
        let t2 = this.store.getLocalPeer();
        t2 && t2.name !== e && (yield (i2 = this.transport) == null ? void 0 : i2.signal.updatePeer({ name: e }), (r2 = this.notificationManager) == null || r2.updateLocalPeer({ name: e }));
      });
    }
    changeMetadata(e) {
      return c2(this, null, function* () {
        var t2, i2;
        this.validateJoined("changeMetadata"), yield (t2 = this.transport) == null ? void 0 : t2.signal.updatePeer({ data: e }), (i2 = this.notificationManager) == null || i2.updateLocalPeer({ metadata: e });
      });
    }
    setSessionMetadata(e) {
      return c2(this, null, function* () {
        var t2;
        yield (t2 = this.transport) == null ? void 0 : t2.signal.setSessionMetadata({ key: "default", data: e });
      });
    }
    getSessionMetadata() {
      return c2(this, null, function* () {
        var t2;
        return (yield (t2 = this.transport) == null ? void 0 : t2.signal.getSessionMetadata("default")).data;
      });
    }
    getRoles() {
      return Object.values(this.store.getKnownRoles());
    }
    changeTrackState(e, t2) {
      return c2(this, null, function* () {
        var r2;
        if (e.type === "video" && e.source !== "regular") {
          l2.w(this.TAG, "Muting non-regular video tracks is currently not supported");
          return;
        }
        if (e.enabled === t2) {
          l2.w(this.TAG, `Aborting change track state, track already has enabled - ${t2}`, e);
          return;
        }
        if (!this.store.getTrackById(e.trackId)) throw S2.GenericErrors.ValidationFailed("No track found for change track state", e);
        let i2 = this.store.getPeerByTrackId(e.trackId);
        if (!i2) throw S2.GenericErrors.ValidationFailed("No peer found for change track state", e);
        yield (r2 = this.transport) == null ? void 0 : r2.signal.requestTrackStateChange({ requested_for: i2.peerId, track_id: e.trackId, stream_id: e.stream.id, mute: !t2 });
      });
    }
    changeMultiTrackState(e) {
      return c2(this, null, function* () {
        var o2;
        if (typeof e.enabled != "boolean") throw S2.GenericErrors.ValidationFailed("Pass a boolean for enabled");
        let { enabled: t2, roles: i2, type: r2, source: s2 } = e;
        yield (o2 = this.transport) == null ? void 0 : o2.signal.requestMultiTrackStateChange({ value: !t2, type: r2, source: s2, roles: i2 == null ? void 0 : i2.map((n2) => n2 == null ? void 0 : n2.name) });
      });
    }
    raiseLocalPeerHand() {
      return c2(this, null, function* () {
        var e;
        this.validateJoined("raiseLocalPeerHand"), yield (e = this.transport) == null ? void 0 : e.signal.joinGroup(Ae);
      });
    }
    lowerLocalPeerHand() {
      return c2(this, null, function* () {
        var e;
        this.validateJoined("lowerLocalPeerHand"), yield (e = this.transport) == null ? void 0 : e.signal.leaveGroup(Ae);
      });
    }
    raiseRemotePeerHand(e) {
      return c2(this, null, function* () {
        var t2;
        yield (t2 = this.transport) == null ? void 0 : t2.signal.addToGroup(e, Ae);
      });
    }
    lowerRemotePeerHand(e) {
      return c2(this, null, function* () {
        var t2;
        yield (t2 = this.transport) == null ? void 0 : t2.signal.removeFromGroup(e, Ae);
      });
    }
    setFrameworkInfo(e) {
      this.frameworkInfo = m(m({}, this.frameworkInfo), e);
    }
    attachVideo(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.store.getConfig();
        i2 != null && i2.autoManageVideo ? e.attach(t2) : yield e.addSink(t2);
      });
    }
    detachVideo(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.store.getConfig();
        i2 != null && i2.autoManageVideo ? e.detach(t2) : yield e.removeSink(t2);
      });
    }
    publish(e, t2) {
      return c2(this, null, function* () {
        var i2, r2, s2;
        if ([this.store.getPublishParams(), !this.sdkState.published, !Ge].every((o2) => !!o2)) {
          let o2 = t2 && t2 !== ((r2 = (i2 = this.localPeer) == null ? void 0 : i2.role) == null ? void 0 : r2.name) ? () => {
            var n2;
            return (n2 = this.roleChangeManager) == null ? void 0 : n2.diffRolesAndPublishTracks({ oldRole: this.store.getPolicyForRole(t2), newRole: this.localPeer.role });
          } : () => this.getAndPublishTracks(e);
          yield (s2 = o2 == null ? void 0 : o2()) == null ? void 0 : s2.catch((n2) => {
            var d2;
            l2.e(this.TAG, "Error in publish", n2), (d2 = this.listener) == null || d2.onError(n2);
          });
        }
      });
    }
    getAndPublishTracks(e) {
      return c2(this, null, function* () {
        var i2, r2;
        let t2 = yield this.localTrackManager.getTracksToPublish(e);
        yield this.initDeviceManagers(), yield this.setAndPublishTracks(t2), (r2 = (i2 = this.localPeer) == null ? void 0 : i2.audioTrack) == null || r2.initAudioLevelMonitor(), this.sdkState.published = true;
      });
    }
    setAndPublishTracks(e) {
      return c2(this, null, function* () {
        var t2, i2;
        for (let r2 of e) {
          if (yield this.transport.publish([r2]), r2.isTrackNotPublishing()) {
            let s2 = S2.TracksErrors.NoDataInTrack(`${r2.type} track has no data. muted: ${r2.nativeTrack.muted}, readyState: ${r2.nativeTrack.readyState}`);
            l2.e(this.TAG, s2), this.sendAnalyticsEvent(y2.publish({ devices: this.deviceManager.getDevices(), error: s2 })), (t2 = this.listener) == null || t2.onError(s2);
          }
          yield this.setLocalPeerTrack(r2), (i2 = this.listener) == null || i2.onTrackUpdate(0, r2, this.localPeer);
        }
      });
    }
    setLocalPeerTrack(e) {
      return c2(this, null, function* () {
        var t2;
        switch (e.peerId = (t2 = this.localPeer) == null ? void 0 : t2.peerId, e.type) {
          case "audio":
            this.localPeer.audioTrack = e, yield this.deviceManager.autoSelectAudioOutput();
            break;
          case "video":
            this.localPeer.videoTrack = e;
            break;
        }
      });
    }
    initDeviceManagers() {
      return c2(this, null, function* () {
        var e, t2, i2, r2, s2;
        this.sdkState.deviceManagersInitialised || (this.sdkState.deviceManagersInitialised = true, yield this.deviceManager.init(), (yield this.deviceManager.updateOutputDevice((t2 = (e = this.store.getConfig()) == null ? void 0 : e.settings) == null ? void 0 : t2.audioOutputDeviceId)) || (yield this.deviceManager.updateOutputDevice((r2 = (i2 = X2.getSelection()) == null ? void 0 : i2.audioOutput) == null ? void 0 : r2.deviceId)), this.audioSinkManager.init((s2 = this.store.getConfig()) == null ? void 0 : s2.audioSinkElementId));
      });
    }
    cleanDeviceManagers() {
      this.eventBus.deviceChange.unsubscribe(this.handleDeviceChange), this.eventBus.audioPluginFailed.unsubscribe(this.handleAudioPluginError), this.eventBus.autoplayError.unsubscribe(this.handleAutoplayError), this.deviceManager.cleanup(), this.audioSinkManager.cleanup();
    }
    initPreviewTrackAudioLevelMonitor() {
      var t2;
      let e = (t2 = this.localPeer) == null ? void 0 : t2.audioTrack;
      e == null || e.initAudioLevelMonitor(), this.eventBus.trackAudioLevelUpdate.subscribe((i2) => {
        var s2;
        let r2 = i2 && i2.track.trackId === (e == null ? void 0 : e.trackId) ? [{ audioLevel: i2.audioLevel, peer: this.localPeer, track: e }] : [];
        this.store.updateSpeakers(r2), (s2 = this.audioListener) == null || s2.onAudioLevelUpdate(r2);
      }), this.eventBus.localAudioSilence.subscribe(this.sendAudioPresenceFailed);
    }
    notifyJoin() {
      var i2;
      let e = this.store.getLocalPeer(), t2 = this.store.getRoom();
      if (!t2) {
        l2.w(this.TAG, "notify join - room not present");
        return;
      }
      if (t2.joinedAt = /* @__PURE__ */ new Date(), e && (e.joinedAt = t2.joinedAt), e != null && e.role) {
        this.analyticsTimer.end("join_time"), (i2 = this.listener) == null || i2.onJoin(t2);
        return;
      }
      return new Promise((r2, s2) => {
        this.eventBus.policyChange.subscribeOnce(() => {
          var o2;
          this.analyticsTimer.end("join_time"), (o2 = this.listener) == null || o2.onJoin(t2), r2();
        }), this.eventBus.leave.subscribeOnce((o2) => {
          s2(o2);
        });
      });
    }
    setUpPreview(e, t2) {
      this.sdkState.isPreviewCalled = true, this.sdkState.isPreviewInProgress = true;
      let { roomId: i2, userId: r2, role: s2 } = Mr(e.authToken);
      this.commonSetup(e, i2, t2), this.store.setConfig(e), this.store.createAndSetUserAgent(this.frameworkInfo), this.createAndAddLocalPeerToStore(e, s2, r2, e.asRole);
    }
    setPlaylistSettings(r2) {
      return c2(this, arguments, function* ({ track: e, hmsTrack: t2, source: i2 }) {
        var s2, o2;
        if (i2 === "videoplaylist") {
          let n2 = {};
          if (e.kind === "audio") n2.maxBitrate = ((s2 = this.playlistSettings.audio) == null ? void 0 : s2.bitrate) || Kr;
          else {
            n2.maxBitrate = ((o2 = this.playlistSettings.video) == null ? void 0 : o2.bitrate) || $r;
            let { width: d2, height: u2 } = e.getSettings();
            n2.width = d2, n2.height = u2;
          }
          yield t2.setSettings(n2);
        } else i2 === "audioplaylist" && (yield t2.setSettings({ maxBitrate: 64 }));
      });
    }
    createAndAddLocalPeerToStore(e, t2, i2, r2) {
      let s2 = this.store.getPolicyForRole(t2), o2 = r2 ? this.store.getPolicyForRole(r2) : void 0, n2 = new qe({ name: e.userName || "", customerUserId: i2, metadata: e.metaData || "", role: s2, asRole: o2 || s2, type: "regular" });
      this.store.addPeer(n2);
    }
    commonSetup(e, t2, i2) {
      this.stringifyMetadata(e), e.initEndpoint || (e.initEndpoint = "https://prod-init.100ms.live"), this.initStoreAndManagers(i2), this.store.getRoom() || this.store.setRoom(new Je(t2));
    }
    removeDevicesFromConfig(e) {
      this.store.getConfig() && e.settings && (delete e.settings.audioOutputDeviceId, delete e.settings.videoDeviceId, delete e.settings.audioInputDeviceId);
    }
    getScreenshareTracks(e, t2) {
      return c2(this, null, function* () {
        let i2 = this.transport.isFlagEnabled("scaleScreenshareBasedOnPixels"), [r2, s2] = yield this.localTrackManager.getLocalScreen(t2, i2), o2 = () => {
          this.stopEndedScreenshare(e);
        }, n2 = [];
        if (t2 != null && t2.audioOnly) {
          if (r2.nativeTrack.stop(), !s2) throw S2.TracksErrors.NothingToReturn("TRACK", "Select share audio when sharing screen", "No audio found");
          n2.push(s2), s2.nativeTrack.addEventListener("ended", o2);
        } else n2.push(r2), r2.nativeTrack.addEventListener("ended", o2), s2 && n2.push(s2);
        return n2;
      });
    }
    stopPlaylist(e) {
      e.source === "audioplaylist" ? this.playlistManager.stop("audio") : e.source === "videoplaylist" && this.playlistManager.stop("video");
    }
    applySettings(e) {
      return c2(this, null, function* () {
        Ns(this.store);
        let t2 = this.store.getPublishParams();
        if (t2) {
          if (e instanceof G2) {
            let i2 = e.source === "regular" ? "video" : e.source === "screen" ? "screen" : "";
            if (!i2 || !t2.allowed.includes(i2)) return;
            let r2 = t2[i2];
            if (!r2) return;
            let s2 = new q2().codec(r2.codec).maxBitrate(r2.bitRate).maxFramerate(r2.frameRate).setWidth(r2.width).setHeight(r2.height).build();
            yield e.setSettings(s2);
          } else if (e instanceof de) {
            if (!t2.allowed.includes("audio")) return;
            let i2 = new J().codec(t2.audio.codec).maxBitrate(t2.audio.bitRate).build();
            yield e.setSettings(i2);
          }
        }
      });
    }
  };
  var mt = class a9 {
    constructor(e, t2, i2) {
      this.getStats = () => (this.stats || (this.stats = new si(this.store, this.sdk)), this.stats);
      this.getDiagnosticsSDK = () => (this.diagnostics || (this.diagnostics = this.actions.initDiagnostics()), this.diagnostics);
      e ? this.store = e : this.store = a9.createNewHMSStore(Fi("HMSStore"), oi), i2 ? this.notifications = i2 : this.notifications = new Li(this.store), t2 ? this.actions = t2 : (this.sdk = new yr(), this.actions = new Vi(this.store, this.sdk, this.notifications)), this.actions.setFrameworkInfo({ type: "js", sdkVersion: Ir().version }), this.initialTriggerOnSubscribe = false, U2 && (window.__hms = this);
    }
    triggerOnSubscribe() {
      this.initialTriggerOnSubscribe || (a9.makeStoreTriggerOnSubscribe(this.store), this.initialTriggerOnSubscribe = true);
    }
    getStore() {
      return this.store;
    }
    getHMSActions() {
      return this.actions;
    }
    getActions() {
      return this.actions;
    }
    getNotifications() {
      return { onNotification: this.notifications.onNotification };
    }
    static createNewHMSStore(e, t2) {
      let i2 = vanilla_default(() => t2()), r2 = i2.setState;
      i2.setState = (n2) => {
        let d2 = typeof n2 == "function" ? fn(n2) : n2;
        r2(d2);
      };
      let s2 = i2.getState;
      i2.getState = (n2) => n2 ? n2(s2()) : s2(), a9.compareWithShallowCheckInSubscribe(i2);
      let o2 = a9.setUpDevtools(i2, e);
      return M2(m({}, i2), { namedSetState: o2 });
    }
    static makeStoreTriggerOnSubscribe(e) {
      let t2 = e.subscribe;
      e.subscribe = (i2, r2, s2) => (i2(e.getState(r2), void 0), t2(i2, r2, s2));
    }
    static compareWithShallowCheckInSubscribe(e) {
      let t2 = e.subscribe;
      e.subscribe = (i2, r2, s2) => (r2 || (r2 = (o2) => o2), s2 = s2 || shallow_default, t2(i2, r2, s2));
    }
    static setUpDevtools(e, t2) {
      let i2;
      try {
        i2 = window.__REDUX_DEVTOOLS_EXTENSION__ || window.top.__REDUX_DEVTOOLS_EXTENSION__;
      } catch (o2) {
      }
      if (!i2) return (o2) => {
        e.setState(o2);
      };
      let r2 = i2.connect(a9.devtoolsOptions(t2));
      r2.prefix = t2 ? `${t2} > ` : "";
      let s2 = e.setState;
      return e.setState = (o2) => {
        s2(o2), r2.send(`${r2.prefix}setState`, e.getState());
      }, r2.subscribe(a9.devtoolsSubscribe(r2, e, s2)), r2.send("setUpStore", e.getState()), (o2, n2) => {
        s2(o2);
        let d2 = n2 || `${r2.prefix}action`;
        r2.send(d2, e.getState());
      };
    }
    static devtoolsOptions(e) {
      return { name: e, actionsBlacklist: ["audioLevel", "playlistProgress", "connectionQuality"] };
    }
    static devtoolsSubscribe(e, t2, i2) {
      return (r2) => {
        var s2, o2, n2, d2;
        if (r2.type === "DISPATCH" && r2.state) ["JUMP_TO_ACTION", "JUMP_TO_STATE"].includes(r2.payload.type) ? i2(JSON.parse(r2.state)) : t2.setState(JSON.parse(r2.state));
        else if (r2.type === "DISPATCH" && ((s2 = r2.payload) == null ? void 0 : s2.type) === "COMMIT") e.init(t2.getState());
        else if (r2.type === "DISPATCH" && ((o2 = r2.payload) == null ? void 0 : o2.type) === "IMPORT_STATE") {
          let u2 = (n2 = r2.payload.nextLiftedState) == null ? void 0 : n2.actionsById;
          (((d2 = r2.payload.nextLiftedState) == null ? void 0 : d2.computedStates) || []).forEach(({ state: h2 }, T) => {
            let g2 = u2[T] || `${e.prefix}setState`;
            T === 0 ? e.init(h2) : (i2(h2), e.send(g2, t2.getState()));
          });
        }
      };
    }
  };
  var ao = (a10, e, t2) => {
    let i2;
    t2.getState(se) === "Connected" && (i2 = so(a10, e, t2)), t2.subscribe((r2) => {
      ["Connected", "Reconnecting"].includes(r2) ? i2 || (i2 = so(a10, e, t2)) : ["Disconnected", "Failed"].includes(r2) && i2 && (xn(e, r2), i2(), i2 = void 0);
    }, se);
  };
  var so = (a10, e, t2) => {
    var s2, o2;
    let i2 = Nn(t2, e);
    (s2 = a10.getWebrtcInternals()) == null || s2.start();
    let r2 = (o2 = a10.getWebrtcInternals()) == null ? void 0 : o2.onStatsChange((n2) => On(e, n2, t2, a10));
    return () => {
      i2(), r2 && r2();
    };
  };
  var Nn = (a10, e) => {
    let t2, i2, r2;
    return a10.getState(Ie) ? e.namedSetState((s2) => {
      s2.localPeer.id = a10.getState(Ie);
    }, "localpeer-id") : t2 = a10.subscribe((s2) => {
      s2 && e.namedSetState((o2) => {
        o2.localPeer.id = s2;
      }, "localpeer-id");
    }, Ie), a10.getState(Z2) ? e.namedSetState((s2) => {
      s2.localPeer.videoTrack = a10.getState(Z2);
    }, "localpeer-videotrack-id") : i2 = a10.subscribe((s2) => {
      s2 && e.namedSetState((o2) => {
        o2.localPeer.videoTrack = s2;
      }, "localpeer-videotrack-id");
    }, Z2), a10.getState(le) ? e.namedSetState((s2) => {
      s2.localPeer.audioTrack = a10.getState(le);
    }, "localpeer-audiotrack-id") : r2 = a10.subscribe((s2) => {
      s2 && e.namedSetState((o2) => {
        o2.localPeer.audioTrack = s2;
      }, "localpeer-audiotrack-id");
    }, le), () => {
      t2 == null || t2(), i2 == null || i2(), r2 == null || r2();
    };
  };
  var On = (a10, e, t2, i2) => {
    let r2 = t2.getState(N2);
    a10.namedSetState((s2) => {
      let o2 = t2.getState(Ie), n2 = {}, d2 = Object.keys(r2).filter((p2) => r2[p2].peerId !== o2);
      for (let p2 of d2) {
        let h2 = e.getRemoteTrackStats(p2);
        h2 && (n2[p2] = h2);
      }
      rs(s2.remoteTrackStats, n2);
      let u2 = { [o2]: e.getLocalPeerStats() };
      rs(s2.peerStats, u2), Wa(s2.localTrackStats, e.getLocalTrackStats(), i2.store.getLocalPeerTracks());
    }, "webrtc-stats");
  };
  var xn = (a10, e = "resetState") => {
    a10.namedSetState((t2) => {
      Object.assign(t2, ni());
    }, e);
  };
  var si = class {
    constructor(e, t2) {
      this.hmsStore = e;
      this.sdk = t2;
      this.store = mt.createNewHMSStore(Fi("HMSStatsStore"), ni), this.getState = this.store.getState, this.subscribe = this.store.subscribe, this.getPublishPeerConnection = () => new Promise((i2) => {
        var r2, s2;
        this.hmsStore.getState(se) === "Connected" ? i2((s2 = (r2 = this.sdk) == null ? void 0 : r2.getWebrtcInternals()) == null ? void 0 : s2.getPublishPeerConnection()) : this.hmsStore.subscribe((o2) => {
          var n2, d2;
          o2 === "Connected" && i2((d2 = (n2 = this.sdk) == null ? void 0 : n2.getWebrtcInternals()) == null ? void 0 : d2.getPublishPeerConnection());
        }, se);
      }), this.getSubscribePeerConnection = () => new Promise((i2) => {
        var r2, s2;
        this.hmsStore.getState(se) === "Connected" ? i2((s2 = (r2 = this.sdk) == null ? void 0 : r2.getWebrtcInternals()) == null ? void 0 : s2.getSubscribePeerConnection()) : this.hmsStore.subscribe((o2) => {
          var n2, d2;
          o2 === "Connected" && i2((d2 = (n2 = this.sdk) == null ? void 0 : n2.getWebrtcInternals()) == null ? void 0 : d2.getSubscribePeerConnection());
        }, se);
      }), this.sdk && ao(this.sdk, this.store, this.hmsStore);
    }
  };
  var Un = (a10) => a10.localPeer.id;
  var Bn = (a10) => a10.localPeer.audioTrack;
  var Vn = (a10) => a10.localPeer.videoTrack;
  var Fn = (a10, e) => e;
  var oo = (a10, e) => e;
  var Gn = (a10) => a10.remoteTrackStats;
  var no = (a10) => a10.peerStats;
  var us = (a10) => a10.localTrackStats;
  var Le = createSelector([no, Un], (a10, e) => a10[e]);
  var Wn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribe) == null ? void 0 : e.packetsLost;
  });
  var $n = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribe) == null ? void 0 : e.jitter;
  });
  var Kn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.publish) == null ? void 0 : e.bitrate;
  });
  var qn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribe) == null ? void 0 : e.bitrate;
  });
  var jn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.publish) == null ? void 0 : e.availableOutgoingBitrate;
  });
  var Jn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribe) == null ? void 0 : e.availableIncomingBitrate;
  });
  var Qn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.publish) == null ? void 0 : e.bytesSent;
  });
  var zn = createSelector(Le, (a10) => {
    var e;
    return (e = a10 == null ? void 0 : a10.subscribe) == null ? void 0 : e.bytesReceived;
  });
  var Yn = createSelector([no, Fn], (a10, e) => e ? a10[e] : void 0);
  var Xn = createSelector([Gn, oo], (a10, e) => e ? a10[e] : void 0);
  var ps = createSelector([us, oo], (a10, e) => e ? a10[e] : void 0);
  var Zn = H2(Yn);
  var ec = H2(Xn);
  var tc = createSelector([us, Bn], (a10, e) => {
    var t2;
    return e ? (t2 = a10[e]) == null ? void 0 : t2[0] : void 0;
  });
  var ic = H2(createSelector(ps, (a10) => a10 == null ? void 0 : a10[0]));
  var rc = createSelector([us, Vn], (a10, e) => {
    var t2;
    return e ? (t2 = a10[e]) == null ? void 0 : t2[0] : void 0;
  });
  var sc = H2(createSelector(ps, (a10) => a10));

  // webpack-hms.js
  window.HMSReactiveStore = mt;
  console.log("[HMS] SDK loaded via webpack bundle");
})();
/*! Bundled license information:

eventemitter2/lib/eventemitter2.js:
  (*!
   * EventEmitter2
   * https://github.com/hij1nx/EventEmitter2
   *
   * Copyright (c) 2013 hij1nx
   * Licensed under the MIT license.
   *)
*/
