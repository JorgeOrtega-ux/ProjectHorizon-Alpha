// assets/js/api-handler.js

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);

        // Intentamos obtener el cuerpo de la respuesta, que puede ser JSON o texto.
        // Nuestro servidor envía un cuerpo JSON incluso en respuestas de error.
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
                data = await response.json();
            } catch (e) {
                // El cuerpo puede estar vacío en algunas respuestas, lo cual es válido.
                data = null;
            }
        } else {
            data = await response.text();
        }

        // ¡ESTE ES EL CAMBIO CLAVE!
        // En lugar de lanzar un error, devolvemos un objeto estructurado
        // que el código que llama a esta función puede inspeccionar de forma segura.
        if (!response.ok) {
            return {
                ok: false,
                data: data, // El cuerpo del error, ya procesado (parseado).
                status: response.status
            };
        }

        // Si la respuesta es exitosa (ej. status 200), devolvemos la misma estructura.
        return {
            ok: true,
            data: data, // El cuerpo del éxito, ya procesado.
            status: response.status
        };

    } catch (error) {
        // Este bloque `catch` ahora solo se activará para errores de red reales
        // (ej. el servidor está caído, no hay conexión a internet), no para códigos HTTP como 401 o 500.
        console.error('Error de Red o de Fetch API:', error);
        return {
            ok: false,
            // Proporcionamos un mensaje de error genérico y estandarizado.
            data: { message: "Error de conexión. Por favor, revisa tu red e inténtalo de nuevo." },
            status: 0 // Usamos 0 para indicar un error de red, no de HTTP.
        };
    }
}

// =================================================================
// EL RESTO DE LAS FUNCIONES NO NECESITAN CAMBIOS
// =================================================================
// Todas las funciones exportadas usan `fetchData`, por lo que el nuevo
// comportamiento se propaga automáticamente a través de ellas.

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

export function forgotPassword(formData) {
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
    const fetchPhotos = searchTerm === '' ? fetchData(photosUrl) : Promise.resolve({ ok: true, data: [] });

    // Adaptamos Promise.all para que funcione con el nuevo formato de respuesta
    return Promise.all([fetchUsers, fetchPhotos]).then(([usersResponse, photosResponse]) => {
        if (!usersResponse.ok || !photosResponse.ok) {
            // Si alguna de las peticiones falló, lanzamos un error para que sea capturado por el .catch en el controlador
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