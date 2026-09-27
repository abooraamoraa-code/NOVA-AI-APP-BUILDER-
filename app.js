"use strict";

/* =========================================================
   NOVA APP BUILDER — FRONTEND ENGINE
   ========================================================= */

const NOVA = {
    version: "1.0.0",

    state: {
        mobileMenu: false,
        modal: false,
        generating: false,
        currentPrompt: "",
        user: null
    },

    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateYear();
        this.loadSavedData();
        console.log("NOVA initialized:", this.version);
    },

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

    generateProject() {

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

        /*
         * في هذه المرحلة الواجهة جاهزة.
         * في الخطوات التالية سنربط هذا الزر
         * بـ Supabase ثم بمحرك الذكاء الاصطناعي.
         */

        setTimeout(() => {

            this.state.generating = false;

            this.setGenerateLoading(false);

            this.openModal(
                "NOVA جاهزة للربط بالذكاء الاصطناعي",
                `
                <p>
                    تم استلام طلبك بنجاح.
                </p>

                <p style="margin-top:12px">
                    <strong>الطلب:</strong>
                </p>

                <div style="
                    margin-top:10px;
                    padding:15px;
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                    color:#344054;
                    white-space:pre-wrap;
                    word-break:break-word;
                ">${this.escapeHTML(prompt)}</div>

                <p style="margin-top:15px">
                    الخطوة التالية ستكون توصيل NOVA
                    بمحرك الذكاء الاصطناعي الحقيقي.
                </p>
                `
            );

        }, 700);
    },

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
                جارٍ تجهيز الطلب...
            `;

            this.elements.generateButton.disabled = true;

        } else {

            this.elements.generateButton.innerHTML =
                this.elements.generateButton.dataset
                    .originalText ||
                "ابدأ بناء التطبيق";

            this.elements.generateButton.disabled = false;
        }
    },

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
            titleElement.textContent = title;
        }

        if (bodyElement) {
            bodyElement.innerHTML = content;
        }

        this.elements.modal.classList.add("active");

        this.state.modal = true;

        document.body.style.overflow = "hidden";
    },

    closeModal() {

        if (!this.elements.modal) {
            return;
        }

        this.elements.modal.classList.remove(
            "active"
        );

        this.state.modal = false;

        document.body.style.overflow = "";
    },

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

    showToast(message, duration = 3500) {

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
            setTimeout(() => {

                this.elements.toast.classList.remove(
                    "show"
                );

            }, duration);
    },

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

    updateYear() {

        if (this.elements.year) {

            this.elements.year.textContent =
                new Date().getFullYear();
        }
    },

    escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value);

        return div.innerHTML;
    },

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
   GLOBAL NOVA HELPERS
   ========================================================= */

window.NOVA = NOVA;

window.novaScroll = function(selector) {
    NOVA.scrollTo(selector);
};

window.novaOpenModal = function(title, content) {
    NOVA.openModal(title, content);
};

window.novaCloseModal = function() {
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
