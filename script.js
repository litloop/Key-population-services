
"use strict";

/* =========================================
   01. SELECT HTML ELEMENTS
========================================= */

const elements = {
    topicNodes: document.querySelectorAll(".mindmap-node"),

    modal: document.getElementById("topicModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalCategory: document.getElementById("modalCategory"),
    modalDescription: document.getElementById("modalDescription"),
    modalIcon: document.getElementById("modalIcon"),

    modalPoints: document.getElementById("modalPoints"),
    modalSubtopics: document.getElementById("modalSubtopics"),

    closeModal: document.getElementById("closeModal"),
    modalDone: document.getElementById("modalDone"),

    canvas: document.querySelector(".mindmap-canvas"),
    center: document.querySelector(".mindmap-center"),

    footer: document.querySelector(".map-footer")
};


/* =========================================
   02. APPLICATION STATE
========================================= */

const appState = {
    topics: [],
    activeTopic: null,
    previousFocus: null,
    loading: false
};


/* =========================================
   03. LOAD JSON DATA
========================================= */

async function loadTrainingData() {

    appState.loading = true;

    try {

        const response = await fetch("./data.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(
                `Unable to load data.json: ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data.topics)) {
            throw new Error("Invalid training data structure.");
        }

        appState.topics = data.topics;

        console.log(
            `Successfully loaded ${appState.topics.length} training topics.`
        );

        updateSiteInformation(data);

        return true;

    } catch (error) {

        console.error("Training data error:", error);

        showMapError(
            "We couldn't load the training materials. Please check that data.json is available."
        );

        return false;

    } finally {

        appState.loading = false;

    }

}


/* =========================================
   04. UPDATE WEBSITE INFORMATION
========================================= */

function updateSiteInformation(data) {

    const total = data.topics.length;

    if (elements.footer) {

        elements.footer.innerHTML = `
            <span>
                <i class="fa-solid fa-circle-info"></i>
                Each topic contains expandable learning materials.
            </span>

            <span>${total} Learning Areas</span>
        `;

    }

}


/* =========================================
   05. FIND TOPIC BY ID
========================================= */

function getTopic(topicId) {

    return appState.topics.find(
        topic => topic.id === topicId
    );

}


/* =========================================
   06. OPEN EXPLANATION MODAL
========================================= */

function openTopicModal(topicId) {

    const topic = getTopic(topicId);

    if (!topic) {

        console.warn(
            `Topic not found: ${topicId}`
        );

        return;

    }

    appState.previousFocus = document.activeElement;
    appState.activeTopic = topic;

    // Update modal heading

    elements.modalTitle.textContent = topic.title;

    elements.modalCategory.textContent =
        `${topic.number} · ${topic.category}`;

    // Update explanation

    elements.modalDescription.textContent =
        topic.description;

    // Update icon

    elements.modalIcon.innerHTML = `
        <i class="fa-solid ${topic.icon || "fa-book-open"}"></i>
    `;

    // Render learning points

    renderLearningPoints(topic.keyPoints);

    // Render related subtopics

    renderSubtopics(topic.subtopics);

    // Display modal

    elements.modal.classList.add("active");

    elements.modal.setAttribute(
        "aria-hidden",
        "false"
    );

    // Prevent background scrolling

    document.body.style.overflow = "hidden";

    // Focus close button for accessibility

    elements.closeModal.focus();

}


/* =========================================
   07. RENDER LEARNING POINTS
========================================= */

function renderLearningPoints(points = []) {

    elements.modalPoints.innerHTML = "";

    if (!points.length) {

        elements.modalPoints.textContent =
            "Learning points will be added soon.";

        return;

    }

    const fragment = document.createDocumentFragment();

    points.forEach(point => {

        const item = document.createElement("div");

        item.className = "learning-point";

        const icon = document.createElement("i");

        icon.className = "fa-solid fa-check";

        const text = document.createElement("span");

        text.textContent = point;

        item.append(icon, text);

        fragment.appendChild(item);

    });

    elements.modalPoints.appendChild(fragment);

}


/* =========================================
   08. RENDER RELATED SUBTOPICS
========================================= */

function renderSubtopics(subtopics = []) {

    elements.modalSubtopics.innerHTML = "";

    if (!subtopics.length) {

        elements.modalSubtopics.textContent =
            "Related topics will be added soon.";

        return;

    }

    const fragment = document.createDocumentFragment();

    subtopics.forEach(subtopic => {

        const tag = document.createElement("span");

        tag.className = "subtopic-tag";

        tag.textContent = subtopic;

        fragment.appendChild(tag);

    });

    elements.modalSubtopics.appendChild(fragment);

}


/* =========================================
   09. CLOSE EXPLANATION MODAL
========================================= */

function closeTopicModal() {

    if (!elements.modal.classList.contains("active")) {
        return;
    }

    elements.modal.classList.remove("active");

    elements.modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

    appState.activeTopic = null;

    // Restore keyboard focus

    if (
        appState.previousFocus &&
        document.contains(appState.previousFocus)
    ) {

        appState.previousFocus.focus();

    }

}


/* =========================================
   10. CLICK ON MIND MAP TOPICS
========================================= */

function initializeTopicClicks() {

    elements.topicNodes.forEach(node => {

        node.addEventListener("click", () => {

            const topicId = node.dataset.topic;

            openTopicModal(topicId);

        });

    });

}


/* =========================================
   11. MODAL INTERACTIONS
========================================= */

function initializeModalControls() {

    // Close button

    elements.closeModal.addEventListener(
        "click",
        closeTopicModal
    );

    // Done button

    elements.modalDone.addEventListener(
        "click",
        closeTopicModal
    );

    // Close when clicking outside modal content

    elements.modal.addEventListener(
        "click",
        event => {

            if (event.target === elements.modal) {

                closeTopicModal();

            }

        }
    );

    // Escape key

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                elements.modal.classList.contains("active")
            ) {

                closeTopicModal();

            }

        }
    );

}


/* =========================================
   12. DRAW SVG CONNECTING LINES
========================================= */

function drawMindMapConnections() {

    const canvas = elements.canvas;

    const center = elements.center;

    if (!canvas || !center) {
        return;
    }

    // Remove previous SVG layer

    const existingSVG = canvas.querySelector(
        ".mindmap-connections"
    );

    if (existingSVG) {
        existingSVG.remove();
    }

    // Create SVG layer

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.classList.add("mindmap-connections");

    svg.setAttribute("width", canvas.offsetWidth);
    svg.setAttribute("height", canvas.offsetHeight);

    svg.setAttribute(
        "viewBox",
        `0 0 ${canvas.offsetWidth} ${canvas.offsetHeight}`
    );

    svg.setAttribute("aria-hidden", "true");

    Object.assign(svg.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: "2"
    });

    const canvasRect = canvas.getBoundingClientRect();

    const centerRect = center.getBoundingClientRect();

    // Calculate central hub coordinates

    const centerX =
        centerRect.left -
        canvasRect.left +
        centerRect.width / 2;

    const centerY =
        centerRect.top -
        canvasRect.top +
        centerRect.height / 2;

    // Draw one connector for each topic

    elements.topicNodes.forEach(node => {

        const nodeRect = node.getBoundingClientRect();

        const nodeX =
            nodeRect.left -
            canvasRect.left +
            nodeRect.width / 2;

        const nodeY =
            nodeRect.top -
            canvasRect.top +
            nodeRect.height / 2;

        // Determine where line meets node

        const dx = nodeX - centerX;

        const dy = nodeY - centerY;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (!distance) return;

        const unitX = dx / distance;
        const unitY = dy / distance;

        const centerRadius = centerRect.width / 2;

        const nodeRadius = 8;

        const startX =
            centerX + unitX * centerRadius;

        const startY =
            centerY + unitY * centerRadius;

        const endX =
            nodeX - unitX * nodeRadius;

        const endY =
            nodeY - unitY * nodeRadius;

        // Create connector path

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        const curveOffset = 0.12;

        const controlX =
            (startX + endX) / 2 -
            dy * curveOffset;

        const controlY =
            (startY + endY) / 2 +
            dx * curveOffset;

        path.setAttribute(
            "d",
            `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
        );

        path.setAttribute(
            "fill",
            "none"
        );

        path.setAttribute(
            "stroke",
            "rgba(49, 91, 112, 0.38)"
        );

        path.setAttribute(
            "stroke-width",
            "1.8"
        );

        path.setAttribute(
            "stroke-linecap",
            "round"
        );

        svg.appendChild(path);

    });

    // Insert lines behind the nodes

    canvas.prepend(svg);

}


