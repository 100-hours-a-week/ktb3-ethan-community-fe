export function isLoggedIn() {
    return (
        localStorage.getItem("access_token") &&
        localStorage.getItem("user_id")
    );
}

export function logOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("nickname");
    localStorage.removeItem("profile_image_url");
}