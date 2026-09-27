/* =========================================================
   NOVA DATABASE
   Supabase Database Layer
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       انتظار Supabase
    ===================================================== */

    function getSupabase() {

        if (!window.NOVA_SUPABASE) {

            throw new Error(
                "Supabase غير جاهز بعد."
            );

        }

        return window.NOVA_SUPABASE;

    }


    /* =====================================================
       الحصول على المستخدم الحالي
    ===================================================== */

    async function getCurrentUser() {

        const supabase =
            getSupabase();

        const {
            data,
            error
        } = await supabase.auth.getUser();


        if (error) {

            throw error;

        }


        return data.user || null;

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    async function getProfile() {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "المستخدم غير مسجل الدخول."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       تحديث PROFILE
    ===================================================== */

    async function updateProfile(values) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "المستخدم غير مسجل الدخول."
                )
            };

        }


        const updateData = {
            ...values,
            id: user.id,
            updated_at: new Date().toISOString()
        };


        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id)
            .select()
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       إنشاء مشروع
    ===================================================== */

    async function createProject(options = {}) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const project = {

            user_id: user.id,

            name:
                options.name ||
                "مشروع NOVA جديد",

            description:
                options.description ||
                "",

            status:
                options.status ||
                "draft",

            framework:
                options.framework ||
                "html",

            metadata:
                options.metadata ||
                {}

        };


        const {
            data,
            error
        } = await supabase
            .from("projects")
            .insert(project)
            .select()
            .single();


        return {
            data,
            error
        };

    }


    /* =====================================================
       الحصول على جميع مشاريع المستخدم
    ===================================================== */

    async function getProjects() {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: [],
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        return {
            data: data || [],
            error
        };

    }


    /* =====================================================
       مشروع واحد
    ===================================================== */

    async function getProject(projectId) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        if (!projectId) {

            return {
                data: null,
                error: new Error(
                    "معرّف المشروع غير موجود."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("user_id", user.id)
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       تحديث مشروع
    ===================================================== */

    async function updateProject(
        projectId,
        values = {}
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        if (!projectId) {

            return {
                data: null,
                error: new Error(
                    "معرّف المشروع غير موجود."
                )
            };

        }


        const updateData = {
            ...values,
            updated_at:
                new Date().toISOString()
        };


        const {
            data,
            error
        } = await supabase
            .from("projects")
            .update(updateData)
            .eq("id", projectId)
            .eq("user_id", user.id)
            .select()
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       حذف مشروع
    ===================================================== */

    async function deleteProject(projectId) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        if (!projectId) {

            return {
                error: new Error(
                    "معرّف المشروع غير موجود."
                )
            };

        }


        const {
            error
        } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId)
            .eq("user_id", user.id);


        return {
            error
        };

    }


    /* =====================================================
       PROJECT FILES
    ===================================================== */

    async function getProjectFiles(
        projectId
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: [],
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("project_files")
            .select("*")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        return {
            data: data || [],
            error
        };

    }


    /* =====================================================
       إنشاء ملف مشروع
    ===================================================== */

    async function createProjectFile(
        options = {}
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const file = {

            project_id:
                options.project_id,

            user_id:
                user.id,

            file_name:
                options.file_name ||
                "index.html",

            file_path:
                options.file_path ||
                options.file_name ||
                "index.html",

            content:
                options.content ||
                "",

            language:
                options.language ||
                detectLanguage(
                    options.file_name ||
                    "index.html"
                )

        };


        const {
            data,
            error
        } = await supabase
            .from("project_files")
            .insert(file)
            .select()
            .single();


        return {
            data,
            error
        };

    }


    /* =====================================================
       تحديث ملف مشروع
    ===================================================== */

    async function updateProjectFile(
        fileId,
        values = {}
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("project_files")
            .update({
                ...values,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", fileId)
            .eq("user_id", user.id)
            .select()
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       حذف ملف
    ===================================================== */

    async function deleteProjectFile(
        fileId
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const {
            error
        } = await supabase
            .from("project_files")
            .delete()
            .eq("id", fileId)
            .eq("user_id", user.id);


        return {
            error
        };

    }


    /* =====================================================
       البحث عن مشروع
    ===================================================== */

    async function searchProjects(
        searchText
    ) {

        const projectsResult =
            await getProjects();


        if (projectsResult.error) {

            return projectsResult;

        }


        const query =
            String(
                searchText || ""
            )
            .trim()
            .toLowerCase();


        if (!query) {

            return {
                data: projectsResult.data,
                error: null
            };

        }


        const filtered =
            projectsResult.data.filter(
                function (project) {

                    const name =
                        String(
                            project.name || ""
                        )
                        .toLowerCase();

                    const description =
                        String(
                            project.description || ""
                        )
                        .toLowerCase();


                    return (
                        name.includes(query) ||
                        description.includes(query)
                    );

                }
            );


        return {
            data: filtered,
            error: null
        };

    }


    /* =====================================================
       لغة الملف
    ===================================================== */

    function detectLanguage(
        fileName
    ) {

        const name =
            String(fileName || "")
                .toLowerCase();


        if (name.endsWith(".html")) {
            return "html";
        }

        if (name.endsWith(".css")) {
            return "css";
        }

        if (
            name.endsWith(".js") ||
            name.endsWith(".mjs")
        ) {
            return "javascript";
        }

        if (name.endsWith(".json")) {
            return "json";
        }

        if (name.endsWith(".ts")) {
            return "typescript";
        }

        if (name.endsWith(".jsx")) {
            return "javascript";
        }

        if (name.endsWith(".tsx")) {
            return "typescript";
        }

        if (name.endsWith(".py")) {
            return "python";
        }

        if (name.endsWith(".sql")) {
            return "sql";
        }

        if (name.endsWith(".md")) {
            return "markdown";
        }

        return "text";

    }


    /* =====================================================
       أدوات مساعدة
    ===================================================== */

    async function countProjects() {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                count: 0,
                error: new Error(
                    "المستخدم غير مسجل الدخول."
                )
            };

        }


        const {
            count,
            error
        } = await supabase
            .from("projects")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq("user_id", user.id);


        return {
            count: count || 0,
            error
        };

    }


    /* =====================================================
       سجل طلب AI
    ===================================================== */

    async function createAIRequest(
        options = {}
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const request = {

            user_id:
                user.id,

            project_id:
                options.project_id ||
                null,

            prompt:
                options.prompt ||
                "",

            provider:
                options.provider ||
                null,

            status:
                options.status ||
                "pending",

            metadata:
                options.metadata ||
                {}

        };


        const {
            data,
            error
        } = await supabase
            .from("ai_requests")
            .insert(request)
            .select()
            .single();


        return {
            data,
            error
        };

    }


    /* =====================================================
       تحديث طلب AI
    ===================================================== */

    async function updateAIRequest(
        requestId,
        values = {}
    ) {

        const supabase =
            getSupabase();

        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data: null,
                error: new Error(
                    "يجب تسجيل الدخول أولاً."
                )
            };

        }


        const {
            data,
            error
        } = await supabase
            .from("ai_requests")
            .update({
                ...values,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", requestId)
            .eq("user_id", user.id)
            .select()
            .maybeSingle();


        return {
            data,
            error
        };

    }


    /* =====================================================
       تصدير API
    ===================================================== */

    window.NOVA_DB = {

        getCurrentUser,

        getProfile,
        updateProfile,

        createProject,
        getProjects,
        getProject,
        updateProject,
        deleteProject,
        searchProjects,
        countProjects,

        getProjectFiles,
        createProjectFile,
        updateProjectFile,
        deleteProjectFile,

        createAIRequest,
        updateAIRequest,

        detectLanguage

    };


    /* =====================================================
       جاهزية قاعدة البيانات
    ===================================================== */

    function announceReady() {

        window.NOVA_DATABASE_READY = true;

        document.dispatchEvent(
            new CustomEvent(
                "nova:database-ready"
            )
        );

    }


    if (window.NOVA_SUPABASE) {

        announceReady();

    } else {

        document.addEventListener(
            "nova:supabase-ready",
            announceReady,
            {
                once: true
            }
        );

    }


})();
