const filesInput = document.getElementById("files");
const gallery = document.getElementById("gallery");

const colorsSlider = document.getElementById("colors");
const detailSlider = document.getElementById("detail");

const colorsValue = document.getElementById("colorsValue");
const detailValue = document.getElementById("detailValue");

const originalImages = [];

filesInput.addEventListener("change", loadImages);

colorsSlider.addEventListener("input", rerender);
detailSlider.addEventListener("input", rerender);

colorsSlider.addEventListener("input", () => {
    colorsValue.textContent = colorsSlider.value;
});

detailSlider.addEventListener("input", () => {
    detailValue.textContent = detailSlider.value;
});

async function loadImages() {

    gallery.innerHTML = "";
    originalImages.length = 0;

    const files = [...filesInput.files];

    for (const file of files) {

        const url = URL.createObjectURL(file);

        const img = new Image();

        await new Promise(resolve => {
            img.onload = resolve;
            img.src = url;
        });

        originalImages.push({
            name: file.name,
            img
        });
    }

    rerender();
}

function rerender() {

    gallery.innerHTML = "";

    originalImages.forEach(item => {

        const card = document.createElement("div");
        card.className = "card";

        const title = document.createElement("h3");
        title.textContent = item.name;

        const preview = document.createElement("div");
        preview.className = "preview";

        const canvas = document.createElement("canvas");

        processImage(item.img, canvas);

        const button = document.createElement("button");
        button.textContent = "Download PNG";

        button.onclick = () => {
            downloadCanvas(canvas, item.name);
        };

        preview.appendChild(canvas);

        card.appendChild(title);
        card.appendChild(preview);
        card.appendChild(button);

        gallery.appendChild(card);
    });
}

function processImage(img, canvas) {

    const size = Number(detailSlider.value);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,size,size);

    const scale = Math.min(
        size / img.width,
        size / img.height
    );

    const w = img.width * scale;
    const h = img.height * scale;

    const x = (size - w) / 2;
    const y = (size - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const data = imageData.data;

    const levels = Number(colorsSlider.value);

    const step = 255 / Math.max(levels - 1, 1);

    for(let i = 0; i < data.length; i += 4){

        if(data[i + 3] === 0){
            continue;
        }

        data[i] =
            Math.round(data[i] / step) * step;

        data[i + 1] =
            Math.round(data[i + 1] / step) * step;

        data[i + 2] =
            Math.round(data[i + 2] / step) * step;
    }

    ctx.putImageData(imageData,0,0);

    const finalCanvas = document.createElement("canvas");

    finalCanvas.width = 200;
    finalCanvas.height = 200;

    const fctx = finalCanvas.getContext("2d");

    fctx.imageSmoothingEnabled = false;

    fctx.drawImage(
        canvas,
        0,
        0,
        200,
        200
    );

    canvas.width = 200;
    canvas.height = 200;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(finalCanvas,0,0);
}

function downloadCanvas(canvas, filename){

    const link = document.createElement("a");

    link.href = canvas.toDataURL("image/png");

    link.download =
        filename.replace(".png","") +
        "_simplified.png";

    link.click();
}

document
.getElementById("downloadAll")
.addEventListener("click", async () => {

    const zip = new JSZip();

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        const name =
            card.querySelector("h3").textContent;

        const canvas =
            card.querySelector("canvas");

        const png =
            canvas.toDataURL("image/png")
            .split(",")[1];

        zip.file(
            name.replace(".png","") +
            "_simplified.png",
            png,
            { base64:true }
        );
    });

    const blob =
        await zip.generateAsync({
            type:"blob"
        });

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "simplified_pngs.zip";

    link.click();
});
