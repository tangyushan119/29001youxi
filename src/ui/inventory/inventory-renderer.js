import { InventoryStyle } from './inventory-style.js';

class InventoryRenderer {
    constructor() {
        this.style = InventoryStyle;
    }

    renderModal(container) {
        container.innerHTML = `
            <div class="inventory-modal" style="
                width: ${this.style.modal.width}px;
                height: ${this.style.modal.height}px;
                background-color: ${this.style.modal.backgroundColor};
                border: ${this.style.modal.borderWidth}px solid ${this.style.modal.borderColor};
                border-radius: ${this.style.modal.borderRadius}px;
                padding: ${this.style.modal.padding}px;
                box-shadow: ${this.style.modal.boxShadow};
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                display: flex;
                flex-direction: column;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2 class="inventory-title" style="
                        font-size: ${this.style.title.fontSize}px;
                        color: ${this.style.title.color};
                        text-align: ${this.style.title.textAlign};
                        margin: 0;
                        font-weight: ${this.style.title.fontWeight};
                    ">背包</h2>
                    <button class="inventory-close-btn" style="
                        width: ${this.style.closeBtn.width}px;
                        height: ${this.style.closeBtn.height}px;
                        background-color: ${this.style.closeBtn.backgroundColor};
                        color: ${this.style.closeBtn.color};
                        border-radius: ${this.style.closeBtn.borderRadius};
                        font-size: ${this.style.closeBtn.fontSize}px;
                        border: ${this.style.closeBtn.border};
                        cursor: ${this.style.closeBtn.cursor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                
                <div class="inventory-category-tabs" style="
                    display: flex;
                    gap: ${this.style.categoryTabs.gap}px;
                    margin-bottom: ${this.style.grid.padding}px;
                ">
                    <button class="category-tab active" data-category="all">全部</button>
                    <button class="category-tab" data-category="food">食物</button>
                    <button class="category-tab" data-category="materials">材料</button>
                    <button class="category-tab" data-category="seeds">种子</button>
                </div>
                
                <div class="inventory-grid" style="
                    display: grid;
                    grid-template-columns: repeat(${this.style.grid.columns}, ${this.style.grid.cellSize}px);
                    grid-template-rows: repeat(${this.style.grid.rows}, ${this.style.grid.cellSize}px);
                    gap: ${this.style.grid.gap}px;
                    padding: ${this.style.grid.padding}px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    flex: 1;
                    overflow-y: auto;
                "></div>
                
                <div class="inventory-footer" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid ${this.style.colors.border};
                    color: ${this.style.colors.textSecondary};
                    font-size: 13px;
                ">
                    <span>已使用: <span class="inventory-used-slots">0</span> / ${this.style.grid.columns * this.style.grid.rows}</span>
                    <span class="inventory-hint">点击物品查看详情</span>
                </div>
            </div>
        `;

        this.setupCategoryTabsStyle();
    }

