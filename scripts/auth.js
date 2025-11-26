export function isLoggedIn() {
    return (
        localStorage.getItem("access_token")
    );
}

export function logOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("nickname");
    localStorage.removeItem("profile_image_url");
}