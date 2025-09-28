// assets/js/api-handler.js

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // ¡CAMBIO CLAVE! Lanzamos el objeto de respuesta completo en caso de error.
            throw response;
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            return response.text();
        }
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

export function getCsrfToken() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_csrf_token`);
}

export function checkSession() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=check_session`);
}

export function loginUser(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function registerUser(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function logoutUser() {
    const formData = new FormData();
    formData.append('action_type', 'logout_user');
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function verifyPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updateUserPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function deleteAccount(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function getGalleries(sortBy, searchTerm, page, limit) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=galleries&sort=${sortBy}&search=${encodedSearchTerm}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getGalleryDetails(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${uuid}`);
}

export function getGalleryPhotos(uuid, page, limit) {
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${uuid}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getTrends(searchTerm) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const usersUrl = `${window.BASE_PATH}/api/main_handler.php?request_type=trending_users&search=${encodedSearchTerm}&limit=8`;
    const photosUrl = `${window.BASE_PATH}/api/main_handler.php?request_type=trending_photos&limit=12`;

    const fetchUsers = fetchData(usersUrl);
    const fetchPhotos = searchTerm === '' ? fetchData(photosUrl) : Promise.resolve([]);

    return Promise.all([fetchUsers, fetchPhotos]);
}

export function incrementGalleryInteraction(uuid) {
    const formData = new FormData();
    formData.append('action_type', 'increment_interaction');
    formData.append('uuid', uuid);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData });
}

export function incrementPhotoInteraction(photoId) {
    const formData = new FormData();
    formData.append('action_type', 'increment_photo_interaction');
    formData.append('photo_id', photoId);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData });
}

export function toggleFavoriteOnServer(photoId, galleryUuid, isLiked) {
    const formData = new FormData();
    formData.append('action_type', 'toggle_like');
    formData.append('photo_id', photoId);
    formData.append('gallery_uuid', galleryUuid);
    formData.append('is_liked', isLiked);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData });
}

export function submitFeedback(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function getSectionHTML(view, section) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=section&view=${view}&section=${section}`);
}