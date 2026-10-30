(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Render data-driven sections ---------- */
  $("#skillsGrid").innerHTML = SKILLS.map((g) => `
    <article class="card skill-card reveal">
      <h3><span class="ico" aria-hidden="true">${g.icon}</span>${esc(g.title)}</h3>
      <div class="badges">${g.items.map((i, n) => `<span class="badge" style="transition-delay:${n * 70}ms">${esc(i)}</span>`).join("")}</div>
    </article>`).join("");

  $("#projectsGrid").innerHTML = PROJECTS.map((p, i) => `
    <article class="card project reveal">
      <div class="p-icon" aria-hidden="true">${p.icon}</div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      <div class="details" id="details-${i}"><ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="tech">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="p-actions">
        <button class="btn btn-ghost toggle-details" aria-expanded="false" aria-controls="details-${i}">Show details</button>
        <a class="btn btn-outline" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </div>
    </article>`).join("");

  $("#internTimeline").innerHTML = INTERNSHIPS.map((n) => `
    <article class="timeline-item reveal">
      <span class="time">${esc(n.period)}</span>
      <h3>${esc(n.role)}</h3>
      <p class="org">${esc(n.org)}</p>
      <ul>${n.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </article>`).join("");

  /* Project card expand/collapse */
  $$(".toggle-details").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".project");
      const open = card.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      btn.textContent = open ? "Hide details" : "Show details";
    });
  });

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const setTheme = (t) => {
    root.setAttribute("data-theme", t);
    $(".theme-icon", themeBtn).textContent = t === "dark" ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try { localStorage.setItem("theme", t); } catch (e) {}
  };
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
  const closeMenu = () => { navLinks.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Scroll: navbar, back-to-top, active link ---------- */
  const navbar = $("#navbar"), toTop = $("#toTop");
  const sections = $$("main section[id]");
  const links = $$("a", navLinks);
  const onScroll = () => {
    navbar.classList.toggle("scrolled", scrollY > 10);
    toTop.classList.toggle("show", scrollY > 500);
    let current = "home";
    sections.forEach((s) => { if (scrollY >= s.offsetTop - 140) current = s.id; });
    // Certifications sit under Experience in the nav
    if (current === "certifications") current = "experience";
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Scroll reveal + counters ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suffix = el.dataset.suffix || "";
    const start = performance.now(), dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("visible");
      const c = $("[data-count]", en.target);
      if (c) countUp(c);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Typing animation ---------- */
  const typingEl = $("#typing");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    typingEl.textContent = PROFILE.typingTexts[0];
  } else {
    let w = 0, c = 0, del = false;
    (function type() {
      const word = PROFILE.typingTexts[w];
      c += del ? -1 : 1;
      typingEl.textContent = word.slice(0, c);
      let delay = del ? 40 : 80;
      if (!del && c === word.length) { del = true; delay = 1600; }
      else if (del && c === 0) { del = false; w = (w + 1) % PROFILE.typingTexts.length; delay = 400; }
      setTimeout(type, delay);
    })();
  }

  /* ---------- Profile image fallback ---------- */
  const img = $("#profileImg");
  const ring = img.closest(".photo-ring");
  const checkImg = () => { if (!img.complete || img.naturalWidth === 0) ring.classList.add("no-img"); };
  img.addEventListener("error", () => ring.classList.add("no-img"));
  checkImg();

  /* ---------- Contact form: validation + opens email client ---------- */
  const form = $("#contactForm"), status = $("#formStatus");
  const rules = {
    name: (v) => (v.length < 2 ? "Please enter your name (at least 2 characters)." : ""),
    email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Please enter a valid email address." : ""),
    subject: (v) => (v.length < 3 ? "Please enter a subject (at least 3 characters)." : ""),
    message: (v) => (v.length < 10 ? "Message should be at least 10 characters." : "")
  };
  const validate = (name) => {
    const input = form.elements[name];
    const msg = rules[name](input.value.trim());
    $("#" + name + "Error").textContent = msg;
    input.closest(".field").classList.toggle("invalid", !!msg);
    input.setAttribute("aria-invalid", !!msg);
    return !msg;
  };
  Object.keys(rules).forEach((n) => {
    form.elements[n].addEventListener("blur", () => validate(n));
    form.elements[n].addEventListener("input", () => { if (form.elements[n].closest(".field").classList.contains("invalid")) validate(n); });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.className = "form-status";
    const ok = Object.keys(rules).map(validate).every(Boolean);
    if (!ok) { status.textContent = "Please fix the highlighted fields."; const bad = $(".invalid input, .invalid textarea", form); if (bad) bad.focus(); return; }
    const d = Object.fromEntries(new FormData(form).entries());
    const body = `${d.message.trim()}\n\n— ${d.name.trim()} (${d.email.trim()})`;
    location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(d.subject.trim())}&body=${encodeURIComponent(body)}`;
    status.classList.add("ok");
    status.textContent = "Opening your email app to send the message…";
    form.reset();
  });

  $("#year").textContent = new Date().getFullYear();
})();