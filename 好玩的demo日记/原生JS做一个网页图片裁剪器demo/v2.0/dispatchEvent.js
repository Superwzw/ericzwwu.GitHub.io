var cutBox = document.getElementsByClassName("cutting-box")[0];
var img = document.getElementsByClassName("img-crop")[0];
var img_copy = document.getElementsByClassName("img-crop-copy")[0];
var preImg = document.getElementsByClassName("pre-img")[0];
var imgTmp;

var draggingDOM = null;
var diffX = 0;
var diffY = 0;
var pos = {};
var ori_left, ori_top;
var boxLeft, boxTop, w, h;

function dispatchEvent(e) {
  let listenerBank = {
    mousedown: {
      "cutting-box": function (e) {
        draggingDOM = e.target;
        diffX = e.clientX - draggingDOM.offsetLeft;
        diffY = e.clientY - draggingDOM.offsetTop;
      },
      "cut-button": function (e) {
        draggingDOM = e.target;
        pos = {
          x: e.clientX,
          y: e.clientY,
          w: cutBox.clientWidth,
          h: cutBox.clientHeight,
          t: cutBox.offsetTop,
          l: cutBox.offsetLeft,
        };
      },
    },
    mousemove: {
      "cutting-box": function (e) {
        if (draggingDOM) {
          boxLeft = e.clientX - diffX;
          boxTop = e.clientY - diffY;
          // 判断是否有越界
          if (boxLeft < ori_left) boxLeft = ori_left;
          if (boxTop < ori_top) boxTop = ori_top;
          if (boxLeft > ori_left + img.width - cutBox.clientWidth) {
            boxLeft = ori_left + img.width - cutBox.clientWidth;
          }
          if (boxTop > ori_top + img.height - cutBox.clientHeight) {
            boxTop = ori_top + img.height - cutBox.clientHeight;
          }
          draggingDOM.style.left = boxLeft + "px";
          draggingDOM.style.top = boxTop + "px";
          rect = `rect(${boxTop - ori_top}px ${
            boxLeft - ori_left + cutBox.clientWidth
          }px ${boxTop - ori_top + cutBox.clientHeight}px ${
            boxLeft - ori_left
          }px)`;
          img_copy.style.clip = rect;
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
      "left-top-button": function (e) {
        if (draggingDOM) {
          let diffXR = e.clientX - pos.x;
          let diffYR = e.clientY - pos.y;
          w = Math.max(100, pos.w - diffXR);
          h = Math.max(100, pos.h - diffYR);
          if (Math.abs(w) > Math.abs(h)) h = w;
          else w = h;
          diff = w - pos.w;
          boxTop = pos.t - diff;
          boxLeft = pos.l - diff;
          if (boxTop < ori_top) {
            boxTop = ori_top;
            boxLeft = pos.l - (pos.t - ori_top);
            w = Math.max(100, pos.w + (pos.t - ori_top));
            h = Math.max(100, pos.h + (pos.t - ori_top));
          }
          if (boxLeft < ori_left) {
            boxLeft = ori_left;
            boxTop = pos.t - (pos.l - ori_left);
            w = Math.max(100, pos.w + (pos.l - ori_left));
            h = Math.max(100, pos.h + (pos.l - ori_left));
          }
          cutBox.style.top = boxTop + "px";
          cutBox.style.left = boxLeft + "px";
          toDoResize();
        }
      },
      "right-top-button": function (e) {
        if (draggingDOM) {
          let diffXR = e.clientX - pos.x;
          let diffYR = e.clientY - pos.y;
          w = Math.max(100, pos.w + diffXR);
          h = Math.max(100, pos.h - diffYR);
          if (Math.abs(w) > Math.abs(h)) h = w;
          else w = h;
          diff = w - pos.w;
          boxTop = pos.t - diff;
          boxLeft = pos.l;
          if (boxTop < ori_top) {
            boxTop = ori_top;
            w = Math.max(100, pos.w + (pos.t - ori_top));
            h = Math.max(100, pos.h + (pos.t - ori_top));
          }
          if (boxLeft + w > img.width + ori_left) {
            w = img.width + ori_left - boxLeft;
            h = pos.h + (w - pos.w);
            boxTop = pos.t - (w - pos.w);
          }
          cutBox.style.top = boxTop + "px";
          toDoResize();
        }
      },
      "right-down-button": function (e) {
        if (draggingDOM) {
          let diffXR = e.clientX - pos.x;
          let diffYR = e.clientY - pos.y;
          w = Math.max(100, diffXR + pos.w);
          h = Math.max(100, diffYR + pos.h);
          if (Math.abs(w) > Math.abs(h)) h = w;
          else w = h;
          if (w >= img.width - (cutBox.offsetLeft - ori_left)) {
            w = img.width - (cutBox.offsetLeft - ori_left);
            h = w;
          }
          if (h >= img.height - (cutBox.offsetTop - ori_top)) {
            h = img.height - (cutBox.offsetTop - ori_top);
            w = h;
          }
          boxLeft = pos.l;
          boxTop = pos.t;
          toDoResize();
        }
      },
      "left-down-button": function (e) {
        if (draggingDOM) {
          let diffXR = e.clientX - pos.x;
          let diffYR = e.clientY - pos.y;
          w = Math.max(100, pos.w - diffXR);
          h = Math.max(100, pos.h + diffYR);
          if (Math.abs(w) > Math.abs(h)) h = w;
          else w = h;
          diff = w - pos.w;
          boxTop = pos.t;
          boxLeft = pos.l - diff;
          if (boxLeft < ori_left) {
            boxLeft = ori_left;
            w = Math.max(100, pos.w + (pos.l - ori_left));
            h = Math.max(100, pos.h + (pos.l - ori_left));
          }
          if (boxTop + h > img.height + ori_top) {
            h = img.height + ori_top - boxTop;
            w = pos.w + (h - pos.h);
            boxLeft = pos.l - (h - pos.h);
          }
          cutBox.style.left = boxLeft + "px";
          toDoResize();
        }
      },
    },
    mouseup: function (e) {
      draggingDOM = null;
    },
  };

  function toDoResize() {
    cutBox.style.width = w + "px";
    cutBox.style.height = h + "px";
    rect = `rect(${boxTop - ori_top}px ${
      boxLeft - ori_left + cutBox.clientWidth
    }px ${boxTop - ori_top + cutBox.clientHeight}px ${boxLeft - ori_left}px)`;
    img_copy.style.clip = rect;
    let base64Img = getBase64AfterCut(
      imgTmp,
      boxLeft - ori_left,
      boxTop - ori_top,
      w,
      h,
      img.width,
      img.height
    );
    let preImg = document.getElementsByClassName("pre-img")[0];
    preImg.src = base64Img;
    preImg.style.display = "block";
  }

  function getCallBack(e) {
    let type = e.type;
    let node = draggingDOM ? draggingDOM.className : e.target.className;
    if (type === "mouseup") return listenerBank["mouseup"](e);
    else {
      if (node.indexOf("cutting-box") !== -1) {
        return listenerBank[type][node](e);
      } else if (node.indexOf("cut-button") !== -1) {
        if (type === "mousedown") {
          return listenerBank[type][node.split(" ")[0]](e);
        }
        let buttonType = node.split(" ")[1];
        return listenerBank[type][buttonType](e);
      }
    }
  }

  getCallBack(e);
}

function imgUpload(imgFile) {
  img.style.display = "none";
  img_copy.style.display = "none";
  if (!imgFile || !imgFile.files[0]) {
    return;
  }
  let reader = new FileReader();
  let imgContent = "";
  reader.onload = function (e) {
    imgContent = e.target.result;
    imgTmp = new Image();
    imgTmp.src = imgContent;
    let scale = 0;
    imgTmp.onload = function () {
      if (this.width / this.height >= 2.5) {
        scale = 1000 / this.width;
        img.width = 1000;
        img.height = this.height * scale;
      } else {
        scale = 400 / this.height;
        img.width = this.width * scale;
        img.height = 400;
      }
      img_copy.width = img.width;
      img_copy.height = img.height;
      img.src = imgContent;
      img_copy.src = imgContent;
      img_copy.style.clip = "rect(0 100px 100px 0)";
      img.style.display = "block";
      img_copy.style.display = "block";
      cutBox.style.top = img.offsetTop - 0.5 * img.height + "px";
      cutBox.style.left = img.offsetLeft - 0.5 * img.width + "px";
      cutBox.style.width = "100px";
      cutBox.style.height = "100px";
      cutBox.style.display = "block";
      let base64Img = getBase64AfterCut(
        imgTmp,
        0,
        0,
        100,
        100,
        img.width,
        img.height
      );
      let preImg = document.getElementsByClassName("pre-img")[0];
      preImg.src = base64Img;
      preImg.style.display = "block";
      ori_left = img.offsetLeft - 0.5 * img.width;
      ori_top = img.offsetTop - 0.5 * img.height;
    };
  };
  reader.readAsDataURL(imgFile.files[0]);
}
function getBase64AfterCut(image, dx, dy, widthCut, heightCut, width, height) {
  let canvas = document.createElement("canvas");
  canvas.height = heightCut;
  canvas.width = widthCut;
  let ctx = canvas.getContext("2d");
  //计算原始图片的实际裁剪偏移
  dx = (image.width / width) * dx;
  dy = (image.height / height) * dy;
  let realWidthCut = (image.width / width) * widthCut;
  let realHeightCut = (image.height / height) * widthCut;

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
  return canvas.toDataURL("image/png");
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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
function downloadFileByBase64() {
  if (preImg.style.display) {
    var myBlob = dataURLtoBlob(preImg.src);
    var myUrl = URL.createObjectURL(myBlob);
    downloadFile(myUrl, `img-${new Date().getTime().toString(36)}`);
  } else {
    alert("请先上传图片");
  }
}

document.addEventListener("mousedown", dispatchEvent);
document.addEventListener("mousemove", dispatchEvent);
document.addEventListener("mouseup", dispatchEvent);
