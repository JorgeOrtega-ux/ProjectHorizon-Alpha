// assets/js/core/api-handler.js

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

export async function postDataWithCsrf(formData) {
    const tokenResponse = await getCsrfToken();
    if (!tokenResponse.ok) {
        console.error('Error al obtener el token CSRF para la acción:', formData.get('action_type'));
        return tokenResponse;
    }
    formData.append('csrf_token', tokenResponse.data.csrf_token);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData });
}

// --- General & Content Requests (main_handler.php) ---
export function getCsrfToken() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_csrf_token`);
}

export function checkSession() {
    const theme = localStorage.getItem('theme') || 'system';
    const language = localStorage.getItem('language') || 'es-419';
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=check_session&theme=${theme}&language=${language}`);
}

export function getFavorites(photoIdsToCheck = []) {
    let url = `${window.BASE_PATH}/api/main_handler.php?request_type=favorites`;
    if (photoIdsToCheck.length > 0) {
        url += `&is_favorite_check=${photoIdsToCheck.join(',')}`;
    }
    return fetchData(url);
}

export function getGalleries(sortBy, searchTerm, page, limit, context = null) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    let url = `${window.BASE_PATH}/api/main_handler.php?request_type=galleries&sort=${sortBy}&search=${encodedSearchTerm}&page=${page}&limit=${limit}`;
    if (context) {
        url += `&context=${context}`;
    }
    return fetchData(url);
}

export function getGalleryDetails(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${uuid}`);
}

export function getGalleryPhotos(uuid, page, limit) {
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${uuid}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getPhotoDetails(photoId) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=photos&photo_id=${photoId}`);
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
    return postDataWithCsrf(formData);
}

export function incrementPhotoInteraction(photoId) {
    const formData = new FormData();
    formData.append('action_type', 'increment_photo_interaction');
    formData.append('photo_id', photoId);
    return postDataWithCsrf(formData);
}

export function toggleFavorite(photoId, isFavorite) {
    const formData = new FormData();
    formData.append('action_type', 'toggle_favorite');
    formData.append('photo_id', photoId);
    formData.append('is_favorite', isFavorite);
    return postDataWithCsrf(formData);
}

export function toggleFollow(galleryUuid, isFollowing) {
    const formData = new FormData();
    formData.append('action_type', 'toggle_follow');
    formData.append('uuid', galleryUuid);
    formData.append('is_following', isFollowing);
    return postDataWithCsrf(formData);
}

export function submitFeedback(formData) {
    return postDataWithCsrf(formData);
}

export function getSectionHTML(view, section) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=section&view=${view}&section=${section}`);
}

export async function getHistory() {
    const response = await fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=history`);
    if (response.ok) {
        return response.data;
    }
    return { profiles: [], photos: [], searches: [] };
}

export function addHistory(type, id, metadata = {}) {
    const formData = new FormData();
    formData.append('action_type', 'add_history');
    formData.append('type', type);
    formData.append('id', id);
    formData.append('metadata', JSON.stringify(metadata));
    return postDataWithCsrf(formData);
}

export function clearHistory() {
    const formData = new FormData();
    formData.append('action_type', 'clear_history');
    return postDataWithCsrf(formData);
}

// --- INICIO DE LA MODIFICACIÓN ---
export function deleteHistoryItems(itemIds) {
    const formData = new FormData();
    formData.append('action_type', 'delete_history_items');
    formData.append('item_ids', JSON.stringify(itemIds));
    return postDataWithCsrf(formData);
}
// --- FIN DE LA MODIFICACIÓN ---

export function getComments(photoId) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=comments&photo_id=${photoId}`);
}

export function addComment(photoId, commentText, parentId = null) {
    const formData = new FormData();
    formData.append('action_type', 'add_comment');
    formData.append('photo_id', photoId);
    formData.append('comment_text', commentText);
    if (parentId) {
        formData.append('parent_id', parentId);
    }
    return postDataWithCsrf(formData);
}

export function likeComment(commentId, voteType) {
    const formData = new FormData();
    formData.append('action_type', 'like_comment');
    formData.append('comment_id', commentId);
    formData.append('vote_type', voteType);
    return postDataWithCsrf(formData);
}

export function reportComment(commentId, reason) {
    const formData = new FormData();
    formData.append('action_type', 'report_comment');
    formData.append('comment_id', commentId);
    formData.append('reason', reason);
    return postDataWithCsrf(formData);
}

export function saveUserPreferences(preferences) {
    const formData = new FormData();
    formData.append('action_type', 'save_user_preferences');
    formData.append('preferences', JSON.stringify(preferences));
    return postDataWithCsrf(formData);
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

export function verifyRegistrationCode(formData) {
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

export function updateUsername(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updateEmail(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export function updateUserProfilePicture(formData) {
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}

export async function deleteUserProfilePicture() {
    const formData = new FormData();
    formData.append('action_type', 'delete_profile_picture');
    const tokenResponse = await getCsrfToken();
    if (!tokenResponse.ok) {
        return tokenResponse;
    }
    formData.append('csrf_token', tokenResponse.data.csrf_token);
    return fetchData(`${window.BASE_PATH}/api/auth_handler.php`, {
        method: 'POST',
        body: formData
    });
}


// --- Admin Requests ---
export function getDashboardStats() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=dashboard_stats`);
}

