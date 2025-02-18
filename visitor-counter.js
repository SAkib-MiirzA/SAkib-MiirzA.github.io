try {
    let img = document.createElement("img");
    img.src = "https://hits.sh/sakib-miirza.github.io/SAqib-MUnir.xyz.svg?style=plastic&label=Visitor%20Counter";
    img.alt = "Visitor Counter";
    document.getElementById("visitor-container").appendChild(img);
} catch (error) {
    console.warn("Ad Blocker detected. Visitor counter may not work.");
}
