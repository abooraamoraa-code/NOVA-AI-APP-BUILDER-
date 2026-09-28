"use strict";

/*
========================================================
NOVA GEMINI PROVIDER
يربط NOVA AI ENGINE بخادم Gemini الآمن
========================================================
*/

(function () {

  const CONFIG = {
    name: "Gemini",
    endpoint:
      "https://cjveqwqxfvtenarybbvj.supabase.co/functions/v1/quick-responder",

    timeout: 120000
  };


  function createTimeoutController() {

    const controller =
      new AbortController();

    const timer =
      setTimeout(() => {
        controller.abort();
      }, CONFIG.timeout);

    return {
      controller,
      timer
    };
  }


  async function generate(
    prompt,
    options = {}
  ) {

    if (!prompt || !String(prompt).trim()) {
      throw new Error(
        "لا يوجد طلب لإرساله إلى Gemini."
      );
    }

    const {
      controller,
      timer
    } = createTimeoutController();


    try {

      const response =
        await fetch(
          CONFIG.endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json"
            },

            body: JSON.stringify({
              prompt:
                String(prompt).trim(),

              engine:
                "nova",

              requestedProvider:
                "gemini",

              options
            }),

            signal:
              controller.signal
          }
        );


      let data;

      try {

        data =
          await response.json();

      } catch (error) {

        throw new Error(
          "خادم Gemini أعاد استجابة غير صالحة."
        );
      }


      if (!response.ok) {

        throw new Error(
          data?.error ||
          data?.details ||
          `HTTP ${response.status}`
        );
      }


      if (
        !data ||
        data.success !== true
      ) {

        throw new Error(
          data?.error ||
          "لم يرجع Gemini نتيجة صحيحة."
        );
      }


      if (
        !data.result ||
        !String(data.result).trim()
      ) {

        throw new Error(
          "Gemini لم يرجع نصًا."
        );
      }


      return data.result;


    } catch (error) {

      if (
        error &&
        error.name ===
          "AbortError"
      ) {

        throw new Error(
          "انتهت مهلة الاتصال بـ Gemini."
        );
      }


      throw error;


    } finally {

      clearTimeout(timer);

    }

  }


  const provider = {

    name:
      CONFIG.name,

    type:
      "remote",

    model:
      "gemini",

    generate,

    getConfig() {

      return {
        name:
          CONFIG.name,

        type:
          CONFIG.type,

        endpoint:
          CONFIG.endpoint
      };

    }

  };


  /*
  ------------------------------------------------------
  تسجيل المزود داخل محرك NOVA
  ------------------------------------------------------
  */

  function register() {

    if (
      typeof window ===
        "undefined"
    ) {
      return false;
    }


    if (
      !window.NOVA_ENGINE
    ) {
      console.warn(
        "NOVA_ENGINE غير موجود."
      );

      return false;
    }


    try {

      window.NOVA_ENGINE
        .registerProvider(
          provider
        );

      console.log(
        "NOVA Gemini Provider: connected"
      );

      return true;

    } catch (error) {

      console.error(
        "تعذر تسجيل Gemini:",
        error
      );

      return false;

    }

  }


  /*
  ------------------------------------------------------
  الانتظار حتى تحميل nova-engine.js
  ------------------------------------------------------
  */

  if (
    typeof window !==
      "undefined"
  ) {

    if (
      window.NOVA_ENGINE
    ) {

      register();

    } else {

      window.addEventListener(
        "load",
        register
      );

    }

  }


  /*
  ------------------------------------------------------
  تصدير المزود
  ------------------------------------------------------
  */

  if (
    typeof window !==
      "undefined"
  ) {

    window.NOVA_GEMINI_PROVIDER =
      provider;

  }


})();