export function getUsers(searchTerm, page, limit) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=users&search=${encodedSearchTerm}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getAdminComments(searchTerm, filter, page, limit) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=admin_comments&search=${encodedSearchTerm}&filter=${filter}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getAdminFeedback(searchTerm, page, limit) {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${window.BASE_PATH}/api/main_handler.php?request_type=admin_feedback&search=${encodedSearchTerm}&page=${page}&limit=${limit}`;
    return fetchData(url);
}

export function getLogs() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_logs`);
}

export function getLogContent(filename) {
    const encodedFilename = encodeURIComponent(filename);
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_log_content&filename=${encodedFilename}`);
}

export function getBackups() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_backups`);
}

export function createBackup() {
    const formData = new FormData();
    formData.append('action_type', 'create_backup');
    return postDataWithCsrf(formData);
}

export function restoreBackup(filename) {
    const formData = new FormData();
    formData.append('action_type', 'restore_backup');
    formData.append('filename', filename);
    return postDataWithCsrf(formData);
}

export function updateCommentStatus(commentId, status) {
    const formData = new FormData();
    formData.append('action_type', 'update_comment_status');
    formData.append('comment_id', commentId);
    formData.append('status', status);
    return postDataWithCsrf(formData);
}

export function updateReportStatus(commentId, status) {
    const formData = new FormData();
    formData.append('action_type', 'update_report_status');
    formData.append('comment_id', commentId);
    formData.append('status', status);
    return postDataWithCsrf(formData);
}

export function changeUserRole(uuid, role) {
    const formData = new FormData();
    formData.append('action_type', 'change_user_role');
    formData.append('uuid', uuid);
    formData.append('role', role);
    return postDataWithCsrf(formData);
}

export function changeUserStatus(uuid, status) {
    const formData = new FormData();
    formData.append('action_type', 'change_user_status');
    formData.append('uuid', uuid);
    formData.append('status', status);
    return postDataWithCsrf(formData);
}

export function verifyAdminPassword(password) {
    const formData = new FormData();
    formData.append('action_type', 'verify_admin_password');
    formData.append('password', password);
    return postDataWithCsrf(formData);
}

export function changeGalleryPrivacy(uuid, isPrivate) {
    const formData = new FormData();
    formData.append('action_type', 'change_gallery_privacy');
    formData.append('uuid', uuid);
    formData.append('is_private', isPrivate);
    return postDataWithCsrf(formData);
}

export function changeGalleryVisibility(uuid, visibility) {
    const formData = new FormData();
    formData.append('action_type', 'change_gallery_visibility');
    formData.append('uuid', uuid);
    formData.append('visibility', visibility);
    return postDataWithCsrf(formData);
}

export function getGalleryForEdit(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=gallery_for_edit&uuid=${uuid}`);
}

export function updateGalleryDetails(formData) {
    return postDataWithCsrf(formData);
}

export function createGallery(formData) {
    return postDataWithCsrf(formData);
}

export function updateGalleryProfilePicture(formData) {
    return postDataWithCsrf(formData);
}

export function uploadGalleryPhotos(formData) {
    return postDataWithCsrf(formData);
}

export function deleteGalleryPhoto(photoId) {
    const formData = new FormData();
    formData.append('action_type', 'delete_gallery_photo');
    formData.append('photo_id', photoId);
    return postDataWithCsrf(formData);
}

export function updatePhotoOrder(photoOrder) {
    const formData = new FormData();
    formData.append('action_type', 'update_photo_order');
    formData.append('photo_order', JSON.stringify(photoOrder));
    return postDataWithCsrf(formData);
}

export function deleteGallery(uuid) {
    const formData = new FormData();
    formData.append('action_type', 'delete_gallery');
    formData.append('uuid', uuid);
    return postDataWithCsrf(formData);
}

export function getUserProfile(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=user_profile&uuid=${uuid}`);
}

export function addUserSanction(formData) {
    return postDataWithCsrf(formData);
}

export function deleteUserSanction(sanctionId) {
    const formData = new FormData();
    formData.append('action_type', 'delete_user_sanction');
    formData.append('sanction_id', sanctionId);
    return postDataWithCsrf(formData);
}

export function batchUpdateUsers(formData) {
    return postDataWithCsrf(formData);
}

export function getGeneralSettings() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_general_settings`);
}

export function getGalleryStats(uuid) {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=gallery_stats&uuid=${uuid}`);
}

export function updateGalleryStats(uuid, statsData) {
    const formData = new FormData();
    formData.append('action_type', 'update_gallery_stats');
    formData.append('uuid', uuid);
    formData.append('stats_data', JSON.stringify(statsData));
    return postDataWithCsrf(formData);
}

export function truncateDatabase() {
    const formData = new FormData();
    formData.append('action_type', 'truncate_database');
    return postDataWithCsrf(formData);
}

export function checkRecentBackup() {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=check_recent_backup`);
}

export function getProfanityWords(languageCode = 'all') {
    return fetchData(`${window.BASE_PATH}/api/main_handler.php?request_type=get_profanity_words&language_code=${languageCode}`);
}

export function addProfanityWord(word, languageCode) {
    const formData = new FormData();
    formData.append('action_type', 'add_profanity_word');
    formData.append('word', word);
    formData.append('language_code', languageCode);
    return postDataWithCsrf(formData);
}

export function deleteProfanityWord(id) {
    const formData = new FormData();
    formData.append('action_type', 'delete_profanity_word');
    formData.append('id', id);
    return postDataWithCsrf(formData);
}