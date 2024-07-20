try { // for VSCode's intellisense
   const _tools = require('./helper/Tools.js');
   const _griseo = require('./helper/Griseo.js');
   const { gsap } = require('gsap');
}catch{};


////////////////////  SELECTORS  ////////////////////
const listPlaceholder = document.body.querySelector('.list .listItem.placeholder');
const todoList = document.body.querySelector('.list .listContent');
const editTitleBtn = document.body.querySelector('.list .title #editTitleBtn');
const titleContent = document.body.querySelector('.list .title .titleTextContent');
const completedList = document.body.querySelector('.completedList .listContent');
const clearCompletedBtn = document.body.querySelector('.completedList #clearCompletedBtn');



////////////////////  VARS & CONST  ////////////////////
const TitlePlaceholderText = 'My Todo List';
const keyboard = new _griseo.Keyboard();
document.body.onkeyup = document.body.onkeydown = keyboard.handleKeyPress;

let lastTitleContent = titleContent?.textContent;
/**
 * @type {HTMLElement} the item that is being dragged
 */
let itemDraging = null;
let shadowItem = null;
let isMouseOnTodoWhileDragging = false;




////////////////////  EVENT LISTENERS  ////////////////////
keyboard.catch('Enter', (ev, activeKeys) => {
   if(itemDraging) return false;

   const activeNode = document.activeElement;
   if(!activeNode) return false;

   if(activeNode.classList.contains('titleTextContent')){
      activeNode.setAttribute('contenteditable', 'false');

      if(activeNode.textContent.trim() === '')
         activeNode.textContent = TitlePlaceholderText;
      activeNode.blur?.();
   }

   if(activeNode.classList.contains('text-input')){
      if(activeKeys.has('Shift')) return false;

      addNewItem();
   }
});

keyboard.catch('Esc', () => {
   if(itemDraging) return false;

   const activeNode = document.activeElement;
   if(!activeNode) return false;

   if(activeNode.getAttribute('contenteditable') === 'true'){
      if(activeNode.classList.contains('titleTextContent')){
         activeNode.setAttribute('contenteditable', 'false');
         activeNode.textContent = lastTitleContent;
      }

      activeNode.blur?.();
   }

   clearEmptyItems();
});

document.addEventListener('mouseup', (ev) => {
   if(itemDraging){
      if(isMouseOnTodoWhileDragging){
         dragComplete();
      }else dragTerminate();
   }
});

document.addEventListener('mousemove', (ev) => {
   if(!itemDraging||!ev.target) return;

   handleItemDragging(ev);
});


listPlaceholder?.addEventListener('click', (ev) => {
   addNewItem();
});

if(titleContent){
   editTitleBtn?.addEventListener('click', () => {
      lastTitleContent = titleContent.textContent;
      titleContent.setAttribute('contenteditable', 'true');
      titleContent.focus();
      window.getSelection().selectAllChildren(titleContent); // select all text

      setTimeout(() => {
         _griseo.onceClickOutside(titleContent, () => {
            titleContent.setAttribute('contenteditable', 'false');
            if(titleContent.textContent.trim() === '')
               titleContent.textContent = lastTitleContent;
         });
      });
   });
}

clearCompletedBtn?.addEventListener('click', () => {
   clearCompleted();
});

window.addEventListener('unload', () => {
   try {} finally{
      saveTodoList();
   }
});




////////////////////  MAIN CODE  ////////////////////

loadTodoList();
setTimeout(removeMainLoader, 700);








////////////////////  FUNCTIONS  ////////////////////

/**
 * create and add a new item to the todo list
 */
