"use strict";

/*
========================================================
NOVA AI ENGINE
الإصدار: 1.0.0
الوصف:
محرك مركزي لإدارة طلبات بناء التطبيقات.

المسار:
User Prompt
   ↓
Analyzer
   ↓
Planner
   ↓
AI Provider
   ↓
Project Generator
   ↓
Validator
   ↓
Repair
   ↓
Project Result

مهم:
هذا الملف لا يحتوي على أي API Key.
المفاتيح السرية يجب أن تبقى في الخادم / Edge Function.
========================================================
*/

const NOVA_ENGINE = (() => {

  /* ====================================================
     1. الإعدادات الأساسية
  ==================================================== */

  const CONFIG = {
    name: "NOVA AI ENGINE",
    version: "1.0.0",

    maxPromptLength: 10000,

    defaultLanguage: "ar",

    supportedProjectTypes: [
      "website",
      "web-app",
      "dashboard",
      "store",
      "blog",
      "portfolio",
      "game",
      "landing-page",
      "saas",
      "mobile-app",
      "unknown"
    ],

    supportedTechnologies: [
      "html",
      "css",
      "javascript",
      "json",
      "react",
      "nextjs",
      "nodejs"
    ]
  };


  /* ====================================================
     2. أدوات عامة
  ==================================================== */

  function cleanText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/\u0000/g, "")
      .trim();
  }


  function limitText(value, maxLength) {
    const text = cleanText(value);

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength);
  }


  function createId(prefix = "nova") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substring(2, 10)
    );
  }


  function now() {
    return new Date().toISOString();
  }


  /* ====================================================
     3. تحليل اللغة
  ==================================================== */

  function detectLanguage(prompt) {
    const text = cleanText(prompt);

    if (!text) {
      return CONFIG.defaultLanguage;
    }

    const arabicCharacters =
      (text.match(/[\u0600-\u06FF]/g) || []).length;

    const latinCharacters =
      (text.match(/[A-Za-z]/g) || []).length;

    if (arabicCharacters > latinCharacters) {
      return "ar";
    }

    if (latinCharacters > arabicCharacters) {
      return "en";
    }

    return CONFIG.defaultLanguage;
  }


  /* ====================================================
     4. اكتشاف نوع المشروع
  ==================================================== */

  function detectProjectType(prompt) {
    const text = cleanText(prompt).toLowerCase();

    if (
      text.includes("متجر") ||
      text.includes("متجر إلكتروني") ||
      text.includes("متجر ملابس") ||
      text.includes("ecommerce") ||
      text.includes("e-commerce") ||
      text.includes("shop")
    ) {
      return "store";
    }

    if (
      text.includes("مدونة") ||
      text.includes("blog")
    ) {
      return "blog";
    }

    if (
      text.includes("لوحة تحكم") ||
      text.includes("dashboard") ||
      text.includes("admin panel")
    ) {
      return "dashboard";
    }

    if (
      text.includes("لعبة") ||
      text.includes("game")
    ) {
      return "game";
    }

    if (
      text.includes("شركة") ||
      text.includes("saas") ||
      text.includes("منصة")
    ) {
      return "saas";
    }

    if (
      text.includes("تطبيق") ||
      text.includes("app")
    ) {
      return "web-app";
    }

    if (
      text.includes("landing") ||
      text.includes("صفحة هبوط")
    ) {
      return "landing-page";
    }

    if (
      text.includes("موقع") ||
      text.includes("website") ||
      text.includes("web")
    ) {
      return "website";
    }

    return "unknown";
  }


  /* ====================================================
     5. اكتشاف التقنيات المطلوبة
  ==================================================== */

  function detectTechnologies(prompt) {
    const text = cleanText(prompt).toLowerCase();

    const technologies = [];

    if (
      text.includes("react")
    ) {
      technologies.push("react");
    }

    if (
      text.includes("next.js") ||
      text.includes("nextjs")
    ) {
      technologies.push("nextjs");
    }

    if (
      text.includes("node") ||
      text.includes("nodejs")
    ) {
      technologies.push("nodejs");
    }

    if (
      text.includes("html")
    ) {
      technologies.push("html");
    }

    if (
      text.includes("css")
    ) {
      technologies.push("css");
    }

    if (
      text.includes("javascript") ||
      text.includes("جافاسكربت")
    ) {
      technologies.push("javascript");
    }

    if (technologies.length === 0) {
      technologies.push(
        "html",
        "css",
        "javascript"
      );
    }

    return [...new Set(technologies)];
  }


  /* ====================================================
     6. اكتشاف الميزات
  ==================================================== */

  function detectFeatures(prompt) {
    const text = cleanText(prompt).toLowerCase();

    const features = [];

    const rules = [
      {
        keywords: [
          "تسجيل",
          "دخول",
          "login",
          "register",
          "signup",
          "auth"
        ],
        feature: "authentication"
      },

      {
        keywords: [
          "قاعدة بيانات",
          "database",
          "supabase",
          "بيانات"
        ],
        feature: "database"
      },

      {
        keywords: [
          "دفع",
          "الدفع",
          "payment",
          "payments"
        ],
        feature: "payments"
      },

      {
        keywords: [
          "إدارة",
          "admin",
          "مدير",
          "لوحة تحكم"
        ],
        feature: "admin"
      },

      {
        keywords: [
          "بحث",
          "search"
        ],
        feature: "search"
      },

      {
        keywords: [
          "صور",
          "image",
          "images",
          "معرض"
        ],
        feature: "images"
      },

      {
        keywords: [
          "فيديو",
          "video",
          "videos"
        ],
        feature: "video"
      },

      {
        keywords: [
          "ذكاء اصطناعي",
          "ai",
          "ذكاء"
        ],
        feature: "ai"
      },

      {
        keywords: [
          "إشعارات",
          "notification",
          "notifications"
        ],
        feature: "notifications"
      },

      {
        keywords: [
          "رسائل",
          "chat",
          "محادثة"
        ],
        feature: "chat"
      },

      {
        keywords: [
          "ملف شخصي",
          "profile",
          "حساب"
        ],
        feature: "profile"
      }
    ];

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          features.push(rule.feature);
          break;
        }
      }
    }

    return [...new Set(features)];
  }


  /* ====================================================
     7. تحليل الطلب
  ==================================================== */

  function analyzePrompt(prompt) {
    const cleanPrompt = limitText(
      prompt,
      CONFIG.maxPromptLength
    );

    if (!cleanPrompt) {
      throw new Error(
        "لم يتم إدخال طلب."
      );
    }

    return {
      id: createId("analysis"),

      createdAt: now(),

      originalPrompt: cleanPrompt,

      language:
        detectLanguage(cleanPrompt),

      projectType:
        detectProjectType(cleanPrompt),

      technologies:
        detectTechnologies(cleanPrompt),

      features:
        detectFeatures(cleanPrompt),

      complexity:
        estimateComplexity(cleanPrompt)
    };
  }


  /* ====================================================
     8. تقدير تعقيد المشروع
  ==================================================== */

  function estimateComplexity(prompt) {
    const text = cleanText(prompt);

    let score = 0;

    if (text.length > 200) {
      score += 1;
    }

    if (text.length > 500) {
      score += 2;
    }

    if (
      text.includes("تسجيل") ||
      text.includes("دخول") ||
      text.includes("login")
    ) {
      score += 1;
    }

    if (
      text.includes("قاعدة بيانات") ||
      text.includes("database")
    ) {
      score += 2;
    }

    if (
      text.includes("دفع") ||
      text.includes("payment")
    ) {
      score += 2;
    }

    if (
      text.includes("لوحة تحكم") ||
      text.includes("admin")
    ) {
      score += 2;
    }

    if (
      text.includes("ذكاء اصطناعي") ||
      text.includes("AI")
    ) {
      score += 2;
    }

    if (score <= 2) {
      return "simple";
    }

    if (score <= 5) {
      return "medium";
    }

    return "advanced";
  }


  /* ====================================================
     9. إنشاء خطة المشروع
  ==================================================== */

  function createProjectPlan(analysis) {

    const files = [];

    const type =
      analysis.projectType;

    if (
      type === "website" ||
      type === "landing-page" ||
      type === "portfolio" ||
      type === "store" ||
      type === "blog"
    ) {
      files.push(
        "index.html",
        "style.css",
        "app.js"
      );
    }

    if (
      type === "web-app" ||
      type === "dashboard" ||
      type === "saas"
    ) {
      files.push(
        "index.html",
        "style.css",
        "app.js",
        "config.js"
      );
    }

    if (
      analysis.features.includes(
        "authentication"
      )
    ) {
      files.push(
        "auth.js"
      );
    }

    if (
      analysis.features.includes(
        "database"
      )
    ) {
      files.push(
        "database.js"
      );
    }

    if (
      analysis.features.includes(
        "payments"
      )
    ) {
      files.push(
        "payments.js"
      );
    }

    if (
      analysis.features.includes(
        "admin"
      )
    ) {
      files.push(
        "admin.html",
        "admin.js"
      );
    }

    if (
      analysis.features.includes(
        "ai"
      )
    ) {
      files.push(
        "ai.js"
      );
    }

    files.push(
      "README.md"
    );

    return {
      id: createId("plan"),

      createdAt: now(),

      projectType:
        analysis.projectType,

      language:
        analysis.language,

      technologies:
        analysis.technologies,

      features:
        analysis.features,

      complexity:
        analysis.complexity,

      files: [
        ...new Set(files)
      ]
    };
  }


  /* ====================================================
     10. إنشاء تعليمات الذكاء الاصطناعي
  ==================================================== */

  function buildAIPrompt(
    analysis,
    plan
  ) {

    const language =
      analysis.language === "ar"
        ? "العربية"
        : "English";

    return `
أنت NOVA AI ENGINE.

مهمتك تحويل طلب المستخدم إلى مشروع برمجي حقيقي.

لغة الرد:
${language}

نوع المشروع:
${analysis.projectType}

درجة التعقيد:
${analysis.complexity}

التقنيات:
${analysis.technologies.join(", ")}

الميزات المطلوبة:
${
  analysis.features.length
    ? analysis.features.join(", ")
    : "لا توجد ميزات إضافية محددة"
}

الملفات المقترحة:
${plan.files.join("\n")}

طلب المستخدم الأصلي:
${analysis.originalPrompt}

القواعد:

1. لا تستخدم بيانات وهمية على أنها بيانات حقيقية.
2. لا تدّعي تنفيذ شيء لم يتم تنفيذه.
3. اكتب كودًا قابلًا للتنفيذ.
4. اجعل المشروع منظمًا.
5. لا تضع مفاتيح API السرية داخل الواجهة.
6. افصل الواجهة عن الخدمات الخلفية.
7. إذا احتاج المشروع Backend فاذكره بوضوح.
8. إذا كان المشروع كبيرًا فقسمه إلى مراحل.
9. اجعل أسماء الملفات واضحة.
10. لا تحذف متطلبات المستخدم.
11. أعطِ تعليمات تشغيل واضحة.
12. إذا كان هناك خطأ محتمل في الطلب، وضحه بدل اختراع حل.
`;
  }


  /* ====================================================
     11. مدير مزودي الذكاء الاصطناعي
  ==================================================== */

  const providers = [];


  function registerProvider(provider) {

    if (!provider) {
      throw new Error(
        "مزود الذكاء الاصطناعي غير صالح."
      );
    }

    if (
      typeof provider.generate !==
      "function"
    ) {
      throw new Error(
        "يجب أن يحتوي المزود على generate()."
      );
    }

    providers.push(provider);

    return true;
  }


  function getProviders() {
    return [...providers];
  }


  /* ====================================================
     12. استدعاء الذكاء الاصطناعي
  ==================================================== */

  async function generateWithAI(
    aiPrompt,
    options = {}
  ) {

    const available =
      getProviders();

    if (!available.length) {
      throw new Error(
        "لا يوجد مزود ذكاء اصطناعي متصل بالمحرك."
      );
    }

    const errors = [];

    for (
      const provider
      of available
    ) {

      try {

        const result =
          await provider.generate(
            aiPrompt,
            options
          );

        if (
          result !== null &&
          result !== undefined
        ) {

          return {
            success: true,

            provider:
              provider.name ||
              "unknown",

            result
          };
        }

      } catch (error) {

        errors.push({
          provider:
            provider.name ||
            "unknown",

          error:
            error instanceof Error
              ? error.message
              : String(error)
        });
      }
    }

    throw new Error(
      "فشل جميع مزودي الذكاء الاصطناعي: " +
      JSON.stringify(errors)
    );
  }


  /* ====================================================
     13. التحقق من النتيجة
  ==================================================== */

  function validateAIResult(result) {

    const text =
      cleanText(result);

    const problems = [];

    if (!text) {
      problems.push(
        "النتيجة فارغة."
      );
    }

    if (
      text.length < 20
    ) {
      problems.push(
        "النتيجة قصيرة جدًا."
      );
    }

    return {
      valid:
        problems.length === 0,

      problems
    };
  }


  /* ====================================================
     14. إنشاء المشروع
  ==================================================== */

  async function buildProject(
    prompt,
    options = {}
  ) {

    const analysis =
      analyzePrompt(prompt);

    const plan =
      createProjectPlan(
        analysis
      );

    const aiPrompt =
      buildAIPrompt(
        analysis,
        plan
      );

    const aiResult =
      await generateWithAI(
        aiPrompt,
        options
      );

    const validation =
      validateAIResult(
        aiResult.result
      );

    return {

      success:
        validation.valid,

      engine:
        CONFIG.name,

      version:
        CONFIG.version,

      project: {

        id:
          createId("project"),

        prompt:
          analysis.originalPrompt,

        analysis,

        plan,

        ai: aiResult,

        validation
      },

      createdAt:
        now()
    };
  }


  /* ====================================================
     15. الحالة
  ==================================================== */

  function status() {

    return {

      name:
        CONFIG.name,

      version:
        CONFIG.version,

      providers:
        providers.map(
          provider =>
            provider.name ||
            "unknown"
        ),

      providerCount:
        providers.length,

      status:
        providers.length
          ? "ready"
          : "waiting-for-provider"
    };
  }


  /* ====================================================
     16. الواجهة العامة للمحرك
  ==================================================== */

  return {

    CONFIG,

    analyzePrompt,

    createProjectPlan,

    buildAIPrompt,

    registerProvider,

    getProviders,

    generateWithAI,

    validateAIResult,

    buildProject,

    status
  };

})();


/* ========================================================
   تصدير المحرك
======================================================== */

if (
  typeof window !==
  "undefined"
) {

  window.NOVA_ENGINE =
    NOVA_ENGINE;

}


if (
  typeof module !==
  "undefined" &&
  module.exports
) {

  module.exports =
    NOVA_ENGINE;

}
