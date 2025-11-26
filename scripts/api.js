import { logOut } from './auth.js'

const CSRF_METHOD_LIST = ["POST", "PATCH", "DELETE"];
const CSRF_PATH_LIST = ["/csrf", "/auth/signup", "/auth/login"];

async function ensureCsrfCookie() {
    let token = getCookie("XSRF-TOKEN");
    if (token) return token;

    await fetch("http://localhost:8080/csrf", {
        method: "POST",
        credentials: "include",
    });

    return getCookie("XSRF-TOKEN");
}


function getCookie(name) {
    const value = document.cookie.split("; ").find(row => row.startsWith(name + "="));
    return value ? decodeURIComponent(value.split("=")[1]) : null;
}

async function __reAuth() {
    const headers = {
        "Content-Type": "application/json"
    };
    const csrfToken = getCookie("XSRF-TOKEN");
    if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
    }

    const res = await fetch("http://localhost:8080/auth/refresh", {
        method: "POST",
        headers,
        credentials: "include",
    });
    
    const json = await res.json();
    localStorage.setItem("access_token", json.data.access_token);
}

export async function __fetch(_path, _method, _body, _contentType = "application/json") {
    
    const needsCsrfMethod = CSRF_METHOD_LIST.includes(_method);
    const isCsrfPath = CSRF_PATH_LIST.includes(_path);
    const needsCsrf = needsCsrfMethod && !isCsrfPath;

    
    const accessToken = localStorage.getItem("access_token");
    const headers = {
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
    };
    if (needsCsrf) {
        const csrfToken = await ensureCsrfCookie();
        if (csrfToken) {
            headers["X-XSRF-TOKEN"] = csrfToken;
        }
    }

    let body;
    if (_body instanceof FormData) {
        body = _body;
    } else if (_body !== undefined && _body !== null) {
        headers["Content-Type"] = _contentType;
        body = typeof _body === "string" ? _body : JSON.stringify(_body);
    }


    const res = await fetch("http://localhost:8080" + _path, {
        method: _method,
        headers: headers,
        credentials: "include",
        body,
    });

    if (!res.ok) {
        const json = await res.json();
        /* 
            message 말고는 동일한 401 오류를 분류할 방법이 없다!
            별도의 상태 코드를 도입해보자.
        */ 
        console.log(json.code);
        if (json.code === "AUTH004") {
            window.location.replace("/index.html");
            logOut();
        }
        if (json.code !== "AUTH000" && json.code !== "AUTH003") {
            await __reAuth();
        } 
    } else {
        if (_path === "/auth/signup" || _path === "/auth/login") {
            const json = await res.json();
            localStorage.setItem("nickname", json.data.nickname);
            localStorage.setItem("access_token", json.data.access_token);
            localStorage.setItem("profile_image_url", json.data.profile_image_url);
        }
    }
    
    return res;
}

export async function __getFetch(_path, _body) {
    return await __fetch(_path, "GET");
}

export async function __postFetch(_path, _body) {
    return await __fetch(_path, "POST", _body);
}

export async function __patchFetch(_path, _body) {
    return await __fetch(_path, "PATCH", _body);
}

export async function __deleteFetch(_path, _body) {
    return await __fetch(_path, "DELETE", _body);
}

export async function __uploadFile(_path, file, fieldName = "image") {
    const fd = new FormData();
    fd.append(fieldName, file);
    
    return __fetch(_path, "POST", fd);
}
