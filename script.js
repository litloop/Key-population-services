
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    canvas: document.querySelector(".mindmap-canvas"),
    center: document.querySelector(".mindmap-center"),

    topicModal: document.getElementById("topicModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalCategory: document.getElementById("modalCategory"),
    modalDescription: document.getElementById("modalDescription"),
    modalIcon: document.getElementById("modalIcon"),
    modalPoints: document.getElementById("modalPoints"),
    modalSubtopics: document.getElementById("modalSubtopics"),

    closeModal: document.getElementById("closeModal"),
    modalDone: document.getElementById("modalDone")
  };

  let topics = [];
  let connectorSvg = null;

  // ---------------------------------------
  // LOAD TRAINING DATA
  // ---------------------------------------

  async function loadTrainingData() {
    try {
      const response = await fetch("./data.json");

      if (!response.ok) {
        throw new Error("Unable to load data.json");
      }

      const data = await response.json();

      if (!data.site || !Array.isArray(data.topics)) {
        throw new Error("The training data structure is invalid.");
      }

      topics = data.topics;

      updateSiteInformation(data.site);
      createTopicNodes();
      drawMindMapConnections();

    } catch (error) {
      console.error("Training data error:", error);
      showMapError(
        "The training topics could not be loaded. Please check data.json."
      );
    }
  }

  // ---------------------------------------
  // UPDATE WEBSITE INFORMATION
  // ---------------------------------------

  function updateSiteInformation(site) {
    const title = document.querySelector(".site-title");
    const subtitle = document.querySelector(".site-subtitle");
    const centralTheme = document.querySelector(".center-theme");

    if (title) title.textContent = site.title;
    if (subtitle) subtitle.textContent = site.subtitle;

    if (centralTheme) {
      centralTheme.textContent = site.centralTheme;
    }

    document.title = `${site.title} | ${site.subtitle}`;
  }

  // ---------------------------------------
  // CREATE THE TEN TOPIC BRANCHES
  // ---------------------------------------

  function createTopicNodes() {
    if (!elements.canvas) {
      throw new Error("Mind map canvas was not found.");
    }

    // Remove previously generated topic nodes.
    elements.canvas
      .querySelectorAll(".topic-node")
      .forEach(node => node.remove());

    topics.forEach(topic => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = `topic-node node-${topic.number}`;
      button.dataset.topic = topic.id;

      button.setAttribute(
        "aria-label",
        `Open topic ${topic.number}: ${topic.title}`
      );

      const icon = document.createElement("i");
      icon.className = `fa-solid ${topic.icon}`;
      icon.setAttribute("aria-hidden", "true");

      const content = document.createElement("span");
      content.className = "topic-node-content";

      const number = document.createElement("span");
      number.className = "topic-node-number";
      number.textContent = topic.number;

      const title = document.createElement("span");
      title.className = "topic-node-title";
      title.textContent = topic.title;

      const category = document.createElement("span");
      category.className = "topic-node-category";
      category.textContent = topic.category;

      content.append(number, title, category);
      button.append(icon, content);

      button.addEventListener("click", () => {
        openTopic(topic.id);
      });

      elements.canvas.appendChild(button);
    });
  }

  // ---------------------------------------
  // DRAW CONNECTING LINES
  // ---------------------------------------

  function drawMindMapConnections() {
    if (!elements.canvas || !elements.center) return;

    const canvas = elements.canvas;

    if (connectorSvg) {
      connectorSvg.remove();
    }

    const svgNS = "http://www.w3.org/2000/svg";

    connectorSvg = document.createElementNS(svgNS, "svg");

    connectorSvg.classList.add("mindmap-connectors");

    connectorSvg.setAttribute("aria-hidden", "true");

    connectorSvg.style.position = "absolute";
    connectorSvg.style.top = "0";
    connectorSvg.style.left = "0";
    connectorSvg.style.width = "100%";
    connectorSvg.style.height = "100%";
    connectorSvg.style.pointerEvents = "none";
    connectorSvg.style.zIndex = "2";
    connectorSvg.style.overflow = "visible";

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    connectorSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    connectorSvg.setAttribute("preserveAspectRatio", "none");

    canvas.prepend(connectorSvg);

    const canvasRect = canvas.getBoundingClientRect();

    // Convert screen coordinates into canvas coordinates.
    // This also accounts for CSS scaling on mobile.
    const scaleX = width / canvasRect.width;
    const scaleY = height / canvasRect.height;

    function getCenter(element) {
      const rect = element.getBoundingClientRect();

      return {
        x: (rect.left + rect.width / 2 - canvasRect.left) * scaleX,
        y: (rect.top + rect.height / 2 - canvasRect.top) * scaleY
      };
    }

    const center = getCenter(elements.center);

    topics.forEach(topic => {
      const node = canvas.querySelector(
        `[data-topic="${topic.id}"]`
      );

      if (!node) return;

      const target = getCenter(node);

      const line = document.createElementNS(svgNS, "line");

      line.setAttribute("x1", center.x);
      line.setAttribute("y1", center.y);
      line.setAttribute("x2", target.x);
      line.setAttribute("y2", target.y);

      line.setAttribute("stroke", "#AEB7C0");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-opacity", "0.7");

      connectorSvg.appendChild(line);
    });
  }

  // ---------------------------------------
  // OPEN TOPIC MODAL
  // ---------------------------------------

  function openTopic(topicId) {
    const topic = topics.find(item => item.id === topicId);

    if (!topic || !elements.topicModal) return;

    elements.modalTitle.textContent = topic.title;
    elements.modalCategory.textContent = topic.category;
    elements.modalDescription.textContent = topic.description;

    // Update modal icon safely.
    if (elements.modalIcon) {
      elements.modalIcon.className = "";
      elements.modalIcon.classList.add("modal-icon");

      const icon = document.createElement("i");
      icon.classList.add("fa-solid", ...topic.icon.split(" "));
      icon.setAttribute("aria-hidden", "true");

      elements.modalIcon.replaceChildren(icon);
    }

    // Populate key learning points.
    populateList(elements.modalPoints, topic.keyPoints);

    // Populate subtopics.
    populateList(elements.modalSubtopics, topic.subtopics);

    elements.topicModal.classList.add("active");
    elements.topicModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    if (elements.closeModal) {
      elements.closeModal.focus();
    }
  }

  // ---------------------------------------
  // POPULATE MODAL LISTS
  // ---------------------------------------

  function populateList(container, items) {
    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(items)) return;

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      container.appendChild(li);
    });
  }

  // ---------------------------------------
  // CLOSE MODAL
  // ---------------------------------------

  function closeTopicModal() {
    if (!elements.topicModal) return;

    elements.topicModal.classList.remove("active");
    elements.topicModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
  }

  if (elements.closeModal) {
    elements.closeModal.addEventListener("click", closeTopicModal);
  }

  if (elements.modalDone) {
    elements.modalDone.addEventListener("click", closeTopicModal);
  }

  // Close when clicking outside the modal content.
  if (elements.topicModal) {
    elements.topicModal.addEventListener("click", event => {
      if (event.target === elements.topicModal) {
        closeTopicModal();
      }
    });
  }

  // Close with Escape key.
  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      elements.topicModal?.classList.contains("active")
    ) {
      closeTopicModal();
    }
  });

  // ---------------------------------------
  // REDRAW CONNECTORS WHEN SCREEN CHANGES
  // ---------------------------------------

  let resizeFrame = null;

  function scheduleConnectorRedraw() {
    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = requestAnimationFrame(() => {
      drawMindMapConnections();
      resizeFrame = null;
    });
  }

  window.addEventListener("resize", scheduleConnectorRedraw);

  // Recalculate after the page has finished loading.
  window.addEventListener("load", scheduleConnectorRedraw);

  // ---------------------------------------
  // DISPLAY ERROR
  // ---------------------------------------

  function showMapError(message) {
    if (!elements.canvas) return;

    const error = document.createElement("p");

    error.className = "mindmap-error";
    error.textContent = message;

    elements.canvas.appendChild(error);
  }

  // ---------------------------------------
  // START APPLICATION
  // ---------------------------------------

  loadTrainingData();
});
