'use strict';

var drawAnnotation = false;
var rubberStampType = "";
var annWidth;
var annHeight;
var ignoreMove = false;
var mouseX;
var mouseY;
var offsetx;
var offsety;
var pdfBase64Data;

var ANNOTATION_HIGHLIGHT = 90001;
var ANNOTATION_BLACKOUT = 90002;
var ANNOTATION_RUBBERSTAMP = 90003;
var ANNOTATION_STICKYNOTE = 90004;
var ANNOTATION_ELLIPSE = 90005;
var ANNOTATION_SIGNATURE = 90006;
var ANNOTATION_NOTING = 90007;         //Added by Yash

var ANNOTATION_SIGN = 90008;         //Added by Suraj. This annotation will not be stored in the database. Use only to find the position of a rectangle created by the user.
var ANNOTATION_STAMP = 90009;         //Added by Suraj. This annotation will not be stored in the database. Use only to find the position of a rectangle created by the user.

var newAnnotation = null;

var colorRed = 0;
var colorGreen = 0;
var colorBlue = 255;
var userName = userName;
var realName = userName;


var selectionHandles = [];
var selectedAnnotation = null;

var expectResize = -1;
var isResizeDrag = false;
var isDrag = false;
var canEdit = true;
var sharedDocumentID = null;
var shareType = null;
var permalinkID = null;
var signaturePad = null;
var pixelRatio = 1.0;
var ignoreClick = false;
var signaturePadcolorRed = 0;
var signaturePadcolorGreen = 0;
var signaturePadcolorBlue = 128;
var DocumentAnnotation = function (options) {
    this.annotationId = options.annotationId;
    this.annotationType = options.annotationType;
    this.pageId = options.pageId;

    this.x1 = options.x1;
    this.y1 = options.y1;

    this.x2 = options.x2;
    this.y2 = options.y2;

    this.colorRed = options.colorRed;

    this.colorGreen = options.colorGreen;
    this.colorBlue = options.colorBlue;

    this.opacity = options.opacity;

    this.text = options.text;

    this.userName = options.userName;

    this.selected = options.selected;
    this.dirty = options.dirty;

    this.ddeleted = options.ddeleted;

    this.date = options.date;

    this.action = options.action;

    this.tempId = options.tempId;

    this.imageData = options.imageData;

    this.pageWidth = options.pageWidth;
    this.pageHeight = options.pageHeight;
    this.realName = options.realName;
};

var SelectionHandle = function (options) {
    this.x = options.x;
    this.y = options.y;
};