function addNewItem(){
   const lastItem = [...todoList.children].at(-2);

   if(lastItem&&lastItem.textContent.trim() === ''){
      lastItem.focus();
      return false;
   }

   const { item, textInput } = createItem();

   _griseo.insertElementAt(-2, todoList, item);

   if(gsap){
      /* LINK: @ftalkwd
       * some elements are required to break the overflow:hidden of the .listContent
       * however, the animation will not work if the overflow:hidden is active
       * so, we add a class to the list to temporarily set the overflow constraint
       * (plus, those elements doesn't need to be visible at this time)
      */
      todoList.classList.add('overflowClip');

      item.style.zIndex = -1;
      gsap.from(item, {
         duration: 0.3,
         y: '-100%',
         zIndex: -1,
         ease: 'power3.out',
         clearProps: true,
         onComplete: () => {
            todoList.classList.remove('overflowClip');
         }
      });
   }

   textInput.focus();
   return true;
}

/**
 * create and add new completed item to the completed list
 * @param {string} content content of the new item
 */
function addCompletedItem(content){
   const { item, textInput } = createCompletedItem();
   textInput.textContent = content;

   _griseo.insertElementAt(0, completedList, item);

   if(gsap){
      item.style.zIndex = -1;
      gsap.from(item, {
         duration: 0.3,
         y: '-100%',
         zIndex: -1,
         ease: 'power3.out',
         clearProps: true,
      });
   }
}

/**
 * create a new item element without placing it in the DOM
 */
function createItem(){
   const item = document.createElement('div');
   const textInput = document.createElement('div');
   const actionCont = document.createElement('div');
   const deleteBtn = document.createElement('button');
   const dragBtn = document.createElement('button');

   item.classList.add('listItem');
   item.innerHTML = `
   <div class="action-cont checkbox-cont">
      <label class="checkbox st-animated-checkbox">
         <input type="checkbox">
         <svg viewBox="0 0 64 64" height="100%" width="100%">
            <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
         </svg>
      </label>
   </div>`;

   deleteBtn.classList.add('delete-btn', 'st-simpleTooltip');
   deleteBtn.innerHTML = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
   </svg>
   <div class="tooltip">delete item</div>`;

   dragBtn.classList.add('drag-btn', 'st-simpleTooltip');
   dragBtn.innerHTML = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
      <path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z"/>
   </svg>
   <div class="tooltip">drag to change item order</div>`;

   actionCont.classList.add('action-cont');
   actionCont.appendChild(dragBtn);
   actionCont.appendChild(deleteBtn);

   textInput.classList.add('text-input');
   textInput.setAttribute('contenteditable', 'true');

   item.appendChild(textInput);
   item.appendChild(actionCont);

   item.querySelector('.checkbox input').addEventListener('change', (ev) => {
      if(ev.target.checked){
         item.classList.add('complete');
         item.setCompleteTimeout = setTimeout(() => {
            setCompleteSelf.call(item);
         }, 3000);
      }
      else{
         item.classList.remove('complete');
         clearTimeout(item.setCompleteTimeout);
      }
   });
   deleteBtn.addEventListener('click', removeSelf.bind(item));

   dragBtn.addEventListener('mousedown', (ev) => {
      initiateDrag(item, ev);
   });

   setTimeout(()=> {
      _griseo.onClickOutside(item, () => {
         if(textInput.textContent.trim() === '')
            removeSelf.call(item);
      });
   }, 100);

   return {
      item,
      textInput
   };
}

/**
 * create a completed item element without placing it in the DOM
 */
function createCompletedItem(){
   const item = document.createElement('div');
   const textInput = document.createElement('div');

   item.classList.add('listItem');
   textInput.classList.add('text');
   item.appendChild(textInput);

   return {
      item,
      textInput
   };
}

/**
 * remove all empty items from the todo list
 */
function clearEmptyItems(){
   const emptyItems = getEmptyItems();
   for(const item of emptyItems){
      removeSelf.call(item);
   }
}

/**
 * get elements that are empty in the todo list
 * @returns {HTMLElement[]} the empty items in the todo list
 */
