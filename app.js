// ============================================================
// NOVA AI APP BUILDER
// app.js - Version 2.1.0
// ============================================================

"use strict";

// ============================================================
// إعدادات NOVA
// ============================================================

const NOVA_CONFIG = {
  version: "2.1.0",

  aiEndpoint:
    "https://cjveqwqxfvtenarybbvj.supabase.co/functions/v1/quick-responder",

  requestTimeout: 120000,

  maxPromptLength: 5000,
};

// ============================================================
// أدوات عامة
// ============================================================

function getElement(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const toast = getElement("nova-toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;

  toast.classList.remove(
    "show",
    "success",
    "error",
    "info"
  );

  toast.classList.add("show", type);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// ============================================================
// التخزين المحلي
// ============================================================

function savePrompt(prompt) {
  try {
    localStorage.setItem("nova_last_prompt", prompt);
    localStorage.setItem(
      "nova_last_prompt_time",
      new Date().toISOString()
    );
  } catch (error) {
    console.warn("تعذر حفظ الطلب:", error);
  }
}

function getLastPrompt() {
  try {
    return localStorage.getItem("nova_last_prompt") || "";
  } catch (error) {
    return "";
  }
}

// ============================================================
// حالة التحميل
// ============================================================

function setLoading(isLoading) {
  const button = getElement("generate-button");

  if (!button) {
    return;
  }

  if (isLoading) {
    button.disabled = true;

    button.dataset.originalText =
      button.innerHTML;

    button.innerHTML = `
      <span class="generate-icon">⏳</span>
      <span>جاري إنشاء المشروع...</span>
    `;

    button.classList.add("loading");
  } else {
    button.disabled = false;

    button.innerHTML =
      button.dataset.originalText ||
      `
      <span class="generate-icon">🚀</span>
      <span>إنشاء المشروع</span>
      `;

    button.classList.remove("loading");
  }
}

// ============================================================
// نافذة NOVA
// ============================================================

function openModal(content = "") {
  const modal = getElement("nova-modal");
  const modalBody = getElement("modalBody");

  if (!modal) {
    return;
  }

  if (modalBody && content) {
    modalBody.innerHTML = content;
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = getElement("nova-modal");

  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

// ============================================================
// شاشة بدء إنشاء المشروع
// ============================================================

function showGeneratingModal(prompt) {
  const safePrompt = escapeHTML(prompt);

  const html = `
    <div class="nova-generating">
      <div class="nova-generating-icon">
        ✨
      </div>

      <h2>
        NOVA تعمل الآن
      </h2>

      <p>
        تم استلام طلبك وإرساله إلى محرك الذكاء الاصطناعي الحقيقي.
      </p>

      <div class="nova-request-preview">
        ${safePrompt}
      </div>

      <div class="nova-loading-line">
        <span></span>
      </div>

      <small>
        قد يستغرق إنشاء الرد عدة ثوانٍ...
      </small>
    </div>
  `;

  openModal(html);
}

// ============================================================
// الاتصال بـ NOVA AI
// ============================================================

async function callNOVAAI(prompt) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, NOVA_CONFIG.requestTimeout);

  try {
    const response = await fetch(
      NOVA_CONFIG.aiEndpoint,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          prompt: prompt,
        }),

        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "وصل رد من الخادم ولكن لم يكن بصيغة صحيحة."
      );
    }

    if (!response.ok) {
      const serverError =
        data?.error ||
        data?.details ||
        `HTTP ${response.status}`;

      throw new Error(serverError);
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error ||
          data?.details ||
          "لم تُرجع NOVA نتيجة صحيحة."
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error(
        "انتهى وقت الاتصال بالذكاء الاصطناعي. حاول مرة أخرى."
      );
    }

    if (
      error instanceof TypeError &&
      error.message.includes("fetch")
    ) {
      throw new Error(
        "تعذر الاتصال بخادم NOVA. تأكد من نشر Edge Function."
      );
    }

    throw error;
  }
}

// ============================================================
// عرض نتيجة الذكاء الاصطناعي
// ============================================================

