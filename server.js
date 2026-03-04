const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static("public"));

app.set("view engine", "ejs");

const API = process.env.API_BASE_URL + "/api";


// ================= LOGIN PAGE =================

app.get("/login", (req, res) => {

    res.render("login");

});


// ================= LOGIN ACTION =================

app.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const response = await axios.post(`${API}/auth/login`, {
            username,
            password
        });

        const data = response.data;

        console.log(data);

        if (data.mfa_required) {

            res.cookie("mfa_user_id", data.user_id, {
                httpOnly: true
            });

            return res.redirect("/mfa");
        }

        // store token
        res.cookie("token", data.access_token, {
            httpOnly: true
        });

        // store user_id also
        res.cookie("user_id", data.user_id, {
            httpOnly: true
        });

        res.cookie("user_name", username, {
            httpOnly: true
        });

        // store mfa_enabled also
        res.cookie("mfa_enabled", data.mfa_enabled, {
            httpOnly: true,
            sameSite: "lax"
        });


        res.redirect("/");

    } catch {

        res.render("login", {
            error: "Invalid credentials"
        });

    }

});



// ================= MFA PAGE =================

app.get("/mfa", (req, res) => {

    res.render("mfa");

});


// ================= MFA VERIFY =================

app.post("/mfa", async (req, res) => {

    try {

        const otp = req.body.otp;

        const user_id = req.cookies.mfa_user_id;

        const response = await axios.post(`${API}/auth/verify-mfa/${user_id}`, {
            otp
        });

        res.clearCookie("mfa_user_id");

        res.cookie("token", response.data.access_token, {
            httpOnly: true
        });
        res.cookie("mfa_enabled", true, {
            httpOnly: true,
            sameSite: "lax"
        });
        res.redirect("/");

    } catch {

        res.render("mfa", {
            error: "Invalid OTP"
        });

    }

});


// ================= LOGOUT =================

app.get("/logout", (req, res) => {

    res.clearCookie("token");

    res.redirect("/login");

});


// ================= PROTECTED NOTES PAGE =================

app.get("/", authMiddleware, async (req, res) => {

    try {

        const response = await axios.get(API + "/notes", {
            headers: {
                Authorization: "Bearer " + req.token
            }
        });
        console.log(req.cookies.mfa_enabled);
        res.render("index", {
            notes: response.data,
            mfa_enabled: req.cookies.mfa_enabled === "true"
        });

    } catch {

        res.redirect("/login");

    }

});


app.post("/note", authMiddleware, async function (req, res) {

    try {

        const { note_title, note_content } = req.body;

        await axios.post(
            process.env.API_BASE_URL + "/api/notes/",
            {
                title: note_title,
                content: note_content
            },
            {
                headers: {
                    Authorization: "Bearer " + req.token
                }
            }
        );

        res.json({
            success: true,
            message: "Note created successfully"
        });

    } catch (err) {

        console.log(err.message);

        res.status(500).json({
            success: false,
            message: "Failed to create note"
        });

    }

});

app.put("/note/:id", authMiddleware, async (req, res) => {

    try {

        const noteId = req.params.id;

        const { note_title, note_content } = req.body;

        await axios.put(
            `${process.env.API_BASE_URL}/api/notes/${noteId}`,
            {
                title: note_title,
                content: note_content
            },
            {
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            }
        );

        res.json({
            success: true,
            message: "Note updated successfully"
        });

    } catch (err) {

        console.log("UPDATE ERROR:", err.response?.data || err.message);

        res.status(500).json({
            success: false,
            message: "Update failed"
        });

    }

});

app.delete("/note/remove/:id", authMiddleware, async (req, res) => {

    try {

        const noteId = req.params.id;

        await axios.delete(
            `${process.env.API_BASE_URL}/api/notes/${noteId}`,
            {
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            }
        );

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

});


// ================= REGISTER PAGE =================

app.get("/register", (req, res) => {

    res.render("register");

});


// ================= REGISTER USER =================

app.post("/register", async (req, res) => {

    try {

        const { username, email, password } = req.body;

        await axios.post(`${API}/auth/register`, {
            username,
            email,
            password
        });

        // login immediately after register
        const loginResponse = await axios.post(`${API}/auth/login`, {
            username,
            password
        });

        const userId = loginResponse.data.user_id;

        res.cookie("mfa_user_id", userId, {
            httpOnly: true
        });

        res.redirect("/setup-mfa");

    } catch (err) {

        res.render("register", {
            error: err.response?.data?.msg || "Registration failed"
        });

    }

});


// ================= MFA SETUP PAGE =================

app.get("/setup-mfa", async (req, res) => {

    try {

        const userId = req.cookies.user_id;

        const response = await axios.post(
            `${API}/auth/setup-mfa/${userId}`
        );

        res.render("setup-mfa", {

            qr_code: response.data.qr_code

        });

    } catch {

        res.redirect("/login");

    }

});


// ================= VERIFY MFA AFTER REGISTER =================

app.post("/setup-mfa", async (req, res) => {

    try {

        const otp = req.body.otp;

        const userId = req.cookies.user_id;

        const response = await axios.post(
            `${API}/auth/verify-mfa/${userId}`,
            { otp }
        );

        res.cookie("token", response.data.access_token, {
            httpOnly: true
        });
        res.cookie("mfa_enabled", true, {
            httpOnly: true,
            sameSite: "lax"
        });

        res.clearCookie("mfa_user_id");

        res.redirect("/");

    } catch {

        res.render("setup-mfa", {
            error: "Invalid OTP"
        });

    }

});


app.listen(3000, () => {

    console.log("Frontend running on port 3000");

});
