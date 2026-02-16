(() => {
  // Prevent duplicates if injected multiple times
  const EXISTING_ID = "hello-overlay-extension-root";
  if (document.getElementById(EXISTING_ID)) return;

  // Root container
  const root = document.createElement("div");
  root.id = EXISTING_ID;

  // Make sure it's above the site's UI
  root.style.position = "fixed";
  root.style.right = "16px";
  root.style.top = "120px";
  root.style.zIndex = "2147483647"; // max-ish
  root.style.pointerEvents = "none"; // so page still clickable except inside overlay

  // Shadow DOM to isolate CSS
  const shadow = root.attachShadow({ mode: "open" });

  // Wrapper
  const wrap = document.createElement("div");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-label", "Hello Overlay");

  // Allow interaction inside overlay
  wrap.style.pointerEvents = "auto";

  // Styling similar to your screenshot
  wrap.style.width = "260px";
  wrap.style.background = "rgba(20,20,20,0.95)";
  wrap.style.color = "white";
  wrap.style.borderRadius = "14px";
  wrap.style.boxShadow = "0 12px 30px rgba(0,0,0,0.35)";
  wrap.style.fontFamily =
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial';
  wrap.style.overflow = "hidden";

  // Header
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "12px 12px 8px 12px";
  header.style.borderBottom = "1px solid rgba(255,255,255,0.08)";

  const title = document.createElement("div");
  title.textContent = "Hello World";
  title.style.fontSize = "14px";
  title.style.fontWeight = "600";
  title.style.letterSpacing = "0.2px";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.color = "rgba(255,255,255,0.8)";
  closeBtn.style.fontSize = "14px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.padding = "6px";
  closeBtn.style.margin = "-6px";
  closeBtn.addEventListener("click", () => root.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement("div");
  body.style.padding = "12px";
  body.style.fontSize = "13px";
  body.style.color = "rgba(255,255,255,0.85)";
  body.textContent =
    "This overlay was injected automatically after install (and on page loads).";

  wrap.appendChild(header);
  wrap.appendChild(body);
  shadow.appendChild(wrap);

  // Attach to page
  document.documentElement.appendChild(root);
})();