/* =========================================
   13. MAP ERROR MESSAGE
========================================= */

function showMapError(message) {

    const errorBox = document.createElement("div");

    errorBox.className = "map-error";

    errorBox.textContent = message;

    errorBox.style.cssText = `
        padding: 20px;
        margin: 20px;
        background: #FCEEEE;
        color: #8D3030;
        border-radius: 12px;
        text-align: center;
        font-size: 13px;
    `;

    if (elements.canvas) {

        elements.canvas.appendChild(errorBox);

    }

}


/* =========================================
   14. INITIALIZE APPLICATION
========================================= */

async function initializeApp() {

    initializeTopicClicks();

    initializeModalControls();

    const loaded = await loadTrainingData();

    if (!loaded) {
        return;
    }

    // Wait for layout calculations

    requestAnimationFrame(() => {

        drawMindMapConnections();

    });

    console.log(
        "Care & Knowledge Training Hub initialized."
    );

}


/* =========================================
   15. RESPONSIVE CONNECTION UPDATES
========================================= */

let resizeFrame = null;

window.addEventListener("resize", () => {

    cancelAnimationFrame(resizeFrame);

    resizeFrame = requestAnimationFrame(() => {

        drawMindMapConnections();

    });

});


/* =========================================
   16. START APPLICATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