DocumentAnnotation.prototype.draw = function (ctx, scale) {
    scale = scale * window.devicePixelRatio;
    if (this.annotationType == ANNOTATION_HIGHLIGHT) {
        ctx.fillStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", 0.5)";
        ctx.fillRect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
    } else if (this.annotationType == ANNOTATION_BLACKOUT) {
        ctx.fillStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", " + this.opacity + ")";
        ctx.fillRect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
    } else if (this.annotationType == ANNOTATION_ELLIPSE) {
        ctx.strokeStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", " + this.opacity + ")";
        ctx.lineWidth = scale;
        var radiusX = (this.x2 * scale - this.x1 * scale) * 0.5;
        var radiusY = (this.y2 * scale - this.y1 * scale) * 0.5;
        var centerX = this.x1 * scale + radiusX;
        var centerY = this.y1 * scale + radiusY;
        var step = 0.01;
        var a = step;
        var pi2 = Math.PI * 2 - step;
        ctx.beginPath();
        ctx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
        for (; a < pi2; a += step) {
            ctx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();

    } else if (this.annotationType == ANNOTATION_STICKYNOTE) {
        ctx.save();
        ctx.fillStyle = "rgb(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ")";
        ctx.shadowOffsetX = 2 * scale;
        ctx.shadowOffsetY = 2 * scale;
        ctx.shadowColor = "rgb(128,128,128)";
        ctx.fillRect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
        ctx.restore();

        ctx.textBaseline = "top";
        ctx.font = 10 * scale + "px VERDANA";
        ctx.fillStyle = "rgb(0,0,0)";
        var maxWidth = (this.x2 - this.x1) * scale
        var words = this.text.split(' ');
        var line = '';
        var x = (this.x1 + 4) * scale;
        var y = (this.y1 + 4) * scale;
        var lineHeight = 16;
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);

        if (this.text.length > 0) {
            ctx.fillText(" - " + this.realName, x, y + (lineHeight * scale));
        }

    } else if (this.annotationType == ANNOTATION_SIGNATURE) {

        var xPos = this.x1 * scale;
        var yPos = this.y1 * scale;
        var xEndPos = (this.x2 * scale - this.x1 * scale);
        var yEndPos = (this.y2 * scale - this.y1 * scale);
        documentSignature.onload = function () {
            ctx.drawImage(documentSignature, xPos, yPos, xEndPos, yEndPos);
        };
        documentSignature.src = this.imageData;
    }
    // Added by Yash
    else if (this.annotationType == ANNOTATION_NOTING) {
        ctx.fillStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", 0.4)";
        ctx.fillRect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);

    } else if (this.annotationType == ANNOTATION_SIGN) {

        console.log(this.x1 + " " + this.y1 + " " + scale)
        var xPos = this.x1 * scale;
        var yPos = this.y1 * scale;
        var xEndPos = (this.x2 * scale - this.x1 * scale);
        var yEndPos = (this.y2 * scale - this.y1 * scale);
        ctx.fillStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", 0.4)";

        ctx.fillRect(xPos, yPos, xEndPos, yEndPos);

        console.log(Math.floor(xPos / 1.6), Math.floor(yPos / 1.6), Math.floor(xEndPos), Math.floor(yEndPos));

        parent.saveDimensions(Math.floor(xPos / 1.6).toString(), Math.floor(yPos / 1.6).toString(), Math.floor(xEndPos).toString(), Math.floor(yEndPos).toString());
    } else if (this.annotationType == ANNOTATION_STAMP) {
        var xPos = this.x1 * scale;
        var yPos = this.y1 * scale;
        var xEndPos = (this.x2 * scale - this.x1 * scale);
        var yEndPos = (this.y2 * scale - this.y1 * scale);

        ctx.fillStyle = "rgba(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ", 0.4)";
        ctx.fillRect(xPos, yPos, xEndPos, yEndPos);

        console.log(Math.floor(xPos / 1.6), Math.floor(yPos / 1.6), Math.floor(xEndPos), Math.floor(yEndPos), this.pageId.toString());
        console.log(this.pageWidth, this.pageHeight)
        parent.saveDimensions(Math.floor(xPos / 1.6).toString(), Math.floor(yPos / 1.6).toString(), Math.floor(xEndPos).toString(), Math.floor(yEndPos).toString(), this.pageId.toString());
    } else {
        ctx.save();
        ctx.strokeStyle = "rgb(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ")";
        ctx.fillStyle = "rgb(" + this.colorRed + ", " + this.colorGreen + ", " + this.colorBlue + ")";
        ctx.lineWidth = 3 * scale;
        ctx.textBaseline = "top";
        var fontSize = 36;
        if (this.text.length == 9) {
            fontSize = 34;
        } else if (this.text.length == 10) {
            fontSize = 32;
        } else if (this.text.length == 11) {
            fontSize = 30;
        } else if (this.text.length == 12) {
            fontSize = 28;
        } else if (this.text.length == 13) {
            fontSize = 26;
        } else if (this.text.length == 14) {
            fontSize = 24;
        } else if (this.text.length == 15) {
            fontSize = 22;
        } else if (this.text.length == 16) {
            fontSize = 21;
        } else if (this.text.length == 17) {
            fontSize = 20;
        } else {
            fontSize = 36;
        }

        ctx.font = fontSize * scale + "px VERDANA";
        var metrics = ctx.measureText(this.text);
        var xPos = this.x1 * scale + ((this.x2 - this.x1) * scale / 2) - (metrics.width / 2);

        ctx.shadowOffsetX = scale;
        ctx.shadowOffsetY = scale;
        ctx.shadowColor = "rgb(200,200,200)";
        ctx.fillText(this.text, xPos, (this.y1 + 4) * scale);
        ctx.strokeRect((this.x1) * scale, (this.y1) * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);


        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        var stampText = "By " + this.realName + " On " + this.date;
        ctx.font = 8 * scale + "px VERDANA";
        metrics = ctx.measureText(stampText);
        var xPos = this.x1 * scale + ((this.x2 - this.x1) * scale / 2) - (metrics.width / 2);
        ctx.fillText(stampText, xPos, (this.y1 + 44) * scale);

        ctx.restore();
    }
    if (this.selected) {
        ctx.strokeStyle = "rgb(0,0,255)";
        ctx.lineWidth = 3 * scale;
        if (this.annotationType == ANNOTATION_RUBBERSTAMP) {
            ctx.fillStyle = "rgb(0,0,255)";
            ctx.strokeRect((this.x1) * scale, (this.y1) * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
        } else {
            ctx.strokeRect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
            var boxSize = 6 * scale;
            var half = boxSize / 2;

            for (var i = 0; i < 8; i++) {
                selectionHandles.push(new SelectionHandle({}));
            }

            selectionHandles[0].x = parseInt((this.x1 * scale) - half);
            selectionHandles[0].y = parseInt((this.y1 * scale) - half);

            selectionHandles[1].x = parseInt((this.x1 * scale) + ((this.x2 * scale) - (this.x1 * scale)) / 2 - half);
            selectionHandles[1].y = parseInt((this.y1 * scale) - half);

            selectionHandles[2].x = (this.x1 * scale) + ((this.x2 * scale) - (this.x1 * scale)) - half;
            selectionHandles[2].y = (this.y1 * scale) - half;

            //middle left
            selectionHandles[3].x = (this.x1 * scale) - half;
            selectionHandles[3].y = (this.y1 * scale) + ((this.y2 * scale) - (this.y1 * scale)) / 2 - half;

            //middle right
            selectionHandles[4].x = (this.x1 * scale) + ((this.x2 * scale) - (this.x1 * scale)) - half;
            selectionHandles[4].y = (this.y1 * scale) + ((this.y2 * scale) - (this.y1 * scale)) / 2 - half;

            //bottom left, middle, right
            selectionHandles[6].x = (this.x1 * scale) + ((this.x2 * scale) - (this.x1 * scale)) / 2 - half;
            selectionHandles[6].y = (this.y1 * scale) + ((this.y2 * scale) - (this.y1 * scale)) - half;

            selectionHandles[5].x = (this.x1 * scale) - half;
            selectionHandles[5].y = (this.y1 * scale) + ((this.y2 * scale) - (this.y1 * scale)) - half;

            selectionHandles[7].x = (this.x1 * scale) + ((this.x2 * scale) - (this.x1 * scale)) - half;
            selectionHandles[7].y = (this.y1 * scale) + ((this.y2 * scale) - (this.y1 * scale)) - half;

            ctx.fillStyle = '#0000ff';
            for (var i = 0; i < 8; i++) {
                var cur = selectionHandles[i];
                ctx.fillRect(cur.x, cur.y, boxSize, boxSize);
            }
        }
    }
};

