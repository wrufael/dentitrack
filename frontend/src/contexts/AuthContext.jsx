// src/contexts/AuthContext.jsx

import React, {
    createContext,
    useState,
    useContext,
    useEffect,
} from "react";

import api from "../api/axios";


// ============================================================
// AUTH CONTEXT
// ============================================================

const AuthContext = createContext(null);


// ============================================================
// ROLE PERMISSIONS
// ============================================================

const ROLE_PERMISSIONS = {
    platform_admin: [
        "view_all",
        "manage_clinics",
        "manage_subscriptions",
        "view_analytics",
    ],

    owner: [
        "manage_patients",
        "manage_doctors",
        "manage_cashiers",
        "manage_appointments",
        "manage_payments",
        "manage_inventory",
        "manage_expenses",
        "view_reports",
    ],

    doctor: [
        "view_patients",
        "create_payment_requests",
        "view_payments",
        "manage_appointments",
    ],

    cashier: [
        "view_patients",
        "collect_payments",
        "register_patients",
    ],

    nurse: [
        "view_patients",
        "view_appointments",
    ],

    receptionist: [
        "view_patients",
        "manage_appointments",
    ],

    lab_technician: [
        "view_patients",
        "view_appointments",
    ],
};


// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({ children }) => {

    // --------------------------------------------------------
    // STATE
    // --------------------------------------------------------

    const [user, setUser] = useState(null);

    const [isAuthenticated, setIsAuthenticated] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [role, setRole] =
        useState(null);

    const [permissions, setPermissions] =
        useState([]);

    const [accessibleModules, setAccessibleModules] =
        useState([]);

    const [clinicStatus, setClinicStatus] =
        useState("active");


    // ========================================================
    // SET AUTHENTICATED USER
    // ========================================================

    const setAuthenticatedUser = (userData) => {

        if (!userData) {
            setUser(null);
            setRole(null);
            setPermissions([]);
            setAccessibleModules([]);
            setClinicStatus("active");
            setIsAuthenticated(false);

            return;
        }

        setUser(userData);

        setRole(userData.role || null);

        setClinicStatus(
            userData.clinic_status || "active"
        );

        // Set permissions from backend (new permission system)
        setPermissions(
            userData.permissions && userData.permissions.length > 0
                ? userData.permissions
                : ROLE_PERMISSIONS[userData.role] || []
        );

        // Set accessible modules from backend
        setAccessibleModules(
            userData.accessible_modules || []
        );

        setIsAuthenticated(true);
    };


    // ========================================================
    // FETCH USER WHEN APP STARTS
    // ========================================================

    useEffect(() => {

        const token = localStorage.getItem("token");

        console.log(
            "🔐 AUTH START:",
            token ? "TOKEN FOUND" : "NO TOKEN"
        );

        if (!token) {
            setLoading(false);
            return;
        }

        // Set Authorization header immediately
        api.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;

        fetchUser();

    }, []);


    // ========================================================
    // FETCH CURRENT USER
    // ========================================================

    const fetchUser = async () => {

        try {

            const token = localStorage.getItem("token");

            if (!token) {

                console.log(
                    "❌ fetchUser(): No token"
                );

                setAuthenticatedUser(null);

                return;
            }

            console.log(
                "🔐 fetchUser(): Checking authentication..."
            );

            const response = await api.get("/user");

            const userData = response.data;

            console.log(
                "✅ Authenticated user:",
                userData
            );

            // Save latest user
            localStorage.setItem(
                "user",
                JSON.stringify(userData)
            );

            setAuthenticatedUser(userData);

        } catch (error) {

            console.error(
                "❌ Failed to fetch authenticated user:",
                error.response?.data || error
            );

            // Authentication failed
            if (
                error.response?.status === 401 ||
                error.response?.status === 419
            ) {

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                delete api.defaults.headers.common[
                    "Authorization"
                ];

                setAuthenticatedUser(null);
            }

        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // LOGIN
    // ========================================================

    const login = async (
        email,
        password
    ) => {

        try {

            console.log(
                "🔐 Logging in:",
                { email }
            );

            const response = await api.post(
                "/login",
                {
                    email,
                    password,
                }
            );

            console.log(
                "✅ LOGIN RESPONSE:",
                response.data
            );


            // ------------------------------------------------
            // Get token and user
            // ------------------------------------------------

            const token =
                response.data?.token;

            const userData =
                response.data?.user;


            // ------------------------------------------------
            // Make sure Laravel returned token
            // ------------------------------------------------

            if (!token) {

                console.error(
                    "❌ Laravel did not return a Sanctum token.",
                    response.data
                );

                return {
                    success: false,
                    message:
                        "Login succeeded, but the server did not return an authentication token.",
                };
            }


            // ------------------------------------------------
            // Make sure Laravel returned user
            // ------------------------------------------------

            if (!userData) {

                console.error(
                    "❌ Laravel did not return user data.",
                    response.data
                );

                return {
                    success: false,
                    message:
                        "Login succeeded, but the server did not return user information.",
                };
            }


            // =================================================
            // SAVE TOKEN
            // =================================================

            localStorage.setItem(
                "token",
                token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(userData)
            );


            // =================================================
            // SET AXIOS AUTHORIZATION
            // =================================================

            api.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${token}`;


            console.log(
                "✅ Sanctum token saved successfully."
            );

            console.log(
                "🔐 Token:",
                token.substring(0, 15) + "..."
            );


            // =================================================
            // UPDATE AUTH STATE
            // =================================================

            setAuthenticatedUser(
                userData
            );


            // =================================================
            // RETURN SUCCESS
            // =================================================

            return {
                success: true,
                user: userData,
                token: token,
            };


        } catch (error) {

            console.error(
                "❌ Login error:",
                error.response?.data || error
            );


            // =================================================
            // PENDING APPROVAL
            // =================================================

            if (
                error.response?.status === 403 &&
                error.response?.data?.requires_approval
            ) {

                const status =
                    error.response?.data?.status ||
                    "pending";

                setClinicStatus(status);

                return {
                    success: false,

                    message:
                        error.response?.data?.message ||
                        "Account pending approval.",

                    requiresApproval: true,

                    status: status,
                };
            }


            // =================================================
            // VALIDATION ERROR
            // =================================================

            if (
                error.response?.status === 422
            ) {

                return {
                    success: false,

                    message:
                        error.response?.data?.message ||
                        "Please check your login information.",

                    errors:
                        error.response?.data?.errors ||
                        {},
                };
            }


            // =================================================
            // INVALID CREDENTIALS
            // =================================================

            if (
                error.response?.status === 401
            ) {

                return {
                    success: false,

                    message:
                        error.response?.data?.message ||
                        "Invalid email or password.",
                };
            }


            // =================================================
            // SERVER ERROR
            // =================================================

            return {
                success: false,

                message:
                    error.response?.data?.message ||
                    (
                        error.code === "ERR_NETWORK"
                            ? "Cannot reach the server. Please check that Laravel is running."
                            : "Login failed. Please try again."
                    ),
            };
        }
    };


    // ========================================================
    // LOGOUT
    // ========================================================

    const logout = async () => {

        try {

            const token =
                localStorage.getItem("token");

            if (token) {

                await api.post(
                    "/logout"
                );
            }

        } catch (error) {

            console.log(
                "Logout error ignored:",
                error.response?.data || error
            );

        } finally {

            // ------------------------------------------------
            // Remove local authentication
            // ------------------------------------------------

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );


            // ------------------------------------------------
            // Remove Axios authorization
            // ------------------------------------------------

            delete api.defaults.headers.common[
                "Authorization"
            ];


            // ------------------------------------------------
            // Reset state
            // ------------------------------------------------

            setUser(null);

            setRole(null);

            setIsAuthenticated(false);

            setPermissions([]);

            setClinicStatus("active");
        }
    };


    // ========================================================
    // UPDATE USER
    // ========================================================

    const updateUser = (updatedData) => {

        setUser((previousUser) => {

            const newUser = {
                ...previousUser,
                ...updatedData,
            };

            localStorage.setItem(
                "user",
                JSON.stringify(newUser)
            );

            return newUser;
        });
    };


    // ========================================================
    // CLINIC APPROVED
    // ========================================================

    const isClinicApproved = () => {

        return (
            clinicStatus === "approved" ||
            clinicStatus === "active"
        );
    };


    // ========================================================
    // CLINIC PENDING
    // ========================================================

    const isClinicPending = () => {

        return clinicStatus === "pending";
    };


    // ========================================================
    // CLINIC REJECTED
    // ========================================================

    const isClinicRejected = () => {

        return clinicStatus === "rejected";
    };


    // ========================================================
    // CHECK IF MODULE IS ACCESSIBLE
    // ========================================================

    const canAccessModule = (moduleKey) => {

        if (!user) {
            return false;
        }

        // Platform admin and owner have access to everything
        if (user.role === "platform_admin" || user.role === "owner") {
            return true;
        }

        // Check if module is in accessible modules list
        return accessibleModules.some(
            (module) => module.key === moduleKey
        );
    };


    // ========================================================
    // CHECK PERMISSION
    // ========================================================

    const hasPermission = (permission) => {

        if (!user) {
            return false;
        }

        // Platform admin has everything
        if (
            user.role === "platform_admin"
        ) {
            return true;
        }

        // No permission requested
        if (!permission) {
            return true;
        }

        // Multiple possible permissions
        if (Array.isArray(permission)) {

            return permission.some(
                (p) =>
                    permissions.includes(p)
            );
        }

        return permissions.includes(
            permission
        );
    };


    // ========================================================
    // CHECK ROLE
    // ========================================================

    const hasRole = (allowedRoles) => {

        if (!user) {
            return false;
        }

        if (
            !allowedRoles ||
            allowedRoles.length === 0
        ) {
            return true;
        }

        if (
            typeof allowedRoles === "string"
        ) {

            return (
                user.role === allowedRoles
            );
        }

        return allowedRoles.includes(
            user.role
        );
    };


    // ========================================================
    // USER DISPLAY NAME
    // ========================================================

    const getUserDisplayName = () => {

        if (!user) {
            return "Guest";
        }

        return (
            user.name ||
            user.email ||
            "User"
        );
    };


    // ========================================================
    // USER INITIALS
    // ========================================================

    const getUserInitials = () => {

        if (
            !user ||
            !user.name
        ) {
            return "U";
        }

        return user.name
            .split(" ")
            .filter(Boolean)
            .map(
                (name) => name[0]
            )
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };


    // ========================================================
    // ROLE LABEL
    // ========================================================

    const getRoleLabel = () => {

        const labels = {

            platform_admin:
                "Platform Admin",

            owner:
                "Clinic Owner",

            doctor:
                "Doctor",

            cashier:
                "Cashier",

            nurse:
                "Nurse",

            receptionist:
                "Receptionist",

            lab_technician:
                "Lab Technician",
        };

        return (
            labels[role] ||
            role ||
            "User"
        );
    };


    // ========================================================
    // CONTEXT VALUE
    // ========================================================

    const value = {

        // User
        user,

        // Authentication
        isAuthenticated,
        loading,

        // Role
        role,

        // Permissions
        permissions,
        accessibleModules,

        // Clinic
        clinicStatus,

        // Authentication functions
        login,
        logout,
        fetchUser,

        // User functions
        updateUser,

        // Clinic functions
        isClinicApproved,
        isClinicPending,
        isClinicRejected,

        // Permission functions
        hasPermission,
        hasRole,
        canAccessModule,

        // Display helpers
        getUserDisplayName,
        getUserInitials,
        getRoleLabel,
    };


    // ========================================================
    // PROVIDER
    // ========================================================

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


// ============================================================
// USE AUTH HOOK
// ============================================================

export const useAuth = () => {

    const context =
        useContext(AuthContext);

    if (!context) {

        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }

    return context;
};