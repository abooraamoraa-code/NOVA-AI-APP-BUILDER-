"use strict";

/*
=========================================================
NOVA SUPABASE CONNECTION
=========================================================
*/

(function () {

    if (!window.NOVA_CONFIG) {
        console.error(
            "NOVA_CONFIG غير موجود. تأكد من تحميل config.js أولاً."
        );
        return;
    }

    const config =
        window.NOVA_CONFIG.SUPABASE;

    if (!config.URL) {
        console.error(
            "رابط Supabase غير موجود."
        );
        return;
    }

    /*
     * نحمل مكتبة Supabase من CDN.
     */
    const script =
        document.createElement("script");

    script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.async = true;

    script.onload = function () {

        if (
            !window.supabase ||
            typeof window.supabase.createClient !==
            "function"
        ) {
            console.error(
                "تعذر تحميل مكتبة Supabase."
            );
            return;
        }

        if (!config.PUBLISHABLE_KEY) {

            console.warn(
                "NOVA: مفتاح Supabase Publishable Key لم تتم إضافته بعد."
            );

            window.NOVA_SUPABASE = null;

            return;
        }

        try {

            window.NOVA_SUPABASE =
                window.supabase.createClient(
                    config.URL,
                    config.PUBLISHABLE_KEY,
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true
                        }
                    }
                );

            console.log(
                "NOVA: Supabase connected successfully."
            );

            window.dispatchEvent(
                new CustomEvent(
                    "nova:supabase-ready"
                )
            );

        } catch (error) {

            console.error(
                "NOVA: Supabase connection failed:",
                error
            );

            window.NOVA_SUPABASE = null;
        }
    };

    script.onerror = function () {

        console.error(
            "NOVA: فشل تحميل مكتبة Supabase."
        );

        window.NOVA_SUPABASE = null;
    };

    document.head.appendChild(script);

})();

/*
=========================================================
HELPER
=========================================================
*/

window.novaSupabaseReady =
    function () {

        return Boolean(
            window.NOVA_SUPABASE
        );

    };

/*
=========================================================
END
=========================================================
*/
