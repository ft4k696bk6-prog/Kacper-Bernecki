declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastPagePath = "";

function currentPagePath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function sendPageView() {
  if (typeof window.gtag !== "function") return;

  const pagePath = currentPagePath();
  if (pagePath === lastPagePath) return;
  lastPagePath = pagePath;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath,
  });
}

function queuePageView() {
  window.setTimeout(sendPageView, 0);
}

function patchHistoryMethod(method: "pushState" | "replaceState") {
  const original = window.history[method];

  window.history[method] = function patchedHistoryMethod(
    ...args: [data: unknown, unused: string, url?: string | URL | null]
  ) {
    original.apply(window.history, args);
    queuePageView();
  } as History[typeof method];
}

export function initGoogleAnalytics(measurementId?: string) {
  if (!measurementId || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
  sendPageView();

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  window.addEventListener("popstate", queuePageView);
}

export {};
