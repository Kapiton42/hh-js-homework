"use strict";



(function (){
    function getDomElementPosition (parent, element) {
        var Elements = parent.children;
        for (var i = 0; i < Elements.length; i++) {
            if (Elements[i] == element) {
                return i;
            }
        }
        return -1
    }
    
    function rebuildItemsList(listItems) {
        list.innerHTML = "";
        console.log(listItems);
        if(listItems != undefined)
            for (var i = 0; i < listItems.length; i++) {
                var newNode = document.createElement("li");
                newNode.setAttribute("draggable",true);
                newNode.setAttribute("data-element-id", listItems[i].item.id );
                newNode.appendChild(document.createTextNode(listItems[i].item.text));
                list.appendChild(newNode);
            }
    }

    function addItem(item) {
        console.log(item);
        var newNode = document.createElement("li");
            newNode.setAttribute("draggable", true);
            newNode.setAttribute("data-element-id", item.id);
            newNode.appendChild(document.createTextNode(item.text));
            list.appendChild(newNode);
    }

    function swap(list, a, b) {
        if( b < a) {
            var temp = a;
            a = b;
            b = temp;
        }
        var node1 = list.childNodes[a]
        var node2 = list.childNodes[b]
        var node3 = list.childNodes[b + 1]
        list.insertBefore(node2, node1)
        list.insertBefore(node1, node3)
    }

    function swapTwoItems(index1, index2) {
        var body = JSON.stringify({method: "swap", body: {first: index1, second: index2}})
        ws.send(body);
    }
    
    function createNewItem() {
        var newElement = {id: id, text: inputField.value};
        var body = JSON.stringify({method: "add", body: {item: newElement}});
        ws.send(body);
    }

    function clearItems() {
        list.innerHTML = "";
        alert("Server was closed");
    }

    var list = document.getElementById("list");
    var inputField = document.getElementById("dataInputField");
    var elements = [];
    var id = 1;
    
    var ws = new WebSocket("ws://localhost:8080/updateinformer");
    
    inputField.disabled = true;
    ws.onopen = function() {
        
        inputField.addEventListener(
            "keypress", 
            function(e){
                var inputField = e.target;
                if (e.keyCode === 13 && inputField.value != "") {
                    e.preventDefault();

                    createNewItem()
                    inputField.value = "";
                }
            })
    
    
        list.ondragstart = function(e){
            var dragListItem = e.target;
            var startPosition = getDomElementPosition(list, dragListItem)
            var endPosition = -1;

            dragListItem.style.opacity = '0.3';
            e.dataTransfer.setData('text/plain', "");

            list.ondragenter= function(e){
                var curPos = getDomElementPosition(list, dragListItem);
                var newPos = getDomElementPosition(list, e.target);

                if (newPos >= 0) {
                    endPosition = newPos
                }
            }

            list.ondragend= function(e) {
                dragListItem.style.opacity = '';
                if (endPosition != -1) {swapTwoItems(startPosition, endPosition);}
            }
        }
        
        inputField.disabled = false;
    }
    
    ws.onmessage = function (evt) {
        var data = JSON.parse(evt.data);
        console.log(data);
        if(data.method == "get") {
            id = data.body.id;
            rebuildItemsList(data.body.elements);
        }

        if(data.method == "add") {
            id = data.body.item.id + 1;
            addItem(data.body.item);
        }

        if(data.method == "swap") {
            var first = data.body.first;
            var second = data.body.second;
            swap(list, first, second);
        }

        if(data.method == "clear") {
            clearItems();
        }

    };
})();
