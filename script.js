const filesInput = document.getElementById("files");
const gallery = document.getElementById("gallery");
const pixelSlider = document.getElementById("pixel");

let images = [];

filesInput.addEventListener("change", loadImages);
pixelSlider.addEventListener("input", rerender);

function loadImages() {

    images = [];

    gallery.innerHTML = "";

    for (const file of filesInput.files) {

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.src = url;

        img.onload = () => {

            images.push({
                name: file.name,
                img
            });

            rerender();
        };
    }
}

function rerender() {

    gallery.innerHTML = "";

    for (const item of images) {

        const card = document.createElement("div");
        card.className = "card";

        const canvas = document.createElement("canvas");
        canvas.width = 180;
        canvas.height = 180;

        drawPixelated(item.img, canvas);

        card.appendChild(canvas);
        gallery.appendChild(card);
    }
}

function drawPixelated(img, canvas) {

    const ctx = canvas.getContext("2d");

    const size = parseInt(pixelSlider.value);

    const temp = document.createElement("canvas");
    temp.width = size;
    temp.height = size;

    const tctx = temp.getContext("2d");

    // draw original into tiny canvas
    tctx.drawImage(img, 0, 0, size, size);

    // upscale back to preview canvas
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);
}

/* ZIP export */
document.getElementById("downloadAll").onclick = async () => {

    const zip = new JSZip();

    const canvases = document.querySelectorAll("canvas");

    canvases.forEach((canvas, i) => {

        const base64 = canvas.toDataURL("image/png").split(",")[1];

        zip.file(`image_${i}.png`, base64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pixelated_images.zip";
    a.click();
};
