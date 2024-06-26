function navigate(state, newPath, search) {
    try {
        window.history.pushState({}, '', newPath + (search || ''));
        return { path: newPath, search: search };
    } catch (err) {
        return {};
    }
}

export default function (state = {}, action) {
    switch (action.type) {
        case 'NAVIGATE':
            state = navigate(state, action.newPath, action.search);
            break;
        case 'SET_CONTEXT_MENU':
            state = Object.assign({}, state, {
                context: action.menu
            });
            break;
        case 'SET_URL':
            history.replaceState({}, '', action.path);
            break;
    }

    return state;
}
