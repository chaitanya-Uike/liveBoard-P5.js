const socket = io('/')

socket.emit('join-room', roomId)

const canvasContainer = document.querySelector("#canvasContainer")
const canvasBounds = canvasContainer.getBoundingClientRect()

const drawingArea = document.querySelector(".drawing-area")
const drawingCursor = document.querySelector('#drawing-cursor')
let cursorBounds = drawingCursor.getBoundingClientRect()

let undoStack = []
let redoStack = []

let color = 'black'
let strokeWidth = 5

let canvasWidth = canvasBounds.width - 2
let canvasHeight = canvasBounds.height - 2

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer')

    background('white')
    strokeJoin(ROUND);
}

function mouseDragged() {
    stroke(color)
    strokeWeight(strokeWidth)

    line(mouseX, mouseY, pmouseX, pmouseY)

    socket.emit("send-path", { x1: mouseX, y1: mouseY, x2: pmouseX, y2: pmouseY, color, strokeWidth })
}

socket.on("send-state", user => {
    const canvas = document.getElementById("defaultCanvas0")

    socket.emit("send-canvas-state", user, canvas.toDataURL())
})

socket.on("get-canvas-state", data => {
    loadImage(data, img => {
        image(img, 0, 0, canvasWidth, canvasHeight);
    });
})

socket.on('clear-canvas', () => {
    background('white')
})


socket.on("draw", payload => {
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

clearBtn.addEventListener("click", e => {
    background('white')
    socket.emit("trigger-clear-canvas", roomId)
})


drawingArea.addEventListener("mousemove", () => {
    drawingCursor.style.left = (mouseX - cursorBounds.width / 2) + "px"
    drawingCursor.style.top = (mouseY - cursorBounds.height / 2) + "px"
})

document.querySelector("body").addEventListener("mousemove", e => {
    if (e.target && (e.target.matches('#defaultCanvas0') || e.target.matches('#drawing-cursor'))) {
        drawingCursor.style.display = "inline-block"
        cursorBounds = drawingCursor.getBoundingClientRect()
    }
    else
        drawingCursor.style.display = "none"

})

undoBtn.addEventListener("click", () => {
    let prevState = get()
    console.log(prevState);
})