function showAIResult(data, prompt) {
  const modalBody = getElement("modalBody");

  if (!modalBody) {
    return;
  }

  const provider = escapeHTML(
    data.provider || "غير معروف"
  );

  const model = escapeHTML(
    data.model || "غير معروف"
  );

  const keyNumber = escapeHTML(
    data.keyNumber || "غير معروف"
  );

  const result = escapeHTML(
    data.result || "لم يتم استلام نتيجة."
  );

  modalBody.innerHTML = `
    <div class="nova-ai-result">

      <div class="nova-result-header">

        <div class="nova-result-icon">
          🤖
        </div>

        <div>
          <h2>
            تم استلام رد NOVA
          </h2>

          <p>
            الذكاء الاصطناعي الحقيقي متصل الآن.
          </p>
        </div>

      </div>

      <div class="nova-ai-info">

        <div class="nova-info-item">
          <strong>المحرك</strong>
          <span>${provider}</span>
        </div>

        <div class="nova-info-item">
          <strong>النموذج</strong>
          <span>${model}</span>
        </div>

        <div class="nova-info-item">
          <strong>المفتاح المستخدم</strong>
          <span>${keyNumber}</span>
        </div>

      </div>

      <div class="nova-user-request">

        <div class="nova-section-title">
          طلبك
        </div>

        <div class="nova-request-box">
          ${escapeHTML(prompt)}
        </div>

      </div>

      <div class="nova-ai-response">

        <div class="nova-section-title">
          رد NOVA
        </div>

        <pre class="nova-response-box">${result}</pre>

      </div>

      <div class="nova-result-actions">

        <button
          type="button"
          class="nova-copy-button"
          onclick="copyAIResult()"
        >
          📋 نسخ الرد
        </button>

        <button
          type="button"
          class="nova-close-button"
          onclick="closeModal()"
        >
          إغلاق
        </button>

      </div>

    </div>
  `;

  window.NOVA_LAST_RESULT =
    data.result || "";
}

// ============================================================
// عرض الخطأ
// ============================================================

function showAIError(error) {
  const modalBody = getElement("modalBody");

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (!modalBody) {
    alert(message);
    return;
  }

  modalBody.innerHTML = `
    <div class="nova-ai-error">

      <div class="nova-error-icon">
        ⚠️
      </div>

      <h2>
        حدث خطأ في الاتصال
      </h2>

      <p>
        لم تتمكن NOVA من الحصول على رد من الذكاء الاصطناعي.
      </p>

      <div class="nova-error-details">
        ${escapeHTML(message)}
      </div>

      <button
        type="button"
        class="nova-close-button"
        onclick="closeModal()"
      >
        إغلاق
      </button>

    </div>
  `;
}

// ============================================================
// نسخ نتيجة الذكاء الاصطناعي
// ============================================================

async function copyAIResult() {
  const result =
    window.NOVA_LAST_RESULT || "";

  if (!result) {
    showToast(
      "لا يوجد رد لنسخه.",
      "error"
    );

    return;
  }

  try {
    await navigator.clipboard.writeText(result);

    showToast(
      "تم نسخ الرد بنجاح ✅",
      "success"
    );
  } catch (error) {
    showToast(
      "تعذر النسخ تلقائيًا.",
      "error"
    );
  }
}

// ============================================================
// إنشاء المشروع
// ============================================================

