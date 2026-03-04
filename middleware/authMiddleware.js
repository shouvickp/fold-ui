module.exports = function (req, res, next) {

    const token = req.cookies.token;

    if (!token) {

        return res.redirect("/login");

    }

    req.token = token;

    next();

};