function drawTextInBox(ctx, txt, font, x, y, w, h, angle) {
    angle = angle || 0;
    var fontHeight = 20;
    var hMargin = 4;
    ctx.font = fontHeight + 'px ' + font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var txtWidth = ctx.measureText(txt).width + 2 * hMargin;
    ctx.save();
    ctx.translate(x + w / 2, y);
    ctx.rotate(angle);
    ctx.strokeRect(-w / 2, 0, w, h);
    ctx.scale(w / txtWidth, h / fontHeight);
    ctx.translate(hMargin, 0)
    ctx.fillText(txt, -txtWidth / 2, 0);
    ctx.restore();
}

var RubberStampAnnotation = (function RubberStampAnnotationClosure() {

    function RubberStampAnnotation(options) {
        this.overlayName = options.overlayName;
        this.overlayManager = options.overlayManager;
        this.container = options.container;
        if (options.closeButton) {
            options.closeButton.addEventListener('click', this.close.bind(this));
        }
        if (options.okButton) {
            options.okButton.addEventListener('click', this.selectRubberStampType.bind(this));
        }
        this.overlayManager.register(this.container, true);
    }

    RubberStampAnnotation.prototype = {
        open: function RubberStampAnnotation_open() {
            Promise.all([this.overlayManager.open(this.container),
                this.dataAvailablePromise]).then(function () {

            }.bind(this));
        },
        selectRubberStampType: function rubberStampAnnotationSelectType() {
            this.close();
            PDFViewerApplication.createDocumentAnnotation(ANNOTATION_RUBBERSTAMP);
            rubberStampType = document.getElementById("stamptype").value;
            newAnnotation.text = rubberStampType;
        },
        close: function RubberStampAnnotation_close() {
            rubberStampType = "";
            this.overlayManager.close(this.container);
        }
    };
    return RubberStampAnnotation;
})();


var DeleteAnnotationConfirmationPrompt = (function DeleteAnnotationConfirmationClosure() {
    function DeleteAnnotationConfirmationPrompt(options) {
        this.overlayName = options.overlayName;
        this.overlayManager = options.overlayManager;
        this.container = options.container;
        if (options.closeButton) {
            options.closeButton.addEventListener('click', this.close.bind(this));
        }
        if (options.okButton) {
            options.okButton.addEventListener('click', this.confirmDelete.bind(this));
        }
        this.overlayManager.register(this.container, true);
    }

    DeleteAnnotationConfirmationPrompt.prototype = {
        open: function DeleteConfimrationPrompt_open(ann) {
            this.ann = ann;
            this.overlayManager.open(this.container);

        },
        confirmDelete: function confirmDelete() {
            this.ann.ddeleted = true;
            this.ann.dirty = true;
            var pageView = PDFViewerApplication.pdfViewer.getPageView(this.ann.pageId - 1);
            PDFViewerApplication.drawDocumentAnnotations(pageView, pageView.context, this.ann.pageId);
            this.close();
        },
        close: function DeleteAnnotationConfirmationPrompt_close() {
            this.overlayManager.close(this.container);
        }
    };
    return DeleteAnnotationConfirmationPrompt;
})();

