const InventoryStyle = {
    modal: {
        width: 640,
        height: 520,
        backgroundColor: 'rgba(26, 26, 46, 0.97)',
        borderColor: '#4a69bd',
        borderWidth: 2,
        borderRadius: 15,
        padding: 20,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(74, 105, 189, 0.1)'
    },

    title: {
        fontSize: 22,
        color: '#4a69bd',
        textAlign: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomColor: 'rgba(74, 105, 189, 0.3)',
        borderBottomWidth: 1,
        fontWeight: 'bold'
    },

    grid: {
        columns: 8,
        rows: 5,
        cellSize: 64,
        gap: 8,
        padding: 15
    },

    cell: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(74, 105, 189, 0.1)',
        borderColor: 'rgba(74, 105, 189, 0.3)',
        borderWidth: 1,
        borderRadius: 8,
        hoverBorderColor: '#4a69bd',
        selectedBorderColor: '#f39c12',
        selectedBorderWidth: 2
    },

    item: {
        iconSize: 40,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1
    },

    count: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
        padding: 2,
        minWidth: 20,
        textAlign: 'center'
    },

    tooltip: {
        maxWidth: 220,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#4a69bd',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        color: '#fff',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
    },

    closeBtn: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        hoverBackgroundColor: '#e74c3c',
        color: '#fff',
        borderRadius: '50%',
        fontSize: 18,
        border: 'none',
        cursor: 'pointer'
    },

    categoryTabs: {
        height: 36,
        gap: 8,
        activeBackgroundColor: '#4a69bd',
        inactiveBackgroundColor: 'rgba(74, 105, 189, 0.2)',
        activeColor: '#fff',
        inactiveColor: '#b8c5d6',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 'bold',
        padding: '0 16px'
    },

    colors: {
        primary: '#4a69bd',
        secondary: '#3a5a9d',
        accent: '#f39c12',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
        background: '#1a1a2e',
        surface: '#16213e',
        text: '#fff',
        textSecondary: '#b8c5d6',
        border: 'rgba(74, 105, 189, 0.3)'
    },

    getItemBackgroundColor(itemType) {
        const colors = {
            seeds: 'rgba(46, 204, 113, 0.3)',
            food: 'rgba(241, 196, 15, 0.3)',
            water: 'rgba(52, 152, 219, 0.3)',
            wood: 'rgba(139, 69, 19, 0.3)',
            stone: 'rgba(112, 128, 144, 0.3)',
            grass: 'rgba(34, 139, 34, 0.3)',
            equipment: 'rgba(155, 89, 182, 0.3)',
            medicine: 'rgba(230, 126, 34, 0.3)',
            materials: 'rgba(149, 165, 166, 0.3)'
        };
        return colors[itemType] || 'rgba(255, 255, 255, 0.1)';
    },

    getItemIcon(itemType) {
        const icons = {
            seeds: '🌱',
            food: '🍞',
            water: '💧',
            wood: '🪵',
            stone: '🪨',
            grass: '🌿',
            equipment: '⚔️',
            medicine: '🧪',
            materials: '📦'
        };
        return icons[itemType] || '📦';
    },

    getItemName(itemType) {
        const names = {
            seeds: '种子',
            food: '食物',
            water: '水',
            wood: '木材',
            stone: '石头',
            grass: '杂草',
            equipment: '装备',
            medicine: '药品',
            materials: '材料'
        };
        return names[itemType] || itemType;
    }
};

export { InventoryStyle };