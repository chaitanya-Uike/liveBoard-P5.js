const socket = io('/')

socket.emit('join-room', roomId)

const canvasContainer = document.querySelector("#canvasContainer")
const canvasBounds = canvasContainer.getBoundingClientRect()

const drawingArea = document.querySelector(".drawing-area")
const drawingCursor = document.querySelector('#drawing-cursor')
let cursorBounds = drawingCursor.getBoundingClientRect()

let paintObject = { path: [] }

let color = 'black'
let strokeWidth = 5

let canvasWidth = canvasBounds.width - 2
let canvasHeight = canvasBounds.height - 2

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer')

    background('white')
}

function mouseDragged() {
    stroke(color)
    strokeWeight(strokeWidth)

    line(mouseX, mouseY, pmouseX, pmouseY)

    paintObject.path.push([mouseX, mouseY])
}

function mouseReleased() {
    paintObject.color = color
    paintObject.strokeWidth = strokeWidth

    socket.emit("send-paint-path", paintObject)

    // clear the paint object
    paintObject.path = []
}

function paintPath(paintObject) {
    const path = paintObject.path

    stroke(paintObject.color)
    strokeWeight(paintObject.strokeWidth)

    for (let i = 0; i < path.length - 1; i++) {
        line(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1])
    }
}


// socket events
socket.on("paint", paintObject => {
    paintPath(paintObject)
})

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


// settings
const colorPicker = document.querySelector("#stroke-color")
const eraser = document.querySelector('#eraser')
const strokeRange = document.querySelector("#stroke-Range")
const clearBtn = document.querySelector("#clear-canvas")


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
