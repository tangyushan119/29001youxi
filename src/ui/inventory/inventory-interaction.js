import { InventoryStyle } from './inventory-style.js';
import { ITEM_CATEGORIES } from './inventory-items.js';

class InventoryInteraction {
    constructor(renderer, stacking) {
        this.renderer = renderer;
        this.stacking = stacking;
        this.style = InventoryStyle;
        this.selectedCell = null;
        this.selectedItem = null;
        this.onCloseCallback = null;
        this.onItemUseCallback = null;
        this.currentCategory = ITEM_CATEGORIES.ALL;
    }

    setupEventListeners(modalElement, items, gridElement) {
        const closeBtn = modalElement.querySelector('.inventory-close-btn');
        closeBtn.addEventListener('click', () => this.closeModal());

        const overlay = modalElement.parentElement;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        const categoryTabs = modalElement.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentCategory = tab.dataset.category;
                this.renderer.updateCategoryTab(this.currentCategory);
                this.onCategoryChange?.(this.currentCategory);
            });
        });

        gridElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.inventory-cell');
            if (!cell) return;

            const itemElement = cell.querySelector('.inventory-item');
            
            if (itemElement) {
                this.handleItemClick(cell, itemElement);
            } else {
                this.handleEmptyCellClick(cell);
            }
        });

        gridElement.addEventListener('mouseenter', (e) => {
            const itemElement = e.target.closest('.inventory-item');
            if (itemElement) {
                this.handleItemHover(itemElement, e);
            }
        });

        gridElement.addEventListener('mouseleave', () => {
            this.renderer.hideTooltip();
        });

        this.setupTabHoverEffects(categoryTabs);
        this.setupCellHoverEffects(gridElement);
    }

    setupTabHoverEffects(tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('mouseenter', () => {
                if (!tab.classList.contains('active')) {
                    tab.style.backgroundColor = this.style.colors.primary;
                    tab.style.color = this.style.colors.text;
                }
            });

            tab.addEventListener('mouseleave', () => {
                if (!tab.classList.contains('active')) {
                    tab.style.backgroundColor = this.style.categoryTabs.inactiveBackgroundColor;
                    tab.style.color = this.style.categoryTabs.inactiveColor;
                }
            });
        });
    }

    setupCellHoverEffects(gridElement) {
        gridElement.addEventListener('mouseenter', (e) => {
            const cell = e.target.closest('.inventory-cell');
            if (cell && !cell.classList.contains('selected')) {
                cell.style.borderColor = this.style.cell.hoverBorderColor;
                cell.style.transform = 'scale(1.05)';
            }
        });

        gridElement.addEventListener('mouseleave', (e) => {
            const cell = e.target.closest('.inventory-cell');
            if (cell) {
                cell.style.borderColor = cell.classList.contains('selected') 
                    ? this.style.cell.selectedBorderColor 
                    : this.style.cell.borderColor;
                cell.style.transform = 'scale(1)';
            }
        });
    }

    handleItemClick(cell, itemElement) {
        const itemType = itemElement.dataset.itemType;
        const itemCount = parseInt(itemElement.dataset.itemCount);

        if (this.selectedCell === cell) {
            this.useItem(itemType, itemCount);
            return;
        }

        this.clearSelection();

        this.selectedCell = cell;
        this.selectedItem = { type: itemType, count: itemCount, cellIndex: parseInt(cell.dataset.index) };
        
        cell.classList.add('selected');
        cell.style.borderColor = this.style.cell.selectedBorderColor;
        cell.style.borderWidth = `${this.style.cell.selectedBorderWidth}px`;
    }

    handleEmptyCellClick(cell) {
        if (this.selectedItem) {
            this.moveItemToCell(cell);
        } else {
            this.clearSelection();
        }
    }

    useItem(itemType, itemCount) {
        if (this.onItemUseCallback) {
            this.onItemUseCallback(itemType, itemCount);
        }
        
        this.clearSelection();
    }

    moveItemToCell(targetCell) {
        const targetIndex = parseInt(targetCell.dataset.index);
        
        if (this.onItemMoveCallback) {
            this.onItemMoveCallback(this.selectedItem.cellIndex, targetIndex);
        }
        
        this.clearSelection();
    }

    handleItemHover(itemElement, e) {
        const itemType = itemElement.dataset.itemType;
        const itemCount = parseInt(itemElement.dataset.itemCount);
        
        const rect = itemElement.getBoundingClientRect();
        this.renderer.renderTooltip(rect.left, rect.top, itemType, itemCount);
    }

    clearSelection() {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            this.selectedCell.style.borderColor = this.style.cell.borderColor;
            this.selectedCell.style.borderWidth = `${this.style.cell.borderWidth}px`;
        }
        
        this.selectedCell = null;
        this.selectedItem = null;
        this.renderer.hideTooltip();
    }

    closeModal() {
        this.clearSelection();
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    setOnCloseCallback(callback) {
        this.onCloseCallback = callback;
    }

    setOnItemUseCallback(callback) {
        this.onItemUseCallback = callback;
    }

    setOnItemMoveCallback(callback) {
        this.onItemMoveCallback = callback;
    }

    setOnCategoryChangeCallback(callback) {
        this.onCategoryChange = callback;
    }

    getSelectedItem() {
        return this.selectedItem;
    }

    getCurrentCategory() {
        return this.currentCategory;
    }
}

export { InventoryInteraction };