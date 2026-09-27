"use strict";

/*
=========================================================
NOVA CONFIG
=========================================================
*/

window.NOVA_CONFIG = {

    APP_NAME: "NOVA",

    APP_VERSION: "1.0.0",

    ENVIRONMENT: "production",

    SUPABASE: {

        URL:
            "https://cjveqwqxfvtenarybbvj.supabase.co",

        PUBLISHABLE_KEY:
            "sb_publishable_PeWAKe3Pf_JknU7eO1MJVg_kvOrE1YO"
    },

    AI: {

        ENABLED: true,

        ENDPOINT:
            "/functions/v1/nova-ai",

        PROVIDERS: {

            PROVIDER_1: {
                name: "Google Gemini",
                enabled: true
            },

            PROVIDER_2: {
                name: "AI Provider 2",
                enabled: false
            },

            PROVIDER_3: {
                name: "AI Provider 3",
                enabled: false
            }

        },

        MAX_REQUEST_LENGTH: 20000,

        TIMEOUT: 120000

    },

    FEATURES: {

        AUTH: true,

        PROJECTS: true,

        AI_BUILDER: true,

        PROJECT_FILES: true,

        PREVIEW: true,

        SUPPORT: true,

        ADMIN: true,

        GITHUB_EXPORT: true

    },

    STORAGE: {

        BUCKET:
            "nova-assets"

    },

    ROUTES: {

        HOME:
            "index.html",

        ADMIN:
            "admin.html"

    }

};

console.log(
    "NOVA Config loaded:",
    window.NOVA_CONFIG.APP_VERSION
);