var StickyNotePrompt = (function StickyNotePromptClosure() {
    function StickyNotePrompt(options) {
        this.overlayName = options.overlayName;
        this.overlayManager = options.overlayManager;
        this.container = options.container;
        if (options.closeButton) {
            options.closeButton.addEventListener('click', this.cancel.bind(this));
        }
        if (options.okButton) {
            options.okButton.addEventListener('click', this.getStickyNote.bind(this));
        }
        this.overlayManager.register(this.container, true);
    }

    StickyNotePrompt.prototype = {
        open: function StickyNotePromptOpen(pageView, context, pageId) {
            this.pageView = pageView;
            this.context = context;
            this.pageId = pageId;
            this.overlayManager.open(this.container);
        },
        getStickyNote: function StickyNotePrompt_getStickyNote() {
            newAnnotation.text = document.getElementById("txtStickyNote").value;
            if (newAnnotation.text.length <= 0) {
                newAnnotation.ddeleted = true;
            }
            PDFViewerApplication.drawDocumentAnnotations(this.pageView, this.context, this.pageId);
            this.close();
        },
        cancel: function StickyNotePrompt_cancel() {
            document.getElementById("txtStickyNote").value = '';
            newAnnotation.ddeleted = true;
            PDFViewerApplication.drawDocumentAnnotations(this.pageView, this.context, this.pageId);
            this.close();
        },
        close: function StickyNotePrompt_close() {
            this.overlayManager.close(this.container).then(function () {
                document.getElementById("txtStickyNote").value = '';
            }.bind(this));
        }
    };
    return StickyNotePrompt;
})();

var SignDocumentDialog = (function SignDocumentDialogClosure() {
    function SignDocumentDialog(options) {
        this.overlayName = options.overlayName;
        this.overlayManager = options.overlayManager;
        this.container = options.container;
        if (options.closeButton) {
            options.closeButton.addEventListener('click', this.cancel.bind(this));
        }
        if (options.clearButton) {
            options.clearButton.addEventListener('click', this.clearSignature.bind(this));
        }
        if (options.okButton) {
            options.okButton.addEventListener('click', this.drawSignature.bind(this));
        }
        if (options.browseButton) {
            options.browseButton.addEventListener('click', this.browseImage.bind(this));
        }
        this.overlayManager.register(this.container, true);
    }

    SignDocumentDialog.prototype = {
        open: function SignDocumentDialogOpen(pageView, context, pageId) {
            this.pageView = pageView;
            this.context = context;
            this.pageId = pageId;
            signaturePad = new SignaturePad(document.getElementById("signature-pad"));
            signaturePad.penColor = "rgb(" + signaturePadcolorRed + ", " + signaturePadcolorGreen + ", " + signaturePadcolorBlue + ")";
            signaturePad.fromDataURL("/");
            this.overlayManager.open(this.container);
        },
        browseImage: function SignDocumentDialog_browseSignature() {
            $("#fileImageInput").trigger("click");
            var fileImageInput = document.getElementById('fileImageInput');
            var imageType = /image.*/;
            fileImageInput.addEventListener('change', function (e) {
                var imageFile = fileImageInput.files[0];
                if (imageFile.type.match(imageType)) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        signaturePad.fromDataURL(reader.result);
                    }
                    reader.readAsDataURL(imageFile);
                }
            });

        },
        drawSignature: function SignDocumentDialog_drawSignature() {
            this.close();
            if (!signaturePad.isEmpty()) {
                PDFViewerApplication.createDocumentAnnotation(ANNOTATION_SIGNATURE);
                newAnnotation.imageData = signaturePad.toDataURL('image/png');
            }
        },
        clearSignature: function SignDocumentDialog_clearSignature() {
            signaturePad.clear();
        },
        cancel: function SignDocumentDialog_cancel() {
            this.close();
        },
        close: function SignDocumentDialog_close() {
            this.overlayManager.close(this.container).then(function () {

            }.bind(this));
        }
    };
    return SignDocumentDialog;
})();

function getMousePos(ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
        mouseX = ev.layerX;
        mouseY = ev.layerY;
    } else if (ev.offsetX || ev.ofofsetX == 0) { // Opera
        mouseX = ev.offsetX;
        mouseY = ev.offsetY;
    }
    if ((ev.clientX || ev.clientY) && document.body && document.body.scrollLeft != null) {
        var rect = ev.target.getBoundingClientRect();
        mouseX = ev.clientX - rect.left,
            mouseY = ev.clientY - rect.top
    }

}