    setupCategoryTabsStyle() {
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.style.height = `${this.style.categoryTabs.height}px`;
            tab.style.borderRadius = `${this.style.categoryTabs.borderRadius}px`;
            tab.style.fontSize = `${this.style.categoryTabs.fontSize}px`;
            tab.style.fontWeight = this.style.categoryTabs.fontWeight;
            tab.style.padding = this.style.categoryTabs.padding;
            tab.style.border = 'none';
            tab.style.cursor = 'pointer';
            tab.style.transition = 'all 0.2s ease';

            if (tab.classList.contains('active')) {
                tab.style.backgroundColor = this.style.categoryTabs.activeBackgroundColor;
                tab.style.color = this.style.categoryTabs.activeColor;
            } else {
                tab.style.backgroundColor = this.style.categoryTabs.inactiveBackgroundColor;
                tab.style.color = this.style.categoryTabs.inactiveColor;
            }
        });
    }

    renderGrid(gridElement, items, selectedIndex = -1) {
        gridElement.innerHTML = '';
        
        const totalSlots = this.style.grid.columns * this.style.grid.rows;
        
        for (let i = 0; i < totalSlots; i++) {
            const cell = document.createElement('div');
            cell.className = 'inventory-cell';
            cell.dataset.index = i;
            
            this.applyCellStyle(cell, i === selectedIndex);
            
            if (i < items.length) {
                const item = items[i];
                cell.appendChild(this.createItemElement(item));
            }
            
            gridElement.appendChild(cell);
        }
    }

    applyCellStyle(cell, isSelected) {
        cell.style.width = `${this.style.cell.width}px`;
        cell.style.height = `${this.style.cell.height}px`;
        cell.style.backgroundColor = this.style.cell.backgroundColor;
        cell.style.border = `${this.style.cell.borderWidth}px solid ${isSelected ? this.style.cell.selectedBorderColor : this.style.cell.borderColor}`;
        cell.style.borderRadius = `${this.style.cell.borderRadius}px`;
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'all 0.2s ease';
        cell.style.position = 'relative';

        if (isSelected) {
            cell.style.borderWidth = `${this.style.cell.selectedBorderWidth}px`;
        }
    }

    createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        
        itemElement.style.width = `${this.style.item.iconSize}px`;
        itemElement.style.height = `${this.style.item.iconSize}px`;
        itemElement.style.borderRadius = `${this.style.item.borderRadius}px`;
        itemElement.style.backgroundColor = this.style.getItemBackgroundColor(item.type);
        itemElement.style.border = `${this.style.item.borderWidth}px solid ${this.style.item.borderColor}`;
        itemElement.style.display = 'flex';
        itemElement.style.flexDirection = 'column';
        itemElement.style.alignItems = 'center';
        itemElement.style.justifyContent = 'center';
        itemElement.style.position = 'relative';

        const icon = document.createElement('span');
        icon.textContent = this.style.getItemIcon(item.type);
        icon.style.fontSize = `${this.style.item.iconSize * 0.6}px`;
        
        itemElement.appendChild(icon);

        if (item.count > 1) {
            const count = document.createElement('span');
            count.className = 'inventory-item-count';
            count.textContent = item.count;
            
            count.style.fontSize = `${this.style.count.fontSize}px`;
            count.style.fontWeight = this.style.count.fontWeight;
            count.style.color = this.style.count.color;
            count.style.backgroundColor = this.style.count.backgroundColor;
            count.style.borderRadius = `${this.style.count.borderRadius}px`;
            count.style.padding = `${this.style.count.padding}px 4px`;
            count.style.minWidth = `${this.style.count.minWidth}px`;
            count.style.textAlign = this.style.count.textAlign;
            count.style.position = 'absolute';
            count.style.bottom = '2px';
            count.style.right = '2px';
            
            itemElement.appendChild(count);
        }

        itemElement.dataset.itemType = item.type;
        itemElement.dataset.itemCount = item.count;
        
        return itemElement;
    }

    renderTooltip(x, y, itemType, itemCount) {
        const tooltipWidth = this.style.tooltip.maxWidth;
        const tooltipHeight = 80;
        
        let tooltipX = x + 10;
        let tooltipY = y - 10;
        
        if (tooltipX + tooltipWidth > window.innerWidth) {
            tooltipX = x - tooltipWidth - 10;
        }
        if (tooltipY < 0) {
            tooltipY = y + 60;
        }
        if (tooltipY + tooltipHeight > window.innerHeight) {
            tooltipY = window.innerHeight - tooltipHeight - 10;
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'inventory-tooltip';
        
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        tooltip.style.width = `${tooltipWidth}px`;
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        tooltip.style.border = `1px solid ${this.style.tooltip.borderColor}`;
        tooltip.style.borderRadius = `${this.style.tooltip.borderRadius}px`;
        tooltip.style.padding = `${this.style.tooltip.padding}px`;
        tooltip.style.fontSize = `${this.style.tooltip.fontSize}px`;
        tooltip.style.color = '#ffffff';
        tooltip.style.boxShadow = this.style.tooltip.boxShadow;
        tooltip.style.zIndex = 1001;
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = 0;
        tooltip.style.transition = 'opacity 0.2s ease';

        const itemName = this.style.getItemName(itemType);
        const itemIcon = this.style.getItemIcon(itemType);
        const itemDesc = this.style.getItemDescription(itemType);
        
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <span style="font-size: 20px;">${itemIcon}</span>
                <span style="color: #ffffff;">${itemName}</span>
            </div>
            <div style="color: ${this.style.colors.textSecondary}; font-size: 12px; margin-bottom: 4px;">
                数量: <span style="color: ${this.style.colors.accent}; font-weight: bold;">${itemCount}</span>
            </div>
            <div style="color: ${this.style.colors.textSecondary}; font-size: 12px; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                ${itemDesc}
            </div>
        `;

        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = 1;
        }, 30);

        return tooltip;
    }

    getItemDescription(itemType) {
        return this.style.getItemDescription(itemType);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.inventory-tooltip');
        if (tooltip) {
            tooltip.style.opacity = 0;
            setTimeout(() => {
                tooltip.remove();
            }, 200);
        }
    }

    updateUsedSlots(count) {
        const usedSlotsElement = document.querySelector('.inventory-used-slots');
        if (usedSlotsElement) {
            usedSlotsElement.textContent = count;
            usedSlotsElement.style.color = this.style.colors.accent;
            usedSlotsElement.style.fontWeight = 'bold';
        }
    }

    updateCategoryTab(category) {
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
                tab.style.backgroundColor = this.style.categoryTabs.activeBackgroundColor;
                tab.style.color = this.style.categoryTabs.activeColor;
            } else {
                tab.classList.remove('active');
                tab.style.backgroundColor = this.style.categoryTabs.inactiveBackgroundColor;
                tab.style.color = this.style.categoryTabs.inactiveColor;
            }
        });
    }
}

export { InventoryRenderer };