"use strict";

/* =========================================================
   NOVA APP BUILDER — REAL AI FRONTEND ENGINE
   ========================================================= */

const NOVA = {
    version: "2.0.0",

    state: {
        mobileMenu: false,
        modal: false,
        generating: false,
        currentPrompt: "",
        user: null,
        lastAIResult: null
    },

    elements: {},
    toastTimer: null,

    /* =====================================================
       INIT
       ===================================================== */

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateYear();
        this.loadSavedData();

        console.log("NOVA initialized:", this.version);
    },

    /* =====================================================
       ELEMENTS
       ===================================================== */

    cacheElements() {

        this.elements.prompt =
            document.querySelector("#novaPrompt");

        this.elements.generateButton =
            document.querySelector("#generateButton");

        this.elements.modal =
            document.querySelector("#novaModal");

        this.elements.modalClose =
            document.querySelector("#modalClose");

        this.elements.mobileButton =
            document.querySelector("#mobileMenuButton");

        this.elements.mobileMenu =
            document.querySelector("#mobileMenu");

        this.elements.toast =
            document.querySelector("#novaToast");

        this.elements.year =
            document.querySelector("#novaYear");
    },

    /* =====================================================
       EVENTS
       ===================================================== */

    bindEvents() {

        if (this.elements.generateButton) {

            this.elements.generateButton.addEventListener(
                "click",
                () => this.generateProject()
            );
        }

        if (this.elements.modalClose) {

            this.elements.modalClose.addEventListener(
                "click",
                () => this.closeModal()
            );
        }

        if (this.elements.modal) {

            this.elements.modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        this.elements.modal
                    ) {
                        this.closeModal();
                    }
                }
            );
        }

        if (this.elements.mobileButton) {

            this.elements.mobileButton.addEventListener(
                "click",
                () => this.toggleMobileMenu()
            );
        }

        document.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Escape") {

                    this.closeModal();
                    this.closeMobileMenu();
                }

                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() === "enter"
                ) {

                    this.generateProject();
                }
            }
        );
    },

    /* =====================================================
       REAL AI REQUEST
       ===================================================== */

    async generateProject() {

        if (this.state.generating) {
            return;
        }

        const prompt =
            this.elements.prompt
                ? this.elements.prompt.value.trim()
                : "";

        if (!prompt) {

            this.showToast(
                "اكتب وصف التطبيق أولاً."
            );

            if (this.elements.prompt) {
                this.elements.prompt.focus();
            }

            return;
        }

        if (prompt.length < 10) {

            this.showToast(
                "اكتب وصفًا أطول قليلًا حتى تفهم NOVA المطلوب."
            );

            return;
        }

        this.state.currentPrompt = prompt;
        this.state.generating = true;

        this.setGenerateLoading(true);
        this.savePrompt(prompt);

        this.openModal(
            "NOVA تعمل الآن",
            `
                <div style="
                    text-align:center;
                    padding:20px 5px;
                ">

                    <div class="nova-loading"
                         style="
                            width:32px;
                            height:32px;
                            margin:0 auto 18px;
                         ">
                    </div>

                    <h3 style="
                        margin:0 0 10px;
                    ">
                        جارٍ الاتصال بالذكاء الاصطناعي...
                    </h3>

                    <p style="
                        margin:0;
                        color:#667085;
                    ">
                        NOVA ترسل طلبك إلى محرك Gemini.
                    </p>

                    <div style="
                        margin-top:18px;
                        padding:14px;
                        background:#f8fafc;
                        border:1px solid #e5e7eb;
                        border-radius:12px;
                        text-align:right;
                        white-space:pre-wrap;
                        word-break:break-word;
                    ">
                        ${this.escapeHTML(prompt)}
                    </div>

                </div>
            `
        );

        try {

            const result =
                await this.callNOVAAI(prompt);

            this.state.lastAIResult = result;

            this.setGenerateLoading(false);
            this.state.generating = false;

            this.showAIResult(result);

        } catch (error) {

            console.error(
                "NOVA AI ERROR:",
                error
            );

            this.setGenerateLoading(false);
            this.state.generating = false;

            this.showAIError(error);
        }
    },

    /* =====================================================
       CALL SUPABASE EDGE FUNCTION
       ===================================================== */

    async callNOVAAI(prompt) {

        const endpoint =
            "https://cjveqwqxfvtenarybbvj.supabase.co/functions/v1/nova-ai";

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        prompt: prompt
                    })
                }
            );

        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "لم يتمكن الموقع من قراءة رد الخادم."
            );
        }

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.details ||
                `خطأ من الخادم: ${response.status}`
            );
        }

        if (!data || data.success !== true) {

            throw new Error(
                data?.error ||
                "لم يرجع الذكاء الاصطناعي نتيجة صحيحة."
            );
        }

        if (!data.result) {

            throw new Error(
                "وصل الرد ولكن بدون محتوى."
            );
        }

        return data;
    },

    /* =====================================================
       DISPLAY AI RESULT
       ===================================================== */

    showAIResult(data) {

        const result =
            String(data.result || "");

        const provider =
            data.provider ||
            "gemini";

        const model =
            data.model ||
            "AI";

        const keyNumber =
            data.keyNumber
                ? `المفتاح المستخدم: ${data.keyNumber}`
                : "";

        const formattedResult =
            this.formatAIText(result);

        this.openModal(
            "تم استلام رد NOVA 🤖",
            `
                <div style="
                    margin-bottom:16px;
                    padding:12px 14px;
                    background:#f0fdf4;
                    border:1px solid #bbf7d0;
                    border-radius:12px;
                    color:#166534;
                ">
                    <strong>اتصال ناجح بالذكاء الاصطناعي</strong>
                    <div style="
                        margin-top:5px;
                        font-size:13px;
                    ">
                        Provider: ${this.escapeHTML(provider)}
                        <br>
                        Model: ${this.escapeHTML(model)}
                        ${
                            keyNumber
                                ? `<br>${this.escapeHTML(keyNumber)}`
                                : ""
                        }
                    </div>
                </div>

                <div style="
                    padding:18px;
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:14px;
                    line-height:1.9;
                    color:#344054;
                    max-height:55vh;
                    overflow:auto;
                    direction:rtl;
                    text-align:right;
                ">
                    ${formattedResult}
                </div>

                <div style="
                    margin-top:16px;
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                ">

                    <button
                        type="button"
                        onclick="NOVA.copyAIResult()"
                        style="
                            border:0;
                            padding:11px 16px;
                            border-radius:10px;
                            cursor:pointer;
                            background:#111827;
                            color:white;
                            font-weight:600;
                        "
                    >
                        نسخ الرد
                    </button>

                    <button
                        type="button"
                        onclick="NOVA.closeModal()"
                        style="
                            border:1px solid #d0d5dd;
                            padding:11px 16px;
                            border-radius:10px;
                            cursor:pointer;
                            background:white;
                            color:#344054;
                            font-weight:600;
                        "
                    >
                        إغلاق
                    </button>

                </div>
            `
        );
    },

    /* =====================================================
       AI ERROR
       ===================================================== */

    showAIError(error) {

        const message =
            error instanceof Error
                ? error.message
                : String(error);

        this.openModal(
            "حدث خطأ في الاتصال",
            `
                <div style="
                    padding:18px;
                    background:#fef2f2;
                    border:1px solid #fecaca;
                    border-radius:14px;
                    color:#991b1b;
                    line-height:1.8;
                ">
                    <strong>
                        لم تتمكن NOVA من الحصول على رد من الذكاء الاصطناعي.
                    </strong>

                    <div style="
                        margin-top:12px;
                        padding:12px;
                        background:white;
                        border-radius:10px;
                        border:1px solid #fee2e2;
                        color:#7f1d1d;
                        direction:rtl;
                        text-align:right;
                        word-break:break-word;
                    ">
                        ${this.escapeHTML(message)}
                    </div>
                </div>

                <p style="
                    margin-top:15px;
                    color:#667085;
                ">
                    إذا ظهر هذا الخطأ، سنفحص Edge Function
                    ونصلحه في الخطوة التالية.
                </p>
            `
        );
    },

    /* =====================================================
       FORMAT AI TEXT
       ===================================================== */

    formatAIText(text) {

        let safe =
            this.escapeHTML(text);

        safe =
            safe.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );

        safe =
            safe.replace(
                /`([^`]+)`/g,
                `<code style="
                    background:#eef2ff;
                    padding:2px 6px;
                    border-radius:5px;
                    direction:ltr;
                    display:inline-block;
                ">$1</code>`
            );

        safe =
            safe.replace(
                /\n/g,
                "<br>"
            );

        return safe;
    },

    /* =====================================================
       COPY AI RESULT
       ===================================================== */

    async copyAIResult() {

        const result =
            this.state.lastAIResult?.result;

        if (!result) {

            this.showToast(
                "لا يوجد رد لنسخه."
            );

            return;
        }

        try {

            await navigator.clipboard.writeText(
                String(result)
            );

            this.showToast(
                "تم نسخ رد NOVA."
            );

        } catch (error) {

            this.showToast(
                "تعذر النسخ من المتصفح."
            );
        }
    },

    /* =====================================================
       LOADING BUTTON
       ===================================================== */

    setGenerateLoading(loading) {

        if (!this.elements.generateButton) {
            return;
        }

        if (loading) {

            this.elements.generateButton.dataset
                .originalText =
                this.elements.generateButton.innerHTML;

            this.elements.generateButton.innerHTML = `
                <span class="nova-loading"></span>
                جارٍ الاتصال بالذكاء الاصطناعي...
            `;

            this.elements.generateButton.disabled = true;

        } else {

            this.elements.generateButton.innerHTML =
                this.elements.generateButton.dataset
                    .originalText ||
                "ابدأ بناء التطبيق";

            this.elements.generateButton.disabled =
                false;
        }
    },

    /* =====================================================
       MODAL
       ===================================================== */

    openModal(title, content) {

        if (!this.elements.modal) {
            return;
        }

        const titleElement =
            this.elements.modal.querySelector(
                "#modalTitle"
            );

        const bodyElement =
            this.elements.modal.querySelector(
                "#modalBody"
            );

        if (titleElement) {

            titleElement.textContent =
                title;
        }

        if (bodyElement) {

            bodyElement.innerHTML =
                content;
        }

        this.elements.modal.classList.add(
            "active"
        );

        this.state.modal = true;

        document.body.style.overflow =
            "hidden";
    },

    closeModal() {

        if (!this.elements.modal) {
            return;
        }

        this.elements.modal.classList.remove(
            "active"
        );

        this.state.modal = false;

        document.body.style.overflow =
            "";
    },

    /* =====================================================
       MOBILE MENU
       ===================================================== */

    toggleMobileMenu() {

        if (!this.elements.mobileMenu) {
            return;
        }

        this.state.mobileMenu =
            !this.state.mobileMenu;

        this.elements.mobileMenu.classList.toggle(
            "active",
            this.state.mobileMenu
        );
    },

    closeMobileMenu() {

        if (!this.elements.mobileMenu) {
            return;
        }

        this.state.mobileMenu = false;

        this.elements.mobileMenu.classList.remove(
            "active"
        );
    },

    /* =====================================================
       TOAST
       ===================================================== */

    showToast(
        message,
        duration = 3500
    ) {

        if (!this.elements.toast) {
            return;
        }

        this.elements.toast.textContent =
            message;

        this.elements.toast.classList.add(
            "show"
        );

        clearTimeout(
            this.toastTimer
        );

        this.toastTimer =
            setTimeout(
                () => {

                    this.elements.toast.classList.remove(
                        "show"
                    );

                },
                duration
            );
    },

    /* =====================================================
       LOCAL STORAGE
       ===================================================== */

    savePrompt(prompt) {

        try {

            localStorage.setItem(
                "nova_last_prompt",
                prompt
            );

        } catch (error) {

            console.warn(
                "LocalStorage unavailable",
                error
            );
        }
    },

    loadSavedData() {

        try {

            const savedPrompt =
                localStorage.getItem(
                    "nova_last_prompt"
                );

            if (
                savedPrompt &&
                this.elements.prompt &&
                !this.elements.prompt.value
            ) {

                this.elements.prompt.value =
                    savedPrompt;
            }

        } catch (error) {

            console.warn(
                "Could not load saved data",
                error
            );
        }
    },

    /* =====================================================
       YEAR
       ===================================================== */

    updateYear() {

        if (this.elements.year) {

            this.elements.year.textContent =
                new Date().getFullYear();
        }
    },

    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value);

        return div.innerHTML;
    },

    /* =====================================================
       SCROLL
       ===================================================== */

    scrollTo(selector) {

        const element =
            document.querySelector(
                selector
            );

        if (!element) {
            return;
        }

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
};

/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

window.NOVA =
    NOVA;

window.novaScroll =
    function(selector) {

        NOVA.scrollTo(
            selector
        );
    };

window.novaOpenModal =
    function(title, content) {

        NOVA.openModal(
            title,
            content
        );
    };

window.novaCloseModal =
    function() {

        NOVA.closeModal();
    };

/* =========================================================
   INITIALIZATION
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => NOVA.init()
    );

} else {

    NOVA.init();
}

/* =========================================================
   END NOVA APP ENGINE
   ========================================================= */
