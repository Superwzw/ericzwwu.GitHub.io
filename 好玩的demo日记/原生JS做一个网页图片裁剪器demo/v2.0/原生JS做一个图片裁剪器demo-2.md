## 原生JS做一个图片裁剪器demo -  二 -代码结构优化

-----

------

### 1. 分析代码中的问题

* `mousedown`, `mousemove`, `mouseup`三个事件监听：

  首先`po`出一段我在`v1.0`版本中，`mousedown`函数的代码:

  ```javascript
  document.addEventListener("mousedown", function (e) {
        if (e.target.className.indexOf("cutting-box") !== -1) {
          draggingDOM = e.target;
          diffX = e.clientX - draggingDOM.offsetLeft;
          diffY = e.clientY - draggingDOM.offsetTop;
        } else if (e.target.className.indexOf("cut-button") !== -1) {
          draggingResize = e.target;
          pos = {
            x: e.clientX,
            y: e.clientY,
            w: cutBox.clientWidth,
            h: cutBox.clientHeight,
            t: cutBox.offsetTop,
            l: cutBox.offsetLeft,
          };
        }
      });
  ```

  乍一看，似乎并没有什么问题，这段代码把事件绑定在了`document`上，根据`e.target.className`来判断触发事件的元素究竟是位移四个顶点的`Resize`按钮，还是整个截图视口`cutting-box`，根据不同的触发事件的元素，来执行不同的回调。嗯嗯，没错，这是正常的写法。

  

  既然大家觉得没有问题，那么，我们再看看`mousemove`事件绑定的回调代码:

  ```javascript
  document.addEventListener("mousemove", function (e) {
      if (draggingDOM) {
        // 此处省略1000行
        } else if (draggingResize) {
          let w, h, top, left;
          let diffXR = e.clientX - pos.x;
          let diffYR = e.clientY - pos.y;
          if (draggingResize.className.indexOf("left-top-button") !== -1) {
            // 此处省略500行
          } else if (
            draggingResize.className.indexOf("right-top-button") !== -1) {
            // 此处省略500行
          } else if (draggingResize.className.indexOf("right-down-button") !== -1) {
            // 此处省略500行
          } else if (draggingResize.className.indexOf("left-down-button") !== -1) {
            // 此处省略500行
          }
          cutBox.style.width = w + "px";
          cutBox.style.height = h + "px";
          rect = `rect(${top - ori_top}px ${
            left - ori_left + cutBox.clientWidth
          }px ${top - ori_top + cutBox.clientHeight}px ${left - ori_left}px)`;
          // console.log(rect);
          img_copy.style.clip = rect;
          let base64Img = getBase64AfterCut(
            imgTmp,
            left - ori_left,
            top - ori_top,
            w,
            h,
            img.width,
            img.height
          );
          let preImg = document.getElementsByClassName("pre-img")[0];
          preImg.src = base64Img;
          preImg.style.display = "block";
        }
      });
  ```

  

  问题似乎出现了，如果真的想认真看看`mousemove`里面的代码，你会发现多个`if`,`else`, `else if`等代码块互相嵌套，代码变得非常难以理解。作为这个`demo`的编写者的我在复盘的时候也会把自己看的一头雾水，我甚至觉得，再过一天我就无法看懂我的代码了。如果要我继续对这段代码进行维护，那简直是一场噩梦。

  

  #### 解决方案：

  其实说起来事件机制，我第一个会想到`React`自己实现的一套事件机制，想要了解的可以参考 [【React深入】React事件机制](https://segmentfault.com/a/1190000018391074)

  基于`React`这套自己实现的事件机制，所有的事件绑定在了`document`之上，同一的回调为`dispatchEvent`。而每个回调函数则被存储在了`listenerBack`中，存储的结构大致为` listenerBank[registrationName][key] `这样的形式，那我是不是也可以这样呢，于是我对代码新建了一个`dispatchEvent.js`文件，并在里面编写了了如下代码：

  ```javascript
  function dispatchEvent(e) {
    let listenerBank = {
      mousedown: {
        "cutting-box": function () {},
        "cut-button": function () {},
      },
      mousemove: {
        "cutting-box": function () {},
        "left-top-button": function () {},
        "right-top-button": function () {},
        "right-down-button": function () {},
        "left-down-button": function () {},
      },
      mouseup: function () {},
    };
  }
  ```

  这样一来，我们就可以通过访问`listenerBank['mousedown']['cutting-box']`等这样的方法在代码中引入我们预先写好逻辑的回调函数了。