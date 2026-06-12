const ITEM_TYPES = {
    SEEDS: 'seeds',
    FOOD: 'food',
    WATER: 'water',
    WOOD: 'wood',
    STONE: 'stone',
    GRASS: 'grass',
    EQUIPMENT: 'equipment',
    MEDICINE: 'medicine',
    MATERIALS: 'materials',
    IRON: 'iron',
    LEATHER: 'leather',
    CLOTH: 'cloth',
    GOLD: 'gold'
};

const ITEM_CATEGORIES = {
    ALL: 'all',
    FOOD: 'food',
    MATERIALS: 'materials',
    SEEDS: 'seeds',
    EQUIPMENT: 'equipment',
    CONSUMABLES: 'consumables'
};

const ITEM_DEFINITIONS = {
    [ITEM_TYPES.SEEDS]: {
        name: '种子',
        icon: '🌱',
        category: ITEM_CATEGORIES.SEEDS,
        description: '用于种植作物，可以在农田中播种',
        maxStack: 99,
        backgroundColor: 'rgba(46, 204, 113, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.FOOD]: {
        name: '食物',
        icon: '🍞',
        category: ITEM_CATEGORIES.FOOD,
        description: '恢复饥饿值，维持生存必需',
        maxStack: 99,
        backgroundColor: 'rgba(241, 196, 15, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.WATER]: {
        name: '水',
        icon: '💧',
        category: ITEM_CATEGORIES.FOOD,
        description: '恢复口渴值，保持水分充足',
        maxStack: 99,
        backgroundColor: 'rgba(52, 152, 219, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.WOOD]: {
        name: '木材',
        icon: '🪵',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '基础材料，可用于制作工具和建筑',
        maxStack: 99,
        backgroundColor: 'rgba(139, 69, 19, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.STONE]: {
        name: '石头',
        icon: '🪨',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '坚硬的石头，用于建造和制作',
        maxStack: 99,
        backgroundColor: 'rgba(112, 128, 144, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.GRASS]: {
        name: '杂草',
        icon: '🌿',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '普通杂草，可用于喂养动物或制作',
        maxStack: 99,
        backgroundColor: 'rgba(34, 139, 34, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.EQUIPMENT]: {
        name: '装备',
        icon: '⚔️',
        category: ITEM_CATEGORIES.EQUIPMENT,
        description: '装备物品，提升角色属性',
        maxStack: 1,
        backgroundColor: 'rgba(155, 89, 182, 0.3)',
        isStackable: false
    },
    [ITEM_TYPES.MEDICINE]: {
        name: '药品',
        icon: '🧪',
        category: ITEM_CATEGORIES.CONSUMABLES,
        description: '治疗药品，恢复生命值',
        maxStack: 30,
        backgroundColor: 'rgba(230, 126, 34, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.MATERIALS]: {
        name: '材料',
        icon: '📦',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '各类材料的总称',
        maxStack: 99,
        backgroundColor: 'rgba(149, 165, 166, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.IRON]: {
        name: '铁矿石',
        icon: '⚙️',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '珍贵的金属矿石，用于锻造高级装备',
        maxStack: 50,
        backgroundColor: 'rgba(108, 117, 125, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.LEATHER]: {
        name: '皮革',
        icon: '🧵',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '动物皮革，用于制作护甲',
        maxStack: 30,
        backgroundColor: 'rgba(139, 90, 43, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.CLOTH]: {
        name: '布料',
        icon: '🎭',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '织物材料，用于制作衣物',
        maxStack: 50,
        backgroundColor: 'rgba(186, 156, 189, 0.3)',
        isStackable: true
    },
    [ITEM_TYPES.GOLD]: {
        name: '金币',
        icon: '🪙',
        category: ITEM_CATEGORIES.MATERIALS,
        description: '珍贵的货币，用于交易',
        maxStack: 999,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        isStackable: true
    }
};

const CATEGORY_MAPPING = {
    [ITEM_CATEGORIES.ALL]: Object.values(ITEM_TYPES),
    [ITEM_CATEGORIES.FOOD]: [ITEM_TYPES.FOOD, ITEM_TYPES.WATER],
    [ITEM_CATEGORIES.MATERIALS]: [ITEM_TYPES.WOOD, ITEM_TYPES.STONE, ITEM_TYPES.GRASS, ITEM_TYPES.IRON, ITEM_TYPES.LEATHER, ITEM_TYPES.CLOTH, ITEM_TYPES.GOLD],
    [ITEM_CATEGORIES.SEEDS]: [ITEM_TYPES.SEEDS],
    [ITEM_CATEGORIES.EQUIPMENT]: [ITEM_TYPES.EQUIPMENT],
    [ITEM_CATEGORIES.CONSUMABLES]: [ITEM_TYPES.MEDICINE]
};

class InventoryItems {
    static getItemTypes() {
        return ITEM_TYPES;
    }

    static getItemCategories() {
        return ITEM_CATEGORIES;
    }

    static getItemDefinition(itemType) {
        return ITEM_DEFINITIONS[itemType] || null;
    }

    static getItemName(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.name : itemType;
    }

    static getItemIcon(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.icon : '📦';
    }

    static getItemDescription(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.description : '普通物品';
    }

    static getItemBackgroundColor(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.backgroundColor : 'rgba(255, 255, 255, 0.1)';
    }

    static getMaxStackSize(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.maxStack : 99;
    }

    static isStackable(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.isStackable : true;
    }

    static getCategoryItems(category) {
        return CATEGORY_MAPPING[category] || [];
    }

    static getItemCategory(itemType) {
        const definition = this.getItemDefinition(itemType);
        return definition ? definition.category : ITEM_CATEGORIES.ALL;
    }

    static getAllItemTypes() {
        return Object.values(ITEM_TYPES);
    }

    static getAllCategories() {
        return Object.values(ITEM_CATEGORIES);
    }

    static isValidItemType(itemType) {
        return ITEM_DEFINITIONS.hasOwnProperty(itemType);
    }
}

export { ITEM_TYPES, ITEM_CATEGORIES, ITEM_DEFINITIONS, CATEGORY_MAPPING, InventoryItems };