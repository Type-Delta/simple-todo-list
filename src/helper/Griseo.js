//////////// Griseo ////////////
/**tools for frontend Web Javascript branch from Tools.js
 * @version 1.3.2
 * @requires Tools.js
 * @changes
 * - added encodeInnerHTML()
 * - onceClickOutside() now return listener like onClickOutside()
 */
"use strict";
let _local = {};

if(typeof window !== 'undefined') _local.Tools = window._tools;
else if(typeof require !== 'undefined') _local.Tools = require('./Tools.js');
else{
   /**clean array
    * @param {any[]} Arr array to clean
    * @param {any|any[]} itemToClean items to wipe off, optional(if None is provide,
    * will remove empty string, Array, Object),
    * can be array EX: ['0', '', 'g'] (those are Black-Listed items)
    * @returns new cleaned array
    */
   _local.Tools = function cleanArr(Arr, itemToClean = null){
      if(itemToClean && itemToClean instanceof Array){
         return Arr.filter(function (itemInArr) {
            return !itemToClean.includes(itemInArr);
         });
      }

      if(itemToClean){
         return Arr.filter(function (itemInArr) {
            return itemInArr !== itemToClean;
         });
      }

      return Arr.filter(itemInArr =>
         (itemInArr !== ''&&itemInArr !== '\r'&&!Tools.isEmptyArray(itemInArr)&&!Tools.isEmptyObject(itemInArr))
      );
   }
}


