const filesInput = document.getElementById("files");
const gallery = document.getElementById("gallery");

const modeSelect = document.getElementById("mode");
const detailSlider = document.getElementById("detail");
const detailValue = document.getElementById("detailValue");

const status = document.getElementById("status");

let images = [];
let processed = [];

filesInput.onchange = loadImages;

detailSlider.oninput = () => {
    detailValue.textContent = detailSlider.value;
};

document.getElementById("process").onclick = processAll;

document.getElementById("downloadAll").onclick = downloadZip;

async function loadImages() {

    images = [];
    processed = [];
    gallery.innerHTML = "";

    const files = [...filesInput.files];

    status.textContent = `Loaded ${files.length} files`;

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
}

function processAll() {

    if (!images.length) {
        status.textContent = "No images loaded";
        return;
    }

    processed = [];
    gallery.innerHTML = "";

    const mode = modeSelect.value;

    status.textContent = "Processing...";

    for (const item of images) {

        const canvas = document.createElement("canvas");
        canvas.width = 90;
        canvas.height = 90;

        const ctx = canvas.getContext("2d");

        if (mode === "silhouette") {
            renderSilhouette(item.img, canvas);
        } else {
            renderSilhouette(item.img, canvas);
            renderPixel(canvas);
        }

        processed.push({
            name: item.name,
            canvas
        });

        const card = document.createElement("div");
        card.className = "card";
        card.appendChild(canvas);

        gallery.appendChild(card);
    }

    status.textContent = `Done (${processed.length})`;
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
    const d = data.data;

    let r = 200, g = 200, b = 200;

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 0) {
            r = d[i];
            g = d[i + 1];
            b = d[i + 2];
            break;
        }
    }

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 0) {
            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
        }
    }

    ctx.putImageData(data, 0, 0);
}

function renderPixel(canvas) {

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

function downloadZip() {

    if (!processed.length) {
        status.textContent = "Nothing to download";
        return;
    }

    const zip = new JSZip();

    for (const item of processed) {

        const base64 = item.canvas
            .toDataURL("image/png")
            .split(",")[1];

        zip.file(
            item.name.replace(".png", "") + ".png",
            base64,
            { base64: true }
        );
    }

    zip.generateAsync({ type: "blob" }).then(blob => {

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "simplified_pngs.zip";
        a.click();

        status.textContent = "Downloaded ZIP";
    });
}
