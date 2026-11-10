
"use strict";

/* =========================================
   01. APPLICATION ELEMENTS
========================================= */

const elements = {
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
    previousFocus: null
};

/* =========================================
   03. LOAD JSON DATA
========================================= */

async function loadTrainingData() {
    try {
        const response = await fetch("./data.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(`data.json returned ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.topics)) {
            throw new Error("Invalid data.json structure.");
        }

        appState.topics = data.topics;

        console.log(
            `Loaded ${appState.topics.length} training topics.`
        );

        updateSiteInformation(data);

        return true;

    } catch (error) {
        console.error("Training data error:", error);

        showMapError(
            "Training materials could not be loaded. Check that data.json exists and contains valid JSON."
        );

        return false;
    }
}

/* =========================================
   04. UPDATE SITE INFORMATION
========================================= */

function updateSiteInformation(data) {
    if (!elements.footer) return;

    elements.footer.innerHTML = `
        <span>
            <i class="fa-solid fa-circle-info"></i>
            Each topic contains expandable learning materials.
        </span>
        <span>${data.topics.length} Learning Areas</span>
    `;
}

/* =========================================
   05. FIND TOPIC
========================================= */

function getTopic(topicId) {
    return appState.topics.find(
        topic => topic.id === topicId
    );
}

/* =========================================
   06. OPEN TOPIC MODAL
========================================= */

function openTopicModal(topicId) {
    const topic = getTopic(topicId);

    if (!topic) {
        console.warn("No matching topic found for:", topicId);
        return;
    }

    if (!elements.modal) {
        console.error("Missing HTML element: #topicModal");
        return;
    }

    const requiredElements = [
        "modalTitle",
        "modalCategory",
        "modalDescription",
        "modalPoints",
        "modalSubtopics",
        "closeModal"
    ];

    for (const id of requiredElements) {
        if (!document.getElementById(id)) {
            console.error(`Missing HTML element: #${id}`);
            return;
        }
    }

    appState.previousFocus = document.activeElement;
    appState.activeTopic = topic;

    elements.modalTitle.textContent = topic.title || "Untitled topic";

    elements.modalCategory.textContent =
        [topic.number, topic.category].filter(Boolean).join(" · ");

    elements.modalDescription.textContent =
        topic.description || "No explanation has been added yet.";

    if (elements.modalIcon) {
        elements.modalIcon.innerHTML = `
            <i class="fa-solid ${topic.icon || "fa-book-open"}"></i>
        `;
    }

    renderLearningPoints(topic.keyPoints);
    renderSubtopics(topic.subtopics);

    elements.modal.classList.add("active");
    elements.modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    elements.closeModal.focus();

    console.log("Opened topic:", topic.title);
}

/* =========================================
   07. RENDER LEARNING POINTS
========================================= */

function renderLearningPoints(points = []) {
    if (!elements.modalPoints) return;

    elements.modalPoints.innerHTML = "";

    if (!Array.isArray(points) || points.length === 0) {
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
   08. RENDER SUBTOPICS
========================================= */

function renderSubtopics(subtopics = []) {
    if (!elements.modalSubtopics) return;

    elements.modalSubtopics.innerHTML = "";

    if (!Array.isArray(subtopics) || subtopics.length === 0) {
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
   09. CLOSE MODAL
========================================= */

function closeTopicModal() {
    if (!elements.modal) return;

    if (!elements.modal.classList.contains("active")) {
        return;
    }

    elements.modal.classList.remove("active");
    elements.modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    appState.activeTopic = null;

    if (
        appState.previousFocus &&
        document.contains(appState.previousFocus)
    ) {
        appState.previousFocus.focus();
    }
}

/* =========================================
   10. TOPIC CLICK HANDLING
========================================= */

function initializeTopicClicks() {
    // Event delegation: works for existing and dynamically
    // generated .mindmap-node elements.

    document.addEventListener("click", event => {
        const node = event.target.closest(".mindmap-node");

        if (!node) return;

        const topicId = node.dataset.topic;

        if (!topicId) {
            console.warn(
                "This topic node has no data-topic attribute:",
                node
            );
            return;
        }

        openTopicModal(topicId);
    });
}

/* =========================================
   11. MODAL CONTROLS
========================================= */

function initializeModalControls() {
    if (!elements.modal) {
        console.error("Cannot initialize modal: #topicModal is missing.");
        return;
    }

    if (elements.closeModal) {
        elements.closeModal.addEventListener(
            "click",
            closeTopicModal
        );
    }

    if (elements.modalDone) {
        elements.modalDone.addEventListener(
            "click",
            closeTopicModal
        );
    }

    elements.modal.addEventListener("click", event => {
        if (event.target === elements.modal) {
            closeTopicModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            elements.modal.classList.contains("active")
        ) {
            closeTopicModal();
        }
    });
}

/* =========================================
   12. DRAW CONNECTING LINES
========================================= */

function drawMindMapConnections() {
    const canvas = elements.canvas;
    const center = elements.center;

    if (!canvas || !center) return;

    const nodes = canvas.querySelectorAll(".mindmap-node");

    const existingSVG = canvas.querySelector(
        ".mindmap-connections"
    );

    if (existingSVG) existingSVG.remove();

    const canvasRect = canvas.getBoundingClientRect();
    const centerRect = center.getBoundingClientRect();

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

    const centerX =
        centerRect.left - canvasRect.left + centerRect.width / 2;

    const centerY =
        centerRect.top - canvasRect.top + centerRect.height / 2;

    nodes.forEach(node => {
        const nodeRect = node.getBoundingClientRect();

        const nodeX =
            nodeRect.left - canvasRect.left + nodeRect.width / 2;

        const nodeY =
            nodeRect.top - canvasRect.top + nodeRect.height / 2;

        const dx = nodeX - centerX;
        const dy = nodeY - centerY;

        const distance = Math.hypot(dx, dy);

        if (!distance) return;

        const unitX = dx / distance;
        const unitY = dy / distance;

        const centerRadius = centerRect.width / 2;
        const nodeRadius = 8;

        const startX = centerX + unitX * centerRadius;
        const startY = centerY + unitY * centerRadius;

        const endX = nodeX - unitX * nodeRadius;
        const endY = nodeY - unitY * nodeRadius;

        const controlX = (startX + endX) / 2 - dy * 0.12;
        const controlY = (startY + endY) / 2 + dx * 0.12;

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        path.setAttribute(
            "d",
            `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
        );

        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(49, 91, 112, 0.38)");
        path.setAttribute("stroke-width", "1.8");
        path.setAttribute("stroke-linecap", "round");

        svg.appendChild(path);
    });

    canvas.prepend(svg);
}

/* =========================================
   13. DISPLAY ERROR
========================================= */

function showMapError(message) {
    if (!elements.canvas) {
        console.error(message);
        return;
    }

    const errorBox = document.createElement("div");

    errorBox.className = "map-error";
    errorBox.textContent = message;

    elements.canvas.appendChild(errorBox);
}

/* =========================================
   14. INITIALIZE APPLICATION
========================================= */

async function initializeApp() {
    console.log("Initializing Care & Knowledge...");

    initializeTopicClicks();
    initializeModalControls();

    const loaded = await loadTrainingData();

    if (!loaded) return;

    requestAnimationFrame(() => {
        drawMindMapConnections();
    });

    console.log("Care & Knowledge initialized successfully.");
}

/* =========================================
   15. RESIZE CONNECTIONS
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

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}