function mouseDoubleClick(ev) {
    var child = document.getElementById('viewerContainer').childNodes[6]
    var childNodes = child.childNodes;

    /*for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i].firstChild != null)
            childNodes[i].firstChild.style.cursor = "wait"
    }
    document.getElementById("viewerContainer").style.cursor = "wait"*/

    document.getElementById("viewerContainer").style.opacity = "30%";
    document.getElementById("loader").style.display = "";
    getMousePos(ev);
    console.log(ev)


    var x = mouseX * 0.6028368794326241
    var y = mouseY * 0.6028368794326241

    console.log(mouseX + " " + mouseY + " " + PDFViewerApplication.page.toString());

    let request = {
        pass: "12345678",
        reason: "Testing Reason",
        location: "",
        x: x,
        y: y,
        page: PDFViewerApplication.page,
        file: pdfBase64Data
    };

    var url = "../api/v1/sign";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        data: JSON.stringify(request),
        success: function (data, textStatus, xhr) {

            /*document.getElementById("viewerContainer").style.cursor = "default";
            for (let i = 0; i < childNodes.length; i++) {
                if (childNodes[i].firstChild != null)
                    childNodes[i].firstChild.style.cursor = "crosshair"
            }*/
            document.getElementById("viewerContainer").style.opacity = "100%";
            document.getElementById("loader").style.display = "none";

            if (xhr.status != 200 || data.length === 0) {
                document.getElementById("alert").style.display = "";
                document.getElementById("alertmsg").innerText = "Something went wrong";
                console.error(xhr)
                return;
            }

            reloadPreviewerForSignedFile(data)

        },
        error: function (jqXHR, exception) {
            document.getElementById("alert").style.display = "";
            document.getElementById("alertmsg").innerText = "Something went wrong";
            console.log(exception)
            /*document.getElementById("viewerContainer").style.cursor = "default";
            for (let i = 0; i < childNodes.length; i++) {
                if (childNodes[i].firstChild != null)
                    childNodes[i].firstChild.style.cursor = "crosshair"
            }*/
            document.getElementById("viewerContainer").style.opacity = "100%";
            document.getElementById("loader").style.display = "none";
        }
    });


}

function mouseDown(ev) {
    //This hack is used to check the browser zoom, as the browser is zoomed we are just ignoring the first click of the user on the page view
    //and refreshing the page
    if (pixelRatio != window.devicePixelRatio) {
        var orgScaleValue = PDFViewerApplication.pdfViewer.currentScaleValue;
        PDFViewerApplication.pdfViewer.currentScaleValue = 1;
        PDFViewerApplication.pdfViewer.currentScaleValue = 0.9;
        PDFViewerApplication.pdfViewer.currentScaleValue = orgScaleValue;
        pixelRatio = window.devicePixelRatio;
        isDrag = false;
        isResizeDrag = false;
        expectResize = -1;
        ignoreClick = true;
        return;
    }
    getMousePos(ev);
    if (expectResize !== -1) {
        isResizeDrag = true;
        return;
    }
    ignoreMove = true;
    for (var i = 0; i < PDFViewerApplication.documentAnnotations.length; i++) {
        var ann = PDFViewerApplication.documentAnnotations[i];
        ann.selected = false;
    }
    if (drawAnnotation) {
        newAnnotation.x1 = mouseX;
        newAnnotation.y1 = mouseY;
        newAnnotation.pageId = ev.target.pageNumber;
        if (newAnnotation.annotationType == ANNOTATION_RUBBERSTAMP) {
            var ctx = ev.target.getContext('2d');
            var x = Math.min(mouseX, newAnnotation.x1);
            var y = Math.min(mouseY, newAnnotation.y1);
        }
        newAnnotation.date = getCurrentDate();
        newAnnotation.userName = userName;
        newAnnotation.realName = realName;
    } else {

        PDFViewerApplication.selectDocumentAnnotation(ev);
    }
}

