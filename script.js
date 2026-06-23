let currentSVG = "";

const fileInput = document.getElementById("file");
const detailSlider = document.getElementById("detail");
const result = document.getElementById("result");

fileInput.addEventListener("change", processImage);
detailSlider.addEventListener("input", processImage);

function processImage() {
    const file = fileInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        document.getElementById("original").src = e.target.result;

        ImageTracer.imageToSVG(
            e.target.result,
            (svg) => {
                currentSVG = svg;
                result.innerHTML = svg;
            },
            {
                numberofcolors: Number(detailSlider.value),
                pathomit: 30,
                ltres: 8,
                qtres: 8
            }
        );
    };

    reader.readAsDataURL(file);
}

document.getElementById("download").addEventListener("click", () => {
    if (!currentSVG) return;

    const blob = new Blob([currentSVG], {
        type: "image/svg+xml"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "vector-art.svg";
    a.click();

    URL.revokeObjectURL(url);
});
