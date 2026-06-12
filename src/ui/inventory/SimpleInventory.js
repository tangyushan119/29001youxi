import { InventoryItems } from './inventory-items.js';

class SimpleInventory {
    constructor() {
        this.isOpen = false;
        this.overlay = null;
        this.modal = null;
        this.inventoryData = {};
        this.onCloseCallback = null;
        this.onItemUseCallback = null;
        
        this.getItemConfig = (itemType) => {
            return {
                name: InventoryItems.getItemName(itemType),
                icon: InventoryItems.getItemIcon(itemType),
                color: InventoryItems.getItemBackgroundColor(itemType),
                description: InventoryItems.getItemDescription(itemType)
            };
        };
        
        this.itemTypes = InventoryItems.getAllItemTypes();
        
        this.style = {
            modalWidth: 640,
            modalHeight: 520,
            gridCols: 8,
            gridRows: 5,
            cellSize: 64,
            gap: 8,
            padding: 15
        };
    }

    open(inventoryData) {
        if (this.isOpen) {
            this.close();
        }
        
        this.inventoryData = { ...inventoryData };
        this.createOverlay();
        this.renderModal();
        this.renderItems();
        
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
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        `;
        document.body.appendChild(this.overlay);
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    renderModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'inventory-modal';
        this.modal.style.cssText = `
            width: ${this.style.modalWidth}px;
            height: ${this.style.modalHeight}px;
            background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(22, 33, 62, 0.98));
            border: 2px solid #4a69bd;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(74, 105, 189, 0.1);
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease;
        `;
        
        this.modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="font-size: 22px; color: #4a69bd; margin: 0; font-weight: bold;">🎒 背包</h2>
                <button class="inventory-close-btn" style="
                    width: 32px;
                    height: 32px;
                    background: rgba(231, 76, 60, 0.8);
                    color: #fff;
                    border-radius: 50%;
                    font-size: 18px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
            
            <div class="inventory-category-tabs" style="
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
            ">
                <button class="category-tab active" data-category="all" style="
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #4a69bd;
                    color: #fff;
                ">全部</button>
                <button class="category-tab" data-category="food" style="
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(74, 105, 189, 0.2);
                    color: #b8c5d6;
                ">食物</button>
                <button class="category-tab" data-category="materials" style="
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(74, 105, 189, 0.2);
                    color: #b8c5d6;
                ">材料</button>
                <button class="category-tab" data-category="seeds" style="
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(74, 105, 189, 0.2);
                    color: #b8c5d6;
                ">种子</button>
            </div>
            
            <div class="inventory-grid" style="
                display: grid;
                grid-template-columns: repeat(${this.style.gridCols}, ${this.style.cellSize}px);
                grid-template-rows: repeat(${this.style.gridRows}, ${this.style.cellSize}px);
                gap: ${this.style.gap}px;
                padding: ${this.style.padding}px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                flex: 1;
                overflow-y: auto;
            "></div>
            
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(74, 105, 189, 0.3);
                color: #b8c5d6;
                font-size: 13px;
            ">
                <span>已使用: <span class="inventory-used-slots" style="color: #f39c12; font-weight: bold;">0</span> / ${this.style.gridCols * this.style.gridRows}</span>
                <span>点击物品查看详情</span>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        
        this.modal.querySelector('.inventory-close-btn').addEventListener('click', () => this.close());
        
        const tabs = this.modal.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'rgba(74, 105, 189, 0.2)';
                    t.style.color = '#b8c5d6';
                });
                tab.classList.add('active');
                tab.style.background = '#4a69bd';
                tab.style.color = '#fff';
                this.renderItems(tab.dataset.category);
            });
        });
    }

    renderItems(category = 'all') {
        const grid = this.modal.querySelector('.inventory-grid');
        const usedSlotsElement = this.modal.querySelector('.inventory-used-slots');
        
        grid.innerHTML = '';
        
        const items = this.filterItemsByCategory(category);
        const totalSlots = this.style.gridCols * this.style.gridRows;
        
        for (let i = 0; i < totalSlots; i++) {
            const cell = document.createElement('div');
            cell.className = 'inventory-cell';
            cell.dataset.index = i;
            cell.style.cssText = `
                width: ${this.style.cellSize}px;
                height: ${this.style.cellSize}px;
                background: rgba(74, 105, 189, 0.1);
                border: 1px solid rgba(74, 105, 189, 0.3);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            `;
            
            if (i < items.length) {
                const item = items[i];
                const itemConfig = this.getItemConfig(item.type) || { name: item.type, icon: '📦', color: 'rgba(255, 255, 255, 0.1)' };
                
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.dataset.itemType = item.type;
                itemElement.dataset.itemCount = item.count;
                itemElement.style.cssText = `
                    width: 40px;
                    height: 40px;
                    background: ${itemConfig.color};
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                `;
                
                const icon = document.createElement('span');
                icon.textContent = itemConfig.icon;
                icon.style.fontSize = '24px';
                itemElement.appendChild(icon);
                
                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'inventory-item-count';
                    count.textContent = item.count;
                    count.style.cssText = `
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        font-size: 14px;
                        font-weight: bold;
                        color: #fff;
                        background: rgba(0, 0, 0, 0.6);
                        border-radius: 10px;
                        padding: 2px 4px;
                        min-width: 20px;
                        text-align: center;
                    `;
                    itemElement.appendChild(count);
                }
                
                cell.appendChild(itemElement);
                
                cell.addEventListener('click', () => {
                    this.handleItemClick(item.type, item.count);
                });
                
                cell.addEventListener('mouseenter', () => {
                    this.showTooltip(itemElement, item.type, item.count);
                });
                
                cell.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            }
            
            grid.appendChild(cell);
        }
        
        usedSlotsElement.textContent = items.length;
    }

    filterItemsByCategory(category) {
        const items = [];
        
        const categoryMap = {
            all: this.itemTypes,
            food: ['food', 'water', 'medicine'],
            materials: ['wood', 'stone', 'grass', 'iron', 'leather', 'cloth', 'gold', 'equipment'],
            seeds: ['seeds']
        };
        
        const allowedTypes = categoryMap[category] || categoryMap.all;
        
        for (const itemType of allowedTypes) {
            if (this.inventoryData[itemType] && this.inventoryData[itemType] > 0) {
                const count = this.inventoryData[itemType];
                const maxStack = InventoryItems.getMaxStackSize(itemType);
                
                if (count <= maxStack) {
                    items.push({ type: itemType, count });
                } else {
                    let remaining = count;
                    while (remaining > 0) {
                        items.push({ type: itemType, count: Math.min(remaining, maxStack) });
                        remaining -= maxStack;
                    }
                }
            }
        }
        
        return items;
    }

    handleItemClick(itemType, itemCount) {
        if (this.onItemUseCallback) {
            this.onItemUseCallback(itemType, itemCount);
        }
        
        if (this.inventoryData[itemType] && this.inventoryData[itemType] >= 1) {
            this.inventoryData[itemType] -= 1;
            this.renderItems();
        }
    }

    showTooltip(element, itemType, itemCount) {
        const rect = element.getBoundingClientRect();
        const itemConfig = this.getItemConfig(itemType) || { name: itemType, icon: '📦', description: '普通物品' };
        
        let tooltipX = rect.left + 10;
        let tooltipY = rect.top - 10;
        
        const tooltipWidth = 220;
        const tooltipHeight = 80;
        
        if (tooltipX + tooltipWidth > window.innerWidth) {
            tooltipX = rect.left - tooltipWidth - 10;
        }
        if (tooltipY < 0) {
            tooltipY = rect.bottom + 10;
        }
        if (tooltipY + tooltipHeight > window.innerHeight) {
            tooltipY = window.innerHeight - tooltipHeight - 10;
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'inventory-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            left: ${tooltipX}px;
            top: ${tooltipY}px;
            width: ${tooltipWidth}px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #4a69bd;
            border-radius: 8px;
            padding: 12px;
            font-size: 13px;
            color: #ffffff;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #ffffff;">
                <span style="font-size: 20px;">${itemConfig.icon}</span>
                <span style="color: #ffffff;">${itemConfig.name}</span>
            </div>
            <div style="color: #b8c5d6; font-size: 12px; margin-bottom: 4px;">
                数量: <span style="color: #f39c12; font-weight: bold;">${itemCount}</span>
            </div>
            <div style="color: #b8c5d6; font-size: 12px; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                ${itemConfig.description}
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = 1;
        }, 30);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.inventory-tooltip');
        if (tooltip) {
            tooltip.style.opacity = 0;
            setTimeout(() => tooltip.remove(), 200);
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.overlay.style.animation = 'fadeIn 0.2s reverse';
        this.modal.style.animation = 'slideUp 0.3s reverse';
        
        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
            this.isOpen = false;
            document.body.style.overflow = '';
            
            if (this.onCloseCallback) {
                this.onCloseCallback(this.inventoryData);
            }
        }, 300);
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
}

export { SimpleInventory };