function mouseUp(ev) {
    if (ignoreClick) {
        ignoreClick = false;
        return;
    }
    getMousePos(ev);
    var currentPage = ev.target.pageNumber;
    if (drawAnnotation) {
        newAnnotation.pageId = currentPage;
        var pageView = PDFViewerApplication.pdfViewer.getPageView(currentPage - 1);

        newAnnotation.pageWidth = (pageView.width / PDFViewerApplication.pdfViewer.currentScale).toFixed(0);
        newAnnotation.pageHeight = (pageView.height / PDFViewerApplication.pdfViewer.currentScale).toFixed(0);


        if (mouseX < newAnnotation.x1) {
            newAnnotation.x2 = newAnnotation.x1;
            newAnnotation.x1 = mouseX;
        }
        if (mouseY < newAnnotation.y1) {
            newAnnotation.y2 = newAnnotation.y1;
            newAnnotation.y1 = mouseY;
        }
        if (newAnnotation.annotationType == ANNOTATION_RUBBERSTAMP) {
            newAnnotation.x2 = (newAnnotation.x1 + (240 * PDFViewerApplication.pdfViewer.currentScale));
            newAnnotation.y2 = (newAnnotation.y1 + (60 * PDFViewerApplication.pdfViewer.currentScale));
        } else if (newAnnotation.annotationType == ANNOTATION_STICKYNOTE) {
            PDFViewerApplication.stickyNotePrompt.open(pageView, ev.target.context, newAnnotation.pageId);
            if (newAnnotation.x2) {
                if (newAnnotation.x2 - newAnnotation.x1 < 100) {
                    newAnnotation.x2 = (newAnnotation.x1 + (100 * PDFViewerApplication.pdfViewer.currentScale));
                }
            } else {
                newAnnotation.x2 = (newAnnotation.x1 + (100 * PDFViewerApplication.pdfViewer.currentScale));
            }
            if (newAnnotation.y2) {
                if (newAnnotation.y2 - newAnnotation.y1 < 100) {
                    newAnnotation.y2 = (newAnnotation.y1 + (100 * PDFViewerApplication.pdfViewer.currentScale));
                }
            } else {
                newAnnotation.y2 = (newAnnotation.y1 + (100 * PDFViewerApplication.pdfViewer.currentScale));
            }
        } else if (newAnnotation.annotationType == ANNOTATION_SIGNATURE) {
            newAnnotation.x2 = (newAnnotation.x1 + (300 * PDFViewerApplication.pdfViewer.currentScale));
            newAnnotation.y2 = (newAnnotation.y1 + (150 * PDFViewerApplication.pdfViewer.currentScale));
        } else {
            //default annotation of highlight or blackout
        }

        newAnnotation.x1 = parseInt(newAnnotation.x1 / PDFViewerApplication.pdfViewer.currentScale);
        newAnnotation.y1 = parseInt(newAnnotation.y1 / PDFViewerApplication.pdfViewer.currentScale);
        newAnnotation.x2 = parseInt(newAnnotation.x2 / PDFViewerApplication.pdfViewer.currentScale);
        newAnnotation.y2 = parseInt(newAnnotation.y2 / PDFViewerApplication.pdfViewer.currentScale);


        if (newAnnotation.annotationType == ANNOTATION_RUBBERSTAMP) {
            if (document.getElementById("chkStampType").checked) {
                for (var i = 1; i < PDFViewerApplication.pdfViewer.pagesCount + 1; i++) {
                    var documentAnnotation = Object.assign({}, newAnnotation);
                    documentAnnotation.pageId = i;
                    documentAnnotation.tempId = new Date().getTime() + "_" + Math.random();
                    PDFViewerApplication.documentAnnotations.push(documentAnnotation);
                    var pageView = PDFViewerApplication.pdfViewer.getPageView(i - 1);
                    if (pageView != null && pageView.context != null) {
                        PDFViewerApplication.drawDocumentAnnotations(pageView, pageView.context, i);
                    }
                }
            } else {
                PDFViewerApplication.documentAnnotations.push(newAnnotation);
            }
        } else {
            PDFViewerApplication.documentAnnotations.push(newAnnotation);
        }
        drawAnnotation = false;
    }

    var pageView = PDFViewerApplication.pdfViewer.getPageView(currentPage - 1);
    PDFViewerApplication.drawDocumentAnnotations(pageView, ev.target.context, currentPage);
    var tempCtx = ev.target.getContext('2d');
    tempCtx.clearRect(0, 0, ev.target.width, ev.target.height);
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
}