const Griseo = {
   /**set listener for every elements with the given `className`
    * @param {string} className
    * @param {string} eventName
    * @param {Function} callback
    */
   addListenerByClass(className, eventName, callback){
      [...document.getElementsByClassName(className)].forEach(e => {
         e.addEventListener(eventName, callback);
      });
   },

   /**
    * encode HTML special characters in the given plain text
    *
    * similar to setting `textContent` of an element
    * @param {string} plainText
    * @returns {string} encoded HTML
    */
   encodeInnerHTML(plainText){
      if(!plainText) return '';
      return plainText.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/\n/g, '<br>')
         .replace(/'/g, "&#039;");
   },

   /**
    * get all cookies in the document
    * @returns {{[key: string]: string}} cookies
    */
   getAllCookies(){
      let cookies = {};
      document.cookie.split(';')
         .forEach(v => {
            v = v.trim();
            const [name, value] = v.split('=');
            cookies[name] = decodeURIComponent(value);
         });
      return cookies;
   },


   /**get child that contains the given class in the parent element
    * @param {string} cName
    * @param {HTMLElement?} parent
    * @returns {HTMLElement[]} array of child element that contains the given class
    */
   getChildWithClassName(cName, parent){
      if(!parent) return [];

      let targetchild = [];
      for(let child of [...parent.children]){
         if(child.classList.contains(cName))
            targetchild.push(child);
      }
      return targetchild;
   },


   /**
    * get cookie by name
    * @param {string} name cookie name
    * @returns {string|null} cookie value return `null` if cookie doesn't exist
    */
   getCookie(name){
      return Griseo.getAllCookies()[name] ?? null;
   },


   /**
    * get current preferred color scheme
    *
    * return `null` if browser doesn't support `matchMedia`
    */
   getPreferredColorScheme(){
      if(!window.matchMedia) return null; // if browser doesn't support matchMedia
      return window.matchMedia('(prefers-color-scheme: dark)').matches? 'dark':'light';
   },



   /**callback when user clicked outside the given element
    * @param {HTMLElement} element
    * @param {(this: any, ev?: any) => any} callback
    * @returns {(this: any, ev?: any) => any} use this to clear event listener
    */
   onClickOutside(element, callback) {
      const outsideClickListener = event => {
         if (!element.contains(event.target)) {
            callback();
         }
      }

      document.addEventListener('click', outsideClickListener);
      return outsideClickListener;
   },

   /**callback when user clicked outside the given element
    * **Similar to `onClickOutside()` but only invoke ONCE!**
    * @param {HTMLElement} element
    * @param {(this: any, ev?: any) => any} callback
    * @returns {(this: any, ev?: any) => any} use this to clear event listener
    */
   onceClickOutside(element, callback) {
      const outsideClickListener = event => {
         if (!element.contains(event.target)) {
            callback();
            document.removeEventListener('click', outsideClickListener);
         }
      }

      document.addEventListener('click', outsideClickListener);
      return outsideClickListener;
   },

   /**
    * @callback PrefferredColorSchemeChangeCB
    * @param {MediaQueryList} this
    * @param {'dark'|'light'} currentColorScheme
    * @returns {any}
    */
   /**
    * callback when preferred color scheme change
    *
    * return `null` if browser doesn't support `matchMedia`
    * @param {PrefferredColorSchemeChangeCB} callback
    * @returns {MediaQueryList|null}
    */
   onPrefferredColorSchemeChange(callback){
      if(!window.matchMedia) return null; // if browser doesn't support matchMedia

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function(e){
         callback.bind(this)(e.matches? 'dark':'light');
      });
      return mediaQuery;
   },

   /**clear event listener for `onClickOutside()` and `hideOnClickOutside()`
    * @example
    * let listener = onClickOutside(elem, doStuff);
    * function doStuff(){
    *    // . . .
    *    clearClickOutside(listener);
    * }
    * @param {(this: any, ev?: any) => any} listener
    */
   clearClickOutside(listener) {
      document.removeEventListener('click', listener);
   },



   /**HTMLElement handler for textarea 'keydown' event
    * this prevent Tab key from select other element
    * and make Tab works like it should in most text editors
    * @param {KeyboardEvent} event
    * @param {HTMLTextAreaElement} _this element that cause this `KeyboardEvent`
    */
   handleTextarea_TabKeyPressed(event, _this){
      if (event.key != 'Tab') return;
      event.preventDefault();
      const start = _this.selectionStart;
      const end = _this.selectionEnd;

      // if user didn't select any text, just place caret somewhere without selection
      if (start == end) {
         // set textarea value to: text before caret + tab + text after caret
         _this.value = _this.value.substring(0, start) +
            "\t" + _this.value.substring(end);

         // put caret at the right position again
         _this.selectionStart = _this.selectionEnd = start + 1;
         return;
      }


      let selectedText = _this.value.substring(start, end + 1);
      let addedLength = selectedText.length;
      selectedText = selectedText.replace(/\n/g, '\n\t');

      addedLength = selectedText.length - addedLength;
      /**
       * if there are no '\n' replace all content in `selectedText`
       * else remove trailing '\t' and it to the front
       *
       * (v no '\n' here, no indent added)
       * |some text to add
       * |tab indent
       * |         (^ extra '\n')
       */
      if (!addedLength) selectedText = '\t';
      else {
         if (selectedText.endsWith('\t'))
            selectedText = selectedText.slice(0, selectedText.length - 1);
         selectedText = '\t' + selectedText;
      }

      _this.value = _this.value.substring(0, start) +
         selectedText + _this.value.substring(end);

      _this.selectionStart = start;
      _this.selectionEnd = end + addedLength;
   },



   /**make the element automatically hide itself when
    * user click outside this element
    * @param {HTMLElement} element
    * @param {string|HTMLElement} elemToHide
    * @returns {Function} use this to clear event listener
    */
   hideOnClickOutside(element, elemToHide = 'this') {
      const targetElem = elemToHide === 'this'?element:elemToHide;

      const outsideClickListener = event => {
         if (!element.contains(event.target) && Griseo.isVisible(targetElem)) { // or use: event.target.closest(selector) === null
            targetElem.style.display = 'none';
         }
      }

      document.addEventListener('click', outsideClickListener);
      return outsideClickListener;
   },



   /**set all selected elements that matched the `specifier` as visible
    * and hide others the that doesn't match
    * @param {string} selector querySelector for 'selected elements'
    * @param {{id: string, class: string}} specifier ID and or ClassName any selected element that
    * match this specifier will be visible
    * @param {string} displayType Element style.display
    */
   hideOtherElements(selector, specifier, displayType = null){
      const elements = document.querySelectorAll(selector);
      const hasId = !!specifier.id;
      const hasClass = !!specifier.class;

      for(const elem of [...elements]){
         // pls ignore this mess T^T
         const validId = hasId? elem.id == specifier.id:false;
         const validClass = hasClass? isClassMatched(elem.className):false;

         if((validClass&&(!hasId || validId)) || validId&&!hasClass){
            if(displayType) elem.style.display = displayType;
         }else elem.style.display = 'none';
      }

      function isClassMatched(className){
         if(specifier.class.includes(' ')){
            const eClassList = className.split(' ');
            if(eClassList.length <= 0) return false;

            for(const sClass of specifier.class.split(' ')){
               if(!eClassList.includes(sClass)) return false;
            }
            return true;
         }

         return className == specifier.class;
      }
   },






   /**hides all element selected by the `selector`
    * this function hide elements by set its display type to 'none'
    * @param {string} selector querySelector
    */
   hideAllElements(selector){
      const elements = document.querySelectorAll(selector);
      for(const e of [...elements]){
         e.style.display = 'none';
      }
   },

   /**
    * insert HTMLElement at the given index
    * @param {number} index index to insert the element (can be negative)
    * @param {HTMLElement} elem element to insert
    * @param {HTMLElement} parent parent element
    */
   insertElementAt(index, parent, elem){
      if(index < 0) index = parent.children.length + index + 1;
      if(index >= parent.children.length) parent.appendChild(elem);
      else parent.insertBefore(elem, parent.children[index]);
   },


   /**check if the given coordinates is inside
    * the element Rect or not
    * @param {DOMRect} elemRect
    * @param {number} x
    * @param {number} y
    */
   isPosInside(x, y, elemRect){
      return (
         x > elemRect.left&&x < elemRect.right&&
         y > elemRect.top&&y < elemRect.bottom
      );
   },


   /**check if coordinates of the given element is inside
    * the element Rect or not
    * @param {DOMRect} elemRect
    * @param {HTMLElement} elem
    */
   isElemPosInside(elem, elemRect){
      const { x, y } = elem.getBoundingClientRect();

      return Griseo.isPosInside(x, y, elemRect);
   },



   /**predicates whether any of the selected element can be seen
    * @param {string} selector querySelector
    */
   isSelectedVisible(selector){
      const elements = document.querySelectorAll(selector);
      for(const e of [...elements]){
         if(Griseo.isVisible(e)) return true;
      }
      return false;
   },



   /**predicates whether the element is currently visible or not
    * (source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js)
    * @param {HTMLElement} elem
    */
   isVisible: elem =>
      !!elem &&
      !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length) &&
      window.getComputedStyle(elem).visibility !== "hidden",



   KeyBind: class KeyBind {
      /**raw keybinding, each keys separated by '+'
       */
      rawBinding;
      /**normalized keybinding stored in Set
       * each keys are normalize so that it can be compared directly
       * with `KeyboardEvent.Key`
       */
      keys;
      /**
       * @param {string} strKeyBind raw keybinding, each keys seperated by '+'
       */
      constructor(strKeyBind){
         this.rawBinding = strKeyBind;
         this.keys = this.#normalize(strKeyBind);
      }

      /**
       * @param {string} strKeyBind raw keybinding, each keys seperated by '+'
       * @returns {KeyBind} new KeyBind instance
       */
      static key(strKeyBind){
         return new KeyBind(strKeyBind);
      }

      /**
       * @param {string} strKeyBind
       * @returns {Set<string>} normalized keybind
       */
      #normalize(strKeyBind){
         const keys = _local.Tools.cleanArr(strKeyBind.split('+'));
         let hasShift = false;
         return new Set(keys.map((v, i, a) => {
            v = v.trim();
            switch(v.toLowerCase()){
               case 'ctrl': return 'Control';
               case 'esc': return 'Escape';
               case 'space': return ' ';
               case 'right': return 'ArrowRight';
               case 'left': return 'ArrowLeft';
               case 'up': return 'ArrowUp';
               case 'down': return 'ArrowDown';
               case 'alt': return 'Alt';
               case 'shift':
                  if(!hasShift) hasShift = true;
                  return 'Shift';
               default:
                  if(v.length == 1){
                     return hasShift? v.toUpperCase(): v.toLowerCase();
                  }
                  return v;
            }
         }));
      }
   },




   Keyboard: class Keyboard {
      /**
       * @callback KeyboardCatchCallback
       * @param {KeyboardEvent} ev
       * @param {Set<string>} activeKeys
       * @returns {(boolean|void|undefined|null)|Promise<boolean|void|undefined|null>} whether to `preventDefault()` or not `false` to disable else will consider as `true`
       */

      /**set of every keys that are currently being pressed
       * @type {Set<string>}
       */
      activeKeys;
      /**
       * @type {Map<KeyBind, KeyboardCatchCallback>}
       */
      catchList;
      debugMode = false;
      constructor(){
         this.activeKeys = new Set();
         this.catchList = new Map();
      }
      /**Keep track of what key is currently being pressed
       * **this function should be called everytime `keydown` and `keyup`
       * Events trigger**
       * @param {KeyboardEvent} ev
       */
      handleKeyPress = async (ev) => {
         if(ev.type == 'keydown'){
            this.activeKeys.add(ev.key);
            //if(this.debugMode) console.log(this.activeKeys);

            for(const [keybind, callback] of this.catchList){
               if(this.test(keybind)){
                  if(await callback(ev, this.activeKeys) !== false)
                     ev.preventDefault();
               }
            }
         }else if(ev.type == 'keyup') this.activeKeys.delete(ev.key);
         else throw new Error('wrong Event type!');
      }


      /**test if the given keybind is being pressed by user
       * @param {KeyBind} keybind
       */
      test(keybind){
         if(this.debugMode){
            console.log('activeKeys: ', this.activeKeys);
            console.log('keybind: ', keybind.keys);
         }
         for(const k of keybind.keys){
            if(!this.activeKeys.has(k)) return false;
         }
         return true;
      }

      /**
       * listen for the given keybind, `preventDefault()`
       * and call a callback function
       *
       * to disable `preventDefault()` return `false` in the callback
       * @param {KeyboardCatchCallback} callback
       * @param {KeyBind|string} keybind
       */
      catch(keybind, callback){
         if(typeof keybind === 'string')
            keybind = Griseo.KeyBind.key(keybind);

         this.catchList.set(keybind, callback);
      }

      /**remove catch listener
       * @param {KeyboardCatchCallback|string} keybind
       */
      unCatch(keybind){
         if(typeof keybind === 'string')
            keybind = Griseo.KeyBind.key(keybind);

         this.catchList.delete(keybind);
      }

   },



   /**### Navigation
    * Handle URL related tasks
    */
   navigation: {
      /**
       * get query from the current URL
       */
      getQuery(){
         return new URLSearchParams(window.location.search);
      }
   },




   /**reload all CSS in the document
    */
   reloadCSS(){
      const links = document.getElementsByTagName("link");
      for (const cl in links){
         const link = links[cl];
         if (link.rel === "stylesheet") link.href += "";
      }
   },

   /**
    * @typedef {Object} CookieOptions
    * @property {?number} expires cookie expiration time (default to 400 days)
    * @property {?string} path cookie path (default to '/')
    * @property {'days'|'hours'|'minutes'} [timeUnit] time unit for `expires` (default to 'minutes')
    */
   /**
    * set all cookies where cookies were given as an object
    * - key: cookie name
    * - value: cookie value
    * @param {CookieOptions} [options]
    */
   setAllCookies(cookies, options = {}){
      let { expires = -1, path = '/', timeUnit = 'minutes' } = options;

      switch(timeUnit){
         case 'days': expires *= 24*60; break;
         case 'hours': expires *= 60; break;
         case 'minutes': break;
      }

      if(expires < 0) expires = 400*24*60;

      const d = new Date();
      d.setTime(d.getTime() + (expires*60*1000))
      let expiresDateStr = d.toUTCString();

      for(const [name, value] of Object.entries(cookies)){
         document.cookie = `${name}=${value};expires=${expiresDateStr};path=${path}`;
      }
   },



   /**
    * set cookie
    * @param {string} name cookie name
    * @param {string} value cookie value
    * @param {CookieOptions} [options]
    */
   setCookie(name, value, options = {}){
      let { expires = -1, path = '/', timeUnit = 'minutes' } = options;

      value = encodeURIComponent(value);

      switch(timeUnit){
         case 'days': expires *= 24*60; break;
         case 'hours': expires *= 60; break;
         case 'minutes': break;
      }

      if(expires < 0) expires = 400*24*60;

      const d = new Date();
      d.setTime(d.getTime() + (expires*60*1000))
      let expiresDateStr = d.toUTCString();
      document.cookie = `${name}=${value};expires=${expiresDateStr};path=${path}`;
   },


   /**Function used to determine the order of the elements.
    * It is expected to return a negative value
    * if the first argument is less than the second argument,
    * zero if they're equal, and a positive value otherwise.
    * If omitted, the elements are sorted in ascending, ASCII character order,
    * judging from the `textContent` value.
    * @callback CompareFunction
    * @param {HTMLElement} elemA
    * @param {HTMLElement} elemB
    * @returns {number}
    */

   /**Sort elements in place, this function does not modify the given Array/Collection
   * but the actual orders of those elements in the `document`
   * @param {HTMLCollection|HTMLElement[]} elements an array of Element or HTMLCollection
   * @param {CompareFunction} compareFn
   * Function used to determine the order of the elements.
   * It is expected to return a negative value
   * if the first argument is less than the second argument,
   * zero if they're equal, and a positive value otherwise.
   * If omitted, the elements are sorted in ascending, ASCII character order,
   * judging from the `textContent` value.
   */
   sortElements(
      elements,
      compareFn = (a, b) => a.textContent.localeCompare(b.textContent)
   ){
      if(elements instanceof HTMLCollection) elements = [...elements];
      const parent = elements[0].parentElement;

      quickSort(0, elements.length);

      function quickSort(start, end){
         if(end === start) return;
         const pivot = get3Median(start, end);
         let pivotIndex = elements.findIndex(e => e.isSameNode(pivot));

         for(let i = start; i < end; i++){
            if(elements[i].isSameNode(pivot)) continue;

            if(compareFn(elements[i], pivot) <= 0){
               if(i < pivotIndex) continue;
               pivot.insertAdjacentElement('beforebegin', elements[i]);
            }
            else{
               if(i > pivotIndex) continue;
               pivot.insertAdjacentElement('afterend', elements[i]);
            }
         }

         const sorted = [...parent.children];
         pivotIndex = sorted.findIndex(e => e.isSameNode(pivot));

         for(let i = start; i < end; i++) elements[i] = sorted[i];
         quickSort(start, pivotIndex);
         quickSort(pivotIndex + 1, end);
      }


      function get3Median(start, end){
         const first = elements[start];
         const mid = elements[(end - start) >> 1];
         const last = elements[end - 1];
         let medElem, belowMed;

         // find the potential median: the greater value of two is the potential median
         if(compareFn(first, mid) < 0){ // first is lessthan mid
            medElem = mid;
            belowMed = first;
         }else{
            medElem = first;
            belowMed = mid;
         }

         // find the real median
         if(compareFn(medElem, last) < 0);// potential median is less then last: potential median is median
         else if(compareFn(last, belowMed) < 0) medElem = belowMed;
         else medElem = last;
         return medElem;
      }
   }
}


if(typeof module !== 'undefined') module.exports = Griseo;
if(typeof window !== 'undefined') window._griseo = Griseo;