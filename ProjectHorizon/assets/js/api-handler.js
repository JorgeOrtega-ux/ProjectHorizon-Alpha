// assets/js/api-handler.js

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
                data = await response.json();
            } catch (e) {
                data = null;
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return {
                ok: false,
                data: data, 
                status: response.status
            };
        }

        return {
            ok: true,
            data: data, 
            status: response.status
        };

    } catch (error) {
        console.error('Error de Red o de Fetch API:', error);
        return {
            ok: false,
            data: { message: "Error de conexión. Por favor, revisa tu red e inténtalo de nuevo." },
            status: 0 
        };
    }
}

// --- General & Content Requests (main_handler.php) ---
export function getCsrfToken() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_csrf_token`);
}

export function checkSession() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=check_session`);
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
    const fetchPhotos = searchTerm === '' ? fetchData(photosUrl) : Promise.resolve({ ok: true, data: [] });

    return Promise.all([fetchUsers, fetchPhotos]).then(([usersResponse, photosResponse]) => {
        if (!usersResponse.ok || !photosResponse.ok) {
            throw new Error("Failed to fetch trends data.");
        }
        return [usersResponse.data, photosResponse.data];
    });
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


// --- Authentication Requests (auth_handler.php) ---
export function loginUser(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function registerUser(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function forgotPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function verifyResetCode(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function resetPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function logoutUser() {
    const formData = new FormData();
    formData.append('action_type', 'logout_user');
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function verifyPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updateUserPassword(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function deleteAccount(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}
// --- Admin Requests ---
export function getUsers(searchTerm, page, limit) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=users&search=${encodedSearchTerm}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function changeUserRole(uuid, role) {
    const formData = new FormData();
    formData.append('action_type', 'change_user_role');
    formData.append('uuid', uuid);
    formData.append('role', role);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function changeUserStatus(uuid, status) {
    const formData = new FormData();
    formData.append('action_type', 'change_user_status');
    formData.append('uuid', uuid);
    formData.append('status', status);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function verifyAdminPassword(password) {
    const formData = new FormData();
    formData.append('action_type', 'verify_admin_password');
    formData.append('password', password);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function changeGalleryPrivacy(uuid, isPrivate) {
    const formData = new FormData();
    formData.append('action_type', 'change_gallery_privacy');
    formData.append('uuid', uuid);
    formData.append('is_private', isPrivate);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function getGalleryForEdit(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=gallery_for_edit&uuid=${uuid}`);
}

export function updateGalleryDetails(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updateProfilePicture(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function uploadGalleryPhotos(formData) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function deleteGalleryPhoto(photoId) {
    const formData = new FormData();
    formData.append('action_type', 'delete_gallery_photo');
    formData.append('photo_id', photoId);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updatePhotoOrder(photoOrder) {
    const formData = new FormData();
    formData.append('action_type', 'update_photo_order');
    formData.append('photo_order', JSON.stringify(photoOrder));
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, {
        method: 'POST',
        body: formData
    });
}