async function generateProject() {
  const promptInput =
    getElement("nova-prompt");

  if (!promptInput) {
    console.error(
      "لم يتم العثور على nova-prompt"
    );

    return;
  }

  const prompt =
    promptInput.value.trim();

  if (!prompt) {
    showToast(
      "اكتب وصف المشروع أولًا.",
      "error"
    );

    promptInput.focus();

    return;
  }

  if (
    prompt.length >
    NOVA_CONFIG.maxPromptLength
  ) {
    showToast(
      `الطلب طويل جدًا. الحد الأقصى ${NOVA_CONFIG.maxPromptLength} حرف.`,
      "error"
    );

    return;
  }

  savePrompt(prompt);

  setLoading(true);

  showGeneratingModal(prompt);

  try {
    const data =
      await callNOVAAI(prompt);

    showAIResult(
      data,
      prompt
    );

    showToast(
      "تم استلام رد الذكاء الاصطناعي ✅",
      "success"
    );
  } catch (error) {
    console.error(
      "NOVA AI Error:",
      error
    );

    showAIError(error);

    showToast(
      "تعذر الاتصال بالذكاء الاصطناعي.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

// ============================================================
// ربط زر إنشاء المشروع
// ============================================================

function initializeGenerateButton() {
  const button =
    getElement("generate-button");

  const promptInput =
    getElement("nova-prompt");

  if (button) {
    button.addEventListener(
      "click",
      generateProject
    );
  }

  if (promptInput) {
    promptInput.addEventListener(
      "keydown",
      (event) => {
        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key === "Enter"
        ) {
          event.preventDefault();

          generateProject();
        }
      }
    );
  }
}

// ============================================================
// إغلاق النافذة
// ============================================================

function initializeModal() {
  const modal =
    getElement("nova-modal");

  if (!modal) {
    return;
  }

  const closeButton =
    modal.querySelector(
      ".modal-close"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeModal
    );
  }

  const overlay =
    modal.querySelector(
      ".modal-overlay"
    );

  if (overlay) {
    overlay.addEventListener(
      "click",
      closeModal
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape"
      ) {
        closeModal();
      }
    }
  );
}

// ============================================================
// قائمة الهاتف
// ============================================================

function initializeMobileMenu() {
  const menuButton =
    getElement(
      "mobile-menu-button"
    );

  const nav =
    document.querySelector(
      ".nova-nav"
    );

  if (!menuButton || !nav) {
    return;
  }

  menuButton.addEventListener(
    "click",
    () => {
      nav.classList.toggle(
        "mobile-open"
      );

      menuButton.classList.toggle(
        "active"
      );
    }
  );
}

// ============================================================
// استعادة آخر طلب
// ============================================================

function restoreLastPrompt() {
  const input =
    getElement("nova-prompt");

  if (!input) {
    return;
  }

  const lastPrompt =
    getLastPrompt();

  if (
    lastPrompt &&
    !input.value.trim()
  ) {
    // لا نضعه تلقائيًا حتى لا نزعج المستخدم.
    input.placeholder =
      "اكتب فكرة تطبيقك هنا...";
  }
}

// ============================================================
// تحديث السنة
// ============================================================

function updateCurrentYear() {
  const year =
    getElement("currentYear");

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}

// ============================================================
// حماية من إرسال النموذج
// ============================================================

function preventDefaultForms() {
  document.addEventListener(
    "submit",
    (event) => {
      const form =
        event.target;

      if (
        form &&
        form.id ===
          "nova-builder-form"
      ) {
        event.preventDefault();

        generateProject();
      }
    }
  );
}

// ============================================================
// فحص الاتصال الأساسي
// ============================================================

function printStartupInfo() {
  console.log(
    "%cNOVA AI APP BUILDER",
    "font-size:20px;font-weight:bold;"
  );

  console.log(
    "Version:",
    NOVA_CONFIG.version
  );

  console.log(
    "AI Endpoint:",
    NOVA_CONFIG.aiEndpoint
  );

  console.log(
    "NOVA جاهزة."
  );
}

// ============================================================
// تهيئة التطبيق
// ============================================================

function initializeNOVA() {
  initializeGenerateButton();

  initializeModal();

  initializeMobileMenu();

  restoreLastPrompt();

  updateCurrentYear();

  preventDefaultForms();

  printStartupInfo();
}

// ============================================================
// بدء NOVA
// ============================================================

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeNOVA
  );
} else {
  initializeNOVA();
}

// ============================================================
// جعل الدوال متاحة للأزرار الموجودة في HTML
// ============================================================

window.generateProject =
  generateProject;

window.callNOVAAI =
  callNOVAAI;

window.closeModal =
  closeModal;

window.copyAIResult =
  copyAIResult;

window.showToast =
  showToast;

window.NOVA_CONFIG =
  NOVA_CONFIG;

// ============================================================
// نهاية الملف
// ============================================================