function mouseMove(ev) {
    getMousePos(ev);
    if (ignoreMove) {
        ignoreMove = false;
        return;
    }
    if (drawAnnotation) {
        var annCanvas = ev.target;
        var ctx = annCanvas.getContext('2d');
        ctx.clearRect(0, 0, annCanvas.width, annCanvas.height);
        //Modified by Yash
        if (newAnnotation.annotationType == ANNOTATION_HIGHLIGHT ||
            newAnnotation.annotationType == ANNOTATION_BLACKOUT || newAnnotation.annotationType == ANNOTATION_ELLIPSE ||
            newAnnotation.annotationType == ANNOTATION_STICKYNOTE || newAnnotation.annotationType == ANNOTATION_NOTING || newAnnotation.annotationType == ANNOTATION_SIGN
            || newAnnotation.annotationType == ANNOTATION_STAMP) {
            var x = Math.min(mouseX, newAnnotation.x1);
            var y = Math.min(mouseY, newAnnotation.y1);
            var w = Math.abs(mouseX - newAnnotation.x1);
            var h = Math.abs(mouseY - newAnnotation.y1);
            if (!w || !h) {
                return;
            }
            newAnnotation.x2 = mouseX;
            newAnnotation.y2 = mouseY;
            newAnnotation.draw(ctx, 1);
        }
    } else {
        if (isDrag) {
            var scale = PDFViewerApplication.pdfViewer.currentScale;
            var annCanvas = ev.target;
            var ctx = annCanvas.getContext('2d');
            ctx.clearRect(0, 0, annCanvas.width, annCanvas.height);
            selectedAnnotation.x1 = parseInt((mouseX - offsetx) / scale);
            selectedAnnotation.y1 = parseInt((mouseY - offsety) / scale);
            selectedAnnotation.x2 = parseInt((mouseX - offsetx) / scale + annWidth);
            selectedAnnotation.y2 = parseInt((mouseY - offsety) / scale + annHeight);
            selectedAnnotation.dirty = true;
            var pageView = PDFViewerApplication.pdfViewer.getPageView(selectedAnnotation.pageId - 1);
            selectedAnnotation.pageWidth = (pageView.width / PDFViewerApplication.pdfViewer.currentScale).toFixed(0);
            selectedAnnotation.pageHeight = (pageView.height / PDFViewerApplication.pdfViewer.currentScale).toFixed(0);
            PDFViewerApplication.drawDocumentAnnotations(pageView, ev.target.context, selectedAnnotation.pageId);
        } else if (isResizeDrag) {
            if (selectedAnnotation.annotationType != ANNOTATION_RUBBERSTAMP) {
                var scale = PDFViewerApplication.pdfViewer.currentScale;
                // time ro resize!
                var oldx = selectedAnnotation.x1;
                var oldy = selectedAnnotation.y1;

                // 0  1  2
                // 3     4
                // 5  6  7
                switch (expectResize) {
                    case 0:
                        selectedAnnotation.x1 = parseInt(mouseX / scale);
                        selectedAnnotation.y1 = parseInt(mouseY / scale);
                        break;
                    case 1:
                        selectedAnnotation.y1 = parseInt(mouseY / scale);
                        break;
                    case 2:
                        selectedAnnotation.x2 = parseInt(mouseX / scale);
                        selectedAnnotation.y1 = parseInt(mouseY / scale);
                        break;
                    case 3:
                        selectedAnnotation.x1 = parseInt(mouseX / scale);
                        break;
                    case 4:
                        selectedAnnotation.x2 = parseInt(mouseX / scale);
                        break;
                    case 5:
                        selectedAnnotation.x1 = parseInt(mouseX / scale);
                        selectedAnnotation.y2 = parseInt(mouseY / scale);
                        break;
                    case 6:
                        selectedAnnotation.y2 = parseInt(mouseY / scale);
                        break;
                    case 7:
                        selectedAnnotation.x2 = parseInt(mouseX / scale);
                        selectedAnnotation.y2 = parseInt(mouseY / scale);
                        break;
                }

                selectedAnnotation.dirty = true;

                var pageView = PDFViewerApplication.pdfViewer.getPageView(selectedAnnotation.pageId - 1);
                PDFViewerApplication.drawDocumentAnnotations(pageView, ev.target.context, selectedAnnotation.pageId);
            }
        }
        getMousePos(ev);
        if (selectedAnnotation !== null && !isResizeDrag) {
            if (selectedAnnotation.annotationType != ANNOTATION_RUBBERSTAMP) {
                var scale = window.devicePixelRatio;
                var annCanvas = ev.target;
                for (var i = 0; i < 8; i++) {
                    // 0  1  2
                    // 3     4
                    // 5  6  7

                    var cur = selectionHandles[i];
                    // we dont need to use the ghost context because
                    // selection handles will always be rectangles
                    //if (mouseX >= cur.x && mouseX <= cur.x +  (6 * scale )  && mouseY >= cur.y && mouseY <= cur.y + ( 6 *  scale)) {
                    if (parseInt(mouseX * scale) >= cur.x && parseInt(mouseX * scale) <= cur.x + (6 * scale) && parseInt(mouseY * scale) >= cur.y && parseInt(mouseY * scale) <= cur.y + (6 * scale)) {
                        // we found one!
                        expectResize = i;
                        switch (i) {
                            case 0:
                                annCanvas.style.cursor = 'nw-resize';
                                break;
                            case 1:
                                annCanvas.style.cursor = 'n-resize';
                                break;
                            case 2:
                                annCanvas.style.cursor = 'ne-resize';
                                break;
                            case 3:
                                annCanvas.style.cursor = 'w-resize';
                                break;
                            case 4:
                                annCanvas.style.cursor = 'e-resize';
                                break;
                            case 5:
                                annCanvas.style.cursor = 'sw-resize';
                                break;
                            case 6:
                                annCanvas.style.cursor = 's-resize';
                                break;
                            case 7:
                                annCanvas.style.cursor = 'se-resize';
                                break;
                        }
                        return;
                    }
                    isResizeDrag = false;
                    expectResize = -1;
                    annCanvas.style.cursor = 'auto';
                }
            }
        }
    }
}


