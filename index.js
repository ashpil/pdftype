"use strict";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.worker.min.js";

const container = document.getElementById("viewer-wrapper");

const eventBus = new pdfjsViewer.EventBus();

const pdfViewer = new pdfjsViewer.PDFViewer({ container, eventBus });

eventBus.on("pagesinit", () => {
    console.log("init done!");
    pdfViewer.currentScaleValue = 1.2;
});

const allLines = [];
let currentCharIdx = 0;
let currentLineIdx = 0;
let needSpace = false;
let blocked = false;

eventBus.on("textlayerrendered", e => {
    for (const div of e.source.textLayer.textDivs) {
        const spans = [];
        for (const char of div.innerText) {
            const span = document.createElement("span");
            span.classList = "pdftype-highlightable";
            span.innerText = char;
            spans.push(span);
        }
        div.replaceChildren(...spans);
        const divIdx = allLines.length;
        div.addEventListener("mouseup", () => {
            needSpace = false;
            currentLineIdx = divIdx;
            currentCharIdx = 0;
        });
        allLines.push(div);
    }
});

document.addEventListener("keydown", e => {
    if (e.key == "Backspace") {
        // just annoying
        e.preventDefault();
        return;
    } else if (!e.altKey && !e.ctrlKey && !e.metaKey && e.key.length == 1) {
        e.preventDefault();
        if (blocked) return;
        const currentLine = allLines[currentLineIdx];
        const currentChar = currentLine.children[currentCharIdx];
        if (needSpace) {
            if (e.key == " ") {
                needSpace = false;
            }
        } else if (currentChar.innerText == e.key || e.key == "\\") {
            currentChar.classList.add("pdftype-correct");
            currentCharIdx += 1;
            if (currentCharIdx == currentLine.children.length - 1) {
                const nextChar = currentLine.children[currentCharIdx];
                if (nextChar.innerText == "-") {
                    nextChar.classList.add("pdftype-correct");
                    currentLineIdx += 1;
                    currentCharIdx = 0;
                }
            } else if (currentLine.children.length == currentCharIdx) {
                currentLineIdx += 1;
                currentCharIdx = 0;
                const nextLine = allLines[currentLineIdx];
                const nextChar = nextLine.children[currentCharIdx];
                if (nextChar.innerText != " " && currentChar.innerText != " ") {
                    needSpace = true;
                }
            }
        } else {
            currentChar.classList.add("pdftype-wrong");
            blocked = true;
            setTimeout(() => {
                currentChar.classList.remove("pdftype-wrong");
                blocked = false;
            }, 1000)
        }
    }
});

// Loading document.
const loadingTask = pdfjsLib.getDocument({
  url: "/halide.pdf",
}).promise.then(pdfDocument => {
    pdfViewer.setDocument(pdfDocument);
});

