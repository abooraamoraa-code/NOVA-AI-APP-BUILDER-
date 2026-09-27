"use strict";

/*
=========================================================
NOVA AUTH
نظام تسجيل الدخول وإنشاء الحساب باستخدام Supabase
=========================================================
*/

window.NOVA_AUTH = {

    async register(email, password, name) {

        try {

            if (!window.NOVA_SUPABASE) {
                throw new Error(
                    "Supabase غير متصل."
                );
            }

            if (!email || !password) {
                throw new Error(
                    "أدخل البريد الإلكتروني وكلمة المرور."
                );
            }

            if (password.length < 6) {
                throw new Error(
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
                );
            }

            const {
                data,
                error
            } =
                await window.NOVA_SUPABASE.auth.signUp({

                    email: email.trim(),

                    password: password,

                    options: {

                        data: {
                            full_name:
                                name || ""
                        }

                    }

                });

            if (error) {
                throw error;
            }

            console.log(
                "NOVA: account created",
                data
            );

            return {
                success: true,
                data: data
            };

        } catch (error) {

            console.error(
                "NOVA register error:",
                error
            );

            return {
                success: false,
                error: error.message
            };
        }
    },


    async login(email, password) {

        try {

            if (!window.NOVA_SUPABASE) {
                throw new Error(
                    "Supabase غير متصل."
                );
            }

            if (!email || !password) {
                throw new Error(
                    "أدخل البريد الإلكتروني وكلمة المرور."
                );
            }

            const {
                data,
                error
            } =
                await window.NOVA_SUPABASE.auth
                    .signInWithPassword({

                        email:
                            email.trim(),

                        password:
                            password

                    });

            if (error) {
                throw error;
            }

            console.log(
                "NOVA: login successful"
            );

            window.NOVA.state.user =
                data.user;

            return {
                success: true,
                user: data.user,
                session: data.session
            };

        } catch (error) {

            console.error(
                "NOVA login error:",
                error
            );

            return {
                success: false,
                error: error.message
            };
        }
    },


    async logout() {

        try {

            if (!window.NOVA_SUPABASE) {
                return {
                    success: false,
                    error:
                        "Supabase غير متصل."
                };
            }

            const {
                error
            } =
                await window.NOVA_SUPABASE.auth
                    .signOut();

            if (error) {
                throw error;
            }

            window.NOVA.state.user = null;

            return {
                success: true
            };

        } catch (error) {

            console.error(
                "NOVA logout error:",
                error
            );

            return {
                success: false,
                error: error.message
            };
        }
    },


    async getUser() {

        try {

            if (!window.NOVA_SUPABASE) {
                return null;
            }

            const {
                data,
                error
            } =
                await window.NOVA_SUPABASE.auth
                    .getUser();

            if (error) {
                console.warn(
                    "NOVA getUser:",
                    error.message
                );

                return null;
            }

            if (data.user) {

                window.NOVA.state.user =
                    data.user;

            }

            return data.user || null;

        } catch (error) {

            console.error(
                "NOVA user error:",
                error
            );

            return null;
        }
    },


    async getSession() {

        try {

            if (!window.NOVA_SUPABASE) {
                return null;
            }

            const {
                data,
                error
            } =
                await window.NOVA_SUPABASE.auth
                    .getSession();

            if (error) {
                console.warn(
                    "NOVA session error:",
                    error.message
                );

                return null;
            }

            return data.session || null;

        } catch (error) {

            console.error(
                "NOVA session error:",
                error
            );

            return null;
        }
    },


    onAuthChange(callback) {

        if (!window.NOVA_SUPABASE) {
            console.warn(
                "Supabase غير متصل."
            );

            return null;
        }

        const {
            data
        } =
            window.NOVA_SUPABASE.auth
                .onAuthStateChange(
                    (event, session) => {

                        console.log(
                            "NOVA Auth:",
                            event
                        );

                        if (session) {

                            window.NOVA.state.user =
                                session.user;

                        } else {

                            window.NOVA.state.user =
                                null;
                        }

                        if (
                            typeof callback ===
                            "function"
                        ) {

                            callback(
                                event,
                                session
                            );
                        }

                    }
                );

        return data.subscription;
    },


    isLoggedIn() {

        return Boolean(
            window.NOVA &&
            window.NOVA.state &&
            window.NOVA.state.user
        );
    }

};


/*
=========================================================
INITIAL AUTH CHECK
=========================================================
*/

window.addEventListener(
    "nova:supabase-ready",
    async function () {

        const user =
            await window.NOVA_AUTH
                .getUser();

        if (user) {

            console.log(
                "NOVA: المستخدم مسجل الدخول:",
                user.email
            );

        } else {

            console.log(
                "NOVA: لا يوجد مستخدم مسجل الدخول."
            );
        }

    }
);


/*
=========================================================
END NOVA AUTH
=========================================================
*/
