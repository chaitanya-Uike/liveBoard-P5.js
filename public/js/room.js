const socket = io('/')

socket.emit('join-room', roomId)

const canvasContainer = document.querySelector("#canvasContainer")
const canvasBounds = canvasContainer.getBoundingClientRect()

const drawingCursor = document.querySelector('#drawing-cursor')
let cursorBounds = drawingCursor.getBoundingClientRect()

let undoStack = []
let redoStack = []

let color = 'black'
let strokeWidth = 5

let canvasWidth = canvasBounds.width - 2
let canvasHeight = canvasBounds.height - 2

let ctx

let isDrawing = false

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer')

    background('white')
    strokeJoin(ROUND);

    ctx = document.getElementById("defaultCanvas0")

    saveState(ctx.toDataURL())
}

function mouseDragged() {
    if (!isDrawing)
        return

    stroke(color)
    strokeWeight(strokeWidth)

    line(mouseX, mouseY, pmouseX, pmouseY)

    socket.emit("send-path", { x1: mouseX, y1: mouseY, x2: pmouseX, y2: pmouseY, color, strokeWidth })
}

function mouseReleased() {
    if (!isDrawing)
        return

    socket.emit("send-path", { "drawingEnd": true })
    saveState(ctx.toDataURL())
}

function saveState(state) {
    if (undoStack.length == 10)
        undoStack.shift()

    undoStack.push(state)
}

socket.on("send-state", user => {
    socket.emit("send-canvas-state", user, ctx.toDataURL(), undoStack, redoStack)
})

socket.on("get-canvas-state", (data, undoData, redoData) => {
    loadImage(data, img => {
        image(img, 0, 0, canvasWidth, canvasHeight);
    });

    undoStack = [...undoData]
    redoStack = [...redoData]
})

socket.on('clear-canvas', () => {
    saveState(ctx.toDataURL())
    background('white')
})


socket.on("draw", payload => {
    if (payload.drawingEnd) {
        saveState(ctx.toDataURL())
        return
    }

    stroke(payload.color)
    strokeWeight(payload.strokeWidth)

    line(payload.x1, payload.y1, payload.x2, payload.y2)
})


// settings
const colorPicker = document.querySelector("#stroke-color")
const eraser = document.querySelector('#eraser')
const strokeRange = document.querySelector("#stroke-Range")
const clearBtn = document.querySelector("#clear-canvas")
const undoBtn = document.querySelector("#undoBtn")
const redoBtn = document.querySelector("#redoBtn")

colorPicker.addEventListener('change', e => {
    color = e.target.value
})

colorPicker.addEventListener('click', e => {
    color = e.target.value
})

eraser.addEventListener('click', () => {
    color = 'white'
})

strokeRange.addEventListener("change", e => {
    strokeWidth = e.target.value

    drawingCursor.style.width = e.target.value + "px"
    drawingCursor.style.height = e.target.value + "px"

    cursorBounds = drawingCursor.getBoundingClientRect()
})

clearBtn.addEventListener("click", () => {
    saveState(ctx.toDataURL())
    background('white')
    socket.emit("trigger-clear-canvas", roomId)
})


canvasContainer.addEventListener("mousemove", () => {
    drawingCursor.style.left = (mouseX - cursorBounds.width / 2) + "px"
    drawingCursor.style.top = (mouseY - cursorBounds.height / 2) + "px"
})

document.querySelector("body").addEventListener("mousemove", e => {
    if (e.target && (e.target.matches('#defaultCanvas0') || e.target.matches('#drawing-cursor'))) {
        drawingCursor.style.display = "inline-block"
        cursorBounds = drawingCursor.getBoundingClientRect()
        isDrawing = true
    }
    else {
        drawingCursor.style.display = "none"
        isDrawing = false
    }
})

undoBtn.addEventListener("click", () => {
    undo()
    socket.emit("undo-triggered")
})


redoBtn.addEventListener("click", () => {
    redo()
    socket.emit("redo-triggered")
})

socket.on("undo", () => {
    undo()
})

socket.on("redo", () => {
    redo()
})


function undo() {
    if (undoStack.length == 1)
        return

    updateRedoStack(undoStack.pop())

    loadImage(undoStack[undoStack.length - 1], img => {
        image(img, 0, 0, canvasWidth, canvasHeight);
    });
}

function redo() {
    if (redoStack.length == 0)
        return

    const data = redoStack.pop()

    loadImage(data, img => {
        image(img, 0, 0, canvasWidth, canvasHeight);
    });

    saveState(data)
}

function updateRedoStack(state) {
    if (redoStack.length == 10)
        redoStack.shift()

    redoStack.push(state)
}
