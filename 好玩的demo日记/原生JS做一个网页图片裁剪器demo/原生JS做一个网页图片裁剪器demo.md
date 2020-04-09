## 原生JS做一个网页图片裁剪器demo

-----

----

![1586425218310](.\img\1586425218310.png)

### 1. 基本功能：

* 本地选择图片上传，上传后保持图片宽高进行缩放，放到中间的编辑区内
* 除选中区域外，其他区域有“关灯”效果
* 选中正方形区域的随意拖拽，拖动四个角等比例进行大小缩放
* 生成截图的预览图，并可以下载截图到本地

### 2. 问题思考（这里可以先自己思考方案）：

* 对于不同大小，不同宽高比的图片，如何在上传之后保证其高宽比一致，并填入中间的编辑区内，水平垂直居中
* 如何使视口内的部分图片“亮灯”，视口外的“关灯”
* 对视口编辑框的拖拽和大小缩放如何实现，需要考虑视口编辑框不能超出图片范围的边界条件
* 如何生成一个预览图，如何下载图片到本地

### 3. 我的一些解决方案（含原理分析）

* #### 上传图片及缩放处理：

  * 上传图片：使用`input`标签结合`type="file"`这个属性，利用`onchange`来指定上传图片后的回调函数：这里注意传入的`this`指向`input`标签, 传入了才能再回调函数中获取到通过`input`标签上传的图片

  ```javascript
  <input type="file" onchange="imgUpload(this)" />
  ```

  * 图片读取及缩放：我设置的图片编辑区大小为`width=1000px` & `height=400px`, 因此整个编辑区的宽高比为2.5。对于每张上传的图片，我们需要读取其宽度和高度，并计算宽高比。对于宽/高 >= 2.5 的图片，将它的宽度缩放为1000px, 高度根据宽度进行等比缩放即可。 而对于宽/高 < 2.5的图片，则将其高度缩放为400px，等比缩放其高度。这样能够达到载入图片时，图片不会被拉伸而失真。
  * `imgUpload`的大概实现如下：

  ```javascript
     function imgUpload(imgFile) {
        if (!imgFile || !imgFile.files[0]) {
          return;
        }
        let img = document.getElementsByClassName("img-crop")[0];		//获取编辑区内的img标签
        let reader = new FileReader();
        let imgContent = "";		// 存放base64格式的图片内容
        let scale = 0;			// 图片的缩放比
        reader.onload = function (e) {
          imgContent = e.target.result;
          imgTmp = new Image();
          imgTmp.src = imgContent;	// 利用 Image()对象可以读取图片的实际宽高
          imgTmp.onload = function () {
            if (this.width / this.height >= 2.5) {	// 宽/高 > 2.5
              scale = 1000 / this.width;
              img.width = 1000;
              img.height = this.height * scale;
            } else {
              scale = 400 / this.height;
              img.width = this.width * scale;
              img.height = 400;
            }
            img.src = imgContent;				// 在img标签中载入图片
            img.style.display = "block";	//为了防止img标签闪烁，在图片载入完成之前设置其display为none
          };
        };
        reader.readAsDataURL(imgFile.files[0]);
      }
  ```

  * 使img标签在整个`1000*400 px`的编辑区中水平垂直居中

    水平垂直居中的方法有很多种，具体根据实际需要依情况而异，可参考：  https://blog.csdn.net/weixin_37580235/article/details/82317240 

