/* =========================================================
   NOVA ADMIN — ADMIN.JS
   نظام لوحة الإدارة
========================================================= */

(function () {
  "use strict";

  /* =======================================================
     STATE
  ======================================================= */

  const state = {
    currentSection: "overview",
    currentUser: null,
    currentProfile: null,
    projects: [],
    users: [],
    products: [],
    aiRequests: [],
    orders: [],
    complaints: [],
    logs: [],
    announcements: [],
    initialized: false
  };


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => {
    return Array.from(document.querySelectorAll(selector));
  };


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


  function formatDate(date) {
    if (!date) {
      return "غير معروف";
    }

    try {
      return new Date(date).toLocaleString("ar", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "غير معروف";
    }
  }


  function getInitials(text) {
    if (!text) {
      return "N";
    }

    const clean = String(text).trim();

    if (!clean) {
      return "N";
    }

    return clean.charAt(0).toUpperCase();
  }


  function safeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  /* =======================================================
     TOAST
  ======================================================= */

  let toastTimer = null;


  function showToast(message, type = "success") {
    const toast = $("#toast");
    const toastMessage = $("#toastMessage");
    const toastIcon = $("#toastIcon");

    if (!toast) {
      return;
    }

    if (toastMessage) {
      toastMessage.textContent = message;
    }

    if (toastIcon) {
      toastIcon.textContent =
        type === "error"
          ? "!"
          : type === "warning"
          ? "!"
          : "✓";
    }

    toast.classList.remove(
      "success",
      "error",
      "warning"
    );

    toast.classList.add(type);
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }


  /* =======================================================
     MODAL
  ======================================================= */

  function openModal(content) {
    const overlay = $("#modalOverlay");
    const modalContent = $("#modalContent");

    if (!overlay || !modalContent) {
      return;
    }

    modalContent.innerHTML = content;

    overlay.classList.remove("hidden");

    document.body.style.overflow = "hidden";
  }


  function closeModal() {
    const overlay = $("#modalOverlay");

    if (!overlay) {
      return;
    }

    overlay.classList.add("hidden");

    document.body.style.overflow = "";
  }


  /* =======================================================
     SIDEBAR
  ======================================================= */

  function openSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");

    sidebar?.classList.add("open");
    overlay?.classList.add("show");
  }


  function closeSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");

    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  }


  /* =======================================================
     SECTION INFORMATION
  ======================================================= */

  const sectionInfo = {
    overview: {
      title: "لوحة الإدارة",
      description: "إدارة منصة NOVA بالكامل"
    },

    users: {
      title: "المستخدمون",
      description: "إدارة حسابات مستخدمي NOVA"
    },

    projects: {
      title: "المشاريع",
      description: "إدارة المشاريع التي ينشئها المستخدمون"
    },

    products: {
      title: "المنتجات والنسخ",
      description: "إدارة النسخ المجانية والمدفوعة"
    },

    ai: {
      title: "طلبات الذكاء الاصطناعي",
      description: "مراقبة عمليات توليد التطبيقات"
    },

    orders: {
      title: "الطلبات والمدفوعات",
      description: "إدارة عمليات شراء المنتجات"
    },

    support: {
      title: "الدعم",
      description: "إدارة وسائل وروابط الدعم"
    },

    complaints: {
      title: "الشكاوى",
      description: "متابعة شكاوى المستخدمين"
    },

    content: {
      title: "محتوى الصفحات",
      description: "إدارة محتوى صفحات NOVA"
    },

    announcements: {
      title: "الإعلانات والعروض",
      description: "إدارة الإعلانات والعروض"
    },

    settings: {
      title: "إعدادات المنصة",
      description: "التحكم بالإعدادات العامة"
    },

    logs: {
      title: "سجل العمليات",
      description: "سجل العمليات المهمة في المنصة"
    }
  };


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function switchSection(sectionName) {
    if (!sectionInfo[sectionName]) {
      return;
    }

    state.currentSection = sectionName;

    $$(".admin-section").forEach((section) => {
      section.classList.remove("active-section");
    });

    const target = $(`#section-${sectionName}`);

    if (target) {
      target.classList.add("active-section");
    }

    $$(".nav-item").forEach((item) => {
      item.classList.remove("active");

      if (item.dataset.section === sectionName) {
        item.classList.add("active");
      }
    });

    const info = sectionInfo[sectionName];

    const title = $("#pageTitle");
    const description = $("#pageDescription");

    if (title) {
      title.textContent = info.title;
    }

    if (description) {
      description.textContent = info.description;
    }

    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    loadSectionData(sectionName);
  }


  /* =======================================================
     SUPABASE CHECK
  ======================================================= */

  function getSupabase() {
    if (window.NOVA_SUPABASE) {
      return window.NOVA_SUPABASE;
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    return null;
  }


  /* =======================================================
     AUTH
  ======================================================= */

  async function getCurrentUser() {
    try {
      if (
        window.NOVA_AUTH &&
        typeof window.NOVA_AUTH.getUser === "function"
      ) {
        return await window.NOVA_AUTH.getUser();
      }
    } catch (error) {
      console.error(
        "NOVA admin auth error:",
        error
      );
    }

    try {
      const client = getSupabase();

      if (!client) {
        return null;
      }

      const result =
        await client.auth.getUser();

      return result?.data?.user || null;

    } catch (error) {
      console.error(error);

      return null;
    }
  }


  async function getProfile(userId) {
    try {
      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.getProfile === "function"
      ) {
        return await window.NOVA_DB.getProfile(userId);
      }
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );
    }

    try {
      const client = getSupabase();

      if (!client || !userId) {
        return null;
      }

      const result =
        await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

      if (result.error) {
        console.error(result.error);
        return null;
      }

      return result.data;

    } catch (error) {
      console.error(error);

      return null;
    }
  }


  /* =======================================================
     ADMIN SECURITY
  ======================================================= */

  function isAdmin(profile) {
    if (!profile) {
      return false;
    }

    const role = String(
      profile.role || ""
    ).toLowerCase();

    return role === "admin" ||
           role === "administrator" ||
           role === "super_admin";
  }


  async function protectAdmin() {
    state.currentUser =
      await getCurrentUser();

    if (!state.currentUser) {
      redirectToLogin(
        "يجب تسجيل الدخول أولًا."
      );

      return false;
    }

    state.currentProfile =
      await getProfile(
        state.currentUser.id
      );

    if (!isAdmin(state.currentProfile)) {
      showAccessDenied();

      return false;
    }

    return true;
  }


  function redirectToLogin(message) {
    if (message) {
      console.warn(message);
    }

    const loginUrl =
      "login.html?redirect=admin.html";

    window.location.href = loginUrl;
  }


  function showAccessDenied() {
    const loading =
      $("#loadingScreen");

    if (loading) {
      loading.innerHTML = `
        <div class="loading-box">

          <div style="
            font-size:55px;
            margin-bottom:15px;
          ">
            🔒
          </div>

          <h2>
            لا يوجد لديك صلاحية
          </h2>

          <p style="
            margin:15px 0;
          ">
            هذه الصفحة مخصصة لمدير المنصة فقط.
          </p>

          <button
            type="button"
            class="primary-button"
            onclick="window.location.href='index.html'">

            العودة إلى الرئيسية

          </button>

        </div>
      `;
    }
  }


  /* =======================================================
     ADMIN PROFILE UI
  ======================================================= */

  function renderAdminProfile() {
    const user = state.currentUser;
    const profile = state.currentProfile;

    const email =
      user?.email ||
      profile?.email ||
      "admin";

    const name =
      profile?.full_name ||
      profile?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "مدير NOVA";

    const nameElement =
      $("#adminName");

    const emailElement =
      $("#adminEmail");

    const avatar =
      $("#adminAvatar");

    if (nameElement) {
      nameElement.textContent = name;
    }

    if (emailElement) {
      emailElement.textContent = email;
    }

    if (avatar) {
      avatar.textContent =
        getInitials(name);
    }
  }


  /* =======================================================
     DASHBOARD VISIBILITY
  ======================================================= */

  function showDashboard() {
    const loading =
      $("#loadingScreen");

    const dashboard =
      $("#dashboard");

    loading?.classList.add("hidden");

    dashboard?.classList.remove("hidden");
  }


  /* =======================================================
     DATABASE HELPERS
  ======================================================= */

  async function fetchTable(
    tableName,
    columns = "*",
    limit = 100
  ) {
    const client = getSupabase();

    if (!client) {
      return [];
    }

    try {
      const result =
        await client
          .from(tableName)
          .select(columns)
          .limit(limit);

      if (result.error) {
        console.error(
          `Error loading ${tableName}:`,
          result.error
        );

        return [];
      }

      return result.data || [];

    } catch (error) {
      console.error(error);

      return [];
    }
  }


  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  async function loadDashboardData() {
    await Promise.all([
      loadProjects(),
      loadAIRequests(),
      loadOrders(),
      loadLogs()
    ]);

    updateStatistics();

    renderRecentProjects();

    renderRecentLogs();
  }


  /* =======================================================
     PROJECTS
  ======================================================= */

  async function loadProjects() {
    try {
      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.getProjects === "function"
      ) {
        const result =
          await window.NOVA_DB.getProjects();

        state.projects =
          Array.isArray(result)
            ? result
            : result?.data || [];

        return;
      }
    } catch (error) {
      console.error(
        "Projects error:",
        error
      );
    }

    state.projects =
      await fetchTable(
        "projects",
        "*",
        200
      );
  }


  function renderRecentProjects() {
    const container =
      $("#recentProjects");

    if (!container) {
      return;
    }

    if (!state.projects.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد مشاريع لعرضها حاليًا.
        </div>
      `;

      return;
    }

    const items =
      state.projects
        .slice(0, 5)
        .map((project) => {

          const name =
            project.name ||
            project.title ||
            "مشروع بدون اسم";

          return `
            <div class="activity-item">

              <div class="activity-icon">
                📁
              </div>

              <div class="activity-info">

                <strong>
                  ${escapeHTML(name)}
                </strong>

                <span>
                  ${formatDate(
                    project.created_at ||
                    project.updated_at
                  )}
                </span>

              </div>

            </div>
          `;

        })
        .join("");

    container.innerHTML = items;
  }


  function renderProjects() {
    const grid =
      $("#projectsGrid");

    if (!grid) {
      return;
    }

    if (!state.projects.length) {
      grid.innerHTML = `
        <div class="empty-state large">
          لا توجد مشاريع حاليًا.
        </div>
      `;

      return;
    }

    grid.innerHTML =
      state.projects.map((project) => {

        const name =
          project.name ||
          project.title ||
          "مشروع بدون اسم";

        const description =
          project.description ||
          "لا يوجد وصف للمشروع.";

        const status =
          project.status ||
          "draft";

        let badgeClass =
          "badge-warning";

        let statusText =
          "مسودة";

        if (status === "active") {
          badgeClass = "badge-success";
          statusText = "نشط";
        }

        if (status === "archived") {
          badgeClass = "badge-danger";
          statusText = "مؤرشف";
        }

        return `
          <article class="project-card">

            <div class="card-top">

              <div class="card-icon">
                📁
              </div>

              <span class="badge ${badgeClass}">
                ${statusText}
              </span>

            </div>

            <h3 class="card-title">
              ${escapeHTML(name)}
            </h3>

            <p class="card-description">
              ${escapeHTML(description)}
            </p>

            <div class="card-meta">

              <span>
                ${escapeHTML(
                  project.framework ||
                  "غير محدد"
                )}
              </span>

              <span>
                ${formatDate(
                  project.updated_at ||
                  project.created_at
                )}
              </span>

            </div>

            <div class="card-actions">

              <button
                type="button"
                class="secondary-button"
                data-project-action="view"
                data-project-id="${escapeHTML(
                  project.id
                )}">

                عرض

              </button>

              <button
                type="button"
                class="secondary-button"
                data-project-action="delete"
                data-project-id="${escapeHTML(
                  project.id
                )}">

                حذف

              </button>

            </div>

          </article>
        `;

      }).join("");
  }


  /* =======================================================
     AI REQUESTS
  ======================================================= */

  async function loadAIRequests() {
    state.aiRequests =
      await fetchTable(
        "ai_requests",
        "*",
        200
      );
  }


  function renderAIRequests() {
    const table =
      $("#aiTable");

    if (!table) {
      return;
    }

    if (!state.aiRequests.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              لا توجد طلبات حاليًا.
            </div>
          </td>
        </tr>
      `;

      updateAIStats();

      return;
    }

    table.innerHTML =
      state.aiRequests.map((request) => {

        const status =
          String(
            request.status || "pending"
          ).toLowerCase();

        let badge =
          "badge-warning";

        let statusText =
          "قيد الانتظار";

        if (
          status === "completed" ||
          status === "success"
        ) {
          badge = "badge-success";
          statusText = "مكتمل";
        }

        if (
          status === "failed" ||
          status === "error"
        ) {
          badge = "badge-danger";
          statusText = "فشل";
        }

        if (
          status === "processing"
        ) {
          badge = "badge-info";
          statusText = "قيد التنفيذ