function getEmptyItems(){
   const list = [];
   for(const item of todoList.children){
      if(item.textContent.trim() === '') list.push(item);
   }
   return list;
}

/**
 * get the content of all items in the todo list
 * @returns {string[]} the content of all items in the todo list
 */
function getItemsContent(){
   const contentList = [];
   for(const item of todoList.children){
      if(item.classList.contains('placeholder')) continue;
      const thisContent = item.querySelector('.text-input')?.textContent?.trim();

      if(!thisContent||thisContent == '') continue;
      contentList.push(thisContent);
   }
   return contentList;
}


/**
 * load todo list from the cookie
 */
function loadTodoList(){
   const cookieValue = _griseo.getCookie('todoList');
   if(!cookieValue) return;

   let parsedValue;
   try{
      parsedValue = JSON.parse(cookieValue);
   }catch{
      console.error('Error parsing cookie value\nraw value:', cookieValue);
      parsedValue = {};
   }

   const {
      title = TitlePlaceholderText,
      items = [],
      completed = []
   } = parsedValue;
   titleContent.textContent = title;

   for(const content of items){
      const { item, textInput } = createItem();
      textInput.textContent = content;
      _griseo.insertElementAt(-2, todoList, item);
   }

   for(const content of completed){
      addCompletedItem(content);
   }
}

/**
 * save the current state of the todo list to a cookie
 *
 * the cookie will expire in 365 days without any activity
 */
function saveTodoList(){
   const contentList = getItemsContent();
   const completedItems = getCompletedItemsContent().filter(item => !!item);
   const titleText = titleContent?.textContent || TitlePlaceholderText;
   const cookieValue = JSON.stringify({
      title: titleText,
      items: contentList,
      completed: completedItems
   });

   _griseo.setCookie('todoList', cookieValue, {
      expires: 365,
      timeUnit: 'days'
   });
}

/**
 * remove `this` item from the list
 * and play slide-up animation if possible
 */
function removeSelf(){
   if(gsap){
      const yOffset = -this.clientHeight - 1.8;
      todoList.classList.add('overflowClip');

      gsap.to(this, {
         duration: 0.3,
         y: yOffset,
         zIndex: -1,
         ease: 'power3.out',
         onComplete: () => {
            this.remove();
            todoList.classList.remove('overflowClip');
         }
      });

      let elemsToShift = this.nextElementSibling;
      while(elemsToShift){
         gsap.to(elemsToShift, {
            duration: 0.3,
            y: yOffset,
            zIndex: -1,
            stagger: 0.2,
            ease: 'power3.out',
            clearProps: true,
         });

         elemsToShift = elemsToShift.nextElementSibling;
      }

   }
   else this.remove();
}


/**
 * set the item (`this`) as completed and remove it
 */
function setCompleteSelf(){
   if(!this.classList.contains('complete')) return;

   removeSelf.call(this);
   const todo = this.querySelector('.text-input').textContent;
   if(!(todo?.trim())) return;
   addCompletedItem(todo);
}

/**
 * get all text content of the completed items as an array
 * @returns {string[]} the content of every completed items
 */
function getCompletedItemsContent(){
   const items = [];
   for(const item of completedList.children){
      if(item.classList.contains('placeholder')) continue;
      const thisContent = item.textContent?.trim();

      if(!thisContent||thisContent == '') continue;
      items.push(thisContent);
   }
   return items;
}


/**
 * clear all completed items from the (completed-item) list
 */
function clearCompleted(){
   const items = completedList.querySelectorAll('.listItem:not(.placeholder)') ?? [];

   let delay = 0;
   for(const item of items){
      if(gsap){
         gsap.to(item, {
            duration: .68,
            x: '-130%',
            zIndex: -1,
            delay: delay += 0.06,
            ease: 'back.in(1.7)',
            onComplete: () => {
               setTimeout(() => {
                  item.remove();
               }, 50 + delay * 1e3);
            }
         });
      }
      else item.remove();
   }
}

