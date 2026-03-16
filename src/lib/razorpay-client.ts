const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayLoader: Promise<boolean> | null = null;

declare global {
  interface Window {
    Razorpay?: new (options: unknown) => { open: () => void };
  }
}

function getExistingScript() {
  return document.querySelector<HTMLScriptElement>(
    `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
  );
}

export function isRazorpayReady() {
  return typeof window !== "undefined" && typeof window.Razorpay !== "undefined";
}

export function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (isRazorpayReady()) {
    return Promise.resolve(true);
  }

  if (razorpayLoader) {
    return razorpayLoader;
  }

  razorpayLoader = new Promise<boolean>((resolve) => {
    const existingScript = getExistingScript();
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  }).finally(() => {
    if (!isRazorpayReady()) {
      razorpayLoader = null;
    }
  });

  return razorpayLoader;
}

export function scheduleRazorpayPreload() {
  if (typeof window === "undefined" || isRazorpayReady()) {
    return () => undefined;
  }

  const idleWindow = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

  if (idleWindow.requestIdleCallback) {
    const idleId = idleWindow.requestIdleCallback(() => {
      void loadRazorpayScript();
    });

    return () => {
      idleWindow.cancelIdleCallback?.(idleId);
    };
  }

  const timeoutId = globalThis.setTimeout(() => {
    void loadRazorpayScript();
  }, 0);

  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}

export { RAZORPAY_CHECKOUT_SRC };
