## 原生JS做一个网页图片裁剪器demo

-----

----

![](https://github.com/Superwzw/ericzwwu.GitHub.io/blob/master/%E5%A5%BD%E7%8E%A9%E7%9A%84demo%E6%97%A5%E8%AE%B0/%E5%8E%9F%E7%94%9FJS%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BD%91%E9%A1%B5%E5%9B%BE%E7%89%87%E8%A3%81%E5%89%AA%E5%99%A8demo/img/1586425218310.png?raw=true)

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

    ![](https://github.com/Superwzw/ericzwwu.GitHub.io/blob/master/%E5%A5%BD%E7%8E%A9%E7%9A%84demo%E6%97%A5%E8%AE%B0/%E5%8E%9F%E7%94%9FJS%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BD%91%E9%A1%B5%E5%9B%BE%E7%89%87%E8%A3%81%E5%89%AA%E5%99%A8demo/img/1586433722267.png?raw=true)

    

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

  ![0_1312439694SFqd]( https://github.com/Superwzw/ericzwwu.GitHub.io/blob/master/%E5%A5%BD%E7%8E%A9%E7%9A%84demo%E6%97%A5%E8%AE%B0/%E5%8E%9F%E7%94%9FJS%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BD%91%E9%A1%B5%E5%9B%BE%E7%89%87%E8%A3%81%E5%89%AA%E5%99%A8demo/img/0_1312439694SFqd.gif?raw=true)

  

  * `canvas.toDataURL`:  把上述用`canvas`截出的图像转换成`png/base64`格式

    ```javascript
    canvas.toDataURL("image/png");
    ```
    
  * 因此，在整个demo中根据此原理可以获取到视口区域选中的截图：

  ```javascript
  /**
  	image: 		缩放前的原图片, 上传图片后使用 Image() 存放原图片的信息
  	dx:			截图视口相对于图片左边界的距离 left
  	dy:			截图视口相对于图片上边界的距离 top
  	widthCut:    截图视口的宽度
      heightCut:	 截图视口的高度
      width:		 缩放后的图片宽度
      height:		 缩放后的图片高度
  **/
  function getBase64AfterCut(image, dx, dy, widthCut, heightCut, width, height) {
        let canvas = document.createElement("canvas");
        canvas.height = heightCut;		//设置canvas的宽高为截图视口宽高
        canvas.width = widthCut;
        let ctx = canvas.getContext("2d");
        //计算原始图片的实际裁剪偏移
        dx = (image.width / width) * dx;	// 进行等比缩放把编辑区上的dx转换为在原图片上的dx
        dy = (image.height / height) * dy;// 进行等比缩放把编辑区上的dy转换为在原图片上的dy
        let realWidthCut = (image.width / width) * widthCut;//进行等比缩放把视口宽度转换为在原图片上的实际裁剪宽度
        let realHeightCut = (image.height / height) * widthCut;//进行等比缩放把视口宽度转换为在原图片上的实际裁剪高度
  
        ctx.drawImage(
          image,
          dx,
          dy,
          realWidthCut,
          realHeightCut,
          0,
          0,
          widthCut,
          widthCut
        );
        return canvas.toDataURL("image/png");		//最终返回截图的base64数据
      }
  ```

  

* #### 图片下载到本地

  为了更好地说明代码，以下我们先介绍几个用到的知识点：

  * 图片的`base64`存储格式: 

    ```
    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAgAElEQVR4Xt29d3SdZ54e9nz1NvRKAEQjQLCLpMQmqpEURQ2ptvLOaDyzsRPvnmSL4/U5SRzHzvE/yTlZr2Nv1j5JXHazfcaePmPNjKQZSTMqVKFEiV2sINhAgujtlq/mPL/3++69AAECpLSJ ......
    ```

    以上是我截图的一小段`base64`格式图片的具体内容(省略号处还有许多字符手动省略了)，但由此我们可以看到`base64`格式的图片大致可分为两部分，两部分之间以逗号分隔

    * 第一部分：`data:image/png;base64`
    * 第二部分：一段字母，数字，符号等不同字符组成的数据

  * `JS`中的`Blob`对象（引用自 https://www.jianshu.com/p/b322c2d5d778 ）

    ```
    在一般的Web开发中，很少会用到Blob，但Blob可以满足一些场景下的特殊需求。Blob，Binary Large Object的缩写，代表二进制类型的大对象。Blob的概念在一些数据库中有使用到，例如，MYSQL中的BLOB类型就表示二进制数据的容器。在Web中，Blob类型的对象表示不可变的类似文件对象的原始数据，通俗点说，就是Blob对象是二进制数据，但它是类似文件对象的二进制数据，因此可以像操作File对象一样操作Blob对象，实际上，File继承自Blob。
    ```

    * 可以通过Blob的构造函数创建Blob对象： `Blob(blobParts[, options])`, 参数说明：
      * `blobParts`： 数组类型， 数组中的每一项连接起来构成Blob对象的数据，数组中的每项元素可以是`ArrayBuffer(二进制数据缓冲区), ArrayBufferView,Blob,DOMString`。或其他类似对象的混合体。
      * `options`： 可选项，字典格式类型，可以指定如下两个属性：
        * `type:` 默认值为`""`，它代表了将会被放入到blob中的数组内容的MIME类型。
        * `endings:`， 默认值为`"transparent"`，用于指定包含行结束符`\n`的字符串如何被写入。 它是以下两个值中的一个： "native"，表示行结束符会被更改为适合宿主操作系统文件系统的换行符；"transparent"，表示会保持blob中保存的结束符不变。

  * 根据以上两个知识点，我们可以利用`Blob`对象把`base64`格式的图片转换为文件对象的二级制数据：

  ```javascript
  function dataURLtoBlob(base64) {
        var arr = base64.split(","),
          mime = arr[0].match(/:(.*?);/)[1],		//提取出文件类型
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
  ```

  * 至于下载文件到本地，`demo`中用了`a`标签的`download`属性：

  ```html
   <button onclick="downloadFileByBase64()">下载图片</button>
  ```

  ```javascript
  	function downloadFileByBase64() {
        if (preImg.style.display) {
          var myBlob = dataURLtoBlob(preImg.src);
          var myUrl = URL.createObjectURL(myBlob);
          downloadFile(myUrl, `img-${new Date().getTime().toString(36)}`);
        } else {
          alert("请先上传图片");
        }
      }    
  	function downloadFile(url, name = "cropperImg") {
        var a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", name);
        a.setAttribute("target", "_blank");
        let clickEvent = document.createEvent("MouseEvents");
        clickEvent.initEvent("click", true, true);
        a.dispatchEvent(clickEvent);
      }
  ```

* #### 视口内"亮灯"，视口外"关灯"的效果实现

  * `CSS clip:` 可以用于裁剪一个图像：

    ```css
    img{
    	clip: rect(0px 100px 100px 0px);
    }
    ```

    `rect`规定形状为矩形，官方表明的 一般的用法为`rect (top, right, bottom, left) `， 而我的理解则是 `top`表示裁剪区域距离图片上方的距离，`right`表示需要裁剪的宽度加上`left`，`bottom`表示需要裁剪的高度加上`top`， `left`则表示裁剪区域距离图片左方的距离。具体可如图所示：

    ![](https://github.com/Superwzw/ericzwwu.GitHub.io/blob/master/%E5%A5%BD%E7%8E%A9%E7%9A%84demo%E6%97%A5%E8%AE%B0/%E5%8E%9F%E7%94%9FJS%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BD%91%E9%A1%B5%E5%9B%BE%E7%89%87%E8%A3%81%E5%89%AA%E5%99%A8demo/img/470800-20160911165041811-2070965771.jpg?raw=true)

    

    利用此`css`属性可以做到仅显示图片的`react`区域：

    ![](https://github.com/Superwzw/ericzwwu.GitHub.io/blob/master/%E5%A5%BD%E7%8E%A9%E7%9A%84demo%E6%97%A5%E8%AE%B0/%E5%8E%9F%E7%94%9FJS%E5%81%9A%E4%B8%80%E4%B8%AA%E7%BD%91%E9%A1%B5%E5%9B%BE%E7%89%87%E8%A3%81%E5%89%AA%E5%99%A8demo/img/20200410125420.png?raw=true)

    那如何做到关灯呢？答案是在添加把图片分为两层，底层为没有设置`clip`属性的图片，通过`css filter`来设置其亮度为`20%`或其他值，上层的图片则是设置了`clip`属性，只显示指定区域。两张图片的位置重叠，由于上层的图片`z-index`的值会更大，默认覆盖底层经过亮度调整之后的图片，通过这种覆盖的效果，就能够做到我们需要的效果了。

    ```html
    <div class="img-container">
              <img
                src=""
                class="img-crop"
                draggable="false"
                onselect="return false"
              />
              <img
                src=""
                class="img-crop-copy"
                draggable="false"
                onselect="return false"
              />
    </div>
    ```

    

    ```css
    .img-container .img-crop {
          height: 400px;
          position: absolute;
          top: 50%;
          left: 50%;
          display: none;
          transform: translate(-50%, -50%);
          filter: brightness(30%);
        }
        .img-container .img-crop-copy {
          height: 400px;
          position: absolute;
          top: 50%;
          left: 50%;
          display: none;
          transform: translate(-50%, -50%);
          clip: rect(0px 100px 100px 0px);
        }
    ```

----

### 写在最后

这篇笔记主要把整个demo中需要解决的痛点一个个分离出来作为记录，不涉及具体的编码部分。实际上，我发现自己在编码时并没有作过多的设计，导致代码非常混乱，可能难以理解，也可能存在一些结构或者性能上的问题。后续笔者会寻找几个写得好的开源demo，分别分析他们的代码优点，并对自己的代码加以修改。

我认为的学习的过程即是这样，一开始你想写一个demo，可能会遇到许多的问题，难点。在拆解，分开，理解其中涉及到的知识后，我们便能够实现大概的功能。自己去探索的过程是非常珍贵的。

等到自己写出来了demo，下一步则是要参考别人相同功能的demo中，有哪些写得比自己更为出色的地方。这个过程也许很漫长，但的确是非常有趣。且这一步对自己的成长而言，是意义重大的。在这篇笔记中，也许也有很多作者理解错了，写得不好的地方，希望能一起讨论与分享观点，一起成长。

