const gallery = document.getElementById("gallery");
const filesInput = document.getElementById("files");

const colorsSlider = document.getElementById("colors");
const detailSlider = document.getElementById("detail");

const colorsValue = document.getElementById("colorsValue");
const detailValue = document.getElementById("detailValue");

let currentMode = "silhouette";

const images = [];

filesInput.addEventListener("change", loadImages);

colorsSlider.addEventListener("input", () => {
    colorsValue.textContent = colorsSlider.value;
    rerender();
});

detailSlider.addEventListener("input", () => {
    detailValue.textContent = detailSlider.value;
    rerender();
});

document.querySelectorAll(".mode-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        document
            .querySelectorAll(".mode-btn")
            .forEach(x => x.classList.remove("active"));

        btn.classList.add("active");

        currentMode = btn.dataset.mode;

        rerender();
    });

});

async function loadImages() {

    images.length = 0;

    for (const file of filesInput.files) {

        const img = new Image();

        const url = URL.createObjectURL(file);

        await new Promise(resolve => {
            img.onload = resolve;
            img.src = url;
        });

        images.push({
            name: file.name,
            img
        });
    }

    rerender();
}

function rerender() {

    gallery.innerHTML = "";

    images.forEach(item => {

        const card = document.createElement("div");
        card.className = "card";

        const title = document.createElement("div");
        title.className = "card-title";
        title.textContent = item.name;

        const preview = document.createElement("div");
        preview.className = "preview";

        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 160;

        preview.appendChild(canvas);

        if (currentMode === "silhouette") {
            renderSilhouette(item.img, canvas);
        } else {
            renderPixel(item.img, canvas);
        }

        const downloadBtn =
            document.createElement("button");

        downloadBtn.className =
            "download-btn";

        downloadBtn.textContent =
            "Download PNG";

        downloadBtn.onclick = () => {

            const a =
                document.createElement("a");

            a.href =
                canvas.toDataURL("image/png");

            a.download =
                item.name.replace(".png", "") +
                "_" +
                currentMode +
                ".png";

            a.click();
        };

        card.appendChild(title);
        card.appendChild(preview);
        card.appendChild(downloadBtn);

        gallery.appendChild(card);

    });
}

function getDominantColor(data) {

    const map = new Map();

    for (let i = 0; i < data.length; i += 4) {

        const a = data[i + 3];

        if (a < 20) continue;

        const r =
            Math.round(data[i] / 32) * 32;

        const g =
            Math.round(data[i + 1] / 32) * 32;

        const b =
            Math.round(data[i + 2] / 32) * 32;

        const key = `${r},${g},${b}`;

        map.set(
            key,
            (map.get(key) || 0) + 1
        );
    }

    let best = null;
    let count = 0;

    for (const [key, value] of map) {

        if (value > count) {
            count = value;
            best = key;
        }
    }

    if (!best)
        return [255,255,255];

    return best.split(",").map(Number);
}

function renderSilhouette(img, canvas) {

    const ctx =
        canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
    );

    const w = img.width * scale;
    const h = img.height * scale;

    const x =
        (canvas.width - w) / 2;

    const y =
        (canvas.height - h) / 2;

    ctx.drawImage(
        img,
        x,
        y,
        w,
        h
    );

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    const data = imageData.data;

    const [r,g,b] =
        getDominantColor(data);

    for(let i = 0; i < data.length; i += 4){

        if(data[i + 3] > 0){

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }

    ctx.putImageData(
        imageData,
        0,
        0
    );
}

function renderPixel(img, canvas) {

    renderSilhouette(img, canvas);

    const ctx =
        canvas.getContext("2d");

    const size =
        Number(detailSlider.value);

    const temp =
        document.createElement("canvas");

    temp.width = size;
    temp.height = size;

    const tctx =
        temp.getContext("2d");

    tctx.drawImage(
        canvas,
        0,
        0,
        size,
        size
    );

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.imageSmoothingEnabled =
        false;

    ctx.drawImage(
        temp,
        0,
        0,
        canvas.width,
        canvas.height
    );
}

document
.getElementById("downloadAll")
.addEventListener("click", async () => {

    const zip = new JSZip();

    const cards =
        document.querySelectorAll(".card");

    cards.forEach(card => {

        const name =
            card.querySelector(".card-title")
                .textContent;

        const canvas =
            card.querySelector("canvas");

        const base64 =
            canvas
                .toDataURL("image/png")
                .split(",")[1];

        zip.file(
            name.replace(".png","") +
            "_" +
            currentMode +
            ".png",
            base64,
            { base64:true }
        );
    });

    const blob =
        await zip.generateAsync({
            type:"blob"
        });

    const a =
        document.createElement("a");

    a.href =
        URL.createObjectURL(blob);

    a.download =
        currentMode +
        "_images.zip";

    a.click();
});
