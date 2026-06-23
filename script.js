const filesInput = document.getElementById("files");
const gallery = document.getElementById("gallery");

const modeSelect = document.getElementById("mode");

const detailSlider = document.getElementById("detail");
const detailValue = document.getElementById("detailValue");

const status = document.getElementById("status");

let images = [];

filesInput.addEventListener("change", loadImages);

modeSelect.addEventListener("change", rerender);

detailSlider.addEventListener("input", () => {

    detailValue.textContent = detailSlider.value;

    rerender();
});

function setStatus(text) {
    status.textContent = text;
}

async function loadImages() {

    images = [];

    const files = [...filesInput.files];

    if (!files.length) {
        setStatus("No files selected");
        return;
    }

    setStatus("Loading...");

    for (const file of files) {

        const img = new Image();

        const url = URL.createObjectURL(file);

        await new Promise(res => {
            img.onload = res;
            img.src = url;
        });

        images.push({
            name: file.name,
            img
        });
    }

    setStatus(`Loaded ${images.length} files`);

    rerender();
}

function rerender() {

    gallery.innerHTML = "";

    const mode = modeSelect.value;

    for (const item of images) {

        const card = document.createElement("div");
        card.className = "card";

        const preview = document.createElement("div");
        preview.className = "preview";

        const canvas = document.createElement("canvas");
        canvas.width = 90;
        canvas.height = 90;

        preview.appendChild(canvas);
        card.appendChild(preview);

        gallery.appendChild(card);

        if (mode === "silhouette") {
            renderSilhouette(item.img, canvas);
        } else {
            renderPixel(item.img, canvas);
        }
    }
}

/* -------- SILHOUETTE -------- */

function getDominantColor(data) {

    const map = new Map();

    for (let i = 0; i < data.length; i += 4) {

        if (data[i + 3] < 20) continue;

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

    ctx.clearRect(0, 0, 90, 90);

    const scale = Math.min(
        90 / img.width,
        90 / img.height
    );

    const w = img.width * scale;
    const h = img.height * scale;

    const x = (90 - w) / 2;
    const y = (90 - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    const data = ctx.getImageData(0, 0, 90, 90);

    const [r, g, b] = getDominantColor(data.data);

    for (let i = 0; i < data.data.length; i += 4) {

        if (data.data[i + 3] > 0) {
            data.data[i] = r;
            data.data[i + 1] = g;
            data.data[i + 2] = b;
        }
    }

    ctx.putImageData(data, 0, 0);
}

/* -------- PIXELATE -------- */

function renderPixel(img, canvas) {

    renderSilhouette(img, canvas);

    const size = Number(detailSlider.value);

    const temp = document.createElement("canvas");

    temp.width = size;
    temp.height = size;

    const tctx = temp.getContext("2d");

    tctx.drawImage(canvas, 0, 0, size, size);

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 90, 90);

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(temp, 0, 0, 90, 90);
}

/* -------- ZIP -------- */

document.getElementById("downloadAll").addEventListener("click", async () => {

    if (!images.length) {
        setStatus("No images");
        return;
    }

    setStatus("Creating ZIP...");

    const zip = new JSZip();

    const mode = modeSelect.value;

    const cards = document.querySelectorAll(".card");

    cards.forEach((card, i) => {

        const canvas = card.querySelector("canvas");

        const name = images[i].name.replace(".png", "");

        const base64 = canvas.toDataURL("image/png").split(",")[1];

        zip.file(`${name}_${mode}.png`, base64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "output.zip";
    a.click();

    setStatus("Done");
});
