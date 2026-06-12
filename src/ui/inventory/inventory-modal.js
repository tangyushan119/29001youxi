import { InventoryRenderer } from './inventory-renderer.js';
import { InventoryInteraction } from './inventory-interaction.js';
import { InventoryStacking } from './inventory-stacking.js';
import { InventoryStyle } from './inventory-style.js';

class InventoryModal {
    constructor() {
        this.renderer = new InventoryRenderer();
        this.stacking = new InventoryStacking();
        this.interaction = new InventoryInteraction(this.renderer, this.stacking);
        this.style = InventoryStyle;
        
        this.overlay = null;
        this.modal = null;
        this.gridElement = null;
        this.isOpen = false;
        
        this.inventoryData = {};
        this.filteredItems = [];
        this.currentCategory = 'all';
        
        this.onCloseCallback = null;
        this.onItemUseCallback = null;
    }

    open(inventoryData) {
        if (this.isOpen) {
            this.close();
        }
        
        this.inventoryData = { ...inventoryData };
        
        this.createOverlay();
        this.renderer.renderModal(this.modal);
        
        this.gridElement = this.modal.querySelector('.inventory-grid');
        
        this.setupCallbacks();
        this.renderInventory();
        
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'inventory-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
            animation: fadeIn 0.2s ease;
        `;
        
        this.modal = document.createElement('div');
        this.modal.style.animation = 'slideUp 0.3s ease';
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    setupCallbacks() {
        this.interaction.setOnCloseCallback(() => this.close());
        
        this.interaction.setOnItemUseCallback((itemType, itemCount) => {
            this.useItem(itemType, itemCount);
        });
        
        this.interaction.setOnCategoryChangeCallback((category) => {
            this.currentCategory = category;
            this.renderInventory();
        });
        
        this.interaction.setOnItemMoveCallback((fromIndex, toIndex) => {
            this.moveItem(fromIndex, toIndex);
        });
        
        this.interaction.setupEventListeners(this.modal, this.filteredItems, this.gridElement);
    }

    renderInventory() {
        const stackedItems = this.stacking.stackItems(this.inventoryData);
        this.filteredItems = this.filterByCategory(stackedItems);
        
        const usedSlots = this.filteredItems.length;
        this.renderer.updateUsedSlots(usedSlots);
        this.renderer.renderGrid(this.gridElement, this.filteredItems);
    }

    filterByCategory(items) {
        if (this.currentCategory === 'all') {
            return items;
        }
        
        const categoryMap = {
            food: ['food', 'water'],
            materials: ['wood', 'stone', 'grass'],
            seeds: ['seeds']
        };
        
        const allowedTypes = categoryMap[this.currentCategory] || [];
        return items.filter(item => allowedTypes.includes(item.type));
    }

    useItem(itemType, itemCount) {
        if (this.onItemUseCallback) {
            this.onItemUseCallback(itemType, itemCount);
        }
        
        if (this.inventoryData[itemType] && this.inventoryData[itemType] >= 1) {
            this.inventoryData[itemType] -= 1;
            this.renderInventory();
        }
    }

    moveItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        const item = this.filteredItems.splice(fromIndex, 1)[0];
        this.filteredItems.splice(toIndex, 0, item);
        
        this.syncInventoryData();
        this.renderInventory();
    }

    syncInventoryData() {
        const newInventory = {};
        
        for (const item of this.filteredItems) {
            if (!newInventory[item.type]) {
                newInventory[item.type] = 0;
            }
            newInventory[item.type] += item.count;
        }
        
        this.inventoryData = newInventory;
    }

    close() {
        if (!this.isOpen) return;
        
        this.interaction.clearSelection();
        
        this.overlay.style.animation = 'fadeIn 0.2s ease reverse';
        this.modal.style.animation = 'slideUp 0.3s ease reverse';
        
        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
            this.gridElement = null;
            this.isOpen = false;
            document.body.style.overflow = '';
            
            if (this.onCloseCallback) {
                this.onCloseCallback(this.inventoryData);
            }
        }, 300);
    }

    updateInventory(newInventory) {
        this.inventoryData = { ...newInventory };
        if (this.isOpen) {
            this.renderInventory();
        }
    }

    setOnCloseCallback(callback) {
        this.onCloseCallback = callback;
    }

    setOnItemUseCallback(callback) {
        this.onItemUseCallback = callback;
    }

    isModalOpen() {
        return this.isOpen;
    }

    getInventoryData() {
        return { ...this.inventoryData };
    }
}

export { InventoryModal };