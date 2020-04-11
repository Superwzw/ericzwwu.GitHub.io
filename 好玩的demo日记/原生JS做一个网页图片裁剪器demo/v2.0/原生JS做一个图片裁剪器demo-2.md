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

  基于`React`这套自己实现的事件机制，所有的事件绑定在了`document`之上，同一的回调为`dispatchEvent`。而每个回调函数则被存储在了`listenerBack`中，存储的结构大致为` listenerBank[registrationName][key] `这样的形式，那我是不是也可以这样呢，于是我尝试编写了了如下代码：

  ```javascript
  document.addEventListener("mousedown", dispatchEvent);
  document.addEventListener("mousemove", dispatchEvent);
  document.addEventListener("mouseup", dispatchEvent);
  
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
      
     function getCallBack(e) {
      let type = e.type;
      let node = draggingDOM ? draggingDOM.className : e.target.className;
      return listenerBank[type][buttonType](e);
    }
    getCallBack(e);
  }
  ```
  
  这样一来，我们就可以通过访问`listenerBank['mousedown']['cutting-box']`等这样的方法在代码中引入我们预先写好逻辑的回调函数了。当需要新增监听器或者需要修改旧的逻辑时，我们可以非常方便在`dispatchEvent`中进行操作。
  
  
  
* `mousedown`, `mousemove`, `mouseup`是否存在的耦合/冗余的代码,  以`mousemove`中的拖拽截图视口部分代码为例：

```javascript
mousemove: {
      "cutting-box": function (e) {
        if (draggingDOM) {
          // 1. 计算拖拽后的距离, 计算拖拽后的截图视口是否超出图片范围(边界处理)
          boxLeft = e.clientX - diffX;
          boxTop = e.clientY - diffY;
          if (boxLeft < ori_left) boxLeft = ori_left;
          if (boxTop < ori_top) boxTop = ori_top;
          if (boxLeft > ori_left + img.width - cutBox.clientWidth) {
            boxLeft = ori_left + img.width - cutBox.clientWidth;
          }
          if (boxTop > ori_top + img.height - cutBox.clientHeight) {
            boxTop = ori_top + img.height - cutBox.clientHeight;
          }
          // 2. 根据计算好的距离, 使用js改变真实DOM中截图视口的大小以及位置
          draggingDOM.style.left = boxLeft + "px";
          draggingDOM.style.top = boxTop + "px";
          rect = `rect(${boxTop - ori_top}px ${
            boxLeft - ori_left + cutBox.clientWidth
          }px ${boxTop - ori_top + cutBox.clientHeight}px ${
            boxLeft - ori_left
          }px)`;
          img_copy.style.clip = rect;
          // 3. 根据截图视口的位置, 大小, 利用canvas进行截图，并填充到预览的img中
          let base64Img = getBase64AfterCut(
            imgTmp,
            boxLeft - ori_left,
            boxTop - ori_top,
            cutBox.clientWidth,
            cutBox.clientHeight,
            img.width,
            img.height
          );
          preImg.src = base64Img;
          preImg.style.display = "block";
        }
      },
```

基本而言，对于每一个事件监听函数中的代码，做的都是以下三件事情：

1. 计算截图视口"拖拽/缩放"后的距离, 以及视口是否超出图片范围(边界处理)
2. 根据计算好的距离, 使用`js`改变真实`DOM`中截图视口的大小以及位置
3. 根据截图视口的位置, 大小, 利用`canvas`进行截图，并填充到预览的`img`中

对于第一部分，也即是截图视口的距离计算，与边界条件的处理。在这一部分中，计算的逻辑会根据实际情况而改变。因此，每一个事件监听函数中的这一部分代码是独特的，无法抽离出来。

而对于第二部分和第三部分的代码，其实不同事件监听函数中，他们的操作大致是相同的，并且改变的部分总是和`left`, `top`, `height`, `width`这四个属性有关。那我们可不可以把后两部分的代码抽象分离出来，形成一个独立的块呢？

考虑在`React, Vue`等`MVVM`视图层框架中 ，我们是如何做到的：我们或许会把截图视口`cutting-box`封装成一个独立的组件，这个组件有自己的`state`， 其中最关键的四个状态便是`left`, `top`, `height`, `width`， 或许我们会写成这样：

```jsx
class CutBox extends React.PureComponent{
    constructor(props){
        super(props)
    }
    render(){
        const {left, top, width, height} = this.props
        return(
        	<div class="cutting-box" style={
                    {
                        left:left, top:top, width:width, height:height
                    }
                }>
                <div class="cut-button left-top-button"></div>
                <div class="cut-button right-top-button"></div>
                <div class="cut-button right-down-button"></div>
                <div class="cut-button left-down-button"></div>
          	</div>
        )
    }
}
```

这样当我们的父组件重新传入一个新的`props`时，截图视口`cutBox`就会重新渲染，改变其位置。这就是`MVVM`框架的一个优点，利用它们实现好的`VM`层，我们只需关注数据本身，改变数据，视图也会相应自行地进行改变。这样可以把视图层和数据层进行解耦。

反观我们的原生`js demo`中，我们在处理完处理之后，需要手动地去改变视图，也就是上述的第二部分与第三部分的代码所要做的事情。因此，我们的代码耦合程度会变高，原因在于在每一个事件监听函数中，数据层代码都和视图层代码紧紧耦合在一起。

#### 解决方案：

既然在分析代码中的耦合/冗余部分时，想到了`MVVM`框架中的更好实现。那我们是否也可以借用`VM`层的思想来对代码进行解耦呢？

-----

## 待续......