* #### 视口窗口的拖拽实现：

  * 监听`mousedown`, `mousemove`, `mouseup`三个事件：拖拽的`div`元素`display`属性需要先设置为`absolute`，根据控制`div`的`left`和`top`来改变其位置， 以改变其`left`为例：我们需要先了解一下几个属性的含义：

    * `clientX/clientY`： 当鼠标事件发生时（不管是`onclick`，还是`omousemove`等），鼠标相对于浏览器（这里说的是浏览器的有效区域）x轴的位置； 
    *  `offsetLeft`/`offsetTop`:跟父级元素没关系，而是跟其上一级的定位元素(除`position:static`;外的所有定位如`fixed`,`relative`,`absolute`)有关系。 

    下图展示了以计算拖拽后`div`元素的`left`为例的计算原理：主要是先计算出鼠标离`div`最左边的距离`diffX`,拖拽后的`left`值等于拖拽后的`clientX-diffX`

    ![1586433722267](.\img\1586433722267.png)

    

    * 大概实现如下：

    ```javascript
        let draggingDOM = null;
        let diffX = 0;
        let diffY = 0;
    
        document.addEventListener("mousedown", function (e) {
          if (e.target.className.indexOf("cutting-box") !== -1) {
            draggingDOM = e.target;
            diffX = e.clientX - draggingDOM.offsetLeft;
            diffY = e.clientY - draggingDOM.offsetTop;
          }
        });
    	//需要判断是否拖拽超出了图片边界，做一些处理
        document.addEventListener("mousemove", function (e) {
              if (draggingDOM) {
                let left = e.clientX - diffX;
                let top = e.clientY - diffY;
                if (left < ori_left) left = ori_left;
                if (top < ori_top) top = ori_top;
                if (left > ori_left + img.width - cutBox.clientWidth)
                  left = ori_left + img.width - cutBox.clientWidth;
                if (top > ori_top + img.height - cutBox.clientHeight)
                  top = ori_top + img.height - cutBox.clientHeight;
                draggingDOM.style.left = left + "px";
                draggingDOM.style.top = top + "px";
              }
            
       	document.addEventListener("mouseup", function () {
          draggingDOM = null;
        });
    ```

    

    注意在此处我把事件绑定在了`document`之上, 而非绑定在了视口`div`之上。读者可以尝试一下两者的不同，我尝试的结果是：当把 `mousemove`等事件绑定在视口`div`之上时，快速拖动视口会导致 元素会跟不上，卡顿的问题 ，以下给出解释。详情参考： https://blog.csdn.net/weixin_34417200/article/details/88805986 

    ```
    鼠标滑动地太快，自然会造成 mousemove 事件多次发生，相应的，事件处理函数也多次被调用，自然造成延迟。延迟之后，元素移动的速度赶不上鼠标移动的速度，可能造成鼠标移出元素的状态，从而触发了 mouseout 事件，从而造成了被拖动元素停止移动。 ——原文来自 鸢飞鱼跃
    ```

* #### 视口窗口的缩放Resize实现

  * Resize的实现与上述拖拽的实现原理非常相似，主要也是通过`mousemove`, `mousedown`以及`mouseup`三个事件的监听以及`offerseLeft`, `clientX`等属性的使用来实现。同时需要注意一些边界条件。
  * 四个resize按键的`html`及`css`如下：

  ```html
  <div class="cutting-box">
      <div class="cut-button left-top-button"></div>
      <div class="cut-button right-top-button"></div>
      <div class="cut-button right-down-button"></div>
      <div class="cut-button left-down-button"></div>
  </div>
  ```

  ```css
  .cutting-box {
        position: absolute;
        border: 2px dashed white;
        cursor: move;
        width: 100px;
        height: 100px;
        display: none;
      }
      .cut-button {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #000;
      }
      .left-top-button {
        position: absolute;
        top: -5px;
        left: -5px;
        cursor: nw-resize;
      }
      .right-top-button {
        position: absolute;
        top: -5px;
        left: 100%;
        transform: translateX(-45%);
        cursor: ne-resize;
      }
      .right-down-button {
        position: absolute;
        top: 100%;
        left: 100%;
        transform: translate(-45%, -45%);
        cursor: se-resize;
      }
      .left-down-button {
        position: absolute;
        top: 100%;
        left: -5px;
        transform: translateY(-45%);
        cursor: sw-resize;
      }
  ```

  * 关于`mousemove`等事件的主要逻辑，则不再累赘，只需注意`resize`时的一些边界条件即可

* #### 对视口区域的部分图片进行截图

  * `canvas.drawImage`的使用：

    ```javascript
    //平时调用支持三种传参
    void ctx.drawImage(image, dx, dy);
    void ctx.drawImage(image, dx, dy, dWidth, dHeight);
    void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    ```

  `demo`中主要使用了第三种传参的方式，其中，`dx`和`dy`是`image`在`canvas`中定位的坐标值；`dw`和`dh`是`image`在`canvas`中即将绘制区域（相对`dx`和`dy`坐标的偏移量）的宽度和高度值；`sx`和`sy`是`image`所要绘制的起始位置，`sw`和`sh`是`image`所要绘制区域（相对`image`的`sx`和`sy`坐标的偏移量）的宽度和高度值。 

  ![0_1312439694SFqd](.\img\0_1312439694SFqd.gif)

  * `canvas.toDataURL`:  把上述用`canvas`截出的图像转换成`png/base64`格式

    ```javascript
    canvas.toDataURL("image/png");
    ```

* #### 图片下载到本地

* #### 视口内"亮灯"，视口外"关灯的效果实现"

