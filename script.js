const root = document.documentElement;
const meter = document.querySelector(".scroll-meter");
const glow = document.querySelector(".cursor-glow");
const canvas = document.querySelector("#signal-canvas");
const ctx = canvas.getContext("2d");
const revealItems = document.querySelectorAll(".reveal");
const metricEls = document.querySelectorAll("[data-count]");
const skillButtons = document.querySelectorAll(".skill-filters button");
const skillTags = document.querySelectorAll(".skill-cloud span");
const timelineTriggers = document.querySelectorAll(".timeline-trigger");

let particles = [];
let animatedMetrics = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  particles = Array.from({ length: Math.min(74, Math.floor(window.innerWidth / 18)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.7 + 0.6,
  }));
}

function drawSignals() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.fillStyle = "rgba(201, 255, 106, 0.75)";
  ctx.strokeStyle = "rgba(65, 224, 188, 0.13)";

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
    if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
      if (distance < 130) {
        ctx.globalAlpha = 1 - distance / 130;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });

  if (!prefersReducedMotion) requestAnimationFrame(drawSignals);
}

function formatMetric(value, format) {
  if (format === "money") return `$${Math.round(value / 100000) / 10}M`;
  if (format === "percent") return `${Math.round(value)}%`;
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function animateMetrics() {
  if (animatedMetrics) return;
  animatedMetrics = true;

  metricEls.forEach((el) => {
    const target = Number(el.dataset.count);
    const format = el.dataset.format;
    const start = performance.now();
    const duration = 1300;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = formatMetric(target * eased, format);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("hero-panel")) animateMetrics();
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));
observer.observe(document.querySelector(".hero-panel"));

window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  meter.style.width = `${(window.scrollY / scrollable) * 100}%`;
});

window.addEventListener("pointermove", (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

document.querySelector(".theme-toggle").addEventListener("click", () => {
  root.classList.toggle("light");
});

skillButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    skillButtons.forEach((item) => item.classList.toggle("active", item === button));
    skillTags.forEach((tag) => {
      const isMatch = filter === "all" || tag.dataset.type === filter;
      tag.classList.toggle("dim", !isMatch);
      tag.classList.toggle("focus", isMatch && filter !== "all");
    });
  });
});

timelineTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    trigger.closest(".timeline-item").classList.toggle("open");
  });
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
if (prefersReducedMotion) {
  drawSignals();
} else {
  requestAnimationFrame(drawSignals);
}
