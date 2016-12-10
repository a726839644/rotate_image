/**
 * Created by a7268 on 2016/10/23.
 */
+function ($) {
    "use strict";

    var Rotate = function (box) {
        this.$box = $(box);
        this.$img = this.$box.find("img");
        this.boxWidth = this.$box.width();
        this.boxHeight = this.$box.height();
        this.angle = 0;
        this.scale = this.imgURL = null;

        this.updateSize();

        this.$box.on("click", ".rotate-img-controller", $.proxy(this.controlHandler, this))
            .on("change", ".rotate-img-upload", $.proxy(this.uploadHandler, this));
        $(window).on("resize", $.proxy(function () {
            this.boxWidth = this.$box.width();
            this.boxHeight = this.$box.height();
            this.updateSize();
        }, this));
    };

    Rotate.VERSION = "1.3.0";
    Rotate.TRANSITION_DURATION = 500;
    Rotate.transitionEnd = (function whichAnimationEvent() {
        //transition结束事件
        var t;
        var el = document.createElement('fakeelement');
        var transitions = {
            'transition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'MozTransition': 'transitionsend',
            'WebkitTransition': 'webkitTransitionEnd'
        };
        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    })();

    Rotate.getBlobURL = (window.URL && URL.createObjectURL.bind(URL)) ||
        (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) ||
        window.createObjectURL;

    Rotate.revokeBlobURL = (window.URL && URL.revokeObjectURL.bind(URL)) ||
        (window.webkitURL && webkitURL.revokeObjectURL.bind(webkitURL)) ||
        window.revokeObjectURL;

    Rotate.prototype.updateSize = function (image) {
        //更新旋转缩放比例，并设置图片
        var boxRatio = this.boxWidth / this.boxHeight;
        var img;
        if (image) {
            img = image;
        }
        else {
            img = new Image();
            img.src = this.$img.prop("src");
        }
        var self = this;
        $(img).on("load", function () {
            var ratio, antiRatio;
            var imgWidth = this.width, imgHeight = this.height;
            var imgRatio = imgWidth / imgHeight;

            if (imgRatio > boxRatio) {
                ratio = self.boxWidth / imgWidth;
            }
            else {
                ratio = self.boxHeight / imgHeight;
            }
            if (1 / imgRatio > boxRatio) {
                antiRatio = self.boxWidth / imgHeight;
            }
            else {
                antiRatio = self.boxHeight / imgWidth;
            }
            self.scale = antiRatio / ratio;

            if (ratio > 1) {
                self.$img.css({
                    "width": imgWidth * ratio + "px"       //小图片放大
                });
            }
            else {
                self.$img.css({
                    "width": ""                 //清除小图片放大
                });
            }

            if (self.$img.prop("src") == this.src && self.angle % 180 != 0) {
                self.$img.css({
                    transform: "scale(" + self.scale + ") rotate(" + self.angle + "deg)"
                });
            }
            else {
                self.$img.css({     //设置初值
                    transform: "scale(1,1)",
                    transition: ""
                });
                self.$img.prop({
                    tempScale: 1,
                    tempAngle: 0
                });
                self.angle = 0;
                self.$img.prop("src", this.src);
            }
        });

    };

    Rotate.prototype.uploadHandler = function (e) {
        if (Rotate.revokeBlobURL && this.imgURL) {
            Rotate.revokeBlobURL(this.imgURL);
        }
        if (Rotate.getBlobURL) {
            this.imgURL = Rotate.getBlobURL($(e.target).prop("files")[0]);
        }
        else {
            this.imgURL = e.target.value;
        }
        var img = new Image();
        img.src = this.imgURL;
        this.updateSize(img);
    };

    Rotate.prototype.controlHandler = function () {
        var self = this;
        if (!this.$img.hasClass("rotating")) {
            var scale;

            this.angle += 90;
            if (this.angle % 180 == 0) {
                scale = 1;
            }
            else {
                scale = this.scale;
            }

            this.$img.addClass("rotating");
            if (Rotate.transitionEnd) {
                if (this.angle == 90) {
                    this.$img.css({
                        transition: "transform " + Rotate.TRANSITION_DURATION + "ms"
                    })
                }
                this.$img.css({
                    transform: "scale(" + scale + ") rotate(" + this.angle + "deg)"
                });
                this.$img.one(Rotate.transitionEnd, function () {
                    $(this).removeClass("rotating");
                });
            }
            else {
                //浏览器不支持transition时用jQuery实现
                var tempScale, tempAngle;
                this.$img.animate({
                    tempScale: scale,
                    tempAngle: self.angle
                }, {
                    step: function (now, fx) {
                        if (fx.prop == "tempScale") {
                            tempScale = now;
                        } else {
                            tempAngle = now;
                            $(fx.elem).css({
                                transform: "scale(" + tempScale + "," + tempScale + ") rotate(" + tempAngle + "deg)"
                            });
                        }
                    },
                    complete: function () {
                        $(this).removeClass("rotating");
                    }
                });
            }
        }
    };

    $(window).on("load", function () {

        $(".rotate-img-box").each(function () {
            new Rotate(this);
        })
    })
}(jQuery);