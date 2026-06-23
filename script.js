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

/* =========================
   SILHOUETTE CORE
========================= */

function getDominantColor(data) {

    const map = new Map();

    for (let i = 0; i < data.length; i += 4) {

        const a = data[i + 3];
        if (a < 10) continue;

        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;

        const key = `${r},${g},${b}`;

        map.set(key, (map.get(key) || 0) + 1);
    }

    let best = null;
    let bestCount = 0;

    for (const [k, v] of map) {
        if (v > bestCount) {
            best = k;
            bestCount = v;
        }
    }

    if (!best) return [255, 255, 255];

    return best.split(",").map(Number);
}

function renderSilhouette(img, canvas) {

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
    );

    const w = img.width * scale;
    const h = img.height * scale;

    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    const imageData = ctx.getImageData(
        0, 0,
        canvas.width,
        canvas.height
    );

    const data = imageData.data;

    const [r, g, b] = getDominantColor(data);

    for (let i = 0; i < data.length; i += 4) {

        if (data[i + 3] > 0) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/* =========================
   PIXELATION ON TOP
========================= */

function applyPixelation(canvas) {

    const size = parseInt(pixelSlider.value);

    const temp = document.createElement("canvas");
    temp.width = size;
    temp.height = size;

    const tctx = temp.getContext("2d");

    tctx.drawImage(canvas, 0, 0, size, size);

    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);
}

/* =========================
   MAIN RENDER
========================= */

function rerender() {

    gallery.innerHTML = "";

    for (const item of images) {

        const card = document.createElement("div");

        const canvas = document.createElement("canvas");
        canvas.width = 180;
        canvas.height = 180;

        // STEP 1: silhouette
        renderSilhouette(item.img, canvas);

        // STEP 2: pixel on top
        applyPixelation(canvas);

        card.appendChild(canvas);
        gallery.appendChild(card);
    }
}

/* =========================
   ZIP EXPORT
========================= */

document.getElementById("downloadAll").onclick = async () => {

    const zip = new JSZip();

    const canvases = document.querySelectorAll("canvas");

    canvases.forEach((canvas, i) => {

        const base64 =
            canvas.toDataURL("image/png").split(",")[1];

        zip.file(
            `image_${i}.png`,
            base64,
            { base64: true }
        );
    });

    const blob = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "silhouette_pixelated.zip";
    a.click();
};