function drawAnnotationWrapper(pageView, pageNumber) {
    var canvasWrapper = document.querySelector('[aria-label="Page ' + pageNumber + '"]').firstChild;
    // var canvasWrapper = document.getElementById("page"+pageNumber).parentElement;

    var annotationWrapper = canvasWrapper.cloneNode(true); // true means clone all childNodes and all event handlers
    annotationWrapper.style.position = 'absolute';
    annotationWrapper.style.zIndex = 999;

    var tempWrapper = canvasWrapper.cloneNode(true);
    tempWrapper.style.zIndex = 1000;
    tempWrapper.style.position = 'absolute';
    if (pageView.rotation == 0) { //associate events only when there is no rotation
        tempWrapper.addEventListener('mousedown', mouseDown, false);
        tempWrapper.addEventListener('mouseup', mouseUp, false);
        tempWrapper.addEventListener('mousemove', mouseMove, false);
        tempWrapper.addEventListener('dblclick', mouseDoubleClick, false);
    }

    canvasWrapper.parentElement.insertBefore(annotationWrapper, canvasWrapper);
    canvasWrapper.parentElement.insertBefore(tempWrapper, annotationWrapper);

    var annCtx = annotationWrapper.childNodes[0].getContext('2d');
    tempWrapper.childNodes[0].context = annCtx;
    tempWrapper.childNodes[0].pageNumber = pageNumber;
    pageView.context = annCtx;
    PDFViewerApplication.drawDocumentAnnotations(pageView, annCtx, pageNumber);

}

function update(colorPicker) {
    signaturePadcolorRed = Math.round(colorPicker.rgb[0]);
    signaturePadcolorGreen = Math.round(colorPicker.rgb[1]);
    signaturePadcolorBlue = Math.round(colorPicker.rgb[2]);
    PDFViewerApplication.changeDocumentAnnotationColor(colorPicker);
}

window.parent.addEventListener('beforeunload', function beforeUnload(evt) {
    var dirtyAnnotations = false;
    for (var i = 0; i < PDFViewerApplication.documentAnnotations.length; i++) {
        var ann = PDFViewerApplication.documentAnnotations[i];
        if (ann.dirty && !ann.ddeleted) {
            dirtyAnnotations = true;
            window.parent.caseActioned = false;
            //evt.returnValue = "SAVE CHANGES?\nYou have few unsaved annotations. If you leave this page, changes will not be saved.";
            return;
        }

    }
});


$(document).on("click", '.annselector', function (event) {
    //unselect all annotations first
    for (var i = 0; i < PDFViewerApplication.documentAnnotations.length; i++) {
        var ann = PDFViewerApplication.documentAnnotations[i];
        ann.selected = false;
    }
    var tempAnnotationId = $(this).attr('tempannotationid');
    for (var i = 0; i < PDFViewerApplication.documentAnnotations.length; i++) {
        var ann = PDFViewerApplication.documentAnnotations[i];
        if (tempAnnotationId == ann.tempId) {
            ann.selected = true;
            PDFViewerApplication.pdfViewer.scrollPageIntoView(ann.pageId);
            break;
        }
    }
    for (var pageNumber = 0; pageNumber < PDFViewerApplication.pdfViewer.pagesCount; pageNumber++) {
        var pageView = PDFViewerApplication.pdfViewer.getPageView(pageNumber);
        if (pageView != null && pageView.context != null) {
            PDFViewerApplication.drawDocumentAnnotations(pageView, pageView.context, pageNumber + 1);
        }
    }

});

function getCurrentDate() {
    var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = d.getMonth();
    var curr_year = d.getFullYear();
    var curr_hour = d.getHours();
    var curr_minutes = d.getMinutes();
    var currentDate = curr_date + "-" + m_names[curr_month] + "-" + curr_year + " " + curr_hour + ":" + curr_minutes;
    return currentDate;
}

function log(ann) {
    console.log("X1 : " + ann.x1 + " Y1 : " + ann.y1 + " X2 : " + ann.x2 + " Y2 : " + ann.y2 + " Image Data: " + ann.imageData);
}

$(document).ready(function () {
    pixelRatio = window.devicePixelRatio;
});