/**
 * start the drag action for the item
 * @param {HTMLElement} item
 * @param {MouseEvent} ev
 */
function initiateDrag(item, ev){
   itemDraging = item;

   const itemDraggingIndex = [...todoList.children].indexOf(item);
   shadowItem = item.cloneNode(false);
   shadowItem.classList.add('shadow');
   _griseo.insertElementAt(itemDraggingIndex, todoList, shadowItem);

   const rect = item.getBoundingClientRect();
   const todoRect = todoList.getBoundingClientRect();

   item.style.width = `${rect.width * 1.01}px`;
   item.style.height = `${rect.height}px`;
   item.style.top = `${(ev.clientY - todoRect.top).toFixed(6)}px`;
   item.classList.add('dragging');

   todoList.removeChild(listPlaceholder);
   todoList.style.overflow = 'visible';
}


/**
 * terminate the drag action in the case that the drag is canceled
 * or completed (called after the `dragComplete()`)
 */
function dragTerminate(){
   if(!itemDraging) return;

   itemDraging.style = null;
   itemDraging.classList.remove('dragging');
   itemDraging = null;

   shadowItem.remove();
   shadowItem = null;

   todoList.appendChild(listPlaceholder);
   todoList.style = null;
}


/**
 * finalize the drag action in the case that the drag is successful
 * (user dropped the item in a valid position)
 */
function dragComplete(){
   if(!itemDraging) return;

   let shadowIndex = [...todoList.children].indexOf(shadowItem);

   todoList.removeChild(itemDraging);
   _griseo.insertElementAt(shadowIndex, todoList, itemDraging);
   dragTerminate();
}


/**
 * a simple drag handle for items in the todo list
 *
 * @param {MouseEvent} ev
 */
function handleItemDragging(ev){
   const todoRect = todoList.getBoundingClientRect();
   itemDraging.style.top = `${(ev.clientY - todoRect.top).toFixed(6)}px`;

   if(_griseo.isPosInside(
      ev.clientX, ev.clientY,
      todoList.getBoundingClientRect()
   )){
      isMouseOnTodoWhileDragging = true;
      itemDraging.classList.remove('invalidPos');
   }
   else{
      isMouseOnTodoWhileDragging = false;
      itemDraging.classList.add('invalidPos');
   }

   const listChildren = [...todoList.children];
   let targetItem;
   for(const child of listChildren){
      if(child.classList.contains('placeholder')) continue;
      if(child.isSameNode(itemDraging)) continue;

      if(_griseo.isPosInside(
         ev.clientX, ev.clientY,
         child.getBoundingClientRect()
      )){
         targetItem = child;
         break;
      }
   }

   if(!targetItem) return;

   const targetElemIndex = listChildren.indexOf(targetItem);
   const shadowIndex = listChildren.indexOf(shadowItem);

   const targetRect = targetItem.getBoundingClientRect();
   const targetRectTop = new DOMRect(
      targetRect.left, targetRect.top,
      targetRect.width, targetRect.height / 2
   );

   if(_griseo.isPosInside(ev.clientX, ev.clientY, targetRectTop)){ // mouse is on top half
      if(shadowIndex == targetElemIndex - 1) return;
      todoList.removeChild(shadowItem);
      _griseo.insertElementAt(targetElemIndex, todoList, shadowItem);
   }
   else{
      if(shadowIndex == targetElemIndex + 1) return;
      todoList.removeChild(shadowItem);
      _griseo.insertElementAt(targetElemIndex + 1, todoList, shadowItem);
   }
}




/**
 * remove the preloaded loader from the page
 *
 * **without this function, the loader will stay on the page forever**
 */
function removeMainLoader(){
   const loader = document.querySelector('body > .loader');
   if(!loader) return;

   loader.classList.add('fade-out');
   setTimeout(() => {
      loader.remove();
   }, 500);
}